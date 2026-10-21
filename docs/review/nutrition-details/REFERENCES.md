# Nutrition Details references and applicability

This is a read-only refinement of Nutrition Details, not a nutrition recommendation engine or a change to logged food calculations. Values are centralized in `client/src/lib/nutrient-references.ts`.

## Sources

- NIH Office of Dietary Supplements, [Calcium](https://ods.od.nih.gov/factsheets/Calcium-HealthProfessional/), [Iron](https://ods.od.nih.gov/factsheets/Iron-HealthProfessional/), [Potassium](https://ods.od.nih.gov/factsheets/Potassium-HealthProfessional/), [Vitamin C](https://ods.od.nih.gov/factsheets/VitaminC-HealthProfessional/) and [DRI reference tables](https://ods.od.nih.gov/HealthInformation/nutrientrecommendations.aspx). These summarize the National Academies RDAs/AIs, including 2011 calcium and 2019 potassium references.
- National Academies, [Dietary Reference Intakes for Sodium and Potassium (2019)](https://nap.nationalacademies.org/catalog/25353/dietary-reference-intakes-for-sodium-and-potassium): sodium **Chronic Disease Risk Reduction (CDRR)** thresholds, not sodium minimum needs or a formal tolerable upper intake level.
- National Academies, [DRIs for Energy, Carbohydrate, Fiber, Fat, Fatty Acids, Cholesterol, Protein and Amino Acids](https://nap.nationalacademies.org/catalog/10490/dietary-reference-intakes-for-energy-carbohydrate-fiber-fat-fatty-acids-cholesterol-protein-and-amino-acids): fiber AIs and the 14 g/1,000 kcal energy-density basis.
- [Dietary Guidelines for Americans 2020–2025](https://www.dietaryguidelines.gov/sites/default/files/2020-12/Dietary_Guidelines_for_Americans_2020-2025.pdf): saturated fat below 10% of calories for ages 2+. This implementation cites that named edition; it does not claim to implement every recommendation in a newer edition.

Live retrieval of the official source pages/PDF was blocked by HTTP 403 in this environment, including alternate official FDA/Health Canada/NCBI hosts. The table below makes every implemented value and its applicability reviewable; no live source-verification claim is made.

## Implemented table

Daily units: calcium, iron, potassium, vitamin C and sodium in **mg**; fiber in **g**. Male/female pairs indicate values that require the corresponding explicitly saved sex category. A single value is shared by both categories and can be used without assuming sex.

| Completed age | Calcium RDA | Iron RDA | Potassium AI | Vitamin C RDA | Fiber AI fallback | Sodium CDRR threshold |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| 1–3 | 700 | 7 | 2,000 | 15 | 19 | 1,200 |
| 4–8 | 1,000 | 10 | 2,300 | 25 | 25 | 1,500 |
| 9–13 | 1,300 | 8 | 2,500 / 2,300 | 45 | 31 / 26 | 1,800 |
| 14–18 | 1,300 | 11 / 15 | 3,000 / 2,300 | 75 / 65 | 38 / 26 | 2,300 |
| 19–50 | 1,000 | 8 / 18 | 3,400 / 2,600 | 90 / 75 | 38 / 25 | 2,300 |
| 51–70 | 1,000 / 1,200 | 8 | 3,400 / 2,600 | 90 / 75 | 30 / 21 | 2,300 |
| 71–120 | 1,200 | 8 | 3,400 / 2,600 | 90 / 75 | 30 / 21 | 2,300 |

- Adults 19+ with a valid saved calorie target use **14 × calories / 1,000 g** for fiber; otherwise the AI fallback applies when its demographic inputs exist. Children use the age/sex AI table, not an adult energy extrapolation.
- Saturated-fat reference: **calories × 0.10 / 9 g**, ages 2+, only with a valid saved calorie target. At 2,000 kcal this is 22.2 g, not an invented fixed 20 g for every user.
- Saved calorie, protein, carbohydrate and fat targets are taken unchanged from the existing targets passed by Food Tracker. Zero, negative, non-finite or out-of-schema values do not become reference denominators. No illustrative 2,000-kcal fallback is introduced in this modal.
- Reference types are explicit: saved target, recommended intake, limit, or general label reference. Sodium and saturated fat retain limit semantics in accessible descriptions but omit the visible suffix. They and label-reference comparisons use subdued blue bars. Intake/target bars are green. Exceeding a reference only fills the bar; it causes no warning, toast or goal change.

## Input precedence and limits

The existing profile reader supplies valid DOB-derived completed age first, then its existing saved-age fallback. Only explicitly stored `fitcircle_profile.gender` values `male` or `female` select a sex-dependent table entry. A missing/unrecognized value is not converted to the calculator's default male setting. Names, weight goals, height, weight and activity are not used to invent micronutrient formulas; their effects on energy remain with the existing Fitness Calculator.

Unknown/invalid age, infant age, fractional completed age, or an age above the conservative supported bound of 120 yields no age-dependent reference. Missing sex omits only sex-dependent values: for example calcium 1,000 mg is shared at 19–50, but calcium at 51–70 is withheld without sex. No FDA general Daily Value is disguised as a personalized age/sex target.

References are general, non-pregnant/non-lactating intake values. Pregnancy/lactation, smoking adjustments, medical needs and individualized prescriptions are not represented in the existing profile. The modal's collapsed Reference information states this applicability. No new profile fields are added or inferred.

Current Food Tracker uses its saved calculator calorie/macronutrient targets. This refinement keeps that ownership: legacy `fitcircle_nutrition_goals` records remain unchanged and backed up, and are not silently reactivated to compete with the current daily dashboard. Historical days use the current references; there is no invented historical target snapshot.

## No fabricated comparisons

- The existing **sugar** field is **total sugar**, not added sugar. No separate added-sugar field or user-configurable total-sugar reference exists in the current food model, goal schemas, calculator targets, or storage registry. Total sugar therefore retains its intake and unit only, without a fabricated denominator or bar. No added-sugar Daily Value is applied to total sugar.
- Cholesterol uses the **300 mg FDA Nutrition Facts Daily Value** for recorded ages 4+. This is a general label comparator, not a personalized prescription or a newly inferred universal DRI/upper limit.
- The existing vitamin A field is inconsistent: the legacy custom-food form labels IU, while barcode normalization stores µg. The model does not identify the vitamin A form or retinol activity equivalents (RAE). No vitamin A target or percentage is assigned. Known scanned-source µg totals can be displayed, but a total containing unit-ambiguous legacy/custom records says **Unit unavailable** instead of incorrectly adding IU to µg. Original values, aggregation functions, product metadata and backups are untouched. Resolving legacy units requires a separate provenance/label-based correction, not guessed conversions.
- Missing values remain missing; explicit zero remains zero. Unknown totals have no fabricated zero-progress bar. Known partial totals can have a bar and receive one modal-level disclosure plus accessible per-row partial-total semantics. Coverage counts remain in the unchanged `dailyNutrition` result.
- Bars use unrounded intake/reference arithmetic and clamp visually to 0–100%. Text displays the actual intake, grouped thousands and at most one decimal; positive trace values below 0.05 display < 0.1 rather than a false zero.

## Validation and compatibility

- Application TypeScript and regression-test TypeScript: passed.
- Unit/regression tests: **277 passed** (including reference tables, denominator guards, rounding, completeness and complete-backup preservation).
- Storage audit: **158 call sites, 0 errors**.
- Production build: passed; existing Browserslist age and bundle-size warnings remain.
- New modal browser regressions: **6 passed**, including phone layout and unchanged raw bytes.
- Complete browser suite: **227 passed, 1 failed**. The failure is the existing **automatic scan caching failure blocks logging; diary failure retains cached product and retry avoids duplicates** test, which stopped before Add Entry appeared during its mocked barcode lookup, before the injected storage failure.
- An earlier combined nutrition/modal run had **26 passed, 1 failed** in the existing scanned-product/offline lookup test. That same failure reproduced **3/3** on a separate, unchanged main worktree at **f7b39c5**; its isolated traced rerun on this branch passed. The caching test also passed in isolation on main. This demonstrates existing scanner/API-mock nondeterminism rather than a modal rendering regression. No scan logic, API normalization, service worker, request mocks, test timeouts or retries are changed here. The full suite is **not claimed green**; this known harness issue may still block a deployment and should be handled independently.
- Whitespace check: passed.

Screenshots use synthetic data in Chromium at 390×844: [overview](screenshots/overview.png), [micronutrients](screenshots/micronutrients.png).

All fixtures are synthetic. Production changes are confined to the modal component and a pure reference utility. No storage keys, formats, backup schemas, food records, barcode normalization, goals or other Food Tracker views are changed.

Physical iPhone Safari/PWA testing is not claimed. Automated phone-size checks cover 320×568, safe-area offsets, scrollable last rows, horizontal fit and a stationary accessible close button. Real-device checks remain for enlarged system text, VoiceOver reading of partial totals/limits, and installed-PWA keyboard/viewport transitions.

## Sugar/cholesterol display follow-up

The clarified request keeps total sugar intake-only because the app has neither separate added-sugar data nor an existing configurable total-sugar reference. The proposed 90 g comparator was removed before merge. No new settings, keys or fields are added. Cholesterol shows intake / 300 mg using the FDA label Daily Value for recorded ages 4+. Visible rows omit “limit” for sodium and saturated fat, while screen-reader descriptions retain the distinction. All source/applicability explanations stay in the collapsed Reference information section.

Source: [FDA Daily Values](https://www.fda.gov/food/new-nutrition-facts-label/daily-value-new-nutrition-and-supplement-facts-labels). Missing nutrient data remains unavailable; explicit zero can display a zero-fill bar when a valid reference exists; intake above a comparator remains numerically accurate with a full bar. No stored food, profile, goal, backup format, or Vitamin A behavior changed.

Follow-up validation: application and regression-test TypeScript passed; all 280 unit tests passed; storage audit passed (158 call sites, 0 errors); production build passed. The 40-test nutrition browser run had 39 passes and one failure in the existing automatic-scan-caching test while waiting for Add Entry, before any nutrient comparison assertion. That test passed independently on rerun (1/1). All seven Nutrition Details cases passed in the combined run. No barcode logic or test timing was changed. Physical iPhone testing was not performed.
