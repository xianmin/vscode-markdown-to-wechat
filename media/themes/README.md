# Markdown to WeChat 主题指南

## 主题元数据

每个主题文件都可以包含元数据信息，这些信息将被显示在主题选择界面中。元数据应该放在文件开头的注释块中，格式如下：

```css
/**
 * @theme-name: 主题名称
 * @theme-author: 作者名
 * @theme-description: 主题描述
 * @theme-version: 版本号
 */
```

所有元数据字段都是可选的，但建议至少提供主题名称。

## 创建自定义主题

要创建新主题，可以：

1. 复制一个现有主题文件
2. 修改文件名（文件名将作为主题ID）
3. 修改元数据信息
4. 自定义样式

## 使用CSS变量

建议使用CSS变量来定义颜色和其他样式属性，这样可以更容易地进行全局修改：

```css
:root {
  --primary-color: #017fc0;
  --background-color: #ffffff;
  --text-color: #212121;
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
}

h1 {
  color: var(--primary-color);
}
```

## CSS选择器限制

**重要提示：** 当前主题解析功能不支持带逗号的复合选择器。如 `h4, h5, h6 {}`这样的选择器会导致样式无法正确解析。请为每个元素分别定义样式，例如：

```css
/* 不要这样写 */
h4, h5, h6 {
  color: var(--primary-color);
}

/* 应该这样写 */
h4 {
  color: var(--primary-color);
}
h5 {
  color: var(--primary-color);
}
h6 {
  color: var(--primary-color);
}
```

## 主题存储位置

主题文件存储在以下位置：

- 默认：插件全局存储路径下的 `themes` 文件夹
- 用户也可以在设置中自定义主题存储路径

## 主题文件格式

主题文件必须是有效的CSS文件，扩展名为`.css`。

## 最佳实践

1. 保持样式简洁，避免过于复杂的选择器
2. 使用CSS变量以便于维护
3. 考虑移动设备上的显示效果
4. 测试不同大小的图片和不同类型的内容
5. 避免使用复合选择器（带逗号的选择器）
