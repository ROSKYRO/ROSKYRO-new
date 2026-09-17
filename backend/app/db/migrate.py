"""
Lightweight auto-migration for ROSKYRO.

The app uses `Base.metadata.create_all()` on boot for simplicity instead of
Alembic. That call only creates tables that don't exist yet — it silently
does nothing when a model gains a *new column* on an already-existing table
(e.g. `User.hospital_id` was added after the `users` table was first created
in production). The result: the ORM queries for that column, Postgres says
`UndefinedColumn`, and the app crashes on boot.

`sync_missing_columns()` closes that gap: after `create_all()` runs, it
compares every mapped model's columns against what actually exists in the
database and adds any that are missing, using `ADD COLUMN IF NOT EXISTS`.

On Postgres, the same problem also shows up one level down: a Python
`enum.Enum` used in a `Column(Enum(...))` becomes its own native Postgres
enum *type* (e.g. `userrole`), and adding a new member to the Python enum
(e.g. `UserRole.hospital_staff`) does NOT add it to that Postgres type —
inserting a row with the new value fails with `InvalidTextRepresentation`.
`sync_missing_enum_values()` closes that gap the same way: it diffs each
mapped enum's Python members against the labels Postgres actually has for
that type, and runs `ALTER TYPE ... ADD VALUE IF NOT EXISTS` for anything
missing. `ALTER TYPE ... ADD VALUE` cannot run inside a transaction that
also uses the new value, but running it in its own autocommit connection —
well before anything ever tries to insert that value — sidesteps that.

Safety rules (deliberately conservative — this is not a replacement for
Alembic, just a boot-time safety net):
  - Only ADDS columns and enum values. Never drops, renames, or alters an
    existing column or removes an enum value.
  - Only auto-adds a column if it is nullable or has a default/server_default
    in the model — adding a NOT NULL column with no default to a table that
    already has rows would fail against existing data anyway, so those are
    skipped with a warning instead of crashing the boot.
  - Wrapped so any unexpected error is logged, not raised — a failed
    best-effort migration should never take the whole app down; the original
    UndefinedColumn/InvalidTextRepresentation error will simply resurface
    (same as before this file existed) so it's still visible in the logs.
"""
import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine

logger = logging.getLogger("roskyro.migrate")


def sync_missing_columns(engine: Engine, base) -> None:
    try:
        inspector = inspect(engine)
        existing_tables = set(inspector.get_table_names())

        with engine.begin() as conn:
            for table in base.metadata.sorted_tables:
                if table.name not in existing_tables:
                    # Brand new table — create_all() already handled it.
                    continue

                existing_columns = {
                    col["name"] for col in inspector.get_columns(table.name)
                }

                for column in table.columns:
                    if column.name in existing_columns:
                        continue

                    if not (column.nullable or column.default is not None
                            or column.server_default is not None):
                        logger.warning(
                            "Skipping auto-migration of %s.%s — column is "
                            "NOT NULL with no default, needs a manual "
                            "migration.",
                            table.name, column.name,
                        )
                        continue

                    col_type = column.type.compile(dialect=engine.dialect)
                    # Plain ADD COLUMN (no "IF NOT EXISTS") so this works on
                    # both Postgres (prod) and SQLite (local dev) — the
                    # existing_columns check above already guarantees we
                    # only reach here for genuinely missing columns.
                    ddl = (
                        f'ALTER TABLE "{table.name}" '
                        f'ADD COLUMN "{column.name}" {col_type}'
                    )
                    conn.execute(text(ddl))
                    logger.info("Auto-migration: added %s.%s (%s)",
                                table.name, column.name, col_type)
    except Exception:
        # Best-effort only — never block app startup because of this.
        logger.exception("Auto-migration of missing columns failed")


def sync_missing_enum_values(engine: Engine, base) -> None:
    """Postgres-only: add any Python enum members that are missing from the
    matching native Postgres enum type (see module docstring for why this is
    needed alongside sync_missing_columns())."""
    if engine.dialect.name != "postgresql":
        return  # SQLite stores enums as plain VARCHAR — nothing to sync.

    try:
        seen_types = set()
        # ADD VALUE can't run inside a transaction that might also use the
        # new value, so do each ALTER on its own autocommit connection.
        with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
            for table in base.metadata.sorted_tables:
                for column in table.columns:
                    enum_values = getattr(column.type, "enums", None)
                    type_name = getattr(column.type, "name", None)
                    if not enum_values or not type_name or type_name in seen_types:
                        continue
                    seen_types.add(type_name)

                    existing_labels = {
                        row[0] for row in conn.execute(
                            text(
                                "SELECT e.enumlabel FROM pg_enum e "
                                "JOIN pg_type t ON t.oid = e.enumtypid "
                                "WHERE t.typname = :type_name"
                            ),
                            {"type_name": type_name},
                        )
                    }
                    if not existing_labels:
                        continue  # type doesn't exist in the DB yet — create_all() will make it fresh, with every current value.

                    for value in enum_values:
                        if value in existing_labels:
                            continue
                        conn.execute(text(
                            f'ALTER TYPE "{type_name}" ADD VALUE IF NOT EXISTS \'{value}\''
                        ))
                        logger.info("Auto-migration: added enum value %s.%s", type_name, value)
    except Exception:
        # Best-effort only — never block app startup because of this.
        logger.exception("Auto-migration of missing enum values failed")
