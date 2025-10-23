const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Aggressive cleanup. Current size: ${foods.length} items\n`);

// All cooking methods
const cookingMethods = [
  'baked', 'boiled', 'steamed', 'grilled', 'fried', 'pan-fried', 'pan fried',
  'deep-fried', 'deep fried', 'roasted', 'sautéed', 'sauteed', 'braised',
  'poached', 'smoked', 'raw', 'fresh', 'organic', 'frozen', 'canned',
  'dried', 'pickled', 'fermented', 'marinated', 'seasoned', 'spiced',
  'salted', 'unsalted', 'sweetened', 'unsweetened', 'flavored', 'plain'
];

// All liquids and drinks
const liquids = [
  'water', 'milk', 'juice', 'soda', 'pop', 'cola', 'beer', 'wine', 'champagne',
  'whiskey', 'vodka', 'rum', 'gin', 'tequila', 'brandy', 'cognac', 'sake',
  'coffee', 'tea', 'latte', 'cappuccino', 'espresso', 'mocha', 'americano',
  'macchiato', 'smoothie', 'shake', 'milkshake', 'lemonade', 'soda water',
  'tonic water', 'sparkling water', 'club soda', 'broth', 'stock', 'bouillon',
  'soup', 'gravy', 'syrup', 'honey', 'molasses', 'nectar', 'cider',
  'eggnog', 'horchata', 'lassi', 'kefir', 'kombucha', 'energy drink',
  'sports drink', 'protein shake', 'apple juice', 'orange juice',
  'grape juice', 'cranberry juice', 'tomato juice', 'grapefruit juice',
  'pineapple juice', 'pomegranate juice', 'almond milk', 'soy milk',
  'oat milk', 'coconut milk', 'rice milk', 'cashew milk', 'hemp milk',
  'skim milk', 'whole milk', '1% milk', '2% milk', 'chocolate milk',
  'buttermilk', 'cream', 'half and half', 'whipping cream', 'heavy cream',
  'green tea', 'black tea', 'white tea', 'oolong tea', 'chai tea',
  'herbal tea', 'iced tea', 'sweet tea', 'red wine', 'white wine',
  'rosé wine', 'light beer', 'dark beer', 'ale', 'lager', 'stout',
  'porter', 'ipa'
];

let removeCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Check for cooking method + liquid combinations
  for (const method of cookingMethods) {
    for (const liquid of liquids) {
      // Check various patterns
      if (name.includes(`${method} ${liquid}`) ||
          name.includes(`${liquid} ${method}`) ||
          name.includes(`${method}-${liquid}`) ||
          name.includes(`${liquid}-${method}`)) {
        console.log(`Removing nonsensical: ${food.name}`);
        removeCount++;
        return false;
      }
    }
  }
  
  return true;
});

console.log(`\nTotal items removed: ${removeCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Aggressive cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
