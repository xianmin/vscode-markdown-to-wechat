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
