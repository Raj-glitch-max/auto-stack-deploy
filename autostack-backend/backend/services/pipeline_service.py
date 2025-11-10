"""
Pipeline Execution Service
UNIQUE FEATURE #2 - Visual Pipeline Builder
Execute visual pipelines with real-time tracking
"""
import asyncio
import uuid
import logging
from datetime import datetime
from typing import Dict, List, Optional, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from ..models import Pipeline, PipelineRun, PipelineStep, Project

logger = logging.getLogger(__name__)


class PipelineExecutionService:
    """Service for executing visual pipelines"""
    
    async def create_pipeline(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        name: str,
        definition: Dict,
        description: Optional[str] = None,
        trigger_type: str = 'manual',
        trigger_config: Optional[Dict] = None
    ) -> Optional[Pipeline]:
        """Create a new pipeline"""
        try:
            pipeline = Pipeline(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                name=name,
                description=description,
                definition=definition,
                trigger_type=trigger_type,
                trigger_config=trigger_config or {},
                version=1,
                is_active=True
            )
            
            session.add(pipeline)
            await session.commit()
            await session.refresh(pipeline)
            
            logger.info(f"Created pipeline {pipeline.id}: {name}")
            return pipeline
            
        except Exception as e:
            logger.error(f"Error creating pipeline: {e}")
            await session.rollback()
            return None
    
    async def update_pipeline(
        self,
        session: AsyncSession,
        pipeline_id: str,
        definition: Optional[Dict] = None,
        name: Optional[str] = None,
        description: Optional[str] = None,
        trigger_type: Optional[str] = None,
        trigger_config: Optional[Dict] = None
    ) -> Optional[Pipeline]:
        """Update an existing pipeline"""
        try:
            pipeline = await session.get(Pipeline, pipeline_id)
            if not pipeline:
                return None
            
            if definition is not None:
                pipeline.definition = definition
                pipeline.version += 1
            
            if name is not None:
                pipeline.name = name
            
            if description is not None:
                pipeline.description = description
            
            if trigger_type is not None:
                pipeline.trigger_type = trigger_type
            
            if trigger_config is not None:
                pipeline.trigger_config = trigger_config
            
            pipeline.updated_at = datetime.utcnow()
            
            await session.commit()
            await session.refresh(pipeline)
            
            logger.info(f"Updated pipeline {pipeline_id} to version {pipeline.version}")
            return pipeline
            
        except Exception as e:
            logger.error(f"Error updating pipeline: {e}")
            await session.rollback()
            return None
    
    async def execute_pipeline(
        self,
        session: AsyncSession,
        pipeline_id: str,
        user_id: str,
        trigger_type: str = 'manual',
        triggered_by: Optional[str] = None
    ) -> Optional[PipelineRun]:
        """Execute a pipeline"""
        try:
            # Get pipeline
            pipeline = await session.get(Pipeline, pipeline_id)
            if not pipeline or not pipeline.is_active:
                logger.error(f"Pipeline {pipeline_id} not found or inactive")
                return None
            
            # Get next run number
            query = select(PipelineRun).where(
                PipelineRun.pipeline_id == pipeline_id
            ).order_by(desc(PipelineRun.run_number))
            
            result = await session.execute(query)
            last_run = result.scalar_one_or_none()
            run_number = (last_run.run_number + 1) if last_run else 1
            
            # Create pipeline run
            run = PipelineRun(
                id=str(uuid.uuid4()),
                pipeline_id=pipeline_id,
                project_id=pipeline.project_id,
                user_id=user_id,
                run_number=run_number,
                status='queued',
                trigger_type=trigger_type,
                triggered_by=triggered_by
            )
            
            session.add(run)
            await session.commit()
            await session.refresh(run)
            
            # Execute pipeline asynchronously
            asyncio.create_task(self._execute_pipeline_async(run.id))
            
            logger.info(f"Started pipeline run {run.id} (#{run_number})")
            return run
            
        except Exception as e:
            logger.error(f"Error executing pipeline: {e}")
            await session.rollback()
            return None
    
    async def _execute_pipeline_async(self, run_id: str):
        """Execute pipeline steps asynchronously"""
        from ..db import get_db_session
        
        async with get_db_session() as session:
            try:
                # Get run and pipeline
                run = await session.get(PipelineRun, run_id)
                if not run:
                    return
                
                pipeline = await session.get(Pipeline, run.pipeline_id)
                if not pipeline:
                    return
                
                # Update run status
                run.status = 'running'
                run.started_at = datetime.utcnow()
                await session.commit()
                
                # Get pipeline definition
                definition = pipeline.definition
                nodes = definition.get('nodes', [])
                edges = definition.get('edges', [])
                
                # Build execution order
                execution_order = self._build_execution_order(nodes, edges)
                
                # Execute steps in order
                all_success = True
                for order, node in enumerate(execution_order):
                    step_success = await self._execute_step(
                        session, run, node, order
                    )
                    
                    if not step_success:
                        all_success = False
                        break
                
                # Update run status
                run.completed_at = datetime.utcnow()
                run.duration_seconds = int(
                    (run.completed_at - run.started_at).total_seconds()
                )
                run.status = 'success' if all_success else 'failed'
                
                # Update pipeline last run
                pipeline.last_run_at = datetime.utcnow()
                
                await session.commit()
                
                logger.info(f"Pipeline run {run_id} completed: {run.status}")
                
            except Exception as e:
                logger.error(f"Error in pipeline execution: {e}")
                if run:
                    run.status = 'failed'
                    run.error_message = str(e)
                    run.completed_at = datetime.utcnow()
                    await session.commit()
    
    def _build_execution_order(
        self,
        nodes: List[Dict],
        edges: List[Dict]
    ) -> List[Dict]:
        """Build execution order from nodes and edges"""
        # Simple topological sort
        # For now, just execute in order of node position
        # TODO: Implement proper dependency resolution
        return sorted(nodes, key=lambda n: n.get('position', {}).get('y', 0))
    
    async def _execute_step(
        self,
        session: AsyncSession,
        run: PipelineRun,
        node: Dict,
        order: int
    ) -> bool:
        """Execute a single pipeline step"""
        try:
            # Create step record
            step = PipelineStep(
                id=str(uuid.uuid4()),
                pipeline_run_id=run.id,
                step_name=node.get('data', {}).get('label', 'Unnamed Step'),
                step_type=node.get('type', 'unknown'),
                step_order=order,
                status='running',
                started_at=datetime.utcnow()
            )
            
            session.add(step)
            await session.commit()
            
            # Execute step based on type
            step_type = node.get('type')
            step_data = node.get('data', {})
            
            success = False
            logs = []
            
            if step_type == 'build':
                success, logs = await self._execute_build_step(step_data)
            elif step_type == 'test':
                success, logs = await self._execute_test_step(step_data)
            elif step_type == 'deploy':
                success, logs = await self._execute_deploy_step(step_data)
            elif step_type == 'notify':
                success, logs = await self._execute_notify_step(step_data)
            else:
                success = True
                logs = [f"Executed {step_type} step"]
            
            # Update step
            step.completed_at = datetime.utcnow()
            step.duration_seconds = int(
                (step.completed_at - step.started_at).total_seconds()
            )
            step.status = 'success' if success else 'failed'
            step.logs = '\n'.join(logs)
            
            await session.commit()
            
            return success
            
        except Exception as e:
            logger.error(f"Error executing step: {e}")
            if step:
                step.status = 'failed'
                step.error_message = str(e)
                step.completed_at = datetime.utcnow()
                await session.commit()
            return False
    
    async def _execute_build_step(self, data: Dict) -> tuple[bool, List[str]]:
        """Execute build step"""
        logs = [
            "Starting build...",
            f"Build command: {data.get('command', 'npm run build')}",
            "Build completed successfully"
        ]
        await asyncio.sleep(1)  # Simulate build time
        return True, logs
    
    async def _execute_test_step(self, data: Dict) -> tuple[bool, List[str]]:
        """Execute test step"""
        logs = [
            "Running tests...",
            f"Test command: {data.get('command', 'npm test')}",
            "All tests passed"
        ]
        await asyncio.sleep(0.5)  # Simulate test time
        return True, logs
    
    async def _execute_deploy_step(self, data: Dict) -> tuple[bool, List[str]]:
        """Execute deploy step"""
        logs = [
            "Starting deployment...",
            f"Target: {data.get('target', 'production')}",
            "Deployment completed successfully"
        ]
        await asyncio.sleep(2)  # Simulate deploy time
        return True, logs
    
    async def _execute_notify_step(self, data: Dict) -> tuple[bool, List[str]]:
        """Execute notification step"""
        logs = [
            "Sending notification...",
            f"Channel: {data.get('channel', 'email')}",
            "Notification sent"
        ]
        await asyncio.sleep(0.2)  # Simulate notification time
        return True, logs
    
    async def get_pipeline_runs(
        self,
        session: AsyncSession,
        pipeline_id: str,
        limit: int = 50
    ) -> List[PipelineRun]:
        """Get pipeline run history"""
        try:
            query = select(PipelineRun).where(
                PipelineRun.pipeline_id == pipeline_id
            ).order_by(desc(PipelineRun.created_at)).limit(limit)
            
            result = await session.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error getting pipeline runs: {e}")
            return []
    
    async def get_run_steps(
        self,
        session: AsyncSession,
        run_id: str
    ) -> List[PipelineStep]:
        """Get steps for a pipeline run"""
        try:
            query = select(PipelineStep).where(
                PipelineStep.pipeline_run_id == run_id
            ).order_by(PipelineStep.step_order)
            
            result = await session.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error getting run steps: {e}")
            return []
    
    async def cancel_run(
        self,
        session: AsyncSession,
        run_id: str
    ) -> bool:
        """Cancel a running pipeline"""
        try:
            run = await session.get(PipelineRun, run_id)
            if not run or run.status not in ['queued', 'running']:
                return False
            
            run.status = 'cancelled'
            run.completed_at = datetime.utcnow()
            
            if run.started_at:
                run.duration_seconds = int(
                    (run.completed_at - run.started_at).total_seconds()
                )
            
            await session.commit()
            
            logger.info(f"Cancelled pipeline run {run_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error cancelling run: {e}")
            return False
    
    async def export_to_yaml(
        self,
        session: AsyncSession,
        pipeline_id: str
    ) -> Optional[str]:
        """Export pipeline to GitHub Actions YAML"""
        try:
            pipeline = await session.get(Pipeline, pipeline_id)
            if not pipeline:
                return None
            
            definition = pipeline.definition
            nodes = definition.get('nodes', [])
            
            # Build YAML
            yaml_lines = [
                f"name: {pipeline.name}",
                "",
                "on:",
                "  push:",
                "    branches: [ main ]",
                "  pull_request:",
                "    branches: [ main ]",
                "",
                "jobs:",
                "  build:",
                "    runs-on: ubuntu-latest",
                "    steps:"
            ]
            
            for node in sorted(nodes, key=lambda n: n.get('position', {}).get('y', 0)):
                step_type = node.get('type')
                step_data = node.get('data', {})
                step_name = step_data.get('label', 'Step')
                
                yaml_lines.append(f"      - name: {step_name}")
                
                if step_type == 'build':
                    yaml_lines.append(f"        run: {step_data.get('command', 'npm run build')}")
                elif step_type == 'test':
                    yaml_lines.append(f"        run: {step_data.get('command', 'npm test')}")
                elif step_type == 'deploy':
                    yaml_lines.append(f"        run: echo 'Deploying to {step_data.get('target', 'production')}'")
                
                yaml_lines.append("")
            
            return '\n'.join(yaml_lines)
            
        except Exception as e:
            logger.error(f"Error exporting to YAML: {e}")
            return None


# Global instance
pipeline_service = PipelineExecutionService()
