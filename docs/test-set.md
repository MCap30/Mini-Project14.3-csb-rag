# Test set and results: Ask CSB

**Date:** Oct 11, 2026
**Target:** live deployment, https://mini-project14-3-csb-rag.vercel.app
**Method:** `scripts/run-tests.mjs` sent 13 questions to `/api/chat`, each twice (26 runs). Every factual claim in every answer was checked against the text of the cited chunks in `data/chunks.jsonl` (the exact text the bot retrieves), with spot-checks against PDF excerpts (Dow Executive Summary and 2.4, Geismar 2.5.2 and 4.4.2).
**Configuration:** no summary penalty, topK 8 (10 when no incident filter), `MIN_SCORE` 0.3, answers capped at 1,500 output tokens.

**Scoring**
- **Pass:** every checked claim is supported by the cited passages, and the expected sections were retrieved.
- **Partial:** content is grounded, but one claim is unsupported or the framing is misleading.
- **Fail:** a required item is missing, or another incident's findings are substituted.

## Summary

| Result (worst of two runs) | Questions |
|---|---|
| Pass | 9 of 13 (Q1-Q6, Q9, Q11, Q13) |
| Partial | 2 (Q8, Q10) |
| Fail | 2 (Q7, Q12) |

By run: 20 pass, 3 partial, 3 fail out of 26.

## Results by question

| # | Type | Question | Expected answer (source) | Run 1 | Run 2 |
|---|---|---|---|---|---|
| Q1 | Single | How did the workers end up opening the wrong flange at PEMEX? | Blind list and drawing ineffective; workers used blind tags and flange-locking devices; Blind 407 tag hung on a railing out of sight; unlocked device on ARU7 flange; identical piping 5 ft apart; no operator present; no standard marking process (PEMEX 2.4, 3.1, 4.1) | Pass | Pass |
| Q2 | Single | What caused the furnace explosion at Shell Polymers Monaca? | Both motor-operated valves opened at once, giving a backflow path into the firebox; contributing: PACO engineer with limited process knowledge, administrative controls, HMI showing three valves on one diagram; ignition about 6 minutes after the open command (Monaca 4.2, 2.4, 2.5) | Pass | Pass |
| Q3 | Single | What did the CSB recommend to Shell Polymers? | R1: review PHA for admin-only controls; R2: engineered control against cracked-gas backflow; no recommendation on Shell's corrective actions but urges full implementation; coke traps cleaned per Linde (Monaca 5) | Pass | Pass |
| Q4 | Single | What mechanical integrity problems did the CSB find in the 2023 Honeywell reboiler explosion? | Oct 2021 inspection showed under one year of life, not documented in SAP/DMAPS or communicated beyond one maintenance engineer who left in Apr 2022; no fitness-for-service evaluation; shell as thin as 0.030 in (about 95% loss vs Tmin 0.156 in) (Geismar 3.3.1) | Pass | Pass |
| Q5 | Single | Why was Reactor 6's relief system inadequate at Givaudan? | Functioned as designed but undersized; 4-in rupture disc plus 4M6 relief valve; at least 16.74 sq in needed; 6R10 with 6-in disc and 10-in line, or the disc alone; based on Reactor 2 with no design documentation; 2012 reactivity results not considered (Givaudan 3.4, 1.8.3) | Pass (calls the valve "4-inch"; it is a 4M6, 4-in inlet and 6-in outlet) | Pass |
| Q6 | Single | What was the means-of-egress problem in the Wacker incident? | Single staircase; PHA of Aug 11, 2020 flagged it; structure treated as an unoccupiable equipment platform under IBC; code gap; three workers climbed down about 70 ft, one died (Wacker 4.4, 5.1) | Pass | Pass |
| Q7 | Cross | Which incidents involved problems with pressure relief systems? | Dow (relief piping not inerted, discharge to reflux drum) and Givaudan (undersized). Geismar's only mention is BLEVE background; Monaca none (Dow 4.3, 5.1; Givaudan 3.4) | **Fail** | Pass |
| Q8 | Cross | What do the PEMEX and Wacker incidents have in common? | Contractor maintenance on live hazardous equipment; weak permitting and procedures; nearby workers exposed (PEMEX 3.2-3.3; Wacker 4.1-4.3, 5.1) | Pass | **Partial** |
| Q9 | Cross | Which of the reports made recommendations to OSHA? | Givaudan 6.2 (reiterated, reactive hazards), Geismar 8.2 (reiterated, MOC for organizational change), Wacker 6.2.1 (SIMOPs). None in PEMEX, Monaca, Dow | Pass | Pass |
| Q10 | Out of scope | Has PEMEX closed the CSB's recommendations yet? | Reports give no closure status; PEMEX 5 lists R1-R3 to PEMEX and R4 to ASME | **Partial** | **Partial** |
| Q11 | Out of scope | What's the best way to size a pressure relief valve? | Decline; no general engineering knowledge | Pass | Pass (sentence duplicated) |
| Q12 | Out of scope | What did the CSB conclude about the Evergreen Packaging incident? | Evergreen has no report here; Wacker 4.3.2.3 lists it as an earlier SIMOPs incident (Sept 21, 2020 hot-work fire), and Wacker 6.1.1 supersedes its OSHA recommendation. Should say that, not substitute | **Fail** | **Fail** |
| Q13 | Greeting | Hi, what can you help me with? | Describe scope; no search | Pass | Pass |

## Failures and partials

**Q7, run 1 (Fail): skipped the strongest case.** The model searched only PEMEX, Givaudan and Wacker, never Dow. The corpus has 23 Dow chunks about relief systems (against 40 for Givaudan, 2 for PEMEX, 2 for Wacker, 0 for Monaca). The answer then said Dow "was not returned", which is true only because it was never searched. Run 2 searched all six incidents and was correct, so the same question gave different results. Cause: the model chooses which incidents to search.

**Q12, both runs (Fail): substituted other incidents.**
- Run 1 answered with Givaudan's findings ("if you mean the Louisville caramel coloring incident") and said it "could not find that name in the six reports". That is wrong: the name appears in the Wacker report.
- Run 2 set the incident filter to `dow` and answered with Dow's conclusions, with no caveat.
- Retrieval also failed: the top results for run 1 were Givaudan chunks (0.57 and lower), and the Wacker chunk holding the Evergreen row (4.3.2.3) did not appear. Embeddings match topics, not exact names, so a named-entity lookup needs keyword matching.

**Q8, run 2 (Partial).** The opening sentence says both incidents involved workers "working on the wrong or incorrectly specified equipment". At Wacker the workers over-torqued bolts on the correct flange. The rest of the answer is supported.

**Q10, both runs (Partial).** Both answers begin with "No." and then explain that the report does not give a status. The content is grounded (R1-R3 and R4, signs and feather flag, the note that no recommendation was issued on positive equipment identification), but opening with "No" reads as a claim that the recommendations are still open.

**Minor.** Q11 run 2 repeated its refusal twice in one answer (the two halves differ in wording, so the model produced both). Q5 run 1 calls the relief valve "4-inch".

## Observations

- **Run-to-run variation is real.** Q7 changed from 3 searches to 6 and from fail to pass. Q11 searched once in one run and not at all in the other. Single-incident questions were stable.
- **Facts and numbers were accurate.** All numbers checked (31,000 and 31,525 lb, 0.030 in, 16.74 sq in, 70 ft, 18 minutes, 6 minutes) matched the chunks.
- **The score cutoff separates only off-topic queries.** Q11's searched run scored 0.30-0.33; in-scope queries mostly scored 0.5-0.8. Q12 (Evergreen) scored 0.45-0.57 and the out-of-scope OSHA-fine question scored 0.73, so `MIN_SCORE` cannot catch unanswerable questions that share a topic with the corpus. Refusals come from the system prompt.
- **Single-incident questions were the strongest.** In all 12 runs of Q1-Q6, the expected section was among the top 8 chunks, and in every one the model set the incident filter correctly.
- **Grounding held under the plain-language persona.** Q11 and Q13 showed no general-knowledge answers.

## Planned changes (not yet applied or retested)

1. Rule for "which incidents or reports" questions: search all six, once each, with the incident filter.
2. Rule for subjects outside the six: say so; never answer with another incident's findings; do not use the incident filter; if passages in another report mention the subject, describe only what they say.
3. Rule against opening with "Yes" or "No" unless the passages answer the yes/no question; for status after publication, open with "The reports don't say."

After applying them, rerun `node scripts/run-tests.mjs https://mini-project14-3-csb-rag.vercel.app 2` and compare against this table.
