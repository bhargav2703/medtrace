-- If you already created audit_log without `note`, run this once.
alter table audit_log add column if not exists note text;
