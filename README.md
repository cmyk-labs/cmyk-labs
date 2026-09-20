<!-- Generated from .github/profile/README.template.md and .github/profile/sections/. -->

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-animated-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-animated-light.svg" />
  <img src="./assets/hero-animated-light.svg" width="100%" alt="cmyk-labs — Build intelligent agents. Ship useful tools." />
</picture>

<p align="center">
  <strong>English</strong> · <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  Open-source work on AI agents, LLM infrastructure, and AI algorithms.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Contrib._Stars-88.6k-0969da?style=for-the-badge&amp;labelColor=3d444d&amp;logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iI2Y2ZDMyZCIgZD0ibTEyIDIuNSAyLjkgNS44OCA2LjQ5Ljk0LTQuNyA0LjU4IDEuMTEgNi40NkwxMiAxNy4zMWwtNS44IDMuMDUgMS4xMS02LjQ2LTQuNy00LjU4IDYuNDktLjk0TDEyIDIuNVoiLz48L3N2Zz4%3D" alt="88.6k Stars across unique contributed repositories" />
  <img src="https://img.shields.io/badge/Own_Stars-17-1f883d?style=for-the-badge&amp;labelColor=3d444d&amp;logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iI2Y2ZDMyZCIgZD0ibTEyIDIuNSAyLjkgNS44OCA2LjQ5Ljk0LTQuNyA0LjU4IDEuMTEgNi40NkwxMiAxNy4zMWwtNS44IDMuMDUgMS4xMS02LjQ2LTQuNy00LjU4IDYuNDktLjk0TDEyIDIuNVoiLz48L3N2Zz4%3D" alt="17 Stars across owned public repositories" />
</p>

## 🚀 About Me

I'm **cmyk-labs**, an open-source contributor exploring how AI capabilities can become useful, maintainable software.

- 🎓 **Education**: B.Eng. (2021–2025) · Major in Data Science and Big Data Technology · Department of Big Data and Artificial Intelligence
- 🎯 **Research Interests**: AI agents, LLM infrastructure, and AI algorithms
- 🌱 **Collaboration**: Open to technical discussions and open-source collaboration in these areas.

## ✨ Featured Contributions

<table>
  <tr>
    <td valign="top">
      <a href="https://github.com/bytedance/deer-flow/stargazers"><img align="right" src="https://img.shields.io/github/stars/bytedance/deer-flow?style=flat-square&amp;label=Stars&amp;labelColor=3d444d&amp;color=0969da&amp;logo=data%3Aimage%2Fsvg%2Bxml%3Bbase64%2CPHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI%2BPHBhdGggZmlsbD0iI2Y2ZDMyZCIgZD0ibTEyIDIuNSAyLjkgNS44OCA2LjQ5Ljk0LTQuNyA0LjU4IDEuMTEgNi40NkwxMiAxNy4zMWwtNS44IDMuMDUgMS4xMS02LjQ2LTQuNy00LjU4IDYuNDktLjk0TDEyIDIuNVoiLz48L3N2Zz4%3D" alt="bytedance/deer-flow Stars" /></a>
      <a href="https://github.com/bytedance/deer-flow"><img align="absmiddle" width="28" height="28" src="https://avatars.githubusercontent.com/u/4158466?v=4" alt="bytedance avatar" /></a>&nbsp;<strong><a href="https://github.com/bytedance/deer-flow">bytedance/deer-flow</a></strong>
      <br />
      <sub>An open-source SuperAgent harness built on LangGraph and LangChain, combining Sub-Agent delegation, sandboxed execution, long-term memory, and extensible Skills for complex research, coding, and content creation tasks.</sub>
    </td>
  </tr>
  <tr>
    <td>
      <img align="absmiddle" src="https://img.shields.io/badge/-Open-1f883d?style=flat-square" alt="Open" />&nbsp; <strong><a href="https://github.com/bytedance/deer-flow/pull/4937">PR #4937</a> · Dispatch user-scoped custom agents via task()</strong>
      <br />
      <sub>Addressed a gap where user-created Custom Agents could run as the Lead Agent but could not be dispatched as Sub-Agents. Extended the Sub-Agent Registry to resolve user-scoped agents while preserving the precedence of built-in, operator-configured, and administrator-managed roles. Mapped SOUL prompts, Skills, model settings, and tool-group allowlists into subagent execution, retaining existing user scoping and reapplying model authorization. This enables the Lead Agent to discover eligible custom roles and dynamically delegate specialized tasks to them.</sub>
    </td>
  </tr>
</table>

## 🔗 More Contributions

| Repository | Pull request | Summary | Status | Stars |
|---|---|---|:---:|:---:|
| [loopx-project/loopx](https://github.com/loopx-project/loopx) | [#3554 · Promote durable runtime milestones](https://github.com/loopx-project/loopx/pull/3554) | Adds a provider-neutral runtime producer that consumes a bounded, durable rollout-event window. Promotes deduplicated todo_complete thresholds or durable autonomous_replan_recorded refreshes into the existing bounded_segment_milestone trigger path. | <code>Merged</code> | [⭐ 5.9k](https://github.com/loopx-project/loopx/stargazers) |
| [loopx-project/loopx](https://github.com/loopx-project/loopx) | [#3527 · Add bounded segment milestone trigger](https://github.com/loopx-project/loopx/pull/3527) | Adds bounded_segment_milestone as a reportable periodic-report trigger. Requires a bounded segment reference and validated transition, with materiality gated on segment_completed or replan_entered plus durable writeback. | <code>Merged</code> | [⭐ 5.9k](https://github.com/loopx-project/loopx/stargazers) |

---

<p align="center">
  <sub>Visuals adapt to your GitHub theme, while repository stars, pull request statuses, rankings, and summaries refresh automatically.</sub>
</p>
