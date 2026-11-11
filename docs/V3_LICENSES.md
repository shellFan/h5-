# 资源与许可证清单

| 资源 | 来源 | 许可证 | 使用位置 |
|------|------|--------|---------|
| three.js r149 (libs/three.min.js, js/vendor/three.min.js) | https://github.com/mrdoob/three.js (MIT) | MIT © 2010-2024 three.js authors | 3D渲染 |
| assets/art-v1/*.svg (soldier-avatar / zombie-avatar / bullet-glow / gate-panel) | 本仓库原创(提交 9c17281/a6f07c7/8aa5c9d/fa64469) | 项目自有 | UI头像/弹道纹理参考/门面板参考 |
| 3D 模型/材质/道路纹理/文字贴图 | 全部程序化生成(THREE几何体+Canvas2D), 无外部素材 | 项目自有 | 全部场景 |
| 音效 | WebAudio 程序化合成(oscillator), 无音频文件 | 项目自有 | H5端 |

- 未使用任何外部图片/音频/模型文件; 无从参考截图直接抠图作为素材。
- 字体: 系统字体栈(PingFang SC / Microsoft YaHei / Arial), 无内嵌字体文件。
- Playwright-core: MIT (仅测试工具链, 不进入运行时产物)。

## 敏感信息检查

- 无 API Key / 签名 / AppSecret 入库
- 广告位ID(`DOUYIN_AD_UNITS.rewardVideo`)为空占位, 上线时由平台分配后填入 game-config.js(dist产物), 源码 douyin-ad.js 顶部 TODO 已标注
- 无后端服务/无网络请求(除可选CDN兜底)
