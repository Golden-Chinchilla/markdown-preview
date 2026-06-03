# Markdown 文档站

这个站点会在构建时读取 `src/content/docs` 目录下的 Markdown 文件，并按照文件路径自动生成左侧目录。

## 使用方式

把你的 Markdown 文件放进这个目录：

```txt
src/content/docs/
  01-start/
    overview.md
  notes/
    project-a/
      intro.md
```

重新启动开发服务或重新构建后，左侧目录会自动更新。

## 特点

- 不需要服务端存储
- 支持多级目录
- 支持表格、任务列表、代码块和引用
- 部署时直接内置文档内容

> 这个版本更适合一个人部署和阅读自己的 Markdown 内容。
