# Combat feedback and gate recovery

User authorized implementation and push. Preserve existing uncommitted art/model edits.

Design: wait five world units before a blocked gate row, then reveal the nearest row
and allow approach after the previous encounter clears. Skill gates follow the same
encounter lock. Keep automatic recruitment, but identify each source and actual
capped gain in an independent HUD notice, with bounded green ring/particle feedback.
Correct volley damage sharing before considering changes to enemy HP.

Alternatives considered: revealing gates during combat allows rewards out of order;
increasing enemy HP globally hides the volley calculation error. Neither is needed.

Plan v1 reviewed: PLAN_APPROVED. Advisor cautions: no backwards movement and no stale
recruitment messages after restart. Root integrates and verifies all changes.

- [x] Reproduce blocked L6 gate at 30/60/120 Hz, future skill visibility, amplified
  volley damage, and missing recruitment notice with a browser regression test.
- [x] Add GateSystem gate approach boundary and shared availability; combine it with
  existing boss/wave boundaries in Game before movement.
- [x] Add capped Squad.addReinforcements and Effects HUD/particle feedback; route
  random events, medical recovery and kill recruitment through it. Reset on clear.
- [x] Divide base volley damage across actual firing positions. Check projectile
  range/rendering and real combat visibility before any additional tuning.
- [x] Run regression, unit, existing E2E, H5 build; inspect mobile screenshot.
- [x] Review diff and explicitly stage owned files. Delivery: commit and push
  origin/master after verification, as authorized by the user.

## Verification

- Before fix: regression failed for all three gate frame rates, volley damage and
  absent recruitment helper/notice. Added three real-hit, rear-ambush and expanded
  cap regressions after independent review (11 regression checks in total).
- Unit 92/92; main E2E 29/29; gates 15/15; skills 15/15; weapons 14/14.
- H5 build and built-output browser smoke test pass, including local model loading.
- L6–L10 route test reaches every authored gate in order; it uses a fixed strong
  squad and temporary invulnerability to isolate routing from upgrade balance.
- Real combat checks without random events: fresh L1 center route wins in about
  75 seconds, median killed-enemy lifetime 3.1 seconds. L2 with gun upgrade level 1
  wins in about 98 seconds (versus 64 seconds with the old amplified damage).
- Inspected 390x844 mobile screenshot: readable independent recruitment notice,
  no top HUD overlap. World pulses are limited to one per 0.4 seconds; notice
  expires after 2.8 seconds and resets on a new run. Script/style versions updated.
- Independent code review found rounding still present in downstream damage,
  technology-cap guards and a rear-ambush melee dead zone. Each was reproduced
  before fixing: fractional hits were inflated, recruitment stopped at 501 despite
  cap 600, and seven rear ambushers stayed alive while a lone soldier waited at a
  locked gate. All paths now have regression coverage; follow-up review found no
  remaining material regression. Rear enemies sprint into the forward firing line
  before resuming melee, rather than remaining permanently behind the guns.
