# V15 · 性能 QA (PERFORMANCE_QA)

## 实测数据(tools/v15-audit.js, 390×844, 软渲染环境)
| 指标 | 数值 | 备注 |
|---|---|---|
| 首屏 boot(到可交互) | **587-647ms** | 含关键 GLB 就绪等待 |
| 战斗 DrawCall | **103** | V13 基线 ~97, V14 预算内(主题道具按可见性 +4-6) |
| 三角形 | 130,624 | — |
| 几何体/纹理 | 100 / 21 | 无重复加载 |
| JS Heap(战斗中) | 24.0MB | — |
| 压力场景(120 怪+齐射) | **175fps** / drawCalls 101 | 软渲染; 真机未测(如实) |
| 30min soak | 141 周期 / 0 页面错误 / 堆 18.9→24.4MB 判定平稳 |

## 排查清单(逐项核对)
- 重复创建材质/几何体: 全池化(particles/impacts/booms/rings/flashes/floats/bullets)
  + 实例化渲染(士兵五部件/怪五部件/弹道单 InstancedMesh) ✅ 无
- 重复加载 GLB: EnemyModelLoader._data 缓存 + WeaponShowcase._cache ✅ 无
- 纹理缓存: 文本纹理 128 条 LRU ✓ / 地面纹理 5 种缓存 ✓ / 展示台环境 1 张 ✓
- 粒子释放: clear() 全回收 + soak 泄漏判定通过 ✅
- 事件监听重复: bind 用 onclick 赋值(非 addEventListener), 天然幂等 ✅
- 页面退出后动画: 展示台 RAF 随 DOM 断开自停 ✓
- 计时器: 弹窗/节流计时器走 game.time 游戏时钟 ✓
- 每帧垃圾: 热循环零分配(scratch 矩阵/向量复用, V12 已优化) ✅

## 结论
性能基线保持(V13 97 → V14 103, 预算内); 无需盲目优化。
真实手机数据未测(无设备, 如实记录)。
