# Stage 12 Stitch Alignment

Stitch is visual reference only — not production React Native code.

| Screen | Route | Stitch reference | Components | Notes |
|---|---|---|---|---|
| Nutrition history | `.../nutrition` | nutrition_planner (partial) | NutritionHistoryItem, NutritionDraftCard | Entry from client profile |
| Start assessment | `.../nutrition/start` | nutrition_planner | NutritionAssessmentTypeCard, DevelopmentBanner | Fail closed when no template |
| Section capture | `.../nutrition/[id]/section/[sectionId]` | — | QuestionField (Stage 8 reuse) | Section-level routing |
| Resume | `.../nutrition/[id]/resume` | — | — | Progress continuation |
| Review | `.../nutrition/[id]/review` | — | NutritionMissingInformation | Completeness gate |
| Summary / complete | `.../nutrition/[id]/summary` | — | NutritionReferenceStatus | Pre-guidance summary |
| Guidance | `.../nutrition/[id]/guidance` | — | NutritionGuidanceCard, NutritionGuidanceUnavailableState | Acknowledgement required |
| Details | `.../nutrition/[id]/details` | — | NutritionReferenceStatus | Completed view |
| Correct | `.../nutrition/[id]/correct` | — | DevelopmentBanner | Supersedes prior |
| Dev preview | `(development)/nutrition-preview` | — | inventory counts | Production gated |

## Not implemented (roadmap vs Stage 12 scope)

- Food diversity ring / `NutritionRing` visualisation
- `FoodSelector` component
- Dagbanli audio playback controls
- Full `nutrition_planner` pixel parity

## Accessibility

- QuestionField inherits Stage 8 a11y (unknown/notAssessed explicit)
- Guidance cards labelled; unavailable state announced
- Development banners exposed to screen readers

## Known differences

Android visual validation **pending** (`emulator-5554` offline). Do not claim pixel-perfect Stitch alignment.

## Related

`docs/development/ANDROID_NUTRITION_VALIDATION.md`
