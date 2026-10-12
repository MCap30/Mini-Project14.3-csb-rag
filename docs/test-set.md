# Test set and results: Ask CSB

**Dates:** Oct 11-12, 2026
**Target:** baselines and the post-5f check against the live deployment, https://mini-project14-3-csb-rag.vercel.app; retests against `http://localhost:3000`
**Method:** `scripts/run-tests.mjs` sent 13 questions to `/api/chat`, each twice per session, in two sessions about ten hours apart (`test-run-baseline.json`, `test-run-baseline-2.json`): 4 runs per question, 52 runs in total. Every factual claim in every answer was checked against the text of the cited chunks in `data/chunks.jsonl` (the exact text the bot retrieves), with spot-checks against PDF excerpts (Dow Executive Summary and 2.4, Geismar 2.5.2 and 4.4.2).
**Configuration:** no summary penalty, topK 8 (10 when no incident filter), `MIN_SCORE` 0.3, answers capped at 1,500 output tokens.

**Scoring**
- **Pass (P):** every checked claim is supported by the cited passages, and the expected sections were retrieved.
- **Partial (Pt):** content is grounded, but one claim is unsupported or the framing is misleading.
- **Fail (F):** a required item is missing, general advice replaces a refusal, or another incident's findings are substituted.

## Summary

| Result across the 4 runs of each question | Questions |
|---|---|
| Stable pass, 4 of 4 (7) | Q1-Q6 (single-incident), Q13 (greeting) |
| Mostly pass, one miss (3) | Q7 (3 of 4), Q8 (3 of 4; one partial), Q9 (3 of 4) |
| Mixed (1) | Q11: 2 pass, 1 partial, 1 fail |
| Consistently weak (2) | Q10 (partial in 4 of 4), Q12 (fail in 3 of 4, partial in 1) |

By run: 39 pass, 7 partial, 6 fail out of 52.

**Retest after prompt rules 5c-5f (26 answers, local):** 23 pass, 2 partial, 1 fail.
**Live site after 5c-5f deployed (26 answers):** 22 pass, 1 partial, 3 fail (Q9 run 1; Q12 both runs, which substituted other incidents' findings).
**Final local run with rule 5g (39 answers, 3 per question):** 34 pass, 4 partial, 1 fail (Q9 run 2 listed PEMEX as recommending to OSHA). Q12 no longer substituted findings in any run.
With two or three runs per question, treat these as indications, not proof.

## Results by question

Columns A1/A2 are baseline 1 (live site), B1/B2 baseline 2 (live site), C1/C2 the retest after prompt rules 5c-5f (local), D1/D2 the live site after 5c-5f were deployed, and E1-E3 the final local run after adding rule 5g (3 runs per question). P = pass, Pt = partial, F = fail.

| # | Type | Question | Expected answer (source) | A1 | A2 | B1 | B2 | C1 | C2 | D1 | D2 | E1 | E2 | E3 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Q1 | Single | How did the workers end up opening the wrong flange at PEMEX? | Blind list and drawing ineffective; workers used blind tags and flange-locking devices; Blind 407 tag out of sight; unlocked device on ARU7; identical piping 5 ft apart; no operator present; no standard marking process (PEMEX 2.4, 3.1, 4.1) | P | P | P | P | P | P | P | P | P | P | P |
| Q2 | Single | What caused the furnace explosion at Shell Polymers Monaca? | Both motor-operated valves opened at once, backflow into the firebox; contributing: PACO engineer, administrative controls, HMI; ignition about 6 minutes after the open command (Monaca 4.2, 2.4, 2.5) | P | P | P | P | P | P | P | P | P | P | P |
| Q3 | Single | What did the CSB recommend to Shell Polymers? | R1: PHA review for admin-only controls; R2: engineered control against backflow; no recommendation on Shell's corrective actions but urges follow-through; coke traps per Linde (Monaca 5) | P | P | P | P | P | P | P | P | P | P | P |
| Q4 | Single | What mechanical integrity problems did the CSB find in the 2023 Honeywell reboiler explosion? | Oct 2021 inspection under one year of life, not documented in SAP/DMAPS or communicated beyond one engineer who left; no fitness-for-service evaluation; 0.030 in, about 95% loss vs Tmin 0.156 in (Geismar 3.3.1) | P | P | P | P | P | P | P | P | P | P | P |
| Q5 | Single | Why was Reactor 6's relief system inadequate at Givaudan? | Functioned as designed but undersized; 4-in disc plus 4M6 valve; at least 16.74 sq in; based on Reactor 2 with no design documentation (Givaudan 3.4, 1.8.3) | P | P | P | P | P | Pt | P | P | P | P | P |
| Q6 | Single | What was the means-of-egress problem in the Wacker incident? | Single staircase; PHA of Aug 11, 2020 flagged it; structure treated as an equipment platform under IBC; code gap; workers climbed down about 70 ft, one died (Wacker 4.4, 5.1) | P | P | P | P | P | P | P | P | P | P | P |
| Q7 | Cross | Which incidents involved problems with pressure relief systems? | Dow and Givaudan. Geismar only mentions BLEVE background; Monaca none (Dow 4.3, 5.1; Givaudan 3.4) | F | P | P | P | P | P | Pt | P | Pt | P | P |
| Q8 | Cross | What do the PEMEX and Wacker incidents have in common? | Contractor maintenance on live equipment; weak permitting and procedures; nearby workers exposed | P | Pt | P | P | P | P | P | P | P | P | P |
| Q9 | Cross | Which of the reports made recommendations to OSHA? | Givaudan 6.2, Geismar 8.2, Wacker 6.2.1. None in PEMEX, Monaca, Dow | P | P | F | P | F | P | F | P | Pt | F | P |
| Q10 | Out of scope | Has PEMEX closed the CSB's recommendations yet? | Reports give no closure status; PEMEX 5 lists R1-R3 to PEMEX and R4 to ASME | Pt | Pt | Pt | Pt | P | P | P | P | P | P | P |
| Q11 | Out of scope | What's the best way to size a pressure relief valve? | Decline; no general engineering knowledge | P | P | Pt | F | P | P | P | P | P | P | P |
| Q12 | Out of scope | What did the CSB conclude about the Evergreen Packaging incident? | No Evergreen report here; Wacker 4.3.2.3 lists it as a SIMOPs incident (Sept 21, 2020) and 6.1.1 supersedes its OSHA recommendation | F | F | F | Pt | Pt | P | F | F | Pt | P | Pt |
| Q13 | Greeting | Hi, what can you help me with? | Describe scope; no search | P | P | P | P | P | P | P | P | P | P | P |

## Failures and partials

**Q7, run 1 (Fail): skipped the strongest case.** The model searched only PEMEX, Givaudan and Wacker, never Dow. The corpus has 23 Dow chunks about relief systems (against 40 for Givaudan, 2 for PEMEX, 2 for Wacker, 0 for Monaca). The answer then said Dow "was not returned", which is true only because it was never searched. The other three runs searched all six incidents, or searched without a filter, and were correct.

**Q9, run 3 (Fail): searched two of six incidents, then generalized.** It searched only PEMEX and Monaca, found no OSHA recommendations, and said "the other reports in this set follow the same pattern", concluding that none of the reports recommended anything to OSHA (the sentence even contradicts itself: "only one of the six reports ... none of them"). Three reports do (Givaudan, Geismar, Wacker). Same root cause as Q7: the model decides how many incidents to search.

**Q11, run 4 (Fail): general advice instead of a refusal.** It searched (score 0.56, above `MIN_SCORE`), then gave "the best practice" for sizing a relief valve and a three-step recipe ("define the credible upsets, calculate the required relief capacity, then size the valve and piping"). The facts it quoted from Givaudan 3.3 are real (the ASME owner/operator quote, 16.74 sq in), but the how-to conclusion is not in the reports. This is the plain-language persona pulling toward general engineering advice.

**Q12, runs 1-3 (Fail), run 4 (Partial): substituted other incidents.**
- Run 1 answered with Givaudan's findings and said it "could not find that name in the six reports", which is wrong: the name appears in the Wacker report.
- Runs 2 and 3 set the incident filter to `dow` and answered with Dow's conclusions, with no caveat.
- Run 4 said Evergreen is "not covered in the six reports I searched" (it searched only Dow), then summarized Dow anyway.
- Retrieval also failed: the Wacker chunk holding the Evergreen row (4.3.2.3) never appeared in any run. Embeddings match topics, not exact names, so a named-entity lookup needs keyword matching.

**Q8, run 2 (Partial).** The opening sentence says both incidents involved workers "working on the wrong or incorrectly specified equipment". At Wacker the workers over-torqued bolts on the correct flange. The other three runs were accurate.

**Q10, all four runs (Partial).** Every answer begins with "No." and then explains that the report does not give a status. The content is grounded (R1-R3 and R4, signs and feather flag, the note that no recommendation was issued on positive equipment identification), but opening with "No" reads as a claim that the recommendations are still open.

**Minor.**
- Q11: in both runs that skipped the search (runs 2 and 3), the refusal text was repeated twice in one answer (the two halves differ in wording, so the model produced both). One of them also ended with an offer, against the system prompt.
- Q5 run 1 calls the relief valve "4-inch" (it is a 4M6).
- Q1 run 4 says the workers used markers "from a different turnaround"; the report says the devices and tags were required during turnarounds.

## Observations

- **Run-to-run variation is the main weakness.** Q7 and Q9 each failed once in four runs because the model searched too few incidents. Q9 searched 2 incidents in one run and 6 in another. Single-incident questions (Q1-Q6) passed in all 24 runs.
- **Facts and numbers were accurate.** All numbers checked (31,000 and 31,525 lb, 0.030 in, 16.74 sq in, 70 ft, 18 minutes, 6 minutes, 15 evacuated, $95 million) matched the chunks.
- **The score cutoff separates only off-topic queries.** In the one Q11 run where the cutoff mattered, scores were 0.30-0.33; in-scope queries mostly scored 0.5-0.8. But Q11 run 4 scored 0.56, Q12 scored 0.45-0.57, and the out-of-scope OSHA-fine question scored 0.73, so `MIN_SCORE` cannot catch unanswerable questions that share a topic with the corpus. Refusals come from the system prompt.
- **Grounding mostly held under the plain-language persona**, with the Q11 run 4 exception.

## Changes applied after the baselines

Four rules were added to the system prompt in `app/api/chat/route.ts`:

1. **5c:** for "which incidents or reports" questions, search all six incidents, once each, with the incident filter.
2. **5d:** for subjects outside the six, say so; never answer with another incident's findings; do not use the incident filter.
3. **5e:** do not open with "Yes" or "No" unless the passages answer the yes/no question; for status after publication, open with "The reports don't say".
4. **5f:** do not give general engineering advice, design methods or best-practice steps; do not search for such questions.

## Retest

Same 13 questions, 2 runs each, `node scripts/run-tests.mjs http://localhost:3000 2` (Oct 11, 19:38 UTC).

**What improved**
- **Q7 and Q9 now search all six incidents in every run** (baseline 2 had one run that searched one unfiltered query and one that searched only two incidents). Q7 passed twice.
- **Q10 passes twice.** Both answers now open with "The reports don't say", and the second is one short paragraph.
- **Q11 passes twice.** No search, no general advice, no duplicated text.
- **Q12 no longer substitutes another incident's findings.** Neither run searched or used the incident filter.
- Single-incident answers stayed accurate (Q1-Q6 passed in 11 of 12 runs; the one partial is below), and the greeting still skipped the search.

**What failed or is still weak**
- **Q9 run 1 (Fail): searched all six, then got PEMEX wrong.** It said four of six reports made recommendations to OSHA and listed PEMEX Deer Park, citing `pemex-049`. That chunk lists recommendations to PEMEX Deer Park and ASME, with no mention of OSHA (the correct answer is Givaudan, Geismar and Wacker). Run 2 was correct. So Q9 is still intermittent: the fix gets the right searches, but the answer can still be misread.
- **Q5 run 2 (Partial): one unsupported detail.** It says Reactor 6 ended up "with the same 4.186-square-inch relief valve size used on Reactor 2". The reports give 4.186 sq in as the original size of the relief valves on Reactors 3 and 4 (replaced in 2013) and as Reactor 6's own valve; Reactor 2's valve size isn't stated. The cited `givaudan-063` doesn't contain the figure.
- **Q12 (run 1 Partial, run 2 Pass): the refusal is made without checking.** Both runs skipped the search. Run 2 correctly says Evergreen Packaging is not one of the six reports. Run 1 says it "could not find an Evergreen Packaging incident in the six CSB reports", which is wrong, because the Wacker report lists it as an earlier SIMOPs incident (§4.3.2.3) and supersedes its OSHA recommendation (§6.1.1). No search means that mention is never found.
- **Offers at the end.** Q11 run 1 and both Q12 runs end with "If you want, I can...", against rule 7.

## Rule 5g and a reverted experiment

The live check after 5c-5f showed Q12 substituting Dow and PEMEX findings, so rule 5g was added: for a name outside the six, say it is not one of the reports and never answer with another report's findings. Final local run: no substitution in 3 of 3 runs, but Q12 run 1 repeated its sentence twice and run 3 framed a Wacker mention as "the CSB concluded". The live site after the 5g deploy gave a clean answer on a fresh chat. (An earlier live attempt in a chat that began with a pasted commit message was contaminated and is not counted.)

A rewrite of 5g meant to stop the duplicate text (no text before the search, give a count first for list questions) was tested and **reverted**: Q12 substituted Dow or Givaudan findings in 2 of 3 runs, and Q9 miscounted in one run and listed PEMEX in another. Dropping the first-sentence anchor and forcing an early count both made answers worse. The deployed prompt is the earlier 5g.

## Known limitations from testing

- **Run-to-run variation remains.** The same question can search different incidents or word its answer differently. Two runs per question cannot show how often a failure happens.
- **Retrieval matches topics, not exact names.** A name that appears once in the corpus (Evergreen) is not reliably retrieved. A hybrid keyword plus embedding search is the obvious next step.
- **Refusals are prompt-driven.** The score cutoff does not separate answerable from unanswerable questions in the same topic area.
- **Cross-report questions are the weakest category.** Forcing one search per incident fixed coverage but not reading errors; Q9 still listed PEMEX as an OSHA recommender in one of 7 runs after the fix, and Q7 once opened with a wrong list that its conclusion contradicted.
- **Prompt rules trade one failure for another.** Each rule fixed its target but a reworded rule regressed Q12 and Q9, which is why the final prompt was frozen at the last version that tested well.
- **Grading used the same chunk text the bot sees.** If the PDF-to-text step dropped content, this test would not catch it.

## Next steps

1. Add a hybrid keyword score to retrieval so exact names (Evergreen, Blind 407) match.
2. For cross-report questions, have the tool return the matched section heading with each passage, and tell the model to name the recipient of each recommendation before concluding.
3. Load the 13 questions and reference answers into an evaluation harness (for example LangSmith) with a judge for groundedness and a check that the expected section was retrieved.
4. Add rate limiting on `/api/chat`.
