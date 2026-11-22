# V14 · 素材生产标准 (ASSET_PRODUCTION_STANDARD)

> 后续任何 Agent 产出素材前必须阅读; 与 .agents/skills/create-game-assets 联合使用。

## 1. 管线选择(按可用工具降级)
1. Blender 可用 → 建模/UV/烘焙 → glTF 2.0 导出(自包含贴图, 单文件 GLB)。
2. 无 Blender → **程序化生成管线**(本项目现行): tools/v14-weapon-glb.js 模式 —
   纯 Node 写 glTF 2.0 GLB(POSITION+NORMAL+indices, pbrMetallicRoughness 嵌套规范),
   零外部纹理依赖; 生成脚本必须入库可复跑。

## 2. GLB 规范(血泪教训, 必须遵守)
- 材质因子必须嵌套 `pbrMetallicRoughness`(根级 baseColorFactor 会被加载器忽略 → 死白);
- **必须有 NORMAL 属性**(缺失 → 无法光照, 渲染死白);
- metalness>0.5 的材质运行时必须有 envMap(展示台用 PMREM 渐变), 否则死黑;
- 单文件自包含, 尺寸预算: 单模型 ≤ 8KB(武器级) / 上限 500KB(角色级);
- 枪口统一 -Z 朝向, 世界单位一致。

## 3. 实例化视觉变体规范(怪物/士兵)
- 变体三通道(按成本递增): ① 实例染色(零成本, 乘法系数保持贴图质感, 偏移≤±12%);
  ② 轮廓抖动(仅躯干/头/臂, 腿不动防悬空); ③ 程序化附件(独立 InstancedMesh 库,
  按需可见, 头局部空间挂接, 实机截图校准偏移)。
- 变体种子必须确定性(enemy.phase), 同一实体每帧一致。
- 状态色(精英/自爆/冰冻/受击)永远覆盖在变体色之上, 优先级不乱。

## 4. 主题道具规范(地图)
- 每主题一个道具包 = 若干 InstancedMesh 类别(entry.themes 声明归属);
- 装饰只在 |x|≥4.8 路外区; 不产生新碰撞体; 不动 LEVELS 结构;
- 发光材质打 __noThemeTint 标记防主题染色压暗;
- 地面纹理含三车道虚线(跑道可读性红线);
- 远景剪影补地平线(每主题 1 类别 1 drawCall)。

## 5. 微信 minidom 兼容红线(每条都有血泪案例)
- CSS 禁用 `:not(:empty)` 等 minidom 不支持的伪类 — 用 JS 管理类名替代;
- 真实 DOM 节点(如真实 canvas)禁止 appendChild 进 minidom 树 — 会污染样式引擎
  (症状: bg-image 全部不加载); H5-only 组件必须用 `typeof wx`/`window.__minidom`
  双守卫;
- 新 js 文件必须同时登记 index.html + tools/build-h5.js + build-wechat.js +
  build-douyin.js 四处清单;
- 每轮必须跑 wechat-emulator(20 项)而不是只跑 H5。

## 6. 质检流程(每个素材走完才算完成)
生成 → GLB/图片检查(尺寸/材质/法线) → 接入 → 实机运行 → 截图(实机非设计稿) →
性能核对(draw call/堆内存) → 登记 ASSET_MANIFEST.md → Git 提交。
