# Markdown to WeChat

将Markdown转换为微信公众号兼容的HTML，提供实时预览。

## 架构

项目采用双层架构：

- **VSCode扩展层**：CommonJS模块，负责与VSCode API交互
- **预览应用层**：ESM/React应用，运行于WebView中，负责Markdown转HTML转换

```
markdown-to-wechat/
├── src/                    # 扩展主代码
│   └── extension.ts        # VSCode扩展入口
├── media/                  # 静态资源
│   └── webview/            # WebView应用构建输出
├── webview-src/            # WebView React应用源码
│   ├── src/                # React应用源码
│   ├── package.json        # WebView依赖
│   └── vite.config.ts      # Vite配置
└── package.json            # 扩展依赖
```

## 开发流程

1. **WebView应用开发**：
```bash
cd webview-src
pnpm install
pnpm run dev     # 开发模式
pnpm run build   # 构建到media/webview
```

2. **扩展开发**：
```bash
pnpm install
pnpm run compile  # 编译扩展
```

按F5启动调试。

## 功能

- Markdown解析和转换
- 微信公众号样式预览
- HTML复制功能
