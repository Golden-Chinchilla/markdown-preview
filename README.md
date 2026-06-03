# Marktab

RealID 需求文档的静态 Markdown 预览站。项目会在构建时读取 `src/content/docs` 下的 Markdown 文件，并按照文件路径生成左侧目录树。

## 本地开发

```bash
npm install
npm run sync:docs
npm run dev
```

打开 `http://127.0.0.1:5173/`。

## 同步 RealID 文档

原始文档目录：

```txt
/Users/jieli/development/RealID/realid-sdd-requirements
```

同步到站点目录：

```txt
src/content/docs/realid-sdd-requirements
```

每次原始文档修改后，执行：

```bash
npm run sync:docs
```

脚本会先清空旧的 `realid-sdd-requirements` 目录，再复制最新 Markdown 文件，并把本机绝对路径链接改成站内相对链接。

## 代码结构

```txt
src/
  App.tsx                 # 页面状态和布局组合
  components/             # UI 组件
  content/docs/           # Markdown 文档内容
  data/documents.ts       # 构建期读取 Markdown
  hooks/useTheme.ts       # 亮色/暗色主题
  types/docs.ts           # 文档和目录树类型
  utils/                  # 树结构、链接和 Markdown 工具函数
scripts/
  sync-realid-docs.mjs    # 从 RealID 原始目录同步 Markdown
```

## 检查

```bash
npm run lint
npm run build
```
