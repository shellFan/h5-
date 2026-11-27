// ===== game-bundle.js (V12 微信小游戏构建产物: 单一模块作用域, 源脚本按 index.html 顺序拼接) =====
// 生成: tools/build-wechat.js @ 2026-11-27T18:01:25.427Z
// 代码与 H5 完全同源; 平台差异收敛于入口 game.js
/* ==== index.html 内联脚本(BootProgress/错误横幅, H5 中先于业务脚本执行 — 保序) ==== */

        // V11 QA: 游戏版本标识(首页品牌栏读取; 与package.json同步维护)
        window.__GAME_VERSION = 'v14.0';
        // V16: 横屏引导控制器(触屏设备 + 横屏 + 矮屏 三条件; 桌面不受影响)
        (function () {
            var update = function () {
                var el = document.getElementById('orientation-hint');
                if (!el) return;
                var touch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
                var landscapeShort = window.innerHeight < 500 && window.innerWidth > window.innerHeight;
                el.classList.toggle('v16-show', !!(touch && landscapeShort));
            };
            window.addEventListener('resize', update);
            window.addEventListener('orientationchange', update);
            if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', update);
            else update();
        })();
        // VNext: 加载进度追踪器(被 soldier-loader / enemy-models 调用; 仅统计真实文件进度, 无定时器伪造)
        window.__BootProgress = {
            files: {}, total: 6, // Soldier hero/LOD + normal/fast hero/LOD
            _done: false,
            file: function(url, loaded, total) {
                // V15修复: done() 闩锁 — 后台续载的进度事件不得把"准备完毕!100%"
                // 回写成"加载中 n/26"(加载屏曾出现完成态→加载态的视觉回退闪动)
                if (this._done) return;
                this.files[url] = { loaded: loaded, total: total };
                var sum = 0, done = 0;
                for (var k in this.files) {
                    var f = this.files[k];
                    sum += Math.min(1, f.loaded / Math.max(1, f.total));
                    if (f.loaded >= f.total) done++;
                }
                var pct = Math.min(99, Math.round(sum / this.total * 100));
                var bar = document.getElementById('boot-bar-fill');
                var pctEl = document.getElementById('boot-pct');
                if (bar) bar.style.width = pct + '%';
                if (pctEl) pctEl.textContent = pct + '%';
                var stage = document.getElementById('boot-stage');
                if (stage && done < this.total) {
                    stage.textContent = '加载战场资源 ' + done + '/' + this.total + ' (士兵/僵尸/Boss模型)';
                }
            },
            stage: function(text, pct) {
                var stage = document.getElementById('boot-stage');
                var pctEl = document.getElementById('boot-pct');
                var bar = document.getElementById('boot-bar-fill');
                if (stage) stage.textContent = text;
                if (pctEl && pct !== undefined) pctEl.textContent = pct + '%';
                if (bar && pct !== undefined) bar.style.width = pct + '%';
            },
            done: function() {
                this._done = true; // V15: 闩锁完成态
                var bar = document.getElementById('boot-bar-fill');
                var pctEl = document.getElementById('boot-pct');
                if (bar) bar.style.width = '100%';
                if (pctEl) pctEl.textContent = '100%';
            }
        };
    
;

        // 全局错误捕获: 将JS错误显示在页面上便于诊断
        window.addEventListener('error', function(e) {
            var div = document.getElementById('error-display');
            if (!div) {
                div = document.createElement('div');
                div.id = 'error-display';
                div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:8px 12px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
                document.body.appendChild(div);
            }
            div.textContent += (div.textContent ? '\n' : '') + '[错误] ' + e.message + (e.filename ? ' (' + e.filename.split('/').pop() + ':' + e.lineno + ')' : '');
        });
    
/* ==== THREE 加载检测(H5 中位于 three.min.js 之后 — THREE 已由入口接线) ==== */

        // 检测Three.js是否加载成功
        if (typeof THREE === 'undefined') {
            document.addEventListener('DOMContentLoaded', function() {
                var div = document.getElementById('error-display');
                if (!div) {
                    div = document.createElement('div');
                    div.id = 'error-display';
                    div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:8px 12px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
                    document.body.appendChild(div);
                }
                div.textContent = '[错误] Three.js 本地文件缺失，请检查部署完整性';
            });
        }
    

/* ===== [[ assets/game/catalog.js ]] ===== */
var ArtAssetCatalog = [
  {
    "id": "source-01",
    "category": "effects",
    "title": "Game combat VFX sprite sheet",
    "path": "art-gallery/game_combat_vfx_sprite_sheet_d2833228.webp",
    "fallbackPath": "art-gallery/game_combat_vfx_sprite_sheet_d2833228.jpg",
    "role": "reference",
    "source_id": 1
  },
  {
    "id": "source-02",
    "category": "gameplay",
    "title": "3D game multiplier gates asset",
    "path": "art-gallery/3d_game_multiplier_gates_asset_e44638c9.webp",
    "fallbackPath": "art-gallery/3d_game_multiplier_gates_asset_e44638c9.jpg",
    "role": "reference",
    "source_id": 2
  },
  {
    "id": "source-03",
    "category": "ui",
    "title": "3D game UI asset sheet",
    "path": "art-gallery/3d_game_ui_asset_sheet_3b8190b1.webp",
    "fallbackPath": "art-gallery/3d_game_ui_asset_sheet_3b8190b1.jpg",
    "role": "reference",
    "source_id": 3
  },
  {
    "id": "source-04",
    "category": "ui",
    "title": "3D game UI asset sheet",
    "path": "art-gallery/3d_game_ui_asset_sheet_91d99e4c.webp",
    "fallbackPath": "art-gallery/3d_game_ui_asset_sheet_91d99e4c.jpg",
    "role": "reference",
    "source_id": 4
  },
  {
    "id": "source-05",
    "category": "ui",
    "title": "Game UI asset sheet green",
    "path": "art-gallery/game_ui_asset_sheet_green_635c7ff5.webp",
    "fallbackPath": "art-gallery/game_ui_asset_sheet_green_635c7ff5.jpg",
    "role": "reference",
    "source_id": 5
  },
  {
    "id": "source-06",
    "category": "effects",
    "title": "Gold coins bursting upward",
    "path": "art-gallery/gold_coins_bursting_upward_f57548f2.webp",
    "fallbackPath": "art-gallery/gold_coins_bursting_upward_f57548f2.jpg",
    "role": "reference",
    "source_id": 6
  },
  {
    "id": "source-07",
    "category": "effects",
    "title": "Gunfire muzzle flashes particle",
    "path": "art-gallery/gunfire_muzzle_flashes_particle_113fe16c.webp",
    "fallbackPath": "art-gallery/gunfire_muzzle_flashes_particle_113fe16c.jpg",
    "role": "reference",
    "source_id": 7
  },
  {
    "id": "source-08",
    "category": "effects",
    "title": "Explosion VFX with debris and",
    "path": "art-gallery/explosion_vfx_with_debris_and_87e5f30f.webp",
    "fallbackPath": "art-gallery/explosion_vfx_with_debris_and_87e5f30f.jpg",
    "role": "reference",
    "source_id": 8
  },
  {
    "id": "source-09",
    "category": "effects",
    "title": "Bullet trails glowing laser streaks",
    "path": "art-gallery/bullet_trails_glowing_laser_streaks_91395c98.webp",
    "fallbackPath": "art-gallery/bullet_trails_glowing_laser_streaks_91395c98.jpg",
    "role": "reference",
    "source_id": 9
  },
  {
    "id": "source-10",
    "category": "effects",
    "title": "Golden rays level up aura",
    "path": "art-gallery/golden_rays_level_up_aura_20863dc0.webp",
    "fallbackPath": "art-gallery/golden_rays_level_up_aura_20863dc0.jpg",
    "role": "reference",
    "source_id": 10
  },
  {
    "id": "source-11",
    "category": "effects",
    "title": "Game particle hit sparks asset",
    "path": "art-gallery/game_particle_hit_sparks_asset_3cad9b0a.webp",
    "fallbackPath": "art-gallery/game_particle_hit_sparks_asset_3cad9b0a.jpg",
    "role": "reference",
    "source_id": 11
  },
  {
    "id": "source-12",
    "category": "effects",
    "title": "Boss death mechanical explosion",
    "path": "art-gallery/boss_death_mechanical_explosion_854a83bb.webp",
    "fallbackPath": "art-gallery/boss_death_mechanical_explosion_854a83bb.jpg",
    "role": "reference",
    "source_id": 12
  },
  {
    "id": "source-13",
    "category": "effects",
    "title": "Boss entrance particle effect asset",
    "path": "art-gallery/boss_entrance_particle_effect_asset_325f54e3.webp",
    "fallbackPath": "art-gallery/boss_entrance_particle_effect_asset_325f54e3.jpg",
    "role": "reference",
    "source_id": 13
  },
  {
    "id": "source-14",
    "category": "ui",
    "title": "Defeat popup UI window",
    "path": "art-gallery/defeat_popup_ui_window_1077a0c5.webp",
    "fallbackPath": "art-gallery/defeat_popup_ui_window_1077a0c5.jpg",
    "role": "reference",
    "source_id": 14
  },
  {
    "id": "source-15",
    "category": "ui",
    "title": "Mobile game leaderboard UI screen",
    "path": "art-gallery/mobile_game_leaderboard_ui_screen_239141aa.webp",
    "fallbackPath": "art-gallery/mobile_game_leaderboard_ui_screen_239141aa.jpg",
    "role": "reference",
    "source_id": 15
  },
  {
    "id": "source-16",
    "category": "ui",
    "title": "Mobile game combat HUD UI",
    "path": "art-gallery/mobile_game_combat_hud_ui_49d770df.webp",
    "fallbackPath": "art-gallery/mobile_game_combat_hud_ui_49d770df.jpg",
    "role": "reference",
    "source_id": 16
  },
  {
    "id": "source-17",
    "category": "ui",
    "title": "Victory popup UI window",
    "path": "art-gallery/victory_popup_ui_window_df2096f3.webp",
    "fallbackPath": "art-gallery/victory_popup_ui_window_df2096f3.jpg",
    "role": "reference",
    "source_id": 17
  },
  {
    "id": "source-18",
    "category": "ui",
    "title": "3D Mobile Game Settings UI",
    "path": "art-gallery/3d_mobile_game_settings_ui_76f99ce0.webp",
    "fallbackPath": "art-gallery/3d_mobile_game_settings_ui_76f99ce0.jpg",
    "role": "reference",
    "source_id": 18
  },
  {
    "id": "source-19",
    "category": "ui",
    "title": "Mobile game main menu layout",
    "path": "art-gallery/mobile_game_main_menu_layout_24896b5e.webp",
    "fallbackPath": "art-gallery/mobile_game_main_menu_layout_24896b5e.jpg",
    "role": "reference",
    "source_id": 19
  },
  {
    "id": "source-20",
    "category": "ui",
    "title": "Game upgrade UI panel",
    "path": "art-gallery/game_upgrade_ui_panel_3cdb96f6.webp",
    "fallbackPath": "art-gallery/game_upgrade_ui_panel_3cdb96f6.jpg",
    "role": "reference",
    "source_id": 20
  },
  {
    "id": "source-21",
    "category": "ui",
    "title": "Shop UI screen grid items",
    "path": "art-gallery/shop_ui_screen_grid_items_d8d6c9d5.webp",
    "fallbackPath": "art-gallery/shop_ui_screen_grid_items_d8d6c9d5.jpg",
    "role": "reference",
    "source_id": 21
  },
  {
    "id": "source-22",
    "category": "ui",
    "title": "3D game reward chest banner",
    "path": "art-gallery/3d_game_reward_chest_banner_1caa2ddb.webp",
    "fallbackPath": "art-gallery/3d_game_reward_chest_banner_1caa2ddb.jpg",
    "role": "reference",
    "source_id": 22
  },
  {
    "id": "source-23",
    "category": "ui",
    "title": "3D game icon asset sheet",
    "path": "art-gallery/3d_game_icon_asset_sheet_8a64239f.webp",
    "fallbackPath": "art-gallery/3d_game_icon_asset_sheet_8a64239f.jpg",
    "role": "reference",
    "source_id": 23
  },
  {
    "id": "source-24",
    "category": "ui",
    "title": "Game leaderboard badges and frames",
    "path": "art-gallery/game_leaderboard_badges_and_frames_bcd47cc0.webp",
    "fallbackPath": "art-gallery/game_leaderboard_badges_and_frames_bcd47cc0.jpg",
    "role": "reference",
    "source_id": 24
  },
  {
    "id": "source-25",
    "category": "ui",
    "title": "3D game icon asset sheet",
    "path": "art-gallery/3d_game_icon_asset_sheet_82f32e58.webp",
    "fallbackPath": "art-gallery/3d_game_icon_asset_sheet_82f32e58.jpg",
    "role": "reference",
    "source_id": 25
  },
  {
    "id": "source-26",
    "category": "weapons",
    "title": "Toy military weapons icon sheet",
    "path": "art-gallery/toy_military_weapons_icon_sheet_646139ec.webp",
    "fallbackPath": "art-gallery/toy_military_weapons_icon_sheet_646139ec.jpg",
    "role": "reference",
    "source_id": 26
  },
  {
    "id": "source-27",
    "category": "weapons",
    "title": "Weapon asset design sheet",
    "path": "art-gallery/weapon_asset_design_sheet_3827c811.webp",
    "fallbackPath": "art-gallery/weapon_asset_design_sheet_3827c811.jpg",
    "role": "reference",
    "source_id": 27
  },
  {
    "id": "source-28",
    "category": "weapons",
    "title": "Sniper rifle progression design",
    "path": "art-gallery/sniper_rifle_progression_design_46e71ee1.webp",
    "fallbackPath": "art-gallery/sniper_rifle_progression_design_46e71ee1.jpg",
    "role": "reference",
    "source_id": 28
  },
  {
    "id": "source-29",
    "category": "weapons",
    "title": "Rocket launcher design asset",
    "path": "art-gallery/rocket_launcher_design_asset_e2ffd857.webp",
    "fallbackPath": "art-gallery/rocket_launcher_design_asset_e2ffd857.jpg",
    "role": "reference",
    "source_id": 29
  },
  {
    "id": "source-30",
    "category": "weapons",
    "title": "Grenade launcher weapon design s",
    "path": "art-gallery/grenade_launcher_weapon_design_s_3171317b.webp",
    "fallbackPath": "art-gallery/grenade_launcher_weapon_design_s_3171317b.jpg",
    "role": "reference",
    "source_id": 30
  },
  {
    "id": "source-31",
    "category": "weapons",
    "title": "Laser rifle design sheet progres",
    "path": "art-gallery/laser_rifle_design_sheet_progres_f05c1816.webp",
    "fallbackPath": "art-gallery/laser_rifle_design_sheet_progres_f05c1816.jpg",
    "role": "reference",
    "source_id": 31
  },
  {
    "id": "source-32",
    "category": "weapons",
    "title": "Gatling gun asset design sheet",
    "path": "art-gallery/gatling_gun_asset_design_sheet_edb93245.webp",
    "fallbackPath": "art-gallery/gatling_gun_asset_design_sheet_edb93245.jpg",
    "role": "reference",
    "source_id": 32
  },
  {
    "id": "source-33",
    "category": "weapons",
    "title": "Assault rifle weapon design sheet",
    "path": "art-gallery/assault_rifle_weapon_design_sheet_c5c8d455.webp",
    "fallbackPath": "art-gallery/assault_rifle_weapon_design_sheet_c5c8d455.jpg",
    "role": "reference",
    "source_id": 33
  },
  {
    "id": "source-34",
    "category": "weapons",
    "title": "Shotgun weapon design progressio",
    "path": "art-gallery/shotgun_weapon_design_progressio_d83ed789.webp",
    "fallbackPath": "art-gallery/shotgun_weapon_design_progressio_d83ed789.jpg",
    "role": "reference",
    "source_id": 34
  },
  {
    "id": "source-35",
    "category": "weapons",
    "title": "Submachine gun progression sheet",
    "path": "art-gallery/submachine_gun_progression_sheet_4a601561.webp",
    "fallbackPath": "art-gallery/submachine_gun_progression_sheet_4a601561.jpg",
    "role": "reference",
    "source_id": 35
  },
  {
    "id": "source-36",
    "category": "weapons",
    "title": "Heavy machine gun design sheet",
    "path": "art-gallery/heavy_machine_gun_design_sheet_8f21568e.webp",
    "fallbackPath": "art-gallery/heavy_machine_gun_design_sheet_8f21568e.jpg",
    "role": "reference",
    "source_id": 36
  },
  {
    "id": "source-37",
    "category": "weapons",
    "title": "Plasma cannon design progression",
    "path": "art-gallery/plasma_cannon_design_progression_43e66a48.webp",
    "fallbackPath": "art-gallery/plasma_cannon_design_progression_43e66a48.jpg",
    "role": "reference",
    "source_id": 37
  },
  {
    "id": "source-38",
    "category": "weapons",
    "title": "Railgun weapon asset design sheet",
    "path": "art-gallery/railgun_weapon_asset_design_sheet_5eca0af5.webp",
    "fallbackPath": "art-gallery/railgun_weapon_asset_design_sheet_5eca0af5.jpg",
    "role": "reference",
    "source_id": 38
  },
  {
    "id": "source-39",
    "category": "enemies",
    "title": "Cartoon monster game sprite sheet",
    "path": "art-gallery/cartoon_monster_game_sprite_sheet_17f803de.webp",
    "fallbackPath": "art-gallery/cartoon_monster_game_sprite_sheet_17f803de.jpg",
    "role": "reference",
    "source_id": 39
  },
  {
    "id": "source-40",
    "category": "enemies",
    "title": "Green toxic blob monster dripping",
    "path": "art-gallery/green_toxic_blob_monster_dripping_96bc028b.webp",
    "fallbackPath": "art-gallery/green_toxic_blob_monster_dripping_96bc028b.jpg",
    "role": "reference",
    "source_id": 40
  },
  {
    "id": "source-41",
    "category": "enemies",
    "title": "Red monster wearing spiked armor",
    "path": "art-gallery/red_monster_wearing_spiked_armor_687d1791.webp",
    "fallbackPath": "art-gallery/red_monster_wearing_spiked_armor_687d1791.jpg",
    "role": "reference",
    "source_id": 41
  },
  {
    "id": "source-42",
    "category": "enemies",
    "title": "Bomb monster with ticking fuse",
    "path": "art-gallery/bomb_monster_with_ticking_fuse_98b4d3de.webp",
    "fallbackPath": "art-gallery/bomb_monster_with_ticking_fuse_98b4d3de.jpg",
    "role": "reference",
    "source_id": 42
  },
  {
    "id": "source-43",
    "category": "enemies",
    "title": "Orange mutant monster asset",
    "path": "art-gallery/orange_mutant_monster_asset_f981d5e7.webp",
    "fallbackPath": "art-gallery/orange_mutant_monster_asset_f981d5e7.jpg",
    "role": "reference",
    "source_id": 43
  },
  {
    "id": "source-44",
    "category": "enemies",
    "title": "Purple cartoon monster game asset",
    "path": "art-gallery/purple_cartoon_monster_game_asset_3a0bbbda.webp",
    "fallbackPath": "art-gallery/purple_cartoon_monster_game_asset_3a0bbbda.jpg",
    "role": "reference",
    "source_id": 44
  },
  {
    "id": "source-45",
    "category": "enemies",
    "title": "Armored mecha monster game asset",
    "path": "art-gallery/armored_mecha_monster_game_asset_96179c59.webp",
    "fallbackPath": "art-gallery/armored_mecha_monster_game_asset_96179c59.jpg",
    "role": "reference",
    "source_id": 45
  },
  {
    "id": "source-46",
    "category": "enemies",
    "title": "Mecha T-Rex character design sheet",
    "path": "art-gallery/mecha_t_rex_character_design_sheet_39d41347.webp",
    "fallbackPath": "art-gallery/mecha_t_rex_character_design_sheet_39d41347.jpg",
    "role": "reference",
    "source_id": 46
  },
  {
    "id": "source-47",
    "category": "enemies",
    "title": "Tank robot character design sheet",
    "path": "art-gallery/tank_robot_character_design_sheet_dc7c17c0.webp",
    "fallbackPath": "art-gallery/tank_robot_character_design_sheet_dc7c17c0.jpg",
    "role": "reference",
    "source_id": 47
  },
  {
    "id": "source-48",
    "category": "enemies",
    "title": "Mutant gorilla character design",
    "path": "art-gallery/mutant_gorilla_character_design_50a274d3.webp",
    "fallbackPath": "art-gallery/mutant_gorilla_character_design_50a274d3.jpg",
    "role": "reference",
    "source_id": 48
  },
  {
    "id": "source-49",
    "category": "enemies",
    "title": "Mecha robot design sheet",
    "path": "art-gallery/mecha_robot_design_sheet_cce753aa.webp",
    "fallbackPath": "art-gallery/mecha_robot_design_sheet_cce753aa.jpg",
    "role": "reference",
    "source_id": 49
  },
  {
    "id": "source-50",
    "category": "enemies",
    "title": "Mecha behemoth character design",
    "path": "art-gallery/mecha_behemoth_character_design_06bb52c7.webp",
    "fallbackPath": "art-gallery/mecha_behemoth_character_design_06bb52c7.jpg",
    "role": "reference",
    "source_id": 50
  },
  {
    "id": "source-51",
    "category": "marketing",
    "title": "Toy soldiers fighting cartoon mo",
    "path": "art-gallery/toy_soldiers_fighting_cartoon_mo_0fe3b85a.webp",
    "fallbackPath": "art-gallery/toy_soldiers_fighting_cartoon_mo_0fe3b85a.jpg",
    "role": "reference",
    "source_id": 51
  },
  {
    "id": "source-55",
    "category": "marketing",
    "title": "Soldiers shooting enemy robot bugs",
    "path": "art-gallery/soldiers_shooting_enemy_robot_bugs_a51af57e.webp",
    "fallbackPath": "art-gallery/soldiers_shooting_enemy_robot_bugs_a51af57e.jpg",
    "role": "reference",
    "source_id": 55
  },
  {
    "id": "source-56",
    "category": "marketing",
    "title": "Soldiers shooting robot bugs",
    "path": "art-gallery/soldiers_shooting_robot_bugs_0f6ccbd5.webp",
    "fallbackPath": "art-gallery/soldiers_shooting_robot_bugs_0f6ccbd5.jpg",
    "role": "reference",
    "source_id": 56
  },
  {
    "id": "source-57",
    "category": "marketing",
    "title": "Toy soldiers charging down road",
    "path": "art-gallery/toy_soldiers_charging_down_road_86cf4255.webp",
    "fallbackPath": "art-gallery/toy_soldiers_charging_down_road_86cf4255.jpg",
    "role": "reference",
    "source_id": 57
  },
  {
    "id": "source-59",
    "category": "marketing",
    "title": "Mech soldiers charging in factory",
    "path": "art-gallery/mech_soldiers_charging_in_factory_462985a6.webp",
    "fallbackPath": "art-gallery/mech_soldiers_charging_in_factory_462985a6.jpg",
    "role": "reference",
    "source_id": 59
  },
  {
    "id": "source-60",
    "category": "marketing",
    "title": "Sci-fi mech squad fighting boss",
    "path": "art-gallery/sci_fi_mech_squad_fighting_boss_01f87b64.webp",
    "fallbackPath": "art-gallery/sci_fi_mech_squad_fighting_boss_01f87b64.jpg",
    "role": "reference",
    "source_id": 60
  },
  {
    "id": "source-61",
    "category": "marketing",
    "title": "Squad fighting zombies in city",
    "path": "art-gallery/squad_fighting_zombies_in_city_84b59619.webp",
    "fallbackPath": "art-gallery/squad_fighting_zombies_in_city_84b59619.jpg",
    "role": "reference",
    "source_id": 61
  },
  {
    "id": "source-62",
    "category": "marketing",
    "title": "Soldiers fighting zombies in bunker",
    "path": "art-gallery/soldiers_fighting_zombies_in_bunker_13c70f3a.webp",
    "fallbackPath": "art-gallery/soldiers_fighting_zombies_in_bunker_13c70f3a.jpg",
    "role": "reference",
    "source_id": 62
  },
  {
    "id": "source-63",
    "category": "marketing",
    "title": "Green toy soldier holding rifle",
    "path": "art-gallery/green_toy_soldier_holding_rifle_3b540778.webp",
    "fallbackPath": "art-gallery/green_toy_soldier_holding_rifle_3b540778.jpg",
    "role": "reference",
    "source_id": 63
  },
  {
    "id": "source-64",
    "category": "marketing",
    "title": "Toy soldiers firing weapons",
    "path": "art-gallery/toy_soldiers_firing_weapons_2b4449f3.webp",
    "fallbackPath": "art-gallery/toy_soldiers_firing_weapons_2b4449f3.jpg",
    "role": "reference",
    "source_id": 64
  },
  {
    "id": "source-65",
    "category": "environment",
    "title": "3D game modular environment props",
    "path": "art-gallery/3d_game_modular_environment_props_5fd99a9c.webp",
    "fallbackPath": "art-gallery/3d_game_modular_environment_props_5fd99a9c.jpg",
    "role": "reference",
    "source_id": 65
  },
  {
    "id": "source-66",
    "category": "environment",
    "title": "3D military battleground map sho",
    "path": "art-gallery/3d_military_battleground_map_sho_67f2fe30.webp",
    "fallbackPath": "art-gallery/3d_military_battleground_map_sho_67f2fe30.jpg",
    "role": "reference",
    "source_id": 66
  },
  {
    "id": "source-67",
    "category": "environment",
    "title": "Golden energy platform in space",
    "path": "art-gallery/golden_energy_platform_in_space_8c8c2c64.webp",
    "fallbackPath": "art-gallery/golden_energy_platform_in_space_8c8c2c64.jpg",
    "role": "reference",
    "source_id": 67
  },
  {
    "id": "source-68",
    "category": "environment",
    "title": "Sunny military base game map",
    "path": "art-gallery/sunny_military_base_game_map_98a69a46.webp",
    "fallbackPath": "art-gallery/sunny_military_base_game_map_98a69a46.jpg",
    "role": "reference",
    "source_id": 68
  },
  {
    "id": "source-69",
    "category": "environment",
    "title": "Ruined urban avenue background",
    "path": "art-gallery/ruined_urban_avenue_background_9d5622e0.webp",
    "fallbackPath": "art-gallery/ruined_urban_avenue_background_9d5622e0.jpg",
    "role": "reference",
    "source_id": 69
  },
  {
    "id": "source-70",
    "category": "environment",
    "title": "Forest military camp game map",
    "path": "art-gallery/forest_military_camp_game_map_02f67f12.webp",
    "fallbackPath": "art-gallery/forest_military_camp_game_map_02f67f12.jpg",
    "role": "reference",
    "source_id": 70
  },
  {
    "id": "source-71",
    "category": "environment",
    "title": "Snow military base game map",
    "path": "art-gallery/snow_military_base_game_map_b51bd919.webp",
    "fallbackPath": "art-gallery/snow_military_base_game_map_b51bd919.jpg",
    "role": "reference",
    "source_id": 71
  },
  {
    "id": "source-72",
    "category": "environment",
    "title": "Desert training base map background",
    "path": "art-gallery/desert_training_base_map_background_2deaba68.webp",
    "fallbackPath": "art-gallery/desert_training_base_map_background_2deaba68.jpg",
    "role": "reference",
    "source_id": 72
  },
  {
    "id": "source-73",
    "category": "environment",
    "title": "Volcano research base game map",
    "path": "art-gallery/volcano_research_base_game_map_18bd70de.webp",
    "fallbackPath": "art-gallery/volcano_research_base_game_map_18bd70de.jpg",
    "role": "reference",
    "source_id": 73
  },
  {
    "id": "source-74",
    "category": "environment",
    "title": "Industrial factory game map back",
    "path": "art-gallery/industrial_factory_game_map_back_c37df917.webp",
    "fallbackPath": "art-gallery/industrial_factory_game_map_back_c37df917.jpg",
    "role": "reference",
    "source_id": 74
  },
  {
    "id": "source-75",
    "category": "environment",
    "title": "Green grass lawn tile",
    "path": "art-gallery/green_grass_lawn_tile_d39dd91f.webp",
    "fallbackPath": "art-gallery/green_grass_lawn_tile_d39dd91f.jpg",
    "role": "reference",
    "source_id": 75
  },
  {
    "id": "source-76",
    "category": "environment",
    "title": "Military roadblock barrier game",
    "path": "art-gallery/military_roadblock_barrier_game_73cae8a9.webp",
    "fallbackPath": "art-gallery/military_roadblock_barrier_game_73cae8a9.jpg",
    "role": "reference",
    "source_id": 76
  },
  {
    "id": "source-77",
    "category": "environment",
    "title": "Wooden watchtower with searchlight",
    "path": "art-gallery/wooden_watchtower_with_searchlight_6fcba15b.webp",
    "fallbackPath": "art-gallery/wooden_watchtower_with_searchlight_6fcba15b.jpg",
    "role": "reference",
    "source_id": 77
  },
  {
    "id": "source-78",
    "category": "environment",
    "title": "Sandbag barricade 3D asset",
    "path": "art-gallery/sandbag_barricade_3d_asset_184c3724.webp",
    "fallbackPath": "art-gallery/sandbag_barricade_3d_asset_184c3724.jpg",
    "role": "reference",
    "source_id": 78
  },
  {
    "id": "source-79",
    "category": "environment",
    "title": "Wooden ammo boxes stack",
    "path": "art-gallery/wooden_ammo_boxes_stack_469d2943.webp",
    "fallbackPath": "art-gallery/wooden_ammo_boxes_stack_469d2943.jpg",
    "role": "reference",
    "source_id": 79
  },
  {
    "id": "source-80",
    "category": "environment",
    "title": "Barbed wire fence barricade",
    "path": "art-gallery/barbed_wire_fence_barricade_7a4d64e6.webp",
    "fallbackPath": "art-gallery/barbed_wire_fence_barricade_7a4d64e6.jpg",
    "role": "reference",
    "source_id": 80
  },
  {
    "id": "source-81",
    "category": "environment",
    "title": "Destroyed military tank wreckage",
    "path": "art-gallery/destroyed_military_tank_wreckage_09c66cf2.webp",
    "fallbackPath": "art-gallery/destroyed_military_tank_wreckage_09c66cf2.jpg",
    "role": "reference",
    "source_id": 81
  },
  {
    "id": "source-82",
    "category": "environment",
    "title": "Concrete military road segment 3",
    "path": "art-gallery/concrete_military_road_segment_3_15913314.webp",
    "fallbackPath": "art-gallery/concrete_military_road_segment_3_15913314.jpg",
    "role": "reference",
    "source_id": 82
  },
  {
    "id": "source-83",
    "category": "characters",
    "title": "Green toy soldier character design",
    "path": "art-gallery/green_toy_soldier_character_design_7e430005.webp",
    "fallbackPath": "art-gallery/green_toy_soldier_character_design_7e430005.jpg",
    "role": "reference",
    "source_id": 83
  },
  {
    "id": "source-84",
    "category": "characters",
    "title": "Toy medic soldier holding injector",
    "path": "art-gallery/toy_medic_soldier_holding_injector_6b0cdce4.webp",
    "fallbackPath": "art-gallery/toy_medic_soldier_holding_injector_6b0cdce4.jpg",
    "role": "reference",
    "source_id": 84
  },
  {
    "id": "source-85",
    "category": "characters",
    "title": "Toy rocket launcher soldier",
    "path": "art-gallery/toy_rocket_launcher_soldier_e04ac1e3.webp",
    "fallbackPath": "art-gallery/toy_rocket_launcher_soldier_e04ac1e3.jpg",
    "role": "reference",
    "source_id": 85
  },
  {
    "id": "source-86",
    "category": "characters",
    "title": "Toy soldier holding shotgun",
    "path": "art-gallery/toy_soldier_holding_shotgun_6ef8722e.webp",
    "fallbackPath": "art-gallery/toy_soldier_holding_shotgun_6ef8722e.jpg",
    "role": "reference",
    "source_id": 86
  },
  {
    "id": "source-87",
    "category": "characters",
    "title": "Toy soldier holding rifle",
    "path": "art-gallery/toy_soldier_holding_rifle_69b4b58a.webp",
    "fallbackPath": "art-gallery/toy_soldier_holding_rifle_69b4b58a.jpg",
    "role": "reference",
    "source_id": 87
  },
  {
    "id": "source-88",
    "category": "characters",
    "title": "Toy soldier holding energy pistols",
    "path": "art-gallery/toy_soldier_holding_energy_pistols_040697ec.webp",
    "fallbackPath": "art-gallery/toy_soldier_holding_energy_pistols_040697ec.jpg",
    "role": "reference",
    "source_id": 88
  },
  {
    "id": "source-89",
    "category": "characters",
    "title": "Toy soldier holding twin SMGs",
    "path": "art-gallery/toy_soldier_holding_twin_smgs_56b84425.webp",
    "fallbackPath": "art-gallery/toy_soldier_holding_twin_smgs_56b84425.jpg",
    "role": "reference",
    "source_id": 89
  },
  {
    "id": "source-90",
    "category": "characters",
    "title": "Green toy sniper soldier asset",
    "path": "art-gallery/green_toy_sniper_soldier_asset_80c8366d.webp",
    "fallbackPath": "art-gallery/green_toy_sniper_soldier_asset_80c8366d.jpg",
    "role": "reference",
    "source_id": 90
  }
];


/* ===== [[ js/art-ui.js ]] ===== */
// Toy military presentation. All balances, unlocks and rewards stay in existing systems.
var ArtUI = {
    version: 'military_v5',
    _game: null,
    image: function(path, label, css) {
        return '<img class="' + (css || 'art-icon') + '" src="art/' + path + '" alt="' + label + '" draggable="false">';
    },
    icon: function(name) {
        var order = ['avatar','coin','diamond','settings','play','pause','trophy','chest','star','shield','medal'];
        var index = order.indexOf(name);
        return '<span class="art-nav-sprite" style="background-position:' + (-(index % 4) * 27) + 'px ' + (-Math.floor(index / 4) * 27) + 'px" aria-hidden="true"></span>';
    },
    install: function(game) {
        if (this._game) return;
        this._game = game;
        var self = this;
        var root = document.getElementById('game-container');
        root.classList.add('art-military');
        if (window.__minidom || typeof wx !== 'undefined') {
            root.classList.add('art-mini');
            var fit = function() {
                var w = window.innerWidth || 390, h = window.innerHeight || 844;
                root.style.width = w + 'px'; root.style.height = h + 'px';
                var screen = document.getElementById('start-screen');
                if (screen) screen.style.height = h + 'px';
                var p = screen && screen.querySelector('.title-panel');
                if (p) { p.style.width = (Math.min(w, 444) - 24) + 'px'; p.style.maxHeight = (h - 24) + 'px'; }
            };
            fit(); window.addEventListener('resize', fit);
        }
        var panel = document.querySelector('#start-screen .title-panel');
        var avatar = document.querySelector('.logo-badge img');
        if (avatar) { avatar.src = 'art/ui/avatar.png?v=1901'; avatar.alt = '特种兵指挥官'; }
        var hudAvatar = document.querySelector('#avatar-box img');
        if (hudAvatar) hudAvatar.src = 'art/ui/avatar.png?v=1901';
        if (panel) {
            // V15-ART-003: 真实美术资产驱动的商业级军事营地首页 (独立营地背景 + 金属徽章Logo + 统一3兵种主角团 + 单行关卡条 + 5格底栏)
            panel.classList.add('v15-home-lobby');
            var title = panel.querySelector('.game-title');
            if (title && !panel.querySelector('.v15-logo-img')) {
                title.innerHTML = '<img class="v15-logo-img" src="art/v15/home_logo.png" alt="膨胀小队" draggable="false">';
            }
            var svgChallenge = '<svg class="v19-custom-nav-svg" viewBox="0 0 24 24"><path d="M5 19L19 5M14 5h5v5" stroke="#FBBF24" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><path d="M19 19L5 5M10 5H5v5" stroke="#F87171" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" fill="none"/><circle cx="12" cy="12" r="3.2" fill="#FEF08A" stroke="#78350F" stroke-width="1.5"/></svg>';
            var svgCodex = '<svg class="v19-custom-nav-svg" viewBox="0 0 24 24"><rect x="4" y="3" width="16" height="18" rx="3" fill="#0F294A" stroke="#38BDF8" stroke-width="2"/><path d="M8 8h8M8 12h8M8 16h5" stroke="#7DD3FC" stroke-width="2" stroke-linecap="round"/><circle cx="16.5" cy="16.5" r="2.2" fill="#FBBF24"/></svg>';
            var hero = document.createElement('div');
            hero.className = 'art-home-hero v15-camp-stage';
            hero.innerHTML =
                '<div class="v19-home-fx" aria-hidden="true">' +
                    '<i style="left:16%;animation-delay:0s"></i>' +
                    '<i style="left:32%;animation-delay:1.4s"></i>' +
                    '<i style="left:54%;animation-delay:0.7s"></i>' +
                    '<i style="left:72%;animation-delay:2.3s"></i>' +
                    '<i style="left:84%;animation-delay:3.5s"></i>' +
                '</div>' +
                '<div class="v15-side-col v15-side-left">' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-map">' + this.icon('shield') + '<span>地图</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-tech">' + this.icon('star') + '<span>科技</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-daily">' + this.icon('coin') + '<span>每日</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-challenge">' + svgChallenge + '<span>挑战</span></button>' +
                '</div>' +
                '<div class="v15-hero-center-wrap">' +
                    '<div class="v15-hero-shadow" style="display:none"></div>' +
                '</div>' +
                '<div class="v15-side-col v15-side-right">' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-ach">' + this.icon('trophy') + '<span>成就</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-codex">' + svgCodex + '<span>图鉴</span></button>' +
                    '<button type="button" class="v15-side-btn" data-trigger="v60-btn-set">' + this.icon('settings') + '<span>设置</span></button>' +
                '</div>';
            if (title) title.insertAdjacentElement('afterend', hero);
            hero.addEventListener('click', function(ev) {
                var sb = ev.target.closest('.v15-side-btn');
                if (!sb) return;
                var tid = sb.getAttribute('data-trigger');
                var orig = tid && document.getElementById(tid);
                if (orig) orig.click();
            });

            // 精简单一当前关卡面板 (绑定真实 #level-select 关卡按钮, 不在首页堆叠10个数字方格!)
            var start = document.getElementById('btn-start');
            if (start && !document.getElementById('v15-stage-bar')) {
                var stageBar = document.createElement('div');
                stageBar.id = 'v15-stage-bar';
                stageBar.innerHTML =
                    '<img class="v15-stage-thumb" src="art/v15/home_military_camp_bg.jpg?v=1901" alt="关卡预览" draggable="false">' +
                    '<div class="v15-stage-mid">' +
                        '<div class="v15-stage-kicker">TACTICAL MISSION · 当前战区</div>' +
                        '<div class="v15-stage-ctrl">' +
                            '<button type="button" class="v15-stage-arrow" id="v15-stage-prev" aria-label="上一关">◀</button>' +
                            '<span id="v15-stage-label">第 1 关</span>' +
                            '<button type="button" class="v15-stage-arrow" id="v15-stage-next" aria-label="下一关">▶</button>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="v15-stage-map-btn" id="v15-stage-map-open">' + this.icon('chest') + '<span>战区</span></button>';
                start.insertAdjacentElement('beforebegin', stageBar);

                var syncStageLabel = function() {
                    var sel = document.querySelector('#level-select button.selected');
                    var lbl = document.getElementById('v15-stage-label');
                    if (lbl && sel) lbl.textContent = '第 ' + sel.textContent.trim() + ' 关';
                };
                var stepStage = function(delta) {
                    var btns = Array.prototype.slice.call(document.querySelectorAll('#level-select button'));
                    if (!btns.length) return;
                    var idx = btns.findIndex(function(b) { return b.classList.contains('selected'); });
                    if (idx < 0) idx = 0;
                    var next = Math.max(0, Math.min(btns.length - 1, idx + delta));
                    if (btns[next] && !btns[next].disabled) btns[next].click();
                    setTimeout(syncStageLabel, 20);
                };
                document.getElementById('v15-stage-prev').onclick = function() { stepStage(-1); };
                document.getElementById('v15-stage-next').onclick = function() { stepStage(1); };
                document.getElementById('v15-stage-map-open').onclick = function() {
                    var mb = document.getElementById('v60-btn-map'); if (mb) mb.click();
                };
                setTimeout(syncStageLabel, 120);
            }

            if (start) start.innerHTML = '<svg class="v19-start-ico" viewBox="0 0 24 24" width="22" height="22"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="2.6" fill="currentColor"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg><span>开始作战</span><span class="art-arrow">▸</span>';
            var growth = document.getElementById('v60-home-growth');
            if (growth && title) panel.insertBefore(growth, title);

            // 底部 5 格商业级现代战术主导航栏 (统一使用新版特种兵头像, 彻底消除旧绿头盔!)
            if (!document.getElementById('v15-bottom-dock')) {
                var dock = document.createElement('div');
                dock.id = 'v15-bottom-dock';
                dock.innerHTML =
                    '<button type="button" class="v15-dock-tab active" data-dock="home">' + this.icon('shield') + '<span>基地</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="train"><img class="v15-dock-gun-ico v19-dock-avatar" src="art/ui/avatar.png?v=1901" alt="士兵" draggable="false"><span>特种兵</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="armory">' + this.image('weapons/rifle.png', '武器', 'v15-dock-gun-ico') + '<span>军械</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="shop">' + this.icon('coin') + '<span>补给站</span></button>' +
                    '<button type="button" class="v15-dock-tab" data-dock="rank">' + this.icon('trophy') + '<span>排行</span></button>';
                panel.appendChild(dock);
                dock.addEventListener('click', function(ev) {
                    var btn = ev.target.closest('.v15-dock-tab');
                    if (!btn) return;
                    var act = btn.getAttribute('data-dock');
                    if (act === 'train') { var t = document.getElementById('v60-btn-train'); if (t) t.click(); }
                    else if (act === 'armory') { var a = document.getElementById('v60-btn-armory'); if (a) a.click(); }
                    else if (act === 'shop') { var s = document.getElementById('btn-open-shop'); if (s) s.click(); }
                    else if (act === 'rank') { var r = document.getElementById('v60-btn-rank'); if (r) r.click(); }
                });
            }
        }
        var navArt = { map: 'shield', train: 'avatar', armory: 'chest', tech: 'star', codex: 'medal',
            challenge: 'shield', rank: 'trophy', ach: 'medal', daily: 'coin', set: 'settings' };
        var navNames = { map: '地图', train: '训练', armory: '军械库', tech: '科技', codex: '图鉴',
            challenge: '挑战', rank: '排行', ach: '成就', daily: '每日', set: '设置' };
        for (var key in navArt) {
            var btn = document.getElementById('v60-btn-' + key);
            if (btn) btn.innerHTML = this.icon(navArt[key]) + '<span>' + navNames[key] + '</span>';
        }
        // Decoration is independent of text and of the real input handlers.
        [['win-screen', 'trophy'], ['lose-screen', 'shield'], ['pause-screen', 'pause'], ['shop-screen', 'chest']].forEach(function(pair) {
            var p = document.querySelector('#' + pair[0] + ' .title-panel');
            if (p) p.insertAdjacentHTML('afterbegin', self.image('ui/' + pair[1] + '.png', '', 'art-panel-emblem'));
        });
        var pause = document.getElementById('btn-pause');
        if (pause) { pause.innerHTML = '<span class="v15-pause-bars"><i></i><i></i></span>'; pause.setAttribute('aria-label', '暂停游戏'); }
        // V15 战斗 HUD: 注入右上角「金币+士兵数」双军工胶囊与进度百分比/Boss骷髅徽标
        var topBar = document.getElementById('top-bar');
        if (topBar && !document.getElementById('v15-hud-right')) {
            var rightCol = document.createElement('div');
            rightCol.id = 'v15-hud-right';
            rightCol.innerHTML =
                '<div class="v15-pill v15-pill-coin">' + this.image('ui/coin.png', '', 'v15-pill-ico') + '<span id="v15-hud-coins">0</span></div>' +
                '<div class="v15-pill v15-pill-squad"><img class="v15-pill-ico v19-hud-avatar" src="art/ui/avatar.png?v=1901" alt="" draggable="false"><span id="v15-hud-squad">1</span></div>';
            topBar.appendChild(rightCol);
        }
        var progBar = document.getElementById('progress-bar-container');
        if (progBar && !document.getElementById('v15-progress-pct')) {
            var pctEl = document.createElement('span');
            pctEl.id = 'v15-progress-pct';
            pctEl.textContent = '0%';
            progBar.appendChild(pctEl);
            var skullEl = document.createElement('span');
            skullEl.className = 'v15-boss-skull';
            skullEl.textContent = '☠';
            progBar.appendChild(skullEl);
        }
        this._wrap('renderArmory', function() { self.decorateWeapons(); });
        this._wrap('renderMap', function() { self.decorateMap(); });
        this._wrap('renderClassSelector', function() { self.decorateClasses(); });
        this._wrap('renderCodex', function() { self.decorateCodex(); });
        this._wrap('renderRank', function() { self.decorateRank(); });
        this._wrap('renderTraining', function() { self.decorateTraining(); });
        this._wrap('hidePages', function() {
            var gallery = document.getElementById('art-gallery-page');
            if (gallery) gallery.classList.add('hidden');
        });
        this.decorateClasses();
        this.refreshBadges(game);
    },
    refreshBadges: function(game) {
        if (!game || !game.profile) return;
        var coins = game.profile.coins || 0;
        var canTrain = typeof SoldierGrowth !== 'undefined' && SoldierGrowth.level(game.profile) < 50 && coins >= SoldierGrowth.upgradeCost(game.profile);
        var trainBtn = document.getElementById('v60-btn-train');
        if (trainBtn) trainBtn.classList.toggle('art-has-badge', !!canTrain);
        var canShop = false;
        if (game.shop && typeof UPGRADE_DEFS !== 'undefined') {
            for (var k in UPGRADE_DEFS) {
                var c = game.shop.nextCost ? game.shop.nextCost(game.profile, k) : null;
                if (c !== null && c !== undefined && coins >= c) { canShop = true; break; }
            }
        }
        var shopBtn = document.getElementById('btn-open-shop');
        if (shopBtn) shopBtn.classList.toggle('art-has-badge', !!canShop);
    },
    _wrap: function(name, after) {
        var original = V60UI[name];
        V60UI[name] = function() { var result = original.apply(this, arguments); after(); return result; };
    },
    decorateWeapons: function() {
        var map = { rifle: 'rifle', shotgun: 'shotgun', sniper: 'sniper', mg: 'mg',
            rocket: 'rocket', flamethrower: 'plasma', freeze: 'laser', tesla: 'railgun' };
        var nodes = document.querySelectorAll('.v118-weapon-art');
        for (var i = 0; i < nodes.length; i++) {
            var id = nodes[i].getAttribute('data-weapon');
            if (!map[id]) continue;
            nodes[i].classList.add('art-weapon-image');
            nodes[i].style.backgroundImage = 'url("art/weapons/' + map[id] + '.png")';
            nodes[i].style.backgroundPosition = 'center';
            nodes[i].style.backgroundSize = 'contain';
        }
        // The remaining designs are cosmetic previews, not additional weapon mechanics.
        var hero = document.getElementById('v118-armory-hero');
        if (hero) hero.setAttribute('data-art-source', 'processed_weapon_crops');
    },
    decorateClasses: function() {
        var icons = document.querySelectorAll('.v60-class-icon');
        var names = ['rifle', 'energy', 'sniper', 'medic'];
        for (var i = 0; i < icons.length; i++) icons[i].innerHTML = this.image('characters/' + names[i % names.length] + '_portrait.png', '', 'art-class-portrait');
    },
    decorateMap: function() {
        var nodes = document.querySelectorAll('.v60-map-node');
        var maps = ['sunny', 'desert', 'city', 'forest', 'snow'];
        for (var i = 0; i < nodes.length; i++) {
            var icon = nodes[i].querySelector('.v60-node-icon');
            if (icon) icon.innerHTML = this.image('maps/' + maps[i % 5] + (typeof wx !== 'undefined' || typeof tt !== 'undefined' ? '.jpg' : '.webp'), '', 'art-map-preview');
        }
    },
    decorateRank: function() {
        var nodes = document.querySelectorAll('.v60-rank-pos');
        for (var i = 0; i < Math.min(3, nodes.length); i++) {
            nodes[i].innerHTML = this.image('ui/medal.png', '', 'art-rank-medal') + '<span>' + (i + 1) + '</span>';
        }
    },
    decorateTraining: function() {
        var panel = document.querySelector('#v60-train-page .title-panel');
        if (!panel || document.getElementById('art-train-showcase')) return;
        var box = document.createElement('div');
        box.id = 'art-train-showcase';
        box.className = 'art-train-showcase';
        box.innerHTML = this.image('characters/soldier_portrait.png?v=1901', '特种作战指挥官', 'art-train-soldier') +
            '<div class="art-train-copy"><span class="art-overline">SPEC-OPS TRAINING</span>' +
            '<strong>现代特种突击团</strong><p>强化全队火力、护甲生命与战术减伤属性</p></div>';
        var header = panel.querySelector('.v60-train-head') || panel.querySelector('.v60-page-title');
        if (header) header.insertAdjacentElement('afterend', box);
        else panel.insertBefore(box, panel.firstChild);
    },
    decorateCodex: function() {
        var page = document.querySelector('#v60-codex-page .title-panel');
        if (!page || document.getElementById('art-gallery-open')) return;
        var weapons = [['rifle','突击步枪'], ['smg','冲锋枪'], ['shotgun','霰弹枪'], ['sniper','狙击枪'],
            ['mg','重机枪'], ['rocket','火箭筒'], ['laser','激光枪'], ['plasma','等离子炮'], ['gatling','加特林'], ['railgun','电磁炮']];
        var collection = document.createElement('div');
        collection.className = 'art-weapon-collection';
        var html = '<h2 class="v60-page-title">武器外观档案</h2><p class="art-gallery-note">装备外观展示；军械库中查看可用武器与升级效果。</p><div class="art-weapon-grid">';
        for (var i = 0; i < weapons.length; i++) html += '<div class="art-weapon-tile">' +
            this.image('weapons/' + weapons[i][0] + '.png', weapons[i][1], 'art-collection-weapon') + '<span>' + weapons[i][1] + '</span></div>';
        html += '</div>'; collection.innerHTML = html;
        page.insertBefore(collection, document.getElementById('v60-codex-back'));
        var button = document.createElement('button');
        button.id = 'art-gallery-open'; button.className = 'btn-secondary'; button.textContent = '美术图鉴 · 设计参考';
        button.onclick = function() { ArtUI.openGallery(0); };
        var back = document.getElementById('v60-codex-back');
        page.insertBefore(button, back);
    },
    openGallery: function(pageIndex) {
        if (typeof wx !== 'undefined' && wx.loadSubpackage && !this._galleryReady) {
            if (this._galleryLoading) return;
            this._galleryLoading = true;
            var self = this;
            wx.loadSubpackage({ name: 'art_gallery', success: function() {
                self._galleryLoading = false; self._galleryReady = true; self.openGallery(pageIndex);
            }, fail: function() { self._galleryLoading = false; } });
            return;
        }
        var list = typeof ArtAssetCatalog !== 'undefined'
            ? (Array.isArray(ArtAssetCatalog) ? ArtAssetCatalog : (ArtAssetCatalog.entries || ArtAssetCatalog.assets || [])) : [];
        if (!Array.isArray(list)) return;
        V60UI.hidePages();
        var page = document.getElementById('art-gallery-page');
        if (!page) {
            page = document.createElement('div'); page.id = 'art-gallery-page'; page.className = 'v60-page';
            document.getElementById('game-container').appendChild(page);
        }
        var perPage = 6, pages = Math.max(1, Math.ceil(list.length / perPage));
        pageIndex = Math.max(0, Math.min(pages - 1, pageIndex));
        var html = '<div class="title-panel v60-panel"><h2 class="v60-page-title">美术图鉴</h2>' +
            '<p class="art-gallery-note">世界、角色与装备的设计参考。战斗中使用可活动的三维角色。</p><div class="art-gallery-grid">';
        for (var i = pageIndex * perPage; i < Math.min(list.length, (pageIndex + 1) * perPage); i++) {
            var a = list[i];
            var src = (typeof wx !== 'undefined' || typeof tt !== 'undefined') && a.fallbackPath ? a.fallbackPath : a.path;
            if (!src) continue;
            html += '<div class="art-gallery-card"><img src="' + src + '" alt="设计参考 ' + (i + 1) + '"><span>设计参考 ' + (i + 1) + '</span></div>';
        }
        html += '</div><div class="art-gallery-pager"><button id="art-gallery-prev" class="btn-secondary">上一页</button><span>' + (pageIndex + 1) + ' / ' + pages +
            '</span><button id="art-gallery-next" class="btn-secondary">下一页</button></div><button id="art-gallery-back" class="btn-primary">返回图鉴</button></div>';
        page.innerHTML = html; page.classList.remove('hidden');
        document.getElementById('art-gallery-prev').onclick = function() { ArtUI.openGallery(pageIndex - 1); };
        document.getElementById('art-gallery-next').onclick = function() { ArtUI.openGallery(pageIndex + 1); };
        document.getElementById('art-gallery-back').onclick = function() { page.classList.add('hidden'); V60UI.showPage('v60-codex-page'); V60UI.renderCodex(ArtUI._game); };
    }
};


/* ===== [[ js/military-art.js ]] ===== */
// Runtime military-base presentation (V5.1 visual upgrade).
// Self-contained instanced 3D cartoon military base; allocates once at init, never per frame.
var MilitaryArt = class MilitaryArt {
    static preload() {
        if (this._preloadPromise) return this._preloadPromise;
        var url = 'art/v15/env_military_pack.glb';
        if (typeof Platform === 'undefined' || Platform.id === 'h5') url += '?v=1910';
        this._preloadPromise = new Promise(function(resolve, reject) {
            new THREE.GLTFLoader().load(url, resolve, undefined, function(error) {
                reject(Error('Military environment load failed: ' + (error.message || url)));
            });
        }).catch(function(error) {
            MilitaryArt._preloadPromise = null; // Explicit subsequent attempts can retry.
            throw error;
        });
        return this._preloadPromise;
    }

    constructor(world) {
        this.world = world;
        this.scene = world.scene;
        this.root = new THREE.Group();
        this.root.name = 'military-art-runtime';
        this.root.userData.artSource = 'programmatic layered military biomes; procedural cartoon PBR textures';
        this.scene.add(this.root);
        this._meshes = [];
        this._anchor = Infinity;
        this._scratch = new THREE.Object3D();
        this._segmentLength = 24;
        this._segmentCount = 7;
        this._build();
        this.setTheme(world._themeApplied || 'dawn');
        this.update(0);
    }

    _makeRoadTexture() {
        var cv = document.createElement('canvas');
        cv.width = 512; cv.height = 512;
        var ctx = cv.getContext('2d');
        // V18.0: 深沉做旧军用战术沥青混凝土跑道 (压暗路面以突出子弹曳光、红圈预警与角色立体感)
        ctx.fillStyle = '#5F6870';
        ctx.fillRect(0, 0, 512, 512);
        // 4块混凝土板块细微明暗冷暖变化 (打破死板单色网格感)
        var slabTones = ['rgba(255,252,244,0.05)', 'rgba(30,38,44,0.05)', 'rgba(245,248,255,0.04)', 'rgba(42,38,32,0.05)'];
        for (var sb = 0; sb < 4; sb++) {
            ctx.fillStyle = slabTones[sb];
            ctx.fillRect(0, sb * 128, 512, 128);
        }
        // 大尺度风化斑驳油污/水渍
        for (var p = 0; p < 44; p++) {
            var px = (p * 131 + 29) % 512;
            var py = (p * 179 + 47) % 512;
            var pr = 18 + (p % 4) * 12;
            var gP = ctx.createRadialGradient(px, py, 2, px, py, pr);
            var darkPatch = (p % 2 === 0);
            gP.addColorStop(0, darkPatch ? 'rgba(34,40,46,0.11)' : 'rgba(225,222,210,0.09)');
            gP.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gP;
            ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
        }
        // 柔和渐变三车道车辙印 (边缘羽化, 告别硬矩形)
        var laneCenters = [100, 256, 412];
        for (var lc = 0; lc < laneCenters.length; lc++) {
            var cx = laneCenters[lc];
            var gLane = ctx.createLinearGradient(cx - 46, 0, cx + 46, 0);
            gLane.addColorStop(0, 'rgba(28,34,40,0)');
            gLane.addColorStop(0.28, 'rgba(28,34,40,0.13)');
            gLane.addColorStop(0.5, 'rgba(34,40,46,0.07)');
            gLane.addColorStop(0.72, 'rgba(28,34,40,0.13)');
            gLane.addColorStop(1, 'rgba(28,34,40,0)');
            ctx.fillStyle = gLane;
            ctx.fillRect(cx - 46, 0, 92, 512);
        }
        // 路边两侧沙尘积灰与凹陷阴影渐变 (自然衔接路肩泥土)
        var edgeL = ctx.createLinearGradient(0, 0, 58, 0);
        edgeL.addColorStop(0, 'rgba(92,82,62,0.44)');
        edgeL.addColorStop(0.45, 'rgba(54,52,44,0.18)');
        edgeL.addColorStop(1, 'rgba(24,32,38,0)');
        ctx.fillStyle = edgeL; ctx.fillRect(0, 0, 58, 512);
        var edgeR = ctx.createLinearGradient(454, 0, 512, 0);
        edgeR.addColorStop(0, 'rgba(24,32,38,0)');
        edgeR.addColorStop(0.55, 'rgba(54,52,44,0.18)');
        edgeR.addColorStop(1, 'rgba(92,82,62,0.44)');
        ctx.fillStyle = edgeR; ctx.fillRect(454, 0, 58, 512);
        // 细腻骨料砂砾与风化微颗粒
        for (var i = 0; i < 1400; i++) {
            var x = (i * 97 + (i % 7) * 13) % 512;
            var y = (i * 193 + (i % 5) * 11) % 512;
            ctx.fillStyle = (i % 3 === 0) ? 'rgba(255,252,240,0.07)' : ((i % 3 === 1) ? 'rgba(20,26,32,0.09)' : 'rgba(138,124,98,0.06)');
            ctx.fillRect(x, y, 2 + (i % 2), 2 + ((i + 1) % 2));
        }
        // 横向混凝土板块伸缩缝 + 真实沥青网状裂纹 + 战区跑道导引喷漆箭头 + 双轮胎花纹印
        for (var sy = 0; sy < 512; sy += 128) {
            ctx.fillStyle = 'rgba(18, 24, 30, 0.34)';
            ctx.fillRect(14, sy, 484, 3);
            ctx.fillStyle = 'rgba(235, 240, 245, 0.09)';
            ctx.fillRect(14, sy + 3, 484, 2);
            // 多分叉自然沥青裂纹与局部冷补沥青块
            ctx.fillStyle = 'rgba(24, 30, 38, 0.18)';
            ctx.beginPath();
            ctx.ellipse(90 + ((sy * 5) % 310), sy + 52, 26, 14, 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(16, 22, 28, 0.30)';
            ctx.lineWidth = 1.6;
            ctx.beginPath();
            var cx0 = 54 + ((sy * 3) % 350);
            ctx.moveTo(cx0, sy + 2);
            ctx.lineTo(cx0 + 16, sy + 18);
            ctx.lineTo(cx0 + 36, sy + 12);
            ctx.lineTo(cx0 + 54, sy + 30);
            ctx.moveTo(cx0 + 16, sy + 18);
            ctx.lineTo(cx0 + 6, sy + 38);
            ctx.stroke();
        }
        // 重型装甲车双轮辙印与横向胎纹残迹
        ctx.fillStyle = 'rgba(16, 20, 26, 0.13)';
        var tracksX = [74, 122, 230, 278, 386, 434];
        for (var ti = 0; ti < tracksX.length; ti++) {
            var tx = tracksX[ti];
            ctx.fillRect(tx, 0, 9, 512);
            for (var ty = (ti % 2) * 8; ty < 512; ty += 18) {
                ctx.fillRect(tx - 2, ty, 13, 4);
            }
        }
        // 中道军用跑道战术导引喷漆标识 (低对比度做旧白漆)
        ctx.fillStyle = 'rgba(226, 232, 240, 0.12)';
        ctx.beginPath();
        ctx.moveTo(256, 210); ctx.lineTo(282, 248); ctx.lineTo(268, 248); ctx.lineTo(256, 230); ctx.lineTo(244, 248); ctx.lineTo(230, 248);
        ctx.closePath(); ctx.fill();

        // 两侧降饱和做旧琥珀军用警戒边线 (告别刺眼亮黄)
        ctx.fillStyle = 'rgba(18, 24, 30, 0.48)';
        ctx.fillRect(12, 0, 14, 512);
        ctx.fillRect(486, 0, 14, 512);
        ctx.fillStyle = '#C99B3B';
        ctx.fillRect(14, 0, 9, 512);
        ctx.fillRect(489, 0, 9, 512);
        // 三跑道做旧战术灰白虚线分隔
        ctx.fillStyle = 'rgba(18, 24, 30, 0.28)';
        for (var ly0 = 16; ly0 < 512; ly0 += 85) {
            ctx.fillRect(165, ly0 + 2, 10, 46);
            ctx.fillRect(337, ly0 + 2, 10, 46);
        }
        ctx.fillStyle = 'rgba(218, 226, 234, 0.72)';
        for (var ly = 16; ly < 512; ly += 85) {
            ctx.fillRect(166, ly, 8, 46);
            ctx.fillRect(338, ly, 8, 46);
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(1, 2);
        tex.anisotropy = 4;
        return tex;
    }

    _makeGroundTexture() {
        var cv = document.createElement('canvas');
        cv.width = 512; cv.height = 512;
        var ctx = cv.getContext('2d');
        // V18.0: 沉稳写实卡通军营橄榄绿地表 (降明度降饱和, 告别发白草皮感)
        ctx.fillStyle = '#92A57E';
        ctx.fillRect(0, 0, 512, 512);
        // 大尺度有机草地明暗、泥土色块 (彻底告别荧光绿塑料平面)
        for (var i = 0; i < 85; i++) {
            var px = (i * 173 + 37) % 512;
            var py = (i * 109 + 61) % 512;
            var rx = 26 + (i % 5) * 18;
            var ry = 20 + ((i + 2) % 4) * 15;
            var tone = i % 4;
            ctx.fillStyle = tone === 0 ? 'rgba(232,226,184,0.22)'
                : (tone === 1 ? 'rgba(48,76,40,0.16)'
                : (tone === 2 ? 'rgba(156,132,88,0.18)' : 'rgba(72,98,54,0.14)'));
            ctx.beginPath(); ctx.ellipse(px, py, rx, ry, (i % 6) * 0.5, 0, Math.PI * 2); ctx.fill();
        }
        // 手绘卡通 V 形小草簇 (增加地表细节层次)
        ctx.lineWidth = 2;
        for (var g = 0; g < 220; g++) {
            var gx = (g * 97 + 19) % 512;
            var gy = (g * 191 + 43) % 512;
            var h = 6 + (g % 5);
            ctx.strokeStyle = (g % 3 === 0) ? 'rgba(42,68,34,0.30)' : ((g % 3 === 1) ? 'rgba(242,238,196,0.26)' : 'rgba(76,102,52,0.24)');
            ctx.beginPath();
            ctx.moveTo(gx, gy); ctx.lineTo(gx - 3, gy - h);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 1, gy - h - 2);
            ctx.moveTo(gx, gy); ctx.lineTo(gx + 4, gy - h + 1);
            ctx.stroke();
        }
        // 零星小碎石与沙土点缀
        for (var s = 0; s < 140; s++) {
            var sx = (s * 149 + 71) % 512;
            var sy = (s * 211 + 23) % 512;
            ctx.fillStyle = (s % 2 === 0) ? 'rgba(154,142,118,0.26)' : 'rgba(84,78,62,0.20)';
            ctx.beginPath(); ctx.arc(sx, sy, 1.5 + (s % 3) * 0.8, 0, Math.PI * 2); ctx.fill();
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(5, 2);
        return tex;
    }

    _makeBuildingTexture() {
        var cv = document.createElement('canvas');
        cv.width = 256; cv.height = 256;
        var ctx = cv.getContext('2d');
        // 瓦楞金属军营墙体底色(浅灰白, 由 material.color 按主题染色)
        ctx.fillStyle = '#E4EAE0';
        ctx.fillRect(0, 0, 256, 256);
        for (var x = 0; x < 256; x += 16) {
            ctx.fillStyle = (x % 32 === 0) ? 'rgba(255,255,255,0.16)' : 'rgba(25,38,30,0.08)';
            ctx.fillRect(x, 0, 8, 256);
        }
        // 顶部檐口阴影带
        ctx.fillStyle = 'rgba(20, 32, 26, 0.28)';
        ctx.fillRect(0, 0, 256, 20);
        // 战术亮窗(两排简洁卡通蓝窗)
        for (var wx = 26; wx <= 186; wx += 78) {
            ctx.fillStyle = '#2A3B48';
            ctx.fillRect(wx - 4, 40, 52, 40);
            ctx.fillStyle = '#78C8F0';
            ctx.fillRect(wx, 44, 44, 32);
            ctx.fillStyle = 'rgba(255,255,255,0.45)';
            ctx.fillRect(wx + 4, 48, 14, 10);
        }
        // 中下机库卷帘大门
        ctx.fillStyle = '#33424A';
        ctx.fillRect(68, 118, 120, 114);
        ctx.fillStyle = '#4B5E68';
        for (var gy = 126; gy < 226; gy += 14) {
            ctx.fillRect(74, gy, 108, 9);
        }
        // 底部黄黑战术防撞警示条
        ctx.fillStyle = '#F2C037';
        ctx.fillRect(0, 232, 256, 24);
        ctx.fillStyle = '#2B3136';
        for (var hx = -24; hx < 280; hx += 32) {
            ctx.beginPath();
            ctx.moveTo(hx, 256); ctx.lineTo(hx + 16, 256); ctx.lineTo(hx + 28, 232); ctx.lineTo(hx + 12, 232);
            ctx.closePath(); ctx.fill();
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.ClampToEdgeWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        return tex;
    }

    _makeBannerTexture() {
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 192;
        var ctx = cv.getContext('2d');
        // V19.1: 现代特种作战深枪铁蓝 + 战术青蓝光带 + 琥珀金徽标战旗 (告别旧版突兀大红旗, 与首页与要塞100%统一!)
        var bg = ctx.createLinearGradient(0, 0, 0, 192);
        bg.addColorStop(0, '#162A4A');
        bg.addColorStop(1, '#0B1528');
        ctx.fillStyle = bg;
        ctx.fillRect(0, 0, 128, 192);
        ctx.strokeStyle = '#38BDF8';
        ctx.lineWidth = 6;
        ctx.strokeRect(5, 5, 118, 182);
        // 顶部和底部琥珀金战术边带
        ctx.fillStyle = '#F5B82E';
        ctx.fillRect(0, 0, 128, 12);
        ctx.fillRect(0, 174, 128, 10);
        // 中央特种战术盾徽 + 金色星章
        ctx.fillStyle = 'rgba(56,189,248,0.22)';
        ctx.beginPath(); ctx.arc(64, 88, 36, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#7DD3FC'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(64, 88, 34, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = '#FFE066';
        ctx.beginPath();
        for (var i = 0; i < 10; i++) {
            var a = -Math.PI / 2 + i * Math.PI / 5;
            var r = (i % 2 === 0) ? 22 : 9.5;
            if (i === 0) ctx.moveTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
            else ctx.lineTo(64 + Math.cos(a) * r, 88 + Math.sin(a) * r);
        }
        ctx.closePath(); ctx.fill();
        // 底部双V战术臂章条
        ctx.strokeStyle = '#F5B82E'; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(32, 138); ctx.lineTo(64, 156); ctx.lineTo(96, 138);
        ctx.stroke();
        return new THREE.CanvasTexture(cv);
    }

    _makeCrateTexture() {
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#C99B63';
        ctx.fillRect(0, 0, 128, 128);
        ctx.strokeStyle = '#7A552C';
        ctx.lineWidth = 14;
        ctx.strokeRect(7, 7, 114, 114);
        ctx.lineWidth = 10;
        ctx.beginPath(); ctx.moveTo(14, 14); ctx.lineTo(114, 114); ctx.stroke();
        ctx.fillStyle = '#E8C468';
        ctx.fillRect(48, 52, 32, 24);
        var tex = new THREE.CanvasTexture(cv);
        return tex;
    }

    _material(key, color, options) {
        var material = new THREE.MeshStandardMaterial(Object.assign({
            color: color, roughness: .84, metalness: 0, flatShading: false
        }, options || {}));
        material.name = 'military-' + key;
        return material;
    }

    _add(name, geometry, material, records, biomes) {
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'military-' + name;
        mesh.frustumCulled = false;
        mesh.castShadow = !!(this.world.quality >= 1 && material.metalness < .75 && name !== 'road' && name !== 'ground-wide' && name !== 'shoulders');
        mesh.receiveShadow = name === 'road' || name === 'shoulders' || name === 'ground-wide';
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.userData.artSource = 'MilitaryArt reusable instanced geometry';
        mesh.userData.records = records;
        mesh.userData.biomes = biomes || null;
        this.root.add(mesh);
        this._meshes.push(mesh);
        return mesh;
    }

    _repeat(factory) {
        var records = [];
        for (var segment = 0; segment < this._segmentCount; segment++) {
            var local = factory(segment);
            for (var i = 0; i < local.length; i++) {
                local[i].segment = segment;
                records.push(local[i]);
            }
        }
        return records;
    }

    _build() {
        var box = new THREE.BoxGeometry(1, 1, 1);
        var plane = new THREE.PlaneGeometry(1, 1);
        plane.rotateX(-Math.PI / 2);
        var cylinder = new THREE.CylinderGeometry(.5, .5, 1, 10);
        var cone = new THREE.ConeGeometry(.55, 1, 10);
        var sphere = new THREE.SphereGeometry(.55, 10, 8);
        var hill = new THREE.DodecahedronGeometry(1, 1);

        var roadTex = this._makeRoadTexture();
        var groundTex = this._makeGroundTexture();
        var bldgTex = this._makeBuildingTexture();
        var crateTex = this._makeCrateTexture();

        this.materials = {
            road: this._material('road', 0xffffff, { map: roadTex, roughness: .95, envMapIntensity: 0.12 }),
            shoulder: this._material('shoulder', 0x9E9172, { map: groundTex, roughness: .96, envMapIntensity: 0.12 }),
            ground: this._material('ground', 0x597D47, { map: groundTex, roughness: .96, envMapIntensity: 0.14 }),
            curbA: this._material('curb-a', 0x6A7582, { roughness: .74, metalness: .26, envMapIntensity: 0.35 }),
            curbB: this._material('curb-b', 0x3D4959, { roughness: .64, metalness: .42, envMapIntensity: 0.42 }),
            concrete: this._material('concrete', 0xb6b5a4, { roughness: .85 }),
            structure: this._material('structure', 0x8ea381, { map: bldgTex, roughness: .76 }),
            roof: this._material('roof', 0x3b5944, { metalness: .16, roughness: .64 }),
            wood: this._material('wood', 0xffffff, { map: crateTex, roughness: .82 }),
            trunk: this._material('trunk', 0x7b5434, { roughness: .9 }),
            sandbag: this._material('sandbag', 0xc9b37c, { roughness: .92 }),
            accent: this._material('accent', 0xf0b434, { metalness: .1, roughness: .55 }),
            dark: this._material('dark', 0x354046, { metalness: .35, roughness: .55 }),
            foliage: this._material('foliage', 0x459445, { roughness: .82 }),
            foliageLight: this._material('foliage-light', 0x67b854, { roughness: .82 }),
            hill: this._material('hill', 0x628E76, { roughness: .96 }),
            snow: this._material('snow', 0xeaf4f8, { roughness: .94 }),
            rock: this._material('rock', 0xb48454, { roughness: .9 }),
            city: this._material('city', 0x7c8a94, { map: bldgTex, metalness: .12, roughness: .72 }),
            tankOlive: this._material('tank-olive', 0x5A7342, { metalness: .18, roughness: .56 }),
            tankTrack: this._material('tank-track', 0x262C30, { metalness: .28, roughness: .72 }),
            tentCanvas: this._material('tent-canvas', 0x5D7B47, { roughness: .88 }),
            bannerRed: this._material('banner-red', 0xFFFFFF, { map: this._makeBannerTexture(), roughness: .68 }),
            fortressStone: this._material('fortress-stone', 0x7B8C80, { roughness: .84 }),
            drumRed: this._material('drum-red', 0xB83D32, { metalness: .32, roughness: .48 }),
            bush: this._material('bush', 0x4A8C42, { roughness: .88 }),
            lamp: new THREE.MeshBasicMaterial({ color: 0xFFF3B0 })
        };

        // 1. 全景超宽大地形(宽120m, 彻底告别悬空纸带感!)
        this._add('ground-wide', plane, this.materials.ground, this._repeat(function() {
            return [{ x: 0, y: -.08, z: 0, sx: 120, sy: 1, sz: 24.2 }];
        }));
        // 2. 三跑道军事混凝土主路(sz=24.12 轻微重叠彻底消除接缝漏蓝天!)
        this._add('road', plane, this.materials.road, this._repeat(function() {
            return [{ x: 0, y: .02, z: 0, sx: 8.0, sy: 1, sz: 24.12 }];
        }));
        // 2b. V15-ART-006: 路边两侧沙砾泥土路肩过渡带 (消除混凝土与草地硬切边)
        this._add('shoulders', plane, this.materials.shoulder, this._repeat(function() {
            return [
                { x: -5.15, y: -.02, z: 0, sx: 2.1, sy: 1, sz: 24.14 },
                { x:  5.15, y: -.02, z: 0, sx: 2.1, sy: 1, sz: 24.14 }
            ];
        }));
        // 3. 左右立体混凝土/黄黑防撞护栏 (V15: 加厚立体防撞墩, 强军事通道纵深)
        this._add('curb-a', box, this.materials.curbA, this._repeat(function() {
            var rows = [];
            for (var z = -10.5; z <= 10.5; z += 4) {
                rows.push({ x: -4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
                rows.push({ x:  4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
            }
            return rows;
        }));
        this._add('curb-b', box, this.materials.curbB, this._repeat(function() {
            var rows = [];
            for (var z = -8.5; z <= 11.5; z += 4) {
                rows.push({ x: -4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
                rows.push({ x:  4.22, y: .22, z: z, sx: .42, sy: .44, sz: 1.88 });
            }
            return rows;
        }));

        // 4. 军事基地营房与军用帆布帐篷
        this._add('hangars', box, this.materials.structure, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 1.8, z: -3.5, sx: 6.2, sy: 3.6, sz: 7.4 }];
        }));
        this._add('hangar-roofs', box, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 10.2, y: 3.74, z: -3.5, sx: 6.7, sy: .38, sz: 7.9, rz: side * .03 }];
        }));
        // V15: 军用橄榄绿帆布帐篷 (对侧交替, 丰富中景军事营地)
        this._add('tent-bodies', box, this.materials.tentCanvas, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [{ x: side * 9.8, y: 1.05, z: 3.8, sx: 4.4, sy: 2.1, sz: 5.2 }];
        }), ['sunny', 'forest', 'desert']);
        this._add('tent-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [{ x: side * 9.8, y: 2.65, z: 3.8, sx: 4.9, sy: 1.35, sz: 5.7, ry: Math.PI * 0.25 }];
        }), ['sunny', 'forest', 'desert']);

        // V15: 路边停放军绿玩具坦克 (更贴近中景道路两侧, 清晰呈现军事基地氛围!)
        this._add('tank-hulls', box, this.materials.tankOlive, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 6.5, y: .72, z: -11.5, sx: 2.3, sy: .78, sz: 3.4, ry: side * -.28 }];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-tracks', box, this.materials.tankTrack, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 6.5 - 1.05, y: .42, z: -11.3, sx: .52, sy: .68, sz: 3.6, ry: side * -.28 },
                { x: side * 6.5 + 1.05, y: .42, z: -11.7, sx: .52, sy: .68, sz: 3.6, ry: side * -.28 }
            ];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-turrets', box, this.materials.tankOlive, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 6.5, y: 1.38, z: -11.6, sx: 1.5, sy: .66, sz: 1.8, ry: side * -.42 }];
        }), ['sunny', 'desert', 'city', 'forest']);
        this._add('tank-barrels', cylinder, this.materials.dark, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [{ x: side * 5.6, y: 1.46, z: -10.8, sx: .22, sy: 2.4, sz: .22, rx: Math.PI * 0.48, rz: side * .48 }];
        }), ['sunny', 'desert', 'city', 'forest']);

        // 5. V15 四柱木质/钢架瞭望哨塔 + 哨亭主体 + 坡顶 + 探照灯
        this._add('watch-posts', cylinder, this.materials.trunk, this._repeat(function(segment) {
            if (segment % 2) return [];
            var posts = [];
            var centers = [{ x: -6.8, z: 6.5 }, { x: 6.8, z: -7.5 }];
            for (var c = 0; c < centers.length; c++) {
                var cx = centers[c].x, cz = centers[c].z;
                posts.push({ x: cx - .72, y: 1.85, z: cz - .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx + .72, y: 1.85, z: cz - .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx - .72, y: 1.85, z: cz + .72, sx: .2, sy: 3.7, sz: .2 });
                posts.push({ x: cx + .72, y: 1.85, z: cz + .72, sx: .2, sy: 3.7, sz: .2 });
            }
            return posts;
        }));
        this._add('watch-decks', box, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 3.18, z: 6.5, sx: 2.3, sy: .65, sz: 2.3 },
                { x: 6.8, y: 3.18, z: -7.5, sx: 2.3, sy: .65, sz: 2.3 }];
        }));
        this._add('watch-roofs', cone, this.materials.roof, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -6.8, y: 4.18, z: 6.5, sx: 2.6, sy: 1.0, sz: 2.6, ry: Math.PI * 0.25 },
                { x: 6.8, y: 4.18, z: -7.5, sx: 2.6, sy: 1.0, sz: 2.6, ry: Math.PI * 0.25 }];
        }));
        this._add('watch-lamps', sphere, this.materials.lamp, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -5.85, y: 3.65, z: 6.5, sx: .32, sy: .32, sz: .32 },
                { x: 5.85, y: 3.65, z: -7.5, sx: .32, sy: .32, sz: .32 }];
        }));

        // V15: 路侧红星战旗 (提升军事基地氛围与暖色点缀)
        this._add('banner-poles', cylinder, this.materials.dark, this._repeat(function(segment) {
            return [
                { x: -5.05, y: 1.9, z: -10.0, sx: .12, sy: 3.8, sz: .12 },
                { x:  5.05, y: 1.9, z:   1.5, sx: .12, sy: 3.8, sz: .12 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('banner-cloth', box, this.materials.bannerRed, this._repeat(function(segment) {
            return [
                { x: -5.05, y: 2.95, z: -9.92, sx: .76, sy: 1.35, sz: .06 },
                { x:  5.05, y: 2.95, z:  1.58, sx: .76, sy: 1.35, sz: .06 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 5.5 军事基地要塞细节: 雷达通信塔 + 双联军用储油罐 + 混凝土防爆墙
        this._add('radar-posts', cylinder, this.materials.dark, this._repeat(function(segment) {
            if (segment % 2 === 0) return [];
            return [{ x: -11.4, y: 2.1, z: 5.5, sx: .28, sy: 4.2, sz: .28 },
                { x: 11.4, y: 2.1, z: -5.5, sx: .28, sy: 4.2, sz: .28 }];
        }));
        this._add('radar-dishes', cone, this.materials.concrete, this._repeat(function(segment) {
            if (segment % 2 === 0) return [];
            return [{ x: -11.1, y: 4.35, z: 5.5, sx: 1.5, sy: .55, sz: 1.5, rx: .5, rz: -.45 },
                { x: 11.1, y: 4.35, z: -5.5, sx: 1.5, sy: .55, sz: 1.5, rx: -.5, rz: .45 }];
        }));
        this._add('fuel-tanks', cylinder, this.materials.roof, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 10.6, y: .72, z: 2.2, sx: 1.2, sy: 2.6, sz: 1.2, rx: Math.PI / 2 },
                { x: side * 12.1, y: .72, z: 2.2, sx: 1.2, sy: 2.6, sz: 1.2, rx: Math.PI / 2 }
            ];
        }));
        this._add('blast-walls', box, this.materials.concrete, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 6.2, y: .55, z: -2.5, sx: .38, sy: 1.1, sz: 2.8 },
                { x: side * 6.2, y: .55, z: 0.7, sx: .38, sy: 1.1, sz: 2.8 }
            ];
        }));

        // 6. 卡通多层树木(让道路两侧生机勃勃, 不再荒凉)
        this._add('tree-trunks', cylinder, this.materials.trunk, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.6, y: .95, z: 2.0, sx: .42, sy: 1.9, sz: .42 },
                { x: -side * 8.6, y: 1.1, z: -8.5, sx: .46, sy: 2.2, sz: .46 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('tree-crowns-base', sphere, this.materials.foliage, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.6, y: 2.35, z: 2.0, sx: 2.2, sy: 1.85, sz: 2.2 },
                { x: -side * 8.6, y: 2.7, z: -8.5, sx: 2.5, sy: 2.1, sz: 2.5 }
            ];
        }), ['sunny', 'forest', 'city']);
        this._add('tree-crowns-top', sphere, this.materials.foliageLight, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 7.4, y: 3.25, z: 1.9, sx: 1.45, sy: 1.35, sz: 1.45 },
                { x: -side * 8.4, y: 3.7, z: -8.4, sx: 1.65, sy: 1.45, sz: 1.65 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 7. 路边军事工事: 木纹弹药箱、沙袋掩体、防撞路障
        this._add('crates', box, this.materials.wood, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 5.25, y: .46, z: 3.2, sx: .92, sy: .92, sz: .92, ry: segment * .45 },
                { x: side * 5.95, y: .34, z: 4.3, sx: .68, sy: .68, sz: .68, ry: -segment * .35 },
                { x: side * 5.45, y: 1.18, z: 3.4, sx: .56, sy: .56, sz: .56, ry: .25 }
            ];
        }));
        this._add('sandbags', box, this.materials.sandbag, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            var rows = [];
            for (var i = 0; i < 4; i++) {
                rows.push({ x: side * (5.0 + i * .46), y: .22, z: -6.8, sx: .56, sy: .34, sz: .38, ry: side * .12 });
            }
            rows.push({ x: side * 5.45, y: .52, z: -6.8, sx: .56, sy: .32, sz: .36, ry: -side * .08 });
            rows.push({ x: side * 5.95, y: .52, z: -6.8, sx: .56, sy: .32, sz: .36, ry: side * .08 });
            return rows;
        }));
        this._add('barriers', box, this.materials.accent, this._repeat(function(segment) {
            if (segment % 2) return [];
            return [{ x: -5.1, y: .44, z: 9.2, sx: 1.25, sy: .22, sz: .22, rz: -.16 },
                { x: 5.1, y: .44, z: 9.2, sx: 1.25, sy: .22, sz: .22, rz: .16 }];
        }));
        // V15-ART-002: 路侧红色军用油桶与自然灌木丛 (非对称分布, 打破镜像感)
        this._add('oil-drums', cylinder, this.materials.drumRed, this._repeat(function(segment) {
            var side = segment % 2 ? -1 : 1;
            return [
                { x: side * 5.4, y: .48, z: -4.2, sx: .58, sy: .96, sz: .58 },
                { x: side * 6.05, y: .48, z: -4.5, sx: .58, sy: .96, sz: .58 },
                { x: -side * 5.7, y: .48, z: 7.4, sx: .58, sy: .96, sz: .58 }
            ];
        }));
        this._add('bushes', sphere, this.materials.bush, this._repeat(function(segment) {
            var side = segment % 2 ? 1 : -1;
            return [
                { x: side * 5.3, y: .45, z: -8.6, sx: 1.35, sy: .95, sz: 1.25 },
                { x: side * 6.2, y: .38, z: -9.3, sx: 1.05, sy: .78, sz: 1.05 },
                { x: -side * 5.5, y: .42, z: 4.8, sx: 1.25, sy: .88, sz: 1.15 }
            ];
        }), ['sunny', 'forest', 'city']);

        // 8. 远景连绵山丘剪影(构筑地平线层次, 彻底摆脱单调平坦感)
        this._add('far-hills', hill, this.materials.hill, this._repeat(function(segment) {
            var hL = 3.8 + (segment % 3) * 1.4;
            var hR = 4.2 + ((segment + 1) % 3) * 1.5;
            return [
                { x: -24 - (segment % 2) * 4, y: hL * 0.35, z: -4, sx: 12, sy: hL, sz: 14, ry: segment * .7 },
                { x:  24 + (segment % 2) * 4, y: hR * 0.35, z:  6, sx: 12, sy: hR, sz: 14, ry: -segment * .6 }
            ];
        }));

        // 9. 主题专属装饰
        this._add('sunny-flags', box, this.materials.accent, this._repeat(function(segment) {
            return segment % 2 ? [] : [{ x: -7.2, y: 4.35, z: 6.5, sx: 1.0, sy: .52, sz: .05 },
                { x: 7.2, y: 4.35, z: -7.5, sx: 1.0, sy: .52, sz: .05 }];
        }), ['sunny']);
        this._add('desert-rocks', hill, this.materials.rock, this._repeat(function(segment) {
            return [{ x: -8.0 - (segment % 2) * 1.5, y: .6, z: 1.2, sx: 1.6, sy: .95, sz: 1.3 },
                { x: 8.4, y: .5, z: -8.2, sx: 1.2, sy: .8, sz: 1.5 }];
        }), ['desert']);
        this._add('city-skyline', box, this.materials.city, this._repeat(function(segment) {
            var height = 6 + (segment % 3) * 2.5;
            return [{ x: -16.5, y: height / 2, z: -6, sx: 5.0, sy: height, sz: 5.5 },
                { x: 16.5, y: (height + 2) / 2, z: 4, sx: 5.0, sy: height + 2, sz: 5.5 }];
        }), ['city']);
        this._add('snow-pines', cone, this.materials.snow, this._repeat(function(segment) {
            return [{ x: -8.6, y: 2.5, z: -6, sx: 2.4, sy: 5.0, sz: 2.4 },
                { x: 8.4, y: 2.1, z: 5, sx: 2.0, sy: 4.2, sz: 2.0 }];
        }), ['snow']);

        // 10. V15: 远景阳光军事基地要塞大门 (跟随地平线, 彻底消除道路尽头空旷感!)
        this._buildHorizonFortress();
        // 11. V15-ART-005: 异步加载 Blender 4.2 雕塑模块化军事基地 GLB 组件包, 就绪后无缝升级替换低模几何体!
        this._loadBlenderEnvPack();
    }

    _loadBlenderEnvPack() {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) return;
        var self = this;
        this.ready = MilitaryArt.preload().then(function(gltf) {
            try {
                var sharedMat = null;
                var geos = {};
                gltf.scene.traverse(function(o) {
                    if (o.isMesh && o.geometry) {
                        geos[o.name] = o.geometry;
                        if (!sharedMat && o.material) sharedMat = o.material;
                    }
                });
                if (!sharedMat || !geos.PineTree) throw Error('Military environment pack is missing PineTree/material');
                // r149 linear-to-sRGB display transform matching Soldier/Enemy PBR pipeline
                sharedMat.onBeforeCompile = function(shader) {
                    shader.fragmentShader = shader.fragmentShader.replace(
                        '#include <encodings_fragment>',
                        'gl_FragColor = LinearTosRGB( gl_FragColor );'
                    );
                };
                sharedMat.customProgramCacheKey = function() { return 'v19-envpack-pbr'; };
                sharedMat.needsUpdate = true;

                // V19.0: 隐藏所有被 10 类雕塑 GLB 全面替代的旧基础方块/圆球/圆锥几何体!
                var replacedNames = {
                    'military-watch-posts': 1, 'military-watch-decks': 1, 'military-watch-roofs': 1, 'military-watch-lamps': 1,
                    'military-tank-hulls': 1, 'military-tank-tracks': 1, 'military-tank-turrets': 1, 'military-tank-barrels': 1,
                    'military-tent-bodies': 1, 'military-tent-roofs': 1,
                    'military-tree-trunks': 1, 'military-tree-crowns-base': 1, 'military-tree-crowns-top': 1,
                    'military-hangars': 1, 'military-hangar-roofs': 1,
                    'military-crates': 1, 'military-oil-drums': 1, 'military-bushes': 1,
                    'military-fuel-tanks': 1, 'military-barriers': 1, 'military-far-hills': 1,
                    'military-sandbags': 1, 'military-blast-walls': 1
                };
                for (var mi = 0; mi < self._meshes.length; mi++) {
                    if (replacedNames[self._meshes[mi].name]) {
                        self._meshes[mi].visible = false;
                        self._meshes[mi].userData.v15Replaced = true;
                    }
                }

                // 1) 高山松树 + 阔叶树双树种自然混交林 (彻底告别单调圆锥/棒棒糖树!)
                if (geos.PineTree) {
                    self._add('glb-pines', geos.PineTree, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? -1 : 1;
                        return [
                            { x: s * 7.9, y: 0, z: 2.4, sx: 1.18, sy: 1.28, sz: 1.18, ry: seg * 0.9 },
                            { x: -s * 12.4, y: 0, z: 4.8, sx: 1.48, sy: 1.58, sz: 1.48, ry: seg * 1.1 },
                            { x: s * 14.5, y: 0, z: -9.5, sx: 1.62, sy: 1.72, sz: 1.62, ry: -seg * 0.8 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                if (geos.BroadTree) {
                    self._add('glb-broadtrees', geos.BroadTree, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? 1 : -1;
                        return [
                            { x: s * 8.6, y: 0, z: -8.6, sx: 1.12, sy: 1.16, sz: 1.12, ry: seg * 1.3 },
                            { x: -s * 11.2, y: 0, z: -6.8, sx: 1.32, sy: 1.38, sz: 1.32, ry: -seg * 0.6 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                // 1b) 岩石灌木簇 (替代旧圆球灌木)
                if (geos.TacticalBush) {
                    self._add('glb-bushes', geos.TacticalBush, sharedMat, self._repeat(function(seg) {
                        var s = seg % 2 ? 1 : -1;
                        return [
                            { x: s * 5.35, y: 0, z: -8.4, sx: 1.1, sy: 1.1, sz: 1.1, ry: seg * 0.8 },
                            { x: -s * 5.45, y: 0, z: 4.9, sx: 1.0, sy: 1.0, sz: 1.0, ry: -seg * 1.2 }
                        ];
                    }), ['sunny', 'forest', 'city']);
                }
                // 2) 现代钢架装甲瞭望哨塔 (含青色战术探照灯)
                if (geos.Watchtower) {
                    self._add('glb-watchtowers', geos.Watchtower, sharedMat, self._repeat(function(seg) {
                        if (seg % 2) return [];
                        return [
                            { x: -7.2, y: 0, z: 5.5, sx: 1.08, sy: 1.08, sz: 1.08, ry: 0.35 },
                            { x:  7.4, y: 0, z: -7.5, sx: 1.08, sy: 1.08, sz: 1.08, ry: -2.75 }
                        ];
                    }));
                }
                // 2b) 拱顶肋骨重装机库 (替代旧方块营房!)
                if (geos.ArmoredHangar) {
                    self._add('glb-hangars', geos.ArmoredHangar, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [{ x: side * 10.6, y: 0, z: -3.5, sx: 1.05, sy: 1.05, sz: 1.05, ry: 0 }];
                    }));
                }
                // 3) 现代步战坦克 (带装甲裙板与青色观瞄镜)
                if (geos.ToyTank) {
                    self._add('glb-tanks', geos.ToyTank, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [{ x: side * 6.8, y: 0, z: -11.0, sx: 0.98, sy: 0.98, sz: 0.98, ry: side * -0.45 }];
                    }), ['sunny', 'desert', 'city', 'forest']);
                }
                // 4) 肋骨战术指挥帐篷
                if (geos.MilitaryTent) {
                    self._add('glb-tents', geos.MilitaryTent, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? -1 : 1;
                        return [{ x: side * 9.9, y: 0, z: 3.6, sx: 1.04, sy: 1.04, sz: 1.04, ry: side > 0 ? -1.45 : 1.45 }];
                    }), ['sunny', 'forest', 'desert']);
                }
                // 5) 沙袋掩体 + 托盘物资油桶组 (替代旧方块木箱与圆柱油桶!)
                if (geos.SandbagBunker) {
                    self._add('glb-sandbags', geos.SandbagBunker, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? -1 : 1;
                        return [{ x: side * 5.55, y: 0, z: -5.8, sx: 1.02, sy: 1.02, sz: 1.02, ry: side * -0.35 }];
                    }));
                }
                if (geos.SupplyCluster) {
                    self._add('glb-supplies', geos.SupplyCluster, sharedMat, self._repeat(function(seg) {
                        var side = seg % 2 ? 1 : -1;
                        return [
                            { x: side * 5.45, y: 0, z: 3.4, sx: 1.0, sy: 1.0, sz: 1.0, ry: side * 0.25 },
                            { x: -side * 5.65, y: 0, z: -1.8, sx: 0.92, sy: 0.92, sz: 0.92, ry: -side * 0.4 }
                        ];
                    }));
                }
                // 6) 替换远景基地要塞大门为全新重装特种指挥要塞大门!
                if (geos.BunkerGate && self._horizonFortress) {
                    var gateMesh = new THREE.Mesh(geos.BunkerGate, sharedMat);
                    gateMesh.name = 'v15-glb-bunker-gate';
                    gateMesh.scale.setScalar(1.16);
                    // 隐藏旧方块门楼, 保留三层远景山脉
                    for (var ci = 0; ci < self._horizonFortress.children.length; ci++) {
                        var ch = self._horizonFortress.children[ci];
                        if (!ch.userData.v15Mountain) ch.visible = false;
                    }
                    self._horizonFortress.add(gateMesh);
                }
                // 立即刷新实例矩阵到当前 anchor
                var curZ = self._lastSquadZ || 0;
                self.setTheme(self.themeName || 'dawn');
                self.update(curZ);
                return true;
            } catch (e) {
                console.warn('[MilitaryArt] V15 env pack load fallback:', e);
                return false;
            }
        }).catch(function(error) {
            console.warn('[MilitaryArt] environment fallback:', error.message);
            return false;
        });
    }

    _buildHorizonFortress() {
        var g = new THREE.Group();
        g.name = 'v15-horizon-fortress';
        var wallMat = this.materials.fortressStone;
        var roofMat = this.materials.roof;
        var darkMat = this.materials.dark;
        var goldMat = this.materials.accent;
        var hillMat = this.materials.hill;

        // V19.1: 三层非对称自然险峻岩峰与远景大气雾化雪山 (折线峭壁+山脊凹凸法线起伏+远景雾化融合!)
        var makeRidgeMesh = function(width, maxH, depth, seed, baseHex, midHex, peakHex, zPos) {
            var segs = 72;
            var shape = new THREE.Shape();
            shape.moveTo(-width * 0.5, -2);
            for (var i = 0; i <= segs; i++) {
                var t = i / segs;
                var x = (t - 0.5) * width;
                var env = Math.pow(Math.sin(t * Math.PI), 0.72);
                // 避免正弦波规则等距感: 叠加非公度多频折峰 + 中央峡谷豁口(突出基地要塞主视觉!)
                var valley = 1.0 - 0.34 * Math.exp(-Math.pow((t - 0.5) / 0.14, 2));
                var p1 = Math.pow(Math.abs(Math.sin(t * 9.7 + seed)), 1.35) * 0.52;
                var p2 = Math.pow(Math.abs(Math.cos(t * 21.3 + seed * 1.9)), 1.6) * 0.30;
                var p3 = Math.abs(Math.sin(t * 43.1 + seed * 3.1)) * 0.14;
                var asym = (t < 0.5 ? 1.08 : 0.94);
                var h = (0.16 + p1 + p2 + p3) * maxH * (0.38 + 0.62 * env) * valley * asym;
                shape.lineTo(x, Math.max(1.0, h));
            }
            shape.lineTo(width * 0.5, -2);
            shape.closePath();
            var geo = new THREE.ExtrudeGeometry(shape, { depth: depth, bevelEnabled: true, bevelSegments: 1, bevelSize: 0.45, bevelThickness: 0.65, curveSegments: 2 });
            geo.translate(0, 0, -depth * 0.5);
            var pos = geo.attributes.position;
            var cols = new Float32Array(pos.count * 3);
            var cBase = new THREE.Color(baseHex);
            var cMid = new THREE.Color(midHex);
            var cPeak = new THREE.Color(peakHex);
            var cTmp = new THREE.Color();
            for (var vi = 0; vi < pos.count; vi++) {
                var vx = pos.getX(vi), vy = pos.getY(vi), vz = pos.getZ(vi);
                // 赋予山体前后岩壁凹凸起伏, 消除纸板拉伸感
                if (vy > 0.5) {
                    pos.setZ(vi, vz + Math.sin(vx * 0.23 + vy * 0.31 + seed) * 1.35);
                }
                var snowNoise = Math.sin(vx * 0.37 + seed * 2.0) * 0.08;
                var ht = Math.max(0, Math.min(1, (vy / maxH) + snowNoise));
                if (ht < 0.52) cTmp.copy(cBase).lerp(cMid, ht / 0.52);
                else cTmp.copy(cMid).lerp(cPeak, (ht - 0.52) / 0.48);
                cols[vi * 3] = cTmp.r; cols[vi * 3 + 1] = cTmp.g; cols[vi * 3 + 2] = cTmp.b;
            }
            geo.computeVertexNormals();
            geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
            var mat = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, vertexColors: true, roughness: 0.94, metalness: 0.02, flatShading: true, fog: true, envMapIntensity: 0.18 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(0, -0.6, zPos);
            mesh.userData.v15Mountain = true;
            return mesh;
        };
        g.add(makeRidgeMesh(122, 12.5, 4.5, 0.8, 0x2A4338, 0x3F5E4E, 0x6A877B, -13));  // 近景苍翠林岩脊
        g.add(makeRidgeMesh(152, 20.5, 5.5, 2.4, 0x435B73, 0x68839C, 0xC8DDF0, -25));  // 中景冷蓝峭壁岩峰
        g.add(makeRidgeMesh(184, 28.5, 6.5, 4.3, 0x6D8DA8, 0x9BB8D1, 0xF4FAFF, -39));  // 远景大气雾化雪峰

        // 要塞主城墙(左右两翼 + 跨路门楼)
        var leftWall = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 3.2), wallMat);
        leftWall.position.set(-14.5, 3.1, 0); g.add(leftWall);
        var rightWall = new THREE.Mesh(new THREE.BoxGeometry(16, 6.2, 3.2), wallMat);
        rightWall.position.set(14.5, 3.1, 0); g.add(rightWall);

        // 跨路门楼顶梁 + 门洞阴影
        var archTop = new THREE.Mesh(new THREE.BoxGeometry(13.6, 3.8, 3.8), wallMat);
        archTop.position.set(0, 7.6, 0); g.add(archTop);
        var archRoof = new THREE.Mesh(new THREE.BoxGeometry(14.4, 0.7, 4.4), roofMat);
        archRoof.position.set(0, 9.8, 0); g.add(archRoof);
        var gateVoid = new THREE.Mesh(new THREE.BoxGeometry(8.6, 5.8, 2.2), darkMat);
        gateVoid.position.set(0, 2.9, -0.4); g.add(gateVoid);

        // 左右门楼双碉堡塔
        for (var s = -1; s <= 1; s += 2) {
            var tower = new THREE.Mesh(new THREE.BoxGeometry(4.4, 10.8, 4.6), wallMat);
            tower.position.set(s * 6.4, 5.4, 0.3); g.add(tower);
            var cap = new THREE.Mesh(new THREE.BoxGeometry(5.0, 0.9, 5.2), roofMat);
            cap.position.set(s * 6.4, 11.1, 0.3); g.add(cap);
            // 碉堡高光警示条
            var band = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.45, 4.7), goldMat);
            band.position.set(s * 6.4, 9.6, 0.3); g.add(band);
        }

        // 门楼正中军工金星徽章
        var emblemBg = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.35, 16), roofMat);
        emblemBg.rotation.x = Math.PI * 0.5;
        emblemBg.position.set(0, 7.6, 2.0); g.add(emblemBg);
        var emblemStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.92, 0), goldMat);
        emblemStar.scale.set(1, 1, 0.35);
        emblemStar.position.set(0, 7.6, 2.25); g.add(emblemStar);

        g.scale.setScalar(0.68);
        g.position.set(0, 0, -74);
        this.root.add(g);
        this._horizonFortress = g;
    }

    setTheme(themeName) {
        var themeToBiome = {
            dawn: 'sunny', noon: 'desert', overcast: 'city', sunset: 'forest', dusk: 'snow',
            default: 'sunny', apocalypse: 'desert', cave: 'forest', mechanical: 'city', fortress: 'snow'
        };
        var biome = themeToBiome[themeName] || 'sunny';
        var palettes = {
            sunny:  { road: 0x929EA9, ground: 0x4A6E3E, shoulder: 0x82785E, structure: 0x8FA49E, roof: 0x2E4756, accent: 0xE6AD32, hill: 0x5B8650, curbB: 0x485668 },
            desert: { road: 0xACA292, ground: 0xB89158, shoulder: 0x9E7A48, structure: 0xB59A72, roof: 0x594C3C, accent: 0xDC842C, hill: 0xA87A44, curbB: 0x5C5246 },
            city:   { road: 0x8A96A2, ground: 0x627074, shoulder: 0x586368, structure: 0x7A8B94, roof: 0x334452, accent: 0xE6AE3C, hill: 0x586972, curbB: 0x435060 },
            forest: { road: 0x8E9A94, ground: 0x446B39, shoulder: 0x73674E, structure: 0x647D58, roof: 0x294232, accent: 0xD69C38, hill: 0x3F6639, curbB: 0x44524A },
            snow:   { road: 0x9CAAB6, ground: 0xBBD0DC, shoulder: 0x96A8B4, structure: 0x849CA8, roof: 0x385262, accent: 0xE8A23A, hill: 0xA4BECD, curbB: 0x4D5E70 }
        };
        var palette = palettes[biome];
        this.materials.road.color.setHex(palette.road);
        this.materials.ground.color.setHex(palette.ground);
        this.materials.shoulder.color.setHex(palette.shoulder || palette.ground);
        this.materials.structure.color.setHex(palette.structure);
        this.materials.roof.color.setHex(palette.roof);
        this.materials.accent.color.setHex(palette.accent);
        this.materials.hill.color.setHex(palette.hill);
        this.materials.curbB.color.setHex(palette.curbB);

        for (var i = 0; i < this._meshes.length; i++) {
            if (this._meshes[i].userData.v15Replaced) { this._meshes[i].visible = false; continue; }
            var allowed = this._meshes[i].userData.biomes;
            this._meshes[i].visible = !allowed || allowed.indexOf(biome) >= 0;
        }
        if (this.world._v42Environment && this.world._v42Environment.root) this.world._v42Environment.root.visible = false;
        if (this.world.roadGroup) this.world.roadGroup.visible = false;
        if (this.world._v121Scenery) {
            for (var key in this.world._v121Scenery.groups) this.world._v121Scenery.groups[key].visible = false;
            if (this.world._v121Scenery.active) this.world._v121Scenery.active.visible = false;
        }
        this.biome = biome;
        this.themeName = themeName;
        // Hidden matrices may have been skipped for a different biome/anchor.
        this._anchor = Infinity;
    }

    update(squadZ) {
        this._lastSquadZ = squadZ || 0;
        if (this._horizonFortress) {
            this._horizonFortress.position.z = (squadZ || 0) - 74;
        }
        var anchor = Math.floor((squadZ || 0) / this._segmentLength) * this._segmentLength;
        if (anchor === this._anchor) return;
        this._anchor = anchor;
        var scratch = this._scratch;
        for (var m = 0; m < this._meshes.length; m++) {
            var mesh = this._meshes[m];
            if (!mesh.visible) continue;
            var records = mesh.userData.records;
            for (var i = 0; i < records.length; i++) {
                var item = records[i];
                scratch.position.set(item.x, item.y, anchor + 24 - item.segment * this._segmentLength + item.z);
                scratch.rotation.set(item.rx || 0, item.ry || 0, item.rz || 0);
                scratch.scale.set(item.sx || 1, item.sy || 1, item.sz || 1);
                scratch.updateMatrix();
                mesh.setMatrixAt(i, scratch.matrix);
            }
            mesh.instanceMatrix.needsUpdate = true;
        }
    }
};


/* ===== [[ js/config.js ]] ===== */
// ===== 膨胀小队 - 全局配置 =====
const CONFIG = {
    // 跑道
    LANE_WIDTH: 2.0,
    LANE_COUNT: 3,
    LANE_X: [-2.0, 0, 2.0],
    ROAD_HALF_WIDTH: 3.4,

    // ===== V5.1 坐标方向约定 (唯一事实来源, 禁止在各文件散写正负号) =====
    // 世界: +X向右, +Y向上, 玩家军团面朝-Z(屏幕深处)推进, 敌人面朝+Z(镜头方向)追击防线。
    DIRS: {
        FORWARD_SIGN: -1,       // 玩家前进方向: squad.z 每秒增量符号
        ENEMY_ADVANCE_SIGN: 1,  // 怪物追击方向: 朝防线(+Z)移动
        SHOOT_SIGN: -1,         // 子弹飞行方向
        GATE_PASS_SIGN: -1,     // 穿门: squad.z 递减跨越 gate.z
        CAMERA_SIDE: 1          // 摄像机位于防线的(+Z)后方
    },

    // 小队
    SQUAD_START_COUNT: 1,
    SQUAD_MAX_COUNT: 500,
    SQUAD_SPEED: 3.3,
    FORMATION_COLS: 7,
    FORMATION_SPACING_X: 0.52,
    FORMATION_SPACING_Z: 0.46,

    // ===== V4.0 移动手感 (P0: 全部可配置, 禁止写死在事件处理中) =====
    MOVE: {
        // V5.0 语义: 越大越灵敏(移动越快)。1.0 = 拖过整屏宽度横穿全部可玩范围。
        touchSensitivity: 1.0,
        followSmoothTime: 0.15,
        laneTransitionTime: 0.45,
        gateMagnetDist: 0.55,
        gateMagnetLambda: 6.0,
        centerMargin: 0.12,
        minCenterRange: 1.1,
        keyStep: 1.2
    },

    // ===== V5.1 节奏控制 (持续推进模式, V5.1.1 尸潮密度强化) =====
    PACING: {
        waveTriggerAhead: 14,       // 波次激活提前量(队伍距波点z, 世界单位)
        spawnIntervalMin: 0.18,
        spawnIntervalMax: 0.3,
        batchGapMin: 0.25,          // V5.1.1: 同一波内后续批次密接间隔 — alive持续堆积成墙
        batchGapMax: 0.4,
        batchSizeBase: 8,           // V5.1.5: 批次与目标活敌匹配(旧上限16导致alive永远堆不到目标)
        batchSizeMax: 48,
        fillFrameInterval: 0.01,
        trickleInterval: 0.15,      // V5.1.5: 涓流冷却(秒/只) — alive达标后6.7只/s持续施压
        spawnDepth: 8,
        spawnDistance: 14,          // 留足开火距离，不贴脸刷新
        bossTriggerAhead: 24,
        bossWarningTime: 2.0,
        bossSpawnSetback: 4,
        firstContactGrace: 0.65,
        waveRestMin: 0.35,
        waveRestMax: 0.65
    },

    // ===== V5.1 / V15-GAMEPLAY-002 每关场上活敌上限矩阵 (全10关纵深铺满跑道至远景基地大门) =====
    MAX_ALIVE: [70, 140, 190, 260, 240, 240, 240, 240, 240, 240],
    ALIVE_TARGET: [70, 110, 140, 170, 160, 160, 160, 160, 160, 160],
    // V6.0: 末日核心主题(第6关) — 场景配色/雾气/灯光与能源核心参数
    APOCALYPSE_THEME: {
        sky: 0x4A2C3A, fog: 0x5A3040, fogNear: 30, fogFar: 95,
        grass: 0x3E5C43, grassDark: 0x33503A, road: 0x6E6470, roadEdge: 0x5A5060,
        hemiSky: 0x8A6070, hemiGround: 0x2E3A30, sunColor: 0xFFB0A0, sunIntensity: 0.55,
        coreHp: 900, coreBuffRadius: 9, coreBuffInterval: 4.5,
        star2Count: 250, star3Kills: 700
    },
    // ===== V13: 关卡视觉主题注册表 — 天穹渐变/雾/灯光/环境染色的表现层数据 =====
    // 仅影响视觉呈现; 关卡结构/刷怪/胜负完全不受影响。LEVELS[].theme 引用此处键名。
    // sky: 穹顶渐变 4 停靠点(顶→地平线) | envTint: 环境(草地/建筑实例)染色目标 | domeTint: 穹顶乘色
    WORLD_THEMES: {
        default: {
            sky: ['#1B5DA8', '#4E95D8', '#C8D8E4', '#EFE1C8'],
            fog: 0xD2D4CE, fogNear: 44, fogFar: 132,
            sunColor: 0xFFE6B8, sunIntensity: 1.04,
            hemiSky: 0x9CCBF5, hemiGround: 0x3D5236, hemiIntensity: 0.50,
            envTint: 0x5A7E54, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        dawn: { // L1 新兵训练 — V18.0 黄金战术日光+空气透视(告别平淡塑料感)
            sky: ['#1B5DA8', '#4E95D8', '#C8D8E4', '#EFE1C8'],
            fog: 0xD2D4CE, fogNear: 44, fogFar: 132,
            sunColor: 0xFFE6B8, sunIntensity: 1.04,
            hemiSky: 0x9CCBF5, hemiGround: 0x3D5236, hemiIntensity: 0.50,
            envTint: 0x5A7E54, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        noon: { // L2 快速尸潮 — 战术高对比晴空
            sky: ['#266DB8', '#5EA4DE', '#BBD6E8', '#E2EAEF'],
            fog: 0xC6D6E2, fogNear: 42, fogFar: 126,
            sunColor: 0xFFEDD0, sunIntensity: 0.96,
            hemiSky: 0x9CCBF5, hemiGround: 0x4E6E52, hemiIntensity: 0.48,
            envTint: 0x5E8566, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        overcast: { // L3 盾牌军团 — 阴云灰蓝(压抑感)
            sky: ['#5E7E9E', '#8FA9C2', '#C2D2DE', '#DDE6EC'],
            fog: 0xC2D2DE, fogNear: 38, fogFar: 118,
            sunColor: 0xE8EEF4, sunIntensity: 0.62,
            hemiSky: 0xA9BFD2, hemiGround: 0x7E9C84, hemiIntensity: 0.55,
            envTint: 0x6E8A7A, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        sunset: { // L4 变异尸潮 — 暖橙天际
            sky: ['#7E86C2', '#D8A678', '#F2CFA0', '#F8E4C2'],
            fog: 0xE8D2B2, fogNear: 42, fogFar: 125,
            sunColor: 0xFFD9A8, sunIntensity: 0.66,
            hemiSky: 0xD2C2E8, hemiGround: 0x9C9A6E, hemiIntensity: 0.5,
            envTint: 0x9C9A6E, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        dusk: { // L5 终局Boss — 暮色
            sky: ['#4E5E9E', '#8E7EA8', '#C8A2B2', '#E2C8C2'],
            fog: 0xD2BCC2, fogNear: 36, fogFar: 112,
            sunColor: 0xFFC8A0, sunIntensity: 0.58,
            hemiSky: 0x9EA2C8, hemiGround: 0x7E7C8E, hemiIntensity: 0.5,
            envTint: 0x6E7C8E, domeTint: 0xFFFFFF, ground: 'asphalt'
        },
        apocalypse: { // L6/L10 末日核心 — 兼容原 APOCALYPSE_THEME 视觉值
            sky: ['#6E4050', '#8A5060', '#A86870', '#C8A0A0'],
            fog: 0x5A3040, fogNear: 30, fogFar: 95,
            sunColor: 0xFFB0A0, sunIntensity: 0.55,
            hemiSky: 0x8A6070, hemiGround: 0x2E3A30, hemiIntensity: 0.5,
            envTint: 0x3E5C43, domeTint: 0x8A5060, ground: 'cracked'
        },
        cave: { // L7 地下巢穴 — 深蓝绿洞穴
            sky: ['#0E2430', '#16323C', '#1E424A', '#2A545C'],
            fog: 0x142E38, fogNear: 26, fogFar: 88,
            sunColor: 0xA8D8D0, sunIntensity: 0.42,
            hemiSky: 0x2E5A5C, hemiGround: 0x1A2E28, hemiIntensity: 0.55,
            envTint: 0x4A6A5C, domeTint: 0xFFFFFF, ground: 'rock'
        },
        mechanical: { // L8 机械废土 — 铁灰锈橙
            sky: ['#4E5258', '#6E7076', '#8E8C86', '#A8A096'],
            fog: 0x8E8C86, fogNear: 34, fogFar: 108,
            sunColor: 0xFFE2C0, sunIntensity: 0.6,
            hemiSky: 0x9EA2A8, hemiGround: 0x6E6E6A, hemiIntensity: 0.48,
            envTint: 0x7A7E82, domeTint: 0xFFFFFF, ground: 'metal'
        },
        fortress: { // L9 最终防线 — 冷钢蓝
            sky: ['#2E4E7E', '#4E6E9E', '#7E9EC2', '#B2C8DC'],
            fog: 0x8AA2B8, fogNear: 34, fogFar: 112,
            sunColor: 0xE2F0FF, sunIntensity: 0.62,
            hemiSky: 0x7E9EC8, hemiGround: 0x4A5E72, hemiIntensity: 0.5,
            envTint: 0x5E7A8E, domeTint: 0xFFFFFF, ground: 'concrete'
        }
    },

    // 试玩强化：每关 authored wave 总量×4，全路高密尸潮压迫感
    ENEMY_WAVE_MULTIPLIER: 4,
    ENEMY_MAX_ALIVE_MULTIPLIER: 2.4,
    ENEMY_ALIVE_TARGET_MULTIPLIER: 2.2,
    // V18.0: 关卡HP倍率 (L1即具备真实翻车风险与紧张感, 配合1人开局与精简增兵门, 目标L1无复活70-80%)
    ENEMY_HP_MULTIPLIER: [0.84, 0.96, 1.12, 1.32, 1.52, 1.72, 1.92, 2.10, 2.28, 2.45],


    // 射击 (V15-GAMEPLAY-004: 适度下调初始射速 2.2→1.75 降低前期DPS, 增强"快冲过来又险险顶住"的紧迫爽感)
    BULLET_SPEED: 28,
    BULLET_DAMAGE_BASE: 1,
    BULLET_FIRE_RATE_BASE: 1.75, // 每秒每兵射击次数
    BULLET_MAX_VISIBLE: 120,    // 最大可见弹道数
    BULLET_RANGE: 18,           // 子弹射程

    // 僵尸属性 (V18.0 商业版校准: 1人起步下不造血牛怪, 以密度/混编/机制制造压迫感)
    ZOMBIE: {
        normal:  { hp: 10, speed: 1.75, scale: 1.45, color: 0x8FBC5A, killScore: 1 },
        fast:    { hp: 7,  speed: 2.6,  scale: 1.18, color: 0xA9CB6B, killScore: 1 },
        shield:  { hp: 28, speed: 1.18, scale: 1.6,  color: 0x7EA35F, killScore: 2 },
        split:   { hp: 12, speed: 1.38, scale: 1.28, color: 0xA583C9, killScore: 2 },
        spitter: { hp: 11, speed: 1.40, scale: 1.38, color: 0x63C24B, killScore: 2 }, // 酸液远程怪(非追踪可走位躲避)
        thrower: { hp: 16, speed: 1.15, scale: 1.48, color: 0xF59E0B, killScore: 3 }, // V18.0: 抛物线投弹怪(1.5s红圈预警)
        flanker: { hp: 9,  speed: 2.15, scale: 1.24, color: 0x22D3EE, killScore: 2 }, // V18.0: 路边翻越伏击怪(护栏外跃入)
        elite:   { hp: 65, speed: 1.02, scale: 2.5,  color: 0x6F9A52, killScore: 5 },
        bomber:  { hp: 16, speed: 2.05, scale: 1.32, color: 0xC94B4B, killScore: 2 }, // V11.5: 爆炸僵尸(死亡自爆波及)
        boss:    { hp: 200, speed: 0.9, scale: 3.9,  color: 0x9C3B32, killScore: 50 }
    },

    // 僵尸攻击小队的距离
    ZOMBIE_ATTACK_DIST: 1.2,
    // 僵尸攻击间隔(秒)
    ZOMBIE_ATTACK_INTERVAL: 1.05,
    // 每次攻击杀死士兵数
    ZOMBIE_ATTACK_KILL: 1,

    // 相机 (V3.7: 抬高+拉远+看更远 — 军团占画面下部合理比例, 远处怪潮可见, 不挡路)
    CAMERA_OFFSET_Y: 6.1,
    CAMERA_OFFSET_Z: 7.8,
    CAMERA_LOOK_AHEAD: -8.5,
    CAMERA_FOLLOW_X: 0.32,
    CAMERA_FOV: 53,

    // 特效
    PARTICLE_MAX: 300,

    // 颜色方案 (V2 商业级卡通配色)
    COLORS: {
        sky: 0x87CEEB,
        fog: 0xB8D8F0,
        // 道路: 浅灰紫柏油
        road: 0xB8B4C8,
        roadEdge: 0x9A94B0,
        roadLine: 0xF0EEF5,
        grass: 0x719C80,
        grassDark: 0x537A64,
        // 士兵: 明亮蓝
        soldierBlue: 0x3B82F6,
        soldierHelmet: 0x1E3A8A,   // V4.3: 深藏青头盔(与亮蓝军服色块分离, 背面可辨头/身)
        soldierVest: 0x1E40AF,
        soldierPants: 0x2C3E60,
        skin: 0xF5C99B,
        // 僵尸肤色
        zombieSkin: 0x8FAE6E,
        zombieSkinDark: 0x6B8A52,
        zombieCloth: 0x6B5B45,
        // 子弹
        bulletGold: 0xFFD700,
        bulletCore: 0xFFF3B0,
        // 门
        gateGlass: 0x88CCFF,
    },

    // 门稀有度配色 (V3.1: 玻璃加深饱和, 对抗过曝保持色彩可读)
    GATE_RARITY: {
        common:  { frame: 0x2F6FE0, glass: 0x5FA8F5, glow: 0x60A5FA },  // 蓝
        rare:    { frame: 0x7C3AED, glass: 0xA78BFA, glow: 0xA78BFA },  // 紫
        epic:    { frame: 0xD97706, glass: 0xF5B93A, glow: 0xFBBF24 },  // 金
        danger:  { frame: 0xDC2626, glass: 0xF87171, glow: 0xF87171 },  // 红
    }
};

// ===== 关卡数据 (V5.1 五关正式版: 阵地防守流程) =====
// type: 'gates' 状态门 | 'wave' 防守波 | 'boss' Boss战
// gates: 每门占一条跑道 lane: 0左 1中 2右; wave.z 即防守锚点(队伍停于 z+defenseStandoff)
// rewardCoins: 首次通关奖励金币
const LEVELS = [
    // ============ 第1关 新兵训练 (总怪44, 教学) ============
    {
        name: '第 1 关 新兵训练',
        theme: 'dawn',
        startCount: 1,
        totalZ: -96,
        rewardCoins: 60,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 3, label: '+3' },
                { lane: 1, op: 'add', value: 2, label: '+2' },
                { lane: 2, op: 'add', value: 1, label: '+1' }
            ]},
            { type: 'wave', z: -18, enemies: [ { type: 'normal', count: 7 }, { type: 'fast', count: 3 } ] },
            { type: 'gates', z: -28, gates: [
                { lane: 0, op: 'add', value: 2, label: '+2' },
                { lane: 1, op: 'buff', value: 'damage', label: '输出+1' },
                { lane: 2, op: 'add', value: 3, label: '+3' }
            ]},
            { type: 'wave', z: -40, enemies: [ { type: 'normal', count: 10 }, { type: 'fast', count: 5 } ] },
            { type: 'gates', z: -52, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 3, label: '+3' },
                { lane: 2, op: 'buff', value: 'crit', label: '暴击+5%' }
            ]},
            { type: 'wave', z: -64, enemies: [ { type: 'normal', count: 11 }, { type: 'fast', count: 5 }, { type: 'shield', count: 2 }, { type: 'flanker', count: 3 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'normal', count: 10 }, { type: 'shield', count: 2 }, { type: 'flanker', count: 3 } ] },
            // V18.0: 适配1人开局与精简增兵门的L1后半段混编怪潮 (实机×4仍保持密集尸潮, 无复活通关率约70-80%)
            { type: 'wave', z: -85, enemies: [ { type: 'normal', count: 8 }, { type: 'fast', count: 4 }, { type: 'shield', count: 2 }, { type: 'flanker', count: 3 } ] },
            { type: 'wave', z: -91, enemies: [ { type: 'normal', count: 8 }, { type: 'fast', count: 4 }, { type: 'shield', count: 2 }, { type: 'flanker', count: 3 } ] }
        ]
    },
    // ============ 第2关 快速尸潮 (总怪60, 火力分配) ============
    {
        name: '第 2 关 快速尸潮',
        theme: 'noon',
        startCount: 1,
        totalZ: -104,
        rewardCoins: 80,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 3, label: '+3' },
                { lane: 1, op: 'add', value: 2, label: '+2' },
                { lane: 2, op: 'add', value: 1, label: '+1' }
            ]},
            { type: 'wave', z: -20, enemies: [ { type: 'fast', count: 32 }, { type: 'normal', count: 28 } ] },
            { type: 'gates', z: -34, gates: [
                { lane: 0, op: 'skill', value: 'roll' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -46, enemies: [ { type: 'fast', count: 44 }, { type: 'normal', count: 30 }, { type: 'flanker', count: 8 } ] },
            { type: 'gates', z: -60, gates: [
                { lane: 0, op: 'buff', value: 'firerate', label: '射速+10%' },
                { lane: 1, op: 'add', value: 3, label: '+3' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -72, enemies: [ { type: 'fast', count: 56 }, { type: 'normal', count: 30 }, { type: 'shield', count: 10 }, { type: 'flanker', count: 10 }, { type: 'spitter', count: 8 } ] },
            { type: 'wave', z: -86, enemies: [ { type: 'fast', count: 20 }, { type: 'spitter', count: 6 }, { type: 'thrower', count: 6 }, { type: 'flanker', count: 4 } ] },
            // V16.2-GAMEPLAY-005: L2后半段齐聚6种怪(含远程酸液怪+抛物线投弹怪+路边伏击怪)
            { type: 'wave', z: -93, enemies: [ { type: 'normal', count: 24 }, { type: 'fast', count: 12 }, { type: 'spitter', count: 6 }, { type: 'thrower', count: 4 }, { type: 'flanker', count: 4 } ] },
            { type: 'wave', z: -99, enemies: [ { type: 'normal', count: 20 }, { type: 'fast', count: 10 }, { type: 'shield', count: 6 }, { type: 'spitter', count: 6 }, { type: 'thrower', count: 4 }, { type: 'flanker', count: 4 } ] }
        ]
    },
    // ============ 第3关 盾牌军团 (总怪78, 破防思路) ============
    {
        name: '第 3 关 盾牌军团',
        theme: 'overcast',
        startCount: 1,
        totalZ: -122,
        rewardCoins: 110,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 4, label: '+4' },
                { lane: 1, op: 'add', value: 3, label: '+3' },
                { lane: 2, op: 'add', value: 2, label: '+2' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'shield', count: 24 }, { type: 'normal', count: 48 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'add', value: 4, label: '+4' },
                { lane: 2, op: 'buff', value: 'firerate', label: '射速+10%' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'shield', count: 42 }, { type: 'fast', count: 40 } ] },
            { type: 'gates', z: -64, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'freeze', label: '冰冻弹' }
            ]},
            { type: 'wave', z: -78, enemies: [ { type: 'shield', count: 32 }, { type: 'normal', count: 48 }, { type: 'spitter', count: 14 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 12 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'shield', count: 22 }, { type: 'normal', count: 40 }, { type: 'spitter', count: 16 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 8 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'shield', count: 35 }, { type: 'fast', count: 29 }, { type: 'flanker', count: 8 }, { type: 'thrower', count: 6 } ] },
            // V15-GAMEPLAY-002 / V16.2: 全程铺满L3后半段混编尸潮
            { type: 'wave', z: -114, enemies: [ { type: 'normal', count: 26 }, { type: 'fast', count: 12 }, { type: 'split', count: 8 }, { type: 'flanker', count: 8 }, { type: 'thrower', count: 6 } ] },
            { type: 'wave', z: -118, enemies: [ { type: 'normal', count: 24 }, { type: 'fast', count: 12 }, { type: 'shield', count: 10 }, { type: 'thrower', count: 6 }, { type: 'flanker', count: 4 } ] }
        ]
    },
    // ============ 第4关 变异尸潮 (总怪96, 组合压力) ============
    {
        name: '第 4 关 变异尸潮',
        theme: 'sunset',
        startCount: 1,
        totalZ: -126,
        rewardCoins: 140,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 12, label: '+12' },
                { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 2, op: 'buff', value: 'damage', label: '输出+1' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'split', count: 51 }, { type: 'fast', count: 66 } ] },
            { type: 'gates', z: -36, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
            ]},
            { type: 'wave', z: -50, enemies: [ { type: 'split', count: 93 }, { type: 'shield', count: 36 }, { type: 'fast', count: 51 } ] },
            { type: 'gates', z: -64, gates: [ { lane: 0, op: 'skill', value: 'roll' }, { lane: 1, op: 'skill', value: 'roll' }, { lane: 2, op: 'skill', value: 'roll' } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'split', count: 66 }, { type: 'spitter', count: 51 }, { type: 'normal', count: 66 } ] },
            { type: 'wave', z: -94, enemies: [ { type: 'split', count: 93 }, { type: 'fast', count: 78 }, { type: 'shield', count: 27 } ] },
            { type: 'wave', z: -108, enemies: [ { type: 'split', count: 51 }, { type: 'spitter', count: 36 } ] },
            // V15-GAMEPLAY-002: 全程铺满L4后半段尸潮长河
            { type: 'wave', z: -115, enemies: [ { type: 'normal', count: 28 }, { type: 'fast', count: 14 }, { type: 'spitter', count: 8 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 6 } ] },
            { type: 'wave', z: -121, enemies: [ { type: 'normal', count: 24 }, { type: 'shield', count: 10 }, { type: 'bomber', count: 6 }, { type: 'thrower', count: 6 }, { type: 'flanker', count: 6 } ] }
        ]
    },
    // ============ 第5关 终局Boss (总怪127+Boss, 三阶段挑战) ============
    {
        name: '第 5 关 终局Boss',
        theme: 'dusk',
        startCount: 1,
        totalZ: -166,
        rewardCoins: 200,
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 15, label: '+15' },
                { lane: 1, op: 'mul', value: 2, label: '\u00d72' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -22, enemies: [ { type: 'normal', count: 87 }, { type: 'fast', count: 75 } ] },
            { type: 'gates', z: -38, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -52, enemies: [ { type: 'elite', count: 15 }, { type: 'shield', count: 51 }, { type: 'normal', count: 75 } ] },
            { type: 'gates', z: -68, gates: [
                { lane: 0, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 1, op: 'buff', value: 'vamp', label: '吸血' },
                { lane: 2, op: 'mul', value: 2, label: '\u00d72' }
            ]},
            { type: 'wave', z: -82, enemies: [ { type: 'split', count: 66 }, { type: 'spitter', count: 51 }, { type: 'fast', count: 66 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 18 }, { type: 'shield', count: 51 }, { type: 'spitter', count: 36 }, { type: 'normal', count: 66 } ] },
            { type: 'wave', z: -124, enemies: [ { type: 'elite', count: 15 }, { type: 'normal', count: 87 }, { type: 'fast', count: 51 } ] },
            // V15-GAMEPLAY-002: 全程铺满L5 Boss前尸潮长河 (保留距Boss至少9米缓冲)
            { type: 'wave', z: -132, enemies: [ { type: 'normal', count: 30 }, { type: 'fast', count: 14 }, { type: 'shield', count: 10 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 6 } ] },
            { type: 'wave', z: -141, enemies: [ { type: 'normal', count: 24 }, { type: 'shield', count: 12 }, { type: 'elite', count: 3 }, { type: 'thrower', count: 5 }, { type: 'flanker', count: 5 } ] },
            { type: 'boss', z: -150, boss: { type: 'boss', hp: 2600 } }
        ]
    }
    ,
    // ============ 第6关 末日核心 · 尸潮源头 (V6.0 终局关) ============
    {
        name: '第 6 关 末日核心',
        startCount: 1,
        totalZ: -180,
        rewardCoins: 300,
        theme: 'apocalypse',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 18, label: '+18' },
                { lane: 1, op: 'mul', value: 2, label: '×2' },
                { lane: 2, op: 'buff', value: 'damage2', label: '输出+2' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'normal', count: 90 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -40, gates: [
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 5 }, { type: 'shield', count: 35 }, { type: 'normal', count: 55 } ] },
            { type: 'energy', z: -72, core: { hp: 900, buffRadius: 9 } },
            { type: 'gates', z: -86, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'pierce', label: '穿透+1' }
            ]},
            { type: 'wave', z: -102, enemies: [ { type: 'elite', count: 8 }, { type: 'spitter', count: 40 }, { type: 'split', count: 45 }, { type: 'fast', count: 45 } ] },
            { type: 'gates', z: -118, gates: [
                { lane: 0, op: 'addpct', value: 40, label: '+40%' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -134, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 50 }, { type: 'spitter', count: 35 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -150, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'explosive', label: '爆炸弹' }
            ]},
            { type: 'wave', z: -156, enemies: [ { type: 'normal', count: 26 }, { type: 'fast', count: 14 }, { type: 'shield', count: 10 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 8 } ] },
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 5200, style: 'overlord', title: '末日吞噬者' } }
        ]
    }
    ,
    // ============ 第7关 地下巢穴 (V8.0, V8.0.1: 补人数门防软锁) ============
    {
        name: '第 7 关 地下巢穴',
        startCount: 1,
        totalZ: -180,
        rewardCoins: 350,
        theme: 'cave',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'normal', count: 80 }, { type: 'fast', count: 50 } ] },
            { type: 'gates', z: -40, gates: [
                { lane: 0, op: 'addpct', value: 30, label: '+30%' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -56, enemies: [ { type: 'elite', count: 6 }, { type: 'fast', count: 60 }, { type: 'normal', count: 50 } ] },
            { type: 'wave', z: -78, enemies: [ { type: 'elite', count: 5 }, { type: 'shield', count: 40 }, { type: 'spitter', count: 25 } ] },
            { type: 'gates', z: -96, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -112, enemies: [ { type: 'elite', count: 8 }, { type: 'split', count: 60 }, { type: 'shield', count: 40 } ] },
            { type: 'gates', z: -128, gates: [
                { lane: 0, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -137, enemies: [ { type: 'normal', count: 26 }, { type: 'fast', count: 14 }, { type: 'split', count: 12 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 8 } ] },
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 4500, style: 'hivelord', title: '巢穴之母' } }
        ]
    },
    // ============ 第8关 机械废土 (V8.0, V8.0.1: 全关零人数门修复) ============
    {
        name: '第 8 关 机械废土',
        startCount: 1,
        totalZ: -190,
        rewardCoins: 400,
        theme: 'mechanical',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 25, label: '+25' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'shield', count: 40 }, { type: 'normal', count: 60 }, { type: 'fast', count: 40 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'addpct', value: 30, label: '+30%' },
                { lane: 1, op: 'buff', value: 'chain', label: '连锁闪电' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 8 }, { type: 'spitter', count: 40 }, { type: 'fast', count: 50 }, { type: 'bomber', count: 10 } ] },
            { type: 'energy', z: -76, core: { hp: 1400, buffRadius: 10 } },
            { type: 'gates', z: -92, gates: [
                { lane: 0, op: 'add', value: 20, label: '+20' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -108, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 50 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -124, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'crit2', label: '暴击+10%' }
            ]},
            { type: 'wave', z: -136, enemies: [ { type: 'normal', count: 26 }, { type: 'fast', count: 14 }, { type: 'spitter', count: 10 }, { type: 'bomber', count: 6 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 8 } ] },
            { type: 'boss', z: -148, boss: { type: 'boss', hp: 5500, style: 'titan', title: '机械巨尸' } }
        ]
    },
    // ============ 第9关 最终防线 (V8.0) ============
    {
        name: '第 9 关 最终防线',
        startCount: 1,
        totalZ: -200,
        rewardCoins: 450,
        theme: 'fortress',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 45, label: '+45' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -24, enemies: [ { type: 'elite', count: 6 }, { type: 'normal', count: 80 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -42, gates: [
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'freeze', label: '冰冻弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -58, enemies: [ { type: 'elite', count: 10 }, { type: 'shield', count: 60 }, { type: 'spitter', count: 45 } ] },
            { type: 'gates', z: -76, gates: [
                { lane: 0, op: 'add', value: 30, label: '+30' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -92, enemies: [ { type: 'elite', count: 10 }, { type: 'split', count: 50 }, { type: 'fast', count: 60 }, { type: 'normal', count: 70 } ] },
            { type: 'gates', z: -112, gates: [
                { lane: 0, op: 'addpct', value: 40, label: '+40%' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -119, enemies: [ { type: 'normal', count: 28 }, { type: 'shield', count: 14 }, { type: 'spitter', count: 10 }, { type: 'elite', count: 4 }, { type: 'thrower', count: 8 }, { type: 'flanker', count: 6 } ] },
            { type: 'boss', z: -130, boss: { type: 'boss', hp: 3500, style: 'bulwark', title: '钢盾领主' } },
            { type: 'boss', z: -166, boss: { type: 'boss', hp: 3500, style: 'hivelord', title: '裂变母巢' } }
        ]
    },
    // ============ 第10关 终极末日 (V8.0 终局关) ============
    {
        name: '第 10 关 终极末日',
        startCount: 1,
        totalZ: -220,
        rewardCoins: 600,
        theme: 'apocalypse',
        segments: [
            { type: 'gates', z: -8, gates: [
                { lane: 0, op: 'add', value: 40, label: '+40' },
                { lane: 1, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -26, enemies: [ { type: 'elite', count: 8 }, { type: 'normal', count: 80 }, { type: 'fast', count: 70 }, { type: 'bomber', count: 12 } ] },
            { type: 'gates', z: -44, gates: [
                { lane: 0, op: 'buff', value: 'pierce', label: '穿透+1' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -60, enemies: [ { type: 'elite', count: 14 }, { type: 'shield', count: 80 }, { type: 'spitter', count: 50 }, { type: 'bomber', count: 10 } ] },
            { type: 'energy', z: -78, core: { hp: 2000, buffRadius: 10 } },
            { type: 'gates', z: -94, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'skill', value: 'roll' },
                { lane: 2, op: 'buff', value: 'chain', label: '连锁闪电' }
            ]},
            { type: 'wave', z: -110, enemies: [ { type: 'elite', count: 16 }, { type: 'split', count: 70 }, { type: 'shield', count: 70 }, { type: 'fast', count: 70 } ] },
            { type: 'gates', z: -128, gates: [
                { lane: 0, op: 'addpct', value: 50, label: '+50%' },
                { lane: 1, op: 'buff', value: 'explosive', label: '爆炸弹' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -144, enemies: [ { type: 'elite', count: 14 }, { type: 'spitter', count: 40 }, { type: 'shield', count: 40 }, { type: 'normal', count: 80 }, { type: 'fast', count: 60 } ] },
            { type: 'gates', z: -162, gates: [
                { lane: 0, op: 'buff', value: 'damage2', label: '输出+2' },
                { lane: 1, op: 'buff', value: 'crit2', label: '暴击+10%' },
                { lane: 2, op: 'skill', value: 'roll' }
            ]},
            { type: 'wave', z: -178, enemies: [ { type: 'elite', count: 16 }, { type: 'normal', count: 90 }, { type: 'fast', count: 70 }, { type: 'shield', count: 40 }, { type: 'spitter', count: 35 } ] },
            { type: 'wave', z: -196, enemies: [ { type: 'normal', count: 28 }, { type: 'fast', count: 16 }, { type: 'shield', count: 12 }, { type: 'elite', count: 4 }, { type: 'thrower', count: 10 }, { type: 'flanker', count: 8 } ] },
            { type: 'boss', z: -208, boss: { type: 'boss', hp: 10000, style: 'overlord', title: '末日主宰' } }
        ]
    }];

// ===== V5.1 Boss 装配 =====
CONFIG.BOSS_STYLES = ['bruiser', 'bruiser', 'bulwark', 'hivelord', 'overlord', 'overlord', 'hivelord', 'titan', 'bulwark', 'overlord'];
CONFIG.BOSS_NAMES = ['铁拳队长', '赤拳突击者', '钢盾领主', '裂变母巢', '终焉核心', '末日吞噬者', '巢穴之母', '机械巨尸', '钢盾领主', '末日主宰'];
// V8.0修复: BOSS_NAMES数组曾未闭合 — L7-L10关卡定义被吞进数组(LEVELS外的重复块),
// 导致BOSS_NAMES[6..9]=关卡对象(Boss血条显示[object Object])且关卡体积膨胀。
LEVELS.forEach(function(level, li) {
    if (!level.bossStyle) level.bossStyle = CONFIG.BOSS_STYLES[li];
    level.segments.forEach(function(seg) {
        // V8.0: 尊重关卡内已写明的Boss体格(L9双Boss各自不同), 缺省才按关索引装配
        if (seg.type === 'boss' && !seg.boss.style) seg.boss.style = level.bossStyle;
    });
});

// V5.1.2: 每关首排门全部为人数门 — 任何首选都不会开局即死(填墙控制器下弱build首排选buff=秒杀)
LEVELS.forEach(function(level) {
    var firstGatesSeg = null;
    for (var i = 0; i < level.segments.length; i++) {
        if (level.segments[i].type === 'gates') { firstGatesSeg = level.segments[i]; break; }
    }
    if (!firstGatesSeg) return;
    var addGate = null;
    for (var j = 0; j < firstGatesSeg.gates.length; j++) {
        if (firstGatesSeg.gates[j].op === 'add') { addGate = firstGatesSeg.gates[j]; break; }
    }
    var base = addGate ? addGate.value : 3;
    var mid = Math.max(1, base - 1);
    var low = Math.max(1, base - 2);
    if (mid === base) mid = Math.max(1, base - 1);
    if (low === mid) low = Math.max(1, mid - 1);
    if (base >= 6) {
        mid = Math.max(2, Math.round(base * 0.72));
        low = Math.max(1, Math.round(base * 0.48));
    }
    firstGatesSeg.gates = [
        { lane: 0, op: 'add', value: base, label: '+' + base },
        { lane: 1, op: 'add', value: mid,  label: '+' + mid },
        { lane: 2, op: 'add', value: low,  label: '+' + low }
    ];
});

// V5.1.3: 进度条终点对齐最后一段阵地 — 修复"进度条没走完就结算":
//   无Boss关: totalZ = 末波z-1(军团穿过末波, 清完即到终点)
//   Boss关:   totalZ = boss.z+4.5(Boss战驻停位, 击杀时进度恰好100%)
LEVELS.forEach(function(level) {
    var last = level.segments[level.segments.length - 1];
    level.totalZ = last.type === 'boss' ? last.z + 4.5 : last.z + 2;
});


/* ===== [[ js/utils.js ]] ===== */
// ===== 工具函数 =====

/** 缓动: 弹出回弹 */
function easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

/** 缓动: 平滑 */
function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/** 线性插值 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/** 帧率无关的阻尼插值 */
function damp(current, target, lambda, dt) {
    return lerp(current, target, 1 - Math.exp(-lambda * dt));
}

/** 限制范围 */
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

/** 随机范围 */
function randRange(min, max) {
    return min + Math.random() * (max - min);
}

/**
 * V5.1 战斗运动学辅助: 方向符号统一取自 CONFIG.DIRS, 任何文件不得散写正负号。
 * 约定(见 config.js DIRS): 玩家面朝-Z推进; 怪物朝+Z追击防线; 子弹朝-Z飞行。
 */
var BattleKinematics = {
    /** 玩家前进: 返回新 z */
    advanceZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.FORWARD_SIGN * speed * dt;
    },
    /** 怪物向防线追击: 返回新 z */
    enemyApproachZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.ENEMY_ADVANCE_SIGN * speed * dt;
    },
    /** 子弹飞行: 返回新 z */
    bulletZ: function(z, speed, dt) {
        return z + CONFIG.DIRS.SHOOT_SIGN * speed * dt;
    }
}; // V10.1: 移除无调用的 atDefenseLine

/**
 * 将多个 BufferGeometry 合并为一个，支持顶点色。
 * 所有几何体必须具有 position、normal、uv 属性。
 */
function mergeGeometries(geometries) {
    let totalVerts = 0;
    let totalIndices = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        totalVerts += g.attributes.position.count;
        if (g.index) totalIndices += g.index.count;
        else totalIndices += g.attributes.position.count;
    }

    const positions = new Float32Array(totalVerts * 3);
    const normals = new Float32Array(totalVerts * 3);
    const uvs = new Float32Array(totalVerts * 2);
    const colors = new Float32Array(totalVerts * 3);
    const indices = new (totalVerts > 65535 ? Uint32Array : Uint16Array)(totalIndices);

    let vOff = 0;
    let iOff = 0;
    for (let i = 0; i < geometries.length; i++) {
        const g = geometries[i];
        const cnt = g.attributes.position.count;

        positions.set(g.attributes.position.array, vOff * 3);
        normals.set(g.attributes.normal.array, vOff * 3);
        if (g.attributes.uv) {
            uvs.set(g.attributes.uv.array, vOff * 2);
        }
        if (g.attributes.color) {
            colors.set(g.attributes.color.array, vOff * 3);
        }

        if (g.index) {
            const idx = g.index.array;
            for (let j = 0; j < idx.length; j++) {
                indices[iOff + j] = idx[j] + vOff;
            }
            iOff += idx.length;
        } else {
            for (let j = 0; j < cnt; j++) {
                indices[iOff + j] = j + vOff;
            }
            iOff += cnt;
        }
        vOff += cnt;
    }

    const merged = new THREE.BufferGeometry();
    merged.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    merged.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    merged.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    merged.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    merged.setIndex(new THREE.BufferAttribute(indices, 1));
    return merged;
}

/**
 * 给几何体添加顶点色
 */
function colorize(geo, hexColor) {
    const cnt = geo.attributes.position.count;
    const colors = new Float32Array(cnt * 3);
    const c = new THREE.Color(hexColor);
    for (let i = 0; i < cnt; i++) {
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
}

/**
 * 变换几何体: 旋转+平移+缩放，然后返回新引用
 */

/**
 * 创建 Canvas 文字纹理 (用于状态门数值等)
 */
function createTextTexture(text, opts) {
    opts = opts || {};
    const maxFontSize = opts.fontSize || 80;
    const canvasHeight = opts.height || 128;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // 先用最大字号测量文字宽度，自适应缩放字号确保完整显示
    ctx.font = '900 ' + maxFontSize + 'px Arial, sans-serif';
    var metrics = ctx.measureText(text);
    var textWidth = metrics.width;
    // 画布宽度 = 文字宽度 + 左右padding，上限512
    var canvasWidth = Math.min(Math.ceil(textWidth + maxFontSize * 0.6), 512);
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 若文字超宽则缩小字号
    var fontSize = maxFontSize;
    if (textWidth > canvasWidth - maxFontSize * 0.4) {
        fontSize = Math.floor(maxFontSize * (canvasWidth - maxFontSize * 0.4) / textWidth);
    }

    if (opts.bg) {
        ctx.fillStyle = opts.bg;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.font = '900 ' + fontSize + 'px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 描边
    if (opts.stroke) {
        ctx.strokeStyle = opts.stroke;
        ctx.lineWidth = opts.strokeWidth || 8;
        ctx.lineJoin = 'round';
        ctx.strokeText(text, canvas.width / 2, canvas.height / 2);
    }

    ctx.fillStyle = opts.fill || '#ffffff';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return texture;
}

/* ===== [[ js/economy.js ]] ===== */
// ===== V5.1 金币经济与永久档案 =====
// 存档: 经 Platform.storage(GameStorage 前缀 pz_squad_) 持久化, H5 localStorage / 小游戏 tt 存储通吃。
// 铁律:
//  - 胜利奖励每关只发一次(claimedRewards 幂等), 刷新/重进/重复通关都不再入账
//  - 击杀金币局终一次性入账(失败也给, 但上限低, 不鼓励故意失败刷钱)
//  - 旧存档(pz_progress 解锁进度)自动迁移, 不清空

var ECONOMY_RULES = {
    PROFILE_KEY: 'profile_v51',
    PROFILE_VERSION: 3,
    KILL_COIN_RATE: 0.8,          // V5.1.5: 每击杀 0.8 金币(超级尸潮下升级资金需求提升)
    KILL_COIN_WIN_CAP_RATIO: 0.5, // V5.1.5: 胜利局击杀币上限 = 关卡奖励×50%
    KILL_COIN_LOSE_CAP: 70,       // V5.1.5: 失败保底=胜利上限(超级尸潮下防软锁; 赢仍2倍+首通奖励优于刷)
    LEGACY_PROGRESS_KEY: 'pz_progress' // V3.3 旧解锁进度键(迁移源)
};

class GameProfile {
    /**
     * @param storage GameStorage(带前缀) — 档案主存储
     * @param rawAdapter 原始存储适配器(读旧版 pz_progress 迁移键, 无前缀)
     */
    constructor(storage, rawAdapter) {
        this._storage = storage;
        this._raw = rawAdapter || null;
        this._data = this._load();
    }

    _load() {
        var raw = null;
        try { raw = this._storage.getSafe ? this._storage.getSafe(ECONOMY_RULES.PROFILE_KEY, null) : this._storage.get(ECONOMY_RULES.PROFILE_KEY, null); } catch (e) {}
        if (raw && typeof raw === 'object') {
            // V8.0: 分版本迁移链 — v1→v2(星级/成就)→v3(武器/科技/签到)
            if ((raw.profileVersion || 0) >= 3) return this._normalize(raw);
            if (typeof Progression !== 'undefined') raw = Progression.migrate(raw);
            return this._normalize(raw);
        }
        // 首次建档: 迁移旧版解锁进度(旧键在原始存储层, 无前缀)
        var legacyUnlocked = 1;
        try {
            var legacy = null;
            if (this._raw && this._raw.get) legacy = this._raw.get(ECONOMY_RULES.LEGACY_PROGRESS_KEY, null);
            if (typeof legacy === 'number') legacyUnlocked = legacy;
            else if (typeof legacy === 'string' && /^\d+$/.test(legacy)) legacyUnlocked = parseInt(legacy);
        } catch (e) {}
        return this._normalize({
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: 0,
            unlockedLevel: Math.max(1, legacyUnlocked || 1),
            upgrades: { recruit: 0, logistics: 0, gun: 0, rapid: 0, pierce: 0 },
            totalKills: 0,
            totalWins: 0,
            bestSquadCount: 0,
            claimedRewards: {}
        });
    }

    _normalize(d) {
        return {
            profileVersion: ECONOMY_RULES.PROFILE_VERSION,
            coins: Math.max(0, Math.floor(d.coins || 0)),
            unlockedLevel: Math.max(1, Math.floor(d.unlockedLevel || 1)),
            upgrades: {
                recruit: Math.max(0, Math.floor((d.upgrades && d.upgrades.recruit) || 0)),
                logistics: Math.max(0, Math.floor((d.upgrades && d.upgrades.logistics) || 0)),
                gun: Math.max(0, Math.floor((d.upgrades && d.upgrades.gun) || 0)),
                rapid: Math.max(0, Math.floor((d.upgrades && d.upgrades.rapid) || 0)),
                pierce: Math.max(0, Math.floor((d.upgrades && d.upgrades.pierce) || 0))
            },
            totalKills: Math.max(0, Math.floor(d.totalKills || 0)),
            totalWins: Math.max(0, Math.floor(d.totalWins || 0)),
            bestSquadCount: Math.max(0, Math.floor(d.bestSquadCount || 0)),
            claimedRewards: d.claimedRewards || {},
            // V6.0: 星级/经验/成就/统计
            stars: d.stars || {},
            xp: Math.max(0, Math.floor(d.xp || 0)),
            playerLevel: Math.max(1, Math.floor(d.playerLevel || 1)),
            achievements: d.achievements || {},
            achievements_meta: d.achievements_meta || {},
            stats: d.stats || { bossKills: 0, eliteKills: 0, playTime: 0 },
            // V8.0: 武器/科技/签到
            weapon: d.weapon || 'rifle',
            weaponLevel: Math.max(0, Math.floor(d.weaponLevel || 0)),
            weaponEvolved: d.weaponEvolved || null,
            tech: d.tech || {},
            techPoints: Math.max(0, Math.floor(d.techPoints || 0)),
            signin: d.signin || { lastDate: '', streak: 0, totalDays: 0 },
            // V8.0.1修复: 以下字段曾不在白名单 → 每次启动被 _normalize 静默丢弃
            // (挑战最高纪录/每日任务进度/士兵训练等级/装备全部无法持久化)
            challengeBest: d.challengeBest || {},
            daily: d.daily || null,
            soldier: d.soldier || null,
            equipment: d.equipment || {},
            // V10 QA修复: pendingSupply(免费补给待领标记, 原刷新后广告奖励蒸发) / bossSeen(Boss图鉴遭遇标记)
            pendingSupply: d.pendingSupply || null,
            bossSeen: d.bossSeen || {},
            // VNext: 职业/装备背包/排行榜战绩
            classId: d.classId || 'rifleman',
            bag: d.bag || [],
            records: d.records || [],
            weaponAffix: d.weaponAffix || null, // V11.3: 武器词条持久化
            classMastery: d.classMastery || {} // V11.4: 职业专精
        };
    }

    save() {
        // V12: 主档带 .bak 双写; 读侧损坏自动回退备份(GameStorage.getSafe), 不静默清档
        if (this._storage.setSafe) { try { this._storage.setSafe(ECONOMY_RULES.PROFILE_KEY, this._data); } catch (e) {} return; }
        try { this._storage.set(ECONOMY_RULES.PROFILE_KEY, this._data); } catch (e) {}
    }
    get data() { return this._data; }
    get coins() { return this._data.coins; }

    /** 原子入账(金币只增不减经由 spend), 返回新余额 */
    addCoins(n) {
        this._data.coins = Math.max(0, this._data.coins + Math.floor(n));
        this.save();
        return this._data.coins;
    }

    /** 消费: 余额不足返回 false 且不动账(防重复扣款) */
    spend(n) {
        n = Math.floor(n);
        if (n < 0 || this._data.coins < n) return false;
        this._data.coins -= n;
        this.save();
        return true;
    }

    /** 幂等奖励键: 已领返回 false, 未领标记并入账 */
    claimReward(key, coins) {
        if (this._data.claimedRewards[key]) return false;
        this._data.claimedRewards[key] = { t: Date.now(), coins: Math.floor(coins) };
        if (coins) this._data.coins += Math.floor(coins);
        this.save();
        return true;
    }

    hasClaimed(key) { return !!this._data.claimedRewards[key]; }

    /** 记录一局统计; won=true 时解锁下一关(返回是否新解锁) */
    recordRun(levelIndex, kills, maxSquad, won, levelCount) {
        this._data.totalKills += Math.max(0, Math.floor(kills));
        var newUnlocked = false;
        if (won) {
            this._data.totalWins += 1;
            var next = Math.min((levelCount || 5), levelIndex + 2);
            if (next > this._data.unlockedLevel) {
                this._data.unlockedLevel = next;
                newUnlocked = true;
            }
        }
        if (maxSquad > this._data.bestSquadCount) this._data.bestSquadCount = maxSquad;
        this.save();
        return newUnlocked;
    }
}

/**
 * 一局结算(唯一入账入口, 幂等):
 * @param magnetBonus 磁力吸附技能击杀币加成(V11 QA修复[P3]: 原经 arguments[6] 隐式传参, 现入正式签名)
 * @returns {levelReward, killReward, doubled, total} — total 为本局实际入账金币
 */
function settleRunEconomy(profile, level, levelIndex, kills, won, useDoubleAd, magnetBonus) {
    // V10 QA: 科技后勤线接线(原 log_coin/log_supply 科技购买后无任何效果)
    var tech = (typeof TechTree !== 'undefined' && profile) ? TechTree.combatStats(profile) : null;
    var coinMul = tech ? tech.coinMul : 1;
    var coinPerKill = tech ? tech.coinPerKill : 0;
    var reward = level.rewardCoins || 60;
    var levelReward = 0;
    if (won) {
        // 胜利奖励每关一次(幂等键), 后勤加成只作用于首次发放
        var gain = Math.round(reward * (1 + 0.10 * (profile.data.upgrades.logistics || 0)) * coinMul);
        if (profile.claimReward('win:L' + levelIndex, 0)) {
            levelReward = gain; // 先记账, 金币在下方统一入账
        }
    }
    var cap = won
        ? Math.round(reward * ECONOMY_RULES.KILL_COIN_WIN_CAP_RATIO)
        : ECONOMY_RULES.KILL_COIN_LOSE_CAP;
    var killReward = Math.min(cap, Math.floor(kills * (ECONOMY_RULES.KILL_COIN_RATE + coinPerKill)));
    // V6.0: 磁力吸附技能 — 击杀币加成(V11 QA: arguments[6] 隐式传参已入正式签名 magnetBonus)
    if (magnetBonus) killReward = Math.min(cap * 2, Math.floor(killReward * (1 + 0.5 * magnetBonus)));
    var base = levelReward + killReward;
    var total = base;
    if (won && useDoubleAd && levelReward > 0) {
        // 双倍广告: 仅对本次结算的关卡奖励生效(击杀币不翻倍)
        total = levelReward * 2 + killReward;
    }
    if (total > 0) profile.addCoins(total);
    // 确保胜利奖励键已标记(即使经双倍路径)
    if (won && !profile.hasClaimed('win:L' + levelIndex)) {
        profile.claimReward('win:L' + levelIndex, 0);
    }
    return { levelReward: levelReward, killReward: killReward, doubled: !!(won && useDoubleAd && levelReward > 0), total: total };
}


/* ===== [[ js/energy-core.js ]] ===== */
// ===== V6.0 病毒能源核心 (第6关特殊玩法) =====
// 独立生命值/受击反馈/发光/伤害数字/击破动画与奖励。
// 存活时周期性强化半径内僵尸(移速+35%/攻速+25%/绿色感染染色)；击破后周围僵尸失去强化。
// 由 Game 在含 energy 段的关卡生成；战斗系统通过 takeBulletHit 注入伤害。

class EnergyCore {
    constructor(scene, x, z, cfg, game) {
        this.scene = scene;
        this.game = game;
        this.x = x; this.z = z;
        this.hp = cfg.hp || 900;
        this.maxHp = this.hp;
        this.radius = cfg.buffRadius || 9;
        this.buffInterval = cfg.buffInterval || 4.5;
        this._buffTimer = 1.2; // 首次强化较快, 让玩家立刻感知机制
        this.alive = true;
        this.dying = false;
        this._spin = 0;

        var group = new THREE.Group();
        // 核心球体(发光绿)
        var coreMat = new THREE.MeshStandardMaterial({
            color: 0x39D98A, emissive: 0x1F8F55, emissiveIntensity: 1.4,
            roughness: 0.35, metalness: 0.2
        });
        this.coreMesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), coreMat);
        this.coreMesh.position.y = 2.6;
        this.coreMesh.castShadow = true;
        group.add(this.coreMesh);
        // 旋转环(双色)
        var ringMat = new THREE.MeshBasicMaterial({ color: 0x9CFFC4, transparent: true, opacity: 0.75 });
        this.ringMesh = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.09, 8, 40), ringMat);
        this.ringMesh.position.y = 2.6;
        group.add(this.ringMesh);
        var ring2 = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.06, 8, 32),
            new THREE.MeshBasicMaterial({ color: 0x2FA868, transparent: true, opacity: 0.85 }));
        ring2.position.y = 2.6;
        ring2.rotation.x = Math.PI / 2.6;
        group.add(ring2);
        this._ring2 = ring2;
        // 基座(能源塔)
        var baseMat = new THREE.MeshStandardMaterial({ color: 0x37474F, roughness: 0.8, metalness: 0.4 });
        var base = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.3, 1.6, 8), baseMat);
        base.position.y = 0.8;
        base.castShadow = true;
        group.add(base);
        // 点光源(绿)
        this.light = new THREE.PointLight(0x39D98A, 1.6, this.radius * 2.4);
        this.light.position.y = 2.8;
        group.add(this.light);
        // 强化半径圈(地面)
        var aura = new THREE.Mesh(new THREE.RingGeometry(this.radius - 0.35, this.radius, 48),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false }));
        aura.rotation.x = -Math.PI / 2;
        aura.position.y = 0.06;
        group.add(aura);
        this.auraMesh = aura;
        // 血条(双色平面, 面向相机由 update 处理)
        var barBg = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.3),
            new THREE.MeshBasicMaterial({ color: 0x101820, transparent: true, opacity: 0.72, depthWrite: false }));
        barBg.position.y = 4.6;
        group.add(barBg);
        this.barBg = barBg;
        this.barFill = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.2),
            new THREE.MeshBasicMaterial({ color: 0x39D98A, depthWrite: false }));
        this.barFill.position.y = 4.6;
        this.barFill.position.z = 0.01;
        group.add(this.barFill);

        group.position.set(x, 0, z);
        group.userData.artSource = 'V6 energy-core (procedural)';
        scene.add(group);
        this.model = group;

        // 相机朝向的血条(每帧对齐)
        this._hpQuad = new THREE.Object3D();
    }

    /** 战斗系统注入伤害; 返回是否击破 */
    takeBulletHit(dmg, effects) {
        if (!this.alive || this.dying) return false;
        this.hp -= dmg;
        if (effects) {
            effects.impact(this.x, 2.6, this.z, false, false);
            if (Math.random() < 0.3) effects.floatText(this.x + randRange(-0.6, 0.6), 3.2, this.z, String(dmg), '#66FFB3', false);
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 4, 2.2, 0.3);
        }
        if (this.hp <= 0) {
            this.destroyed(effects);
            return true;
        }
        return false;
    }

    destroyed(effects) {
        this.alive = false;
        this.dying = true;
        this._dieT = 0;
        if (effects) {
            effects.burst(this.x, 2.6, this.z, 0x66FFB3, 26, 5, 0.8);
            effects.burst(this.x, 2.6, this.z, 0xFFFFFF, 14, 4, 0.5);
            effects.shockwave(this.x, 0.08, this.z, 0x39D98A);
            effects.floatText(this.x, 4.2, this.z, '能源核心击破!', '#66FFB3', true);
        }
        if (this.game && this.game.world) this.game.world.shake(0.45);
        // 击破奖励(一次性, 幂等由关卡结算外的即时金币承担, 数值固定)
        if (this.game && this.game.profile) this.game.profile.addCoins(60);
        if (effects) effects.floatText(this.x, 3.4, this.z, '+60', '#FFC247', true);
        if (this.game) this.game.onCoreDestroyed && this.game.onCoreDestroyed();
    }

    update(dt, time, squad, enemies, effects) {
        if (this.dying) {
            this._dieT += dt;
            var k = Math.max(0.001, 1 - this._dieT / 0.7);
            this.model.scale.setScalar(k);
            this.coreMesh.material.emissiveIntensity = 1.4 * k + Math.random() * 0.6;
            if (this._dieT >= 0.7) {
                this.scene.remove(this.model);
                this.dying = false; this.removed = true;
            }
            return;
        }
        if (!this.alive) return;
        // 旋转/呼吸/脉动
        this._spin += dt * 1.6;
        this.coreMesh.rotation.y = this._spin;
        this.ringMesh.rotation.z = this._spin * 1.3;
        this._ring2.rotation.z = -this._spin * 0.9;
        this.coreMesh.position.y = 2.6 + Math.sin(time * 2.2) * 0.12;
        this.light.intensity = 1.4 + Math.sin(time * 3.1) * 0.35;
        this.auraMesh.material.opacity = 0.13 + Math.sin(time * 2.4) * 0.05;
        // 血条对齐相机
        var cam = this.scene.userData.camera;
        if (cam) {
            this.barBg.quaternion.copy(cam.quaternion);
            this.barFill.quaternion.copy(cam.quaternion);
            var ratio = Math.max(0, this.hp / this.maxHp);
            this.barFill.scale.x = ratio;
            this.barFill.position.x = -1.25 * (1 - ratio);
            this.barFill.material.color.setHex(ratio > 0.5 ? 0x39D98A : ratio > 0.25 ? 0xFFC247 : 0xE45B68);
        }
        // 周期强化半径内僵尸
        this._buffTimer -= dt;
        if (this._buffTimer <= 0) {
            this._buffTimer = this.buffInterval;
            var buffed = 0;
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                if (!e.alive || e.isBoss) continue;
                var dx = e.x - this.x, dz = e.z - this.z;
                if (dx * dx + dz * dz < this.radius * this.radius) {
                    e.speedMul = Math.max(e.speedMul || 1, 1.35);
                    e.attackMul = Math.min(e.attackMul || 1, 0.75);
                    e._coreBuffed = true;
                    buffed++;
                }
            }
            if (buffed > 0 && effects) {
                effects.floatText(this.x, 4.0, this.z, '能源强化 ×' + buffed, '#66FFB3', false);
                effects.shockwave(this.x, 0.06, this.z, 0x39D98A);
            }
        }
        // 失去强化的僵尸恢复(每帧扫描, 数量可控)
        for (var j = 0; j < enemies.length; j++) {
            var m = enemies[j];
            if (!m._coreBuffed) continue;
            var mdx = m.x - this.x, mdz = m.z - this.z;
            if (!this.alive || mdx * mdx + mdz * mdz > this.radius * this.radius * 1.25) {
                m.speedMul = 1; m.attackMul = 1; m._coreBuffed = false;
            }
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        this.model.traverse(function(o) {
            if (o.geometry) o.geometry.dispose();
            if (o.material && o.material.dispose) o.material.dispose();
        });
    }
}


/* ===== [[ js/skills.js ]] ===== */
// ===== V6.0 肉鸽技能系统 =====
// 技能门(op:'skill')三选一; 技能有等级(重复选择升层), 立即生效。
// 配置集中: SKILL_DEFS。应用入口: Skills.apply(squad, id)。

var SKILL_DEFS = {
    rage: {
        name: '狂暴射击', icon: '🔥', maxLevel: 3, quality: 'epic',
        desc: '伤害 ×(1+0.35×层), 全局持续',
        apply: function(squad, lv) { squad._skillRage = lv; }
    },
    drone: {
        name: '支援无人机', icon: '🛰️', maxLevel: 3, quality: 'epic',
        desc: '每层射速 +15%(火力全开组合 +25%/层)', // V10.1: 文案对齐实现(射速乘区, 无独立僚机实体)
        apply: function(squad, lv) { squad._skillDrones = lv; }
    },
    venom: {
        name: '毒液弹头', icon: '🧫', maxLevel: 3, quality: 'rare',
        desc: '命中附加中毒, 每层每秒造成 20% 伤害持续2秒',
        apply: function(squad, lv) { squad._skillVenom = lv; }
    },
    shield: {
        name: '能量护盾', icon: '🔵', maxLevel: 3, quality: 'rare',
        desc: '每层抵挡 2 次致命伤害(受击后冷却6秒恢复)',
        apply: function(squad, lv) { squad._skillShieldMax = lv * 2; if (!squad._skillShield) squad._skillShield = squad._skillShieldMax; }
    },
    magnet: {
        name: '磁力吸附', icon: '🧲', maxLevel: 2, quality: 'common',
        desc: '击杀金币获取 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillMagnet = lv; }
    },
    berserk: {
        name: '背水一战', icon: '⚔️', maxLevel: 2, quality: 'rare',
        desc: '人数低于一半时伤害 ×(1+0.5×层)',
        apply: function(squad, lv) { squad._skillBerserk = lv; }
    },
    // ===== V11.2: 分类补缺(攻击/防御/人数/经济; 与既有6技能不重复) =====
    swiftness: {
        name: '迅捷弹幕', icon: '💨', maxLevel: 3, quality: 'common',
        desc: '攻速 +12% 每层',
        apply: function(squad, lv) { squad._skillSwiftness = lv; }
    },
    deadly: {
        name: '致命精准', icon: '🎖️', maxLevel: 3, quality: 'rare',
        desc: '暴击率 +6% 每层',
        apply: function(squad, lv) { squad._skillDeadly = lv; squad.critChance = Math.min(0.8, squad.critChance + 0.06); }
    },
    executioner: {
        name: '处决者', icon: '🗡️', maxLevel: 3, quality: 'epic',
        desc: '暴击伤害 +25% 每层',
        apply: function(squad, lv) { squad._critMul = 0.25 * lv; }
    },
    pierce_master: {
        name: '穿甲弹头', icon: '🔩', maxLevel: 2, quality: 'rare',
        desc: '穿透 +1 每层(上限5)',
        apply: function(squad, lv) { squad.pierce = Math.min(5, squad.pierce + 1); }
    },
    harvest: {
        name: '亡者征召', icon: '🕯️', maxLevel: 2, quality: 'epic',
        desc: '击杀 5% 概率补充1名士兵 每层',
        apply: function(squad, lv) { squad._skillHarvest = lv; }
    },
    fortune: {
        name: '实战经验', icon: '📖', maxLevel: 2, quality: 'common',
        desc: '结算经验 +15% 每层',
        apply: function(squad, lv) { squad._skillFortune = lv; }
    }
};

// ===== V8.0 技能组合 (同时持有特定技能时触发协同效果) =====
var SKILL_COMBOS = [
    { id: 'plague_fury',   name: '瘟疫狂怒', icon: '☠️', req: { rage: 1, venom: 1 },
      desc: '毒液伤害 ×2', apply: function(s) { s._comboPlagueFury = 1; } },
    { id: 'desperate_edge', name: '绝境锋芒', icon: '🗡️', req: { rage: 1, berserk: 1 },
      desc: '背水触发线提升至最大编制的60%', apply: function(s) { s._comboDesperate = 1; } },
    { id: 'swarm_venom',   name: '毒雾僚机', icon: '☣️', req: { drone: 1, venom: 1 },
      desc: '射速额外 +8%×毒液层', apply: function(s) { s._comboSwarmVenom = 1; } },
    { id: 'undying_will',  name: '不灭意志', icon: '🛡️', req: { shield: 1, berserk: 1 },
      desc: '护盾恢复冷却 6s → 3s', apply: function(s) { s._comboUndying = 1; } },
    { id: 'greed_fire',    name: '贪婪火力', icon: '💰', req: { magnet: 1, rage: 1 },
      desc: '击杀金币额外 +1 层磁力', apply: function(s) { s._comboGreedFire = 1; } },
    { id: 'recycle_drone', name: '回收无人机', icon: '♻️', req: { drone: 1, magnet: 1 },
      desc: '击杀 3% 概率补充1名士兵', apply: function(s) { s._comboRecycle = 1; } },
    { id: 'toxic_ward',    name: '毒性护盾', icon: '🧪', req: { venom: 1, shield: 1 },
      desc: '护盾格挡时毒化周围敌人', apply: function(s) { s._comboToxicWard = 1; } },
    { id: 'full_barrage',  name: '火力全开', icon: '🌪️', req: { rage: 1, drone: 1 },
      desc: '僚机射速加成 15% → 25% 每层', apply: function(s) { s._comboFullBarrage = 1; } },
    { id: 'venom_bounty',  name: '剧毒赏金', icon: '🪙', req: { venom: 1, magnet: 1 },
      desc: '击杀金币 +0.2/只', apply: function(s) { s._comboVenomBounty = 1; } },
    { id: 'guardian_fury', name: '守护之怒', icon: '⚔️', req: { shield: 1, rage: 1 },
      desc: '护盾可用时伤害 +25%', apply: function(s) { s._comboGuardianFury = 1; } },
    // ===== V11.2: 流派组合 =====
    { id: 'fire_flow', name: '火力流派', icon: '☄️', req: { rage: 1, swiftness: 1 },
      desc: '伤害 +15% & 射速 +10%', apply: function(s) { s._comboFireFlow = 1; } },
    { id: 'pierce_flow', name: '穿透流派', icon: '➤', req: { pierce_master: 1, swiftness: 1 },
      desc: '弹丸穿透 +1', apply: function(s) { s._comboPierceFlow = 1; } },
    { id: 'swarm_flow', name: '虫群流派', icon: '🐜', req: { harvest: 1, magnet: 1 },
      desc: '征召概率 ×1.5', apply: function(s) { s._comboSwarmFlow = 1; } }
];

var Skills = {
    /** 应用技能层到 squad(叠加式, 幂等重算) */
    apply: function(squad, id) {
        if (!SKILL_DEFS[id]) return;
        if (!squad._skills) squad._skills = {};
        squad._skills[id] = Math.min(SKILL_DEFS[id].maxLevel, (squad._skills[id] || 0) + 1);
        SKILL_DEFS[id].apply(squad, squad._skills[id]);
        this.checkCombos(squad);
    },

    /** V8.0: 重算全部组合(技能变化后调用, 幂等) */
    checkCombos: function(squad) {
        if (!squad._skills) return [];
        squad._comboPlagueFury = 0; squad._comboDesperate = 0; squad._comboSwarmVenom = 0;
        squad._comboUndying = 0; squad._comboGreedFire = 0; squad._comboRecycle = 0;
        squad._comboToxicWard = 0; squad._comboFullBarrage = 0; squad._comboVenomBounty = 0;
        squad._comboGuardianFury = 0;
        squad._comboFireFlow = 0; squad._comboPierceFlow = 0; squad._comboSwarmFlow = 0;
        var active = [];
        for (var i = 0; i < SKILL_COMBOS.length; i++) {
            var c = SKILL_COMBOS[i], ok = true;
            for (var id in c.req) {
                if ((squad._skills[id] || 0) < c.req[id]) { ok = false; break; }
            }
            if (ok) { c.apply(squad); active.push(c); }
        }
        return active;
    },

    /** 击杀金币加成汇总(magnet技能+组合), 供结算读取 */
    coinBonus: function(squad) {
        var bonus = squad._skillMagnet || 0;
        if (squad._comboGreedFire) bonus += 1;
        if (squad._comboVenomBounty) bonus += 0.2;
        return bonus;
    },

    /** 技能品质标签(普通/稀有/史诗) V11.2 */
    qualityOf: function(id) {
        var def = SKILL_DEFS[id];
        return def && def.quality ? def.quality : 'common';
    },
    qualityName: function(id) {
        var q = this.qualityOf(id);
        return q === 'epic' ? '史诗' : q === 'rare' ? '稀有' : '普通';
    },
    /** V11.2: 职业倾向 — 偏好技能加权(副本进候选), 不排除其它技能 */
    CLASS_SKILL_BIAS: {
        rifleman: [],
        gunner: ['swiftness', 'swiftness', 'drone'],
        marksman: ['deadly', 'executioner', 'pierce_master'],
        medic: ['shield', 'harvest', 'magnet']
    },
    /** 门数据工厂: 未满级技能池按职业倾向加权随机3个不重复 */
    rollChoices: function(squad) {
        var pool = [];
        for (var id in SKILL_DEFS) {
            var lv = squad._skills ? (squad._skills[id] || 0) : 0;
            if (lv < SKILL_DEFS[id].maxLevel) pool.push(id);
        }
        if (!pool.length) return null;
        var weighted = pool.slice();
        var bias = (squad._gameRef && squad._gameRef._classStats && this.CLASS_SKILL_BIAS[squad._gameRef._classStats.id]) || [];
        for (var b = 0; b < bias.length; b++) {
            if (pool.indexOf(bias[b]) >= 0) weighted.push(bias[b]);
        }
        var picks = [];
        while (picks.length < 3 && weighted.length) {
            var pick = weighted.splice(Math.floor(Math.random() * weighted.length), 1)[0];
            if (picks.indexOf(pick) < 0) picks.push(pick);
        }
        return picks;
    }
};


/* ===== [[ js/affixes.js ]] ===== */
// ===== V6.0 精英词缀系统 =====
// 精英僵尸随机获得1-2个词缀, 词缀修改属性并添加视觉标识。
// 词缀强度随关卡等级增长。

var AFFIX_DEFS = {
    frenzy:   { name: '狂暴', icon: '💥', apply: function(e) { e.speedMul = (e.speedMul || 1) * 1.5; } },
    hard:     { name: '坚硬', icon: '🔒', apply: function(e) { e.hp *= 1.6; e.maxHp = e.hp; } },
    vampiric: { name: '吸血', icon: '🩸', apply: function(e) { e._affixVamp = true; } },
    splitter: { name: '分裂', icon: '🧬', apply: function(e) { e._affixSplit = true; } },
    venom:    { name: '毒液', icon: '🧪', apply: function(e) { e._affixVenom = true; } },
    shielded: { name: '护盾', icon: '🔵', apply: function(e) { e._affixShield = true; e._affixShieldT = 0; } }
};

var AffixSystem = {
    /** 给精英怪随机分配词缀(1-2个, 不重复) */
    roll: function(enemy, levelIndex) {
        if (enemy.type !== 'elite') return;
        var keys = Object.keys(AFFIX_DEFS);
        var count = 1 + (Math.random() < 0.3 + levelIndex * 0.1 ? 1 : 0);
        var picked = [];
        var copy = keys.slice();
        for (var i = 0; i < count && copy.length; i++) {
            var idx = Math.floor(Math.random() * copy.length);
            picked.push(copy.splice(idx, 1)[0]);
        }
        enemy.affixes = picked;
        enemy.affixNames = picked.map(function(k) { return AFFIX_DEFS[k].name; }).join('+');
        picked.forEach(function(k) { AFFIX_DEFS[k].apply(enemy); });
        // 视觉: 词缀色环
        enemy._affixColor = picked.length >= 2 ? 0xFF4444 : 0xFFAA33;
    },
    /** 每帧处理词缀效果 */
    update: function(enemy, dt, squad, manager, effects) {
        if (!enemy.affixes || !enemy.alive) return;
        // 吸血: 攻击时恢复
        if (enemy._affixVamp && enemy.attackT > 0) {
            enemy.hp = Math.min(enemy.maxHp, enemy.hp + 2);
        }
        // 护盾: 周期性生成
        if (enemy._affixShield) {
            enemy._affixShieldT = (enemy._affixShieldT || 0) - dt;
            if (enemy._affixShieldT <= 0) {
                enemy._affixShieldT = 6;
                enemy.shieldT = 2.5;
            }
        }
        // 毒液: 攻击附带持续伤害
        if (enemy._affixVenom && enemy.attackT > 0 && squad.count > 0) {
            squad._venomStacks = Math.max(squad._venomStacks || 0, 1);
            squad._venomFromElite = 8;
            squad._venomApplied = 0; // 单次附毒上限重置
        }
        // V10 QA修复: 毒液此前只写不读(词缀完全无效) — 小队侧持续减员DoT, 单次附毒最多4人/计数>3时生效
        if ((squad._venomFromElite || 0) > 0 && ((manager && manager._levelIndex) || 0) >= 3) { // V10 QA: 毒液DoT自L4起生效(早期关卡小队规模小, 不引入减员压力)
            squad._venomFromElite -= dt;
            squad._venomTick = (squad._venomTick || 0) + dt;
            if (squad._venomTick >= 2) { // 每2秒1跳
                squad._venomTick = 0;
                if (squad.count > 8 && (squad._venomApplied || 0) < 2) { // 单次附毒上限2人, 小队>8人才生效(保持L3边际胜率)
                    squad._venomApplied = (squad._venomApplied || 0) + 1;
                    squad.killSoldiers(1, effects);
                }
            }
            if (squad._venomFromElite <= 0) { squad._venomStacks = 0; }
        }
    },
    /** 死亡时分裂 */
    onDeath: function(enemy, manager) {
        if (!enemy.affixes) return;
        if (enemy._affixSplit) {
            for (var i = 0; i < 2; i++) {
                var mini = manager.spawnEnemy('normal', enemy.x + (i ? 0.5 : -0.5), enemy.z, 3);
                if (mini) { mini.model.scale.multiplyScalar(0.5); mini.visScale = mini.cfg.scale * 0.5; }
            }
        }
    }
};


/* ===== [[ js/growth.js ]] ===== */
// ===== V8.0 士兵成长 + 装备 + 军团训练中心 =====
// SoldierProgressionManager / SoldierEquipmentManager / GrowthSaveManager
// 全部属性统一进入 profile.soldier / profile.equipment

// —— 士兵等级配置 (1-50, 每10级一个阶段) ——
var SOLDIER_TIERS = [
    { max: 10,  name: '新兵',   color: '#4DA8FF' },
    { max: 20,  name: '精锐',   color: '#39D98A' },
    { max: 30,  name: '特种兵', color: '#FFC247' },
    { max: 40,  name: '王牌',   color: '#FF8844' },
    { max: 50,  name: '传奇',   color: '#FF4444' }
];

var SOLDIER_LEVEL_COST = function(lv) { return Math.round(50 * Math.pow(1.15, lv - 1)); };

// 每级属性成长
var SOLDIER_LEVEL_STATS = function(lv) {
    return {
        dmgBonus: Math.floor(lv / 5),           // 每5级+1伤害
        hpBonus: lv * 2,                        // 每级+2生命
        rateBonus: lv * 0.008,                  // 每级+0.8%射速
        critBonus: Math.min(0.25, lv * 0.005),  // 每级+0.5%暴击(上限25%)
        drBonus: Math.min(0.3, lv * 0.006),     // 每级+0.6%减伤(上限30%)
        recruitBonus: Math.floor(lv / 10)       // 每10级+1初始人数
    };
};

// 阶段里程碑解锁
var SOLDIER_MILESTONES = {
    10: { unlock: '精锐外观', desc: '士兵头盔换为精锐蓝' },
    20: { unlock: '装备槽扩展', desc: '解锁战术装备栏' },
    30: { unlock: '特殊射击', desc: '子弹拖尾加长' },
    40: { unlock: '精英视觉', desc: '金色边框+专属徽章' },
    50: { unlock: '传奇外观', desc: '传奇红色外观+专属徽章' }
};

// —— 装备系统 ——
var EQUIP_SLOTS = ['helmet', 'vest', 'weapon', 'backpack', 'tactical', 'badge'];
var EQUIP_SLOT_NAMES = { helmet: '头盔', vest: '防弹衣', weapon: '主武器', backpack: '背包', tactical: '战术装备', badge: '军团徽章' };
var EQUIP_QUALITY = ['普通', '优秀', '稀有', '史诗', '传说'];
var EQUIP_QUALITY_COLORS = ['#B0B0B0', '#4DA8FF', '#9C4DFF', '#FFC247', '#FF4444'];

var EQUIPMENT_DEFS = {
    helmet_starter:  { slot: 'helmet',  name: '训练头盔',   quality: 0, attrs: { hpBonus: 5 } },
    helmet_ace:      { slot: 'helmet',  name: '王牌头盔',   quality: 3, attrs: { hpBonus: 30, drBonus: 0.05 }, unlock: { level: 30 } },
    vest_starter:    { slot: 'vest',    name: '训练防弹衣', quality: 0, attrs: { hpBonus: 8 } },
    vest_ace:        { slot: 'vest',    name: '王牌防弹衣', quality: 3, attrs: { hpBonus: 40, drBonus: 0.08 }, unlock: { level: 30 } },
    wpn_starter:     { slot: 'weapon',  name: '标准步枪',   quality: 0, attrs: { dmgBonus: 1 } },
    wpn_veteran:     { slot: 'weapon',  name: '老兵步枪',   quality: 2, attrs: { dmgBonus: 3, rateBonus: 0.05 }, unlock: { level: 15 } },
    pack_starter:    { slot: 'backpack',name: '标准背包',   quality: 0, attrs: { recruitBonus: 1 } },
    pack_elite:      { slot: 'backpack',name: '精锐背包',   quality: 2, attrs: { recruitBonus: 3, hpBonus: 10 }, unlock: { level: 20 } },
    tac_starter:     { slot: 'tactical',name: '基础战术装', quality: 0, attrs: { rateBonus: 0.03 } },
    tac_special:     { slot: 'tactical',name: '特种战术装', quality: 3, attrs: { rateBonus: 0.1, critBonus: 0.05 }, unlock: { level: 25 } },
    badge_starter:   { slot: 'badge',   name: '新兵徽章',   quality: 0, attrs: { critBonus: 0.02 } },
    badge_legend:    { slot: 'badge',   name: '传奇徽章',   quality: 4, attrs: { dmgBonus: 5, hpBonus: 25, critBonus: 0.08 }, unlock: { level: 45 } }
};

// 装备强化成本
var EQUIP_UPGRADE_COST = function(quality, level) {
    return Math.round(80 * Math.pow(1.3, level) * (1 + quality * 0.4));
};

var SoldierGrowth = {
    /** 士兵等级 */
    level: function(profile) { return (profile.data.soldier && profile.data.soldier.level) || 1; },
    xp: function(profile) { return (profile.data.soldier && profile.data.soldier.xp) || 0; },

    /** 升级所需金币 */
    upgradeCost: function(profile) {
        return SOLDIER_LEVEL_COST(this.level(profile));
    },

    /** 升级士兵(事务性: 失败不扣钱) */
    upgrade: function(profile) {
        var lv = this.level(profile);
        if (lv >= 50) return { ok: false, reason: 'maxed' };
        var cost = this.upgradeCost(profile);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.soldier) profile.data.soldier = { level: 1, xp: 0 };
        profile.data.soldier.level = lv + 1;
        profile.save();
        var milestone = SOLDIER_MILESTONES[lv + 1];
        return { ok: true, level: lv + 1, cost: cost, milestone: milestone || null };
    },

    /** 士兵属性汇总(等级+装备+科技合并) */
    stats: function(profile) {
        var lv = this.level(profile);
        var base = SOLDIER_LEVEL_STATS(lv);
        // 装备加成
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.attrs) continue;
            for (var k in piece.attrs) {
                base[k] = (base[k] || 0) + piece.attrs[k] * (piece.level || 1);
            }
        }
        return base;
    },

    /** 阶段名称 */
    tierName: function(profile) {
        var lv = this.level(profile);
        for (var i = SOLDIER_TIERS.length - 1; i >= 0; i--) {
            if (lv >= SOLDIER_TIERS[i].max - 9) return SOLDIER_TIERS[i];
        }
        return SOLDIER_TIERS[0];
    },

    /** 装备穿戴(替换或卸下) */
    equip: function(profile, slot, equipId) {
        if (!profile.data.equipment) profile.data.equipment = {};
        var def = EQUIPMENT_DEFS[equipId];
        if (!def || def.slot !== slot) return { ok: false, reason: 'invalid' };
        // 解锁条件检查
        if (def.unlock && def.unlock.level > this.level(profile)) {
            return { ok: false, reason: 'locked', need: def.unlock.level };
        }
        profile.data.equipment[slot] = { id: equipId, quality: def.quality, level: 1, attrs: def.attrs };
        profile.save();
        return { ok: true, slot: slot, equipId: equipId };
    },

    /** 装备强化(等级+1, 属性放大) */
    upgradeEquip: function(profile, slot) {
        var eq = profile.data.equipment;
        if (!eq || !eq[slot]) return { ok: false, reason: 'empty' };
        var piece = eq[slot];
        var cost = EQUIP_UPGRADE_COST(piece.quality, piece.level);
        if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        piece.level++;
        profile.save();
        return { ok: true, slot: slot, level: piece.level, cost: cost };
    }
};



// ===== VNext: 装备掉落 + 随机词条 + 背包 =====
// 掉落物为独立实例(词条随机), 与固定装备(EQUIPMENT_DEFS)共存:
// stats() 同时合并 piece.attrs(固定) 与 piece.affixes(随机词条), 全部真实进战斗。

var EQUIP_AFFIX_POOL = [
    { k: 'dmgBonus',     name: '伤害',      perQ: 1,    fmt: function(v) { return '+' + v; } },
    { k: 'hpBonus',      name: '生命',      perQ: 8,    fmt: function(v) { return '+' + v; } },
    { k: 'rateBonus',    name: '射速',      perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'critBonus',    name: '暴击率',    perQ: 0.02, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'drBonus',      name: '减伤',      perQ: 0.015, fmt: function(v) { return '+' + Math.round(v * 100) + '%'; } },
    { k: 'recruitBonus', name: '招募',      perQ: 0.6,  fmt: function(v) { return '+' + Math.max(1, Math.round(v)); } }
];
var EQUIP_AFFIX_MAX = 3; // 词条条数上限(按品质 1-3)
var EQUIP_NAME_PREFIX = ['哨兵', '猎手', '暴怒', '坚壁', '疾风', '掠夺', '王牌', '铁血'];
var EQUIP_BAG_CAP = 30;
var EQUIP_SELL_VALUE = function(quality, level) { return Math.round(40 * (1 + quality * 0.8) * (1 + (level - 1) * 0.3)); };

var EquipmentLoot = {
    _uid: 0,
    /** 生成一件掉落装备 */
    _makeItem: function(levelIndex, quality) {
        this._uid++;
        var slots = EQUIP_SLOTS;
        var slot = slots[Math.floor(Math.random() * slots.length)];
        // 词条数: 品质0→1条, 品质4→3条
        var affixCount = 1 + Math.min(EQUIP_AFFIX_MAX - 1, quality);
        var affixes = {};
        var poolCopy = EQUIP_AFFIX_POOL.slice();
        var lines = [];
        for (var i = 0; i < affixCount && poolCopy.length; i++) {
            var pool2 = poolCopy.splice(Math.floor(Math.random() * poolCopy.length), 1)[0];
            var scale = (1 + quality * 0.5) * (1 + Math.min(9, levelIndex) * 0.12);
            var raw = pool2.perQ * (0.7 + Math.random() * 0.6) * scale;
            var v = (pool2.k === 'rateBonus' || pool2.k === 'critBonus' || pool2.k === 'drBonus')
                ? Math.round(raw * 1000) / 1000 : Math.max(1, Math.round(raw));
            affixes[pool2.k] = v;
            lines.push(pool2.name + ' ' + pool2.fmt(v));
        }
        var prefix = EQUIP_NAME_PREFIX[Math.floor(Math.random() * EQUIP_NAME_PREFIX.length)];
        return {
            uid: Date.now().toString(36) + '_' + this._uid,
            slot: slot, name: prefix + EQUIP_SLOT_NAMES[slot],
            quality: quality, affixes: affixes, affixLines: lines,
            level: 1, ts: Date.now(), isNew: true
        };
    },
    /** 通关掉落: 1件保底 + 星级加成 */
    rollOnWin: function(profile, levelIndex, stars) {
        var drops = [];
        var count = 1 + (stars >= 2 ? 1 : 0) + (Math.random() < 0.3 ? 1 : 0);
        for (var i = 0; i < count; i++) {
            var q = this._rollQuality(levelIndex, true);
            drops.push(this._makeItem(levelIndex, q));
        }
        return this._store(profile, drops);
    },
    /** 失败掉落: 25%概率1件(保底参与感) */
    rollOnLose: function(profile, levelIndex) {
        if (Math.random() >= 0.25) return [];
        return this._store(profile, [this._makeItem(levelIndex, this._rollQuality(levelIndex, false))]);
    },
    _rollQuality: function(levelIndex, win) {
        // 品质权重随关卡推进右移: 普通/优秀/稀有/史诗/传说
        var r = Math.random() * 100;
        var shift = Math.min(20, levelIndex * 2.2) + (win ? 4 : 0);
        if (r > 97 - shift * 0.3) return 4;
        if (r > 88 - shift * 0.4) return 3;
        if (r > 70 - shift * 0.5) return 2;
        if (r > 42 - shift * 0.3) return 1;
        return 0;
    },
    _store: function(profile, drops) {
        if (!profile || !drops.length) return [];
        if (!profile.data.bag) profile.data.bag = [];
        var bag = profile.data.bag;
        for (var i = 0; i < drops.length && bag.length < EQUIP_BAG_CAP; i++) bag.push(drops[i]);
        profile.save();
        return drops;
    },
    /** 背包穿装(同槽互换: 旧装备回背包) */
    equipFromBag: function(profile, uid) {
        var bag = profile.data.bag || [];
        var idx = -1;
        for (var i = 0; i < bag.length; i++) if (bag[i].uid === uid) { idx = i; break; }
        if (idx < 0) return { ok: false, reason: 'missing' };
        var item = bag.splice(idx, 1)[0];
        if (!profile.data.equipment) profile.data.equipment = {};
        var old = profile.data.equipment[item.slot];
        profile.data.equipment[item.slot] = item;
        if (old && old.uid) bag.push(old); // 掉落装备互换回背包; 固定新手装被替换即退役
        profile.save();
        return { ok: true, slot: item.slot, replaced: !!(old && old.uid) };
    },
    /** 分解 → 金币 */
    sellEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                var value = EQUIP_SELL_VALUE(it.quality, it.level);
                bag.splice(i, 1);
                profile.addCoins(value);
                return { ok: true, value: value };
            }
        }
        return { ok: false, reason: 'missing' };
    },
    /** 背包装备强化(词条×等级成长) */
    upgradeBagEquip: function(profile, uid) {
        var bag = profile.data.bag || [];
        for (var i = 0; i < bag.length; i++) {
            if (bag[i].uid === uid) {
                var it = bag[i];
                if (it.level >= 10) return { ok: false, reason: 'maxed' };
                var cost = EQUIP_UPGRADE_COST(it.quality, it.level);
                if (profile.coins < cost) return { ok: false, reason: 'insufficient', cost: cost };
                if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
                it.level++;
                it.isNew = false;
                profile.save();
                return { ok: true, level: it.level };
            }
        }
        return { ok: false, reason: 'missing' };
    }
};

// VNext: SoldierGrowth.stats 合并随机词条(×等级成长, 与固定装备一致)
// (原 stats 已遍历 eq[slot].attrs — 此处扩展读取 affixes)
(function() {
    var baseStats = SoldierGrowth.stats;
    SoldierGrowth.stats = function(profile) {
        var out = baseStats.call(SoldierGrowth, profile);
        var eq = profile.data.equipment || {};
        for (var slot in eq) {
            var piece = eq[slot];
            if (!piece || !piece.affixes) continue;
            var mul = piece.level || 1;
            for (var k in piece.affixes) {
                out[k] = (out[k] || 0) + piece.affixes[k] * mul;
            }
        }
        return out;
    };
})();


/* ===== [[ js/classes.js ]] ===== */
// ===== VNext 职业系统 =====
// 四职业 = 小队编制原型(不替换现有士兵/武器/技能, 叠加生效)。
// 职业差异全部进入真实战斗: 伤害乘区/射速/穿透/暴击/减伤/弹速/精英伤害/战地回复。
// 职业技能为自动循环 buff(复用 squad 事件buff通道), 强度随士兵阶段(tier 0-4)成长。

var CLASS_DEFS = {
    rifleman: {
        id: 'rifleman', name: '枪械步兵', icon: '🎖️', color: '#4DA8FF',
        desc: '均衡输出的标准战线, 无短板',
        unlock: null, unlockText: '初始解锁',
        mods: { dmgMul: 1.0, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '聚焦射击', icon: '🎯', cd: 26, firstCd: 10,
            desc: '全员伤害 ×1.5, 持续5秒',
            apply: function(s, tier) { s._evDmgMul = 1.5 + tier * 0.25; s._evDmgMulT = 5; } }
    },
    gunner: {
        id: 'gunner', name: '重装机枪手', icon: '🌀', color: '#FF8844',
        desc: '高射速压制: 射速×1.3 弹速+25% 减伤+8%, 单发×0.8',
        unlock: { clear: 2 }, unlockText: '通关第2关解锁',
        mods: { dmgMul: 0.8, rateMul: 1.3, critBonus: 0, pierce: 0, dr: 0.08, bulletSpeed: 1.25, eliteDmgMul: 1.0, regenN: 0 },
        skill: { name: '弹幕全开', icon: '💥', cd: 24, firstCd: 8,
            desc: '射速 ×2, 持续3秒',
            apply: function(s, tier) { s._evRateMul = 2 + tier * 0.25; s._evRateMulT = 3; } }
    },
    marksman: {
        id: 'marksman', name: '神射狙击', icon: '🎯', color: '#9C4DFF',
        desc: '单发×1.5 暴击+10% 穿透+1, 对精英/Boss ×1.25, 射速×0.75',
        unlock: { clear: 4 }, unlockText: '通关第4关解锁',
        mods: { dmgMul: 1.5, rateMul: 0.75, critBonus: 0.1, pierce: 1, dr: 0, bulletSpeed: 1.0, eliteDmgMul: 1.25, regenN: 0 },
        skill: { name: '穿甲弹匣', icon: '🔩', cd: 30, firstCd: 12,
            desc: '穿透 +2, 持续6秒',
            apply: function(s, tier) { s._evPierce = 2 + tier; s._evPierceT = 6; } }
    },
    medic: {
        id: 'medic', name: '战地军医', icon: '💉', color: '#39D98A',
        desc: '每10秒恢复2人, 减伤+10%, 单发×0.85',
        unlock: { clear: 6 }, unlockText: '通关第6关解锁',
        mods: { dmgMul: 0.85, rateMul: 1.0, critBonus: 0, pierce: 0, dr: 0.1, bulletSpeed: 1.0, eliteDmgMul: 1.0, regenN: 1, regenInterval: 12 },
        skill: { name: '战斗激励', icon: '🚑', cd: 28, firstCd: 14,
            desc: '全员暴击率 +15%, 持续6秒',
            apply: function(s, tier) { s._evCritBonus = 0.15 + tier * 0.05; s._evCritT = 6; } }
    }
};

var SoldierClass = {
    /** 当前职业配置(未选择默认步兵) */
    def: function(profile) {
        return CLASS_DEFS[(profile && profile.data && profile.data.classId)] || CLASS_DEFS.rifleman;
    },
    /** 是否可选(解锁条件) */
    canSelect: function(profile, id) {
        var def = CLASS_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        if (!def.unlock) return { ok: true };
        if (!profile) return { ok: false, reason: 'no_profile' };
        if ((profile.data.unlockedLevel || 1) > def.unlock.clear) return { ok: true };
        return { ok: false, reason: 'locked', need: def.unlock.clear };
    },
    /** 选择职业(存档持久化) */
    select: function(profile, id) {
        var check = this.canSelect(profile, id);
        if (!check.ok) return check;
        profile.data.classId = id;
        profile.save();
        return { ok: true, id: id };
    },
    /** 技能强化档位(随士兵阶段 0-4): 新兵0/精锐1/特种2/王牌3/传奇4 */
    tier: function(profile) {
        if (typeof SoldierGrowth === 'undefined') return 0;
        var lv = SoldierGrowth.level(profile);
        return Math.min(4, Math.floor(lv / 10));
    },

    // ===== V11.4: 职业专精 (使用该职业完成对局 → 专精等级 → 永久战斗加成) =====
    MASTERY_PER_LEVEL: 3, // 每3局+1级, 上限10
    masteryOf: function(profile, id) {
        var m = (profile && profile.data.classMastery && profile.data.classMastery[id]) || { games: 0 };
        var level = Math.min(10, Math.floor(m.games / this.MASTERY_PER_LEVEL));
        return { games: m.games || 0, level: level };
    },
    /** 对局结束记录(胜负均计, 仅当前职业) */
    recordGame: function(profile, classId) {
        if (!profile || !classId) return null;
        if (!profile.data.classMastery) profile.data.classMastery = {};
        var m = profile.data.classMastery[classId] || { games: 0 };
        m.games++;
        profile.data.classMastery[classId] = m;
        profile.save();
        return this.masteryOf(profile, classId);
    },
    /** 专精加成描述(每职业不同成长方向) */
    masteryBonusText: function(id) {
        return {
            rifleman: '每级伤害 +1.5%',
            gunner: '每级射速 +2%',
            marksman: '每级暴击 +1%',
            medic: '每级伤害减免 +1%'
        }[id] || '';
    },
    _masteryBonus: function(profile, id) {
        var level = id ? this.masteryOf(profile, id).level : 0;
        switch (id) {
            case 'rifleman': return { dmgMul: 1 + 0.015 * level };
            case 'gunner': return { rateMul: 1 + 0.02 * level };
            case 'marksman': return { critBonus: 0.01 * level };
            case 'medic': return { dr: 0.01 * level };
            default: return {};
        }
    },
    /** 战斗装配(每局 start() 调用一次) — V11.4: 叠加专精加成 */
    combat: function(profile) {
        var def = this.def(profile);
        var m = def.mods;
        var mb = this._masteryBonus(profile, def.id);
        return {
            id: def.id, name: def.name, icon: def.icon, color: def.color,
            dmgMul: m.dmgMul * (mb.dmgMul || 1),
            rateMul: m.rateMul * (mb.rateMul || 1),
            critBonus: m.critBonus + (mb.critBonus || 0),
            pierce: m.pierce,
            dr: m.dr + (mb.dr || 0),
            bulletSpeed: m.bulletSpeed, eliteDmgMul: m.eliteDmgMul,
            regenN: m.regenN, regenInterval: m.regenInterval || 10,
            skill: def.skill, tier: this.tier(profile),
            mastery: this.masteryOf(profile, def.id).level
        };
    }
};


/* ===== [[ js/weapons.js ]] ===== */
// ===== V8.0 武器系统 =====
// 8种武器 × 5级升级 × 进化路线。战斗效果真实注入 combat.js。
// 配置集中: WEAPON_DEFS / EVOLUTION_DEFS。应用: WeaponSystem。

var WEAPON_DEFS = {
    rifle: {
        name: '标准步枪', icon: '🔫', type: 'single',
        desc: '稳定单体伤害',
        unlockCondition: null,
        levels: [{ dmg: 1 }, { dmg: 1.3 }, { dmg: 1.6 }, { dmg: 2 }, { dmg: 2.5 }],
        effect: function(lv) { return { dmgMul: [1, 1.3, 1.6, 2, 2.5][lv] }; }
    },
    shotgun: {
        name: '散弹枪', icon: '💥', type: 'spread',
        desc: '多发弹丸扇形范围',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ pellets: 3, dmg: 0.5 }, { pellets: 4, dmg: 0.6 }, { pellets: 5, dmg: 0.7 }, { pellets: 6, dmg: 0.8 }, { pellets: 7, dmg: 1 }],
        effect: function(lv) { return { pellets: [3,4,5,6,7][lv], dmgMul: [0.5,0.6,0.7,0.8,1][lv] }; }
    },
    sniper: {
        name: '狙击枪', icon: '🎯', type: 'pierce',
        desc: '高伤害+穿透1',
        unlockCondition: { type: 'clear', level: 1 },
        levels: [{ dmg: 3, pierce: 1 }, { dmg: 4, pierce: 1 }, { dmg: 5, pierce: 2 }, { dmg: 6, pierce: 2 }, { dmg: 8, pierce: 3 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], pierceBonus: [1,1,2,2,3][lv] }; }
    },
    mg: {
        name: '机枪', icon: '🌀', type: 'rapid',
        desc: '射速×2.5',
        unlockCondition: { type: 'clear', level: 2 },
        levels: [{ rateMul: 2 }, { rateMul: 2.3 }, { rateMul: 2.6 }, { rateMul: 2.9 }, { rateMul: 3.2 }],
        effect: function(lv) { return { rateMul: [2,2.3,2.6,2.9,3.2][lv], dmgMul: 0.55 }; }
    },
    flamethrower: {
        name: '火焰喷射器', icon: '🔥', type: 'cone',
        desc: '持续范围燃烧',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 0.8, radius: 1.2 }, { dmg: 1, radius: 1.4 }, { dmg: 1.2, radius: 1.6 }, { dmg: 1.5, radius: 1.8 }, { dmg: 1.8, radius: 2 }],
        effect: function(lv) { return { dmgMul: [0.8,1,1.2,1.5,1.8][lv], radius: [1.2,1.4,1.6,1.8,2][lv] }; }
    },
    rocket: {
        name: '火箭炮', icon: '🚀', type: 'explosive',
        desc: '范围爆炸伤害',
        unlockCondition: { type: 'clear', level: 3 },
        levels: [{ dmg: 3, radius: 1.5 }, { dmg: 4, radius: 1.7 }, { dmg: 5, radius: 2 }, { dmg: 6, radius: 2.2 }, { dmg: 8, radius: 2.5 }],
        effect: function(lv) { return { dmgMul: [3,4,5,6,8][lv], radius: [1.5,1.7,2,2.2,2.5][lv] }; }
    },
    freeze: {
        name: '冰冻枪', icon: '❄️', type: 'freeze',
        desc: '命中减速+冻结',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ slow: .4 }, { slow: .5 }, { slow: .6 }, { slow: .7 }, { slow: .8 }],
        effect: function(lv) { return { slowMul: [0.4,0.5,0.6,0.7,0.8][lv], dmgMul: 0.8 }; }
    },
    tesla: {
        name: '电磁枪', icon: '⚡', type: 'chain',
        desc: '连锁闪电攻击',
        unlockCondition: { type: 'clear', level: 4 },
        levels: [{ chain: 2 }, { chain: 3 }, { chain: 4 }, { chain: 5 }, { chain: 6 }],
        effect: function(lv) { return { chain: [2,3,4,5,6][lv], dmgMul: 0.7 }; }
    }
};

var EVOLUTION_DEFS = {
    storm_mg: {
        base: 'mg', req: { rapid: 2 },
        name: '风暴机枪', icon: '🌪️',
        desc: '射速×4 + 双弹道',
        effect: { rateMul: 4, dmgMul: 0.6, dualLane: true }
    },
    hell_rocket: {
        base: 'rocket', req: { explosive: 2 },
        name: '地狱火箭', icon: '🌋',
        desc: '爆炸半径×2 + 持续燃烧',
        effect: { dmgMul: 4, radius: 3.5, burn: true }
    },
    arctic_pierce: {
        base: 'freeze', req: { pierce: 2 },
        name: '极寒穿透炮', icon: '🧊',
        desc: '冰冻+穿透3+伤害提升',
        effect: { slowMul: 0.8, pierceBonus: 3, dmgMul: 1.5 }
    },
    thunder_chain: {
        base: 'tesla', req: { crit: 2 },
        name: '雷霆链式炮', icon: '⚡',
        desc: '连锁+暴击率+15%',
        effect: { chain: 8, critBonus: 0.15, dmgMul: 1 }
    },
    // ===== V11.3: 补齐步枪/散弹/狙击/火焰四条进化 =====
    twin_rifle: {
        base: 'rifle', req: { pierce: 1 },
        name: '双管步枪', icon: '🔫',
        desc: '伤害×2.8 + 射速×1.15',
        effect: { dmgMul: 2.8, rateMul: 1.15 }
    },
    storm_shotgun: {
        base: 'shotgun', req: { pierce: 1 },
        name: '散弹风暴', icon: '🌪️',
        desc: '弹丸+2 + 伤害×1.4',
        effect: { pellets: 2, dmgMul: 1.4 }
    },
    phantom_sniper: {
        base: 'sniper', req: { crit: 2 },
        name: '幻影狙击', icon: '👁️',
        desc: '暴击率+20% + 穿透+2',
        effect: { critBonus: 0.2, pierceBonus: 2, dmgMul: 1.3 }
    },
    inferno_thrower: {
        base: 'flamethrower', req: { crit: 2 },
        name: '炼狱喷射', icon: '🌋',
        desc: '范围+0.8 + 伤害×1.6',
        effect: { radius: 2.8, dmgMul: 1.6 }
    }
};

var WeaponSystem = {
    /** 获取当前武器(存档持久化) */
    current: function(profile) { return profile.data.weapon || 'rifle'; },
    level: function(profile) { return profile.data.weaponLevel || 0; },
    evolved: function(profile) { return profile.data.weaponEvolved || null; },

    /** 解析当前武器战斗参数 */
    stats: function(profile) {
        var id = this.current(profile);
        var lv = this.level(profile);
        var def = WEAPON_DEFS[id];
        var evo = this.evolved(profile);
        var evoDef = evo ? EVOLUTION_DEFS[evo] : null;
        var base = def.effect(lv);
        if (evoDef) {
            var e = evoDef.effect;
            for (var k in e) base[k] = e[k];
            base.evolvedName = evoDef.name;
            base.evolvedId = evo;
        }
        // V11.3: 武器词条合并(伤害/射速乘区, 暴击/穿透加值)
        var affix = profile.data.weaponAffix;
        if (affix) {
            base.affixName = affix.name;
            if (affix.k === 'dmg') base.dmgMul = (base.dmgMul || 1) * (1 + affix.v);
            else if (affix.k === 'rate') base.rateMul = (base.rateMul || 1) * (1 + affix.v);
            else if (affix.k === 'crit') base.critBonus = (base.critBonus || 0) + affix.v;
            else if (affix.k === 'pierce') base.pierceBonus = (base.pierceBonus || 0) + affix.v;
        }
        base.weaponId = id;
        base.weaponLevel = lv;
        return base;
    },

    /** 解锁/切换/升级/进化 */
    canUnlock: function(profile, id) {
        var def = WEAPON_DEFS[id];
        if (!def || !def.unlockCondition) return false;
        var cond = def.unlockCondition;
        if (cond.type === 'clear') return (profile.data.unlockedLevel || 1) > cond.level;
        return false;
    },
    switchTo: function(profile, id) {
        if (WEAPON_DEFS[id]) { profile.data.weapon = id; profile.save(); return true; }
        return false;
    },
    upgradeCost: function(profile) {
        var lv = this.level(profile);
        return [200, 400, 700, 1100, 1600][lv] || null;
    },
    upgrade: function(profile) {
        var cost = this.upgradeCost(profile);
        if (cost === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < cost) return { ok: false, reason: 'insufficient' };
        if (!profile.spend(cost)) return { ok: false, reason: 'insufficient' };
        profile.data.weaponLevel = (profile.data.weaponLevel || 0) + 1;
        // V11.3: 3级首次掉落武器词条
        var affix = null;
        if (profile.data.weaponLevel === 3 && !profile.data.weaponAffix) affix = this.rollAffix(profile);
        profile.save();
        return { ok: true, level: profile.data.weaponLevel, affix: affix };
    },
    /** 进化: 检查前置科技 */
    canEvolve: function(profile) {
        var id = this.current(profile);
        var evoId = null;
        for (var k in EVOLUTION_DEFS) { if (EVOLUTION_DEFS[k].base === id) { evoId = k; break; } }
        if (!evoId) return { ok: false, reason: 'no_evolution' };
        if (this.evolved(profile)) return { ok: false, reason: 'already_evolved' };
        var def = EVOLUTION_DEFS[evoId];
        if (!def.req) return { ok: true, evoId: evoId };
        for (var tech in def.req) {
            if ((profile.data.tech || {})[tech] < def.req[tech]) return { ok: false, reason: 'tech_required', tech: tech, need: def.req[tech] };
        }
        return { ok: true, evoId: evoId };
    },
    evolve: function(profile) {
        var check = this.canEvolve(profile);
        if (!check.ok) return check;
        profile.data.weaponEvolved = check.evoId;
        // V11.3: 进化时重roll词条
        this.rollAffix(profile);
        profile.save();
        return { ok: true, evolved: check.evoId };
    },

    // ===== V11.3: 武器词条 (升至3级随机掉落1条; 进化重roll; 全部真实进战斗) =====
    AFFIX_POOL: [
        { k: 'dmg', v: 0.10, name: '伤害 +10%' },
        { k: 'rate', v: 0.08, name: '射速 +8%' },
        { k: 'crit', v: 0.05, name: '暴击 +5%' },
        { k: 'pierce', v: 1, name: '穿透 +1' }
    ],
    rollAffix: function(profile) {
        var pool = this.AFFIX_POOL;
        var affix = pool[Math.floor(Math.random() * pool.length)];
        profile.data.weaponAffix = { k: affix.k, v: affix.v, name: affix.name };
        return profile.data.weaponAffix;
    },
    affix: function(profile) {
        return profile.data.weaponAffix || null;
    }
};


/* ===== [[ js/tech-tree.js ]] ===== */
// ===== V8.0 科技树 =====
// 三方向(火力/军团/后勤), 前置解锁, 科技点消耗。配置集中: TECH_DEFS。

var TECH_CURRENCY = 'tech'; // 科技点

var TECH_DEFS = {
    // —— 火力科技 ——
    fire_dmg:   { branch: 'fire', name: '弹药强化', icon: '💢', desc: '全队伤害 +1', cost: 100, req: null, max: 3 },
    fire_rate:  { branch: 'fire', name: '射速优化', icon: '⚡', desc: '射速 +8%', cost: 120, req: 'fire_dmg', max: 3 },
    fire_crit:  { branch: 'fire', name: '弱点分析', icon: '🎯', desc: '暴击率 +5%', cost: 200, req: 'fire_rate', max: 3 },
    fire_pierce:{ branch: 'fire', name: '穿甲技术', icon: '🔩', desc: '穿透 +1', cost: 300, req: 'fire_crit', max: 2 },
    fire_explo: { branch: 'fire', name: '爆炸弹头', icon: '💣', desc: '子弹爆炸', cost: 400, req: 'fire_pierce', max: 1 },
    // —— 军团科技 ——
    army_size:  { branch: 'army', name: '扩编', icon: '👥', desc: '初始人数 +2', cost: 100, req: null, max: 3 },
    army_limit: { branch: 'army', name: '军团上限', icon: '🏛️', desc: '最大人数 +50', cost: 250, req: 'army_size', max: 2 },
    army_regen: { branch: 'army', name: '战地医疗', icon: '🏥', desc: '每10秒恢复1人', cost: 200, req: 'army_limit', max: 2 },
    army_shield:{ branch: 'army', name: '防弹装甲', icon: '🛡️', desc: '伤害减免 8%', cost: 300, req: 'army_regen', max: 2 },
    // —— 后勤科技 ——
    log_coin:   { branch: 'logi', name: '战利品回收', icon: '🪙', desc: '金币 +15%', cost: 100, req: null, max: 3 },
    log_xp:     { branch: 'logi', name: '训练手册', icon: '📚', desc: '经验 +20%', cost: 120, req: 'log_coin', max: 3 },
    log_supply: { branch: 'logi', name: '后勤补给', icon: '📦', desc: '击杀金币 +0.3', cost: 200, req: 'log_xp', max: 2 },
    log_start:  { branch: 'logi', name: '战术储备', icon: '🎖️', desc: '开局金币 +150', cost: 300, req: 'log_supply', max: 1 }
};

var TechTree = {
    /** 获取科技等级 */
    levelOf: function(profile, id) {
        return (profile.data.tech && profile.data.tech[id]) || 0;
    },
    /** 是否可升级(前置+上限) */
    canUpgrade: function(profile, id) {
        var def = TECH_DEFS[id];
        if (!def) return { ok: false, reason: 'invalid' };
        var lv = this.levelOf(profile, id);
        if (lv >= def.max) return { ok: false, reason: 'maxed' };
        if (def.req && this.levelOf(profile, def.req) < 1) return { ok: false, reason: 'locked' };
        return { ok: true, lv: lv, cost: def.cost };
    },
    /** 升级(原子) */
    upgrade: function(profile, id) {
        var check = this.canUpgrade(profile, id);
        if (!check.ok) return check;
        if (!profile.spend(check.cost)) return { ok: false, reason: 'insufficient' };
        if (!profile.data.tech) profile.data.tech = {};
        profile.data.tech[id] = (profile.data.tech[id] || 0) + 1;
        profile.save();
        return { ok: true, id: id, lv: profile.data.tech[id] };
    },
    /** 战斗属性汇总(供 combat/squad 读取) */
    combatStats: function(profile) {
        var d = profile.data;
        var t = d.tech || {};
        return {
            dmgBonus: this.levelOf(profile, 'fire_dmg'),
            rateBonus: 0.08 * this.levelOf(profile, 'fire_rate'),
            critBonus: 0.05 * this.levelOf(profile, 'fire_crit'),
            pierceBonus: this.levelOf(profile, 'fire_pierce'),
            explosive: this.levelOf(profile, 'fire_explo') > 0,
            startBonus: 2 * this.levelOf(profile, 'army_size'),
            limitBonus: 50 * this.levelOf(profile, 'army_limit'),
            regen: this.levelOf(profile, 'army_regen'),
            drBonus: 0.08 * this.levelOf(profile, 'army_shield'),
            coinMul: 1 + 0.15 * this.levelOf(profile, 'log_coin'),
            xpMul: 1 + 0.2 * this.levelOf(profile, 'log_xp'),
            coinPerKill: 0.3 * this.levelOf(profile, 'log_supply'),
            startCoins: 150 * this.levelOf(profile, 'log_start')
        };
    },
    /** 授予科技点(结算时) */
    grantTech: function(profile, amount) {
        if (!profile.data.techPoints) profile.data.techPoints = 0;
        profile.data.techPoints += Math.floor(amount);
        profile.save();
    }
};


/* ===== [[ js/random-events.js ]] ===== */
// ===== V18.0 随机危机事件系统 (CrisisEventSystem) =====
// 完整事件池占比: 危机事件 75% / 中性事件 10% / 补给事件 15% (共 15 种事件)
// 所有危机均有明确预警与公平应对窗口, 禁止无预警直接秒杀玩家!
// 应用入口: RandomEvents.update(dt, game);  reset 在每局 start() 时调用。

var RANDOM_EVENT_DEFS = [
    // ==================== 危机事件 (合计权重 75) ====================
    { id: 'flank_ambush', name: '侧翼伏击', icon: '⚠️', weight: 15, type: 'bad', minLevel: 1,
      desc: '敌军伏击怪正从道路两侧翻栏逼近!',
      apply: function(game) {
          var n = 4 + Math.min(4, Math.floor((game.levelIndex || 0) / 2));
          for (var i = 0; i < n; i++) {
              var side = (i % 2 === 0 ? -1 : 1) * 5.2;
              var z = game.squad.z - 7.0 - (i * 0.9);
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('flanker', side, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('flanker', side, z);
          }
          return true;
      } },
    { id: 'surge', name: '狂暴怪潮', icon: '💥', weight: 12, type: 'bad', minLevel: 1,
      desc: '大量普通与快速怪潮从前方涌来!',
      apply: function(game) {
          var n = 8 + Math.min(8, Math.floor((game.elapsedTime || 0) / 45) * 2);
          for (var i = 0; i < n; i++) {
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.6;
              var z = game.squad.z - 13.5 - Math.floor(i / 3) * 1.4;
              var tp = (i % 3 === 0) ? 'fast' : 'normal';
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn(tp, x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy(tp, x, z);
          }
          return true;
      } },
    { id: 'enemy_frenzy', name: '敌军狂暴', icon: '🔥', weight: 10, type: 'bad', minLevel: 1,
      desc: '附近怪物进入狂暴, 移速+20% (6秒)!',
      apply: function(game) {
          var es = (game.enemies && game.enemies.enemies) || [];
          var hit = 0;
          for (var i = 0; i < es.length; i++) {
              var e = es[i];
              if (e.alive && !e.isBoss && Math.abs(e.z - game.squad.z) < 22) {
                  e.speedMul = Math.max(e.speedMul || 1, 1.2);
                  hit++;
              }
          }
          if (hit > 0) {
              setTimeout(function() {
                  for (var j = 0; j < es.length; j++) if (es[j].alive && !es[j].isBoss && es[j].speedMul === 1.2) es[j].speedMul = 1;
              }, 6000);
          }
          return hit > 0;
      } },
    { id: 'elite', name: '精英突降', icon: '👹', weight: 8, type: 'bad', minLevel: 3,
      desc: '1 只重装变异精英降临战场!',
      apply: function(game) {
          var x = (Math.random() - 0.5) * 2.4;
          var z = game.squad.z - 15;
          if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('elite', x, z, null);
          else if (game.enemies) game.enemies.spawnEnemy('elite', x, z);
          return true;
      } },
    { id: 'enemy_reinforce', name: '敌军增援', icon: '🚨', weight: 8, type: 'bad', minLevel: 1,
      desc: '混编敌军增援部队抵达前线!',
      apply: function(game) {
          var li = game.levelIndex || 0;
          var n = 6 + Math.min(6, li);
          var pool = li >= 1 ? ['normal', 'fast', 'shield', 'spitter'] : ['normal', 'fast', 'shield'];
          for (var i = 0; i < n; i++) {
              var tp = pool[i % pool.length];
              var x = CONFIG.LANE_X[i % 3] + (Math.random() - 0.5) * 1.4;
              var z = game.squad.z - 14 - Math.floor(i / 3) * 1.5;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn(tp, x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy(tp, x, z);
          }
          return true;
      } },
    { id: 'toxic_fog', name: '毒雾封锁', icon: '☠️', weight: 6, type: 'bad', minLevel: 2,
      desc: '战场弥漫毒雾, 小队射速降低 25% (5秒)!',
      apply: function(game) {
          if (!game.squad) return false;
          game.squad._evRateMul = 0.75;
          game.squad._evRateMulT = 5;
          return true;
      } },
    { id: 'artillery', name: '敌方炮击', icon: '💣', weight: 6, type: 'bad', minLevel: 2,
      desc: '敌军发射 2 枚炮弹! 注意红圈走位躲避!',
      apply: function(game) {
          if (!game.enemies || !game.enemies.spawnBomb) return false;
          var sz = game.squad.z;
          var sx = game.squad.x;
          game.enemies.spawnBomb(sx - 1.5, 4.5, sz - 12, clamp(sx - 1.2, -2.8, 2.8), sz - 1.5);
          game.enemies.spawnBomb(sx + 1.5, 4.5, sz - 13, clamp(sx + 1.3, -2.8, 2.8), sz - 2.5);
          return true;
      } },
    { id: 'jamming', name: '战术干扰', icon: '📡', weight: 5, type: 'bad', minLevel: 2,
      desc: '通信受干扰, 射速降低 15% (5秒)!',
      apply: function(game) {
          if (!game.squad) return false;
          game.squad._evRateMul = 0.85;
          game.squad._evRateMulT = 5;
          return true;
      } },
    { id: 'roadblock', name: '道路封锁', icon: '🚧', weight: 5, type: 'bad', minLevel: 1,
      desc: '3 只重盾怪封锁单侧跑道!',
      apply: function(game) {
          var laneX = CONFIG.LANE_X[Math.floor(Math.random() * 3)];
          for (var i = 0; i < 3; i++) {
              var z = game.squad.z - 12 - i * 1.1;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('shield', laneX + (i - 1) * 0.45, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('shield', laneX, z);
          }
          return true;
      } },

    // ==================== 中性事件 (合计权重 10) ====================
    { id: 'emergency_choice', name: '背水一战', icon: '⚡', weight: 6, type: 'neutral', minLevel: 1,
      desc: '伤害+25% (8秒), 但引来 4 只快怪突袭!',
      apply: function(game) {
          if (game.squad) { game.squad._evDmgMul = 1.25; game.squad._evDmgMulT = 8; }
          for (var i = 0; i < 4; i++) {
              var x = CONFIG.LANE_X[i % 3];
              var z = game.squad.z - 13 - i * 0.8;
              if (game.pacing && game.pacing.spawnFn) game.pacing.spawnFn('fast', x, z, null);
              else if (game.enemies) game.enemies.spawnEnemy('fast', x, z);
          }
          return true;
      } },
    { id: 'supply_crate', name: '战场物资箱', icon: '🎁', weight: 4, type: 'neutral', minLevel: 1,
      desc: '拾取战场遗落物资 +25 金币',
      apply: function(game) { if (game.profile) game.profile.addCoins(25); return true; } },

    // ==================== 补给事件 (合计权重 15) ====================
    { id: 'airdrop', name: '紧急空投', icon: '📦', weight: 5, type: 'good', isRecruit: true, minLevel: 1,
      desc: '紧急空投支援 1~3 名士兵',
      apply: function(game) {
          var want = 1 + Math.floor(Math.random() * 3); // 1~3人
          var allowed = Math.min(want, Math.max(0, RandomEvents.RECRUIT_CAP_PER_RUN - (RandomEvents._recruitTotal || 0)));
          if (allowed <= 0) return false;
          var added = game.squad.addReinforcements(allowed, '紧急空投', game.effects);
          RandomEvents._recruitTotal = (RandomEvents._recruitTotal || 0) + added;
          return added > 0;
      } },
    { id: 'medkit', name: '战地医疗', icon: '💉', weight: 4, type: 'good', minLevel: 1,
      desc: '恢复 1~3 名战斗减员 (满编获临时护盾)',
      apply: function(game) {
          var loss = (game.squad && game.squad.recoverableLoss) || 0;
          var healAmt = Math.min(3, Math.max(1, Math.ceil(loss * 0.2)));
          if (game.squad && game.squad.healSquad) {
              game.squad.healSquad(healAmt, 'medkit', game.effects);
              return true;
          }
          return false;
      } },
    { id: 'fire_support', name: '火力支援', icon: '🎯', weight: 3, type: 'good', minLevel: 1,
      desc: '6 秒内全队伤害 +25%',
      apply: function(game) { if (!game.squad) return false; game.squad._evDmgMul = 1.25; game.squad._evDmgMulT = 6; return true; } },
    { id: 'coin_rain', name: '幸运补给', icon: '🪙', weight: 3, type: 'good', minLevel: 1,
      desc: '获得 20~40 战地金币',
      apply: function(game) {
          var amt = 20 + Math.floor(Math.random() * 21);
          if (game.profile) game.profile.addCoins(amt);
          return true;
      } }
];

var RandomEvents = {
    RECRUIT_CAP_PER_RUN: 6, // V18.0: 单局随机事件直接招募上限严格 6 人
    SHARED_RECRUIT_CD: 45,
    SAME_RECRUIT_CD: 60,
    CRISIS_MIN_GAP: 12,

    /** 每局重置: V18.0 首次事件 25~35s, 后续 22~35s */
    reset: function() {
        this._t = 25 + Math.random() * 10;
        this._shown = 0;
        this._recruitTotal = 0;
        this._sharedRecruitCd = 0;
        this._crisisGap = 0;
        this._reviveGraceT = 0;
        this._eventCd = {};
    },

    /** V18.0: 复活后 8 秒危机保护窗口 */
    onRevive: function() {
        this._reviveGraceT = 8.0;
        this._t = Math.max(this._t || 0, 8.0);
    },

    update: function(dt, game) {
        if (!game || game.state !== 'playing' || game.paused) return;
        if (this._t === undefined) this.reset();
        if (this._sharedRecruitCd > 0) this._sharedRecruitCd = Math.max(0, this._sharedRecruitCd - dt);
        if (this._crisisGap > 0) this._crisisGap = Math.max(0, this._crisisGap - dt);
        if (this._reviveGraceT > 0) this._reviveGraceT = Math.max(0, this._reviveGraceT - dt);
        for (var k in this._eventCd) {
            if (this._eventCd[k] > 0) this._eventCd[k] = Math.max(0, this._eventCd[k] - dt);
        }
        // Boss 战期间暂停高危随机事件
        if (game.enemies && game.enemies.boss && game.enemies.boss.alive) return;
        if (this._reviveGraceT > 0) return;

        this._t -= dt;
        if (this._t <= 0) {
            this._t = 22 + Math.random() * 13;
            this._trigger(game);
        }
    },

    _eligible: function(def, levelNum) {
        if (levelNum !== undefined && def.minLevel && levelNum < def.minLevel) return false;
        if (this._eventCd && (this._eventCd[def.id] || 0) > 0) return false;
        if (def.type === 'bad' && (this._crisisGap || 0) > 0) return false;
        if (def.isRecruit) {
            if ((this._recruitTotal || 0) >= this.RECRUIT_CAP_PER_RUN) return false;
            if ((this._sharedRecruitCd || 0) > 0) return false;
        }
        return true;
    },

    _trigger: function(game) {
        var levelNum = (game.levelIndex || 0) + 1;
        var pool = [];
        for (var p = 0; p < RANDOM_EVENT_DEFS.length; p++) {
            if (this._eligible(RANDOM_EVENT_DEFS[p], levelNum)) pool.push(RANDOM_EVENT_DEFS[p]);
        }
        if (!pool.length) return;
        for (var attempt = 0; attempt < 4; attempt++) {
            var total = 0, i;
            for (i = 0; i < pool.length; i++) total += pool[i].weight;
            var roll = Math.random() * total;
            var def = null;
            for (i = 0; i < pool.length; i++) {
                roll -= pool[i].weight;
                if (roll <= 0) { def = pool[i]; break; }
            }
            if (!def) def = pool[pool.length - 1];
            var ok = def.apply(game);
            if (ok !== false) {
                this._shown++;
                this._eventCd = this._eventCd || {};
                this._eventCd[def.id] = this.SAME_RECRUIT_CD;
                if (def.type === 'bad') this._crisisGap = this.CRISIS_MIN_GAP;
                if (def.isRecruit) this._sharedRecruitCd = this.SHARED_RECRUIT_CD;
                this._showBanner(def);
                return;
            }
        }
    },

    _showBanner: function(def) {
        if (typeof document === 'undefined') return;
        var host = document.getElementById('game-container') || document.body;
        var el = document.getElementById('v80-event-banner');
        if (!el) {
            el = document.createElement('div');
            el.id = 'v80-event-banner';
            el.className = 'v80-event-banner';
            host.appendChild(el);
        }
        var isBad = def.type === 'bad';
        el.className = 'v80-event-banner ' + (isBad ? 'bad' : 'good');
        el.innerHTML =
            '<span class="ev-ico">' + def.icon + '</span>' +
            '<span class="ev-body"><b>' + (isBad ? '⚠ 突发危机 · ' : '') + def.name + '</b>' +
            '<small>' + def.desc + '</small></span>';
        el.classList.add('show');
        clearTimeout(this._hideTimer);
        this._hideTimer = setTimeout(function() { el.classList.remove('show'); }, 2200);
    }
};


/* ===== [[ js/leaderboard.js ]] ===== */
// ===== VNext 本地排行榜 =====
// 真实对局数据入库(结算时写入), 无任何伪造排名。平台排行(抖音/微信)预留适配点:
// Platform.leaderboard 可被平台适配器覆写 report/fetchTop; H5 默认实现=本地存档。

var LEADERBOARD_CAP = 20;

var Leaderboard = {
    /** 结算分: 击杀为主, 人数/连杀/通关加权 */
    scoreOf: function(run) {
        return Math.round((run.kills || 0) * 10 + (run.maxCount || 0) * 5 +
            (run.combo || 0) * 2 + (run.win ? 500 + (run.level || 0) * 100 : 0));
    },
    /** 写入一条真实战绩(结算调用; 保留前N名) */
    record: function(profile, run) {
        if (!profile) return null;
        var entry = {
            score: this.scoreOf(run),
            level: run.level || 0,
            win: !!run.win,
            kills: run.kills || 0,
            maxCount: run.maxCount || 0,
            combo: run.combo || 0,
            time: Math.round((run.time || 0) * 10) / 10,
            classId: run.classId || 'rifleman',
            challenge: run.challenge || null,
            ts: Date.now()
        };
        if (!profile.data.records) profile.data.records = [];
        profile.data.records.push(entry);
        profile.data.records.sort(function(a, b) { return b.score - a.score; });
        if (profile.data.records.length > LEADERBOARD_CAP) profile.data.records.length = LEADERBOARD_CAP;
        profile.save();
        // 平台排行上报(适配器可覆写; H5默认no-op本地已存)
        if (typeof Platform !== 'undefined') {
            if (!Platform.leaderboard) {
                Platform.leaderboard = {
                    report: function() { /* 本地已由 record 持久化 */ },
                    fetchTop: function(p, n) { return Leaderboard.top(p, n); }
                };
            }
            if (Platform.leaderboard.report) {
                try { Platform.leaderboard.report(entry); } catch (e) {}
            }
        }
        return entry;
    },
    /** 本地榜单(降序) */
    top: function(profile, n) {
        var list = (profile && profile.data.records) || [];
        return list.slice(0, n || LEADERBOARD_CAP);
    },
    /** 日期格式化(排名时间展示) */
    fmtDate: function(ts) {
        var d = new Date(ts);
        return (d.getMonth() + 1) + '/' + d.getDate() + ' ' +
            ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
    }
};


/* ===== [[ js/progression.js ]] ===== */
// ===== V6.0 进度系统: 星级 / 玩家经验等级 / 成就 / 存档迁移 v2 =====
// 依赖 economy.js 的 GameProfile(存档)。所有奖励发放幂等(claimedRewards 账本)。

var STAR_RULES = {
    // 每关二星=通关且结算人数≥star2Count; 三星=二星且击杀≥star3Kills
    L1: { star2Count: 25, star3Kills: 80 },
    L2: { star2Count: 40, star3Kills: 130 },
    L3: { star2Count: 45, star3Kills: 200 },
    L4: { star2Count: 60, star3Kills: 260 },
    L5: { star2Count: 90, star3Kills: 350 },
    L6: { star2Count: 110, star3Kills: 500 },
    // V10 QA修复: 补齐 L7-L10(原回退 L1 阈值25/80 → 后期关卡星级全面通胀)
    L7: { star2Count: 130, star3Kills: 650 },
    L8: { star2Count: 150, star3Kills: 800 },
    L9: { star2Count: 170, star3Kills: 950 },
    L10: { star2Count: 200, star3Kills: 1200 }
};

var XP_RULES = {
    basePerWin: 120,        // 通关基础经验
    perKill: 1,             // 每击杀经验
    perStar: 80,            // 每颗星经验(首获)
    firstClearBonus: 200,   // 首次通关额外
    levelCurve: function(level) { return Math.round(300 * Math.pow(level, 1.35)); } // 升到 level+1 需要的累计经验
};

var ACHIEVEMENT_DEFS = [
    { id: 'first_blood',  name: '初战告捷',   icon: '🩸', desc: '完成第一关',        reward: 50 },
    { id: 'squad_100',    name: '百人军团',   icon: '🎖️', desc: '单局人数达到100',   reward: 80 },
    { id: 'squad_300',    name: '三百勇士',   icon: '🏅', desc: '单局人数达到300',   reward: 150 },
    { id: 'squad_500',    name: '五百膨胀',   icon: '🏆', desc: '单局人数达到500',   reward: 260 },
    { id: 'kills_500',    name: '屠戮者',     icon: '⚔️', desc: '累计击杀500只僵尸',  reward: 80 },
    { id: 'kills_2000',   name: '尸潮收割机', icon: '💀', desc: '累计击杀2000只僵尸', reward: 180 },
    { id: 'kills_5000',   name: '末日清道夫', icon: '☠️', desc: '累计击杀5000只僵尸', reward: 320 },
    { id: 'boss_first',   name: '弑君者',     icon: '👑', desc: '首次击败Boss',      reward: 120 },
    { id: 'boss_5',       name: 'Boss猎人',   icon: '🗡️', desc: '累计击败5个Boss',    reward: 240 },
    { id: 'clear_l3',     name: '破盾者',     icon: '🛡️', desc: '通过第3关盾牌军团',   reward: 100 },
    { id: 'clear_l5',     name: '终焉突破',   icon: '🔮', desc: '通过第5关',         reward: 160 },
    { id: 'clear_l6',     name: '末日终结者', icon: '🌟', desc: '通过第6关末日核心',   reward: 300 },
    { id: 'perfect_l1',   name: '新兵模范',   icon: '⭐', desc: '第1关获得三星',      reward: 100 },
    { id: 'perfect_l6',   name: '传奇指挥官', icon: '✨', desc: '第6关获得三星',      reward: 500 },
    { id: 'stars_9',      name: '星尘收藏家', icon: '🌠', desc: '累计获得9颗星',      reward: 150 },
    { id: 'stars_15',     name: '银河战星',   icon: '🌌', desc: '累计获得15颗星',     reward: 280 },
    { id: 'wins_10',      name: '常胜将军',   icon: '🎉', desc: '累计通关10次',      reward: 140 },
    { id: 'upgrades_10',  name: '军火大亨',   icon: '🏭', desc: '永久升级总等级达10', reward: 160 },
    { id: 'rich_2000',    name: '战地富豪',   icon: '💰', desc: '同时持有2000金币',   reward: 120 },
    { id: 'player_10',    name: '身经百战',   icon: '📈', desc: '玩家等级达到10级',   reward: 200 },
    { id: 'player_20',    name: '战场老兵',   icon: '🎖️', desc: '玩家等级达到20级',   reward: 400 },
    { id: 'clear_l7',     name: '巢穴猎人',   icon: '🕳️', desc: '通过第7关地下巢穴',   reward: 350 },
    { id: 'clear_l8',     name: '机械终结',   icon: '🤖', desc: '通过第8关机械废土',   reward: 400 },
    { id: 'clear_l9',     name: '防线突破',   icon: '🏰', desc: '通过第9关最终防线',   reward: 450 },
    { id: 'clear_l10',    name: '末日降临',   icon: '🌍', desc: '通过第10关终极末日',   reward: 600 },
    { id: 'perfect_l5',   name: '防线守护',   icon: '🌟', desc: '第5关获得三星',      reward: 250 },
    { id: 'perfect_l2',   name: '街区清理',   icon: '⭐', desc: '第2关获得三星',      reward: 100 },
    { id: 'perfect_l3',   name: '实验突破',   icon: '⭐', desc: '第3关获得三星',      reward: 120 },
    { id: 'perfect_l4',   name: '工业毁灭',   icon: '⭐', desc: '第4关获得三星',      reward: 140 },
    { id: 'boss_10',      name: '屠君者',     icon: '🔪', desc: '累计击败10个Boss',   reward: 350 },
    { id: 'boss_20',      name: 'Boss终结者', icon: '💀', desc: '累计击败20个Boss',   reward: 500 },
    { id: 'elite_50',     name: '精英猎手',   icon: '🎯', desc: '累计击杀50个精英',   reward: 200 },
    { id: 'elite_100',    name: '精英屠戮',   icon: '⚔️', desc: '累计击杀100个精英',  reward: 350 },
    { id: 'kills_10000',  name: '僵尸末日',   icon: '💀', desc: '累计击杀10000只僵尸', reward: 500 },
    { id: 'wins_25',      name: '胜利之师',   icon: '🎊', desc: '累计通关25次',      reward: 280 },
    { id: 'rich_5000',    name: '战争财阀',   icon: '💎', desc: '同时持有5000金币',   reward: 200 },
    { id: 'weapon_evo',   name: '武器大师',   icon: '🔧', desc: '进化一把武器',      reward: 200 },
    { id: 'tech_5',       name: '科学家',     icon: '🔬', desc: '科技树升级5次',     reward: 180 },
    { id: 'upgrades_20',  name: '军备竞赛',   icon: '🏭', desc: '永久升级总等级达20', reward: 300 },
    { id: 'sign_7',       name: '七日忠诚',   icon: '📅', desc: '连续签到7天',      reward: 250 }
];

var Progression = {
    /** V5.1.5→V6.0 存档迁移: 补默认字段, 不动旧数据 */
    migrate: function(data) {
        if ((data.profileVersion || 0) >= 2) return data;
        data.profileVersion = 2;
        if (!data.stars) data.stars = {};
        if (data.xp === undefined) data.xp = 0;
        if (data.playerLevel === undefined) data.playerLevel = 1;
        if (!data.achievements) data.achievements = {};
        if (!data.stats) data.stats = { bossKills: 0, eliteKills: 0, playTime: 0 };
        if (data.totalWins === undefined) data.totalWins = 0;
        if (data.totalKills === undefined) data.totalKills = 0;
        if (data.bestSquadCount === undefined) data.bestSquadCount = 0;
        return data;
    },

    /** 星级评定: win + 人数/击杀门槛 → 0-3 */
    computeStars: function(level, endCount, kills, won) {
        if (!won) return 0;
        var rule = STAR_RULES['L' + (level + 1)] || STAR_RULES.L1;
        var stars = 1;
        if (endCount >= rule.star2Count) stars = 2;
        if (stars === 2 && kills >= rule.star3Kills) stars = 3;
        return stars;
    },

    /** 经验→等级(累计经验制) */
    levelFromXp: function(xp) {
        var level = 1, need = 0;
        while (level < 99) {
            need += XP_RULES.levelCurve(level);
            if (xp < need) break;
            level++;
        }
        return { level: level, nextNeed: need };
    },

    /** 结算经验(幂等由调用方保证: 首通/星级奖励走 claimedRewards) */
    computeXp: function(kills, won, levelIndex, newStars) {
        var xp = kills * XP_RULES.perKill;
        if (won) xp += XP_RULES.basePerWin + levelIndex * 30;
        if (newStars > 0) xp += newStars * XP_RULES.perStar;
        return xp;
    },

    /** 成就检测: 返回新解锁的成就列表(自动入账claimedRewards发奖金) */
    checkAchievements: function(profile) {
        var d = profile.data;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        var upgradeTotal = 0;
        for (var u in d.upgrades) upgradeTotal += d.upgrades[u] || 0;
        var pl = Progression.levelFromXp(d.xp || 0).level;
        var conditions = {
            first_blood: (d.unlockedLevel || 1) >= 2,
            squad_100: (d.bestSquadCount || 0) >= 100,
            squad_300: (d.bestSquadCount || 0) >= 300,
            squad_500: (d.bestSquadCount || 0) >= 500,
            kills_500: (d.totalKills || 0) >= 500,
            kills_2000: (d.totalKills || 0) >= 2000,
            kills_5000: (d.totalKills || 0) >= 5000,
            boss_first: (d.stats && d.stats.bossKills || 0) >= 1,
            boss_5: (d.stats && d.stats.bossKills || 0) >= 5,
            clear_l3: (d.unlockedLevel || 1) >= 4,
            clear_l5: (d.unlockedLevel || 1) >= 6,
            clear_l6: !!d.achievements_meta && d.achievements_meta.clear_l6,
            perfect_l1: (d.stars && d.stars.L1) === 3,
            perfect_l6: (d.stars && d.stars.L6) === 3,
            stars_9: totalStars >= 9,
            stars_15: totalStars >= 15,
            wins_10: (d.totalWins || 0) >= 10,
            upgrades_10: upgradeTotal >= 10,
            rich_2000: (d.coins || 0) >= 2000,
            player_10: pl >= 10,
            player_20: pl >= 20,
            clear_l7: (d.unlockedLevel || 1) >= 8,
            clear_l8: (d.unlockedLevel || 1) >= 9,
            clear_l9: (d.unlockedLevel || 1) >= 10,
            clear_l10: !!d.achievements_meta && d.achievements_meta.clear_l10,
            perfect_l5: (d.stars && d.stars.L5) === 3,
            perfect_l2: (d.stars && d.stars.L2) === 3,
            perfect_l3: (d.stars && d.stars.L3) === 3,
            perfect_l4: (d.stars && d.stars.L4) === 3,
            boss_10: (d.stats && d.stats.bossKills || 0) >= 10,
            boss_20: (d.stats && d.stats.bossKills || 0) >= 20,
            elite_50: (d.stats && d.stats.eliteKills || 0) >= 50,
            elite_100: (d.stats && d.stats.eliteKills || 0) >= 100,
            kills_10000: (d.totalKills || 0) >= 10000,
            wins_25: (d.totalWins || 0) >= 25,
            rich_5000: (d.coins || 0) >= 5000,
            weapon_evo: !!(d.weaponEvolved),
            tech_5: (function() { var t = d.tech || {}; var total = 0; for (var k in t) total += t[k]; return total >= 5; })(),
            upgrades_20: (function() { var t = d.upgrades || {}; var total = 0; for (var k in t) total += t[k]; return total >= 20; })(),
            sign_7: (d.signin && d.signin.streak || 0) >= 7
        };
        var newly = [];
        for (var i = 0; i < ACHIEVEMENT_DEFS.length; i++) {
            var def = ACHIEVEMENT_DEFS[i];
            if (conditions[def.id] && !profile.hasClaimed('ach:' + def.id)) {
                profile.claimReward('ach:' + def.id, def.reward);
                newly.push(def);
            }
        }
        return newly;
    }
};


/* ===== [[ js/challenge.js ]] ===== */
// ===== V6.0 挑战模式 + 每日任务 =====
// 挑战: 狂暴生存(无尽波次) / Boss试炼(连续Boss rush)
// 每日: 3个任务按日期种子从池中选出, 进度持久化, 奖励幂等

var CHALLENGE_MODES = {
    survival: {
        name: '无尽尸潮', icon: '🌊',
        desc: '无限波次，生存越久分越高',
        baseHp: 4, hpScale: 1.12, spawnRateMul: 1.2
    },
    boss_rush: {
        name: 'Boss试炼', icon: '👑',
        desc: '连续挑战强化Boss，击杀数=得分',
        baseHp: 6, hpScale: 1.25
    }
};


var DAILY_TASK_POOL = [
    { id: 'kill_100',  name: '消灭100只僵尸', target: 100, type: 'kills', reward: 60 },
    { id: 'kill_300',  name: '消灭300只僵尸', target: 300, type: 'kills', reward: 150 },
    { id: 'clear_2',   name: '通关2个关卡',   target: 2,  type: 'wins',  reward: 100 },
    { id: 'clear_4',   name: '通关4个关卡',   target: 4,  type: 'wins',  reward: 200 },
    { id: 'squad_50',  name: '单局人数达50',  target: 50, type: 'squad', reward: 80 },
    { id: 'boss_1',    name: '击败1个Boss',   target: 1,  type: 'boss',  reward: 120 },
    { id: 'gate_5',    name: '穿过5扇状态门',  target: 5,  type: 'gates', reward: 60 },
    { id: 'skill_2',   name: '选择2个技能',   target: 2,  type: 'skills', reward: 50 }
];

var ChallengeDaily = {
    _gameRef: null,
    /** 今日日期字符串(时区安全) */
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },

    /** 获取或初始化今日任务(种子随机选3个不重复) */
    ensureDaily: function(profile) {
        var today = this.today();
        var d = profile.data;
        if (d.daily && d.daily.date === today) return d.daily;
        var seed = today.split('-').reduce(function(a, b) { return (a * 31 + parseInt(b) || 0) >>> 0; }, 7);
        var pool = DAILY_TASK_POOL.slice();
        var picked = [];
        while (picked.length < 3 && pool.length) {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            picked.push(pool.splice(seed % pool.length, 1)[0]);
        }
        d.daily = {
            date: today,
            tasks: picked.map(function(t) { return { id: t.id, name: t.name, target: t.target, type: t.type, reward: t.reward, progress: 0, claimed: false }; })
        };
        profile.save();
        return d.daily;
    },

    /** 战斗内进度上报(V10 QA: 仅在进度实际变化时落盘, 原实现每次调用无条件save) */
    report: function(profile, type, amount) {
        var daily = this.ensureDaily(profile);
        var g = this._gameRef;
        var dirty = false;
        daily.tasks.forEach(function(t) {
            if (t.claimed) return;
            var before = t.progress;
            if (t.type === 'kills' && type === 'kills') t.progress = Math.min(t.target, g ? (g.enemies ? g.enemies.killCount : t.progress) : t.progress + amount);
            else if (t.type === 'squad' && type === 'squad' && g) t.progress = Math.min(t.target, Math.max(t.progress, g.maxCount || 0));
            else if (t.type === 'gates' && type === 'gates' && g) t.progress = Math.min(t.target, g.gates.chosenRows.size);
            else if (t.type === 'skills' && type === 'skills' && g) t.progress = Math.min(t.target, Object.keys(g.squad._skills || {}).length);
            else if (t.type === 'boss' && type === 'boss' && g) t.progress = Math.min(t.target, g.enemies.bossKills || 0);
            else if (t.type === 'wins' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            else if (t.type === 'clear' && type === 'wins') t.progress = Math.min(t.target, t.progress + amount);
            if (t.progress !== before) dirty = true;
        });
        if (dirty) profile.save();
    },

    /** 领取奖励(幂等) */
    claim: function(profile, index) {
        var daily = this.ensureDaily(profile);
        var t = daily.tasks[index];
        if (!t || t.claimed || t.progress < t.target) return false;
        t.claimed = true;
        profile.addCoins(t.reward);
        profile.save();
        return true;
    }
}; // V10.1: 移除无调用的 startChallenge(挑战模式由 game.js startChallengeMode 实现)

// ===== V8.0: 7天循环签到 =====
var SIGNIN_REWARDS = [80, 120, 150, 200, 250, 300, 500];

var SignInSystem = {
    /** 获取或初始化签到状态 */
    ensure: function(profile) {
        var d = profile.data;
        if (!d.signin) d.signin = { lastDate: '', streak: 0, totalDays: 0 };
        return d.signin;
    },
    today: function() {
        var d = new Date();
        return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
    },
    /** 今日是否可签(上次签到不是今天) */
    canSign: function(profile) {
        var si = this.ensure(profile);
        return si.lastDate !== this.today();
    },
    /** 签到(幂等: 同一天不重复) */
    sign: function(profile) {
        var si = this.ensure(profile);
        var today = this.today();
        if (si.lastDate === today) return false;
        si.streak = (si.streak % 7) + 1;
        si.totalDays++;
        si.lastDate = today;
        var reward = SIGNIN_REWARDS[(si.streak - 1) % 7];
        profile.addCoins(reward);
        profile.save();
        return { streak: si.streak, reward: reward };
    }
};


/* ===== [[ js/ui-v60.js ]] ===== */
// ===== V6.0/V8.0 UI 模块: 关卡地图 / 训练中心 / 军械库 / 科技树 / 图鉴 / 挑战 / 成就 / 每日 / 设置 =====
// 由 V42Art.installUI 后调用 V60UI.install(game) 装配; 全部数据来自 GameProfile。

// V14: 首页功能宫格统一 SVG 图标(24x24, stroke=currentColor, 线宽1.8) — 替换系统Emoji占位
var V60_NAV_ICONS = (function () {
    var A = 'xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    function svg(paths) { return '<svg ' + A + '>' + paths + '</svg>'; }
    return {
        map: svg('<path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>'),
        train: svg('<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.6"/><path d="M12 5V2.5M12 21.5V19M5 12H2.5M21.5 12H19"/>'),
        armory: svg('<path d="M14.7 6.3a4.5 4.5 0 0 0-5.9 5.9L3 18l3 3 5.8-5.8a4.5 4.5 0 0 0 5.9-5.9l-2.6 2.6-2.3-2.3 2.9-3.3z"/>'),
        tech: svg('<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>'),
        codex: svg('<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>'),
        challenge: svg('<path d="M4 4l7 7M20 4l-7 7M4 20l6-6M20 20l-6-6"/><path d="M3 4h2M19 4h2M3 20h3M18 20h3"/>'),
        rank: svg('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 18h4v3h-4z"/>'),
        ach: svg('<circle cx="12" cy="9" r="5"/><path d="M9 13l-2 8 5-3 5 3-2-8"/>'),
        daily: svg('<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3v3M15 3v3M8.5 12l2.2 2.2L15.5 9.5"/>'),
        set: svg('<circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.2 5.2l2.1 2.1M16.7 16.7l2.1 2.1M18.8 5.2l-2.1 2.1M7.3 16.7l-2.1 2.1"/>')
    };
})();

var V60UI = {
    // V8.0: 十关元数据(名称取自 LEVELS[i].name, 去掉"第 X 关 "前缀)
    LEVEL_META: [
        { icon: '🏕️', threat: '低' },
        { icon: '🏙️', threat: '中' },
        { icon: '🧪', threat: '中高' },
        { icon: '☣️', threat: '高' },
        { icon: '🛡️', threat: '极高' },
        { icon: '☢️', threat: '终局' },
        { icon: '🕳️', threat: '高危' },
        { icon: '⚙️', threat: '极危' },
        { icon: '🏰', threat: '要塞' },
        { icon: '💀', threat: '末日' }
    ],

    install: function(game) {
        this.game = game;
        if (typeof ChallengeDaily !== 'undefined') ChallengeDaily._gameRef = game;
        var container = document.getElementById('game-container');
        if (!container || document.getElementById('v60-map-page')) return;

        // —— 页面骨架(全部页面) ——
        container.insertAdjacentHTML('beforeend',
            '<div id="v60-daily-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">每日作战令</div>' +
                    '<h2 class="v60-page-title">每日任务</h2>' +
                    '<div id="v60-signin-strip" class="v60-signin-strip"></div>' +
                    '<button id="v60-signin-btn" class="btn-primary">签到</button>' +
                    '<div id="v60-daily-list" class="v60-ach-list"></div>' +
                    '<button id="v60-daily-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-train-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">军团训练中心</div>' +
                    '<div class="v60-train-header" id="v60-train-header"></div>' +
                    '<div class="v60-train-stats" id="v60-train-stats"></div>' +
                    '<div class="v60-train-equip" id="v60-train-equip"></div>' +
                    '<div class="v60-equip-title" style="margin-top:10px">背包 · 掉落装备</div>' +
                    '<div id="v60-train-bag" class="v60-bag-list"></div>' +
                    '<button id="v60-train-upgrade" class="btn-primary">升级士兵</button>' +
                    '<div class="v60-train-cost" id="v60-train-cost"></div>' +
                    '<button id="v60-train-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-armory-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">装备整备</div>' +
                    '<h2 class="v60-page-title">军械库</h2>' +
                    '<div id="v118-armory-hero" class="v118-armory-hero"></div>' +
                    '<div id="v60-armory-list" class="v60-armory-list"></div>' +
                    '<button id="v60-armory-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-tech-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker cyan">科研站</div>' +
                    '<div id="v60-tech-points" class="v60-tech-points"></div>' +
                    '<div id="v60-tech-list" class="v60-tech-list"></div>' +
                    '<button id="v60-tech-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-codex-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">战场图鉴</div>' +
                    '<h2 class="v60-page-title">Boss图鉴</h2>' +
                    '<div id="v60-codex-bosses" class="v60-codex-list"></div>' +
                    '<h2 class="v60-page-title">武器收藏</h2>' +
                    '<div id="v60-codex-weapons" class="v60-codex-list"></div>' +
                    '<button id="v60-codex-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-challenge-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">极限挑战</div>' +
                    '<h2 class="v60-page-title">挑战模式</h2>' +
                    '<div id="v60-challenge-list" class="v60-challenge-list"></div>' +
                    '<button id="v60-challenge-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-rank-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">名人堂</div>' +
                    '<h2 class="v60-page-title">本机战绩榜</h2>' +
                    '<div class="v118-rank-source">仅记录此设备上的真实对局</div>' +
                    '<div id="v60-rank-list" class="v60-rank-list"></div>' +
                    '<button id="v60-rank-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-map-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">作战地图 · 十大防区</div>' +
                    '<h2 class="v60-page-title">关卡地图</h2>' +
                    '<div class="v60-map-stats" id="v60-map-stats"></div>' +
                    '<div id="v60-map-nodes" class="v60-map-nodes"></div>' +
                    '<button id="v60-map-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-ach-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker gold">荣誉殿堂</div>' +
                    '<h2 class="v60-page-title">成就</h2>' +
                    '<div id="v60-ach-list" class="v60-ach-list"></div>' +
                    '<button id="v60-ach-back" class="btn-secondary">返回</button>' +
                '</div>' +
            '</div>' +
            '<div id="v60-settings-page" class="v60-page hidden">' +
                '<div class="title-panel v60-panel">' +
                    '<div class="v42-panel-kicker">系统</div>' +
                    '<h2 class="v60-page-title">设置</h2>' +
                    '<div class="v60-setting-row"><span>音效</span><button id="v60-set-sound" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>画质</span><button id="v60-set-quality" class="v60-toggle"></button></div>' +
                    '<div class="v60-setting-row"><span>屏幕震动</span><button id="v60-set-shake" class="v60-toggle"></button></div>' +
                    '<div class="v60-saveinfo" id="v60-saveinfo"></div>' +
                    '<button id="v60-set-back" class="btn-primary">返回</button>' +
                '</div>' +
            '</div>');

        // —— 首页按钮组(V8.0: 九宫格导航) ——
        var startScreen = document.getElementById('start-screen');
        var startPanel = startScreen ? startScreen.querySelector('.title-panel') : null;
        if (startPanel && !document.getElementById('v60-home-nav')) {
            startPanel.insertAdjacentHTML('beforeend',
                '<div id="v60-home-nav" class="v60-home-nav">' +
                    '<button id="v60-btn-map" class="v60-nav-btn">' + V60_NAV_ICONS.map + ' 地图</button>' +
                    '<button id="v60-btn-train" class="v60-nav-btn">' + V60_NAV_ICONS.train + ' 训练</button>' +
                    '<button id="v60-btn-armory" class="v60-nav-btn">' + V60_NAV_ICONS.armory + ' 军械库</button>' +
                    '<button id="v60-btn-tech" class="v60-nav-btn">' + V60_NAV_ICONS.tech + ' 科技</button>' +
                    '<button id="v60-btn-codex" class="v60-nav-btn">' + V60_NAV_ICONS.codex + ' 图鉴</button>' +
                    '<button id="v60-btn-challenge" class="v60-nav-btn">' + V60_NAV_ICONS.challenge + ' 挑战</button>' +
                    '<button id="v60-btn-rank" class="v60-nav-btn">' + V60_NAV_ICONS.rank + ' 排行</button>' +
                    '<button id="v60-btn-ach" class="v60-nav-btn">' + V60_NAV_ICONS.ach + ' 成就</button>' +
                    '<button id="v60-btn-daily" class="v60-nav-btn">' + V60_NAV_ICONS.daily + ' 每日</button>' +
                    '<button id="v60-btn-set" class="v60-nav-btn">' + V60_NAV_ICONS.set + ' 设置</button>' +
                '</div>' +
                '<div id="v60-class-row" class="v60-class-row"></div>' +
                '<div id="v60-home-growth" class="v60-home-growth"></div>');
        }

        // —— 事件(全量防御) ——
        var self = this;
        var bind = function(id, fn) {
            var el = document.getElementById(id);
            if (el) el.onclick = function() { game._sfx('click'); fn(); };
        };
        bind('v60-btn-map', function() { self.showPage('v60-map-page'); self.renderMap(game); });
        bind('v60-btn-ach', function() { self.showPage('v60-ach-page'); self.renderAchievements(game); });
        bind('v60-btn-set', function() { self.showPage('v60-settings-page'); self.renderSettings(game); });
        bind('v60-btn-daily', function() { self.showPage('v60-daily-page'); self.renderDaily(game); });
        bind('v60-btn-train', function() { self.showPage('v60-train-page'); self.renderTraining(game); });
        bind('v60-btn-armory', function() { self.showPage('v60-armory-page'); self.renderArmory(game); });
        bind('v60-btn-tech', function() { self.showPage('v60-tech-page'); self.renderTech(game); });
        bind('v60-btn-codex', function() { self.showPage('v60-codex-page'); self.renderCodex(game); });
        bind('v60-btn-challenge', function() { self.showPage('v60-challenge-page'); self.renderChallenges(game); });
        bind('v60-btn-rank', function() { self.showPage('v60-rank-page'); self.renderRank(game); });
        bind('v60-rank-back', function() { self.hidePages(); });
        bind('v60-map-back', function() { self.hidePages(); });
        bind('v60-ach-back', function() { self.hidePages(); });
        bind('v60-daily-back', function() { self.hidePages(); });
        bind('v60-set-back', function() { self.hidePages(); });
        bind('v60-train-back', function() { self.hidePages(); });
        bind('v60-armory-back', function() { self.hidePages(); });
        bind('v60-tech-back', function() { self.hidePages(); });
        bind('v60-codex-back', function() { self.hidePages(); });
        bind('v60-challenge-back', function() { self.hidePages(); });
        bind('v60-signin-btn', function() {
            if (typeof SignInSystem === 'undefined' || !game.profile) return;
            var r = SignInSystem.sign(game.profile);
            if (r) {
                game._sfx('win');
                game._refreshCoinDisplays();
                self.renderDaily(game);
            } else {
                var btn = document.getElementById('v60-signin-btn');
                if (btn) btn.textContent = '今日已签';
            }
        });
        bind('v60-set-sound', function() {
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.setMuted(!Platform.audio.isMuted());
                game._updateSoundLabel();
                self.renderSettings(game);
            }
        });
        bind('v60-set-quality', function() {
            var cur = game.world.quality;
            var next = (cur + 1) % 3;
            // V12: 画质偏好走 Platform.storage(旧裸键 pz_quality 只写不读已修复; 微信端无 localStorage)
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_quality', String(next));
            } else {
                try { localStorage.setItem('pz_quality', String(next)); } catch (e) {}
            }
            location.reload();
        });
        bind('v60-set-shake', function() {
            game.world._shakeDisabled = !game.world._shakeDisabled;
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.setLegacy) {
                Platform.storage.setLegacy('pz_shake_off', game.world._shakeDisabled ? '1' : '0');
            } else {
                try { localStorage.setItem('pz_shake_off', game.world._shakeDisabled ? '1' : '0'); } catch (e) {}
            }
            self.renderSettings(game);
        });

        // 启动时恢复设置
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            if (Platform.storage.getLegacy('pz_shake_off', '0') === '1') game.world._shakeDisabled = true;
        } else {
            try {
                if (localStorage.getItem('pz_shake_off') === '1') game.world._shakeDisabled = true;
            } catch (e) {}
        }
        // V13: 启动恢复"减少动效"偏好
        try {
            var motionOn0 = Platform.storage.get('motion_reduced', 'false') === 'true';
            var htmlRoot0 = document.documentElement;
            if (htmlRoot0 && htmlRoot0.classList) htmlRoot0.classList.toggle('v13-reduced-motion', motionOn0);
            if (window.__minidom && window.__minidom.body) window.__minidom.body.classList.toggle('v13-reduced-motion', motionOn0);
        } catch (e) {}

        this.renderHomeGrowth(game);
        this.renderClassSelector(game);
    },

    // ===== VNext: 职业选择(首页四卡) =====
    renderClassSelector: function(game) {
        var row = document.getElementById('v60-class-row');
        if (!row || !game.profile || typeof SoldierClass === 'undefined') return;
        var current = SoldierClass.def(game.profile).id;
        row.innerHTML = '';
        for (var id in CLASS_DEFS) {
            var def = CLASS_DEFS[id];
            var check = SoldierClass.canSelect(game.profile, id);
            var card = document.createElement('button');
            card.className = 'v60-class-card' + (id === current ? ' selected' : '') + (check.ok ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-class-icon">' + def.icon + '</div>' +
                '<div class="v60-class-name">' + def.name + '</div>' +
                '<div class="v60-class-desc">' + (check.ok
                    ? def.desc + '<br>专精 Lv.' + SoldierClass.masteryOf(game.profile, id).level + ' (' + SoldierClass.masteryOf(game.profile, id).games + '场)'
                    : def.unlockText) + '</div>';
            card.onclick = function(cid) { return function() {
                var r = SoldierClass.select(game.profile, cid);
                if (r.ok) { game._sfx('gate'); V60UI.renderClassSelector(game); }
                else { game._sfx('click'); }
            }; }(id);
            row.appendChild(card);
        }
    },


    showPage: function(id) {
        this.hidePages();
        var el = document.getElementById(id);
        if (el) el.classList.remove('hidden');
    },

    /** V8.0修复: 全部页面隐藏(旧实现漏掉 daily/train/armory/tech/codex/challenge) */
    hidePages: function() {
        ['v60-map-page', 'v60-ach-page', 'v60-settings-page', 'v60-daily-page',
         'v60-train-page', 'v60-armory-page', 'v60-tech-page', 'v60-codex-page',
         'v60-challenge-page', 'v60-rank-page'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.classList.add('hidden');
        });
    },

    renderHomeGrowth: function(game) {
        var el = document.getElementById('v60-home-growth');
        if (!el || !game.profile) return;
        var d = game.profile.data;
        var pl = typeof Progression !== 'undefined' ? Progression.levelFromXp(d.xp || 0) : { level: 1, nextNeed: 300 };
        var xpPrev = 0;
        for (var l = 1; l < pl.level; l++) xpPrev += (typeof XP_RULES !== 'undefined' ? XP_RULES.levelCurve(l) : 300);
        var pct = Math.min(100, Math.round(((d.xp || 0) - xpPrev) / Math.max(1, pl.nextNeed - xpPrev) * 100));
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        el.innerHTML =
            '<div class="v60-growth-row"><span class="v60-growth-lv">Lv.' + pl.level + '</span>' +
            '<div class="v60-xp-bar"><div class="v60-xp-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="v60-growth-xp">' + (d.xp || 0) + ' XP</span></div>' +
            '<div class="v60-growth-stats">⭐ ' + totalStars + ' · ⚔️ ' + (d.totalKills || 0) + ' · 🏆 ' + (d.totalWins || 0) + '</div>';
    },

    renderMap: function(game) {
        var nodesEl = document.getElementById('v60-map-nodes');
        var statsEl = document.getElementById('v60-map-stats');
        if (!nodesEl || !game.profile) return;
        var d = game.profile.data;
        var unlocked = d.unlockedLevel || 1;
        var totalStars = 0;
        for (var k in d.stars) totalStars += d.stars[k] || 0;
        var starTotal = LEVELS.length * 3;
        if (statsEl) statsEl.innerHTML = '⭐ ' + totalStars + '/' + starTotal + ' · 🏆 通关 ' + (d.totalWins || 0) + ' · ⚔️ ' + (d.totalKills || 0);
        nodesEl.innerHTML = '';
        var self = this;
        var metaTotal = this.LEVEL_META.length;
        this.LEVEL_META.forEach(function(meta, i) {
            if (i >= LEVELS.length) return;
            var rawName = (LEVELS[i].name || ('关卡 ' + (i + 1))).replace(/^第\s*\d+\s*关\s*/, '');
            var state = i + 1 < unlocked ? 'cleared' : (i === unlocked - 1 ? 'current' : 'locked');
            if (i === unlocked - 1 && d.stars['L' + (i + 1)]) state = 'cleared';
            var stars = d.stars['L' + (i + 1)] || 0;
            var node = document.createElement('div');
            node.className = 'v60-map-node ' + state;
            node.innerHTML =
                '<div class="v60-node-icon">' + (state === 'locked' ? '🔒' : meta.icon) + '</div>' +
                '<div class="v60-node-info"><div class="v60-node-name">' + (i + 1) + '. ' + rawName + '</div>' +
                '<div class="v60-node-meta">威胁: ' + meta.threat + ' · 奖励 ' + (LEVELS[i].rewardCoins || 0) + '🪙</div>' +
                '<div class="v60-node-stars">' + '★'.repeat(stars) + '☆'.repeat(3 - stars) + '</div></div>' +
                (state === 'current' ? '<div class="v60-node-current">▶</div>' : '') +
                (state === 'cleared' ? '<div class="v60-node-medal">🎖️</div>' : '');
            if (i + 1 <= unlocked) {
                node.onclick = function() {
                    self.game._sfx('click');
                    self.game.levelIndex = i;
                    self.game.start();
                    self.hidePages();
                };
                node.classList.add('clickable');
            }
            nodesEl.appendChild(node);
            if (i < metaTotal - 1 && i < LEVELS.length - 1) {
                var line = document.createElement('div');
                line.className = 'v60-map-line' + (i + 2 <= unlocked ? ' done' : '');
                nodesEl.appendChild(line);
            }
        }, game);
    },

    renderAchievements: function(game) {
        var el = document.getElementById('v60-ach-list');
        if (!el || !game.profile || typeof ACHIEVEMENT_DEFS === 'undefined') return;
        var d = game.profile.data;
        el.innerHTML = '';
        var claimed = d.claimedRewards || {};
        var gotCount = 0;
        ACHIEVEMENT_DEFS.forEach(function(def) {
            var got = !!claimed['ach:' + def.id];
            if (got) gotCount++;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (got ? ' got' : '');
            row.innerHTML =
                '<div class="v60-ach-icon">' + def.icon + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + def.name + '</div>' +
                '<div class="v60-ach-desc">' + def.desc + '</div></div>' +
                '<div class="v60-ach-reward">' + (got ? '✓' : '+' + def.reward + '🪙') + '</div>';
            el.appendChild(row);
        });
        var header = el.parentNode.querySelector('.v60-ach-progress');
        if (!header) {
            header = document.createElement('div');
            header.className = 'v60-ach-progress';
            el.parentNode.insertBefore(header, el);
        }
        header.textContent = '进度: ' + gotCount + ' / ' + ACHIEVEMENT_DEFS.length;
    },

    renderDaily: function(game) {
        var self = this;
        // —— 签到条(V8.0: 7天循环) ——
        var strip = document.getElementById('v60-signin-strip');
        var signBtn = document.getElementById('v60-signin-btn');
        if (strip && game.profile && typeof SignInSystem !== 'undefined') {
            var si = SignInSystem.ensure(game.profile);
            var curDay = si.streak % 7; // 今日待签的第几天(0起)
            var html = '';
            for (var d = 0; d < 7; d++) {
                var done = d < curDay;
                var reward = SIGNIN_REWARDS[d];
                html += '<div class="v60-signin-day' + (done ? ' done' : d === curDay ? ' today' : '') + '">' +
                    '<span class="v60-signin-day-num">D' + (d + 1) + '</span>' +
                    '<span class="v60-signin-day-r">' + (done ? '✓' : reward + '🪙') + '</span></div>';
            }
            strip.innerHTML = html;
            if (signBtn) signBtn.textContent = SignInSystem.canSign(game.profile)
                ? '签到 (+' + SIGNIN_REWARDS[curDay] + '🪙)' : '今日已签';
        }
        // —— 每日任务 ——
        var el = document.getElementById('v60-daily-list');
        if (!el || !game.profile || typeof ChallengeDaily === 'undefined') return;
        var daily = ChallengeDaily.ensureDaily(game.profile);
        el.innerHTML = '';
        daily.tasks.forEach(function(t, i) {
            var pct = Math.min(100, Math.round(t.progress / t.target * 100));
            var can = t.progress >= t.target && !t.claimed;
            var row = document.createElement('div');
            row.className = 'v60-ach-row' + (t.claimed ? ' got' : can ? ' ready' : '');
            row.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + t.name + '</div>' +
                '<div class="v60-ach-bar"><div class="v60-ach-fill" style="width:' + pct + '%"></div></div></div>' +
                '<div class="v60-ach-reward">' + (t.claimed ? '✓' : '+' + t.reward + '🪙') + '</div>';
            if (can) row.onclick = function() { ChallengeDaily.claim(game.profile, i); game._sfx('gate'); self.renderDaily(game); game._refreshCoinDisplays(); };
            el.appendChild(row);
        });
    },

    // ===== V8.0 / V15-ART-008: 军团训练中心(大型角色展示台 + 左右6独立装备槽 + 图标化属性 + 紧凑背包) =====
    renderTraining: function(game) {
        var self = this;
        var header = document.getElementById('v60-train-header');
        var statsEl = document.getElementById('v60-train-stats');
        var equipEl = document.getElementById('v60-train-equip');
        var upBtn = document.getElementById('v60-train-upgrade');
        var costEl = document.getElementById('v60-train-cost');
        if (!header || !game.profile || typeof SoldierGrowth === 'undefined') return;
        var lv = SoldierGrowth.level(game.profile);
        var tier = SoldierGrowth.tierName(game.profile);
        var stats = SoldierGrowth.stats(game.profile);
        var cost = SoldierGrowth.upgradeCost(game.profile);

        // 顶部统一商业顶栏 (返回 | 标题 | 金币)
        header.innerHTML =
            '<div class="v15-armory-topbar">' +
            '<button type="button" class="v15-page-back" onclick="V60UI.hidePages()">‹ 返回</button>' +
            '<div class="v15-page-title-wrap"><span class="v15-page-kicker">BARRACKS</span><strong>士兵训练中心</strong></div>' +
            '<div class="v15-page-coin"><img src="art/ui/coin.png" alt=""><span>' + (game.profile.coins || 0) + '</span></div>' +
            '</div>';

        // 左右 6 个独立战术装备槽 + 中央大型士兵展示台
        var svgHelmet = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 14a8 8 0 0 1 16 0v2H4v-2Z"/><path d="M3 16h18v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2Z"/></svg>';
        var svgVest   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M7 4h10l2 4-2 2v10H7V10L5 8l2-4Z"/><path d="M12 4v16"/></svg>';
        var svgGun    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11h14l4-2v4l-4-1H9l-2 5H4l2-5H3v-1Z"/></svg>';
        var svgPack   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="6" y="7" width="12" height="13" rx="3"/><path d="M9 7V5a3 3 0 0 1 6 0v2M6 13h12"/></svg>';
        var svgTac    = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="13" r="6"/><path d="M10 4h4v3h-4zM12 10v6M9 13h6"/></svg>';
        var svgStar   = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l2.6 5.3 5.9.9-4.3 4.1 1 5.9L12 16.4 6.8 19.2l1-5.9-4.3-4.1 5.9-.9L12 3Z"/></svg>';
        var slotIcons = {
            helmet: svgHelmet, head: svgHelmet,
            armor: svgVest, vest: svgVest, body: svgVest,
            weapon: svgGun, gun: svgGun,
            pack: svgPack, backpack: svgPack, bag: svgPack,
            tactical: svgTac, accessory: svgTac, gadget: svgTac,
            emblem: svgStar, badge: svgStar, medal: svgStar
        };
        var eq = game.profile.data.equipment || {};
        var renderSlot = function(slot) {
            var piece = eq[slot];
            var qColor = piece ? EQUIP_QUALITY_COLORS[piece.quality] : '';
            var label = EQUIP_SLOT_NAMES[slot] || slot;
            var sub = piece ? ('+' + (piece.level - 1)) : label;
            var title = piece ? (piece.name || (EQUIPMENT_DEFS[piece.id] ? EQUIPMENT_DEFS[piece.id].name : piece.id)) : (label + '（未装备）');
            return '<div class="v15-gear-slot' + (piece ? ' is-equipped' : ' is-empty') + '" title="' + title + '"' +
                (piece && qColor ? ' style="border-color:' + qColor + ';box-shadow:0 0 10px ' + qColor + '44"' : '') + '>' +
                '<div class="v15-gear-ico">' + (slotIcons[slot] || slotIcons.emblem) + '</div>' +
                '<div class="v15-gear-lbl">' + sub + '</div></div>';
        };
        var leftSlots = EQUIP_SLOTS.slice(0, 3);
        var rightSlots = EQUIP_SLOTS.slice(3, 6);
        if (equipEl) {
            equipEl.innerHTML =
                '<div class="v15-train-stage">' +
                '<div class="v15-gear-col">' + leftSlots.map(renderSlot).join('') + '</div>' +
                '<div class="v15-train-hero">' +
                '<div class="v15-train-hero-wrap">' +
                '<div class="v15-pedestal-shadow"></div>' +
                '<img class="v15-train-hero-img" src="art/characters/soldier_portrait.png" alt="绿色战术步兵">' +
                '</div>' +
                '<div class="v15-train-hero-badge"><b>Lv.' + lv + '</b><span style="color:' + (tier.color || '#ffe382') + '">' + tier.name + '</span></div>' +
                '</div>' +
                '<div class="v15-gear-col">' + rightSlots.map(renderSlot).join('') + '</div>' +
                '</div>';
        }
        if (statsEl) {
            var nextLv = Math.min(50, lv + 1);
            var nDmg = (stats.dmgBonus || 0) + (lv < 50 ? 1 : 0);
            var nHp = (stats.hpBonus || 0) + (lv < 50 ? 2 : 0);
            var nCrit = ((stats.critBonus || 0) + (lv < 50 ? 0.005 : 0)) * 100;
            var nDr = ((stats.drBonus || 0) + (lv < 50 ? 0.006 : 0)) * 100;
            var nRec = (stats.recruitBonus || 0) + (lv < 50 && nextLv % 5 === 0 ? 1 : 0);
            var delta = function(cur, nxt, suf) {
                return (lv < 50 && nxt !== cur) ? '<b>' + cur + suf + ' <i>→ ' + nxt + suf + '</i></b>' : '<b>' + cur + suf + '</b>';
            };
            statsEl.innerHTML =
                '<div class="v15-stat-chip"><span>伤害加成</span>' + delta('+' + (stats.dmgBonus || 0), '+' + nDmg, '') + '</div>' +
                '<div class="v15-stat-chip"><span>生命加成</span>' + delta('+' + (stats.hpBonus || 0), '+' + nHp, '') + '</div>' +
                '<div class="v15-stat-chip"><span>暴击率</span>' + delta('+' + ((stats.critBonus || 0) * 100).toFixed(1), '+' + nCrit.toFixed(1), '%') + '</div>' +
                '<div class="v15-stat-chip"><span>伤害减免</span>' + delta(((stats.drBonus || 0) * 100).toFixed(1), nDr.toFixed(1), '%') + '</div>' +
                '<div class="v15-stat-chip"><span>招募效率</span>' + delta('+' + (stats.recruitBonus || 0), '+' + nRec, '') + '</div>' +
                '<div class="v15-stat-chip is-tier"><span>军团军衔</span><b>' + tier.name + '</b></div>';
        }
        // 紧凑背包区 (空状态单行不占半屏, 有掉落时正常展开操作)
        var bagEl = document.getElementById('v60-train-bag');
        if (bagEl) {
            var bag = game.profile.data.bag || [];
            bagEl.innerHTML = '';
            if (!bag.length) {
                bagEl.innerHTML = '<div class="v15-bag-compact-empty"><span>装备背包</span><small>暂无掉落装备 · 通关战斗获取</small></div>';
            } else if (typeof EquipmentLoot !== 'undefined' && EquipmentLoot.equipFromBag) {
                var autoBtn = document.createElement('button');
                autoBtn.id = 'v60-auto-equip-btn';
                autoBtn.className = 'btn-secondary v60-auto-equip-btn';
                autoBtn.textContent = '一键穿戴最强装备';
                autoBtn.onclick = function() {
                    var eqNow = game.profile.data.equipment || {};
                    var curBag = (game.profile.data.bag || []).slice();
                    var bestBySlot = {};
                    for (var k = 0; k < curBag.length; k++) {
                        var cand = curBag[k];
                        if (!cand || !cand.slot) continue;
                        var score = (cand.quality || 0) * 100 + (cand.level || 1);
                        if (!bestBySlot[cand.slot] || score > bestBySlot[cand.slot].score) {
                            bestBySlot[cand.slot] = { uid: cand.uid, score: score };
                        }
                    }
                    var changed = 0;
                    for (var sKey in bestBySlot) {
                        var cur = eqNow[sKey];
                        var curScore = cur ? ((cur.quality || 0) * 100 + (cur.level || 1)) : -1;
                        if (bestBySlot[sKey].score > curScore) {
                            var res = EquipmentLoot.equipFromBag(game.profile, bestBySlot[sKey].uid);
                            if (res && res.ok) changed++;
                        }
                    }
                    if (changed > 0) {
                        game._sfx('gate');
                        game._refreshCoinDisplays();
                        self.renderTraining(game);
                    }
                };
                bagEl.appendChild(autoBtn);
            }
            for (var bi = 0; bi < bag.length; bi++) {
                (function(item) {
                    var it = document.createElement('div');
                    it.className = 'v60-bag-item';
                    it.innerHTML =
                        '<div class="v60-bag-main"><div class="v60-bag-name v60-quality-' + item.quality + '">' +
                        (item.isNew ? '<span style="color:#FF4444">新!</span> ' : '') + item.name +
                        ' <i style="font-style:normal;font-size:10px">Q' + EQUIP_QUALITY[item.quality] + ' +' + (item.level - 1) + '</i></div>' +
                        '<div class="v60-bag-affix">' + (item.affixLines || []).join(' · ') + '</div></div>';
                    var actions = document.createElement('div');
                    actions.className = 'v60-bag-actions';
                    var wearBtn = document.createElement('button');
                    wearBtn.className = 'v60-bag-btn';
                    wearBtn.textContent = '穿戴';
                    wearBtn.onclick = function() {
                        var r = EquipmentLoot ? EquipmentLoot.equipFromBag(game.profile, item.uid) : { ok: false };
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(wearBtn);
                    var upBtn2 = document.createElement('button');
                    upBtn2.className = 'v60-bag-btn up';
                    var upCost = item.level >= 10 ? null : EQUIP_UPGRADE_COST(item.quality, item.level);
                    upBtn2.textContent = upCost === null ? 'MAX' : '强化 ' + upCost;
                    upBtn2.disabled = upCost === null || game.profile.coins < upCost;
                    upBtn2.onclick = function() {
                        var r = EquipmentLoot.upgradeBagEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(upBtn2);
                    var sellBtn = document.createElement('button');
                    sellBtn.className = 'v60-bag-btn sell';
                    sellBtn.textContent = '分解';
                    sellBtn.onclick = function() {
                        var r = EquipmentLoot.sellEquip(game.profile, item.uid);
                        if (r.ok) { game._sfx('coin'); game._refreshCoinDisplays(); self.renderTraining(game); }
                    };
                    actions.appendChild(sellBtn);
                    it.appendChild(actions);
                    bagEl.appendChild(it);
                })(bag[bi]);
            }
        }
        var maxed = lv >= 50;
        var canUp = !maxed && game.profile.coins >= cost;
        if (upBtn) {
            upBtn.classList.toggle('affordable', canUp);
            upBtn.innerHTML = maxed
                ? '<span>已达最高等级 MAX</span>'
                : '<span class="v15-train-up-main">强化升级 Lv.' + lv + ' → Lv.' + (lv + 1) + '</span>' +
                  '<span class="v15-train-up-cost"><img class="v15-btn-coin" src="art/ui/coin.png" alt="">' + cost + (canUp ? '' : ' · 金币不足') + '</span>';
            upBtn.disabled = maxed || !canUp;
            upBtn.onclick = function() {
                var r = SoldierGrowth.upgrade(game.profile);
                if (r.ok) {
                    game._sfx('gate');
                    game._refreshCoinDisplays();
                    self.renderTraining(game);
                    if (r.milestone && costEl) costEl.innerHTML = '<b style="color:#FFC247">解锁: ' + r.milestone.unlock + '</b>';
                } else if (costEl) {
                    costEl.textContent = r.reason === 'insufficient' ? '金币不足 (需要 ' + r.cost + ')' : '已满级';
                }
            };
        }
    },

    // ===== V8.0: 军械库(WeaponSystem 8种武器) =====
    renderArmory: function(game) {
        var el = document.getElementById('v60-armory-list');
        var hero = document.getElementById('v118-armory-hero');
        if (!el || !hero || !game.profile || typeof WeaponSystem === 'undefined') return;
        el.innerHTML = '';
        var current = WeaponSystem.current(game.profile);
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        var upCost = WeaponSystem.upgradeCost(game.profile);
        var canEvo = WeaponSystem.canEvolve(game.profile);
        var self = this;
        var weaponOrder = ['rifle', 'shotgun', 'sniper', 'mg', 'flamethrower', 'rocket', 'freeze', 'tesla'];
        var statTextOf = function(st) {
            return '伤害 ×' + (st.dmgMul || 1) +
                (st.rateMul ? ' · 射速 ×' + st.rateMul : '') +
                (st.pellets ? ' · 弹丸 ×' + st.pellets : '') +
                (st.pierceBonus ? ' · 穿透 +' + st.pierceBonus : '') +
                (st.radius ? ' · 半径 ' + st.radius : '') +
                (st.chain ? ' · 链式 ×' + st.chain : '') +
                (st.slowMul ? ' · 减速 ' + Math.round((1 - st.slowMul) * 100) + '%' : '') +
                (st.critBonus ? ' · 暴击 +' + Math.round(st.critBonus * 100) + '%' : '');
        };
        var currentIndex = weaponOrder.indexOf(current);
        var currentDef = WEAPON_DEFS[current];
        if (currentDef && currentIndex >= 0) {
            var nextStats = (wLv < 5 && currentDef.effect) ? currentDef.effect(wLv + 1) : null;
            var nextLine = nextStats
                ? '<div class="v15-armory-next">下一级 Lv.' + (wLv + 1) + '：' + statTextOf(nextStats) + '</div>'
                : '<div class="v15-armory-next is-max">已达最高强化等级</div>';
            var evoTag = '';
            if (wStats.evolvedName) evoTag = '<div class="v15-armory-evo-tag">已进化：' + wStats.evolvedName + '</div>';
            else if (canEvo.ok) evoTag = '<div class="v15-armory-evo-tag">可进化：' + EVOLUTION_DEFS[canEvo.evoId].name + '</div>';
            else if (canEvo.reason === 'tech_required') evoTag = '<div class="v15-armory-evo-tag is-lock">进化需科技：' + canEvo.tech + ' ×' + canEvo.need + '</div>';
            hero.innerHTML =
                '<div class="v15-armory-topbar">' +
                '<button type="button" class="v15-page-back" onclick="V60UI.hidePages()">‹ 返回</button>' +
                '<div class="v15-page-title-wrap"><span class="v15-page-kicker">ARSENAL</span><strong>武器军械库</strong></div>' +
                '<div class="v15-page-coin"><img src="art/ui/coin.png" alt=""><span>' + (game.profile.coins || 0) + '</span></div>' +
                '</div>' +
                '<div class="v15-armory-stage">' +
                '<div class="v15-pedestal-shadow is-weapon"></div>' +
                '<div class="v14-weapon-3d" id="v14-weapon-3d"></div>' +
                '<div class="v118-weapon-art" role="img" aria-label="' + currentDef.name + '" data-weapon="' + current + '"' +
                ' data-atlas-cols="4" data-atlas-rows="2" data-atlas-col="' + (currentIndex % 4) + '" data-atlas-row="' + Math.floor(currentIndex / 4) + '"' +
                ' style="--weapon-col:' + (currentIndex % 4) + ';--weapon-row:' + Math.floor(currentIndex / 4) + '"></div>' +
                '</div>' +
                '<div class="v118-armory-hero-info">' +
                '<div class="v15-armory-name-row"><span class="v118-armory-hero-name">' + currentDef.name + '</span>' +
                '<span class="v118-armory-hero-level">Lv.' + wLv + ' / 5</span></div>' +
                '<div class="v118-armory-hero-stats">' + statTextOf(wStats) + '</div>' +
                nextLine + evoTag +
                '<div class="v15-armory-hero-actions" id="v15-armory-hero-actions"></div></div>';

            // 主操作区固定在当前武器展示台下方(不再在下方重复出现大卡片!)
            var heroActs = hero.querySelector('#v15-armory-hero-actions');
            if (heroActs) {
                var canBuyUp = upCost !== null && game.profile.coins >= upCost;
                var hUpBtn = document.createElement('button');
                hUpBtn.className = 'v60-armory-btn upgrade' + (canBuyUp ? ' affordable' : '');
                hUpBtn.innerHTML = upCost !== null
                    ? '<span>强化升级</span><span class="v15-act-price"><img class="v15-btn-coin" src="art/ui/coin.png" alt="">' + upCost + (canBuyUp ? '' : ' 金币不足') + '</span>'
                    : '<span>MAX 满级</span>';
                hUpBtn.disabled = upCost === null || !canBuyUp;
                hUpBtn.onclick = function() {
                    var r = WeaponSystem.upgrade(game.profile);
                    if (r.ok) { game._sfx('gate'); game._refreshCoinDisplays(); self.renderArmory(game); }
                };
                heroActs.appendChild(hUpBtn);
                if (canEvo.ok) {
                    var hEvoBtn = document.createElement('button');
                    hEvoBtn.className = 'v60-armory-btn evolve';
                    hEvoBtn.textContent = '进化 · ' + EVOLUTION_DEFS[canEvo.evoId].name;
                    hEvoBtn.onclick = function() {
                        var r = WeaponSystem.evolve(game.profile);
                        if (r.ok) { game._sfx('win'); self.renderArmory(game); }
                    };
                    heroActs.appendChild(hEvoBtn);
                }
            }
            // V14: 3D 武器展示台(H5; 微信/minidom 自动回退 PNG)
            var v14host = hero.querySelector('#v14-weapon-3d');
            if (v14host && typeof WeaponShowcase !== 'undefined' && WeaponShowcase.mount(v14host, current)) {
                hero.classList.add('v14-3d-ready');
                v14host.classList.add('v14-active');
            }
        } else {
            hero.innerHTML = '';
        }
        // 底部紧凑 4x2 武器缩略图选择栏(一屏完整展示全部 8 把武器, 零截断、零重复卡片!)
        for (var wi = 0; wi < weaponOrder.length; wi++) {
            var id = weaponOrder[wi];
            var def = WEAPON_DEFS[id];
            if (!def) continue;
            var isCurrent = id === current;
            var canUnlock = WeaponSystem.canUnlock(game.profile, id);
            var unlockedNow = !def.unlockCondition || isCurrent || canUnlock ||
                (def.unlockCondition.type === 'clear' && (game.profile.data.unlockedLevel || 1) > def.unlockCondition.level);
            var row = document.createElement('button');
            row.type = 'button';
            row.className = 'v60-armory-row v15-weapon-tile' + (isCurrent ? ' equipped' : unlockedNow ? ' owned' : ' locked');
            row.setAttribute('data-weapon', id);
            var badgeText = isCurrent ? '装备中' : (unlockedNow ? ('Lv.' + wLv) : ('第' + def.unlockCondition.level + '关'));
            row.innerHTML =
                '<span class="v15-wt-badge">' + badgeText + '</span>' +
                '<div class="v118-weapon-art" role="img" aria-label="' + def.name + '" data-weapon="' + id + '"' +
                ' data-atlas-cols="4" data-atlas-rows="2" data-atlas-col="' + (wi % 4) + '" data-atlas-row="' + Math.floor(wi / 4) + '"' +
                ' style="--weapon-col:' + (wi % 4) + ';--weapon-row:' + Math.floor(wi / 4) + '"></div>' +
                '<span class="v15-wt-name">' + def.name + '</span>';
            if (unlockedNow && !isCurrent) {
                row.onclick = function(wid) {
                    return function() { WeaponSystem.switchTo(game.profile, wid); game._sfx('gate'); self.renderArmory(game); };
                }(id);
            }
            el.appendChild(row);
        }
    },

    // ===== V8.0: 科研站(科技树) =====
    renderTech: function(game) {
        var ptsEl = document.getElementById('v60-tech-points');
        var listEl = document.getElementById('v60-tech-list');
        if (!listEl || !game.profile || typeof TechTree === 'undefined') return;
        var tp = game.profile.data.techPoints || 0;
        if (ptsEl) ptsEl.innerHTML = '<b>🔬 科技点: ' + tp + '</b><span class="v60-tech-tip">通关与成就获取科技点</span>';
        listEl.innerHTML = '';
        var self = this;
        var branches = { fire: '火力科技', army: '军团科技', logi: '后勤科技' };
        var BRANCH_ICONS = { fire: '⚔️', army: '🛡️', logi: '🔧' }; // V13: 分支徽记
        for (var branch in branches) {
            var title = document.createElement('div');
            title.className = 'v60-tech-branch v13-tech-branch';
            title.innerHTML = '<span class="v13-tech-rail" aria-hidden="true"></span><span class="v13-tech-branch-badge">' + BRANCH_ICONS[branch] + '</span>' + branches[branch];
            listEl.appendChild(title);
            for (var id in TECH_DEFS) {
                var def = TECH_DEFS[id];
                if (def.branch !== branch) continue;
                var lv = TechTree.levelOf(game.profile, id);
                var check = TechTree.canUpgrade(game.profile, id);
                var row = document.createElement('div');
                row.className = 'v60-tech-row v13-tech-node' + (lv >= def.max ? ' maxed' : check.ok && tp >= check.cost ? ' ready' : check.ok ? '' : ' locked');
                var pips = '<span class="v13-tech-pips" aria-hidden="true">';
                for (var pi = 0; pi < def.max; pi++) pips += '<i class="' + (pi < lv ? 'on' : '') + '"></i>';
                pips += '</span>';
                row.innerHTML =
                    '<span class="v13-tech-connector" aria-hidden="true"></span>' +
                    '<div class="v60-ach-info"><div class="v60-ach-name">' + def.icon + ' ' + def.name + ' <i>Lv.' + lv + '/' + def.max + '</i>' + pips + '</div>' +
                    '<div class="v60-ach-desc">' + def.desc + (def.req && lv < def.max ? ' · 前置: ' + TECH_DEFS[def.req].name : '') + '</div></div>' +
                    '<div class="v60-ach-reward">' + (lv >= def.max ? 'MAX' : def.cost + '🔬') + '</div>';
                if (check.ok) {
                    row.onclick = function(tid) { return function() {
                        var r = TechTree.upgrade(game.profile, tid);
                        if (r.ok) { game._sfx('gate'); self.renderTech(game); }
                    }; }(id);
                    row.classList.add('clickable');
                }
                listEl.appendChild(row);
            }
        }
    },

    // ===== V8.0: 战场图鉴(Boss+武器收藏) =====
    /** V13: 武器剪影图标(程序化 SVG, 按 type 区分轮廓, tier 决定色阶, evolved 金色发光)
     *  剪影设计遵循 ART_DIRECTION「剪影优先」规则: 0.3s 内可分辨武器类型。
     *  军械库主视图使用 v118 武器图集(hero 大图); 本剪影服务于图鉴等小尺寸列表场景。 */
    weaponIconSvg: function(type, tier, evolved) {
        var TIER_COLORS = ['#8FA8C2', '#8FA8C2', '#4A8FE0', '#4A8FE0', '#9A6EE0', '#FFC247'];
        var base = evolved ? '#FFC247' : (TIER_COLORS[tier] || '#8FA8C2');
        var dark = evolved ? '#B8860B' : '#2E4A6E';
        var lite = evolved ? '#FFE9A8' : '#B8D4F0';
        var glow = evolved ? '<circle cx="10" cy="9" r="7.2" fill="#FFC247" opacity=".25"/><circle cx="10" cy="9" r="4.6" fill="#FFE9A8" opacity=".4"/>' : '';
        var P = {
            single: { body: 'M10 18h30l2-3h14v6h-8l-2 3H18l-2 4h-5l1-4h-3z', extra: '<rect x="24" y="24" width="6" height="10" rx="1.5" transform="rotate(-14 27 29)" fill="' + dark + '"/><rect x="12" y="14" width="4" height="4" fill="' + dark + '"/>' },
            spread: { body: 'M8 17h14l3-4h8v5h-6l-2 3H12z M33 15h18v8h-6l-2 4h-8z', extra: '<rect x="20" y="23" width="10" height="4" rx="2" fill="' + dark + '"/><rect x="36" y="14" width="3" height="10" fill="' + dark + '"/>' },
            pierce: { body: 'M6 19h10l2-2h40v5h-14l-3 4h-9l-2-3H12z', extra: '<rect x="30" y="11" width="14" height="5" rx="2.4" fill="' + dark + '"/><circle cx="37" cy="13.5" r="2" fill="' + lite + '"/><rect x="16" y="22" width="5" height="8" rx="1.5" transform="rotate(-16 18 26)" fill="' + dark + '"/>' },
            rapid: { body: 'M8 16h12l2-2h26v7h-9l-2 4h-8l-2-3H12z', extra: '<circle cx="22" cy="28" r="6" fill="' + dark + '"/><circle cx="22" cy="28" r="3" fill="' + lite + '"/><rect x="44" y="15" width="8" height="3" fill="' + dark + '"/>' },
            cone: { body: 'M8 17h10l3-3h10v10h-8l-2 3h-9z', extra: '<circle cx="34" cy="19" r="7.5" fill="' + dark + '"/><circle cx="34" cy="19" r="4" fill="' + lite + '"/><path d="M43 19l8-4-2 4 2 4z" fill="#FF8844"/>' },
            explosive: { body: 'M6 16h14l3-3h20v10h-8l-3 4h-10l-2-3H10z', extra: '<path d="M43 14l10 5-10 5z" fill="#FF8844"/><rect x="18" y="25" width="8" height="4" rx="2" fill="' + dark + '"/>' },
            freeze: { body: 'M8 16h12l2-2h18v9h-8l-2 3h-8l-2-3H12z', extra: '<rect x="40" y="13" width="9" height="12" rx="3" fill="#BFEFFF"/><path d="M50 19h6M53 16l-3 3 3 3" stroke="#7FD4FF" stroke-width="2" fill="none"/><circle cx="35" cy="25" r="3" fill="#7FD4FF"/>' },
            chain: { body: 'M8 18h12l2-2h16v8h-9l-2 3h-9l-2-3H12z', extra: '<rect x="38" y="13" width="5" height="12" rx="1.5" fill="' + dark + '"/><rect x="44" y="14" width="4" height="10" rx="1.5" fill="' + lite + '"/><path d="M52 15l4 2-1 3 3 2-4 2" stroke="#B8E0FF" stroke-width="2" fill="none"/>' }
        };
        var d = P[type] || P.single;
        return '<svg class="v13-wicon" viewBox="0 0 64 38" width="46" height="27" aria-hidden="true">' + glow +
            '<path d="' + d.body + '" fill="' + base + '" stroke="' + dark + '" stroke-width="1.2" stroke-linejoin="round"/>' +
            d.extra + '</svg>';
    },

    renderCodex: function(game) {
        var bossesEl = document.getElementById('v60-codex-bosses');
        var weaponsEl = document.getElementById('v60-codex-weapons');
        if (!bossesEl || !weaponsEl || !game.profile) return;
        var d = game.profile.data;
        // —— Boss图鉴 ——
        bossesEl.innerHTML = '';
        var bossSeen = d.bossSeen || {};
        for (var i = 0; i < LEVELS.length && i < CONFIG.BOSS_NAMES.length; i++) {
            var name = CONFIG.BOSS_NAMES[i];
            var style = LEVELS[i].bossStyle || 'bruiser';
            var seen = !!bossSeen[style] || (d.stats && d.stats.bossKills > 0 && i + 1 <= (d.unlockedLevel || 1));
            var killed = d.stars && d.stars['L' + (i + 1)] > 0;
            var card = document.createElement('div');
            card.className = 'v60-codex-card' + (seen ? '' : ' unknown');
            card.innerHTML =
                '<div class="v60-codex-icon">' + (seen ? '👹' : '❓') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (seen ? name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (seen ? '第' + (i + 1) + '关 · 体格: ' + style : '通关后解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (killed ? '🎖️已讨伐' : seen ? '遭遇过' : '') + '</div>';
            bossesEl.appendChild(card);
        }
        // —— 武器收藏 ——
        // V11 QA修复[P3]: renderCodex 补 WeaponSystem 守卫(与 renderArmory 等处一致)
        if (typeof WeaponSystem === 'undefined') return;
        weaponsEl.innerHTML = '';
        var wLv = WeaponSystem.level(game.profile);
        var wStats = WeaponSystem.stats(game.profile);
        for (var wid in WEAPON_DEFS) {
            var def = WEAPON_DEFS[wid];
            var cond = def.unlockCondition;
            var got = !cond || (game.profile.data.unlockedLevel || 1) > cond.level;
            var wcard = document.createElement('div');
            wcard.className = 'v60-codex-card' + (got ? '' : ' unknown');
            wcard.innerHTML =
                '<div class="v60-codex-icon">' + (got ? this.weaponIconSvg(def.type, 3, false) : '🔒') + '</div>' +
                '<div class="v60-ach-info"><div class="v60-ach-name">' + (got ? def.name : '???') + '</div>' +
                '<div class="v60-ach-desc">' + (got ? def.desc : '通关第 ' + cond.level + ' 关解锁') + '</div></div>' +
                '<div class="v60-ach-reward">' + (wStats.weaponId === wid && wStats.evolvedName ? '⚡' : got ? '已装备档案' : '') + '</div>';
            weaponsEl.appendChild(wcard);
        }
    },

    // ===== V8.0: 挑战模式入口 =====
    renderChallenges: function(game) {
        var el = document.getElementById('v60-challenge-list');
        if (!el || !game.profile || typeof CHALLENGE_MODES === 'undefined') return;
        var d = game.profile.data;
        var best = d.challengeBest || {};
        var unlockedLv = d.unlockedLevel || 1;
        el.innerHTML = '';
        var self = this;
        for (var type in CHALLENGE_MODES) {
            var cfg = CHALLENGE_MODES[type];
            // 无尽生存需通关L3; Boss试炼需通关L5
            var need = type === 'survival' ? 4 : 6;
            var open = unlockedLv >= need;
            var card = document.createElement('div');
            card.className = 'v60-challenge-card' + (open ? '' : ' locked');
            card.innerHTML =
                '<div class="v60-ach-info"><div class="v60-ach-name">' + cfg.icon + ' ' + cfg.name + '</div>' +
                '<div class="v60-ach-desc">' + cfg.desc + '</div>' +
                '<div class="v60-ach-desc">最高纪录: ' + (best[type] || 0) + '</div></div>' +
                '<div class="v60-ach-reward">' + (open ? '▶' : '🔒 通关L' + (need - 1)) + '</div>';
            if (open) {
                card.onclick = function(mode) { return function() {
                    game._sfx('gate');
                    self.hidePages();
                    game.startChallengeMode(mode);
                }; }(type);
                card.classList.add('clickable');
            }
            el.appendChild(card);
        }
    },

    // ===== VNext: 战绩排行(真实结算数据, 无假排名) =====
    // V12视觉: 前三甲奖牌徽章 + 职业徽章 + 最新战绩高亮(docs/art/UI_DESIGN_SYSTEM.md)
    renderRank: function(game) {
        var el = document.getElementById('v60-rank-list');
        if (!el || !game.profile || typeof Leaderboard === 'undefined') return;
        var list = [];
        try {
            list = Leaderboard.top(game.profile, LEADERBOARD_CAP);
        } catch (e) {
            // V13: 数据源异常态(本地榜读取失败) — 如实呈现, 不伪造数据
            el.innerHTML = '<div class="v60-rank-empty v13-rank-error">⚠️ 排行数据加载失败<br><span class="v13-rank-error-tip">请返回后重试</span></div>';
            return;
        }
        el.innerHTML = '';
        if (!list.length) {
            el.innerHTML = '<div class="v60-rank-empty v13-rank-empty-rich">' +
                '<div class="v13-rank-empty-medals" aria-hidden="true"><span>🥈</span><span class="gold">🥇</span><span>🥉</span></div>' +
                '暂无战绩 · 完成一局战斗后进入排行</div>';
            return;
        }
        var latestTs = 0;
        for (var mi = 0; mi < list.length; mi++) latestTs = Math.max(latestTs, list[mi].ts || 0);
        var podium = document.createElement('div');
        podium.className = 'v118-rank-podium';
        el.appendChild(podium);
        for (var i = 0; i < list.length; i++) {
            var r = list[i];
            var clsDef = (typeof CLASS_DEFS !== 'undefined' && CLASS_DEFS[r.classId]) ? CLASS_DEFS[r.classId] : null;
            var row = document.createElement('div');
            row.className = 'v60-rank-row' + (i < 3 ? ' top' + (i + 1) : '') + (r.ts === latestTs ? ' v60-rank-row-me' : '');
            row.setAttribute('data-rank', i + 1);
            row.setAttribute('aria-label', '第' + (i + 1) + '名，得分' + r.score);
            var classText = clsDef ? clsDef.icon + clsDef.name : (r.classId || '未记录职业');
            var elapsed = Number(r.time);
            var timeText = isFinite(elapsed) ? ' · ⏱️' + (elapsed % 1 ? elapsed.toFixed(1) : elapsed.toFixed(0)) + '秒' : '';
            var resultText = r.challenge
                ? '⚔️ ' + r.challenge + ' · L' + r.level + (r.win ? '完成' : '失利')
                : (r.win ? '🏆 通关L' + r.level : '💀 L' + r.level + '失利');
            var detailText = '⚔️' + r.kills + ' · 👥' + r.maxCount + ' · 🔥' + (r.combo || 0) + timeText;
            var metadata = i < 3
                ? '<div class="v118-rank-date">' + Leaderboard.fmtDate(r.ts) + '</div>' +
                    '<details class="v118-rank-details"><summary>战绩详情</summary><div class="v60-rank-meta">' + detailText + '</div></details>'
                : '<div class="v60-rank-meta">' + detailText + ' · ' + Leaderboard.fmtDate(r.ts) + '</div>';
            row.innerHTML =
                '<div class="v60-rank-pos">' + (i + 1) + '</div>' +
                '<div class="v60-rank-info"><div class="v60-rank-name">' +
                resultText +
                ' <span class="v118-rank-class"' + (clsDef ? ' style="color:' + clsDef.color + '"' : '') + '>' + classText + '</span></div>' +
                metadata + '</div>' +
                '<div class="v60-rank-score">' + r.score + '</div>';
            (i < 3 ? podium : el).appendChild(row);
        }
    },

    renderSettings: function(game) {
        var soundBtn = document.getElementById('v60-set-sound');
        if (soundBtn && typeof Platform !== 'undefined' && Platform.audio) {
            soundBtn.textContent = Platform.audio.isMuted() ? '🔇 关' : '🔊 开';
        }
        var qualityBtn = document.getElementById('v60-set-quality');
        if (qualityBtn) {
            var names = ['低', '中', '高'];
            qualityBtn.textContent = names[game.world.quality] || '高';
        }
        var shakeBtn = document.getElementById('v60-set-shake');
        if (shakeBtn) shakeBtn.textContent = game.world._shakeDisabled ? '🚫 关' : '💥 开';
        var info = document.getElementById('v60-saveinfo');
        if (info && game.profile) {
            var d = game.profile.data;
            info.innerHTML = '存档 v' + d.profileVersion + ' · 金币 ' + d.coins + ' · 解锁 ' + d.unlockedLevel + '/' + LEVELS.length + ' 关 · 击杀 ' + (d.totalKills || 0);
        }
    }
};


/* ===== [[ js/weapon-showcase.js ]] ===== */
// ===== V14: 军械库 3D 武器展示 =====
// 表现层组件: 小型转台渲染器, 懒加载 assets/models/weapons/<id>/<id>.glb。
// - 仅 H5 端启用(THREE/GLTFLoader 存在时); 微信 minidom 端自动回退 SVG 图集(渲染函数不挂载)。
// - 画布从 DOM 断开时 RAF 自停(renderArmory 重建 innerHTML 即自动回收), 无泄漏。
// - 只读展示, 不触碰武器数值/业务逻辑。
var WeaponShowcase = {
    _cache: {},        // id -> gltf.scene (geometry 复用, 材质独立克隆以便稀有度调色)
    _loading: {},      // id -> Promise
    _active: null,     // { renderer, scene, camera, mesh, raf, canvas, id }

    available: function() {
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader || typeof document === 'undefined') return false;
        // V14.1: 小游戏运行时(真机 wx / 模拟器 minidom)禁止挂载 — 真实 canvas 节点混入
        // minidom 树会污染其样式引擎(bg-image 全部不再加载)。H5 端 SVG 图集保持回退。
        if (typeof wx !== 'undefined') return false;
        if (typeof window !== 'undefined' && window.__minidom) return false;
        if (typeof ArtUI !== 'undefined') return false;
        try {
            var probe = document.createElement('canvas');
            return !!(probe.getContext && probe.getContext('webgl'));
        } catch (e) { return false; }
    },

    _load: function(id) {
        if (this._cache[id]) return Promise.resolve(this._cache[id]);
        if (this._loading[id]) return this._loading[id];
        var loader = new THREE.GLTFLoader();
        var self = this;
        this._loading[id] = new Promise(function(resolve, reject) {
            loader.load('assets/models/weapons/' + id + '/' + id + '.glb?v=145', function(g) {
                g.scene.updateMatrixWorld(true);
                var mesh = null;
                g.scene.traverse(function(o) { if (o.isMesh && !mesh) mesh = o; });
                if (!mesh) { reject(new Error('no mesh in ' + id + '.glb')); return; }
                var box = new THREE.Box3().setFromObject(g.scene);
                var size = box.getSize(new THREE.Vector3());
                var center = box.getCenter(new THREE.Vector3());
                var model = { mesh: mesh, size: size, center: center };
                self._cache[id] = model;
                delete self._loading[id];
                resolve(model);
            }, undefined, function(e) {
                delete self._loading[id];
                reject(e);
            });
        });
        return this._loading[id];
    },

    /** 挂载展示台: container 为空 div; weaponId 为 WEAPON_DEFS 键 */
    mount: function(container, weaponId, opts) {
        if (!container || !this.available()) return false;
        this.stop();
        try { return this._mountInner(container, weaponId); } catch (e) { return false; }
    },

    _mountInner: function(container, weaponId) {
        var self = this;
        var canvas = document.createElement('canvas');
        canvas.className = 'v14-weapon-canvas';
        container.appendChild(canvas);
        var w = container.clientWidth || 150, h = container.clientHeight || 110;
        var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
        renderer.outputEncoding = THREE.sRGBEncoding; // 独立展示台用正确PBR响应(战斗场景因整体美术风格保持Linear)
        renderer.setSize(w, h, false);
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(32, w / h, 0.05, 10);
        // 三点布光: 主光暖白 + 冷色补光 + 金色轮辋光(呼应 Navy/Gold 设计系统)
        var key = new THREE.DirectionalLight(0xFFF2DC, 1.2); key.position.set(1.5, 2.2, 1.6); scene.add(key);
        var fill = new THREE.DirectionalLight(0x9EC3E8, 0.5); fill.position.set(-2.2, 0.2, 1.4); scene.add(fill);
        var up = new THREE.DirectionalLight(0xFFE2B0, 0.35); up.position.set(0, -1.6, 0.8); scene.add(up);
        var rim = new THREE.DirectionalLight(0xFFC247, 0.8); rim.position.set(-0.6, 1.6, -2.4); scene.add(rim);
        scene.add(new THREE.AmbientLight(0x55627E, 0.55));

        // V14: PMREM 渐变环境 — metalness 材质无 envMap 会渲染成死黑, 这一步让枪体金属真正反光
        if (!WeaponShowcase._envTex) {
            var envScene = new THREE.Scene();
            var eg = new THREE.SphereGeometry(6, 20, 14);
            var epos = eg.attributes.position, ecol = new Float32Array(epos.count * 3);
            for (var vi = 0; vi < epos.count; vi++) {
                var ny = epos.getY(vi) / 6;
                var r2, g2, b2;
                if (ny > 0.25) { r2 = 0.60; g2 = 0.68; b2 = 0.82; }            // 顶部暖天光
                else if (ny > -0.15) { r2 = 0.30; g2 = 0.36; b2 = 0.50; }     // 中层海军蓝
                else { r2 = 0.07; g2 = 0.09; b2 = 0.14; }                      // 底部暗
                ecol[vi * 3] = r2; ecol[vi * 3 + 1] = g2; ecol[vi * 3 + 2] = b2;
            }
            eg.setAttribute('color', new THREE.BufferAttribute(ecol, 3));
            envScene.add(new THREE.Mesh(eg, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide })));
            var pmrem = new THREE.PMREMGenerator(renderer);
            WeaponShowcase._envTex = pmrem.fromScene(envScene, 0.05).texture;
            pmrem.dispose();
        }
        scene.environment = WeaponShowcase._envTex;
        var state = { renderer: renderer, scene: scene, camera: camera, canvas: canvas, id: weaponId, mesh: null, t: 0 };
        this._active = state;
        this._load(weaponId).then(function(model) {
            if (self._active !== state || !state.canvas.isConnected) return;
            var clone = model.mesh.clone();
            clone.material = model.mesh.material; // 共享材质(GLB 自带), 不逐实例复制
            clone.material.envMapIntensity = 0.58; // 环境反射降档防曝白
            var group = new THREE.Group();
            // 归一化: 居中 + 按最长边缩放到 ~1.4 单位, 枪口朝向镜头左前(经典展示角)
            var maxDim = Math.max(model.size.x, model.size.y, model.size.z) || 1;
            var s = 1.72 / maxDim;
            clone.position.set(-model.center.x, -model.center.y, -model.center.z);
            group.add(clone);
            group.scale.setScalar(s);
            group.rotation.set(0.0, -0.35, 0);
            state.mesh = group;
            scene.add(group);
            var dist = 1.78;
            camera.position.set(1.5, 1.12, dist);
            camera.lookAt(0, -0.04, 0);
            var loop = function() {
                if (!state.canvas.isConnected || self._active !== state) return; // 断开即停
                state.t += 0.016;
                if (state.mesh) {
                    state.mesh.rotation.y = -0.35 + Math.sin(state.t * 0.8) * 0.35; // 缓慢摆动展示
                    state.mesh.position.y = Math.sin(state.t * 1.3) * 0.035;        // 悬浮呼吸
                }
                renderer.render(scene, camera);
                state.raf = requestAnimationFrame(loop);
            };
            loop();
        }).catch(function() {
            // GLB 加载失败: 保持容器空, SVG 回退由 CSS 兜底(容器隐藏时显示图集)
            if (state.canvas.isConnected) state.canvas.style.display = 'none';
        });
        return true;
    },

    stop: function() {
        var a = this._active;
        if (!a) return;
        if (a.raf) cancelAnimationFrame(a.raf);
        a.renderer.dispose();
        this._active = null;
    }
};
if (typeof window !== 'undefined') window.WeaponShowcase = WeaponShowcase;


/* ===== [[ js/upgrades.js ]] ===== */
// ===== V5.1 永久升级商店 (全部价格/上限/效果集中配置) =====

var UPGRADE_DEFS = {
    recruit: {
        id: 'recruit',
        name: '战地征召',
        icon: '🎖️',
        desc: '开局统一1人 · 每级提升战地护盾与征召效率',
        levels: [100, 180, 300, 450, 650, 900, 1200, 1600, 2100, 2700],
        effect: function(lv) { return '征召效率 Lv.' + lv + (lv >= 2 ? ' (开局护盾+' + Math.min(2, Math.floor(lv / 2)) + ')' : ''); }
    },
    logistics: {
        id: 'logistics',
        name: '后勤补给',
        icon: '📦',
        desc: '每级金币收益 +10%',
        levels: [150, 300, 500, 800, 1200],
        effect: function(lv) { return '金币收益 +' + (lv * 10) + '%'; }
    },
    gun: {
        id: 'gun',
        name: '枪械强化',
        icon: '🔫',
        desc: '每级基础伤害 +1',
        levels: [120, 220, 360, 550, 800, 1100, 1500, 2000],
        effect: function(lv) { return '基础伤害 ' + (1 + lv); }
    },
    rapid: {
        id: 'rapid',
        name: '快速射击',
        icon: '⚡',
        desc: '每级射速 +5%（全局射速上限不变）',
        levels: [120, 240, 400, 650, 950],
        effect: function(lv) { return '射速 +' + (lv * 5) + '%'; }
    },
    pierce: {
        id: 'pierce',
        name: '穿甲弹',
        icon: '🛡️',
        desc: '每级子弹穿透 +1',
        levels: [250, 500, 900],
        effect: function(lv) { return '穿透 +' + lv; }
    },
    // ===== V15-GAMEPLAY-002 / 004: 可升级主动战术技能 (前中期即可解锁体验, 后期持续强化) =====
    skill_airstrike: {
        id: 'skill_airstrike',
        name: '战术空袭',
        icon: '🚀',
        desc: '【主动技】Lv.1解锁 · 前方跑道5连环轰炸清潮',
        levels: [150, 350, 650, 1100, 1700],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('范围伤害 ' + (35 + lv * 20) + ' · 冷却 ' + (22 - lv * 1.5).toFixed(1) + 's'); }
    },
    skill_cryo: {
        id: 'skill_cryo',
        name: '极寒冰冻',
        icon: '❄️',
        desc: '【主动技】Lv.1解锁 · 冻结全屏怪潮并造成冰霜伤害',
        levels: [200, 420, 750, 1200, 1800],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('冻结 ' + (3.5 + lv * 0.6).toFixed(1) + 's · 冷却 ' + (24 - lv * 1.5).toFixed(1) + 's'); }
    },
    skill_overdrive: {
        id: 'skill_overdrive',
        name: '火力超载',
        icon: '⚡',
        desc: '【主动技】Lv.1解锁 · 短时间大幅提升火力/射速并获护盾',
        levels: [250, 500, 850, 1350, 2000],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('伤害×' + (1.6 + lv * 0.15).toFixed(2) + ' · 持续 ' + (6 + lv * 1.2).toFixed(1) + 's'); }
    },
    skill_tornado: {
        id: 'skill_tornado',
        name: '战术龙卷风',
        icon: '🌪️',
        desc: '【主动技】Lv.1解锁 · 释放推进旋风卷起怪潮并持续绞杀',
        levels: [300, 450, 700, 1000, 1500],
        effect: function(lv) { return lv <= 0 ? '未解锁' : ('持续 ' + (4.5 + lv * 0.5).toFixed(1) + 's · 半径 ' + (2.6 + lv * 0.2).toFixed(1) + 'm · 冷却 ' + (42 - lv * 2) + 's'); }
    }
};

var UpgradeShop = {
    /** 升级当前等级(0起) */
    levelOf: function(profile, id) {
        return (profile.data.upgrades && profile.data.upgrades[id]) || 0;
    },
    maxLevel: function(id) { return UPGRADE_DEFS[id].levels.length; },
    priceOf: function(id, lv) {
        var def = UPGRADE_DEFS[id];
        return (lv >= def.levels.length) ? null : def.levels[lv];
    },
    /**
     * 购买(原子): 余额检查→扣款→升级→保存。
     * @returns {ok:boolean, reason?:'insufficient'|'maxed', coins?:number}
     */
    purchase: function(profile, id) {
        var lv = this.levelOf(profile, id);
        var price = this.priceOf(id, lv);
        if (price === null) return { ok: false, reason: 'maxed' };
        if (profile.coins < price) return { ok: false, reason: 'insufficient', need: price };
        if (!profile.spend(price)) return { ok: false, reason: 'insufficient', need: price }; // 原子扣款失败
        profile.data.upgrades[id] = lv + 1;
        profile.save();
        return { ok: true, coins: profile.coins, level: lv + 1 };
    },
    /** 战斗内应用(与门 buff 叠加规则见 squad) */
    startCount: function(profile, levelStart) {
        return levelStart + this.levelOf(profile, 'recruit');
    },
    damageBonus: function(profile) { return this.levelOf(profile, 'gun'); },
    fireRateMul: function(profile) { return 1 + 0.05 * this.levelOf(profile, 'rapid'); },
    pierceBonus: function(profile) { return this.levelOf(profile, 'pierce'); }
}; // V10.1: 移除无调用的 coinMul(后勤金币加成在 settleRunEconomy 直接读 upgrades.logistics)


/* ===== [[ js/movement.js ]] ===== */
// ===== V4.0 移动手感数学 (纯逻辑, 无THREE依赖, 可单测) =====
// 设计: 连续目标位置 + 帧率无关阻尼跟随, 替代旧"30px阈值跳道"
// 所有参数来自 CONFIG.MOVE, 禁止在事件处理中写死数值

var MovementMath = {

    /** 拖动映射: touchSensitivity = 1.0 表示"拖过整个屏幕宽度 = 横穿全部可玩范围"。
     *  V5.0 语义修正: touchSensitivity 越大 → 移动越快(越灵敏), 越小 → 移动越慢。
     *  @param anchorWX   按下时小队targetX(锚点, 相对拖动不跳变)
     *  @param dxPx       本次拖动像素位移(cur - start)
     *  @param canvasWidth 画布CSS宽度(px)
     *  @param maxX       队伍中心允许的最大|X|(随阵型宽度变化)
     *  @returns 目标X(已钳制)
     */
    dragTarget: function(anchorWX, dxPx, canvasWidth, maxX) {
        var M = CONFIG.MOVE;
        var w = Math.max(1, canvasWidth || 1);
        // 每像素世界位移 = 全可玩范围 × 灵敏度 / 屏幕宽
        var worldPerPx = (maxX * 2) * M.touchSensitivity / w;
        var x = anchorWX + dxPx * worldPerPx;
        return this.clampCenter(x, maxX);
    },

    /** 键盘单步移动(世界单位) */
    keyTarget: function(currentX, dir, maxX) {
        var step = (CONFIG.MOVE.keyStep || 1.2) * (dir >= 0 ? 1 : -1);
        return this.clampCenter(currentX + step, maxX);
    },

    /** 队伍中心可移动边界:
     *  小人数: 路半宽 - 边距 - 队伍半宽 (全路自由移动)
     *  大人数: 优先保证"人群边缘不出路", 中心范围收窄到 路缘-人群半宽-余量,
     *          门可达性由门触发窗口随队伍宽度扩展补偿(见gates.js)
     */
    centerBounds: function(crowdHalfWidth) {
        var M = CONFIG.MOVE;
        var crowd = crowdHalfWidth || 0;
        var raw = CONFIG.ROAD_HALF_WIDTH - (M.centerMargin || 0.12) - crowd;
        if (raw >= (M.minCenterRange || 1.1)) return raw;
        // 大人数: 包络优先
        var contain = Math.max(0.1, CONFIG.ROAD_HALF_WIDTH - 0.05 - crowd);
        return Math.max(raw, Math.min(M.minCenterRange || 1.1, contain));
    },

    /** 钳制中心X到±bound */
    clampCenter: function(x, bound) {
        return Math.max(-bound, Math.min(bound, x));
    },

    /** 跟随阻尼λ: 3/λ秒后到达目标的~95% (指数阻尼帧率无关) */
    followLambda: function() {
        var t = Math.max(0.02, CONFIG.MOVE.followSmoothTime || 0.15);
        return 1 / t;
    },

    /** 门触发窗口: 门半宽 + 队伍半宽的一半(封顶0.7) — 大人数时允许人群边缘触发,
     *  但封顶保证左右门(间距4)触发区间永不重叠(死区≥0.6)
     */
    gateTriggerWindow: function(gateHalfWidth, crowdHalfWidth) {
        return gateHalfWidth + Math.min((crowdHalfWidth || 0) * 0.5, 0.7);
    }
};


/* ===== [[ js/vendor/GLTFLoader.js ]] ===== */
/* Three.js r149 GLTFLoader + BufferGeometryUtils; MIT. Local classic-script wrapper. */
(function(THREE){
const toTrianglesDrawMode=(function(){
const {
	BufferAttribute,
	BufferGeometry,
	Float32BufferAttribute,
	InstancedBufferAttribute,
	InterleavedBuffer,
	InterleavedBufferAttribute,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
	TrianglesDrawMode,
	Vector3,
} = THREE;

function computeTangents() {

	throw new Error( 'BufferGeometryUtils: computeTangents renamed to computeMikkTSpaceTangents.' );

}

function computeMikkTSpaceTangents( geometry, MikkTSpace, negateSign = true ) {

	if ( ! MikkTSpace || ! MikkTSpace.isReady ) {

		throw new Error( 'BufferGeometryUtils: Initialized MikkTSpace library required.' );

	}

	if ( ! geometry.hasAttribute( 'position' ) || ! geometry.hasAttribute( 'normal' ) || ! geometry.hasAttribute( 'uv' ) ) {

		throw new Error( 'BufferGeometryUtils: Tangents require "position", "normal", and "uv" attributes.' );

	}

	function getAttributeArray( attribute ) {

		if ( attribute.normalized || attribute.isInterleavedBufferAttribute ) {

			const dstArray = new Float32Array( attribute.getCount() * attribute.itemSize );

			for ( let i = 0, j = 0; i < attribute.getCount(); i ++ ) {

				dstArray[ j ++ ] = attribute.getX( i );
				dstArray[ j ++ ] = attribute.getY( i );

				if ( attribute.itemSize > 2 ) {

					dstArray[ j ++ ] = attribute.getZ( i );

				}

			}

			return dstArray;

		}

		if ( attribute.array instanceof Float32Array ) {

			return attribute.array;

		}

		return new Float32Array( attribute.array );

	}

	// MikkTSpace algorithm requires non-indexed input.

	const _geometry = geometry.index ? geometry.toNonIndexed() : geometry;

	// Compute vertex tangents.

	const tangents = MikkTSpace.generateTangents(

		getAttributeArray( _geometry.attributes.position ),
		getAttributeArray( _geometry.attributes.normal ),
		getAttributeArray( _geometry.attributes.uv )

	);

	// Texture coordinate convention of glTF differs from the apparent
	// default of the MikkTSpace library; .w component must be flipped.

	if ( negateSign ) {

		for ( let i = 3; i < tangents.length; i += 4 ) {

			tangents[ i ] *= - 1;

		}

	}

	//

	_geometry.setAttribute( 'tangent', new BufferAttribute( tangents, 4 ) );

	if ( geometry !== _geometry ) {

		geometry.copy( _geometry );

	}

	return geometry;

}

/**
 * @param  {Array<BufferGeometry>} geometries
 * @param  {Boolean} useGroups
 * @return {BufferGeometry}
 */
function mergeBufferGeometries( geometries, useGroups = false ) {

	const isIndexed = geometries[ 0 ].index !== null;

	const attributesUsed = new Set( Object.keys( geometries[ 0 ].attributes ) );
	const morphAttributesUsed = new Set( Object.keys( geometries[ 0 ].morphAttributes ) );

	const attributes = {};
	const morphAttributes = {};

	const morphTargetsRelative = geometries[ 0 ].morphTargetsRelative;

	const mergedGeometry = new BufferGeometry();

	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ) {

		const geometry = geometries[ i ];
		let attributesCount = 0;

		// ensure that all geometries are indexed, or none

		if ( isIndexed !== ( geometry.index !== null ) ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure index attribute exists among all geometries, or in none of them.' );
			return null;

		}

		// gather attributes, exit early if they're different

		for ( const name in geometry.attributes ) {

			if ( ! attributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. All geometries must have compatible attributes; make sure "' + name + '" attribute exists among all geometries, or in none of them.' );
				return null;

			}

			if ( attributes[ name ] === undefined ) attributes[ name ] = [];

			attributes[ name ].push( geometry.attributes[ name ] );

			attributesCount ++;

		}

		// ensure geometries have the same number of attributes

		if ( attributesCount !== attributesUsed.size ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. Make sure all geometries have the same number of attributes.' );
			return null;

		}

		// gather morph attributes, exit early if they're different

		if ( morphTargetsRelative !== geometry.morphTargetsRelative ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. .morphTargetsRelative must be consistent throughout all geometries.' );
			return null;

		}

		for ( const name in geometry.morphAttributes ) {

			if ( ! morphAttributesUsed.has( name ) ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '.  .morphAttributes must be consistent throughout all geometries.' );
				return null;

			}

			if ( morphAttributes[ name ] === undefined ) morphAttributes[ name ] = [];

			morphAttributes[ name ].push( geometry.morphAttributes[ name ] );

		}

		if ( useGroups ) {

			let count;

			if ( isIndexed ) {

				count = geometry.index.count;

			} else if ( geometry.attributes.position !== undefined ) {

				count = geometry.attributes.position.count;

			} else {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed with geometry at index ' + i + '. The geometry must have either an index or a position attribute' );
				return null;

			}

			mergedGeometry.addGroup( offset, count, i );

			offset += count;

		}

	}

	// merge indices

	if ( isIndexed ) {

		let indexOffset = 0;
		const mergedIndex = [];

		for ( let i = 0; i < geometries.length; ++ i ) {

			const index = geometries[ i ].index;

			for ( let j = 0; j < index.count; ++ j ) {

				mergedIndex.push( index.getX( j ) + indexOffset );

			}

			indexOffset += geometries[ i ].attributes.position.count;

		}

		mergedGeometry.setIndex( mergedIndex );

	}

	// merge attributes

	for ( const name in attributes ) {

		const mergedAttribute = mergeBufferAttributes( attributes[ name ] );

		if ( ! mergedAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' attribute.' );
			return null;

		}

		mergedGeometry.setAttribute( name, mergedAttribute );

	}

	// merge morph attributes

	for ( const name in morphAttributes ) {

		const numMorphTargets = morphAttributes[ name ][ 0 ].length;

		if ( numMorphTargets === 0 ) break;

		mergedGeometry.morphAttributes = mergedGeometry.morphAttributes || {};
		mergedGeometry.morphAttributes[ name ] = [];

		for ( let i = 0; i < numMorphTargets; ++ i ) {

			const morphAttributesToMerge = [];

			for ( let j = 0; j < morphAttributes[ name ].length; ++ j ) {

				morphAttributesToMerge.push( morphAttributes[ name ][ j ][ i ] );

			}

			const mergedMorphAttribute = mergeBufferAttributes( morphAttributesToMerge );

			if ( ! mergedMorphAttribute ) {

				console.error( 'THREE.BufferGeometryUtils: .mergeBufferGeometries() failed while trying to merge the ' + name + ' morphAttribute.' );
				return null;

			}

			mergedGeometry.morphAttributes[ name ].push( mergedMorphAttribute );

		}

	}

	return mergedGeometry;

}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {BufferAttribute}
 */
function mergeBufferAttributes( attributes ) {

	let TypedArray;
	let itemSize;
	let normalized;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];

		if ( attribute.isInterleavedBufferAttribute ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. InterleavedBufferAttributes are not supported.' );
			return null;

		}

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.array must be of consistent array types across matching attributes.' );
			return null;

		}

		if ( itemSize === undefined ) itemSize = attribute.itemSize;
		if ( itemSize !== attribute.itemSize ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.itemSize must be consistent across matching attributes.' );
			return null;

		}

		if ( normalized === undefined ) normalized = attribute.normalized;
		if ( normalized !== attribute.normalized ) {

			console.error( 'THREE.BufferGeometryUtils: .mergeBufferAttributes() failed. BufferAttribute.normalized must be consistent across matching attributes.' );
			return null;

		}

		arrayLength += attribute.array.length;

	}

	const array = new TypedArray( arrayLength );
	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		array.set( attributes[ i ].array, offset );

		offset += attributes[ i ].array.length;

	}

	return new BufferAttribute( array, itemSize, normalized );

}

/**
 * @param {BufferAttribute}
 * @return {BufferAttribute}
 */
function deepCloneAttribute( attribute ) {

	if ( attribute.isInstancedInterleavedBufferAttribute || attribute.isInterleavedBufferAttribute ) {

		return deinterleaveAttribute( attribute );

	}

	if ( attribute.isInstancedBufferAttribute ) {

		return new InstancedBufferAttribute().copy( attribute );

	}

	return new BufferAttribute().copy( attribute );

}

/**
 * @param {Array<BufferAttribute>} attributes
 * @return {Array<InterleavedBufferAttribute>}
 */
function interleaveAttributes( attributes ) {

	// Interleaves the provided attributes into an InterleavedBuffer and returns
	// a set of InterleavedBufferAttributes for each attribute
	let TypedArray;
	let arrayLength = 0;
	let stride = 0;

	// calculate the length and type of the interleavedBuffer
	for ( let i = 0, l = attributes.length; i < l; ++ i ) {

		const attribute = attributes[ i ];

		if ( TypedArray === undefined ) TypedArray = attribute.array.constructor;
		if ( TypedArray !== attribute.array.constructor ) {

			console.error( 'AttributeBuffers of different types cannot be interleaved' );
			return null;

		}

		arrayLength += attribute.array.length;
		stride += attribute.itemSize;

	}

	// Create the set of buffer attributes
	const interleavedBuffer = new InterleavedBuffer( new TypedArray( arrayLength ), stride );
	let offset = 0;
	const res = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	for ( let j = 0, l = attributes.length; j < l; j ++ ) {

		const attribute = attributes[ j ];
		const itemSize = attribute.itemSize;
		const count = attribute.count;
		const iba = new InterleavedBufferAttribute( interleavedBuffer, itemSize, offset, attribute.normalized );
		res.push( iba );

		offset += itemSize;

		// Move the data for each attribute into the new interleavedBuffer
		// at the appropriate offset
		for ( let c = 0; c < count; c ++ ) {

			for ( let k = 0; k < itemSize; k ++ ) {

				iba[ setters[ k ] ]( c, attribute[ getters[ k ] ]( c ) );

			}

		}

	}

	return res;

}

// returns a new, non-interleaved version of the provided attribute
function deinterleaveAttribute( attribute ) {

	const cons = attribute.data.array.constructor;
	const count = attribute.count;
	const itemSize = attribute.itemSize;
	const normalized = attribute.normalized;

	const array = new cons( count * itemSize );
	let newAttribute;
	if ( attribute.isInstancedInterleavedBufferAttribute ) {

		newAttribute = new InstancedBufferAttribute( array, itemSize, normalized, attribute.meshPerAttribute );

	} else {

		newAttribute = new BufferAttribute( array, itemSize, normalized );

	}

	for ( let i = 0; i < count; i ++ ) {

		newAttribute.setX( i, attribute.getX( i ) );

		if ( itemSize >= 2 ) {

			newAttribute.setY( i, attribute.getY( i ) );

		}

		if ( itemSize >= 3 ) {

			newAttribute.setZ( i, attribute.getZ( i ) );

		}

		if ( itemSize >= 4 ) {

			newAttribute.setW( i, attribute.getW( i ) );

		}

	}

	return newAttribute;

}

// deinterleaves all attributes on the geometry
function deinterleaveGeometry( geometry ) {

	const attributes = geometry.attributes;
	const morphTargets = geometry.morphTargets;
	const attrMap = new Map();

	for ( const key in attributes ) {

		const attr = attributes[ key ];
		if ( attr.isInterleavedBufferAttribute ) {

			if ( ! attrMap.has( attr ) ) {

				attrMap.set( attr, deinterleaveAttribute( attr ) );

			}

			attributes[ key ] = attrMap.get( attr );

		}

	}

	for ( const key in morphTargets ) {

		const attr = morphTargets[ key ];
		if ( attr.isInterleavedBufferAttribute ) {

			if ( ! attrMap.has( attr ) ) {

				attrMap.set( attr, deinterleaveAttribute( attr ) );

			}

			morphTargets[ key ] = attrMap.get( attr );

		}

	}

}

/**
 * @param {Array<BufferGeometry>} geometry
 * @return {number}
 */
function estimateBytesUsed( geometry ) {

	// Return the estimated memory used by this geometry in bytes
	// Calculate using itemSize, count, and BYTES_PER_ELEMENT to account
	// for InterleavedBufferAttributes.
	let mem = 0;
	for ( const name in geometry.attributes ) {

		const attr = geometry.getAttribute( name );
		mem += attr.count * attr.itemSize * attr.array.BYTES_PER_ELEMENT;

	}

	const indices = geometry.getIndex();
	mem += indices ? indices.count * indices.itemSize * indices.array.BYTES_PER_ELEMENT : 0;
	return mem;

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} tolerance
 * @return {BufferGeometry}
 */
function mergeVertices( geometry, tolerance = 1e-4 ) {

	tolerance = Math.max( tolerance, Number.EPSILON );

	// Generate an index buffer if the geometry doesn't have one, or optimize it
	// if it's already available.
	const hashToIndex = {};
	const indices = geometry.getIndex();
	const positions = geometry.getAttribute( 'position' );
	const vertexCount = indices ? indices.count : positions.count;

	// next value for triangle indices
	let nextIndex = 0;

	// attributes and new attribute arrays
	const attributeNames = Object.keys( geometry.attributes );
	const tmpAttributes = {};
	const tmpMorphAttributes = {};
	const newIndices = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	// Initialize the arrays, allocating space conservatively. Extra
	// space will be trimmed in the last step.
	for ( let i = 0, l = attributeNames.length; i < l; i ++ ) {

		const name = attributeNames[ i ];
		const attr = geometry.attributes[ name ];

		tmpAttributes[ name ] = new BufferAttribute(
			new attr.array.constructor( attr.count * attr.itemSize ),
			attr.itemSize,
			attr.normalized
		);

		const morphAttr = geometry.morphAttributes[ name ];
		if ( morphAttr ) {

			tmpMorphAttributes[ name ] = new BufferAttribute(
				new morphAttr.array.constructor( morphAttr.count * morphAttr.itemSize ),
				morphAttr.itemSize,
				morphAttr.normalized
			);

		}

	}

	// convert the error tolerance to an amount of decimal places to truncate to
	const decimalShift = Math.log10( 1 / tolerance );
	const shiftMultiplier = Math.pow( 10, decimalShift );
	for ( let i = 0; i < vertexCount; i ++ ) {

		const index = indices ? indices.getX( i ) : i;

		// Generate a hash for the vertex attributes at the current index 'i'
		let hash = '';
		for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

			const name = attributeNames[ j ];
			const attribute = geometry.getAttribute( name );
			const itemSize = attribute.itemSize;

			for ( let k = 0; k < itemSize; k ++ ) {

				// double tilde truncates the decimal value
				hash += `${ ~ ~ ( attribute[ getters[ k ] ]( index ) * shiftMultiplier ) },`;

			}

		}

		// Add another reference to the vertex if it's already
		// used by another index
		if ( hash in hashToIndex ) {

			newIndices.push( hashToIndex[ hash ] );

		} else {

			// copy data to the new index in the temporary attributes
			for ( let j = 0, l = attributeNames.length; j < l; j ++ ) {

				const name = attributeNames[ j ];
				const attribute = geometry.getAttribute( name );
				const morphAttr = geometry.morphAttributes[ name ];
				const itemSize = attribute.itemSize;
				const newarray = tmpAttributes[ name ];
				const newMorphArrays = tmpMorphAttributes[ name ];

				for ( let k = 0; k < itemSize; k ++ ) {

					const getterFunc = getters[ k ];
					const setterFunc = setters[ k ];
					newarray[ setterFunc ]( nextIndex, attribute[ getterFunc ]( index ) );

					if ( morphAttr ) {

						for ( let m = 0, ml = morphAttr.length; m < ml; m ++ ) {

							newMorphArrays[ m ][ setterFunc ]( nextIndex, morphAttr[ m ][ getterFunc ]( index ) );

						}

					}

				}

			}

			hashToIndex[ hash ] = nextIndex;
			newIndices.push( nextIndex );
			nextIndex ++;

		}

	}

	// generate result BufferGeometry
	const result = geometry.clone();
	for ( const name in geometry.attributes ) {

		const tmpAttribute = tmpAttributes[ name ];

		result.setAttribute( name, new BufferAttribute(
			tmpAttribute.array.slice( 0, nextIndex * tmpAttribute.itemSize ),
			tmpAttribute.itemSize,
			tmpAttribute.normalized,
		) );

		if ( ! ( name in tmpMorphAttributes ) ) continue;

		for ( let j = 0; j < tmpMorphAttributes[ name ].length; j ++ ) {

			const tmpMorphAttribute = tmpMorphAttributes[ name ][ j ];

			result.morphAttributes[ name ][ j ] = new BufferAttribute(
				tmpMorphAttribute.array.slice( 0, nextIndex * tmpMorphAttribute.itemSize ),
				tmpMorphAttribute.itemSize,
				tmpMorphAttribute.normalized,
			);

		}

	}

	// indices

	result.setIndex( newIndices );

	return result;

}

/**
 * @param {BufferGeometry} geometry
 * @param {number} drawMode
 * @return {BufferGeometry}
 */
function toTrianglesDrawMode( geometry, drawMode ) {

	if ( drawMode === TrianglesDrawMode ) {

		console.warn( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Geometry already defined as triangles.' );
		return geometry;

	}

	if ( drawMode === TriangleFanDrawMode || drawMode === TriangleStripDrawMode ) {

		let index = geometry.getIndex();

		// generate index if not present

		if ( index === null ) {

			const indices = [];

			const position = geometry.getAttribute( 'position' );

			if ( position !== undefined ) {

				for ( let i = 0; i < position.count; i ++ ) {

					indices.push( i );

				}

				geometry.setIndex( indices );
				index = geometry.getIndex();

			} else {

				console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Undefined position attribute. Processing not possible.' );
				return geometry;

			}

		}

		//

		const numberOfTriangles = index.count - 2;
		const newIndices = [];

		if ( drawMode === TriangleFanDrawMode ) {

			// gl.TRIANGLE_FAN

			for ( let i = 1; i <= numberOfTriangles; i ++ ) {

				newIndices.push( index.getX( 0 ) );
				newIndices.push( index.getX( i ) );
				newIndices.push( index.getX( i + 1 ) );

			}

		} else {

			// gl.TRIANGLE_STRIP

			for ( let i = 0; i < numberOfTriangles; i ++ ) {

				if ( i % 2 === 0 ) {

					newIndices.push( index.getX( i ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i + 2 ) );

				} else {

					newIndices.push( index.getX( i + 2 ) );
					newIndices.push( index.getX( i + 1 ) );
					newIndices.push( index.getX( i ) );

				}

			}

		}

		if ( ( newIndices.length / 3 ) !== numberOfTriangles ) {

			console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unable to generate correct amount of triangles.' );

		}

		// build final geometry

		const newGeometry = geometry.clone();
		newGeometry.setIndex( newIndices );
		newGeometry.clearGroups();

		return newGeometry;

	} else {

		console.error( 'THREE.BufferGeometryUtils.toTrianglesDrawMode(): Unknown draw mode:', drawMode );
		return geometry;

	}

}

/**
 * Calculates the morphed attributes of a morphed/skinned BufferGeometry.
 * Helpful for Raytracing or Decals.
 * @param {Mesh | Line | Points} object An instance of Mesh, Line or Points.
 * @return {Object} An Object with original position/normal attributes and morphed ones.
 */
function computeMorphedAttributes( object ) {

	if ( object.geometry.isBufferGeometry !== true ) {

		console.error( 'THREE.BufferGeometryUtils: Geometry is not of type BufferGeometry.' );
		return null;

	}

	const _vA = new Vector3();
	const _vB = new Vector3();
	const _vC = new Vector3();

	const _tempA = new Vector3();
	const _tempB = new Vector3();
	const _tempC = new Vector3();

	const _morphA = new Vector3();
	const _morphB = new Vector3();
	const _morphC = new Vector3();

	function _calculateMorphedAttributeData(
		object,
		attribute,
		morphAttribute,
		morphTargetsRelative,
		a,
		b,
		c,
		modifiedAttributeArray
	) {

		_vA.fromBufferAttribute( attribute, a );
		_vB.fromBufferAttribute( attribute, b );
		_vC.fromBufferAttribute( attribute, c );

		const morphInfluences = object.morphTargetInfluences;

		if ( morphAttribute && morphInfluences ) {

			_morphA.set( 0, 0, 0 );
			_morphB.set( 0, 0, 0 );
			_morphC.set( 0, 0, 0 );

			for ( let i = 0, il = morphAttribute.length; i < il; i ++ ) {

				const influence = morphInfluences[ i ];
				const morph = morphAttribute[ i ];

				if ( influence === 0 ) continue;

				_tempA.fromBufferAttribute( morph, a );
				_tempB.fromBufferAttribute( morph, b );
				_tempC.fromBufferAttribute( morph, c );

				if ( morphTargetsRelative ) {

					_morphA.addScaledVector( _tempA, influence );
					_morphB.addScaledVector( _tempB, influence );
					_morphC.addScaledVector( _tempC, influence );

				} else {

					_morphA.addScaledVector( _tempA.sub( _vA ), influence );
					_morphB.addScaledVector( _tempB.sub( _vB ), influence );
					_morphC.addScaledVector( _tempC.sub( _vC ), influence );

				}

			}

			_vA.add( _morphA );
			_vB.add( _morphB );
			_vC.add( _morphC );

		}

		if ( object.isSkinnedMesh ) {

			object.boneTransform( a, _vA );
			object.boneTransform( b, _vB );
			object.boneTransform( c, _vC );

		}

		modifiedAttributeArray[ a * 3 + 0 ] = _vA.x;
		modifiedAttributeArray[ a * 3 + 1 ] = _vA.y;
		modifiedAttributeArray[ a * 3 + 2 ] = _vA.z;
		modifiedAttributeArray[ b * 3 + 0 ] = _vB.x;
		modifiedAttributeArray[ b * 3 + 1 ] = _vB.y;
		modifiedAttributeArray[ b * 3 + 2 ] = _vB.z;
		modifiedAttributeArray[ c * 3 + 0 ] = _vC.x;
		modifiedAttributeArray[ c * 3 + 1 ] = _vC.y;
		modifiedAttributeArray[ c * 3 + 2 ] = _vC.z;

	}

	const geometry = object.geometry;
	const material = object.material;

	let a, b, c;
	const index = geometry.index;
	const positionAttribute = geometry.attributes.position;
	const morphPosition = geometry.morphAttributes.position;
	const morphTargetsRelative = geometry.morphTargetsRelative;
	const normalAttribute = geometry.attributes.normal;
	const morphNormal = geometry.morphAttributes.position;

	const groups = geometry.groups;
	const drawRange = geometry.drawRange;
	let i, j, il, jl;
	let group;
	let start, end;

	const modifiedPosition = new Float32Array( positionAttribute.count * positionAttribute.itemSize );
	const modifiedNormal = new Float32Array( normalAttribute.count * normalAttribute.itemSize );

	if ( index !== null ) {

		// indexed buffer geometry

		if ( Array.isArray( material ) ) {

			for ( i = 0, il = groups.length; i < il; i ++ ) {

				group = groups[ i ];

				start = Math.max( group.start, drawRange.start );
				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

				for ( j = start, jl = end; j < jl; j += 3 ) {

					a = index.getX( j );
					b = index.getX( j + 1 );
					c = index.getX( j + 2 );

					_calculateMorphedAttributeData(
						object,
						positionAttribute,
						morphPosition,
						morphTargetsRelative,
						a, b, c,
						modifiedPosition
					);

					_calculateMorphedAttributeData(
						object,
						normalAttribute,
						morphNormal,
						morphTargetsRelative,
						a, b, c,
						modifiedNormal
					);

				}

			}

		} else {

			start = Math.max( 0, drawRange.start );
			end = Math.min( index.count, ( drawRange.start + drawRange.count ) );

			for ( i = start, il = end; i < il; i += 3 ) {

				a = index.getX( i );
				b = index.getX( i + 1 );
				c = index.getX( i + 2 );

				_calculateMorphedAttributeData(
					object,
					positionAttribute,
					morphPosition,
					morphTargetsRelative,
					a, b, c,
					modifiedPosition
				);

				_calculateMorphedAttributeData(
					object,
					normalAttribute,
					morphNormal,
					morphTargetsRelative,
					a, b, c,
					modifiedNormal
				);

			}

		}

	} else {

		// non-indexed buffer geometry

		if ( Array.isArray( material ) ) {

			for ( i = 0, il = groups.length; i < il; i ++ ) {

				group = groups[ i ];

				start = Math.max( group.start, drawRange.start );
				end = Math.min( ( group.start + group.count ), ( drawRange.start + drawRange.count ) );

				for ( j = start, jl = end; j < jl; j += 3 ) {

					a = j;
					b = j + 1;
					c = j + 2;

					_calculateMorphedAttributeData(
						object,
						positionAttribute,
						morphPosition,
						morphTargetsRelative,
						a, b, c,
						modifiedPosition
					);

					_calculateMorphedAttributeData(
						object,
						normalAttribute,
						morphNormal,
						morphTargetsRelative,
						a, b, c,
						modifiedNormal
					);

				}

			}

		} else {

			start = Math.max( 0, drawRange.start );
			end = Math.min( positionAttribute.count, ( drawRange.start + drawRange.count ) );

			for ( i = start, il = end; i < il; i += 3 ) {

				a = i;
				b = i + 1;
				c = i + 2;

				_calculateMorphedAttributeData(
					object,
					positionAttribute,
					morphPosition,
					morphTargetsRelative,
					a, b, c,
					modifiedPosition
				);

				_calculateMorphedAttributeData(
					object,
					normalAttribute,
					morphNormal,
					morphTargetsRelative,
					a, b, c,
					modifiedNormal
				);

			}

		}

	}

	const morphedPositionAttribute = new Float32BufferAttribute( modifiedPosition, 3 );
	const morphedNormalAttribute = new Float32BufferAttribute( modifiedNormal, 3 );

	return {

		positionAttribute: positionAttribute,
		normalAttribute: normalAttribute,
		morphedPositionAttribute: morphedPositionAttribute,
		morphedNormalAttribute: morphedNormalAttribute

	};

}

function mergeGroups( geometry ) {

	if ( geometry.groups.length === 0 ) {

		console.warn( 'THREE.BufferGeometryUtils.mergeGroups(): No groups are defined. Nothing to merge.' );
		return geometry;

	}

	let groups = geometry.groups;

	// sort groups by material index

	groups = groups.sort( ( a, b ) => {

		if ( a.materialIndex !== b.materialIndex ) return a.materialIndex - b.materialIndex;

		return a.start - b.start;

	} );

	// create index for non-indexed geometries

	if ( geometry.getIndex() === null ) {

		const positionAttribute = geometry.getAttribute( 'position' );
		const indices = [];

		for ( let i = 0; i < positionAttribute.count; i += 3 ) {

			indices.push( i, i + 1, i + 2 );

		}

		geometry.setIndex( indices );

	}

	// sort index

	const index = geometry.getIndex();

	const newIndices = [];

	for ( let i = 0; i < groups.length; i ++ ) {

		const group = groups[ i ];

		const groupStart = group.start;
		const groupLength = groupStart + group.count;

		for ( let j = groupStart; j < groupLength; j ++ ) {

			newIndices.push( index.getX( j ) );

		}

	}

	geometry.dispose(); // Required to force buffer recreation
	geometry.setIndex( newIndices );

	// update groups indices

	let start = 0;

	for ( let i = 0; i < groups.length; i ++ ) {

		const group = groups[ i ];

		group.start = start;
		start += group.count;

	}

	// merge groups

	let currentGroup = groups[ 0 ];

	geometry.groups = [ currentGroup ];

	for ( let i = 1; i < groups.length; i ++ ) {

		const group = groups[ i ];

		if ( currentGroup.materialIndex === group.materialIndex ) {

			currentGroup.count += group.count;

		} else {

			currentGroup = group;
			geometry.groups.push( currentGroup );

		}

	}

	return geometry;

}


// Creates a new, non-indexed geometry with smooth normals everywhere except faces that meet at
// an angle greater than the crease angle.
function toCreasedNormals( geometry, creaseAngle = Math.PI / 3 /* 60 degrees */ ) {

	const creaseDot = Math.cos( creaseAngle );
	const hashMultiplier = ( 1 + 1e-10 ) * 1e2;

	// reusable vertors
	const verts = [ new Vector3(), new Vector3(), new Vector3() ];
	const tempVec1 = new Vector3();
	const tempVec2 = new Vector3();
	const tempNorm = new Vector3();
	const tempNorm2 = new Vector3();

	// hashes a vector
	function hashVertex( v ) {

		const x = ~ ~ ( v.x * hashMultiplier );
		const y = ~ ~ ( v.y * hashMultiplier );
		const z = ~ ~ ( v.z * hashMultiplier );
		return `${x},${y},${z}`;

	}

	const resultGeometry = geometry.toNonIndexed();
	const posAttr = resultGeometry.attributes.position;
	const vertexMap = {};

	// find all the normals shared by commonly located vertices
	for ( let i = 0, l = posAttr.count / 3; i < l; i ++ ) {

		const i3 = 3 * i;
		const a = verts[ 0 ].fromBufferAttribute( posAttr, i3 + 0 );
		const b = verts[ 1 ].fromBufferAttribute( posAttr, i3 + 1 );
		const c = verts[ 2 ].fromBufferAttribute( posAttr, i3 + 2 );

		tempVec1.subVectors( c, b );
		tempVec2.subVectors( a, b );

		// add the normal to the map for all vertices
		const normal = new Vector3().crossVectors( tempVec1, tempVec2 ).normalize();
		for ( let n = 0; n < 3; n ++ ) {

			const vert = verts[ n ];
			const hash = hashVertex( vert );
			if ( ! ( hash in vertexMap ) ) {

				vertexMap[ hash ] = [];

			}

			vertexMap[ hash ].push( normal );

		}

	}

	// average normals from all vertices that share a common location if they are within the
	// provided crease threshold
	const normalArray = new Float32Array( posAttr.count * 3 );
	const normAttr = new BufferAttribute( normalArray, 3, false );
	for ( let i = 0, l = posAttr.count / 3; i < l; i ++ ) {

		// get the face normal for this vertex
		const i3 = 3 * i;
		const a = verts[ 0 ].fromBufferAttribute( posAttr, i3 + 0 );
		const b = verts[ 1 ].fromBufferAttribute( posAttr, i3 + 1 );
		const c = verts[ 2 ].fromBufferAttribute( posAttr, i3 + 2 );

		tempVec1.subVectors( c, b );
		tempVec2.subVectors( a, b );

		tempNorm.crossVectors( tempVec1, tempVec2 ).normalize();

		// average all normals that meet the threshold and set the normal value
		for ( let n = 0; n < 3; n ++ ) {

			const vert = verts[ n ];
			const hash = hashVertex( vert );
			const otherNormals = vertexMap[ hash ];
			tempNorm2.set( 0, 0, 0 );

			for ( let k = 0, lk = otherNormals.length; k < lk; k ++ ) {

				const otherNorm = otherNormals[ k ];
				if ( tempNorm.dot( otherNorm ) > creaseDot ) {

					tempNorm2.add( otherNorm );

				}

			}

			tempNorm2.normalize();
			normAttr.setXYZ( i3 + n, tempNorm2.x, tempNorm2.y, tempNorm2.z );

		}

	}

	resultGeometry.setAttribute( 'normal', normAttr );
	return resultGeometry;

}


return toTrianglesDrawMode;})();
const {
	AnimationClip,
	Bone,
	Box3,
	BufferAttribute,
	BufferGeometry,
	ClampToEdgeWrapping,
	Color,
	DirectionalLight,
	DoubleSide,
	FileLoader,
	FrontSide,
	Group,
	ImageBitmapLoader,
	InstancedMesh,
	InterleavedBuffer,
	InterleavedBufferAttribute,
	Interpolant,
	InterpolateDiscrete,
	InterpolateLinear,
	Line,
	LineBasicMaterial,
	LineLoop,
	LineSegments,
	LinearFilter,
	LinearMipmapLinearFilter,
	LinearMipmapNearestFilter,
	Loader,
	LoaderUtils,
	Material,
	MathUtils,
	Matrix4,
	Mesh,
	MeshBasicMaterial,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	MirroredRepeatWrapping,
	NearestFilter,
	NearestMipmapLinearFilter,
	NearestMipmapNearestFilter,
	NumberKeyframeTrack,
	Object3D,
	OrthographicCamera,
	PerspectiveCamera,
	PointLight,
	Points,
	PointsMaterial,
	PropertyBinding,
	Quaternion,
	QuaternionKeyframeTrack,
	RepeatWrapping,
	Skeleton,
	SkinnedMesh,
	Sphere,
	SpotLight,
	Texture,
	TextureLoader,
	TriangleFanDrawMode,
	TriangleStripDrawMode,
	Vector2,
	Vector3,
	VectorKeyframeTrack,
	sRGBEncoding
} = THREE;


class GLTFLoader extends Loader {

	constructor( manager ) {

		super( manager );

		this.dracoLoader = null;
		this.ktx2Loader = null;
		this.meshoptDecoder = null;

		this.pluginCallbacks = [];

		this.register( function ( parser ) {

			return new GLTFMaterialsClearcoatExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureBasisUExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFTextureWebPExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSheenExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsTransmissionExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsVolumeExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIorExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsEmissiveStrengthExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsSpecularExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMaterialsIridescenceExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFLightsExtension( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshoptCompression( parser );

		} );

		this.register( function ( parser ) {

			return new GLTFMeshGpuInstancing( parser );

		} );

	}

	load( url, onLoad, onProgress, onError ) {

		const scope = this;

		let resourcePath;

		if ( this.resourcePath !== '' ) {

			resourcePath = this.resourcePath;

		} else if ( this.path !== '' ) {

			resourcePath = this.path;

		} else {

			resourcePath = LoaderUtils.extractUrlBase( url );

		}

		// Tells the LoadingManager to track an extra item, which resolves after
		// the model is fully loaded. This means the count of items loaded will
		// be incorrect, but ensures manager.onLoad() does not fire early.
		this.manager.itemStart( url );

		const _onError = function ( e ) {

			if ( onError ) {

				onError( e );

			} else {

				console.error( e );

			}

			scope.manager.itemError( url );
			scope.manager.itemEnd( url );

		};

		const loader = new FileLoader( this.manager );

		loader.setPath( this.path );
		loader.setResponseType( 'arraybuffer' );
		loader.setRequestHeader( this.requestHeader );
		loader.setWithCredentials( this.withCredentials );

		loader.load( url, function ( data ) {

			try {

				scope.parse( data, resourcePath, function ( gltf ) {

					onLoad( gltf );

					scope.manager.itemEnd( url );

				}, _onError );

			} catch ( e ) {

				_onError( e );

			}

		}, onProgress, _onError );

	}

	setDRACOLoader( dracoLoader ) {

		this.dracoLoader = dracoLoader;
		return this;

	}

	setDDSLoader() {

		throw new Error(

			'THREE.GLTFLoader: "MSFT_texture_dds" no longer supported. Please update to "KHR_texture_basisu".'

		);

	}

	setKTX2Loader( ktx2Loader ) {

		this.ktx2Loader = ktx2Loader;
		return this;

	}

	setMeshoptDecoder( meshoptDecoder ) {

		this.meshoptDecoder = meshoptDecoder;
		return this;

	}

	register( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) === - 1 ) {

			this.pluginCallbacks.push( callback );

		}

		return this;

	}

	unregister( callback ) {

		if ( this.pluginCallbacks.indexOf( callback ) !== - 1 ) {

			this.pluginCallbacks.splice( this.pluginCallbacks.indexOf( callback ), 1 );

		}

		return this;

	}

	parse( data, path, onLoad, onError ) {

		let json;
		const extensions = {};
		const plugins = {};
		const textDecoder = new TextDecoder();

		if ( typeof data === 'string' ) {

			json = JSON.parse( data );

		} else if ( data instanceof ArrayBuffer ) {

			const magic = textDecoder.decode( new Uint8Array( data, 0, 4 ) );

			if ( magic === BINARY_EXTENSION_HEADER_MAGIC ) {

				try {

					extensions[ EXTENSIONS.KHR_BINARY_GLTF ] = new GLTFBinaryExtension( data );

				} catch ( error ) {

					if ( onError ) onError( error );
					return;

				}

				json = JSON.parse( extensions[ EXTENSIONS.KHR_BINARY_GLTF ].content );

			} else {

				json = JSON.parse( textDecoder.decode( data ) );

			}

		} else {

			json = data;

		}

		if ( json.asset === undefined || json.asset.version[ 0 ] < 2 ) {

			if ( onError ) onError( new Error( 'THREE.GLTFLoader: Unsupported asset. glTF versions >=2.0 are supported.' ) );
			return;

		}

		const parser = new GLTFParser( json, {

			path: path || this.resourcePath || '',
			crossOrigin: this.crossOrigin,
			requestHeader: this.requestHeader,
			manager: this.manager,
			ktx2Loader: this.ktx2Loader,
			meshoptDecoder: this.meshoptDecoder

		} );

		parser.fileLoader.setRequestHeader( this.requestHeader );

		for ( let i = 0; i < this.pluginCallbacks.length; i ++ ) {

			const plugin = this.pluginCallbacks[ i ]( parser );
			plugins[ plugin.name ] = plugin;

			// Workaround to avoid determining as unknown extension
			// in addUnknownExtensionsToUserData().
			// Remove this workaround if we move all the existing
			// extension handlers to plugin system
			extensions[ plugin.name ] = true;

		}

		if ( json.extensionsUsed ) {

			for ( let i = 0; i < json.extensionsUsed.length; ++ i ) {

				const extensionName = json.extensionsUsed[ i ];
				const extensionsRequired = json.extensionsRequired || [];

				switch ( extensionName ) {

					case EXTENSIONS.KHR_MATERIALS_UNLIT:
						extensions[ extensionName ] = new GLTFMaterialsUnlitExtension();
						break;

					case EXTENSIONS.KHR_DRACO_MESH_COMPRESSION:
						extensions[ extensionName ] = new GLTFDracoMeshCompressionExtension( json, this.dracoLoader );
						break;

					case EXTENSIONS.KHR_TEXTURE_TRANSFORM:
						extensions[ extensionName ] = new GLTFTextureTransformExtension();
						break;

					case EXTENSIONS.KHR_MESH_QUANTIZATION:
						extensions[ extensionName ] = new GLTFMeshQuantizationExtension();
						break;

					default:

						if ( extensionsRequired.indexOf( extensionName ) >= 0 && plugins[ extensionName ] === undefined ) {

							console.warn( 'THREE.GLTFLoader: Unknown extension "' + extensionName + '".' );

						}

				}

			}

		}

		parser.setExtensions( extensions );
		parser.setPlugins( plugins );
		parser.parse( onLoad, onError );

	}

	parseAsync( data, path ) {

		const scope = this;

		return new Promise( function ( resolve, reject ) {

			scope.parse( data, path, resolve, reject );

		} );

	}

}

/* GLTFREGISTRY */

function GLTFRegistry() {

	let objects = {};

	return	{

		get: function ( key ) {

			return objects[ key ];

		},

		add: function ( key, object ) {

			objects[ key ] = object;

		},

		remove: function ( key ) {

			delete objects[ key ];

		},

		removeAll: function () {

			objects = {};

		}

	};

}

/*********************************/
/********** EXTENSIONS ***********/
/*********************************/

const EXTENSIONS = {
	KHR_BINARY_GLTF: 'KHR_binary_glTF',
	KHR_DRACO_MESH_COMPRESSION: 'KHR_draco_mesh_compression',
	KHR_LIGHTS_PUNCTUAL: 'KHR_lights_punctual',
	KHR_MATERIALS_CLEARCOAT: 'KHR_materials_clearcoat',
	KHR_MATERIALS_IOR: 'KHR_materials_ior',
	KHR_MATERIALS_SHEEN: 'KHR_materials_sheen',
	KHR_MATERIALS_SPECULAR: 'KHR_materials_specular',
	KHR_MATERIALS_TRANSMISSION: 'KHR_materials_transmission',
	KHR_MATERIALS_IRIDESCENCE: 'KHR_materials_iridescence',
	KHR_MATERIALS_UNLIT: 'KHR_materials_unlit',
	KHR_MATERIALS_VOLUME: 'KHR_materials_volume',
	KHR_TEXTURE_BASISU: 'KHR_texture_basisu',
	KHR_TEXTURE_TRANSFORM: 'KHR_texture_transform',
	KHR_MESH_QUANTIZATION: 'KHR_mesh_quantization',
	KHR_MATERIALS_EMISSIVE_STRENGTH: 'KHR_materials_emissive_strength',
	EXT_TEXTURE_WEBP: 'EXT_texture_webp',
	EXT_MESHOPT_COMPRESSION: 'EXT_meshopt_compression',
	EXT_MESH_GPU_INSTANCING: 'EXT_mesh_gpu_instancing'
};

/**
 * Punctual Lights Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_lights_punctual
 */
class GLTFLightsExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_LIGHTS_PUNCTUAL;

		// Object3D instance caches
		this.cache = { refs: {}, uses: {} };

	}

	_markDefs() {

		const parser = this.parser;
		const nodeDefs = this.parser.json.nodes || [];

		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.extensions
					&& nodeDef.extensions[ this.name ]
					&& nodeDef.extensions[ this.name ].light !== undefined ) {

				parser._addNodeRef( this.cache, nodeDef.extensions[ this.name ].light );

			}

		}

	}

	_loadLight( lightIndex ) {

		const parser = this.parser;
		const cacheKey = 'light:' + lightIndex;
		let dependency = parser.cache.get( cacheKey );

		if ( dependency ) return dependency;

		const json = parser.json;
		const extensions = ( json.extensions && json.extensions[ this.name ] ) || {};
		const lightDefs = extensions.lights || [];
		const lightDef = lightDefs[ lightIndex ];
		let lightNode;

		const color = new Color( 0xffffff );

		if ( lightDef.color !== undefined ) color.fromArray( lightDef.color );

		const range = lightDef.range !== undefined ? lightDef.range : 0;

		switch ( lightDef.type ) {

			case 'directional':
				lightNode = new DirectionalLight( color );
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			case 'point':
				lightNode = new PointLight( color );
				lightNode.distance = range;
				break;

			case 'spot':
				lightNode = new SpotLight( color );
				lightNode.distance = range;
				// Handle spotlight properties.
				lightDef.spot = lightDef.spot || {};
				lightDef.spot.innerConeAngle = lightDef.spot.innerConeAngle !== undefined ? lightDef.spot.innerConeAngle : 0;
				lightDef.spot.outerConeAngle = lightDef.spot.outerConeAngle !== undefined ? lightDef.spot.outerConeAngle : Math.PI / 4.0;
				lightNode.angle = lightDef.spot.outerConeAngle;
				lightNode.penumbra = 1.0 - lightDef.spot.innerConeAngle / lightDef.spot.outerConeAngle;
				lightNode.target.position.set( 0, 0, - 1 );
				lightNode.add( lightNode.target );
				break;

			default:
				throw new Error( 'THREE.GLTFLoader: Unexpected light type: ' + lightDef.type );

		}

		// Some lights (e.g. spot) default to a position other than the origin. Reset the position
		// here, because node-level parsing will only override position if explicitly specified.
		lightNode.position.set( 0, 0, 0 );

		lightNode.decay = 2;

		assignExtrasToUserData( lightNode, lightDef );

		if ( lightDef.intensity !== undefined ) lightNode.intensity = lightDef.intensity;

		lightNode.name = parser.createUniqueName( lightDef.name || ( 'light_' + lightIndex ) );

		dependency = Promise.resolve( lightNode );

		parser.cache.add( cacheKey, dependency );

		return dependency;

	}

	getDependency( type, index ) {

		if ( type !== 'light' ) return;

		return this._loadLight( index );

	}

	createNodeAttachment( nodeIndex ) {

		const self = this;
		const parser = this.parser;
		const json = parser.json;
		const nodeDef = json.nodes[ nodeIndex ];
		const lightDef = ( nodeDef.extensions && nodeDef.extensions[ this.name ] ) || {};
		const lightIndex = lightDef.light;

		if ( lightIndex === undefined ) return null;

		return this._loadLight( lightIndex ).then( function ( light ) {

			return parser._getNodeRef( self.cache, lightIndex, light );

		} );

	}

}

/**
 * Unlit Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_unlit
 */
class GLTFMaterialsUnlitExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MATERIALS_UNLIT;

	}

	getMaterialType() {

		return MeshBasicMaterial;

	}

	extendParams( materialParams, materialDef, parser ) {

		const pending = [];

		materialParams.color = new Color( 1.0, 1.0, 1.0 );
		materialParams.opacity = 1.0;

		const metallicRoughness = materialDef.pbrMetallicRoughness;

		if ( metallicRoughness ) {

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Emissive Strength Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/blob/5768b3ce0ef32bc39cdf1bef10b948586635ead3/extensions/2.0/Khronos/KHR_materials_emissive_strength/README.md
 */
class GLTFMaterialsEmissiveStrengthExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_EMISSIVE_STRENGTH;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const emissiveStrength = materialDef.extensions[ this.name ].emissiveStrength;

		if ( emissiveStrength !== undefined ) {

			materialParams.emissiveIntensity = emissiveStrength;

		}

		return Promise.resolve();

	}

}

/**
 * Clearcoat Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_clearcoat
 */
class GLTFMaterialsClearcoatExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_CLEARCOAT;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.clearcoatFactor !== undefined ) {

			materialParams.clearcoat = extension.clearcoatFactor;

		}

		if ( extension.clearcoatTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatMap', extension.clearcoatTexture ) );

		}

		if ( extension.clearcoatRoughnessFactor !== undefined ) {

			materialParams.clearcoatRoughness = extension.clearcoatRoughnessFactor;

		}

		if ( extension.clearcoatRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatRoughnessMap', extension.clearcoatRoughnessTexture ) );

		}

		if ( extension.clearcoatNormalTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'clearcoatNormalMap', extension.clearcoatNormalTexture ) );

			if ( extension.clearcoatNormalTexture.scale !== undefined ) {

				const scale = extension.clearcoatNormalTexture.scale;

				materialParams.clearcoatNormalScale = new Vector2( scale, scale );

			}

		}

		return Promise.all( pending );

	}

}

/**
 * Iridescence Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_iridescence
 */
class GLTFMaterialsIridescenceExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IRIDESCENCE;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.iridescenceFactor !== undefined ) {

			materialParams.iridescence = extension.iridescenceFactor;

		}

		if ( extension.iridescenceTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceMap', extension.iridescenceTexture ) );

		}

		if ( extension.iridescenceIor !== undefined ) {

			materialParams.iridescenceIOR = extension.iridescenceIor;

		}

		if ( materialParams.iridescenceThicknessRange === undefined ) {

			materialParams.iridescenceThicknessRange = [ 100, 400 ];

		}

		if ( extension.iridescenceThicknessMinimum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 0 ] = extension.iridescenceThicknessMinimum;

		}

		if ( extension.iridescenceThicknessMaximum !== undefined ) {

			materialParams.iridescenceThicknessRange[ 1 ] = extension.iridescenceThicknessMaximum;

		}

		if ( extension.iridescenceThicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'iridescenceThicknessMap', extension.iridescenceThicknessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Sheen Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/main/extensions/2.0/Khronos/KHR_materials_sheen
 */
class GLTFMaterialsSheenExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SHEEN;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		materialParams.sheenColor = new Color( 0, 0, 0 );
		materialParams.sheenRoughness = 0;
		materialParams.sheen = 1;

		const extension = materialDef.extensions[ this.name ];

		if ( extension.sheenColorFactor !== undefined ) {

			materialParams.sheenColor.fromArray( extension.sheenColorFactor );

		}

		if ( extension.sheenRoughnessFactor !== undefined ) {

			materialParams.sheenRoughness = extension.sheenRoughnessFactor;

		}

		if ( extension.sheenColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenColorMap', extension.sheenColorTexture, sRGBEncoding ) );

		}

		if ( extension.sheenRoughnessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'sheenRoughnessMap', extension.sheenRoughnessTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Transmission Materials Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_transmission
 * Draft: https://github.com/KhronosGroup/glTF/pull/1698
 */
class GLTFMaterialsTransmissionExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_TRANSMISSION;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		if ( extension.transmissionFactor !== undefined ) {

			materialParams.transmission = extension.transmissionFactor;

		}

		if ( extension.transmissionTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'transmissionMap', extension.transmissionTexture ) );

		}

		return Promise.all( pending );

	}

}

/**
 * Materials Volume Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_volume
 */
class GLTFMaterialsVolumeExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_VOLUME;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.thickness = extension.thicknessFactor !== undefined ? extension.thicknessFactor : 0;

		if ( extension.thicknessTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'thicknessMap', extension.thicknessTexture ) );

		}

		materialParams.attenuationDistance = extension.attenuationDistance || Infinity;

		const colorArray = extension.attenuationColor || [ 1, 1, 1 ];
		materialParams.attenuationColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		return Promise.all( pending );

	}

}

/**
 * Materials ior Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_ior
 */
class GLTFMaterialsIorExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_IOR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const extension = materialDef.extensions[ this.name ];

		materialParams.ior = extension.ior !== undefined ? extension.ior : 1.5;

		return Promise.resolve();

	}

}

/**
 * Materials specular Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_materials_specular
 */
class GLTFMaterialsSpecularExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_MATERIALS_SPECULAR;

	}

	getMaterialType( materialIndex ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) return null;

		return MeshPhysicalMaterial;

	}

	extendMaterialParams( materialIndex, materialParams ) {

		const parser = this.parser;
		const materialDef = parser.json.materials[ materialIndex ];

		if ( ! materialDef.extensions || ! materialDef.extensions[ this.name ] ) {

			return Promise.resolve();

		}

		const pending = [];

		const extension = materialDef.extensions[ this.name ];

		materialParams.specularIntensity = extension.specularFactor !== undefined ? extension.specularFactor : 1.0;

		if ( extension.specularTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularIntensityMap', extension.specularTexture ) );

		}

		const colorArray = extension.specularColorFactor || [ 1, 1, 1 ];
		materialParams.specularColor = new Color( colorArray[ 0 ], colorArray[ 1 ], colorArray[ 2 ] );

		if ( extension.specularColorTexture !== undefined ) {

			pending.push( parser.assignTexture( materialParams, 'specularColorMap', extension.specularColorTexture, sRGBEncoding ) );

		}

		return Promise.all( pending );

	}

}

/**
 * BasisU Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_basisu
 */
class GLTFTextureBasisUExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.KHR_TEXTURE_BASISU;

	}

	loadTexture( textureIndex ) {

		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ this.name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ this.name ];
		const loader = parser.options.ktx2Loader;

		if ( ! loader ) {

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: setKTX2Loader must be called before loading KTX2 textures' );

			} else {

				// Assumes that the extension is optional and that a fallback texture is present
				return null;

			}

		}

		return parser.loadTextureImage( textureIndex, extension.source, loader );

	}

}

/**
 * WebP Texture Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_texture_webp
 */
class GLTFTextureWebPExtension {

	constructor( parser ) {

		this.parser = parser;
		this.name = EXTENSIONS.EXT_TEXTURE_WEBP;
		this.isSupported = null;

	}

	loadTexture( textureIndex ) {

		const name = this.name;
		const parser = this.parser;
		const json = parser.json;

		const textureDef = json.textures[ textureIndex ];

		if ( ! textureDef.extensions || ! textureDef.extensions[ name ] ) {

			return null;

		}

		const extension = textureDef.extensions[ name ];
		const source = json.images[ extension.source ];

		let loader = parser.textureLoader;
		if ( source.uri ) {

			const handler = parser.options.manager.getHandler( source.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.detectSupport().then( function ( isSupported ) {

			if ( isSupported ) return parser.loadTextureImage( textureIndex, extension.source, loader );

			if ( json.extensionsRequired && json.extensionsRequired.indexOf( name ) >= 0 ) {

				throw new Error( 'THREE.GLTFLoader: WebP required by asset but unsupported.' );

			}

			// Fall back to PNG or JPEG.
			return parser.loadTexture( textureIndex );

		} );

	}

	detectSupport() {

		if ( ! this.isSupported ) {

			this.isSupported = new Promise( function ( resolve ) {

				const image = new Image();

				// Lossy test image. Support for lossy images doesn't guarantee support for all
				// WebP images, unfortunately.
				image.src = 'data:image/webp;base64,UklGRiIAAABXRUJQVlA4IBYAAAAwAQCdASoBAAEADsD+JaQAA3AAAAAA';

				image.onload = image.onerror = function () {

					resolve( image.height === 1 );

				};

			} );

		}

		return this.isSupported;

	}

}

/**
 * meshopt BufferView Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_meshopt_compression
 */
class GLTFMeshoptCompression {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESHOPT_COMPRESSION;
		this.parser = parser;

	}

	loadBufferView( index ) {

		const json = this.parser.json;
		const bufferView = json.bufferViews[ index ];

		if ( bufferView.extensions && bufferView.extensions[ this.name ] ) {

			const extensionDef = bufferView.extensions[ this.name ];

			const buffer = this.parser.getDependency( 'buffer', extensionDef.buffer );
			const decoder = this.parser.options.meshoptDecoder;

			if ( ! decoder || ! decoder.supported ) {

				if ( json.extensionsRequired && json.extensionsRequired.indexOf( this.name ) >= 0 ) {

					throw new Error( 'THREE.GLTFLoader: setMeshoptDecoder must be called before loading compressed files' );

				} else {

					// Assumes that the extension is optional and that fallback buffer data is present
					return null;

				}

			}

			return buffer.then( function ( res ) {

				const byteOffset = extensionDef.byteOffset || 0;
				const byteLength = extensionDef.byteLength || 0;

				const count = extensionDef.count;
				const stride = extensionDef.byteStride;

				const source = new Uint8Array( res, byteOffset, byteLength );

				if ( decoder.decodeGltfBufferAsync ) {

					return decoder.decodeGltfBufferAsync( count, stride, source, extensionDef.mode, extensionDef.filter ).then( function ( res ) {

						return res.buffer;

					} );

				} else {

					// Support for MeshoptDecoder 0.18 or earlier, without decodeGltfBufferAsync
					return decoder.ready.then( function () {

						const result = new ArrayBuffer( count * stride );
						decoder.decodeGltfBuffer( new Uint8Array( result ), count, stride, source, extensionDef.mode, extensionDef.filter );
						return result;

					} );

				}

			} );

		} else {

			return null;

		}

	}

}

/**
 * GPU Instancing Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Vendor/EXT_mesh_gpu_instancing
 *
 */
class GLTFMeshGpuInstancing {

	constructor( parser ) {

		this.name = EXTENSIONS.EXT_MESH_GPU_INSTANCING;
		this.parser = parser;

	}

	createNodeMesh( nodeIndex ) {

		const json = this.parser.json;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( ! nodeDef.extensions || ! nodeDef.extensions[ this.name ] ||
			nodeDef.mesh === undefined ) {

			return null;

		}

		const meshDef = json.meshes[ nodeDef.mesh ];

		// No Points or Lines + Instancing support yet

		for ( const primitive of meshDef.primitives ) {

			if ( primitive.mode !== WEBGL_CONSTANTS.TRIANGLES &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_STRIP &&
				 primitive.mode !== WEBGL_CONSTANTS.TRIANGLE_FAN &&
				 primitive.mode !== undefined ) {

				return null;

			}

		}

		const extensionDef = nodeDef.extensions[ this.name ];
		const attributesDef = extensionDef.attributes;

		// @TODO: Can we support InstancedMesh + SkinnedMesh?

		const pending = [];
		const attributes = {};

		for ( const key in attributesDef ) {

			pending.push( this.parser.getDependency( 'accessor', attributesDef[ key ] ).then( accessor => {

				attributes[ key ] = accessor;
				return attributes[ key ];

			} ) );

		}

		if ( pending.length < 1 ) {

			return null;

		}

		pending.push( this.parser.createNodeMesh( nodeIndex ) );

		return Promise.all( pending ).then( results => {

			const nodeObject = results.pop();
			const meshes = nodeObject.isGroup ? nodeObject.children : [ nodeObject ];
			const count = results[ 0 ].count; // All attribute counts should be same
			const instancedMeshes = [];

			for ( const mesh of meshes ) {

				// Temporal variables
				const m = new Matrix4();
				const p = new Vector3();
				const q = new Quaternion();
				const s = new Vector3( 1, 1, 1 );

				const instancedMesh = new InstancedMesh( mesh.geometry, mesh.material, count );

				for ( let i = 0; i < count; i ++ ) {

					if ( attributes.TRANSLATION ) {

						p.fromBufferAttribute( attributes.TRANSLATION, i );

					}

					if ( attributes.ROTATION ) {

						q.fromBufferAttribute( attributes.ROTATION, i );

					}

					if ( attributes.SCALE ) {

						s.fromBufferAttribute( attributes.SCALE, i );

					}

					instancedMesh.setMatrixAt( i, m.compose( p, q, s ) );

				}

				// Add instance attributes to the geometry, excluding TRS.
				for ( const attributeName in attributes ) {

					if ( attributeName !== 'TRANSLATION' &&
						 attributeName !== 'ROTATION' &&
						 attributeName !== 'SCALE' ) {

						mesh.geometry.setAttribute( attributeName, attributes[ attributeName ] );

					}

				}

				// Just in case
				Object3D.prototype.copy.call( instancedMesh, mesh );

				// https://github.com/mrdoob/three.js/issues/18334
				instancedMesh.frustumCulled = false;
				this.parser.assignFinalMaterial( instancedMesh );

				instancedMeshes.push( instancedMesh );

			}

			if ( nodeObject.isGroup ) {

				nodeObject.clear();

				nodeObject.add( ... instancedMeshes );

				return nodeObject;

			}

			return instancedMeshes[ 0 ];

		} );

	}

}

/* BINARY EXTENSION */
const BINARY_EXTENSION_HEADER_MAGIC = 'glTF';
const BINARY_EXTENSION_HEADER_LENGTH = 12;
const BINARY_EXTENSION_CHUNK_TYPES = { JSON: 0x4E4F534A, BIN: 0x004E4942 };

class GLTFBinaryExtension {

	constructor( data ) {

		this.name = EXTENSIONS.KHR_BINARY_GLTF;
		this.content = null;
		this.body = null;

		const headerView = new DataView( data, 0, BINARY_EXTENSION_HEADER_LENGTH );
		const textDecoder = new TextDecoder();

		this.header = {
			magic: textDecoder.decode( new Uint8Array( data.slice( 0, 4 ) ) ),
			version: headerView.getUint32( 4, true ),
			length: headerView.getUint32( 8, true )
		};

		if ( this.header.magic !== BINARY_EXTENSION_HEADER_MAGIC ) {

			throw new Error( 'THREE.GLTFLoader: Unsupported glTF-Binary header.' );

		} else if ( this.header.version < 2.0 ) {

			throw new Error( 'THREE.GLTFLoader: Legacy binary file detected.' );

		}

		const chunkContentsLength = this.header.length - BINARY_EXTENSION_HEADER_LENGTH;
		const chunkView = new DataView( data, BINARY_EXTENSION_HEADER_LENGTH );
		let chunkIndex = 0;

		while ( chunkIndex < chunkContentsLength ) {

			const chunkLength = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			const chunkType = chunkView.getUint32( chunkIndex, true );
			chunkIndex += 4;

			if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.JSON ) {

				const contentArray = new Uint8Array( data, BINARY_EXTENSION_HEADER_LENGTH + chunkIndex, chunkLength );
				this.content = textDecoder.decode( contentArray );

			} else if ( chunkType === BINARY_EXTENSION_CHUNK_TYPES.BIN ) {

				const byteOffset = BINARY_EXTENSION_HEADER_LENGTH + chunkIndex;
				this.body = data.slice( byteOffset, byteOffset + chunkLength );

			}

			// Clients must ignore chunks with unknown types.

			chunkIndex += chunkLength;

		}

		if ( this.content === null ) {

			throw new Error( 'THREE.GLTFLoader: JSON content not found.' );

		}

	}

}

/**
 * DRACO Mesh Compression Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_draco_mesh_compression
 */
class GLTFDracoMeshCompressionExtension {

	constructor( json, dracoLoader ) {

		if ( ! dracoLoader ) {

			throw new Error( 'THREE.GLTFLoader: No DRACOLoader instance provided.' );

		}

		this.name = EXTENSIONS.KHR_DRACO_MESH_COMPRESSION;
		this.json = json;
		this.dracoLoader = dracoLoader;
		this.dracoLoader.preload();

	}

	decodePrimitive( primitive, parser ) {

		const json = this.json;
		const dracoLoader = this.dracoLoader;
		const bufferViewIndex = primitive.extensions[ this.name ].bufferView;
		const gltfAttributeMap = primitive.extensions[ this.name ].attributes;
		const threeAttributeMap = {};
		const attributeNormalizedMap = {};
		const attributeTypeMap = {};

		for ( const attributeName in gltfAttributeMap ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			threeAttributeMap[ threeAttributeName ] = gltfAttributeMap[ attributeName ];

		}

		for ( const attributeName in primitive.attributes ) {

			const threeAttributeName = ATTRIBUTES[ attributeName ] || attributeName.toLowerCase();

			if ( gltfAttributeMap[ attributeName ] !== undefined ) {

				const accessorDef = json.accessors[ primitive.attributes[ attributeName ] ];
				const componentType = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

				attributeTypeMap[ threeAttributeName ] = componentType.name;
				attributeNormalizedMap[ threeAttributeName ] = accessorDef.normalized === true;

			}

		}

		return parser.getDependency( 'bufferView', bufferViewIndex ).then( function ( bufferView ) {

			return new Promise( function ( resolve ) {

				dracoLoader.decodeDracoFile( bufferView, function ( geometry ) {

					for ( const attributeName in geometry.attributes ) {

						const attribute = geometry.attributes[ attributeName ];
						const normalized = attributeNormalizedMap[ attributeName ];

						if ( normalized !== undefined ) attribute.normalized = normalized;

					}

					resolve( geometry );

				}, threeAttributeMap, attributeTypeMap );

			} );

		} );

	}

}

/**
 * Texture Transform Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_texture_transform
 */
class GLTFTextureTransformExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_TEXTURE_TRANSFORM;

	}

	extendTexture( texture, transform ) {

		if ( transform.texCoord !== undefined ) {

			console.warn( 'THREE.GLTFLoader: Custom UV sets in "' + this.name + '" extension not yet supported.' );

		}

		if ( transform.offset === undefined && transform.rotation === undefined && transform.scale === undefined ) {

			// See https://github.com/mrdoob/three.js/issues/21819.
			return texture;

		}

		texture = texture.clone();

		if ( transform.offset !== undefined ) {

			texture.offset.fromArray( transform.offset );

		}

		if ( transform.rotation !== undefined ) {

			texture.rotation = transform.rotation;

		}

		if ( transform.scale !== undefined ) {

			texture.repeat.fromArray( transform.scale );

		}

		texture.needsUpdate = true;

		return texture;

	}

}

/**
 * Mesh Quantization Extension
 *
 * Specification: https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization
 */
class GLTFMeshQuantizationExtension {

	constructor() {

		this.name = EXTENSIONS.KHR_MESH_QUANTIZATION;

	}

}

/*********************************/
/********** INTERPOLATION ********/
/*********************************/

// Spline Interpolation
// Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#appendix-c-spline-interpolation
class GLTFCubicSplineInterpolant extends Interpolant {

	constructor( parameterPositions, sampleValues, sampleSize, resultBuffer ) {

		super( parameterPositions, sampleValues, sampleSize, resultBuffer );

	}

	copySampleValue_( index ) {

		// Copies a sample value to the result buffer. See description of glTF
		// CUBICSPLINE values layout in interpolate_() function below.

		const result = this.resultBuffer,
			values = this.sampleValues,
			valueSize = this.valueSize,
			offset = index * valueSize * 3 + valueSize;

		for ( let i = 0; i !== valueSize; i ++ ) {

			result[ i ] = values[ offset + i ];

		}

		return result;

	}

	interpolate_( i1, t0, t, t1 ) {

		const result = this.resultBuffer;
		const values = this.sampleValues;
		const stride = this.valueSize;

		const stride2 = stride * 2;
		const stride3 = stride * 3;

		const td = t1 - t0;

		const p = ( t - t0 ) / td;
		const pp = p * p;
		const ppp = pp * p;

		const offset1 = i1 * stride3;
		const offset0 = offset1 - stride3;

		const s2 = - 2 * ppp + 3 * pp;
		const s3 = ppp - pp;
		const s0 = 1 - s2;
		const s1 = s3 - pp + p;

		// Layout of keyframe output values for CUBICSPLINE animations:
		//   [ inTangent_1, splineVertex_1, outTangent_1, inTangent_2, splineVertex_2, ... ]
		for ( let i = 0; i !== stride; i ++ ) {

			const p0 = values[ offset0 + i + stride ]; // splineVertex_k
			const m0 = values[ offset0 + i + stride2 ] * td; // outTangent_k * (t_k+1 - t_k)
			const p1 = values[ offset1 + i + stride ]; // splineVertex_k+1
			const m1 = values[ offset1 + i ] * td; // inTangent_k+1 * (t_k+1 - t_k)

			result[ i ] = s0 * p0 + s1 * m0 + s2 * p1 + s3 * m1;

		}

		return result;

	}

}

const _q = new Quaternion();

class GLTFCubicSplineQuaternionInterpolant extends GLTFCubicSplineInterpolant {

	interpolate_( i1, t0, t, t1 ) {

		const result = super.interpolate_( i1, t0, t, t1 );

		_q.fromArray( result ).normalize().toArray( result );

		return result;

	}

}


/*********************************/
/********** INTERNALS ************/
/*********************************/

/* CONSTANTS */

const WEBGL_CONSTANTS = {
	FLOAT: 5126,
	//FLOAT_MAT2: 35674,
	FLOAT_MAT3: 35675,
	FLOAT_MAT4: 35676,
	FLOAT_VEC2: 35664,
	FLOAT_VEC3: 35665,
	FLOAT_VEC4: 35666,
	LINEAR: 9729,
	REPEAT: 10497,
	SAMPLER_2D: 35678,
	POINTS: 0,
	LINES: 1,
	LINE_LOOP: 2,
	LINE_STRIP: 3,
	TRIANGLES: 4,
	TRIANGLE_STRIP: 5,
	TRIANGLE_FAN: 6,
	UNSIGNED_BYTE: 5121,
	UNSIGNED_SHORT: 5123
};

const WEBGL_COMPONENT_TYPES = {
	5120: Int8Array,
	5121: Uint8Array,
	5122: Int16Array,
	5123: Uint16Array,
	5125: Uint32Array,
	5126: Float32Array
};

const WEBGL_FILTERS = {
	9728: NearestFilter,
	9729: LinearFilter,
	9984: NearestMipmapNearestFilter,
	9985: LinearMipmapNearestFilter,
	9986: NearestMipmapLinearFilter,
	9987: LinearMipmapLinearFilter
};

const WEBGL_WRAPPINGS = {
	33071: ClampToEdgeWrapping,
	33648: MirroredRepeatWrapping,
	10497: RepeatWrapping
};

const WEBGL_TYPE_SIZES = {
	'SCALAR': 1,
	'VEC2': 2,
	'VEC3': 3,
	'VEC4': 4,
	'MAT2': 4,
	'MAT3': 9,
	'MAT4': 16
};

const ATTRIBUTES = {
	POSITION: 'position',
	NORMAL: 'normal',
	TANGENT: 'tangent',
	TEXCOORD_0: 'uv',
	TEXCOORD_1: 'uv2',
	COLOR_0: 'color',
	WEIGHTS_0: 'skinWeight',
	JOINTS_0: 'skinIndex',
};

const PATH_PROPERTIES = {
	scale: 'scale',
	translation: 'position',
	rotation: 'quaternion',
	weights: 'morphTargetInfluences'
};

const INTERPOLATION = {
	CUBICSPLINE: undefined, // We use a custom interpolant (GLTFCubicSplineInterpolation) for CUBICSPLINE tracks. Each
		                        // keyframe track will be initialized with a default interpolation type, then modified.
	LINEAR: InterpolateLinear,
	STEP: InterpolateDiscrete
};

const ALPHA_MODES = {
	OPAQUE: 'OPAQUE',
	MASK: 'MASK',
	BLEND: 'BLEND'
};

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#default-material
 */
function createDefaultMaterial( cache ) {

	if ( cache[ 'DefaultMaterial' ] === undefined ) {

		cache[ 'DefaultMaterial' ] = new MeshStandardMaterial( {
			color: 0xFFFFFF,
			emissive: 0x000000,
			metalness: 1,
			roughness: 1,
			transparent: false,
			depthTest: true,
			side: FrontSide
		} );

	}

	return cache[ 'DefaultMaterial' ];

}

function addUnknownExtensionsToUserData( knownExtensions, object, objectDef ) {

	// Add unknown glTF extensions to an object's userData.

	for ( const name in objectDef.extensions ) {

		if ( knownExtensions[ name ] === undefined ) {

			object.userData.gltfExtensions = object.userData.gltfExtensions || {};
			object.userData.gltfExtensions[ name ] = objectDef.extensions[ name ];

		}

	}

}

/**
 * @param {Object3D|Material|BufferGeometry} object
 * @param {GLTF.definition} gltfDef
 */
function assignExtrasToUserData( object, gltfDef ) {

	if ( gltfDef.extras !== undefined ) {

		if ( typeof gltfDef.extras === 'object' ) {

			Object.assign( object.userData, gltfDef.extras );

		} else {

			console.warn( 'THREE.GLTFLoader: Ignoring primitive type .extras, ' + gltfDef.extras );

		}

	}

}

/**
 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#morph-targets
 *
 * @param {BufferGeometry} geometry
 * @param {Array<GLTF.Target>} targets
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addMorphTargets( geometry, targets, parser ) {

	let hasMorphPosition = false;
	let hasMorphNormal = false;
	let hasMorphColor = false;

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( target.POSITION !== undefined ) hasMorphPosition = true;
		if ( target.NORMAL !== undefined ) hasMorphNormal = true;
		if ( target.COLOR_0 !== undefined ) hasMorphColor = true;

		if ( hasMorphPosition && hasMorphNormal && hasMorphColor ) break;

	}

	if ( ! hasMorphPosition && ! hasMorphNormal && ! hasMorphColor ) return Promise.resolve( geometry );

	const pendingPositionAccessors = [];
	const pendingNormalAccessors = [];
	const pendingColorAccessors = [];

	for ( let i = 0, il = targets.length; i < il; i ++ ) {

		const target = targets[ i ];

		if ( hasMorphPosition ) {

			const pendingAccessor = target.POSITION !== undefined
				? parser.getDependency( 'accessor', target.POSITION )
				: geometry.attributes.position;

			pendingPositionAccessors.push( pendingAccessor );

		}

		if ( hasMorphNormal ) {

			const pendingAccessor = target.NORMAL !== undefined
				? parser.getDependency( 'accessor', target.NORMAL )
				: geometry.attributes.normal;

			pendingNormalAccessors.push( pendingAccessor );

		}

		if ( hasMorphColor ) {

			const pendingAccessor = target.COLOR_0 !== undefined
				? parser.getDependency( 'accessor', target.COLOR_0 )
				: geometry.attributes.color;

			pendingColorAccessors.push( pendingAccessor );

		}

	}

	return Promise.all( [
		Promise.all( pendingPositionAccessors ),
		Promise.all( pendingNormalAccessors ),
		Promise.all( pendingColorAccessors )
	] ).then( function ( accessors ) {

		const morphPositions = accessors[ 0 ];
		const morphNormals = accessors[ 1 ];
		const morphColors = accessors[ 2 ];

		if ( hasMorphPosition ) geometry.morphAttributes.position = morphPositions;
		if ( hasMorphNormal ) geometry.morphAttributes.normal = morphNormals;
		if ( hasMorphColor ) geometry.morphAttributes.color = morphColors;
		geometry.morphTargetsRelative = true;

		return geometry;

	} );

}

/**
 * @param {Mesh} mesh
 * @param {GLTF.Mesh} meshDef
 */
function updateMorphTargets( mesh, meshDef ) {

	mesh.updateMorphTargets();

	if ( meshDef.weights !== undefined ) {

		for ( let i = 0, il = meshDef.weights.length; i < il; i ++ ) {

			mesh.morphTargetInfluences[ i ] = meshDef.weights[ i ];

		}

	}

	// .extras has user-defined data, so check that .extras.targetNames is an array.
	if ( meshDef.extras && Array.isArray( meshDef.extras.targetNames ) ) {

		const targetNames = meshDef.extras.targetNames;

		if ( mesh.morphTargetInfluences.length === targetNames.length ) {

			mesh.morphTargetDictionary = {};

			for ( let i = 0, il = targetNames.length; i < il; i ++ ) {

				mesh.morphTargetDictionary[ targetNames[ i ] ] = i;

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Invalid extras.targetNames length. Ignoring names.' );

		}

	}

}

function createPrimitiveKey( primitiveDef ) {

	const dracoExtension = primitiveDef.extensions && primitiveDef.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ];
	let geometryKey;

	if ( dracoExtension ) {

		geometryKey = 'draco:' + dracoExtension.bufferView
				+ ':' + dracoExtension.indices
				+ ':' + createAttributesKey( dracoExtension.attributes );

	} else {

		geometryKey = primitiveDef.indices + ':' + createAttributesKey( primitiveDef.attributes ) + ':' + primitiveDef.mode;

	}

	return geometryKey;

}

function createAttributesKey( attributes ) {

	let attributesKey = '';

	const keys = Object.keys( attributes ).sort();

	for ( let i = 0, il = keys.length; i < il; i ++ ) {

		attributesKey += keys[ i ] + ':' + attributes[ keys[ i ] ] + ';';

	}

	return attributesKey;

}

function getNormalizedComponentScale( constructor ) {

	// Reference:
	// https://github.com/KhronosGroup/glTF/tree/master/extensions/2.0/Khronos/KHR_mesh_quantization#encoding-quantized-data

	switch ( constructor ) {

		case Int8Array:
			return 1 / 127;

		case Uint8Array:
			return 1 / 255;

		case Int16Array:
			return 1 / 32767;

		case Uint16Array:
			return 1 / 65535;

		default:
			throw new Error( 'THREE.GLTFLoader: Unsupported normalized accessor component type.' );

	}

}

function getImageURIMimeType( uri ) {

	if ( uri.search( /\.jpe?g($|\?)/i ) > 0 || uri.search( /^data\:image\/jpeg/ ) === 0 ) return 'image/jpeg';
	if ( uri.search( /\.webp($|\?)/i ) > 0 || uri.search( /^data\:image\/webp/ ) === 0 ) return 'image/webp';

	return 'image/png';

}

const _identityMatrix = new Matrix4();

/* GLTF PARSER */

class GLTFParser {

	constructor( json = {}, options = {} ) {

		this.json = json;
		this.extensions = {};
		this.plugins = {};
		this.options = options;

		// loader object cache
		this.cache = new GLTFRegistry();

		// associations between Three.js objects and glTF elements
		this.associations = new Map();

		// BufferGeometry caching
		this.primitiveCache = {};

		// Object3D instance caches
		this.meshCache = { refs: {}, uses: {} };
		this.cameraCache = { refs: {}, uses: {} };
		this.lightCache = { refs: {}, uses: {} };

		this.sourceCache = {};
		this.textureCache = {};

		// Track node names, to ensure no duplicates
		this.nodeNamesUsed = {};

		// Use an ImageBitmapLoader if imageBitmaps are supported. Moves much of the
		// expensive work of uploading a texture to the GPU off the main thread.

		let isSafari = false;
		let isFirefox = false;
		let firefoxVersion = - 1;

		if ( typeof navigator !== 'undefined' ) {

			isSafari = /^((?!chrome|android).)*safari/i.test( navigator.userAgent ) === true;
			isFirefox = navigator.userAgent.indexOf( 'Firefox' ) > - 1;
			firefoxVersion = isFirefox ? navigator.userAgent.match( /Firefox\/([0-9]+)\./ )[ 1 ] : - 1;

		}

		if ( typeof createImageBitmap === 'undefined' || isSafari || ( isFirefox && firefoxVersion < 98 ) ) {

			this.textureLoader = new TextureLoader( this.options.manager );

		} else {

			this.textureLoader = new ImageBitmapLoader( this.options.manager );

		}

		this.textureLoader.setCrossOrigin( this.options.crossOrigin );
		this.textureLoader.setRequestHeader( this.options.requestHeader );

		this.fileLoader = new FileLoader( this.options.manager );
		this.fileLoader.setResponseType( 'arraybuffer' );

		if ( this.options.crossOrigin === 'use-credentials' ) {

			this.fileLoader.setWithCredentials( true );

		}

	}

	setExtensions( extensions ) {

		this.extensions = extensions;

	}

	setPlugins( plugins ) {

		this.plugins = plugins;

	}

	parse( onLoad, onError ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		// Clear the loader cache
		this.cache.removeAll();

		// Mark the special nodes/meshes in json for efficient parse
		this._invokeAll( function ( ext ) {

			return ext._markDefs && ext._markDefs();

		} );

		Promise.all( this._invokeAll( function ( ext ) {

			return ext.beforeRoot && ext.beforeRoot();

		} ) ).then( function () {

			return Promise.all( [

				parser.getDependencies( 'scene' ),
				parser.getDependencies( 'animation' ),
				parser.getDependencies( 'camera' ),

			] );

		} ).then( function ( dependencies ) {

			const result = {
				scene: dependencies[ 0 ][ json.scene || 0 ],
				scenes: dependencies[ 0 ],
				animations: dependencies[ 1 ],
				cameras: dependencies[ 2 ],
				asset: json.asset,
				parser: parser,
				userData: {}
			};

			addUnknownExtensionsToUserData( extensions, result, json );

			assignExtrasToUserData( result, json );

			Promise.all( parser._invokeAll( function ( ext ) {

				return ext.afterRoot && ext.afterRoot( result );

			} ) ).then( function () {

				onLoad( result );

			} );

		} ).catch( onError );

	}

	/**
	 * Marks the special nodes/meshes in json for efficient parse.
	 */
	_markDefs() {

		const nodeDefs = this.json.nodes || [];
		const skinDefs = this.json.skins || [];
		const meshDefs = this.json.meshes || [];

		// Nothing in the node definition indicates whether it is a Bone or an
		// Object3D. Use the skins' joint references to mark bones.
		for ( let skinIndex = 0, skinLength = skinDefs.length; skinIndex < skinLength; skinIndex ++ ) {

			const joints = skinDefs[ skinIndex ].joints;

			for ( let i = 0, il = joints.length; i < il; i ++ ) {

				nodeDefs[ joints[ i ] ].isBone = true;

			}

		}

		// Iterate over all nodes, marking references to shared resources,
		// as well as skeleton joints.
		for ( let nodeIndex = 0, nodeLength = nodeDefs.length; nodeIndex < nodeLength; nodeIndex ++ ) {

			const nodeDef = nodeDefs[ nodeIndex ];

			if ( nodeDef.mesh !== undefined ) {

				this._addNodeRef( this.meshCache, nodeDef.mesh );

				// Nothing in the mesh definition indicates whether it is
				// a SkinnedMesh or Mesh. Use the node's mesh reference
				// to mark SkinnedMesh if node has skin.
				if ( nodeDef.skin !== undefined ) {

					meshDefs[ nodeDef.mesh ].isSkinnedMesh = true;

				}

			}

			if ( nodeDef.camera !== undefined ) {

				this._addNodeRef( this.cameraCache, nodeDef.camera );

			}

		}

	}

	/**
	 * Counts references to shared node / Object3D resources. These resources
	 * can be reused, or "instantiated", at multiple nodes in the scene
	 * hierarchy. Mesh, Camera, and Light instances are instantiated and must
	 * be marked. Non-scenegraph resources (like Materials, Geometries, and
	 * Textures) can be reused directly and are not marked here.
	 *
	 * Example: CesiumMilkTruck sample model reuses "Wheel" meshes.
	 */
	_addNodeRef( cache, index ) {

		if ( index === undefined ) return;

		if ( cache.refs[ index ] === undefined ) {

			cache.refs[ index ] = cache.uses[ index ] = 0;

		}

		cache.refs[ index ] ++;

	}

	/** Returns a reference to a shared resource, cloning it if necessary. */
	_getNodeRef( cache, index, object ) {

		if ( cache.refs[ index ] <= 1 ) return object;

		const ref = object.clone();

		// Propagates mappings to the cloned object, prevents mappings on the
		// original object from being lost.
		const updateMappings = ( original, clone ) => {

			const mappings = this.associations.get( original );
			if ( mappings != null ) {

				this.associations.set( clone, mappings );

			}

			for ( const [ i, child ] of original.children.entries() ) {

				updateMappings( child, clone.children[ i ] );

			}

		};

		updateMappings( object, ref );

		ref.name += '_instance_' + ( cache.uses[ index ] ++ );

		return ref;

	}

	_invokeOne( func ) {

		const extensions = Object.values( this.plugins );
		extensions.push( this );

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) return result;

		}

		return null;

	}

	_invokeAll( func ) {

		const extensions = Object.values( this.plugins );
		extensions.unshift( this );

		const pending = [];

		for ( let i = 0; i < extensions.length; i ++ ) {

			const result = func( extensions[ i ] );

			if ( result ) pending.push( result );

		}

		return pending;

	}

	/**
	 * Requests the specified dependency asynchronously, with caching.
	 * @param {string} type
	 * @param {number} index
	 * @return {Promise<Object3D|Material|THREE.Texture|AnimationClip|ArrayBuffer|Object>}
	 */
	getDependency( type, index ) {

		const cacheKey = type + ':' + index;
		let dependency = this.cache.get( cacheKey );

		if ( ! dependency ) {

			switch ( type ) {

				case 'scene':
					dependency = this.loadScene( index );
					break;

				case 'node':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadNode && ext.loadNode( index );

					} );
					break;

				case 'mesh':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMesh && ext.loadMesh( index );

					} );
					break;

				case 'accessor':
					dependency = this.loadAccessor( index );
					break;

				case 'bufferView':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadBufferView && ext.loadBufferView( index );

					} );
					break;

				case 'buffer':
					dependency = this.loadBuffer( index );
					break;

				case 'material':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadMaterial && ext.loadMaterial( index );

					} );
					break;

				case 'texture':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadTexture && ext.loadTexture( index );

					} );
					break;

				case 'skin':
					dependency = this.loadSkin( index );
					break;

				case 'animation':
					dependency = this._invokeOne( function ( ext ) {

						return ext.loadAnimation && ext.loadAnimation( index );

					} );
					break;

				case 'camera':
					dependency = this.loadCamera( index );
					break;

				default:
					dependency = this._invokeOne( function ( ext ) {

						return ext != this && ext.getDependency && ext.getDependency( type, index );

					} );

					if ( ! dependency ) {

						throw new Error( 'Unknown type: ' + type );

					}

					break;

			}

			this.cache.add( cacheKey, dependency );

		}

		return dependency;

	}

	/**
	 * Requests all dependencies of the specified type asynchronously, with caching.
	 * @param {string} type
	 * @return {Promise<Array<Object>>}
	 */
	getDependencies( type ) {

		let dependencies = this.cache.get( type );

		if ( ! dependencies ) {

			const parser = this;
			const defs = this.json[ type + ( type === 'mesh' ? 'es' : 's' ) ] || [];

			dependencies = Promise.all( defs.map( function ( def, index ) {

				return parser.getDependency( type, index );

			} ) );

			this.cache.add( type, dependencies );

		}

		return dependencies;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBuffer( bufferIndex ) {

		const bufferDef = this.json.buffers[ bufferIndex ];
		const loader = this.fileLoader;

		if ( bufferDef.type && bufferDef.type !== 'arraybuffer' ) {

			throw new Error( 'THREE.GLTFLoader: ' + bufferDef.type + ' buffer type is not supported.' );

		}

		// If present, GLB container is required to be the first buffer.
		if ( bufferDef.uri === undefined && bufferIndex === 0 ) {

			return Promise.resolve( this.extensions[ EXTENSIONS.KHR_BINARY_GLTF ].body );

		}

		const options = this.options;

		return new Promise( function ( resolve, reject ) {

			loader.load( LoaderUtils.resolveURL( bufferDef.uri, options.path ), resolve, undefined, function () {

				reject( new Error( 'THREE.GLTFLoader: Failed to load buffer "' + bufferDef.uri + '".' ) );

			} );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#buffers-and-buffer-views
	 * @param {number} bufferViewIndex
	 * @return {Promise<ArrayBuffer>}
	 */
	loadBufferView( bufferViewIndex ) {

		const bufferViewDef = this.json.bufferViews[ bufferViewIndex ];

		return this.getDependency( 'buffer', bufferViewDef.buffer ).then( function ( buffer ) {

			const byteLength = bufferViewDef.byteLength || 0;
			const byteOffset = bufferViewDef.byteOffset || 0;
			return buffer.slice( byteOffset, byteOffset + byteLength );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#accessors
	 * @param {number} accessorIndex
	 * @return {Promise<BufferAttribute|InterleavedBufferAttribute>}
	 */
	loadAccessor( accessorIndex ) {

		const parser = this;
		const json = this.json;

		const accessorDef = this.json.accessors[ accessorIndex ];

		if ( accessorDef.bufferView === undefined && accessorDef.sparse === undefined ) {

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];
			const normalized = accessorDef.normalized === true;

			const array = new TypedArray( accessorDef.count * itemSize );
			return Promise.resolve( new BufferAttribute( array, itemSize, normalized ) );

		}

		const pendingBufferViews = [];

		if ( accessorDef.bufferView !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.bufferView ) );

		} else {

			pendingBufferViews.push( null );

		}

		if ( accessorDef.sparse !== undefined ) {

			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.indices.bufferView ) );
			pendingBufferViews.push( this.getDependency( 'bufferView', accessorDef.sparse.values.bufferView ) );

		}

		return Promise.all( pendingBufferViews ).then( function ( bufferViews ) {

			const bufferView = bufferViews[ 0 ];

			const itemSize = WEBGL_TYPE_SIZES[ accessorDef.type ];
			const TypedArray = WEBGL_COMPONENT_TYPES[ accessorDef.componentType ];

			// For VEC3: itemSize is 3, elementBytes is 4, itemBytes is 12.
			const elementBytes = TypedArray.BYTES_PER_ELEMENT;
			const itemBytes = elementBytes * itemSize;
			const byteOffset = accessorDef.byteOffset || 0;
			const byteStride = accessorDef.bufferView !== undefined ? json.bufferViews[ accessorDef.bufferView ].byteStride : undefined;
			const normalized = accessorDef.normalized === true;
			let array, bufferAttribute;

			// The buffer is not interleaved if the stride is the item size in bytes.
			if ( byteStride && byteStride !== itemBytes ) {

				// Each "slice" of the buffer, as defined by 'count' elements of 'byteStride' bytes, gets its own InterleavedBuffer
				// This makes sure that IBA.count reflects accessor.count properly
				const ibSlice = Math.floor( byteOffset / byteStride );
				const ibCacheKey = 'InterleavedBuffer:' + accessorDef.bufferView + ':' + accessorDef.componentType + ':' + ibSlice + ':' + accessorDef.count;
				let ib = parser.cache.get( ibCacheKey );

				if ( ! ib ) {

					array = new TypedArray( bufferView, ibSlice * byteStride, accessorDef.count * byteStride / elementBytes );

					// Integer parameters to IB/IBA are in array elements, not bytes.
					ib = new InterleavedBuffer( array, byteStride / elementBytes );

					parser.cache.add( ibCacheKey, ib );

				}

				bufferAttribute = new InterleavedBufferAttribute( ib, itemSize, ( byteOffset % byteStride ) / elementBytes, normalized );

			} else {

				if ( bufferView === null ) {

					array = new TypedArray( accessorDef.count * itemSize );

				} else {

					array = new TypedArray( bufferView, byteOffset, accessorDef.count * itemSize );

				}

				bufferAttribute = new BufferAttribute( array, itemSize, normalized );

			}

			// https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#sparse-accessors
			if ( accessorDef.sparse !== undefined ) {

				const itemSizeIndices = WEBGL_TYPE_SIZES.SCALAR;
				const TypedArrayIndices = WEBGL_COMPONENT_TYPES[ accessorDef.sparse.indices.componentType ];

				const byteOffsetIndices = accessorDef.sparse.indices.byteOffset || 0;
				const byteOffsetValues = accessorDef.sparse.values.byteOffset || 0;

				const sparseIndices = new TypedArrayIndices( bufferViews[ 1 ], byteOffsetIndices, accessorDef.sparse.count * itemSizeIndices );
				const sparseValues = new TypedArray( bufferViews[ 2 ], byteOffsetValues, accessorDef.sparse.count * itemSize );

				if ( bufferView !== null ) {

					// Avoid modifying the original ArrayBuffer, if the bufferView wasn't initialized with zeroes.
					bufferAttribute = new BufferAttribute( bufferAttribute.array.slice(), bufferAttribute.itemSize, bufferAttribute.normalized );

				}

				for ( let i = 0, il = sparseIndices.length; i < il; i ++ ) {

					const index = sparseIndices[ i ];

					bufferAttribute.setX( index, sparseValues[ i * itemSize ] );
					if ( itemSize >= 2 ) bufferAttribute.setY( index, sparseValues[ i * itemSize + 1 ] );
					if ( itemSize >= 3 ) bufferAttribute.setZ( index, sparseValues[ i * itemSize + 2 ] );
					if ( itemSize >= 4 ) bufferAttribute.setW( index, sparseValues[ i * itemSize + 3 ] );
					if ( itemSize >= 5 ) throw new Error( 'THREE.GLTFLoader: Unsupported itemSize in sparse BufferAttribute.' );

				}

			}

			return bufferAttribute;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#textures
	 * @param {number} textureIndex
	 * @return {Promise<THREE.Texture|null>}
	 */
	loadTexture( textureIndex ) {

		const json = this.json;
		const options = this.options;
		const textureDef = json.textures[ textureIndex ];
		const sourceIndex = textureDef.source;
		const sourceDef = json.images[ sourceIndex ];

		let loader = this.textureLoader;

		if ( sourceDef.uri ) {

			const handler = options.manager.getHandler( sourceDef.uri );
			if ( handler !== null ) loader = handler;

		}

		return this.loadTextureImage( textureIndex, sourceIndex, loader );

	}

	loadTextureImage( textureIndex, sourceIndex, loader ) {

		const parser = this;
		const json = this.json;

		const textureDef = json.textures[ textureIndex ];
		const sourceDef = json.images[ sourceIndex ];

		const cacheKey = ( sourceDef.uri || sourceDef.bufferView ) + ':' + textureDef.sampler;

		if ( this.textureCache[ cacheKey ] ) {

			// See https://github.com/mrdoob/three.js/issues/21559.
			return this.textureCache[ cacheKey ];

		}

		const promise = this.loadImageSource( sourceIndex, loader ).then( function ( texture ) {

			texture.flipY = false;

			texture.name = textureDef.name || sourceDef.name || '';

			const samplers = json.samplers || {};
			const sampler = samplers[ textureDef.sampler ] || {};

			texture.magFilter = WEBGL_FILTERS[ sampler.magFilter ] || LinearFilter;
			texture.minFilter = WEBGL_FILTERS[ sampler.minFilter ] || LinearMipmapLinearFilter;
			texture.wrapS = WEBGL_WRAPPINGS[ sampler.wrapS ] || RepeatWrapping;
			texture.wrapT = WEBGL_WRAPPINGS[ sampler.wrapT ] || RepeatWrapping;

			parser.associations.set( texture, { textures: textureIndex } );

			return texture;

		} ).catch( function () {

			return null;

		} );

		this.textureCache[ cacheKey ] = promise;

		return promise;

	}

	loadImageSource( sourceIndex, loader ) {

		const parser = this;
		const json = this.json;
		const options = this.options;

		if ( this.sourceCache[ sourceIndex ] !== undefined ) {

			return this.sourceCache[ sourceIndex ].then( ( texture ) => texture.clone() );

		}

		const sourceDef = json.images[ sourceIndex ];

		const URL = self.URL || self.webkitURL;

		let sourceURI = sourceDef.uri || '';
		let isObjectURL = false;

		if ( sourceDef.bufferView !== undefined ) {

			// Load binary image data from bufferView, if provided.

			sourceURI = parser.getDependency( 'bufferView', sourceDef.bufferView ).then( function ( bufferView ) {

				isObjectURL = true;
				const blob = new Blob( [ bufferView ], { type: sourceDef.mimeType } );
				sourceURI = URL.createObjectURL( blob );
				return sourceURI;

			} );

		} else if ( sourceDef.uri === undefined ) {

			throw new Error( 'THREE.GLTFLoader: Image ' + sourceIndex + ' is missing URI and bufferView' );

		}

		const promise = Promise.resolve( sourceURI ).then( function ( sourceURI ) {

			return new Promise( function ( resolve, reject ) {

				let onLoad = resolve;

				if ( loader.isImageBitmapLoader === true ) {

					onLoad = function ( imageBitmap ) {

						const texture = new Texture( imageBitmap );
						texture.needsUpdate = true;

						resolve( texture );

					};

				}

				loader.load( LoaderUtils.resolveURL( sourceURI, options.path ), onLoad, undefined, reject );

			} );

		} ).then( function ( texture ) {

			// Clean up resources and configure Texture.

			if ( isObjectURL === true ) {

				URL.revokeObjectURL( sourceURI );

			}

			texture.userData.mimeType = sourceDef.mimeType || getImageURIMimeType( sourceDef.uri );

			return texture;

		} ).catch( function ( error ) {

			console.error( 'THREE.GLTFLoader: Couldn\'t load texture', sourceURI );
			throw error;

		} );

		this.sourceCache[ sourceIndex ] = promise;
		return promise;

	}

	/**
	 * Asynchronously assigns a texture to the given material parameters.
	 * @param {Object} materialParams
	 * @param {string} mapName
	 * @param {Object} mapDef
	 * @return {Promise<Texture>}
	 */
	assignTexture( materialParams, mapName, mapDef, encoding ) {

		const parser = this;

		return this.getDependency( 'texture', mapDef.index ).then( function ( texture ) {

			if ( ! texture ) return null;

			// Materials sample aoMap from UV set 1 and other maps from UV set 0 - this can't be configured
			// However, we will copy UV set 0 to UV set 1 on demand for aoMap
			if ( mapDef.texCoord !== undefined && mapDef.texCoord != 0 && ! ( mapName === 'aoMap' && mapDef.texCoord == 1 ) ) {

				console.warn( 'THREE.GLTFLoader: Custom UV set ' + mapDef.texCoord + ' for texture ' + mapName + ' not yet supported.' );

			}

			if ( parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] ) {

				const transform = mapDef.extensions !== undefined ? mapDef.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ] : undefined;

				if ( transform ) {

					const gltfReference = parser.associations.get( texture );
					texture = parser.extensions[ EXTENSIONS.KHR_TEXTURE_TRANSFORM ].extendTexture( texture, transform );
					parser.associations.set( texture, gltfReference );

				}

			}

			if ( encoding !== undefined ) {

				texture.encoding = encoding;

			}

			materialParams[ mapName ] = texture;

			return texture;

		} );

	}

	/**
	 * Assigns final material to a Mesh, Line, or Points instance. The instance
	 * already has a material (generated from the glTF material options alone)
	 * but reuse of the same glTF material may require multiple threejs materials
	 * to accommodate different primitive types, defines, etc. New materials will
	 * be created if necessary, and reused from a cache.
	 * @param  {Object3D} mesh Mesh, Line, or Points instance.
	 */
	assignFinalMaterial( mesh ) {

		const geometry = mesh.geometry;
		let material = mesh.material;

		const useDerivativeTangents = geometry.attributes.tangent === undefined;
		const useVertexColors = geometry.attributes.color !== undefined;
		const useFlatShading = geometry.attributes.normal === undefined;

		if ( mesh.isPoints ) {

			const cacheKey = 'PointsMaterial:' + material.uuid;

			let pointsMaterial = this.cache.get( cacheKey );

			if ( ! pointsMaterial ) {

				pointsMaterial = new PointsMaterial();
				Material.prototype.copy.call( pointsMaterial, material );
				pointsMaterial.color.copy( material.color );
				pointsMaterial.map = material.map;
				pointsMaterial.sizeAttenuation = false; // glTF spec says points should be 1px

				this.cache.add( cacheKey, pointsMaterial );

			}

			material = pointsMaterial;

		} else if ( mesh.isLine ) {

			const cacheKey = 'LineBasicMaterial:' + material.uuid;

			let lineMaterial = this.cache.get( cacheKey );

			if ( ! lineMaterial ) {

				lineMaterial = new LineBasicMaterial();
				Material.prototype.copy.call( lineMaterial, material );
				lineMaterial.color.copy( material.color );

				this.cache.add( cacheKey, lineMaterial );

			}

			material = lineMaterial;

		}

		// Clone the material if it will be modified
		if ( useDerivativeTangents || useVertexColors || useFlatShading ) {

			let cacheKey = 'ClonedMaterial:' + material.uuid + ':';

			if ( useDerivativeTangents ) cacheKey += 'derivative-tangents:';
			if ( useVertexColors ) cacheKey += 'vertex-colors:';
			if ( useFlatShading ) cacheKey += 'flat-shading:';

			let cachedMaterial = this.cache.get( cacheKey );

			if ( ! cachedMaterial ) {

				cachedMaterial = material.clone();

				if ( useVertexColors ) cachedMaterial.vertexColors = true;
				if ( useFlatShading ) cachedMaterial.flatShading = true;

				if ( useDerivativeTangents ) {

					// https://github.com/mrdoob/three.js/issues/11438#issuecomment-507003995
					if ( cachedMaterial.normalScale ) cachedMaterial.normalScale.y *= - 1;
					if ( cachedMaterial.clearcoatNormalScale ) cachedMaterial.clearcoatNormalScale.y *= - 1;

				}

				this.cache.add( cacheKey, cachedMaterial );

				this.associations.set( cachedMaterial, this.associations.get( material ) );

			}

			material = cachedMaterial;

		}

		// workarounds for mesh and geometry

		if ( material.aoMap && geometry.attributes.uv2 === undefined && geometry.attributes.uv !== undefined ) {

			geometry.setAttribute( 'uv2', geometry.attributes.uv );

		}

		mesh.material = material;

	}

	getMaterialType( /* materialIndex */ ) {

		return MeshStandardMaterial;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#materials
	 * @param {number} materialIndex
	 * @return {Promise<Material>}
	 */
	loadMaterial( materialIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;
		const materialDef = json.materials[ materialIndex ];

		let materialType;
		const materialParams = {};
		const materialExtensions = materialDef.extensions || {};

		const pending = [];

		if ( materialExtensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ] ) {

			const kmuExtension = extensions[ EXTENSIONS.KHR_MATERIALS_UNLIT ];
			materialType = kmuExtension.getMaterialType();
			pending.push( kmuExtension.extendParams( materialParams, materialDef, parser ) );

		} else {

			// Specification:
			// https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#metallic-roughness-material

			const metallicRoughness = materialDef.pbrMetallicRoughness || {};

			materialParams.color = new Color( 1.0, 1.0, 1.0 );
			materialParams.opacity = 1.0;

			if ( Array.isArray( metallicRoughness.baseColorFactor ) ) {

				const array = metallicRoughness.baseColorFactor;

				materialParams.color.fromArray( array );
				materialParams.opacity = array[ 3 ];

			}

			if ( metallicRoughness.baseColorTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'map', metallicRoughness.baseColorTexture, sRGBEncoding ) );

			}

			materialParams.metalness = metallicRoughness.metallicFactor !== undefined ? metallicRoughness.metallicFactor : 1.0;
			materialParams.roughness = metallicRoughness.roughnessFactor !== undefined ? metallicRoughness.roughnessFactor : 1.0;

			if ( metallicRoughness.metallicRoughnessTexture !== undefined ) {

				pending.push( parser.assignTexture( materialParams, 'metalnessMap', metallicRoughness.metallicRoughnessTexture ) );
				pending.push( parser.assignTexture( materialParams, 'roughnessMap', metallicRoughness.metallicRoughnessTexture ) );

			}

			materialType = this._invokeOne( function ( ext ) {

				return ext.getMaterialType && ext.getMaterialType( materialIndex );

			} );

			pending.push( Promise.all( this._invokeAll( function ( ext ) {

				return ext.extendMaterialParams && ext.extendMaterialParams( materialIndex, materialParams );

			} ) ) );

		}

		if ( materialDef.doubleSided === true ) {

			materialParams.side = DoubleSide;

		}

		const alphaMode = materialDef.alphaMode || ALPHA_MODES.OPAQUE;

		if ( alphaMode === ALPHA_MODES.BLEND ) {

			materialParams.transparent = true;

			// See: https://github.com/mrdoob/three.js/issues/17706
			materialParams.depthWrite = false;

		} else {

			materialParams.transparent = false;

			if ( alphaMode === ALPHA_MODES.MASK ) {

				materialParams.alphaTest = materialDef.alphaCutoff !== undefined ? materialDef.alphaCutoff : 0.5;

			}

		}

		if ( materialDef.normalTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'normalMap', materialDef.normalTexture ) );

			materialParams.normalScale = new Vector2( 1, 1 );

			if ( materialDef.normalTexture.scale !== undefined ) {

				const scale = materialDef.normalTexture.scale;

				materialParams.normalScale.set( scale, scale );

			}

		}

		if ( materialDef.occlusionTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'aoMap', materialDef.occlusionTexture ) );

			if ( materialDef.occlusionTexture.strength !== undefined ) {

				materialParams.aoMapIntensity = materialDef.occlusionTexture.strength;

			}

		}

		if ( materialDef.emissiveFactor !== undefined && materialType !== MeshBasicMaterial ) {

			materialParams.emissive = new Color().fromArray( materialDef.emissiveFactor );

		}

		if ( materialDef.emissiveTexture !== undefined && materialType !== MeshBasicMaterial ) {

			pending.push( parser.assignTexture( materialParams, 'emissiveMap', materialDef.emissiveTexture, sRGBEncoding ) );

		}

		return Promise.all( pending ).then( function () {

			const material = new materialType( materialParams );

			if ( materialDef.name ) material.name = materialDef.name;

			assignExtrasToUserData( material, materialDef );

			parser.associations.set( material, { materials: materialIndex } );

			if ( materialDef.extensions ) addUnknownExtensionsToUserData( extensions, material, materialDef );

			return material;

		} );

	}

	/** When Object3D instances are targeted by animation, they need unique names. */
	createUniqueName( originalName ) {

		const sanitizedName = PropertyBinding.sanitizeNodeName( originalName || '' );

		let name = sanitizedName;

		for ( let i = 1; this.nodeNamesUsed[ name ]; ++ i ) {

			name = sanitizedName + '_' + i;

		}

		this.nodeNamesUsed[ name ] = true;

		return name;

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#geometry
	 *
	 * Creates BufferGeometries from primitives.
	 *
	 * @param {Array<GLTF.Primitive>} primitives
	 * @return {Promise<Array<BufferGeometry>>}
	 */
	loadGeometries( primitives ) {

		const parser = this;
		const extensions = this.extensions;
		const cache = this.primitiveCache;

		function createDracoPrimitive( primitive ) {

			return extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ]
				.decodePrimitive( primitive, parser )
				.then( function ( geometry ) {

					return addPrimitiveAttributes( geometry, primitive, parser );

				} );

		}

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const primitive = primitives[ i ];
			const cacheKey = createPrimitiveKey( primitive );

			// See if we've already created this geometry
			const cached = cache[ cacheKey ];

			if ( cached ) {

				// Use the cached geometry if it exists
				pending.push( cached.promise );

			} else {

				let geometryPromise;

				if ( primitive.extensions && primitive.extensions[ EXTENSIONS.KHR_DRACO_MESH_COMPRESSION ] ) {

					// Use DRACO geometry if available
					geometryPromise = createDracoPrimitive( primitive );

				} else {

					// Otherwise create a new geometry
					geometryPromise = addPrimitiveAttributes( new BufferGeometry(), primitive, parser );

				}

				// Cache this geometry
				cache[ cacheKey ] = { primitive: primitive, promise: geometryPromise };

				pending.push( geometryPromise );

			}

		}

		return Promise.all( pending );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/blob/master/specification/2.0/README.md#meshes
	 * @param {number} meshIndex
	 * @return {Promise<Group|Mesh|SkinnedMesh>}
	 */
	loadMesh( meshIndex ) {

		const parser = this;
		const json = this.json;
		const extensions = this.extensions;

		const meshDef = json.meshes[ meshIndex ];
		const primitives = meshDef.primitives;

		const pending = [];

		for ( let i = 0, il = primitives.length; i < il; i ++ ) {

			const material = primitives[ i ].material === undefined
				? createDefaultMaterial( this.cache )
				: this.getDependency( 'material', primitives[ i ].material );

			pending.push( material );

		}

		pending.push( parser.loadGeometries( primitives ) );

		return Promise.all( pending ).then( function ( results ) {

			const materials = results.slice( 0, results.length - 1 );
			const geometries = results[ results.length - 1 ];

			const meshes = [];

			for ( let i = 0, il = geometries.length; i < il; i ++ ) {

				const geometry = geometries[ i ];
				const primitive = primitives[ i ];

				// 1. create Mesh

				let mesh;

				const material = materials[ i ];

				if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLES ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ||
						primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ||
						primitive.mode === undefined ) {

					// .isSkinnedMesh isn't in glTF spec. See ._markDefs()
					mesh = meshDef.isSkinnedMesh === true
						? new SkinnedMesh( geometry, material )
						: new Mesh( geometry, material );

					if ( mesh.isSkinnedMesh === true && ! mesh.geometry.attributes.skinWeight.normalized ) {

						// we normalize floating point skin weight array to fix malformed assets (see #15319)
						// it's important to skip this for non-float32 data since normalizeSkinWeights assumes non-normalized inputs
						mesh.normalizeSkinWeights();

					}

					if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_STRIP ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleStripDrawMode );

					} else if ( primitive.mode === WEBGL_CONSTANTS.TRIANGLE_FAN ) {

						mesh.geometry = toTrianglesDrawMode( mesh.geometry, TriangleFanDrawMode );

					}

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINES ) {

					mesh = new LineSegments( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_STRIP ) {

					mesh = new Line( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.LINE_LOOP ) {

					mesh = new LineLoop( geometry, material );

				} else if ( primitive.mode === WEBGL_CONSTANTS.POINTS ) {

					mesh = new Points( geometry, material );

				} else {

					throw new Error( 'THREE.GLTFLoader: Primitive mode unsupported: ' + primitive.mode );

				}

				if ( Object.keys( mesh.geometry.morphAttributes ).length > 0 ) {

					updateMorphTargets( mesh, meshDef );

				}

				mesh.name = parser.createUniqueName( meshDef.name || ( 'mesh_' + meshIndex ) );

				assignExtrasToUserData( mesh, meshDef );

				if ( primitive.extensions ) addUnknownExtensionsToUserData( extensions, mesh, primitive );

				parser.assignFinalMaterial( mesh );

				meshes.push( mesh );

			}

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				parser.associations.set( meshes[ i ], {
					meshes: meshIndex,
					primitives: i
				} );

			}

			if ( meshes.length === 1 ) {

				return meshes[ 0 ];

			}

			const group = new Group();

			parser.associations.set( group, { meshes: meshIndex } );

			for ( let i = 0, il = meshes.length; i < il; i ++ ) {

				group.add( meshes[ i ] );

			}

			return group;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#cameras
	 * @param {number} cameraIndex
	 * @return {Promise<THREE.Camera>}
	 */
	loadCamera( cameraIndex ) {

		let camera;
		const cameraDef = this.json.cameras[ cameraIndex ];
		const params = cameraDef[ cameraDef.type ];

		if ( ! params ) {

			console.warn( 'THREE.GLTFLoader: Missing camera parameters.' );
			return;

		}

		if ( cameraDef.type === 'perspective' ) {

			camera = new PerspectiveCamera( MathUtils.radToDeg( params.yfov ), params.aspectRatio || 1, params.znear || 1, params.zfar || 2e6 );

		} else if ( cameraDef.type === 'orthographic' ) {

			camera = new OrthographicCamera( - params.xmag, params.xmag, params.ymag, - params.ymag, params.znear, params.zfar );

		}

		if ( cameraDef.name ) camera.name = this.createUniqueName( cameraDef.name );

		assignExtrasToUserData( camera, cameraDef );

		return Promise.resolve( camera );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#skins
	 * @param {number} skinIndex
	 * @return {Promise<Skeleton>}
	 */
	loadSkin( skinIndex ) {

		const skinDef = this.json.skins[ skinIndex ];

		const pending = [];

		for ( let i = 0, il = skinDef.joints.length; i < il; i ++ ) {

			pending.push( this.getDependency( 'node', skinDef.joints[ i ] ) );

		}

		if ( skinDef.inverseBindMatrices !== undefined ) {

			pending.push( this.getDependency( 'accessor', skinDef.inverseBindMatrices ) );

		} else {

			pending.push( null );

		}

		return Promise.all( pending ).then( function ( results ) {

			const inverseBindMatrices = results.pop();
			const jointNodes = results;

			const bones = [];
			const boneInverses = [];

			for ( let i = 0, il = jointNodes.length; i < il; i ++ ) {

				const jointNode = jointNodes[ i ];

				if ( jointNode ) {

					bones.push( jointNode );

					const mat = new Matrix4();

					if ( inverseBindMatrices !== null ) {

						mat.fromArray( inverseBindMatrices.array, i * 16 );

					}

					boneInverses.push( mat );

				} else {

					console.warn( 'THREE.GLTFLoader: Joint "%s" could not be found.', skinDef.joints[ i ] );

				}

			}

			return new Skeleton( bones, boneInverses );

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#animations
	 * @param {number} animationIndex
	 * @return {Promise<AnimationClip>}
	 */
	loadAnimation( animationIndex ) {

		const json = this.json;

		const animationDef = json.animations[ animationIndex ];

		const pendingNodes = [];
		const pendingInputAccessors = [];
		const pendingOutputAccessors = [];
		const pendingSamplers = [];
		const pendingTargets = [];

		for ( let i = 0, il = animationDef.channels.length; i < il; i ++ ) {

			const channel = animationDef.channels[ i ];
			const sampler = animationDef.samplers[ channel.sampler ];
			const target = channel.target;
			const name = target.node;
			const input = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.input ] : sampler.input;
			const output = animationDef.parameters !== undefined ? animationDef.parameters[ sampler.output ] : sampler.output;

			pendingNodes.push( this.getDependency( 'node', name ) );
			pendingInputAccessors.push( this.getDependency( 'accessor', input ) );
			pendingOutputAccessors.push( this.getDependency( 'accessor', output ) );
			pendingSamplers.push( sampler );
			pendingTargets.push( target );

		}

		return Promise.all( [

			Promise.all( pendingNodes ),
			Promise.all( pendingInputAccessors ),
			Promise.all( pendingOutputAccessors ),
			Promise.all( pendingSamplers ),
			Promise.all( pendingTargets )

		] ).then( function ( dependencies ) {

			const nodes = dependencies[ 0 ];
			const inputAccessors = dependencies[ 1 ];
			const outputAccessors = dependencies[ 2 ];
			const samplers = dependencies[ 3 ];
			const targets = dependencies[ 4 ];

			const tracks = [];

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				const node = nodes[ i ];
				const inputAccessor = inputAccessors[ i ];
				const outputAccessor = outputAccessors[ i ];
				const sampler = samplers[ i ];
				const target = targets[ i ];

				if ( node === undefined ) continue;

				node.updateMatrix();

				let TypedKeyframeTrack;

				switch ( PATH_PROPERTIES[ target.path ] ) {

					case PATH_PROPERTIES.weights:

						TypedKeyframeTrack = NumberKeyframeTrack;
						break;

					case PATH_PROPERTIES.rotation:

						TypedKeyframeTrack = QuaternionKeyframeTrack;
						break;

					case PATH_PROPERTIES.position:
					case PATH_PROPERTIES.scale:
					default:

						TypedKeyframeTrack = VectorKeyframeTrack;
						break;

				}

				const targetName = node.name ? node.name : node.uuid;

				const interpolation = sampler.interpolation !== undefined ? INTERPOLATION[ sampler.interpolation ] : InterpolateLinear;

				const targetNames = [];

				if ( PATH_PROPERTIES[ target.path ] === PATH_PROPERTIES.weights ) {

					node.traverse( function ( object ) {

						if ( object.morphTargetInfluences ) {

							targetNames.push( object.name ? object.name : object.uuid );

						}

					} );

				} else {

					targetNames.push( targetName );

				}

				let outputArray = outputAccessor.array;

				if ( outputAccessor.normalized ) {

					const scale = getNormalizedComponentScale( outputArray.constructor );
					const scaled = new Float32Array( outputArray.length );

					for ( let j = 0, jl = outputArray.length; j < jl; j ++ ) {

						scaled[ j ] = outputArray[ j ] * scale;

					}

					outputArray = scaled;

				}

				for ( let j = 0, jl = targetNames.length; j < jl; j ++ ) {

					const track = new TypedKeyframeTrack(
						targetNames[ j ] + '.' + PATH_PROPERTIES[ target.path ],
						inputAccessor.array,
						outputArray,
						interpolation
					);

					// Override interpolation with custom factory method.
					if ( sampler.interpolation === 'CUBICSPLINE' ) {

						track.createInterpolant = function InterpolantFactoryMethodGLTFCubicSpline( result ) {

							// A CUBICSPLINE keyframe in glTF has three output values for each input value,
							// representing inTangent, splineVertex, and outTangent. As a result, track.getValueSize()
							// must be divided by three to get the interpolant's sampleSize argument.

							const interpolantType = ( this instanceof QuaternionKeyframeTrack ) ? GLTFCubicSplineQuaternionInterpolant : GLTFCubicSplineInterpolant;

							return new interpolantType( this.times, this.values, this.getValueSize() / 3, result );

						};

						// Mark as CUBICSPLINE. `track.getInterpolation()` doesn't support custom interpolants.
						track.createInterpolant.isInterpolantFactoryMethodGLTFCubicSpline = true;

					}

					tracks.push( track );

				}

			}

			const name = animationDef.name ? animationDef.name : 'animation_' + animationIndex;

			return new AnimationClip( name, undefined, tracks );

		} );

	}

	createNodeMesh( nodeIndex ) {

		const json = this.json;
		const parser = this;
		const nodeDef = json.nodes[ nodeIndex ];

		if ( nodeDef.mesh === undefined ) return null;

		return parser.getDependency( 'mesh', nodeDef.mesh ).then( function ( mesh ) {

			const node = parser._getNodeRef( parser.meshCache, nodeDef.mesh, mesh );

			// if weights are provided on the node, override weights on the mesh.
			if ( nodeDef.weights !== undefined ) {

				node.traverse( function ( o ) {

					if ( ! o.isMesh ) return;

					for ( let i = 0, il = nodeDef.weights.length; i < il; i ++ ) {

						o.morphTargetInfluences[ i ] = nodeDef.weights[ i ];

					}

				} );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#nodes-and-hierarchy
	 * @param {number} nodeIndex
	 * @return {Promise<Object3D>}
	 */
	loadNode( nodeIndex ) {

		const json = this.json;
		const extensions = this.extensions;
		const parser = this;

		const nodeDef = json.nodes[ nodeIndex ];

		// reserve node's name before its dependencies, so the root has the intended name.
		const nodeName = nodeDef.name ? parser.createUniqueName( nodeDef.name ) : '';

		return ( function () {

			const objectPending = [];

			const meshPromise = parser._invokeOne( function ( ext ) {

				return ext.createNodeMesh && ext.createNodeMesh( nodeIndex );

			} );

			if ( meshPromise ) {

				objectPending.push( meshPromise );

			}

			if ( nodeDef.camera !== undefined ) {

				objectPending.push( parser.getDependency( 'camera', nodeDef.camera ).then( function ( camera ) {

					return parser._getNodeRef( parser.cameraCache, nodeDef.camera, camera );

				} ) );

			}

			parser._invokeAll( function ( ext ) {

				return ext.createNodeAttachment && ext.createNodeAttachment( nodeIndex );

			} ).forEach( function ( promise ) {

				objectPending.push( promise );

			} );

			const childPending = [];
			const childrenDef = nodeDef.children || [];

			for ( let i = 0, il = childrenDef.length; i < il; i ++ ) {

				childPending.push( parser.getDependency( 'node', childrenDef[ i ] ) );

			}

			const skeletonPending = nodeDef.skin === undefined
				? Promise.resolve( null )
				: parser.getDependency( 'skin', nodeDef.skin );

			return Promise.all( [
				Promise.all( objectPending ),
				Promise.all( childPending ),
				skeletonPending
			] );

		}() ).then( function ( results ) {

			const objects = results[ 0 ];
			const children = results[ 1 ];
			const skeleton = results[ 2 ];

			let node;

			// .isBone isn't in glTF spec. See ._markDefs
			if ( nodeDef.isBone === true ) {

				node = new Bone();

			} else if ( objects.length > 1 ) {

				node = new Group();

			} else if ( objects.length === 1 ) {

				node = objects[ 0 ];

			} else {

				node = new Object3D();

			}

			if ( node !== objects[ 0 ] ) {

				for ( let i = 0, il = objects.length; i < il; i ++ ) {

					node.add( objects[ i ] );

				}

			}

			if ( nodeDef.name ) {

				node.userData.name = nodeDef.name;
				node.name = nodeName;

			}

			assignExtrasToUserData( node, nodeDef );

			if ( nodeDef.extensions ) addUnknownExtensionsToUserData( extensions, node, nodeDef );

			if ( nodeDef.matrix !== undefined ) {

				const matrix = new Matrix4();
				matrix.fromArray( nodeDef.matrix );
				node.applyMatrix4( matrix );

			} else {

				if ( nodeDef.translation !== undefined ) {

					node.position.fromArray( nodeDef.translation );

				}

				if ( nodeDef.rotation !== undefined ) {

					node.quaternion.fromArray( nodeDef.rotation );

				}

				if ( nodeDef.scale !== undefined ) {

					node.scale.fromArray( nodeDef.scale );

				}

			}

			if ( ! parser.associations.has( node ) ) {

				parser.associations.set( node, {} );

			}

			parser.associations.get( node ).nodes = nodeIndex;

			if ( skeleton !== null ) {

				// This full traverse should be fine because
				// child glTF nodes have not been added to this node yet.
				node.traverse( function ( mesh ) {

					if ( ! mesh.isSkinnedMesh ) return;

					mesh.bind( skeleton, _identityMatrix );

				} );

			}

			for ( let i = 0, il = children.length; i < il; i ++ ) {

				node.add( children[ i ] );

			}

			return node;

		} );

	}

	/**
	 * Specification: https://github.com/KhronosGroup/glTF/tree/master/specification/2.0#scenes
	 * @param {number} sceneIndex
	 * @return {Promise<Group>}
	 */
	loadScene( sceneIndex ) {

		const extensions = this.extensions;
		const sceneDef = this.json.scenes[ sceneIndex ];
		const parser = this;

		// Loader returns Group, not Scene.
		// See: https://github.com/mrdoob/three.js/issues/18342#issuecomment-578981172
		const scene = new Group();
		if ( sceneDef.name ) scene.name = parser.createUniqueName( sceneDef.name );

		assignExtrasToUserData( scene, sceneDef );

		if ( sceneDef.extensions ) addUnknownExtensionsToUserData( extensions, scene, sceneDef );

		const nodeIds = sceneDef.nodes || [];

		const pending = [];

		for ( let i = 0, il = nodeIds.length; i < il; i ++ ) {

			pending.push( parser.getDependency( 'node', nodeIds[ i ] ) );

		}

		return Promise.all( pending ).then( function ( nodes ) {

			for ( let i = 0, il = nodes.length; i < il; i ++ ) {

				scene.add( nodes[ i ] );

			}

			// Removes dangling associations, associations that reference a node that
			// didn't make it into the scene.
			const reduceAssociations = ( node ) => {

				const reducedAssociations = new Map();

				for ( const [ key, value ] of parser.associations ) {

					if ( key instanceof Material || key instanceof Texture ) {

						reducedAssociations.set( key, value );

					}

				}

				node.traverse( ( node ) => {

					const mappings = parser.associations.get( node );

					if ( mappings != null ) {

						reducedAssociations.set( node, mappings );

					}

				} );

				return reducedAssociations;

			};

			parser.associations = reduceAssociations( scene );

			return scene;

		} );

	}

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 */
function computeBounds( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const box = new Box3();

	if ( attributes.POSITION !== undefined ) {

		const accessor = parser.json.accessors[ attributes.POSITION ];

		const min = accessor.min;
		const max = accessor.max;

		// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

		if ( min !== undefined && max !== undefined ) {

			box.set(
				new Vector3( min[ 0 ], min[ 1 ], min[ 2 ] ),
				new Vector3( max[ 0 ], max[ 1 ], max[ 2 ] )
			);

			if ( accessor.normalized ) {

				const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
				box.min.multiplyScalar( boxScale );
				box.max.multiplyScalar( boxScale );

			}

		} else {

			console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

			return;

		}

	} else {

		return;

	}

	const targets = primitiveDef.targets;

	if ( targets !== undefined ) {

		const maxDisplacement = new Vector3();
		const vector = new Vector3();

		for ( let i = 0, il = targets.length; i < il; i ++ ) {

			const target = targets[ i ];

			if ( target.POSITION !== undefined ) {

				const accessor = parser.json.accessors[ target.POSITION ];
				const min = accessor.min;
				const max = accessor.max;

				// glTF requires 'min' and 'max', but VRM (which extends glTF) currently ignores that requirement.

				if ( min !== undefined && max !== undefined ) {

					// we need to get max of absolute components because target weight is [-1,1]
					vector.setX( Math.max( Math.abs( min[ 0 ] ), Math.abs( max[ 0 ] ) ) );
					vector.setY( Math.max( Math.abs( min[ 1 ] ), Math.abs( max[ 1 ] ) ) );
					vector.setZ( Math.max( Math.abs( min[ 2 ] ), Math.abs( max[ 2 ] ) ) );


					if ( accessor.normalized ) {

						const boxScale = getNormalizedComponentScale( WEBGL_COMPONENT_TYPES[ accessor.componentType ] );
						vector.multiplyScalar( boxScale );

					}

					// Note: this assumes that the sum of all weights is at most 1. This isn't quite correct - it's more conservative
					// to assume that each target can have a max weight of 1. However, for some use cases - notably, when morph targets
					// are used to implement key-frame animations and as such only two are active at a time - this results in very large
					// boxes. So for now we make a box that's sometimes a touch too small but is hopefully mostly of reasonable size.
					maxDisplacement.max( vector );

				} else {

					console.warn( 'THREE.GLTFLoader: Missing min/max properties for accessor POSITION.' );

				}

			}

		}

		// As per comment above this box isn't conservative, but has a reasonable size for a very large number of morph targets.
		box.expandByVector( maxDisplacement );

	}

	geometry.boundingBox = box;

	const sphere = new Sphere();

	box.getCenter( sphere.center );
	sphere.radius = box.min.distanceTo( box.max ) / 2;

	geometry.boundingSphere = sphere;

}

/**
 * @param {BufferGeometry} geometry
 * @param {GLTF.Primitive} primitiveDef
 * @param {GLTFParser} parser
 * @return {Promise<BufferGeometry>}
 */
function addPrimitiveAttributes( geometry, primitiveDef, parser ) {

	const attributes = primitiveDef.attributes;

	const pending = [];

	function assignAttributeAccessor( accessorIndex, attributeName ) {

		return parser.getDependency( 'accessor', accessorIndex )
			.then( function ( accessor ) {

				geometry.setAttribute( attributeName, accessor );

			} );

	}

	for ( const gltfAttributeName in attributes ) {

		const threeAttributeName = ATTRIBUTES[ gltfAttributeName ] || gltfAttributeName.toLowerCase();

		// Skip attributes already provided by e.g. Draco extension.
		if ( threeAttributeName in geometry.attributes ) continue;

		pending.push( assignAttributeAccessor( attributes[ gltfAttributeName ], threeAttributeName ) );

	}

	if ( primitiveDef.indices !== undefined && ! geometry.index ) {

		const accessor = parser.getDependency( 'accessor', primitiveDef.indices ).then( function ( accessor ) {

			geometry.setIndex( accessor );

		} );

		pending.push( accessor );

	}

	assignExtrasToUserData( geometry, primitiveDef );

	computeBounds( geometry, primitiveDef, parser );

	return Promise.all( pending ).then( function () {

		return primitiveDef.targets !== undefined
			? addMorphTargets( geometry, primitiveDef.targets, parser )
			: geometry;

	} );

}


THREE.GLTFLoader=GLTFLoader;
})(THREE);


if (typeof __installMiniGLTFLoader === 'function') __installMiniGLTFLoader();

/* ===== [[ js/soldier-loader.js ]] ===== */
// ===== V4.1 soldier GLB loading, validation and shared render data =====

var SoldierModelLoader = class SoldierModelLoader {
    static load() {
        if (SoldierModelLoader._data) return SoldierModelLoader._promise;
        if (SoldierModelLoader._promise) return SoldierModelLoader._promise;
        if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader !== 'function') {
            return Promise.reject(new Error('SoldierModelLoader requires THREE.GLTFLoader'));
        }

        var started = performance.now();
        var partial = [];
        SoldierModelLoader.status = 'loading';
        SoldierModelLoader.loadMs = 0;
        var loader = new THREE.GLTFLoader();
        function one(url, label) {
            return new Promise(function(resolve, reject) {
                loader.load(url, function(gltf) {
                    try {
                        SoldierModelLoader._validate(gltf, label);
                        partial.push(gltf);
                        resolve(gltf);
                    } catch (err) {
                        SoldierModelLoader._disposeScene(gltf && gltf.scene);
                        reject(err);
                    }
                }, function(evt) {
                    // VNext: 启动进度上报(文件级 loaded/total)
                    if (window.__BootProgress && evt && evt.lengthComputable !== false) {
                        window.__BootProgress.file(url, evt.loaded || 0, evt.total || 1);
                    }
                }, function(err) {
                    reject(new Error('Failed to load ' + label + ': ' + (err && err.message ? err.message : err)));
                });
            });
        }

        SoldierModelLoader._promise = Promise.allSettled([
            one('assets/game/models/soldier/soldier.glb', 'hero soldier'),
            one('assets/game/models/soldier/soldier-lod.glb', 'LOD soldier')
        ]).then(function(results) {
            // Wait for both requests before cleanup: a slow sibling must not
            // allocate textures after an early failed request has been disposed.
            var failed = results.find(function(r) { return r.status === 'rejected'; });
            if (failed) throw failed.reason;
            var loaded = results.map(function(r) { return r.value; });
            var hero = SoldierModelLoader._extract(loaded[0], 'hero');
            var lod = SoldierModelLoader._extract(loaded[1], 'lod');
            // Existing scenery was authored for legacy linear-output Lambert shading.
            // glTF PBR is linear-lit and must receive an sRGB display transform.
            // Apply it to this material only, preserving the established scenery palette.
            hero.material.onBeforeCompile = function(shader) {
                shader.fragmentShader = shader.fragmentShader.replace(
                    '#include <encodings_fragment>',
                    'gl_FragColor = LinearTosRGB( gl_FragColor );'
                );
            };
            hero.material.customProgramCacheKey = function() { return 'v41-gltf-srgb-display'; };
            var duplicateLodMaterial = lod.material;
            for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
                lod.nodes[SoldierModelLoader.PARTS[i]].material = hero.material;
            }
            lod.material = hero.material;
            if (duplicateLodMaterial !== hero.material) {
                SoldierModelLoader._disposeMaterial(duplicateLodMaterial);
            }

            // Derive the attachment from world transforms so exported parent
            // rotations/scales remain correct even when Blender changes them.
            hero.scene.updateMatrixWorld(true);
            var inverseArms = new THREE.Matrix4().copy(hero.nodes.Arms.matrixWorld).invert();
            var muzzleMatrix = inverseArms.multiply(hero.muzzle.matrixWorld);
            var data = {
                version: 1,
                parts: SoldierModelLoader.PARTS.slice(),
                banks: {
                    hero: SoldierModelLoader._bankData(hero),
                    lod: SoldierModelLoader._bankData(lod)
                },
                material: hero.material,
                muzzleMatrix: muzzleMatrix.clone(),
                muzzlePosition: new THREE.Vector3().setFromMatrixPosition(muzzleMatrix),
                urls: {
                    hero: 'assets/game/models/soldier/soldier.glb',
                    lod: 'assets/game/models/soldier/soldier-lod.glb'
                }
            };
            SoldierModelLoader._data = data;
            SoldierModelLoader.status = 'loaded';
            SoldierModelLoader.loadMs = performance.now() - started;
            return data;
        }).catch(function(err) {
            for (var i = 0; i < partial.length; i++) {
                SoldierModelLoader._disposeScene(partial[i] && partial[i].scene);
            }
            SoldierModelLoader._data = null;
            SoldierModelLoader._promise = null;
            SoldierModelLoader.status = 'failed';
            SoldierModelLoader.loadMs = performance.now() - started;
            throw err;
        });
        return SoldierModelLoader._promise;
    }

    static get() {
        return SoldierModelLoader._data;
    }

    static _validate(gltf, label) {
        if (!gltf || !gltf.scene) throw new Error(label + ' has no scene');
        var shared = null;
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            var node = gltf.scene.getObjectByName(name);
            if (!node || !node.isMesh) throw new Error(label + ' missing mesh ' + name);
            if (!node.geometry || !node.geometry.getAttribute('position') ||
                !node.geometry.getAttribute('normal') || !node.geometry.getAttribute('uv')) {
                throw new Error(label + ' ' + name + ' requires position, normal and UV attributes');
            }
            if (!node.geometry.index) throw new Error(label + ' ' + name + ' requires indexed geometry');
            if (Array.isArray(node.material) || !node.material || !node.material.isMeshStandardMaterial) {
                throw new Error(label + ' ' + name + ' requires one MeshStandardMaterial');
            }
            if (!shared) shared = node.material;
            if (node.material !== shared) throw new Error(label + ' parts must share one material');
        }
        var muzzle = gltf.scene.getObjectByName('Muzzle');
        var arms = gltf.scene.getObjectByName('Arms');
        if (!muzzle || muzzle.parent !== arms) throw new Error(label + ' Muzzle must be a direct Arms child');
        if (!shared.map || !shared.metalnessMap || !shared.roughnessMap) {
            throw new Error(label + ' material requires decoded base-color and ORM textures');
        }
        SoldierModelLoader._validateImage(shared.map.image, label + ' base-color');
        SoldierModelLoader._validateImage(shared.metalnessMap.image, label + ' ORM');
        if (shared.metalnessMap !== shared.roughnessMap) {
            throw new Error(label + ' ORM texture must be shared by metalness and roughness');
        }
    }

    static _validateImage(image, label) {
        var width = image && (image.width || image.videoWidth || image.naturalWidth);
        var height = image && (image.height || image.videoHeight || image.naturalHeight);
        if (!width || !height) throw new Error(label + ' image did not decode');
    }

    static _extract(gltf, label) {
        var nodes = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            nodes[name] = gltf.scene.getObjectByName(name);
            nodes[name].updateMatrix();
        }
        return {
            label: label,
            scene: gltf.scene,
            nodes: nodes,
            material: nodes.Body.material,
            muzzle: gltf.scene.getObjectByName('Muzzle')
        };
    }

    static _bankData(extracted) {
        var geometries = {};
        var restMatrices = {};
        for (var i = 0; i < SoldierModelLoader.PARTS.length; i++) {
            var name = SoldierModelLoader.PARTS[i];
            geometries[name] = extracted.nodes[name].geometry;
            restMatrices[name] = extracted.nodes[name].matrix.clone();
        }
        return {
            name: extracted.label,
            geometries: geometries,
            restMatrices: restMatrices,
            material: extracted.material
        };
    }

    static _disposeScene(scene) {
        if (!scene) return;
        var geometries = [];
        var materials = [];
        scene.traverse(function(obj) {
            if (obj.geometry && geometries.indexOf(obj.geometry) < 0) geometries.push(obj.geometry);
            if (obj.material) {
                var list = Array.isArray(obj.material) ? obj.material : [obj.material];
                for (var i = 0; i < list.length; i++) {
                    if (materials.indexOf(list[i]) < 0) materials.push(list[i]);
                }
            }
        });
        for (var i = 0; i < geometries.length; i++) geometries[i].dispose();
        for (var j = 0; j < materials.length; j++) SoldierModelLoader._disposeMaterial(materials[j]);
    }

    static _disposeMaterial(material) {
        if (!material) return;
        var textures = [];
        for (var key in material) {
            var value = material[key];
            if (value && value.isTexture && textures.indexOf(value) < 0) textures.push(value);
        }
        for (var i = 0; i < textures.length; i++) textures[i].dispose();
        material.dispose();
    }
};

SoldierModelLoader.PARTS = ['Body', 'Head', 'Arms', 'LegL', 'LegR'];
SoldierModelLoader._promise = null;
SoldierModelLoader._data = null;
SoldierModelLoader.status = 'idle';
SoldierModelLoader.loadMs = 0;
if (typeof window !== 'undefined') window.SoldierModelLoader = SoldierModelLoader;


/* ===== [[ js/soldier-renderer.js ]] ===== */
// ===== V4.1 five-part instanced soldier renderer and procedural poses =====

var SoldierRenderer = class SoldierRenderer {
    constructor(scene) {
        this.scene = scene;
        this.data = SoldierModelLoader.get();
        if (!this.data) throw new Error('Soldier model data is not loaded');
        this.parts = this.data.parts.slice();
        // V11 QA修复[P2]: 容量必须含科技"军团上限"加成(army_limit max2 × 50 = +100),
        // 原实现固定500+16, 科技买满后600人 → setMatrixAt越界丢弃 + instanceCount超缓冲 → WebGL渲染异常
        var techLimitBonus = (typeof TECH_DEFS !== 'undefined' && TECH_DEFS.army_limit) ? 50 * TECH_DEFS.army_limit.max : 0;
        this.capacity = CONFIG.SQUAD_MAX_COUNT + techLimitBonus + SoldierRenderer.MAX_GHOSTS;
        this.banks = {};
        this.activeBank = 'hero';
        this.state = null;
        this._stateAge = 0;
        this.ghosts = [];
        this._shootT = new Float32Array(this.capacity);
        this._debugPoses = [];
        this._ghostPoses = [];
        this._lastRoots = [];
        this._lastTime = 0;
        this._hitT = 0;

        this._p = new THREE.Vector3();
        this._q = new THREE.Quaternion();
        this._s = new THREE.Vector3();
        this._e = new THREE.Euler();
        this._root = new THREE.Matrix4();
        this._local = new THREE.Matrix4();
        this._anim = new THREE.Matrix4();
        this._temp = new THREE.Matrix4();
        this._muzzleWorld = new THREE.Matrix4();
        this._outPos = new THREE.Vector3();
        // V16: 职业辨识 — 实例染色 scratch + 职业附件库(gunner肩甲/medic急救包)
        this._v16Color = new THREE.Color();
        this._v16AccBanks = {};
        this._tintStates = {
            hero: { classId: null, visibleCount: -1 },
            lod: { classId: null, visibleCount: -1 }
        };
        this._tintBank = null;

        this._createBank('hero');
        this._createBank('lod');
        this._selectBank('hero', 0);

        // V15-ART-002: 士兵柔和接地阴影 (单 InstancedMesh, 彻底增强立体落地感)
        var sCv = document.createElement('canvas'); sCv.width = sCv.height = 64;
        var sCtx = sCv.getContext('2d');
        var sGrad = sCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
        sGrad.addColorStop(0, 'rgba(12, 18, 22, 0.50)');
        sGrad.addColorStop(0.62, 'rgba(12, 18, 22, 0.24)');
        sGrad.addColorStop(1, 'rgba(12, 18, 22, 0)');
        sCtx.fillStyle = sGrad; sCtx.fillRect(0, 0, 64, 64);
        var sPlane = new THREE.PlaneGeometry(0.88, 0.78); sPlane.rotateX(-Math.PI * 0.5);
        this._shadowMesh = new THREE.InstancedMesh(sPlane, new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(sCv), transparent: true, depthWrite: false
        }), this.capacity);
        this._shadowMesh.count = 0; this._shadowMesh.frustumCulled = false; this._shadowMesh.renderOrder = 1;
        this._shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.scene.add(this._shadowMesh);
    }

    /** V16+V15: 士兵背部与肩部精致玩具战术附件(Body 局部空间, 顶点色+共享材质) */
    static _classAccGeometry(name) {
        if (SoldierRenderer._accGeos && SoldierRenderer._accGeos[name]) return SoldierRenderer._accGeos[name];
        if (!SoldierRenderer._accGeos) SoldierRenderer._accGeos = {};
        var parts = [];
        if (name === 'tacticalpack') {
            // V15 R2: 紧贴士兵背部的精致战术背包扣件与白色五角星徽章 (无多余凸起)
            parts.push(colorize(new THREE.BoxGeometry(0.24, 0.045, 0.14), 0x4E4229).translate(0, 0.32, -0.18));
            parts.push(colorize(new THREE.BoxGeometry(0.09, 0.09, 0.025), 0xFAF6E1).translate(0, 0.22, -0.245));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.06, 0.04), 0xE6B84C).translate(-0.11, 0.12, -0.17));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.06, 0.04), 0xE6B84C).translate(0.11, 0.12, -0.17));
        } else if (name === 'heavyplate') {
            parts.push(colorize(new THREE.BoxGeometry(0.34, 0.14, 0.3), 0x8A5A34).translate(-0.36, 0.34, 0).rotateZ(0.1));
            parts.push(colorize(new THREE.BoxGeometry(0.34, 0.14, 0.3), 0x8A5A34).translate(0.36, 0.34, 0).rotateZ(-0.1));
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.18, 0.1), 0x9C6A3E).translate(0, 0.3, -0.28));
        } else if (name === 'scoutcap') {
            parts.push(colorize(new THREE.CylinderGeometry(0.21, 0.23, 0.09, 9), 0x4E3A66).translate(0, 0.34, 0));
            parts.push(colorize(new THREE.BoxGeometry(0.18, 0.03, 0.14), 0x3C2C50).translate(0, 0.3, 0.22));
            parts.push(colorize(new THREE.BoxGeometry(0.08, 0.26, 0.06), 0x5E4680).translate(0.24, 0.22, -0.1).rotateZ(-0.15));
        } else if (name === 'medickit') {
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.24, 0.16), 0xE8EDE8).translate(0, 0.32, -0.26));
            parts.push(colorize(new THREE.BoxGeometry(0.16, 0.05, 0.02), 0xD84848).translate(0, 0.34, -0.345));
            parts.push(colorize(new THREE.BoxGeometry(0.05, 0.16, 0.02), 0xD84848).translate(0, 0.34, -0.345));
        }
        var merged = mergeGeometries(parts);
        merged.userData = { artSource: 'V16 class attachment procedural: ' + name };
        SoldierRenderer._accGeos[name] = merged;
        return merged;
    }
    _classAccBank(name) {
        if (this._v16AccBanks[name]) return this._v16AccBanks[name];
        var geo = SoldierRenderer._classAccGeometry(name);
        var mat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF, vertexColors: true });
        var mesh = new THREE.InstancedMesh(geo, mat, this.capacity);
        mesh.name = 'Soldier_clsacc_' + name;
        mesh.count = 0; mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.userData.artSource = 'V16 class attachment ' + name;
        this.scene.add(mesh);
        return this._v16AccBanks[name] = { mesh: mesh, count: 0 };
    }

    _createBank(name) {
        var source = this.data.banks[name];
        var meshes = {};
        for (var i = 0; i < this.parts.length; i++) {
            var part = this.parts[i];
            var mesh = new THREE.InstancedMesh(source.geometries[part], source.material, this.capacity);
            mesh.name = 'Soldier_' + name + '_' + part;
            mesh.count = 0;
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.userData.artSource = this.data.urls ? this.data.urls[name] : 'V4.1 soldier GLB';
            this.scene.add(mesh);
            meshes[part] = mesh;
        }
        this.banks[name] = { meshes: meshes, source: source };
    }

    _selectBank(name, count) {
        this.activeBank = name;
        for (var bankName in this.banks) {
            var visible = bankName === name;
            var bankMeshes = this.banks[bankName].meshes;
            for (var i = 0; i < this.parts.length; i++) {
                var mesh = bankMeshes[this.parts[i]];
                mesh.visible = visible;
                if (!visible) mesh.count = 0;
                // Dense formations have no dynamic shadows. Hero shadows are capped.
                mesh.castShadow = visible && name === 'hero' && count <= 64;
            }
        }
        var active = this.banks[name].meshes;
        this.mesh = active.Body;
        this.legMeshL = active.LegL;
        this.legMeshR = active.LegR;
    }

    setState(name) {
        var allowed = ['Idle', 'Run', 'Shoot', 'Hit', 'Death', 'Victory'];
        if (name === null || name === undefined || name === 'Auto') {
            this.state = null;
            this._stateAge = 0;
            return;
        }
        if (allowed.indexOf(name) < 0) throw new Error('Unknown soldier animation state: ' + name);
        this.state = name;
        this._stateAge = 0;
    }

    triggerShoot(index) {
        if (index >= 0 && index < this._shootT.length) {
            this._shootT[index] = SoldierRenderer.SHOOT_DURATION;
        }
    }

    triggerHit() {
        this._hitT = SoldierRenderer.HIT_DURATION;
    }

    clearGhosts() {
        this.ghosts.length = 0;
    }

    captureDeaths(start, end, squad) {
        start = Math.max(0, start | 0);
        end = Math.min(end | 0, squad.soldiers.length);
        for (var i = start; i < end; i++) {
            var soldier = squad.soldiers[i];
            if (!soldier) continue;
            var root = this._lastRoots[i] ? this._lastRoots[i].clone() : new THREE.Matrix4();
            if (!this._lastRoots[i]) this._composeRoot(i, squad, false, 0, 0, root);
            if (this.ghosts.length >= SoldierRenderer.MAX_GHOSTS) this.ghosts.shift();
            this.ghosts.push({
                root: root,
                phase: soldier.phase || 0,
                age: 0,
                direction: ((i + Math.floor((soldier.phase || 0) * 10)) & 1) ? 1 : -1
            });
        }
    }

    update(dt, time, squad, moving, lean, tilt) {
        this._lastTime = time;
        this._stateAge += dt;
        this._hitT = Math.max(0, this._hitT - dt);
        for (var i = 0; i < squad.count; i++) {
            this._shootT[i] = Math.max(0, this._shootT[i] - dt);
        }
        for (var g = this.ghosts.length - 1; g >= 0; g--) {
            this.ghosts[g].age += dt;
            if (this.ghosts[g].age >= SoldierRenderer.DEATH_DURATION) this.ghosts.splice(g, 1);
        }

        var bankName = squad.count > SoldierRenderer.HERO_LIMIT ? 'lod' : 'hero';
        this._selectBank(bankName, squad.count);

        var bank = this.banks[bankName];
        // V16: 职业辨识 — 每实例染色 + 职业附件(读取 squad._gameRef._classStats.id)
        var clsId = (squad._gameRef && squad._gameRef._classStats && squad._gameRef._classStats.id) || 'rifleman';
        var clsPres = SoldierRenderer.CLASS_PRESENTATION[clsId] || SoldierRenderer.CLASS_PRESENTATION.rifleman;
        for (var k in this._v16AccBanks) this._v16AccBanks[k].count = 0;
        // Dense LOD formations never display class attachments, so do not construct
        // their geometry/bank or calculate attachment matrices until hero detail returns.
        var accBank = bankName === 'hero' && clsPres.attach ? this._classAccBank(clsPres.attach) : null;
        for (var index = 0; index < squad.count; index++) {
            this._composeRoot(index, squad, moving, lean, tilt, this._root);
            if (!this._lastRoots[index]) this._lastRoots[index] = new THREE.Matrix4();
            this._lastRoots[index].copy(this._root);
            // V15: 士兵脚底接地阴影
            if (this._shadowMesh) {
                var sObj = squad.soldiers[index];
                var sSc = (squad._formationScale || 1) * Math.max(0.01, easeOutBack(sObj ? sObj.spawnT : 1));
                this._temp.makeScale(sSc, 1, sSc);
                this._temp.setPosition(squad.x + (sObj ? sObj.x : 0), 0.032, squad.z + (sObj ? sObj.z : 0));
                this._shadowMesh.setMatrixAt(index, this._temp);
            }
            var pose = this._poseFor(index, squad.soldiers[index], moving, time);
            for (var p = 0; p < this.parts.length; p++) {
                var part = this.parts[p];
                this._partMatrix(part, bank.source, this._root, pose, this._temp);
                bank.meshes[part].setMatrixAt(index, this._temp);
                if (part === 'Body' && accBank && index < SoldierRenderer.ACC_MAX) {
                    accBank.mesh.setMatrixAt(accBank.count++, this._temp);
                }
            }
        }

        for (var ghostIndex = 0; ghostIndex < this.ghosts.length; ghostIndex++) {
            var ghost = this.ghosts[ghostIndex];
            var slot = squad.count + ghostIndex;
            var deathPose = this._ghostPoses[ghostIndex];
            if (!deathPose) deathPose = this._ghostPoses[ghostIndex] = this._createPose();
            this._deathPose(ghost, deathPose);
            for (var gp = 0; gp < this.parts.length; gp++) {
                var ghostPart = this.parts[gp];
                this._partMatrix(ghostPart, bank.source, ghost.root, deathPose, this._temp);
                bank.meshes[ghostPart].setMatrixAt(slot, this._temp);
            }
        }

        var visibleCount = squad.count + this.ghosts.length;
        var tintState = this._tintStates[bankName];
        var bankChanged = this._tintBank !== bankName;
        var classChanged = tintState.classId !== clsId;
        var visibleChanged = tintState.visibleCount !== visibleCount;
        if (bankChanged || classChanged || visibleChanged) {
            this._v16Color.setRGB(clsPres.tint[0], clsPres.tint[1], clsPres.tint[2]);
            var colorStart = (!bankChanged && !classChanged && visibleCount > tintState.visibleCount)
                ? tintState.visibleCount : 0;
            for (var colorIndex = colorStart; colorIndex < visibleCount; colorIndex++) {
                for (var colorPart = 0; colorPart < this.parts.length; colorPart++) {
                    bank.meshes[this.parts[colorPart]].setColorAt(colorIndex, this._v16Color);
                }
            }
            tintState.classId = clsId;
            tintState.visibleCount = visibleCount;
        }
        this._tintBank = bankName;
        // V11.6: 前缀上传(只传已用槽位, 上限500时GPU带宽减半以上)
        for (var m = 0; m < this.parts.length; m++) {
            var partMesh = bank.meshes[this.parts[m]];
            partMesh.count = visibleCount;
            partMesh.instanceMatrix.updateRange.offset = 0;
            partMesh.instanceMatrix.updateRange.count = visibleCount * 16;
            partMesh.instanceMatrix.needsUpdate = true;
            if (partMesh.instanceColor && (bankChanged || classChanged || visibleChanged)) {
                partMesh.instanceColor.updateRange.offset = colorStart * 3;
                partMesh.instanceColor.updateRange.count = Math.max(0, visibleCount - colorStart) * 3;
                partMesh.instanceColor.needsUpdate = true;
            }
        }
        // V16: 职业附件上传(仅 hero 银行可见; LOD 大编制隐藏以省调用)
        for (var ak in this._v16AccBanks) {
            var accessoryBank = this._v16AccBanks[ak];
            var am = accessoryBank.mesh;
            var activeAccessory = bankName === 'hero' && accessoryBank === accBank && accessoryBank.count > 0;
            am.count = activeAccessory ? accessoryBank.count : 0;
            am.visible = activeAccessory;
            if (activeAccessory) {
                am.instanceMatrix.updateRange.offset = 0;
                am.instanceMatrix.updateRange.count = accessoryBank.count * 16;
                am.instanceMatrix.needsUpdate = true;
            }
        }
        if (this._shadowMesh) {
            this._shadowMesh.count = squad.count;
            this._shadowMesh.visible = squad.count > 0;
            this._shadowMesh.instanceMatrix.updateRange.offset = 0;
            this._shadowMesh.instanceMatrix.updateRange.count = squad.count * 16;
            this._shadowMesh.instanceMatrix.needsUpdate = true;
        }
    }

    _composeRoot(index, squad, moving, lean, tilt, target) {
        var soldier = squad.soldiers[index];
        if (!soldier) return target.identity();
        var phase = soldier.phase || 0;
        var time = this._lastTime;
        var bob = moving ? Math.abs(Math.sin(time * 8 + phase)) * 0.035 : Math.sin(time * 2 + phase) * 0.012;
        var spawnScale = Math.max(0.001, easeOutBack(soldier.spawnT));
        var modelScale = squad._formationScale || 1;
        this._p.set(squad.x + soldier.x, bob, squad.z + soldier.z);
        this._e.set(lean || 0, soldier.rotY || 0, tilt || 0, 'YXZ');
        this._q.setFromEuler(this._e);
        this._s.setScalar(spawnScale * modelScale);
        return target.compose(this._p, this._q, this._s);
    }

    _createPose() {
        return {
            state: 'Idle', phase: 0,
            swingL: 0, swingR: 0,
            bodyPitch: 0, bodyYaw: 0,
            headYaw: 0, headLift: 0,
            armsPitch: 0, armsLift: 0,
            recoil: 0, deathT: 0, deathDirection: 0
        };
    }

    _poseFor(index, soldier, moving, time) {
        var phase = soldier.phase || 0;
        var recoil = this._shootT[index] > 0
            ? Math.sin((this._shootT[index] / SoldierRenderer.SHOOT_DURATION) * Math.PI * 0.5)
            : 0;
        if (this.state === 'Shoot') recoil = Math.abs(Math.sin(time * 16 + phase)) * .8 + .2;
        var state = this.state || (moving ? 'Run' : 'Idle');
        if (this._hitT > 0) state = 'Hit';
        if (recoil > 0) state = 'Shoot';
        if (this.state === 'Victory') state = 'Victory';
        if (this.state === 'Death') state = 'Death';
        var runCycle = ((moving && state !== 'Victory' && state !== 'Death') || state === 'Hit')
            ? Math.sin(time * 8 + phase) : 0;
        var idleCycle = state === 'Idle' ? Math.sin(time * 2 + phase) : 0;
        var victoryCycle = state === 'Victory' ? Math.sin(time * 5 + phase) : 0;
        var pose = this._debugPoses[index];
        if (!pose) pose = this._debugPoses[index] = this._createPose();
        pose.state = state;
        pose.phase = phase;
        pose.swingL = moving && state !== 'Victory' ? runCycle * 0.6 : 0;
        pose.swingR = moving && state !== 'Victory' ? -runCycle * 0.6 : 0;
        pose.bodyPitch = moving ? runCycle * 0.025 : 0;
        pose.bodyYaw = 0;
        pose.headYaw = state === 'Idle' ? idleCycle * 0.035 : 0;
        pose.headLift = state === 'Idle' ? idleCycle * 0.008 : 0;
        pose.armsPitch = 0;
        pose.armsLift = 0;
        pose.recoil = recoil;
        pose.deathT = 0;
        pose.deathDirection = 0;
        if (state === 'Hit') {
            pose.bodyPitch = -0.12 * (this._hitT > 0 ? this._hitT / SoldierRenderer.HIT_DURATION : 1);
            pose.headYaw = runCycle * 0.08;
        } else if (state === 'Death') {
            this._setDeathPose(pose, this._stateAge, phase, 1);
        } else if (state === 'Victory') {
            pose.bodyPitch = victoryCycle * 0.04;
            pose.headLift = Math.abs(victoryCycle) * 0.03;
            pose.armsPitch = -0.55 - Math.abs(victoryCycle) * 0.18;
            pose.armsLift = 0.06;
            pose.swingL = victoryCycle * 0.12;
            pose.swingR = -victoryCycle * 0.12;
        }
        return pose;
    }

    _setDeathPose(target, age, phase, direction) {
        target.state = 'Death';
        target.phase = phase || 0;
        target.swingL = 0.12;
        target.swingR = -0.12;
        target.bodyPitch = 0;
        target.bodyYaw = 0;
        target.headYaw = 0;
        target.headLift = 0;
        target.armsPitch = 0;
        target.armsLift = 0;
        target.recoil = 0;
        target.deathT = Math.min(1, age / SoldierRenderer.DEATH_DURATION);
        target.deathDirection = direction;
        return target;
    }

    _deathPose(ghost, target) {
        if (!target) target = ghost._pose || (ghost._pose = this._createPose());
        return this._setDeathPose(target, ghost.age, ghost.phase, ghost.direction);
    }

    _partMatrix(part, source, root, pose, target) {
        this._anim.identity();
        if (part === 'Body') {
            this._e.set(pose.bodyPitch, pose.bodyYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
        } else if (part === 'Head') {
            this._e.set(0, pose.headYaw, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.headLift, 0);
        } else if (part === 'Arms') {
            this._e.set(pose.armsPitch - pose.recoil * 0.12, 0, 0, 'YXZ');
            this._anim.makeRotationFromEuler(this._e);
            this._anim.setPosition(0, pose.armsLift, pose.recoil * 0.12);
        } else if (part === 'LegL') {
            this._anim.makeRotationX(pose.swingL);
        } else if (part === 'LegR') {
            this._anim.makeRotationX(pose.swingR);
        }
        target.copy(root);
        if (pose.deathT) {
            this._e.set(0, 0, pose.deathDirection * pose.deathT * Math.PI * 0.5);
            this._local.makeRotationFromEuler(this._e);
            var shrink = 1 - Math.pow(pose.deathT, 3) * .95;
            this._local.scale(this._s.setScalar(shrink));
            this._local.setPosition(0, .12 * Math.sin(pose.deathT * Math.PI), 0);
            target.multiply(this._local);
        }
        return target.multiply(source.restMatrices[part]).multiply(this._anim);
    }

    getMuzzlePosition(index, squad, target) {
        target = target || new THREE.Vector3();
        if (index < 0 || index >= squad.count) return null;
        this._composeRoot(index, squad, !!squad._moving, squad._lean || 0, squad._tilt || 0, this._root);
        var pose = this._poseFor(index, squad.soldiers[index], !!squad._moving, this._lastTime);
        var bank = this.banks[this.activeBank];
        this._partMatrix('Arms', bank.source, this._root, pose, this._temp);
        bank.meshes.Arms.setMatrixAt(index, this._temp);
        bank.meshes.Arms.instanceMatrix.needsUpdate = true;
        this._muzzleWorld.copy(this._temp).multiply(this.data.muzzleMatrix);
        return target.setFromMatrixPosition(this._muzzleWorld);
    }

    pose(index) {
        if (index < 0 || index >= this._debugPoses.length || !this._debugPoses[index]) return null;
        var pose = this._debugPoses[index];
        return {
            state: pose.state,
            phase: pose.phase,
            swingL: pose.swingL,
            swingR: pose.swingR,
            recoil: pose.recoil
        };
    }
};

// V16: 职业士兵辨识表 — 乘法染色(与 CLASS_DEFS.color 身份色呼应) + 职业附件
SoldierRenderer.CLASS_PRESENTATION = {
    rifleman: { tint: [1, 1, 1] },
    gunner:   { tint: [1.22, 0.98, 0.82], attach: 'heavyplate' },
    marksman: { tint: [1.05, 0.9, 1.28], attach: 'scoutcap' },
    medic:    { tint: [0.82, 1.18, 0.94], attach: 'medickit' }
};
SoldierRenderer.ACC_MAX = 600;
SoldierRenderer.HERO_LIMIT = 100;
SoldierRenderer.MAX_GHOSTS = 16;
SoldierRenderer.SHOOT_DURATION = 0.16;
SoldierRenderer.HIT_DURATION = 0.18;
SoldierRenderer.DEATH_DURATION = 0.65;
if (typeof window !== 'undefined') window.SoldierRenderer = SoldierRenderer;


/* ===== [[ js/enemy-models.js ]] ===== */
// V4.2: local Blender assets, cached immutable resources and rigid-part batches.
var EnemyModelLoader = class EnemyModelLoader {
    static load(keys) {
        if (keys === undefined) keys = this.KEYS;
        if (!this._data) this._data = { parts: this.PARTS, styles: {} };
        if (!this._keyPromises) this._keyPromises = {};
        if (!this._failedKeys) this._failedKeys = {};
        if (!this._bootT0) this._bootT0 = performance.now();
        var initial = !Object.keys(this._data.styles).length;
        return Promise.all(keys.map(function(key) {
            if (this._data.styles[key]) return Promise.resolve();
            if (this._keyPromises[key]) return this._keyPromises[key];
            // Decode critical banks together; background banks are serialized and
            // yield to input/rendering without adding seconds of artificial delay.
            var start = initial ? Promise.resolve() : (this._queue || Promise.resolve()).then(function() {
                return new Promise(function(resolve) {
                    if (typeof window !== 'undefined' && window.requestIdleCallback) {
                        window.requestIdleCallback(resolve, { timeout: 120 });
                    } else setTimeout(resolve, 16);
                });
            });
            var task = start.then(function() { return this._loadKeys([key]); }.bind(this)).then(function(styles) {
                this._data.styles[key] = styles[key];
                delete this._keyPromises[key];
                delete this._failedKeys[key];
                this._updateLoadStatus();
                return styles[key];
            }.bind(this), function(error) {
                delete this._keyPromises[key];
                this._failedKeys[key] = true;
                this._updateLoadStatus();
                throw error;
            }.bind(this));
            this._keyPromises[key] = task;
            if (!initial) this._queue = task.catch(function() {});
            return task;
        }, this)).then(function() {
            this._updateLoadStatus();
            if (!this.loadMs) this.loadMs = performance.now() - this._bootT0;
            return this._data;
        }.bind(this)).catch(function(e) {
            this._updateLoadStatus();
            throw e;
        }.bind(this));
    }
    static _updateLoadStatus() {
        var loaded = Object.keys(this._data.styles).length;
        if (Object.keys(this._keyPromises).length) this.status = 'loading';
        else if (Object.keys(this._failedKeys).length) this.status = loaded ? 'partial_failed' : 'failed';
        else this.status = loaded === this.KEYS.length ? 'loaded' : 'partial';
    }
    static loadCritical() {
        // First encounter uses normal/fast. Special enemies continue after home is usable.
        if (typeof window !== 'undefined' && window.__BootProgress) window.__BootProgress.total = 6;
        return this.load(['normal', 'fast']);
    }
    static _loadKeys(keys) {
        var loaded = [], loader = new THREE.GLTFLoader();
        this.status = 'loading';
        if (typeof window !== 'undefined' && window.__BootProgress && keys.length === this.KEYS.length) {
            window.__BootProgress.total = 2 + this.KEYS.length * 2; // 士兵2 + 全部僵尸/Boss
        }
        return Promise.allSettled(keys.flatMap(key => ['hero','lod'].map(lod=>new Promise((resolve,reject)=>{
            var category=['normal','fast','shield','split','spitter','thrower','flanker','elite','bomber'].includes(key)?'zombies':'bosses';
            var url='assets/game/models/'+category+'/'+key+'/'+key+(lod==='lod'?'-lod':'')+'.glb';
            if (typeof Platform === 'undefined' || Platform.id === 'h5') url += '?v=1910';
            loader.load(url,g=>{
                try {
                    g.scene.updateMatrixWorld(true);
                    var bank={geometries:{},restMatrices:{},material:null,url:url};
                    for(var name of EnemyModelLoader.PARTS) {
                        var n=g.scene.getObjectByName(name);
                        if(!n || !n.isMesh || !n.geometry.index || !n.geometry.attributes.uv || !n.geometry.attributes.normal || Array.isArray(n.material)) throw Error(key+' invalid part '+name);
                        if(bank.material && bank.material!==n.material) throw Error(key+' material is not shared');
                        bank.material=n.material;
                        bank.geometries[name]=n.geometry;
                        bank.restMatrices[name]=n.matrixWorld.clone();
                    }
                    if(!bank.material.isMeshStandardMaterial || !bank.material.map || !bank.material.roughnessMap) throw Error(key+' missing PBR texture');
                    for(var tex of [bank.material.map,bank.material.roughnessMap]) if(!tex.image || !tex.image.width) throw Error(key+' image did not decode');
                    loaded.push(g.scene);
                    resolve({key,lod,bank});
                }catch(e){SoldierModelLoader._disposeScene(g.scene);reject(e);}
            },undefined,ev=>{
                if (window.__BootProgress && ev) window.__BootProgress.file(url, ev.loaded || 0, ev.total || 1);
            },e=>reject(Error('Enemy asset failed: '+url+' '+(e.message||e))));
        })))).then(results=>{
            var fail=results.find(r=>r.status==='rejected');
            if(fail)throw fail.reason;
            var styles={};
            for(var r of results) {var v=r.value;(styles[v.key]||(styles[v.key]={}))[v.lod]=v.bank;}
            for(var key of keys) {
                var h=styles[key].hero,l=styles[key].lod;
                if(l.material!==h.material)SoldierModelLoader._disposeMaterial(l.material);
                l.material=h.material;
                // V19.1: 控制有机生物材质的IBL反射强度(消除玩具塑料反光), 重装护盾/精英/Boss保留硬朗金属高光
                h.material.envMapIntensity = ['shield','elite','bruiser','bulwark','titan','overlord'].includes(key) ? 0.78 : 0.36;
                h.material.onBeforeCompile=function(shader){shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');};
                if(['spitter','thrower','spitking','hivelord','overlord','bomber','shield','elite'].includes(key)) {
                    var image=h.material.map.image,canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
                    var ctx=canvas.getContext('2d');ctx.drawImage(image._impl || image,0,0);var pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
                    // Blender cell 11 is bottom-origin row 2; PNG/canvas flips it to top-origin row 1.
                    for(var py=0;py<canvas.height;py++)for(var px=0;px<canvas.width;px++) {
                        if(px<canvas.width*.75 || py<canvas.height*.25 || py>=canvas.height*.5) {
                            var off=(py*canvas.width+px)*4;pixels.data[off]=pixels.data[off+1]=pixels.data[off+2]=0;
                        }
                    }
                    ctx.putImageData(pixels,0,0);var emissive=new THREE.CanvasTexture(canvas);emissive.flipY=false;emissive.encoding=THREE.sRGBEncoding;
                    h.material.emissiveMap=emissive;h.material.emissive.setHex(0xffffff);h.material.emissiveIntensity=.65;
                    h.material.onBeforeCompile=function(shader){
                        shader.fragmentShader=shader.fragmentShader.replace('#include <encodings_fragment>','gl_FragColor = LinearTosRGB( gl_FragColor );');
                        shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n\n#ifdef USE_INSTANCING_COLOR\nfloat glowPower=max(totalEmissiveRadiance.r,max(totalEmissiveRadiance.g,totalEmissiveRadiance.b));\nif(vColor.r>1.25 && vColor.g<.8)totalEmissiveRadiance=vec3(1.,.08,.15)*glowPower;\nelse if(vColor.r>1.05 && vColor.g<.95 && vColor.b>1.15)totalEmissiveRadiance=vec3(.7,.15,1.)*glowPower;\n#endif');
                    };
                }
                h.material.customProgramCacheKey=function(){return 'v121-pbr-display';};
            }
            return styles;
        }).catch(e=>{loaded.forEach(s=>SoldierModelLoader._disposeScene(s));throw e;});
    }
    static get(){return this._data;}
};
EnemyModelLoader.PARTS=['Body','Head','Arms','LegL','LegR'];
EnemyModelLoader.KEYS=['normal','fast','shield','split','spitter','thrower','flanker','elite','bomber','bruiser','bulwark','spitking','hivelord','titan','overlord'];
EnemyModelLoader.status='idle';EnemyModelLoader.loadMs=0;
// V14.2: Boss 造型辨识表 — 每型专属染色/体态/入场特效色(表现层; GLB 资产不动)。
// 解决 hivelord/titan 等实机同形同色不可辨识的问题(逐型实机截图审计)。
EnemyModelLoader.BOSS_PRESENTATION={
    bruiser:  { tint:[1.0,1.0,1.0],    fx:0xFF8A4A },
    bulwark:  { tint:[0.96,1.0,1.08],  fx:0x57CFFF },
    hivelord: { tint:[1.18,1.28,0.72], fx:0xA8E84A,
                bodyScale:[1.30,1.02,1.30], headScale:[0.94,0.92,0.94], attach:'sacs' },
    overlord: { tint:[1.0,1.0,1.0],    fx:0xB26AE8 },
    spitking: { tint:[1.22,1.32,0.68], fx:0xC8E84A },
    titan:    { tint:[0.94,0.98,1.04], fx:0x9AA8B4 }
};
// V14: 感染者外观变体 — 确定性实例染色族(乘法系数, 以e.phase为种子, 同一怪每帧一致)。
// 只做轻微色偏保持贴图质感与全局风格统一; 精英/自爆/冰冻等状态染色在其后覆盖。
// V14.2: 体型 Rig 侧影家族 — 解决"变体只是颜色不同": 壮硕/驼背/瘦长/标准
// (仅躯干/头/臂, 腿不动防悬空; 与附件/染色正交叠加)
EnemyModelLoader.BODY_RIGS={
    standard:{ bodyW:1,    bodyH:1,    pitch:0,    armW:1,    armH:1,    headS:1,    headPitch:0    },
    brute:   { bodyW:1.22, bodyH:1.04, pitch:0.06, armW:1.30, armH:1.04, headS:0.92, headPitch:0.05 },
    huncher: { bodyW:1.06, bodyH:0.90, pitch:0.30, armW:1.02, armH:0.94, headS:1.0,  headPitch:0.34 },
    wiry:    { bodyW:0.88, bodyH:1.10, pitch:0.04, armW:0.82, armH:1.14, headS:0.96, headPitch:0.02 }
};
EnemyModelLoader.VARIANT_TINTS={
    normal:[[1,1,1],[1.08,.96,.88],[.89,1.06,.92],[.96,.98,1.12],[1.02,1.06,.82]],
    fast:  [[1,1,1],[1.12,.92,.84],[.90,1.03,.90],[1.04,1.00,.88]],
    shield:[[1,1,1],[.93,.99,1.13],[1.06,.94,.92]],
    split: [[1,1,1],[1.09,.92,1.06],[.92,1.06,.90]],
    spitter:[[1,1,1],[.88,1.12,.84],[1.07,1.10,.78],[.95,1.04,1.10]]
};

var EnemyArmyRenderer = class EnemyArmyRenderer {
    constructor(scene) {
        this.scene=scene;this.data=EnemyModelLoader.get();this.banks={};
        this._root=new THREE.Matrix4();this._matrix=new THREE.Matrix4();this._pose=new THREE.Matrix4();
        this._pose2=new THREE.Matrix4();this._e=new THREE.Euler();this._color=new THREE.Color();this._counts={};
        this._v14=new THREE.Vector3();
        // V14: 头部/肩部附件库(军盔/便帽/肩甲) — 每附件每(style,lod)一个InstancedMesh, 用到才可见
        this.accBanks={};
        // V15-ART-006: 极清透边缘发光六边形护盾 (常态内部近乎全透明, 绝不抢眼或遮挡Boss装甲与表情!)
        var hexCv = document.createElement('canvas'); hexCv.width = 256; hexCv.height = 128;
        var hctx = hexCv.getContext('2d');
        hctx.clearRect(0, 0, 256, 128);
        var hGrad = hctx.createLinearGradient(0, 0, 0, 128);
        hGrad.addColorStop(0.0, 'rgba(90, 235, 255, 0.28)');
        hGrad.addColorStop(0.22, 'rgba(70, 215, 255, 0.04)');
        hGrad.addColorStop(0.78, 'rgba(70, 215, 255, 0.04)');
        hGrad.addColorStop(1.0, 'rgba(90, 235, 255, 0.28)');
        hctx.fillStyle = hGrad; hctx.fillRect(0, 0, 256, 128);
        hctx.strokeStyle = 'rgba(130, 245, 255, 0.24)';
        hctx.lineWidth = 1.4;
        var hr = 22, dx = hr * 1.5, dy = hr * Math.sqrt(3);
        for (var row = -1; row < 7; row++) {
            for (var col = -1; col < 10; col++) {
                var cx = col * dx, cy = row * dy + (col % 2 ? dy * 0.5 : 0);
                hctx.beginPath();
                for (var si = 0; si < 6; si++) {
                    var ang = si * Math.PI / 3;
                    var px = cx + Math.cos(ang) * (hr - 1.2), py = cy + Math.sin(ang) * (hr - 1.2);
                    if (si === 0) hctx.moveTo(px, py); else hctx.lineTo(px, py);
                }
                hctx.closePath(); hctx.stroke();
            }
        }
        var hexTex = new THREE.CanvasTexture(hexCv);
        hexTex.wrapS = hexTex.wrapT = THREE.RepeatWrapping;
        hexTex.repeat.set(2, 1);
        this.shieldMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,24,14),new THREE.MeshBasicMaterial({map:hexTex,color:0x66E6FF,transparent:true,opacity:.42,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide}),8);
        this.shieldMesh.count=0;this.shieldMesh.frustumCulled=false;this.shieldMesh.renderOrder=4;this.shieldMesh.userData.artSource='V15-ART-006 subtle Fresnel hex energy shield';scene.add(this.shieldMesh);
        this._shieldLocal=new THREE.Matrix4().makeScale(.96,1.10,.96);this._shieldLocal.setPosition(0,.80,0);

        // V15-ART-002: 怪物与Boss柔和接地阴影 (单 InstancedMesh, 彻底消除漂浮感)
        var shCv = document.createElement('canvas'); shCv.width = shCv.height = 64;
        var shCtx = shCv.getContext('2d');
        var shGrad = shCtx.createRadialGradient(32, 32, 4, 32, 32, 30);
        shGrad.addColorStop(0, 'rgba(14, 18, 24, 0.52)');
        shGrad.addColorStop(0.6, 'rgba(14, 18, 24, 0.28)');
        shGrad.addColorStop(1, 'rgba(14, 18, 24, 0)');
        shCtx.fillStyle = shGrad; shCtx.fillRect(0, 0, 64, 64);
        var shPlane = new THREE.PlaneGeometry(1, 1); shPlane.rotateX(-Math.PI * 0.5);
        this.shadowMesh = new THREE.InstancedMesh(shPlane, new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(shCv), transparent: true, depthWrite: false
        }), 448);
        this.shadowMesh.count = 0; this.shadowMesh.frustumCulled = false; this.shadowMesh.renderOrder = 1;
        this.shadowMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        scene.add(this.shadowMesh);
    }
    /** V14+V15: 怪物/Boss附件几何(程序化共享顶点色材质) */
    static _accGeometry(name) {
        if (name === 'sacs' || name === 'horns' || name === 'plates' || name === 'ironfist' || name === 'bossGauntlets' || name === 'bossHorns') return EnemyArmyRenderer._bossAccGeometry(name);
        if (EnemyArmyRenderer._accGeos && EnemyArmyRenderer._accGeos[name]) return EnemyArmyRenderer._accGeos[name];
        if (!EnemyArmyRenderer._accGeos) EnemyArmyRenderer._accGeos={};
        var geos=[], mat;
        if (name === 'monsterHorns') {
            // V15: 紫色卡通怪兽标志性双角 + 尖耳 (取代普通方块僵尸感)
            geos.push(colorize(new THREE.ConeGeometry(0.068, 0.24, 7), 0xE6D8F5).rotateZ(0.46).translate(-0.15, 0.16, 0.02));
            geos.push(colorize(new THREE.ConeGeometry(0.068, 0.24, 7), 0xE6D8F5).rotateZ(-0.46).translate(0.15, 0.16, 0.02));
            geos.push(colorize(new THREE.ConeGeometry(0.052, 0.16, 6), 0x6A2CA8).rotateZ(1.15).translate(-0.22, -0.02, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.052, 0.16, 6), 0x6A2CA8).rotateZ(-1.15).translate(0.22, -0.02, 0));
            mat = { color: 0xFFFFFF, roughness: 0.45, metalness: 0.12, vertexColors: true };
        } else if (name === 'fastSpikes') {
            // V15: 快速型怪兽背鳍/尖耳轮廓
            geos.push(colorize(new THREE.ConeGeometry(0.06, 0.26, 6), 0xFF9F43).rotateX(-0.35).translate(0, 0.19, -0.04));
            geos.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 6), 0xF2D5FF).rotateZ(0.75).translate(-0.19, 0.08, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 6), 0xF2D5FF).rotateZ(-0.75).translate(0.19, 0.08, 0));
            mat = { color: 0xFFFFFF, roughness: 0.45, metalness: 0.15, vertexColors: true };
        } else if (name === 'helmet') {
            geos.push(colorize(new THREE.SphereGeometry(0.21, 10, 6, 0, Math.PI * 2, 0, Math.PI * 0.52), 0x5A6B4A));
            geos.push(colorize(new THREE.CylinderGeometry(0.215, 0.23, 0.04, 10), 0x46523C).translate(0, -0.015, 0));
            geos.push(colorize(new THREE.BoxGeometry(0.24, 0.04, 0.09), 0x37402E).translate(0, -0.04, 0.17));
            mat = { color: 0xFFFFFF, roughness: 0.55, metalness: 0.35, vertexColors: true };
        } else if (name === 'cap') {
            geos.push(colorize(new THREE.CylinderGeometry(0.17, 0.185, 0.10, 9), 0x3C4658));
            geos.push(colorize(new THREE.BoxGeometry(0.17, 0.025, 0.13), 0x2F3745).translate(0, -0.04, 0.20));
            mat = { color: 0xFFFFFF, roughness: 0.8, metalness: 0.05, vertexColors: true };
        } else if (name === 'pauldron') {
            // V15: 重装怪兽双侧尖刺护肩 + 铁环项圈 (Body 局部空间)
            geos.push(colorize(new THREE.SphereGeometry(0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58), 0x495664).translate(-0.34, 0.28, 0));
            geos.push(colorize(new THREE.SphereGeometry(0.20, 8, 6, 0, Math.PI * 2, 0, Math.PI * 0.58), 0x495664).translate(0.34, 0.28, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.055, 0.18, 6), 0xF5B82E).rotateZ(0.55).translate(-0.44, 0.40, 0));
            geos.push(colorize(new THREE.ConeGeometry(0.055, 0.18, 6), 0xF5B82E).rotateZ(-0.55).translate(0.44, 0.40, 0));
            mat = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.55, vertexColors: true };
        }
        var merged = mergeGeometries(geos);
        merged.userData = { artSource: 'V14 enemy accessory procedural: ' + name };
        EnemyArmyRenderer._accGeos[name] = { geo: merged, matParams: mat };
        return EnemyArmyRenderer._accGeos[name];
    }
    _accBank(style, lod, name, geoKey) {
        var key = style + ':' + lod + ':' + name;
        if (this.accBanks[key]) return this.accBanks[key];
        var acc = EnemyArmyRenderer._accGeometry(geoKey || name);
        var lambertParams = { color: acc.matParams && acc.matParams.color !== undefined ? acc.matParams.color : 0xFFFFFF, vertexColors: !!(acc.matParams && acc.matParams.vertexColors) };
        var mat = new THREE.MeshLambertMaterial(lambertParams);
        mat.color.setHex(0xFFFFFF);
        var mesh = new THREE.InstancedMesh(acc.geo, mat, EnemyArmyRenderer.ACC_MAX || 448);
        mesh.name = 'Enemy_' + style + '_' + lod + '_acc_' + name;
        mesh.count = 0; mesh.frustumCulled = false;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.visible = false;
        mesh.userData.artSource = 'V14 accessory ' + name + ' (head-local)';
        this.scene.add(mesh);
        return this.accBanks[key] = { mesh: mesh, count: 0 };
    }
    _bank(style,lod) {
        // V5.1.5 防御: 未知风格回退normal(避免渲染循环每帧崩溃), 并告警暴露根因
        if(!this.data.styles[style]) {
            if(!this._warnedStyles) this._warnedStyles = {};
            if(!this._warnedStyles[style]) { this._warnedStyles[style] = 1; console.warn('[EnemyArmyRenderer] unknown style:', style); }
            style = 'normal';
        }
        var key=style+':'+lod;
        if(this.banks[key])return this.banks[key];
        var source=this.data.styles[style][lod],meshes={};
        for(var part of this.data.parts) {
            var m=new THREE.InstancedMesh(source.geometries[part],source.material,448); // V5.1.5: 单类型可堆448(320+活敌全同类型)
            m.name='Enemy_'+style+'_'+lod+'_'+part;m.count=0;m.frustumCulled=false;
            m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);m.setColorAt(0,new THREE.Color(1,1,1));
            m.userData.artSource=source.url;m.userData.collidable=false;
            this.scene.add(m);meshes[part]=m;
        }
        return this.banks[key]={meshes,source,count:0};
    }
    update(dt,time,enemies,squadZ) {
        var shieldCount=0, shadowCount=0;
        for(var k in this.banks)this.banks[k].count=0;
        for(var k2 in this.accBanks)this.accBanks[k2].count=0;
        for(var e of enemies) {
            if(e.removeReady || e.model.scale.x<.005)continue;
            var style=e.artStyle||e.type;
            var lod=e.isBoss?(Math.abs(e.z-squadZ)>42?'lod':'hero'):((enemies.length>40||Math.abs(e.z-squadZ)>22)?'lod':'hero');
            var bank=this._bank(style,lod),slot=bank.count++;
            if(slot>=448){bank.count=448;continue;}
            e.model.updateMatrix();this._root.copy(e.model.matrix);
            // V15 / V16.2: 怪物/Boss柔和接地阴影 (浮空跃栏/龙卷风卷起时缩小阴影增强立体感)
            if (!e.dying && shadowCount < 448) {
                var liftScale = Math.max(0.45, Math.min(1.0, 1.0 - (e._liftY || 0) * 0.22));
                var shS = (e.visScale || 1) * (e.isBoss ? 1.55 : 0.96) * liftScale;
                this._pose.makeScale(shS, 1, shS * 0.86);
                this._pose.setPosition(e.x, 0.032, e.z);
                this.shadowMesh.setMatrixAt(shadowCount++, this._pose);
            }
            if(e.alive && e.shieldT>0 && shieldCount<8) {this._matrix.copy(this._root).multiply(this._shieldLocal);this.shieldMesh.setMatrixAt(shieldCount++,this._matrix);}
            var speed=e.type==='fast'?10:(e.isBoss?3:4.5),phase=time*speed+e.phase;
            var walk=e.dying?0:Math.sin(phase)*(.45*(e.frozenT>0?.3:1));
            var attack=e.attackT||0,charge=e.chargeT||0;
            this._color.setRGB(1,1,1);
            // V14.2: Boss 造型辨识染色(先于阶段/冰冻/受击覆盖)
            var bp = e.isBoss ? EnemyModelLoader.BOSS_PRESENTATION[style] : null;
            if (bp) this._color.setRGB(bp.tint[0], bp.tint[1], bp.tint[2]);
            // V14: 外观变体族染色(确定性, e.phase为种子; 精英/自爆/冰冻等状态染色随后覆盖)
            var tints=EnemyModelLoader.VARIANT_TINTS[style];
            if(tints && !e.isBoss && e.type!=='elite' && e.type!=='bomber') {
                var vt=tints[Math.floor(((e.phase||0)*13.37)%1*tints.length)%tints.length];
                this._color.setRGB(vt[0],vt[1],vt[2]);
            }
            // V18.0: 商业级低饱和哑光配色校准 (降糖果感15%, 强化fast暗红/shield黑铁/normal暗紫辨识)
            if (!e.isBoss && e.type !== 'elite') {
                if (e.type === 'normal') this._color.multiplyScalar(0.88);
                else if (e.type === 'fast') this._color.setRGB(1.10, 0.56, 0.62);
                else if (e.type === 'shield') this._color.setRGB(0.74, 0.78, 0.85);
                else if (e.type === 'spitter') this._color.setRGB(0.86, 0.90, 0.84);
                else if (e.type === 'thrower') this._color.setRGB(0.90, 0.84, 0.78);
                else if (e.type === 'flanker') this._color.setRGB(0.82, 0.90, 0.94);
            }
            if(e.type==='elite')this._color.setRGB(1.18,1.02,.68);          // 精英暗金染
            if(e.frozenT>0)this._color.setRGB(.50,.85,1.35);
            if(e.phaseIndex>=3)this._color.setRGB(1.35,.72,.75);
            else if(e.phaseIndex===2)this._color.setRGB(1.12,.85,1.2);
            if(e.hitFlash>0)this._color.setRGB(2.8,2.4,1.8);
            // V14: 轮廓变体 — 体宽±5% + 前倾±9°(只动躯干/头/臂, 腿不动避免脚底悬空)
            // V14.2: 体型 Rig 侧影家族 — 四种骨架姿态, 变体不再只有颜色差
            var vw=1,lean=0,rig=EnemyModelLoader.BODY_RIGS.standard;
            if(!e.isBoss && e.type!=='elite' && !e.dying) {
                var rigPool = (style==='fast') ? ['wiry','huncher','standard'] : (style==='shield'||style==='split') ? ['brute','standard'] : ['standard','brute','huncher','wiry'];
                rig = EnemyModelLoader.BODY_RIGS[rigPool[Math.floor(((e.phase||0)*17.77)%1*rigPool.length)%rigPool.length]] || rig;
                vw=1+((((e.phase||0)*5.51)%1)-0.5)*0.10;
                lean=((((e.phase||0)*9.13)%1)-0.5)*0.18;
            }
            for(var part of this.data.parts) {
                this._pose.identity();
                if(part==='LegL'||part==='LegR')this._pose.makeRotationX(walk*(part==='LegL'?1:-1));
                else if(part==='Arms') {
                    this._e.set(-.12-Math.sin(phase)*.05-attack*.65-charge*.4+lean*.5,0,Math.sin(phase)*.04);
                    this._pose.makeRotationFromEuler(this._e);
                    this._pose.scale(this._v14.set(rig.armW,rig.armH,rig.armW));
                } else if(part==='Head') {
                    this._e.set(charge*.12+lean*.6+rig.headPitch,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                    this._pose.makeRotationFromEuler(this._e);
                    var hs = bp ? bp.headScale : null;
                    if (hs) this._pose.scale(this._v14.set(hs[0],hs[1],hs[2]));
                    else this._pose.scale(this._v14.set(rig.headS,rig.headS,rig.headS));
                } else if(part==='Body'&&e.isBoss) {
                    var bs = bp && bp.bodyScale;
                    this._pose.makeScale(
                        (bs ? bs[0] : 1) * (1+charge*.035),
                        (bs ? bs[1] : 1) * (1+charge*.05),
                        (bs ? bs[2] : 1) * (1+charge*.035));
                } else if(part==='Body') {
                    // V14+V14.2: 躯干宽度变体+前倾+Rig 侧影
                    this._e.set(lean + rig.pitch,0,0);
                    this._pose.makeRotationFromEuler(this._e);
                    this._pose.scale(this._v14.set(vw*rig.bodyW,rig.bodyH,vw*rig.bodyW));
                }
                this._matrix.copy(this._root).multiply(bank.source.restMatrices[part]).multiply(this._pose);
                bank.meshes[part].setMatrixAt(slot,this._matrix);
                bank.meshes[part].setColorAt(slot,this._color);
            }
            // V15-ART-004: 全新 Blender 独立重装 Boss 与普通怪兽 GLB 已内置雕塑尖角/机械拳套/肩甲/胸核, 仅保留特殊 Boss 背囊与精英重甲附件
            if(e.isBoss && !e.dying && bp && bp.attach) {
                var bb = this._accBank(style, lod, bp.attach);
                if (bb.count < 16) {
                    var bSlot = bb.count++;
                    var bs2 = bp.bodyScale;
                    this._pose.makeScale((bs2 ? bs2[0] : 1) * (1 + charge * .035), (bs2 ? bs2[1] : 1) * (1 + charge * .05), (bs2 ? bs2[2] : 1) * (1 + charge * .035));
                    this._matrix.copy(this._root).multiply(bank.source.restMatrices.Body).multiply(this._pose);
                    bb.mesh.setMatrixAt(bSlot, this._matrix);
                }
            } else if(!e.isBoss && !e.dying) {
                var accName=this._pickAccessory(style,e);
                if(accName) {
                    var ab=this._accBank(style,lod,accName);
                    if(ab.count<(EnemyArmyRenderer.ACC_MAX||448)) {
                        var aSlot=ab.count++;
                        this._pose.identity();
                        this._e.set(charge*.12+lean*.6,Math.sin(phase*.5)*.09,Math.sin(phase)*.025);
                        this._pose.makeRotationFromEuler(this._e);
                        var local=EnemyArmyRenderer._accLocal(accName);
                        if(local)this._matrix.copy(this._root).multiply(bank.source.restMatrices[accName==='pauldron'?'Body':'Head']).multiply(this._pose).multiply(local);
                        ab.mesh.setMatrixAt(aSlot,this._matrix);
                    }
                }
            }
            // V14: Boss入场演出(表现层一次性钩子 — spawnT弹性入场完成时触发, 不改状态机)
            if(e.isBoss && e.spawnT>=1 && !e._v14EntranceFx) {
                e._v14EntranceFx=true;
                var g=typeof window!=='undefined'?window.__game:null;
                if(g && g.effects && g.world && !e.dying) {
                    var fx = bp ? bp.fx : 0xFF6A55;
                    g.world.shake(.5);
                    g.effects.shockwave(e.x,.06,e.z,fx);
                    g.effects.flash(e.x,1.6,e.z,fx,2.8);
                    g.effects.burst(e.x,1.3,e.z,fx,20,4.6,.7);
                    g.effects.burst(e.x,.4,e.z,0x3A3F46,10,2.2,1.0);
                }
            }
            e.renderBank=style+':'+lod;e.renderSlot=slot;
        }
        // V11.6: 实例缓冲前缀上传 — 原每帧全量上传448槽×5部件矩阵/颜色, 怪多时GPU带宽浪费
        for(var key in this.banks)for(var part of this.data.parts) {
            var mesh=this.banks[key].meshes[part],used=this.banks[key].count;
            mesh.count=used;mesh.visible=used>0;
            mesh.instanceMatrix.updateRange.offset=0;
            mesh.instanceMatrix.updateRange.count=used*16;
            mesh.instanceMatrix.needsUpdate=true;
            if(mesh.instanceColor){mesh.instanceColor.updateRange.offset=0;mesh.instanceColor.updateRange.count=used*3;mesh.instanceColor.needsUpdate=true;}
            mesh.castShadow=mesh.visible&&enemies.length<=20;
        }
        // V14: 附件前缀上传(用到才可见)
        for(var akey in this.accBanks) {
            var amesh=this.accBanks[akey].mesh,aused=this.accBanks[akey].count;
            amesh.count=aused;amesh.visible=aused>0;
            amesh.instanceMatrix.updateRange.offset=0;
            amesh.instanceMatrix.updateRange.count=aused*16;
            amesh.instanceMatrix.needsUpdate=true;
        }
        this.shieldMesh.count=shieldCount; // V11.6: 前缀上传
        this.shieldMesh.instanceMatrix.updateRange.count=shieldCount*16;
        this.shieldMesh.instanceMatrix.needsUpdate=true;
        if (this.shadowMesh) {
            this.shadowMesh.count = shadowCount;
            this.shadowMesh.visible = shadowCount > 0;
            this.shadowMesh.instanceMatrix.updateRange.offset = 0;
            this.shadowMesh.instanceMatrix.updateRange.count = shadowCount * 16;
            this.shadowMesh.instanceMatrix.needsUpdate = true;
        }
    }
    /** V15-ART-004: normal.glb 已内置雕塑双角与尖耳, 仅对 fast/heavy/elite 保留差异化附件 */
    _pickAccessory(style,e) {
        if(e.type==='elite'||style==='shield'||style==='split')return 'pauldron';
        if(style==='fast')return 'fastSpikes';
        return null;
    }
    /** V15-ART-002: Boss 独立重装机械套装 (宽大肩甲+胸甲+发光核心+巨型机械拳套+皇冠角) */
    static _bossAccGeometry(name) {
        if (EnemyArmyRenderer._bossAccGeos && EnemyArmyRenderer._bossAccGeos[name]) return EnemyArmyRenderer._bossAccGeos[name];
        if (!EnemyArmyRenderer._bossAccGeos) EnemyArmyRenderer._bossAccGeos = {};
        var parts = [], matParams;
        if (name === 'ironfist') {
            // V15-ART-002 R2: 精校准贴合 Boss 躯干的重装护甲 (注意 Boss 根节点自带 ~2.4x 缩放!)
            for (var s = -1; s <= 1; s += 2) {
                parts.push(colorize(new THREE.SphereGeometry(0.13, 10, 7, 0, Math.PI * 2, 0, Math.PI * 0.62), 0x394452).scale(1.15, 0.90, 1.05).translate(s * 0.24, 0.20, 0));
                parts.push(colorize(new THREE.BoxGeometry(0.13, 0.04, 0.18), 0xE8A82C).translate(s * 0.24, 0.17, 0));
                parts.push(colorize(new THREE.ConeGeometry(0.035, 0.12, 6), 0xF0F4FA).rotateZ(s * -0.58).translate(s * 0.31, 0.28, 0));
                parts.push(colorize(new THREE.SphereGeometry(0.032, 8, 6), 0xFF4238).translate(s * 0.21, 0.26, 0.08));
            }
            // 贴合胸甲 + 发光红橙色反应堆核心
            parts.push(colorize(new THREE.BoxGeometry(0.32, 0.22, 0.08), 0x2F3844).translate(0, 0.10, 0.14));
            parts.push(colorize(new THREE.CylinderGeometry(0.075, 0.075, 0.04, 12), 0x5A687A).rotateX(Math.PI * 0.5).translate(0, 0.11, 0.18));
            parts.push(colorize(new THREE.SphereGeometry(0.055, 10, 8), 0xFF5A26).scale(1, 1, 0.55).translate(0, 0.11, 0.195));
            // 战术腰带扣
            parts.push(colorize(new THREE.BoxGeometry(0.35, 0.06, 0.25), 0x2A323D).translate(0, -0.06, 0));
            parts.push(colorize(new THREE.BoxGeometry(0.09, 0.07, 0.05), 0xF5B82E).translate(0, -0.06, 0.13));
            matParams = { color: 0xFFFFFF, roughness: 0.36, metalness: 0.55, vertexColors: true };
        } else if (name === 'bossGauntlets') {
            // 精校准重装机械拳套 (紧贴 Boss 双拳, 附带金属指节与橙红充能条)
            for (var gs = -1; gs <= 1; gs += 2) {
                parts.push(colorize(new THREE.BoxGeometry(0.15, 0.16, 0.17), 0x3B4654).translate(gs * 0.25, -0.18, 0.08));
                parts.push(colorize(new THREE.BoxGeometry(0.16, 0.05, 0.18), 0xF2B233).translate(gs * 0.25, -0.12, 0.08));
                parts.push(colorize(new THREE.BoxGeometry(0.13, 0.045, 0.06), 0xFF5526).translate(gs * 0.25, -0.19, 0.16));
            }
            matParams = { color: 0xFFFFFF, roughness: 0.35, metalness: 0.60, vertexColors: true };
        } else if (name === 'bossHorns') {
            // 威慑力弯曲双巨角 + 中央红角
            parts.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 7), 0xF0E6FF).rotateZ(0.55).translate(-0.13, 0.18, 0.01));
            parts.push(colorize(new THREE.ConeGeometry(0.05, 0.20, 7), 0xF0E6FF).rotateZ(-0.55).translate(0.13, 0.18, 0.01));
            parts.push(colorize(new THREE.ConeGeometry(0.04, 0.15, 6), 0xFF5A36).translate(0, 0.21, 0.02));
            matParams = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.2, vertexColors: true };
        } else if (name === 'sacs') {
            parts.push(colorize(new THREE.SphereGeometry(0.24, 8, 6), 0x9ADE3E).translate(-0.26, 0.42, -0.16));
            parts.push(colorize(new THREE.SphereGeometry(0.29, 8, 6), 0x8AD03A).translate(0, 0.5, -0.2));
            parts.push(colorize(new THREE.SphereGeometry(0.22, 8, 6), 0x9ADE3E).translate(0.26, 0.4, -0.16));
            matParams = { color: 0xFFFFFF, roughness: 0.55, vertexColors: true };
        } else if (name === 'horns') {
            parts.push(colorize(new THREE.ConeGeometry(0.075, 0.34, 6), 0x3A2440).translate(-0.17, 0.2, 0).rotateZ(0.5));
            parts.push(colorize(new THREE.ConeGeometry(0.075, 0.34, 6), 0x3A2440).translate(0.17, 0.2, 0).rotateZ(-0.5));
            matParams = { color: 0xFFFFFF, roughness: 0.4, metalness: 0.3, vertexColors: true };
        } else if (name === 'plates') {
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.16, 0.34), 0x5E6A70).translate(-0.34, 0.42, 0).rotateZ(0.12));
            parts.push(colorize(new THREE.BoxGeometry(0.3, 0.16, 0.34), 0x5E6A70).translate(0.34, 0.42, 0).rotateZ(-0.12));
            matParams = { color: 0xFFFFFF, roughness: 0.6, metalness: 0.35, vertexColors: true };
        }
        var merged = mergeGeometries(parts);
        merged.userData = { artSource: 'V15 boss mecha attachment procedural: ' + name };
        EnemyArmyRenderer._bossAccGeos[name] = { geo: merged, matParams: matParams };
        return EnemyArmyRenderer._bossAccGeos[name];
    }
    /** V14.2: Boss 附件局部矩阵(Body/头 局部空间), sacs 附带呼吸脉动 */
    static _bossAccLocal(name, time, z) {
        if (!EnemyArmyRenderer._bossAccLocals) EnemyArmyRenderer._bossAccLocals = {};
        var cached = EnemyArmyRenderer._bossAccLocals[name];
        if (name === 'sacs') {
            var pulse = 1 + Math.sin(time * 2.4 + (z || 0) * 1.7) * 0.06;
            cached = cached || new THREE.Matrix4();
            cached.makeScale(pulse, pulse, pulse);
            EnemyArmyRenderer._bossAccLocals[name] = cached;
            return cached;
        }
        if (!cached) {
            cached = new THREE.Matrix4();
            if (name === 'horns') cached.setPosition(0, 0.22, 0);
            EnemyArmyRenderer._bossAccLocals[name] = cached;
        }
        return cached;
    }
    /** V14+V15: 附件局部偏移(预建, 热循环零分配) — 头顶/躯干肩位 */
    static _accLocal(name) {
        if(!EnemyArmyRenderer._accLocals) {
            EnemyArmyRenderer._accLocals={
                monsterHorns:new THREE.Matrix4().setPosition(0,0.20,0),
                fastSpikes:new THREE.Matrix4().setPosition(0,0.20,0),
                helmet:new THREE.Matrix4().setPosition(0,0.26,0),
                cap:new THREE.Matrix4().setPosition(0,0.28,0),
                pauldron:new THREE.Matrix4().setPosition(0,0,0)
            };
        }
        return EnemyArmyRenderer._accLocals[name];
    }
    clear(){for(var key in this.banks)for(var p of this.data.parts)this.banks[key].meshes[p].count=0;for(var ak in this.accBanks)this.accBanks[ak].mesh.count=0;this.shieldMesh.count=0;if(this.shadowMesh)this.shadowMesh.count=0;}
};


/* ===== [[ js/boss-v42.js ]] ===== */
// Boss abilities are part of an active encounter, never a second pacing wave.
var V42BossController = {
    update:function(e,dt,squad,manager,effects) {
        var fraction=Math.max(0,e.hp/e.maxHp), final=e.artStyle==='overlord';
        var phase=final?(fraction<=.33?3:fraction<=.66?2:1):(fraction<=.5?2:1);
        if(e.phaseIndex!==phase) {
            e.phaseIndex=phase;
            e.abilityTimer=.1;e.pendingAttack=null;e.chargeT=0;
            if(final&&phase>1)e.shieldT=0;
            effects.floatText(e.x,2.6,e.z,final?'核心阶段 '+phase:(phase===1?'领主出现':'强化阶段'),phase===3?'#ff666c':'#cb95ff',true);
            effects.shockwave(e.x,.04,e.z,phase===3?0xff5a65:0x9b78ff);
        }
        e.shieldT=Math.max(0,(e.shieldT||0)-dt);
        e.abilityTimer=(e.abilityTimer===undefined?3.5:e.abilityTimer)-dt;
        if(e.pendingAttack) {
            e.pendingAttack.t-=dt;e.chargeT=Math.min(1,1-e.pendingAttack.t/.95);
            if(e.pendingAttack.t<=0) {
                var a=e.pendingAttack;e.pendingAttack=null;e.chargeT=0;e.attackT=1;
                effects.shockwave(a.x,.06,a.z,e.phaseIndex>=3?0xff535f:0xffbe55);
                effects.burst(a.x,.3,a.z,0xffc558,12,3,.5);
                if(Math.abs(squad.x-a.x)<1.0&&Math.abs(squad.z-a.z)<1.6)squad.killSoldiers(final?7:3,effects);
            }
        }
        if(e.abilityTimer>0||e.pendingAttack)return;
        e.abilityTimer=final?(phase===3?2.6:4.4):(phase===2?3.8:5.0);
        var kind=e.artStyle;
        if(kind==='bulwark'||(final&&phase===1)) {
            e.shieldT=1.7;e.attackT=.7;
            effects.shockwave(e.x,.05,e.z,0x70d9ff);
        } else if(kind==='spitking') {
            e.chargeT=.8;
            for(var i=-1;i<=1;i++)manager.spawnSpit(e.x+i*.55,1.0,e.z,squad);
            effects.burst(e.x,1.1,e.z,0x9eff7b,6,2,.4);
        } else if(kind==='hivelord'||(final&&phase===2)) {
            var cap=Math.min(2,Math.max(0,24-manager.aliveCount)); // V5.1.3: 召唤压力再下调(Boss磨损5/s→3.75/s)
            for(var j=0;j<cap;j++)manager.spawnEnemy(j%2?'fast':'split',e.x+(j-1.5)*.65,e.z-2,phase===2?8:5);
            effects.shockwave(e.x,.05,e.z,0xbe79ff);
        } else {
            e.pendingAttack={t:.95,x:squad.x,z:squad.z};e.chargeT=0;
            effects.shockwave(squad.x,.045,squad.z,0xff616b);
            effects.floatText(squad.x,1.3,squad.z,'闪避冲击!','#ffb06c',false);
        }
    }
};


/* ===== [[ js/art-v42.js ]] ===== */
// ===== V4.2 presentation layer: gates, city dressing and UI composition =====
(function (global) {
    'use strict';

    var V42Art = {};
    var TAU = Math.PI * 2;

    var GATE_STYLES = {
        add:  { kind: 'common', icon: 'helmet', title: '增援', frame: 0x26D96B, dark: 0x0C4A26, light: 0xB8FFCE, glass: 0x22E06B, hex: '#26D96B' },
        mul:  { kind: 'epic',   icon: 'star',   title: '倍增', frame: 0xB44CFF, dark: 0x3F146B, light: 0xF2C6FF, glass: 0xC45CFF, hex: '#B44CFF' },
        buff: { kind: 'rare',   icon: 'rifle',  title: '火力', frame: 0x2898FF, dark: 0x0E3A73, light: 0xACE8FF, glass: 0x2AA8FF, hex: '#2898FF' },
        coin: { kind: 'epic',   icon: 'coin',   title: '金币', frame: 0xFFB824, dark: 0x6E3C04, light: 0xFFF29E, glass: 0xFFC533, hex: '#FFB824' },
        risk: { kind: 'danger', icon: 'skull',  title: '高危', frame: 0xF03E4E, dark: 0x6B101C, light: 0xFFABB4, glass: 0xFF4757, hex: '#F03E4E' }
    };

    function clampNumber(value, low, high) {
        return Math.max(low, Math.min(high, value));
    }

    function roundedRectGeometry(width, height, radius, depth) {
        var w2 = width * 0.5;
        var h2 = height * 0.5;
        var r = Math.min(radius, w2, h2);
        var shape = new THREE.Shape();
        shape.moveTo(-w2 + r, -h2);
        shape.lineTo(w2 - r, -h2);
        shape.quadraticCurveTo(w2, -h2, w2, -h2 + r);
        shape.lineTo(w2, h2 - r);
        shape.quadraticCurveTo(w2, h2, w2 - r, h2);
        shape.lineTo(-w2 + r, h2);
        shape.quadraticCurveTo(-w2, h2, -w2, h2 - r);
        shape.lineTo(-w2, -h2 + r);
        shape.quadraticCurveTo(-w2, -h2, -w2 + r, -h2);
        var geo = new THREE.ExtrudeGeometry(shape, {
            depth: depth,
            steps: 1,
            curveSegments: 2,
            bevelEnabled: true,
            bevelSegments: 1,
            bevelSize: Math.min(0.028, r * 0.35),
            bevelThickness: 0.025
        });
        geo.translate(0, 0, -depth * 0.5);
        return geo;
    }

    function applyTransform(geo, x, y, z, rx, ry, rz, sx, sy, sz) {
        if (sx !== undefined) geo.scale(sx, sy === undefined ? sx : sy, sz === undefined ? sx : sz);
        if (rx) geo.rotateX(rx);
        if (ry) geo.rotateY(ry);
        if (rz) geo.rotateZ(rz);
        geo.translate(x || 0, y || 0, z || 0);
        return geo;
    }

    function mergeColored(parts) {
        var geos = [];
        for (var i = 0; i < parts.length; i++) {
            geos.push(colorize(parts[i].geo, parts[i].color));
        }
        var merged = mergeGeometries(geos);
        for (var j = 0; j < geos.length; j++) geos[j].dispose();
        merged.computeBoundingSphere();
        return merged;
    }

    // This project pins r149, whose display chunk is encodings_fragment.
    // Match the GLB display transform while preserving legacy scenery shading.
    function preparePbr(material) {
        material.onBeforeCompile = function (shader, renderer) {
            if (renderer.outputEncoding !== THREE.LinearEncoding) return;
            shader.fragmentShader = shader.fragmentShader.replace(
                '#include <encodings_fragment>',
                'gl_FragColor = LinearTosRGB( gl_FragColor );'
            );
        };
        material.customProgramCacheKey = function () {
            return 'v42-pbr-r149-display';
        };
        material.userData.v42ColorManaged = true;
        return material;
    }

    function makeGateGlassTexture(style) {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var c = new THREE.Color(style.glass);
        var l = new THREE.Color(style.light);
        var d = new THREE.Color(style.dark);
        var rgb = Math.round(c.r * 255) + ',' + Math.round(c.g * 255) + ',' + Math.round(c.b * 255);
        var lrgb = Math.round(l.r * 255) + ',' + Math.round(l.g * 255) + ',' + Math.round(l.b * 255);
        var drgb = Math.round(d.r * 255) + ',' + Math.round(d.g * 255) + ',' + Math.round(d.b * 255);

        // V19.1: 军事科技全息投影能量幕墙 (顶部与底座强等离子辉光 + 中部半透战术扫描网 + 四角准星框)
        var grad = ctx.createLinearGradient(0, 0, 0, 512);
        grad.addColorStop(0.00, 'rgba(' + lrgb + ',0.94)');
        grad.addColorStop(0.12, 'rgba(' + rgb + ',0.78)');
        grad.addColorStop(0.50, 'rgba(' + drgb + ',0.52)');
        grad.addColorStop(0.86, 'rgba(' + rgb + ',0.80)');
        grad.addColorStop(1.00, 'rgba(' + lrgb + ',0.96)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 256, 512);

        // 精细水平全息扫描线
        ctx.fillStyle = 'rgba(' + lrgb + ',0.13)';
        for (var sy = 8; sy < 504; sy += 10) {
            ctx.fillRect(8, sy, 240, 2);
        }
        // 科技六角蜂巢全息暗纹
        ctx.strokeStyle = 'rgba(' + lrgb + ',0.18)';
        ctx.lineWidth = 1.4;
        var hr = 22, dx = hr * 1.5, dy = hr * 1.732;
        for (var row = 0; row < 14; row++) {
            for (var col = 0; col < 8; col++) {
                var cx = col * dx + 12, cy = row * dy + (col % 2 ? dy * 0.5 : 0);
                ctx.beginPath();
                for (var si = 0; si < 6; si++) {
                    var ang = si * Math.PI / 3;
                    var px = cx + Math.cos(ang) * (hr - 2), py = cy + Math.sin(ang) * (hr - 2);
                    if (si === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
                }
                ctx.closePath(); ctx.stroke();
            }
        }

        // 斜向全息流光束
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.beginPath();
        ctx.moveTo(18, 0); ctx.lineTo(96, 0); ctx.lineTo(0, 195); ctx.lineTo(0, 110);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.10)';
        ctx.beginPath();
        ctx.moveTo(186, 0); ctx.lineTo(226, 0); ctx.lineTo(42, 512); ctx.lineTo(4, 512);
        ctx.closePath(); ctx.fill();

        // 外圈等离子边线 + 四角战术锁定折角 [ ]
        ctx.strokeStyle = 'rgba(' + lrgb + ',0.72)';
        ctx.lineWidth = 6;
        ctx.strokeRect(6, 6, 244, 500);
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 7;
        var cb = 34;
        ctx.beginPath();
        ctx.moveTo(12, 12 + cb); ctx.lineTo(12, 12); ctx.lineTo(12 + cb, 12);
        ctx.moveTo(244 - cb, 12); ctx.lineTo(244, 12); ctx.lineTo(244, 12 + cb);
        ctx.moveTo(12, 500 - cb); ctx.lineTo(12, 500); ctx.lineTo(12 + cb, 500);
        ctx.moveTo(244 - cb, 500); ctx.lineTo(244, 500); ctx.lineTo(244, 500 - cb);
        ctx.stroke();

        var texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.ClampToEdgeWrapping;
        texture.wrapT = THREE.ClampToEdgeWrapping;
        texture.needsUpdate = true;
        return texture;
    }

    function formatGateLabel(data) {
        if (data && data.label !== undefined && data.label !== null && String(data.label).trim()) {
            return String(data.label);
        }
        var value = data ? data.value : '';
        if (data && data.op === 'add') return '+' + value;
        if (data && data.op === 'mul') return '×' + value;
        return String(value === undefined ? '' : value);
    }

    function drawGateIcon(ctx, iconType, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(1.32, 1.32);
        ctx.fillStyle = '#FFFFFF';
        ctx.strokeStyle = 'rgba(0,0,0,0.52)';
        ctx.lineWidth = 7;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        if (iconType === 'helmet') {
            // V19.0: Modern Spec-Ops FAST Helmet + Glowing Cyan Tactical Visor + Side Comms Pods
            ctx.fillStyle = '#1E293B';
            ctx.strokeStyle = '#070E1A';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.arc(0, -8, 44, Math.PI, 0, false);
            ctx.lineTo(44, 6);
            ctx.lineTo(30, 6);
            ctx.lineTo(22, -4);
            ctx.lineTo(-22, -4);
            ctx.lineTo(-30, 6);
            ctx.lineTo(-44, 6);
            ctx.closePath();
            ctx.stroke(); ctx.fill();
            // Side headset pods
            ctx.fillStyle = '#0F172A';
            ctx.beginPath(); ctx.roundRect(-50, 0, 14, 24, 5); ctx.roundRect(36, 0, 14, 24, 5); ctx.stroke(); ctx.fill();
            // Chin / jaw
            ctx.fillStyle = '#F8FAFC';
            ctx.beginPath(); ctx.arc(0, 14, 27, 0.08 * Math.PI, 0.92 * Math.PI, false); ctx.stroke(); ctx.fill();
            // Glowing cyan tactical visor goggles!
            ctx.fillStyle = '#22D3EE';
            ctx.beginPath(); ctx.roundRect(-30, -3, 60, 18, 7); ctx.stroke(); ctx.fill();
            ctx.fillStyle = '#E0F2FE';
            ctx.fillRect(-22, 0, 20, 5);
        } else if (iconType === 'rifle') {
            // Stylized assault rifle angled diagonally (matches V15 +50% gate)
            ctx.rotate(-0.42);
            ctx.beginPath();
            ctx.roundRect(-62, -11, 108, 22, 6);
            ctx.stroke(); ctx.fill();
            // Barrel
            ctx.fillRect(42, -5, 28, 10);
            // Magazine & stock
            ctx.fillRect(-10, 8, 16, 26);
            ctx.fillRect(-62, -6, 18, 26);
            // Sight
            ctx.fillRect(-14, -22, 24, 10);
        } else if (iconType === 'coin') {
            // Stylized gold coin with inner star (matches V15 +100 gate)
            ctx.beginPath(); ctx.arc(0, 0, 48, 0, TAU); ctx.stroke(); ctx.fill();
            ctx.fillStyle = '#FFE47A';
            ctx.beginPath(); ctx.arc(0, 0, 38, 0, TAU); ctx.fill();
            ctx.fillStyle = '#B87208';
            ctx.beginPath();
            for (var s = 0; s < 10; s++) {
                var a = -Math.PI / 2 + s * Math.PI / 5;
                var r = (s % 2 === 0) ? 24 : 11;
                if (s === 0) ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            ctx.closePath(); ctx.fill();
        } else if (iconType === 'star') {
            ctx.beginPath();
            for (var k = 0; k < 10; k++) {
                var ak = -Math.PI / 2 + k * Math.PI / 5;
                var rk = (k % 2 === 0) ? 48 : 22;
                if (k === 0) ctx.moveTo(Math.cos(ak) * rk, Math.sin(ak) * rk);
                else ctx.lineTo(Math.cos(ak) * rk, Math.sin(ak) * rk);
            }
            ctx.closePath(); ctx.stroke(); ctx.fill();
        } else {
            // Danger skull / warning diamond
            ctx.beginPath(); ctx.arc(0, -6, 40, 0, TAU); ctx.stroke(); ctx.fill();
            ctx.fillStyle = '#6B101C';
            ctx.beginPath(); ctx.arc(-15, -8, 9, 0, TAU); ctx.arc(15, -8, 9, 0, TAU); ctx.fill();
        }
        ctx.restore();
    }

    function makeGateChevronTexture(style) {
        var canvas = document.createElement('canvas');
        canvas.width = 256; canvas.height = 256;
        var ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 256, 256);
        var lightCss = '#' + new THREE.Color(style.light).getHexString();
        var mainCss = '#' + new THREE.Color(style.glass).getHexString();
        for (var i = 0; i < 3; i++) {
            var y = 40 + i * 74;
            var alpha = 1.0 - i * 0.18;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = mainCss;
            ctx.lineWidth = 30;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(48, y + 40); ctx.lineTo(128, y); ctx.lineTo(208, y + 40);
            ctx.stroke();
            ctx.strokeStyle = lightCss;
            ctx.lineWidth = 13;
            ctx.stroke();
            ctx.restore();
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        return tex;
    }

    function makeGateTextTexture(label, style) {
        var lines = [label];
        var buffMatch = label.match(/^([\u4e00-\u9fff]+)\s*([+×\-]\d+%?)$/);
        if (buffMatch) {
            lines = [buffMatch[1], buffMatch[2]];
        } else if (/\s/.test(label) && label.length > 5) {
            var words = label.trim().split(/\s+/);
            lines = [words.shift(), words.join(' ')];
        }
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        var glow = new THREE.Color(style.light);
        var frame = new THREE.Color(style.dark);
        var glowCss = '#' + glow.getHexString();
        var frameCss = '#' + frame.getHexString();

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // V15: 上半部大号高对比度立体图标 (头盔 / 步枪 / 金币 / 星标)
        drawGateIcon(ctx, style.icon || 'helmet', 256, 138);

        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.lineJoin = 'round';

        var mainText = lines.length > 1 ? lines[1] : label;
        if (lines.length > 1) {
            // 小标题紧贴图标下方
            ctx.font = '900 44px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            ctx.strokeStyle = frameCss;
            ctx.lineWidth = 9;
            ctx.fillStyle = glowCss;
            ctx.strokeText(lines[0], 256, 232);
            ctx.fillText(lines[0], 256, 232);
        }

        // 超大加粗白字数值 (高对比黑绿/黑蓝厚描边 + 立体投影)
        var fontSize = lines.length > 1 ? 150 : 172;
        do {
            ctx.font = '900 ' + fontSize + 'px "Microsoft YaHei", "PingFang SC", Arial, sans-serif';
            if (ctx.measureText(mainText).width <= 452) break;
            fontSize -= 6;
        } while (fontSize > 68);
        var textY = lines.length > 1 ? 356 : 338;
        ctx.strokeStyle = frameCss;
        ctx.lineWidth = Math.max(18, fontSize * 0.14);
        ctx.shadowColor = 'rgba(0,0,0,0.58)';
        ctx.shadowOffsetY = 10;
        ctx.shadowBlur = 12;
        ctx.strokeText(mainText, 256, textY);
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(mainText, 256, textY);
        ctx.shadowOffsetY = 0;
        ctx.shadowBlur = 0;

        var texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.userData.v42Multiline = lines.length > 1;
        return texture;
    }

    function addGateOrnament(parts, style, op, width) {
        var topY = 1.88;
        if (op === 'mul') {
            var crown = new THREE.OctahedronGeometry(0.15, 0);
            applyTransform(crown, 0, topY, 0, 0, 0, Math.PI * 0.25, 1.2, 1.0, 0.75);
            parts.push({ geo: crown, color: style.light });
            for (var x = -1; x <= 1; x += 2) {
                var fin = new THREE.ConeGeometry(0.075, 0.22, 4);
                applyTransform(fin, x * width * 0.31, 1.87, 0, 0, 0, x * -0.22);
                parts.push({ geo: fin, color: style.light });
            }
        } else if (op === 'buff') {
            var gem = new THREE.OctahedronGeometry(0.17, 0);
            applyTransform(gem, 0, topY, 0, 0, 0, Math.PI * 0.25, 0.86, 1.25, 0.7);
            parts.push({ geo: gem, color: style.light });
            var halo = new THREE.TorusGeometry(0.23, 0.025, 5, 16);
            applyTransform(halo, 0, topY, -0.025, 0, 0, 0);
            parts.push({ geo: halo, color: style.light });
        } else if (op === 'risk') {
            var core = new THREE.OctahedronGeometry(0.14, 0);
            applyTransform(core, 0, 1.87, 0, 0, 0, Math.PI * 0.25);
            parts.push({ geo: core, color: style.light });
            for (var s = -1; s <= 1; s += 2) {
                var spike = new THREE.ConeGeometry(0.07, 0.28, 5);
                applyTransform(spike, s * 0.25, 1.89, 0, 0, 0, s * -0.65);
                parts.push({ geo: spike, color: style.light });
            }
        } else {
            var crest = new THREE.IcosahedronGeometry(0.15, 1);
            applyTransform(crest, 0, topY, 0, 0, 0, 0, 1.05, 1.18, 0.72);
            parts.push({ geo: crest, color: style.light });
            for (var w = -1; w <= 1; w += 2) {
                var wing = new THREE.BoxGeometry(0.22, 0.045, 0.06);
                applyTransform(wing, w * 0.22, 1.87, 0, 0, 0, w * 0.35);
                parts.push({ geo: wing, color: style.light });
            }
        }
    }

    V42Art.createGateModel = function (gateData, gateWidth) {
        gateData = gateData || { op: 'add', value: 1, label: '+1' };
        var styleKey = gateData.op;
        if (gateData.op === 'coin' || gateData.op === 'gold' || /金币|\+\d+金/.test(String(gateData.label || ''))) styleKey = 'coin';
        else if (gateData.op === 'addpct') styleKey = 'add';
        else if (gateData.op === 'skill' || gateData.op === 'damage' || gateData.op === 'damage2' || gateData.op === 'firerate') styleKey = 'buff';
        var style = GATE_STYLES[styleKey] || GATE_STYLES.add;
        var width = clampNumber(Number(gateWidth) || 1.8, 1.35, 1.77);
        var group = new THREE.Group();
        var frameParts = [];
        var trimParts = [];
        // V19.1: 军事科技全息投影门框架 (重装斜切枪铁发射基座 + 侧翼能量稳定鳍 + 顶部全息投影横梁与核心透镜)
        var postW = 0.135;
        var postH = 1.68;
        var postX = width * 0.5 - postW * 0.5;
        var steelDark = 0x0B1526;
        var steelMid = 0x1A2F4E;
        var steelHighlight = 0x324E76;

        // 左右装甲立柱 + 外侧斜撑科技散热翼
        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.035, 0.16), -postX, 0.88, 0), color: steelMid });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(postW, postH, 0.035, 0.16),  postX, 0.88, 0), color: steelMid });
        frameParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.065, 0.92, 0.12), -postX - 0.075, 0.62, 0, 0, 0, 0.08), color: steelHighlight });
        frameParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.065, 0.92, 0.12),  postX + 0.075, 0.62, 0, 0, 0, -0.08), color: steelHighlight });
        // 重装全息底座锚桩
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.28, 0.17, 0.04, 0.28), -postX, 0.09, 0.01), color: steelDark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.28, 0.17, 0.04, 0.28),  postX, 0.09, 0.01), color: steelDark });
        // 顶部全息投影发射横梁 + 装甲护罩
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width + 0.08, 0.16, 0.04, 0.22), 0, 1.76, 0), color: steelDark });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(width * 0.62, 0.13, 0.035, 0.26), 0, 1.86, 0.02), color: steelMid });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.22, 0.11, 0.03, 0.22), -postX, 1.82, 0), color: steelHighlight });
        frameParts.push({ geo: applyTransform(roundedRectGeometry(0.22, 0.11, 0.03, 0.22),  postX, 1.82, 0), color: steelHighlight });

        // 全息能量发射线圈、底座琥珀警示条与内圈等离子导轨
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.20, 0.06, 0.30), -postX, 0.16, 0.02), color: 0xFBBF24 });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.20, 0.06, 0.30),  postX, 0.16, 0.02), color: 0xFBBF24 });
        // 立柱三段能量环
        for (var ry = 0.45; ry <= 1.35; ry += 0.45) {
            trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.165, 0.045, 0.185), -postX, ry, 0), color: style.light });
            trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.165, 0.045, 0.185),  postX, ry, 0), color: style.light });
        }
        // 顶部全息投影核心透镜 + 两侧肩灯
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.52, 0.085, 0.28), 0, 1.86, 0.03), color: style.light });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.13, 0.08, 0.14), -postX, 1.89, 0.02), color: 0xFBBF24 });
        trimParts.push({ geo: applyTransform(new THREE.BoxGeometry(0.13, 0.08, 0.14),  postX, 1.89, 0.02), color: 0xFBBF24 });
        var insetX = width * 0.5 - 0.115;
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.055, 1.50, 0.016, 0.05), -insetX, 0.92, 0.082), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(0.055, 1.50, 0.016, 0.05),  insetX, 0.92, 0.082), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.22, 0.055, 0.016, 0.05), 0, 1.66, 0.082), color: style.light });
        trimParts.push({ geo: applyTransform(roundedRectGeometry(width - 0.22, 0.055, 0.016, 0.05), 0, 0.19, 0.082), color: style.light });

        var frameMat = preparePbr(new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.30,
            metalness: 0.72,
            emissive: new THREE.Color(style.dark),
            emissiveIntensity: 0.10
        }));
        var frame = new THREE.Mesh(mergeColored(frameParts), frameMat);
        frame.castShadow = true;
        frame.receiveShadow = true;
        group.add(frame);

        var trimMat = new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
        var trim = new THREE.Mesh(mergeColored(trimParts), trimMat);
        group.add(trim);

        var glassTexture = makeGateGlassTexture(style);
        var glassMat = preparePbr(new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            map: glassTexture,
            transparent: true,
            opacity: 0.90,
            roughness: 0.10,
            metalness: 0.02,
            clearcoat: 0.85,
            clearcoatRoughness: 0.14,
            emissive: new THREE.Color(style.glass),
            emissiveIntensity: 0.72,
            side: THREE.DoubleSide,
            depthWrite: false
        }));
        var glass = new THREE.Mesh(new THREE.PlaneGeometry(width - 0.26, 1.44), glassMat);
        glass.position.set(0, 0.92, 0.02);
        group.add(glass);

        // V15: 路面三连发光引导箭头 (直指增益门, 强化三跑道视觉牵引!)
        var chevronTex = makeGateChevronTexture(style);
        var chevronMat = new THREE.MeshBasicMaterial({
            map: chevronTex,
            transparent: true,
            opacity: 0.88,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide
        });
        var chevronMesh = new THREE.Mesh(new THREE.PlaneGeometry(width * 0.72, 1.45), chevronMat);
        chevronMesh.rotation.x = -Math.PI * 0.5;
        chevronMesh.position.set(0, 0.042, 1.15);
        chevronMesh.renderOrder = 2;
        group.add(chevronMesh);

        var glowPlane = new THREE.PlaneGeometry(Math.min(1.88, width + 0.04), 0.56);
        var ringGeo = new THREE.RingGeometry(width * 0.28, width * 0.44, 28);
        var groundGeo = mergeGeometries([colorize(glowPlane, style.glass), colorize(ringGeo, style.light)]);
        glowPlane.dispose();
        ringGeo.dispose();
        var groundMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.32,
            side: THREE.DoubleSide,
            depthWrite: false,
            toneMapped: false
        });
        var ground = new THREE.Mesh(groundGeo, groundMat);
        ground.rotation.x = -Math.PI * 0.5;
        ground.position.y = 0.032;
        group.add(ground);

        var beamGeo = colorize(new THREE.PlaneGeometry(width - 0.30, 0.22), style.light);
        var beamMat = new THREE.MeshBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.38,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            toneMapped: false,
            side: THREE.DoubleSide,
            fog: false
        });
        var beam = new THREE.Mesh(beamGeo, beamMat);
        beam.position.set(0, 0.30, -0.115);
        beam.renderOrder = 2;
        beam.userData.artSource = '能量门底部脉动光带';
        group.add(beam);

        var labelTexture = makeGateTextTexture(formatGateLabel(gateData), style);
        var labelMat = new THREE.SpriteMaterial({
            map: labelTexture,
            transparent: true,
            depthWrite: false,
            depthTest: true,
            toneMapped: false,
            fog: false
        });
        var label = new THREE.Sprite(labelMat);
        var labelWidth = width - 0.16;
        var labelHeight = labelWidth * (labelTexture.image.height / labelTexture.image.width) * 0.88;
        label.scale.set(labelWidth, labelHeight, 1);
        label.position.set(0, 0.94, 0.12);
        label.renderOrder = 4;
        group.add(label);

        group.userData.artSource = 'V42Art.createGateModel/' + style.kind + '/V15-beveled-glow-chevron';
        group.userData.qualityKind = style.kind;
        group.userData.label = label;
        group.userData.labelBaseY = 0.94;
        group.userData.beamMat = beamMat; // V13: 光束脉动(gates.update)
        group.userData.chevronMat = chevronMat; // V15: 地面引导箭头脉动
        group.userData.glass = glass;
        group.userData.glow = ground;
        group.userData.ring = ground;
        group.userData.drawCalls = 6;
        group.userData.ownsResources = true;
        return group;
    };

    /** V12视觉: 精英身份光环 — 贴地金环+缓流入内圈; 共享几何/材质(调用方不dispose, 无泄漏) */
    V42Art.createEliteAura = function () {
        if (!V42Art._eliteAuraGeo) {
            V42Art._eliteAuraGeo = mergeGeometries([
                colorize(new THREE.RingGeometry(0.62, 0.78, 28), 0xFFC247),
                colorize(new THREE.RingGeometry(0.30, 0.38, 22), 0xFFE28A)
            ]);
            V42Art._eliteAuraMat = new THREE.MeshBasicMaterial({
                vertexColors: true, transparent: true, opacity: 0.55,
                side: THREE.DoubleSide, depthWrite: false, toneMapped: false
            });
            V42Art._eliteAuraGeo.userData = { artSource: 'js/art-v42.js:createEliteAura() 共享金环' };
        }
        var mesh = new THREE.Mesh(V42Art._eliteAuraGeo, V42Art._eliteAuraMat);
        mesh.rotation.x = -Math.PI / 2;
        mesh.renderOrder = 2;
        return mesh;
    };

    function seededRandom(seed) {
        var state = seed >>> 0;
        return function () {
            state = (state * 1664525 + 1013904223) >>> 0;
            return state / 4294967296;
        };
    }

    function makeCityMaterial(color, options) {
        options = options || {};
        return preparePbr(new THREE.MeshStandardMaterial({
            color: color,
            roughness: options.roughness === undefined ? 0.74 : options.roughness,
            metalness: options.metalness || 0,
            emissive: options.emissive || 0x000000,
            emissiveIntensity: options.emissiveIntensity || 0
        }));
    }

    function makeFacadeTexture() {
        var canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 512;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = '#e5e9e4';
        ctx.fillRect(0, 0, 256, 512);
        for (var floor = 0; floor < 4; floor++) {
            var y = 18 + floor * 120;
            ctx.fillStyle = '#b5bfbb';
            ctx.fillRect(0, y + 90, 256, 5);
            ctx.fillStyle = '#f6f4e9';
            ctx.fillRect(0, y + 95, 256, 7);
            for (var col = 0; col < 3; col++) {
                var x = 18 + col * 80;
                ctx.fillStyle = '#899996';
                ctx.fillRect(x - 4, y - 4, 64, 84);
                ctx.fillStyle = '#283e48';
                ctx.fillRect(x, y, 56, 74);
                ctx.fillStyle = floor % 2 === col % 2 ? '#a3ccd1' : '#57818b';
                ctx.fillRect(x + 5, y + 4, 46, 32);
                ctx.fillStyle = '#d6e5df';
                ctx.fillRect(x + 26, y, 4, 74);
                ctx.fillRect(x, y + 35, 56, 4);
                ctx.fillStyle = '#f7f4e8';
                ctx.fillRect(x - 7, y + 77, 70, 6);
            }
        }
        var tex = new THREE.CanvasTexture(canvas);
        tex.anisotropy = 4;
        return tex;
    }

    function makeShopTexture(text, color) {
        var canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, 512, 128);
        ctx.strokeStyle = '#ecf3e9';
        ctx.lineWidth = 5;
        ctx.strokeRect(8, 8, 496, 112);
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '800 68px "Microsoft YaHei", Arial, sans-serif';
        ctx.fillText(text, 256, 67, 460);
        return new THREE.CanvasTexture(canvas);
    }

    function addStreetDetails(env, buildings, random) {
        var solids = [], glass = [], trims = [], foliage = [], wheels = [];
        var signs = [[], [], []], canopies = [], awningStripes = [], markings = [];
        var box = new THREE.BoxGeometry(1, 1, 1);
        function record(x, y, z, sx, sy, sz, ry) {
            return { x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, ry: ry || 0 };
        }
        for (var i = 0; i < buildings.length; i++) {
            var b = buildings[i], inner = b.x - b.s * (b.w * .558 + .035);
            // Shops and their awnings face the road; the combat lanes stay clear.
            glass.push(record(inner, .92, b.z, .035, 1.45, b.sz * .77));
            trims.push(record(inner - b.s * .025, .17, b.z, .12, .16, b.sz * .86));
            for (var f = -1; f <= 1; f++) {
                trims.push(record(inner - b.s * .04, .92, b.z + f * b.sz * .32, .09, 1.55, .06));
            }
            canopies.push(record(inner - b.s * .35, 1.95, b.z, .85, .14, b.sz * .91));
            for (var st = 0; st < 7; st++) {
                awningStripes.push(record(inner - b.s * .35, 2.027, b.z + (st - 3) * b.sz * .13, .86, .018, b.sz * .055));
            }
            signs[i % 3].push(record(inner - b.s * .06, 2.36, b.z, 2.6, .56, 1, -b.s * Math.PI / 2));
            solids.push(record(b.x, b.h + .28, b.z, b.w * .38, .45, b.sz * .35));
            if (i % 2 === 0) {
                var pz = b.z + b.sz * .63;
                solids.push(record(b.s * 5.05, .19, pz, .7, .35, 1.3));
                foliage.push(record(b.s * 5.05, .49, pz, .7, .52, 1.25));
            }
            if (i % 4 === 1) {
                solids.push(record(b.s * 4.9, .28, b.z - 1.3, .8, .45, 1.25));
                trims.push(record(b.s * 4.9, .53, b.z - 1.3, .82, .07, 1.28));
                for (var h = -1; h <= 1; h += 2) {
                    markings.push(record(b.s * 4.9, .54, b.z - 1.3 + h * .42, .84, .02, .1));
                }
            }
            if (i % 5 === 2) {
                var carX = b.s * 5.8, carZ = b.z + 2.9;
                canopies.push(record(carX, .44, carZ, 1.05, .45, 1.95));
                glass.push(record(carX, .83, carZ - .12, .86, .38, .92));
                trims.push(record(carX, .28, carZ + 1, 1, .15, .12));
                for (var side = -1; side <= 1; side += 2) {
                    for (var axle = -1; axle <= 1; axle += 2) {
                        wheels.push(record(carX + side * .54, .24, carZ + axle * .65, .16, .38, .38));
                    }
                }
            }
        }
        // Street furniture is batched by surface, not by individual object.
        addInstancedCategory(env, 'street-concrete', box, makeCityMaterial(0x9AAFAA), solids, { receiveShadow: true });
        addInstancedCategory(env, 'shop-windows', box, makeCityMaterial(0x325D6A, { roughness: .24, metalness: .18 }), glass);
        addInstancedCategory(env, 'shop-frames', box, makeCityMaterial(0xDDE3DB), trims);
        addInstancedCategory(env, 'striped-awnings', box, makeCityMaterial(0xBB4E53), canopies, { castShadow: true });
        addInstancedCategory(env, 'awning-stripes', box, makeCityMaterial(0xF6EFE4), awningStripes);
        addInstancedCategory(env, 'planter-shrubs', new THREE.IcosahedronGeometry(.65, 1), makeCityMaterial(0x407B59), foliage);
        addInstancedCategory(env, 'parked-car-wheels', box, makeCityMaterial(0x283239), wheels);
        addInstancedCategory(env, 'street-reflectors', box, new THREE.MeshBasicMaterial({ color: 0xFFD365 }), markings);
        var labels = ['CITY MART', '补给站', 'METRO  03'];
        var colors = ['#386f67', '#ac4d4c', '#3b607f'];
        for (var s = 0; s < signs.length; s++) {
            addInstancedCategory(env, 'shop-sign-' + s, new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({ map: makeShopTexture(labels[s], colors[s]), side: THREE.DoubleSide }), signs[s]);
        }
        var skyline = makeRecords(32, function (i) {
            var h = 7 + random() * 10;
            return record((i % 2 ? 1 : -1) * (14 + random() * 9), h * .5, 10 - i * 5.2, 3 + random() * 3, h, 3 + random() * 3);
        });
        addInstancedCategory(env, 'distant-skyline', box, makeCityMaterial(0x7C9BA5), skyline);
    }

    function addInstancedCategory(env, name, geometry, material, records, options) {
        options = options || {};
        var mesh = new THREE.InstancedMesh(geometry, material, records.length);
        mesh.name = 'v42-' + name;
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        mesh.castShadow = !!options.castShadow;
        mesh.receiveShadow = !!options.receiveShadow;
        mesh.frustumCulled = false;
        mesh.userData.artSource = 'V42Art.buildEnvironment/instanced-' + name;
        mesh.userData.collidable = false;
        env.root.add(mesh);
        // V14: 主题归属 — entry.themes 列出的主题可见, 未列出的隐藏(setEnvironmentTheme 切换)
        var entry = { mesh: mesh, records: records, themes: options.themes || null };
        if (entry.themes) mesh.visible = false; // 等待 setEnvironmentTheme 激活
        env.entries.push(entry);
        env.drawCalls++;
        return entry;
    }

    /** V14: 主题道具包可见性切换 — 每主题只激活自己的道具类别; 重置 lastSquadZ 触发全量重排 */
    V42Art.setEnvironmentTheme = function (env, themeName) {
        if (!env || !env.entries) return;
        for (var i = 0; i < env.entries.length; i++) {
            var entry = env.entries[i];
            if (!entry.themes) { entry.mesh.visible = true; continue; }
            var on = entry.themes.indexOf(themeName) >= 0;
            if (entry.mesh.visible !== on) {
                entry.mesh.visible = on;
                if (on) env.lastSquadZ = Number.POSITIVE_INFINITY; // 激活时全量重排矩阵
            }
        }
    };

    /** V14.3: 草地噪点纹理 — 灰度细噪+修剪条纹, 与顶点色相乘提升地面质感(共享单张) */
    var _grassTex = null;
    V42Art.getGrassTexture = function () {
        if (_grassTex) return _grassTex;
        var cv = document.createElement('canvas');
        cv.width = 128; cv.height = 128;
        var ctx = cv.getContext('2d');
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, 128, 128);
        for (var i = 0; i < 900; i++) {
            var v = Math.random();
            ctx.fillStyle = v < 0.5 ? 'rgba(120,160,90,0.16)' : 'rgba(255,255,255,0.12)';
            ctx.fillRect(Math.random() * 128, Math.random() * 128, 2 + Math.random() * 2, 1 + Math.random() * 2);
        }
        // 修剪条纹(横向明暗带)
        for (var b2 = 0; b2 < 4; b2++) {
            ctx.fillStyle = b2 % 2 ? 'rgba(255,255,255,0.06)' : 'rgba(40,70,30,0.08)';
            ctx.fillRect(0, b2 * 32, 128, 16);
        }
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping;
        tex.repeat.set(4, 2);
        _grassTex = tex;
        return tex;
    };

    /** V14: 主题地面纹理 — 程序化生成并缓存(柏油/龟裂/岩面/金属板/混凝土), 含三车道虚线保持跑道可读 */
    var _groundTexCache = {};
    V42Art.getGroundTexture = function (kind) {
        if (_groundTexCache[kind]) return _groundTexCache[kind];
        var cv = document.createElement('canvas');
        cv.width = 256; cv.height = 512;
        var ctx = cv.getContext('2d');
        var palettes = {
            asphalt: { base: '#7C8B96', line: '#F0EEF5', edge: '#E3C26B', noise: true },
            cracked: { base: '#5E5A54', line: '#B8AE9C', edge: '#8A7A54', noise: true, cracks: true },
            rock:    { base: '#3E4E52', line: '#7E9EA0', edge: '#5E7A78', noise: true, strata: true },
            metal:   { base: '#5E6268', line: '#B8C4C8', edge: '#8E9EA6', noise: false, plates: true },
            concrete:{ base: '#8E948E', line: '#E8ECE8', edge: '#C2B27E', noise: true, slabs: true }
        };
        var P = palettes[kind] || palettes.asphalt;
        ctx.fillStyle = P.base;
        ctx.fillRect(0, 0, 256, 512);
        var i;
        if (P.plates) {
            // 金属甲板: 大板拼缝+铆钉
            ctx.strokeStyle = 'rgba(20,26,30,0.55)'; ctx.lineWidth = 3;
            for (i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, i * 128 + 8); ctx.lineTo(256, i * 128 + 8); ctx.stroke(); }
            ctx.beginPath(); ctx.moveTo(85, 0); ctx.lineTo(85, 512); ctx.moveTo(171, 0); ctx.lineTo(171, 512); ctx.stroke();
            ctx.fillStyle = 'rgba(200,210,214,0.5)';
            for (i = 0; i < 40; i++) { ctx.beginPath(); ctx.arc(20 + (i % 4) * 60, 30 + Math.floor(i / 4) * 62, 3, 0, Math.PI * 2); ctx.fill(); }
        } else if (P.slabs) {
            // 混凝土: 伸缩缝+污渍
            ctx.strokeStyle = 'rgba(60,66,60,0.5)'; ctx.lineWidth = 3;
            for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(0, i * 170 + 40); ctx.lineTo(256, i * 170 + 40); ctx.stroke(); }
            for (i = 0; i < 10; i++) {
                ctx.fillStyle = 'rgba(50,54,48,' + (0.05 + Math.random() * 0.06) + ')';
                ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 512, 12 + Math.random() * 30, 8 + Math.random() * 20, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else if (P.strata) {
            // 洞穴岩面: 水平岩层带+湿痕
            for (i = 0; i < 7; i++) {
                ctx.fillStyle = 'rgba(' + (i % 2 ? '28,42,46' : '52,68,72') + ',0.35)';
                ctx.fillRect(0, i * 74, 256, 34 + (i % 3) * 12);
            }
            for (i = 0; i < 8; i++) {
                ctx.fillStyle = 'rgba(90,140,140,0.12)';
                ctx.beginPath(); ctx.ellipse(Math.random() * 256, Math.random() * 512, 14 + Math.random() * 26, 20 + Math.random() * 40, 0, 0, Math.PI * 2); ctx.fill();
            }
        } else {
            // 柏油/龟裂: 大色调带 + 噪点 + 车辙
            var bandTones = ['rgba(255,255,255,0.045)', 'rgba(30,44,56,0.06)', 'rgba(255,255,255,0.03)'];
            for (i = 0; i < 3; i++) { ctx.fillStyle = bandTones[i]; ctx.fillRect((i * 83) % 256, 0, 60 + i * 14, 512); }
            for (i = 0; i < 380; i++) {
                ctx.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.035)';
                ctx.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
            }
            ctx.fillStyle = 'rgba(24,34,40,0.10)';
            ctx.fillRect(52, 0, 22, 512); ctx.fillRect(182, 0, 22, 512);
        }
        if (P.cracks) {
            ctx.strokeStyle = 'rgba(16,14,10,0.5)'; ctx.lineWidth = 2;
            for (i = 0; i < 12; i++) {
                var sx = Math.random() * 256, sy = Math.random() * 512;
                ctx.beginPath(); ctx.moveTo(sx, sy);
                for (var c = 0; c < 3; c++) { sx += (Math.random() - 0.5) * 60; sy += 12 + Math.random() * 26; ctx.lineTo(sx, sy); }
                ctx.stroke();
            }
        }
        // 三车道虚线(与柏油版同位置: x≈90/165) + 路缘实线 — 保持跑道可读性
        ctx.fillStyle = P.line;
        for (i = 0; i < 512; i += 48) { ctx.fillRect(88, i, 5, 30); ctx.fillRect(163, i, 5, 30); }
        ctx.fillStyle = 'rgba(40,44,40,0.4)'; ctx.fillRect(3, 0, 7, 512); ctx.fillRect(246, 0, 7, 512);
        ctx.fillStyle = P.edge; ctx.fillRect(4, 0, 5, 512); ctx.fillRect(247, 0, 5, 512);
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping; tex.wrapT = THREE.RepeatWrapping; tex.anisotropy = 4;
        _groundTexCache[kind] = tex;
        return tex;
    };

    function setRecordMatrix(entry, index, tempObject) {
        var r = entry.records[index];
        tempObject.position.set(r.x, r.y, r.z);
        tempObject.rotation.set(r.rx || 0, r.ry || 0, r.rz || 0);
        tempObject.scale.set(r.sx || 1, r.sy || 1, r.sz || 1);
        tempObject.updateMatrix();
        entry.mesh.setMatrixAt(index, tempObject.matrix);
    }

    function makeRecords(count, maker) {
        var result = [];
        for (var i = 0; i < count; i++) result.push(maker(i));
        return result;
    }

    V42Art.buildEnvironment = function (world) {
        if (!world || !world.scene) return null;
        if (world._v42Environment && world._v42Environment.root) {
            world.scene.remove(world._v42Environment.root);
        }
        world.decoItems = [];
        world.buildings = [];
        world.clouds = [];

        // V14: 主题族定义 — CITY_FAMILY(含末日废墟态) / CITY_ALIVE(完好城市态)
        var CITY_FAMILY = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk', 'apocalypse'];
        var CITY_ALIVE = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk'];
        var ALL_BUT_CAVE = ['default', 'dawn', 'noon', 'overcast', 'sunset', 'dusk', 'apocalypse', 'mechanical', 'fortress'];

        var random = seededRandom(42042);
        var root = new THREE.Group();
        root.name = 'v42-environment';
        root.userData.artSource = 'V42Art.buildEnvironment/procedural-instanced-city';
        root.userData.collidable = false;
        world.scene.add(root);

        var env = {
            root: root,
            entries: [],
            drawCalls: 0,
            span: 170,
            front: 18,
            tempObject: new THREE.Object3D(),
            lastSquadZ: Number.POSITIVE_INFINITY,
            update: function (squadZ) { V42Art.updateEnvironment(world, squadZ); }
        };
        world._v42Environment = env;

        var facade = makeFacadeTexture();
        var cream = makeCityMaterial(0xD8E0DC);
        var teal = makeCityMaterial(0x8AB8AF, { roughness: 0.68 });
        var coral = makeCityMaterial(0xD7A29B);
        cream.map = teal.map = coral.map = facade;
        var leaf = makeCityMaterial(0x70A77B, { roughness: 0.9 });
        var trunk = makeCityMaterial(0x8B684B, { roughness: 0.92 });
        var glass = makeCityMaterial(0x93C6C7, { roughness: 0.22, metalness: 0.18 });
        var warmLight = new THREE.MeshBasicMaterial({ color: 0xFFE5A3, toneMapped: false });
        var charcoal = makeCityMaterial(0x304552, { roughness: 0.5, metalness: 0.25 });
        // V5.0: 云朵不受雾影响并加自发光, 修复远景发灰像岩石
        var cloudMat = new THREE.MeshLambertMaterial({
            color: 0xFFFFFF, emissive: 0xB8C4CC, emissiveIntensity: 0.55,
            transparent: true, opacity: 0.92, fog: false
        });

        var roadside = makeRecords(76, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (4.8 + random() * .4), y: 0, z: 10 - i * 3.08 + random() * .5, s: side };
        });
        var treeBase = roadside.filter(function (_, i) { return i % 3 === 0; });
        var lampBase = roadside.filter(function (_, i) { return i % 3 === 1; });
        var propBase = roadside.filter(function (_, i) { return i % 3 === 2; });

        addInstancedCategory(env, 'tree-trunks', new THREE.CylinderGeometry(0.11, 0.16, 0.74, 7), trunk,
            treeBase.map(function (r) { return { x: r.x, y: 0.37, z: r.z, sx: 1, sy: 1, sz: 1 }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-canopies', new THREE.IcosahedronGeometry(0.55, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x, y: 1.13, z: r.z, sx: 1.05, sy: 1.32 + (i % 2) * 0.12, sz: 0.92, ry: random() * TAU }; }), { castShadow: true });
        addInstancedCategory(env, 'tree-crowns', new THREE.IcosahedronGeometry(0.34, 1), leaf,
            treeBase.map(function (r, i) { return { x: r.x + r.s * 0.12, y: 1.61, z: r.z + 0.04, sx: 0.9, sy: 1.1, sz: 0.9, ry: i }; }));

        addInstancedCategory(env, 'lamp-poles', new THREE.CylinderGeometry(0.045, 0.065, 2.15, 7), charcoal,
            lampBase.map(function (r) { return { x: r.x, y: 1.075, z: r.z }; }));
        addInstancedCategory(env, 'lamp-heads', roundedRectGeometry(0.34, 0.12, 0.04, 0.16), warmLight,
            lampBase.map(function (r) { return { x: r.x - r.s * 0.12, y: 2.08, z: r.z, ry: r.s > 0 ? 0 : Math.PI }; }));

        addInstancedCategory(env, 'parked-cars', roundedRectGeometry(0.86, 0.42, 0.12, 1.45), coral,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.36, z: r.z, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }), { castShadow: true });
        addInstancedCategory(env, 'car-glass', roundedRectGeometry(0.68, 0.24, 0.08, 0.58), glass,
            propBase.filter(function (_, i) { return i % 3 === 0; }).map(function (r) { return { x: r.x + r.s * 0.2, y: 0.67, z: r.z - 0.08, sx: 1, sy: 1, sz: 1, ry: r.s * 0.1 }; }));
        addInstancedCategory(env, 'cones', new THREE.ConeGeometry(0.13, 0.42, 7), coral,
            propBase.filter(function (_, i) { return i % 3 === 1; }).map(function (r) { return { x: r.x, y: 0.21, z: r.z, ry: random() * TAU }; }));
        var buildings = makeRecords(50, function (i) {
            var side = i % 2 ? 1 : -1;
            var h = 3.4 + random() * 4.6;
            var w = 2.4 + random() * 1.2;
            return { x: side * (7.4 + random() * .9), y: h * .5, z: 12 - i * 3.84,
                sx: w, sy: h, sz: 4.5 + random() * 1.4, h: h, w: w, s: side };
        });
        var buildingGeo = roundedRectGeometry(1, 1, 0.08, 1);
        addInstancedCategory(env, 'cream-buildings', buildingGeo, cream,
            buildings.filter(function (_, i) { return i % 3 === 0; }));
        addInstancedCategory(env, 'teal-buildings', roundedRectGeometry(1, 1, 0.08, 1), teal,
            buildings.filter(function (_, i) { return i % 3 === 1; }));
        addInstancedCategory(env, 'coral-buildings', roundedRectGeometry(1, 1, 0.08, 1), coral,
            buildings.filter(function (_, i) { return i % 3 === 2; }));

        // No decorative roof caps or roadside rails in the combat view.

        var windows = [];
        for (var bi = 0; bi < buildings.length; bi++) {
            var b = buildings[bi];
            for (var row = 0; row < 4; row++) {
                windows.push({
                    // Face the road rather than +Z: the runner sees the inner
                    // side walls most clearly in the portrait perspective.
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z - b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
                windows.push({
                    x: b.x - b.s * (b.w * 0.558),
                    y: 1.1 + row * Math.max(0.75, b.h * 0.18),
                    z: b.z + b.sz * 0.22,
                    sx: 0.38,
                    sy: 0.46,
                    sz: 1,
                    ry: -b.s * Math.PI * 0.5
                });
            }
        }
        addInstancedCategory(env, 'windows', new THREE.PlaneGeometry(1, 1), warmLight, windows);

        addStreetDetails(env, buildings, random);

        var clouds = makeRecords(12, function (i) {
            var side = i % 2 ? 1 : -1;
            return { x: side * (3 + random() * 7), y: 8.5 + random() * 3.8, z: 14 - i * 13.4, sx: 1.4 + random() * 1.2, sy: 0.75 + random() * 0.4, sz: 0.8 + random() * 0.4, ry: random() * TAU };
        });
        addInstancedCategory(env, 'clouds', new THREE.IcosahedronGeometry(0.78, 1), cloudMat, clouds);

        // ===== V14: 主题道具包 =====
        // 每个主题族专属场景几何, 全部实例化+共享材质(按批合并), applyTheme 时按可见性切换。
        // 装饰只出现在 |x|>=4.9 的路外区域, 不影响跑道/碰撞/镜头。
        var box = new THREE.BoxGeometry(1, 1, 1);
        function rec(x, y, z, sx, sy, sz, ry, rx, rz) {
            return { x: x, y: y, z: z, sx: sx, sy: sy, sz: sz, ry: ry || 0, rx: rx || 0, rz: rz || 0 };
        }

        // —— 城市族加丰富(CITY_ALIVE): 候车亭/广告牌/信号灯/消防栓 ——
        var cxFrames = [], cxPanels = [], cxGlow = [];
        for (var ci = 0; ci < 6; ci++) {
            var cSide = ci % 2 ? 1 : -1, cz = 6 - ci * 27 + random() * 5, cx = cSide * 5.05;
            cxFrames.push(rec(cx, 1.2, cz, 0.09, 2.4, 1.85));                              // 候车亭背板
            cxFrames.push(rec(cx - cSide * 0.9, 1.1, cz - 0.85, 0.09, 2.2, 0.1));
            cxFrames.push(rec(cx - cSide * 0.9, 1.1, cz + 0.85, 0.09, 2.2, 0.1));
            cxPanels.push(rec(cx - cSide * 0.42, 2.24, cz, 1.25, 0.1, 2.0));               // 顶棚
            cxPanels.push(rec(cx - cSide * 0.42, 0.58, cz + 0.8, 0.12, 0.42, 1.2));        // 座椅
            cxGlow.push(rec(cx + cSide * 0.02, 1.55, cz - 0.95, 0.5, 0.36, 0.05));         // 站牌灯箱
        }
        for (var bi2 = 0; bi2 < 4; bi2++) {
            var bSide = bi2 % 2 ? 1 : -1, bz = -14 - bi2 * 36 + random() * 8, bx = bSide * 6.6;
            cxFrames.push(rec(bx - bSide * 0.5, 1.5, bz, 0.14, 3.0, 0.14));
            cxFrames.push(rec(bx + bSide * 0.5, 1.5, bz, 0.14, 3.0, 0.14));
            cxPanels.push(rec(bx, 3.4, bz + (bi2 % 2 ? 0.05 : -0.05), 2.6, 1.5, 0.12, bSide * 0.06));
            cxGlow.push(rec(bx - bSide * 0.09, 3.4, bz + (bi2 % 2 ? 0.1 : -0.1), 2.2, 1.1, 0.06));
        }
        for (var ti = 0; ti < 4; ti++) {
            var tSide = ti % 2 ? 1 : -1, tz = 18 - ti * 39, tx = tSide * 4.55;
            cxFrames.push(rec(tx, 1.35, tz, 0.11, 2.7, 0.11));
            cxPanels.push(rec(tx - tSide * 0.14, 2.78, tz, 0.3, 0.85, 0.26));
            cxGlow.push(rec(tx - tSide * 0.14, 2.95, tz, 0.16, 0.16, 0.05));
        }
        for (var hi = 0; hi < 4; hi++) {
            var hSide = hi % 2 ? 1 : -1, hz = 22 - hi * 41 + random() * 6;
            cxPanels.push(rec(hSide * 4.6, 0.26, hz, 0.16, 0.5, 0.2));
            cxGlow.push(rec(hSide * 4.6, 0.55, hz, 0.1, 0.12, 0.1));
        }
        // Cross-street decorative banners removed: keep the battle sightline clear.
        addInstancedCategory(env, 'cityx-frames', box, makeCityMaterial(0x2E3A42, { roughness: 0.5, metalness: 0.3 }), cxFrames, { themes: CITY_ALIVE, castShadow: true });
        addInstancedCategory(env, 'cityx-panels', box, makeCityMaterial(0x9AAFA8), cxPanels, { themes: CITY_ALIVE, castShadow: true });
        var cityxGlowMat = new THREE.MeshBasicMaterial({ color: 0xFFE9A8, toneMapped: false }); cityxGlowMat.__noThemeTint = true;
        addInstancedCategory(env, 'cityx-glow', box, cityxGlowMat, cxGlow, { themes: CITY_ALIVE });

        // —— 末日废墟(apocalypse): 坍塌楼板/瓦砾堆/烧毁车壳/余烬 ——
        var apoSlabs = [], apoRubble = [], apoWrecks = [], apoEmbers = [];
        for (var ai = 0; ai < 12; ai++) {
            var aSide = ai % 2 ? 1 : -1, az = 4 - ai * 19 + random() * 6;
            apoSlabs.push(rec(aSide * (5.7 + random() * 1.4), 0.9 + random() * 0.6, az, 2.8 + random() * 2.0, 0.6, 3.6 + random() * 1.8, random() * 1.2, (random() - 0.5) * 0.3, (random() - 0.5) * 0.24));
            for (var rb = 0; rb < 5; rb++) {
                apoRubble.push(rec(aSide * (4.85 + random() * 2.4), 0.18 + random() * 0.26, az + random() * 6 - 3, 0.5 + random() * 0.9, 0.3 + random() * 0.55, 0.5 + random() * 0.9, random() * TAU));
            }
            if (ai % 2 === 0 || ai % 3 === 1) {
                apoWrecks.push(rec(aSide * 5.3, 0.3, az + 2.4, 0.95, 0.6, 2.0, random() * 0.5 - 0.25, 0, (random() - 0.5) * 0.14));
                apoEmbers.push(rec(aSide * 5.3, 0.62, az + 2.0, 0.3, 0.1, 0.5));
            }
            if (ai % 3 === 1) apoEmbers.push(rec(aSide * (5.6 + random()), 0.34, az - 1.5, 0.24, 0.08, 0.3));
        }
        addInstancedCategory(env, 'apo-slabs', box, makeCityMaterial(0x4A4440, { roughness: 0.9 }), apoSlabs, { themes: ['apocalypse'], castShadow: true });
        addInstancedCategory(env, 'apo-rubble', new THREE.IcosahedronGeometry(0.5, 0), makeCityMaterial(0x6E655C, { roughness: 0.95 }), apoRubble, { themes: ['apocalypse'], castShadow: true });
        addInstancedCategory(env, 'apo-wrecks', roundedRectGeometry(1, 1, 0.12, 1), makeCityMaterial(0x26221E, { roughness: 0.6, metalness: 0.3 }), apoWrecks, { themes: ['apocalypse'], castShadow: true });
        var apoEmberMat = new THREE.MeshBasicMaterial({ color: 0xFF6A3C, toneMapped: false }); apoEmberMat.__noThemeTint = true;
        addInstancedCategory(env, 'apo-embers', box, apoEmberMat, apoEmbers, { themes: ['apocalypse'] });

        // —— 地下巢穴(cave): 巨岩壁/石笋/发光晶体/荧光菌 ——
        var caveBoulders = [], caveStalag = [], caveCrystals = [], caveShrooms = [];
        for (var vi = 0; vi < 14; vi++) {
            var vSide = vi % 2 ? 1 : -1, vz = 6 - vi * 12 + random() * 6;
            caveBoulders.push(rec(vSide * (4.9 + random() * 2.6), 0.7 + random() * 1.2, vz, 2.6 + random() * 2.6, 1.9 + random() * 2.4, 2.8 + random() * 2.2, random() * TAU));
            caveStalag.push(rec(vSide * (4.65 + random() * 1.0), 0.45 + random() * 0.5, vz + random() * 7 - 3.5, 0.28 + random() * 0.3, 0.9 + random() * 1.4, 0.28 + random() * 0.3));
            if (vi % 2 === 0) caveCrystals.push(rec(vSide * (4.6 + random() * 0.6), 0.4 + random() * 0.3, vz + random() * 5 - 2.5, 0.2 + random() * 0.22, 0.45 + random() * 0.55, 0.2 + random() * 0.22, random() * TAU, (random() - 0.5) * 0.4));
            if (vi % 3 === 0) caveShrooms.push(rec(vSide * (4.55 + random()), 0.2, vz - random() * 4, 0.14 + random() * 0.1, 0.13, 0.14 + random() * 0.1));
        }
        addInstancedCategory(env, 'cave-boulders', new THREE.IcosahedronGeometry(1, 0), makeCityMaterial(0x44565C, { roughness: 0.95 }), caveBoulders, { themes: ['cave'], castShadow: true });
        addInstancedCategory(env, 'cave-stalagmites', new THREE.ConeGeometry(0.5, 1.6, 6), makeCityMaterial(0x3E5054, { roughness: 0.9 }), caveStalag, { themes: ['cave'], castShadow: true });
        var caveCrystalMat = new THREE.MeshBasicMaterial({ color: 0x4FE3C0, toneMapped: false }); caveCrystalMat.__noThemeTint = true;
        addInstancedCategory(env, 'cave-crystals', new THREE.OctahedronGeometry(0.5, 0), caveCrystalMat, caveCrystals, { themes: ['cave'] });
        var caveShroomMat = new THREE.MeshBasicMaterial({ color: 0x6EE7A0, toneMapped: false }); caveShroomMat.__noThemeTint = true;
        addInstancedCategory(env, 'cave-shrooms', new THREE.SphereGeometry(0.16, 7, 5, 0, Math.PI * 2, 0, Math.PI * 0.55), caveShroomMat, caveShrooms, { themes: ['cave'] });

        // —— 机械废土(mechanical): 管线/机甲残骸/能源塔/金属碎板 ——
        var mechPipes = [], mechFrames = [], mechWrecks = [], mechStrips = [], mechDebris = [];
        for (var mi2 = 0; mi2 < 14; mi2++) {
            var mSide = mi2 % 2 ? 1 : -1, mz = 6 - mi2 * 17 + random() * 6;
            mechPipes.push(rec(mSide * 5.1, 0.95 + random() * 0.3, mz, 0.18, 0.18, 4.2 + random() * 2));
            mechPipes.push(rec(mSide * 5.4, 0.5, mz - 1.4, 0.14, 1.0, 0.14));
            mechPipes.push(rec(mSide * 5.4, 0.5, mz + 1.4, 0.14, 1.0, 0.14));
            if (mi2 % 2 === 0) {
                mechWrecks.push(rec(mSide * 6.6, 0.55, mz + 3, 1.0, 1.1, 0.9, random() * TAU));
                mechWrecks.push(rec(mSide * 6.6, 1.25, mz + 3, 0.5, 0.4, 0.5, random() * TAU));
                mechStrips.push(rec(mSide * 6.6, 0.9, mz + 3.42, 0.5, 0.08, 0.04));
            }
            if (mi2 % 3 === 1) {
                mechFrames.push(rec(mSide * 5.2, 1.6, mz - 3, 0.5, 3.2, 0.5));
                mechStrips.push(rec(mSide * 5.2, 2.6, mz - 3, 0.56, 0.3, 0.56));
            }
            mechDebris.push(rec(mSide * (4.8 + random() * 1.6), 0.05, mz + random() * 6 - 3, 0.5 + random() * 0.7, 0.04, 0.6 + random() * 0.8, random() * TAU));
            mechDebris.push(rec(mSide * (4.95 + random() * 1.8), 0.05, mz + random() * 8 - 4, 0.4 + random() * 0.6, 0.04, 0.5 + random() * 0.7, random() * TAU));
        }
        addInstancedCategory(env, 'mech-pipes', new THREE.CylinderGeometry(0.5, 0.5, 1, 9), makeCityMaterial(0x6E7076, { roughness: 0.4, metalness: 0.6 }), mechPipes, { themes: ['mechanical'], castShadow: true });
        addInstancedCategory(env, 'mech-wreck-frames', box, makeCityMaterial(0x4E5258, { roughness: 0.5, metalness: 0.55 }), mechWrecks, { themes: ['mechanical'], castShadow: true });
        addInstancedCategory(env, 'mech-pylons', box, makeCityMaterial(0x565A60, { roughness: 0.45, metalness: 0.6 }), mechFrames, { themes: ['mechanical'], castShadow: true });
        var mechStripMat = new THREE.MeshBasicMaterial({ color: 0x54D8E8, toneMapped: false }); mechStripMat.__noThemeTint = true;
        addInstancedCategory(env, 'mech-strips', box, mechStripMat, mechStrips, { themes: ['mechanical'] });
        addInstancedCategory(env, 'mech-debris', box, makeCityMaterial(0x3E4248, { roughness: 0.7, metalness: 0.4 }), mechDebris, { themes: ['mechanical'] });

        // —— 最终防线(fortress): 防御墙/瞭望塔/废弃坦克/沙袋 ——
        var fortWalls = [], fortTowers = [], fortHulls = [], fortTurrets = [], fortSandbags = [];
        for (var fi = 0; fi < 9; fi++) {
            var fSide = fi % 2 ? 1 : -1, fz = 4 - fi * 18 + random() * 5;
            fortWalls.push(rec(fSide * 5.15, 0.85, fz, 1.2, 1.7, 6.5 + random() * 2));
            if (fi % 3 === 0) {
                fortTowers.push(rec(fSide * 6.8, 1.9, fz + 2, 1.3, 3.8, 1.3));
                fortTowers.push(rec(fSide * 6.8, 3.95, fz + 2, 1.7, 0.24, 1.7));
            }
            if (fi % 3 === 1) {
                fortHulls.push(rec(fSide * 6.0, 0.55, fz + 2.6, 1.7, 0.8, 3.2, random() * 0.4 - 0.2));
                fortTurrets.push(rec(fSide * 6.0, 1.12, fz + 2.4, 0.9, 0.45, 1.2, random() * 0.4 - 0.2));
            }
            for (var sb = 0; sb < 3; sb++) {
                fortSandbags.push(rec(fSide * 4.85, 0.1 + sb * 0.11, fz + 1.2 + sb * 0.3, 0.5, 0.18, 0.3, random() * 0.2));
            }
        }
        // Decorative arches removed; gameplay gate rows are separate.
        addInstancedCategory(env, 'fort-walls', box, makeCityMaterial(0x5E6E7C, { roughness: 0.85 }), fortWalls, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-towers', box, makeCityMaterial(0x5E6E7C, { roughness: 0.8, metalness: 0.2 }), fortTowers, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-tank-hulls', roundedRectGeometry(1, 1, 0.1, 1), makeCityMaterial(0x4A5A50, { roughness: 0.6, metalness: 0.4 }), fortHulls, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-tank-turrets', box, makeCityMaterial(0x3E4E44, { roughness: 0.55, metalness: 0.5 }), fortTurrets, { themes: ['fortress'], castShadow: true });
        addInstancedCategory(env, 'fort-sandbags', box, makeCityMaterial(0x9A8E6A, { roughness: 0.95 }), fortSandbags, { themes: ['fortress'], castShadow: true });

        // —— 城市斑马线(路面层次, 城市族): 每~44单位一组白色横道, 1 drawCall ——
        var crosswalks = [];
        for (var cw = 0; cw < 4; cw++) {
            var cwz = 12 - cw * 44;
            for (var cst = 0; cst < 5; cst++) {
                crosswalks.push(rec(-2.8 + cst * 1.4, 0.012, cwz, 0.85, 0.012, 0.4));
            }
        }
        addInstancedCategory(env, 'cityx-crosswalk', box, new THREE.MeshBasicMaterial({ color: 0xD8DCE0 }), crosswalks, { themes: CITY_ALIVE });

        // —— 远景剪影(各主题地平线补白, 每主题一类别, 1 drawCall) ——
        var distantSil = makeRecords(26, function (i) {
            var h = 6 + random() * 9;
            return rec((i % 2 ? 1 : -1) * (13 + random() * 8), h * 0.5, 10 - i * 6.2, 3 + random() * 3, h, 3 + random() * 3);
        });
        addInstancedCategory(env, 'apo-silhouette', box, makeCityMaterial(0x3E3038, { roughness: 0.9 }), distantSil, { themes: ['apocalypse'] });
        var mechSil = makeRecords(24, function (i) {
            var h = 7 + random() * 12;
            return rec((i % 2 ? 1 : -1) * (14 + random() * 8), h * 0.5, 10 - i * 6.6, 2.4 + random() * 2.2, h, 2.6 + random() * 2.4);
        });
        addInstancedCategory(env, 'mech-silhouette', box, makeCityMaterial(0x4A4E54, { roughness: 0.6, metalness: 0.4 }), mechSil, { themes: ['mechanical'] });
        var fortSil = makeRecords(22, function (i) {
            var h = 5 + random() * 8;
            return rec((i % 2 ? 1 : -1) * (13 + random() * 9), h * 0.5, 10 - i * 7.0, 3.4 + random() * 3, h, 3.4 + random() * 3);
        });
        addInstancedCategory(env, 'fort-silhouette', box, makeCityMaterial(0x42566A, { roughness: 0.85 }), fortSil, { themes: ['fortress'] });

        // V14: 既有城市类别主题归属 — 末日态保留楼体/枯树/远景, 隐藏商业街具与完好设施
        var membership = {
            'tree-trunks': CITY_FAMILY, 'tree-canopies': CITY_ALIVE, 'tree-crowns': CITY_ALIVE,
            'lamp-poles': CITY_ALIVE, 'lamp-heads': CITY_ALIVE,
            'parked-cars': CITY_ALIVE, 'car-glass': CITY_ALIVE, 'cones': CITY_ALIVE, 'barriers': CITY_ALIVE,
            'cream-buildings': CITY_FAMILY, 'teal-buildings': CITY_FAMILY, 'coral-buildings': CITY_FAMILY,
            'roof-trims': CITY_FAMILY, 'windows': CITY_FAMILY, 'distant-skyline': CITY_FAMILY,
            'street-concrete': CITY_ALIVE, 'shop-windows': CITY_ALIVE, 'shop-frames': CITY_ALIVE,
            'striped-awnings': CITY_ALIVE, 'awning-stripes': CITY_ALIVE, 'planter-shrubs': CITY_ALIVE,
            'parked-car-wheels': CITY_ALIVE, 'street-reflectors': CITY_ALIVE,
            'shop-sign-0': CITY_ALIVE, 'shop-sign-1': CITY_ALIVE, 'shop-sign-2': CITY_ALIVE,
            'clouds': ALL_BUT_CAVE
        };
        for (var mi3 = 0; mi3 < env.entries.length; mi3++) {
            var mEntry = env.entries[mi3];
            var mKey = mEntry.mesh.name.replace('v42-', '');
            if (membership[mKey]) {
                mEntry.themes = membership[mKey];
                mEntry.mesh.visible = false;
            }
        }
        V42Art.setEnvironmentTheme(env, world._themeApplied || 'default');

        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            for (var ri = 0; ri < entry.records.length; ri++) setRecordMatrix(entry, ri, env.tempObject);
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
        root.userData.drawCalls = env.drawCalls;
        return env;
    };

    V42Art.updateEnvironment = function (world, squadZ) {
        var env = world && world._v42Environment;
        if (!env || !isFinite(squadZ)) return;
        if (Math.abs(squadZ - env.lastSquadZ) < 0.2) return;
        env.lastSquadZ = squadZ;
        var back = squadZ - (env.span - env.front);
        var front = squadZ + env.front;
        for (var ei = 0; ei < env.entries.length; ei++) {
            var entry = env.entries[ei];
            if (!entry.mesh.visible) continue; // V14: 隐藏主题的类别不参与滚动重排
            var changed = false;
            for (var ri = 0; ri < entry.records.length; ri++) {
                var record = entry.records[ri];
                var oldZ = record.z;
                if (record.z > front) record.z -= env.span * Math.ceil((record.z - front) / env.span);
                else if (record.z < back) record.z += env.span * Math.ceil((back - record.z) / env.span);
                if (record.z !== oldZ) {
                    setRecordMatrix(entry, ri, env.tempObject);
                    changed = true;
                }
            }
            if (changed) entry.mesh.instanceMatrix.needsUpdate = true;
        }
    };

    function makeElement(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text !== undefined) node.textContent = text;
        return node;
    }

    function appendOnce(parent, id, node) {
        if (!parent || document.getElementById(id)) return document.getElementById(id);
        node.id = id;
        parent.appendChild(node);
        return node;
    }

    V42Art.installUI = function (game) {
        var container = document.getElementById('game-container');
        if (!container) return false;
        container.classList.add('v42-ui');

        var startPanel = document.querySelector('#start-screen .title-panel');
        if (startPanel && !document.getElementById('v42-brand')) {
            // V11 QA修复[P3]: 版本标识原硬编码V8.0.1, 改读package.json版本号(构建内联)并回退
            var gameVersion = (window.__GAME_VERSION || 'V11').toUpperCase();
            var brand = makeElement('div', 'v42-brand', '膨胀小队 · ' + gameVersion + ' 正式版');
            brand.id = 'v42-brand';
            startPanel.insertBefore(brand, startPanel.firstChild);
        }
        // V5.0: 首页顶栏 — 最高纪录 + 音效开关(任务书9.1)
        if (startPanel && !document.getElementById('v42-home-top')) {
            var homeTop = makeElement('div', 'v42-home-top');
            homeTop.id = 'v42-home-top';
            // V14.2: 顶栏静态图标替换系统Emoji(原创SVG, currentColor, 与宫格图标同规格)
            var ICON = function (paths, cls) {
                return '<svg class="v14-tb-icon ' + (cls || '') + '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + paths + '</svg>';
            };
            var best = makeElement('span', 'v42-best-record', '');
            best.id = 'v42-best-record';
            best.innerHTML = ICON('<path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4"/><path d="M12 14v3M9 21h6M10 18h4v3h-4z"/>') + ' <span class="v42-best-text">最高纪录: 第1关</span>';
            var soundBtn = makeElement('button', 'v42-home-sound', '🔊');
            soundBtn.id = 'btn-home-sound';
            soundBtn.setAttribute('aria-label', '音效开关');
            // V5.1: 金币 + 升级商店 + 免费补给
            var left = makeElement('div', 'v42-home-left');
            left.appendChild(best);
            var supplyBtn = makeElement('button', 'v51-supply-btn', '');
            supplyBtn.innerHTML = ICON('<rect x="4" y="9" width="16" height="12" rx="1.6"/><path d="M4 12h16M12 9v12M8.5 9c-2 0-3-1-3-2.4C5.5 5 7 4.6 8.2 5.2L12 9l3.8-3.8C17 4.6 18.5 5 18.5 6.6 18.5 8 17.5 9 15.5 9"/>') + ' 免费补给';
            supplyBtn.id = 'btn-free-supply';
            supplyBtn.setAttribute('aria-label', '每日免费补给(广告)');
            left.appendChild(supplyBtn);
            homeTop.appendChild(left);
            var right = makeElement('div', 'v42-home-right');
            var coinPill = makeElement('span', 'v51-coin-pill');
            coinPill.innerHTML = ICON('<circle cx="12" cy="12" r="8.2"/><path d="M12 7.5v9M14.8 9.2c-.7-.9-1.7-1.3-2.8-1.3-1.6 0-2.9 1-2.9 2.2 0 2.6 5.8 1.5 5.8 4 0 1.3-1.3 2.2-2.9 2.2-1.1 0-2.1-.4-2.8-1.3" class="v14-coin-mark"/>', 'v14-coin-icon') + ' <b data-coin-display>0</b>';
            right.appendChild(coinPill);
            var shopBtn = makeElement('button', 'v51-shop-btn', '');
            shopBtn.innerHTML = ICON('<path d="M12 19V6M6.5 11.5 12 6l5.5 5.5"/>') + ' 升级';
            shopBtn.id = 'btn-open-shop';
            right.appendChild(shopBtn);
            right.appendChild(soundBtn);
            homeTop.appendChild(right);
            startPanel.insertBefore(homeTop, startPanel.firstChild.nextSibling);
        }
        var title = document.querySelector('.game-title');
        if (title) title.textContent = '膨胀小队';
        var subtitle = document.querySelector('.game-subtitle');
        if (subtitle) subtitle.textContent = '城市突围 · 招募火力 · 击破核心';
        var startButton = document.getElementById('btn-start');
        if (startButton) startButton.textContent = '部署小队  →';

        if (startPanel && !document.getElementById('v42-mission-card')) {
            var mission = makeElement('section', 'v42-mission-card');
            mission.id = 'v42-mission-card';
            mission.setAttribute('aria-label', '任务简报');
            var missionTop = makeElement('div', 'v42-mission-topline');
            missionTop.appendChild(makeElement('span', 'v42-mission-label', '当前行动'));
            missionTop.appendChild(makeElement('span', 'v42-live-pill', '●  READY'));
            mission.appendChild(missionTop);
            mission.appendChild(makeElement('strong', 'v42-mission-title', '穿越增益门，扩大编队')); 
            mission.appendChild(makeElement('p', 'v42-mission-copy', '选择路线，叠加人数与火力，在终点击破首领核心。'));
            startPanel.insertBefore(mission, startButton);
        }
        if (startPanel && !document.getElementById('v42-controls')) {
            var controls = makeElement('div', 'v42-controls');
            controls.id = 'v42-controls';
            controls.setAttribute('aria-label', '操作方式');
            controls.appendChild(makeElement('span', 'v42-control-pill', '↔ 拖动变道'));
            controls.appendChild(makeElement('span', 'v42-control-pill', '◆ 选择状态门'));
            var hint = startPanel.querySelector('.hint-text');
            if (hint && hint.parentNode) { hint.parentNode.insertBefore(controls, hint); hint.parentNode.removeChild(hint); } else startPanel.appendChild(controls);
        }

        var levelName = document.getElementById('level-name');
        if (levelName && !document.getElementById('level-subtitle')) {
            var levelSubtitle = makeElement('div', 'v42-level-subtitle', '城市战区 · 突围中');
            levelSubtitle.id = 'level-subtitle';
            levelName.insertAdjacentElement('afterend', levelSubtitle);
        }
        var hud = document.getElementById('hud');
        if (hud) appendOnce(hud, 'v42-wave-banner', makeElement('div', 'v42-wave-banner hidden', '下一波接敌 · 2秒'));

        var bossInfo = document.getElementById('boss-info');
        if (bossInfo && !document.getElementById('boss-phase')) {
            var phase = makeElement('span', 'v42-boss-phase', '阶段 1');
            phase.id = 'boss-phase';
            var bossName = document.getElementById('boss-name');
            if (bossName) bossName.appendChild(phase); else bossInfo.insertBefore(phase, bossInfo.firstChild);
        }

        var pausePanel = document.querySelector('#pause-screen .title-panel');
        if (pausePanel && !pausePanel.querySelector('.v42-panel-kicker')) {
            pausePanel.insertBefore(makeElement('div', 'v42-panel-kicker', '行动已冻结'), pausePanel.firstChild);
        }
        var winPanel = document.querySelector('#win-screen .title-panel');
        if (winPanel && !winPanel.querySelector('.v42-panel-kicker')) {
            winPanel.insertBefore(makeElement('div', 'v42-panel-kicker gold', '任务完成'), winPanel.firstChild);
        }
        var losePanel = document.querySelector('#lose-screen .title-panel');
        if (losePanel && !losePanel.querySelector('.v42-panel-kicker')) {
            losePanel.insertBefore(makeElement('div', 'v42-panel-kicker red', '行动中断'), losePanel.firstChild);
        }

        if (game && game.ui) {
            game.ui.levelSubtitle = document.getElementById('level-subtitle');
            game.ui.waveBanner = document.getElementById('v42-wave-banner');
            game.ui.bossPhase = document.getElementById('boss-phase');
            game.ui.bestRecord = document.getElementById('v42-best-record');
            game.ui.homeSound = document.getElementById('btn-home-sound');
        }
        return true;
    };

    V42Art.pbr = { prepare: preparePbr };
    global.V42Art = V42Art;
})(window);


/* ===== [[ js/world.js ]] ===== */
// ===== 场景/相机/灯光/道路 =====

class World {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        this.scene.fog = new THREE.Fog(CONFIG.COLORS.fog, 45, 130);

        // 画质自动检测 (0=低 1=中 2=高)
        this.quality = this._detectQuality();

        // 渲染器
        this.renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: this.quality >= 1,
            powerPreference: 'high-performance'
        });
        var maxRatio = this.quality === 0 ? 1 : (this.quality === 1 ? 1.5 : 2);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, maxRatio));
        this.renderer.shadowMap.enabled = this.quality >= 1;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        // V15-ART-003: 移除导致 r149 linear 工作流发灰发暗的 ACESFilmicToneMapping, 恢复通透晴朗的阳光色彩
        this.renderer.toneMapping = THREE.NoToneMapping;

        // 相机 (V2.2: FOV 55° 竖屏构图)
        this.camera = new THREE.PerspectiveCamera(CONFIG.CAMERA_FOV || 55, 1, 0.1, 120);
        this.scene.userData.camera=this.camera;

        this._setupLights();
        if (typeof MilitaryArt !== 'undefined') {
            this.roadGroup = new THREE.Group();
            this.roadGroup.visible = false;
            this.roadSegments = [];
            this.decoItems = [];
            this.buildings = [];
            this.clouds = [];
            this._buildSky();
            this._militaryArt = new MilitaryArt(this);
        } else {
            this._buildRoad();
            V42Art.buildEnvironment(this);
            this._buildSky();
            if (typeof SceneryV121 !== 'undefined') this._v121Scenery = new SceneryV121(this);
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    _setupLights() {
        // V3.1: 灯光再平衡。旧参数合计~1.85x导致Lambert钳制发白(路面/草地洗成白蓝)。
        // raw-linear工作流下, 水平面有效光照 ≈ 0.7*0.85 + 0.5*0.6 + 0.15 ≈ 1.1, 保留少量高光余量。
        // 半球光: 晴空天蓝 -> 军绿草地反光 (V15 阳光军事基地)
        const hemi = new THREE.HemisphereLight(0xB8E4FF, 0x6A9650, 0.56);
        this.scene.add(hemi);
        this.hemiLight = hemi; // V13: 主题系统需要调整半球光色/强度

        // 主方向光 (暖阳日光, 清晰立体投影)
        const dir = new THREE.DirectionalLight(0xFFF3D4, 0.92);
        dir.position.set(5, 14, 7);
        dir.castShadow = true;
        // V10.1: 阴影贴图按画质分档 — 中画质(多数手机)2048→1024, GPU负担减半
        var shadowRes = this.quality >= 2 ? 2048 : 1024;
        dir.shadow.mapSize.set(shadowRes, shadowRes);
        dir.shadow.camera.left = -10;
        dir.shadow.camera.right = 10;
        dir.shadow.camera.top = 16;
        dir.shadow.camera.bottom = -14;
        dir.shadow.camera.near = 1;
        dir.shadow.camera.far = 42;
        dir.shadow.bias = -0.0008;
        this.scene.add(dir);
        this.scene.add(dir.target); // target必须加入场景才能正确更新matrixWorld
        this.sunLight = dir;

        // V19.0: 暖金主光 + 冷青蓝战术轮廓光 + 程序化 IBL 环境反射贴图 (赋予头盔/枪械/装甲真实商业3D金属高光, 0KB额外下载!)
        const fill = new THREE.DirectionalLight(0x64B5F6, 0.48);
        fill.position.set(-6, 8, -10);
        this.scene.add(fill);
        if (typeof THREE.PMREMGenerator !== 'undefined' && this.renderer) {
            var pmrem, envTexture;
            try {
                pmrem = new THREE.PMREMGenerator(this.renderer);
                var envCv = document.createElement('canvas');
                // Broad sky/ground bands need a 64px reflection cube, rather
                // than six 256px scene captures and an extra sphere/material.
                envCv.width = 256; envCv.height = 128;
                var ectx = envCv.getContext('2d');
                var eg = ectx.createLinearGradient(0, 0, 0, 128);
                eg.addColorStop(0.0, '#5CB8FF');
                eg.addColorStop(0.45, '#FFE8C2');
                eg.addColorStop(0.55, '#334155');
                eg.addColorStop(1.0, '#0F172A');
                ectx.fillStyle = eg;
                ectx.fillRect(0, 0, 256, 128);
                envTexture = new THREE.CanvasTexture(envCv);
                envTexture.mapping = THREE.EquirectangularReflectionMapping;
                this._envRT = pmrem.fromEquirectangular(envTexture);
                this.scene.environment = this._envRT.texture;
            } catch (e) {
                console.warn('Environment lighting fallback:', e.message);
            } finally {
                if (envTexture) envTexture.dispose();
                if (pmrem) pmrem.dispose();
            }
        }
    }

    /** V19.1 商业级自然渐变天空穹顶 + 柔和层积云与大气透视光晕 (单球单drawCall, 彻底移除巨型低模白云球!) */
    _buildSky() {
        const cv = document.createElement('canvas');
        cv.width = 512; cv.height = 256;
        this._skyCanvas = cv;
        this._paintSky(['#1F5FA2', '#52A3E2', '#A6D6F4', '#E6F3FB']);
        var tex = new THREE.CanvasTexture(cv);
        tex.wrapS = THREE.RepeatWrapping;
        tex.wrapT = THREE.ClampToEdgeWrapping;
        var mat = new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false });
        var dome = new THREE.Mesh(new THREE.SphereGeometry(96, 32, 20), mat);
        dome.renderOrder = -10;
        dome.userData.artSource = 'js/world.js:_buildSky() V19.1 自然渐变天穹与柔和体积层云 512x256';
        this.scene.add(dome);
        this._skyDome = dome;

        // V19.1: 隐藏旧版平面化巨型球体云团(保留引用兼容旧主题逻辑)
        var cloudGeo = new THREE.SphereGeometry(0.1, 4, 4);
        var cloudMat = new THREE.MeshBasicMaterial({ visible: false });
        var cloudMesh = new THREE.InstancedMesh(cloudGeo, cloudMat, 1);
        cloudMesh.count = 0;
        cloudMesh.visible = false;
        this._skyClouds = cloudMesh;

        var T0 = (CONFIG.WORLD_THEMES && (CONFIG.WORLD_THEMES[this._themeApplied || 'default'])) || CONFIG.WORLD_THEMES.default;
        this.scene.fog.color.setHex(T0.fog);
    }

    _buildRoad() {
        const C = CONFIG.COLORS;
        const roadGroup = new THREE.Group();
        this.roadGroup = roadGroup;
        roadGroup.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';
        this.roadSegments = [];

        const SEG_LEN = 12;
        const SEG_COUNT = 12;

        // 道路纹理(浅灰蓝柏油 + 大色调变化 + 噪点 + 车道线) — V12视觉: 色调分层, 黄边线降饱和
        const roadCanvas = document.createElement('canvas');
        roadCanvas.width = 256;
        roadCanvas.height = 512;
        const rctx = roadCanvas.getContext('2d');
        // 底色: 灰蓝柏油(V3.6加深保证可读; V12: 略偏蓝青与天空呼应, 去紫味)
        rctx.fillStyle = '#7C8B96';
        rctx.fillRect(0, 0, 256, 512);
        // V12: 大块色调变化(3-4个宽幅纵向淡色带, 打破整段同色)
        var bandTones = ['rgba(255,255,255,0.045)', 'rgba(30,44,56,0.05)', 'rgba(255,255,255,0.03)', 'rgba(30,44,56,0.04)'];
        for (let b = 0; b < 4; b++) {
            rctx.fillStyle = bandTones[b];
            var bx = (b * 67 + randRange(-10, 10)) % 256;
            rctx.fillRect(bx, 0, randRange(46, 80), 512);
        }
        // 柏油噪点纹理
        for (let i = 0; i < 400; i++) {
            var v = Math.random();
            rctx.fillStyle = v < 0.5 ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.03)';
            rctx.fillRect(Math.random() * 256, Math.random() * 512, 2 + Math.random() * 3, 2 + Math.random() * 3);
        }
        // 路面裂缝(细微线条)
        rctx.strokeStyle = 'rgba(0,0,0,0.06)';
        rctx.lineWidth = 1;
        for (let i = 0; i < 8; i++) {
            rctx.beginPath();
            var sx = Math.random() * 256;
            var sy = Math.random() * 512;
            rctx.moveTo(sx, sy);
            rctx.lineTo(sx + randRange(-20, 20), sy + randRange(10, 40));
            rctx.stroke();
        }
        // V3.7: 车辙印(两条纵向暗带 — 增加柏油路真实感)
        rctx.fillStyle = 'rgba(28,40,48,0.10)';
        rctx.fillRect(52, 0, 22, 512);
        rctx.fillRect(182, 0, 22, 512);
        // V3.7: 深色补丁(随机圆形沥青修补痕)
        for (let pi = 0; pi < 5; pi++) {
            var px = randRange(30, 226), py = randRange(20, 480), pr = randRange(8, 18);
            rctx.fillStyle = 'rgba(70,64,90,0.1)';
            rctx.beginPath();
            rctx.ellipse(px, py, pr, pr * 0.7, 0, 0, Math.PI * 2);
            rctx.fill();
        }
        // 车道分隔线(白色虚线 - 对齐实际车道边界 X=±1)
        rctx.fillStyle = '#F0EEF5';
        for (let y = 0; y < 512; y += 48) {
            rctx.fillRect(88, y, 5, 30);
            rctx.fillRect(163, y, 5, 30);
        }
        // 路边实线(V12: 降饱和暖黄+暗色衬边 — 原纯黄过艳, 抢戏整个画面)
        rctx.fillStyle = 'rgba(52,58,48,0.35)';
        rctx.fillRect(3, 0, 7, 512);
        rctx.fillRect(246, 0, 7, 512);
        rctx.fillStyle = '#E3C26B';
        rctx.fillRect(4, 0, 5, 512);
        rctx.fillRect(247, 0, 5, 512);
        // Drain covers and repairs make the road read as part of a lived-in street.
        rctx.fillStyle = '#445660';
        rctx.fillRect(12, 350, 19, 34);
        rctx.fillRect(225, 100, 19, 34);
        rctx.strokeStyle = '#8B9A9E';
        for (var drain = 0; drain < 6; drain++) {
            rctx.beginPath();
            rctx.moveTo(14, 354 + drain * 5);
            rctx.lineTo(29, 354 + drain * 5);
            rctx.moveTo(227, 104 + drain * 5);
            rctx.lineTo(242, 104 + drain * 5);
            rctx.stroke();
        }
        const roadTex = new THREE.CanvasTexture(roadCanvas);
        roadTex.wrapS = THREE.RepeatWrapping;
        roadTex.wrapT = THREE.RepeatWrapping;
        roadTex.anisotropy = 4;

        const roadMat = new THREE.MeshLambertMaterial({ map: roadTex });
        this._v121RoadMaterial = roadMat;
        this.roadMat = roadMat; // V14: 主题地面纹理切换需要引用

        // V3.5: 每段合并为3个mesh(路面/路侧结构/草地) — 原9个, drawCalls 108→36
        for (let i = 0; i < SEG_COUNT; i++) {
            const seg = new THREE.Group();
            seg.userData.artSource = 'js/world.js:_buildRoad() CanvasTexture 256x512(柏油+车辙+补丁+车道线)';

            // 道路面(带纹理)
            const road = new THREE.Mesh(new THREE.PlaneGeometry(6.8, SEG_LEN), roadMat);
            road.rotation.x = -Math.PI / 2;
            road.receiveShadow = true;
            road.userData.legacyRoad = true;
            seg.add(road);

            // Keep low sidewalks; remove decorative guardrails and caps.
            var structGeos = [
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: -3.8, y: 0.05, z: 0, c: 0xC5CDC9 },
                { g: new THREE.BoxGeometry(0.8, 0.1, SEG_LEN), x: 3.8, y: 0.05, z: 0, c: 0xC5CDC9 }
            ].map(function(item) {
                item.g.translate(item.x, item.y, item.z);
                return colorize(item.g, item.c);
            });
            var structMesh = new THREE.Mesh(mergeGeometries(structGeos),
                new THREE.MeshLambertMaterial({ vertexColors: true }));
            structMesh.castShadow = true;
            structMesh.receiveShadow = true;
            structMesh.userData.legacyRoad = true;
            seg.add(structMesh);

            var pavement = [];
            for (var side = -1; side <= 1; side += 2) {
                for (var tile = 0; tile < 8; tile++) {
                    var seam = new THREE.BoxGeometry(.78, .012, .025);
                    seam.translate(side * 3.8, .108, -5.25 + tile * 1.5);
                    pavement.push(colorize(seam, 0x879A97));
                    var curb = new THREE.BoxGeometry(.12, .08, .72);
                    curb.translate(side * 3.43, .06, -5.25 + tile * 1.5);
                    pavement.push(colorize(curb, tile % 2 ? 0xE7E4CF : 0x4C6266));
                }
            }
            var pavementMesh = new THREE.Mesh(mergeGeometries(pavement), new THREE.MeshLambertMaterial({ vertexColors: true }));
            pavementMesh.userData.legacyRoad = true;
            seg.add(pavementMesh);

            // 草地(两侧合并) — V12视觉: 修剪条纹明暗交替 + 偶发浅色草斑, 打破大片单色
            var grassBase = new THREE.Color(C.grass);
            var grassLight = grassBase.clone().lerp(new THREE.Color(0xCFFF9E), 0.16);
            var grassGeoList = [];
            for (var side2 = -1; side2 <= 1; side2 += 2) {
                for (var strip = 0; strip < 4; strip++) {
                    var stripGeo = new THREE.PlaneGeometry(20, SEG_LEN / 4);
                    stripGeo.rotateX(-Math.PI / 2);
                    stripGeo.translate(side2 * 14, -0.02, SEG_LEN / 4 * (strip - 1.5));
                    grassGeoList.push(colorize(stripGeo, strip % 2 ? grassLight : grassBase));
                }
                // 偶发浅色草斑(每段每侧1个, 大而淡)
                var patch = new THREE.CircleGeometry(randRange(0.9, 1.7), 7);
                patch.rotateX(-Math.PI / 2);
                patch.translate(side2 * randRange(6.5, 10.5), -0.015, randRange(-4, 4));
                grassGeoList.push(colorize(patch, grassLight.clone().lerp(grassBase, 0.35)));
            }
            var grassMat = new THREE.MeshLambertMaterial({ vertexColors: true });
            // V14.3: 草地噪点贴图(与顶点色相乘, 提升地面材质质量; 共享单张纹理)
            if (typeof V42Art !== 'undefined' && V42Art.getGrassTexture) grassMat.map = V42Art.getGrassTexture();
            var groundMesh = new THREE.Mesh(mergeGeometries(grassGeoList), grassMat);
            groundMesh.receiveShadow = true;
            seg.add(groundMesh);

            seg.position.z = -i * SEG_LEN + SEG_LEN;
            roadGroup.add(seg);
            this.roadSegments.push({ group: seg, length: SEG_LEN });
        }

        // 起点线(斑马线样式 - 白色横条合并为单mesh)
        var stripeGeos = [];
        for (var si = 0; si < 5; si++) {
            var sg = new THREE.PlaneGeometry(1.0, 0.25);
            sg.rotateX(-Math.PI / 2);
            sg.translate(-2.8 + si * 1.4, 0.012, 0.5);
            stripeGeos.push(colorize(sg, 0xFFFFFF));
        }
        var startStripe = new THREE.Mesh(mergeGeometries(stripeGeos), new THREE.MeshBasicMaterial({ vertexColors: true }));
        startStripe.userData.legacyRoad = true;
        roadGroup.add(startStripe);
        this.scene.add(roadGroup);
    }


    // V11 QA: 移除无调用的 _buildCitySkyline()(V4.2环境由art-v42.js接管, 此方法全库零引用成为死代码;
    // this.buildings 仍保留 — art-v42.js重置它, 滚动循环遍历空数组无副作用)

    /**
     * 道路/装饰无限滚动 (V3.1: 无状态平铺)
     * 旧实现只在 z > squadZ+阈值 时向后跳一格, 重开(squad回0)后所有段滞留远处,
     * 玩家踩空100+单位 → 大面积空白。改为按 squadZ 直接计算每段归属位置,
     * 重开/复活/传送自动正确。
     */
    updateRoadScroll(squadZ) {
        if(this._v42Environment && this._v42Environment.root.visible)this._v42Environment.update(squadZ);
        if(this._v121Scenery)this._v121Scenery.update(squadZ);
        if(this._militaryArt)this._militaryArt.update(squadZ);
        const SEG_LEN = 12;
        // 路段: 覆盖 [squadZ+18, squadZ-114], 共12段
        const base = Math.ceil((squadZ + SEG_LEN * 1.5) / SEG_LEN) * SEG_LEN;
        for (let i = 0; i < this.roadSegments.length; i++) {
            this.roadSegments[i].group.position.z = base - i * SEG_LEN;
        }

        // 装饰/建筑/云: 双向折返进窗口 [squadZ-170, squadZ+15]
        const span = 170;
        for (const item of this.decoItems) {
            if (item.position.z > squadZ + 15) {
                item.position.z -= span * Math.ceil((item.position.z - (squadZ + 15)) / span);
            } else if (item.position.z < squadZ - (span - 15)) {
                item.position.z += span * Math.ceil((squadZ - (span - 15) - item.position.z) / span);
            }
        }
        for (const building of this.buildings) {
            if (building.position.z > squadZ + 20) {
                building.position.z -= span * Math.ceil((building.position.z - (squadZ + 20)) / span);
            } else if (building.position.z < squadZ - (span - 20)) {
                building.position.z += span * Math.ceil((squadZ - (span - 20) - building.position.z) / span);
            }
        }
        for (const cloud of this.clouds) {
            const cSpan = 110;
            if (cloud.position.z > squadZ + 20) {
                cloud.position.z -= cSpan * Math.ceil((cloud.position.z - (squadZ + 20)) / cSpan);
            } else if (cloud.position.z < squadZ - (cSpan - 20)) {
                cloud.position.z += cSpan * Math.ceil((squadZ - (cSpan - 20) - cloud.position.z) / cSpan);
            }
        }
    }

    /** 相机跟随小队 */
    // V4.0: 动态构图 — 相机随军团规模升高后移(sqrt曲线), 军团壮观但不拥挤
    // 12人: 6.1/7.8(清晰) | 100人: +1.2 | 300人: +2.0 | 500人: +2.6(全景)
    updateCamera(squadX, squadZ, dt, squadCount, formationDepth) {
        const cam = this.camera;
        // Damping follows the unshaken position; feedback offsets must not feed
        // into the next frame's follow target and leave a lingering drift.
        cam.position.x -= this._shakeOffsetX || 0;
        cam.position.y -= this._shakeOffsetY || 0;
        this._shakeOffsetX = this._shakeOffsetY = 0;
        var n=squadCount||1,cols=n<=1?1:n<=12?Math.ceil(Math.sqrt(n)):n<=100?6:n<=300?11:13;
        var spacing=n<=12?.72:n<=100?.74:n<=300?.50:.46;
        var depth=formationDepth===undefined ? Math.max(0,Math.ceil(n/cols)-1)*spacing : formationDepth;
        var cf = clamp(Math.sqrt(clamp((squadCount || 1) / 500, 0, 1)) * 1.2, 0, 1);
        if (this._camScale === undefined) this._camScale = cf;
        this._camScale = damp(this._camScale, cf, 3, dt);   // 人数变化时平滑过渡
        // V5.1修复: formationDepth 未平滑直接进相机 — 人数每次增减(被杀/吸血/穿门)相机前后跳,
        // 是"人物向后移动的视觉效果"的主因之一。改为阻尼平滑。
        if (this._depthSmooth === undefined) this._depthSmooth = depth;
        this._depthSmooth = damp(this._depthSmooth, depth, 5.5, dt);
        var sDepth = this._depthSmooth;
        // V15-ART-006: 稳定投影包围盒自适应相机 (护盾/状态切换零突兀缩放, 36人宽度占屏65%-86%, 底部86%-93%)
        var halfW = (squadCount > 1) ? Math.min(2.45, 0.50 + Math.sqrt(squadCount) * 0.255) : 0.45;
        var aspect = (cam.aspect && cam.aspect > 0.2) ? cam.aspect : (390 / 844);
        var halfVRad = (cam.fov * Math.PI / 180) * 0.5;
        var halfHRad = Math.atan(Math.tan(halfVRad) * aspect);
        var minDistForWidth = (halfW / 0.74) / Math.max(0.22, Math.tan(halfHRad));
        var baseOffZ = 8.2 + this._camScale * 1.8 + sDepth * 0.78;
        var offZ = Math.max(baseOffZ, minDistForWidth * 0.82);
        var offY = 5.7 + this._camScale * 2.75 + Math.max(0, offZ - baseOffZ) * 0.45;
        var lookAhead = CONFIG.CAMERA_LOOK_AHEAD - this._camScale * 1.5 + sDepth * 0.68;

        const targetX = squadX * CONFIG.CAMERA_FOLLOW_X;
        cam.position.x = damp(cam.position.x, targetX, 6, dt);
        cam.position.y = damp(cam.position.y, offY, 5, dt);
        cam.position.z = damp(cam.position.z, squadZ + offZ, 8, dt);
        // Game Feel: Trauma^2 平滑多频正弦震屏(真实dt衰减, 不随机乱抖, 轻击微震重击有力)
        if (this._shakeT > 0.001) {
            this._shakeT = Math.max(0, this._shakeT - dt * (this._shakeDecay || 2.4));
            this._shakePhase = (this._shakePhase || 0) + dt * 34.0;
            var sAmp = this._shakeAmp * (this._shakeT * this._shakeT);
            this._shakeOffsetX = Math.sin(this._shakePhase * 1.7) * sAmp;
            this._shakeOffsetY = Math.sin(this._shakePhase * 2.3) * sAmp * 0.55;
            cam.position.x += this._shakeOffsetX;
            cam.position.y += this._shakeOffsetY;
        }
        cam.lookAt(targetX * 0.5, 0, squadZ + lookAhead);
        // V12视觉: 天空穹顶与V15白云跟随相机(XZ), 保持地平线稳定
        if (this._skyDome) this._skyDome.position.set(cam.position.x, 0, cam.position.z);
        if (this._skyClouds) this._skyClouds.position.set(cam.position.x * 0.4, 0, cam.position.z);

        // 阴影相机跟随
        this.sunLight.position.set(squadX + 4, 12, squadZ + 6);
        this.sunLight.target.position.set(squadX, 0, squadZ - 2);
        this.sunLight.target.updateMatrixWorld();
    }

    /** V6.0: 关卡主题 — 场景换装(天空/雾/灯光), 'default'还原
     *  V13: 泛化为 CONFIG.WORLD_THEMES 预设查表 — 10 关全覆盖(城市时段族+末日/洞穴/机械/要塞),
     *       天穹渐变按主题重绘(16x256 Canvas, 单drawCall不变), 环境实例染色目标泛化。
     *       仅表现层; 关卡结构/刷怪/胜负不受影响。'apocalypse' 保持与旧 APOCALYPSE_THEME 完全一致。 */
    applyTheme(themeName) {
        var themes = CONFIG.WORLD_THEMES || {};
        var T = themes[themeName] || themes.default;
        if (!T) return;
        if (this._skyCanvas && this._paintSky) {
            this._paintSky(T.sky);
            this.scene.background = null;
        } else {
            this.scene.background = new THREE.Color(CONFIG.COLORS.sky);
        }
        this.scene.fog = new THREE.Fog(T.fog, T.fogNear, T.fogFar);
        if (this._skyDome) this._skyDome.material.color.setHex(T.domeTint || 0xFFFFFF);
        this.sunLight.color.setHex(T.sunColor);
        this.sunLight.intensity = T.sunIntensity;
        if (this.hemiLight) {
            this.hemiLight.color.setHex(T.hemiSky);
            this.hemiLight.groundColor.setHex(T.hemiGround);
            this.hemiLight.intensity = T.hemiIntensity;
        }
        // 环境实例材质染色(草地/建筑向主题色过渡; __themeBaseHex 记录初始色, 幂等)
        if (this._v42Environment && this._v42Environment.root) {
            this._v42Environment.root.traverse(function(o) {
                if (o.isInstancedMesh && o.material && o.material.color && !o.material.__noThemeTint) {
                    if (o.material.__themeBaseHex === undefined) o.material.__themeBaseHex = o.material.color.getHex();
                    var base = new THREE.Color(o.material.__themeBaseHex);
                    var target = new THREE.Color(T.envTint).lerp(base, 0.35);
                    o.material.color.copy(base.lerp(target, 0.55));
                    o.material.needsUpdate = true;
                }
            });
        }
        // V14: 主题道具包可见性切换 + 地面纹理切换(柏油/龟裂/岩面/金属板/混凝土)
        if (this._v42Environment && V42Art.setEnvironmentTheme) {
            V42Art.setEnvironmentTheme(this._v42Environment, themeName);
        }
        if (this.roadMat && V42Art.getGroundTexture) {
            var groundTex = V42Art.getGroundTexture(T.ground || 'asphalt');
            if (this.roadMat.map !== groundTex) {
                this.roadMat.map = groundTex;
                this.roadMat.needsUpdate = true;
            }
        }
        this._themeApplied = themeName;
        if(this._v121Scenery)this._v121Scenery.setTheme(themeName);
        if(this._militaryArt)this._militaryArt.setTheme(themeName);
    }

    /** V19.1: 按主题重绘 512x256 自然大气渐变 + 柔和多层羽化云带 + 太阳暖光晕 */
    _paintSky(stops) {
        if (!this._skyCanvas || !stops || stops.length < 4) return;
        var cv = this._skyCanvas;
        var w = cv.width, h = cv.height;
        var ctx = cv.getContext('2d');
        var g = ctx.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0.00, stops[0]);
        g.addColorStop(0.42, stops[1]);
        g.addColorStop(0.76, stops[2]);
        g.addColorStop(1.00, stops[3]);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);

        // 太阳高空柔和暖金散射光晕 (对齐正前方远景地平线偏右上)
        var sunX = w * 0.56, sunY = h * 0.30;
        var sun = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, 130);
        sun.addColorStop(0.0, 'rgba(255,250,224,0.48)');
        sun.addColorStop(0.35, 'rgba(255,238,196,0.18)');
        sun.addColorStop(1.0, 'rgba(255,238,196,0)');
        ctx.fillStyle = sun;
        ctx.fillRect(0, 0, w, h);

        // 柔和自然体积层积云带 (底面淡蓝灰阴影 + 顶面暖白羽化高光, 绝不抢戏或像硬塑料球!)
        var paintSoftCloud = function(cx, cy, rx, ry, alpha) {
            // 云底柔和冷影
            var sh = ctx.createRadialGradient(cx, cy + ry * 0.24, rx * 0.08, cx, cy + ry * 0.24, rx);
            sh.addColorStop(0, 'rgba(138,176,208,' + (alpha * 0.34).toFixed(3) + ')');
            sh.addColorStop(1, 'rgba(138,176,208,0)');
            ctx.save();
            ctx.translate(cx, cy + ry * 0.22);
            ctx.scale(1, ry / rx);
            ctx.fillStyle = sh;
            ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill();
            ctx.restore();
            // 云顶暖白柔光簇
            var puffs = [[-0.36, 0.06, 0.62], [0.0, -0.14, 0.78], [0.38, 0.04, 0.60], [-0.16, -0.06, 0.66], [0.20, -0.05, 0.64]];
            for (var pi = 0; pi < puffs.length; pi++) {
                var px = cx + puffs[pi][0] * rx, py = cy + puffs[pi][1] * ry, pr = rx * puffs[pi][2];
                var pg = ctx.createRadialGradient(px, py - pr * 0.12, pr * 0.05, px, py, pr);
                pg.addColorStop(0.0, 'rgba(255,253,248,' + alpha.toFixed(3) + ')');
                pg.addColorStop(0.48, 'rgba(244,250,255,' + (alpha * 0.52).toFixed(3) + ')');
                pg.addColorStop(1.0, 'rgba(244,250,255,0)');
                ctx.save();
                ctx.translate(px, py);
                ctx.scale(1, (ry / rx) * 1.15);
                ctx.fillStyle = pg;
                ctx.beginPath(); ctx.arc(0, 0, pr, 0, Math.PI * 2); ctx.fill();
                ctx.restore();
            }
        };
        var bands = [
            [72, 86, 56, 15, 0.42], [176, 76, 68, 17, 0.46], [298, 82, 74, 18, 0.44], [426, 78, 62, 16, 0.40],
            [124, 104, 48, 11, 0.30], [242, 100, 54, 12, 0.32], [368, 102, 52, 12, 0.30]
        ];
        for (var bi = 0; bi < bands.length; bi++) {
            var b = bands[bi];
            paintSoftCloud(b[0], b[1], b[2], b[3], b[4]);
        }

        // 地平线柔和大气雾化过渡带
        var hz = ctx.createLinearGradient(0, h * 0.62, 0, h * 0.92);
        hz.addColorStop(0, 'rgba(226,242,252,0)');
        hz.addColorStop(1, 'rgba(226,242,252,0.36)');
        ctx.fillStyle = hz;
        ctx.fillRect(0, h * 0.62, w, h * 0.32);

        if (this._skyDome && this._skyDome.material && this._skyDome.material.map) {
            this._skyDome.material.map.needsUpdate = true;
        }
    }

    /** V4.0: 触发屏幕震动(amp≈世界单位幅度) */
    shake(amp, duration) {
        if (this._shakeDisabled === undefined) {
            // V12: 震动偏好走 Platform.storage(h5 兼容旧裸键 pz_shake_off; 微信端无 localStorage 也可存取)
            var _shakeOff = '0';
            if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
                _shakeOff = Platform.storage.getLegacy('pz_shake_off', '0');
            } else {
                try { _shakeOff = localStorage.getItem('pz_shake_off') || '0'; } catch (e) {}
            }
            this._shakeDisabled = (_shakeOff === '1' || _shakeOff === 1);
        }
        if (this._shakeDisabled) return; // V10 QA修复: 设置页屏幕震动开关此前只写不读
        var strength = amp || 0.3;
        if ((this._shakeAmp || 0) * (this._shakeT || 0) > strength) return;
        this._shakeT = 1;
        this._shakeAmp = strength;
        this._shakeDecay = 1 / (duration || .45);
    }

    _detectQuality() {
        var requested = new URLSearchParams(window.location.search).get('quality');
        if (requested !== null && /^[012]$/.test(requested)) return Number(requested);
        // V12: 用户画质设置生效(原 pz_quality 只写不读, 设置页按钮形同虚设)
        if (typeof Platform !== 'undefined' && Platform.storage && Platform.storage.getLegacy) {
            var savedQ = Platform.storage.getLegacy('pz_quality', null);
            if (savedQ !== null && /^[012]$/.test(String(savedQ))) return Number(savedQ);
        }
        var dpr = window.devicePixelRatio || 1;
        var area = window.innerWidth * window.innerHeight;
        // 移动端小屏 + 低DPR → 低画质
        if (dpr <= 1 && area < 500000) return 0;
        // 中等设备 → 中画质
        if (dpr <= 1.5 || area < 800000) return 1;
        // 高端设备 → 高画质
        return 2;
    }

    resize() {
        // V11 QA修复[P3]: 容器缺失守卫(canvas未挂载时parentElement为null)
        const container = this.canvas.parentElement;
        if (!container) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        if (!w || !h) return;
        // CSS pixels, shared with projected HUD elements. Reading canvas layout
        // after HUD writes forces a synchronous layout in every moving frame.
        this.viewportWidth = w;
        this.viewportHeight = h;
        this.renderer.setSize(w, h, false);
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
    }

}
// V10.1: 移除无调用的 World.render()(game.js 直接 renderer.render)


/* ===== [[ js/scenery-v121.js ]] ===== */
// Generated diffuse materials + real reusable roadside geometry. Visuals only.
var SceneryV121 = class SceneryV121 {
    constructor(world) {
        this.world = world;
        this.groups = {};
        this.active = null;
        this.materials = {};
        this.tiles = [];
        this._matrix = new THREE.Object3D();
        this._lastZ = Infinity;
        this.geometries = {
            box: new THREE.BoxGeometry(1, 1, 1),
            rock: new THREE.IcosahedronGeometry(1, 1),
            orb: new THREE.IcosahedronGeometry(1, 2),
            cylinder: new THREE.CylinderGeometry(1, 1, 1, 10),
            cone: new THREE.ConeGeometry(1, 1, 10),
            ring: new THREE.TorusGeometry(1, .16, 5, 16),
            arch: new THREE.TorusGeometry(1, .16, 5, 16, Math.PI)
        };
        var colors = { asphalt: 0x72818a, stone: 0xb4a38b, metal: 0x798794,
            rock: 0x81768d, organic: 0x715074, ground: 0x9b794f,
            armor: 0x7c8b95, fortress: 0xb6a58d, rubber: 0x253241,
            glass: 0x70bdcc, orange: 0xd88a48, blue: 0x597ba0,
            red: 0x9b4754, stem: 0x87789d };
        for (var key in colors) this.materials[key] = new THREE.MeshLambertMaterial({ color: colors[key] });
        this.materials.cyan = new THREE.MeshBasicMaterial({ color: 0x68e6e2 });
        this.materials.purple = new THREE.MeshBasicMaterial({ color: 0xc18ae7 });
        this.materials.light = new THREE.MeshBasicMaterial({ color: 0xffd68b });
        this._road = world._v121RoadMaterial;
        this._originalRoad = this._road && this._road.map;
        this._roadSides = [];
        world.roadGroup.traverse(o => {
            if (o.isMesh && o.material !== this._road && !this._roadSides.some(x => x.material === o.material)) {
                this._roadSides.push({ material: o.material, color: o.material.color.clone() });
            }
        });
        this.setTheme('default');
        this.ready = new Promise((resolve, reject) => {
            var atlasUrl = 'assets/art-v121/world-materials.jpg';
            if (typeof Platform === 'undefined' || Platform.id === 'h5') atlasUrl += '?v=121';
            new THREE.TextureLoader().load(atlasUrl, texture => {
                try {
                var image = texture.image._impl || texture.image;
                var names = ['asphalt', 'stone', 'metal', 'rock', 'organic', 'ground', 'armor', 'fortress'];
                for (var i = 0; i < names.length; i++) {
                    var canvas = document.createElement('canvas'); canvas.width = canvas.height = 256;
                    canvas.getContext('2d').drawImage(image, (i % 4) * image.width / 4, Math.floor(i / 4) * image.height / 2,
                        image.width / 4, image.height / 2, 0, 0, 256, 256);
                    var tile = new THREE.CanvasTexture(canvas);
                    tile.wrapS = tile.wrapT = THREE.RepeatWrapping;
                    tile.anisotropy = 2;
                    this.tiles.push(tile);
                    this.materials[names[i]].map = tile;
                    this.materials[names[i]].color.setHex(0xffffff);
                    this.materials[names[i]].needsUpdate = true;
                }
                texture.dispose();
                this._applyRoad(this.theme);
                resolve(this);
                } catch (error) { texture.dispose(); reject(error); }
            }, undefined, error => reject(Error('World material atlas failed: ' + (error.message || error))));
        });
        // Loading failure leaves the readable material-color fallback in place.
        this.ready.catch(error => console.warn(error.message));
    }

    _bucket(group, shape, material, x, y, z, sx, sy, sz, rx, ry, rz) {
        var key = shape + ':' + material;
        var buckets = group.userData.buckets;
        (buckets[key] || (buckets[key] = { shape, material, records: [] })).records.push({
            x, y, z, sx, sy, sz, rx: rx || 0, ry: ry || 0, rz: rz || 0
        });
    }

    _build(theme) {
        var group = new THREE.Group();
        group.name = 'scenery-v121-' + theme;
        group.userData = { artSource: 'js/scenery-v121.js + assets/art-v121/world-materials.jpg',
            collidable: false, buckets: {}, entries: [] };
        var add = this._bucket.bind(this, group);
        for (var i = 0; i < 16; i++) {
            var side = i % 2 ? 1 : -1;
            var z = 12 - Math.floor(i / 2) * 21;
            var x = side * 4.7;
            var ground = { default: 'stone', cave: 'rock', mechanical: 'ground', fortress: 'stone', apocalypse: 'organic' }[theme];
            add('box', ground, side * 14, -.04, z, 19.6, .08, 21.2);
            if (theme === 'default') {
                // Actual cars have separate tires, cabin, glass and body volumes.
                if (i % 4 < 2) {
                    add('box', i % 3 ? 'orange' : 'blue', x + side * .2, .58, z, 1.35, .6, 2.5, 0, side * .08);
                    add('box', 'metal', x + side * .2, .98, z - .18, 1.2, .48, 1.3);
                    add('box', 'glass', x - side * .42, 1.03, z - .18, .025, .3, 1.08);
                    add('box', 'glass', x + side * .2, 1.04, z + .49, 1.06, .3, .035);
                    for (var axle of [-.78, .78]) for (var wheel of [-.65, .65])
                        add('cylinder', 'rubber', x + side * .2 + wheel, .32, z + axle, .29, .18, .29, 0, 0, Math.PI / 2);
                    add('box', 'light', x + side * .2, .58, z + 1.27, .8, .12, .03);
                } else {
                    for (var b = 0; b < 4; b++) add('orb', 'ground', side * 5.1, .3 + (b % 2) * .25, z - .8 + b * .45, .48, .18, .27);
                }
                add('box', 'stone', side * 6.0, .25, z - 4, 1.3, .45, 1.1, 0, i * .4);
                add('box', 'metal', side * 6.0, .5, z - 4, .9, .13, .85, 0, i * .4);
                add('cone', 'orange', side * 3.9, .28, z - 2.4, .16, .5, .16);
            } else if (theme === 'cave') {
                add('rock', 'rock', side * 8.8, 2.8, z, 2.5, 4.1, 5.2, .12, i * .7, side * .12);
                add('rock', 'rock', side * 5.2, .7, z - 4, 1.15, 1.3, 2.5, .2, i);
                add('cylinder', 'stem', x, .55, z - 1.6, .13, 1.1, .13, 0, 0, side * .2);
                add('cone', 'cyan', x, 1.17, z - 1.6, .65, .3, .65);
                add('orb', 'organic', side * 5.3, 1.2, z + 3, .95, 1.4, 1.0);
                add('orb', 'purple', side * 4.8, 1.6, z + 3.6, .32, .38, .23);
                add('rock', 'rock', side * 7.8, 7.5, z, 4, 1.7, 10, 0, i * .3);
                if (side === 1) add('arch', 'rock', 0, 2.4, z, 6.3, 4.3, 1.1);
            } else if (theme === 'mechanical') {
                add('cylinder', 'metal', side * 7.0, 3.1, z, 1.45, 6.2, 1.45);
                add('ring', 'armor', side * 7.0, 4.7, z, 1.48, 1.48, .7, Math.PI / 2);
                add('box', 'armor', side * 5.3, 2.7, z - 3.8, .6, 5.4, .7);
                add('box', 'metal', side * 6.3, .5, z + 3, 2.2, .9, 2.4);
                add('ring', 'metal', side * 6.2, 1.4, z - 6.2, 1.25, 1.25, .75, 0, Math.PI / 2);
                for (var tooth = 0; tooth < 10; tooth++) {
                    var a = tooth * Math.PI / 5;
                    add('box', 'armor', side * 6.2, 1.4 + Math.cos(a) * 1.23, z - 6.2 + Math.sin(a) * 1.23, .5, .35, .35, a, 0, 0);
                }
            } else if (theme === 'fortress') {
                add('box', 'fortress', side * 6.0, 2.25, z, 2.2, 4.5, 21.2);
                for (var crenel = 0; crenel < 7; crenel++) add('box', 'fortress', side * 6.0, 4.85, z - 8.4 + crenel * 2.8, 2.2, .8, 1.3);
                add('cylinder', 'stone', side * 7.0, 3.4, z + 6.0, 2, 6.8, 2);
                add('ring', 'armor', side * 7.0, 6.4, z + 6.0, 2.05, 2.05, .7, Math.PI / 2);
                add('cylinder', 'metal', side * 4.6, 2.5, z - 2, .06, 4.9, .06);
                add('box', i % 4 ? 'blue' : 'red', side * 4.5, 3.4, z - 2, .045, 1.8, .85);
            } else {
                add('orb', 'organic', side * 6.0, 2, z, 2.4, 2.6, 3.0, 0, i * .5);
                add('ring', 'organic', side * 5.2, 2.0, z + .8, 1.6, 2.0, .9, 0, side * .7);
                add('orb', 'cyan', side * 4.9, 2.15, z + 1.35, .6, .8, .36);
                add('cone', 'rock', side * 4.6, 1.1, z - 4.5, .5, 2.2, .6, 0, 0, side * -.3);
                add('cone', 'purple', side * 7.0, 4.2, z - 3, .8, 4.1, .8, 0, 0, side * -.16);
                add('cylinder', 'organic', side * 5.2, .3, z - 3, .26, 4.1, .26, Math.PI / 2, 0, side * .25);
                add('box', 'metal', side * 8.0, 3.2, z - 6.7, 1.5, 6.4, 1.5, 0, 0, side * .12);
                add('box', 'cyan', side * 7.7, 3.5, z - 6.7, .08, 3.5, .55);
            }
        }
        for (var key in group.userData.buckets) {
            var b = group.userData.buckets[key];
            var mesh = new THREE.InstancedMesh(this.geometries[b.shape], this.materials[b.material], b.records.length);
            mesh.name = 'v121-' + theme + '-' + key;
            mesh.userData = { artSource: group.userData.artSource, collidable: false };
            mesh.frustumCulled = false;
            mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
            mesh.receiveShadow = true;
            for (var ri = 0; ri < b.records.length; ri++) this._setMatrix(mesh, ri, b.records[ri]);
            group.add(mesh);
            group.userData.entries.push({ mesh, records: b.records });
        }
        this.world.scene.add(group);
        this.groups[theme] = group;
        return group;
    }

    _setMatrix(mesh, i, r) {
        var o = this._matrix;
        o.position.set(r.x, r.y, r.z); o.scale.set(r.sx, r.sy, r.sz);
        o.rotation.set(r.rx, r.ry, r.rz); o.updateMatrix();
        mesh.setMatrixAt(i, o.matrix);
    }

    setTheme(name) {
        var theme = ['cave', 'mechanical', 'fortress', 'apocalypse'].indexOf(name) >= 0 ? name : 'default';
        for (var key in this.groups) this.groups[key].visible = false;
        this.active = this.groups[theme] || this._build(theme);
        this.active.visible = true; this.theme = theme; this._lastZ = Infinity;
        var w = this.world;
        if (w._v42Environment) {
            w._v42Environment.root.visible = theme === 'default';
        }
        var palettes = {
            default: [0xbfd9e6, 0xfff0d3, 0xffffff], cave: [0x252239, 0x9eb8ed, 0x88729c],
            mechanical: [0x7d8f9d, 0xffcf98, 0xb3a08a], fortress: [0xaeb6be, 0xffe0ad, 0xc0b49f],
            apocalypse: [0x4c3557, 0xc1bded, 0x90749d]
        };
        var palette = palettes[theme];
        if (theme !== 'default') {
        w.scene.fog.color.setHex(palette[0]); w.scene.fog.near = theme === 'cave' ? 22 : 38; w.scene.fog.far = theme === 'cave' ? 80 : 110;
        w.scene.background = new THREE.Color(palette[0]);
        w.sunLight.color.setHex(palette[1]); w.sunLight.intensity = theme === 'cave' ? .65 : .78;
        if (w._skyDome) w._skyDome.material.color.setHex(palette[2]);
        }
        if (w._skyDome) w._skyDome.visible = theme !== 'cave';
        for (var side of this._roadSides) side.material.color.copy(side.color).multiply(new THREE.Color(palette[2]));
        this._applyRoad(theme);
        this.update(w._v42Environment && isFinite(w._v42Environment.lastSquadZ) ? w._v42Environment.lastSquadZ : 0);
    }

    _applyRoad(theme) {
        if (!this._road || !this.tiles.length) return;
        if (!this._roadMaps) this._roadMaps = {};
        if (!this._roadMaps[theme]) {
            var tile = { default: 0, cave: 3, mechanical: 2, fortress: 7, apocalypse: 4 }[theme];
            var canvas = document.createElement('canvas'); canvas.width = 256; canvas.height = 512;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(this.tiles[tile].image, 0, 0, 256, 512);
            // Lane markings are decorative and preserve the existing road width.
            ctx.fillStyle = theme === 'mechanical' ? '#d7c79b' : '#dce1df';
            for (var x of [85, 171]) for (var y = 4; y < 512; y += 112) ctx.fillRect(x - 1.5, y, 3, 54);
            ctx.fillStyle = theme === 'cave' ? '#797b93' : '#b8aa78';
            ctx.fillRect(3, 0, 2, 512); ctx.fillRect(251, 0, 2, 512);
            var map = new THREE.CanvasTexture(canvas); map.wrapS = map.wrapT = THREE.RepeatWrapping; map.anisotropy = 2;
            this._roadMaps[theme] = map;
        }
        this._road.map = this._roadMaps[theme]; this._road.needsUpdate = true;
    }

    update(squadZ) {
        if (!this.active || Math.abs(squadZ - this._lastZ) < .2) return;
        this._lastZ = squadZ;
        // Large props behind the squad can enter the camera's near field and
        // obscure the lane. Recycle them before they reach that camera corridor.
        var front = squadZ + 3, back = front - 168;
        for (var entry of this.active.userData.entries) {
            var changed = false;
            for (var i = 0; i < entry.records.length; i++) {
                var r = entry.records[i], old = r.z;
                if (r.z > front) r.z -= 168 * Math.ceil((r.z - front) / 168);
                else if (r.z < back) r.z += 168 * Math.ceil((back - r.z) / 168);
                if (r.z !== old) { this._setMatrix(entry.mesh, i, r); changed = true; }
            }
            if (changed) entry.mesh.instanceMatrix.needsUpdate = true;
        }
    }
};


/* ===== [[ js/effects.js ]] ===== */
// ===== 特效系统: 粒子/浮动数字/冲击波/枪口闪光 =====

class Effects {
    constructor(scene) {
        this.scene = scene;
        this.particles = [];
        this.floatTexts = [];
        this.shockwaves = [];
        this.flashes = [];

        // 粒子池 (共享几何体, 独立材质)
        this.pool = [];
        const geo = new THREE.SphereGeometry(0.06, 6, 4);
        this.particleMesh=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({color:0xffffff}),CONFIG.PARTICLE_MAX);
        this.particleMesh.count=0;this.particleMesh.frustumCulled=false;
        this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.particleMesh.userData.artSource='V42 instanced pooled sparks';scene.add(this.particleMesh);
        this._particleColor=new THREE.Color();
        this._flashPool=[];
        this._ringPool=[];
        for (let i = 0; i < CONFIG.PARTICLE_MAX; i++) {
            const m = new THREE.Object3D();
            m.material={color:new THREE.Color(),opacity:1};
            m.visible = false;
            m.userData.artSource = 'js/effects.js 程序化粒子池(共享SphereGeometry)';
            this.pool.push(m);
        }

        // 浮动文字纹理缓存
        this._textCache = {};
        this._floatTextCount = 0;
        this.impacts = [];
        this._impactPool = Array.from({ length: 48 }, function() { return new THREE.Object3D(); });
        var canvas = document.createElement('canvas');
        canvas.width = canvas.height = 128;
        var ink = canvas.getContext('2d');
        ink.translate(64, 64);
        ink.fillStyle = '#FFFFFF';
        ink.beginPath();
        for (var ray = 0; ray < 16; ray++) {
            var angle = ray * Math.PI / 8;
            var radius = ray % 2 ? 12 : (ray % 4 ? 43 : 62);
            ink.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ink.closePath();
        ink.fill();
        var impactTex = new THREE.CanvasTexture(canvas);
        this.impactMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: impactTex, transparent: true, depthWrite: false, alphaTest: .05 }), 48);
        this.impactMesh.count = 0;
        this.impactMesh.frustumCulled = false;
        this.impactMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.impactMesh.userData.artSource = 'pooled-impact-starbursts';
        scene.add(this.impactMesh);

        // V12视觉: 尸液/碎屑地面痕迹(pooled decals, 16上限) — 击杀反馈落地
        this._splatPool = Array.from({ length: 16 }, function() { return new THREE.Object3D(); });
        var splatCanvas = document.createElement('canvas');
        splatCanvas.width = splatCanvas.height = 128;
        var sc2 = splatCanvas.getContext('2d');
        sc2.translate(64, 64);
        var gooGrad = sc2.createRadialGradient(0, 0, 4, 0, 0, 56);
        gooGrad.addColorStop(0, 'rgba(46,74,40,0.92)');
        gooGrad.addColorStop(0.55, 'rgba(52,84,44,0.75)');
        gooGrad.addColorStop(0.85, 'rgba(60,96,48,0.28)');
        gooGrad.addColorStop(1, 'rgba(60,96,48,0)');
        sc2.fillStyle = gooGrad;
        sc2.beginPath();
        for (var sa = 0; sa < 26; sa++) {
            var ang = sa / 26 * Math.PI * 2;
            var wob = 40 + Math.sin(sa * 2.7) * 10 + Math.cos(sa * 5.1) * 6;
            sc2.lineTo(Math.cos(ang) * wob, Math.sin(ang) * wob);
        }
        sc2.closePath();
        sc2.fill();
        // 三滴飞溅卫星点
        for (var drop = 0; drop < 3; drop++) {
            var da = drop * 2.2 + 0.6;
            var dr = 46 + drop * 6;
            sc2.fillStyle = 'rgba(52,84,44,0.5)';
            sc2.beginPath();
            sc2.arc(Math.cos(da) * dr, Math.sin(da) * dr, 5 - drop, 0, Math.PI * 2);
            sc2.fill();
        }
        var splatTex = new THREE.CanvasTexture(splatCanvas);
        this.splatMesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
            new THREE.MeshBasicMaterial({ map: splatTex, transparent: true, depthWrite: false }), 16);
        this.splatMesh.count = 0;
        this.splatMesh.frustumCulled = false;
        this.splatMesh.renderOrder = 1;
        this.splatMesh.userData.artSource = 'js/effects.js 程序化尸液decal(128px CanvasTexture)';
        scene.add(this.splatMesh);
        this.splats = [];
        this._splatQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));

        // V16: 碎片粒子(四面体, 旋转+重力) — 死亡/爆炸的形状层次, 与球形火花区分
        this.shards = [];
        this._shardPool = Array.from({ length: 48 }, () => new THREE.Object3D());
        this._shardGeo = new THREE.TetrahedronGeometry(0.085, 0);
        this.shardMesh = new THREE.InstancedMesh(this._shardGeo,
            new THREE.MeshBasicMaterial({ color: 0xffffff }), 48);
        this.shardMesh.count = 0; this.shardMesh.frustumCulled = false;
        this.shardMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this.shardMesh.userData.artSource = 'V16 pooled tetra shards (spinning body fragments)';
        scene.add(this.shardMesh);
        this._shardQuat = new THREE.Quaternion();
        this._shardEuler = new THREE.Euler();

        // V12视觉: 爆炸白闪(径向亮核, 8上限) — 自爆/Boss死亡/爆炸弹的瞬间亮度冲击
        this._boomPool = [];
        this.booms = [];
        if (!this._boomTex) {
            var bc = document.createElement('canvas');
            bc.width = bc.height = 128;
            var bctx = bc.getContext('2d');
            var bg = bctx.createRadialGradient(64, 64, 4, 64, 64, 62);
            bg.addColorStop(0, 'rgba(255,255,255,1)');
            bg.addColorStop(0.28, 'rgba(255,236,160,0.92)');
            bg.addColorStop(0.62, 'rgba(255,176,64,0.42)');
            bg.addColorStop(1, 'rgba(255,120,20,0)');
            bctx.fillStyle = bg;
            bctx.fillRect(0, 0, 128, 128);
            this._boomTex = new THREE.CanvasTexture(bc);
        }
        // Runtime PNGs are optional overlays on the existing procedural fallbacks.
        // One static loader/cache is shared across Effects instances; failed loads
        // leave the canvas textures and trigger logic untouched.
        var self = this;
        var texturePaths = {
            muzzle: 'art/effects/muzzle.png', hit: 'art/effects/hit.png',
            explosion: 'art/effects/explosion.png', boss_explosion: 'art/effects/boss_explosion.png',
            coins: 'art/effects/coins.png', upgrade: 'art/effects/upgrade.png',
            boss_entry: 'art/effects/boss_entry.png', trail: 'art/effects/trail.png'
        };
        Effects._combatTextures = Effects._combatTextures || {};
        Effects._textureLoader = Effects._textureLoader || new THREE.TextureLoader();
        this._combatTextures = Effects._combatTextures;
        Object.keys(texturePaths).forEach(function(key) {
            var cached = Effects._combatTextures[key];
            if (cached) {
                if (cached.ready) self._applyCombatTexture(key, cached.texture);
                else cached.waiters.push(function(tex) { self._applyCombatTexture(key, tex); });
                return;
            }
            var entry = Effects._combatTextures[key] = {ready:false, failed:false, texture:null, waiters:[]};
            entry.waiters.push(function(tex) { self._applyCombatTexture(key, tex); });
            entry.texture = Effects._textureLoader.load(texturePaths[key], function(tex) {
                tex.encoding = THREE.sRGBEncoding;
                entry.ready = true;
                for (var i = 0; i < entry.waiters.length; i++) entry.waiters[i](tex);
                entry.waiters.length = 0;
            }, undefined, function() {
                entry.failed = true;
                entry.waiters.length = 0;
            });
        });
    }

    _applyCombatTexture(key, texture) {
        if (key === 'hit' && this.impactMesh) {
            this.impactMesh.material.map = texture;
            this.impactMesh.material.needsUpdate = true;
        }
        if (key === 'muzzle') this._muzzleArtTex = texture;
    }

    _readyCombatTexture(key) {
        var entry = this._combatTextures && this._combatTextures[key];
        return entry && entry.ready ? entry.texture : null;
    }

    /** V12视觉: 地面尸液痕迹 (dieT期间淡出, 大体型更大) */
    splat(x, z, size) {
        var p = this._splatPool.pop();
        if (!p) return;
        p.position.set(x, 0.02 + Math.random() * 0.01, z);
        p.userData = { life: 2.2, maxLife: 2.2, size: (size || 1) * randRange(0.75, 1.05), roll: Math.random() * Math.PI * 2 };
        this.splats.push(p);
    }

    /** V12视觉: 爆炸白闪 (0.14s 亮核弹出) */
    flash(x, y, z, color, size, textureKey) {
        if (this.booms.length >= 8) return;
        var s = this._boomPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({ map: this._boomTex, transparent: true, depthWrite: false }));
        var artTexture = textureKey && this._readyCombatTexture(textureKey);
        s.material.map = artTexture || this._boomTex;
        s.material.needsUpdate = true;
        s.position.set(x, y, z);
        s.visible = true;
        s.material.opacity = 1;
        if (color) s.material.color.setHex(color); else s.material.color.setHex(0xFFFFFF);
        s.scale.setScalar((size || 1.6) * 0.55);
        this.scene.add(s);
        this.booms.push({ mesh: s, life: 0.14, maxLife: 0.14, size: size || 1.6 });
    }

    reinforcement(squad, source, added) {
        if (added <= 0) return;
        if (!(this._recruitNoticeT > 0)) this._recruitTotals = {};
        this._recruitTotals[source] = (this._recruitTotals[source] || 0) + added;
        this._recruitNoticeT = 2.8;
        var el = document.getElementById('reinforcement-notice');
        if (el) {
            el.textContent = Object.keys(this._recruitTotals).map(key => key + ' +' + this._recruitTotals[key] + '人').join(' · ');
            el.hidden = false;
        }
        // Kill-based healing can fire dozens of times a second: aggregate the
        // notice, and bound the expensive world effects to one pulse per 0.4s.
        if (!(this._recruitFxT > 0)) {
            this._recruitFxT = 0.4;
            // V16: 补员成长音效('grow' 音色既有但从未被调用)
            if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('grow');
            this.floatText(squad.x, 2.2, squad.z, source + ' +' + added + '人', '#75FFB5', true);
            this.shockwave(squad.x, 0.06, squad.z, 0x39D98A);
            this.burst(squad.x, 0.6, squad.z, 0x75FFB5, 10, 2.2, 0.6);
        }
    }

    impact(x, y, z, critical, lethal) {
        var p = this._impactPool.pop();
        if (!p) return;
        p.position.set(x, y, z + .16);
        p.userData = { life: .18, maxLife: .18, size: lethal ? 1.15 : critical ? .92 : .58,
            color: lethal ? 0xFFE066 : (critical ? 0xFF8C38 : 0x7DD3FC), angle: Math.random() * Math.PI };
        this.impacts.push(p);
        if (lethal && this.flash) {
            this.flash(x, y + 0.1, z + 0.1, 0xFFD166, 1.15);
        }
    }

    /** V14: 分级爆炸组合器 — 闪光+冲击波+火花+烟尘按档位组合(tier 1小/2普/3大/4Boss)
     *  全部复用既有池(flash/shockwave/burst), 不新增材质/几何; 供自爆/Boss死亡/全屏爆炸接入 */
    explosion(x, y, z, tier) {
        var cfg = [
            { flash: 1.0, ring: 0, sparks: 10, speed: 3.0, smoke: 0 },
            { flash: 1.7, ring: 1, sparks: 16, speed: 4.2, smoke: 4 },
            { flash: 2.4, ring: 1, sparks: 24, speed: 5.5, smoke: 7 },
            { flash: 3.4, ring: 2, sparks: 34, speed: 7.0, smoke: 12 }
        ][Math.max(0, Math.min(3, (tier | 0) - 1))];
        if (!cfg) return;
        this.flash(x, y, z, 0xFFC26B, cfg.flash, tier >= 4 ? 'boss_explosion' : 'explosion');
        for (var r = 0; r < cfg.ring; r++) this.shockwave(x, Math.max(0.06, y - r * 0.12), z, r ? 0xFFB055 : 0xFFE1A0);
        // 火花: 橙芯+白热双层
        this.burst(x, y, z, 0xFFA03C, Math.ceil(cfg.sparks * 0.7), cfg.speed, 0.5);
        this.burst(x, y, z, 0xFFF3C0, Math.ceil(cfg.sparks * 0.3), cfg.speed * 0.7, 0.35);
        // 烟尘: 深灰慢速上飘(vy低+重力自然衰减), 落点略有散布
        for (var s = 0; s < cfg.smoke; s++) {
            var p = this.pool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x + randRange(-0.4, 0.4), y + randRange(0, 0.5), z + randRange(-0.4, 0.4));
            p.material.color.setHex(0x3A3F46);
            p.material.opacity = 0.75;
            var ss = randRange(1.6, 2.6);
            p.scale.setScalar(ss);
            p.userData = {
                vx: randRange(-1, 1) * 0.9, vy: randRange(0.9, 1.8), vz: randRange(-1, 1) * 0.9,
                life: randRange(0.55, 0.85), maxLife: 0.8, s0: ss, smoke: true
            };
            this.particles.push(p);
        }
    }

    /** V16: 旋转碎片(死亡肢体残片/爆炸碎片) — 与球形火花形成形状层次 */
    spawnShards(x, y, z, color, count, speed, life) {
        count = count || 6;
        speed = speed || 3.4;
        life = life || 0.7;
        for (let i = 0; i < count; i++) {
            const p = this._shardPool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x + randRange(-0.15, 0.15), y, z + randRange(-0.15, 0.15));
            p.rotation.set(Math.random() * Math.PI * 2, Math.random() * Math.PI * 2, 0);
            const s = randRange(0.7, 1.5);
            p.scale.setScalar(s);
            p.userData = {
                vx: randRange(-1, 1) * speed, vy: randRange(0.9, 2.4) * speed, vz: randRange(-1, 1) * speed,
                rx: randRange(-9, 9), rz: randRange(-9, 9),
                life: life * randRange(0.7, 1.15), maxLife: life, s0: s, color: color
            };
            this.shards.push(p);
        }
    }

    /** 生成粒子爆发 */
    burst(x, y, z, color, count, speed, life) {
        count = count || 8;
        speed = speed || 3;
        life = life || 0.5;
        for (let i = 0; i < count; i++) {
            const p = this.pool.pop();
            if (!p) break;
            p.visible = true;
            p.position.set(x, y, z);
            p.material.color.setHex(color);
            p.material.opacity = 1;
            const s = randRange(0.5, 1.3);
            p.scale.setScalar(s);
            p.userData = {
                vx: randRange(-1, 1) * speed,
                vy: randRange(0.8, 2.2) * speed,
                vz: randRange(-1, 1) * speed,
                life: life * randRange(0.7, 1.2),
                maxLife: life,
                s0: s
            };
            this.particles.push(p);
        }
    }

    /** 生成浮动文字(伤害/暴击) */
    floatText(x, y, z, text, color, big) {
        const damageNumber=/^\d+$/.test(String(text));
        // 限制同时显示数量
        if (this._floatTextCount > 20) return;
        this._floatTextCount++;

        const key = text + '_' + color + (big ? '_b' : '');
        let tex = this._textCache[key];
        if (!tex) {
            var keys=Object.keys(this._textCache);
            if(keys.length>=128) {
                var free=keys.find(k=>!this.floatTexts.some(ft=>ft.sprite.material.map===this._textCache[k]));
                if(free){this._textCache[free].dispose();delete this._textCache[free];}
            }
            tex = createTextTexture(text, damageNumber ? {
                // V12/V16.3 视觉: 纯数字伤害 — 高清白芯+彩色圆角描边
                fontSize: big ? 128 : 96,
                height: 160,
                fill: '#FFFFFF',
                stroke: color,
                strokeWidth: big ? 16 : 12
            } : {
                // V16.3: 技能/状态飘字高清渲染(200px高+厚描边, 杜绝模糊锯齿)
                fontSize: big ? 120 : 88,
                height: 200,
                fill: color,
                stroke: '#0E1726',
                strokeWidth: big ? 16 : 12
            });
            this._textCache[key] = tex;
        }

        // V10.1: Sprite/Material 池化 — 原实现每条飘字 new Sprite+Material(高频战斗GC尖峰)
        var sprite = this._floatPool && this._floatPool.pop();
        if (!sprite) {
            sprite = new THREE.Sprite(new THREE.SpriteMaterial({ transparent: true, depthTest: false }));
            if (!this._floatPool) this._floatPool = [];
        }
        sprite.material.map = tex;
        sprite.material.needsUpdate = true;
        // V3.2: 分散出生点, 避免连续暴击文字完全重叠
        sprite.position.set(
            x + randRange(-0.5, 0.5),
            (damageNumber ? y * .55 : y) + randRange(0, damageNumber ? .08 : .35),
            z + randRange(-0.4, 0.4)
        );
        // V16.3: 按纹理真实宽高比缩放, 彻底消除中文技能名横向压扁变形
        var texAsp = (tex && tex.image && tex.image.height) ? (tex.image.width / tex.image.height) : 2;
        var hSc = big ? (damageNumber ? 0.42 : 0.62) : 0.34;
        sprite.scale.set(hSc * texAsp, hSc, 1);
        sprite.renderOrder = 999;
        this.scene.add(sprite);
        this.floatTexts.push({
            sprite: sprite, life: 0.7, maxLife: 0.7,
            vy: damageNumber ? (big ? 1.35 : 1.1) : (big ? 3.2 : 2.5), vx: randRange(-0.5, 0.5)
        });
    }

    /** 生成穿门冲击波(扩散圆环) */
    shockwave(x, y, z, color) {
        const ring = this._ringPool.pop() || new THREE.Mesh(
            new THREE.RingGeometry(0.3, 0.45, 24),
            new THREE.MeshBasicMaterial({
                color: color || 0x6EE7B7,
                transparent: true, opacity: 0.8,
                side: THREE.DoubleSide
            })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.visible=true;ring.scale.setScalar(1);ring.material.color.setHex(color || 0x6ee7b7);ring.material.opacity=.8;
        ring.position.set(x, y, z);
        this.scene.add(ring);
        this.shockwaves.push({ mesh: ring, life: 0.5, maxLife: 0.5 });
    }

    /** V15-ART-005 商业级枪口火焰 (8角炽白金橙星芒爆发) */
    muzzleFlash(x, y, z, sizeMul) {
        if (!this._muzzleTex) {
            var c = document.createElement('canvas');
            c.width = 128; c.height = 128;
            var ctx = c.getContext('2d');
            var cx = 64, cy = 64;
            // 外层暖橙火焰光晕
            var glow = ctx.createRadialGradient(cx, cy, 4, cx, cy, 60);
            glow.addColorStop(0.0, 'rgba(255,255,230,1)');
            glow.addColorStop(0.32, 'rgba(255,205,65,0.92)');
            glow.addColorStop(0.68, 'rgba(255,120,20,0.45)');
            glow.addColorStop(1.0, 'rgba(255,80,0,0)');
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, 128, 128);
            // 8 尖角火焰星芒
            ctx.fillStyle = '#FFF6C8';
            ctx.beginPath();
            for (var r = 0; r < 16; r++) {
                var a = r * Math.PI / 8;
                var rad = (r % 2 === 0) ? (r % 4 === 0 ? 60 : 42) : 14;
                var px = cx + Math.cos(a) * rad, py = cy + Math.sin(a) * rad;
                if (r === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.fill();
            // 中心炽白亮核
            var core = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
            core.addColorStop(0, '#FFFFFF');
            core.addColorStop(0.6, '#FFF3B0');
            core.addColorStop(1, 'rgba(255,200,60,0)');
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2); ctx.fill();
            this._muzzleTex = new THREE.CanvasTexture(c);
        }
        if (this.flashes.length >= 36) return;
        var flash = this._flashPool.pop() || new THREE.Sprite(new THREE.SpriteMaterial({
            map: this._muzzleTex,
            transparent: true,
            opacity: 0.98,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        }));
        flash.material.map = this._muzzleTex;
        flash.material.needsUpdate = true;
        flash.position.set(x, y, z);
        flash.visible = true; flash.material.opacity = 0.98;
        flash.material.rotation = Math.random() * Math.PI;
        var mfScale = randRange(0.56, 0.74) * (sizeMul || 1);
        flash.scale.set(mfScale, mfScale, 1);
        flash.userData.baseScale = mfScale;
        this.scene.add(flash);
        this.flashes.push({ mesh: flash, life: 0.11, maxLife: 0.11 });
    }

    clear() {
        this._recruitTotals = {};
        this._recruitNoticeT = 0;
        this._recruitFxT = 0;
        var notice = document.getElementById('reinforcement-notice');
        if (notice) { notice.hidden = true; notice.textContent = ''; }
        for (var impact of this.impacts) this._impactPool.push(impact);
        this.impacts.length = 0;
        this.impactMesh.count = 0;
        for(var p of this.particles){p.visible=false;this.pool.push(p);}this.particles.length=0;
        for(var f of this.flashes){this.scene.remove(f.mesh);f.mesh.visible=false;this._flashPool.push(f.mesh);}this.flashes.length=0;
        for(var r of this.shockwaves){this.scene.remove(r.mesh);r.mesh.visible=false;this._ringPool.push(r.mesh);}this.shockwaves.length=0;
        // V10.1: clear 回收入池
        for(var ft of this.floatTexts){this.scene.remove(ft.sprite);if(this._floatPool.length<24)this._floatPool.push(ft.sprite);else ft.sprite.material.dispose();}
        this.floatTexts.length=0;this._floatTextCount=0;
        this.particleMesh.count=0;
        // V12视觉: decals/爆闪回收
        for(var sp of this.splats) this._splatPool.push(sp);
        this.splats.length = 0;
        this.splatMesh.count = 0;
        // V16: 碎片回收
        for(var sh of this.shards) this._shardPool.push(sh);
        this.shards.length = 0;
        this.shardMesh.count = 0;
        for(var bm of this.booms){this.scene.remove(bm.mesh);bm.mesh.visible=false;this._boomPool.push(bm.mesh);}
        this.booms.length = 0;
    }

    update(dt) {
        this._recruitFxT = Math.max(0, (this._recruitFxT || 0) - dt);
        if (this._recruitNoticeT > 0) {
            this._recruitNoticeT = Math.max(0, this._recruitNoticeT - dt);
            if (!this._recruitNoticeT) {
                var notice = document.getElementById('reinforcement-notice');
                if (notice) notice.hidden = true;
                this._recruitTotals = {};
            }
        }
        var camera = this.scene.userData.camera;
        for (var ii = this.impacts.length - 1; ii >= 0; ii--) {
            var impact = this.impacts[ii], data = impact.userData;
            data.life -= dt;
            if (data.life <= 0) {
                this._impactPool.push(impact);
                this.impacts.splice(ii, 1);
                continue;
            }
            var progress = 1 - data.life / data.maxLife;
            if (camera) impact.quaternion.copy(camera.quaternion);
            impact.rotateZ(data.angle);
            impact.scale.setScalar(data.size * (.6 + progress * 1.25));
            impact.updateMatrix();
            this.impactMesh.setMatrixAt(ii, impact.matrix);
            this._particleColor.setHex(data.color).multiplyScalar(1 - progress * .55);
            this.impactMesh.setColorAt(ii, this._particleColor);
        }
        // Repack after expiry; splice must not leave a stale instance in a hole.
        this.impactMesh.count = this.impacts.length;
        for (var packed = 0; packed < this.impacts.length; packed++) {
            var item = this.impacts[packed];
            this.impactMesh.setMatrixAt(packed, item.matrix);
            this._particleColor.setHex(item.userData.color).multiplyScalar(.45 + .55 * item.userData.life / item.userData.maxLife);
            this.impactMesh.setColorAt(packed, this._particleColor);
        }
        this.impactMesh.instanceMatrix.needsUpdate = true;
        if (this.impactMesh.instanceColor) this.impactMesh.instanceColor.needsUpdate = true;
        // 粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            const u = p.userData;
            u.life -= dt;
            if (u.life <= 0) {
                p.visible = false;
                this.pool.push(p);
                this.particles.splice(i, 1);
                continue;
            }
            // V14: 烟尘粒子 buoyancy(缓升缓散), 与火花(重力弹跳)区分
            u.vy -= (u.smoke ? -0.5 : 7) * dt;
            if (u.smoke) u.vx *= (1 - 0.8 * dt);
            p.position.x += u.vx * dt;
            p.position.y += u.vy * dt;
            p.position.z += u.vz * dt;
            if (p.position.y < 0.03 && !u.smoke) {
                p.position.y = 0.03;
                u.vy *= -0.25;
                u.vx *= 0.7;
                u.vz *= 0.7;
            }
            const t = u.life / u.maxLife;
            p.material.opacity = t;
            p.scale.setScalar(u.s0 * (0.3 + t * 0.7));
        }

        // 浮动文字
        for (let i = this.floatTexts.length - 1; i >= 0; i--) {
            const ft = this.floatTexts[i];
            ft.life -= dt;
            if (ft.life <= 0) {
                // V10.1: 回收入池(材质复用, 仅换贴图)
                this.scene.remove(ft.sprite);
                if (this._floatPool.length < 24) this._floatPool.push(ft.sprite);
                else ft.sprite.material.dispose();
                this.floatTexts.splice(i, 1);
                this._floatTextCount--;
                continue;
            }
            ft.sprite.position.y += ft.vy * dt;
            ft.sprite.position.x += ft.vx * dt;
            const t = ft.life / ft.maxLife;
            ft.sprite.material.opacity = Math.min(1, t * 2);
            if (t < 0.5) {
                const s = 0.55 * (0.5 + t);
                ft.sprite.scale.set(s, s * 0.5, 1);
            }
        }

        // 冲击波
        for (let i = this.shockwaves.length - 1; i >= 0; i--) {
            const sw = this.shockwaves[i];
            sw.life -= dt;
            if (sw.life <= 0) {
                this.scene.remove(sw.mesh);
                sw.mesh.visible=false;
                this._ringPool.push(sw.mesh);
                this.shockwaves.splice(i, 1);
                continue;
            }
            const t = 1 - sw.life / sw.maxLife;
            const scale = 1 + easeOutCubic(t) * 5; // V14.3 节奏: 快出慢收(easeOut), 冲击感前置
            sw.mesh.scale.setScalar(scale);
            sw.mesh.material.opacity = 0.8 * (1 - t);
        }

        // 枪口闪光
        for (let i = this.flashes.length - 1; i >= 0; i--) {
            const f = this.flashes[i];
            f.life -= dt;
            if (f.life <= 0) {
                this.scene.remove(f.mesh);
                // Sprite共享内部几何体不可dispose; Mesh需dispose
                f.mesh.visible=false;
                this._flashPool.push(f.mesh);
                this.flashes.splice(i, 1);
                continue;
            }
            const t = f.life / f.maxLife;
            f.mesh.material.opacity = t * 0.95;
            // V14.3 节奏修正: 枪口火焰=瞬时峰值→衰减(旧曲线出生最小→长大, 与闪光语义相反)
            var sc = (f.baseScale || 0.48) * (1.18 - t * 0.42);
            f.mesh.scale.set(sc, sc, 1);
        }

        // V12视觉: 尸液decal(淡出+首帧展开; 复用scratch矩阵/向量, 热循环零分配)
        if (!this._m4) { this._m4 = new THREE.Matrix4(); this._v3 = new THREE.Vector3(); }
        var liveSplats = 0;
        for (var si2 = this.splats.length - 1; si2 >= 0; si2--) {
            var sp = this.splats[si2];
            sp.userData.life -= dt;
            if (sp.userData.life <= 0) {
                this._splatPool.push(sp);
                this.splats.splice(si2, 1);
            }
        }
        for (var pk = 0; pk < this.splats.length; pk++) {
            var pkSp = this.splats[pk];
            var pkGrow = Math.min(1, (1 - pkSp.userData.life / pkSp.userData.maxLife) * 8); // 前0.125s快速展开
            this._v3.set(pkSp.userData.size * pkGrow, pkSp.userData.size * pkGrow, 1);
            this._m4.compose(pkSp.position, this._splatQuat, this._v3);
            this.splatMesh.setMatrixAt(pk, this._m4);
            liveSplats++;
        }
        this.splatMesh.count = liveSplats;
        this.splatMesh.instanceMatrix.needsUpdate = true;

        // V12视觉: 爆炸白闪(0.14s 弹出+淡出)
        for (var bi = this.booms.length - 1; bi >= 0; bi--) {
            var bm = this.booms[bi];
            bm.life -= dt;
            if (bm.life <= 0) {
                this.scene.remove(bm.mesh);
                bm.mesh.visible = false;
                this._boomPool.push(bm.mesh);
                this.booms.splice(bi, 1);
                continue;
            }
            var bt = bm.life / bm.maxLife;
            bm.mesh.material.opacity = bt;
            // V14.3 节奏: 白闪瞬时峰值(出生 1.25×)后收缩淡出
            bm.mesh.scale.setScalar(bm.size * (1.25 - bt * 0.38));
        }

        // V16: 碎片粒子(重力+自旋+落地反弹; 实例色+矩阵前缀上传)
        var liveShards = 0;
        for (var si3 = this.shards.length - 1; si3 >= 0; si3--) {
            var sh = this.shards[si3], su = sh.userData;
            su.life -= dt;
            if (su.life <= 0) { sh.visible = false; this._shardPool.push(sh); this.shards.splice(si3, 1); continue; }
            su.vy -= 9.5 * dt;
            sh.position.x += su.vx * dt; sh.position.y += su.vy * dt; sh.position.z += su.vz * dt;
            if (sh.position.y < 0.05) { sh.position.y = 0.05; su.vy *= -0.32; su.vx *= 0.6; su.vz *= 0.6; su.rx *= 0.5; su.rz *= 0.5; }
            sh.rotation.x += su.rx * dt; sh.rotation.z += su.rz * dt;
            var st = su.life / su.maxLife;
            sh.scale.setScalar(su.s0 * (0.35 + st * 0.65));
            sh.updateMatrix();
        }
        for (var spi = 0; spi < this.shards.length; spi++) {
            this.shardMesh.setMatrixAt(spi, this.shards[spi].matrix);
            this._particleColor.setHex(this.shards[spi].userData.color || 0xffffff);
            this.shardMesh.setColorAt(spi, this._particleColor);
            liveShards++;
        }
        this.shardMesh.count = liveShards;
        this.shardMesh.instanceMatrix.needsUpdate = true;
        if (this.shardMesh.instanceColor) this.shardMesh.instanceColor.needsUpdate = true;

        this.particleMesh.count=this.particles.length;
        for(var pi=0;pi<this.particles.length;pi++) {
            var particle=this.particles[pi];particle.updateMatrix();
            this.particleMesh.setMatrixAt(pi,particle.matrix);
            this._particleColor.copy(particle.material.color).multiplyScalar(.4+.6*particle.material.opacity);
            this.particleMesh.setColorAt(pi,this._particleColor);
        }
        this.particleMesh.instanceMatrix.needsUpdate=true;
        if(this.particleMesh.instanceColor)this.particleMesh.instanceColor.needsUpdate=true;
    }
}


/* ===== [[ js/squad.js ]] ===== */
// ===== 小队系统: 实例化渲染/阵型/膨胀动画 =====

class Squad {
    constructor(scene, profile) {
        this.scene = scene;
        this.profile = profile || null; // V5.1: 永久档案(升级属性)
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.count = 0;
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        // V3.3: 扩展Buff体系
        this.pierce = 0;        // 穿透层数(0-3)
        this.critChance = 0;    // 暴击率(0-0.5)
        this.freezeStacks = 0;  // 冰冻弹(命中减速)
        this.vampStacks = 0;    // 吸血(击杀回复)
        this.alive = true;

        // 士兵数据数组
        this.soldiers = [];

        // V4.1: loaded rigid GLB parts, shared by hero/LOD instance banks.
        this.renderer = new SoldierRenderer(scene);
        this.mesh = this.renderer.mesh;       // compatibility aliases used by tests/debug UI
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes = [this.legMeshL, this.legMeshR];
        this._moving = false;
        this._lean = 0;
        this._tilt = 0;
    }

    /** V10 QA: 小队人数上限 = 基础上限 + 科技"军团上限"加成(原科技 army_limit 定义后从未生效) */
    _maxLimit() {
        var g = this._gameRef;
        var bonus = (g && g._techStats && g._techStats.limitBonus) || 0;
        return CONFIG.SQUAD_MAX_COUNT + bonus;
    }

    /** Automatic recruitment reports actual gains after the squad cap. */
    addReinforcements(amount, source, effects) {
        if (this.count <= 0 || amount <= 0) return 0;
        var before = this.count;
        this.setCount(this.count + amount);
        var added = this.count - before;
        if (added > 0 && effects) effects.reinforcement(this, source, added);
        return added;
    }

    /** V15-GAMEPLAY-001: 临时医疗战术护盾 (全局上限2层, 持续8秒; 满层不无限续期) */
    grantMedicalShield(layers, durationSec, effects) {
        if (this.count <= 0 || !this.alive) return 0;
        var maxLayers = 2;
        var cur = this._medShield || 0;
        if (cur >= maxLayers) return 0; // 满层不叠加、不无限刷新持续时间
        var add = Math.min(maxLayers - cur, Math.max(1, Math.floor(layers || 1)));
        this._medShield = cur + add;
        this._medShieldT = durationSec || 8;
        if (effects) effects.floatText(this.x, 2.2, this.z, '战术护盾 ×' + this._medShield, '#6EE7B7', false);
        return add;
    }

    /**
     * V15-GAMEPLAY-001: 统一治疗入口 (A+B方案)
     * - 有战斗减员(recoverableLoss > 0)时优先恢复损失编制, 绝不溢出变成新增人数
     * - 满编(recoverableLoss === 0)时提供临时战术护盾(军医1层/医疗包2层, 持续8秒)
     * - 队伍归零或非战斗态不允许治疗复活
     */
    healSquad(amount, source, effects) {
        if (this.count <= 0 || !this.alive) return 0;
        var requested = Math.max(0, Math.floor(amount || 0));
        if (requested <= 0) return 0;
        var loss = this.recoverableLoss || 0;
        if (loss > 0) {
            var capRoom = Math.max(0, this._maxLimit() - this.count);
            var restored = Math.min(requested, loss, capRoom);
            if (restored > 0) {
                var actual = this.addReinforcements(restored, '恢复编制', effects);
                this.recoverableLoss = Math.max(0, loss - actual);
                return actual;
            }
            return 0;
        }
        // 满编时转临时护盾(绝不突破编制无脑加人)
        this.grantMedicalShield(source === 'medkit' ? 2 : 1, 8, effects);
        return 0;
    }

    /** 设置小队人数(自动处理增减与弹出动画) */
    setCount(n) {
        n = clamp(Math.floor(n), 0, this._maxLimit());
        const old = this.count;
        this.count = n;

        if (n > old) {
            // 新增士兵: 从中心弹出 (V3.7: 附带固定个体微抖动, 打破网格僵硬感)
            for (let i = old; i < n; i++) {
                this.soldiers.push({
                    fx: 0, fz: 0,
                    x: randRange(-0.15, 0.15),
                    z: randRange(-0.15, 0.15),
                    spawnT: 0,
                    phase: Math.random() * Math.PI * 2,
                    rotY: randRange(-0.09, 0.09),
                    jx: randRange(-0.07, 0.07),
                    jz: randRange(-0.05, 0.05)
                });
            }
        } else if (n < old) {
            this.soldiers.length = n;
        }

        this.alive = n > 0;
        this._updateFormation();
    }

    /** Balanced compact ranks. Adjacent rows differ by at most one soldier. */
    _updateFormation() {
        const n = this.count;
        let preferredCols, sx, sz, scale;
        if (n <= 1)        { preferredCols = 1;  sx = 0.72; sz = 0.72; scale = 1; }
        else if (n <= 12)  { preferredCols = Math.ceil(Math.sqrt(n)); sx = 0.72; sz = 0.76; scale = 0.94; }
        else if (n <= 100) { preferredCols = 7;  sx = 0.66; sz = 0.72; scale = 0.76; }
        else if (n <= 300) { preferredCols = 11; sx = 0.37; sz = 0.50; scale = 0.54; }
        else               { preferredCols = 13; sx = 0.328; sz = 0.46; scale = 0.48; }

        const rows = n > 0 ? Math.ceil(n / preferredCols) : 0;
        const shortRow = rows ? Math.floor(n / rows) : 0;
        let longRows = rows ? n % rows : 0;
        const rowLengths = [];
        // Spread longer rows through the formation rather than leaving one
        // visibly incomplete tail row.
        for (let row = 0; row < rows; row++) {
            const remainingRows = rows - row;
            const makeLong = longRows > 0 && (row % 2 === 0 || longRows === remainingRows);
            rowLengths.push(shortRow + (makeLong ? 1 : 0));
            if (makeLong) longRows--;
        }
        this._formationCols = rowLengths.length ? Math.max.apply(Math, rowLengths) : 1;
        this._formationSpacingX = sx;
        this._formationScale = scale;
        let soldierIndex = 0;
        let maxAbsX = 0;
        let maxZ = 0;
        for (let row = 0; row < rowLengths.length; row++) {
            const rowCount = rowLengths[row];
            for (let col = 0; col < rowCount; col++) {
                const s = this.soldiers[soldierIndex++];
                const staggerAmount = sx * (n <= 100 ? 0.25 : 0.18);
                const stagger = row % 2 ? staggerAmount : -staggerAmount;
                s.fx = (col - (rowCount - 1) / 2) * sx + (n > 1 ? stagger : 0) + s.jx * 0.85;
                s.fz = row * sz + s.jz * 0.85 + Math.abs(col - (rowCount - 1) / 2) * 0.065;
                maxZ=Math.max(maxZ,s.fz);
                maxAbsX = Math.max(maxAbsX, Math.abs(s.fx));
            }
        }
        // Model shoulder envelope is ~0.72 wide at scale 1.
        this._halfWidth = maxAbsX + 0.48 * scale;
        this._formationDepth=maxZ;
    }

    /** 队伍半宽(含单兵半径+交错余量) — 移动边界钳制与门触发窗口共用 */
    getHalfWidth() {
        return this._halfWidth || 0.36;
    }

    getDepth() { return this._formationDepth || 0; }

    /** 僵尸击杀士兵 (V3.3: 复活无敌期间免疫; V15-GAMEPLAY-001: 医疗护盾逐层抵挡1人减员 + 记录可恢复战斗损失) */
    killSoldiers(n, effects, options) {
        if (this.invulnT > 0) return; // 复活无敌
        var rawN = Math.max(0, Math.floor(n || 0));
        if (rawN <= 0) return;
        // V15-GAMEPLAY-001: 临时医疗护盾(每层抵挡1人实际减员, 绝不1层免疫整次Boss高额伤害)
        if (this._medShield > 0 && !(options && options.ignoreShield)) {
            var blocked = Math.min(this._medShield, rawN);
            this._medShield -= blocked;
            if (this._medShield <= 0) this._medShieldT = 0;
            rawN -= blocked;
            if (effects) effects.floatText(this.x, 2.0, this.z, '护盾抵挡 -' + blocked, '#6EE7B7', false);
            if (rawN <= 0) return;
        }
        n = rawN;
        var lethal = n >= this.count;
        // VNext: 伤害减免(科技/职业/装备, 上限60%) — 只作用于非致命伤害, 致命一击保留护盾判定
        // 概率化取整: 期望值精确且保持整数(避免小数人数破坏 setCount)
        if (!lethal && this._totalDr > 0) {
            var reduced = n * (1 - this._totalDr);
            n = Math.floor(reduced) + (Math.random() < reduced % 1 ? 1 : 0);
            if (n <= 0) {
                if (effects) effects.floatText(this.x, 1.8, this.z, '减伤!', '#75DFFF', false);
                return;
            }
        }
        // V6.0: 能量护盾技能 — 挡致命伤害, 冷却恢复
        if (this._skillShieldMax && this._skillShield > 0 && lethal && this._shieldCd <= 0) {
            this._skillShield--;
            this._shieldCd = this._comboUndying ? 3 : 6; // V8.0: 不灭意志组合减冷却
            if (effects) effects.floatText(this.x, 2.2, this.z, '护盾格挡!', '#4DA8FF', true);
            // V8.0: 毒性护盾组合 — 格挡时毒化周围敌人(由combat下一帧读取)
            if (this._comboToxicWard) this._toxicWardPulse = true;
            return;
        }
        const before = this.count;
        var removed = Math.min(before, Math.max(0, Math.floor(n)));
        var removedStart = before - removed;
        if (removed > 0) this.renderer.captureDeaths(removedStart, before, this);
        // V2.2修复: 先保存被杀士兵位置，再截断数组(原代码先截断再读取导致undefined)
        var deathPos = [];
        if (effects && n > 0) {
            var startIdx = removedStart;
            for (let i = startIdx; i < Math.min(before, startIdx + 3); i++) {
                if (this.soldiers[i]) {
                    deathPos.push({ x: this.soldiers[i].x, z: this.soldiers[i].z });
                }
            }
        }
        this.setCount(this.count - n);
        if (removed > 0 && !(options && options.unrecoverable)) {
            this.recoverableLoss = (this.recoverableLoss || 0) + removed;
        }
        if (this.count > 0 && removed > 0) this.renderer.triggerHit();
        // V18.0: 每一次真实减员必有红色 -N 飘字 + 右上角人数红闪 + DamageTrace 追踪记录
        if (removed > 0) {
            if (effects) {
                var hx = (options && options.hitPosition && options.hitPosition.x !== undefined) ? options.hitPosition.x : this.x;
                var hz = (options && options.hitPosition && options.hitPosition.z !== undefined) ? options.hitPosition.z : this.z;
                effects.floatText(hx, 1.55, hz, '-' + removed, '#FF4444', removed >= 2);
            }
            if (typeof document !== 'undefined') {
                var badge = document.getElementById('hud-count');
                if (badge) {
                    badge.style.color = '#FF5555';
                    clearTimeout(this._hudFlashTimer);
                    this._hudFlashTimer = setTimeout(function() { if (badge) badge.style.color = ''; }, 240);
                }
            }
        }
        if (typeof window !== 'undefined') {
            window.__damageTrace = window.__damageTrace || [];
            window.__damageTrace.push({
                sourceType: (options && options.sourceType) || 'unknown',
                damage: n,
                actualLoss: removed,
                before: before,
                after: this.count,
                t: Date.now()
            });
            if (window.__damageTrace.length > 40) window.__damageTrace.shift();
        }
        // 在被杀士兵位置生成蓝色死亡粒子
        if (effects && deathPos.length > 0) {
            for (let i = 0; i < deathPos.length; i++) {
                effects.burst(
                    this.x + deathPos[i].x, 0.5, this.z + deathPos[i].z,
                    0x4A90D9, 5, 2.5, 0.4
                );
            }
        }
    }

    /** V18.0: 统一小队伤害入口 (记录伤害源、坐标与追踪日志, 禁止绕过) */
    applySquadDamage(payload, effects) {
        if (!payload || !payload.damage || payload.damage <= 0) return;
        this.killSoldiers(payload.damage, effects, {
            sourceType: payload.sourceType || 'unknown',
            hitPosition: payload.hitPosition || null,
            unrecoverable: !!payload.unrecoverable
        });
    }

    /** 应用状态门效果 (V3.3: 完整Buff体系) */
    applyGate(gate, effects) {
        var added = 0;
        if (gate.op === 'add') {
            added = gate.value;
            this.setCount(this.count + gate.value);
        } else if (gate.op === 'addpct') {
            // V5.1: 百分比人数门(+20%/+50%), 至少+1
            added = Math.max(1, Math.floor(this.count * gate.value / 100));
            this.setCount(this.count + added);
        } else if (gate.op === 'skill') {
            // V6.0: 肉鸽技能门 — 技能升层, 立即生效
            if (typeof Skills !== 'undefined') Skills.apply(this, gate.value);
            added = 0;
        } else if (gate.op === 'nuke') {
            // V5.1: 史诗门 全屏爆炸 — 由 Game 在下帧对所有场上怪结算(this.nukePending)
            this.nukePending = true;
        } else if (gate.op === 'mul') {
            added = this.count * (gate.value - 1);
            this.setCount(this.count * gate.value);
        } else if (gate.op === 'coin') {
            // V11.1: 金币奖励门 — 真实入账
            if (this.profile) this.profile.addCoins(gate.value);
            if (effects) effects.floatText(this.x, 2.0, this.z, '+' + gate.value + ' 金币', '#FFC247', true);
            added = 0;
        } else if (gate.op === 'risk') {
            // V3.3: 风险门 — 红色, 人数-30%换输出+2
            var lost = Math.floor(this.count * 0.3);
            this.setCount(Math.max(1, this.count - lost));
            this.damageBuff = Math.min(99, this.damageBuff + 2);
            added = -lost;
        } else if (gate.op === 'buff') {
            switch (gate.value) {
                case 'damage':  this.damageBuff = Math.min(99, this.damageBuff + 1); break;
                case 'damage2': this.damageBuff = Math.min(99, this.damageBuff + 2); break; // V5.1: 固定+2(旧×2易数值失控)
                case 'firerate10': this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.1); break; // V5.1: +10%档
                case 'firerate': this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.2); break;
                case 'pierce':  this.pierce = Math.min(3, this.pierce + 1); break;
                case 'crit':    this.critChance = Math.min(0.5, this.critChance + 0.05); break; // V5.1: +5%档
                case 'crit2':   this.critChance = Math.min(0.5, this.critChance + 0.1); break;
                case 'freeze':  this.freezeStacks = Math.min(2, this.freezeStacks + 1); break;
                case 'vamp':    this.vampStacks = Math.min(2, this.vampStacks + 1); break;
                case 'explosive': this.explosive = Math.min(2, (this.explosive || 0) + 1); break; // V5.1: 命中溅射
                case 'chain':   this.chain = Math.min(2, (this.chain || 0) + 1); break;           // V5.1: 连锁闪电
                case 'arsenal': // V5.1 史诗: 本局军备强化包
                    this.damageBuff = Math.min(99, this.damageBuff + 2);
                    this.fireRateBuff = Math.min(0.5, this.fireRateBuff + 0.2);
                    this.critChance = Math.min(0.5, this.critChance + 0.1);
                    break;
            }
        }
        // V5.0: 穿门音效(人数增长用grow, 其余用gate)
        if (typeof Platform !== 'undefined' && Platform.audio) {
            Platform.audio.play(added > 0 ? 'grow' : 'gate');
        }
        // 穿门反馈: 冲击波 + 膨胀文字 + 粒子
        if (effects) {
            var isMul = gate.op === 'mul';
            var isRisk = gate.op === 'risk';
            var isBuff = gate.op === 'buff';
            // 冲击波(乘法门更大/风险门红色)
            effects.shockwave(this.x, 0.05, this.z, isRisk ? 0xFF5B58 : (isMul ? 0xFFC247 : 0x75DFFF));
            if (isMul) effects.shockwave(this.x, 0.05, this.z, 0x75DFFF);
            // 人数变化文字
            if (added > 0) {
                effects.floatText(this.x, 1.6, this.z, '+' + added, '#75DFFF', isMul);
            } else if (added < 0) {
                effects.floatText(this.x, 1.6, this.z, String(added), '#FF5B58', true);
            }
            // Buff文字(按类型配色)
            if (isBuff || isRisk) {
                var texts = {
                    damage:  ['输出+1', '#FFE66D'],
                    damage2: ['输出+2', '#FFE66D'],
                    firerate:['射速+20%', '#66D68F'],
                    pierce:  ['穿透+1', '#75DFFF'],
                    crit:    ['暴击+5%', '#FFC247'],
                    freeze:  ['冰冻弹', '#9AD8FF'],
                    vamp:    ['吸血', '#66D68F'],
                    risk:    ['输出+2', '#FF5B58']
                };
                var t = texts[gate.value] || ['BUFF', '#A14DFF'];
                effects.floatText(this.x, 1.7, this.z, t[0], t[1], true);
                var burstCol = gate.value === 'crit' ? 0xFFC247 :
                    gate.value === 'freeze' ? 0x9AD8FF :
                    gate.value === 'vamp' ? 0x66D68F : 0xA14DFF;
                effects.burst(this.x, 0.6, this.z, burstCol, 10, 3, 0.5);
            }
            // 蓝色粒子扩散(人数增加时)
            if (added > 0) {
                var pCount = Math.min(12, 4 + Math.floor(added / 5));
                effects.burst(this.x, 0.5, this.z, 0x75DFFF, pCount, 3.5, 0.6);
            }
        }
    }

    update(dt, time, stopZ) {
        // V3.3: 复活无敌倒计时
        if (this.invulnT > 0) this.invulnT -= dt;
        // 前进 (Boss战时在Boss前方停下，击败Boss后继续)
        var moving = (stopZ === undefined || stopZ === null || this.z > stopZ);
        if (moving) {
            // V5.1: 前进方向统一走 BattleKinematics(CONFIG.DIRS.FORWARD_SIGN = -Z)
            this.z = BattleKinematics.advanceZ(this.z, CONFIG.SQUAD_SPEED, dt);
            if (stopZ !== undefined && stopZ !== null) this.z = Math.max(this.z, stopZ);
        }

        // V4.0: 连续目标位置 + 帧率无关平滑跟随(替代旧跳道急吸附)
        // 目标与实际位置都钳制在随队伍宽度变化的可移动边界内
        var bound = MovementMath.centerBounds(this.getHalfWidth());
        this.targetX = MovementMath.clampCenter(this.targetX, bound);
        this.x = MovementMath.clampCenter(
            damp(this.x, this.targetX, MovementMath.followLambda(), dt), bound);
        // V8.0: game 引用(武器/科技读取)
        if (this._gameRef === undefined && typeof window !== 'undefined' && window.__game) this._gameRef = window.__game;
        // V6.0: 背水阈值 + 护盾冷却
        this._halfCount = Math.floor(CONFIG.SQUAD_MAX_COUNT / (this._comboDesperate ? 1.67 : 2)); // V8.0: 绝境锋芒60%
        if (this._shieldCd > 0) this._shieldCd -= dt;
        if (this._skillShieldMax && this._shieldCd <= 0 && this._skillShield < this._skillShieldMax) this._skillShield = this._skillShieldMax;
        // V8.0: 随机事件限时buff衰减
        if (this._evDmgMulT > 0) { this._evDmgMulT -= dt; if (this._evDmgMulT <= 0) this._evDmgMul = 0; }
        if (this._evRateMulT > 0) { this._evRateMulT -= dt; if (this._evRateMulT <= 0) this._evRateMul = 0; }
        if (this._evCritT > 0) { this._evCritT -= dt; if (this._evCritT <= 0) this._evCritBonus = 0; }
        if (this._evPierceT > 0) { this._evPierceT -= dt; if (this._evPierceT <= 0) this._evPierce = 0; }
        // V15-GAMEPLAY-001: 临时医疗护盾计时衰减 (暂停时随update冻结)
        if (this._medShield > 0) {
            this._medShieldT = (this._medShieldT || 0) - dt;
            if (this._medShieldT <= 0) { this._medShield = 0; this._medShieldT = 0; }
        }
        // VNext / V15-GAMEPLAY-001: 职业被动(战地军医) + 科技"战地医疗"统一走 healSquad (12s间隔, 单次上限3人, 满编给1层护盾不无脑刷人)
        var cls = this._gameRef && this._gameRef._classStats;
        var techRegen = (this._gameRef && this._gameRef._techStats && this._gameRef._techStats.regen) || 0;
        var regenN = Math.min(3, ((cls && cls.regenN) || 0) + techRegen);
        if (regenN > 0 && this.count > 0) {
            var regenIv = (cls && cls.regenN) ? (cls.regenInterval || 12) : 12;
            this._regenT = (this._regenT === undefined ? regenIv : this._regenT) - dt;
            if (this._regenT <= 0) {
                this._regenT = regenIv;
                this.healSquad(regenN, 'passive', this._gameRef.effects);
            }
        }
        if (cls && this.count > 0) {
            this._classSkillT = (this._classSkillT === undefined ? cls.skill.firstCd : this._classSkillT) - dt;
            if (this._classSkillT <= 0) {
                this._classSkillT = cls.skill.cd;
                cls.skill.apply(this, cls.tier);
                if (this._gameRef.effects) this._gameRef.effects.floatText(this.x, 2.2, this.z, cls.skill.icon + ' ' + cls.skill.name + '!', cls.color, true);
            }
        }
        // V3.2: 换道倾斜(速度感) + 跑动前倾
        const tilt = clamp((this.x - this.targetX) * 0.28, -0.28, 0.28);
        // V5.1: 防守阵地时完全站立(无残余前倾漂移感)
        const lean = moving ? 0.1 : 0;

        this._moving = moving;
        this._lean = lean;
        this._tilt = tilt;
        // Logical positions remain independent from GLB rendering.
        for (let i = 0; i < this.count; i++) {
            const s = this.soldiers[i];

            // 弹出动画进度
            if (s.spawnT < 1) {
                s.spawnT = Math.min(1, s.spawnT + dt * 3.2);
            }

            // 平滑移向阵型位置
            s.x = damp(s.x, s.fx, 9, dt);
            s.z = damp(s.z, s.fz, 9, dt);

        }
        this.renderer.update(dt, time, this, moving, lean, tilt);
        this.mesh = this.renderer.mesh;
        this.legMeshL = this.renderer.legMeshL;
        this.legMeshR = this.renderer.legMeshR;
        this._legMeshes[0] = this.legMeshL;
        this._legMeshes[1] = this.legMeshR;
    }

    /** 获取随机士兵世界位置(射击出弹点) */
    getRandomSoldierPos() {
        if (this.count === 0) return null;
        const i = Math.floor(Math.random() * this.count);
        const p = this.renderer.getMuzzlePosition(i, this);
        return { x: p.x, y: p.y, z: p.z, shooterIndex: i };
    }

    /** 获取多个射击点(分散取) */
    getShootPositions(n) {
        const positions = [];
        if (this.count === 0) return positions;
        n = Math.min(n, this.count);
        const step = this.count / n;
        for (let i = 0; i < n; i++) {
            const idx = Math.floor(i * step + Math.random() * step) % this.count;
            this.renderer.triggerShoot(idx);
            const p = this.renderer.getMuzzlePosition(idx, this);
            positions.push({ x: p.x, y: p.y, z: p.z, shooterIndex: idx });
        }
        return positions;
    }

    /** 获取伤害值(永久枪械升级 + 门buff) V5.1: 上限99 */
    getDamage() {
        var gun = this.profile && typeof UpgradeShop !== 'undefined' ? UpgradeShop.damageBonus(this.profile) : 0;
        var dmg = CONFIG.BULLET_DAMAGE_BASE + gun + this.damageBuff;
        // V8.0: 科技伤害加成(火力科技"弹药强化") + 武器伤害乘区 — 修复: 原先只算了不 consuming
        if (this._gameRef) {
            var tech = this._gameRef._techStats;
            if (tech && tech.dmgBonus) dmg += tech.dmgBonus;
            var w = this._gameRef._weaponStats;
            if (w && w.dmgMul) dmg *= w.dmgMul;
            // VNext: 职业伤害乘区
            var c = this._gameRef._classStats;
            if (c && c.dmgMul) dmg *= c.dmgMul;
        }
        return Math.min(99, Math.round(dmg * 10) / 10);
    }

    /** 获取射速(永久快速射击升级 + 门buff) V5.1: 全局上限3.0 */
    getFireRate() {
        var mul = this.profile && typeof UpgradeShop !== 'undefined' ? UpgradeShop.fireRateMul(this.profile) : 1;
        // V8.0: 武器+科技射速(从 game 引用)
        if (this._gameRef && this._gameRef._weaponStats && this._gameRef._weaponStats.rateMul) mul *= this._gameRef._weaponStats.rateMul;
        if (this._gameRef && this._gameRef._techStats && this._gameRef._techStats.rateBonus) mul *= (1 + this._gameRef._techStats.rateBonus);
        // V6.0: 无人机技能 — 每层+15%射速 (V8.0: 火力全开组合+25%/层)
        if (this._skillDrones) mul *= 1 + (this._comboFullBarrage ? 0.25 : 0.15) * this._skillDrones;
        // V11.2: 迅捷弹幕 — 每层+12%射速
        if (this._skillSwiftness) mul *= 1 + 0.12 * this._skillSwiftness;
        // V11.2: 火力流派 — 射速 +10%
        if (this._comboFireFlow) mul *= 1.1;
        // V8.0: 毒雾僚机组合 — 毒液层附带射速
        if (this._comboSwarmVenom && this._skillVenom) mul *= 1 + 0.08 * this._skillVenom;
        // V8.0: 随机事件射速buff
        if (this._evRateMul) mul *= this._evRateMul;
        // VNext: 职业射速乘区
        if (this._gameRef && this._gameRef._classStats && this._gameRef._classStats.rateMul) mul *= this._gameRef._classStats.rateMul;
        return Math.min(3.0, CONFIG.BULLET_FIRE_RATE_BASE * mul * (1 + this.fireRateBuff));
    }

    setAnimationState(name) {
        this.renderer.setState(name);
    }

    reset(startCount) {
        this.renderer.clearGhosts();
        this.renderer.setState(null);
        this.renderer._shootT.fill(0);
        this.renderer._hitT = 0;
        this.x = 0;
        this.z = 0;
        this.lane = 1;
        this.targetX = CONFIG.LANE_X[1];
        this.damageBuff = 0;
        this.fireRateBuff = 0;
        this.pierce = 0;
        this.critChance = 0;
        this.freezeStacks = 0;
        this.vampStacks = 0;
        this.explosive = 0;
        this.chain = 0;
        this.nukePending = false;
        this._skillRage = 0; this._skillDrones = 0; this._skillVenom = 0;
        this._skillShieldMax = 0; this._skillShield = 0; this._shieldCd = 0;
        this._skillMagnet = 0; this._skillBerserk = 0; this._skills = null;
        // V8.0: 技能组合+事件buff复位
        this._comboPlagueFury = 0; this._comboDesperate = 0; this._comboSwarmVenom = 0;
        this._comboUndying = 0; this._comboGreedFire = 0; this._comboRecycle = 0;
        this._comboToxicWard = 0; this._comboFullBarrage = 0; this._comboVenomBounty = 0;
        this._comboGuardianFury = 0; this._toxicWardPulse = false;
        this._evDmgMul = 0; this._evDmgMulT = 0; this._evRateMul = 0; this._evRateMulT = 0;
        this._evCritBonus = 0; this._evCritT = 0; this._evPierce = 0; this._evPierceT = 0;
        this._skillSwiftness = 0; this._skillDeadly = 0; this._critMul = 0;
        this._skillHarvest = 0; this._skillFortune = 0;
        this._comboFireFlow = 0; this._comboPierceFlow = 0; this._comboSwarmFlow = 0;
        this._regenT = undefined; this._classSkillT = undefined;
        this.recoverableLoss = 0; this._medShield = 0; this._medShieldT = 0;
        this._totalDr = 0; this._classBulletSpeed = 1.0;
        this.invulnT = 0; // V12: 复活无敌时间复位, 防残留到下一局
        this.alive = true;
        this.soldiers = [];
        this.count = 0; // 必须重置count, 否则setCount认为人数未变不补充士兵
        this.setCount(startCount);
    }
}


/* ===== [[ js/gates.js ]] ===== */
// ===== 状态门系统 =====

class GateSystem {
    constructor(scene) {
        this.scene = scene;
        this.gates = [];
        this.chosenRows = new Set();
    }

    /** 从关卡数据加载所有状态门 */
    loadFromLevel(level) {
        this.clear();
        GateRewardPool.lastWasMul = false; // V12: ×2连续抑制状态跨局复位
        for (const seg of level.segments) {
            if (seg.type !== 'gates') continue;
            // V2.2: 每扇门宽度=单车道宽(1.8)，不再用两门间距(4.0导致门超出路面)
            var gateWidth = CONFIG.LANE_WIDTH * 0.9;
            for (const gd of seg.gates) {
                // V5.1: 史诗门(×2/人数%大额)用金色
                if (!gd.style) gd.style = (gd.op === 'mul' || gd.op === 'nuke') ? 'mul' : (gd.op === 'addpct' ? 'buff' : (gd.op === 'risk' ? 'risk' : (gd.op === 'buff' ? 'buff' : 'add')));
                gd.tier = gd.tier || (gd.op === 'mul' ? 'rare' : 'common');
                const model = V42Art.createGateModel(gd, gateWidth);
                this._applyMilitaryPalette(model, gd);
                model.userData.artSource = 'js/models.js:createGateModel(' + gd.op + '/' + (gd.label || '') + ') 玻璃纹理:createGateGlassTexture(参考assets/art-v1/ui/gate-panel.svg)';
                model.position.set(CONFIG.LANE_X[gd.lane], 0, seg.z);
                this.scene.add(model);
                this.gates.push({
                    // VNext修复: 克隆门数据 — 原实现按引用共享 LEVELS 配置对象,
                    // resolveSkillGates 会把 value:'roll' 改写成具体技能并永久污染关卡常量(重玩不再随机)
                    data: Object.assign({}, gd),
                    model: model,
                    z: seg.z,
                    x: CONFIG.LANE_X[gd.lane],
                    triggered: false,
                    passed: false
                });
            }
        }
    }

    _applyMilitaryPalette(model, data) {
        var category = typeof _gateCategory === 'function' ? _gateCategory(data.op, data.value) : 'special';
        var color = category === 'count' ? 0x22c56a : (category === 'coin' ? 0xf5a623 : (data.op === 'mul' ? 0xa84dff : 0x2692ff));
        model.userData.militaryGateColor = color;
    }

    clear() {
        for (const g of this.gates) {
            this.scene.remove(g.model);
            // V4.0: 释放纹理+材质+几何体(每局重建, 不释放会累积GPU缓冲)
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
        }
        this.gates = [];
        this.chosenRows.clear();
    }

    isRowChosen(z) {
        return this.chosenRows.has(z);
    }

    nextRowZ() {
        var nextZ = null;
        for (const g of this.gates) {
            if (g.passed || this.isRowChosen(g.z)) continue;
            if (nextZ === null || g.z > nextZ) nextZ = g.z;
        }
        return nextZ;
    }

    approachStopZ(pacing, outstanding, squadZ) {
        var z = this.nextRowZ();
        if (z === null || (outstanding === 0 && pacing.canChooseGate(z))) return null;
        // Hold before the choice area, including while waves rest or splits spawn.
        // Never pull a squad backwards when loading an already advanced position.
        // V13.1恢复V12契约: 交战期也必须驻足 — 若交战中放行推进, 小队会在门仍隐形
        // (syncVisibility要求outstanding=0)时直接穿过1单位触发窗口, 该排状态门被
        // 永久跳过(combat-feedback-gates伏击回归稳定FAIL)。门不可见时窗口不可重入,
        // 小队只前进, 因此唯一安全策略是推进到门前即驻足, 清场后开门通过。
        return Math.min(squadZ, z + 5);
    }

    syncVisibility(pacing, outstanding) {
        var nextZ = this.nextRowZ();
        var available = outstanding === 0 && nextZ !== null && pacing.canChooseGate(nextZ);
        for (const g of this.gates) {
            g.model.visible = g.triggered || (available && g.z === nextZ && !g.passed);
        }
    }

    update(squad, effects, time, dt) {
        // V4.0: 触发窗口随队伍宽度扩展(大人数边缘可达侧门), 封顶保证左右门区间永不重叠
        var gateHalf = (CONFIG.LANE_WIDTH * 0.9) / 2;
        var triggerWin = MovementMath.gateTriggerWindow(gateHalf, squad.getHalfWidth ? squad.getHalfWidth() : 0);
        var stepDt = dt || 0.016;
        // A row is one decision even when the crowd envelope touches multiple
        // glass panels. Choose the nearest gate centre, never stack rewards.
        var rows = {};
        for (const candidate of this.gates) {
            if (!candidate.model.visible || candidate.triggered || candidate.passed || squad.z > candidate.z + .2 || squad.z < candidate.z - .8) continue;
            var distance = Math.abs(squad.x - candidate.x);
            if (!rows[candidate.z] || distance < rows[candidate.z].distance) rows[candidate.z] = {gate:candidate,distance:distance};
        }

        for (let i = this.gates.length - 1; i >= 0; i--) {
            const g = this.gates[i];
            if (!g.model.visible && !g.triggered) continue;

            // V5.1.1: 触发溶解动画 — 缩放收缩+玻璃/文字淡出, 完成后移除
            if (g.triggered && g.dissolveT !== undefined && g.dissolveT < 1) {
                g.dissolveT = Math.min(1, g.dissolveT + stepDt / 0.45);
                const t = g.dissolveT;
                g.model.scale.setScalar(Math.max(0.001, 1 - easeOutCubic(t)));
                const lbl = g.model.userData.label;
                if (lbl && lbl.material) lbl.material.opacity = 1 - t;
                const gls = g.model.userData.glass;
                if (gls && gls.material) { gls.material.transparent = true; gls.material.opacity = 0.5 * (1 - t); }
                if (t >= 1) { this._fadeRemove(g, i); continue; }
            }

            // 远处的门: 标签轻微浮动
            if (!g.triggered && g.model.userData.label) {
                g.model.userData.label.position.y =
                    (g.model.userData.labelBaseY || 2.46) + Math.sin(time * 2 + g.x) * 0.025;
            }

            // 接近发光
            if (!g.triggered) {
                const dist = Math.abs(squad.z - g.z);
                if (dist < 6 && dist > 0.5) {
                    const intensity = 1 - dist / 6;
                    const glass = g.model.userData.glass;
                    if (glass) {
                        glass.material.opacity = 0.45 + intensity * 0.3;
                    }
                }
                // V13: 稀有度光束呼吸脉动 + V15: 地面引导箭头流动脉动
                const beam = g.model.userData.beamMat;
                if (beam) {
                    const nearBoost = dist < 6 ? (1 - dist / 6) * 0.22 : 0;
                    beam.opacity = 0.28 + Math.sin(time * 3 + g.z * 1.7) * 0.08 + nearBoost;
                }
                const chevron = g.model.userData.chevronMat;
                if (chevron) {
                    chevron.opacity = 0.72 + Math.sin(time * 5.2 + g.x) * 0.22;
                }
            }

            // V4.0: 门磁吸辅助 — 仅当玩家已选边(距门中心<磁吸距离)时轻微吸附到该门跑道中心,
            // 不替代玩家选择(左右门磁吸区相距4, 永不重叠)
            if (!g.triggered && squad.z > g.z && squad.z - g.z < 4 &&
                Math.abs(squad.x - g.x) < CONFIG.MOVE.gateMagnetDist) {
                squad.targetX = damp(squad.targetX, g.x, CONFIG.MOVE.gateMagnetLambda, stepDt);
            }

            // 穿门检测(V4.0: 窗口=门半宽+队伍半宽补偿, 与视觉区域一致)
            if (!g.triggered && !g.passed && squad.z <= g.z + 0.2 && squad.z >= g.z - 0.8) {
                if (rows[g.z] && rows[g.z].gate === g) {
                    g.triggered = true;
                    this.chosenRows.add(g.z);
                    g.dissolveT = 0; // V5.1.1: 触发即开始溶解消失(玩家反馈: 门获得后要有消失效果)
                    for (const sibling of this.gates) if (sibling !== g && sibling.z === g.z) sibling.passed = true;
                    squad.applyGate(g.data, effects);
                    this._highlight(g, effects);
                    // V11.1: 门组合系统(同窗内成对触发真实增益)
                    if (typeof GateCombos !== 'undefined') {
                        var combo = GateCombos.feed(squad, g.data, effects, (typeof window !== 'undefined' && window.__game) || null);
                        if (combo && effects) effects.floatText(squad.x, 2.8, squad.z, combo.icon + ' 门组合 · ' + combo.name + '!', '#FFC247', true);
                    }
                    if (g.data.op === 'mul' && this.onMul) this.onMul(g); // V4.0: 翻倍慢动作+震屏
                }
            }

            // V5.1.1: 同排未选中门(passed)远离后移除; 触发门走溶解动画
            if (g.passed && !g.triggered && squad.z < g.z - 6) {
                this._fadeRemove(g, i);
            }
        }
    }

    _highlight(g, effects) {
        // 玻璃变亮
        const glass = g.model.userData.glass;
        if (glass) {
            glass.material.opacity = 0.85;
            glass.material.color.setHex(0xFFFFFF);
        }
        // 数值放大弹出
        const label = g.model.userData.label;
        if (label) {
            label.scale.multiplyScalar(1.04);
        }
        // 冲击波 + 门色粒子爆发(V5.1.1)
        if (effects) {
            effects.shockwave(g.x, 0.05, g.z, 0x6EE7B7);
            var gc = g.data && g.data.style === 'mul' ? 0xFFC247 : (g.data && g.data.style === 'buff' ? 0xA78BFA : 0x6EE7B7);
            effects.burst(g.x, 1.1, g.z, gc, 10, 3, 0.45);
        }
    }

    _fadeRemove(g, index) {
        // 直接移除(冲击波和膨胀动画已经提供了足够反馈)
        this.scene.remove(g.model);
        var geos = new Set(), mats = new Set(), textures = new Set();
        g.model.traverse(function(o) {
            if (o.geometry) geos.add(o.geometry);
            if (o.material) for (const m of (Array.isArray(o.material) ? o.material : [o.material])) mats.add(m);
        });
        mats.forEach(function(m) { for(const k in m) if(m[k] && m[k].isTexture) textures.add(m[k]); m.dispose(); });
        textures.forEach(function(t) { t.dispose(); });
        geos.forEach(function(g) { g.dispose(); });
        this.gates.splice(index, 1);
    }

    /** V6.0: 解析技能门 — 每排3个不同技能, 重建门模型 (VNext: 只认op, 每局重随机) */
    resolveSkillGates(squad) {
        if (typeof Skills === 'undefined') return;
        var rebuilt = [];
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (!g.data || g.data.op !== 'skill') continue;
            if (rebuilt.indexOf(g.z) >= 0) continue;
            rebuilt.push(g.z);
            var members = this.gates.filter(function(x) { return x.z === g.z && x.data && x.data.op === 'skill'; });
            var ids = Skills.rollChoices(squad);
            if (!ids || !ids.length) {
                // VNext修复: 全技能满级时禁止重roll出无法生效的重复选项 — 整排转人数门(+30%)
                for (var ci = 0; ci < members.length; ci++) {
                    members[ci].data.op = 'addpct';
                    members[ci].data.value = 30;
                    members[ci].data.label = '+30%';
                    members[ci].data.style = 'epic';
                    this.scene.remove(members[ci].model);
                    members[ci].model = V42Art.createGateModel(members[ci].data, CONFIG.LANE_WIDTH * 0.9);
                    this._applyMilitaryPalette(members[ci].model, members[ci].data);
                    this.scene.add(members[ci].model);
                    members[ci].triggered = false;
                    members[ci].passed = false;
                }
                continue;
            }
            for (var m = 0; m < members.length && m < ids.length; m++) {
                var id = ids[m];
                var def = SKILL_DEFS[id];
                var lv = squad._skills ? (squad._skills[id] || 0) : 0;
                members[m].data.value = id;
                // V11.2: 门标签带技能品质(普通/稀有/史诗)
                members[m].data.label = def.icon + ' ' + def.name + '[' + Skills.qualityName(id) + ']' + (lv > 0 ? ' Lv' + (lv + 1) : '');
                this.scene.remove(members[m].model);
                members[m].model = V42Art.createGateModel(members[m].data, CONFIG.LANE_WIDTH * 0.9);
                this._applyMilitaryPalette(members[m].model, members[m].data);
                this.scene.add(members[m].model);
                members[m].triggered = false;
                members[m].passed = false;
            }
            // V10 QA修复: 技能池剩余不足3个时, 未重写的门仍保留 value:'roll' → 穿过时 Skills.apply('roll') 静默无效
            // (玩家白选一扇门) — 与上方空池分支同策略, 转为人数门
            for (var r = ids.length; r < members.length; r++) {
                members[r].data.op = 'addpct';
                members[r].data.value = 30;
                members[r].data.label = '+30%';
                members[r].data.style = 'epic';
                this.scene.remove(members[r].model);
                members[r].model = V42Art.createGateModel(members[r].data, CONFIG.LANE_WIDTH * 0.9);
                this._applyMilitaryPalette(members[r].model, members[r].data);
                this.scene.add(members[r].model);
                members[r].triggered = false;
                members[r].passed = false;
            }
        }
    }

    /**
     * V3.4: 广告刷门 — 重随前方(squadZ更小一侧)未触发的门
     * 只影响未触发门(旧门奖励作废), 已触发门保持; 加门权重随人数收敛, 防无限刷稀有门
     * @returns 重随的门数量
     */
    refreshAhead(squadZ) {
        var gateWidth = CONFIG.LANE_WIDTH * 0.9;
        var rerolled = 0;
        for (var i = 0; i < this.gates.length; i++) {
            var g = this.gates[i];
            if (g.triggered) continue;
            if (g.z >= squadZ) continue; // 已越过/脚下的门不重随

            var nd = GateSystem._rerollGateData(g.data, CONFIG.SQUAD_MAX_COUNT); // V5.1: 走 GateRewardPool(状态感知)
            // 重建模型
            this.scene.remove(g.model);
            g.model.traverse(function(obj) {
                if (obj.geometry) obj.geometry.dispose();
                if (obj.material && obj.material.map) obj.material.map.dispose();
                if (obj.material) obj.material.dispose();
            });
            var model = V42Art.createGateModel(nd, gateWidth);
            this._applyMilitaryPalette(model, nd);
            model.position.set(CONFIG.LANE_X[nd.lane], 0, g.z);
            this.scene.add(model);
            g.data = nd;
            g.model = model;
            g.triggered = false;
            g.passed = false;
            rerolled++;
        }
        return rerolled;
    }

    /** 门数据重随: op/value/label 全部重新生成 */
    static _rerollGateData(oldData, maxCount) {
        return GateRewardPool.roll(oldData.lane, (typeof window !== 'undefined' && window.__game && window.__game.squad) ? window.__game.squad : null, false);
    }
}

// ===== V5.1 门奖励池 (普通~75% / 稀有~20% / 史诗~5%; ×2 仅属稀有池且受抑制) =====
var GATE_REWARD_POOL = {
    common: [
        { op: 'add',    value: 3,  label: '+3',      w: 6 },
        { op: 'add',    value: 5,  label: '+5',      w: 6 },
        { op: 'add',    value: 8,  label: '+8',      w: 5 },
        { op: 'add',    value: 12, label: '+12',     w: 4 },
        { op: 'buff',   value: 'damage',   label: '输出+1',   w: 4, style: 'buff' },
        { op: 'buff',   value: 'firerate10', label: '射速+10%', w: 4, style: 'buff' },
        { op: 'buff',   value: 'crit',     label: '暴击+5%',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'pierce',   label: '穿透+1',   w: 2, style: 'buff' }
    ],
    rare: [
        { op: 'addpct', value: 20, label: '人数+20%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'damage2', label: '输出+2',  w: 3, style: 'buff' },
        { op: 'buff',   value: 'crit2',   label: '暴击+10%', w: 3, style: 'buff' },
        { op: 'buff',   value: 'freeze',  label: '冰冻弹',   w: 2, style: 'buff' },
        { op: 'buff',   value: 'vamp',    label: '吸血',     w: 2, style: 'buff' },
        { op: 'buff',   value: 'explosive', label: '爆炸弹', w: 2, style: 'buff' },
        { op: 'buff',   value: 'chain',   label: '连锁闪电', w: 2, style: 'buff' },
        { op: 'mul',    value: 2,  label: '×2', w: 2, style: 'mul' },
        { op: 'coin',   value: 30, label: '🪙 30金币', w: 1.5, style: 'mul' } // V11.1: 金币奖励门
    ],
    epic: [
        { op: 'addpct', value: 50, label: '人数+50%', w: 1.5, style: 'mul' },
        { op: 'nuke',   value: 0,  label: '全屏爆炸', w: 1.5, style: 'mul' },
        { op: 'buff',   value: 'arsenal', label: '军备强化', w: 1.5, style: 'mul' },
        { op: 'coin',   value: 80, label: '🪙 80金币', w: 1, style: 'mul' } // V11.1: 史诗金币门
    ]
};

var GateRewardPool = {
    lastWasMul: false, // ×2连续抑制
    /** 按稀有度概率(75/20/5)选池, 再按权重+队伍状态选具体奖励 */
    roll: function(lane, squad, forceNoMul) {
        // 稀有度概率: 普通75% 稀有20% 史诗5%
        var r = Math.random();
        var tier = r < 0.75 ? 'common' : (r < 0.95 ? 'rare' : 'epic');
        var pool = GATE_REWARD_POOL[tier].slice();
        var count = squad ? squad.count : 10;
        var weights = [];
        for (var i = 0; i < pool.length; i++) {
            var item = pool[i];
            var w = item.w;
            // ×2 连续抑制
            if (item.op === 'mul' && (this.lastWasMul || forceNoMul)) w = 0;
            // 队伍状态感知: 人数少抬人数门, 人数多压人数门
            if (item.op === 'add' || item.op === 'addpct') {
                w *= count < 8 ? 1.6 : (count > 120 ? 0.6 : 1);
            }
            // 满级属性不再出现(无效奖励)
            if (squad) {
                if (item.value === 'pierce' && squad.pierce >= 3) w = 0;
                if (item.value === 'crit' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'crit2' && squad.critChance >= 0.5) w = 0;
                if (item.value === 'firerate10' && squad.fireRateBuff >= 0.5) w = 0;
            }
            weights.push(w);
        }
        var total = 0;
        for (var k = 0; k < weights.length; k++) total += weights[k];
        // 该池全被抑制: 回退普通池的加人门
        if (total <= 0) return { lane: lane, op: 'add', value: 5, label: '+5', tier: 'common' };
        var pick = Math.random() * total;
        var chosen = pool[pool.length - 1];
        for (var j = 0; j < pool.length; j++) {
            pick -= weights[j];
            if (pick <= 0) { chosen = pool[j]; break; }
        }
        this.lastWasMul = (chosen.op === 'mul');
        var out = { lane: lane, op: chosen.op, value: chosen.value, label: chosen.label, tier: tier };
        if (chosen.style) out.style = chosen.style;
        return out;
    }
};

// ===== V11.1: 门组合效果 (同类/协同门在14秒窗内成对出现 → 真实增益, 每组合独立20s冷却) =====
function _gateCategory(op, value) {
    if (op === 'add' || op === 'addpct' || op === 'mul') return 'count';
    if (op === 'buff') {
        if (value === 'damage' || value === 'damage2') return 'attack';
        if (value === 'firerate' || value === 'firerate10') return 'rate';
        if (value === 'crit' || value === 'crit2') return 'crit';
        if (value === 'pierce') return 'pierce';
    }
    if (op === 'coin') return 'coin';
    return 'special';
}

var GATE_COMBO_DEFS = [
    { id: 'horde_fury',    name: '人海战术', icon: '👥', catA: 'count',  catB: 'attack',
      desc: '10秒伤害×1.5', apply: function(s) { s._evDmgMul = 1.5; s._evDmgMulT = 10; } },
    { id: 'fire_synergy',  name: '火力共鸣', icon: '🔥', catA: 'attack', catB: 'rate',
      desc: '8秒射速×1.6', apply: function(s) { s._evRateMul = 1.6; s._evRateMulT = 8; } },
    { id: 'weak_strike',   name: '弱点打击', icon: '🎯', catA: 'crit',   catB: 'attack',
      desc: '10秒暴击+25%', apply: function(s) { s._evCritBonus = 0.25; s._evCritT = 10; } },
    { id: 'pierce_rain',   name: '穿刺弹幕', icon: '🔩', catA: 'pierce', catB: 'rate',
      desc: '10秒穿透+2', apply: function(s) { s._evPierce = 2; s._evPierceT = 10; } },
    { id: 'gold_rush',     name: '财源滚滚', icon: '🪙', catA: 'coin',   catB: 'count',
      desc: '立即+40金币', apply: function(s, game) { if (game && game.profile) game.profile.addCoins(40); } },
    { id: 'tide_surge',    name: '怒潮',    icon: '🌊', catA: 'count',  catB: 'count',
      desc: '人数+15%', apply: function(s) { s.setCount(Math.min(CONFIG.SQUAD_MAX_COUNT, s.count + Math.max(1, Math.round(s.count * 0.15)))); } }
];

var GateCombos = {
    WINDOW: 14, COOLDOWN: 20,
    _log: [], _cd: {},
    reset: function() { this._log = []; this._cd = {}; },
    /** 门触发时投喂; 命中组合返回 def 并施加真实效果 */
    feed: function(squad, data, effects, game) {
        var cat = _gateCategory(data.op, data.value);
        var now = (typeof performance !== 'undefined' ? performance.now() / 1000 : Date.now() / 1000);
        this._log = this._log.filter(function(e) { return now - e.t < this.WINDOW; }, this);
        var activated = null;
        for (var i = 0; i < GATE_COMBO_DEFS.length; i++) {
            var c = GATE_COMBO_DEFS[i];
            if (this._cd[c.id] && now - this._cd[c.id] < this.COOLDOWN) continue;
            var matched = null;
            if (c.catA === cat) {
                for (var j = this._log.length - 1; j >= 0; j--) {
                    if (this._log[j].cat === c.catB) { matched = this._log[j]; break; }
                }
            } else if (c.catB === cat) {
                for (var j2 = this._log.length - 1; j2 >= 0; j2--) {
                    if (this._log[j2].cat === c.catA) { matched = this._log[j2]; break; }
                }
            }
            if (matched) {
                c.apply(squad, game);
                this._cd[c.id] = now;
                activated = c;
                break;
            }
        }
        this._log.push({ cat: cat, t: now });
        if (this._log.length > 8) this._log.shift();
        return activated;
    }
};
if (typeof window !== 'undefined') window.GateCombos = GateCombos;


/* ===== [[ js/enemies.js ]] ===== */
// ===== 僵尸/Boss 系统 =====

class Enemy {
    constructor(type, x, z, scene, hpOverride, styleOverride) {
        this.type = type;
        this.cfg = CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal;
        this.hp = hpOverride || this.cfg.hp;   // V3.3: 关卡可覆盖Boss血量
        this.maxHp = this.hp;
        this.x = x;
        this.z = z;
        this.alive = true;
        this.attackTimer = 0;
        this.hitFlash = 0;
        this.knockback = 0;
        this.frozenT = 0;       // V3.3: 冰冻减速剩余时间
        this._frozenFx = false; // 冰冻粒子只播一次
        this.spitTimer = randRange(1.2, 2.4);
        this.throwTimer = randRange(1.4, 2.6); // V16.2: 投弹怪初始投掷倒计时
        this._liftY = 0;                       // V16.2: 跃栏/龙卷风浮空高度
        this._tornadoPulled = false;           // V16.2: 被龙卷风牵引标记(暂停近战攻击)
        this.phase = Math.random() * Math.PI * 2;
        this.isBoss = (type === 'boss');
        this.enraged = false;   // V3.2: Boss狂暴阶段标记
        this.speedMul = 1;      // 移速倍率
        this._returningToFront = false;
        this.attackMul = 1;     // 攻击间隔倍率
        this.dying = false;
        this.dieT = 0;
        this.deathHandled = false;
        this.removeReady = false;
        this.spawnT = this.isBoss ? 0 : 1; // V4.0: Boss弹性入场动画

        // V16.2: 路边伏击怪 flanker 从道路护栏外侧(x=±5.2)翻越跃入战场
        if (type === 'flanker') {
            this._vaultSide = (x >= 0) ? 1 : -1;
            this._vaultStartX = this._vaultSide * 5.2;
            this._vaultEndX = this._vaultSide * randRange(2.05, 2.85);
            this.x = this._vaultStartX;
            this._vaultT = 0;
            this._vaultDur = 0.72;
            this._vaulting = true;
            this._homeX = this._vaultEndX;
            this._spreadX = clamp((this._homeX / 3.2) * 1.35, -1.45, 1.45);
        }

        // V16.3-P1: spitter / thrower / flanker 全部拥有独立 Blender 雕塑 GLB 资产
        this.artStyle = styleOverride || (this.isBoss ? 'bruiser' : type);
        this.model = new THREE.Group();
        this.model.userData.merged = true;
        this.model.userData.artSource = 'assets/models/'+(['normal','fast','shield','split','spitter','thrower','flanker','elite','bomber'].includes(this.artStyle)?'zombies':'bosses')+'/'+this.artStyle+'/'+this.artStyle+'.glb (instanced anchor)';
        this.model.position.set(this.x, 0, this.z);
        this.model.scale.setScalar(this.cfg.scale); // V2.2修复: 存活时应用类型scale
        this.visScale = this.cfg.scale; // 实际视觉scale(分裂僵尸会缩小)
        if(this.isBoss && this.artStyle==='elite') {this.visScale=2.25;this.model.scale.setScalar(this.visScale);}
        scene.add(this.model);
        this._baseRotY = this.model.rotation.y; // V3.7: 行走摇摆基准朝向(合并模型0 / Group模型PI)

        // 收集可闪烁材质(合并模型无独立材质 → 用缩放冲击代替闪烁)
        this.flashMats = [];
        this.model.traverse(function(obj) {
            if (obj.material && obj.material.emissive) {
                this.flashMats.push(obj.material);
            }
        }.bind(this));
    }

    takeDamage(dmg, effects, fromX, isCrit) {
        if (!this.alive) return false;
        var actualDamage = this.shieldT > 0 ? dmg * .3 : dmg;
        if(this.artStyle==='titan')actualDamage*=.85;
        this.hp -= actualDamage;
        this.hitFlash = 0.13;
        this._deathSide = clamp((this.x - (fromX === undefined ? this.x : fromX)) * 2, -1.4, 1.4);
        // 击退(非Boss)
        if (!this.isBoss) this.knockback = Math.min(this.knockback + (isCrit ? 2.35 : 1.5), isCrit ? 3.8 : 3.0);
        // V16.3: 区分普通命中 / 暴击 / 护盾破防 / 击杀火花反馈
        if (effects) {
            var isShieldHit = (this.shieldT > 0 || this.type === 'shield');
            var sparkColor = isCrit ? 0xFF7B2E : (isShieldHit ? 0x5CEEFF : 0xFFE680);
            var sparkCount = isCrit ? 7 : (isShieldHit ? 4 : 3);
            effects.burst(this.x, 0.65, this.z, sparkColor, sparkCount, isCrit ? 3.2 : 2.5, isCrit ? .30 : .22);
            if (effects.impact) effects.impact(this.x, .85, this.z, isCrit, this.hp <= 0);
            // 伤害数字 (V3.6: 降低概率避免大规模战斗时文字刷屏; V3.3: 暴击必显大字)
            if (isCrit) {
                effects.floatText(this.x, 1.0, this.z, String(Math.round(dmg * 100) / 100), '#FF8844', true);
            } else if (Math.random() < 0.12) {
                effects.floatText(this.x, 0.9, this.z, String(Math.round(dmg * 100) / 100), '#FFD700', false);
            }
        }
        if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('hit');
        if (this.hp <= 0) {
            this.die(effects);
            return true;
        }
        return false;
    }

    die(effects) {
        this.alive = false;
        this.dying = true;
        this.dieT = 0;
        if (effects) {
            // 卡通粒子爆开
            effects.burst(this.x, 0.5, this.z, this.cfg.color, 12, 3.5, 0.6);
            // V16: 身体碎片(旋转四面体, 大体型更多; 池上限48自动限流)
            if (effects.spawnShards) effects.spawnShards(this.x, 0.55, this.z, this.cfg.color, this.isBoss ? 14 : 6, this.isBoss ? 4.6 : 3.4, 0.75);
            effects.burst(this.x, 0.5, this.z, 0xFFFFFF, 4, 2, 0.3);
            // 金色积分光点 + V15 卡通小爆炸闪光(Boss大爆炸)
            effects.burst(this.x, 0.7, this.z, 0xFFD700, 4, 2.5, 0.8);
            if (effects.boom) effects.boom(this.x, 0.65, this.z, this.isBoss ? 2.4 : 0.92);
            // V12视觉: 地面尸液痕迹(大体型更大; decal池内自动限流)
            if (effects.splat) effects.splat(this.x, this.z, this.visScale * (this.isBoss ? 1.6 : 0.9));
        }
    }

    update(dt, time, squad, manager, effects) {
        // === 死亡动画: 后仰+缩小 ===
        if (this.dying) {
            this.dieT += dt;
            var dur = this.isBoss ? 0.8 : 0.46;
            var t = Math.min(1, this.dieT / dur);
            // 后仰
            this.model.rotation.x = -t * 1.4;
            this.model.rotation.z += (this._deathSide || .35) * dt * 2.5;
            this.model.position.y = Math.sin(t * Math.PI) * (this.isBoss ? .25 : .65);
            this.model.position.z = this.z - t * (this.isBoss ? .25 : 1.35);
            this.model.position.x = this.x + (this._deathSide || .25) * t;
            // 缩小消失 (V2.2: 使用visScale避免分裂僵尸跳变)
            var s = this.visScale * (1 - t * t);
            this.model.scale.setScalar(Math.max(0.001, s));
            if (this.dieT >= dur) {
                this.removeReady = true;
            }
            return;
        }
        if (!this.alive) return;
        this.attackT=Math.max(0,(this.attackT||0)-dt*3);

        // V4.0: Boss入场弹性缩放(0.5s, 期间不移动不攻击)
        if (this.spawnT < 1) {
            this.spawnT = Math.min(1, this.spawnT + dt * 2);
            this.model.scale.setScalar(this.visScale * Math.max(0.05, easeOutBack(this.spawnT)));
            if (this.spawnT < 1) return;
        }
        // V16.2: 路边伏击怪 flanker 0.72s 翻越护栏抛物线入场 (空中无接触伤害)
        if (this._vaulting) {
            this._vaultT += dt / (this._vaultDur || 0.72);
            var vt = Math.min(1, this._vaultT);
            this.x = this._vaultStartX + (this._vaultEndX - this._vaultStartX) * vt;
            this._liftY = Math.sin(vt * Math.PI) * 1.45;
            this.z = BattleKinematics.enemyApproachZ(this.z, this.cfg.speed * 0.45, dt);
            this.model.position.set(this.x, this._liftY, this.z);
            this.model.rotation.z = -this._vaultSide * (1 - vt) * 0.45;
            this.model.rotation.x = 0.25 * Math.sin(vt * Math.PI);
            if (vt >= 1) {
                this._vaulting = false;
                this._liftY = 0;
                // V18.0: 伏击怪落地后给予 0.6s 保护窗口, 绝不落地瞬间秒伤玩家
                this.attackTimer = Math.max(this.attackTimer || 0, 0.6);
                if (effects) effects.burst(this.x, 0.2, this.z, 0x22D3EE, 6, 2.2, 0.3);
            }
            return;
        }
        if(this.isBoss)V42BossController.update(this,dt,squad,manager,effects);

        // V3.3: 冰冻减速
        if (this.frozenT > 0) this.frozenT -= dt;
        const frozen = this.frozenT > 0;

        const dz = squad.z - this.z;
        const dist = Math.abs(dz);
        const attackDist = CONFIG.ZOMBIE_ATTACK_DIST * (this.isBoss ? 2.5 : 1);

        // V3.2: Boss狂暴阶段 — 血量50%触发, 移速/攻击提升 + 红色氛围
        if (this.isBoss && !this.enraged && this.hp <= this.maxHp * (this.artStyle==='overlord'?.33:.5)) {
            this.enraged = true;
            this.speedMul = 1.5;
            this.attackMul = 0.65; // 攻击间隔缩短
            if (effects) {
                effects.floatText(this.x, 2.6, this.z, '狂暴!', '#FF4444', true);
                effects.shockwave(this.x, 0.05, this.z, 0xFF4444);
                effects.burst(this.x, 1.2, this.z, 0xFF3333, 18, 4, 0.7);
            }
            var self = this;
            this.model.traverse(function(obj) {
                if (obj.material && obj.material.emissive) obj.material.emissive.setHex(0x3A0000);
            });
        }

        // V16.2: 酸液远程怪 spitter (8-9.5m射程, 3.8s间隔, 5m/s非追踪酸液弹, 最多6只同时齐射)
        if (this.type === 'spitter' && !frozen && !this._tornadoPulled && dist > attackDist && dist < 9.5) {
            this.spitTimer -= dt;
            if (this.spitTimer <= 0) {
                var spitScale = Math.max(1, ((manager && manager._spitterCount) || 1) / 6);
                this.spitTimer = randRange(3.4, 4.2) * spitScale;
                if (manager && manager.spits && manager.spits.length < 10) {
                    this.attackT = 1;
                    manager.spawnSpit(this.x, 0.6, this.z, squad);
                }
            }
        }

        // V16.2: 抛物线投弹怪 thrower (9-10.5m射程, 5.5s间隔, 1.3s地面红圈预警, 场上最多3枚炸弹)
        if (this.type === 'thrower' && !frozen && !this._tornadoPulled && dist > attackDist + 1.2 && dist < 10.5) {
            this.throwTimer -= dt;
            if (this.throwTimer <= 0) {
                this.throwTimer = randRange(5.0, 6.0);
                if (manager && manager.spawnBomb && (!manager.bombs || manager.bombs.length < 3)) {
                    this.attackT = 1;
                    manager.spawnBomb(this.x, 1.0, this.z, squad.x, squad.z);
                }
            }
        }

        // Rear ambushes must finish flanking into the forward firing line.
        // Stopping at melee distance behind a lone soldier left them untargetable
        // forever, which also held the next gate's encounter lock forever.
        if (dz < 0) this._returningToFront = true;
        if (this.z <= squad.z - attackDist) this._returningToFront = false;
        if (dist > attackDist || this._returningToFront) {
            // V5.1.1 / V15-GAMEPLAY-004: 保持宽阵型全路推进, 绝不早早缩成一条直线!
            // 仅在近距离(dist < 6.5m)才带各自扇形偏移(_spreadX)包抄小队前排
            if (this._homeX === undefined) {
                this._homeX = clamp(this.x, -3.2, 3.2);
                this._spreadX = clamp((this._homeX / 3.2) * 1.35, -1.45, 1.45);
            }
            const behind = this._returningToFront;
            const spd = this.cfg.speed * (this.speedMul || 1) * (frozen ? 0.3 : 1) * (behind ? 2.5 : 1);
            if (behind) this.z = Math.max(squad.z - attackDist, this.z - spd * dt);
            else this.z = BattleKinematics.enemyApproachZ(this.z, spd, dt);
            var desiredX = this._homeX + Math.sin(time * 1.4 + this.phase) * 0.18;
            if (dist < 6.5 || this.isBoss) {
                var blend = this.isBoss ? 1.0 : clamp((6.5 - dist) / 4.5, 0, 1);
                var closeX = clamp(squad.x + (this.isBoss ? 0 : this._spreadX), -3.2, 3.2);
                desiredX = desiredX * (1 - blend) + closeX * blend;
            }
            const dx = desiredX - this.x;
            this.x = clamp(this.x + clamp(dx, -1, 1) * spd * 0.45 * dt, -3.35, 3.35);
        } else if (Math.abs(this.x - squad.x) > (squad.getHalfWidth ? squad.getHalfWidth() : 1) + (this.isBoss ? 1.2 : .45)) {
            this.x += Math.sign(squad.x - this.x) * this.cfg.speed * dt;
        } else {
            // Melee requires horizontal contact too, not just a matching Z.
            // V16.2: 被龙卷风卷起的普通/特殊怪暂停近战攻击(Boss/精英除外)
            if (this._tornadoPulled && !this.isBoss && this.type !== 'elite') {
                this.attackTimer = Math.max(this.attackTimer, 0.25);
            } else {
                this.attackTimer -= dt;
                if (this.attackTimer <= 0) {
                    // V5.1.4: Boss攻击间隔×2(挥击1.6s, 磨损0.625/s) — Boss竞速与召唤磨损平衡
                    this.attackTimer = CONFIG.ZOMBIE_ATTACK_INTERVAL * (this.attackMul || 1) * (frozen ? 2 : 1) * (this.isBoss ? 2 : 1);
                    this.attackT=1;
                    const kill = this.isBoss ? (this.enraged ? 3 : 1) : CONFIG.ZOMBIE_ATTACK_KILL; // 非狂暴1/狂暴3
                    if (squad.applySquadDamage) {
                        squad.applySquadDamage({
                            sourceType: this.isBoss ? 'boss_melee' : ('melee_' + this.type),
                            damage: kill,
                            hitPosition: { x: this.x, z: this.z }
                        }, effects);
                    } else {
                        squad.killSoldiers(kill, effects);
                    }
                    if (effects) {
                        effects.burst(squad.x, 0.5, squad.z, 0xFF4444, 5, 2, 0.3);
                    }
                }
            }
        }

        // 击退衰减
        if (this.knockback > 0.01) {
            this.z -= this.knockback * dt * 3;
            this.knockback *= Math.pow(0.05, dt);
        }

        // 行走动画: 摇摆+弹跳+V3.7左右摇头蹒跚 + V16.3被龙卷风卷起时明显旋转失衡倾斜
        const walkSpeed = this.isBoss ? 3 : 5;
        const sway = Math.sin(time * walkSpeed + this.phase) * 0.1;
        const bob = Math.abs(Math.sin(time * walkSpeed + this.phase)) * 0.06;
        this.model.position.set(this.x, bob + (this._liftY || 0), this.z);
        if (this._tornadoPulled && !this.isBoss) {
            this.model.rotation.z = Math.sin(time * 9.5 + this.phase) * 0.44;
            this.model.rotation.y = this._baseRotY + (time * 8.5 + this.phase);
            this.model.rotation.x = 0.28 + Math.cos(time * 7 + this.phase) * 0.18;
        } else {
            this.model.rotation.z = sway;
            this.model.rotation.y = this._baseRotY + Math.sin(time * walkSpeed * 0.5 + this.phase) * 0.12;
        }
        // V16.1: 受击轻微后仰与弹性受击缩放反馈 + 自然体型微差
        if (this._scaleVar === undefined) this._scaleVar = this.isBoss ? 1.0 : randRange(0.91, 1.11);
        var hitRatio = clamp((this.hitFlash || 0) / 0.13, 0, 1);
        if (this.hitFlash > 0) this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.model.scale.setScalar(this.visScale * this._scaleVar * (1 + hitRatio * 0.12));
        // V3.2: 攻击时前扑啃咬动画 + 受击后仰
        if (dist <= attackDist) {
            this.model.rotation.x = -0.16 + Math.sin(time * 9 + this.phase) * 0.13 + hitRatio * 0.32;
        } else {
            this.model.rotation.x = Math.sin(time * walkSpeed + this.phase) * 0.05 + hitRatio * 0.34;
        }

        // 受击反馈 (V3.5: 合并模型用缩放冲击, Group模型用emissive闪烁)
        if (this.hitFlash > 0) {
            this.hitFlash -= dt;
            const k = Math.max(0, this.hitFlash / 0.13);
            if (this.model.userData.merged) {
                // Game Feel: 挤压拉伸(横向鼓胀 + 纵向压缩)强化受击打击感
                var sx = this.visScale * (1 + k * 0.22);
                var sy = this.visScale * (1 - k * 0.15);
                this.model.scale.set(sx, sy, sx);
            } else {
                const f = k * 0.35;
                for (let i = 0; i < this.flashMats.length; i++) {
                    this.flashMats[i].emissive.setRGB(f, f * 0.85, f * 0.6);
                }
            }
        } else if (this.spawnT >= 1 && this.model.userData.merged) {
            this.model.scale.setScalar(this.visScale);
        }
    }

    destroy(scene) {
        scene.remove(this.model);
        var merged = !!this.model.userData.merged; // V4.0: 合并僵尸几何为全类型共享缓存, 不可dispose
        this.model.traverse(function(obj) {
            if (obj.geometry && !merged) obj.geometry.dispose();
            if (obj.material && !merged) obj.material.dispose();
        });
    }
}

class EnemyManager {
    constructor(scene, effects) {
        this.scene = scene;
        this._levelIndex = 0;
        this.effects = effects;
        this.enemies = [];
        this.spits = [];
        this.pendingSpawns = [];
        this.boss = null;
        this.splitQueue = [];
        this.killCount = 0;
        this.bossStyle='bruiser';
        this.renderer=new EnemyArmyRenderer(scene);
        this._spitPool=Array.from({length:64},()=>({mesh:new THREE.Object3D(),life:0,vx:0,vz:0}));
        this._spitInstances=new THREE.InstancedMesh(new THREE.SphereGeometry(.22,10,8),new THREE.MeshBasicMaterial({color:0x88FF33}),64);
        this._spitInstances.count=0;this._spitInstances.frustumCulled=false;
        this._spitInstances.userData.artSource='V18.0 high-visibility glowing acid projectiles';scene.add(this._spitInstances);
        // V16.3: 独立多部件3D卡通炸弹(铁灰弹体+红警示带+黄铜引信环+燃烧引线火花) + 动态收缩红圈危险区
        this.bombs = [];
        this._bombPool = Array.from({length: 8}, () => ({ sx:0, sy:1, sz:0, tx:0, tz:0, t:0, dur:1.3, sparkT:0 }));
        this._bombMat4 = new THREE.Matrix4();
        this._bombQuat = new THREE.Quaternion();
        this._bombEuler = new THREE.Euler();
        this._bombPos = new THREE.Vector3();
        this._bombScale = new THREE.Vector3();
        var bombParts = [
            colorize(new THREE.SphereGeometry(0.25, 12, 10), 0x262D38),
            colorize(new THREE.CylinderGeometry(0.255, 0.255, 0.075, 12), 0xEF4444),
            colorize(new THREE.CylinderGeometry(0.085, 0.10, 0.075, 10), 0xD4A238).translate(0, 0.25, 0),
            colorize(new THREE.CylinderGeometry(0.025, 0.025, 0.16, 6), 0xE8D4A8).rotateZ(-0.42).translate(0.04, 0.34, 0),
            colorize(new THREE.OctahedronGeometry(0.075, 0), 0xFFAE22).translate(0.09, 0.42, 0)
        ];
        var bombGeo = mergeGeometries(bombParts);
        this._bombInstances = new THREE.InstancedMesh(
            bombGeo,
            new THREE.MeshLambertMaterial({ color: 0xFFFFFF, vertexColors: true }),
            8
        );
        this._bombInstances.count = 0; this._bombInstances.frustumCulled = false;
        this._bombInstances.userData.artSource = 'V16.3 3D cartoon iron bomb with lit fuse';
        scene.add(this._bombInstances);
        // 1) 半透明红色危险区填充盘
        var fillGeo = new THREE.CircleGeometry(1.30, 28);
        fillGeo.rotateX(-Math.PI * 0.5);
        this._bombFillInstances = new THREE.InstancedMesh(
            fillGeo,
            new THREE.MeshBasicMaterial({ color: 0xFF2222, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }),
            8
        );
        this._bombFillInstances.count = 0; this._bombFillInstances.frustumCulled = false;
        this._bombFillInstances.renderOrder = 3;
        scene.add(this._bombFillInstances);
        // 2) 外层固定危险边界环
        var ringGeo = new THREE.RingGeometry(1.16, 1.32, 28);
        ringGeo.rotateX(-Math.PI * 0.5);
        this._bombRingInstances = new THREE.InstancedMesh(
            ringGeo,
            new THREE.MeshBasicMaterial({ color: 0xFF3322, transparent: true, opacity: 0.86, side: THREE.DoubleSide, depthWrite: false }),
            8
        );
        this._bombRingInstances.count = 0; this._bombRingInstances.frustumCulled = false;
        this._bombRingInstances.renderOrder = 4;
        this._bombRingInstances.userData.artSource = 'V16.3 bomb outer danger ring';
        scene.add(this._bombRingInstances);
        // 3) 内层动态收缩倒计时环 (1.3s 内从外缘收至中心提示引爆瞬间)
        var innerGeo = new THREE.RingGeometry(0.90, 1.02, 28);
        innerGeo.rotateX(-Math.PI * 0.5);
        this._bombInnerInstances = new THREE.InstancedMesh(
            innerGeo,
            new THREE.MeshBasicMaterial({ color: 0xFFBB44, transparent: true, opacity: 0.90, side: THREE.DoubleSide, depthWrite: false }),
            8
        );
        this._bombInnerInstances.count = 0; this._bombInnerInstances.frustumCulled = false;
        this._bombInnerInstances.renderOrder = 5;
        this._bombInnerInstances.userData.artSource = 'V16.3 bomb shrinking countdown ring';
        scene.add(this._bombInnerInstances);
    }

    /** V4.0: loadFromLevel 只负责清场; 波次计划移交 GamePacingController 分批驱动 */
    loadFromLevel(level, levelIndex) {
        this.clear();
        this._levelIndex = levelIndex || 0;
    }

    /** V4.0: 统一出生入口(供节奏控制器/分裂/E2E注入调用) */
    spawnEnemy(type, x, z, hp, style) {
        const e = new Enemy(type, x, z, this.scene, hp || null, style || (type==='boss' ? this.bossStyle : null));
        // V6.0: 精英词缀
        if (type === 'elite' && typeof AffixSystem !== 'undefined') {
            AffixSystem.roll(e, this._levelIndex || 0);
            if (e.affixNames) e.model.userData.affixTag = e.affixNames;
        }
        // V12视觉: 精英身份光环(贴地金环, 随锚点移动; >10只精英时省略保护drawcall)
        if (type === 'elite' && this._eliteAuraCount === undefined) this._eliteAuraCount = 0;
        if (type === 'elite' && this._eliteAuraCount < 10 && typeof V42Art !== 'undefined' && V42Art.createEliteAura) {
            var aura = V42Art.createEliteAura();
            aura.position.y = 0.04;
            e.model.add(aura);
            e._eliteAura = aura;
            this._eliteAuraCount++;
        }
        this.enemies.push(e);
        if (type === 'boss') { this.boss = e; this.bossKills = this.bossKills || 0; }
        return e;
    }

    clear() {
        for (const e of this.enemies) e.destroy(this.scene);
        this.enemies = [];
        this._eliteAuraCount = 0; // V12视觉: 光环配额重置(共享几何/材质不dispose, 无泄漏)
        for (const s of this.spits) this._spitPool.push(s);
        this.spits = [];
        if (this.bombs) {
            for (const b of this.bombs) this._bombPool.push(b);
            this.bombs = [];
        }
        this.pendingSpawns = [];
        this.boss = null;
        this.bossKills = 0; // V10 QA修复: 原漏复位导致Boss击杀数跨关卡累计重复入账
        this.splitQueue = [];
        this.killCount = 0;
        this.renderer.clear();
        this._spitInstances.count=0;
        if (this._bombInstances) this._bombInstances.count = 0;
        if (this._bombFillInstances) this._bombFillInstances.count = 0;
        if (this._bombRingInstances) this._bombRingInstances.count = 0;
        if (this._bombInnerInstances) this._bombInnerInstances.count = 0;
    }

    spawnSpit(x, y, z, squad) {
        var s=this._spitPool.pop();if(!s)return;
        s.mesh.position.set(x,y,z);
        // V16.2: 5 m/s 非追踪直线酸液弹(玩家可左右走位清晰躲避)
        var dx=squad.x-x,dz=squad.z-z, inv=5.0/Math.max(.01,Math.hypot(dx,dz));
        s.vx=dx*inv;s.vz=dz*inv;s.life=2.8;this.spits.push(s);
    }

    /** V18.0: 投弹怪抛物线炸弹(锁定投掷瞬间玩家位置 + 1.5s清晰红圈预警) */
    spawnBomb(x, y, z, targetX, targetZ) {
        if (!this.bombs || this.bombs.length >= 3) return;
        var b = this._bombPool.pop();
        if (!b) return;
        b.sx = x; b.sy = y; b.sz = z;
        b.tx = clamp(targetX, -3.1, 3.1);
        b.tz = targetZ;
        b.t = 0;
        b.dur = 1.5;
        this.bombs.push(b);
    }

    update(dt, time, squad) {
        // V4.0: 生成由 GamePacingController 驱动(分批+上限), 此处不再整波触发

        // 分裂僵尸死亡后产生小僵尸
        // V5.1.3: 小体受活敌门控 — 超上限时延迟分裂(否则×3体量下小体洪流无视控制器团灭小队)
        // V5.1.3: 分裂门控基准=目标活敌×1.5(随队伍规模缩放; 旧MAX_ALIVE×1.3基准过松导致小体洪流)
        var splitCap = Math.max(20, Math.round((squad.count || 1) * 0.9 + 4) * 1.5);
        var splitEmitted = 0;
        for (let i = this.splitQueue.length - 1; i >= 0; i--) {
            const sq = this.splitQueue[i];
            sq.delay -= dt;
            if (sq.delay <= 0) {
                if (splitEmitted >= 1 || this.aliveCount >= splitCap) { sq.delay = 0.15; continue; } // 每帧至多1只, 超限延后
                const e = new Enemy('normal', sq.x + randRange(-0.5, 0.5), sq.z, this.scene);
                e.model.scale.multiplyScalar(0.6);
                e.visScale = e.cfg.scale * 0.6;
                e.hp = 2;
                this.enemies.push(e);
                this.splitQueue.splice(i, 1);
                splitEmitted++;
            }
        }

        // V5.1.3: 统计场上吐痰怪数(供攻击间隔摊薄)
        this._spitterCount = 0;
        for (const e of this.enemies) if (e.alive && e.type === 'spitter') this._spitterCount++;

        // 更新僵尸
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            if (typeof AffixSystem !== 'undefined') AffixSystem.update(e, dt, squad, this, this.effects);
            e.update(dt, time, squad, this, this.effects);
            // 刚死亡: 触发分裂/Boss爆炸(仅一次)
            if (!e.alive && !e.deathHandled) {
                e.deathHandled = true;
                this.killCount++;
                // V5.0: 击杀音效(适配器内部限流70ms) / Boss死亡低音轰鸣
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play(e.isBoss ? 'bossDie' : 'kill');
                // 分裂僵尸: 死亡时排队分裂
                if (e.type === 'split') {
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.2 });
                    this.splitQueue.push({ x: e.x, z: e.z, delay: 0.35 });
                }
                // V18.0: 爆炸僵尸 — 真实2D半径2.2m自爆(修复原仅测1D Z距离3.0m导致隔空掉人)
                if (e.type === 'bomber' && squad) {
                    if (Math.hypot(e.x - squad.x, e.z - squad.z) < 2.2 && squad.alive) {
                        if (squad.applySquadDamage) squad.applySquadDamage({ sourceType: 'bomber_blast', damage: 2, hitPosition: { x: e.x, z: e.z } }, this.effects);
                        else squad.killSoldiers(2, this.effects);
                    }
                    if (this.effects) {
                        // V14: 分级爆炸组合(闪光+双冲击波+橙白火花+烟尘), 保留红色自爆身份
                        if (this.effects.explosion) this.effects.explosion(e.x, 0.6, e.z, 2);
                        this.effects.burst(e.x, 0.6, e.z, 0xFF5A4B, 14, 4.0, 0.55);
                        // V16: 自爆爆炸音效(原为静默)
                        if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom');
                    }
                }
                // V6.0: 分裂词缀
                if (e.affixes && typeof AffixSystem !== 'undefined') AffixSystem.onDeath(e, this);
                // V10 QA修复: 按 isBoss 标记计数(原判定 e===this.boss 在多Boss并存时, 先生成新Boss后旧Boss被击杀会漏记)
                if (e.isBoss) {
                    this.bossKills = (this.bossKills || 0) + 1;
                    this.boss = this.enemies.find(other=>other!==e && other.isBoss && other.alive) || null;
                    // V14: Boss死亡 — tier4 分级爆炸(白闪+双冲击波+橙白火花+烟尘)
                    if (this.effects.explosion) this.effects.explosion(e.x, 1.0, e.z, 4);
                    // 金色身份粒子 + 红色余烬(与既有配色一致)
                    this.effects.burst(e.x, 1, e.z, 0xFFD700, 20, 4, 0.8);
                    this.effects.burst(e.x, 1.2, e.z, 0xFFFFFF, 15, 3, 0.6);
                }
            }
            // 死亡动画完成: 移除
            if (e.removeReady) {
                if (e._eliteAura) this._eliteAuraCount--;
                e.destroy(this.scene);
                this.enemies.splice(i, 1);
            }
        }

        // 更新吐痰弹 (V16.3: 荧光酸液球脉动 + 绿色拖尾 + 命中/落地飞溅)
        for (let i = this.spits.length - 1; i >= 0; i--) {
            const s = this.spits[i];
            s.life -= dt;
            s.mesh.position.x += s.vx * dt;
            s.mesh.position.z += s.vz * dt;
            s.mesh.scale.setScalar(1 + Math.sin(time * 16 + i) * 0.16);
            if (this.effects && Math.random() < 0.35) {
                this.effects.burst(s.mesh.position.x, s.mesh.position.y, s.mesh.position.z, 0x7CFF3B, 1, 0.8, 0.22);
            }
            // V18.0: 酸液弹采用真实小队半宽碰撞盒(修复小编制队伍隔1.4米被隐形击中的Bug)
            var squadHalfW = squad.getHalfWidth ? squad.getHalfWidth() : 0.55;
            if (Math.abs(s.mesh.position.z - squad.z) < 0.65 &&
                Math.abs(s.mesh.position.x - squad.x) < (squadHalfW + 0.35)) {
                if (squad.applySquadDamage) {
                    squad.applySquadDamage({ sourceType: 'spitter_acid', damage: 1, hitPosition: { x: s.mesh.position.x, z: s.mesh.position.z } }, this.effects);
                } else {
                    squad.killSoldiers(1, this.effects);
                }
                if (this.effects) {
                    this.effects.burst(s.mesh.position.x, 0.5, s.mesh.position.z, 0x7CFF3B, 9, 2.8, 0.38);
                    if (this.effects.splat) this.effects.splat(s.mesh.position.x, s.mesh.position.z, 0.85);
                }
                this.scene.remove(s.mesh);
                this._spitPool.push(s);
                this.spits.splice(i, 1);
                continue;
            }
            if (s.life <= 0) {
                if (this.effects) this.effects.burst(s.mesh.position.x, 0.3, s.mesh.position.z, 0x63C24B, 5, 1.8, 0.25);
                this.scene.remove(s.mesh);
                this._spitPool.push(s);
                this.spits.splice(i, 1);
            }
        }
        this._spitInstances.count=this.spits.length;
        for(var si=0;si<this.spits.length;si++) {
            this.spits[si].mesh.updateMatrix();
            this._spitInstances.setMatrixAt(si,this.spits[si].mesh.matrix);
        }
        this._spitInstances.instanceMatrix.needsUpdate=true;

        // V16.3: 更新3D旋转引线炸弹 + 火花拖尾 + 半透明危险区/动态收缩倒计时圈 + 闪光爆炸
        if (this.bombs && this._bombInstances && this._bombRingInstances) {
            for (var bi = this.bombs.length - 1; bi >= 0; bi--) {
                var b = this.bombs[bi];
                b.t += dt;
                b.sparkT = (b.sparkT || 0) + dt;
                var p = Math.min(1, b.t / b.dur);
                if (p < 1 && b.sparkT >= 0.08 && this.effects) {
                    b.sparkT = 0;
                    var sx2 = b.sx + (b.tx - b.sx) * p;
                    var sz2 = b.sz + (b.tz - b.sz) * p;
                    var sy2 = b.sy * (1 - p) + Math.sin(p * Math.PI) * 3.1;
                    this.effects.burst(sx2, sy2 + 0.15, sz2, 0xFFAE22, 2, 1.5, 0.22);
                }
                if (p >= 1) {
                    // 落地引爆: 真实2D半径1.3m+小队前缘, 最多伤害3名士兵(走统一伤害入口)
                    var hitDist = Math.hypot(squad.x - b.tx, squad.z - b.tz);
                    var hitRadius = 1.3 + (squad.getHalfWidth ? squad.getHalfWidth() * 0.35 : 0.35);
                    if (hitDist <= hitRadius && squad.alive) {
                        var dmgCount = hitDist <= 0.85 ? 3 : 2;
                        if (squad.applySquadDamage) squad.applySquadDamage({ sourceType: 'thrower_bomb', damage: dmgCount, hitPosition: { x: b.tx, z: b.tz } }, this.effects);
                        else squad.killSoldiers(dmgCount, this.effects);
                    }
                    if (this.effects) {
                        if (this.effects.boom) this.effects.boom(b.tx, 0.45, b.tz, 1.45);
                        if (this.effects.explosion) this.effects.explosion(b.tx, 0.55, b.tz, 2);
                        else if (this.effects.shockwave) this.effects.shockwave(b.tx, 0.08, b.tz, 0xFF4422);
                        this.effects.burst(b.tx, 0.55, b.tz, 0xFF7A24, 14, 4.2, 0.5);
                        this.effects.burst(b.tx, 0.35, b.tz, 0x3A3A3A, 7, 2.4, 0.65);
                    }
                    if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom');
                    this._bombPool.push(b);
                    this.bombs.splice(bi, 1);
                }
            }
            this._bombInstances.count = this.bombs.length;
            if (this._bombFillInstances) this._bombFillInstances.count = this.bombs.length;
            this._bombRingInstances.count = this.bombs.length;
            if (this._bombInnerInstances) this._bombInnerInstances.count = this.bombs.length;
            for (var bj = 0; bj < this.bombs.length; bj++) {
                var bb = this.bombs[bj];
                var bp = Math.min(1, bb.t / bb.dur);
                var bx = bb.sx + (bb.tx - bb.sx) * bp;
                var bz = bb.sz + (bb.tz - bb.sz) * bp;
                var by = bb.sy * (1 - bp) + Math.sin(bp * Math.PI) * 3.1;
                var bScale = 1.0 + Math.sin(bp * Math.PI * 10) * 0.1;
                this._bombEuler.set(bp * 8.5, bp * 4.2, bp * 6.0);
                this._bombQuat.setFromEuler(this._bombEuler);
                this._bombMat4.compose(
                    this._bombPos.set(bx, by, bz),
                    this._bombQuat,
                    this._bombScale.set(bScale, bScale, bScale)
                );
                this._bombInstances.setMatrixAt(bj, this._bombMat4);
                // 危险区填充盘 + 外环
                this._bombMat4.makeScale(1, 1, 1);
                this._bombMat4.setPosition(bb.tx, 0.06, bb.tz);
                if (this._bombFillInstances) this._bombFillInstances.setMatrixAt(bj, this._bombMat4);
                this._bombMat4.setPosition(bb.tx, 0.075, bb.tz);
                this._bombRingInstances.setMatrixAt(bj, this._bombMat4);
                // 动态收缩倒计时环 (1.28 -> 0.12)
                var shrink = Math.max(0.12, 1.28 * (1 - bp));
                this._bombMat4.makeScale(shrink, 1, shrink);
                this._bombMat4.setPosition(bb.tx, 0.085, bb.tz);
                if (this._bombInnerInstances) this._bombInnerInstances.setMatrixAt(bj, this._bombMat4);
            }
            this._bombInstances.instanceMatrix.needsUpdate = true;
            if (this._bombFillInstances) this._bombFillInstances.instanceMatrix.needsUpdate = true;
            this._bombRingInstances.instanceMatrix.needsUpdate = true;
            if (this._bombInnerInstances) this._bombInnerInstances.instanceMatrix.needsUpdate = true;
        }
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    finishDeaths(dt,time,squad) {
        for(var i=this.enemies.length-1;i>=0;i--) {
            var e=this.enemies[i];if(!e.dying)continue;
            e.update(dt,time,squad,this,this.effects);
            if(e.removeReady){
                if (e._eliteAura) this._eliteAuraCount--;
                e.destroy(this.scene);this.enemies.splice(i,1);
            }
        }
        this.renderer.update(dt,time,this.enemies,squad.z);
    }

    /** 获取最近的活僵尸(子弹追踪用) V3.1: 只瞄准前方(e.z更小)的敌人 */
    getNearest(x, z, maxDist, exclude) {
        let best = null;
        let bestDist = maxDist || 20;
        for (const e of this.enemies) {
            if (!e.alive) continue;
            if (exclude && exclude.indexOf(e) >= 0) continue; // V10.1: 散弹pellets扇形多目标排除已瞄准者
            if (e.z > z + 1) continue; // 身后的敌人不瞄准
            const d = Math.hypot(e.z - z, (e.x - x) * .85);
            if (d < bestDist) {
                bestDist = d;
                best = e;
            }
        }
        return best;
    }

    get aliveCount() {
        let n = 0;
        for (const e of this.enemies) if (e.alive) n++;
        return n;
    }

    get encounterOutstanding() {
        return this.aliveCount + this.splitQueue.length + this.enemies.filter(e=>e.type==='split' && !e.alive && !e.deathHandled).length*2;
    }
}


/* ===== [[ js/combat.js ]] ===== */
// ===== 自动射击与弹道系统 =====

class CombatSystem {
    static get TRACER_COLORS() {
        return {
            rifle: 0xFFF8E8, shotgun: 0xFFE6C8, sniper: 0xFFFFFF, mg: 0xFFF0D4,
            flamethrower: 0xFF9C4A, rocket: 0xFF8852, freeze: 0x9EE8FF, tesla: 0xC8A6FF
        };
    }
    static get HEAVY_MUZZLE() { return { shotgun: 1, mg: 1, flamethrower: 1, rocket: 1 }; }
    constructor(scene, effects) {
        this.scene = scene;
        this.effects = effects;
        this.bullets = [];
        this.fireTimer = 0;

        // 弹道纹理: V12视觉 — 程序化曳光弹贴图(亮核弹头+长尾迹), 替代原SVG水滴形
        this._bulletTex = null;

        // 共享Sprite材质(所有子弹共用，减少DrawCall)
        // V3.6修复: 改用Normal混合(Additive在浅色路面上会加成纯白,弹道完全不可见)
        this._bulletMat = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 1,
            depthWrite: false
        });
        // 顺序修正(V12): 材质就绪后再挂贴图 — _makeTracerTexture 同步写 map, 必须在材质创建之后
        this._makeTracerTexture();
        this._bulletInstances=new THREE.InstancedMesh(new THREE.PlaneGeometry(1,1),this._bulletMat,CONFIG.BULLET_MAX_VISIBLE);
        this._bulletInstances.count=0;this._bulletInstances.frustumCulled=false;
        this._bulletInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
        this._bulletInstances.userData.artSource='V120 instanced ground tracer streaks / pooled bullet anchors';
        scene.add(this._bulletInstances);
        this._bulletMat.userData = { artSource: 'js/combat.js:_makeTracerTexture() 程序化曳光贴图 64x256 (CanvasTexture)' };
        // V12视觉: 曳光朝向(贴地掠过+尾部微抬向镜头), 不再逐帧拷贝相机四元数
        this._tracerQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2 + 0.42, 0, 0));
        this._tmpColor = new THREE.Color();

        // 弹道对象池 (锚点 + 曳光纹理, V16.3 略增宽提亮强化视觉弹幕层次, 不改真实伤害)
        this.pool = [];
        for (var i = 0; i < CONFIG.BULLET_MAX_VISIBLE; i++) {
            var sprite = new THREE.Object3D();
            sprite.visible = false;
            sprite.scale.set(0.38, 2.75, 1);
            this.pool.push(sprite);
        }
    }

    /** V19.1: 商业级高能战术曳光弹 — 炽白弹头激波 + 琥珀青金流光尾迹 (在深色战术路面上锐利醒目!) */
    _makeTracerTexture() {
        var c = document.createElement('canvas');
        c.width = 64; c.height = 256;
        var ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 64, 256);
        // 弹头前缘柔和等离子辉光晕
        var headGlow = ctx.createRadialGradient(32, 24, 2, 32, 24, 24);
        headGlow.addColorStop(0.0, 'rgba(255,252,220,0.95)');
        headGlow.addColorStop(0.45, 'rgba(56,189,248,0.42)');
        headGlow.addColorStop(1.0, 'rgba(56,189,248,0)');
        ctx.fillStyle = headGlow;
        ctx.fillRect(0, 0, 64, 56);
        // 外层锐利金橙高速曳光尾焰
        var tail = ctx.createLinearGradient(0, 10, 0, 248);
        tail.addColorStop(0.0, 'rgba(255,248,200,0.98)');
        tail.addColorStop(0.22, 'rgba(255,190,48,0.88)');
        tail.addColorStop(0.58, 'rgba(255,118,16,0.42)');
        tail.addColorStop(1.0, 'rgba(255,80,0,0)');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.moveTo(22, 18);
        ctx.lineTo(29, 248);
        ctx.lineTo(35, 248);
        ctx.lineTo(42, 18);
        ctx.lineTo(32, 3);
        ctx.closePath();
        ctx.fill();
        // 内层纯白超高速锐利弹芯
        var core = ctx.createLinearGradient(0, 6, 0, 188);
        core.addColorStop(0.0, '#FFFFFF');
        core.addColorStop(0.52, 'rgba(255,255,255,0.98)');
        core.addColorStop(1.0, 'rgba(255,240,180,0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.moveTo(28, 12);
        ctx.lineTo(30.6, 188);
        ctx.lineTo(33.4, 188);
        ctx.lineTo(36, 12);
        ctx.lineTo(32, 4);
        ctx.closePath();
        ctx.fill();
        this._bulletTex = new THREE.CanvasTexture(c);
        if (this._bulletMat) {
            this._bulletMat.map = this._bulletTex;
            this._bulletMat.needsUpdate = true;
        }
    }

    update(dt, squad, enemyManager, energyCore) {
        this._squad = squad; // V3.3: 供_fire读取穿透层数
        // === 射击逻辑 ===
        if (squad.count > 0 && squad.alive) {
            this.fireTimer -= dt;
            if (this.fireTimer <= 0) {
                var count = squad.count;
                // 视觉弹道频率: 随人数增长但有上限(性能保护)
                // V8.0.1: 吞吐曲线提升(×1.8→×2.2, 上限22→30, 池120容量内) — 大编制波次需要在行军窗口内被清空
                var visualRate = Math.min(2 + Math.sqrt(count) * 2.2, 30);
                this.fireTimer = 1 / visualRate;

                // 每发子弹伤害 = 总DPS / 视觉弹道频率
                var totalDPS = count * squad.getDamage() * squad.getFireRate();

                // 齐射数量: 1~5发(人数越多越多)
                var volley = Math.min(5, 1 + Math.floor(Math.sqrt(count) / 2.3)); // V8.0.1: 齐射曲线提升(÷2.6→÷2.3)
                var positions = squad.getShootPositions(volley);
                // A volley shares the squad DPS; giving every trail the full
                // budget multiplied damage by up to five. Keep fractional damage
                // so minimum-one rounding cannot inflate small squads either.
                // V13.1事实修正: 上行注释描述的是历史"齐射分摊"理想契约, 非当前交付口径。
                // 当前已交付契约 = max(1, round(totalDPS/visualRate))/发:
                // - 实证 v51 L3 在真实V12基线(totalDPS/visualRate/positions, 未取整)下稳定lost
                //   ×2, 在本公式下稳定胜利 — L3 可通关性依赖本口径;
                // - 9c32560 的"c95ef42 改动基线"归因有误(c95ef42 未改过此公式), 但公式本身
                //   是全部现行平衡门(v51/v80/vnext/v111-114)的校验口径, 予以保留;
                // - 与分摊理想契约的偏差属数值重校准事项, 已在 docs/V13/QA_REPORT.md 登记。
                var dmg = Math.max(1, Math.round(totalDPS / visualRate));
                if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('shoot'); // V5.0: 齐射音效(适配器内部限流)
                for (var k = 0; k < positions.length; k++) {
                    // V3.1: 每发子弹瞄准前方最近敌人(修复阵型散布导致5/7子弹打不中Boss的问题)
                    // V8.0.1: Boss存活时火力优先Boss — 修复杂兵吸引弹道导致Boss战输出饥饿(战损失衡)
                    var target = (enemyManager.boss && enemyManager.boss.alive)
                        ? enemyManager.boss
                        : enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE);
                    // V3.3: 暴击判定(开火时掷骰, 伤害×2)
                    var dmgFinal = dmg;
                    // V6.0: 狂暴技能伤害乘区
                    if (squad._skillRage) dmgFinal *= 1 + 0.35 * squad._skillRage;
                    // V8.0: 守护之怒组合 — 护盾可用时+25%
                    if (squad._comboGuardianFury && squad._skillShield > 0) dmgFinal *= 1.25;
                    // V8.0: 随机事件伤害buff(狂热时刻)
                    if (squad._evDmgMul) dmgFinal *= squad._evDmgMul;
                    // V6.0: 背水一战 — 人数低于一半时增伤
                    if (squad._skillBerserk && squad.count > 0 && squad._halfCount && squad.count <= squad._halfCount) {
                        dmgFinal *= 1 + 0.5 * squad._skillBerserk;
                    }
                    var isCrit = Math.random() < Math.min(0.8, squad.critChance + (squad._evCritBonus || 0)); // V8.0: 事件暴击buff
                    // V11.2: 处决者 — 暴击伤害乘区(2 + 0.25×层), 火力流派 +15%
                    var critMul = 2 + (squad._critMul || 0);
                    if (isCrit) dmgFinal *= critMul;
                    if (squad._comboFireFlow) dmgFinal *= 1.15;
                    this._fire(positions[k], dmgFinal, target, isCrit);
                    // V10.1: 散弹枪 pellets — 多发弹丸扇形铺散(其余弹丸依次瞄准相邻目标, 多目标AOE; 单目标时自然衰减)
                    var wpnPellets = squad._wpnPellets || 1;
                    if (wpnPellets > 1) {
                        var fanHit = [target];
                        for (var pi = 1; pi < wpnPellets; pi++) {
                            var fanTarget = enemyManager.getNearest(positions[k].x, positions[k].z, CONFIG.BULLET_RANGE, fanHit);
                            if (!fanTarget) break;
                            fanHit.push(fanTarget);
                            this._fire(positions[k], dmgFinal, fanTarget, isCrit);
                        }
                    }
                    // V10.1: 风暴机枪 dualLane — 平行双弹道(同目标, 双倍弹丸吞吐)
                    if (squad._wpnDualLane) {
                        this._fire({ x: positions[k].x + 0.38, y: positions[k].y, z: positions[k].z }, dmgFinal, target, isCrit);
                    }
                }
                // V16.1: 强化全队视觉弹幕与交错枪口火焰(纯视觉装饰弹道, damage=0 不影响任何数值平衡!)
                if (count >= 4 && this.pool.length > 16) {
                    var decoCount = Math.min(12, Math.floor(Math.sqrt(count) * 1.65));
                    var decoPos = squad.getShootPositions(decoCount);
                    var aliveList = enemyManager.enemies;
                    for (var dk = 0; dk < decoPos.length && this.pool.length > 10; dk++) {
                        // 分散瞄准不同怪兽, 展现真实扇面火力覆盖而非全挤在中央一条线
                        var decoTarget = null;
                        if (aliveList && aliveList.length > 0) {
                            var cand = aliveList[(dk * 3 + Math.floor(Math.random() * aliveList.length)) % aliveList.length];
                            if (cand && cand.alive && squad.z - cand.z > 0 && squad.z - cand.z < CONFIG.BULLET_RANGE) decoTarget = cand;
                        }
                        this._fire(decoPos[dk], 0, decoTarget, false, true);
                    }
                }
            }
        }

        // === 弹道更新与碰撞 ===
        for (var i = this.bullets.length - 1; i >= 0; i--) {
            var b = this.bullets[i];
            var oldZ = b.mesh.position.z;
            // VNext: 职业弹速乘区(重装机枪手 +25%)
            var bSpeed = CONFIG.BULLET_SPEED * (squad._classBulletSpeed || 1);
            var newZ = BattleKinematics.bulletZ(oldZ, bSpeed, dt); // V5.1: SHOOT_SIGN=-Z
            b.mesh.position.z = newZ;
            b.life -= dt;

            // V3.1: 弹道向目标x收敛(轻微追踪, 保证视觉上弹道汇聚到敌人身上)
            if (b.target && b.target.alive) {
                b.mesh.position.x = damp(b.mesh.position.x, b.target.x, 10, dt);
            }

            // 碰撞检测: 检查是否穿越僵尸Z面
            var hit = false;
            var enemies = enemyManager.enemies;
            for (var j = 0; j < enemies.length; j++) {
                var e = enemies[j];
                if (!e.alive) continue;
                // V3.3: 穿透弹不重复命中同一目标
                if (b.hitSet && b.hitSet.indexOf(e) >= 0) continue;
                // 子弹从前往后穿越僵尸位置
                // V13.1近距离盲区修复: 命中窗后沿 0.2→1.5 — 弹速28u/s(0.467/帧)时旧0.6深度
                // 窗口对近身目标(枪口前0.5-1.2单位)只开放~2帧, x收敛(damp λ=10, ~15%/帧)
                // 2帧内最多关闭1.26横向差; 近身目标横向差可达1.4-1.5(枪口姿态偏移+怪横移
                // 冻结位), 子弹逐发从怪侧面掠过(x在穿越后才收敛) → 永久不可命中 → 伏击怪
                // 驻足态打不死 → outstanding永不归零 → 状态门永久锁死(软锁)。
                // 延长后沿=曳光(长2.1)尾部仍覆在僵尸体上时允许命中, 给x收敛4-5帧; 远距离
                // 目标穿越面时x早已收敛, 命中帧不变; 不改变伤害数值。
                if (oldZ >= e.z - 1.5 && newZ <= e.z + 0.4) {
                    // V3.1: 命中窗加宽(0.7→0.9), Boss等大体型敌人按体型放大判定
                    var winX = e.isBoss ? 1.4 : 0.9;
                    if (Math.abs(b.mesh.position.x - e.x) < winX) {
                        // V15-ART-002: 装饰视觉弹道仅触发轻火花并回收, 绝对不结算伤害
                        if (b.decorative) {
                            if (this.effects && Math.random() < 0.45) {
                                this.effects.burst(b.mesh.position.x, 0.72, e.z, 0xFFE26A, 2, 1.8, 0.16);
                            }
                            hit = true;
                            break;
                        }
                        // V3.3: 冰冻弹 — 命中减速
                        if (squad.freezeStacks > 0 && !e.isBoss) {
                            e.frozenT = 0.9 + 0.45 * squad.freezeStacks;
                            if (!e._frozenFx) {
                                this.effects.burst(e.x, 0.5, e.z, 0x9AD8FF, 4, 1.8, 0.35);
                                e._frozenFx = true;
                            }
                        }
                        // 地狱火箭燃烧 — 持续3秒, 每秒25%弹丸伤害(每0.5秒结算)
                        if (squad._wpnBurn) {
                            e._burnT = 3;
                            e._burnDps = Math.max(e._burnDps || 0, b.damage * 0.25);
                            this.effects.burst(e.x, 0.8, e.z, 0xFF8833, 3, 1.5, 0.3);
                        }
                        // V6.0: 毒液弹头 — 命中附加中毒DoT(修复: 原实现从未挂载)
                        if (squad._skillVenom) {
                            var venomMul = squad._comboPlagueFury ? 2 : 1; // V8.0: 瘟疫狂怒×2
                            e._venomT = 2;
                            e._venomStacks = Math.min(3, (e._venomStacks || 0) + 1);
                            e._venomDps = Math.max(e._venomDps || 0, b.damage * 0.2 * squad._skillVenom * venomMul);
                            if (e._venomStacks === 1) this.effects.burst(e.x, 0.6, e.z, 0x88CC44, 3, 1.5, 0.3);
                        }
                        var hitDmg = b.damage;
                        // VNext: 神射狙击 — 对精英/Boss ×1.25
                        if (squad._classEliteMul && (e.isBoss || e.type === 'elite' || e.affixes)) {
                            hitDmg *= squad._classEliteMul;
                        }
                        var died = e.takeDamage(hitDmg, this.effects, b.mesh.position.x, b.crit);
                        // V5.1: 爆炸弹 — 命中溅射(半径1.7, 50%伤害, 最多4个邻近目标)
                        if (squad.explosive > 0) {
                            var splashR = 1.2 + 0.5 * squad.explosive;
                            var splashN = 0;
                            for (var si = 0; si < enemies.length && splashN < 4; si++) {
                                var se = enemies[si];
                                if (se === e || !se.alive) continue;
                                var sdx = se.x - e.x, sdz = se.z - e.z;
                                if (sdx * sdx + sdz * sdz < splashR * splashR) {
                                    se.takeDamage(b.damage * 0.5, this.effects, se.x, false);
                                    splashN++;
                                }
                            }
                            this.effects.burst(e.x, 0.6, e.z, 0xFF8833, 6, 2.5, 0.3);
                            // V12视觉: 爆炸弹命中白闪
                            if (this.effects.flash) this.effects.flash(e.x, 0.6, e.z, 0xFFB060, 1.5);
                        }
                        // V5.1: 连锁闪电 — 跳至最近(最多1+chain层)邻敌, 各受40%伤害
                        if (squad.chain > 0) {
                            var hops = squad.chain, last = e;
                            for (var hi = 0; hi < hops; hi++) {
                                var best = null, bestD = 9;
                                for (var ci = 0; ci < enemies.length; ci++) {
                                    var ce = enemies[ci];
                                    if (!ce.alive || ce === last || ce === e) continue;
                                    var cdx = ce.x - last.x, cdz = ce.z - last.z;
                                    var cd = Math.sqrt(cdx * cdx + cdz * cdz);
                                    if (cd < bestD) { bestD = cd; best = ce; }
                                }
                                if (!best) break;
                                best.takeDamage(b.damage * 0.4, this.effects, best.x, false);
                                this.effects.burst(best.x, 1.0, best.z, 0x66D9FF, 4, 2, 0.25);
                                last = best;
                            }
                        }
                        // 暴击/击杀反馈
                        if (died) {
                            if (b.crit) {
                                this.effects.floatText(e.x, 1.2, e.z, '暴击!', '#FF4444', true);
                            }
                            // V3.3: 吸血 — 击杀按层数概率回复1人
                            if (squad.vampStacks > 0 && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var vampProb = 0.12 * squad.vampStacks;
                                if (Math.random() < vampProb) {
                                    squad.addReinforcements(1, '吸血恢复', this.effects);
                                }
                            }
                            // V8.0: 回收无人机组合 — 3%概率补员
                            if (squad._comboRecycle && squad.count > 0 && squad.count < squad._maxLimit() && Math.random() < 0.03) {
                                squad.addReinforcements(1, '回收无人机', this.effects);
                            }
                            // V11.2: 亡者征召 — 5%×层概率补员(虫群流派×1.5)
                            if (squad._skillHarvest && squad.count > 0 && squad.count < squad._maxLimit()) {
                                var harvProb = 0.05 * squad._skillHarvest * (squad._comboSwarmFlow ? 1.5 : 1);
                                if (Math.random() < harvProb) {
                                    squad.addReinforcements(1, '亡者征召', this.effects);
                                }
                            }
                        }
                        hit = true;
                        // V3.3: 穿透 — 命中后不消失, 继续飞行
                        if (b.pierceLeft > 0) {
                            b.pierceLeft--;
                            if (!b.hitSet) b.hitSet = [];
                            b.hitSet.push(e);
                            hit = false; // 继续存在
                        }
                        break;
                    }
                }
            }

            // V6.0: 能源核心命中(穿越核心z面且横向命中)
            if (!hit && energyCore && energyCore.alive &&
                oldZ >= energyCore.z - 0.4 && newZ <= energyCore.z + 0.4 &&
                Math.abs(b.mesh.position.x - energyCore.x) < 1.6) {
                energyCore.takeBulletHit(b.damage, this.effects);
                hit = true;
            }

            // 超射程或命中: 回收
            if (hit || b.life <= 0 || newZ < squad.z - CONFIG.BULLET_RANGE) {
                b.mesh.visible = false;
                this.pool.push(b.mesh);
                this.bullets.splice(i, 1);
            }
        }

        // V6.0: 毒液DoT结算(每帧)
        if (enemyManager && enemyManager.enemies) {
            for (var vi = enemyManager.enemies.length - 1; vi >= 0; vi--) {
                var ve = enemyManager.enemies[vi];
                if (!ve.alive || (!ve._venomT && !ve._burnT)) continue; // V10.1: 燃烧DoT共入结算循环
                if (ve._venomT) {
                    ve._venomT -= dt;
                    ve._venomTick = (ve._venomTick || 0) - dt;
                    if (ve._venomTick <= 0) {
                        ve._venomTick = 0.5;
                        ve.takeDamage(ve._venomDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0x66DD44, 2, 1.5, 0.25);
                    }
                    if (ve._venomT <= 0) { ve._venomT = 0; ve._venomStacks = 0; }
                }
                // V10.1: 燃烧DoT结算(地狱火箭)
                if (ve._burnT) {
                    ve._burnT -= dt;
                    ve._burnTick = (ve._burnTick || 0) - dt;
                    if (ve._burnTick <= 0) {
                        ve._burnTick = 0.5;
                        ve.takeDamage(ve._burnDps * 0.5, this.effects, ve.x, false);
                        if (this.effects) this.effects.burst(ve.x, 1, ve.z, 0xFF8833, 2, 1.5, 0.25);
                    }
                    if (ve._burnT <= 0) { ve._burnT = 0; ve._burnDps = 0; }
                }
            }
        }

        // V8.0: 毒性护盾组合 — 格挡时毒化周围敌人(半径3, 每秒20%基础伤害×毒液层)
        if (squad._toxicWardPulse) {
            squad._toxicWardPulse = false;
            var wardDps = Math.max(1, Math.round(squad.getDamage() * 0.2 * Math.max(1, squad._skillVenom || 1)));
            for (var wi = 0; wi < enemyManager.enemies.length; wi++) {
                var we = enemyManager.enemies[wi];
                if (!we.alive) continue;
                var wdx = we.x - squad.x, wdz = we.z - squad.z;
                if (wdx * wdx + wdz * wdz < 9) {
                    we._venomT = 3;
                    we._venomStacks = Math.min(3, (we._venomStacks || 0) + 1);
                    we._venomDps = Math.max(we._venomDps || 0, wardDps);
                }
            }
            this.effects.shockwave(squad.x, 0.05, squad.z, 0x88CC44);
        }
    }

    _syncInstances() {
        this._bulletInstances.count=this.bullets.length;
        for(var i=0;i<this.bullets.length;i++) {
            var anchor=this.bullets[i].mesh;
            anchor.quaternion.copy(this._tracerQuat); // V12视觉: 贴地曳光朝向(弹头朝-Z, 尾部微抬)
            anchor.updateMatrix();this._bulletInstances.setMatrixAt(i,anchor.matrix);
            if (this.bullets[i].color !== undefined) this._bulletInstances.setColorAt(i, this._tmpColor.setHex(this.bullets[i].color));
        }
        this._bulletInstances.instanceMatrix.needsUpdate=true;
        if (this._bulletInstances.instanceColor) this._bulletInstances.instanceColor.needsUpdate = true;
    }

    // V14: 武器弹道色表 — 单材质+实例色实现 8 类弹道辨识(零额外drawCall)
    _tracerColor() {
        var wid = (this._squad && this._squad._gameRef && this._squad._gameRef._weaponStats) ? this._squad._gameRef._weaponStats.weaponId : null;
        return CombatSystem.TRACER_COLORS[wid] || CombatSystem.TRACER_COLORS.rifle;
    }
    _fire(pos, damage, target, isCrit, decorative) {
        var mesh = this.pool.pop();
        if (!mesh) return;
        mesh.visible = true;
        mesh.position.set(pos.x, pos.y, pos.z);
        if (decorative) mesh.scale.set(0.20, 1.70, 1);
        else if (isCrit) mesh.scale.set(0.36, 2.65, 1);
        else mesh.scale.set(0.25, 2.0, 1);
        this.bullets.push({
            mesh: mesh, damage: decorative ? 0 : damage, life: decorative ? 0.85 : 1.2,
            decorative: !!decorative,
            target: target || null,
            color: this._tracerColor(),
            crit: !!isCrit,
            pierceLeft: decorative ? 1 : (1 + (this._squad ? this._squad.pierce + (this._squad._evPierce || 0) + (this._squad._comboPierceFlow ? 1 : 0) : 0)),
            hitSet: null
        });

        // 枪口闪光 (V15: 增强全队齐射枪口火焰表现力)
        var wid = (this._squad && this._squad._gameRef && this._squad._gameRef._weaponStats) ? this._squad._gameRef._weaponStats.weaponId : 'rifle';
        var muzzleScale = decorative ? 1.05 : (CombatSystem.HEAVY_MUZZLE[wid] ? 1.65 : 1.38);
        this.effects.muzzleFlash(pos.x, pos.y, pos.z, muzzleScale);
    }

    clear() {
        for (var i = 0; i < this.bullets.length; i++) {
            this.bullets[i].mesh.visible = false;
            this.pool.push(this.bullets[i].mesh);
        }
        this.bullets = [];
        this.fireTimer = 0;
        this._bulletInstances.count=0;
    }
}


/* ===== [[ js/pacing.js ]] ===== */
// ===== V4.0 节奏控制器 (P0: 独立于帧率的战斗节奏) =====
// 职责: 波次激活 → 分批生成(间隔0.8-1.5s, 每批1-4只) → 场上活敌上限 → 波次结束 → Boss预警 → Boss出场
// 所有时间均为真实游戏秒(dt驱动), 与渲染帧率无关
// 纯逻辑: 敌人生成通过注入的spawnFn完成, 便于单测

class GamePacingController {
    constructor(game) {
        this.game = game || null;
        this.waves = [];
        this.spawnFn = null;        // function(type, x, z, hp) → Enemy
        this.onWaveStart = null;    // function(wave)
        this.onWaveClear = null;    // function(wave)
        this.onBossWarning = null;  // function(wave) — 预警开始
        this.onBossSpawn = null;    // function(wave)
        this.maxAliveFn = null;     // function() → 当前场上活敌数
        this.aliveCountFn = null;   // function() → 活敌数(判断波清)
        this.gateReadyFn = null;
    }

    /** 从关卡数据构建波次计划 */
    loadFromLevel(level, levelIndex, runtimeHordeBoost) {
        // V10 QA: 移除每关生产路径 console.log
        this.clear();
        var P = CONFIG.PACING;
        this.levelIndex = levelIndex || 0;
        this.runtimeHordeBoost = !!runtimeHordeBoost;
        var waveMultiplier = this.runtimeHordeBoost ? (CONFIG.ENEMY_WAVE_MULTIPLIER || 1) : 1;
        var previousGateZ = null;
        // V5.1.4: 标记最后一个波段(末波清尾驻停用)
        var lastWaveIdx = -1;
        for (var wi = 0; wi < level.segments.length; wi++) {
            if (level.segments[wi].type === 'wave') lastWaveIdx = wi;
        }
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            if (seg.type === 'wave') {
                var queue = [];
                for (var j = 0; j < seg.enemies.length; j++) {
                    for (var k = 0; k < seg.enemies[j].count * waveMultiplier; k++) {
                        queue.push(seg.enemies[j].type);
                    }
                }
                // Mix roles through the horde instead of spawning every shield
                // or splitter first. The authored roster is retained exactly.
                for (var qi = queue.length - 1; qi > 0; qi--) {
                    var swap = Math.floor(Math.random() * (qi + 1));
                    var held = queue[qi]; queue[qi] = queue[swap]; queue[swap] = held;
                }
                this.waves.push({
                    type: 'wave', z: seg.z,
                    requiredGateZ: previousGateZ,
                    index: this.waves.filter(function(w) { return w.type === 'wave'; }).length,
                    isFinal: i === lastWaveIdx,
                    triggerZ: seg.z + P.waveTriggerAhead,
                    queue: queue,
                    state: 'idle',          // idle|spawning|clearing|done
                    batchTimer: P.firstContactGrace,
                    total: queue.length,
                    pending: [],
                    emitTimer: 0,
                    spawned: 0
                });
            } else if (seg.type === 'boss') {
                this.waves.push({
                    type: 'boss', z: seg.z,
                    requiredGateZ: previousGateZ,
                    triggerZ: seg.z + P.bossTriggerAhead,
                    hp: seg.boss && seg.boss.hp ? seg.boss.hp : null,
                    state: 'idle',          // idle|warning|done
                    warnTimer: P.bossWarningTime
                });
            } else if (seg.type === 'gates') {
                previousGateZ = seg.z;
            }
        }
    }

    clear() {
        this.waves = [];
        this.restTimer = 0;
        this.activeWave = null;
    }

    /** V5.1: 当前关卡场上活敌上限(尸潮矩阵 CONFIG.MAX_ALIVE) */
    _maxAlive() {
        var matrix = CONFIG.MAX_ALIVE;
        var li = this.levelIndex || 0;
        if (matrix && matrix.length) {
            var base = matrix[Math.min(li, matrix.length - 1)];
            return Math.round(base * (this.runtimeHordeBoost ? (CONFIG.ENEMY_MAX_ALIVE_MULTIPLIER || 1) : 1));
        }
        var P = CONFIG.PACING;
        return Math.min(20, 10 + li);
    }

    /** V5.1.1: 批次规模加大(尸潮成堆涌现, 玩家反馈"怪物太少") */
    _batchSize(wave, aliveTarget) {
        var P = CONFIG.PACING;
        if(wave) {
            // V5.1.5: 批次≥目标活敌×1.25 — 一批就能把 alive 填到目标(旧按波总量/1.5切批,
            // 批间真空期被击杀清空, alive 永远只有批大小)
            var maxBatch = this.runtimeHordeBoost ? Math.max(144, P.batchSizeMax) : P.batchSizeMax;
            var ceiling=Math.min(maxBatch,Math.max(P.batchSizeBase,
                Math.ceil(wave.total/1.5), Math.ceil((aliveTarget||30)*1.25)));
            var floor=Math.max(P.batchSizeBase,ceiling-4);
            return floor+Math.floor(Math.random()*(ceiling-floor+1));
        }
        var effMax = Math.min(P.batchSizeMax, 2 + Math.floor((this.levelIndex || 0) / 2));
        return P.batchSizeBase + Math.floor(Math.random() * (effMax - P.batchSizeBase + 1));
    }

    _emit(w, squad) {
        if (!this.spawnFn || !w.pending.length) return false;
        // V16.1: 不规则错位有机尸潮长河 (奇偶排交错 + 自然横纵抖动, 打破整齐表格排排站!)
        var maxSlots = this.runtimeHordeBoost ? 156 : 48;
        var rowStep = this.runtimeHordeBoost ? 1.85 : 0.95;
        var slot = w.spawned % maxSlots;
        var col = slot % 6, row = Math.floor(slot / 6);
        var stagger = this.runtimeHordeBoost ? ((row % 2) ? 0.38 : -0.26) : 0;
        var jitterX = this.runtimeHordeBoost ? randRange(-0.42, 0.42) : randRange(-0.12, 0.12);
        var x = clamp((col - 2.5) * 1.06 + stagger + jitterX, -3.25, 3.25);
        var type = w.pending[0];
        var frontZ = Math.min(w.z - 1.5, squad.z - (CONFIG.PACING.spawnDistance || 14));
        var jitterZ = this.runtimeHordeBoost ? randRange(-0.45, 0.85) : randRange(0, 0.35);
        var z = frontZ - row * rowStep - jitterZ;
        // V16.2: 路边伏击怪 flanker 在队伍前方 6.5-11m 从左右护栏外侧翻越进路
        if (type === 'flanker') {
            x = (slot % 2 === 0 ? -1 : 1) * 5.2;
            z = squad.z - randRange(6.5, 11.0);
        }
        var enemy = this.spawnFn(type, x, z, null);
        if (enemy === false || enemy === null) return false;
        w.pending.shift();
        w.spawned++;
        return true;
    }

    /** 波次内部推进: 返回true表示有状态变化(供测试断言) */
    _updateWave(w, dt, squad) {
        var P = CONFIG.PACING;

        if (w.state === 'idle') {
            if (w.requiredGateZ !== null && this.gateReadyFn && !this.gateReadyFn(w, squad)) return false;
            if (squad.z <= w.triggerZ) {
                w.startedAt=this.game ? this.game.elapsedTime : null;
                if (w.type === 'boss') {
                    w.state = 'warning';
                    if (this.onBossWarning) this.onBossWarning(w);
                } else {
                    w.state = 'spawning';
                    w.batchTimer = P.firstContactGrace;
                    if (this.onWaveStart) this.onWaveStart(w);
                }
                return true;
            }
            return false;
        }

        if (w.state === 'warning') {
            w.warnTimer -= dt;
            if (w.warnTimer <= 0) {
                // Boss从波点再向屏幕外后退出生(禁止贴脸刷新), 出场后自行走近
                var bz = Math.min(w.z + P.bossSpawnSetback, squad.z - 11);
                if (this.spawnFn) this.spawnFn('boss', 0, bz, w.hp);
                w.state = 'done';
                if (this._onBossSpawnFx) this._onBossSpawnFx(); // V4.0: 入场震屏
                if (this.onBossSpawn) this.onBossSpawn(w);
                return true;
            }
            return false;
        }

        if (w.state === 'spawning') {
            w.batchTimer -= dt;
            w.emitTimer -= dt;
            var aliveTargetNow = Math.min(this._maxAlive(), Math.max(32, Math.round((squad.count || 1) * 1.4 + 15)));
            if(!w.pending.length && w.batchTimer<=0 && w.queue.length) {
                // Atomic ownership transfer: backpressure never discards a
                // queued actor; it remains in pending until it really spawns.
                w.pending=w.queue.splice(0,Math.min(this._batchSize(w, aliveTargetNow),w.queue.length));
                // V5.1.1: 同波后续批次密接(0.25-0.4s) — 批与批间alive持续堆积成墙
                w.batchTimer = w.spawned > 0
                    ? randRange(P.batchGapMin, P.batchGapMax)
                    : randRange(P.spawnIntervalMin, P.spawnIntervalMax);
            }
            // V5.1.2(玩家反馈"来超级多的"): 活敌目标控制器(填充-涓流反馈) —
            //   alive < ALIVE_TARGET → 快速填充(~30只/秒) 尸潮墙成形
            //   alive ≥ ALIVE_TARGET → 涓流(≈4.5只/秒) 缓慢逼近硬上限, 持续施压
            // Little定律(alive=spawn×TTK)下TTK随血量缩放平方增长, 速率公式不可解析 — 反馈控制最鲁棒。
            var alive = this.aliveCountFn ? this.aliveCountFn() : 0;
            // V5.1.5: 目标活敌随队伍规模自适应(count×1.4+15) × 波次进度因子(首波0.55温和开场, 末波1.0成墙)
            var cap = this._maxAlive();
            var targetCeiling = CONFIG.ALIVE_TARGET[Math.min(this.levelIndex || 0, CONFIG.ALIVE_TARGET.length - 1)];
            if (this.runtimeHordeBoost) targetCeiling = Math.round(targetCeiling * (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1));
            var targetFormula = Math.round(((squad.count || 1) * 1.5 + (this.runtimeHordeBoost ? 48 : 14)) *
                (this.runtimeHordeBoost ? (CONFIG.ENEMY_ALIVE_TARGET_MULTIPLIER || 1) : 1));
            var aliveTarget = Math.min(cap, targetCeiling, Math.max(this.runtimeHordeBoost ? 96 : 32, targetFormula));
            // V5.1.5 / V15-GAMEPLAY-002 双相出怪: 填充相迅速沿整条跑道铺满纵深尸潮长河
            if (alive < aliveTarget) {
                var creditCap = this.runtimeHordeBoost ? 10 : 3;
                w.fillCredit = Math.min(creditCap, (w.fillCredit || 0) + dt / P.fillFrameInterval);
                var budget = Math.floor(w.fillCredit);
                var emitted = 0;
                while (w.pending.length && emitted < budget && alive < aliveTarget) {
                    if (!this._emit(w, squad)) break;
                    emitted++; alive++; w.fillCredit--;
                }
                w.emitTimer = P.trickleInterval;
            } else if (w.pending.length && w.emitTimer <= 0 && alive < this._maxAlive()) {
                // V5.1.5: 涓流速率 = 小队对该类型怪的击杀速率 ×1.15(缓慢渗漏逼近硬上限) —
                // 怪墙保持在枪线内被逐层瓦解, 到达近战的怪≈击杀×15% → 压力与火力自动平衡
                this._emit(w, squad);
                w.emitTimer = P.trickleInterval;
            }
            if (w.queue.length === 0 && w.pending.length === 0) {
                w.state = 'clearing';
                w.spawnFinishedAt=this.game ? this.game.elapsedTime : null;
                return true;
            }
            return false;
        }

        if (w.state === 'clearing') {
            var remain = this.aliveCountFn ? this.aliveCountFn() : 0;
            if (remain === 0) {
                w.state = 'done';
                w.clearedAt=this.game ? this.game.elapsedTime : null;
                if (this.onWaveClear) this.onWaveClear(w);
                return true;
            }
        }
        return false;
    }

    update(dt, squad) {
        if (this.restTimer > 0) {
            this.restTimer = Math.max(0, this.restTimer - dt);
            return;
        }
        // Admit exactly one encounter. Boss summons belong to the encounter,
        // not another pacing wave; all timers use game seconds and reset.
        for (var i = 0; i < this.waves.length; i++) {
            var w = this.waves[i];
            if (w.state === 'done') continue;
            this.activeWave = w;
            this._updateWave(w, dt, squad);
            if (w.state === 'done') {
                this.activeWave = null;
                if (w.type === 'wave') this.restTimer = randRange(CONFIG.PACING.waveRestMin, CONFIG.PACING.waveRestMax);
            }
            break;
        }
    }

    /** V5.1.1(玩家反馈): 军团持续推进模式 — 波次期间不再停驻
     *  (停驻+怪物朝镜头涌来在视觉上等同"人物向后走/撤退", 用户实测否定)
     *  现在: 军团始终前进穿越尸潮, 怪群迎面而来, 相向运动产生"推进感"。
     *  Boss warning 保留停驻(决战前蓄势)。
     *  返回 null 表示不停(继续推进) */
    frontierStopZ() {
        var w = this.activeWave;
        if (this.runtimeHordeBoost && w && w.type === 'wave' &&
            (w.state === 'spawning' || w.state === 'clearing')) return w.z + 2;
        if (w && w.type === 'boss' && w.state === 'warning') return w.triggerZ - 1;
        // V5.1.4: 末波清尾驻停 — 全部涌出后(clearing)停驻清完残余, 进度条到头=清完=结算(用户反馈"进度条到头怪还在")
        if (w && w.type === 'wave' && w.isFinal && w.state === 'clearing') return w.z + 2;
        return null;
    }

    canChooseGate(z) {
        return this.waves.every(function(w) { return w.z < z || w.state === 'done'; });
    }

    /** V5.1.5 测试钩子: 强制所有波次完成(E2E组合式Boss遭遇用) */
    forceComplete() {
        for (var i = 0; i < this.waves.length; i++) this.waves[i].state = 'done';
        this.activeWave = null;
    }

    /** V5.1: 全部波次(含Boss)是否都已排空完成 */
    isComplete() {
        for (var i = 0; i < this.waves.length; i++) {
            if (this.waves[i].state !== 'done') return false;
        }
        return this.waves.length > 0;
    }

    /** 调试/测试: 当前波次状态摘要 */
    summary() {
        return this.waves.map(function(w) {
            return { type: w.type, z: w.z, state: w.state, queued: w.queue ? w.queue.length : 0, pending:w.pending?w.pending.length:0, spawned: w.spawned || 0,startedAt:w.startedAt,spawnFinishedAt:w.spawnFinishedAt,clearedAt:w.clearedAt };
        });
    }
}


/* ===== [[ js/platform/storage-adapter.js ]] ===== */
// ===== 存储适配器 (Phase 5 平台抽象层) =====
// 统一 localStorage / tt.getStorageSync / 内存兜底
// 接口: get(key, defaultValue) / set(key, value) / remove(key) / keys()

/** 内存存储兜底(隐私模式/无存储环境) */
class MemoryStorageAdapter {
    constructor() {
        this._map = {};
    }
    get(key, defaultValue) {
        var raw = this._map[key];
        if (raw === undefined) return defaultValue;
        try { return JSON.parse(raw); } catch (e) { return defaultValue; }
    }
    set(key, value) {
        try { this._map[key] = JSON.stringify(value); return true; } catch (e) { return false; }
    }
    remove(key) { delete this._map[key]; }
    keys() { return Object.keys(this._map); }
}

/** H5: window.localStorage */
class LocalStorageAdapter {
    constructor() {
        // 构造时探测可用性(隐私模式可能抛异常)
        this._available = false;
        try {
            var probe = '__pz_probe__';
            window.localStorage.setItem(probe, '1');
            window.localStorage.removeItem(probe);
            this._available = true;
        } catch (e) {
            this._available = false;
        }
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        if (!this._available) return this._fallback.get(key, defaultValue);
        try {
            var raw = window.localStorage.getItem(key);
            if (raw === null || raw === undefined) return defaultValue;
            return JSON.parse(raw);
        } catch (e) {
            return defaultValue;
        }
    }
    set(key, value) {
        if (!this._available) return this._fallback.set(key, value);
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            // 写满/被拒: 降级内存
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        if (this._available) { try { window.localStorage.removeItem(key); } catch (e) {} }
        this._fallback.remove(key);
    }
    keys() {
        if (!this._available) return this._fallback.keys();
        var out = [];
        try {
            for (var i = 0; i < window.localStorage.length; i++) {
                out.push(window.localStorage.key(i));
            }
        } catch (e) {}
        return out;
    }
}

/** 抖音小游戏: tt.getStorageSync / tt.setStorageSync */
class TtStorageAdapter {
    constructor(ttApi) {
        this._tt = ttApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._tt.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // tt 存储原样存取字符串; 兼容直接存对象的历史数据
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch (e) { return raw; }
            }
            return raw;
        } catch (e) {
            return this._fallback.get(key, defaultValue);
        }
    }
    set(key, value) {
        try {
            this._tt.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._tt.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._tt.getStorageInfoSync();
            return (info && info.keys) || [];
        } catch (e) {
            return this._fallback.keys();
        }
    }
}

/** 微信小游戏: wx.getStorageSync / wx.setStorageSync (V12 新增, 结构对齐 TtStorageAdapter) */
class WxStorageAdapter {
    constructor(wxApi) {
        this._wx = wxApi;
        this._fallback = new MemoryStorageAdapter();
    }
    get(key, defaultValue) {
        try {
            var raw = this._wx.getStorageSync(key);
            if (raw === '' || raw === undefined || raw === null) return defaultValue;
            // wx 存储原样存取字符串; 兼容直接存对象的历史数据
            if (typeof raw === 'string') {
                try { return JSON.parse(raw); } catch (e) { return raw; }
            }
            return raw;
        } catch (e) {
            return this._fallback.get(key, defaultValue);
        }
    }
    set(key, value) {
        try {
            this._wx.setStorageSync(key, JSON.stringify(value));
            return true;
        } catch (e) {
            return this._fallback.set(key, value);
        }
    }
    remove(key) {
        try { this._wx.removeStorageSync(key); } catch (e) {}
        this._fallback.remove(key);
    }
    keys() {
        try {
            var info = this._wx.getStorageInfoSync();
            return (info && info.keys) || [];
        } catch (e) {
            return this._fallback.keys();
        }
    }
}

/** 存储命名空间封装: 所有游戏键加前缀, 防冲突 */
class GameStorage {
    constructor(adapter) {
        this._adapter = adapter || new MemoryStorageAdapter();
        this.PREFIX = 'pz_squad_';
        // V12: 主键损坏标记键(损坏旧档保留现场, 便于诊断, 不静默覆盖)
        this.CORRUPT_SUFFIX = '.corrupt';
    }
    _k(key) { return this.PREFIX + key; }
    /**
     * V12: 带备份的写入 — 每次写主键同时镜像 .bak, 读损坏时回退上一份好数据。
     * 仅对关键存档启用(开销: 双份存储); 普通设置键走普通 get/set。
     */
    setSafe(key, value) {
        var okMain = false, okBak = false;
        try { okMain = this._adapter.set(this._k(key), value); } catch (e) {}
        try { okBak = this._adapter.set(this._k(key) + '.bak', value); } catch (e) {}
        return okMain && okBak;
    }
    /**
     * V12: 带备份的读取 — 主键 JSON 损坏时回退 .bak(上一份好数据)并修复主键;
     * 两份都损坏时保留现场(.corrupt 镜像), 返回 defaultValue, 不静默清零旧档。
     */
    getSafe(key, defaultValue) {
        var main = this._readValid(this._k(key));
        if (main.valid) return main.value;
        var bak = this._readValid(this._k(key) + '.bak');
        if (bak.valid) {
            // 主档损坏但备份完好: 用备份修复主档
            try { this._adapter.set(this._k(key), bak.raw); } catch (e) {}
            return bak.value;
        }
        // 双份都损坏: 保留损坏现场供诊断(仅首次), 不覆盖
        if (main.raw !== null || bak.raw !== null) {
            var markKey = this._k(key) + this.CORRUPT_SUFFIX;
            var already = this._adapter.get(markKey, null);
            if (!already) {
                try {
                    this._adapter.set(markKey, {
                        at: (typeof Date !== 'undefined' && Date.now) ? Date.now() : 0,
                        main: main.raw, bak: bak.raw
                    });
                } catch (e) {}
            }
        }
        return defaultValue;
    }
    /** 读原始串并校验 JSON; 返回 {valid, value, raw} */
    _readValid(fullKey) {
        var raw = null;
        try { raw = this._adapter.get(fullKey, null); } catch (e) { raw = null; }
        if (raw === null || raw === undefined) return { valid: false, value: null, raw: null };
        // 适配器已解析成功(对象/数字)即视为有效
        if (typeof raw === 'object' || typeof raw === 'number' || typeof raw === 'boolean') {
            return { valid: true, value: raw, raw: raw };
        }
        if (typeof raw === 'string') {
            try { return { valid: true, value: JSON.parse(raw), raw: raw }; } catch (e) {}
        }
        return { valid: false, value: null, raw: raw };
    }
    get(key, defaultValue) { return this._adapter.get(this._k(key), defaultValue); }
    set(key, value) { return this._adapter.set(this._k(key), value); }
    remove(key) {
        this._adapter.remove(this._k(key));
        this._adapter.remove(this._k(key) + '.bak');
        this._adapter.remove(this._k(key) + this.CORRUPT_SUFFIX);
    }
    keys() {
        var all = this._adapter.keys();
        var out = [];
        for (var i = 0; i < all.length; i++) {
            if (all[i].indexOf(this.PREFIX) === 0) out.push(all[i].slice(this.PREFIX.length));
        }
        return out;
    }
    /**
     * V12: 旧版裸 localStorage 键兼容读(h5 上历史键无前缀)。
     * 优先读命名空间键, 缺失再读裸键; 微信等新端无裸键直接走默认值。
     */
    getLegacy(key, defaultValue) {
        var v = this.get(key, undefined);
        if (v !== undefined && v !== null) return v;
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                var raw = window.localStorage.getItem(key);
                if (raw !== null && raw !== undefined) return raw;
            } catch (e) {}
        }
        return defaultValue;
    }
    /** V12: 写设置键(命名空间)并清理 h5 旧裸键, 保证单一数据源 */
    setLegacy(key, value) {
        this.set(key, String(value));
        if (typeof window !== 'undefined' && window.localStorage) {
            try { window.localStorage.removeItem(key); } catch (e) {}
        }
    }
}


/* ===== [[ js/platform/lifecycle-adapter.js ]] ===== */
// ===== 生命周期适配器 (Phase 5) =====
// 统一前后台切换 / 页面隐藏恢复事件: onHide / onShow
// H5: document.visibilitychange + window blur/focus
// 抖音: tt.onAppHide / tt.onAppShow

class LifecycleAdapter {
    constructor() {
        this._handlers = { hide: [], show: [] };
        this._isBackground = false;
    }

    /** 绑定平台事件(H5默认实现) */
    bind() {
        var self = this;
        // 页面隐藏 (切后台/锁屏/切标签)
        document.addEventListener('visibilitychange', function() {
            if (document.hidden) self._fire('hide');
            else self._fire('show');
        });
        // V5.0: 失焦兜底 — visibilitychange 均触发时两者幂等(_fire 有 isBackground 去重语义由消费方保证);
        // 部分安卓WebView只触发blur不触发visibilitychange, 作为补充信号。
        window.addEventListener('blur', function() {
            if (document.visibilityState !== 'hidden') self._fire('hide');
        });
        window.addEventListener('focus', function() {
            if (!document.hidden) self._fire('show');
        });
    }

    /** 抖音环境用此方法接入 tt.onAppHide/onAppShow */
    /** V12: 微信小游戏生命周期(wx.onShow/onHide), 与 bindTt 对齐 */
    bindWx(wxApi) {
        var self = this;
        if (wxApi && wxApi.onShow) wxApi.onShow(function() { self._fire('show'); });
        if (wxApi && wxApi.onHide) wxApi.onHide(function() { self._fire('hide'); });
    }
    bindTt(ttApi) {
        var self = this;
        if (ttApi.onAppHide) ttApi.onAppHide(function() { self._fire('hide'); });
        if (ttApi.onAppShow) ttApi.onAppShow(function() { self._fire('show'); });
    }

    on(event, fn) {
        if (this._handlers[event]) this._handlers[event].push(fn);
        return function() { this.off(event, fn); }.bind(this);
    }

    off(event, fn) {
        var list = this._handlers[event];
        if (!list) return;
        var idx = list.indexOf(fn);
        if (idx >= 0) list.splice(idx, 1);
    }

    isBackground() { return this._isBackground; }

    _fire(event) {
        if (event === 'hide') this._isBackground = true;
        if (event === 'show') this._isBackground = false;
        var list = this._handlers[event].slice();
        for (var i = 0; i < list.length; i++) {
            try { list[i](); } catch (e) { console.error('[Lifecycle]', e); }
        }
    }
}


/* ===== [[ js/platform/audio-adapter.js ]] ===== */
// ===== 音频适配器 (Phase 5 / V5.0) =====
// H5: WebAudio(合成音效, 无需资源文件) | 抖音小游戏: 无 AudioContext, V5.0 增加
//     tt.createInnerAudioContext 分支 — 播放前用合成参数现场生成 8bit WAV 数据 URI。
// 游戏无音频资源文件, 全部音效为程序化合成; 提供静音开关(持久化)。

class AudioAdapter {
    constructor(storage, platformId) {
        this._storage = storage;
        this._platform = platformId || 'h5';
        this._ctx = null;          // WebAudio 上下文(h5)
        this._ttPool = [];         // 抖音 InnerAudioContext 池(按音效类型预建)
        this._wxPool = [];         // V12: 微信 InnerAudioContext 池
        this._muted = storage ? !!storage.get('audio_muted', false) : false;
        this._enabled = false;
        this._lastPlay = {}; // 限流: 同一音效最小间隔
    }

    /** 惰性初始化(必须由用户手势触发, 平台限制) */
    init() {
        if (this._enabled) return true;
        try {
            if (this._platform === 'douyin' && typeof tt !== 'undefined' && tt.createInnerAudioContext) {
                this._enabled = true;
                return true;
            }
            // V12: 微信小游戏 — 优先 wx.createWebAudioContext(振荡器API与H5一致),
            // 不支持时回退 wx.createInnerAudioContext(合成WAV data URI, 结构对齐抖音分支)
            if (this._platform === 'wechat' && typeof wx !== 'undefined') {
                if (wx.createWebAudioContext) {
                    try {
                        this._ctx = wx.createWebAudioContext();
                        this._enabled = true;
                        return true;
                    } catch (e) { /* 落入 InnerAudio 回退 */ }
                }
                if (wx.createInnerAudioContext) {
                    this._enabled = true;
                    return true;
                }
                return false;
            }
            var AC = (typeof window !== 'undefined') && (window.AudioContext || window.webkitAudioContext);
            if (!AC) return false;
            this._ctx = new AC();
            this._enabled = true;
            return true;
        } catch (e) {
            console.warn('[Audio] 初始化失败', e);
            return false;
        }
    }

    /** 恢复上下文(iOS切后台后suspend) */
    resume() {
        if (this._ctx && this._ctx.state === 'suspended') {
            this._ctx.resume().catch(function() {});
        }
    }

    /** V5.0: 页面隐藏时暂停不必要的播放(WebAudio 全局挂起; 抖音由系统接管) */
    suspend() {
        if (this._ctx && this._ctx.state === 'running') {
            this._ctx.suspend().catch(function() {});
        }
    }

    isMuted() { return this._muted; }
    setMuted(m) {
        this._muted = !!m;
        if (this._storage) this._storage.set('audio_muted', this._muted);
    }

    /** 音效合成参数: freq起始Hz → end结束Hz, dur时长s, vol音量, wave波形 */
    static spec(type) {
        return {
            shoot: { freq: 880, end: 220, dur: 0.08, vol: 0.08, wave: 'square' },
            hit:   { freq: 320, end: 80,  dur: 0.1,  vol: 0.12, wave: 'triangle' },
            kill:  { freq: 520, end: 160, dur: 0.12, vol: 0.14, wave: 'square' },
            gate:  { freq: 440, end: 880, dur: 0.25, vol: 0.18, wave: 'sine' },
            grow:  { freq: 392, end: 784, dur: 0.18, vol: 0.16, wave: 'sine' },
            win:   { freq: 523, end: 1046, dur: 0.5, vol: 0.22, wave: 'sine' },
            lose:  { freq: 330, end: 110, dur: 0.6, vol: 0.2, wave: 'sawtooth' },
            click: { freq: 660, end: 660, dur: 0.05, vol: 0.1, wave: 'sine' },
            bossWarn: { freq: 150, end: 60, dur: 0.7, vol: 0.25, wave: 'sawtooth' },
            bossDie:  { freq: 200, end: 40, dur: 0.8, vol: 0.26, wave: 'sawtooth' },
            boom:     { freq: 130, end: 28, dur: 0.5, vol: 0.3, wave: 'sawtooth' }
        }[type] || { freq: 440, end: 440, dur: 0.1, vol: 0.1, wave: 'sine' };
    }

    /**
     * 合成音效
     * type: 'shoot'|'hit'|'kill'|'gate'|'grow'|'win'|'lose'|'click'|'bossWarn'|'bossDie'|'boom'
     * 限流避免大量士兵同时射击时的音频爆音
     */
    play(type) {
        if (!this._enabled || this._muted) return;
        var now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        var minGap = { shoot: 90, hit: 60, kill: 70, gate: 200, grow: 120, win: 0, lose: 0, click: 50, bossWarn: 0, bossDie: 0, boom: 150 }[type] || 80;
        if (this._lastPlay[type] && now - this._lastPlay[type] < minGap) return;
        this._lastPlay[type] = now;

        try {
            if (this._ctx) this._playWebAudio(type);
            else if (this._platform === 'douyin') this._playTt(type);
            else if (this._platform === 'wechat') this._playWx(type);
        } catch (e) { /* 音频失败不影响游戏 */ }
    }

    _playWebAudio(type) {
        var t = this._ctx.currentTime;
        var conf = AudioAdapter.spec(type);
        var osc = this._ctx.createOscillator();
        var gain = this._ctx.createGain();
        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.type = conf.wave;
        osc.frequency.setValueAtTime(conf.freq, t);
        osc.frequency.exponentialRampToValueAtTime(Math.max(1, conf.end), t + conf.dur);
        gain.gain.setValueAtTime(conf.vol, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + conf.dur);
        osc.start(t);
        osc.stop(t + conf.dur + 0.02);
    }

    /** V12: 微信回退路径 — InnerAudioContext 播放合成 WAV(与抖音分支同构) */
    _playWx(type) {
        if (typeof wx === 'undefined' || !wx.createInnerAudioContext) return;
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        var ctx = this._wxPool[type];
        if (!ctx) {
            ctx = wx.createInnerAudioContext();
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._wxPool[type] = ctx;
        }
        try { ctx.stop(); } catch (e) {}
        ctx.src = dataUri;
        ctx.play();
    }

    /** 抖音: 现场合成 8bit 单声道 WAV data URI, 经 InnerAudioContext 播放 */
    _playTt(type) {
        var conf = AudioAdapter.spec(type);
        var dataUri = this._synthWav(conf);
        // 池化复用: 每类型保留一个 context, 换 src 重播(抖音换src播完自动停)
        var ctx = this._ttPool[type];
        if (!ctx) {
            ctx = tt.createInnerAudioContext({ useWebAudioImplement: true });
            ctx.volume = Math.min(1, conf.vol * 4);
            ctx.loop = false;
            this._ttPool[type] = ctx;
        }
        ctx.stop();
        ctx.src = dataUri;
        ctx.play();
    }

    /** 生成简短包络振荡 WAV(8bit 8kHz, 长度=dur) */
    _synthWav(conf) {
        var rate = 8000, n = Math.max(1, Math.floor(conf.dur * rate));
        var bytes = new Uint8Array(n);
        var phase = 0;
        for (var i = 0; i < n; i++) {
            var t = i / rate;
            // 频率指数滑降/滑升
            var f = conf.freq + (conf.end - conf.freq) * (t / conf.dur);
            phase += f / rate;
            var wave;
            var frac = phase % 1;
            if (conf.wave === 'square') wave = frac < 0.5 ? 1 : -1;
            else if (conf.wave === 'sawtooth') wave = frac * 2 - 1;
            else if (conf.wave === 'triangle') wave = 1 - Math.abs(frac - 0.5) * 4;
            else wave = Math.sin(phase * Math.PI * 2);
            // 音量包络(快起慢落)
            var env = Math.min(1, i / (rate * 0.005)) * Math.pow(1 - t / conf.dur, 1.5);
            bytes[i] = Math.round(128 + wave * 100 * env) & 0xFF;
        }
        // 组装 WAV 文件头(PCM 8bit mono)
        var buf = new ArrayBuffer(44 + n);
        var view = new DataView(buf);
        var w = 0;
        function str(s) { for (var i = 0; i < s.length; i++) view.setUint8(w++, s.charCodeAt(i)); }
        function u32(v) { view.setUint32(w, v, true); w += 4; }
        function u16(v) { view.setUint16(w, v, true); w += 2; }
        str('RIFF'); u32(36 + n); str('WAVE'); str('fmt ');
        u32(16); u16(1); u16(1); u32(rate); u32(rate); u16(1); u16(8);
        str('data'); u32(n);
        new Uint8Array(buf, 44).set(bytes);
        // ArrayBuffer→base64: 抖音用 tt.arrayBufferToBase64, H5 用 btoa
        if (typeof tt !== 'undefined' && tt.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + tt.arrayBufferToBase64(buf);
        }
        // V12: 微信小游戏 wx.arrayBufferToBase64
        if (typeof wx !== 'undefined' && wx.arrayBufferToBase64) {
            return 'data:audio/wav;base64,' + wx.arrayBufferToBase64(buf);
        }
        var bin = '';
        var raw = new Uint8Array(buf);
        var chunk = 0x8000;
        for (var ci = 0; ci < raw.length; ci += chunk) {
            bin += String.fromCharCode.apply(null, raw.subarray(ci, ci + chunk));
        }
        return 'data:audio/wav;base64,' + btoa(bin);
    }
}


/* ===== [[ js/platform/share-adapter.js ]] ===== */
// ===== 分享适配器 (Phase 5) =====
// 抖音: tt.shareAppMessage | H5: 无系统分享时静默降级(不报错)

class ShareAdapter {
    constructor(platformId) {
        this._platform = platformId;
        this._tt = (typeof tt !== 'undefined') ? tt : null;
        this._wx = (typeof wx !== 'undefined') ? wx : null; // V12: 微信分享
    }

    /**
     * 分享游戏
     * @returns {Promise<boolean>} true=已调起分享 false=平台不支持/失败(静默降级)
     */
    share(opts) {
        opts = opts || {};
        if (this._platform === 'douyin' && this._tt && this._tt.shareAppMessage) {
            try {
                this._tt.shareAppMessage({
                    title: opts.title || '膨胀小队 - 招兵买马·火力全开',
                    desc: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                    success: function() {},
                    fail: function() {}
                });
                return Promise.resolve(true);
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        // V12: 微信小游戏 wx.shareAppMessage(主动分享, 静默失败不影响游戏)
        if (this._platform === 'wechat' && this._wx && this._wx.shareAppMessage) {
            try {
                this._wx.shareAppMessage({
                    title: opts.title || '膨胀小队 - 招兵买马·火力全开',
                    desc: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！'
                });
                return Promise.resolve(true);
            } catch (e) {
                return Promise.resolve(false);
            }
        }
        // H5: 尝试 navigator.share, 不支持则降级(V12: 小游戏环境无 navigator, 直接降级)
        if (typeof navigator !== 'undefined' && navigator.share) {
            return navigator.share({
                title: opts.title || '膨胀小队',
                text: opts.desc || '带你的小队冲穿状态门，击败僵尸Boss！',
                url: opts.url || location.href
            }).then(function() { return true; }).catch(function() { return false; });
        }
        return Promise.resolve(false);
    }
}


/* ===== [[ js/platform/platform.js ]] ===== */
// ===== 平台适配门面 (Phase 5) =====
// 运行时检测 H5 / 抖音小游戏 / 微信小游戏(预留), 装配各适配器
// 全局单例 Platform; 生产代码只依赖 Platform.*, 不直接触碰 window/tt/wx

/**
 * 平台检测:
 * - 抖音小游戏提供全局 tt 对象 (getSystemInfoSync/appId等)
 * - 微信小游戏提供全局 wx 对象
 * - 其余为浏览器H5
 */
function detectPlatform() {
    try {
        if (typeof tt !== 'undefined' && tt.getSystemInfoSync) return 'douyin';
        if (typeof wx !== 'undefined' && wx.getSystemInfoSync) return 'wechat';
    } catch (e) {}
    return 'h5';
}

class PlatformAdapter {
    constructor() {
        this.id = detectPlatform();
        this.tt = (this.id === 'douyin') ? tt : null;
        this.wx = (this.id === 'wechat') ? wx : null;

        // 存储适配器(V12: 微信端接入 wx 同步存储 — 原先误落内存存储导致存档不持久)
        if (this.id === 'douyin') this.storageAdapter = new TtStorageAdapter(this.tt);
        else if (this.id === 'wechat') this.storageAdapter = new WxStorageAdapter(this.wx);
        else if (this.id === 'h5') this.storageAdapter = new LocalStorageAdapter();
        else this.storageAdapter = new MemoryStorageAdapter();
        this.storage = new GameStorage(this.storageAdapter);

        // 生命周期
        this.lifecycle = new LifecycleAdapter();
        // 音频(V5.0: 传入平台ID, 抖音端走 tt.createInnerAudioContext 分支)
        this.audio = new AudioAdapter(this.storage, this.id);
        // 分享
        this.share = new ShareAdapter(this.id);
        // 广告服务(Phase 4): 由 ads/ad-service.js 装配
        this.ads = null;

        // 系统信息(屏幕/DPR/安全区)
        this.sysInfo = this._readSysInfo();
    }

    _readSysInfo() {
        var info = {
            platform: this.id,
            pixelRatio: (typeof window !== 'undefined' && window.devicePixelRatio) || 1,
            screenWidth: (typeof window !== 'undefined' && window.innerWidth) || 390,
            screenHeight: (typeof window !== 'undefined' && window.innerHeight) || 844,
            statusBarHeight: 0,
            safeArea: null
        };
        if (this.id === 'douyin' && this.tt.getSystemInfoSync) {
            try {
                var s = this.tt.getSystemInfoSync();
                info.pixelRatio = s.pixelRatio || info.pixelRatio;
                info.screenWidth = s.screenWidth || info.screenWidth;
                info.screenHeight = s.screenHeight || info.screenHeight;
                info.statusBarHeight = s.statusBarHeight || 0;
                info.safeArea = s.safeArea || null;
            } catch (e) {}
        }
        // V12: 微信小游戏系统信息(windowWidth/Height 为可用窗口尺寸, 用于 UI 视口)
        if (this.id === 'wechat' && this.wx && this.wx.getSystemInfoSync) {
            try {
                var w = this.wx.getSystemInfoSync();
                info.pixelRatio = w.pixelRatio || info.pixelRatio;
                info.screenWidth = w.windowWidth || w.screenWidth || info.screenWidth;
                info.screenHeight = w.windowHeight || w.screenHeight || info.screenHeight;
                info.statusBarHeight = w.statusBarHeight || 0;
                info.safeArea = w.safeArea || null;
                info.model = w.model || '';
                info.benchmarkLevel = (w.benchmarkLevel !== undefined) ? w.benchmarkLevel : -1;
            } catch (e) {}
        }
        return info;
    }

    /** 初始化(绑定生命周期等); 在游戏启动时调用一次 */
    initialize() {
        if (this.id === 'douyin') {
            this.lifecycle.bindTt(this.tt);
        } else if (this.id === 'wechat') {
            // V12修复: 微信走 wx.onShow/onHide — 原先误入 bind() 会触碰 document(小游戏无 document, 直接抛错)
            this.lifecycle.bindWx(this.wx);
        } else {
            this.lifecycle.bind();
        }
        // 显示/隐藏时暂停/恢复音频上下文(V5.0: hide侧补齐挂起)
        var self = this;
        this.lifecycle.on('show', function() { self.audio.resume(); });
        this.lifecycle.on('hide', function() { self.audio.suspend(); });
    }

    /** 是否小游戏环境(无完整DOM) */
    isMiniGame() { return this.id !== 'h5'; }
}

// 全局单例
var Platform = new PlatformAdapter();


/* ===== [[ js/ads/ad-service.js ]] ===== */
// ===== 广告服务核心 (Phase 4) =====
// 统一激励视频接口 + 幂等状态机 + 奖励事务账本
// 生产代码只依赖 AdService 门面; 平台实现见 web-mock-ad.js / douyin-ad.js / wechat-ad.js
//
// 铁律:
// 1. 只有平台回调确认"完整观看"才发奖 (抖音 isEnded=true / 模拟器点击"完成观看")
// 2. 每笔奖励有唯一 transactionId, 发奖前查 RewardLedger 防重复
// 3. 广告期间游戏必须暂停; 关闭/失败/中断都要恢复
// 4. 绝不伪造广告完成回调

/** 广告错误码 */
var AdError = {
    NOT_INITIALIZED: 'not_initialized',   // 未调用 initialize()
    NOT_AVAILABLE:   'not_available',     // 无可用广告位/平台不支持
    LOAD_FAILED:     'load_failed',       // 加载失败(网络等)
    SHOW_FAILED:     'show_failed',       // 展示失败
    ABANDONED:       'abandoned',         // 用户提前关闭(不发奖)
    INTERRUPTED:     'interrupted',       // 切后台/来电中断(不发奖)
    BUSY:            'busy',              // 已有广告流程进行中(防连点)
    TIMEOUT:         'timeout'            // V5.0: 展示超时兜底(平台回调丢失时不软锁死)
};

/** 广告场景(激励视频) */
var AdPlacement = {
    REVIVE:        'revive',         // 4.1 复活
    DOUBLE_REWARD: 'double_reward',  // 4.2 双倍结算
    REFRESH_GATES: 'refresh_gates',  // 4.3 状态门刷新
    FREE_SUPPLY:    'free_supply'    // V5.1 每日免费补给
};

/**
 * 奖励事务账本: 持久化已发奖的 transactionId, 跨页面刷新防重复发放
 */
class RewardLedger {
    constructor(storage) {
        this._storage = storage;
        this._granted = storage.get('ad_reward_ledger', {});
        // 清理7天前的旧事务(防止无限膨胀)
        var cutoff = Date.now() - 7 * 24 * 3600 * 1000;
        var changed = false;
        for (var id in this._granted) {
            if (this._granted[id].t < cutoff) { delete this._granted[id]; changed = true; }
        }
        if (changed) this._save();
    }
    _save() { this._storage.set('ad_reward_ledger', this._granted); }
    /** 是否已发放过 */
    has(transactionId) { return !!this._granted[transactionId]; }
    /** 标记发放 */
    mark(transactionId, meta) {
        if (this.has(transactionId)) return false;
        this._granted[transactionId] = { t: Date.now(), meta: meta || null };
        this._save();
        return true;
    }
}

/**
 * 广告服务门面(基类)
 * 平台实现子类需覆写: _doInitialize / _doIsAvailable / _doPreload / _doShow
 * _doShow(opts) 约定:
 *   opts.placement     广告场景
 *   opts.onComplete()  完整观看(唯一发奖入口)
 *   opts.onAbandon()   提前关闭
 *   opts.onError(err)  加载/展示失败
 *   opts.onInterrupt() 中断(切后台)
 */
class AdService {
    constructor(storage, lifecycle) {
        this._storage = storage;
        this._lifecycle = lifecycle;
        this._ledger = new RewardLedger(storage);
        // 状态机: idle -> requesting -> showing -> (settling) -> idle
        this._state = 'idle';
        this._requestId = null;
        this._pendingShow = null; // 进行中的 {resolve} 防连点
        this._initialized = false;
        this._rewardDelivered = false; // 本次展示是否已确认发奖(防平台重复回调)
    }

    /** 初始化(幂等) */
    initialize() {
        if (this._initialized) return;
        this._initialized = true;
        this._doInitialize();
        // 切后台中断当前广告
        if (this._lifecycle) {
            var self = this;
            this._lifecycle.on('hide', function() { self._onAppHide(); });
        }
    }

    /** 广告是否可用(平台支持且已配置广告位) */
    isAvailable() {
        if (!this._initialized) return false;
        return this._doIsAvailable();
    }

    /** 预加载(尽力而为, 失败静默) */
    preload() {
        if (!this._initialized || !this.isAvailable()) return Promise.resolve(false);
        return Promise.resolve(this._doPreload()).catch(function() { return false; });
    }

    /**
     * 展示激励视频
     * @param {string} placement AdPlacement
     * @returns {Promise<{status:'completed'|'abandoned'|'failed', reason?:string, transactionId?:string}>}
     *  - completed: 完整观看, transactionId 可发奖(调用方还需 ledger.mark 防重)
     *  - abandoned: 提前关闭, 不发奖
     *  - failed:    加载/展示失败/不支持/中断, 不发奖
     */
    showRewarded(placement) {
        var self = this;
        // 防连点/防重入
        if (this._state !== 'idle') {
            return Promise.resolve({ status: 'failed', reason: AdError.BUSY });
        }
        if (!this._initialized) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_INITIALIZED });
        }
        if (!this.isAvailable()) {
            return Promise.resolve({ status: 'failed', reason: AdError.NOT_AVAILABLE });
        }

        this._state = 'requesting';
        this._requestId = 'req_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
        this._rewardDelivered = false;

        return new Promise(function(resolve) {
            self._pendingShow = { resolve: resolve, placement: placement, requestId: self._requestId };
            self._state = 'showing';
            // V5.0: 超时兜底 — 平台onClose丢失(进程异常/系统弹窗遮挡)时游戏不得永久暂停。
            // 30s远超正常激励视频时长; 超时结算为failed(不发奖), 由调用方恢复游戏。
            self._showTimer = setTimeout(function() {
                if (self._state === 'showing' || self._state === 'requesting') {
                    self._settle('failed', AdError.TIMEOUT);
                }
            }, 30000);
            try {
                self._doShow({
                    placement: placement,
                    requestId: self._requestId,
                    onComplete: function() { self._settle('completed'); },
                    onAbandon:  function() { self._settle('abandoned'); },
                    onError:    function(code) { self._settle('failed', code); },
                    onInterrupt:function() { self._settle('failed', AdError.INTERRUPTED); }
                });
            } catch (e) {
                self._settle('failed', AdError.SHOW_FAILED);
            }
        });
    }

    dispose() {
        this._state = 'idle';
        this._pendingShow = null;
        this._doDispose();
    }

    // ---- 内部 ----

    /** 统一结算入口(状态机唯一出口, 幂等) */
    _settle(status, reason) {
        if (this._state === 'idle') return; // 已结算过(重复回调防护)
        var pending = this._pendingShow;
        this._state = 'idle';
        this._pendingShow = null;
        if (this._showTimer) { clearTimeout(this._showTimer); this._showTimer = null; } // V5.0: 清理超时兜底

        var result = { status: status, reason: reason || null };
        if (status === 'completed') {
            // 完整观看: 生成奖励事务ID(即使重复回调, transactionId 只生成一次)
            if (!this._rewardDelivered) {
                this._rewardDelivered = true;
                result.transactionId = 'txn_' + Date.now() + '_' + Math.floor(Math.random() * 1e6);
            } else {
                // 平台重复的完成回调: 不再发新事务
                result.status = 'failed';
                result.reason = 'duplicate_callback';
            }
        }
        if (pending) pending.resolve(result);
    }

    /** 切后台: 中断当前展示(不发奖) */
    _onAppHide() {
        if (this._state === 'showing' || this._state === 'requesting') {
            this._doInterrupt();
            this._settle('failed', AdError.INTERRUPTED);
        }
    }

    /** 发奖防护门: 调用方在拿到 completed+transactionId 后调用 */
    grantReward(transactionId, grantFn) {
        if (!transactionId) return false;
        if (this._ledger.has(transactionId)) return false;
        grantFn();
        this._ledger.mark(transactionId, {});
        return true;
    }

    // ---- 平台子类覆写 ----
    _doInitialize() {}
    _doIsAvailable() { return false; }
    _doPreload() {}
    _doShow(opts) { if (opts.onError) opts.onError(AdError.NOT_AVAILABLE); }
    _doInterrupt() {}
    _doDispose() {}
}


/* ===== [[ js/ads/web-mock-ad.js ]] ===== */
// ===== H5 测试广告模拟器 (Phase 4) =====
// 明确标注"测试广告", 不接真实广告SDK; 支持测试场景注入(自动化测试用)
// 规则与真实平台一致: 提前关闭不发奖 / 完整观看发奖 / 中断不发奖

class WebMockAdService extends AdService {
    constructor(storage, lifecycle, opts) {
        super(storage, lifecycle);
        this._opts = opts || {};
        // 测试场景: 'normal'(默认手动) | 'auto_complete'(自动完成) | 'auto_abandon'(自动提前关闭) | 'error'(加载失败)
        this._scenario = this._opts.scenario || 'normal';
        this._autoDuration = this._opts.autoDuration || 3; // 自动完成秒数
    }

    setScenario(s) { this._scenario = s; }

    _doInitialize() {
        // 创建DOM覆盖层(懒创建)
        this._ensureOverlay();
    }

    _doIsAvailable() {
        // 模拟器始终可用; 'error'场景模拟不可用
        return this._scenario !== 'error' || this._opts.errorAvailable === true;
    }

    _doPreload() { /* 模拟器无加载过程 */ }

    _doShow(opts) {
        var self = this;
        // 测试场景自动处置
        if (this._scenario === 'error') {
            setTimeout(function() { opts.onError(AdError.LOAD_FAILED); }, 60);
            return;
        }
        if (this._scenario === 'auto_complete') {
            // 模拟播放 autoDuration 秒后完成
            this._showOverlay(opts, this._autoDuration, true);
            return;
        }
        if (this._scenario === 'auto_abandon') {
            this._showOverlay(opts, this._autoDuration, false, function() {
                // 播放中自动"提前关闭"
                // V11 QA修复[P3]: 跟踪定时器并做归属校验 — 原实现未跟踪,
                // 若800ms内广告已被他路结算且新广告开启, 旧定时器会把新广告覆盖层藏掉
                if (self._abandonTimer) clearTimeout(self._abandonTimer);
                self._abandonTimer = setTimeout(function() {
                    self._abandonTimer = null;
                    if (self._current === opts) self._handleClose(opts, false);
                }, 800);
            });
            return;
        }
        // 默认: 手动交互
        this._showOverlay(opts, 0, false);
    }

    _doInterrupt() {
        // 切后台: 关闭覆盖层, 不发奖
        this._hideOverlay();
    }

    _doDispose() { this._hideOverlay(); }

    // ---- 模拟器UI ----
    _ensureOverlay() {
        if (this._overlay || typeof document === 'undefined') return;
        var self = this;
        var el = document.createElement('div');
        el.id = 'mock-ad-overlay';
        el.style.cssText = 'position:absolute;inset:0;z-index:60;display:none;flex-direction:column;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 35%,rgba(22,38,66,0.94),rgba(8,14,26,0.98));backdrop-filter:blur(6px);color:#F8FAFC;font-family:sans-serif;';
        el.innerHTML =
            '<div style="width:min(334px,88vw);padding:20px 18px 18px;border-radius:20px;background:linear-gradient(170deg,#182844 0%,#0E192D 65%,#091120 100%);border:2px solid #38BDF8;box-shadow:0 8px 0 #050B14,0 20px 48px rgba(0,0,0,0.78),inset 0 1px 0 rgba(186,230,253,0.35);text-align:center;">' +
            '<div style="display:inline-block;padding:3px 11px;border-radius:99px;background:rgba(56,189,248,0.16);border:1px solid rgba(56,189,248,0.55);font-size:10.5px;font-weight:900;color:#7DD3FC;letter-spacing:1.4px;margin-bottom:10px;">EMERGENCY RESCUE · 战地紧急救援</div>' +
            '<div style="width:100%;height:78px;border-radius:14px;background:radial-gradient(circle at 50% 60%,rgba(34,211,238,0.28),rgba(12,24,46,0.92));border:1.5px solid rgba(56,189,248,0.38);display:flex;align-items:center;justify-content:center;gap:14px;margin-bottom:10px;box-shadow:inset 0 0 18px rgba(56,189,248,0.18);">' +
                '<svg viewBox="0 0 64 64" width="58" height="58"><defs><linearGradient id="v19sh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#38BDF8"/><stop offset="1" stop-color="#0284C7"/></linearGradient></defs>' +
                '<path d="M12 22c0-11 9-17 20-17s20 6 20 17H12z" fill="url(#v19sh)" stroke="#BAE6FD" stroke-width="2"/>' +
                '<path d="M14 22l12 14M50 22L38 36M32 22v14" stroke="#7DD3FC" stroke-width="1.8"/>' +
                '<rect x="20" y="36" width="24" height="20" rx="5" fill="#1E293B" stroke="#FBBF24" stroke-width="2.2"/>' +
                '<path d="M32 41v10M27 46h10" stroke="#4ADE80" stroke-width="3.4" stroke-linecap="round"/></svg>' +
                '<div style="text-align:left;"><div style="font-size:18px;font-weight:900;color:#FFF7D6;text-shadow:0 2px 4px rgba(0,0,0,0.6);">呼叫特种空降支援</div><div style="font-size:11.5px;color:#7DD3FC;font-weight:700;margin-top:2px;">直升机空投兵力 · 全屏震退清场</div></div>' +
            '</div>' +
            '<div id="mock-ad-timer" style="font-size:38px;font-weight:900;color:#FBBF24;margin-bottom:6px;">3</div>' +
            '<div id="mock-ad-tip" style="margin-bottom:16px;"></div>' +
            '<div style="display:flex;flex-direction:column;gap:9px;">' +
            '<button id="mock-ad-finish" style="padding:13px 20px;font-size:16px;font-weight:900;background:linear-gradient(180deg,#FFE866 0%,#FFB319 52%,#E06200 100%);color:#231000;border:2px solid #FFF8C8;border-radius:14px;cursor:pointer;box-shadow:0 5px 0 #8A3500,0 8px 18px rgba(224,98,0,0.45);">⚡ 跳过广告 · 立即复活</button>' +
            '<button id="mock-ad-close" style="padding:10px 20px;font-size:13px;font-weight:800;background:linear-gradient(180deg,#1E293B,#0F172A);color:#94A3B8;border:1.5px solid #334155;border-radius:12px;cursor:pointer;">放弃救援 · 返回结算</button>' +
            '</div></div>';
        (document.getElementById('game-container') || document.body).appendChild(el);
        this._overlay = el;
        this._timerEl = el.querySelector('#mock-ad-timer');
        this._tipEl = el.querySelector('#mock-ad-tip');
        this._finishBtn = el.querySelector('#mock-ad-finish');
        this._closeBtn = el.querySelector('#mock-ad-close');
        this._finishBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, true);
        });
        this._closeBtn.addEventListener('click', function() {
            if (self._current) self._handleClose(self._current, false);
        });
    }

    /**
     * 显示覆盖层
     * @param opts 广告回调
     * @param countdown 自动完成倒计时(0=手动)
     * @param autoComplete 是否自动完成
     * 注: 无DOM环境(单测/小游戏)自动跳过UI, 仅保留计时与结算逻辑
     */
    _showOverlay(opts, countdown, autoComplete, afterShow) {
        this._current = opts;
        this._hideTimer();
        if (!this._overlay) {
            // 无DOM兜底: 纯逻辑模式
            if (countdown > 0 && autoComplete) {
                var self = this;
                this._autoTimer = setTimeout(function() {
                    if (self._current) self._handleClose(self._current, true);
                }, countdown * 1000);
            }
            if (afterShow) afterShow();
            return;
        }
        this._overlay.style.display = 'flex';
        if (countdown > 0) {
            var self2 = this;
            var remain = countdown;
            this._timerEl.textContent = remain;
            this._timerEl.style.display = 'block';
            this._tipEl.textContent = '模拟激励视频播放中…（完整观看才可领取奖励）';
            this._autoTimer = setInterval(function() {
                remain--;
                if (self2._timerEl) self2._timerEl.textContent = Math.max(0, remain);
                if (remain <= 0) {
                    self2._hideTimer();
                    if (autoComplete && self2._current) self2._handleClose(self2._current, true);
                }
            }, 1000);
            this._finishBtn.style.visibility = 'hidden';
            this._closeBtn.style.visibility = 'hidden';
            setTimeout(function() {
                self2._finishBtn.style.visibility = 'visible';
                self2._closeBtn.style.visibility = 'visible';
            }, 600);
        } else {
            this._timerEl.style.display = 'none';
            var peakN = (typeof window !== 'undefined' && window.__game && window.__game.maxCount) ? window.__game.maxCount : 6;
            var revN = Math.max(1, Math.min(12, Math.ceil(peakN * 0.4)));
            this._tipEl.innerHTML =
                '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-bottom:8px;">' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#4ADE80;">+' + revN + '人</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">恢复兵力</div></div>' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#38BDF8;">3秒</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">无敌护盾</div></div>' +
                    '<div style="padding:7px 4px;border-radius:10px;background:rgba(15,28,52,0.92);border:1px solid rgba(56,189,248,0.45);"><div style="font-size:16px;font-weight:900;color:#FBBF24;">清场</div><div style="font-size:10px;color:#94A3B8;margin-top:1px;">震退近敌</div></div>' +
                '</div>' +
                '<div style="font-size:11px;color:#FBBF24;font-weight:700;">本局剩余 1 次救援机会 · 开发模式可直接跳过</div>';
            this._finishBtn.style.visibility = 'visible';
            this._closeBtn.style.visibility = 'visible';
        }
        if (afterShow) afterShow();
    }

    _hideTimer() {
        // V11 QA修复[P3]: _autoTimer 可能承载 setTimeout(无DOM兜底路径)或 setInterval(DOM倒计时),
        // 原实现只用clearInterval — 两者同时调用确保两种句柄都能正确清除
        if (this._autoTimer) { clearTimeout(this._autoTimer); clearInterval(this._autoTimer); this._autoTimer = null; }
    }

    _hideOverlay() {
        this._hideTimer();
        if (this._abandonTimer) { clearTimeout(this._abandonTimer); this._abandonTimer = null; } // V11 QA: 一并清理提前关闭定时器
        if (this._overlay) this._overlay.style.display = 'none';
        this._current = null;
    }

    /** 关闭处置: completed=完整观看发奖 / 提前关闭不发奖 */
    _handleClose(opts, completed) {
        this._hideOverlay();
        if (completed) {
            if (opts.onComplete) opts.onComplete();
        } else {
            if (opts.onAbandon) opts.onAbandon();
        }
    }
}


/* ===== [[ js/ads/douyin-ad.js ]] ===== */
// ===== 抖音小游戏激励视频服务 (Phase 4 / V5.0 修复) =====
// 使用官方 tt.createRewardedVideoAd
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded 布尔真) 才算完整观看
// 广告位ID从平台配置读取(构建期由 tools/build-douyin.js 注入 window.__GAME_SETTINGS.ads.douyin);
// 未配置 → isAvailable()=false, 不伪造广告

class DouyinAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // V5.0修复: 旧代码引用从未赋值的this.tt导致初始化必然抛错(广告永不可用)。
        // tt 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局。
        this.tt = (typeof Platform !== 'undefined' && Platform.tt) ? Platform.tt
            : (typeof tt !== 'undefined' ? tt : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.douyin.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.douyin;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.tt || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
        try {
            this._rewardAd = this.tt.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等)
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
                // 展示中出错 → 结算为失败
                if (self._showing && self._current) {
                    self._showing = false;
                    if (self._current.opts.onError) self._current.opts.onError(AdError.SHOW_FAILED);
                }
            });
            // 关闭回调(唯一发奖判定点)
            this._rewardAd.onClose(function(res) {
                self._showing = false;
                var cur = self._current;
                if (!cur) return;
                self._current = null;
                if (res && (res.isEnded === true || res.isEnded === 1)) {
                    if (cur.opts.onComplete) cur.opts.onComplete();
                } else {
                    // 提前关闭
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[DouyinAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.tt && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            self._rewardAd.load()
                .then(function() { resolve(true); })
                .catch(function(err) { self._loadError = err; resolve(false); });
        });
    }

    _doShow(opts) {
        var self = this;
        if (!this._rewardAd) {
            opts.onError(AdError.NOT_AVAILABLE);
            return;
        }
        this._current = { opts: opts };
        this._showing = true;
        // V11 QA修复[P3]: 捕获广告实例引用 — 原重试链二次重读 this._rewardAd,
        // 若期间被dispose()置null则重试路径抛错(虽被catch兜底, 但语义混乱且依赖隐式null检查)
        var ad = this._rewardAd;
        ad.show()
            .catch(function(err) {
                // 展示失败: 尝试二次load后重试一次
                ad.load()
                    .then(function() { return ad.show(); })
                    .catch(function() {
                        self._showing = false;
                        self._current = null;
                        opts.onError(AdError.SHOW_FAILED);
                    });
            });
    }

    _doInterrupt() {
        // 抖音切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
        // onClose 若仍回调 isEnded=true 会被状态机幂等拦截(_settle 二次调用直接 return)。
        this._showing = false;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}


/* ===== [[ js/ads/wechat-ad.js ]] ===== */
// ===== 微信小游戏激励视频服务 (V12 正式实现) =====
// 使用官方 wx.createRewardedVideoAd — 结构与 DouyinAdService 一致
// 铁律: 仅 onClose 回调 res.isEnded === true (或 res.isEnded === 1) 才算完整观看并发放奖励
// 广告位ID从平台配置读取(构建期由 tools/build-wechat.js 注入 window.__GAME_SETTINGS.ads.wechat);
// 未配置 → isAvailable()=false, 上层如实降级, 不伪造广告, 不用 Mock 冒充正式广告
// 合规: 奖励发放经 AdService 状态机幂等结算 + RewardLedger 唯一事务ID防重复(grantReward),
//       切后台由 AdService._onAppHide 统一结算为 interrupted(不发奖)

class WechatAdService extends AdService {
    constructor(storage, lifecycle) {
        super(storage, lifecycle);
        // wx 句柄由 Platform 门面注入(平台检测时捕获), 小游戏环境兜底直接读全局
        this.wx = (typeof Platform !== 'undefined' && Platform.wx) ? Platform.wx
            : (typeof wx !== 'undefined' ? wx : null);
        this._rewardAd = null;
        this._loadError = null;
        this._showing = false;
    }

    /** 广告位ID: 优先构建期注入配置(window.__GAME_SETTINGS.ads.wechat.rewardVideo), 未配置返回空 */
    _adUnitId() {
        try {
            var s = (typeof window !== 'undefined' && window.__GAME_SETTINGS) || null;
            var units = s && s.ads && s.ads.wechat;
            return (units && units.rewardVideo) || '';
        } catch (e) { return ''; }
    }

    _doInitialize() {
        var self = this;
        if (!this.wx || !this._adUnitId()) return; // 无平台句柄/未配置广告位: 保持不可用
        try {
            this._rewardAd = this.wx.createRewardedVideoAd({ adUnitId: this._adUnitId() });
            // 平台错误(加载失败等): 记录并结算展示中的请求
            this._rewardAd.onError(function(err) {
                self._loadError = err || true;
                if (self._showing && self._current) {
                    self._showing = false;
                    if (self._current.opts.onError) self._current.opts.onError(AdError.SHOW_FAILED);
                }
            });
            // 关闭回调(唯一发奖判定点)
            this._rewardAd.onClose(function(res) {
                self._showing = false;
                var cur = self._current;
                if (!cur) return;
                self._current = null;
                if (res && (res.isEnded === true || res.isEnded === 1)) {
                    if (cur.opts.onComplete) cur.opts.onComplete();
                } else {
                    // 用户中途关闭 → 不发奖
                    if (cur.opts.onAbandon) cur.opts.onAbandon();
                }
                // 预加载下一次
                self._doPreload();
            });
        } catch (e) {
            console.error('[WechatAd] 初始化失败', e);
            this._rewardAd = null;
        }
    }

    _doIsAvailable() {
        return !!(this.wx && this._adUnitId() && this._rewardAd);
    }

    _doPreload() {
        var self = this;
        if (!this._rewardAd || !this._rewardAd.load) return Promise.resolve(false);
        return new Promise(function(resolve) {
            self._loadError = null;
            try {
                var p = self._rewardAd.load();
                if (p && p.then) {
                    p.then(function() { resolve(true); })
                     .catch(function(err) { self._loadError = err; resolve(false); });
                } else {
                    resolve(false);
                }
            } catch (e) {
                self._loadError = e;
                resolve(false);
            }
        });
    }

    _doShow(opts) {
        var self = this;
        if (!this._rewardAd) {
            opts.onError(AdError.NOT_AVAILABLE);
            return;
        }
        this._current = { opts: opts };
        this._showing = true;
        // 捕获广告实例引用 — 防 dispose 竞态(与抖音 V11 修复同构)
        var ad = this._rewardAd;
        try {
            var p = ad.show();
            if (p && p.catch) {
                p.catch(function(err) {
                    // 展示失败: 尝试二次 load 后重试一次
                    var lp = ad.load && ad.load();
                    var loadP = (lp && lp.then) ? lp : Promise.resolve();
                    loadP.then(function() { return ad.show(); })
                        .catch(function() {
                            self._showing = false;
                            self._current = null;
                            opts.onError(AdError.SHOW_FAILED);
                        });
                });
            }
        } catch (e) {
            self._showing = false;
            self._current = null;
            opts.onError(AdError.SHOW_FAILED);
        }
    }

    _doInterrupt() {
        // 微信切后台由系统接管视频; AdService._onAppHide 已统一结算为 interrupted(不发奖),
        // onClose 若仍回调 isEnded=true 会被状态机幂等拦截(_settle 二次调用直接 return)。
        this._showing = false;
    }

    _doDispose() {
        if (this._rewardAd && this._rewardAd.destroy) {
            try { this._rewardAd.destroy(); } catch (e) {}
        }
        this._rewardAd = null;
    }
}


/* ===== [[ js/ads/game-ad-coordinator.js ]] ===== */
// ===== 游戏广告协调器 (Phase 4) =====
// 把 AdService 接到游戏规则上:
//   4.1 复活: 每局最多1次; 发奖后恢复50%人数(至少5人), 短暂无敌2.5s
//   4.2 双倍结算: 每次通关最多领1次双倍
//   4.3 状态门刷新: 每局有限次数(默认2次); 刷新后重新生成当前段三选一门, 不重复发旧门奖励
// 所有奖励走 ledger 幂等; 广告展示前后由外部回调暂停/恢复游戏

var AD_RULES = {
    REVIVE_MAX_PER_RUN: 1,
    DOUBLE_MAX_PER_RUN: 1,
    GATE_REFRESH_MAX_PER_RUN: 2,
    REVIVE_RATIO: 0.5,        // 复活恢复比例(相对失败前最大人数)
    REVIVE_MIN: 5,
    REVIVE_INVINCIBLE_SEC: 2.5
};

class GameAdCoordinator {
    /**
     * @param adService AdService 实例
     * @param hooks { pauseGame(), resumeGame(), onReviveReward(count, invincibleSec), onDoubleReward(), onGatesRefresh(), canRefreshGates() }
     */
    constructor(adService, hooks) {
        this._ads = adService;
        this._hooks = hooks || {};
        // 每局计数器(startRun时重置)
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        // 进行中标记(防UI连点)
        this._busy = false;
    }

    /** 新一局开始: 重置次数限制 */
    startRun() {
        this._runCounters = { revive: 0, double: 0, gateRefresh: 0 };
        this._busy = false;
    }

    // ---- 能力查询(UI按钮置灰用) ----
    canShowAds() { return this._ads && this._ads.isAvailable(); }
    canRevive() { return this.canShowAds() && this._runCounters.revive < AD_RULES.REVIVE_MAX_PER_RUN; }
    canDoubleReward() { return this.canShowAds() && this._runCounters.double < AD_RULES.DOUBLE_MAX_PER_RUN; }
    canRefreshGates() { return this.canShowAds() && this._runCounters.gateRefresh < AD_RULES.GATE_REFRESH_MAX_PER_RUN; }
    getGateRefreshLeft() { return Math.max(0, AD_RULES.GATE_REFRESH_MAX_PER_RUN - this._runCounters.gateRefresh); }

    /**
     * 通用展示流程: 暂停游戏 → 展示 → 结算(幂等发奖) → 恢复游戏
     * @returns {Promise<boolean>} 是否发放了奖励
     */
    _showAndGrant(placement, grantFn) {
        var self = this;
        if (this._busy) return Promise.resolve(false);
        if (!this._ads.isAvailable()) return Promise.resolve(false);
        this._busy = true;
        if (this._hooks.pauseGame) this._hooks.pauseGame();
        return this._ads.showRewarded(placement).then(function(result) {
            var granted = false;
            if (result.status === 'completed' && result.transactionId) {
                // V11 QA修复[P2]: 发奖回调抛错时仍必须 resumeGame + 复位_busy,
                // 否则游戏永久暂停且广告系统卡死(上游调用点无.catch兜底)
                try {
                    granted = self._ads.grantReward(result.transactionId, grantFn);
                } catch (e) {
                    console.error('[AdCoordinator] grant callback failed:', e);
                }
            }
            if (self._hooks.resumeGame) self._hooks.resumeGame();
            self._busy = false;
            return granted;
        });
    }

    /** 4.1 激励视频复活(失败界面按钮) V3.5: 次数在请求时消耗(防授奖竞态), 奖励仍由幂等账本保证 */
    requestRevive(maxCountBeforeDeath) {
        var self = this;
        if (!this.canRevive()) return Promise.resolve(false);
        this._runCounters.revive++;
        return this._showAndGrant(AdPlacement.REVIVE, function() {
            var reviveCount = Math.max(AD_RULES.REVIVE_MIN,
                Math.floor((maxCountBeforeDeath || 10) * AD_RULES.REVIVE_RATIO));
            if (self._hooks.onReviveReward) {
                self._hooks.onReviveReward(reviveCount, AD_RULES.REVIVE_INVINCIBLE_SEC);
            }
        });
    }

    /** 4.2 双倍结算(胜利界面按钮) */
    requestDoubleReward() {
        var self = this;
        if (!this.canDoubleReward()) return Promise.resolve(false);
        this._runCounters.double++;
        return this._showAndGrant(AdPlacement.DOUBLE_REWARD, function() {
            if (self._hooks.onDoubleReward) self._hooks.onDoubleReward();
        });
    }

    /** V5.1 每日免费补给(首页按钮): 随机人数/伤害/射速补给 → 下一局生效 */
    requestFreeSupply() {
        return this._showAndGrant(AdPlacement.FREE_SUPPLY, function() {});
    }

    /** 4.3 状态门刷新(战斗中按钮) */
    requestGateRefresh() {
        var self = this;
        if (!this.canRefreshGates()) return Promise.resolve(false);
        if (this._hooks.canRefreshGates && !this._hooks.canRefreshGates()) {
            return Promise.resolve(false); // 当前无未触发的门可刷新
        }
        this._runCounters.gateRefresh++;
        return this._showAndGrant(AdPlacement.REFRESH_GATES, function() {
            if (self._hooks.onGatesRefresh) self._hooks.onGatesRefresh();
        });
    }
}

/**
 * 广告服务装配: 按平台选择实现
 *   抖音=真实SDK(需构建期注入广告位ID) / 微信=预留 / H5=仅开发测试环境装配Mock
 * V5.0 生产隔离: H5 生产部署没有真实广告SDK, 不得把"测试广告模拟器"当商业广告发放奖励 —
 *   仅 localhost/file 环境装配 WebMock(?adtest= 场景注入同样仅限本地, V10 QA 收紧); 其余H5环境广告如实降级不可用(按钮自动隐藏)。
 * 供 Platform.initialize() 后的引导脚本调用。
 */
function isLocalDevHost() {
    if (typeof location === 'undefined') return false;
    if (location.protocol === 'file:') return true;
    var h = String(location.hostname || '');
    return h === 'localhost' || h === '127.0.0.1' || h === '::1' || h === '[::1]';
}

function setupAdService() {
    var svc;
    if (Platform.id === 'douyin') {
        svc = new DouyinAdService(Platform.storage, Platform.lifecycle);
    } else if (Platform.id === 'wechat') {
        svc = new WechatAdService(Platform.storage, Platform.lifecycle);
    } else if (isLocalDevHost()) { // V10 QA修复: ?adtest= 场景注入收紧到本地开发环境(原条件让线上用户可用URL参数激活自动完成测试广告)
        // H5 开发/测试环境: 明确标注的测试广告模拟器(支持 ?adtest= 场景注入)
        svc = new WebMockAdService(Platform.storage, Platform.lifecycle, {
            scenario: (typeof window !== 'undefined' && window.__AD_TEST_SCENARIO) || 'normal'
        });
    } else {
        // 生产H5: 无真实广告SDK, 广告功能不可用(复活/双倍/刷门入口自动隐藏), 不伪造完成回调
        svc = null;
    }
    if (svc) svc.initialize();
    Platform.ads = svc;
    return svc;
}


/* ===== [[ js/game.js ]] ===== */
// ===== 游戏主控制器: 循环/输入/UI/胜负 =====

class Game {
    constructor() {
        var self = this;
        this.canvas = document.getElementById('game-canvas');
        this.world = new World(this.canvas);
        // 按画质等级调整池大小
        var q = this.world.quality;
        if (q === 0) {
            CONFIG.BULLET_MAX_VISIBLE = 50;
            CONFIG.PARTICLE_MAX = 120;
        } else if (q === 1) {
            CONFIG.BULLET_MAX_VISIBLE = 90;
            CONFIG.PARTICLE_MAX = 220;
        }
        this.effects = new Effects(this.world.scene);
        // V5.1: 永久档案(金币/升级/解锁) — Squad 构造时注入以读取永久属性
        this.profile = (typeof GameProfile !== 'undefined' && Platform.storage)
            ? new GameProfile(Platform.storage, Platform.storageAdapter) : null;
        this.shop = (typeof UpgradeShop !== 'undefined') ? UpgradeShop : null;
        this.squad = new Squad(this.world.scene, this.profile);
        this.squad._gameRef = this; // V11.5修复: 原惰性挂到首帧squad.update — 启动前读取武器/职业/科技乘区全部静默失效
        this.gates = new GateSystem(this.world.scene);
        this.enemies = new EnemyManager(this.world.scene, this.effects);
        this.combat = new CombatSystem(this.world.scene, this.effects);
        // V4.0: 节奏控制器 — 分批刷怪/场上上限/Boss预警(替代整波同帧生成)
        this.pacing = new GamePacingController(this);
        this.pacing.spawnFn = function(type, x, z, hp) {
            // Enemy health depends on the encounter, never on the player's upgrades.
            if (type !== 'boss' && !hp) {
                var refHp = (CONFIG.ZOMBIE[type] || CONFIG.ZOMBIE.normal).hp;
                // V8.0: 越界防御 — 乘数缺失时用末档而不是静默回退基础血量
                var hpMul = CONFIG.ENEMY_HP_MULTIPLIER[Math.min(self.levelIndex, CONFIG.ENEMY_HP_MULTIPLIER.length - 1)] || 1.7;
                hp = Math.round(refHp * hpMul);
            }
            // V4.0: Boss血量按出场时队伍战力动态缩放 — 任何策略/养成水平都面临~8-12s Boss战
            if (type === 'boss') {
                // V5.1.3: Boss血量 = 人数×DPS双因子(人数=防御/竞速生存, DPS=输出) —
                // V8.0.1: 恢复在重构中丢失的双因子公式: hp = clamp(count×totalDPS×0.5, 关卡值×0.5, 关卡值×12)
                // 战斗时长 ≈ 0.5×count/(0.8×volley) ≈ 9-12s, 与养成水平无关。
                var base = hp || CONFIG.ZOMBIE.boss.hp;
                var bossDps = self.squad.count * self.squad.getDamage() * self.squad.getFireRate();
                var dualFactor = Math.max(base * 0.5, Math.min(self.squad.count * bossDps * 0.5, base * 12));
                hp = Math.round(dualFactor);
            }
            if(type==='boss' && self.enemies.bossStyle==='twinelite') {
                self.enemies.spawnEnemy(type,-1.1,z,hp/2,'elite');
                return self.enemies.spawnEnemy(type,1.1,z,hp/2,'elite');
            }
            return self.enemies.spawnEnemy(type, x, z, hp);
        };
        this.pacing.aliveCountFn = function() { return self.enemies.encounterOutstanding; };
        this.pacing.gateReadyFn = function(w, squad) {
            return self.gates.isRowChosen(w.requiredGateZ) && squad.z <= w.requiredGateZ - 1.5;
        };
        this.pacing.onWaveStart = function(w) {
            self._waveNoticeT=CONFIG.PACING.firstContactGrace;
            var el=document.getElementById('v42-wave-banner');
            if(el){el.textContent='怪潮接近 · 准备射击';el.classList.remove('hidden');}
        };
        this.pacing.onWaveClear = function(w) {
            if (self.effects && self.state === 'playing') {
                self.effects.floatText(self.squad.x, 2.2, self.squad.z - 1.5, '波次清除!', '#66D68F', false);
            }
        };
        this.pacing.onBossWarning = function(w) { self._showBossWarning(true); };
        // V4.0 爽感: 乘法门慢动作+震屏 / Boss入场爆发
        this.gates.onMul = function(g) { self._slowmo(); self.world.shake(0.22); };
        this.pacing._onBossSpawnFx = function() { self.world.shake(0.5); };
        this.pacing.onBossSpawn = function(w) { self._showBossWarning(false); };
        // V3.4: 广告协调器(复活/双倍/刷门; Platform.ads已在页面引导装配)
        this.adCoord = (typeof GameAdCoordinator !== 'undefined' && window.__adService)
            ? new GameAdCoordinator(window.__adService, {
                pauseGame: function() { self.paused = true; },
                resumeGame: function() { self.paused = false; },
                onReviveReward: function(count, invSec) { self._applyRevive(count, invSec); },
                onDoubleReward: function() { self._onDoubleReward(); },
                onGatesRefresh: function() { self._onGatesRefreshed(); },
                canRefreshGates: function() { return self._hasRerollableGates(); }
            })
            : null;
        this._doubleTaken = false;

        this.state = 'idle'; // idle | playing | won | lost
        // V4.0: 慢动作(乘法门/Boss击杀) — dt缩放, UI与输入不受影响
        this._timeScale = 1;
        this._slowmoT = 0;
        this.levelIndex = 0;
        this.time = 0;
        this.lastTime = 0;
        this.bossSpawned = false;
        this.bossDefeated = false;
        this.paused = false;
        // 统计
        this.kills = 0;
        this.maxCount = 0;
        this.elapsedTime = 0;
        // V3.3: 连杀系统
        this.combo = 0;
        this.comboTimer = 0;
        this.maxCombo = 0;
        this._prevKillCount = 0;
        this._comboMilestone = 0;
        this._comboFeedbackCooldown = 0;
        // 性能统计
        this._fpsEma = 0;
        this._frameTimes = [];
        // 属性变化追踪(触发动画)
        this._prevDamage = 1;
        this._prevFireRate = 2.2;
        // 人数气泡3D投影用临时向量
        this._badgeV = new THREE.Vector3();

        // 待机画面: V5.0 首页军团展示 — 12人士兵方阵行进姿态(原1人被面板遮挡)
        this._setupIdleShowcase();

        this._setupInput();
        this._setupUI();
        this._setupDebugPanel(); // V3.7: ?debug=1 显示运行时美术/性能面板
        V42Art.installUI(this);
        this._bindHomeButtons(); // V10 QA: 动态首页按钮绑定(依赖 installUI 创建的 DOM)
        if (typeof V60UI !== 'undefined') V60UI.install(this);
        if (typeof ArtUI !== 'undefined') ArtUI.install(this);
        // 本地试玩测试模式 (?test=1 且仅限 localhost/127.0.0.1 生效, 正式线上环境完全关闭)
        if (typeof location !== 'undefined' && (location.hostname === 'localhost' || location.hostname === '127.0.0.1') && location.search.indexOf('test=1') !== -1 && this.profile) {
            this.profile.data.unlockedLevel = LEVELS.length;
            if ((this.profile.data.coins || 0) < 9999) this.profile.data.coins = 9999;
            this.profile.data.upgrades = this.profile.data.upgrades || {};
            ['skill_airstrike', 'skill_cryo', 'skill_overdrive', 'skill_tornado'].forEach(function(sk) {
                if ((this.profile.data.upgrades[sk] || 0) < 2) this.profile.data.upgrades[sk] = 2;
            }, this);
            this.profile.save();
            if (this._refreshLevelSelect) this._refreshLevelSelect();
            if (this._refreshCoinDisplays) this._refreshCoinDisplays();
            if (this._refreshShop) this._refreshShop();
        }

        this._loop = this._loop.bind(this);
        requestAnimationFrame(this._loop);
    }

    /** V5.0: 首页待机军团展示 — 小方阵置于镜头中上部, 不被首页面板遮挡 */
    _setupIdleShowcase() {
        this.squad.reset(12);
        for (var i = 0; i < this.squad.soldiers.length; i++) {
            this.squad.soldiers[i].spawnT = 1;
        }
        this.squad.z = -13;
        this.squad.update(0.001, 0);
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(0, this.squad.z, 0.016, 12);
        this._refreshBestRecord();
    }

    /** V5.0: 刷新首页最高纪录(防御性: 元素可能不存在) */
    _refreshBestRecord() {
        try { this._updateBestRecord(); } catch (e) {}
    }

    _setupInput() {
        var self = this;
        // V17.0 RC: 切后台 / 切标签页自动暂停 (冻结龙卷风、炸弹、酸液与技能冷却, 防止切回时意外团灭)
        if (typeof document !== 'undefined' && !window._v17VisBound) {
            window._v17VisBound = true;
            document.addEventListener('visibilitychange', function() {
                if (document.hidden && self.state === 'playing' && !self.paused) {
                    if (self._togglePause) self._togglePause();
                    else self.paused = true;
                }
            });
        }
        if (typeof wx !== 'undefined' && wx.onHide && !window._v17WxHideBound) {
            window._v17WxHideBound = true;
            wx.onHide(function() {
                if (self.state === 'playing' && !self.paused) {
                    if (self._togglePause) self._togglePause();
                    else self.paused = true;
                }
            });
        }
        // V4.0: 连续拖动 → 目标位置(锚点相对映射, 无阈值跳道), 队伍经阻尼平滑跟随
        var dragAnchorPx = 0;
        var dragAnchorWX = 0;
        var dragging = false;

        function canvasWidth() { return self.canvas.clientWidth || window.innerWidth; }
        function onDown(x) {
            if (self.state !== 'playing' || self.paused) return;
            dragAnchorPx = x;
            dragAnchorWX = self.squad.targetX;
            dragging = true; self._isDragging = true;
        }
        function onMove(x) {
            if (!dragging || self.state !== 'playing' || self.paused) return;
            self.squad.targetX = MovementMath.dragTarget(
                dragAnchorWX, x - dragAnchorPx, canvasWidth(),
                MovementMath.centerBounds(self.squad.getHalfWidth()));
        }
        function onUp() { dragging = false; self._isDragging = false; }

        // 触摸
        this.canvas.addEventListener('touchstart', function(e) {
            e.preventDefault(); onDown(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', function(e) {
            e.preventDefault(); onMove(e.touches[0].clientX);
        }, { passive: false });
        this.canvas.addEventListener('touchend', onUp);

        // 鼠标
        this.canvas.addEventListener('mousedown', function(e) { onDown(e.clientX); });
        window.addEventListener('mousemove', function(e) { onMove(e.clientX); });
        window.addEventListener('mouseup', onUp);

        // 键盘 (方向键/AD) — 连续位移(不吸附固定跑道)
        window.addEventListener('keydown', function(e) {
            if (self.state !== 'playing' || self.paused) return;
            var maxX = MovementMath.centerBounds(self.squad.getHalfWidth());
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, -1, maxX);
            } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
                self.squad.targetX = MovementMath.keyTarget(self.squad.targetX, 1, maxX);
            }
        });
    }

    _setupUI() {
        var self = this;
        this.ui = {
            hud: document.getElementById('hud'),
            levelName: document.getElementById('level-name'),
            levelBadge: document.getElementById('level-badge'),
            progressFill: document.getElementById('progress-bar-fill'),
            progressFlag: document.getElementById('progress-flag'),
            progressNodes: document.getElementById('progress-nodes'),
            countNum: document.getElementById('squad-count-num'),
            countBadge: document.getElementById('squad-count-badge'),
            statCount: document.getElementById('stat-count'),
            statDamage: document.getElementById('stat-damage'),
            statFirerate: document.getElementById('stat-firerate'),
            statRowCount: document.getElementById('stat-row-count'),
            statRowDamage: document.getElementById('stat-row-damage'),
            statRowFirerate: document.getElementById('stat-row-firerate'),
            bossBar: document.getElementById('boss-bar-container'),
            bossFill: document.getElementById('boss-bar-fill'),
            startScreen: document.getElementById('start-screen'),
            winScreen: document.getElementById('win-screen'),
            loseScreen: document.getElementById('lose-screen'),
            pauseScreen: document.getElementById('pause-screen'),
            winCount: document.getElementById('win-count'),
            winKills: document.getElementById('win-kills'),
            winMax: document.getElementById('win-max'),
            winTime: document.getElementById('win-time'),
            winCombo: document.getElementById('win-combo'),
            loseKills: document.getElementById('lose-kills'),
            loseMax: document.getElementById('lose-max'),
            loseCombo: document.getElementById('lose-combo'),
            loseReason: document.getElementById('lose-reason'),
            comboBox: document.getElementById('combo-box'),
            comboNum: document.getElementById('combo-num'),
            levelSelect: document.getElementById('level-select'),
            btnNextLevel: document.getElementById('btn-next-level'),
            // V3.4: 广告入口
            btnRevive: document.getElementById('btn-revive'),
            btnDouble: document.getElementById('btn-double-reward'),
            btnRefreshGates: document.getElementById('btn-refresh-gates'),
            rgCount: document.getElementById('rg-count'),
            btnSound: document.getElementById('btn-sound-toggle'),
            // V5.0: 首页元素
            homeSound: document.getElementById('btn-home-sound'),
            bestRecord: document.getElementById('v42-best-record')
        };

        // 进度节点数据(从关卡segments动态生成)
        this.progressNodes = [];

        // 按钮事件绑定(防御性: 元素可能不存在于测试页面)
        var btnStart = document.getElementById('btn-start');
        if (btnStart) btnStart.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartWin = document.getElementById('btn-restart-win');
        if (btnRestartWin) btnRestartWin.addEventListener('click', function() { self._sfx('click'); self.start(); });
        var btnRestartLose = document.getElementById('btn-restart-lose');
        if (btnRestartLose) btnRestartLose.addEventListener('click', function() { self._sfx('click'); self.start(); });
        // V5.0: 失败页返回首页入口(任务书9.5)
        var btnLoseMenu = document.getElementById('btn-lose-menu');
        if (btnLoseMenu) btnLoseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });
        var btnPause = document.getElementById('btn-pause');
        if (btnPause) btnPause.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnRevive = document.getElementById('btn-revive');
        if (btnRevive) btnRevive.addEventListener('click', function() { self._revive(); });
        // V3.4: 双倍结算 / 刷门 / 音效开关
        if (this.ui.btnDouble) this.ui.btnDouble.addEventListener('click', function() { self._doubleRewardViaAd(); });
        if (this.ui.btnRefreshGates) this.ui.btnRefreshGates.addEventListener('click', function() { self._refreshGatesViaAd(); });
        if (this.ui.btnSound) this.ui.btnSound.addEventListener('click', function() { self._toggleSound(); });
        // V5.0: 首页音效开关/免费补给/升级商店按钮由 V42Art.installUI 动态创建,
        // 必须在 installUI 之后绑定(此前在此处绑定时元素尚不存在, 监听从未挂上 → 死按钮)
        // V5.1.4: 胜利页商店入口(静态元素, 此处可绑)
        var btnShopWin = document.getElementById('btn-open-shop-win');
        if (btnShopWin) btnShopWin.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        // V5.1: 商店UI装配
        this._setupShopUI();
        this._refreshCoinDisplays();
        // V3.3: 下一关按钮
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.addEventListener('click', function() {
                if (self.levelIndex + 1 < LEVELS.length) {
                    self._sfx('click');
                    self.levelIndex++;
                    self.start();
                }
            });
        }
        // 暂停菜单按钮
        var btnResume = document.getElementById('btn-resume');
        if (btnResume) btnResume.addEventListener('click', function() { self._sfx('click'); self._togglePause(); });
        var btnPauseRestart = document.getElementById('btn-pause-restart');
        if (btnPauseRestart) btnPauseRestart.addEventListener('click', function() {
            self._sfx('click');
            if (self.ui.pauseScreen) self.ui.pauseScreen.classList.add('hidden');
            self.paused = false;
            self.start();
        });
        var btnPauseMenu = document.getElementById('btn-pause-menu');
        if (btnPauseMenu) btnPauseMenu.addEventListener('click', function() { self._sfx('click'); self._backToMenu(); });

        // V3.3: 生成关卡选择按钮
        if (this.ui.levelSelect) {
            for (var i = 0; i < LEVELS.length; i++) {
                var b = document.createElement('button');
                b.textContent = String(i + 1);
                this.ui.levelSelect.appendChild(b);
            }
        }
        this._refreshLevelSelect();
    }

    /** 构建进度条节点(基于关卡segments) */
    _buildProgressNodes(level) {
        if (!this.ui.progressNodes) return;
        this.ui.progressNodes.innerHTML = '';
        this.progressNodes = [];
        for (var i = 0; i < level.segments.length; i++) {
            var seg = level.segments[i];
            if(seg.type!=='boss' && (seg.type!=='wave' || level.segments.filter((s,index)=>index<=i&&s.type==='wave').length%2===0))continue;
            var nodePos = clamp(seg.z / level.totalZ, 0, 1) * 100;
            var el = document.createElement('div');
            el.className = 'pnode';
            if (seg.type === 'boss') el.classList.add('boss-node');
            el.style.left = nodePos + '%';
            this.ui.progressNodes.appendChild(el);
            this.progressNodes.push({ z: seg.z, el: el, type: seg.type });
        }
    }

    /** 更新进度节点状态(基于小队当前位置) */
    _updateProgressNodes() {
        for (var i = 0; i < this.progressNodes.length; i++) {
            var n = this.progressNodes[i];
            if (!n.el) continue;
            // 已通过的节点: 小队z已越过节点z(更负)
            if (this.squad.z < n.z - 2) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node done' : 'pnode done';
            }
            // 当前节点: 小队接近节点
            else if (Math.abs(this.squad.z - n.z) < 8) {
                n.el.className = n.type === 'boss' ? 'pnode boss-node current' : 'pnode current';
            }
            // 未到达
            else {
                n.el.className = n.type === 'boss' ? 'pnode boss-node' : 'pnode';
            }
        }
    }

    _togglePause() {
        if (this.state !== 'playing') return;
        this.paused = !this.paused;
        if (this.paused) {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.remove('hidden');
        } else {
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        }
    }

    /** V6.0: 能源核心生成与清理 */
    _setupEnergyCore(level) {
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        var seg = null;
        for (var i = 0; i < level.segments.length; i++) {
            if (level.segments[i].type === 'energy') { seg = level.segments[i]; break; }
        }
        if (!seg || typeof EnergyCore === 'undefined') return;
        this.energyCore = new EnergyCore(this.world.scene, 0, seg.z, seg.core || {}, this);
    }

    /** V6.0: 能源核心击破回调 */
    onCoreDestroyed() {
        if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z, '僵尸失去强化!', '#66FFB3', true);
    }

    /** V5.0: 统一音效入口(自动初始化 + 平台/静音守卫) */
    _sfx(type) {
        if (typeof Platform === 'undefined' || !Platform.audio) return;
        Platform.audio.play(type);
    }

    /** V4.0: Boss出场预警横幅(震动+音效, 预警结束由onBossSpawn隐藏) */
    /** V4.0: 短暂慢动作(0.35s, 时间流速0.35), 不打断操作 */
    _slowmo() {
        this._timeScale = 0.35;
        this._slowmoT = 0.35;
    }

    /** Game Feel: 轻量化命中顿帧(真实dt倒计时, 重叠调用取更强/更长, 绝不卡死输入) */
    triggerHitStop(duration, scale) {
        if (this.world && this.world._shakeDisabled) return;
        var dur = Math.min(0.08, Math.max(0.015, duration || 0.032));
        var sc = Math.max(0.08, Math.min(0.6, scale || 0.18));
        if (this._slowmoT > dur && this._timeScale <= sc) return;
        this._timeScale = sc;
        this._slowmoT = dur;
    }

    _showBossWarning(show) {
        var el = document.getElementById('boss-warning');
        if (!el) return;
        if (show) {
            el.classList.remove('hidden');
            // 强制重启动画
            void el.offsetWidth;
            el.classList.add('warning-anim');
            if (typeof Platform !== 'undefined' && Platform.audio) {
                Platform.audio.init();
                Platform.audio.play('bossWarn');
            }
        } else {
            el.classList.add('hidden');
            el.classList.remove('warning-anim');
        }
    }

    _backToMenu() {
        this.paused = false;
        this.state = 'idle';
        if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
        if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        if (this.ui.startScreen) this.ui.startScreen.classList.remove('hidden');
        // V5.0: 恢复首页待机军团展示
        this._setupIdleShowcase();
        // V10 QA修复: 返回主页时销毁能源核心(原滞留场景)
        if (this.energyCore) { this.energyCore.destroy(this.world.scene); this.energyCore = null; }
        this.gates.clear();
        this.enemies.clear();
        this.pacing.clear();
        var ws = document.getElementById('win-stars'); if (ws) ws.classList.add('hidden');
            this._showBossWarning(false);
        this.combat.clear();
        this.effects.clear();
        // V3.3: 刷新关卡选择解锁状态
        this._refreshLevelSelect();
    }

    _revive() {
        // V3.4: 复活必须通过激励视频(每局最多1次, 平台确认完整观看才发奖)
        if (!this.adCoord || !this.adCoord.canRevive()) {
            // 无广告环境/次数用尽: 按钮已隐藏, 此处兜底不复活
            return;
        }
        var maxBefore = Math.max(this.maxCount, 10);
        this.adCoord.requestRevive(maxBefore).then(function(granted) {
            if (!granted) {
                // 提前关闭/展示失败: 保持失败界面, 用户可重试或重新挑战
            }
        });
    }

    /** V18.0 实际复活执行(由广告协调器幂等发奖回调): 恢复40%峰值人数(1~12人) + 3秒无敌 + 1层护盾 + 击退附近怪 + 清弹 + 8秒危机保护 */
    _applyRevive(count, invSec) {
        var peak = Math.max(1, this.maxCount || count || 1);
        var reviveCount = Math.max(1, Math.min(12, Math.ceil(peak * 0.4)));
        this.state = 'playing';
        this.paused = false;
        this.squad.alive = true;
        this.squad.setCount(reviveCount);
        this.squad.invulnT = Math.max(3.0, invSec || 3.0);
        if (this.squad.grantMedicalShield) this.squad.grantMedicalShield(1, 10, this.effects);
        // 安全击退 5.5m 内贴脸怪至前方安全距离 (不记击杀、不刷金币)
        if (this.enemies && this.enemies.enemies) {
            for (var i = 0; i < this.enemies.enemies.length; i++) {
                var e = this.enemies.enemies[i];
                if (!e.alive) continue;
                if (Math.abs(e.z - this.squad.z) < 5.5) {
                    e.z = this.squad.z - 8.5 - (i % 4) * 0.8;
                    if (e.model) e.model.position.z = e.z;
                }
            }
        }
        // 清除复活点附近即将命中的炸弹与酸液弹
        if (this.enemies) {
            if (this.enemies.bombs) {
                for (var bi = this.enemies.bombs.length - 1; bi >= 0; bi--) {
                    this.enemies._bombPool.push(this.enemies.bombs[bi]);
                    this.enemies.bombs.splice(bi, 1);
                }
            }
            if (this.enemies.spits) {
                for (var si = this.enemies.spits.length - 1; si >= 0; si--) {
                    this.enemies.scene.remove(this.enemies.spits[si].mesh);
                    this.enemies._spitPool.push(this.enemies.spits[si]);
                    this.enemies.spits.splice(si, 1);
                }
            }
        }
        // 复活后 8 秒内不触发新随机危机
        if (typeof RandomEvents !== 'undefined' && RandomEvents.onRevive) RandomEvents.onRevive();
        // V8.0: 挑战模式复活 — 重新开启计分(基准重置, 只计复活后的增量)
        if (this._challenge) {
            this._challenge._scored = false;
            this._challenge._bossStart = this.enemies.bossKills || 0;
        }
        if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
        if (this.ui.hud) this.ui.hud.classList.remove('hidden');
        // 复活反馈
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.3, this.squad.z, '紧急救援复活! +' + reviveCount + '人', '#5CEEFF', true);
            this.effects.shockwave(this.squad.x, 0.08, this.squad.z, 0x5CEEFF);
            this.effects.burst(this.squad.x, 1.0, this.squad.z, 0x75DFFF, 20, 4.8, 0.55);
        }
        this._sfx('win');
    }

    /** V3.4: 双倍结算(胜利界面按钮 → 激励视频) */
    _doubleRewardViaAd() {
        if (!this.adCoord || this._doubleTaken) return;
        var self = this;
        this.adCoord.requestDoubleReward().then(function(granted) {
            if (!granted && self.state === 'won') {
                // 提前关闭: 按钮恢复可点, 用户可重试
                if (self.ui.btnDouble) self.ui.btnDouble.disabled = false;
            }
        });
    }

    /** 双倍奖励发放回调(V5.1: 对本次结算的关卡奖励补发一次, 幂等) */
    _onDoubleReward() {
        this._doubleTaken = true;
        if (this._settlement && this._settlement.levelReward > 0 && !this._doubleApplied) {
            this._doubleApplied = true;
            this._settlement.doubled = true;
            this._settlement.total += this._settlement.levelReward;
            if (this.profile) this.profile.addCoins(this._settlement.levelReward);
        }
        if (this.ui.btnDouble) {
            this.ui.btnDouble.textContent = '✓ 已领取双倍';
            this.ui.btnDouble.disabled = true;
        }
        this._fillSettlementUI();
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, '奖励×2!', '#FFC247', true);
        }
    }

    /** V5.1: 结算面板金币明细(金币飞入动画在CSS) */
    _fillSettlementUI() {
        var box = document.getElementById('win-coins');
        var st = this._settlement;
        if (box && st) {
            document.getElementById('wc-level').textContent = '+' + st.levelReward;
            document.getElementById('wc-kills').textContent = '+' + st.killReward;
            var dbl = document.getElementById('wc-double-row');
            if (dbl) dbl.classList.toggle('hidden', !st.doubled);
            if (st.doubled) document.getElementById('wc-double').textContent = '+' + st.levelReward;
            document.getElementById('wc-total').textContent = st.total;
            box.classList.remove('hidden');
            box.classList.remove('coin-in'); void box.offsetWidth; box.classList.add('coin-in');
        }
        var loseBox = document.getElementById('lose-coins');
        if (loseBox && st && this.state === 'lost') {
            document.getElementById('lc-kills-coin').textContent = '+' + st.killReward;
            var xpEl = document.getElementById('lc-xp');
            if (xpEl) xpEl.textContent = '+' + (this.enemies.killCount * ((typeof XP_RULES !== 'undefined' && XP_RULES.perKill) || 1)); // V10 QA修复: 与实际入账公式一致
            loseBox.classList.remove('hidden');
        }
        // VNext: 装备掉落展示(胜利/失败面板共用逻辑)
        this._renderSettlementDrops('win-coins', 'wc-drops-row', '📦 装备掉落');
        this._renderSettlementDrops('lose-coins', 'lc-drops-row', '📦 掉落');
        this._refreshCoinDisplays();
    }

    /** VNext: 结算面板掉落行(动态注入, 无掉落显示"无") */
    _renderSettlementDrops(boxId, rowId, label) {
        var box = document.getElementById(boxId);
        if (!box) return;
        var row = document.getElementById(rowId);
        if (!row) {
            row = document.createElement('div');
            row.id = rowId;
            row.className = 'wc-row';
            var total = box.querySelector('.wc-total') || box.lastElementChild;
            if (total) box.insertBefore(row, total); else box.appendChild(row);
        }
        var drops = this._drops || [];
        row.innerHTML = '<span>' + label + '</span><b>' +
            (drops.length ? drops.map(function(d) { return d.name; }).join('、') : '无') + '</b>';
    }

    /** V5.1: 每日免费补给(首页按钮 → 激励视频 → 下局生效) */
    _freeSupplyViaAd() {
        if (!this.adCoord || !this.adCoord.canShowAds() || !this.profile) return;
        var d = new Date();
        var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
        if (this.profile.hasClaimed(key)) { this._showSupplyTip('今日已领取补给, 明天再来!'); return; }
        var self = this;
        this.adCoord.requestFreeSupply().then(function(granted) {
            if (!granted) return;
            if (!self.profile.claimReward(key, 0)) return; // 幂等(防并发)
            var kinds = ['people', 'damage', 'firerate'];
            var kind = kinds[Math.floor(Math.random() * kinds.length)];
            self.profile.data.pendingSupply = kind;
            self.profile.save();
            var names = { people: '+15 补给兵(下局生效)', damage: '输出+2(下局生效)', firerate: '射速+20%(下局生效)' };
            self._showSupplyTip('🎁 ' + (names[kind] || '补给!'));
            self._refreshCoinDisplays();
        });
    }

    _showSupplyTip(text) {
        var tip = document.getElementById('supply-tip');
        if (!tip) return;
        tip.textContent = text;
        tip.classList.remove('hidden');
        clearTimeout(this._supplyTipT);
        this._supplyTipT = setTimeout(function() { tip.classList.add('hidden'); }, 2600);
    }

    /** V10 QA: 首页动态按钮绑定(V42Art.installUI 创建的元素, 原绑定时机过早成死按钮) */
    _bindHomeButtons() {
        var self = this;
        var btnOpen = document.getElementById('btn-open-shop');
        if (btnOpen) btnOpen.addEventListener('click', function() { self._sfx('click'); self._openShop(); });
        var btnSupply = document.getElementById('btn-free-supply');
        if (btnSupply) btnSupply.addEventListener('click', function() { self._sfx('click'); self._freeSupplyViaAd(); });
        var homeSound = document.getElementById('btn-home-sound');
        if (homeSound) {
            this.ui.homeSound = homeSound;
            homeSound.addEventListener('click', function() { self._toggleSound(); });
        }
        // 免费补给今日已领标签(原在 _setupUI 中查询时元素尚不存在)
        if (this.profile) {
            var d = new Date();
            var key = 'supply:' + d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
            if (btnSupply && this.profile.hasClaimed(key)) btnSupply.classList.add('claimed');
        }
    }

    /** V5.1: 升级商店UI(渲染/购买/刷新) */
    _setupShopUI() {
        var self = this;
        this.ui.shopCoins = document.getElementById('shop-coins-num');
        var listEl = document.getElementById('shop-list');
        var btnClose = document.getElementById('btn-close-shop');
        if (btnClose) btnClose.addEventListener('click', function() { self._sfx('click'); self._closeShop(); });
        this._shopRows = {};
        // V15-ART-009: 统一升级商店顶部导航栏 (返回 | 标题 | 实时金币) + 精准五项军工功能图标
        var shopPanel = document.querySelector('#shop-screen .title-panel');
        if (shopPanel && !document.getElementById('v15-shop-topbar')) {
            var sTop = document.createElement('div');
            sTop.id = 'v15-shop-topbar';
            sTop.className = 'v15-armory-topbar';
            sTop.innerHTML =
                '<button type="button" class="v15-page-back" id="v15-shop-back">‹ 返回</button>' +
                '<div class="v15-page-title-wrap"><span class="v15-page-kicker">SUPPLY DEPOT</span><strong>后勤升级商店</strong></div>' +
                '<div class="v15-page-coin"><img src="art/ui/coin.png" alt=""><span id="v15-shop-top-coins">0</span></div>';
            shopPanel.insertBefore(sTop, shopPanel.firstChild);
            sTop.querySelector('#v15-shop-back').addEventListener('click', function() { self._sfx('click'); self._closeShop(); });
        }
        var svgRapid = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gBolt" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFF29A"/><stop offset="55%" stop-color="#FFA826"/><stop offset="100%" stop-color="#E05A12"/></linearGradient></defs><rect x="6" y="13" width="6" height="19" rx="2" fill="#D4A642" stroke="#523508" stroke-width="1.5"/><path d="M6 13 L9 6 L12 13 Z" fill="#F2D06B" stroke="#523508" stroke-width="1.2"/><rect x="14" y="15" width="6" height="17" rx="2" fill="#C49434" stroke="#523508" stroke-width="1.5"/><path d="M14 15 L17 8 L20 15 Z" fill="#F2D06B" stroke="#523508" stroke-width="1.2"/><path d="M26 5 L18 21 H25 L21 35 L35 17 H27 L31 5 Z" fill="url(#gBolt)" stroke="#4D2304" stroke-width="1.6" stroke-linejoin="round"/></svg>';
        var svgPierce = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gAP" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE680"/><stop offset="60%" stop-color="#E09A24"/><stop offset="100%" stop-color="#8A4E0B"/></linearGradient></defs><path d="M24 7 L34 11 V22 C34 28 29 33 24 35 C19 33 14 28 14 22 V11 Z" fill="#4E6658" stroke="#98B8A2" stroke-width="1.8"/><path d="M24 12 L21 20 L27 21 L23 30" fill="none" stroke="#FFE478" stroke-width="2.2" stroke-linecap="round"/><path d="M4 25 L16 14 L22 20 L10 31 Z" fill="url(#gAP)" stroke="#472804" stroke-width="1.5"/><path d="M16 14 L27 9 L22 20 Z" fill="#FFF2B8" stroke="#472804" stroke-width="1.4"/></svg>';
        var svgAirstrike = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gAir" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#FFE070"/><stop offset="55%" stop-color="#FF7A24"/><stop offset="100%" stop-color="#C82818"/></linearGradient></defs><circle cx="20" cy="20" r="14" fill="none" stroke="#FF8C36" stroke-width="2" stroke-dasharray="4 3"/><path d="M27 7 L19 19 L25 22 L12 34 L17 21 L11 18 Z" fill="url(#gAir)" stroke="#4A1806" stroke-width="1.5" stroke-linejoin="round"/></svg>';
        var svgCryo = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gIce" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E8FBFF"/><stop offset="55%" stop-color="#6CD8FF"/><stop offset="100%" stop-color="#1E7AD8"/></linearGradient></defs><path d="M20 5 V35 M7 12.5 L33 27.5 M33 12.5 L7 27.5" stroke="url(#gIce)" stroke-width="3.2" stroke-linecap="round"/><polygon points="20,12 27,16 27,24 20,28 13,24 13,16" fill="#B8F0FF" stroke="#164B8A" stroke-width="1.6"/></svg>';
        var svgOverdrive = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gOD" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFF59A"/><stop offset="55%" stop-color="#FFB426"/><stop offset="100%" stop-color="#D94814"/></linearGradient></defs><circle cx="20" cy="20" r="14" fill="#3B2408" stroke="#F5C946" stroke-width="2"/><path d="M22 6 L11 22 H19 L16 34 L29 18 H21 Z" fill="url(#gOD)" stroke="#4A1A04" stroke-width="1.4" stroke-linejoin="round"/></svg>';
        var svgTornado = '<svg class="v15-shop-svg" viewBox="0 0 40 40"><defs><linearGradient id="gTorn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E6FFFF"/><stop offset="55%" stop-color="#38E8FF"/><stop offset="100%" stop-color="#0E88C8"/></linearGradient></defs><ellipse cx="20" cy="10" rx="13" ry="4" fill="none" stroke="url(#gTorn)" stroke-width="3"/><ellipse cx="20" cy="17" rx="10" ry="3.2" fill="none" stroke="url(#gTorn)" stroke-width="2.8"/><ellipse cx="20" cy="24" rx="7" ry="2.4" fill="none" stroke="url(#gTorn)" stroke-width="2.6"/><ellipse cx="20" cy="30" rx="4" ry="1.6" fill="none" stroke="#99F6FF" stroke-width="2.2"/><circle cx="20" cy="34.5" r="1.8" fill="#E6FFFF"/></svg>';
        var shopIconMap = {
            recruit: '<img class="v15-shop-icon-img" src="art/characters/soldier_portrait.png" alt="新兵招募">',
            logistics: '<img class="v15-shop-icon-img" src="art/ui/chest.png" alt="后勤补给">',
            gun: '<img class="v15-shop-icon-img" src="art/weapons/rifle.png" alt="枪械强化">',
            rapid: svgRapid,
            pierce: svgPierce,
            skill_airstrike: svgAirstrike,
            skill_cryo: svgCryo,
            skill_overdrive: svgOverdrive,
            skill_tornado: svgTornado
        };
        this._skillSvgIcons = {
            skill_airstrike: svgAirstrike,
            skill_cryo: svgCryo,
            skill_overdrive: svgOverdrive,
            skill_tornado: svgTornado
        };
        this._initActiveSkillBar();
        if (listEl) {
            Object.keys(UPGRADE_DEFS).forEach(function(id) {
                var def = UPGRADE_DEFS[id];
                var row = document.createElement('div');
                row.className = 'shop-row';
                var iconHtml = shopIconMap[id] || def.icon;
                row.innerHTML =
                    '<div class="shop-icon">' + iconHtml + '</div>' +
                    '<div class="shop-info">' +
                    '<div class="v15-shop-head"><span class="shop-name">' + def.name + '</span><span class="v15-shop-lv" id="shop-lv-' + id + '">Lv.0</span></div>' +
                    '<div class="shop-desc">' + def.desc + '</div>' +
                    '<div class="v15-shop-bar"><i id="shop-bar-' + id + '"></i></div>' +
                    '<div class="shop-effect" id="shop-effect-' + id + '"></div></div>' +
                    '<button class="shop-buy" id="shop-buy-' + id + '"></button>';
                listEl.appendChild(row);
                self._shopRows[id] = row;
                row.querySelector('.shop-buy').addEventListener('click', function() { self._buyUpgrade(id); });
            });
        }
        this._refreshShop();
    }

    _openShop() {
        var el = document.getElementById('shop-screen');
        if (el) {
            el.classList.remove('hidden');
            this._refreshShop();
        }
    }

    _closeShop() {
        var el = document.getElementById('shop-screen');
        if (el) el.classList.add('hidden');
        this._refreshLevelSelect(); // 解锁状态可能因属性变化展示不同
    }

    _refreshShop() {
        if (!this.profile || !this._shopRows) return;
        var self = this;
        Object.keys(UPGRADE_DEFS).forEach(function(id) {
            var lv = UpgradeShop.levelOf(self.profile, id);
            var maxLv = UpgradeShop.maxLevel(id);
            var price = UpgradeShop.priceOf(id, lv);
            var row = self._shopRows[id];
            if (!row) return;
            var lvEl = row.querySelector('#shop-lv-' + id);
            if (lvEl) lvEl.textContent = 'Lv.' + lv + '/' + maxLv;
            var barEl = row.querySelector('#shop-bar-' + id);
            if (barEl) barEl.style.width = Math.round((lv / Math.max(1, maxLv)) * 100) + '%';
            var curText = UPGRADE_DEFS[id].effect(lv);
            var nextText = (price !== null) ? ' → ' + UPGRADE_DEFS[id].effect(lv + 1) : ' · 已满级';
            row.querySelector('.shop-effect').textContent = curText + nextText;
            var btn = row.querySelector('.shop-buy');
            if (price === null) {
                btn.textContent = 'MAX';
                btn.disabled = true;
                btn.classList.add('maxed');
            } else {
                var canBuy = self.profile.coins >= price;
                btn.innerHTML = '<img class="v15-btn-coin" src="art/ui/coin.png" alt=""><span>' + price + '</span>' +
                    (canBuy ? '' : '<small>金币不足</small>');
                btn.disabled = !canBuy;
                btn.classList.toggle('affordable', canBuy);
            }
        });
        if (this.ui.shopCoins) this.ui.shopCoins.textContent = this.profile.coins;
        var topCoin = document.getElementById('v15-shop-top-coins');
        if (topCoin) topCoin.textContent = this.profile.coins;
    }

    _buyUpgrade(id) {
        var res = UpgradeShop.purchase(this.profile, id);
        if (res.ok) {
            this._sfx('gate');
            this._refreshShop();
            this._refreshCoinDisplays();
            this._showSupplyTip('✅ ' + UPGRADE_DEFS[id].name + ' Lv.' + res.level);
        } else if (res.reason === 'insufficient') {
            this._sfx('hit');
            this._showSupplyTip('🪙 金币不足, 需要 ' + res.need);
        } else {
            this._showSupplyTip('已达到最高等级');
        }
    }

    // ===== V15-GAMEPLAY-002 / V16.2: 战斗主动战术技能 (空袭 / 冰冻 / 超载 / 龙卷风) =====
    _initActiveSkillBar() {
        var self = this;
        this._activeSkillOrder = [
            { id: 'skill_airstrike', short: '空袭', key: '1' },
            { id: 'skill_cryo', short: '冰冻', key: '2' },
            { id: 'skill_overdrive', short: '超载', key: '3' },
            { id: 'skill_tornado', short: '龙卷风', key: '4' }
        ];
        this._activeSkillCd = { skill_airstrike: 0, skill_cryo: 0, skill_overdrive: 0, skill_tornado: 0 };
        this._activeSkillBtns = {};
        this._activeTornado = null;
        var hud = document.getElementById('hud');
        if (!hud || document.getElementById('v15-skill-bar')) return;
        var bar = document.createElement('div');
        bar.id = 'v15-skill-bar';
        bar.className = 'hidden';
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            (function(cfg) {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.id = 'v15-btn-' + cfg.id;
                btn.className = 'v15-skill-btn hidden';
                var ico = (self._skillSvgIcons && self._skillSvgIcons[cfg.id]) || '';
                btn.innerHTML =
                    '<span class="v15-skill-lv" id="v15-lv-' + cfg.id + '">Lv.1</span>' +
                    ico +
                    '<span class="v15-skill-lbl">' + cfg.short + '</span>' +
                    '<span class="v15-skill-cd" id="v15-cd-' + cfg.id + '"></span>';
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    self.castActiveSkill(cfg.id);
                });
                bar.appendChild(btn);
                self._activeSkillBtns[cfg.id] = btn;
            })(this._activeSkillOrder[i]);
        }
        hud.appendChild(bar);
        this._activeSkillBar = bar;
        // 桌面端快捷键 1/2/3/4 释放主动技能
        if (typeof window !== 'undefined' && !window._v15SkillKeyBound) {
            window._v15SkillKeyBound = true;
            window.addEventListener('keydown', function(e) {
                if (!self || self.state !== 'playing' || self.paused) return;
                if (e.key === '1') self.castActiveSkill('skill_airstrike');
                else if (e.key === '2') self.castActiveSkill('skill_cryo');
                else if (e.key === '3') self.castActiveSkill('skill_overdrive');
                else if (e.key === '4') self.castActiveSkill('skill_tornado');
            });
        }
    }

    _ensureTornadoMesh() {
        if (this._tornadoGroup) return this._tornadoGroup;
        var sc = (this.world && this.world.scene) || this.scene;
        if (typeof THREE === 'undefined' || !sc) return null;
        var g = new THREE.Group();
        g.visible = false;
        g.userData.artSource = 'V16.3 commercial multi-layer UV-scrolling spiral tornado VFX';

        // V16.3: 程序化斜向流动螺旋风带贴图 (上下柔羽化彻底消除硬边"塑料杯"轮廓!)
        var ribbonCv = document.createElement('canvas');
        ribbonCv.width = 512; ribbonCv.height = 512;
        var rctx = ribbonCv.getContext('2d');
        rctx.clearRect(0, 0, 512, 512);
        // 8条斜向青白风带(无缝横向平铺)
        for (var band = 0; band < 8; band++) {
            var yBase = band * 64;
            var thick = 16 + (band % 3) * 8;
            rctx.save();
            var grad = rctx.createLinearGradient(0, yBase - thick, 0, yBase + thick);
            grad.addColorStop(0, 'rgba(60,232,255,0)');
            grad.addColorStop(0.35, 'rgba(92,238,255,0.58)');
            grad.addColorStop(0.5, 'rgba(235,255,255,0.92)');
            grad.addColorStop(0.65, 'rgba(92,238,255,0.52)');
            grad.addColorStop(1, 'rgba(60,232,255,0)');
            rctx.strokeStyle = grad;
            rctx.lineWidth = thick;
            rctx.lineCap = 'round';
            for (var wrap = -1; wrap <= 1; wrap++) {
                rctx.beginPath();
                rctx.moveTo(wrap * 512, yBase + 70);
                rctx.bezierCurveTo(wrap * 512 + 170, yBase + 25, wrap * 512 + 340, yBase - 15, wrap * 512 + 512, yBase - 58);
                rctx.stroke();
            }
            rctx.restore();
        }
        // 上下边缘柔和渐变透明遮罩(destination-in), 保证顶底完全羽化无硬边
        rctx.globalCompositeOperation = 'destination-in';
        var vMask = rctx.createLinearGradient(0, 0, 0, 512);
        vMask.addColorStop(0.0, 'rgba(255,255,255,0)');
        vMask.addColorStop(0.16, 'rgba(255,255,255,0.95)');
        vMask.addColorStop(0.84, 'rgba(255,255,255,0.95)');
        vMask.addColorStop(1.0, 'rgba(255,255,255,0)');
        rctx.fillStyle = vMask;
        rctx.fillRect(0, 0, 512, 512);
        var ribbonTexOuter = new THREE.CanvasTexture(ribbonCv);
        ribbonTexOuter.wrapS = THREE.RepeatWrapping;
        ribbonTexOuter.wrapT = THREE.RepeatWrapping;
        ribbonTexOuter.repeat.set(2, 1.4);
        var ribbonTexMid = ribbonTexOuter.clone();
        ribbonTexMid.needsUpdate = true;
        ribbonTexMid.wrapS = THREE.RepeatWrapping;
        ribbonTexMid.wrapT = THREE.RepeatWrapping;
        ribbonTexMid.repeat.set(3, 1.8);

        // 有机弯曲漏斗几何生成辅助(非笔直圆台, 带自然龙卷S形微弯+抛物线收腰)
        var makeFunnel = function(rTop, rBot, h, segR, segH, bend) {
            var geo = new THREE.CylinderGeometry(rTop, rBot, h, segR, segH, true);
            var pos = geo.attributes.position;
            for (var vi = 0; vi < pos.count; vi++) {
                var py = pos.getY(vi);
                var t = Math.max(0, Math.min(1, (py + h * 0.5) / h)); // 0 bottom -> 1 top (钳制防负值NaN)
                // 抛物线收腰轮廓
                var profile = 0.55 + 0.45 * Math.pow(t, 1.35);
                var xOff = Math.sin(t * Math.PI * 1.15) * bend;
                var zOff = Math.cos(t * Math.PI * 1.0) * bend * 0.45;
                pos.setX(vi, pos.getX(vi) * profile + xOff);
                pos.setZ(vi, pos.getZ(vi) * profile + zOff);
            }
            geo.computeVertexNormals();
            return geo;
        };

        // 1. 外层螺旋气流风带
        var outerMesh = new THREE.Mesh(
            makeFunnel(2.05, 0.42, 4.5, 24, 14, 0.24),
            new THREE.MeshBasicMaterial({
                map: ribbonTexOuter, color: 0x62EEFF, transparent: true, opacity: 0.72,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
            })
        );
        outerMesh.position.y = 2.25;
        outerMesh.renderOrder = 6;
        g.add(outerMesh);

        // 2. 中层高速反相亮白风带
        var midMesh = new THREE.Mesh(
            makeFunnel(1.38, 0.26, 4.3, 20, 12, -0.16),
            new THREE.MeshBasicMaterial({
                map: ribbonTexMid, color: 0xDFFBFF, transparent: true, opacity: 0.78,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
            })
        );
        midMesh.position.y = 2.15;
        midMesh.renderOrder = 7;
        g.add(midMesh);

        // 3. 内层半透明高速风眼
        var coreMesh = new THREE.Mesh(
            makeFunnel(0.62, 0.14, 4.0, 14, 8, 0.08),
            new THREE.MeshBasicMaterial({
                map: ribbonTexOuter, color: 0xFFFFFF, transparent: true, opacity: 0.48,
                blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false
            })
        );
        coreMesh.position.y = 2.0;
        coreMesh.renderOrder = 8;
        g.add(coreMesh);

        // 4. 贴地旋转扬尘与漩涡气流盘 (柔边径向涡旋贴图, 不遮挡地面红圈预警)
        var dustCv = document.createElement('canvas');
        dustCv.width = 256; dustCv.height = 256;
        var dctx = dustCv.getContext('2d');
        dctx.translate(128, 128);
        var dGrad = dctx.createRadialGradient(0, 0, 10, 0, 0, 120);
        dGrad.addColorStop(0.0, 'rgba(180,248,255,0.55)');
        dGrad.addColorStop(0.45, 'rgba(120,225,245,0.34)');
        dGrad.addColorStop(0.78, 'rgba(190,210,218,0.18)');
        dGrad.addColorStop(1.0, 'rgba(180,200,210,0)');
        dctx.fillStyle = dGrad;
        dctx.beginPath(); dctx.arc(0, 0, 120, 0, Math.PI * 2); dctx.fill();
        for (var arm = 0; arm < 5; arm++) {
            dctx.save();
            dctx.rotate(arm * Math.PI * 2 / 5);
            dctx.strokeStyle = 'rgba(220,252,255,0.55)';
            dctx.lineWidth = 7;
            dctx.lineCap = 'round';
            dctx.beginPath();
            for (var s = 0; s < 18; s++) {
                var a = s * 0.24, r = 16 + s * 5.2;
                if (s === 0) dctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
                else dctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
            }
            dctx.stroke();
            dctx.restore();
        }
        var dustPlane = new THREE.PlaneGeometry(4.8, 4.8);
        dustPlane.rotateX(-Math.PI * 0.5);
        var baseRing = new THREE.Mesh(dustPlane, new THREE.MeshBasicMaterial({
            map: new THREE.CanvasTexture(dustCv), transparent: true, opacity: 0.15,
            depthWrite: false
        }));
        baseRing.position.y = 0.05;
        baseRing.renderOrder = 2;
        g.add(baseRing);

        // 5. 对象池化螺旋上升碎屑/风刃 (18片轻量四面体碎屑, 绕风柱螺旋高速旋转)
        var debris = [];
        var dGeo = new THREE.TetrahedronGeometry(0.11, 0);
        var dMat = new THREE.MeshBasicMaterial({ color: 0xD8F8FF, transparent: true, opacity: 0.85 });
        for (var di = 0; di < 18; di++) {
            var dm = new THREE.Mesh(dGeo, dMat);
            dm.userData = {
                phase: (di / 18) * Math.PI * 2,
                hPhase: di / 18,
                speed: 4.5 + (di % 4) * 1.4,
                rMul: 0.85 + (di % 3) * 0.22
            };
            g.add(dm);
            debris.push(dm);
        }

        g._outer = outerMesh;
        g._mid = midMesh;
        g._core = coreMesh;
        g._ribbonTexOuter = ribbonTexOuter;
        g._ribbonTexMid = ribbonTexMid;
        g._baseRing = baseRing;
        g._debris = debris;
        sc.add(g);
        this._tornadoGroup = g;
        return g;
    }

    _resetActiveSkills() {
        if (!this._activeSkillOrder) return;
        this._activeTornado = null;
        if (this._tornadoGroup) this._tornadoGroup.visible = false;
        var anyUnlocked = false;
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            var id = this._activeSkillOrder[i].id;
            var lv = (this.profile && typeof UpgradeShop !== 'undefined') ? UpgradeShop.levelOf(this.profile, id) : 0;
            this._activeSkillCd[id] = 0;
            var btn = this._activeSkillBtns && this._activeSkillBtns[id];
            if (btn) {
                btn.classList.toggle('hidden', lv <= 0);
                btn.classList.remove('is-cd');
                var lvEl = document.getElementById('v15-lv-' + id);
                if (lvEl) lvEl.textContent = 'Lv.' + lv;
            }
            if (lv > 0) anyUnlocked = true;
        }
        if (this._activeSkillBar) this._activeSkillBar.classList.toggle('hidden', !anyUnlocked);
    }

    _updateActiveSkills(dt) {
        if (!this._activeSkillOrder || !this._activeSkillCd) return;
        for (var i = 0; i < this._activeSkillOrder.length; i++) {
            var id = this._activeSkillOrder[i].id;
            var cd = this._activeSkillCd[id] || 0;
            if (cd > 0) {
                cd = Math.max(0, cd - dt);
                this._activeSkillCd[id] = cd;
                var btn = this._activeSkillBtns && this._activeSkillBtns[id];
                var cdEl = document.getElementById('v15-cd-' + id);
                if (btn) btn.classList.toggle('is-cd', cd > 0);
                if (cdEl) cdEl.textContent = cd > 0 ? Math.ceil(cd) + 's' : '';
            }
        }
        this._updateTornado(dt);
    }

    /** V16.2: 战术龙卷风每帧推进、3D旋风动画、聚怪牵引(上限30只)与0.25s周期绞杀 */
    _updateTornado(dt) {
        var t = this._activeTornado;
        var enemies = (this.enemies && this.enemies.enemies) ? this.enemies.enemies : [];
        if (!t) {
            if (this._tornadoGroup && this._tornadoGroup.visible) this._tornadoGroup.visible = false;
            for (var c = 0; c < enemies.length; c++) {
                var ec = enemies[c];
                if (ec._tornadoPulled) ec._tornadoPulled = false;
                if (!ec._vaulting && ec._liftY > 0) ec._liftY = Math.max(0, ec._liftY - dt * 4.5);
            }
            return;
        }
        t.remaining -= dt;
        t.spin += dt * 11.5;
        t.tickTimer += dt;
        // 相对小队保持前推(对地速度 = 小队行进速度 + 2.0m/s, 确保旋风始终稳步扫入前方怪潮)
        var advSpd = (this.squad && !this._bossEngaged) ? ((CONFIG.SQUAD_SPEED || 3.3) + 2.0) : t.speed;
        t.z -= advSpd * dt;
        t.x = clamp(t.baseX + Math.sin(t.spin * 0.22) * 0.65, -2.2, 2.2);

        // V16.3: 3D 螺旋风带 UV 流动 + 生成/持续/消散完整过渡 + 碎屑螺旋上升
        var mesh = this._ensureTornadoMesh();
        if (mesh) {
            mesh.visible = true;
            mesh.position.set(t.x, 0, t.z);
            var elapsed = t.dur - t.remaining;
            var spawnIn = elapsed < 0.32 ? Math.max(0.1, elapsed / 0.32) : 1;
            var fadeOut = t.remaining < 0.45 ? Math.max(0.05, t.remaining / 0.45) : 1;
            var env = spawnIn * fadeOut;
            var radScale = (t.radius / 2.8) * env;
            mesh.scale.set(radScale, env, radScale);
            if (mesh._outer) mesh._outer.rotation.y = t.spin * 0.72;
            if (mesh._mid) mesh._mid.rotation.y = -t.spin * 1.15;
            if (mesh._core) mesh._core.rotation.y = t.spin * 1.65;
            if (mesh._ribbonTexOuter) {
                mesh._ribbonTexOuter.offset.x = (mesh._ribbonTexOuter.offset.x + dt * 2.2) % 1;
                mesh._ribbonTexOuter.offset.y = (mesh._ribbonTexOuter.offset.y - dt * 0.85) % 1;
            }
            if (mesh._ribbonTexMid) {
                mesh._ribbonTexMid.offset.x = (mesh._ribbonTexMid.offset.x - dt * 3.1) % 1;
                mesh._ribbonTexMid.offset.y = (mesh._ribbonTexMid.offset.y - dt * 1.25) % 1;
            }
            if (mesh._baseRing) mesh._baseRing.rotation.y = t.spin * 0.9;
            if (mesh._debris) {
                for (var di = 0; di < mesh._debris.length; di++) {
                    var dm = mesh._debris[di];
                    var ud = dm.userData;
                    var hh = (ud.hPhase + elapsed * 0.55) % 1;
                    var angD = ud.phase + elapsed * ud.speed;
                    var radD = (0.45 + hh * 1.55) * ud.rMul;
                    dm.position.set(Math.cos(angD) * radD, 0.25 + hh * 3.8, Math.sin(angD) * radD);
                    dm.rotation.set(angD * 1.4, angD * 2.1, hh * 4.0);
                }
            }
        }
        if (this.effects && Math.random() < 0.45) {
            var ang = Math.random() * Math.PI * 2;
            var rr = Math.random() * t.radius * 0.75;
            this.effects.burst(t.x + Math.cos(ang) * rr, 0.35 + Math.random() * 1.8, t.z + Math.sin(ang) * rr, 0x7DF4FF, 2, 2.6, 0.32);
        }

        // 每 0.25s 结算一次范围绞杀伤害
        var doTickDmg = false;
        if (t.tickTimer >= 0.25) {
            t.tickTimer -= 0.25;
            doTickDmg = true;
        }
        var pulledCount = 0;
        var tickDmg = t.dps * 0.25;
        for (var i = 0; i < enemies.length; i++) {
            var e = enemies[i];
            if (!e.alive || e._vaulting) continue;
            var dx = t.x - e.x;
            var dz = t.z - e.z;
            var d = Math.hypot(dx, dz);
            if (d <= t.radius) {
                if (doTickDmg) {
                    var dmg = e.isBoss ? tickDmg * 0.25 : tickDmg;
                    if (e.takeDamage) e.takeDamage(dmg, this.effects);
                    else e.hp -= dmg;
                }
                if (!e.alive) continue;
                // Boss 免疫牵引, 精英 25% 牵引, 盾牌 50% 牵引, 其余 100%, 最多同时卷起 30 只
                if (!e.isBoss && pulledCount < 30) {
                    pulledCount++;
                    var pullStr = (e.type === 'elite') ? 0.25 : (e.type === 'shield' ? 0.5 : 1.0);
                    e._tornadoPulled = true;
                    var inv = 1 / Math.max(0.15, d);
                    var nx = dx * inv, nz = dz * inv;
                    // 向心吸引 + 切向旋转
                    var pullSpd = 5.4 * pullStr;
                    var swirlSpd = 3.8 * pullStr;
                    e.x = clamp(e.x + (nx * pullSpd - nz * swirlSpd) * dt, -3.2, 3.2);
                    e.z += (nz * pullSpd + nx * swirlSpd) * dt;
                    var targetLift = (e.type === 'elite' ? 0.25 : 0.85) * (1 - d / (t.radius * 1.15));
                    e._liftY = clamp((e._liftY || 0) + (Math.max(0.18, targetLift) - (e._liftY || 0)) * Math.min(1, dt * 8), 0, 1.1);
                } else {
                    e._tornadoPulled = false;
                }
            } else {
                if (e._tornadoPulled) e._tornadoPulled = false;
                if (e._liftY > 0) e._liftY = Math.max(0, e._liftY - dt * 4.5);
            }
        }
        t.pulledCount = pulledCount;

        if (t.remaining <= 0) {
            this._activeTornado = null;
            if (mesh) mesh.visible = false;
            for (var k = 0; k < enemies.length; k++) {
                var ek = enemies[k];
                ek._tornadoPulled = false;
                if (!ek._vaulting) ek._liftY = 0;
            }
        }
    }

    castActiveSkill(id) {
        if (this.state !== 'playing' || this.paused || !this.profile || !this.squad || this.squad.count <= 0) return false;
        var lv = (typeof UpgradeShop !== 'undefined') ? UpgradeShop.levelOf(this.profile, id) : 0;
        if (lv <= 0) return false;
        if ((this._activeSkillCd[id] || 0) > 0) return false;

        var enemies = (this.enemies && this.enemies.enemies) ? this.enemies.enemies : [];
        if (id === 'skill_airstrike') {
            var dmg = 35 + lv * 20;
            var cd = Math.max(10, 22 - lv * 1.5);
            this._activeSkillCd[id] = cd;
            for (var b = 0; b < 5; b++) {
                var bz = this.squad.z - 8 - b * 6;
                var bx = ((b % 3) - 1) * 1.8;
                if (this.effects) {
                    if (this.effects.shockwave) this.effects.shockwave(bx, 0.08, bz, 0xFF4422);
                    this.effects.burst(bx, 1.0, bz, 0xFF7A24, 18, 6.0, 0.55);
                    this.effects.burst(bx, 1.4, bz, 0x3A3A3A, 8, 3.2, 0.70);
                }
            }
            for (var i = 0; i < enemies.length; i++) {
                var e = enemies[i];
                if (!e.alive) continue;
                if (e.z <= this.squad.z + 2 && e.z >= this.squad.z - 42) {
                    if (e.takeDamage) e.takeDamage(dmg, this.effects);
                    else e.hp -= dmg;
                }
            }
            if (this.world) this.world.shake(0.32, 0.35);
            if (this.effects) this.effects.floatText(this.squad.x, 2.8, this.squad.z - 4, '战术空袭!', '#FF9E3D', true);
            this._sfx('gate');
        } else if (id === 'skill_cryo') {
            var freezeSec = 3.5 + lv * 0.6;
            var frostDmg = 2 + lv * 2;
            this._activeSkillCd[id] = Math.max(12, 24 - lv * 1.5);
            for (var j = 0; j < enemies.length; j++) {
                var ej = enemies[j];
                if (!ej.alive) continue;
                if (!ej.isBoss) ej.frozenT = Math.max(ej.frozenT || 0, freezeSec);
                if (ej.takeDamage) ej.takeDamage(frostDmg, this.effects);
                else ej.hp -= frostDmg;
            }
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(this.squad.x, 0.08, this.squad.z - 12, 0x60E0FF);
                this.effects.burst(this.squad.x, 1.2, this.squad.z - 12, 0x70D8FF, 26, 6.5, 0.65);
                this.effects.floatText(this.squad.x, 2.8, this.squad.z - 4, '极寒冰冻!', '#70D8FF', true);
            }
            if (this.world) this.world.shake(0.18, 0.22);
            this._sfx('gate');
        } else if (id === 'skill_overdrive') {
            var dur = 6 + lv * 1.2;
            var mul = 1.6 + lv * 0.15;
            this._activeSkillCd[id] = Math.max(14, 26 - lv * 1.5);
            this.squad._evDmgMul = Math.max(this.squad._evDmgMul || 1, mul);
            this.squad._evDmgMulT = Math.max(this.squad._evDmgMulT || 0, dur);
            this.squad._evRateMul = Math.max(this.squad._evRateMul || 1, 1.35);
            this.squad._evRateMulT = Math.max(this.squad._evRateMulT || 0, dur);
            if (this.squad.grantMedicalShield) this.squad.grantMedicalShield(1, 8, this.effects);
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(this.squad.x, 0.08, this.squad.z, 0xFFD84A);
                this.effects.burst(this.squad.x, 1.0, this.squad.z, 0xFFE066, 22, 5.0, 0.55);
                this.effects.floatText(this.squad.x, 2.8, this.squad.z - 2, '火力超载!', '#FFE066', true);
            }
            this._sfx('win');
        } else if (id === 'skill_tornado') {
            var tDur = 4.5 + lv * 0.5;
            var tDps = 3 + lv;
            var tRadius = 2.6 + lv * 0.2;
            var tCd = Math.max(24, 42 - lv * 2);
            this._activeSkillCd[id] = tCd;
            var startX = clamp(this.squad.x, -2.0, 2.0);
            var startZ = this.squad.z - 3.0;
            this._activeTornado = {
                x: startX, baseX: startX, z: startZ,
                lv: lv, dur: tDur, remaining: tDur,
                dps: tDps, radius: tRadius, speed: 2.2,
                tickTimer: 0, spin: 0, pulledCount: 0
            };
            var tMesh = this._ensureTornadoMesh();
            if (tMesh) {
                tMesh.visible = true;
                tMesh.position.set(startX, 0, startZ);
            }
            if (this.effects) {
                if (this.effects.shockwave) this.effects.shockwave(startX, 0.08, startZ, 0x3CE8FF);
                this.effects.burst(startX, 1.1, startZ, 0x7DF4FF, 22, 5.5, 0.55);
                this.effects.floatText(startX, 2.9, startZ - 1, '战术龙卷风!', '#5CEEFF', true);
            }
            if (this.world) this.world.shake(0.22, 0.25);
            this._sfx('gate');
        } else {
            return false;
        }
        var btn = this._activeSkillBtns && this._activeSkillBtns[id];
        var cdEl = document.getElementById('v15-cd-' + id);
        if (btn) btn.classList.add('is-cd');
        if (cdEl) cdEl.textContent = Math.ceil(this._activeSkillCd[id]) + 's';
        return true;
    }

    /** V5.1: 刷新所有金币显示(首页/商店/结算) */
    _refreshCoinDisplays() {
        var coins = this.profile ? this.profile.coins : 0;
        var els = document.querySelectorAll('[data-coin-display]');
        for (var i = 0; i < els.length; i++) {
            // V10.1: 数值变化时触发脉冲动画(视觉反馈)
            var el = els[i];
            if (el.textContent !== String(coins)) {
                el.textContent = coins;
                var pill = el.closest('.v51-coin-pill, .shop-coins, .v42-best-record');
                if (pill) {
                    pill.classList.remove('coin-pulse');
                    void pill.offsetWidth;
                    pill.classList.add('coin-pulse');
                }
            }
        }
        if (this.ui && this.ui.shopCoins) this.ui.shopCoins.textContent = coins;
    }

    /** V5.1: 消耗免费补给(广告每日奖励 → 本局生效) */
    _consumePendingSupply() {
        if (!this.profile || !this.profile.data.pendingSupply) return;
        var kind = this.profile.data.pendingSupply;
        this.profile.data.pendingSupply = null;
        this.profile.save();
        if (kind === 'people') this.squad.setCount(this.squad.count + 15);
        else if (kind === 'damage') this.squad.damageBuff = Math.min(99, this.squad.damageBuff + 2);
        else if (kind === 'firerate') this.squad.fireRateBuff = Math.min(0.5, this.squad.fireRateBuff + 0.2);
        if (this.effects) {
            var names = { people: '+15 补给兵!', damage: '补给: 输出+2!', firerate: '补给: 射速+20%!' };
            this.effects.floatText(this.squad.x, 2.0, this.squad.z, names[kind] || '补给!', '#75DFFF', true);
        }
    }

    /** V3.4: 广告刷门(HUD按钮 → 激励视频) */
    _refreshGatesViaAd() {
        if (!this.adCoord || !this.adCoord.canRefreshGates() || !this._hasRerollableGates()) return;
        this.adCoord.requestGateRefresh().then(function(granted) { /* 发奖回调 _onGatesRefreshed */ });
    }

    /** 当前是否有"前方未触发且可重随"的门 */
    _hasRerollableGates() {
        if (!this.gates || this.state !== 'playing') return false;
        for (var i = 0; i < this.gates.gates.length; i++) {
            var g = this.gates.gates[i];
            if (!g.triggered && g.z < this.squad.z) return true;
        }
        return false;
    }

    /** 刷门发奖回调: 重随前方门 */
    _onGatesRefreshed() {
        if (!this.gates) return;
        var n = this.gates.refreshAhead(this.squad.z);
        if (n > 0 && this.effects) {
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '状态门刷新!', '#A14DFF', true);
            this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xA14DFF);
        }
        this._updateAdButtons();
    }

    /** V3.4: 音效开关(暂停菜单) */
    _toggleSound() {
        if (typeof Platform === 'undefined') return;
        Platform.audio.init(); // 用户手势触发初始化
        var muted = !Platform.audio.isMuted();
        Platform.audio.setMuted(muted);
        this._updateSoundLabel();
        Platform.audio.play('click');
    }

    _updateSoundLabel() {
        if (typeof Platform === 'undefined') return;
        var muted = Platform.audio.isMuted();
        if (this.ui.btnSound) this.ui.btnSound.textContent = muted ? '🔇 音效: 关' : '🔊 音效: 开';
        // V5.0: 首页音效图标同步
        if (this.ui.homeSound) this.ui.homeSound.textContent = muted ? '🔇' : '🔊';
    }

    /** V5.0: 刷新首页最高纪录展示(读取关卡解锁进度) */
    _updateBestRecord() {
        if (!this.ui.bestRecord) return;
        var unlocked = this._loadProgress();
        this.ui.bestRecord.textContent = '🏆 最高纪录: 第' + unlocked + '关';
    }

    /** V3.4: 广告入口按钮可见性(随状态/次数刷新) */
    _updateAdButtons() {
        var coord = this.adCoord;
        // 复活按钮: 失败界面 && 尚有次数
        if (this.ui.btnRevive) {
            var canRevive = !!(coord && coord.canRevive());
            this.ui.btnRevive.classList.toggle('hidden', !canRevive);
        }
        // 双倍按钮: 胜利界面 && 尚有次数 && 未领取
        if (this.ui.btnDouble) {
            var canDouble = !!(coord && coord.canDoubleReward()) && !this._doubleTaken;
            this.ui.btnDouble.classList.toggle('hidden', !canDouble);
            if (canDouble) { this.ui.btnDouble.textContent = '📺 双倍奖励'; this.ui.btnDouble.disabled = false; }
        }
        // 刷门按钮: 战斗中 && 尚有次数 && 有可刷的门
        if (this.ui.btnRefreshGates) {
            var canRefresh = !!(coord && coord.canRefreshGates()) && this._hasRerollableGates();
            this.ui.btnRefreshGates.classList.toggle('hidden', !canRefresh);
            if (coord && this.ui.rgCount) this.ui.rgCount.textContent = coord.getGateRefreshLeft();
        }
    }

    _showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
        console.error(msg);
    }

    /** 性能报告: FPS/P95帧耗时/DrawCall/三角形 (V3.6测试用) */
    getPerf() {
        var ft = (this._frameTimes || []).slice().sort(function(a, b) { return a - b; });
        var p95 = ft.length ? ft[Math.floor(ft.length * 0.95)] : 0;
        var r = this.world.renderer.info;
        return {
            fps: Math.round(this._fpsEma),
            workMs: +(this._workMs || 0).toFixed(2),
            p95FrameMs: +p95.toFixed(2),
            drawCalls: r.render.calls,
            triangles: r.render.triangles,
            geometries: r.memory.geometries,
            textures: r.memory.textures,
            squadCount: this.squad.count,
            enemyCount: this.enemies.enemies.length,
            quality: this.world.quality
        };
    }

    /** V3.7 运行时美术资源追踪报告: 证明实际渲染场景使用的模型/材质/纹理来源 */
    artReport() {
        var self = this;
        var provenance = {};   // artSource标签 -> {objects, meshes}
        var untaggedMeshes = 0;
        var sceneObjs = 0;
        this.world.scene.traverse(function(node) {
            sceneObjs++;
            var src = node.userData && node.userData.artSource;
            if (node.isMesh || node.isSprite || node.isInstancedMesh) {
                if (src) {
                    if (!provenance[src]) provenance[src] = { objects: 0, visible: 0 };
                    provenance[src].objects++;
                    if (node.visible) provenance[src].visible++;
                } else if (node.parent && !(node.parent.userData && node.parent.userData.artSource)) {
                    untaggedMeshes++;
                }
            }
        });
        // 归组: 带标签的Group/InstancedMesh自身记1, 其子mesh跟随标签(上面parent逻辑会跳过计数, 但要并入)
        // 简化: 重新遍历, 子对象继承最近祖先标签; Sprite继承共享材质标签
        var grouped = {};
        this.world.scene.traverse(function(node) {
            var src = null;
            var n = node;
            while (n) {
                if (n.userData && n.userData.artSource) { src = n.userData.artSource; break; }
                n = n.parent;
            }
            if (!src && node.material && node.material.userData && node.material.userData.artSource) {
                src = node.material.userData.artSource;
            }
            if (!src) return;
            if (!node.visible) return; // 隐藏对象(如粒子池)不计入实际渲染
            if (!grouped[src]) grouped[src] = { objects: 0, visible: 0 };
            grouped[src].objects++;
            grouped[src].visible++;
        });

        // 外部资产加载状态
        var assetStatus = [];
        var imgs = document.images;
        for (var i = 0; i < imgs.length; i++) {
            assetStatus.push({
                src: imgs[i].src.split('/').slice(-2).join('/'),
                status: imgs[i].complete && imgs[i].naturalWidth > 0 ? 'LOADED' : 'FAILED',
                used: 'UI/' + (imgs[i].alt || 'img')
            });
        }
        var bulletTexLoaded = !!(this.combat && this.combat._bulletTex);
        assetStatus.push({
            src: 'assets/art-v1/effects/bullet-glow.svg',
            status: bulletTexLoaded ? 'LOADED' : (this.combat && this.combat._bulletMat && this.combat._bulletMat.map ? 'FALLBACK(程序化兜底)' : 'LOADING'),
            used: '弹道Sprite纹理'
        });

        var perf = this.getPerf();
        return {
            timestamp: new Date().toISOString(),
            sceneObjects: sceneObjs,
            provenance: grouped,
            untaggedRenderables: untaggedMeshes,
            assets: assetStatus,
            perf: perf,
            camera: {
                pos: this.world.camera.position.toArray().map(function(x) { return +x.toFixed(2); }),
                fov: this.world.camera.fov
            },
            modelPolicy: 'V4.1: assets/models/soldier/soldier.glb + soldier-lod.glb / embedded PBR atlas / rigid-part instancing',
            soldierModel: { status: SoldierModelLoader.status, loadMs: SoldierModelLoader.loadMs }
        };
    }

    /** V3.7 调试面板(?debug=1): FPS/DrawCall/模型来源 实时显示 */
    _setupDebugPanel() {
        if (location.search.indexOf('debug') === -1) return;
        var self = this;
        var div = document.createElement('div');
        div.id = 'art-debug-panel';
        div.style.cssText = 'position:fixed;left:8px;bottom:8px;z-index:99998;background:rgba(10,20,40,0.82);color:#7FE0FF;font:11px/1.5 monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:pre;max-width:46vw;';
        document.body.appendChild(div);
        this._debugPanel = div;
        this._debugPanelIv = setInterval(function() {
            if (!self._debugPanel) { clearInterval(self._debugPanelIv); return; } // V10 QA: 面板移除后停止轮询
            var p = self.getPerf();
            var src = [
                '士兵: GLB / PBR / 分部件实例化 / ' + (self.squad.count > 100 ? 'LOD' : '完整模型'),
                '僵尸: ' + (self.enemies.enemies.length ? (self.enemies.enemies[0].model.userData.artSource || '?') : '场景无僵尸'),
                'Boss: ' + (self.enemies.boss ? (self.enemies.boss.model.userData.artSource || '?') : '未出现')
            ].join('\n');
            self._debugPanel.textContent =
                'FPS ' + p.fps + ' | work ' + p.workMs + 'ms | DC ' + p.drawCalls + ' | Tri ' + (p.triangles / 1000).toFixed(0) + 'k\n' +
                '兵 ' + p.squadCount + ' | 敌 ' + p.enemyCount + ' | 画质 ' + p.quality + '\n' + src;
        }, 500);
    }

    start() {
        try {
            var level = LEVELS[this.levelIndex];
            // V18.0: 严格1人开局! 原新兵招募等级平滑迁移为开局战术护盾与征召效率
            this.squad.reset(1);
            if (this.shop && this.profile) {
                var recLv = this.shop.levelOf(this.profile, 'recruit');
                if (recLv >= 2 && this.squad.grantMedicalShield) this.squad.grantMedicalShield(Math.min(2, Math.floor(recLv / 2)), 12);
                this.squad.pierce = Math.min(3, this.shop.pierceBonus(this.profile));
            }
            // V8.0: 武器+科技战斗属性
            this._weaponStats = (typeof WeaponSystem !== 'undefined' && this.profile) ? WeaponSystem.stats(this.profile) : {};
            this._techStats = (typeof TechTree !== 'undefined' && this.profile) ? TechTree.combatStats(this.profile) : {};
            // V10 QA: 科技"战术储备"开局金币接线(每关一次幂等发放, 防重开刷币)
            if (this._techStats.startCoins && this.profile) {
                this.profile.claimReward('startcoins:L' + this.levelIndex, this._techStats.startCoins);
            }
            if (this._techStats.pierceBonus) this.squad.pierce = Math.min(3, this.squad.pierce + this._techStats.pierceBonus);
            if (this._techStats.critBonus) this.squad.critChance = Math.min(0.5, this.squad.critChance + this._techStats.critBonus);
            if (this._techStats.explosive) this.squad.explosive = Math.max(this.squad.explosive, 1); // 爆炸弹头科技
            // V8.0.1: 武器特化效果接线(修复: 武器特殊属性此前未进入战斗)
            var ws = this._weaponStats || {};
            if (ws.pierceBonus) this.squad.pierce = Math.min(5, this.squad.pierce + ws.pierceBonus);
            if (ws.chain) this.squad.chain = Math.max(this.squad.chain, ws.chain);
            if (ws.slowMul) this.squad.freezeStacks = Math.max(this.squad.freezeStacks, Math.round((1 - ws.slowMul) * 10));
            if (ws.radius) this.squad.explosive = Math.max(this.squad.explosive, Math.round(ws.radius * 2));
            if (ws.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + ws.critBonus);
            // V10.1: 武器特殊属性接线(修复: pellets/burn/dualLane 此前定义后无消费者)
            this.squad._wpnPellets = ws.pellets || 1;   // 散弹枪: 每次射击多发弹丸扇形铺散
            this.squad._wpnBurn = !!ws.burn;            // 地狱火箭: 命中附加燃烧DoT
            this.squad._wpnDualLane = !!ws.dualLane;    // 风暴机枪: 平行双弹道
            // V8.0: 士兵成长属性(等级+装备)
            if (typeof SoldierGrowth !== 'undefined' && this.profile) {
                var solStats = SoldierGrowth.stats(this.profile);
                if (solStats.dmgBonus) this.squad.damageBuff = Math.min(99, this.squad.damageBuff + solStats.dmgBonus);
                if (solStats.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + solStats.critBonus);
                this._soldierStats = solStats;
            }
            // VNext: 职业系统 — 属性乘区+被动+技能循环
            if (typeof SoldierClass !== 'undefined' && this.profile) {
                this._classStats = SoldierClass.combat(this.profile);
                var cs = this._classStats;
                if (cs.critBonus) this.squad.critChance = Math.min(0.8, this.squad.critChance + cs.critBonus);
                if (cs.pierce) this.squad.pierce = Math.min(5, this.squad.pierce + cs.pierce);
                this.squad._classBulletSpeed = cs.bulletSpeed;
                if (cs.eliteDmgMul && cs.eliteDmgMul !== 1) this.squad._classEliteMul = cs.eliteDmgMul;
                else this.squad._classEliteMul = 0;
                // 总减伤 = 科技 + 职业 + 士兵成长/装备 (killSoldiers 消费, 上限60%)
                this.squad._totalDr = Math.min(0.6, (this._techStats.drBonus || 0) + (cs.dr || 0) + ((this._soldierStats && this._soldierStats.drBonus) || 0));
            } else {
                this._classStats = null;
                this.squad._totalDr = Math.min(0.6, this._techStats.drBonus || 0);
            }
            // V6.0: 关卡主题(末日核心等) + 能源核心生成
            if (this.world.applyTheme) this.world.applyTheme(level.theme);
            this._setupEnergyCore(level);
            this.gates.loadFromLevel(level);
            this.enemies.loadFromLevel(level, this.levelIndex);
            this.enemies.bossStyle=level.bossStyle;
            // V6.0: 波次计划加载(L1-L5吃boost, L6手授终稿)
            this.pacing.loadFromLevel(level, this.levelIndex, this.levelIndex < 5);
            this.gates.resolveSkillGates(this.squad); // V6.0: 技能门roll(需squad._skills已重置)
            this.gates.syncVisibility(this.pacing, 0, this.squad.z);
            this._showBossWarning(false);
            this.combat.clear();
            this.effects.clear();
            // V3.4: 每局重置广告次数 + 音频手势初始化
            if (this.adCoord) this.adCoord.startRun();
            this._doubleTaken = false;
            // V5.1: 消耗免费补给(首页广告获得, 本局生效)
            this._consumePendingSupply();
            if (typeof Platform !== 'undefined') Platform.audio.init();

            this.state = 'playing';
            this.paused = false;
            this.time = 0;
            this.elapsedTime = 0;
            this._waveNoticeT=0;
            var notice=document.getElementById('v42-wave-banner');if(notice)notice.classList.add('hidden');
            this.kills = 0;
            this.maxCount = level.startCount;
            this.bossSpawned = false;
            this.bossDefeated = false;
            // V3.3: 重置连杀
            this.combo = 0;
            this.comboTimer = 0;
            this.maxCombo = 0;
            this._prevKillCount = 0;
            this._comboMilestone = 0;
            this._comboFeedbackCooldown = 0;
            if (this.ui.comboBox) this.ui.comboBox.classList.add('hidden');
            this._prevDamage = this.squad.getDamage();
            this._prevFireRate = this.squad.getFireRate();
            // V10.1: HUD脏检查缓存复位(新一局强制全量刷新)
            this._cachedBossActive = undefined; this._cachedProgress = undefined;
            this._cachedBadgeX = undefined; this._cachedBadgeY = undefined; this._cachedBadgeShown = undefined;
            this._cachedComboShown = undefined; this._cachedCombo = undefined; this._cachedComboHot = undefined;
            this._cachedStatCount = undefined; this._cachedStatDamage = undefined; this._cachedStatFr = undefined;
            this._cachedCountNum = undefined;
            for (var pn = 0; pn < this.progressNodes.length; pn++) this.progressNodes[pn]._lastCls = undefined;
            this._adBtnT = 0;

            // V8.0: 随机事件系统每局重置
            if (typeof RandomEvents !== 'undefined') RandomEvents.reset();
            // V15-GAMEPLAY-002: 战斗主动战术技能冷却与按钮刷新
            this._resetActiveSkills();
            // V8.0: 挑战模式竞技场装配(普通关卡为 null)
            if (this._pendingChallenge) {
                this._challenge = this._pendingChallenge;
                this._pendingChallenge = null;
                this._initChallengeArena();
            } else {
                this._challenge = null;
            }

            // 更新关卡名和等级徽章
            if (this.ui.levelName) this.ui.levelName.textContent = level.name;
            if (this.ui.levelBadge) this.ui.levelBadge.textContent = 'Lv.' + (this.levelIndex + 1);

            // 构建进度节点
            this._buildProgressNodes(level);

            if (this.ui.startScreen) this.ui.startScreen.classList.add('hidden');
            if (this.ui.winScreen) this.ui.winScreen.classList.add('hidden');
            if (this.ui.loseScreen) this.ui.loseScreen.classList.add('hidden');
            if (this.ui.pauseScreen) this.ui.pauseScreen.classList.add('hidden');
            if (this.ui.hud) this.ui.hud.classList.remove('hidden');
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            // V3.4: 刷新广告按钮可见性
            this._updateAdButtons();
            this._updateSoundLabel();
            this._updateUI();
        } catch (err) {
            this._showError('[start错误] ' + err.message + '\n' + (err.stack || ''));
        }
    }

    // ===== V8.0: 挑战模式(无尽生存 / Boss试炼) =====
    /** 进入挑战模式: 用最高解锁关作为竞技场, 失败即结算 */
    startChallengeMode(type) {
        if (typeof CHALLENGE_MODES === 'undefined' || !CHALLENGE_MODES[type]) return false;
        var unlocked = this.profile ? (this.profile.data.unlockedLevel || 1) : 1;
        this.levelIndex = Math.min(LEVELS.length - 1, Math.max(0, unlocked - 1));
        this._pendingChallenge = {
            type: type, cfg: CHALLENGE_MODES[type],
            wave: 0, waveT: 3, time: 0, holdZ: undefined,
            _bossStart: 0, _scored: false
        };
        this.start();
        if (this.ui.levelName) this.ui.levelName.textContent = CHALLENGE_MODES[type].name;
        if (this.ui.levelBadge) this.ui.levelBadge.textContent = '⚔️';
        return true;
    }

    /** 竞技场初始化: 记录驻守线与Boss击杀基准 */
    _initChallengeArena() {
        var c = this._challenge;
        if (!c) return;
        c.holdZ = this.squad.z - 14;
        c._bossStart = this.enemies.bossKills || 0;
        c._scored = false;
        c.time = 0;
        c.wave = 0;
        c.waveT = 3;
        if (this.effects) {
            this.effects.floatText(this.squad.x, 2.6, this.squad.z - 2, c.cfg.icon + ' ' + c.cfg.name + ' 开始!', '#FFC247', true);
        }
    }

    /** 挑战波次驱动: 生存=混合波(每5波Boss); Boss试炼=纯Boss连续 */
    _updateChallenge(dt) {
        var c = this._challenge;
        if (!c || c.holdZ === undefined) return;
        c.time += dt;
        c.waveT -= dt;
        if (c.waveT > 0) return;
        c.wave++;
        if (c.type === 'survival') {
            c.waveT = Math.max(7, 12 - c.wave * 0.3);
            if (c.wave % 5 === 0) {
                // 每5波Boss: HP按波次指数增长
                var bhp = Math.round(1200 * Math.pow(c.cfg.hpScale || 1.12, c.wave));
                this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp);
                this._showBossWarning(true);
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '⚔️ Boss来袭!', '#FF4444', true);
            } else {
                var count = Math.min(70, 16 + Math.round(c.wave * 5));
                for (var i = 0; i < count; i++) {
                    var lane = i % 3;
                    var type = (c.wave >= 3 && i % 9 === 8) ? 'elite' : (i % 5 === 4 ? 'fast' : 'normal');
                    var x = CONFIG.LANE_X[lane] + (Math.random() - 0.5) * 2.4;
                    this.enemies.spawnEnemy(type, x, this.squad.z - CONFIG.BULLET_RANGE * (0.75 + Math.random() * 0.25), 0);
                }
                if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '第 ' + c.wave + ' 波', '#FF8844', true);
            }
        } else if (c.type === 'boss_rush') {
            c.waveT = 6;
            var bhp2 = Math.round(1000 * Math.pow(c.cfg.hpScale || 1.25, c.wave));
            this.enemies.spawnEnemy('boss', CONFIG.LANE_X[1], this.squad.z - 14, bhp2);
            this._showBossWarning(true);
            if (this.effects) this.effects.floatText(this.squad.x, 2.4, this.squad.z - 3, '👑 第 ' + c.wave + ' 个Boss', '#FFC247', true);
        }
    }

    _loop(timestamp) {
        if (this._rafDisabled) return; // V10.1: 测试密闭化开关 — 停止实时循环, 帧推进改由外部 _update 驱动
        requestAnimationFrame(this._loop);
        var workT0 = performance.now();
        if (this.lastTime === 0) { this.lastTime = timestamp; return; }
        var dt = Math.min((timestamp - this.lastTime) / 1000, 0.05);
        this.lastTime = timestamp;

        // 性能采样: FPS指数移动平均 + P95帧耗时统计 (V3.6)
        this._fpsEma = this._fpsEma ? this._fpsEma * 0.95 + (1 / Math.max(dt, 0.0001)) * 0.05 : 1 / Math.max(dt, 0.0001);
        this._frameMs = dt * 1000;
        if (!this._frameTimes) this._frameTimes = [];
        this._frameTimes.push(this._frameMs);
        if (this._frameTimes.length > 300) this._frameTimes.shift();

        if (this.state === 'playing' && !this.paused) {
            // V4.0: 慢动作缩放游戏时间(输入/UI仍用真实dt)
            if (this._slowmoT > 0) {
                this._slowmoT -= dt;
            } else {
                this._timeScale = 1;
            }
            var ts = this._timeScale;
            this.time += dt * ts;
            this._update(dt * ts); // V5.1: elapsedTime 移入 _update(手动步进与真实循环一致)
        } else if (this.state === 'idle') {
            // 待机: 相机轻微摆动展示场景
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.world.updateCamera(Math.sin(this.time * 0.4) * 0.6, 0, dt, 1);
        } else if (this.state === 'won' || this.state === 'lost') {
            this.time += dt;
            this.squad.update(dt, this.time, this.squad.z);
            this.enemies.finishDeaths(dt,this.time,this.squad);
            this.effects.update(dt);
        }

        this.world.renderer.render(this.world.scene, this.world.camera);

        // 单帧计算耗时(含update+render提交, 不受rAF节流影响)
        this._workMs = this._workMs ? this._workMs * 0.9 + (performance.now() - workT0) * 0.1 : (performance.now() - workT0);
    }

    _update(dt) {
        try {
            if (this.state === 'playing' && !this.paused) this.elapsedTime += dt; // V5.1
            this._updateInner(dt);
        } catch (err) {
            this._showError('[update错误] ' + err.message + '\n' + (err.stack || ''));
            this.state = 'lost'; // 停止循环避免刷屏
        }
    }

    _updateInner(dt) {
        if(this._waveNoticeT>0){this._waveNoticeT=Math.max(0,this._waveNoticeT-dt);if(!this._waveNoticeT){var _wb=document.getElementById('v42-wave-banner');if(_wb)_wb.classList.add('hidden');}} // V12: 移除ES2020可选链
        // 核心系统更新
        // Boss存活时小队在Boss前方停下，击败Boss才能继续
        var stopZ = this.enemies.boss ? this.enemies.boss.z + 4.5 : null;
        var frontier = this.pacing.frontierStopZ();
        if (frontier !== null) stopZ = stopZ === null ? frontier : Math.max(stopZ, frontier);
        // V12修复: 挑战模式驻守固定阵地, 门停线不外推驻守点(门前停线曾使挑战模式小队滞留门前
        // 无法接敌 → 永不战败, v80 挑战失败判定/结算标记/失败原因三项回归)
        var gateStop = (this._challenge && this._challenge.holdZ !== undefined)
            ? null
            : this.gates.approachStopZ(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        if (gateStop !== null) stopZ = stopZ === null ? gateStop : Math.max(stopZ, gateStop);
        // V8.0: 挑战模式 — 小队驻守固定阵地
        if (this._challenge && this._challenge.holdZ !== undefined) {
            stopZ = stopZ === null ? this._challenge.holdZ : Math.max(stopZ, this._challenge.holdZ);
        }
        this.squad.update(dt, this.time, stopZ);
        // V5.1: 全屏爆炸门 — 对场上所有活敌 50%maxHp 结算
        if (this.squad.nukePending) {
            this.squad.nukePending = false;
            var nuked = 0;
            for (var ni = 0; ni < this.enemies.enemies.length; ni++) {
                var ne = this.enemies.enemies[ni];
                if (!ne.alive) continue;
                ne.takeDamage(Math.max(20, ne.maxHp * 0.5), this.effects, ne.x, false);
                nuked++;
            }
            // V14: tier3 分级爆炸(全屏爆炸门) + 既有金色飘字/震屏
            if (this.effects.explosion) this.effects.explosion(this.squad.x, 1.0, this.squad.z - 6, 3);
            if (typeof Platform !== 'undefined' && Platform.audio) Platform.audio.play('boom'); // V16: 全屏爆炸音效(原为静默)
            this.world.shake(0.5);
            this.effects.floatText(this.squad.x, 2.4, this.squad.z, '全屏爆炸!', '#FFC247', true);
        }
        this.gates.syncVisibility(this.pacing, this.enemies.encounterOutstanding, this.squad.z);
        this.gates.update(this.squad, this.effects, this.time, dt);
        // V4.0: 节奏控制器驱动分批刷怪/Boss预警
        this.pacing.update(dt, this.squad);
        this.enemies.update(dt, this.time, this.squad);
        if (this.energyCore) this.energyCore.update(dt, this.time, this.squad, this.enemies.enemies, this.effects);
        this.combat.update(dt, this.squad, this.enemies, this.energyCore);
        this.combat._syncInstances();
        this.effects.update(dt);

        // V10 QA: 每日任务进度轮询从每帧5次降为每0.5秒1次(原实现每帧5次全量profile.save ≈300次/s的localStorage写入)
        if (typeof ChallengeDaily !== 'undefined' && this.profile) {
            this._dailyPollT = (this._dailyPollT || 0) + dt;
            if (this._dailyPollT >= 0.5) {
                this._dailyPollT = 0;
                ChallengeDaily.report(this.profile, 'kills', 0);
                ChallengeDaily.report(this.profile, 'squad', 0);
                ChallengeDaily.report(this.profile, 'gates', 0);
                ChallengeDaily.report(this.profile, 'skills', 0);
                ChallengeDaily.report(this.profile, 'boss', 0);
            }
        }
        // V8.0: 随机事件 + 挑战模式波次驱动 + V15主动技能冷却
        if (typeof RandomEvents !== 'undefined') RandomEvents.update(dt, this);
        this._updateActiveSkills(dt);
        if (this._challenge) this._updateChallenge(dt);
        // V3.3: 连杀系统 — 击杀数增长时combo+1, 2秒无击杀清零
        var kc = this.enemies.killCount;
        this._comboFeedbackCooldown = Math.max(0, this._comboFeedbackCooldown - dt);
        if (kc > this._prevKillCount) {
            var newKills = kc - this._prevKillCount;
            var previousCombo = this.combo;
            this.combo += newKills;
            this.comboTimer = 3.0;
            // 连杀里程碑
            var milestones = [10, 30, 50, 100];
            for (var mi = 0; mi < milestones.length; mi++) {
                if (previousCombo < milestones[mi] && this.combo >= milestones[mi]) {
                    if (this._comboMilestone !== milestones[mi]) {
                        this._comboMilestone = milestones[mi];
                        this.effects.floatText(this.squad.x, 2.2, this.squad.z - 1, milestones[mi] + '连杀!', '#FFC247', true);
                        this.effects.shockwave(this.squad.x, 0.05, this.squad.z, 0xFFC247);
                        // Celebrate milestones without interrupting ordinary fire.
                        if (this._comboFeedbackCooldown === 0) {
                            this.world.shake(0.08, 0.18);
                            this._comboFeedbackCooldown = 1;
                            if (this.ui.comboBox) {
                                this.ui.comboBox.classList.remove('combo-hit');
                                this.ui.comboBox.classList.add('combo-hit');
                            }
                        }
                    }
                }
            }
            this.maxCombo = Math.max(this.maxCombo || 0, this.combo);
        }
        this._prevKillCount = kc;
        if (this.comboTimer > 0) {
            this.comboTimer -= dt;
            if (this.comboTimer <= 0) { this.combo = 0; this._comboMilestone = 0; }
        }

        // 场景跟随
        this.world.updateRoadScroll(this.squad.z);
        this.world.updateCamera(this.squad.x, this.squad.z, dt, this.squad.count,this.squad.getDepth());

        // UI刷新
        this._updateUI();

        // Boss血条
        if (this.enemies.boss) {
            this.bossSpawned = true;
            if (this.ui.bossBar) this.ui.bossBar.classList.remove('hidden');
            var bosses=this.enemies.enemies.filter(e=>e.isBoss&&e.alive);
            // V10 QA修复: Boss死亡瞬间 bosses 可为空数组 → 0/0=NaN 血条, 加空值守卫
            var hpSum=bosses.reduce((n,e)=>n+e.hp,0), maxSum=bosses.reduce((n,e)=>n+(e.maxHp||0),0);
            var ratio = maxSum>0 ? Math.max(0,hpSum/maxSum) : 0;
            var bossNameNode=document.getElementById('boss-name');
            // V10 QA修复: L9双Boss各自显示自己的title(按 artStyle 匹配段配置, 原固定读 BOSS_NAMES[levelIndex])
            var segBoss=(LEVELS[this.levelIndex].segments||[]).find(s=>s.type==='boss'&&s.boss&&s.boss.style===(this.enemies.boss&&this.enemies.boss.artStyle));
            var bossTitle=(segBoss&&segBoss.boss&&segBoss.boss.title)||CONFIG.BOSS_NAMES[this.levelIndex];
            if(bossNameNode){ // V12: 结构无关的文本更新(原依赖firstChild.nodeType===3, HTML结构变动即失效)
                var _bnTextNode=null;
                for(var _bnI=0;_bnI<bossNameNode.childNodes.length;_bnI++){if(bossNameNode.childNodes[_bnI].nodeType===3){_bnTextNode=bossNameNode.childNodes[_bnI];break;}}
                if(_bnTextNode)_bnTextNode.nodeValue=bossTitle;else bossNameNode.textContent=bossTitle;
            }
            var phaseLabel=document.getElementById('boss-phase');
            if(phaseLabel)phaseLabel.textContent='阶段 '+(this.enemies.boss.phaseIndex||1)+(this.enemies.boss.shieldT>0?' · 护盾':'');
            if (this.ui.bossFill) this.ui.bossFill.style.width = (ratio * 100) + '%';
            // V10 QA修复: Boss图鉴"遭遇过"标记(原 d.bossSeen 从未写入, 只靠fallback)
            if (this.profile && typeof this.profile.data.bossSeen === 'object') {
                var bk=(this.enemies.boss && this.enemies.boss.artStyle)||CONFIG.BOSS_NAMES[this.levelIndex];
                if (!this.profile.data.bossSeen[bk]) { this.profile.data.bossSeen[bk] = true; this.profile.save(); }
            }
        }

        // V5.1 胜利判定(阵地防守): 全部波次排空 + 场上无敌(含Boss已亡+召唤清完) → 通关
        // V8.0: 挑战模式无通关 — 由失败结算
        if (!this._challenge && this.pacing.isComplete() && this.enemies.encounterOutstanding === 0 && !this.enemies.boss) {
            this.bossDefeated = true; // 兼容旧标志(E2E引用)
            if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
            this._win();
            return;
        }
        if (!this.squad.alive || this.squad.count <= 0) {
            // V3.3: 失败原因追踪
            var reason = '小队全灭';
            if (this.enemies.boss) reason = 'Boss战失利 · 输出不足';
            else if (this.enemies.aliveCount > 8) reason = '被怪潮吞噬 · 人数不足';
            else reason = '阵亡于残敌 · 火力分散';
            this._lose(reason);
            return;
        }
    }

    /** V10.1: HUD刷新脏检查 — 原实现每帧 getElementById+无条件DOM写(剖析占17.3%主线程) */
    _updateUI() {
        var bossActive = !!this.enemies.boss && this.state === 'playing';
        if (this._containerEl === undefined) this._containerEl = document.getElementById('game-container'); // V11 QA: 只查一次, 容器缺失时不逐帧取null调用
        if (this._containerEl && this._cachedBossActive !== bossActive) {
            this._cachedBossActive = bossActive;
            this._containerEl.classList.toggle('boss-active', bossActive);
        }
        var level = LEVELS[this.levelIndex];
        var progress = clamp(-this.squad.z / -level.totalZ, 0, 1);
        var progPct = (progress * 100).toFixed(1);
        if (this._cachedProgress !== progPct) {
            this._cachedProgress = progPct;
            if (this.ui.progressFill) this.ui.progressFill.style.width = progPct + '%';
            if (this.ui.progressFlag) this.ui.progressFlag.style.left = progPct + '%';
            var pctText = document.getElementById('v15-progress-pct');
            if (pctText) pctText.textContent = Math.round(progress * 100) + '%';
        }
        // V15 顶栏右上角真实金币与人数绑定
        var v15Coins = (this.profile ? (this.profile.coins || 0) : 0) + (this.runCoins || 0);
        if (this._cachedV15Coins !== v15Coins) {
            this._cachedV15Coins = v15Coins;
            var coinEl = document.getElementById('v15-hud-coins');
            if (coinEl) coinEl.textContent = v15Coins.toLocaleString();
        }
        if (this._cachedV15Squad !== this.squad.count) {
            this._cachedV15Squad = this.squad.count;
            var sqEl = document.getElementById('v15-hud-squad');
            if (sqEl) sqEl.textContent = this.squad.count;
        }

        // 进度节点
        this._updateProgressNodes();

        // 人数气泡: 跟随小队头顶(V3.6: 3D投影定位,随队伍移动不遮挡弹道)
        if (this.ui.countBadge && this.state === 'playing') {
            var cam = this.world.camera;
            this._badgeV.set(this.squad.x, 1.42 * (this.squad._formationScale || 1) + .2, this.squad.z - .1).project(cam);
            if (this._badgeV.z < 1) {
                var cw = this.world.viewportWidth || window.innerWidth;
                var ch = this.world.viewportHeight || window.innerHeight;
                var sx = (this._badgeV.x * 0.5 + 0.5) * cw;
                var sy = (-this._badgeV.y * 0.5 + 0.5) * ch;
                // 屏幕内钳制: 避免压到HUD或飞出边界
                sx = clamp(sx, 46, cw - 46);
                sy = clamp(sy, 150, ch - 40);
                if (sy < 200 && sx < 145) sx = 145; // 避让左上属性面板
                var sxR = Math.round(sx), syR = Math.round(sy - 18);
                if (this._cachedBadgeX !== sxR || this._cachedBadgeY !== syR) {
                    this._cachedBadgeX = sxR; this._cachedBadgeY = syR;
                    // V11.6: transform 代替 left/top — 合成器路径, 不触发每帧布局
                    this.ui.countBadge.style.transform = 'translate3d(' + sxR + 'px,' + syR + 'px,0)';
                }
                if (this._cachedBadgeShown !== true) { this._cachedBadgeShown = true; this.ui.countBadge.style.display = 'flex'; }
            } else if (this._cachedBadgeShown !== false) {
                this._cachedBadgeShown = false;
                this.ui.countBadge.style.display = 'none';
            }
        }

        // 人数气泡(变化时触发弹出/抖动动画)
        if (this.ui.countNum) {
            // V11.6: 数值先行比较, 避免每帧 String 分配
            if (this._cachedCountNum !== this.squad.count) {
                var countStr = String(this.squad.count);
                this._cachedCountNum = this.squad.count;
                var prevCount = parseInt(this.ui.countNum.textContent) || 0;
                this.ui.countNum.textContent = countStr;
                var animClass = this.squad.count > prevCount ? 'pop' : 'shake';
                if (this.ui.countBadge) {
                    this.ui.countBadge.classList.remove('pop', 'shake');
                    void this.ui.countBadge.offsetWidth;
                    this.ui.countBadge.classList.add(animClass);
                }
            }
        }

        // 追踪最大人数
        if (this.squad.count > this.maxCount) {
            this.maxCount = this.squad.count;
        }

        // V3.3: 连杀HUD (combo>=5时显示)
        if (this.ui.comboBox) {
            var comboShown = this.combo >= 5 && this.state === 'playing';
            if (this._cachedComboShown !== comboShown) {
                this._cachedComboShown = comboShown;
                this.ui.comboBox.classList.toggle('hidden', !comboShown);
            }
            if (comboShown && this.ui.comboNum) {
                if (this._cachedCombo !== this.combo) { this._cachedCombo = this.combo; this.ui.comboNum.textContent = this.combo; }
                var hot = this.combo >= 30;
                if (this._cachedComboHot !== hot) { this._cachedComboHot = hot; this.ui.comboBox.classList.toggle('hot', hot); }
            }
        }

        // V3.4: 刷门按钮状态刷新(战斗中, 0.5s一次)
        if (this.adCoord && this.state === 'playing') {
            this._adBtnT = (this._adBtnT || 0) - 1;
            if (this._adBtnT <= 0) { this._adBtnT = 15; this._updateAdButtons(); }
        }

        // 属性面板(带变化动画) — 数值脏检查后写DOM
        if (this.ui.statCount) {
            var cnt = this.squad.count;
            if (this._cachedStatCount !== cnt) {
                this._cachedStatCount = cnt;
                this.ui.statCount.textContent = cnt;
                if (this.ui.statRowCount && this.ui.countNum && String(cnt) !== this.ui.countNum.textContent) {
                    this.ui.statRowCount.classList.remove('bump');
                    void this.ui.statRowCount.offsetWidth;
                    this.ui.statRowCount.classList.add('bump');
                }
            }
            var curDmg = this.squad.getDamage();
            if (this._cachedStatDamage !== curDmg) {
                this._cachedStatDamage = curDmg;
                this.ui.statDamage.textContent = curDmg;
                if (curDmg !== this._prevDamage && this.ui.statRowDamage) {
                    this.ui.statRowDamage.classList.remove('flash');
                    void this.ui.statRowDamage.offsetWidth;
                    this.ui.statRowDamage.classList.add('flash');
                }
                this._prevDamage = curDmg;
            }
            var curFr = this.squad.getFireRate();
            var frStr = curFr.toFixed(1);
            if (this._cachedStatFr !== frStr) {
                this._cachedStatFr = frStr;
                this.ui.statFirerate.textContent = frStr;
                if (Math.abs(curFr - this._prevFireRate) > 0.01 && this.ui.statRowFirerate) {
                    this.ui.statRowFirerate.classList.remove('bump');
                    void this.ui.statRowFirerate.offsetWidth;
                    this.ui.statRowFirerate.classList.add('bump');
                }
                this._prevFireRate = curFr;
            }
        }
    }

    _win() {
        this.state = 'won';
        this._sfx('win'); // V5.0
        this.squad.setAnimationState('Victory');
        // V5.1: 金币结算(幂等入账) + 档案统计
        this._doubleApplied = false;
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, true, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this._newUnlocked = this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, true, LEVELS.length);
            // V6.0: 星级/经验/成就/统计
            this._stars = typeof Progression !== 'undefined' ? Progression.computeStars(this.levelIndex, this.squad.count, this.enemies.killCount, true) : 0;
            var starKey = 'L' + (this.levelIndex + 1);
            var prevStars = this.profile.data.stars[starKey] || 0;
            this._newStars = Math.max(0, this._stars - prevStars);
            if (this._stars > prevStars) this.profile.data.stars[starKey] = this._stars;
            if (this.enemies.bossKills) this.profile.data.stats.bossKills = (this.profile.data.stats.bossKills || 0) + this.enemies.bossKills;
            // V10 QA: 科技"训练手册"经验加成接线(原 log_xp 购买后无效果)
            // V11.2: 实战经验技能 — XP ×(1+0.15×层) 叠乘
            var xpMul = ((this._techStats && this._techStats.xpMul) ? this._techStats.xpMul : 1) * (1 + 0.15 * (this.squad._skillFortune || 0));
            this.profile.data.xp = (this.profile.data.xp || 0) + (typeof Progression !== 'undefined' ? Math.round(Progression.computeXp(this.enemies.killCount, true, this.levelIndex, this._newStars) * xpMul) : 0);
            this.profile.data.playerLevel = Progression ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            // V10 QA修复: 胜利上报每日任务(wins类型此前无任何调用方, 通关N关任务永远0进度)
            if (typeof ChallengeDaily !== 'undefined') ChallengeDaily.report(this.profile, 'wins', 1);
            // V10 QA修复: 科技点发放(原 grantTech 全库零调用 → 科研站永远0点, 科技树不可用)
            if (typeof TechTree !== 'undefined') TechTree.grantTech(this.profile, 1 + (this.enemies.bossKills || 0));
            this.profile.save();
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
        }
        // VNext: 通关装备掉落(1件保底, 星级加成)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnWin(this.profile, this.levelIndex, this._stars || 0) : [];
        // VNext: 真实战绩入榜
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            // V11.4: 职业专精计局
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: true, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId
            });
        }
        var starsEl = document.getElementById('win-stars');
        if (starsEl && this._stars !== undefined) {
            starsEl.innerHTML = '★'.repeat(this._stars) + '☆'.repeat(3 - this._stars);
            starsEl.classList.remove('hidden');
        }
        this._fillSettlementUI();
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.winCount) this.ui.winCount.textContent = this.squad.count;
        if (this.ui.winKills) this.ui.winKills.textContent = this.enemies.killCount;
        if (this.ui.winMax) this.ui.winMax.textContent = this.maxCount;
        if (this.ui.winTime) this.ui.winTime.textContent = this.elapsedTime.toFixed(1) + 's';
        // V3.3: 连杀统计
        if (this.ui.winCombo) this.ui.winCombo.textContent = this.maxCombo || 0;
        // V3.3: 通关存档 — 解锁下一关
        this._saveProgress(Math.min(LEVELS.length, this.levelIndex + 2));
        // V3.4: 双倍按钮(每通关限1次)
        this._updateAdButtons();
        if (this.ui.winScreen) this.ui.winScreen.classList.remove('hidden');
        // V3.3: 胜利→下一关按钮
        var hasNext = this.levelIndex + 1 < LEVELS.length;
        if (this.ui.btnNextLevel) {
            this.ui.btnNextLevel.classList.toggle('hidden', !hasNext);
        }
    }

    _lose(reason) {
        this.state = 'lost';
        this.lastLoseReason = reason; // V5.0: 供平衡模拟分析失败原因
        this._sfx('lose'); // V5.0
        // V5.1: 失败只给少量击杀金币(防故意失败刷钱)
        this._settlement = this.profile ? settleRunEconomy(this.profile, LEVELS[this.levelIndex], this.levelIndex, this.enemies.killCount, false, false, (typeof Skills !== 'undefined' ? Skills.coinBonus(this.squad) : (this.squad._skillMagnet || 0))) : null;
        if (this.profile) {
            this.profile.recordRun(this.levelIndex, this.enemies.killCount, this.maxCount, false, LEVELS.length);
            this.profile.data.xp = (this.profile.data.xp || 0) + this.enemies.killCount * (typeof XP_RULES !== 'undefined' ? XP_RULES.perKill : 1);
            this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
            this._newAchievements = typeof Progression !== 'undefined' ? Progression.checkAchievements(this.profile) : [];
            this.profile.save();
        }
        // V8.0: 挑战模式结算 — 分数+奖励+最高纪录(幂等: _scored 防重复)
        // VNext: 失败也有25%概率掉落1件装备(保底参与感)
        this._drops = (typeof EquipmentLoot !== 'undefined' && this.profile)
            ? EquipmentLoot.rollOnLose(this.profile, this.levelIndex) : [];
        // VNext: 真实战绩入榜(失败也计)
        if (typeof Leaderboard !== 'undefined' && this.profile) {
            if (typeof SoldierClass !== 'undefined') SoldierClass.recordGame(this.profile, this.profile.data.classId);
            Leaderboard.record(this.profile, {
                level: this.levelIndex + 1, win: false, kills: this.enemies.killCount,
                maxCount: this.maxCount, combo: this.maxCombo, time: this.elapsedTime,
                classId: this.profile.data.classId,
                challenge: this._challenge ? this._challenge.type : null
            });
        }
        if (this._challenge && !this._challenge._scored) {
            this._challenge._scored = true;
            var cScore = this._challenge.type === 'survival'
                ? this.enemies.killCount
                : Math.max(0, (this.enemies.bossKills || 0) - (this._challenge._bossStart || 0));
            var cReward = this.profile ? Math.round(cScore * (this._challenge.type === 'survival' ? 0.5 : 1.2)) : 0;
            if (this.profile) {
                this.profile.addCoins(cReward);
                this.profile.data.xp = (this.profile.data.xp || 0) + Math.round(cScore * 2);
                this.profile.data.playerLevel = typeof Progression !== 'undefined' ? Progression.levelFromXp(this.profile.data.xp).level : this.profile.data.playerLevel;
                if (!this.profile.data.challengeBest) this.profile.data.challengeBest = {};
                var bestKey = this._challenge.type;
                if (cScore > (this.profile.data.challengeBest[bestKey] || 0)) {
                    this.profile.data.challengeBest[bestKey] = cScore;
                    this._challenge._newBest = true;
                }
                this.profile.save();
            }
            if (this.ui.loseReason) this._challenge._scoreText =
                (this._challenge.cfg ? this._challenge.cfg.name : '挑战') + ' · 得分 ' + cScore +
                (this._challenge._newBest ? ' 🎉新纪录!' : '') + ' · 奖励 ' + cReward + '🪙';
        }
        this._fillSettlementUI();
        if (this.ui.hud) this.ui.hud.classList.add('hidden');
        if (this.ui.bossBar) this.ui.bossBar.classList.add('hidden');
        this._showBossWarning(false);
        // 填充结算数据
        if (this.ui.loseKills) this.ui.loseKills.textContent = this.enemies.killCount;
        if (this.ui.loseMax) this.ui.loseMax.textContent = this.maxCount;
        if (this.ui.loseCombo) this.ui.loseCombo.textContent = this.maxCombo || 0;
        // V3.3: 失败原因
        if (this.ui.loseReason) this.ui.loseReason.textContent = reason || '小队全灭';
        // V8.0: 挑战模式 — 失败原因替换为挑战得分(须在默认原因之后写入)
        if (this._challenge && this._challenge._scored && this._challenge._scoreText && this.ui.loseReason) {
            this.ui.loseReason.textContent = this._challenge._scoreText;
        }
        // V3.4: 复活按钮(每局限1次)
        this._updateAdButtons();
        if (this.ui.loseScreen) this.ui.loseScreen.classList.remove('hidden');
    }

    // ===== V3.3: 存档系统(关卡解锁进度) =====
    /** V5.1: 解锁进度迁移至 GameProfile 持久档(旧 pz_progress 已在建档时迁移) */
    _loadProgress() {
        if (this.profile) return clamp(this.profile.data.unlockedLevel, 1, LEVELS.length);
        try {
            var v = parseInt(window.localStorage.getItem('pz_progress')) || 1;
            return clamp(v, 1, LEVELS.length);
        } catch (e) { return 1; }
    }

    _saveProgress(unlocked) {
        if (this.profile) {
            if (unlocked > this.profile.data.unlockedLevel) {
                this.profile.data.unlockedLevel = unlocked;
                this.profile.save();
            }
            return;
        }
        try {
            var cur = this._loadProgress();
            if (unlocked > cur) {
                window.localStorage.setItem('pz_progress', String(unlocked));
            }
        } catch (e) { /* 存储不可用则跳过 */ }
    }

    /** 刷新关卡选择按钮(解锁状态) */
    _refreshLevelSelect() {
        if (!this.ui.levelSelect) return;
        var unlocked = this._loadProgress();
        this._refreshBestRecord(); // V5.0: 首页最高纪录同步
        var self = this;
        var btns = this.ui.levelSelect.querySelectorAll('button');
        for (var i = 0; i < btns.length; i++) {
            (function(idx, btn) {
                var isUnlocked = idx < unlocked;
                btn.className = 'lv-btn' + (isUnlocked ? ' unlocked' : ' locked') + (idx + 1 === unlocked ? ' current' : '');
                btn.disabled = !isUnlocked;
                btn.onclick = function() {
                    self.levelIndex = idx;
                    self.start();
                };
            })(i, btns[i]);
        }
    }
}

// 启动 (脚本在body底部, DOM已就绪, Three.js已同步加载完成)
(function() {
    function showError(msg) {
        var div = document.getElementById('error-display');
        if (!div) {
            div = document.createElement('div');
            div.id = 'error-display';
            div.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#CC0000;color:#fff;padding:10px 14px;font-size:13px;font-family:monospace;white-space:pre-wrap;pointer-events:none;';
            document.body.appendChild(div);
        }
        div.textContent = msg;
    }

    if (typeof THREE === 'undefined') {
        showError('[致命错误] Three.js 未加载成功!\n请检查网络连接后刷新页面重试。');
        return;
    }

    // VNext: 启动加载界面(真实进度条, 由 index.html 的 __BootProgress 驱动)
    var loading = document.getElementById('boot-loading');
    if (!loading) {
        loading = document.createElement('div');
        loading.id = 'boot-loading';
        loading.textContent = '正在整备绿色小队…';
        document.body.appendChild(loading);
    }
    var starting = false;
    function boot() {
        if (starting || window.__game) return;
        starting = true;
        loading.classList.remove('boot-hidden');
        var actions = document.getElementById('boot-actions');
        if (actions) actions.innerHTML = '';
        window.__BootProgress && window.__BootProgress.stage('整备绿色小队…', 2);
        var error = document.getElementById('error-display');
        if (error) error.remove();
        // Optional scenery downloads alongside the six critical character GLBs.
        // Its playable fallback is built immediately if the pack is unavailable.
        if (typeof MilitaryArt !== 'undefined') MilitaryArt.preload().catch(function() {});
        // Critical characters first; remaining styles continue after home is usable.
        // (_bank 对未就绪体格有 normal 回退; Boss通常开局1-3分钟后才出场, 届时早已加载完成)
        Promise.all([SoldierModelLoader.load(), EnemyModelLoader.loadCritical()]).then(function() {
            window.__BootProgress && window.__BootProgress.stage('构建战场与渲染管线…', 99);
            // V11 QA修复[P3]: 构造失败(如WebGL上下文异常)不再走"重建"重试 —
            // 同canvas二次new Game()会重复注册输入监听; 此路径引导用户刷新页面整体重置
            try {
                if (!window.__game) window.__game = new Game();
                EnemyModelLoader.load().catch(function(error) {
                    console.warn('Optional enemy models use fallback until retry:', error.message);
                });
            } catch (e) {
                starting = false;
                showError('游戏初始化失败：' + e.message + '\n请刷新页面重试。');
                window.__BootProgress && window.__BootProgress.stage('初始化失败', 0);
                return;
            }
            window.__BootProgress && window.__BootProgress.done();
            window.__BootProgress && window.__BootProgress.stage('准备完毕!', 100);
            // V15修复: 就绪即隐藏(原260ms延迟窗口内后台续载事件会回写进度条,
            // 且使"100%后隐藏"成为竞态) — bar 宽度 .18s 过渡保留动画感
            loading.classList.add('boot-hidden');
        }).catch(function(err) {
            starting = false;
            showError('角色资源加载失败：' + err.message);
            window.__BootProgress && window.__BootProgress.stage('资源加载失败', 0);
            var retry = document.createElement('button');
            retry.id = 'btn-retry-model';
            retry.textContent = '重新加载小队';
            retry.onclick = boot;
            var actions = document.getElementById('boot-actions');
            if (actions) actions.appendChild(retry);
            else loading.appendChild(retry);
        });
    }
    boot();
})();



/* ---- index.html 内联引导(等价移植) ---- */
window.__GAME_VERSION = 'v14.0';
window.__AD_TEST_SCENARIO = null; /* 小游戏无 location 注入, 生产恒为 null */
Platform.initialize();
window.__adService = setupAdService();
window.__platformId = Platform.id; /* V12: 供测试/诊断读取 */
