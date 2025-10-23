const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Starting cleanup. Current size: ${foods.length} items\n`);

// Legitimate "grass-fed" items (only meat and dairy)
const legitimateGrassFed = [
  'beef', 'steak', 'brisket', 'ribeye', 'sirloin', 'tenderloin', 'ground beef',
  'burger', 'cow', 'cattle', 'veal', 'lamb', 'goat', 'bison', 'buffalo',
  'milk', 'cheese', 'butter', 'yogurt', 'cream', 'dairy', 'whey'
];

// Legitimate "free-range" items (only poultry and eggs)
const legitimateFreeRange = [
  'chicken', 'turkey', 'duck', 'goose', 'egg', 'poultry', 'hen'
];

// Legitimate "boiled" items
const legitimateBoiled = [
  'egg', 'potato', 'sweet potato', 'corn', 'carrot', 'broccoli', 'cabbage',
  'spinach', 'kale', 'green beans', 'peas', 'beet', 'turnip', 'rice',
  'pasta', 'noodle', 'spaghetti', 'macaroni', 'shrimp', 'lobster', 'crab',
  'chicken', 'peanut', 'edamame', 'artichoke', 'asparagus', 'brussels sprouts',
  'cauliflower', 'beans', 'lentils', 'chickpeas', 'dumpling'
];

// Things that should never be boiled
const neverBoiled = [
  'water', 'milk', 'juice', 'soda', 'wine', 'beer', 'champagne', 'coffee',
  'tea', 'oil', 'butter', 'cheese', 'bread', 'cake', 'cookie', 'cracker',
  'chip', 'cereal', 'granola', 'yogurt', 'smoothie', 'shake'
];

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Check for nonsensical "grass-fed" items
  if (name.includes('grass-fed') || name.includes('grass fed')) {
    const isLegitimate = legitimateGrassFed.some(item => name.includes(item));
    if (!isLegitimate) {
      console.log(`Removing nonsensical grass-fed: ${food.name}`);
      return false;
    }
  }
  
  // Check for nonsensical "free-range" items
  if (name.includes('free-range') || name.includes('free range')) {
    const isLegitimate = legitimateFreeRange.some(item => name.includes(item));
    if (!isLegitimate) {
      console.log(`Removing nonsensical free-range: ${food.name}`);
      return false;
    }
  }
  
  // Check for nonsensical "boiled" items
  if (name.includes('boiled')) {
    // First check if it's something that should never be boiled
    const isNeverBoiled = neverBoiled.some(item => name.includes(item));
    if (isNeverBoiled) {
      console.log(`Removing nonsensical boiled: ${food.name}`);
      return false;
    }
    
    // Then check if it's a legitimate boiled item
    const isLegitimate = legitimateBoiled.some(item => name.includes(item));
    if (!isLegitimate) {
      console.log(`Removing nonsensical boiled: ${food.name}`);
      return false;
    }
  }
  
  return true;
});

console.log(`\nAfter filtering: ${filteredFoods.length} items (removed ${foods.length - filteredFoods.length})`);

// Sort
const cleaned = filteredFoods.sort((a, b) => {
  const nameA = (a.name || '').toLowerCase();
  const nameB = (b.name || '').toLowerCase();
  return nameA.localeCompare(nameB);
});

fs.writeFileSync(foodsPath, JSON.stringify(cleaned, null, 2));

console.log(`\n✅ Cleanup complete!`);
console.log(`Original: ${foods.length} items`);
console.log(`Final: ${cleaned.length} items`);
console.log(`Total removed: ${foods.length - cleaned.length} items`);
