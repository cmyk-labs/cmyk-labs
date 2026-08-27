import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = path.join(rootDirectory, "README.md");
const configPath = path.join(rootDirectory, ".github", "profile.config.json");
const profileDirectory = path.join(rootDirectory, ".github", "profile");
const templatePath = path.join(profileDirectory, "README.template.md");
const sectionsDirectory = path.join(profileDirectory, "sections");
const sectionSourcePaths = {
  ABOUT_ME: path.join(sectionsDirectory, "about.md"),
  OPEN_SOURCE: path.join(sectionsDirectory, "open-source.md"),
  CONTRIBUTIONS: path.join(sectionsDirectory, "contributions.md"),
  HONORS: path.join(sectionsDirectory, "honors.md"),
  CONTACT: path.join(sectionsDirectory, "contact.md"),
};
const apiRoot = "https://api.github.com";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";
const starLogoSvg =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="#f6d32d" d="m12 2.5 2.9 5.88 6.49.94-4.7 4.58 1.11 6.46L12 17.31l-5.8 3.05 1.11-6.46-4.7-4.58 6.49-.94L12 2.5Z"/></svg>';
const starLogo = encodeURIComponent(
  `data:image/svg+xml;base64,${Buffer.from(starLogoSvg).toString("base64")}`,
);

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "cmyk-labs-profile-generator",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

const responseCache = new Map();

function assertConfig(config) {
  if (!config.username || typeof config.username !== "string") {
    throw new Error("profile.config.json must define a username");
  }

  const nonNegativeNumbers = [
    "minimumContributedStarsToShow",
    "minimumOpenSourceStarsToShow",
    "minimumOpenSourceProjectStarsToShow",
    "featuredPullRequestsPerRepository",
    "pullRequestSummaryMaxLength",
  ];
  for (const name of nonNegativeNumbers) {
    if (
      config[name] !== undefined &&
      (!Number.isFinite(config[name]) || config[name] < 0)
    ) {
      throw new Error(`${name} must be a non-negative number`);
    }
  }
  if (
    config.featuredPullRequestsPerRepository !== undefined &&
    !Number.isInteger(config.featuredPullRequestsPerRepository)
  ) {
    throw new Error("featuredPullRequestsPerRepository must be an integer");
  }
}

function stripHtmlComments(value) {
  return String(value ?? "").replace(/<!--[\s\S]*?-->/g, "");
}

function visibleMarkdown(value) {
  return stripHtmlComments(value).trim();
}

function markdownTableCells(line) {
  let source = line.trim();
  if (source.startsWith("|")) source = source.slice(1);
  if (source.endsWith("|")) source = source.slice(0, -1);
  return source
    .split(/(?<!\\)\|/)
    .map((cell) => cell.trim().replaceAll("\\|", "|"));
}

function normalizedColumnName(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseMarkdownTable(source, requiredColumns, fileName) {
  const visibleSource = visibleMarkdown(source);
  if (!visibleSource) return [];

  const lines = visibleSource
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length < 2) {
    throw new Error(`${fileName} must contain a Markdown table`);
  }

  const headers = markdownTableCells(lines[0]).map(normalizedColumnName);
  const separator = markdownTableCells(lines[1]);
  if (
    separator.length !== headers.length ||
    !separator.every((cell) => /^:?-{3,}:?$/.test(cell))
  ) {
    throw new Error(`${fileName} must use a valid Markdown table separator row`);
  }

  for (const column of requiredColumns) {
    if (!headers.includes(normalizedColumnName(column))) {
      throw new Error(`${fileName} must define a ${column} column`);
    }
  }

  return lines.slice(2).map((line, index) => {
    const cells = markdownTableCells(line);
    if (cells.length !== headers.length) {
      throw new Error(`${fileName} row ${index + 3} has ${cells.length} cells; expected ${headers.length}`);
    }
    return Object.fromEntries(headers.map((header, cellIndex) => [header, cells[cellIndex]]));
  });
}

function parseFeatured(value, context) {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "false") return false;
  if (normalized === "true") return true;
  throw new Error(`${context} Featured must be true or false`);
}

function assertRepositoryName(repository, context) {
  if (!/^[^/\s]+\/[^/\s]+$/.test(repository)) {
    throw new Error(`${context} Repository must use owner/repository format`);
  }
}

function assertUniqueRepositories(entries, fileName) {
  const seen = new Set();
  for (const entry of entries) {
    const key = entry.repository.toLowerCase();
    if (seen.has(key)) {
      throw new Error(`${fileName} contains duplicate repository: ${entry.repository}`);
    }
    seen.add(key);
  }
}

function parseOpenSourceEntries(source) {
  const entries = parseMarkdownTable(
    source,
    ["Repository", "Featured", "Description"],
    "open-source.md",
  ).map((row, index) => {
    const context = `open-source.md row ${index + 3}`;
    const repository = row.repository.trim();
    assertRepositoryName(repository, context);
    return {
      repository,
      featured: parseFeatured(row.featured, context),
      description: row.description.trim(),
    };
  });
  assertUniqueRepositories(entries, "open-source.md");
  return entries;
}

function parsePullRequestNumbers(value, context) {
  const numbers = String(value ?? "")
    .split(/[,;\s]+/)
    .map((part) => part.trim().replace(/^#/, ""))
    .filter(Boolean)
    .map((part) => Number(part));
  if (numbers.some((number) => !Number.isInteger(number) || number <= 0)) {
    throw new Error(`${context} Pull Requests must contain positive PR numbers`);
  }
  return [...new Set(numbers)];
}

function parsePullRequestSummaries(value, context, pullRequestNumbers) {
  const summaries = new Map();
  const source = String(value ?? "").trim();
  if (!source) return summaries;

  for (const entry of source.split(/<br\s*\/?>/i).map((item) => item.trim()).filter(Boolean)) {
    const match = entry.match(/^#?(\d+)\s*:\s*(.+)$/);
    if (!match) {
      throw new Error(`${context} PR Summaries must use "PR number: summary" entries separated by <br />`);
    }
    const number = Number(match[1]);
    const summary = match[2].trim();
    if (!pullRequestNumbers.includes(number)) {
      throw new Error(`${context} PR Summary #${number} must also be listed in Pull Requests`);
    }
    if (summaries.has(number)) {
      throw new Error(`${context} contains duplicate PR Summary #${number}`);
    }
    summaries.set(number, summary);
  }

  return summaries;
}

function parseContributionEntries(source) {
  const entries = parseMarkdownTable(
    source,
    ["Repository", "Featured", "Introduction", "Pull Requests"],
    "contributions.md",
  ).map((row, index) => {
    const context = `contributions.md row ${index + 3}`;
    const repository = row.repository.trim();
    assertRepositoryName(repository, context);
    const pullRequestNumbers = parsePullRequestNumbers(row.pullrequests, context);
    return {
      repository,
      featured: parseFeatured(row.featured, context),
      introduction: row.introduction.trim(),
      pullRequestNumbers,
      pullRequestSummaries: parsePullRequestSummaries(
        row.prsummaries,
        context,
        pullRequestNumbers,
      ),
    };
  });
  assertUniqueRepositories(entries, "contributions.md");
  return entries;
}

function makeApiUrl(resource, query = {}) {
  const url = new URL(resource.startsWith("http") ? resource : `${apiRoot}${resource}`);
  for (const [key, value] of Object.entries(query)) {
    url.searchParams.set(key, String(value));
  }
  return url.toString();
}

async function githubJson(resource, query = {}) {
  const url = makeApiUrl(resource, query);
  if (responseCache.has(url)) {
    return responseCache.get(url);
  }

  const promise = fetch(url, { headers }).then(async (response) => {
    if (!response.ok) {
      const details = await response.text();
      const remaining = response.headers.get("x-ratelimit-remaining");
      const error = new Error(
        `GitHub API ${response.status} for ${url}` +
          (remaining ? ` (rate limit remaining: ${remaining})` : "") +
          `\n${details.slice(0, 500)}`,
      );
      error.status = response.status;
      throw error;
    }
    return response.json();
  });

  responseCache.set(url, promise);
  return promise;
}

async function fetchOwnedRepositories(username) {
  const repositories = [];

  for (let page = 1; ; page += 1) {
    const batch = await githubJson(`/users/${encodeURIComponent(username)}/repos`, {
      type: "owner",
      sort: "updated",
      direction: "desc",
      per_page: 100,
      page,
    });
    repositories.push(...batch);
    if (batch.length < 100) break;
  }

  return repositories;
}

async function searchAuthoredPullRequests(username) {
  const results = [];

  for (let page = 1; page <= 10; page += 1) {
    const response = await githubJson("/search/issues", {
      q: `author:${username} type:pr`,
      sort: "updated",
      order: "desc",
      per_page: 100,
      page,
    });

    results.push(...response.items);
    const available = Math.min(response.total_count, 1000);
    if (results.length >= available || response.items.length < 100) break;
  }

  return results;
}

async function mapWithConcurrency(values, concurrency, mapper) {
  const results = new Array(values.length);
  let cursor = 0;

  async function worker() {
    while (cursor < values.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await mapper(values[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, values.length) }, () => worker()),
  );
  return results;
}

async function fetchPullRequestDetails(searchResults) {
  return mapWithConcurrency(searchResults, 8, (item) => githubJson(item.pull_request.url));
}

async function fetchConfiguredPullRequestDetails(entries) {
  const configured = entries.flatMap((entry) =>
    entry.pullRequestNumbers.map((number) => ({ repository: entry.repository, number })),
  );
  return mapWithConcurrency(configured, 8, async ({ repository, number }) => {
    const [owner, name] = repository.split("/");
    try {
      return await githubJson(
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/pulls/${number}`,
      );
    } catch (error) {
      if (error.status !== 404) throw error;
      console.warn(`Configured contribution PR not found: ${repository}#${number}`);
      return null;
    }
  });
}

function mergePullRequests(...collections) {
  const pullRequests = new Map();
  for (const pullRequest of collections.flat()) {
    const repositoryName = pullRequest?.base?.repo?.full_name;
    if (!repositoryName || !pullRequest.number) continue;
    pullRequests.set(
      `${repositoryName.toLowerCase()}#${pullRequest.number}`,
      pullRequest,
    );
  }
  return [...pullRequests.values()];
}

function htmlEscape(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function markdownCell(value) {
  return String(value ?? "")
    .replaceAll("|", "\\|")
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanTitle(title) {
  const cleaned = String(title ?? "")
    .replace(
      /^(?:feat|fix|docs|refactor|perf|test|chore|build|ci)(?:\([^)]*\))?!?:\s*/i,
      "",
    )
    .trim();
  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "Pull request";
}

function cleanMarkdown(value) {
  return String(value ?? "")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, " ")
    .replace(/^>\s?/gm, "")
    .replace(/[`*~]/g, "")
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function preferredBodySection(body) {
  const source = String(body ?? "");
  const headings = [...source.matchAll(/^#{1,6}\s+(.+?)\s*$/gm)].map((match) => ({
    title: cleanMarkdown(match[1]).toLowerCase(),
    start: match.index + match[0].length,
    headingStart: match.index,
  }));

  if (!headings.length) return source;

  const preferred = ["summary", "what changed", "overview", "description", "why"];
  for (const wanted of preferred) {
    const index = headings.findIndex(
      (heading) => heading.title === wanted || heading.title.startsWith(`${wanted} `),
    );
    if (index !== -1) {
      const end = headings[index + 1]?.headingStart ?? source.length;
      return source.slice(headings[index].start, end);
    }
  }

  return source;
}

function sentenceCaseBullet(value) {
  let text = cleanMarkdown(value).replace(/^\[[ xX]\]\s*/, "").trim();
  const verbForms = new Map([
    ["add", "Adds"],
    ["connect", "Connects"],
    ["document", "Documents"],
    ["enable", "Enables"],
    ["fix", "Fixes"],
    ["implement", "Implements"],
    ["introduce", "Introduces"],
    ["keep", "Keeps"],
    ["make", "Makes"],
    ["preserve", "Preserves"],
    ["promote", "Promotes"],
    ["require", "Requires"],
    ["route", "Routes"],
    ["support", "Supports"],
    ["turn", "Turns"],
    ["update", "Updates"],
  ]);

  const firstWord = text.match(/^([a-z]+)\b/i)?.[1]?.toLowerCase();
  if (firstWord && verbForms.has(firstWord)) {
    text = verbForms.get(firstWord) + text.slice(firstWord.length);
  } else if (text) {
    text = text[0].toUpperCase() + text.slice(1);
  }

  if (text && !/[.!?…]$/.test(text)) text += ".";
  return text;
}

function truncateText(value, maximumLength) {
  const text = String(value ?? "").trim();
  if (text.length <= maximumLength) return text;
  const slice = text.slice(0, Math.max(1, maximumLength - 1));
  const boundary = slice.lastIndexOf(" ");
  return `${slice.slice(0, boundary > maximumLength * 0.65 ? boundary : slice.length).trim()}…`;
}

function splitSentences(value) {
  const text = String(value ?? "").trim();
  if (!text) return [];
  return text
    .split(/(?<=[.!?。！？])\s+(?=[A-Z0-9"'“‘])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}

function pullRequestSummary(body, title, maximumLength) {
  const section = preferredBodySection(body);
  const bullets = section
    .split(/\r?\n/)
    .map((line) => line.match(/^\s*[-+*]\s+(.+)$/)?.[1])
    .filter(Boolean)
    .filter((line) => !/^\[[ xX]\]/.test(line));

  let candidates;
  if (bullets.length) {
    candidates = bullets
      .slice(0, 2)
      .map(sentenceCaseBullet)
      .flatMap(splitSentences)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  } else {
    const prose = cleanMarkdown(section);
    candidates = splitSentences(prose)
      .map((sentence) => sentence.trim())
      .filter(Boolean);
  }

  if (!candidates.length) {
    candidates = [`Implements ${cleanTitle(title).replace(/[.!?]$/, "")}.`];
  }

  const selected = [];
  for (const sentence of candidates) {
    const candidate = [...selected, sentence].join(" ");
    if (candidate.length > maximumLength) {
      if (!selected.length) selected.push(truncateText(sentence, maximumLength));
      break;
    }
    selected.push(sentence);
    if (selected.length === 2) break;
  }

  return selected.join(" ");
}

function pullRequestDisplaySummary(pullRequest, maximumLength) {
  if (pullRequest.configuredSummary) return pullRequest.configuredSummary;
  return pullRequestSummary(pullRequest.body, pullRequest.title, maximumLength);
}

function pullRequestStatus(pullRequest) {
  if (pullRequest.merged_at) return { label: "Merged", color: "8250df" };
  if (pullRequest.draft) return { label: "Draft", color: "6e7781" };
  if (pullRequest.state === "open") return { label: "Open", color: "1f883d" };
  return { label: "Closed", color: "cf222e" };
}

function formatStars(value) {
  const stars = Number(value) || 0;
  if (stars >= 1_000_000) {
    return `${(stars / 1_000_000).toFixed(stars >= 10_000_000 ? 0 : 1).replace(/\.0$/, "")}m`;
  }
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(stars >= 100_000 ? 0 : 1).replace(/\.0$/, "")}k`;
  }
  return String(stars);
}

function statusBadge(status) {
  return `<img align="absmiddle" src="https://img.shields.io/badge/-${status.label}-${status.color}?style=flat-square" alt="${status.label}" />`;
}

function starsBadge(repository, alignment = "") {
  const alignAttribute = alignment ? ` align="${alignment}"` : "";
  return `<a href="${htmlEscape(repository.html_url)}/stargazers"><img${alignAttribute} src="https://img.shields.io/github/stars/${htmlEscape(repository.full_name)}?style=flat-square&amp;label=Stars&amp;labelColor=3d444d&amp;color=0969da&amp;logo=${starLogo}" alt="${htmlEscape(repository.full_name)} Stars" /></a>`;
}

function repositoryAvatar(repository) {
  const avatarUrl = repository.owner?.avatar_url;
  if (!avatarUrl) return "";
  return `<a href="${htmlEscape(repository.html_url)}"><img align="absmiddle" width="28" height="28" src="${htmlEscape(avatarUrl)}" alt="${htmlEscape(repository.owner.login)} avatar" /></a>&nbsp;`;
}

function renderProfileSummary(
  contributedStars,
  ownedStars,
  minimumContributedStars,
  minimumOpenSourceStars,
) {
  const badges = [];
  if (contributedStars >= minimumContributedStars) {
    badges.push(
      `<img src="https://img.shields.io/badge/Contrib._Stars-${formatStars(contributedStars)}-0969da?style=for-the-badge&amp;labelColor=3d444d&amp;logo=${starLogo}" alt="${formatStars(contributedStars)} contributed project Stars" />`,
    );
  }
  if (ownedStars >= minimumOpenSourceStars) {
    badges.push(
      `<img src="https://img.shields.io/badge/Open--source_Stars-${formatStars(ownedStars)}-1f883d?style=for-the-badge&amp;labelColor=3d444d&amp;logo=${starLogo}" alt="${formatStars(ownedStars)} open-source Stars" />`,
    );
  }

  if (!badges.length) return "";
  return `<p align="center">\n  ${badges.join("\n  ")}\n</p>`;
}

function renderContentSection(title, source) {
  const body = visibleMarkdown(source);
  return body ? `## ${title}\n\n${body}` : "";
}

function renderOpenSource(entries, ownedRepositories, minimumStarsToShow) {
  const repositoriesByName = new Map(
    ownedRepositories.map((repository) => [repository.full_name.toLowerCase(), repository]),
  );

  const selected = entries
    .filter(({ featured }) => featured)
    .map((entry) => ({
      ...entry,
      data: repositoriesByName.get(entry.repository.toLowerCase()),
    }))
    .filter((entry) => {
      if (!entry.data) {
        console.warn(`Featured project not found or not public: ${entry.repository}`);
        return false;
      }
      if (entry.data.fork) {
        console.warn(`Featured project must not be a fork: ${entry.repository}`);
        return false;
      }
      return true;
    })
    .sort(
      (left, right) =>
        right.data.stargazers_count - left.data.stargazers_count ||
        left.data.full_name.localeCompare(right.data.full_name),
    );

  if (!selected.length) return "";

  const cells = selected.map(({ data, description: configuredDescription }) => {
    const description = configuredDescription || data.description || "Open-source project.";
    const language = data.language ? `<code>${htmlEscape(data.language)}</code>` : "";
    return [
      `<td width="${selected.length === 1 ? "100" : "50"}%" valign="top">`,
      data.stargazers_count >= minimumStarsToShow ? `  ${starsBadge(data, "right")}` : "",
      `  <strong><a href="${htmlEscape(data.html_url)}">${htmlEscape(data.full_name)}</a></strong>`,
      "  <br />",
      `  ${htmlEscape(description)}`,
      language ? `  <br /><br /><sub>${language}</sub>` : "",
      "</td>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  const rows = [];
  for (let index = 0; index < cells.length; index += 2) {
    rows.push(
      `  <tr>\n${cells
        .slice(index, index + 2)
        .map((cell) => cell.split("\n").map((line) => `    ${line}`).join("\n"))
        .join("\n")}\n  </tr>`,
    );
  }

  return `## 📦 Open Source\n\n<table>\n${rows.join("\n")}\n</table>`;
}

function renderCollapsedPullRequests(pullRequests, summaryMaximumLength) {
  if (!pullRequests.length) return "";

  const rows = pullRequests.map((pullRequest) => {
    const summary = pullRequestDisplaySummary(pullRequest, summaryMaximumLength);
    return `| [#${pullRequest.number} · ${markdownCell(cleanTitle(pullRequest.title))}](${pullRequest.html_url}) | ${markdownCell(summary)} | <code>${pullRequestStatus(pullRequest).label}</code> |`;
  });

  return [
    "<details>",
    `<summary>More pull requests (${pullRequests.length})</summary>`,
    "",
    "| Pull request | Summary | Status |",
    "|---|---|:---:|",
    ...rows,
    "",
    "</details>",
  ].join("\n");
}

function renderFeaturedContributions(
  groups,
  summaryMaximumLength,
  expandedPullRequestLimit,
) {
  if (!groups.length) return "";

  const cards = groups.map(({ repository, pullRequests, introduction }) => {
    const description = truncateText(
      introduction || repository.description || "Open-source project.",
      300,
    );
    const expandedPullRequests = pullRequests.slice(0, expandedPullRequestLimit);
    const collapsedPullRequests = pullRequests.slice(expandedPullRequestLimit);
    const pullRequestBlocks = expandedPullRequests.map((pullRequest, index) => {
      const status = pullRequestStatus(pullRequest);
      const summary = pullRequestDisplaySummary(pullRequest, summaryMaximumLength);
      return [
        index ? "      <br /><br />" : "",
        `      ${statusBadge(status)}&nbsp; <strong><a href="${htmlEscape(pullRequest.html_url)}">PR #${pullRequest.number}</a> · ${htmlEscape(cleanTitle(pullRequest.title))}</strong>`,
        "      <br />",
        `      <sub>${htmlEscape(summary)}</sub>`,
      ]
        .filter(Boolean)
        .join("\n");
    });

    const card = [
      "<table>",
      "  <tr>",
      "    <td valign=\"top\">",
      `      ${starsBadge(repository, "right")}`,
      `      ${repositoryAvatar(repository)}<strong><a href="${htmlEscape(repository.html_url)}">${htmlEscape(repository.full_name)}</a></strong>`,
      "      <br />",
      `      <sub>${htmlEscape(description)}</sub>`,
      "    </td>",
      "  </tr>",
      "  <tr>",
      "    <td>",
      ...pullRequestBlocks,
      "    </td>",
      "  </tr>",
      "</table>",
    ]
      .filter(Boolean)
      .join("\n");
    return [
      card,
      renderCollapsedPullRequests(collapsedPullRequests, summaryMaximumLength),
    ]
      .filter(Boolean)
      .join("\n\n");
  });

  return `## ✨ Featured Contributions\n\n${cards.join("\n\n<br />\n\n")}`;
}

function renderMoreContributions(pullRequests, summaryMaximumLength) {
  if (!pullRequests.length) return "";

  const rows = pullRequests.map(({ repository, pullRequest }) => {
    const status = pullRequestStatus(pullRequest).label;
    const summary = pullRequestDisplaySummary(pullRequest, summaryMaximumLength);
    return [
      `[${markdownCell(repository.full_name)}](${repository.html_url})`,
      `[#${pullRequest.number} · ${markdownCell(cleanTitle(pullRequest.title))}](${pullRequest.html_url})`,
      markdownCell(summary),
      `<code>${status}</code>`,
      `[⭐ ${formatStars(repository.stargazers_count)}](${repository.html_url}/stargazers)`,
    ].join(" | ");
  });

  return [
    "## 🔗 More Contributions",
    "",
    "| Repository | Pull request | Summary | Status | Stars |",
    "|---|---|---|:---:|:---:|",
    ...rows.map((row) => `| ${row} |`),
  ].join("\n");
}

function renderContributions(
  featuredGroups,
  morePullRequests,
  summaryMaximumLength,
  expandedPullRequestLimit,
) {
  return [
    renderFeaturedContributions(
      featuredGroups,
      summaryMaximumLength,
      expandedPullRequestLimit,
    ),
    renderMoreContributions(morePullRequests, summaryMaximumLength),
  ]
    .filter(Boolean)
    .join("\n\n");
}

function normalizeMarkdown(value) {
  return String(value).replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

function replaceTemplateToken(template, name, content) {
  const token = `{{${name}}}`;
  const occurrences = template.split(token).length - 1;
  if (occurrences !== 1) {
    throw new Error(`README template must contain exactly one ${token} token`);
  }
  return template.replace(token, content.trim());
}

function groupContributions(pullRequests, username) {
  const groups = new Map();

  for (const pullRequest of pullRequests) {
    const repository = pullRequest.base?.repo;
    if (!repository || repository.private) continue;
    if (pullRequest.user?.login?.toLowerCase() !== username.toLowerCase()) continue;
    if (repository.owner?.login?.toLowerCase() === username.toLowerCase()) continue;

    if (!groups.has(repository.full_name)) {
      groups.set(repository.full_name, { repository, pullRequests: [] });
    }
    groups.get(repository.full_name).pullRequests.push(pullRequest);
  }

  return [...groups.values()]
    .map((group) => ({
      ...group,
      pullRequests: group.pullRequests.sort(
        (left, right) => new Date(right.updated_at) - new Date(left.updated_at),
      ),
    }))
    .sort(
      (left, right) =>
        right.repository.stargazers_count - left.repository.stargazers_count ||
        left.repository.full_name.localeCompare(right.repository.full_name),
    );
}

function prioritizeConfiguredPullRequests(pullRequests, configuredNumbers) {
  const configuredOrder = new Map(
    configuredNumbers.map((number, index) => [number, index]),
  );
  return [...pullRequests].sort((left, right) => {
    const leftIsConfigured = configuredOrder.has(left.number);
    const rightIsConfigured = configuredOrder.has(right.number);
    if (leftIsConfigured && rightIsConfigured) {
      return configuredOrder.get(left.number) - configuredOrder.get(right.number);
    }
    if (leftIsConfigured) return -1;
    if (rightIsConfigured) return 1;
    return new Date(right.updated_at) - new Date(left.updated_at);
  });
}

function applyConfiguredPullRequestSummaries(pullRequests, configuredSummaries) {
  return pullRequests.map((pullRequest) => {
    const configuredSummary = configuredSummaries?.get(pullRequest.number);
    return configuredSummary ? { ...pullRequest, configuredSummary } : pullRequest;
  });
}

function splitContributions(contributionGroups, configuredRepositories) {
  const configurationByRepository = new Map(
    configuredRepositories.map((entry) => [entry.repository.toLowerCase(), entry]),
  );
  const availableRepositories = new Set(
    contributionGroups.map(({ repository }) => repository.full_name.toLowerCase()),
  );

  for (const entry of configuredRepositories) {
    if (!availableRepositories.has(entry.repository.toLowerCase())) {
      console.warn(`Configured contribution repository has no public authored PRs: ${entry.repository}`);
    }
  }

  const featuredGroups = [];
  const morePullRequests = [];
  for (const { repository, pullRequests } of contributionGroups) {
    const configuration = configurationByRepository.get(repository.full_name.toLowerCase());
    const configuredPullRequests = applyConfiguredPullRequestSummaries(
      pullRequests,
      configuration?.pullRequestSummaries,
    );
    if (configuration?.featured) {
      const availableNumbers = new Set(pullRequests.map(({ number }) => number));
      for (const number of configuration.pullRequestNumbers) {
        if (!availableNumbers.has(number)) {
          console.warn(`Configured contribution PR not found: ${repository.full_name}#${number}`);
        }
      }
      featuredGroups.push({
        repository,
        introduction: configuration.introduction,
        pullRequests: prioritizeConfiguredPullRequests(
          configuredPullRequests,
          configuration.pullRequestNumbers,
        ),
      });
      continue;
    }

    morePullRequests.push(
      ...configuredPullRequests.map((pullRequest) => ({ repository, pullRequest })),
    );
  }

  return { featuredGroups, morePullRequests };
}

async function buildArtifacts() {
  const sectionNames = Object.keys(sectionSourcePaths);
  const [template, configSource, ...sectionSources] = await Promise.all([
    readFile(templatePath, "utf8"),
    readFile(configPath, "utf8"),
    ...sectionNames.map((name) => readFile(sectionSourcePaths[name], "utf8")),
  ]);
  const config = JSON.parse(configSource);
  assertConfig(config);
  const sources = Object.fromEntries(
    sectionNames.map((name, index) => [name, sectionSources[index]]),
  );
  const openSourceEntries = parseOpenSourceEntries(sources.OPEN_SOURCE);
  const contributionEntries = parseContributionEntries(sources.CONTRIBUTIONS);

  const [ownedRepositories, searchResults, configuredPullRequests] = await Promise.all([
    fetchOwnedRepositories(config.username),
    searchAuthoredPullRequests(config.username),
    fetchConfiguredPullRequestDetails(contributionEntries),
  ]);
  const searchedPullRequests = await fetchPullRequestDetails(searchResults);
  const pullRequests = mergePullRequests(
    searchedPullRequests,
    configuredPullRequests,
  );
  const contributionGroups = groupContributions(pullRequests, config.username);

  const ownedStars = ownedRepositories
    .reduce((total, repository) => total + repository.stargazers_count, 0);
  const contributedStars = contributionGroups.reduce(
    (total, group) => total + group.repository.stargazers_count,
    0,
  );

  const expandedPullRequestLimit = config.featuredPullRequestsPerRepository ?? 2;
  const summaryMaximumLength = config.pullRequestSummaryMaxLength ?? 360;
  const { featuredGroups, morePullRequests } = splitContributions(
    contributionGroups,
    contributionEntries,
  );

  const profileSummary = renderProfileSummary(
    contributedStars,
    ownedStars,
    config.minimumContributedStarsToShow ?? config.minimumStarsToShow ?? 500,
    config.minimumOpenSourceStarsToShow ?? 0,
  );
  const sections = {
    ABOUT_ME: renderContentSection("🚀 About Me", sources.ABOUT_ME),
    OPEN_SOURCE: renderOpenSource(
      openSourceEntries,
      ownedRepositories,
      config.minimumOpenSourceProjectStarsToShow ?? 200,
    ),
    CONTRIBUTIONS: renderContributions(
      featuredGroups,
      morePullRequests,
      summaryMaximumLength,
      expandedPullRequestLimit,
    ),
    HONORS: renderContentSection("🏆 Honors", sources.HONORS),
    CONTACT: renderContentSection("📫 Contact", sources.CONTACT),
  };

  let readme = template;
  readme = replaceTemplateToken(readme, "PROFILE_SUMMARY", profileSummary);
  for (const [name, content] of Object.entries(sections)) {
    readme = replaceTemplateToken(readme, name, content);
  }

  return new Map([[readmePath, normalizeMarkdown(readme)]]);
}

async function readCurrentFile(filePath) {
  try {
    return (await readFile(filePath, "utf8")).replace(/\r\n/g, "\n");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }
}

function displayPath(filePath) {
  return path.relative(rootDirectory, filePath).replaceAll("\\", "/");
}

const artifacts = await buildArtifacts();
const currentArtifacts = new Map(
  await Promise.all(
    [...artifacts.keys()].map(async (filePath) => [filePath, await readCurrentFile(filePath)]),
  ),
);
const changedFiles = [...artifacts.entries()]
  .filter(([filePath, content]) => content !== currentArtifacts.get(filePath))
  .map(([filePath]) => filePath);

if (process.argv.includes("--check")) {
  if (changedFiles.length) {
    console.error(
      `Generated profile files are out of date: ${changedFiles.map(displayPath).join(", ")}`,
    );
    console.error("Run: node scripts/update-profile.mjs");
    process.exitCode = 1;
  } else {
    console.log("README.md is up to date.");
  }
} else if (process.argv.includes("--dry-run")) {
  process.stdout.write(artifacts.get(readmePath));
} else if (!changedFiles.length) {
  console.log("README.md is already up to date.");
} else {
  await Promise.all(
    changedFiles.map((filePath) => writeFile(filePath, artifacts.get(filePath), "utf8")),
  );
  console.log(`Updated: ${changedFiles.map(displayPath).join(", ")}`);
}
