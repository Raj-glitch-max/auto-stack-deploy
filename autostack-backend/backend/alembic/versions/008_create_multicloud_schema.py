"""create multicloud schema

Revision ID: 008
Revises: 007
Create Date: 2025-11-10 20:36:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '008'
down_revision = '007'
branch_labels = None
depends_on = None


def upgrade():
    # Cloud Providers - Multi-cloud deployment configurations
    op.create_table(
        'cloud_providers',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=True),
        
        # Provider info
        sa.Column('provider_name', sa.String(50), nullable=False),  # aws, azure, gcp
        sa.Column('provider_region', sa.String(100), nullable=False),
        sa.Column('display_name', sa.String(255), nullable=True),
        
        # Credentials (encrypted)
        sa.Column('credentials', JSONB, nullable=False),
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('is_default', sa.Boolean, nullable=False, default=False),
        
        # Cost tracking
        sa.Column('monthly_cost', sa.Numeric(10, 2), nullable=True),
        sa.Column('last_cost_sync', sa.DateTime, nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_cloud_providers_user', 'cloud_providers', ['user_id'])
    op.create_index('idx_cloud_providers_project', 'cloud_providers', ['project_id'])
    op.create_index('idx_cloud_providers_active', 'cloud_providers', ['is_active'])
    
    
    # Multi-Cloud Deployments - Track deployments across clouds
    op.create_table(
        'multicloud_deployments',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('cloud_provider_id', sa.String(), sa.ForeignKey('cloud_providers.id', ondelete='CASCADE'), nullable=False),
        
        # Deployment info
        sa.Column('deployment_name', sa.String(255), nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('deployment_url', sa.String(500), nullable=True),
        
        # Configuration
        sa.Column('config', JSONB, nullable=False),
        sa.Column('environment', sa.String(50), nullable=False, default='production'),
        
        # Cost
        sa.Column('estimated_cost', sa.Numeric(10, 4), nullable=True),
        sa.Column('actual_cost', sa.Numeric(10, 4), nullable=True),
        
        # Timestamps
        sa.Column('deployed_at', sa.DateTime, nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_multicloud_deployments_project', 'multicloud_deployments', ['project_id'])
    op.create_index('idx_multicloud_deployments_provider', 'multicloud_deployments', ['cloud_provider_id'])
    op.create_index('idx_multicloud_deployments_status', 'multicloud_deployments', ['status'])


def downgrade():
    op.drop_table('multicloud_deployments')
    op.drop_table('cloud_providers')
