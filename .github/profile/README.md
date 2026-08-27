# 主页模块重点规则

## 🚀 About Me（`sections/about.md`）

1. 文件必须保留；内容为空或仅含 HTML 注释时不生成、不展示 About Me 模块。

2. 文件有内容时自动添加 `🚀 About Me` 标题，并展示文件中的 Markdown 正文。

## 📦 Open Source（`sections/open-source.md`）

1. 只有 `Featured` 为 `true` 的项目才展示；文件留空或没有 `Featured: true` 项目时，整个模块隐藏。

2. 展示项目按照 GitHub Stars 从高到低自动排序，Stars、语言、仓库链接和默认描述均由 GitHub API 获取。

3. Stars 少于配置门槛时只隐藏 Stars 徽章，不隐藏项目；当前门槛为 `200`。

4. 项目必须是本人拥有的公开非 fork 仓库；私有、fork 或不存在的仓库不会展示，重复填写仓库会终止生成并报错。

5. `sections/open-source.md` 文件内容格式示例：

```md
| Repository | Featured | Description |
|---|:---:|---|
| cmyk-labs/example-project | true | Optional custom description |
```

## Contributions（`sections/contributions.md`）

1. `✨ Featured Contributions` 和 `🔗 More Contributions` 共用这一个文件，GitHub API 会自动补充作者名下未填写的公开外部 PR。

2. `Featured` 为 `true` 的项目进入 Featured Contributions，并按照项目 Stars 从高到低排序。

3. 精选项目中，手工填写的 PR 按表格中的编号顺序优先排列，其余 PR 按更新时间从新到旧排列；前两个 PR 默认展开，超过两个的 PR 自动放入默认关闭的可展开表格。

4. `Featured` 为 `false`、留空或没有配置的项目进入 More Contributions，并按照项目 Stars 从高到低排序。

5. 非精选项目内的 PR 按更新时间从新到旧排列；PR 状态、标题、头像和 Stars 均自动获取，摘要默认从 PR 正文提取。

6. 可选的 `PR Summaries` 用于覆盖指定 PR 的自动摘要，格式为 `PR编号: 英文摘要`；多个摘要使用 `<br />` 分隔，编号必须同时出现在 `Pull Requests` 中。

7. 即使文件留空，API 查询到的未精选 PR 仍会自动显示在 More Contributions；没有任何有效 PR 时整个 Contributions 模块隐藏。

8. `sections/contributions.md` 文件内容格式示例：

```md
| Repository | Featured | Introduction | Pull Requests | PR Summaries |
|---|:---:|---|---|---|
| bytedance/deer-flow | true | Optional project introduction | 4937 | 4937: Optional custom PR summary |
| example/project | false | Optional project introduction | 128, 96 | |
```

## 🏆 Honors（`sections/honors.md`）

1. 文件必须保留；内容为空或仅含 HTML 注释时不生成、不展示 Honors 模块。

2. 文件有内容时自动添加 `🏆 Honors` 标题，并展示文件中的 Markdown 正文。

## 📫 Contact（`sections/contact.md`）

1. 文件必须保留；内容为空或仅含 HTML 注释时不生成、不展示 Contact 模块。

2. 文件有内容时自动添加 `📫 Contact` 标题；只应放置确认愿意公开的联系方式和链接。
