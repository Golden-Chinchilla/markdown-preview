# Markdown 支持

当前渲染使用 `react-markdown`、`remark-gfm` 和 `rehype-highlight`。

## 表格

| 类型 | 支持 |
| --- | --- |
| 标题 | 是 |
| 表格 | 是 |
| 任务列表 | 是 |
| 代码高亮 | 是 |

## 任务列表

- [x] 静态文档读取
- [x] 左侧层级目录
- [x] Markdown 渲染
- [ ] 后续可加入暗色模式

## 代码块

```ts
const documents = import.meta.glob('./content/docs/**/*.md', {
  eager: true,
  import: 'default',
  query: '?raw',
})
```
