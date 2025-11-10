#!/usr/bin/env python3
"""
Database Schema Fix Script
Fixes the refresh_tokens and audit_logs table schema issues
"""
import asyncio
import asyncpg
import os

async def fix_database():
    """Fix database schema issues"""
    
    # Database connection parameters
    DB_HOST = os.getenv('DB_HOST', 'localhost')
    DB_PORT = os.getenv('DB_PORT', '5432')
    DB_USER = os.getenv('DB_USER', 'autostack')
    DB_PASSWORD = os.getenv('DB_PASSWORD', 'autostack')
    DB_NAME = os.getenv('DB_NAME', 'autostack')
    
    print("🔧 Connecting to database...")
    conn = await asyncpg.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME
    )
    
    try:
        print("📋 Checking current schema...")
        
        # Check refresh_tokens table
        result = await conn.fetchval("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='refresh_tokens' AND column_name='token'
        """)
        
        if result:
            print("🔄 Fixing refresh_tokens table...")
            # Rename token to token_hash
            await conn.execute('ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash')
            print("✅ Renamed refresh_tokens.token to token_hash")
            
            # Rename index
            await conn.execute('ALTER INDEX IF EXISTS ix_refresh_tokens_token RENAME TO ix_refresh_tokens_token_hash')
            print("✅ Renamed index")
        else:
            print("ℹ️  refresh_tokens.token_hash already exists")
        
        # Check audit_logs table
        result = await conn.fetchrow("""
            SELECT data_type 
            FROM information_schema.columns 
            WHERE table_name='audit_logs' AND column_name='details'
        """)
        
        if result and result['data_type'] == 'text':
            print("🔄 Fixing audit_logs table...")
            # Clear any existing data that might cause issues
            await conn.execute("UPDATE audit_logs SET details = '{}' WHERE details IS NULL OR details = ''")
            # Convert Text to JSON
            await conn.execute("ALTER TABLE audit_logs ALTER COLUMN details TYPE json USING COALESCE(details::json, '{}'::json)")
            print("✅ Converted audit_logs.details to JSON type")
        else:
            print("ℹ️  audit_logs.details is already JSON type")
        
        # Verify the changes
        print("\n📊 Current schema:")
        
        rows = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='refresh_tokens' 
            ORDER BY ordinal_position
        """)
        print("\nrefresh_tokens:")
        for row in rows:
            print(f"  - {row['column_name']}: {row['data_type']}")
        
        rows = await conn.fetch("""
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name='audit_logs' 
            ORDER BY ordinal_position
        """)
        print("\naudit_logs:")
        for row in rows:
            print(f"  - {row['column_name']}: {row['data_type']}")
        
        print("\n✅ Database schema fixed successfully!")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        raise
    finally:
        await conn.close()
        print("🔌 Database connection closed")

if __name__ == "__main__":
    asyncio.run(fix_database())
