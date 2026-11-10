# Build plan — "The Monsters Grew Up"

One A4 landscape poster (starter page "Report Page Landscape", 1920 x 1357 px).
Deadline: Wed Oct 21 2026, midnight Pacific. Full rules in BRIEF.md. Numbers below come from analysis_output.txt.

---

## 1. The story (what the poster says)

**Headline:** The monsters grew up. As children we feared things we could point at. As adults we fear things we can't.

**Evidence, in the order the eye should meet it:**

| Claim | Number |
|---|---|
| Childhood fear mentions that are tangible (animals, places, medical, supernatural) | 70% (200 of 285) |
| Adult fear mentions that are tangible | 41% (103 of 253) |
| Respondents who kept at least one childhood fear | 45 of 105 |
| Children afraid of the dark who still are | 0 of 11 |
| Children afraid of demons / the devil who still are | 0 of 9 |
| Children afraid of basements / attics who still are | 0 of 8 |
| Children afraid of war who still are | 5 of 5 (100%) |
| Adults naming war today | 20 (19 + one "Something else: War") |
| Adults naming financial insecurity today | 11, versus 0 as children |
| Adults naming uncertainty about the future | 14, versus 4 as children |

**Top 5 then vs now**

| Childhood | n | Today | n |
|---|---|---|---|
| Being trapped / small spaces | 14 | War | 20 |
| Heights | 13 | Uncertainty about the future | 14 |
| Snakes | 11 | Death (own or loved one's) | 12 |
| The dark | 11 | Financial insecurity / poverty | 11 |
| Death / Demons / Dentists / Being disliked | 9 each | Wasting one's potential / Not being good enough | 10 each |

**The twist (keeps it from being one-note):** a few fears never leave. Snakes are kept by 55% of those who had them and are still a top-10 adult fear. Being trapped is kept by 36%. War is kept by everyone who had it as a child.

**Category shift (mentions, childhood -> today)**

| Category | Childhood | Today |
|---|---|---|
| Places & situations | 95 | 41 |
| Animals | 44 | 32 |
| Social | 42 | 39 |
| Supernatural & intruders | 39 | 9 |
| Death & loss | 24 | 39 |
| Medical & body | 22 | 21 |
| Global threats | 10 | 28 |
| Life, work & future | 9 | 44 |

**Honesty notes to print in the footer:** n = 105 self-selected data professionals from 28 countries, most aged 25 to 44, 62 men / 41 women. Each person picked up to 3 fears per life stage. "Kept" means the same person chose the same fear for both stages. Categories are the author's grouping of the 75 survey options.

---

## 2. Layout (A4 landscape, 1920 x 1357)

```
+------------------------------------------------------------------------------------+
| THE MONSTERS GREW UP                                           n=105 | 28 countries|
| As kids we feared what we could see. As adults we fear what we can't.               |
+-----------------------------+------------------------------------------------------+
|  70% -> 41%                 |  WHAT WE OUTGREW            WHAT CREPT IN             |
|  share of fears you can     |  The dark        0 of 11    War            +15        |
|  point at, then vs now      |  Demons          0 of 9     Uncertainty    +10        |
|  (big callout + 2 bars)     |  Basements       0 of 8     Money worries  +11        |
|                             |  Ghosts          0 of 6     Not good enough +7        |
|  45 of 105 kept any         |  Dentists        1 of 9     Cancer          +7        |
|  childhood fear             |  (horizontal bars, retention %)  (bars, net gain)     |
+-----------------------------+------------------------------------------------------+
|  THE SHIFT  slope chart: 8 categories, Childhood -> Today, mentions                 |
|  tangible categories in one colour falling, abstract in another colour rising       |
+-----------------------------------------------+------------------------------------+
|  THE ONES THAT NEVER LEAVE                     |  How to read this / method note    |
|  Snakes 55% kept · Trapped 36% · War 100%      |  source, n, definition of "kept"   |
+-----------------------------------------------+------------------------------------+
```

Reading order (and tab order): title -> callout -> outgrew -> crept in -> slope -> never leave -> footnote.

---

## 3. Data model

The starter .pbix already has this model. Use it rather than rebuilding:

- `FactFearSelection` with `ResponseKey`, `Fear`, `LifeStage` (Childhood / Now)
- `DimFear[Fear]`, `DimFear[Category]` (organizer's categories, e.g. "Animals & Insects", "Nature & Environment")
- `DimCountry[Country]`, `DimCountry[Continent]`, `DimGender`, `DimAgeGroup`
- `_Measures[Number of Respondents]`
- A "View By" field parameter (delete it, not needed on a poster)

Check `DimFear[Category]` values in Data view. If the organizer's grouping differs from the one above, either use theirs (safer) and recompute the category table, or add a calculated column `Tangible` as below. Numbers in section 1 use the author grouping; re-run `scripts/analyze.js` after editing the `put(...)` lines if you switch.

### 3a. Add a transition table (Power Query)

Create a new query `FearTransition` from `FactFearSelection`:

```m
let
    Src = FactFearSelection,
    Child = Table.SelectRows(Src, each [LifeStage] = "Childhood"),
    Now   = Table.SelectRows(Src, each [LifeStage] = "Now"),
    ChildKeys = Table.AddColumn(Table.SelectColumns(Child, {"ResponseKey","Fear"}), "InChildhood", each 1),
    NowKeys   = Table.AddColumn(Table.SelectColumns(Now,   {"ResponseKey","Fear"}), "InNow", each 1),
    Joined = Table.NestedJoin(ChildKeys, {"ResponseKey","Fear"}, NowKeys, {"ResponseKey","Fear"}, "N", JoinKind.FullOuter),
    Exp = Table.ExpandTableColumn(Joined, "N", {"ResponseKey","Fear","InNow"}, {"RK2","Fear2","InNow"}),
    Fill = Table.AddColumn(Exp, "Key", each if [ResponseKey] = null then [RK2] else [ResponseKey]),
    Fill2 = Table.AddColumn(Fill, "FearName", each if [Fear] = null then [Fear2] else [Fear]),
    Status = Table.AddColumn(Fill2, "Status", each
        if [InChildhood] = 1 and [InNow] = 1 then "Kept"
        else if [InChildhood] = 1 then "Outgrown"
        else "Gained"),
    Out = Table.SelectColumns(Status, {"Key","FearName","Status"}),
    Renamed = Table.RenameColumns(Out, {{"Key","ResponseKey"},{"FearName","Fear"}})
in
    Renamed
```

Relate `FearTransition[Fear]` -> `DimFear[Fear]` (many to one). Leave `ResponseKey` unrelated or relate to a respondent dim if one exists.

Also fix the one write-in: in `FactFearSelection`, replace `"Something else: War"` with `"War"` (this is a transformation, allowed; note it in the footer).

### 3b. Tangible flag (calculated column on DimFear)

```dax
Tangible =
VAR c = DimFear[Category]
RETURN IF (
    c IN { "Animals", "Animals & Insects", "Places & situations", "Nature & Environment",
           "Medical & body", "Supernatural & intruders" },
    "Tangible", "Abstract" )
```
Adjust the list to the organizer's actual category names.

### 3c. Measures

```dax
Mentions = COUNTROWS ( FactFearSelection )

Childhood Mentions = CALCULATE ( [Mentions], FactFearSelection[LifeStage] = "Childhood" )
Now Mentions       = CALCULATE ( [Mentions], FactFearSelection[LifeStage] = "Now" )
Net Change         = [Now Mentions] - [Childhood Mentions]

Respondents = DISTINCTCOUNT ( FactFearSelection[ResponseKey] )

Tangible Share =
VAR t = CALCULATE ( [Mentions], DimFear[Tangible] = "Tangible" )
VAR a = CALCULATE ( [Mentions], DimFear[Tangible] IN { "Tangible", "Abstract" } )
RETURN DIVIDE ( t, a )

Tangible Share Childhood = CALCULATE ( [Tangible Share], FactFearSelection[LifeStage] = "Childhood" )
Tangible Share Now       = CALCULATE ( [Tangible Share], FactFearSelection[LifeStage] = "Now" )

Kept     = CALCULATE ( COUNTROWS ( FearTransition ), FearTransition[Status] = "Kept" )
Outgrown = CALCULATE ( COUNTROWS ( FearTransition ), FearTransition[Status] = "Outgrown" )
Gained   = CALCULATE ( COUNTROWS ( FearTransition ), FearTransition[Status] = "Gained" )
Retention % = DIVIDE ( [Kept], [Kept] + [Outgrown] )

Respondents Who Kept A Fear =
CALCULATE ( DISTINCTCOUNT ( FearTransition[ResponseKey] ), FearTransition[Status] = "Kept" )

Kept Label = FORMAT ( [Kept], "0" ) & " of " & FORMAT ( [Kept] + [Outgrown], "0" )
```

Expected checks: Respondents = 105; Tangible Share Childhood = 0.70; Tangible Share Now = 0.41; Respondents Who Kept A Fear = 45; Retention % for "The dark" = 0; for "War" = 1.

---

## 4. Visuals (all native, for accessibility)

1. **Title textbox**: "The Monsters Grew Up". Subtitle textbox one line.
2. **Callout**: Card (new) showing `Tangible Share Childhood` and `Tangible Share Now`; under it a 2-bar clustered bar (LifeStage on axis, `Tangible Share` as value), data labels on, no axis.
3. **What we outgrew**: horizontal bar, DimFear[Fear] on Y, `Childhood Mentions` as value, filtered to the 6 fears with highest `Outgrown`, data label = `Kept Label` (use a conditional label or a tooltip measure). Sort by Childhood Mentions desc.
4. **What crept in**: horizontal bar, `Gained` by Fear, top 6 (War, Uncertainty, Financial insecurity, Death, Cancer, Wasting potential). Data labels on.
5. **The shift**: line chart, X axis = LifeStage (categorical, Childhood then Now), legend = DimFear[Category], Y = `Mentions`. Markers on, data labels on both ends, no gridlines. Colour rule: tangible categories one hue, abstract another (set per series in Format > Lines > Colors). This is the slope chart.
6. **Never leave**: 3 cards or a small bar of `Retention %` for Snakes, Being trapped, War.
7. **Footer textbox**: method note from section 1.

Hide the "Read Me" and "Data Preview" starter pages or delete them (only one visible page allowed; the starter already marks them hidden, but delete to be safe). Delete the unused Portrait page.

---

## 5. Colour and accessibility

Starter theme "SoftDark" uses background `#292929`, text `#F0F0F0`. Use only these colours on charts so every pair clears WCAG 2.2 AA against `#292929`:

| Role | Hex | Contrast on #292929 |
|---|---|---|
| Tangible / childhood | `#FFB477` (warm orange) | ~9.5:1 |
| Abstract / today | `#75B7FF` (cool blue) | ~8.6:1 |
| Emphasis (e.g. War) | `#FF6B76` | ~6.3:1 |
| Muted / other | `#9A9A9A` | ~4.6:1 |
| Text | `#F0F0F0` | ~12:1 |

Orange vs blue is distinguishable for the common colour-vision deficiencies. Never encode a difference by colour alone: label every bar and both ends of every slope line.

Checklist before export:
- Text >= 4.5:1, chart elements >= 3:1 (verify with any contrast checker).
- View > Selection > Tab order: set to reading order above; mark decorative shapes and the background image as "hidden in tab order".
- Alt text on every visual (Format > General > Alt text). Write the insight, e.g. "Line chart: mentions of place and supernatural fears fall from childhood to today while life, work and global fears rise."
- Minimum font 12 pt body, 10 pt only for the footnote.
- Keep one visible page. Tooltip pages, if any, must be set to Tooltip = On and hidden.

---

## 6. Submission

1. Save as `Halloween 2026 - The Monsters Grew Up.pbix`.
2. Export an A4 PDF or PNG as a thumbnail (File > Export > PDF).
3. Post in the Contests Gallery: https://community.fabric.microsoft.com/category/pbi_comm_galleries/discussions/pbi_contestsgallery
   Submitted: https://community.fabric.microsoft.com/discussions/pbi_contestsgallery/the-monsters-changed-the-fear-didnt-/5375310
   Repository: https://github.com/oii-nasif/the-monsters-changed-powerbi
   Include the .pbix, the image, a 3-line summary of the insight, and the method note.
4. Submit before Wed Oct 21, midnight Pacific.

---

## 7. Environment to-do

- Install Power BI Desktop (Microsoft Store or aka.ms/pbidesktopstore). Not currently installed.
- Open `data/Halloween Contest 2026 - Starter File.pbix`, check Data view for the exact table and column names before pasting DAX.
