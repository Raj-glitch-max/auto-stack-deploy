"""
Budget Alert Service
Monitor budgets and send alerts when thresholds are exceeded
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from ..models import BudgetAlert, CostSnapshot, Project, User

logger = logging.getLogger(__name__)


class BudgetAlertService:
    """Service for managing budget alerts"""
    
    async def create_budget_alert(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        budget_limit: float,
        budget_period: str = 'monthly',
        alert_threshold: float = 0.80,
        auto_scale_down: bool = False,
        auto_pause: bool = False,
        notification_channels: Optional[Dict] = None
    ) -> Optional[BudgetAlert]:
        """Create a new budget alert"""
        try:
            alert = BudgetAlert(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                budget_limit=budget_limit,
                budget_period=budget_period,
                alert_threshold=alert_threshold,
                current_spend=0.0,
                is_exceeded=False,
                auto_scale_down=auto_scale_down,
                auto_pause=auto_pause,
                notification_channels=notification_channels or {
                    'email': True,
                    'slack': False,
                    'webhook': False
                },
                is_active=True
            )
            
            session.add(alert)
            await session.commit()
            await session.refresh(alert)
            
            logger.info(f"Created budget alert for project {project_id}: ${budget_limit} {budget_period}")
            return alert
            
        except Exception as e:
            logger.error(f"Error creating budget alert: {e}")
            await session.rollback()
            return None
    
    async def update_budget_spend(
        self,
        session: AsyncSession,
        project_id: str
    ) -> Optional[BudgetAlert]:
        """Update current spend for a budget alert"""
        try:
            # Get active budget alert
            query = select(BudgetAlert).where(
                and_(
                    BudgetAlert.project_id == project_id,
                    BudgetAlert.is_active == True
                )
            )
            
            result = await session.execute(query)
            alert = result.scalar_one_or_none()
            
            if not alert:
                return None
            
            # Calculate current spend based on period
            now = datetime.utcnow()
            
            if alert.budget_period == 'daily':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif alert.budget_period == 'weekly':
                start_date = now - timedelta(days=7)
            elif alert.budget_period == 'monthly':
                start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            else:
                start_date = now - timedelta(days=30)
            
            # Get cost snapshots for period
            cost_query = select(CostSnapshot).where(
                and_(
                    CostSnapshot.project_id == project_id,
                    CostSnapshot.timestamp >= start_date
                )
            )
            
            cost_result = await session.execute(cost_query)
            snapshots = list(cost_result.scalars().all())
            
            # Calculate total spend
            current_spend = sum(s.total_cost for s in snapshots)
            
            # Update alert
            alert.current_spend = current_spend
            alert.is_exceeded = current_spend >= alert.budget_limit
            alert.updated_at = datetime.utcnow()
            
            await session.commit()
            await session.refresh(alert)
            
            # Check if alert threshold is reached
            if current_spend >= (alert.budget_limit * alert.alert_threshold):
                await self._send_alert_notification(session, alert)
            
            return alert
            
        except Exception as e:
            logger.error(f"Error updating budget spend: {e}")
            return None
    
    async def _send_alert_notification(
        self,
        session: AsyncSession,
        alert: BudgetAlert
    ) -> bool:
        """Send alert notification to user"""
        try:
            # Check if we've already sent an alert recently (within 1 hour)
            if alert.last_alert_sent:
                time_since_last = datetime.utcnow() - alert.last_alert_sent
                if time_since_last < timedelta(hours=1):
                    return False
            
            # Get project and user info
            project_query = select(Project).where(Project.id == alert.project_id)
            project_result = await session.execute(project_query)
            project = project_result.scalar_one_or_none()
            
            user_query = select(User).where(User.id == alert.user_id)
            user_result = await session.execute(user_query)
            user = user_result.scalar_one_or_none()
            
            if not project or not user:
                return False
            
            # Calculate percentage used
            percentage_used = (alert.current_spend / alert.budget_limit) * 100
            
            # Prepare notification message
            message = {
                'type': 'budget_alert',
                'severity': 'critical' if alert.is_exceeded else 'warning',
                'project_name': project.name,
                'budget_limit': alert.budget_limit,
                'current_spend': alert.current_spend,
                'percentage_used': percentage_used,
                'budget_period': alert.budget_period,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Send notifications based on channels
            channels = alert.notification_channels or {}
            
            if channels.get('email'):
                await self._send_email_notification(user.email, message)
            
            if channels.get('slack') and channels.get('slack_webhook'):
                await self._send_slack_notification(channels['slack_webhook'], message)
            
            if channels.get('webhook') and channels.get('webhook_url'):
                await self._send_webhook_notification(channels['webhook_url'], message)
            
            # Update last alert sent time
            alert.last_alert_sent = datetime.utcnow()
            await session.commit()
            
            logger.info(f"Sent budget alert for project {alert.project_id}: {percentage_used:.1f}% used")
            return True
            
        except Exception as e:
            logger.error(f"Error sending alert notification: {e}")
            return False
    
    async def _send_email_notification(self, email: str, message: Dict) -> bool:
        """Send email notification (placeholder)"""
        # TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        logger.info(f"Would send email to {email}: Budget at {message['percentage_used']:.1f}%")
        return True
    
    async def _send_slack_notification(self, webhook_url: str, message: Dict) -> bool:
        """Send Slack notification (placeholder)"""
        # TODO: Integrate with Slack webhook
        logger.info(f"Would send Slack notification: Budget at {message['percentage_used']:.1f}%")
        return True
    
    async def _send_webhook_notification(self, webhook_url: str, message: Dict) -> bool:
        """Send webhook notification (placeholder)"""
        # TODO: Send HTTP POST to webhook URL
        logger.info(f"Would send webhook to {webhook_url}: Budget at {message['percentage_used']:.1f}%")
        return True
    
    async def check_auto_actions(
        self,
        session: AsyncSession,
        alert: BudgetAlert
    ) -> bool:
        """Execute auto-actions if budget is exceeded"""
        try:
            if not alert.is_exceeded:
                return False
            
            project_query = select(Project).where(Project.id == alert.project_id)
            project_result = await session.execute(project_query)
            project = project_result.scalar_one_or_none()
            
            if not project:
                return False
            
            actions_taken = []
            
            # Auto scale down
            if alert.auto_scale_down:
                # Reduce replicas to minimum
                if project.min_replicas > 1:
                    project.min_replicas = 1
                    actions_taken.append('scaled_down_to_min')
            
            # Auto pause (not implemented yet - would require deployment engine integration)
            if alert.auto_pause:
                # TODO: Pause deployments
                actions_taken.append('pause_requested')
            
            if actions_taken:
                await session.commit()
                logger.info(f"Executed auto-actions for project {alert.project_id}: {actions_taken}")
            
            return len(actions_taken) > 0
            
        except Exception as e:
            logger.error(f"Error executing auto-actions: {e}")
            return False
    
    async def get_budget_status(
        self,
        session: AsyncSession,
        project_id: str
    ) -> Optional[Dict]:
        """Get current budget status for a project"""
        try:
            query = select(BudgetAlert).where(
                and_(
                    BudgetAlert.project_id == project_id,
                    BudgetAlert.is_active == True
                )
            )
            
            result = await session.execute(query)
            alert = result.scalar_one_or_none()
            
            if not alert:
                return None
            
            # Update spend before returning status
            await self.update_budget_spend(session, project_id)
            
            # Refresh alert
            await session.refresh(alert)
            
            percentage_used = (alert.current_spend / alert.budget_limit) * 100 if alert.budget_limit > 0 else 0
            remaining = max(0, alert.budget_limit - alert.current_spend)
            
            return {
                'budget_limit': alert.budget_limit,
                'current_spend': alert.current_spend,
                'remaining': remaining,
                'percentage_used': percentage_used,
                'is_exceeded': alert.is_exceeded,
                'alert_threshold': alert.alert_threshold,
                'budget_period': alert.budget_period,
                'status': 'exceeded' if alert.is_exceeded else 'warning' if percentage_used >= (alert.alert_threshold * 100) else 'ok'
            }
            
        except Exception as e:
            logger.error(f"Error getting budget status: {e}")
            return None
    
    async def list_budget_alerts(
        self,
        session: AsyncSession,
        user_id: str
    ) -> List[BudgetAlert]:
        """List all budget alerts for a user"""
        try:
            query = select(BudgetAlert).where(
                BudgetAlert.user_id == user_id
            ).order_by(desc(BudgetAlert.created_at))
            
            result = await session.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error listing budget alerts: {e}")
            return []


# Global instance
budget_service = BudgetAlertService()
