const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Removing multiple prefix items. Current size: ${foods.length} items\n`);

const prefixes = [
  'Restaurant Style',
  'Roasted',
  'Gourmet',
  'Pan-fried',
  'Pan fried',
  'Free Range',
  'Free-range',
  'Baked'
];

const counts = {};
prefixes.forEach(p => counts[p] = 0);
let totalRemoved = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').trim();
  
  for (const prefix of prefixes) {
    const regex = new RegExp(`^${prefix}\\s`, 'i');
    if (name.match(regex)) {
      console.log(`Removing ${prefix}: ${food.name}`);
      counts[prefix]++;
      totalRemoved++;
      return false;
    }
  }
  
  return true;
});

console.log(`\n=== Removal Summary ===`);
Object.keys(counts).forEach(prefix => {
  if (counts[prefix] > 0) {
    console.log(`${prefix} items removed: ${counts[prefix]}`);
  }
});
console.log(`\nTotal items removed: ${totalRemoved}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Multiple prefix cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
