Export & Apply Rules (Selection-based)

Selection source: export_selection sheet (exact locationIDs; one per row; no header).

Filename scheme:

Shard: new_profiles.selection-<YYYY-MM-DD>-<label>-v<schema>.r<run>.json

Manifest: manifest.selection-<YYYY-MM-DD>-<label>-v<schema>.r<run>.json

Storage: /frontend/data/exports/<YYYY-MM-DD>/ (git-ignored).

Never place shards or run-manifests in public/.

Before apply: verify manifest (missing=[], duplicates=[], counts match).

Apply policy: upsert by locationID (append if new, overwrite if existing).

Backup: copy public/data/profiles.json to /frontend/data/backups/ with ISO timestamp before every apply.

Apply log: write /frontend/data/apply-logs/apply.<runId>.json (tracked).

Schema: keep schemaVersion inside shard + manifest; bump when profile shape changes.

Determinism: keep shard item order identical to the selection sheet.

Security: exports and backups are not web-served; only the final master in public/data/ is.