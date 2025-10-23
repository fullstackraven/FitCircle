const fs = require('fs');
const path = require('path');

// Load the food database
const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Original database size: ${foods.length} items`);

// Legitimate "boneless" items (meat/poultry/fish)
const legitimateBoneless = [
  'chicken', 'turkey', 'duck', 'fish', 'salmon', 'tuna', 'cod', 'tilapia',
  'pork', 'beef', 'lamb', 'ham', 'wings', 'thighs', 'breast', 'steak'
];

// Step 1: Remove nonsensical "boneless" items
const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  if (name.startsWith('boneless ')) {
    // Check if it's a legitimate boneless item
    const isLegitimate = legitimateBoneless.some(term => name.includes(term));
    if (!isLegitimate) {
      console.log(`Removing nonsensical: ${food.name}`);
      return false;
    }
  }
  
  // Remove other nonsensical patterns
  if (name.includes('skinless zucchini') || 
      name.includes('skinless carrot') ||
      name.includes('skinless lettuce') ||
      name.includes('skinless tomato') ||
      name.includes('skinless cucumber')) {
    console.log(`Removing nonsensical: ${food.name}`);
    return false;
  }
  
  return true;
});

console.log(`After removing nonsensical items: ${filteredFoods.length} items (removed ${foods.length - filteredFoods.length})`);

// Step 2: Remove exact duplicates
const uniqueFoods = [];
const seen = new Set();

filteredFoods.forEach(food => {
  const signature = JSON.stringify({
    name: (food.name || '').toLowerCase().trim(),
    brand: (food.brand || '').toLowerCase().trim(),
    calories: food.calories,
    protein: food.protein,
    carbs: food.carbs,
    fat: food.fat,
    quantity: food.quantity,
    unit: food.unit
  });
  
  if (!seen.has(signature)) {
    seen.add(signature);
    uniqueFoods.push(food);
  }
});

console.log(`After removing exact duplicates: ${uniqueFoods.length} items (removed ${filteredFoods.length - uniqueFoods.length})`);

// Step 3: Intelligent deduplication
const nameGroups = {};
uniqueFoods.forEach(food => {
  const key = (food.name || '').toLowerCase().trim();
  if (!nameGroups[key]) {
    nameGroups[key] = [];
  }
  nameGroups[key].push(food);
});

function scoreFood(food) {
  let score = 0;
  if (food.brand) score += 10;
  if (food.barcode) score += 5;
  if (food.fiber !== undefined && food.fiber !== null) score += 3;
  if (food.sugar !== undefined && food.sugar !== null) score += 3;
  if (food.sodium !== undefined && food.sodium !== null) score += 2;
  if (food.saturatedFat !== undefined && food.saturatedFat !== null) score += 2;
  if (food.calories > 0) score += 5;
  if (food.protein > 0) score += 5;
  return score;
}

const deduplicated = [];
let dedupeCount = 0;
Object.entries(nameGroups).forEach(([name, items]) => {
  if (items.length === 1) {
    deduplicated.push(items[0]);
  } else {
    const sorted = items.sort((a, b) => scoreFood(b) - scoreFood(a));
    const keepCount = items.length > 10 ? 1 : Math.min(3, items.length);
    deduplicated.push(...sorted.slice(0, keepCount));
    
    if (items.length > keepCount) {
      dedupeCount++;
    }
  }
});

console.log(`After intelligent deduplication: ${deduplicated.length} items (reduced ${dedupeCount} food groups)`);

// Step 4: Sort alphabetically
const cleaned = deduplicated.sort((a, b) => {
  const nameA = (a.name || '').toLowerCase();
  const nameB = (b.name || '').toLowerCase();
  return nameA.localeCompare(nameB);
});

// Save
const backupPath = path.join(__dirname, '../client/src/data/comprehensive-foods.backup.json');
if (!fs.existsSync(backupPath)) {
  console.log(`Creating backup at: ${backupPath}`);
  fs.writeFileSync(backupPath, fs.readFileSync(foodsPath));
}

console.log(`Saving cleaned database...`);
fs.writeFileSync(foodsPath, JSON.stringify(cleaned, null, 2));

console.log(`\n✅ Cleanup complete!`);
console.log(`Original: ${foods.length} items`);
console.log(`Cleaned: ${cleaned.length} items`);
console.log(`Removed: ${foods.length - cleaned.length} items (${((foods.length - cleaned.length) / foods.length * 100).toFixed(1)}%)`);
