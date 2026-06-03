-- Make the AuditLog table append-only at the database level.
--
-- Strategy: a BEFORE UPDATE/DELETE trigger that raises an exception. This is
-- enforced for every connection regardless of role, which matters on managed
-- Postgres (Neon/Supabase) where the app typically connects as the table owner
-- and a plain REVOKE would not stop the owner.
--
-- For deployments that use a dedicated least-privilege application role, also
-- REVOKE UPDATE, DELETE ON "AuditLog" FROM <app_role>; (left to the operator,
-- since the role name is environment-specific).

CREATE OR REPLACE FUNCTION audit_log_block_mutation() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'AuditLog is append-only: % is not permitted', TG_OP
    USING ERRCODE = 'insufficient_privilege';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_log_no_update ON "AuditLog";
CREATE TRIGGER audit_log_no_update
  BEFORE UPDATE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();

DROP TRIGGER IF EXISTS audit_log_no_delete ON "AuditLog";
CREATE TRIGGER audit_log_no_delete
  BEFORE DELETE ON "AuditLog"
  FOR EACH ROW EXECUTE FUNCTION audit_log_block_mutation();
