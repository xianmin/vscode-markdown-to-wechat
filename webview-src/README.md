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
├── plugins/             # 插件
│   ├── rehypeApplyStyles.ts     # 样式应用插件
│   └── index.ts                 # 插件导出
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
5. **插件化处理**：使用remark/rehype插件处理Markdown转换和样式应用

## 主要功能流

1. `main.tsx` 获取VSCode API并渲染App
2. `App.tsx` 使用Context提供全局状态
3. `useVSCodeMessaging` 与VSCode通信
4. `useMarkdownProcessor` 处理Markdown转HTML
5. `useCopyToClipboard` 处理复制功能
6. UI组件按职责划分，仅负责渲染

## 主题样式处理流程：
1. **主题定义和加载**：
   - 在 VSCode 扩展端，`ThemeManager` 类从文件系统加载 CSS 主题文件(如 default.css)
   - 主题文件被解析为 JSON 格式(`ThemeStyleJson`)，通过消息传递到WebView

2. **主题数据管理**：
   - `useMessageListener` Hook 接收并存储主题数据
   - `useThemeManager` Hook 负责主题的状态管理和切换功能
   - `ThemeManager` 接口提供主题列表、当前主题ID和原始主题样式数据

3. **Markdown处理与样式应用**：
   - `useMarkdownProcessor` 使用统一的处理流程处理Markdown
   - 使用 `remark-frontmatter` 处理前置元数据
   - 使用 `rehypeApplyStyles` 插件实现样式应用

4. **插件化样式处理**：
   - `rehypeApplyStyles` 作为独立插件，完全负责样式应用逻辑
   - 在AST处理阶段应用样式，而不是在DOM操作阶段
   - 样式选择器匹配、CSS变量处理等逻辑全部封装在插件中

5. **CSS选择器匹配**：
   - 对HTML元素节点进行遍历，为每个节点应用对应的样式
   - 支持标签选择器、ID选择器、类选择器等常见选择器
   - 特殊处理`:root`和`body`选择器，以适应AST结构

6. **CSS变量处理**：
   - 识别样式值中的变量引用，如`var(--primary-color)`
   - 从`:root`选择器的样式中查找变量实际值
   - 将变量引用替换为实际值，确保最终HTML中不包含CSS变量

7. **输出结果**：
   - 生成包含所有必要内联样式的HTML
   - 解析并提取frontmatter内容，以备后用
   - 完成的HTML可直接复制到微信公众号编辑器中使用

简化版本的流程：
1. CSS文件 → JSON → 消息传递到WebView → 主题数据存储
2. Markdown → remark解析 → frontmatter处理 → rehype转换 → 样式应用(插件) → HTML输出

这种插件化架构带来以下优势：
1. **关注点分离**：主题管理与样式应用逻辑完全分离
2. **处理流程一致**：遵循统一的remark/rehype插件生态系统
3. **维护性提升**：功能模块化，易于理解和扩展
4. **性能优化**：在AST处理阶段一次性应用样式，避免重复DOM操作
