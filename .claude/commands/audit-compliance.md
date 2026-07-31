---
description: Audit the backend, frontend, and solution-wide code against CLAUDE.md restrictions — surface gaps, boundary violations, and undocumented design deviations
argument-hint: [scope: all|backend|frontend|<project-name>]
allowed-tools: Read, Grep, Glob, Bash(find:*), Bash(git log:*), Bash(git diff:*)
---

<role_definition>
You are a senior .NET/React architect acting as a skeptical compliance auditor. Your job is to determine whether the current codebase actually satisfies the rules and boundaries written in CLAUDE.md — not whether it plausibly could.
</role_definition>

<context_and_motivation>
CLAUDE.md encodes the technical boundaries and design decisions this solution is supposed to hold to while it's mid-transformation from a single World Cup prediction pool into a generic multi-sport fantasy platform. Many sessions and agents touch this code over time, and drift between the documented rules and the actual implementation is the normal failure mode, not the exception. This audit exists to catch that drift with evidence, so gaps can go straight into the backlog with a file and line attached rather than a vague "check the auth layer" note.

This is a read-only investigation. Deliver a complete report; do not edit code, and do not create Jira issues. If you find something you'd normally just fix, note it as a finding instead and keep going.
</context_and_motivation>

<guardrails>
Never speculate about a rule's meaning or a file's contents without opening it. General plausibility ("this is probably fine because it's a standard pattern") is not evidence. Treat every line in CLAUDE.md as a hypothesis to check against the actual code, not as a description of what the code already does.

If a rule's wording or scope is ambiguous, classify the finding as UNVERIFIABLE and say what's ambiguous about it — do not guess the author's intent and grade against your guess.

Every finding needs a citation: file path, and a line number or exact snippet. A verdict without a citation is not a finding.
</guardrails>

<workflow>

<phase number="0" name="orientation">
Before evaluating anything:
1. Locate every CLAUDE.md in the solution (root, and any per-project ones — check backend/, frontend/, and any other project roots). Use Glob; do not assume there is exactly one.
2. Read Progress.md if it exists — it is the canonical state-of-record and may document decisions or exceptions that override what CLAUDE.md says in isolation.
3. Map the solution structure: list every .NET project (.csproj) and its project references, and the frontend app's top-level src/ layout and package.json.

Do not begin Phase 1 until this map is built. If $ARGUMENTS narrows the scope (backend, frontend, or a specific project name), restrict Phases 2–4 to that scope, but still read all CLAUDE.md files, since solution-wide rules can apply to a scoped project too.
</phase>

<phase number="1" name="extract_the_rulebook">
Build an explicit, numbered checklist of every restriction, boundary, and design rule stated across the CLAUDE.md file(s), grouped by scope: Solution-wide, Backend, Frontend, Cross-cutting (messaging conventions, naming, folder structure, dependency direction, testing requirements, and similar).

For each rule, record: the exact source wording, which file it came from, and which project(s) it applies to. This checklist becomes the Rulebook Summary in the final report — every rule in it must get a verdict later. Don't silently drop one because it turned out to be hard to check.
</phase>

<phase number="2" name="technical_boundaries">
For each in-scope .NET project, verify against the rulebook:
- Project reference direction (e.g., does Domain reference Infrastructure when the rule says it shouldn't; does anything bypass the message bus to call a handler directly).
- Namespace and folder structure against whatever convention CLAUDE.md specifies.
- Any stated boundary around messaging, persistence, or cross-module calls.

For the frontend, verify:
- src/ structure and feature-folder conventions against what's documented.
- Typing rules (e.g., no `any`, strict mode) — check actual tsconfig and a representative sample of files, not just one.
- API client and state-management layering if CLAUDE.md draws a boundary there.

Open the actual files. A grep match on a filename is not confirmation that the boundary holds — read enough of the file to see whether the rule is actually respected.
</phase>

<phase number="3" name="design_conformance">
For each design pattern CLAUDE.md mandates (e.g., handlers over direct calls, a specific persistence approach, a specific validation or resilience pattern, a frontend component convention), check its usage broadly across the codebase, not in one example file.

For every place the design is not followed, look for a documented reason — a code comment, an ADR, or a Progress.md entry explaining the deviation — before deciding it's undocumented. An assumption that "there's probably a reason" does not count as documentation; the reason has to be written down somewhere you can cite.
</phase>

<phase number="4" name="verdict_and_synthesis">
Assign every rule from the Phase 1 checklist exactly one verdict:

- **COMPLIANT** — implementation matches the rule, evidence cited.
- **EXCEPTION DOCUMENTED** — implementation deviates, but a written rationale exists somewhere in the repo or Progress.md. Cite the rationale, not just the deviation.
- **GAP** — implementation deviates or is missing, with no documented rationale found.
- **UNVERIFIABLE** — the rule's wording or target is too ambiguous to check confidently. State what's ambiguous.
- **NOT APPLICABLE** — the rule targets a feature or area that doesn't exist yet in the current codebase.

Every rule listed in the Rulebook Summary must appear in the Findings section with one of these verdicts.
</phase>

</workflow>

<examples>
<example>
<input>CLAUDE.md rule: "Handlers are invoked only through the message bus; no module calls another module's handler method directly."</input>
<output>
**Rule 7 (Cross-cutting)** — COMPLIANT
`PredictionService` in `src/Backend/Predictions/PredictionSubmissionHandler.cs:34` publishes `SubmitPredictionCommand` via `IMessageBus.InvokeAsync`. Checked the three other modules that reference prediction submission (`Leagues`, `Scoring`, `Notifications`) — all go through the bus, none call the handler class directly.
</output>
</example>

<example>
<input>CLAUDE.md rule: "API controllers do not access EF Core / Npgsql directly; all persistence goes through a repository or Marten session."</input>
<output>
**Rule 12 (Backend)** — EXCEPTION DOCUMENTED
`LegacyStandingsController.cs:58` calls `_dbContext.Standings.FromSqlRaw(...)` directly, which violates the rule as stated. A comment at line 52 and a matching note in Progress.md (dated 2026-05-14, "Standings raw SQL kept for migration performance, remove after Azure cutover") document the reason. Classified as an exception, not a gap, but it's worth flagging as a candidate for cleanup once the Azure migration lands.
</output>
</example>

<example>
<input>CLAUDE.md rule: "Frontend code does not use the `any` type."</input>
<output>
**Rule 4 (Frontend)** — GAP
`tsconfig.json` has `strict: true` and `noImplicitAny: true`, but three files use explicit `any`: `src/hooks/useLeagueData.ts:22`, `src/components/PredictionGrid.tsx:88`, and `src/api/client.ts:41`. No comment, ADR, or Progress.md entry explains any of the three. No exception found — this is a straightforward gap against a clearly stated rule.
</output>
</example>

<example>
<input>CLAUDE.md rule: "Keep controllers thin."</input>
<output>
**Rule 9 (Backend)** — UNVERIFIABLE
"Thin" isn't given a threshold anywhere in CLAUDE.md or Progress.md — no line count, no stated responsibility boundary beyond the general phrase. Several controllers run 80–150 lines with a mix of validation and orchestration logic; whether that counts as a violation depends on a definition that isn't written down. Flagging this as an open question rather than guessing a threshold and grading against it.
</output>
</example>

<example>
<input>CLAUDE.md rule: "Authentication goes through Entra ID; no other auth provider is used."</input>
<output>
**Rule 15 (Cross-cutting)** — NOT APPLICABLE
Entra ID integration doesn't exist in the codebase yet — there's no auth middleware or provider configuration at all currently. This matches the roadmap item to add it later; nothing to check against yet.
</output>
</example>
</examples>

<output_format>
Produce a single markdown report with these sections, in this order:

1. **Rulebook Summary** — a table: Rule # | Scope | One-line rule | Source file.
2. **Findings** — grouped by scope (Solution-wide, Backend, Frontend, Cross-cutting). Each finding: rule number, verdict, and the evidence citation(s). Use the depth and format shown in the worked examples above — cite specific files and lines, keep the explanation to what's needed to support the verdict.
3. **Hard Gaps** — every rule with a GAP verdict, pulled together in priority order (rules with the broadest blast radius first). This is the section meant for direct action.
4. **Open Questions** — include only if any UNVERIFIABLE verdicts exist. For each, state the ambiguity and, where you have one, a recommended interpretation.
5. **Suggested Gap Tickets** — include only if Hard Gaps is non-empty. One block per gap, formatted for direct copy-paste: Summary / Description / Acceptance Criteria. Do not create these in Jira — this is a suggestion for review, not an action taken.

Write findings in plain prose sentences rather than compressed fragments — this report gets read and acted on later, possibly by someone who didn't run the audit.
</output_format>

<task>
Run this audit now against scope: $ARGUMENTS (default to the full solution if no scope is given).
</task>
