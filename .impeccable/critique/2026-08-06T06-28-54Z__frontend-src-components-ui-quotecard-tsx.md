# Critique — QuoteCard.tsx (checklist 3.3)

Target: `frontend/src/components/ui/QuoteCard.tsx` + caller `JoinWaitStep.tsx`

Question: is `quoteKicker` ("Terwijl je wacht"/"While you wait", rendered above the
rotating quote-of-the-day text) a banned kicker-over-heading in disguise, or a
legitimate distinct label?

## Assessment A (Nielsen heuristics)
Verdict: **(b) legitimate.** The kicker answers "why is this card here" (filling wait
time), the quote answers "what does it say" — different subjects, not a restated
identity. Same category as this session's already-accepted phase badges/stat labels.
Heuristics: 4/5 (status), 4/5 (real-world match), 5/5 (consistency), 5/5
(recognition-over-recall), 4/5 (aesthetic) — no blocking findings.

## Assessment B (detector + craft-floor)
Detector: `[]`, no automated findings (kicker ban is manual, not ruleset-covered).
Manual: no heading exists below the kicker at all — just quote text + attribution.
"While you wait" doesn't restate or amplify the quote; deleting it would leave an
unexplained rotating quote with no framing. Verdict: **not the banned pattern.**

## Verdict
No change. `quoteKicker` stays as-is.
