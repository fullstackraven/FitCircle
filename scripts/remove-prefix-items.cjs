const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Removing prefix items. Current size: ${foods.length} items\n`);

let organicCount = 0;
let bonelessCount = 0;
let grilledCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').trim();
  const brand = (food.brand || '').trim();
  
  // Check if name starts with "Organic" (case-insensitive)
  if (name.match(/^organic\s/i)) {
    console.log(`Removing Organic: ${food.name}${brand ? ` (Brand: ${brand})` : ''}`);
    organicCount++;
    return false;
  }
  
  // Check if name starts with "Boneless"
  if (name.match(/^boneless\s/i)) {
    console.log(`Removing Boneless: ${food.name}`);
    bonelessCount++;
    return false;
  }
  
  // Check if name starts with "Grilled"
  if (name.match(/^grilled\s/i)) {
    console.log(`Removing Grilled: ${food.name}`);
    grilledCount++;
    return false;
  }
  
  return true;
});

console.log(`\n=== Removal Summary ===`);
console.log(`Organic items removed: ${organicCount}`);
console.log(`Boneless items removed: ${bonelessCount}`);
console.log(`Grilled items removed: ${grilledCount}`);
console.log(`Total items removed: ${organicCount + bonelessCount + grilledCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Prefix cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
