# Marktab

一个个人用的静态 Markdown 文档站。构建时会读取 `src/content/docs` 下的 Markdown 文件，并按照文件路径生成左侧目录树。

## 使用

```bash
npm install
npm run dev
```

打开 `http://127.0.0.1:5173/`。

## 添加文档

把 Markdown 文件放到：

```txt
src/content/docs/
```

示例：

```txt
src/content/docs/
  01-start/
    overview.md
    structure.md
  02-reference/
    markdown.md
```

文件层级会自动呈现在左侧目录中。

## 代码结构

```txt
src/
  App.tsx                 # 页面状态和布局组合
  components/             # UI 组件
  content/docs/           # Markdown 文档内容
  data/documents.ts       # 构建期读取 Markdown
  types/docs.ts           # 文档和目录树类型
  utils/                  # 树结构和 Markdown 工具函数
```

## 检查

```bash
npm run lint
npm run build
```
