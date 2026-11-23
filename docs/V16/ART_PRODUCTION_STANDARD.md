# V16 · 美术生产标准 (ART_PRODUCTION_STANDARD)

延续 V14 ASSET_PRODUCTION_STANDARD.md 全部条款, 本轮增补:

## 士兵职业辨识标准
- 染色基准: CLASS_DEFS.color(rifleman #4DA8FF / gunner #FF8844 / marksman
  #9C4DFF / medic #39D98A) — 战场乘法 tint 与 UI 身份色同源, 玩家建立
  "颜色=职业"的一致认知;
- 附件语义: gunner=重装(肩甲+胸甲) / marksman=精确(帽+弹链) / medic=救护
  (白包红十字) / rifleman=标准(无附件, 基线);
- 附件仅 hero 银行(≤100 人)渲染, LOD 不渲染 — 大编制性能优先;
- 白色+红色组合(medic)使用顶点色而非贴图 — 保持程序化管线一致性。
