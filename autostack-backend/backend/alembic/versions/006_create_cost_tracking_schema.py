"""create cost tracking schema

Revision ID: 006
Revises: 005
Create Date: 2025-11-10 19:25:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '006'
down_revision = '005'
branch_labels = None
depends_on = None


def upgrade():
    # Cost Snapshots - Real-time cost tracking
    op.create_table(
        'cost_snapshots',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        
        # Cost breakdown
        sa.Column('total_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        sa.Column('compute_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        sa.Column('storage_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        sa.Column('bandwidth_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        sa.Column('database_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        sa.Column('other_cost', sa.Numeric(10, 4), nullable=False, default=0.0),
        
        # Cloud provider info
        sa.Column('cloud_provider', sa.String(50), nullable=False),  # aws, azure, gcp
        sa.Column('region', sa.String(100), nullable=True),
        
        # Detailed breakdown (JSON)
        sa.Column('breakdown', JSONB, nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    # Indexes for fast queries
    op.create_index('idx_cost_snapshots_project_timestamp', 'cost_snapshots', ['project_id', 'timestamp'])
    op.create_index('idx_cost_snapshots_user_timestamp', 'cost_snapshots', ['user_id', 'timestamp'])
    op.create_index('idx_cost_snapshots_cloud', 'cost_snapshots', ['cloud_provider'])
    
    
    # Cost Predictions - AI-powered cost forecasting
    op.create_table(
        'cost_predictions',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Predictions
        sa.Column('predicted_daily_cost', sa.Numeric(10, 4), nullable=False),
        sa.Column('predicted_monthly_cost', sa.Numeric(10, 4), nullable=False),
        sa.Column('predicted_yearly_cost', sa.Numeric(10, 4), nullable=False),
        
        # Confidence and model info
        sa.Column('confidence_score', sa.Numeric(3, 2), nullable=False),  # 0.00 to 1.00
        sa.Column('model_version', sa.String(50), nullable=False),
        sa.Column('prediction_date', sa.DateTime(timezone=True), nullable=False),
        
        # Historical data used
        sa.Column('days_of_data_used', sa.Integer, nullable=False),
        sa.Column('prediction_metadata', JSONB, nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_cost_predictions_project', 'cost_predictions', ['project_id'])
    op.create_index('idx_cost_predictions_date', 'cost_predictions', ['prediction_date'])
    
    
    # Budget Alerts - User-defined budget limits
    op.create_table(
        'budget_alerts',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Budget settings
        sa.Column('budget_limit', sa.Numeric(10, 2), nullable=False),
        sa.Column('budget_period', sa.String(20), nullable=False, default='monthly'),  # daily, weekly, monthly
        sa.Column('alert_threshold', sa.Numeric(3, 2), nullable=False, default=0.80),  # Alert at 80% of budget
        
        # Current status
        sa.Column('current_spend', sa.Numeric(10, 2), nullable=False, default=0.0),
        sa.Column('is_exceeded', sa.Boolean, nullable=False, default=False),
        sa.Column('last_alert_sent', sa.DateTime(timezone=True), nullable=True),
        
        # Actions
        sa.Column('auto_scale_down', sa.Boolean, nullable=False, default=False),
        sa.Column('auto_pause', sa.Boolean, nullable=False, default=False),
        sa.Column('notification_channels', JSONB, nullable=True),  # email, slack, webhook
        
        # Status
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_budget_alerts_project', 'budget_alerts', ['project_id'])
    op.create_index('idx_budget_alerts_active', 'budget_alerts', ['is_active'])
    
    
    # Cost Recommendations - AI-generated optimization suggestions
    op.create_table(
        'cost_recommendations',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Recommendation details
        sa.Column('recommendation_type', sa.String(100), nullable=False),  # right_size, spot_instances, reserved, etc.
        sa.Column('title', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=False),
        sa.Column('impact', sa.String(20), nullable=False),  # high, medium, low
        
        # Cost savings
        sa.Column('estimated_monthly_savings', sa.Numeric(10, 2), nullable=False),
        sa.Column('estimated_yearly_savings', sa.Numeric(10, 2), nullable=False),
        sa.Column('savings_percentage', sa.Numeric(5, 2), nullable=False),
        
        # Implementation
        sa.Column('implementation_effort', sa.String(20), nullable=False),  # easy, medium, hard
        sa.Column('implementation_steps', JSONB, nullable=True),
        sa.Column('can_auto_apply', sa.Boolean, nullable=False, default=False),
        
        # Status
        sa.Column('status', sa.String(50), nullable=False, default='pending'),  # pending, applied, dismissed
        sa.Column('applied_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('dismissed_at', sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column('confidence_score', sa.Numeric(3, 2), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_cost_recommendations_project', 'cost_recommendations', ['project_id'])
    op.create_index('idx_cost_recommendations_status', 'cost_recommendations', ['status'])
    op.create_index('idx_cost_recommendations_impact', 'cost_recommendations', ['impact'])
    
    
    # Cost Anomalies - Unusual cost spikes detection
    op.create_table(
        'cost_anomalies',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Anomaly details
        sa.Column('anomaly_type', sa.String(100), nullable=False),  # spike, unusual_pattern, new_resource
        sa.Column('severity', sa.String(20), nullable=False),  # critical, high, medium, low
        sa.Column('description', sa.Text, nullable=False),
        
        # Cost impact
        sa.Column('expected_cost', sa.Numeric(10, 4), nullable=False),
        sa.Column('actual_cost', sa.Numeric(10, 4), nullable=False),
        sa.Column('cost_difference', sa.Numeric(10, 4), nullable=False),
        sa.Column('percentage_increase', sa.Numeric(5, 2), nullable=False),
        
        # Detection
        sa.Column('detected_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('detection_method', sa.String(100), nullable=False),  # ml_model, threshold, pattern
        
        # Resolution
        sa.Column('status', sa.String(50), nullable=False, default='open'),  # open, investigating, resolved
        sa.Column('root_cause', sa.Text, nullable=True),
        sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
        
        # Metadata
        sa.Column('metadata', JSONB, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_cost_anomalies_project', 'cost_anomalies', ['project_id'])
    op.create_index('idx_cost_anomalies_severity', 'cost_anomalies', ['severity'])
    op.create_index('idx_cost_anomalies_status', 'cost_anomalies', ['status'])
    
    
    # Cloud Provider Credentials - Secure storage for API access
    op.create_table(
        'cloud_credentials',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Provider info
        sa.Column('cloud_provider', sa.String(50), nullable=False),  # aws, azure, gcp
        sa.Column('credential_name', sa.String(255), nullable=False),
        
        # Encrypted credentials
        sa.Column('encrypted_credentials', sa.Text, nullable=False),  # Encrypted JSON
        sa.Column('encryption_key_id', sa.String(255), nullable=False),
        
        # Permissions
        sa.Column('has_cost_access', sa.Boolean, nullable=False, default=False),
        sa.Column('has_deployment_access', sa.Boolean, nullable=False, default=False),
        sa.Column('permissions', JSONB, nullable=True),
        
        # Status
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('last_validated', sa.DateTime(timezone=True), nullable=True),
        sa.Column('validation_status', sa.String(50), nullable=True),
        
        # Timestamps
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_cloud_credentials_user', 'cloud_credentials', ['user_id'])
    op.create_index('idx_cloud_credentials_provider', 'cloud_credentials', ['cloud_provider'])


def downgrade():
    op.drop_table('cloud_credentials')
    op.drop_table('cost_anomalies')
    op.drop_table('cost_recommendations')
    op.drop_table('budget_alerts')
    op.drop_table('cost_predictions')
    op.drop_table('cost_snapshots')
