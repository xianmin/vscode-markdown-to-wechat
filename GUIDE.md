
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
