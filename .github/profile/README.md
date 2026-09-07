# 双语主页维护说明

## 文件与编辑入口

| 文件 | 用途 |
|---|---|
| 根目录 `README.md` | 英文展示页，自动生成 |
| 根目录 `README.zh-CN.md` | 简体中文展示页，自动生成 |
| `README.template.md` | 两种语言共用的页面布局与栏目顺序 |
| `sections/en/` | 英文正文，以及自有项目、贡献项目的主配置 |
| `sections/zh-CN/` | 中文正文与项目、PR 译文 |
| `../profile.config.json` | 两种语言共用的用户名、统计展示门槛和 PR 展开数量 |
| `../../scripts/update-profile.mjs` 中的 `locales` | 语言名称、定位句、页脚、栏目标题、状态译名和提交规范说明 |

两个语言目录均保留 `about.md`、`open-source.md`、`contributions.md`、`honors.md` 和 `contact.md`。语言切换在头图下方、定位句上方居中显示；当前语言加粗，另一种语言链接到对应 README。

根目录两份 README 是生成结果，日常修改对应源文案后重新生成。

## 生成与检查

在仓库根目录运行：

```sh
# 检查双语生成逻辑，不访问 GitHub
node --test scripts/update-profile.test.mjs

# 获取一次 GitHub 数据，同时生成两份 README
node scripts/update-profile.mjs

# 输出指定语言的预览，不写文件
node scripts/update-profile.mjs --dry-run
node scripts/update-profile.mjs --dry-run --locale=zh-CN

# 对照当前 GitHub 数据检查两份生成结果，不写文件
node scripts/update-profile.mjs --check
```

相关源文件推送到 `main` 后会触发自动更新，也支持每日北京时间 08:00（UTC 00:00）的定时调度和手动运行工作流。工作流先运行检查，再生成并提交两份 README。`--check` 会重新获取动态数据，Stars 或 PR 状态变化也可能导致结果需要更新。

## 提交规范

所有新提交统一使用 `type(scope): summary`，范围必填，类型和范围使用小写，冒号后恰好一个空格。摘要使用简洁英文，以动词原形开头，末尾不加句号。例如：`docs(profile): clarify project introductions and PR contributions`。

自动更新工作流使用 `chore(profile): refresh profile data`。完整规则见根目录 [AGENTS.md](../../AGENTS.md) 和 [AGENTS.zh-CN.md](../../AGENTS.zh-CN.md)。README 页底的双语折叠说明由共享模板和生成脚本中的 `locales` 维护，修改规范时同步这些入口。

## 顶部 Stars 徽章

1. **Contrib. Stars**：根据获取到的本人 PR，累加其目标外部公开仓库的 Stars；每个项目只计算一次，同一项目有多个 PR 不重复计入。Open、Draft、Closed、Merged 均纳入，是否精选、折叠展示或已有译文不影响统计。

2. **Own Stars**：累加本人拥有的公开仓库 Stars，每个仓库计算一次；保持现有范围，包括 fork，不受 Open Source 精选展示列表限制。

3. 两份 README 使用同一批数据和同一份统计结果。Stars 使用刷新时获取的数值；展示门槛只控制徽章是否显示。

## About Me / 关于我

分别编辑 `sections/en/about.md` 和 `sections/zh-CN/about.md`，直接填写 Markdown 正文，不重复写模块标题。保留院系信息，并单独列出 AI Agent、LLM 基础设施和 AI 算法的研究方向。

某个语言的文件为空或仅含 HTML 注释时，只隐藏该语言的模块，不影响另一种语言。

## Open Source / 开源项目

英文 `sections/en/open-source.md` 决定项目选择：

```md
| Repository | Featured | Description |
|---|:---:|---|
| cmyk-labs/example-project | true | Optional English description |
```

中文 `sections/zh-CN/open-source.md` 只提供译文：

```md
| Repository | Description |
|---|---|
| cmyk-labs/example-project | 中文项目简介 |
```

- 只有英文主配置中 `Featured` 为 `true` 的项目可以展示，项目须是本人拥有的公开非 fork 仓库。
- 项目按 Stars 从高到低排序；低于配置门槛时只隐藏 Stars 徽章，不隐藏项目，当前门槛为 `200`。
- 英文简介留空时使用 GitHub 仓库简介。中文只展示主配置已精选且有中文简介的项目，中文表格不能独立增加精选项目。
- 中文文件为空或没有符合条件的译文时，隐藏中文开源项目模块。
- 仓库名称重复会终止生成。主配置中不可用、非公开或 fork 项目会输出提示并跳过。

## Contributions / 开源贡献

英文 `sections/en/contributions.md` 决定项目是否精选、PR 编号顺序及英文文案：

```md
| Repository | Featured | Introduction | Pull Requests | PR Summaries |
|---|:---:|---|---|---|
| bytedance/deer-flow | true | English project introduction | 4937 | 4937: English PR summary |
| example/project | false | Optional introduction | 128, 96 | |
```

中文 `sections/zh-CN/contributions.md` 通过仓库和 PR 编号提供译文：

```md
| Repository | Introduction | PR Summaries | PR Titles |
|---|---|---|---|
| bytedance/deer-flow | 中文项目介绍 | 4937: 中文 PR 描述 | 4937: 中文 PR 标题 |
```

`PR Titles` 为可选列，不填时保留上游 PR 标题。中文表格不接受 `Featured`、`Pull Requests` 等独立选择字段。

1. GitHub API 自动补充本人提交的公开外部 PR。英文主配置中的 `Featured` 决定精选与更多贡献的分组，两种语言共用该分组及项目排序。

2. 精选项目按 Stars 从高到低排序。手工填写的 PR 按英文 `Pull Requests` 中的编号顺序优先排列，其余 PR 按更新时间从新到旧排列。默认展开前两个 PR，超过部分放入折叠表格。

3. 非精选项目内的 PR 按更新时间从新到旧排列。PR 状态、上游标题、头像和 Stars 自动获取；中文使用对应状态译名。

4. `PR Summaries` 使用 `PR编号: 摘要` 格式，多个摘要用 `<br />` 分隔。手工摘要完整保留，不随 PR 正文变化；`pullRequestSummaryMaxLength` 只限制英文自动摘要。

5. 英文手工摘要的编号须同时列在该行 `Pull Requests` 中。中文可以翻译自动发现的 PR，但译文只应用到英文页已经发现的项目和 PR，不会自行创建展示项目。

6. 中文只展示有中文摘要的 PR，顺序沿用英文主配置；没有中文标题时保留上游标题，没有中文项目介绍时使用“开源项目。”。没有可展示 PR 的模块隐藏，不影响任何统计数字。

7. 任一语言新增或修改文案时，应以实际项目及 PR 内容为依据。项目名称与 Sub-Agent、Skills、LLM 等技术名词可保留原文。

## Honors / 荣誉与 Contact / 联系方式

分别编辑两个语言目录中的 `honors.md`、`contact.md`，使用普通 Markdown 正文，不重复写模块标题。

这两个模块和 Open Source 一样，为后续补充保留全部源文件。可以留空或使用 HTML 注释记录待补充事项；没有可展示内容时隐藏对应语言的模块。联系方式只填写确认愿意公开的渠道。
