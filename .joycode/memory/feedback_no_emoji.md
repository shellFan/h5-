---
name: 禁止使用Emoji
description: 用户明确要求所有UI和游戏内容中不得使用Emoji，必须用CSS/Canvas等纯代码绘制替代
type: feedback
---

游戏中禁止使用任何Emoji字符（如🚩🎯💥等），所有视觉元素必须用纯代码实现。

**Why:** 用户在美术规范中将"禁止使用Emoji"列为质量要求，曾因进度条旗标使用🚩被要求修改。

**How to apply:** 需要图标/旗帜/装饰元素时，使用CSS绘制（border三角、矩形组合）、Canvas纹理或Three.js几何体，绝不使用Unicode Emoji字符。