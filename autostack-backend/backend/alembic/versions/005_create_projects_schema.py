"""create projects and enhanced schema

Revision ID: 005_create_projects
Revises: 004_add_google_oauth_fields
Create Date: 2025-01-10 18:20:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '005_create_projects'
down_revision = '004_add_google_oauth'
branch_labels = None
depends_on = None


def upgrade():
    # Create projects table
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        
        # GitHub integration
        sa.Column('github_repo', sa.String(500), nullable=False),
        sa.Column('github_repo_id', sa.BigInteger, nullable=True),
        sa.Column('default_branch', sa.String(100), nullable=False, server_default='main'),
        
        # Build configuration
        sa.Column('framework', sa.String(100), nullable=True),  # next.js, react, vue, etc.
        sa.Column('build_command', sa.String(500), nullable=True),
        sa.Column('install_command', sa.String(500), nullable=True, server_default='npm install'),
        sa.Column('output_directory', sa.String(255), nullable=True),
        sa.Column('root_directory', sa.String(255), nullable=True, server_default='/'),
        sa.Column('node_version', sa.String(20), nullable=True, server_default='18'),
        
        # Deployment settings
        sa.Column('production_url', sa.String(500), nullable=True),
        sa.Column('production_deployment_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('auto_deploy_enabled', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('auto_deploy_branch', sa.String(100), nullable=True, server_default='main'),
        
        # Resource settings
        sa.Column('cpu_limit', sa.String(20), nullable=True, server_default='500m'),
        sa.Column('memory_limit', sa.String(20), nullable=True, server_default='512Mi'),
        sa.Column('min_replicas', sa.Integer, nullable=False, server_default='2'),
        sa.Column('max_replicas', sa.Integer, nullable=False, server_default='10'),
        
        # Metadata
        sa.Column('is_public', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('is_archived', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.UniqueConstraint('user_id', 'slug', name='uq_user_project_slug')
    )
    
    # Create index on user_id for faster lookups
    op.create_index('ix_projects_user_id', 'projects', ['user_id'])
    op.create_index('ix_projects_github_repo', 'projects', ['github_repo'])
    
    # Enhance deployments table
    op.add_column('deployments', sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column('deployments', sa.Column('commit_sha', sa.String(40), nullable=True))
    op.add_column('deployments', sa.Column('commit_message', sa.Text, nullable=True))
    op.add_column('deployments', sa.Column('commit_author', sa.String(255), nullable=True))
    op.add_column('deployments', sa.Column('deployment_url', sa.String(500), nullable=True))
    op.add_column('deployments', sa.Column('build_time_seconds', sa.Integer, nullable=True))
    op.add_column('deployments', sa.Column('deploy_time_seconds', sa.Integer, nullable=True))
    op.add_column('deployments', sa.Column('total_time_seconds', sa.Integer, nullable=True))
    op.add_column('deployments', sa.Column('is_production', sa.Boolean, nullable=False, server_default='false'))
    op.add_column('deployments', sa.Column('creator_type', sa.String(50), nullable=True))  # manual, webhook, api
    op.add_column('deployments', sa.Column('app_name', sa.String(255), nullable=True))  # K8s app name
    
    # Add foreign key for project_id
    op.create_foreign_key(
        'fk_deployments_project',
        'deployments', 'projects',
        ['project_id'], ['id'],
        ondelete='CASCADE'
    )
    
    # Create environment variables table
    op.create_table(
        'environment_variables',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('key', sa.String(255), nullable=False),
        sa.Column('value', sa.Text, nullable=False),  # Encrypted
        sa.Column('environment', sa.String(50), nullable=False, server_default='production'),  # production, preview, development
        sa.Column('is_sensitive', sa.Boolean, nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.UniqueConstraint('project_id', 'key', 'environment', name='uq_project_env_key')
    )
    
    op.create_index('ix_env_vars_project_id', 'environment_variables', ['project_id'])
    
    # Create domains table
    op.create_table(
        'domains',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('domain_name', sa.String(255), nullable=False),
        sa.Column('is_verified', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('verification_token', sa.String(255), nullable=True),
        sa.Column('ssl_status', sa.String(50), nullable=True),  # pending, active, failed
        sa.Column('ssl_cert_arn', sa.String(500), nullable=True),
        sa.Column('dns_configured', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('dns_records', postgresql.JSONB, nullable=True),
        sa.Column('is_primary', sa.Boolean, nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.UniqueConstraint('domain_name', name='uq_domain_name')
    )
    
    op.create_index('ix_domains_project_id', 'domains', ['project_id'])
    
    # Create teams table
    op.create_table(
        'teams',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('slug', sa.String(255), nullable=False, unique=True),
        sa.Column('owner_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('avatar_url', sa.String(500), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'))
    )
    
    # Create team members table
    op.create_table(
        'team_members',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('team_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('teams.id', ondelete='CASCADE'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('role', sa.String(50), nullable=False, server_default='member'),  # owner, admin, member, viewer
        sa.Column('joined_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()')),
        
        sa.UniqueConstraint('team_id', 'user_id', name='uq_team_member')
    )
    
    op.create_index('ix_team_members_team_id', 'team_members', ['team_id'])
    op.create_index('ix_team_members_user_id', 'team_members', ['user_id'])
    
    # Create analytics events table
    op.create_table(
        'analytics_events',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('deployment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deployments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('projects.id', ondelete='CASCADE'), nullable=False),
        sa.Column('event_type', sa.String(50), nullable=False),  # request, error, metric
        sa.Column('path', sa.String(500), nullable=True),
        sa.Column('method', sa.String(10), nullable=True),
        sa.Column('status_code', sa.Integer, nullable=True),
        sa.Column('response_time_ms', sa.Integer, nullable=True),
        sa.Column('user_agent', sa.Text, nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('country', sa.String(2), nullable=True),
        sa.Column('city', sa.String(100), nullable=True),
        sa.Column('metadata', postgresql.JSONB, nullable=True),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'))
    )
    
    op.create_index('ix_analytics_deployment_id', 'analytics_events', ['deployment_id'])
    op.create_index('ix_analytics_project_id', 'analytics_events', ['project_id'])
    op.create_index('ix_analytics_timestamp', 'analytics_events', ['timestamp'])
    
    # Create deployment logs table (separate from deployments for better performance)
    op.create_table(
        'deployment_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('deployment_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('deployments.id', ondelete='CASCADE'), nullable=False),
        sa.Column('log_type', sa.String(50), nullable=False),  # build, deploy, runtime, error
        sa.Column('message', sa.Text, nullable=False),
        sa.Column('timestamp', sa.DateTime(timezone=True), nullable=False, server_default=sa.text('now()'))
    )
    
    op.create_index('ix_deployment_logs_deployment_id', 'deployment_logs', ['deployment_id'])
    op.create_index('ix_deployment_logs_timestamp', 'deployment_logs', ['timestamp'])


def downgrade():
    # Drop all new tables
    op.drop_table('deployment_logs')
    op.drop_table('analytics_events')
    op.drop_table('team_members')
    op.drop_table('teams')
    op.drop_table('domains')
    op.drop_table('environment_variables')
    
    # Remove columns from deployments
    op.drop_constraint('fk_deployments_project', 'deployments', type_='foreignkey')
    op.drop_column('deployments', 'app_name')
    op.drop_column('deployments', 'creator_type')
    op.drop_column('deployments', 'is_production')
    op.drop_column('deployments', 'total_time_seconds')
    op.drop_column('deployments', 'deploy_time_seconds')
    op.drop_column('deployments', 'build_time_seconds')
    op.drop_column('deployments', 'deployment_url')
    op.drop_column('deployments', 'commit_author')
    op.drop_column('deployments', 'commit_message')
    op.drop_column('deployments', 'commit_sha')
    op.drop_column('deployments', 'project_id')
    
    # Drop projects table
    op.drop_table('projects')
