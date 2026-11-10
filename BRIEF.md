# Halloween DataViz Contest 2026 — "What Keeps You Up at Night?"

Source post: https://community.fabric.microsoft.com/blog/community_blog/turn-your-fears-into-data-join-our-halloween-data-visualization-contest/5374146
Contest site (countdown, downloads, rules, judging, accessibility tabs): https://plain-root-2ad8706c06-westeurope.webapp.fabricapps.net/#contest

## From the contest site (checked 2026-10-17)
- Deadline: Wednesday, October 21, midnight Pacific = Thursday, October 22, 1:00 PM in Dhaka.
- Submission checklist: .pbix only; one visible A4 page, landscape or portrait; extra pages only as tooltip pages; provided dataset only; meets the accessibility standards; uploaded to the Contests Gallery before the deadline.
- Rules allow: measures and derived metrics, transforming and modelling, custom visuals, images, icons, flags, themes and AI-assisted design tools. Not allowed: modifying source values, external datasets or APIs, fabricated or scraped data.
- Poster must work with no clicks or hovering; tooltip pages are optional extras.
- Judging: Insightfulness, Storytelling, Visual effectiveness, Creativity, Accessibility. All five count.
- Accessibility (WCAG 2.2 AA): text contrast 4.5:1 (large text 3:1), chart elements 3:1, no colour-only meaning; tab order follows the story with decorative shapes and images left out; alt text describes the insight, not the chart type.
- Site is built by Karin Szilágyi; questions via her LinkedIn.
Contest site: https://plain-root-2ad8706c06-westeurope.webapp.fabricapps.net/#contest

## Deadline
- Submissions close: **Wed Oct 21, 2026, midnight Pacific** (Thu Oct 22, 07:00 UTC)
- Winner announced: Oct 31, 2026
- Dates may change; re-check the blog post.

## Deliverable
- Power BI **.pbix** only
- **One visible A4 page** (landscape or portrait). Extra pages only as tooltip pages.
- Must meet **WCAG 2.2 AA** accessibility.
- Upload to the Contests Gallery:
  https://community.fabric.microsoft.com/category/pbi_comm_galleries/discussions/pbi_contestsgallery

## Judging
Insightfulness, storytelling, visual effectiveness, creativity, accessibility.
Judges: Aanor Le Gouic, Karin Szilágyi, Marjolein Opsteegh.
The poster must stand alone — judges score what is visible without tooltips.

## Rules
Allowed: measures/derived metrics, transforming and modeling data, custom visuals and themes, any narrative grounded in the data.
Not allowed: modifying source values, adding external data or APIs, fabricating or scraping data.

## Accessibility checklist
- Text contrast >= 4.5:1 (large text 3:1); chart elements >= 3:1; never rely on colour alone.
- Tab order follows the story; exclude decorative elements (View > Selection > Tab order).
- Alt text describes the insight, not the chart type (Format > General > Alt text).

## Files (download into ./data)
- Starter pbix: https://pgstoragekarin.blob.core.windows.net/contests/halloween2026/Halloween%20Contest%202026%20-%20Starter%20File.pbix
- Raw CSV:     https://pgstoragekarin.blob.core.windows.net/contests/halloween2026/survey_responses.csv

## Data schema (survey_responses.csv, ~105 rows, 30+ countries)
| Column | Type | Notes |
|---|---|---|
| ResponseKey | int | 1..105 |
| ageGroup | text | e.g. 25–34, 35–44, 45–54, 55–64 |
| childhoodFearsJson | JSON array of strings | 1–3 fears |
| countryChildhood | text | |
| countryNow | text | compare with countryChildhood for migration |
| currentFearsJson | JSON array of strings | 1–3 fears |
| dataNightmare | text | single choice, e.g. "It arrives a mess (missing values, duplicates...)" |
| fabricToolsJson | JSON array of strings | 1–17 Fabric workloads, or "None yet" |
| gender | text | |
| submittedAt | datetime | 2026-09-27 onward |

Fear vocabulary (union of both fear columns), grouped:
- Animals: Spiders, Snakes, Bats, Dogs, Bees/wasps, Sharks, Rats/mice, Birds, Insects/bugs in general
- Places/situations: Heights, Basements/Attics, Elevators, Tunnels, Cemeteries, Deep/open water, Drowning, Open/empty spaces, Abandoned buildings, Bridges, Crowded spaces, Being trapped/small spaces, The dark, Getting lost, The unknown/unfamiliar, Thunderstorms/lightning, Natural disasters generally, Fire, Flying, Choking
- Medical/body: Blood, Needles/shots, Doctors/hospitals, Dentists, Cancer or another serious diagnosis, Getting sick/illness, Losing a limb or developing a disability, Germs/contamination
- Supernatural/fiction: Ghosts, Demons/the devil, Aliens, Zombies, Monsters under the bed, Clowns, Dolls/mannequins, Being watched, Intruders/home invasion
- Death/loss: Death (own or loved one's), Pets dying, Abandonment, Separation from friends or family, Divorce/breakup, Being forgotten, Being alone/Loneliness
- Social: Being laughed at, Being judged, Being disliked, Rejection, Embarrassment, Public speaking, Conflict/confrontation, Not being good enough
- Life/work/future: Failing at work/school, Missing deadlines, Job loss, Wasting one's life/potential, Financial insecurity/poverty, Uncertainty about the future, Commitment
- Global: Radioactivity/nuclear disaster, War
- Non-answers: Something else, Prefer not to answer, None of these

## Candidate story angles (to validate against the data)
1. **Childhood -> adult fear migration**: concrete/external fears (dark, spiders, monsters) give way to abstract/internal ones (not good enough, wasting potential, financial insecurity). Sankey/flow or paired slope chart by category.
2. **Fears that never leave**: which childhood fears persist into adulthood for the same respondent, and which are outgrown.
3. **Data nightmares vs personal fears**: does the person afraid of "the unknown" also fear "data that doesn't add up"? Likely too thin at n=105, but a fun side panel.
4. **Fear by age group**: does the "abstract fear" shift intensify with age?
