# V4.1 soldier reconstruction — implementation plan V2

Date: 2026-11-12. User authorizes immediate implementation and non-force push to master.

Baseline: clean master `09270df`; Three.js r149/global JS; no existing GLB, Blender installation or original supplied reference image found. Existing source uses merged primitive meshes. Keep other characters unchanged.

1. Establish unit/E2E baseline. Use portable Blender 4.2.15 outside repository. Author reproducible custom-profile character with readable helmet star, face, weapon and backpack. Export rigid GLB Body/Head/Arms/LegL/LegR, Muzzle attachment, embedded PBR atlas and external texture copies. Ground origin, y-up, -Z front. Budget <2MB, <15k triangles (aim <8k).
2. Cache and validate GLTF loading; explicit failure/retry before startup. Share geometry/material in five rigid-part InstancedMeshes. Runtime must require only committed assets, never Blender. Retain game logic.
3. Six procedural states Idle/Run/Shoot/Hit/Death/Victory, independent phase and recoil, muzzle transformed using actual rendered matrices. Bounded death ghosts. Verify one soldier in actual game before expanding squad.
4. Staggered bounded formations 1/12/31/100/300/500. Dense-rank LOD/reduced animation with <=3k target triangles. Aim desktop 45 FPS <=100 and 30 FPS dense; report deviations, not invented mobile-device results.
5. Deterministic real-render screenshots: front/back/side/shoot, squads, four viewports. Validate loaded textures, animation/muzzle, movement/fire/growth/gates/death/storage, failure/retry and build resource inclusion. Record actual rAF FPS/draws/triangles/loading/heap including retained-memory trend. Compare repository old game screenshots; original-reference match remains unverified.
6. Separate art/integration/animation/performance/verification commits. Four requested V41 reports, source/provenance, reproducible scripts, final review and non-force push. If broken, repair or git rollback before delivery. No silent legacy fallback. No other character expansion until soldier acceptance.

Working in the user-requested clean master checkout; no unrelated edits to preserve. npm is absent from PATH, so run package-script Node entrypoints directly.
