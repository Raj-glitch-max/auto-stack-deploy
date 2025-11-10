"""create pipelines schema

Revision ID: 007
Revises: 006
Create Date: 2025-11-10 19:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID, JSONB

# revision identifiers, used by Alembic.
revision = '007'
down_revision = '006'
branch_labels = None
depends_on = None


def upgrade():
    # Pipelines - Visual pipeline definitions
    op.create_table(
        'pipelines',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Pipeline metadata
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        
        # Pipeline definition (nodes and edges)
        sa.Column('definition', JSONB, nullable=False),  # Visual pipeline structure
        sa.Column('version', sa.Integer, nullable=False, default=1),
        
        # Trigger configuration
        sa.Column('trigger_type', sa.String(50), nullable=False, default='manual'),  # manual, push, pr, schedule
        sa.Column('trigger_config', JSONB, nullable=True),  # Branch patterns, cron schedule, etc.
        
        # Status
        sa.Column('is_active', sa.Boolean, nullable=False, default=True),
        sa.Column('is_template', sa.Boolean, nullable=False, default=False),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('last_run_at', sa.DateTime(timezone=True), nullable=True),
    )
    
    op.create_index('idx_pipelines_project', 'pipelines', ['project_id'])
    op.create_index('idx_pipelines_user', 'pipelines', ['user_id'])
    op.create_index('idx_pipelines_active', 'pipelines', ['is_active'])
    
    
    # Pipeline Runs - Execution history
    op.create_table(
        'pipeline_runs',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('pipeline_id', sa.String(), sa.ForeignKey('pipelines.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', sa.String(), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', sa.String(), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        
        # Run metadata
        sa.Column('run_number', sa.Integer, nullable=False),
        sa.Column('status', sa.String(50), nullable=False, default='queued'),  # queued, running, success, failed, cancelled
        sa.Column('trigger_type', sa.String(50), nullable=False),  # manual, push, pr, schedule, api
        sa.Column('triggered_by', sa.String(255), nullable=True),
        
        # Execution details
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer, nullable=True),
        
        # Results
        sa.Column('logs', sa.Text, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('artifacts', JSONB, nullable=True),
        
        # Cost tracking
        sa.Column('estimated_cost', sa.Numeric(10, 4), nullable=True),
        sa.Column('actual_cost', sa.Numeric(10, 4), nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_pipeline_runs_pipeline', 'pipeline_runs', ['pipeline_id'])
    op.create_index('idx_pipeline_runs_status', 'pipeline_runs', ['status'])
    op.create_index('idx_pipeline_runs_created', 'pipeline_runs', ['created_at'])
    
    
    # Pipeline Steps - Individual step execution
    op.create_table(
        'pipeline_steps',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('pipeline_run_id', sa.String(), sa.ForeignKey('pipeline_runs.id', ondelete='CASCADE'), nullable=False),
        
        # Step details
        sa.Column('step_name', sa.String(255), nullable=False),
        sa.Column('step_type', sa.String(100), nullable=False),  # build, test, deploy, etc.
        sa.Column('step_order', sa.Integer, nullable=False),
        
        # Execution
        sa.Column('status', sa.String(50), nullable=False, default='pending'),
        sa.Column('started_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('duration_seconds', sa.Integer, nullable=True),
        
        # Results
        sa.Column('logs', sa.Text, nullable=True),
        sa.Column('error_message', sa.Text, nullable=True),
        sa.Column('output', JSONB, nullable=True),
        
        # Metadata
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_pipeline_steps_run', 'pipeline_steps', ['pipeline_run_id'])
    op.create_index('idx_pipeline_steps_status', 'pipeline_steps', ['status'])
    
    
    # Pipeline Templates - Reusable pipeline templates
    op.create_table(
        'pipeline_templates',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=False),  # frontend, backend, fullstack, etc.
        
        # Template definition
        sa.Column('definition', JSONB, nullable=False),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('tags', JSONB, nullable=True),
        
        # Popularity
        sa.Column('usage_count', sa.Integer, nullable=False, default=0),
        sa.Column('rating', sa.Numeric(2, 1), nullable=True),
        
        # Metadata
        sa.Column('is_official', sa.Boolean, nullable=False, default=False),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_pipeline_templates_category', 'pipeline_templates', ['category'])
    op.create_index('idx_pipeline_templates_official', 'pipeline_templates', ['is_official'])


def downgrade():
    op.drop_table('pipeline_templates')
    op.drop_table('pipeline_steps')
    op.drop_table('pipeline_runs')
    op.drop_table('pipelines')
