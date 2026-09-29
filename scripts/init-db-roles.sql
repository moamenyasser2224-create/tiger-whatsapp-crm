-- ============================================================================
-- TIGER WORKSPACE CRM: ENTERPRISE DATABASE HARDENING & LEAST PRIVILEGE ROLES
-- Defense in Depth: Zero Public Exposure & Role Separation
-- ============================================================================
-- IMPORTANT:
-- 1. Run this script as the PostgreSQL superuser ('postgres') during setup.
-- 2. Ensure PostgreSQL binds ONLY to the private VPC/internal network interface:
--    In postgresql.conf:
--      listen_addresses = '10.0.0.5, 127.0.0.1'  (NEVER '0.0.0.0' or public IP)
--    In pg_hba.conf:
--      host    whatsapp_crm    tiger_app       10.0.0.0/16     scram-sha-256
--      host    whatsapp_crm    tiger_readonly  10.0.0.0/16     scram-sha-256
--      host    all             all             0.0.0.0/0       reject
-- ============================================================================

\set ON_ERROR_STOP on

-- 1. Create Dedicated Application Database (if not exists)
SELECT 'CREATE DATABASE whatsapp_crm'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'whatsapp_crm')\gexec

\connect whatsapp_crm;

-- 2. Revoke default insecure public permissions
REVOKE ALL ON SCHEMA public FROM PUBLIC;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;

-- 3. Create Dedicated Application Role (Least Privilege Runtime User)
--    NEVER run the application as 'postgres' superuser.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tiger_app') THEN
    CREATE ROLE tiger_app WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
  END IF;
END
$$;

-- Set a strong password in production via your secrets manager (e.g. Doppler / Vault)
-- ALTER ROLE tiger_app WITH PASSWORD 'CHANGE_ME_IN_PRODUCTION_SECRETS_MANAGER';

-- 4. Create Read-Only Reporting Role (For dashboards, backups, data audits)
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'tiger_readonly') THEN
    CREATE ROLE tiger_readonly WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION;
  END IF;
END
$$;

-- Set reporting password:
-- ALTER ROLE tiger_readonly WITH PASSWORD 'CHANGE_ME_READONLY_PASSWORD_IN_SECRETS';

-- 5. Grant Permissions to Application Role (CRUD Only)
GRANT CONNECT ON DATABASE whatsapp_crm TO tiger_app;
GRANT USAGE, CREATE ON SCHEMA public TO tiger_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO tiger_app;
GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO tiger_app;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO tiger_app;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO tiger_app;

-- 6. Grant Permissions to Read-Only Role (SELECT Only)
GRANT CONNECT ON DATABASE whatsapp_crm TO tiger_readonly;
GRANT USAGE ON SCHEMA public TO tiger_readonly;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO tiger_readonly;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO tiger_readonly;

-- 7. Verification Query
SELECT rolname, rolsuper, rolinherit, rolcreaterole, rolcreatedb, rolcanlogin 
FROM pg_roles 
WHERE rolname IN ('tiger_app', 'tiger_readonly', 'postgres');
