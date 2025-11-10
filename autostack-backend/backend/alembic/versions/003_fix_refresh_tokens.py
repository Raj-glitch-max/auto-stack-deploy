"""Fix refresh_tokens column name

Revision ID: 003_fix_tokens
Revises: 002_github_oauth
Create Date: 2025-11-08 22:59:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '003_fix_tokens'
down_revision = '002_github_oauth'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Check if token column exists and rename it to token_hash
    conn = op.get_bind()
    
    # Check if 'token' column exists
    result = conn.execute(sa.text("""
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name='refresh_tokens' AND column_name='token'
    """))
    
    if result.fetchone():
        # Rename token to token_hash
        op.execute('ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash')
        print("✅ Renamed refresh_tokens.token to token_hash")
    
    # Check if index needs renaming
    result = conn.execute(sa.text("""
        SELECT indexname 
        FROM pg_indexes 
        WHERE tablename='refresh_tokens' AND indexname='ix_refresh_tokens_token'
    """))
    
    if result.fetchone():
        op.execute('ALTER INDEX ix_refresh_tokens_token RENAME TO ix_refresh_tokens_token_hash')
        print("✅ Renamed index ix_refresh_tokens_token to ix_refresh_tokens_token_hash")


def downgrade() -> None:
    # Rename back from token_hash to token
    op.execute('ALTER TABLE refresh_tokens RENAME COLUMN token_hash TO token')
    op.execute('ALTER INDEX ix_refresh_tokens_token_hash RENAME TO ix_refresh_tokens_token')
