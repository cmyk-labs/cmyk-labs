import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const rootDirectory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const readmePath = path.join(rootDirectory, "README.md");
const configPath = path.join(rootDirectory, ".github", "profile.config.json");
const apiRoot = "https://api.github.com";
const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || "";

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

  if (!Array.isArray(config.featuredProjects)) {
    throw new Error("featuredProjects must be an array");
  }

  if (config.featuredProjects.length > 2) {
    throw new Error("featuredProjects supports at most two repositories");
  }
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
      throw new Error(
        `GitHub API ${response.status} for ${url}` +
          (remaining ? ` (rate limit remaining: ${remaining})` : "") +
          `\n${details.slice(0, 500)}`,
      );
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
  return `<img src="https://img.shields.io/badge/-${status.label}-${status.color}?style=flat-square" alt="${status.label}" />`;
}

function starsBadge(repository) {
  return `<a href="${htmlEscape(repository.html_url)}/stargazers"><img src="https://img.shields.io/github/stars/${htmlEscape(repository.full_name)}?style=flat-square&amp;label=Stars" alt="${htmlEscape(repository.full_name)} Stars" /></a>`;
}

function renderProfileSummary(contributedStars, ownedStars, minimumStars) {
  const badges = [];
  if (contributedStars >= minimumStars) {
    badges.push(
      `<img src="https://img.shields.io/badge/Contributed_Stars-${formatStars(contributedStars)}-0969da?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="${formatStars(contributedStars)} contributed project Stars" />`,
    );
  }
  if (ownedStars >= minimumStars) {
    badges.push(
      `<img src="https://img.shields.io/badge/Open--source_Stars-${formatStars(ownedStars)}-1f883d?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="${formatStars(ownedStars)} open-source Stars" />`,
    );
  }

  if (!badges.length) return "";
  return `<p align="center">\n  ${badges.join("\n  ")}\n</p>`;
}

function normalizeFeaturedProject(entry) {
  if (typeof entry === "string") return { repository: entry, introduction: "" };
  return {
    repository: entry.repository || entry.repo || "",
    introduction: entry.introduction || entry.intro || "",
  };
}

function renderFeaturedProjects(config, ownedRepositories) {
  const repositoriesByName = new Map(
    ownedRepositories.map((repository) => [repository.full_name.toLowerCase(), repository]),
  );

  const selected = config.featuredProjects
    .map(normalizeFeaturedProject)
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
    });

  if (!selected.length) return "";

  const cells = selected.map(({ data, introduction }) => {
    const description = introduction || data.description || "Open-source project.";
    const language = data.language ? `<code>${htmlEscape(data.language)}</code>` : "";
    return [
      `<td width="${selected.length === 1 ? "100" : "50"}%" valign="top">`,
      `  <strong><a href="${htmlEscape(data.html_url)}">${htmlEscape(data.full_name)}</a></strong>`,
      `  &nbsp; ${starsBadge(data)}`,
      "  <br /><br />",
      `  ${htmlEscape(description)}`,
      language ? `  <br /><br /><sub>${language}</sub>` : "",
      "</td>",
    ]
      .filter(Boolean)
      .join("\n");
  });

  return `## My Open Source\n\n<table>\n  <tr>\n${cells
    .map((cell) => cell.split("\n").map((line) => `    ${line}`).join("\n"))
    .join("\n")}\n  </tr>\n</table>`;
}

function renderFeaturedContributions(groups, pullRequestLimit, summaryMaximumLength) {
  if (!groups.length) return "";

  const cards = groups.map(({ repository, pullRequests }) => {
    const description = truncateText(repository.description || "Open-source project.", 300);
    const pullRequestRows = pullRequests.slice(0, pullRequestLimit).map((pullRequest) => {
      const status = pullRequestStatus(pullRequest);
      const summary = pullRequestSummary(
        pullRequest.body,
        pullRequest.title,
        summaryMaximumLength,
      );
      return [
        "  <tr>",
        "    <td colspan=\"2\">",
        `      ${statusBadge(status)}&nbsp; <strong><a href="${htmlEscape(pullRequest.html_url)}">PR #${pullRequest.number}</a> · ${htmlEscape(cleanTitle(pullRequest.title))}</strong>`,
        "      <br />",
        `      <sub>${htmlEscape(summary)}</sub>`,
        "    </td>",
        "  </tr>",
      ].join("\n");
    });

    return [
      "<table>",
      "  <tr>",
      "    <td width=\"78%\" valign=\"top\">",
      `      <strong><a href="${htmlEscape(repository.html_url)}">${htmlEscape(repository.full_name)}</a></strong>`,
      "      <br /><br />",
      `      <sub>${htmlEscape(description)}</sub>`,
      "    </td>",
      "    <td width=\"22%\" align=\"right\" valign=\"top\">",
      `      ${starsBadge(repository)}`,
      "    </td>",
      "  </tr>",
      ...pullRequestRows,
      "</table>",
    ].join("\n");
  });

  return `## Selected Open-Source Contributions\n\n${cards.join("\n\n<br />\n\n")}`;
}

function renderMoreContributions(pullRequests, summaryMaximumLength) {
  if (!pullRequests.length) return "";

  const rows = pullRequests.map(({ repository, pullRequest }) => {
    const status = pullRequestStatus(pullRequest).label;
    const summary = pullRequestSummary(
      pullRequest.body,
      pullRequest.title,
      summaryMaximumLength,
    );
    return [
      `[${markdownCell(repository.full_name)}](${repository.html_url})`,
      `[#${pullRequest.number} · ${markdownCell(cleanTitle(pullRequest.title))}](${pullRequest.html_url})`,
      markdownCell(summary),
      `<code>${status}</code>`,
      `[★ ${formatStars(repository.stargazers_count)}](${repository.html_url}/stargazers)`,
    ].join(" | ");
  });

  return [
    "## More Contributions",
    "",
    "| Repository | Pull request | Summary | Status | Stars |",
    "|---|---|---|:---:|---:|",
    ...rows.map((row) => `| ${row} |`),
  ].join("\n");
}

function replaceGeneratedBlock(readme, name, content) {
  const start = `<!-- ${name}:START -->`;
  const end = `<!-- ${name}:END -->`;
  const startIndex = readme.indexOf(start);
  const endIndex = readme.indexOf(end);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    throw new Error(`README is missing the ${name} generation markers`);
  }

  const before = readme.slice(0, startIndex);
  const after = readme.slice(endIndex + end.length);
  const body = content.trim() ? `\n${content.trim()}\n` : "\n";
  return `${before}${start}${body}${end}${after}`;
}

function groupContributions(pullRequests, username) {
  const groups = new Map();

  for (const pullRequest of pullRequests) {
    const repository = pullRequest.base?.repo;
    if (!repository || repository.private) continue;
    if (repository.owner.login.toLowerCase() === username.toLowerCase()) continue;

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

async function buildReadme() {
  const [readme, configSource] = await Promise.all([
    readFile(readmePath, "utf8"),
    readFile(configPath, "utf8"),
  ]);
  const config = JSON.parse(configSource);
  assertConfig(config);

  const [ownedRepositories, searchResults] = await Promise.all([
    fetchOwnedRepositories(config.username),
    searchAuthoredPullRequests(config.username),
  ]);
  const pullRequests = (await fetchPullRequestDetails(searchResults)).filter(Boolean);
  const contributionGroups = groupContributions(pullRequests, config.username);

  const ownedStars = ownedRepositories
    .filter((repository) => !repository.fork)
    .reduce((total, repository) => total + repository.stargazers_count, 0);
  const contributedStars = contributionGroups.reduce(
    (total, group) => total + group.repository.stargazers_count,
    0,
  );

  const featuredRepositoryLimit = config.featuredContributionRepositoryLimit ?? 2;
  const featuredPullRequestLimit = config.featuredPullRequestsPerRepository ?? 3;
  const summaryMaximumLength = config.pullRequestSummaryMaxLength ?? 360;
  const featuredGroups = contributionGroups.slice(0, featuredRepositoryLimit);
  const featuredNames = new Set(featuredGroups.map((group) => group.repository.full_name));
  const morePullRequests = contributionGroups.flatMap((group) => {
    const firstAdditionalIndex = featuredNames.has(group.repository.full_name)
      ? featuredPullRequestLimit
      : 0;
    return group.pullRequests.slice(firstAdditionalIndex).map((pullRequest) => ({
      repository: group.repository,
      pullRequest,
    }));
  });

  let output = readme;
  output = replaceGeneratedBlock(
    output,
    "PROFILE_SUMMARY",
    renderProfileSummary(
      contributedStars,
      ownedStars,
      config.minimumStarsToShow ?? 500,
    ),
  );
  output = replaceGeneratedBlock(
    output,
    "FEATURED_PROJECTS",
    renderFeaturedProjects(config, ownedRepositories),
  );
  output = replaceGeneratedBlock(
    output,
    "FEATURED_CONTRIBUTIONS",
    renderFeaturedContributions(
      featuredGroups,
      featuredPullRequestLimit,
      summaryMaximumLength,
    ),
  );
  output = replaceGeneratedBlock(
    output,
    "MORE_CONTRIBUTIONS",
    renderMoreContributions(morePullRequests, summaryMaximumLength),
  );

  return output.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}

const output = await buildReadme();
const current = await readFile(readmePath, "utf8");

if (process.argv.includes("--check")) {
  if (output !== current.replace(/\r\n/g, "\n")) {
    console.error("README.md is out of date. Run: node scripts/update-profile.mjs");
    process.exitCode = 1;
  } else {
    console.log("README.md is up to date.");
  }
} else if (process.argv.includes("--dry-run")) {
  process.stdout.write(output);
} else if (output === current.replace(/\r\n/g, "\n")) {
  console.log("README.md is already up to date.");
} else {
  await writeFile(readmePath, output, "utf8");
  console.log("README.md updated.");
}
