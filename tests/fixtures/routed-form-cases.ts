export const routedFormCases=[
 ['/workouts/new','Add Exercise'],['/workouts/edit?id=w','Edit Exercise'],
 ['/routines/exercises/add?routine=r','Add Exercise'],['/routines/exercises/custom/new?routine=r','Create Custom Exercise'],['/routines/exercises/custom/edit?id=w&routine=r','Edit Custom Exercise'],
 ['/routines/workouts/new?routine=r','Add Exercise'],['/routines/workouts/edit?id=w','Edit Exercise'],['/routines/new','Create Routine'],['/routines/edit?id=r','Edit Routine'],
 ['/dynamic-overview/2026-10-19/duration','Edit Workout Duration'],
 ['/cardio/goal','Cardio Goal'],['/cardio/add','Add Cardio'],['/cardio/edit?id=cardio','Edit Cardio'],['/cardio/types/new','Add Custom Cardio Type'],
 ['/meditation/goal','Meditation Goal'],['/meditation/edit?id=practice','Edit Meditation'],
 ['/hydration/goal','Hydration Goal'],['/hydration/add','Add Hydration'],['/hydration/edit?id=intake','Edit Hydration'],
 ['/fasting/goal','Intermittent Fasting Goal'],['/fasting/add','Add Fast'],['/fasting/edit?id=fast','Edit Fast'],
 ['/food-tracker/add?meal=lunch&date=2026-10-19','Add Food'],['/food-tracker/scan','Scan Barcode'],['/food-tracker/custom/new','Create Custom Food'],['/food-tracker/custom/edit?id=custom-appearance','Edit Custom Food'],
 ['/food-tracker/entry/new?id=custom-appearance&meal=lunch','Add Food Entry'],['/food-tracker/entry/edit?id=logged-appearance&date=2026-10-19','Edit Food Entry'],
 ['/food-database/edit?id=custom-appearance','Edit Food'],['/supplements-page/new','Add Supplement'],['/profile/edit','Edit Profile'],['/profile/goals','Fitness Goals'],
] as const;
