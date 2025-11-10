"""Add Google OAuth fields to users table

Revision ID: 004_add_google_oauth
Revises: 003_fix_tokens
Create Date: 2025-11-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = "004_add_google_oauth"
down_revision = "003_fix_tokens"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("google_id", sa.String(), nullable=True))
    op.add_column("users", sa.Column("google_email", sa.String(), nullable=True))
    op.add_column("users", sa.Column("name", sa.String(), nullable=True))
    op.add_column("users", sa.Column("avatar_url", sa.String(), nullable=True))
    op.add_column(
        "users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default="false")
    )

    op.create_index("ix_users_google_id", "users", ["google_id"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_google_id", table_name="users")
    op.drop_column("users", "email_verified")
    op.drop_column("users", "avatar_url")
    op.drop_column("users", "name")
    op.drop_column("users", "google_email")
    op.drop_column("users", "google_id")

