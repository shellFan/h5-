# 膨胀小队 — 微信小游戏 V1.0

本目录为**构建产物**（源于仓库根目录 `tools/build-wechat.js`），可直接导入微信开发者工具。

## 快速开始

1. 微信开发者工具 → 导入项目 → 选择本目录
2. AppID 用测试号（或右上角详情里切换）
3. 编译运行

上线前必填：
- `project.config.json` → `appid`
- `game-config.js` → `ads.wechat.rewardVideo`（留空则广告如实不可用）

## 目录结构

| 文件 | 说明 |
|---|---|
| `game.js` | 入口：wx 环境装配 + minidom UI 引擎挂载 + THREE 接线 + 触控/生命周期桥接 |
| `minidom.js` | UI 引擎（虚拟 DOM + CSS 级联 + flex 布局 + canvas 光栅化 + SVG/滚动/动画） |
| `ui-dom.js` / `ui-css.js` | index.html 转出的 UI 树 + 4 张样式表原文（视觉与 H5 同源） |
| `game-bundle.js` | 全部游戏脚本单作用域拼接（与 H5 同源核心代码） |
| `game-config.js` | 平台配置（广告位 ID / 版本号） |
| `libs/three.min.js` | Three.js r149 |
| `assets/` | 模型分包（26 个运行时 GLB + 头像 SVG；清单 `assets-manifest.json`） |

## 与 H5 的关系

同一份游戏核心（js/*.js），平台差异全部收敛在入口与适配层 —— 战斗数值、玩法、
存档结构完全一致。修改游戏代码请改仓库根目录 `js/`，再重新构建。

## 文档

- 架构：`docs/WeChat/WECHAT_ARCHITECTURE.md`
- 构建：`docs/WeChat/WECHAT_BUILD_GUIDE.md`
- 兼容性：`docs/WeChat/WECHAT_COMPATIBILITY.md`
- 测试：`docs/WeChat/WECHAT_TEST_REPORT.md`
- 发布清单：`docs/WeChat/WECHAT_RELEASE_CHECKLIST.md`
