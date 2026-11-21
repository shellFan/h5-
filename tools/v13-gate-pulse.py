# V13: gates.js 光束呼吸脉动(复用接近发光强度, 零额外开销)
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

edit('js/gates.js',
    """            // 接近发光
            if (!g.triggered) {
                const dist = Math.abs(squad.z - g.z);
                if (dist < 6 && dist > 0.5) {
                    const intensity = 1 - dist / 6;
                    const glass = g.model.userData.glass;
                    if (glass) {
                        glass.material.opacity = 0.45 + intensity * 0.3;
                    }
                }""",
    """            // 接近发光
            if (!g.triggered) {
                const dist = Math.abs(squad.z - g.z);
                if (dist < 6 && dist > 0.5) {
                    const intensity = 1 - dist / 6;
                    const glass = g.model.userData.glass;
                    if (glass) {
                        glass.material.opacity = 0.45 + intensity * 0.3;
                    }
                }
                // V13: 稀有度光束呼吸脉动(相位取门z; 靠近时增强 — 复用上面的 intensity)
                const beam = g.model.userData.beamMat;
                if (beam) {
                    const nearBoost = dist < 6 ? (1 - dist / 6) * 0.22 : 0;
                    beam.opacity = 0.26 + Math.sin(time * 3 + g.z * 1.7) * 0.08 + nearBoost;
                }""")
