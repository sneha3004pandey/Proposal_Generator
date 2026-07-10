---
name: Imported project with unregistered artifacts
description: How to get a GitHub-imported pnpm-workspace project running when artifact.toml files exist but aren't registered with the platform.
---

Symptom: project has `artifacts/<slug>/.replit-artifact/artifact.toml` files (real
artifact definitions, e.g. from a prior Replit session that was exported to
GitHub and re-imported), but `listArtifacts()` returns `[]` and
`WorkflowsRestart` on the conventional managed name (`artifacts/<slug>: <service>`)
fails with "doesn't exist in config". Re-running `createArtifact` with the same
slug also fails (`ARTIFACT_DIR_EXISTS`) since there's no "re-register existing
artifact" callback.

**Why:** artifact registration (and its managed workflow) is created at
`createArtifact()` time and isn't automatically reconstructed just because the
`artifact.toml` file is present on disk after a fresh git import.

**How to apply:** as a minimal, non-invasive workaround, read each service's
`localPort` (and, for web services, `BASE_PATH`) straight from
`artifact.toml`, then use `configureWorkflow` to create a plain workflow that
`cd`s into the artifact dir and runs its dev script with those env vars set
explicitly, e.g.:

```
cd artifacts/api-server && PORT=8080 pnpm run dev
cd artifacts/proposal-app && PORT=22676 BASE_PATH=/ pnpm run dev
```

This does not touch app code. Proper artifact registration (so workflows and
production routing are platform-managed again) is still a good follow-up if
the user wants deploys/multi-artifact routing to work natively later.

**Proper fix (preferred over the workaround above) — rename-swap re-registration:**
`createArtifact` refuses an existing slug, but you can get genuine registration
without losing any code:
1. Stop any manual workflows for that slug, `mv artifacts/<slug> artifacts/<slug>.orig`.
2. Call `createArtifact({ artifactType: ..., slug: <slug>, previewPath, title })` —
   this scaffolds a fresh dir and registers it (real workflow, real routing).
   Registering just one orphaned artifact this way can cause the platform to
   auto-detect and register *all other* orphaned `artifact.toml`s in the repo
   too (observed: creating `proposal-app` also auto-registered a sibling `api`
   and `design` artifact) — check `listArtifacts()` afterward before doing
   more manual work.
3. `diff -rq` the `.orig` backup against the fresh scaffold to find which files
   actually differ (usually just `App.tsx`/`index.css`/theme — scaffold
   placeholders); copy the pre-existing files back over the scaffold, keeping
   only the new `.replit-artifact/` registration.
4. Delete the `.orig` backup dir (do this only after diffing — the platform
   may also auto-register the `.orig` copy's toml as a duplicate artifact if
   it lingers, which then needs its own cleanup).
5. Remove old manual workflows via `removeWorkflow`, then `WorkflowsRestart`
   the real managed workflow names. Kill any stray dev processes still
   holding the old ports first (`fuser -k <port>/tcp`) — orphaned processes
   from the manual-workflow era don't die on their own and cause EADDRINUSE.
