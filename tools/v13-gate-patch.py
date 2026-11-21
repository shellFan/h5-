# V13 状态门升级: 稀有度光束柱(双柱合并单mesh, 加色混合) + gates.js 脉动
import io

def edit(p, old, new, count=1):
    s = io.open(p, encoding='utf-8').read()
    assert s.count(old) == count, (p, s.count(old), repr(old[:70]))
    io.open(p, 'w', encoding='utf-8', newline='\n').write(s.replace(old, new))
    print('ok', p)

# 1. art-v42: 门顶稀有度光束柱(单 mesh 双柱 + 顶横梁光带, 加色混合, 远距离可读)
edit('js/art-v42.js',
    """        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);""",
    """        // V13: 稀有度光束柱 — 双柱+顶梁合并为单 mesh(+1 drawCall/门), 加色混合;
        // 让门在任意主题(洞穴/末日)下保持稀有度色可读性(玩法可读性优先级最高)
        var beamH = 2.5;
        var beamGeo = mergeGeometries([
            colorize(new THREE.PlaneGeometry(0.09, beamH), style.light),
            colorize(new THREE.PlaneGeometry(0.09, beamH).translate(width * 0.5 - postW * 0.5, 0, 0), style.light),
            colorize(new THREE.PlaneGeometry(width - 0.34, 0.055).translate(0, beamH * 0.5 - 0.03, 0), style.light)
        ]);
        var beamMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.34,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
            fog: false
        });
        var beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.45 + beamH * 0.5, -0.16);
        beam.renderOrder = 2;
        beam.userData.artSource = 'V13 稀有度光束柱(加色, 脉动由 gates.update 驱动)';
        group.add(beam);

        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);""")

# 2. art-v42: userData 暴露 beamMat
edit('js/art-v42.js',
    """        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/procedural-beveled-PBR';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 1.03;""",
    """        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/procedural-beveled-PBR';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 1.03;
        group.userData.beamMat = beamMat; // V13: 光束脉动(gates.update)""")

# 3. gates.js: 光束呼吸脉动(利用已有逐帧 update; 相位取门 z 避免同步闪)
s = io.open('js/gates.js', encoding='utf-8').read()
anchor = "    update(squad, effects, time, dt) {"
assert s.count(anchor) == 1
# 在 update 内找到 label 动画附近 — 先看 update 里已有的 label 处理
print('gates.js update 锚点确认')
io.open('js/gates.js', encoding='utf-8').write(s)
PYEOF
