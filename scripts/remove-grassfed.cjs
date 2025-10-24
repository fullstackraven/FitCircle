const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Removing Grass-fed non-meat items. Current size: ${foods.length} items\n`);

// Common meat terms
const meats = [
  'beef', 'steak', 'ribeye', 'sirloin', 'brisket', 'tenderloin', 'short ribs',
  'ground beef', 'chuck', 'flank', 'round', 't-bone', 'porterhouse',
  'lamb', 'mutton', 'veal', 'bison', 'buffalo', 'venison', 'elk', 'goat'
];

let removedCount = 0;
let keptMeatCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').trim();
  
  // Check if name starts with "Grass-fed"
  if (name.match(/^grass-fed\s/i)) {
    const nameLower = name.toLowerCase();
    
    // Check if it's a meat
    const isMeat = meats.some(meat => nameLower.includes(meat));
    
    if (isMeat) {
      console.log(`Keeping meat: ${food.name}`);
      keptMeatCount++;
      return true;
    } else {
      console.log(`Removing non-meat: ${food.name}`);
      removedCount++;
      return false;
    }
  }
  
  return true;
});

console.log(`\n=== Removal Summary ===`);
console.log(`Grass-fed non-meat items removed: ${removedCount}`);
console.log(`Grass-fed meat items kept: ${keptMeatCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Grass-fed cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
