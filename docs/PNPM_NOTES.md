# pnpm Workspace Notes

## catalogMode: strict Known Bug

### Issue
When running `pnpm add <pkg>` in a sub-package with `catalogMode: strict`, pnpm may write `catalog:` (the protocol itself) back into `pnpm-workspace.yaml` as the version instead of the actual version from the catalog.

### Example of Bug
```yaml
# Before (correct)
catalog:
  react: ^19.0.0

# After running pnpm add react in a sub-package (incorrect)
catalog:
  react: catalog:
```

### Workaround
1. **Manual Edit Method**: After running `pnpm add <pkg>`, manually edit `pnpm-workspace.yaml` to correct any entries that show `catalog:` instead of the actual version
2. **Avoid pnpm add**: For new dependencies, prefer manually editing `pnpm-workspace.yaml` to add the dependency to the catalog, then run `pnpm install`
3. **Verification**: Always check `pnpm-workspace.yaml` after any `pnpm add` operation to ensure no `catalog:` protocol entries exist

### Best Practices
- Always run `pnpm install` from the repo root after modifying the catalog
- Use `pnpm ls -r` to verify workspace structure after changes
- Consider the catalog as the single source of truth for dependency versions
- Never hardcode versions in individual package.json files - always use `catalog:`

### Recovery
If the bug occurs and your workspace becomes broken:
1. Edit `pnpm-workspace.yaml` to fix all `catalog:` entries
2. Run `pnpm install --force` to regenerate the lockfile
3. Verify with `pnpm ls -r` that all packages resolve correctly

---
*This file documents known issues and workarounds for pnpm workspace management in this monorepo.*
