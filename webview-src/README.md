# Markdown转微信公众号WebView

## 项目结构

```
src/
├── components/          # UI组件
│   ├── CopyButton.tsx   # 复制按钮组件
│   ├── Preview.tsx      # Markdown预览组件
│   ├── ThemeSelector.tsx# 主题选择器组件
│   ├── Toolbar.tsx      # 工具栏组件
│   └── index.ts         # 组件导出
├── context/             # React上下文
│   ├── AppContext.tsx   # 应用全局状态管理
│   └── index.ts         # 上下文导出
├── hooks/               # 自定义Hooks
│   ├── useCopyToClipboard.ts    # 复制功能Hook
│   ├── useMarkdownProcessor.ts  # Markdown处理Hook
│   ├── useMessageListener.ts    # 消息监听Hook
│   ├── useThemeManager.ts       # 主题管理Hook
│   ├── useVSCodeMessaging.ts    # VSCode通信Hook
│   └── index.ts                 # Hooks导出
├── App.css              # 主应用样式
├── App.tsx              # 主应用组件
├── index.css            # 全局样式
├── main.tsx             # 应用入口
└── vscode.d.ts          # VSCode类型定义
```

## 架构说明

1. **组件化设计**：UI拆分为独立、可复用的组件
2. **自定义Hooks**：业务逻辑封装在各种Hooks中，实现关注点分离
3. **Context API**：使用React Context管理全局状态，避免prop drilling
4. **VSCode通信**：与VSCode宿主环境的消息通信封装在专用Hook中

## 主要功能流

1. `main.tsx` 获取VSCode API并渲染App
2. `App.tsx` 使用Context提供全局状态
3. `useVSCodeMessaging` 与VSCode通信
4. `useMarkdownProcessor` 处理Markdown转HTML
5. `useCopyToClipboard` 处理复制功能
6. UI组件按职责划分，仅负责渲染

## 主题样式处理流程：
1. **主题定义和加载**：
   - 在 VSCode 扩展端，`ThemeManager` 类负责从文件系统加载 CSS 主题文件(如 default.css)
   - 主题文件被解析为 JSON 格式(`ThemeStyleJson`)，便于通过消息传递

2. **主题传递**：
   - 当 WebView 初始化或用户切换主题时，扩展通过消息(`setThemes`)将主题数据发送给 WebView
   - 消息中包含可用主题列表、当前主题ID和主题样式的JSON数据

3. **WebView 端处理**：
   - `useMessageListener` Hook 接收主题数据并存储
   - `useThemeManager` Hook 管理主题并提供样式处理功能
   - `AppContext` 组件将主题数据和VSCode API传递给各个组件

4. **样式应用**：
   - `useMarkdownProcessor` 负责将 Markdown 转换为 HTML
   - 转换后的 HTML 会经过样式处理，将主题样式作为内联样式应用到每个元素上
   - 样式处理依赖 `useThemeManager` 提供的选择器匹配功能

5. **选择器匹配逻辑**：
   - `useThemeManager` 中的 `selectorMatchesElement` 方法判断 CSS 选择器是否匹配元素
   - `getStylesForElement` 方法获取应用到元素上的所有样式
   - 这些方法可以处理标签选择器、ID选择器、类选择器、:root 伪类等

6. **CSS 变量处理**：
   - 处理样式中的变量引用，如 `var(--primary-color)`
   - 将变量替换为实际的颜色值

7. **输出结果**：
   - 最终生成的 HTML 包含所有内联样式，可以复制到微信公众号编辑器中使用


简化版本的流程：
1. CSS 文件 → 转换为 JSON → 通过消息发送到 WebView
2. WebView 接收主题 JSON → 用于样式匹配和应用
3. Markdown → HTML → 应用内联样式 → 可复制到微信公众号

这样的设计确保了样式能够正确应用，而且最终生成的 HTML 包含所有必要的内联样式，适合在微信公众号等不支持外部样式表的环境中使用。如果将来需要修改样式逻辑，主要在 `useThemeManager` 中进行即可。
