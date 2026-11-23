# V14 · 怪物升级报告 (MONSTER_REPORT)

## 普通感染者(normal): 3+ 变体达成
肤色族 ×5(基绿/暖橙/苍白绿/青灰/黄绿) · 体宽±5% · 前倾±9° · 军盔附件 24%。

## 快速型(fast): 2+ 变体达成
肤色族 ×4 · 轮廓抖动 · 便帽附件 18%。

## 重装型(shield/split): 2+ 变体达成
肤色族 ×3/×3 · 肩甲附件 50%/35%。

## 吐酸型(spitter): 变体达成
肤色族 ×4(毒性绿/黄绿/青灰), 保留 V12 纹理发光。

## 精英怪(elite)
保留金染+金环(V13), 变体染色按设计跳过(精英需纯净金色识别)。

## Boss(6 型)
GLB 资产(V12)保留; 入场演出钩子(spawnT 完成: 震屏+冲击波+爆闪+余烬, 一次性);
死亡 tier4 爆炸; 冰冻/阶段染色/护盾能量壳全部保留。六型模型各自独立(非普通怪放大)。

## 动画
保留刚性部件动画(腿部摆动/挥臂/头部晃动/受击缩放冲击); 相位由 e.phase 决定,
大量怪物不会同相位 ✓(既有机制确认)。

## V14.2 补充(第二轮)

- **Boss 造型辨识表** BOSS_PRESENTATION: 六型专属染色/体态/附件/入场特效色;
  逐型实机截图确认独立造型(bruiser 橙拳/bulwark 钢盾/hivelord 紫胀腹+背囊/
  overlord 紫黑+双角/spitking 酸绿/titan 灰甲白角巨人)。
- **僵尸体型 Rig** BODY_RIGS: standard/brute/huncher/wiry 四族骨架姿态,
  fast=wiry 偏多, shield/split=brute 偏多; 彻底解决"变体只是颜色不同"。
- **审计披露**: Boss GLB 异步续载未就绪时以 normal 模型渲染(V12 既有行为,
  数秒后自行换回; 探针与验收必须等待 EnemyModelLoader.get().styles[style] 就绪)。
