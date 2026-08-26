<picture>
  <source media="(prefers-color-scheme: dark)" srcset="./assets/hero-animated-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="./assets/hero-animated-light.svg" />
  <img src="./assets/hero-animated-light.svg" width="100%" alt="cmyk-labs — Build intelligent agents. Ship useful tools." />
</picture>

<p align="center">
  Building reliable AI-agent infrastructure, developer tools, and production-grade open-source systems.
</p>

<!-- PROFILE_SUMMARY:START -->
<p align="center">
  <img src="https://img.shields.io/badge/Contributed_Stars-86.1k-0969da?style=for-the-badge&amp;logo=github&amp;logoColor=white" alt="86.1k contributed project Stars" />
</p>
<!-- PROFILE_SUMMARY:END -->

<!-- FEATURED_PROJECTS:START -->
<!-- FEATURED_PROJECTS:END -->

<!-- FEATURED_CONTRIBUTIONS:START -->
## Selected Open-Source Contributions

<table>
  <tr>
    <td width="78%" valign="top">
      <strong><a href="https://github.com/bytedance/deer-flow">bytedance/deer-flow</a></strong>
      <br /><br />
      <sub>An open-source long-horizon SuperAgent harness that researches, codes, and creates. With the help of sandboxes, memories, tools, skill, subagents and message gateway, it handles different levels of tasks that could take minutes to hours.</sub>
    </td>
    <td width="22%" align="right" valign="top">
      <a href="https://github.com/bytedance/deer-flow/stargazers"><img src="https://img.shields.io/github/stars/bytedance/deer-flow?style=flat-square&amp;label=Stars" alt="bytedance/deer-flow Stars" /></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="https://img.shields.io/badge/-Open-1f883d?style=flat-square" alt="Open" />&nbsp; <strong><a href="https://github.com/bytedance/deer-flow/pull/4937">PR #4937</a> · Dispatch user-scoped custom agents via task()</strong>
      <br />
      <sub>Task(subagent_type=&quot;my-agent&quot;) now resolves user-scoped custom agents as a third registry tier: built-ins → operator-defined config.yaml subagents.custom_agents → the caller&#39;s own /api/agents agents. Later tiers never shadow earlier ones, so operator config stays authoritative.</sub>
    </td>
  </tr>
</table>

<br />

<table>
  <tr>
    <td width="78%" valign="top">
      <strong><a href="https://github.com/huangruiteng/loopx">huangruiteng/loopx</a></strong>
      <br /><br />
      <sub>Long-horizon agent control plane for durable, governed work across Codex, Claude Code, and other harnesses.</sub>
    </td>
    <td width="22%" align="right" valign="top">
      <a href="https://github.com/huangruiteng/loopx/stargazers"><img src="https://img.shields.io/github/stars/huangruiteng/loopx?style=flat-square&amp;label=Stars" alt="huangruiteng/loopx Stars" /></a>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="https://img.shields.io/badge/-Merged-8250df?style=flat-square" alt="Merged" />&nbsp; <strong><a href="https://github.com/huangruiteng/loopx/pull/3554">PR #3554</a> · Promote durable runtime milestones</strong>
      <br />
      <sub>Adds a provider-neutral runtime producer that consumes a bounded, durable rollout-event window. Promotes deduplicated todo_complete thresholds or durable autonomous_replan_recorded refreshes into the existing bounded_segment_milestone trigger path.</sub>
    </td>
  </tr>
  <tr>
    <td colspan="2">
      <img src="https://img.shields.io/badge/-Merged-8250df?style=flat-square" alt="Merged" />&nbsp; <strong><a href="https://github.com/huangruiteng/loopx/pull/3527">PR #3527</a> · Add bounded segment milestone trigger</strong>
      <br />
      <sub>Adds bounded_segment_milestone as a reportable periodic-report trigger. Requires a bounded segment reference and validated transition, with materiality gated on segment_completed or replan_entered plus durable writeback.</sub>
    </td>
  </tr>
</table>
<!-- FEATURED_CONTRIBUTIONS:END -->

<!-- MORE_CONTRIBUTIONS:START -->
<!-- MORE_CONTRIBUTIONS:END -->

---

<p align="center">
  <sub>Repository Stars, pull-request status, ranking, and summaries are refreshed automatically.</sub>
</p>
