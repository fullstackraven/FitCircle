const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Removing Raw and Home Style items. Current size: ${foods.length} items\n`);

let rawCount = 0;
let homeStyleCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').trim();
  
  // Check if name starts with "Raw"
  if (name.match(/^raw\s/i)) {
    console.log(`Removing Raw: ${food.name}`);
    rawCount++;
    return false;
  }
  
  // Check if name starts with "Home Style"
  if (name.match(/^home style\s/i)) {
    console.log(`Removing Home Style: ${food.name}`);
    homeStyleCount++;
    return false;
  }
  
  return true;
});

console.log(`\n=== Removal Summary ===`);
console.log(`Raw items removed: ${rawCount}`);
console.log(`Home Style items removed: ${homeStyleCount}`);
console.log(`Total items removed: ${rawCount + homeStyleCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Raw and Home Style cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
