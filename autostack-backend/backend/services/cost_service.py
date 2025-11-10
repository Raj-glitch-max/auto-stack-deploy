"""
Cost Aggregation Service
Real-time cost tracking from AWS, Azure, and GCP
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import uuid
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

try:
    import boto3
    from botocore.exceptions import ClientError, NoCredentialsError
except ImportError:
    boto3 = None

from ..models import (
    CostSnapshot, Project, User, CloudCredential,
    CostAnomaly, CostRecommendation
)

logger = logging.getLogger(__name__)


class CostAggregationService:
    """Service for aggregating costs from cloud providers"""
    
    def __init__(self):
        self.aws_client = None
        self.azure_client = None
        self.gcp_client = None
    
    async def initialize_aws_client(self, credentials: Dict) -> bool:
        """Initialize AWS Cost Explorer client"""
        try:
            if not boto3:
                logger.error("boto3 not installed. Install with: pip install boto3")
                return False
            
            self.aws_client = boto3.client(
                'ce',  # Cost Explorer
                aws_access_key_id=credentials.get('access_key_id'),
                aws_secret_access_key=credentials.get('secret_access_key'),
                region_name=credentials.get('region', 'us-east-1')
            )
            
            # Test connection
            response = self.aws_client.get_cost_and_usage(
                TimePeriod={
                    'Start': (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
                    'End': datetime.now().strftime('%Y-%m-%d')
                },
                Granularity='DAILY',
                Metrics=['UnblendedCost']
            )
            
            logger.info("AWS Cost Explorer client initialized successfully")
            return True
            
        except NoCredentialsError:
            logger.error("AWS credentials not found")
            return False
        except ClientError as e:
            logger.error(f"AWS client error: {e}")
            return False
        except Exception as e:
            logger.error(f"Error initializing AWS client: {e}")
            return False
    
    async def fetch_aws_costs(
        self,
        start_date: datetime,
        end_date: datetime,
        granularity: str = 'HOURLY'
    ) -> Dict:
        """Fetch costs from AWS Cost Explorer"""
        try:
            if not self.aws_client:
                logger.error("AWS client not initialized")
                return {}
            
            # Get cost and usage
            response = self.aws_client.get_cost_and_usage(
                TimePeriod={
                    'Start': start_date.strftime('%Y-%m-%d'),
                    'End': end_date.strftime('%Y-%m-%d')
                },
                Granularity=granularity,
                Metrics=['UnblendedCost', 'UsageQuantity'],
                GroupBy=[
                    {'Type': 'DIMENSION', 'Key': 'SERVICE'},
                ]
            )
            
            # Parse response
            costs = {
                'total_cost': 0.0,
                'compute_cost': 0.0,
                'storage_cost': 0.0,
                'bandwidth_cost': 0.0,
                'database_cost': 0.0,
                'other_cost': 0.0,
                'breakdown': {}
            }
            
            for result in response.get('ResultsByTime', []):
                for group in result.get('Groups', []):
                    service = group['Keys'][0]
                    amount = float(group['Metrics']['UnblendedCost']['Amount'])
                    
                    costs['breakdown'][service] = amount
                    costs['total_cost'] += amount
                    
                    # Categorize costs
                    if 'EC2' in service or 'ECS' in service or 'EKS' in service or 'Lambda' in service:
                        costs['compute_cost'] += amount
                    elif 'S3' in service or 'EBS' in service or 'EFS' in service:
                        costs['storage_cost'] += amount
                    elif 'CloudFront' in service or 'DataTransfer' in service:
                        costs['bandwidth_cost'] += amount
                    elif 'RDS' in service or 'DynamoDB' in service or 'ElastiCache' in service:
                        costs['database_cost'] += amount
                    else:
                        costs['other_cost'] += amount
            
            return costs
            
        except ClientError as e:
            logger.error(f"AWS Cost Explorer error: {e}")
            return {}
        except Exception as e:
            logger.error(f"Error fetching AWS costs: {e}")
            return {}
    
    async def create_cost_snapshot(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str,
        costs: Dict,
        cloud_provider: str = 'aws',
        region: Optional[str] = None
    ) -> Optional[CostSnapshot]:
        """Create a cost snapshot in the database"""
        try:
            snapshot = CostSnapshot(
                id=str(uuid.uuid4()),
                project_id=project_id,
                user_id=user_id,
                timestamp=datetime.utcnow(),
                total_cost=costs.get('total_cost', 0.0),
                compute_cost=costs.get('compute_cost', 0.0),
                storage_cost=costs.get('storage_cost', 0.0),
                bandwidth_cost=costs.get('bandwidth_cost', 0.0),
                database_cost=costs.get('database_cost', 0.0),
                other_cost=costs.get('other_cost', 0.0),
                cloud_provider=cloud_provider,
                region=region,
                breakdown=costs.get('breakdown', {})
            )
            
            session.add(snapshot)
            await session.commit()
            await session.refresh(snapshot)
            
            logger.info(f"Created cost snapshot for project {project_id}: ${snapshot.total_cost}")
            return snapshot
            
        except Exception as e:
            logger.error(f"Error creating cost snapshot: {e}")
            await session.rollback()
            return None
    
    async def get_project_costs(
        self,
        session: AsyncSession,
        project_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> List[CostSnapshot]:
        """Get cost snapshots for a project"""
        try:
            query = select(CostSnapshot).where(CostSnapshot.project_id == project_id)
            
            if start_date:
                query = query.where(CostSnapshot.timestamp >= start_date)
            if end_date:
                query = query.where(CostSnapshot.timestamp <= end_date)
            
            query = query.order_by(desc(CostSnapshot.timestamp))
            
            result = await session.execute(query)
            return list(result.scalars().all())
            
        except Exception as e:
            logger.error(f"Error fetching project costs: {e}")
            return []
    
    async def calculate_cost_summary(
        self,
        session: AsyncSession,
        project_id: str,
        period: str = 'today'
    ) -> Dict:
        """Calculate cost summary for different periods"""
        try:
            now = datetime.utcnow()
            
            if period == 'today':
                start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
            elif period == 'week':
                start_date = now - timedelta(days=7)
            elif period == 'month':
                start_date = now - timedelta(days=30)
            else:
                start_date = now - timedelta(days=1)
            
            snapshots = await self.get_project_costs(session, project_id, start_date, now)
            
            if not snapshots:
                return {
                    'total_cost': 0.0,
                    'average_cost': 0.0,
                    'min_cost': 0.0,
                    'max_cost': 0.0,
                    'trend': 'stable'
                }
            
            costs = [s.total_cost for s in snapshots]
            total_cost = sum(costs)
            average_cost = total_cost / len(costs) if costs else 0.0
            
            # Calculate trend
            if len(costs) >= 2:
                recent_avg = sum(costs[:len(costs)//2]) / (len(costs)//2)
                older_avg = sum(costs[len(costs)//2:]) / (len(costs) - len(costs)//2)
                
                if recent_avg > older_avg * 1.1:
                    trend = 'increasing'
                elif recent_avg < older_avg * 0.9:
                    trend = 'decreasing'
                else:
                    trend = 'stable'
            else:
                trend = 'stable'
            
            return {
                'total_cost': total_cost,
                'average_cost': average_cost,
                'min_cost': min(costs) if costs else 0.0,
                'max_cost': max(costs) if costs else 0.0,
                'trend': trend,
                'data_points': len(snapshots)
            }
            
        except Exception as e:
            logger.error(f"Error calculating cost summary: {e}")
            return {}
    
    async def detect_cost_anomalies(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str
    ) -> List[CostAnomaly]:
        """Detect unusual cost spikes"""
        try:
            # Get last 30 days of costs
            start_date = datetime.utcnow() - timedelta(days=30)
            snapshots = await self.get_project_costs(session, project_id, start_date)
            
            if len(snapshots) < 10:
                return []  # Not enough data
            
            costs = [s.total_cost for s in snapshots]
            avg_cost = sum(costs) / len(costs)
            std_dev = (sum((x - avg_cost) ** 2 for x in costs) / len(costs)) ** 0.5
            
            anomalies = []
            
            # Check recent snapshots for anomalies
            for snapshot in snapshots[:5]:  # Last 5 snapshots
                if snapshot.total_cost > avg_cost + (2 * std_dev):
                    # This is an anomaly!
                    percentage_increase = ((snapshot.total_cost - avg_cost) / avg_cost) * 100
                    
                    # Determine severity
                    if percentage_increase > 100:
                        severity = 'critical'
                    elif percentage_increase > 50:
                        severity = 'high'
                    elif percentage_increase > 25:
                        severity = 'medium'
                    else:
                        severity = 'low'
                    
                    anomaly = CostAnomaly(
                        id=str(uuid.uuid4()),
                        project_id=project_id,
                        user_id=user_id,
                        anomaly_type='cost_spike',
                        severity=severity,
                        description=f"Unusual cost spike detected: ${snapshot.total_cost:.2f} vs expected ${avg_cost:.2f}",
                        expected_cost=avg_cost,
                        actual_cost=snapshot.total_cost,
                        cost_difference=snapshot.total_cost - avg_cost,
                        percentage_increase=percentage_increase,
                        detected_at=datetime.utcnow(),
                        detection_method='statistical_threshold',
                        status='open'
                    )
                    
                    session.add(anomaly)
                    anomalies.append(anomaly)
            
            if anomalies:
                await session.commit()
                logger.info(f"Detected {len(anomalies)} cost anomalies for project {project_id}")
            
            return anomalies
            
        except Exception as e:
            logger.error(f"Error detecting anomalies: {e}")
            return []
    
    async def generate_cost_recommendations(
        self,
        session: AsyncSession,
        project_id: str,
        user_id: str
    ) -> List[CostRecommendation]:
        """Generate cost optimization recommendations"""
        try:
            # Get recent costs
            start_date = datetime.utcnow() - timedelta(days=7)
            snapshots = await self.get_project_costs(session, project_id, start_date)
            
            if not snapshots:
                return []
            
            recommendations = []
            
            # Analyze cost breakdown
            latest_snapshot = snapshots[0]
            breakdown = latest_snapshot.breakdown or {}
            
            # Recommendation 1: High compute costs
            if latest_snapshot.compute_cost > latest_snapshot.total_cost * 0.5:
                monthly_savings = latest_snapshot.compute_cost * 0.3 * 30  # 30% savings
                
                rec = CostRecommendation(
                    id=str(uuid.uuid4()),
                    project_id=project_id,
                    user_id=user_id,
                    recommendation_type='right_sizing',
                    title='Optimize Compute Resources',
                    description='Your compute costs are high. Consider right-sizing instances or using spot instances.',
                    impact='high',
                    estimated_monthly_savings=monthly_savings,
                    estimated_yearly_savings=monthly_savings * 12,
                    savings_percentage=30.0,
                    implementation_effort='easy',
                    implementation_steps={
                        'steps': [
                            'Analyze current instance utilization',
                            'Identify over-provisioned instances',
                            'Switch to smaller instance types',
                            'Consider spot instances for non-critical workloads'
                        ]
                    },
                    can_auto_apply=False,
                    status='pending',
                    confidence_score=0.85
                )
                
                session.add(rec)
                recommendations.append(rec)
            
            # Recommendation 2: High storage costs
            if latest_snapshot.storage_cost > latest_snapshot.total_cost * 0.3:
                monthly_savings = latest_snapshot.storage_cost * 0.4 * 30  # 40% savings
                
                rec = CostRecommendation(
                    id=str(uuid.uuid4()),
                    project_id=project_id,
                    user_id=user_id,
                    recommendation_type='storage_optimization',
                    title='Optimize Storage Usage',
                    description='High storage costs detected. Consider lifecycle policies and data archival.',
                    impact='medium',
                    estimated_monthly_savings=monthly_savings,
                    estimated_yearly_savings=monthly_savings * 12,
                    savings_percentage=40.0,
                    implementation_effort='medium',
                    implementation_steps={
                        'steps': [
                            'Identify old or unused data',
                            'Set up S3 lifecycle policies',
                            'Move infrequent data to cheaper storage tiers',
                            'Delete unnecessary snapshots'
                        ]
                    },
                    can_auto_apply=True,
                    status='pending',
                    confidence_score=0.90
                )
                
                session.add(rec)
                recommendations.append(rec)
            
            if recommendations:
                await session.commit()
                logger.info(f"Generated {len(recommendations)} recommendations for project {project_id}")
            
            return recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []


# Global instance
cost_service = CostAggregationService()
