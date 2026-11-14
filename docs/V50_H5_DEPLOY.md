# V5.0 H5 部署指南（V50_H5_DEPLOY.md）

## 构建产物
```bash
npm run build:h5        # 产出 dist/h5/（≈5.7MB）
npm run test:h5-build   # 冒烟: 全脚本存在/非外链/GLB 可载/游戏可启动/零外部请求
```
- `dist/h5/` 为纯静态目录，可独立部署到任意静态服务器/CDN，不依赖开发机 Blender 或本地服务器
- 版本参数：源码 `index.html` 统一 `?v=50`（升级时全局替换）；构建后自检所有 `<script src>` 存在且非外链
- 内容清单：22 个 JS（含本地 three.min.js r149 与 GLTFLoader）、2 个 CSS、28 个 GLB、SVG 素材

## Nginx 示例配置
```nginx
server {
    listen 443 ssl http2;
    server_name game.example.com;
    root /var/www/pengzhang-xiaodui;   # = dist/h5 内容
    index index.html;

    # 静态资源长缓存（带版本参数的 JS/CSS/GLB 可 30 天）
    location ~* \.(js|css|glb|png|svg|jpg)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
    # index.html 短缓存（入口更新立即生效）
    location = /index.html {
        add_header Cache-Control "no-cache";
    }

    gzip on;
    gzip_types application/javascript text/css image/svg+xml;
    gzip_min_length 1k;

    # GLB 字节范围（断点续传友好）
    location ~* \.glb$ {
        add_header Accept-Ranges bytes;
    }
}
# HTTP → HTTPS
server { listen 80; server_name game.example.com; return 301 https://$host$request_uri; }
```

## HTTPS 部署说明
1. 证书：Let's Encrypt `certbot --nginx -d game.example.com`（或云厂商免费证书）
2. 上传：`rsync -avz --delete dist/h5/ user@host:/var/www/pengzhang-xiaodui/`
3. 验证：浏览器打开 `https://game.example.com` → 首页 → 开始游戏；DevTools Network 无外部请求；无控制台错误

## 缓存与版本策略
- 资源文件名不变 + `?v=NN` 查询参数：JS/CSS 更新时递增版本号（当前 50）
- GLB/CSS/JS 设 30 天 immutable；index.html no-cache —— 升级只需更新 index.html 与新版本号
- 回滚：保留上一版本目录 `releases/vNN/`，切换 nginx root 或 index.html 指回旧版本即可（产物目录自包含，天然可回滚）

## 首屏加载
- 加载顺序：three.min.js → 游戏脚本 → GLB 异步预载（`正在整备蓝色小队…` 提示条 + 失败重试按钮 `btn-retry-model`）
- 失败路径：GLB 加载失败显示「重新加载小队」按钮（`game.js boot()` catch 分支）——弱网可重试
- 弱网提示：模型加载期间有进度文案；无阻塞式 loading 屏（GLB 总量 ≈2.9MB，30 天缓存后二次进入零下载）

## 部署交付物
| 项 | 状态 |
|---|---|
| 正式构建目录 | `dist/h5/`（5717 KB） |
| 可部署压缩包 | `dist/h5/` 打 tar/zip 即可（见下方命令） |
| 生产冒烟 | `npm run test:h5-build` PASS |
| 公网部署 | **未完成** —— 本环境无生产服务器权限/账号，不伪造已上线 |

打包命令：`tar -czf pengzhang-h5-v50.tar.gz -C dist h5`

## 已知说明
- 生产 H5 广告功能如实降级不可用（无真实广告 SDK，见 V50_AD_INTEGRATION.md）——游戏完整可玩，复活/双倍按钮自动隐藏
- favicon 已有噪声过滤；如需完美可加静态 favicon.ico
