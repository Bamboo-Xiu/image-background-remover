# Styling Rules

## Tailwind CSS 4

- 使用 Tailwind CSS 4 + PostCSS (`@tailwindcss/postcss`)
- 全局样式在 `app/globals.css`
- 导入: `@import "tailwindcss"`
- 自定义主题: `@theme inline` 块中定义

## 设计系统

### 颜色

- 主色调: 蓝色系 (blue)
- 中性色: gray-50 ~ gray-900
- 成功: green
- 错误: red
- 背景: white, gray-50

### 间距与尺寸

- 使用 Tailwind 默认间距: `px-4`, `py-6`, `gap-4`
- 大元素圆角: `rounded-xl`, `rounded-2xl`
- 响应式断点: `md:` (768px), `lg:` (1024px)

## 组件样式模式

### 条件类名

```tsx
className={`base-class ${condition ? 'active-class' : 'inactive-class'}`}
```

### 状态映射样式

```tsx
const bgClass: Record<BgMode, string> = {
  checkerboard: 'bg-checkerboard',
  white: 'bg-white',
  black: 'bg-gray-900',
}
```

### 响应式布局

```tsx
className="grid grid-cols-1 md:grid-cols-2 gap-4"
```

## 自定义样式

项目只有少量自定义 CSS：

- `.bg-checkerboard`: 透明背景棋盘格图案（用于图片预览）
- 避免添加新的自定义 CSS，优先使用 Tailwind 工具类

## 字体

- 系统字体栈: Arial, Helvetica, sans-serif
- 无自定义字体引入
