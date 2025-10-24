const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Removing Skinless items. Current size: ${foods.length} items\n`);

let skinlessCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').trim();
  
  // Check if name starts with "Skinless"
  if (name.match(/^skinless\s/i)) {
    console.log(`Removing: ${food.name}`);
    skinlessCount++;
    return false;
  }
  
  return true;
});

console.log(`\n=== Removal Summary ===`);
console.log(`Skinless items removed: ${skinlessCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Skinless cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
