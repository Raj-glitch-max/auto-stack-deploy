-- Fix database schema issues
-- Run this with: docker compose exec db psql -U autostack -d autostack -f /fix-database.sql

-- 1. Fix refresh_tokens table - rename token to token_hash
DO $$
BEGIN
    -- Check if token column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='refresh_tokens' AND column_name='token'
    ) THEN
        ALTER TABLE refresh_tokens RENAME COLUMN token TO token_hash;
        RAISE NOTICE '✅ Renamed refresh_tokens.token to token_hash';
    ELSE
        RAISE NOTICE 'ℹ️ Column refresh_tokens.token_hash already exists';
    END IF;
    
    -- Rename index if needed
    IF EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename='refresh_tokens' AND indexname='ix_refresh_tokens_token'
    ) THEN
        ALTER INDEX ix_refresh_tokens_token RENAME TO ix_refresh_tokens_token_hash;
        RAISE NOTICE '✅ Renamed index ix_refresh_tokens_token';
    END IF;
END $$;

-- 2. Fix audit_logs table - change details to JSON type
DO $$
BEGIN
    -- Check if details column is Text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_logs' AND column_name='details' AND data_type='text'
    ) THEN
        -- Convert Text to JSON
        ALTER TABLE audit_logs ALTER COLUMN details TYPE json USING details::json;
        RAISE NOTICE '✅ Converted audit_logs.details to JSON type';
    ELSE
        RAISE NOTICE 'ℹ️ audit_logs.details is already JSON type';
    END IF;
END $$;

-- 3. Verify the changes
SELECT 'refresh_tokens schema:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='refresh_tokens' 
ORDER BY ordinal_position;

SELECT 'audit_logs schema:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name='audit_logs' 
ORDER BY ordinal_position;

-- 4. Show current migration version
SELECT * FROM alembic_version;
