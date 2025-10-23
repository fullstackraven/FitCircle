const fs = require('fs');
const path = require('path');

const foodsPath = path.join(__dirname, '../client/src/data/comprehensive-foods.json');
const foods = JSON.parse(fs.readFileSync(foodsPath, 'utf8'));

console.log(`Comprehensive cleanup. Current size: ${foods.length} items\n`);

// Liquids and drinks
const liquids = [
  'water', 'milk', 'juice', 'soda', 'beer', 'wine', 'champagne', 'whiskey',
  'vodka', 'rum', 'gin', 'tequila', 'coffee', 'tea', 'latte', 'cappuccino',
  'espresso', 'smoothie', 'shake', 'cola', 'lemonade', 'broth', 'stock'
];

// Fruits (most shouldn't be steamed/grilled/fried)
const fruits = [
  'apple', 'banana', 'orange', 'grape', 'strawberry', 'blueberry', 'raspberry',
  'blackberry', 'cherry', 'peach', 'plum', 'pear', 'kiwi', 'mango', 'papaya',
  'watermelon', 'cantaloupe', 'honeydew', 'lemon', 'lime', 'grapefruit',
  'tangerine', 'apricot', 'nectarine', 'pomegranate', 'cranberry'
];

// Things that should never be "organic"
const neverOrganic = [
  'water', 'salt', 'pepper', 'baking soda', 'baking powder'
];

let removeCount = 0;

const filteredFoods = foods.filter(food => {
  const name = (food.name || '').toLowerCase();
  
  // Steamed liquids
  if (name.includes('steamed')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing steamed liquid: ${food.name}`);
      removeCount++;
      return false;
    }
    
    // Steamed fruits (except apples/pears which can be steamed)
    const inappropriateFruits = fruits.filter(f => !['apple', 'pear'].includes(f));
    const hasFruit = inappropriateFruits.some(f => name.includes(f));
    if (hasFruit) {
      console.log(`Removing steamed fruit: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Grilled liquids
  if (name.includes('grilled')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing grilled liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Fried liquids
  if (name.includes('fried')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing fried liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Roasted liquids
  if (name.includes('roasted')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing roasted liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Sautéed liquids
  if (name.includes('sautéed') || name.includes('sauteed')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing sautéed liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Braised liquids
  if (name.includes('braised')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing braised liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Organic water/salt/minerals
  if (name.includes('organic')) {
    const hasNeverOrganic = neverOrganic.some(item => name.includes(item));
    if (hasNeverOrganic) {
      console.log(`Removing nonsensical organic: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  // Smoked liquids (except things that can be smoked like salmon)
  if (name.includes('smoked')) {
    const smokableLiquids = ['salmon', 'turkey', 'chicken', 'ham', 'bacon', 'sausage', 'cheese', 'tofu', 'paprika'];
    const isSmokable = smokableLiquids.some(item => name.includes(item));
    if (!isSmokable) {
      const hasLiquid = liquids.some(l => name.includes(l));
      if (hasLiquid) {
        console.log(`Removing smoked liquid: ${food.name}`);
        removeCount++;
        return false;
      }
    }
  }
  
  // Poached liquids
  if (name.includes('poached')) {
    const hasLiquid = liquids.some(l => name.includes(l));
    if (hasLiquid) {
      console.log(`Removing poached liquid: ${food.name}`);
      removeCount++;
      return false;
    }
  }
  
  return true;
});

console.log(`\nTotal items removed: ${removeCount}`);
console.log(`After cleanup: ${filteredFoods.length} items`);

fs.writeFileSync(foodsPath, JSON.stringify(filteredFoods, null, 2));

console.log(`\n✅ Comprehensive cleanup complete!`);
console.log(`Final database size: ${filteredFoods.length} items`);
