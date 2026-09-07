# 项目维护指引

本文件适用于整个仓库。按当前用户指令执行；用户要求“先汇报”时，只读分析，不修改文件或运行会写入文件的生成命令。已经授权的修改及其必要验证应连续完成，无需重复确认。

## 1. 项目简介

本仓库是 `cmyk-labs/cmyk-labs` 的 GitHub 个人主页，展示个人背景、研究方向、自有开源项目、开源贡献、荣誉和联系方式。

- 研究方向：**AI Agent、LLM 基础设施、AI 算法**；教育背景保留院系信息。
- 页面使用 Markdown、HTML 和 SVG；Node.js 脚本从源文件与 GitHub 数据生成英文、中文主页。
- GitHub Actions 在相关文件推送、每日北京时间 08:00（UTC 00:00）的定时调度或手动触发时检查并更新两份主页。
- Open Source、Honors、Contact 的空模块是后续补充入口，应保留。

## 2. 目录与职责

```text
AGENTS.md                          英文 Codex 维护规则
AGENTS.zh-CN.md                    维护规则的中文对照
README.md                          英文主页，自动生成
README.zh-CN.md                    中文主页，自动生成
README_OLD.md                      历史参考，不参与生成
assets/                            头图等视觉资源
.github/
  profile.config.json              用户名、展示门槛、PR 展开数量等配置
  profile/
    README.md                      详细维护说明与表格格式示例
    README.template.md             双语共用布局与栏目顺序
    sections/
      en/                          英文正文、项目选择与 PR 主配置
      zh-CN/                       中文正文、项目及 PR 译文
  workflows/
    update-profile.yml             检查、生成、机器人提交与推送
scripts/
  update-profile.mjs               GitHub 数据获取、统计与双语生成
  update-profile.test.mjs          生成逻辑检查
```

成对维护的根目录文档，英文使用基础文件名，简体中文统一使用 `.zh-CN.md` 后缀。`AGENTS.md` 与 `AGENTS.zh-CN.md` 同步维护，规则保持一致。

两个语言目录均包含 `about.md`、`open-source.md`、`contributions.md`、`honors.md`、`contact.md`。旧的 `.github/profile/sections/about.md` 等路径已迁移，不应重新创建。

先阅读与任务相关的源文件；涉及项目表格时，参考[双语主页维护说明](.github/profile/README.md)。根目录两份 README 是产物，应修改源文件后重新生成。

## 3. 新增与修改入口

下表中的“双语文件”指 `.github/profile/sections/en/` 和 `.github/profile/sections/zh-CN/` 下的同名文件。

| 任务 | 修改入口 | 操作要求 |
|---|---|---|
| 个人介绍、教育背景、研究方向 | 双语 `about.md` | 更新对应正文，保留院系与研究方向 |
| 新增自有开源项目 | 双语 `open-source.md` | 英文配置仓库和精选状态，中文提供简介；展示项目须是本人拥有的公开非 fork 仓库 |
| 新增贡献项目 | 双语 `contributions.md` | 英文填写仓库、精选状态、项目介绍、PR 编号与摘要；中文填写对应译文 |
| 已有项目新增 PR | 双语 `contributions.md` 的已有项目行 | 英文补充 PR 编号和摘要；中文按同一编号补充摘要及可选标题，不重复创建仓库行 |
| 新增荣誉、联系方式 | 双语 `honors.md`、`contact.md` 中对应文件 | 使用普通 Markdown 正文，不重复写模块标题 |
| 布局、栏目顺序、语言切换位置 | `.github/profile/README.template.md` | 两种语言共用布局，修改后检查双方效果 |
| 定位句、栏目标题、页脚、状态译名 | `scripts/update-profile.mjs` 的 `locales` | 同步英文与中文配置 |
| 展示门槛、PR 展开数量 | `.github/profile.config.json` | 两种语言共用配置 |
| 头图 | `assets/` 中模板实际引用的资源 | 检查浅色、深色效果；引用变化时更新模板 |
| 新增完整栏目 | 双语源文件、模板、生成脚本、相关检查、维护说明 | 接入源文件读取、双语标题和渲染；检查工作流触发路径是否覆盖新增入口 |

影响主页的修改完成后，运行生成脚本并检查两份 README；文件路径、表格字段或操作流程变化时，同步修订本文件和维护说明中的相关条目。

## 4. 内容与双语规则

- **真实准确**：项目介绍依据项目实际资料；贡献描述依据 PR 描述及必要的代码差异，按“问题—解决方法—结果”组织。不得虚构成果、性能指标、测试或合并状态；事实不足时指出缺口，不补写推测。
- **技术表达**：保留 Sub-Agent、Skills、LLM 等有解释价值的术语，避免堆砌内部函数名。已确认文案只在本次任务涉及范围内修改。
- **同步维护**：人工新增或实质修改展示内容时，同步中英文，保持事实与范围一致。项目名称、技术名词和链接可以共用原文。联系方式使用用户提供且愿意公开的信息。
- **选择与翻译分离**：英文表格决定项目选择及配置的 PR 顺序；中文按仓库和 PR 编号提供译文，不加入 `Featured`、`Pull Requests` 等独立选择字段。英文手工摘要的编号必须列入该行 `Pull Requests`。
- **缺失译文**：中文只展示有中文摘要的 PR；中文标题可选，缺省使用上游标题。自动发现但尚无译文的 PR 可以暂时只出现在英文页，人工新增时应补齐译文。
- **保留空模块**：空文件或仅含 HTML 注释时隐藏对应语言的模块，保留源文件，不添加虚构占位内容。
- **生成与统计共用**：两份主页使用同批数据。`Contrib. Stars` 按获取到的本人 PR 所属外部公开仓库去重，所有 PR 状态均纳入，同一项目只计一次；`Own Stars` 统计本人拥有的公开仓库，包括 fork。精选、折叠和译文是否齐全均不影响统计，展示门槛以配置为准。

## 5. 生成与验证

在仓库根目录执行。Node.js 版本与工作流保持兼容，当前 CI 使用 Node.js 20。GitHub Token 如需使用，通过 `GITHUB_TOKEN` 或 `GH_TOKEN` 环境变量提供，不写入仓库。

```sh
# 生成两份主页：访问 GitHub，写入有变化的 README
node scripts/update-profile.mjs

# 检查生成逻辑：不访问 GitHub
node --test scripts/update-profile.test.mjs

# 对照当前 GitHub 数据检查两份主页：不写文件
node scripts/update-profile.mjs --check

# 检查已跟踪文件差异中的空白问题
git diff --check
```

| 修改类型 | 必要验证 |
|---|---|
| 展示文案 | 生成双语主页，核对事实、翻译、链接和最终差异 |
| 脚本、配置、模板 | 运行生成逻辑检查，生成并核对两份主页；行为改变时补充相关检查 |
| 头图或布局 | 检查双语页面、浅色与深色显示及语言链接 |
| 仅维护文档或任一语言的 AGENTS 文档 | 核对路径、命令、规则与实际实现，不要求刷新 GitHub 数据 |

`--check` 会重新获取动态数据，Stars 或 PR 状态变化也可能导致差异，应区分数据更新与生成错误。网络或权限问题导致未完成的检查须如实报告；不能手工伪造生成数据或宣称检查通过。通过后仅在有新修改或未解决问题时重复验证。

## 6. Git 提交与推送

1. **保护现有工作**：修改前检查工作区，提交前检查工作区与暂存区差异。只暂存本次授权范围内的文件，保留其他未提交内容；涉及主页时一并检查源文件和双语产物。
2. **按授权执行**：修改文件不自动授权提交或推送。用户要求先汇报时，完成检查后报告提交方案并等待授权；同一批变更已获提交推送授权后直接完成，不重复询问。
3. **提交前汇报**：说明实际作者与提交者的用户名、邮箱、目标远端与分支、拟用 commit message 和提交范围。
4. **核对身份与目标**：预期人工身份为 `cmyk-labs <263870852+cmyk-labs@users.noreply.github.com>`；当前目标为 `origin` → `https://github.com/cmyk-labs/cmyk-labs.git`，分支 `main`。执行时重新核对，以用户本次指令为准；不擅自修改全局 Git 配置或使用机器人身份提交人工修改。
5. **统一提交格式**：所有新提交，包括自动更新，必须遵守下方格式；根据实际变更选择类型和范围。
6. **保留远端更新**：推送前检查远端是否有新提交，在保留本地工作的前提下同步。机器人刷新造成的生成文件冲突，应保留双方源文件变更后重新生成；源文案冲突需逐项核对，语义无法判断时再向用户说明。
7. **避免破坏性操作**：不擅自强制推送、改写已发布历史、丢弃工作区内容或删除无关文件。
8. **汇报结果**：完成后给出 commit hash、推送目标、验证情况和剩余未提交内容；提交或推送失败时明确说明实际完成到哪一步。

### 提交信息格式

```text
type(scope): summary
```

- `type` 和 `scope` 使用小写；范围必填且不能为空，冒号后恰好一个空格。
- 根据变更选择类型：`docs`、`feat`、`fix`、`refactor`、`test`、`ci` 或 `chore`。范围使用主要影响的模块，例如 `profile`、`agents`、`generator`、`workflow` 或 `assets`。
- 摘要使用简洁英文，以动词原形开头，末尾不加句号，说明实际变更，避免泛泛写“更新”。

| 变更 | 示例 |
|---|---|
| 主页文案 | `docs(profile): clarify project introductions and PR contributions` |
| Codex 维护规则 | `docs(agents): standardize commit message format` |
| 工作流调度 | `ci(workflow): schedule profile refresh at 08:00 Beijing time` |
| 自动刷新数据 | `chore(profile): refresh profile data` |
