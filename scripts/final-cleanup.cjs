const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Final cleanup. Current size: ${foods.length} items\n`);

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Remove grass-fed lettuce (clearly nonsense)
  if (name.includes('grass-fed lettuce') || name.includes('grass fed lettuce')) {
    console.log(`Removing: ${food.name}`);
    return false;
  }
  
  return true;
});

console.log(`\nAfter final cleanup: ${filteredFoods.length} items (removed ${foods.length - filteredFoods.length})`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Final cleanup complete!`);
console.log(`Database size: ${filteredFoods.length} items`);
