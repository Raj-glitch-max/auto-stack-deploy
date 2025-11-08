"""add github oauth fields

Revision ID: 002_github_oauth
Revises: 001_initial_migration
Create Date: 2025-11-08 21:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002_github_oauth'
down_revision = '001_initial_migration'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add GitHub OAuth fields to users table
    op.add_column('users', sa.Column('github_token', sa.String(), nullable=True))
    op.add_column('users', sa.Column('github_username', sa.String(), nullable=True))
    
    # Add deployment fields for deploy engine
    op.add_column('deployments', sa.Column('port', sa.Integer(), nullable=True))
    op.add_column('deployments', sa.Column('container_id', sa.String(), nullable=True))
    op.add_column('deployments', sa.Column('url', sa.String(), nullable=True))
    op.add_column('deployments', sa.Column('error_message', sa.Text(), nullable=True))


def downgrade() -> None:
    # Remove deployment fields
    op.drop_column('deployments', 'error_message')
    op.drop_column('deployments', 'url')
    op.drop_column('deployments', 'container_id')
    op.drop_column('deployments', 'port')
    
    # Remove GitHub OAuth fields
    op.drop_column('users', 'github_username')
    op.drop_column('users', 'github_token')
