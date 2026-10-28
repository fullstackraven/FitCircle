# Button and search inventory

Baseline: `05339ab` (current main after PR #106). The AST scan finds **292 imported control declarations before** and **293 after**, including wrappers, conditional JSX and all three actual search inputs. One shared Radix trigger alias now supplies capsule geometry. Static startup/phone-diagnostic actions are audited separately.

Every declaration below records its prior styling, new owner/variant, update status and rationale. The [machine inventory](inventory.json) retains the complete literal before/after class strings. Source lines refer to the final implementation.

## Protected Food Tracker actions

**Scan Barcode** and **Custom Food** are the two protected tiles. Neither JSX, classes, handlers, colors, radius, dimensions nor placement changed. SHA-256 source tests and 320/390px Light/Dark computed-style/rectangle tests enforce this. No other Food Tracker button is excluded; its record-edit and nutrition-details surfaces also adopt capsule geometry.

## Reachable implementations

### `client/src/components/AddSupplementDialog.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| DialogTrigger · 59 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| Add Supplement · 60 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| SelectTrigger · 97 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 128 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 135 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/components/CardioDataRecovery.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 42 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 44 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/DashboardMenu.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 16 | rounded-lg | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/DaySelector.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Clear Selection · 49 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 68 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 88 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 98 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 108 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 121 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/components/DockNavigation.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 19 | Implicit or owner-class geometry; see literal classes in JSON | Approved dock tab | No | Dock geometry and behavior explicitly preserved |

### `client/src/components/FoodNotifications.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Dismiss notification · 18 | Implicit or owner-class geometry; see literal classes in JSON | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |

### `client/src/components/QuoteOfTheDay.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Refresh quote · 39 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Refresh quote · 53 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/components/SidebarProfileCard.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 23 | rounded-xl | Original card surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |

### `client/src/components/VersionLabel.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 30 | Implicit or owner-class geometry; see literal classes in JSON | Original text surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |

### `client/src/components/WorkoutDataRecovery.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 43 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 45 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/nutrition/BarcodeEntry.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Button · 68 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 94 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/components/nutrition/BarcodeScanner.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 123 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/nutrition/FoodEntryForm.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Product serving unit · 150 | rounded-lg | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Meal · 201 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 321 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-add-entry · 324 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/components/nutrition/MealDiary.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 30 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 57 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 79 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 112 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/components/progress-circle.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 106 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/routine-modal.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button-cancel-routine · 92 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-routine · 100 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/components/ui/collapsible.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| CollapsiblePrimitive.Trigger · 13 | New shared wrapper (previously a Radix alias) | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |

### `client/src/components/ui/dialog.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| DialogPrimitive.Close · 59 | rounded-sm | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |

### `client/src/components/ui/presentation.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 17 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 32 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/components/ui/select.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| SelectPrimitive.Trigger · 19 | rounded-xl | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| SelectPrimitive.ScrollUpButton · 39 | Implicit or owner-class geometry; see literal classes in JSON | Native menu scrolling | No | Radix menu scroll affordance; not an action-button surface |
| SelectPrimitive.ScrollDownButton · 56 | Implicit or owner-class geometry; see literal classes in JSON | Native menu scrolling | No | Radix menu scroll affordance; not an action-button surface |
| SelectScrollUpButton · 86 | Implicit or owner-class geometry; see literal classes in JSON | Native menu scrolling | No | Radix menu scroll affordance; not an action-button surface |
| SelectScrollDownButton · 96 | Implicit or owner-class geometry; see literal classes in JSON | Native menu scrolling | No | Radix menu scroll affordance; not an action-button surface |

### `client/src/components/ui/sheet.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| SheetPrimitive.Close · 72 | rounded-sm | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |

### `client/src/components/ui/toast.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| ToastPrimitives.Action · 60 | rounded-xl | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |
| ToastPrimitives.Close · 75 | rounded-xl | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |

### `client/src/components/wellness/WellnessUI.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 45 | 12px; 44px minimum | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 239 | 14px; 48px minimum | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 254 | 14px; 52px minimum | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 290 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 297 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/components/workout-modal.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Workout color · 106 | rounded-xl | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 193 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 201 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 214 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/about.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 12 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 21 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/calendar-new.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Open Menu · 505 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Previous period · 522 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Next period · 533 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 544 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button-prev-page · 646 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 662 | rounded-full | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button-next-page · 673 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 692 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/cardio.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| DialogTrigger · 309 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| WellnessPrimaryAction · 310 | Implicit or owner-class geometry; see literal classes in JSON | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |
| SelectTrigger · 333 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| DialogTrigger · 348 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| Button · 349 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 375 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 381 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 442 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 449 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 497 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 516 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| CollapsibleTrigger · 567 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| button · 663 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| SelectTrigger · 720 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 778 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 785 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Close · 810 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 838 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 844 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 871 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 896 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 903 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/daily-journal.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| View all journal entries · 138 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Save Entry · 205 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/pages/dynamic-overview.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 325 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 388 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 468 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 496 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| View and log supplements · 501 | 14px card surface | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Save · 557 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Cancel · 564 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Edit count · 577 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button-edit-workout-duration · 596 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 650 | Implicit or owner-class geometry; see literal classes in JSON | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| button · 687 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 690 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Add supplement · 702 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 710 | 10px; expanded 44px hit area | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 718 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button-cancel-duration · 788 | rounded-lg | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button-save-duration · 795 | rounded-lg | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/energy-level.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Decrease the draft level by one; saved data is unchange · 48 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 48 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/fasting.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| WellnessPrimaryAction · 280 | Implicit or owner-class geometry; see literal classes in JSON | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |
| CollapsibleTrigger · 370 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| Edit fast · 411 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Delete fast · 418 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Close · 475 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 542 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 549 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 648 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 655 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/fitness-calculator.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 328 | 10px | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Button · 379 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| SelectTrigger · 421 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| button · 466 | 9px | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| SelectTrigger · 497 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 584 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button · 589 | Implicit or owner-class geometry; see literal classes in JSON | Original text surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| button · 703 | Implicit or owner-class geometry; see literal classes in JSON | Original text surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| Button · 735 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/food-database.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Search foods · 194 | rounded-xl | Shared search capsule | Yes | Journal 48px; Food Database 44px; Food Tracker 56px preserves protected tile positions |
| Button · 281 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 291 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button-prev-page · 311 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button-next-page · 328 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| select-edit-unit · 397 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| button-cancel-edit · 511 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-edit · 522 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/food-tracker.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Food Database · 522 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Fitness Calculator · 523 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Previous day · 528 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Next day · 547 | 12px; 44px minimum | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 563 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 564 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button · 567 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Search foods · 599 | rounded-2xl | Shared search capsule | Yes | Journal 48px; Food Database 44px; Food Tracker 56px preserves protected tile positions |
| Clear food search · 608 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Scan Barcode · 627 | rounded-3xl | Protected original choice tile | No | Explicit owner-protected exception; complete JSX and geometry/style regressions |
| Create Custom Food · 630 | rounded-3xl | Protected original choice tile | No | Explicit owner-protected exception; complete JSX and geometry/style regressions |
| Button · 634 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Edit food · 679 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Add to meal · 689 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Delete from database · 699 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Add to meal · 760 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| select-custom-unit · 846 | Shared trigger: 12px; usage sizing/colors | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| button-cancel-custom · 1068 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-custom · 1079 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| SelectTrigger · 1153 | rounded-xl | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 1198 | rounded-xl | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-edit-entry · 1205 | rounded-xl | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/home.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Open Menu · 214 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 247 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Stop workout · 269 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 276 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Reset without saving · 283 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 345 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 353 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 371 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Restart timer from beginning · 481 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Stop timer · 492 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Add new workout · 513 | rounded-full | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Button · 600 | rounded-full | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 601 | rounded-full | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/hydration.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 195 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| WellnessPrimaryAction · 213 | Implicit or owner-class geometry; see literal classes in JSON | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |
| Edit intake · 246 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Delete intake · 256 | Shared Button: 12px; usage sizing/colors | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| CollapsibleTrigger · 292 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| Edit historical intake · 341 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Delete historical intake · 347 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 357 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Close · 402 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 442 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 449 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button · 486 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Button · 517 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 569 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button · 600 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Button · 643 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-save-edit · 650 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/journal-entry.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Back to journal library · 114 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Save Entry · 125 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Edit · 136 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Delete journal entry · 146 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/pages/journal-log.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Back to Logs · 78 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 97 | Implicit or owner-class geometry; see literal classes in JSON | Original record surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| Search journal · 143 | Implicit or owner-class geometry; see literal classes in JSON | Shared search capsule | Yes | Journal 48px; Food Database 44px; Food Tracker 56px preserves protected tile positions |
| Clear search · 160 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Write new journal entry · 169 | rounded-full | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |

### `client/src/pages/legal.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 39 | Implicit or owner-class geometry; see literal classes in JSON | Original text surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |

### `client/src/pages/measurements.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Button · 124 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 169 | rounded-xl | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/meditation.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button-add-meditation · 410 | Implicit or owner-class geometry; see literal classes in JSON | Shared action / fc-pill | Yes | Overlay/toast/action primitive retains handlers and focus behavior |
| Button · 421 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 430 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 438 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| CollapsibleTrigger · 522 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| button · 622 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Close · 663 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 706 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 713 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 753 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 800 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button-start-meditation · 817 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/profile.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 57 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 57 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Edit Profile · 61 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Edit Fitness Goals · 64 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 74 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 80 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 81 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 82 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Primary objective · 93 | rounded-lg | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| Button · 98 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 98 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/recovery.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 36 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 38 | 24px | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 39 | 24px | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/reminders.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Open Menu · 182 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 201 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 210 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 211 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 212 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Write a reminder · 234 | Implicit or owner-class geometry; see literal classes in JSON | Original record surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| button · 239 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 262 | Implicit or owner-class geometry; see literal classes in JSON | Original record surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| button · 270 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 275 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 276 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 287 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Write a reminder · 289 | Implicit or owner-class geometry; see literal classes in JSON | Original record surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |
| New Reminder · 293 | rounded-full | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Button · 305 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 306 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/restore-custom-foods.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Button · 220 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/routines.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Open Menu · 142 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button-add-routine · 160 | rounded-2xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 186 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 199 | rounded-xl | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 205 | rounded-xl | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 236 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button-create-routine · 258 | rounded-2xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| CollapsibleTrigger · 272 | Implicit or owner-class geometry; see literal classes in JSON | Child-owned geometry | Via child | Radix asChild delegates its surface to the already audited child |
| Button · 273 | rounded-2xl | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 289 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| button · 318 | rounded-xl | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Button · 329 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Button · 388 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |
| Delete routine · 389 | Shared Button: 12px; usage sizing/colors | Button / fc-pill | Yes | Existing variant colors, sizing, typography and behavior retained |

### `client/src/pages/settings.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 151 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 168 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button-force-refresh · 201 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| Hide Quote of the Day · 227 | rounded-full | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| Hide Today's Totals · 248 | rounded-full | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| Hide Recent Activity · 269 | rounded-full | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| button · 298 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 312 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 319 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 390 | Implicit or owner-class geometry; see literal classes in JSON | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| Refresh FitCircle · 396 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 406 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 410 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 417 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 417 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 417 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/share.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 18 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 18 | rounded-xl | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/supplements.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| button · 118 | Implicit or owner-class geometry; see literal classes in JSON | Original native-selection surface | No | Checkbox/switch interaction; not a pill action |
| button · 126 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| CollapsibleTrigger · 129 | Implicit or owner-class geometry; see literal classes in JSON | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |
| button · 135 | rounded-lg | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 136 | rounded-lg | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 140 | 24px; 36px visible height | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 141 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 145 | 24px; 44px minimum; 10px/12px padding | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |

### `client/src/pages/wellness.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Open Menu · 178 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 195 | Implicit or owner-class geometry; see literal classes in JSON | fc-pill / --radius-pill | Yes | Existing dimensions/colors/hierarchy retained; icon targets improved where needed |
| button · 222 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 234 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 246 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 258 | Implicit or owner-class geometry; see literal classes in JSON | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| button · 271 | rounded-2xl | Original card surface | Metadata only | Not an action surface; reading/editing/navigation/text geometry preserved |

### `client/src/pages/workout-statistics.tsx`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| Previous month · 93 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| Next month · 97 | rounded-lg | 44px circular icon action / fc-pill | Yes | Icon geometry and touch size standardized; existing larger circular tools retained |
| CollapsibleTrigger · 113 | Implicit or owner-class geometry; see literal classes in JSON | Shared/native trigger / fc-pill | Yes | Capsule trigger; options and native keyboard behavior unchanged |

### `client/index.html`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| static HTML button · 1 | Browser default / diagnostic 12px corners | var(--radius-pill,9999px); existing touch sizing | Yes | CSS only; startup and diagnostic scripts/dock unchanged |

### `client/public/viewport-test/test.css`

| Control / line | Previous styling | New styling | Updated | Exception / rationale |
| --- | --- | --- | --- | --- |
| static HTML button · 1 | Browser default / diagnostic 12px corners | var(--radius-pill,9999px); existing touch sizing | Yes | CSS only; startup and diagnostic scripts/dock unchanged |

## Unimported legacy declarations

These components have no import path from `main.tsx` and are not reachable screens. They remain listed rather than silently counted as modernized.

| File / line | Control | Treatment |
| --- | --- | --- |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:69` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:75` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:85` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:119` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:126` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/TimerWidget.tsx:138` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WidgetSettings.tsx:64` | Button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WidgetSettings.tsx:75` | Button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WidgetSettings.tsx:123` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WidgetSettings.tsx:131` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:43` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:49` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:59` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:85` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:108` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:115` | button | Unchanged; not shipped |
| `client/src/components/dashboard-widgets/WorkoutSessionWidget.tsx:122` | button | Unchanged; not shipped |

## Search coverage

Only three actual search bars exist: Food Tracker Add Food (56px modal field), Food Database (44px), and Journal Library (48px header). Their existing query/filter/clear behavior is preserved. Workout/Routine/Supplement pages do not currently have search bars; none were invented. Numeric, date, password, multiline and ordinary text fields retain their own styling.

## Semantic non-action exceptions

Checkbox/switch rows, radio theme previews, sliders, calendar cells and progress visuals retain their interaction geometry. Explicit `data-control-geometry` marks the existing profile/feature cards, journal/reminder reading/editing surfaces and text-only links. The dock is unchanged. Compact schedule controls retain their established keyboard/landscape dimensions; compact Dynamic Overview actions retain expanded hit regions. Pagination dots retain their dot visual inside 24×44px targets with 44×44px arrow alternatives at narrow widths. Menu scroll/option primitives retain native menu semantics. These are not unexplained action-button overrides.
