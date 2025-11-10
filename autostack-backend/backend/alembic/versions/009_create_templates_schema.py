"""create templates schema

Revision ID: 009
Revises: 008
Create Date: 2025-11-10 20:40:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision = '009'
down_revision = '008'
branch_labels = None
depends_on = None


def upgrade():
    # Deployment Templates - Production-ready templates
    op.create_table(
        'deployment_templates',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('name', sa.String(255), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('category', sa.String(100), nullable=False),  # frontend, backend, fullstack, etc.
        
        # Template configuration
        sa.Column('config', JSONB, nullable=False),
        sa.Column('tech_stack', JSONB, nullable=False),
        sa.Column('icon', sa.String(100), nullable=True),
        sa.Column('tags', JSONB, nullable=True),
        
        # Repository
        sa.Column('github_url', sa.String(500), nullable=True),
        sa.Column('demo_url', sa.String(500), nullable=True),
        
        # Popularity
        sa.Column('usage_count', sa.Integer, nullable=False, default=0),
        sa.Column('rating', sa.Numeric(2, 1), nullable=True),
        sa.Column('review_count', sa.Integer, nullable=False, default=0),
        
        # Metadata
        sa.Column('is_official', sa.Boolean, nullable=False, default=False),
        sa.Column('is_featured', sa.Boolean, nullable=False, default=False),
        sa.Column('created_by', sa.String(), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    
    op.create_index('idx_deployment_templates_category', 'deployment_templates', ['category'])
    op.create_index('idx_deployment_templates_official', 'deployment_templates', ['is_official'])
    op.create_index('idx_deployment_templates_featured', 'deployment_templates', ['is_featured'])


def downgrade():
    op.drop_table('deployment_templates')
