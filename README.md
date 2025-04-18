# Markdown to WeChat

将Markdown转换为微信公众号兼容的HTML，提供实时预览。

## 架构

项目采用模块化架构：

- **VSCode扩展层**：CommonJS模块，负责与VSCode API交互
- **预览应用层**：ESM/React应用，运行于WebView中，负责Markdown转HTML转换

```
markdown-to-wechat/
├── src/                    # 扩展主代码
│   ├── extension.ts        # 扩展入口
│   ├── services/           # 服务层
│   │   └── previewService.ts # 预览服务
│   ├── commands/           # 命令处理
│   │   └── previewCommand.ts # 预览命令
│   ├── webview/            # WebView相关
│   │   └── contentProvider.ts # 内容提供
│   └── utils/              # 工具函数
│       └── uriHelper.ts    # URI工具
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

## 架构设计

扩展使用了模块化设计和依赖注入模式：

- **服务层**：提供核心功能，如预览面板管理
- **命令层**：处理用户交互命令
- **WebView层**：负责内容展示
- **工具层**：提供通用辅助函数
