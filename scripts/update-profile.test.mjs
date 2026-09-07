import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { renderProfilePages } from "./update-profile.mjs";

const template = await readFile(new URL("../.github/profile/README.template.md", import.meta.url), "utf8");

function repository(fullName, stars, extra = {}) {
  return {
    full_name: fullName,
    html_url: `https://github.com/${fullName}`,
    stargazers_count: stars,
    owner: { login: fullName.split("/")[0] },
    private: false,
    fork: false,
    ...extra,
  };
}

function pullRequest(repo, number, extra = {}) {
  return {
    number,
    title: `feat: task ${number}`,
    body: `Complete task ${number}.`,
    html_url: `${repo.html_url}/pull/${number}`,
    user: { login: "cmyk-labs" },
    base: { repo },
    state: "open",
    draft: false,
    merged_at: null,
    updated_at: `2026-09-${String(number).padStart(2, "0")}T00:00:00Z`,
    ...extra,
  };
}

function fixture() {
  const featured = repository("org/featured", 10000);
  const additional = repository("org/additional", 2000);
  const own = repository("cmyk-labs/own", 100);
  return {
    template,
    config: {
      username: "cmyk-labs",
      featuredPullRequestsPerRepository: 1,
      minimumContributedStarsToShow: 0,
      minimumOpenSourceStarsToShow: 0,
    },
    sourcesByLocale: {
      en: {
        ABOUT_ME: "English biography.",
        OPEN_SOURCE: "| Repository | Featured | Description |\n|---|---|---|\n| cmyk-labs/own | true | Own project. |",
        CONTRIBUTIONS: "| Repository | Featured | Introduction | Pull Requests | PR Summaries |\n|---|---|---|---|---|\n| org/featured | true | English project introduction. | 12, 10, 11 | 12: Closed task summary.<br />10: Open task summary.<br />11: Merged task summary. |",
        HONORS: "English award.",
        CONTACT: "English contact.",
      },
      "zh-CN": {
        ABOUT_ME: "中文个人介绍。",
        OPEN_SOURCE: "| Repository | Description |\n|---|---|\n| cmyk-labs/own | 自有项目。 |",
        CONTRIBUTIONS: "| Repository | Introduction | PR Summaries | PR Titles |\n|---|---|---|---|\n| org/featured | 中文项目介绍。 | 11: 已合并任务。<br />10: 进行中的任务。<br />12: 已关闭任务。 | 12: 关闭的任务 |\n| org/additional | 其他项目。 | 20: 草稿任务。 | |",
        HONORS: "<!-- 预留荣誉 -->",
        CONTACT: "",
      },
    },
    ownedRepositories: [own, repository("cmyk-labs/fork", 50, { fork: true })],
    pullRequests: [
      pullRequest(featured, 10),
      pullRequest(featured, 11, { state: "closed", merged_at: "2026-09-01T00:00:00Z" }),
      pullRequest(featured, 12, { state: "closed" }),
      pullRequest(additional, 20, { draft: true }),
      pullRequest(repository("org/private", 99999, { private: true }), 21),
      pullRequest(own, 22),
      pullRequest(repository("org/someone-else", 99999), 23, { user: { login: "someone-else" } }),
    ],
  };
}

function pages(input) {
  return Object.fromEntries([...renderProfilePages(input)]
    .map(([fileName, content]) => [path.basename(fileName), content]));
}

test("both pages share repository totals, all PR states, and language-link placement", () => {
  const output = pages(fixture());
  for (const content of Object.values(output)) {
    assert.match(content, /Contrib\._Stars-12k-/);
    assert.match(content, /Own_Stars-150-/);
    assert.doesNotMatch(content, /\{\{[A-Z_]+\}\}/);
    const switchPosition = content.indexOf('<p align="center">', content.indexOf("</picture>"));
    assert.ok(switchPosition > content.indexOf("</picture>"));
    assert.ok(switchPosition < content.indexOf("Contrib._Stars"));
  }
  assert.match(output["README.md"], /<strong>English<\/strong> · <a href="\.\/README.zh-CN.md">简体中文<\/a>/);
  assert.match(output["README.zh-CN.md"], /<a href="\.\/README.md">English<\/a> · <strong>简体中文<\/strong>/);
  assert.match(output["README.zh-CN.md"], /alt="已关闭"/);
  assert.match(output["README.zh-CN.md"], /<code>已合并<\/code>/);
  assert.match(output["README.zh-CN.md"], /<code>草稿<\/code>/);
});

test("Chinese translations preserve English selection and PR order without mutating inputs", () => {
  const input = fixture();
  input.sourcesByLocale["zh-CN"].OPEN_SOURCE += "\n| cmyk-labs/fork | 不应独立成为精选项目。 |";
  input.sourcesByLocale["zh-CN"].CONTRIBUTIONS += "\n| org/translation-only | 不应创建贡献项目。 | 99: 不应展示。 | |";
  const before = JSON.stringify(input);
  const output = pages(input);
  assert.equal(JSON.stringify(input), before);
  const chinese = output["README.zh-CN.md"];
  assert.match(chinese, /中文项目介绍。/);
  assert.match(chinese, /关闭的任务/);
  assert.doesNotMatch(chinese, /English project introduction|Closed task summary|不应/);
  assert.match(chinese, /更多 PR（2）/);
  assert.match(chinese, /## 🔗 更多开源贡献/);
  assert.match(chinese, /org\/additional/);
  assert.ok(chinese.indexOf("/pull/12") < chinese.indexOf("/pull/10"));
  assert.ok(chinese.indexOf("/pull/10") < chinese.indexOf("/pull/11"));
  assert.match(output["README.md"], /Closed task summary/);
});

test("empty or untranslated modules hide independently while statistics remain shared", () => {
  const input = fixture();
  input.sourcesByLocale["zh-CN"] = Object.fromEntries(
    Object.keys(input.sourcesByLocale["zh-CN"]).map((key) => [key, "<!-- 待补充 -->"]),
  );
  const output = pages(input);
  assert.match(output["README.md"], /## 🚀 About Me/);
  assert.match(output["README.md"], /## 📦 Open Source/);
  assert.match(output["README.md"], /## 🏆 Honors/);
  assert.doesNotMatch(output["README.zh-CN.md"], /^## /m);
  assert.doesNotMatch(output["README.zh-CN.md"], /English biography|Own project|待补充/);
  assert.match(output["README.zh-CN.md"], /Contrib\._Stars-12k-/);
});

test("partial PR translations hide only untranslated PRs and escape translated text", () => {
  const input = fixture();
  input.sourcesByLocale["zh-CN"].CONTRIBUTIONS = "| Repository | Introduction | PR Summaries | PR Titles |\n|---|---|---|---|\n| org/featured | 中文介绍。 | 10: 保留 <b>提示词</b> 与 A&B。 | 10: <script>标题</script> |";
  const chinese = pages(input)["README.zh-CN.md"];
  assert.match(chinese, /&lt;script&gt;标题&lt;\/script&gt;/);
  assert.match(chinese, /&lt;b&gt;提示词&lt;\/b&gt; 与 A&amp;B/);
  assert.doesNotMatch(chinese, /<script>|\/pull\/11|\/pull\/12|## 🔗 更多开源贡献/);
  assert.match(chinese, /Contrib\._Stars-12k-/);
});

for (const [name, translation, expected] of [
  ["independent selection", "| Repository | Introduction | PR Summaries | Featured |\n|---|---|---|---|\n| org/featured | 简介 | 10: 内容 | true |", /unsupported translation columns/],
  ["duplicate PR translations", "| Repository | Introduction | PR Summaries |\n|---|---|---|\n| org/featured | 简介 | 10: 内容<br />10: 重复内容 |", /duplicate PR Summaries/],
  ["invalid PR identities", "| Repository | Introduction | PR Summaries |\n|---|---|---|\n| org/featured | 简介 | 0: 内容 |", /positive PR numbers/],
]) {
  test(`translation validation rejects ${name}`, () => {
    const input = fixture();
    input.sourcesByLocale["zh-CN"].CONTRIBUTIONS = translation;
    assert.throws(() => pages(input), expected);
  });
}
