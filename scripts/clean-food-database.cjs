const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Starting cleanup. Current size: ${foods.length} items\n`);

// Drinks and liquids that should never be "baked"
const drinksAndLiquids = [
  'milk', 'water', 'juice', 'soda', 'beer', 'wine', 'champagne', 'whiskey',
  'vodka', 'rum', 'gin', 'tequila', 'coffee', 'tea', 'latte', 'cappuccino',
  'espresso', 'smoothie', 'shake', 'cola', 'lemonade', 'sports drink'
];

// Things that should never be "boneless"
const neverBoneless = [
  'milk', 'cheese', 'yogurt', 'butter', 'cream', 'water', 'juice', 'soda',
  'wine', 'beer', 'coffee', 'tea', 'oil', 'vinegar', 'sauce', 'bread',
  'rice', 'pasta', 'noodles', 'cereal', 'oatmeal', 'quinoa', 'flour',
  'sugar', 'salt', 'pepper', 'spice', 'herb', 'nut', 'seed', 'vegetable',
  'fruit', 'berry', 'melon', 'citrus', 'apple', 'banana', 'orange'
];

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Remove "Baked [drink/liquid]"
  const hasBakedDrink = drinksAndLiquids.some(drink => {
    return name.includes(`baked ${drink}`) || 
           name.includes(`baked ${drink}s`);
  });
  
  if (hasBakedDrink) {
    console.log(`Removing nonsensical: ${food.name}`);
    return false;
  }
  
  // Remove "Boneless [anything that never has bones]"
  if (name.includes('boneless ')) {
    const hasNonsenseBoneless = neverBoneless.some(item => 
      name.includes(item)
    );
    
    if (hasNonsenseBoneless) {
      console.log(`Removing nonsensical: ${food.name}`);
      return false;
    }
  }
  
  // Remove "Skinless Baked [anything]" - this combo is always nonsense
  if (name.includes('skinless baked')) {
    console.log(`Removing nonsensical: ${food.name}`);
    return false;
  }
  
  // Remove "Boneless Baked [drink]"
  if (name.includes('boneless baked')) {
    const hasDrink = drinksAndLiquids.some(drink => name.includes(drink));
    if (hasDrink) {
      console.log(`Removing nonsensical: ${food.name}`);
      return false;
    }
  }
  
  // Remove "Organic Baked [drink]"
  if (name.includes('organic baked')) {
    const hasDrink = drinksAndLiquids.some(drink => name.includes(drink));
    if (hasDrink) {
      console.log(`Removing nonsensical: ${food.name}`);
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
