---
name: publish-markdown-preview
description: 当需要发布或更新 Marktab / markdown-preview 项目时使用本技能，包括同步 RealID Markdown 文档、校验 React Vite 构建、通过 github-personal SSH alias 推送到 GitHub，以及检查 Cloudflare Pages 部署。
---

# 发布 Markdown Preview

这个流程用于发布 `/Users/jieli/development/markdown-tree-preview`。

## 项目信息

- 项目根目录：`/Users/jieli/development/markdown-tree-preview`
- 原始文档目录：`/Users/jieli/development/RealID/realid-sdd-requirements`
- 同步后的文档目录：`src/content/docs/realid-sdd-requirements`
- GitHub 远端：`git@github-personal:Golden-Chinchilla/markdown-preview.git`
- 生产分支：`main`
- Cloudflare Pages 项目：`markdown-preview`
- Cloudflare 构建配置：
  - Framework preset：`React (Vite)`
  - Build command：`npm run build`
  - Build output directory：`dist`
  - Root directory：留空或 `/`
  - Environment variable：`NODE_VERSION=22`

## 发布流程

1. 进入项目根目录：

   ```bash
   cd /Users/jieli/development/markdown-tree-preview
   ```

2. 如果原始 RealID Markdown 文档有变化，同步最新文档：

   ```bash
   npm run sync:docs
   ```

   这个命令会清空并重新复制 `src/content/docs/realid-sdd-requirements`，然后把原始本机绝对路径链接改写为站内相对链接。

3. 提交前检查工作区：

   ```bash
   git status --short
   git diff --stat
   ```

   不要回滚用户的改动。如果文档中包含敏感或不应发布的文件，先停止并询问用户。

4. 本地校验：

   ```bash
   npm run lint
   npm run build
   ```

   对这个项目来说，Vite 的 chunk-size warning 可以接受，除非用户明确要求优化包体积。

5. 可选：启动本地应用做可视化检查：

   ```bash
   npm run dev
   ```

   检查：
   - 左侧目录显示 RealID 文件树
   - Markdown 渲染正确
   - Markdown 内部链接能在应用内导航
   - 暗黑模式仍然可用
   - 右侧标题目录可以展开、收起、跳转，并高亮目标标题
   - 桌面和移动端宽度下没有明显横向溢出

6. 有意图地提交：

   ```bash
   git add README.md index.html package.json package-lock.json public src scripts SKILL.md
   git add -u
   git commit -m "Update markdown preview release"
   ```

   如果变更范围更窄，使用更具体的提交信息。

7. 推送到 GitHub：

   ```bash
   git push origin main
   ```

   远端应使用 `github-personal` SSH alias。需要时用 `git remote -v` 确认。

8. 检查部署：

   Cloudflare Pages 应该会从 GitHub `main` 自动部署。打开 Cloudflare 的 `markdown-preview` Pages 项目，确认最新部署成功。

## 排错

- 如果 Cloudflare 找不到依赖，确认已设置 `NODE_VERSION=22`。
- 如果部署后的页面空白，确认构建输出目录是 `dist`。
- 如果 UI 中仍有旧 Markdown 文件，重新执行 `npm run sync:docs`，然后重新构建。
- 如果内部链接打开新标签页而不是在应用内导航，检查 `src/utils/links.ts` 和 `src/components/DocumentView.tsx`。
- 如果右侧标题目录无法正确跳转，确认仍然同时使用了 `rehype-slug` 和 `github-slugger`。
