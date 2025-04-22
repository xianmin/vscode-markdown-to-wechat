# Markdown to WeChat

将 Markdown 转换为微信公众号兼容的 HTML，提供实时预览和主题定制功能。

## 功能特点

- 实时预览 Markdown 内容
- 自定义主题支持
- 一键复制公众号格式 HTML
- 可调整的样式设置
- 标题自动编号功能

## 架构设计

项目采用模块化架构，基于依赖注入模式设计：

### 目录结构

```
markdown-to-wechat/
├── src/                      # 扩展主代码
│   ├── core/                 # 核心领域层
│   │   └── interfaces/       # 接口定义
│   ├── infrastructure/       # 基础设施层
│   │   ├── container.ts      # 依赖注入容器
│   │   ├── EventBus.ts       # 事件总线
│   │   └── CommandManager.ts # 命令管理器
│   ├── services/             # 服务层
│   │   ├── PreviewService.ts # 预览服务
│   │   ├── ThemeService.ts   # 主题服务
│   │   ├── SettingsService.ts# 设置服务
│   │   └── WebViewService.ts # WebView服务
│   ├── utils/                # 工具函数
│   │   ├── uriHelper.ts      # URI工具
│   │   └── themeManager.ts   # 主题管理工具
│   ├── webview/              # WebView相关
│   │   └── contentProvider.ts# 内容提供
│   └── extension.ts          # 扩展入口
├── media/                    # 静态资源
│   ├── themes/               # 默认主题
│   └── webview/              # WebView应用构建输出
├── webview-src/              # WebView React应用源码
│   ├── src/                  # React应用源码
│   ├── package.json          # WebView依赖
│   └── vite.config.ts        # Vite配置
└── package.json              # 扩展依赖
```

### 架构分层

项目使用清晰的分层架构：

- **核心层 (Core)**: 定义领域接口和模型
- **基础设施层 (Infrastructure)**: 提供技术实现和底层支持
- **服务层 (Services)**: 实现业务逻辑
- **展示层 (WebView)**: 负责用户界面

### 通信机制

组件之间通过事件总线进行松耦合通信：

- 服务发布事件到事件总线
- 其他服务订阅并处理相关事件
- 减少组件间直接依赖

## 开发流程

### 环境准备

确保已安装 Node.js 和 pnpm。

### WebView 应用开发

```bash
# 进入 WebView 源码目录
cd webview-src

# 安装依赖
pnpm install

# 开发模式
pnpm run dev

# 构建到 media/webview
pnpm run build
```

### 扩展开发

```bash
# 根目录安装依赖
pnpm install

# 编译扩展
pnpm run compile

# 启动调试 (VS Code 中按 F5)
```

## 使用指南

### 基本使用

1. 打开 Markdown 文件
2. 执行命令 `微信公众号: 预览 Markdown` 或使用快捷键
3. 在预览窗口中查看效果，可实时编辑

### 设置选项

在设置中可调整：

- 字体大小
- 标题编号样式
- 主题颜色
- 换行方式

### 自定义主题

1. 执行命令 `微信公众号: 打开主题文件夹`
2. 在文件夹中添加自定义 `.css` 主题文件
3. 执行命令 `微信公众号: 刷新主题列表`
4. 执行命令 `微信公众号: 选择预览主题` 应用主题
