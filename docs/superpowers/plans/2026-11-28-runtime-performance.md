# Runtime performance and startup optimization

Scope: current feature/v15-art-overhaul at e9a0731, verified equal to remote branch.
Preserve untracked art/screenshots, all combat damage/HP/rewards/input and existing visual assets.
Use pinned Three.js r149. Root applies systematic-debugging, performance-optimization,
writing-plans and TDD; implementation proceeds after independent plan review.

Baseline: tools/runtime-perf-probe.js, Edge390x844 DPR1, cold contexts, cache disabled,
4x CPU throttle, three runs. Home ready1378–1826ms, full scenery1476–2075ms.
500 troops40 enemies: frame submit mean14.2–15.0ms, P95 19.7–23.5ms;
soldier update mean3.3–3.8ms. GPU completion is not included in these measurements.
Boot waits22 GLBs despite first encounter using normal/fast only. Profiling reveals
407–502ms initialization tasks. Routine kills reset shake and force combo layout.
Soldier LOD holds walk cycles30Hz, allocates a pose per troop/frame, and rewrites
unchanged instance colors; hidden class attachments are still computed at high counts.

- [x] Add failing deterministic browser assertions for limited critical load,
  environment preload reuse/theme recycling, stable ordinary-kill camera/time scale,
  continuous LOD poses, shared pose storage and no redundant color uploads.
- [x] Soldier slice: update cycles continuously, reuse pose objects, only upload tint
  when bank/class/visible slots change, omit hidden LOD class attachment work;
  preserve muzzle alignment, recoil, death/victory and class identity.
- [x] Startup/root slice: await soldier+normal/fast six GLBs; preload the military
  environment in parallel and reuse promise/results, retain visible procedural fallback
  on failure. Continue remaining enemies in short yielding tasks with deduplicated loads,
  caught failures and retry support; no blanket long delays between idle loads.
- [x] World/root: use low-frequency procedural equirectangular PMREM instead of six
  256px cube captures; dispose source texture and generator. Skip hidden scenery
  instance updates; invalidate/reapply theme when exposing meshes and after GLB install.
- [x] Feedback/root: ordinary kills update combo without shake/forced layout; preserve
  rare milestone/boss/heavy skill feedback with a cooldown and remove combo hit-stop.
  Subtract prior camera shake before damping so transient shake cannot bias follow.
- [x] Re-run same three-run probe without concurrent browsers. Keep changes only with
  evidence; compare work milliseconds, startup, long tasks and frame pacing. Capture
  real battle screenshots, verify soldier states/muzzle and native startup, run unit,
  E2E combat and H5/native builds. Review actual diff independently, document limitations,
  commit and push current branch, preserving unrelated files.
