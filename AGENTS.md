# Repository Maintenance Guide

This file applies to the entire repository. Follow the user's current instructions. When the user asks to "report first," perform read-only analysis; do not modify files or run generation commands that write files. Complete authorized changes and their necessary verification without asking for repeated confirmation.

## 1. Project Overview

This repository contains the GitHub profile for `cmyk-labs/cmyk-labs`, presenting personal background, research interests, owned open-source projects, open-source contributions, honors, and contact information.

- Research interests: **AI agents, LLM infrastructure, and AI algorithms**. Retain department information in the education background.
- The pages use Markdown, HTML, and SVG. A Node.js script generates the English and Chinese profiles from source files and GitHub data.
- GitHub Actions checks and updates both profiles when relevant files are pushed, on a daily schedule set to 08:00 Beijing time (00:00 UTC), or through a manual trigger.
- The empty Open Source, Honors, and Contact sections are reserved for future content and must be retained.

## 2. Directory Structure and Responsibilities

```text
AGENTS.md                          Codex maintenance rules, English
AGENTS.zh-CN.md                    Chinese translation of the maintenance rules
README.md                          English profile, generated
README.zh-CN.md                    Chinese profile, generated
README_OLD.md                      Historical reference, excluded from generation
assets/                            Hero images and other visual assets
.github/
  profile.config.json              Username, display thresholds, PR expansion limits, etc.
  profile/
    README.md                      Detailed maintenance guide and table format examples
    README.template.md             Shared bilingual layout and section order
    sections/
      en/                          English content, project selection, and primary PR configuration
      zh-CN/                       Chinese content and project/PR translations
  workflows/
    update-profile.yml             Checks, generation, bot commits, and pushes
scripts/
  update-profile.mjs               GitHub data retrieval, statistics, and bilingual generation
  update-profile.test.mjs          Generation logic checks
```

Root documents maintained in both languages use the base filename for English and the `.zh-CN.md` suffix for Simplified Chinese. Keep `AGENTS.md` and `AGENTS.zh-CN.md` synchronized with equivalent rules.

Both language directories contain `about.md`, `open-source.md`, `contributions.md`, `honors.md`, and `contact.md`. Old paths such as `.github/profile/sections/about.md` have been migrated and must not be recreated.

Read the source files relevant to the task first. For project tables, consult the [Bilingual Profile Maintenance Guide](.github/profile/README.md). Both root README files are generated artifacts; edit their sources and regenerate them.

## 3. Where to Add or Modify Content

In the table below, "bilingual files" means files with the same name under `.github/profile/sections/en/` and `.github/profile/sections/zh-CN/`.

| Task | Files to Edit | Requirements |
|---|---|---|
| Personal introduction, education, or research interests | Bilingual `about.md` | Update the relevant text and retain department information and research interests |
| Add an owned open-source project | Bilingual `open-source.md` | Configure the repository and featured status in English; provide a Chinese description. Displayed projects must be owned, public, non-fork repositories |
| Add a contributed project | Bilingual `contributions.md` | Add the repository, featured status, project introduction, PR numbers, and summaries in English; provide the corresponding Chinese translations |
| Add a PR to an existing project | The existing project row in bilingual `contributions.md` | Add the PR number and summary in English; add the Chinese summary and optional title under the same number. Do not create a duplicate repository row |
| Add honors or contact information | The relevant bilingual `honors.md` or `contact.md` files | Use plain Markdown content without repeating the section heading |
| Layout, section order, or language switch placement | `.github/profile/README.template.md` | Both languages share the layout; check both after changes |
| Tagline, section headings, footer, or status translations | `locales` in `scripts/update-profile.mjs` | Update the English and Chinese configurations together |
| Display thresholds or PR expansion limits | `.github/profile.config.json` | Both languages share the configuration |
| Hero images | Assets in `assets/` actually referenced by the template | Check light and dark appearances; update the template if references change |
| Add an entire section | Bilingual source files, template, generation script, relevant checks, and maintenance guide | Connect source loading, bilingual headings, and rendering; check whether workflow trigger paths cover the new entry points |

After changes that affect the profiles, run the generation script and inspect both README files. When file paths, table fields, or procedures change, update the relevant entries in this file and the maintenance guide.

## 4. Content and Bilingual Rules

- **Accuracy**: Base project introductions on actual project materials. Base contribution descriptions on PR descriptions and, where necessary, code diffs, following "problem—solution—result." Do not invent achievements, performance metrics, tests, or merge status. Identify missing facts instead of filling gaps with speculation.
- **Technical wording**: Retain useful terms such as Sub-Agent, Skills, and LLM; avoid crowding descriptions with internal function names. Modify previously approved text only within the current task's scope.
- **Keep languages synchronized**: When manually adding or substantially changing displayed content, update both English and Chinese with matching facts and scope. Project names, technical terms, and links may retain their original form. Use contact information supplied by the user and intended for public display.
- **Separate selection from translation**: English tables determine project selection and configured PR order. Chinese tables provide translations keyed by repository and PR number; do not add independent selection fields such as `Featured` or `Pull Requests`. PR numbers in manual English summaries must appear in the same row's `Pull Requests` field.
- **Missing translations**: The Chinese page displays only PRs with Chinese summaries. Chinese titles are optional and default to upstream titles. Automatically discovered PRs without translations may temporarily appear only on the English page; supply translations when adding content manually.
- **Retain empty sections**: Empty files or files containing only HTML comments hide the section in that language. Keep the source files and do not add fabricated placeholder content.
- **Share data and statistics**: Both profiles use the same data batch. `Contrib. Stars` deduplicates external public repositories associated with the user's retrieved PRs, includes all PR statuses, and counts each project once. `Own Stars` counts owned public repositories, including forks. Featured selection, collapsed display, and translation completeness do not affect statistics; display thresholds come from the configuration.

## 5. Generation and Verification

Run commands from the repository root. Keep the Node.js version compatible with the workflow; CI currently uses Node.js 20. If a GitHub token is needed, supply it through the `GITHUB_TOKEN` or `GH_TOKEN` environment variable; do not write it into the repository.

```sh
# Generate both profiles: access GitHub and write changed README files
node scripts/update-profile.mjs

# Check generation logic: no GitHub access
node --test scripts/update-profile.test.mjs

# Check both profiles against current GitHub data: no file writes
node scripts/update-profile.mjs --check

# Check whitespace issues in tracked file diffs
git diff --check
```

| Change Type | Required Verification |
|---|---|
| Displayed text | Generate both profiles; check facts, translations, links, and final diffs |
| Script, configuration, or template | Run generation logic checks, generate and inspect both profiles, and add relevant checks when behavior changes |
| Hero images or layout | Check both languages, light and dark appearances, and language links |
| Maintenance documentation or either AGENTS language version only | Check paths, commands, and rules against the actual implementation; refreshing GitHub data is not required |

`--check` fetches dynamic data again, so changes in Stars or PR status may also cause differences. Distinguish data updates from generation errors. Report checks left incomplete due to network or permission issues honestly; do not fabricate generated data or claim checks passed. After verification passes, repeat it only for new changes or unresolved issues.

## 6. Git Commits and Pushes

1. **Protect existing work**: Inspect the working tree before editing, and inspect working tree and staged diffs before committing. Stage only files within the authorized scope, preserving other uncommitted work. For profile changes, inspect both the sources and bilingual artifacts.
2. **Follow authorization**: Permission to edit files does not automatically authorize commits or pushes. When the user asks for a report first, finish the checks, report the commit plan, and wait for authorization. Once commits and pushes for the same batch of changes are authorized, complete them without asking again.
3. **Report before committing**: State the actual author and committer names and emails, target remote and branch, proposed commit message, and commit scope.
4. **Verify identity and target**: The expected human identity is `cmyk-labs <263870852+cmyk-labs@users.noreply.github.com>`. The current target is `origin` → `https://github.com/cmyk-labs/cmyk-labs.git`, branch `main`. Verify these at execution time and follow the user's current instructions. Do not change global Git configuration or use the bot identity for human changes without authorization.
5. **Use a consistent commit format**: All new commits, including automated updates, must follow the format below. Choose the type and scope based on the actual changes.
6. **Preserve remote updates**: Check for new remote commits before pushing, and synchronize while preserving local work. For generated-file conflicts caused by bot refreshes, preserve source changes from both sides and regenerate. Review source-text conflicts individually; ask the user only when the intended meaning cannot be determined.
7. **Avoid destructive operations**: Do not force-push, rewrite published history, discard working tree content, or delete unrelated files without authorization.
8. **Report the outcome**: Provide the commit hash, push target, verification results, and any remaining uncommitted work. If a commit or push fails, state exactly which steps completed.

### Commit Message Format

```text
type(scope): summary
```

- `type` and `scope` must be lowercase. The scope is required and must not be empty; put exactly one space after the colon.
- Choose a suitable type: `docs`, `feat`, `fix`, `refactor`, `test`, `ci`, or `chore`. Use the main affected area as the scope, such as `profile`, `agents`, `generator`, `workflow`, or `assets`.
- Write a concise English summary beginning with a verb in the base form, without a trailing period. Describe the actual change rather than a generic update.

| Change | Example |
|---|---|
| Profile text | `docs(profile): clarify project introductions and PR contributions` |
| Codex maintenance rules | `docs(agents): standardize commit message format` |
| Workflow schedule | `ci(workflow): schedule profile refresh at 08:00 Beijing time` |
| Automated data refresh | `chore(profile): refresh profile data` |
