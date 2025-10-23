const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Final scrub. Current size: ${foods.length} items\n`);

// Liquids that shouldn't be pan-fried
const liquids = [
  'water', 'milk', 'juice', 'soda', 'beer', 'wine', 'champagne', 'whiskey',
  'vodka', 'rum', 'gin', 'tequila', 'coffee', 'tea', 'latte', 'cappuccino',
  'espresso', 'smoothie', 'shake', 'cola', 'lemonade', 'broth', 'stock'
];

// Fast-food related terms
const fastFood = [
  'fast food', 'fast-food', 'fastfood', 'mcdonalds', "mcdonald's", 'burger king',
  'wendys', "wendy's", 'taco bell', 'kfc', 'subway', 'pizza hut', 'dominos',
  "domino's", 'papa johns', "papa john's", 'arbys', "arby's", 'sonic',
  'dairy queen', 'five guys', 'in-n-out', 'whataburger', 'chick-fil-a',
  'popeyes', 'chipotle', 'panera', 'jimmy johns', "jimmy john's"
];

// Deli related terms
const deli = [
  'deli ', ' deli', 'delicatessen'
];

// Bakery related terms
const bakery = [
  'bakery ', ' bakery'
];

let removeCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Pan-fried liquids
  if (name.includes('pan-fried') || name.includes('pan fried')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing pan-fried liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Fast-food items
  const hasFastFood = fastFood.some(term => name.includes(term));
  if (hasFastFood) {
    console.log(`Removing fast-food item: ${food.name}`);
    removeCount++;
    return false;
  }
  
  // Deli items
  const hasDeli = deli.some(term => name.includes(term));
  if (hasDeli) {
    console.log(`Removing deli item: ${food.name}`);
    removeCount++;
    return false;
  }
  
  // Bakery items
  const hasBakery = bakery.some(term => name.includes(term));
  if (hasBakery) {
    console.log(`Removing bakery item: ${food.name}`);
    removeCount++;
    return false;
  }
  
  return true;
});

console.log(`\nTotal items removed: ${removeCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Final scrub complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
