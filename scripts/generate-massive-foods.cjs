// Script to generate comprehensive food database with 10k+ items
const fs = require('fs');

// Expanded food categories with realistic nutrition data
const foodCategories = {
  proteins: [
    { name: "Chicken Breast", calories: 165, carbs: 0, protein: 31, fat: 3.6, sodium: 74 },
    { name: "Chicken Thigh", calories: 209, carbs: 0, protein: 26, fat: 11, sodium: 84 },
    { name: "Chicken Wings", calories: 203, carbs: 0, protein: 30, fat: 8.1, sodium: 82 },
    { name: "Chicken Drumstick", calories: 172, carbs: 0, protein: 28, fat: 5.7, sodium: 81 },
    { name: "Ground Beef (80% lean)", calories: 254, carbs: 0, protein: 26, fat: 17, sodium: 66 },
    { name: "Ground Beef (85% lean)", calories: 215, carbs: 0, protein: 26, fat: 12, sodium: 66 },
    { name: "Ground Beef (90% lean)", calories: 184, carbs: 0, protein: 26, fat: 8, sodium: 66 },
    { name: "Ground Beef (93% lean)", calories: 152, carbs: 0, protein: 26, fat: 5, sodium: 66 },
    { name: "Beef Sirloin", calories: 271, carbs: 0, protein: 31, fat: 15, sodium: 60 },
    { name: "Beef Ribeye", calories: 291, carbs: 0, protein: 25, fat: 21, sodium: 54 },
    { name: "Beef Tenderloin", calories: 247, carbs: 0, protein: 26, fat: 15, sodium: 50 },
    { name: "Beef Brisket", calories: 217, carbs: 0, protein: 29, fat: 10, sodium: 58 },
    { name: "Beef Short Ribs", calories: 471, carbs: 0, protein: 18, fat: 43, sodium: 43 },
    { name: "Pork Chop", calories: 231, carbs: 0, protein: 25, fat: 14, sodium: 58 },
    { name: "Pork Tenderloin", calories: 143, carbs: 0, protein: 26, fat: 4, sodium: 62 },
    { name: "Ground Pork", calories: 297, carbs: 0, protein: 21, fat: 23, sodium: 62 },
    { name: "Pork Shoulder", calories: 294, carbs: 0, protein: 20, fat: 23, sodium: 58 },
    { name: "Pork Ribs", calories: 361, carbs: 0, protein: 19, fat: 32, sodium: 72 },
    { name: "Bacon", calories: 541, carbs: 1.4, protein: 37, fat: 42, sodium: 1717 },
    { name: "Ham", calories: 145, carbs: 1.5, protein: 21, fat: 5.5, sodium: 1203 },
    { name: "Turkey Breast", calories: 135, carbs: 0, protein: 30, fat: 1, sodium: 63 },
    { name: "Ground Turkey", calories: 189, carbs: 0, protein: 27, fat: 8, sodium: 85 },
    { name: "Turkey Leg", calories: 208, carbs: 0, protein: 28, fat: 10, sodium: 99 },
    { name: "Duck Breast", calories: 201, carbs: 0, protein: 23, fat: 11, sodium: 89 },
    { name: "Duck Leg", calories: 287, carbs: 0, protein: 19, fat: 23, sodium: 67 },
    { name: "Lamb Chop", calories: 294, carbs: 0, protein: 25, fat: 21, sodium: 72 },
    { name: "Lamb Leg", calories: 234, carbs: 0, protein: 31, fat: 11, sodium: 65 },
    { name: "Venison", calories: 158, carbs: 0, protein: 30, fat: 3.2, sodium: 51 },
    { name: "Bison", calories: 146, carbs: 0, protein: 28, fat: 2.4, sodium: 55 },
    { name: "Salmon", calories: 208, carbs: 0, protein: 22, fat: 12, sodium: 59 },
    { name: "Tuna", calories: 116, carbs: 0, protein: 26, fat: 1, sodium: 247 },
    { name: "Cod", calories: 82, carbs: 0, protein: 18, fat: 0.7, sodium: 54 },
    { name: "Tilapia", calories: 96, carbs: 0, protein: 20, fat: 2, sodium: 52 },
    { name: "Halibut", calories: 111, carbs: 0, protein: 23, fat: 2, sodium: 54 },
    { name: "Mahi Mahi", calories: 85, carbs: 0, protein: 18, fat: 0.7, sodium: 88 },
    { name: "Swordfish", calories: 121, carbs: 0, protein: 20, fat: 4, sodium: 90 },
    { name: "Mackerel", calories: 205, carbs: 0, protein: 19, fat: 14, sodium: 83 },
    { name: "Sardines", calories: 208, carbs: 0, protein: 25, fat: 11, sodium: 307 },
    { name: "Anchovies", calories: 131, carbs: 0, protein: 20, fat: 4.8, sodium: 3668 },
    { name: "Shrimp", calories: 99, carbs: 0.2, protein: 24, fat: 0.3, sodium: 111 },
    { name: "Crab", calories: 97, carbs: 0, protein: 19, fat: 2, sodium: 711 },
    { name: "Lobster", calories: 89, carbs: 0, protein: 19, fat: 0.9, sodium: 296 },
    { name: "Scallops", calories: 88, carbs: 0, protein: 17, fat: 0.8, sodium: 392 },
    { name: "Oysters", calories: 68, carbs: 4, protein: 7, fat: 2.5, sodium: 211 },
    { name: "Mussels", calories: 86, carbs: 4, protein: 12, fat: 2.2, sodium: 286 },
    { name: "Clams", calories: 86, carbs: 5, protein: 15, fat: 1, sodium: 1022 },
    { name: "Eggs", calories: 155, carbs: 1.1, protein: 13, fat: 11, sodium: 124 },
    { name: "Egg Whites", calories: 52, carbs: 0.7, protein: 11, fat: 0.2, sodium: 166 },
    { name: "Tofu (Firm)", calories: 144, carbs: 3, protein: 17, fat: 9, sodium: 7 },
    { name: "Tofu (Silken)", calories: 61, carbs: 2, protein: 6.2, fat: 3.7, sodium: 7 },
    { name: "Tempeh", calories: 192, carbs: 9, protein: 20, fat: 11, sodium: 9 },
    { name: "Seitan", calories: 370, carbs: 14, protein: 75, fat: 1.9, sodium: 29 },
    { name: "Greek Yogurt", calories: 59, carbs: 3.6, protein: 10, fat: 0.4, sodium: 36 },
    { name: "Cottage Cheese", calories: 98, carbs: 3.4, protein: 11, fat: 4.3, sodium: 364 },
    { name: "Protein Powder", calories: 103, carbs: 1, protein: 25, fat: 0.5, sodium: 50 }
  ],
  
  grains: [
    { name: "White Rice", calories: 130, carbs: 28, protein: 2.7, fat: 0.3, sodium: 1 },
    { name: "Brown Rice", calories: 112, carbs: 23, protein: 2.6, fat: 0.9, sodium: 7 },
    { name: "Wild Rice", calories: 101, carbs: 21, protein: 4, fat: 0.3, sodium: 3 },
    { name: "Jasmine Rice", calories: 129, carbs: 28, protein: 2.9, fat: 0.2, sodium: 1 },
    { name: "Basmati Rice", calories: 121, carbs: 25, protein: 3, fat: 0.4, sodium: 2 },
    { name: "Arborio Rice", calories: 130, carbs: 29, protein: 2.4, fat: 0.3, sodium: 1 },
    { name: "Black Rice", calories: 356, carbs: 72, protein: 8.9, fat: 3.5, sodium: 6 },
    { name: "Quinoa", calories: 120, carbs: 22, protein: 4.4, fat: 1.9, sodium: 7 },
    { name: "Red Quinoa", calories: 120, carbs: 22, protein: 4.4, fat: 1.9, sodium: 7 },
    { name: "Black Quinoa", calories: 120, carbs: 22, protein: 4.4, fat: 1.9, sodium: 7 },
    { name: "Oats", calories: 389, carbs: 66, protein: 17, fat: 6.9, sodium: 2 },
    { name: "Steel Cut Oats", calories: 150, carbs: 27, protein: 5, fat: 3, sodium: 0 },
    { name: "Rolled Oats", calories: 379, carbs: 67, protein: 13, fat: 6.5, sodium: 6 },
    { name: "Instant Oats", calories: 379, carbs: 68, protein: 13, fat: 6.3, sodium: 6 },
    { name: "Barley", calories: 123, carbs: 28, protein: 2.3, fat: 0.4, sodium: 9 },
    { name: "Pearl Barley", calories: 123, carbs: 28, protein: 2.3, fat: 0.4, sodium: 9 },
    { name: "Bulgur Wheat", calories: 83, carbs: 19, protein: 3, fat: 0.2, sodium: 5 },
    { name: "Couscous", calories: 112, carbs: 23, protein: 3.8, fat: 0.2, sodium: 5 },
    { name: "Israeli Couscous", calories: 176, carbs: 36, protein: 6, fat: 0.3, sodium: 5 },
    { name: "Millet", calories: 119, carbs: 23, protein: 3.5, fat: 1.2, sodium: 3 },
    { name: "Buckwheat", calories: 92, carbs: 19, protein: 3.4, fat: 0.6, sodium: 4 },
    { name: "Amaranth", calories: 102, carbs: 19, protein: 4, fat: 1.6, sodium: 6 },
    { name: "Farro", calories: 170, carbs: 34, protein: 6, fat: 1.5, sodium: 5 },
    { name: "Spelt", calories: 338, carbs: 70, protein: 15, fat: 2.4, sodium: 8 },
    { name: "Wheat Berries", calories: 214, carbs: 45, protein: 8, fat: 1.3, sodium: 3 },
    { name: "Pasta (White)", calories: 131, carbs: 25, protein: 5, fat: 1.1, sodium: 1 },
    { name: "Pasta (Whole Wheat)", calories: 124, carbs: 26, protein: 5.3, fat: 0.5, sodium: 4 },
    { name: "Pasta (Gluten-Free)", calories: 111, carbs: 23, protein: 2.2, fat: 1.1, sodium: 4 },
    { name: "Ramen Noodles", calories: 436, carbs: 65, protein: 9.4, fat: 16, sodium: 1731 },
    { name: "Rice Noodles", calories: 192, carbs: 44, protein: 1.6, fat: 0.4, sodium: 103 },
    { name: "Soba Noodles", calories: 99, carbs: 21, protein: 5.1, fat: 0.1, sodium: 60 },
    { name: "Udon Noodles", calories: 99, carbs: 21, protein: 2.6, fat: 0.6, sodium: 181 },
    { name: "Bread (White)", calories: 265, carbs: 49, protein: 9, fat: 3.2, sodium: 681 },
    { name: "Bread (Whole Wheat)", calories: 247, carbs: 41, protein: 13, fat: 4.2, sodium: 515 },
    { name: "Sourdough Bread", calories: 289, carbs: 56, protein: 12, fat: 2.1, sodium: 590 },
    { name: "Rye Bread", calories: 259, carbs: 48, protein: 9, fat: 3.3, sodium: 603 },
    { name: "Pumpernickel Bread", calories: 250, carbs: 47, protein: 8.1, fat: 3.1, sodium: 635 },
    { name: "Bagel", calories: 245, carbs: 48, protein: 10, fat: 1.4, sodium: 430 },
    { name: "English Muffin", calories: 134, carbs: 26, protein: 4.4, fat: 1, sodium: 264 },
    { name: "Tortilla (Flour)", calories: 218, carbs: 36, protein: 6, fat: 5.8, sodium: 493 },
    { name: "Tortilla (Corn)", calories: 96, carbs: 20, protein: 2.5, fat: 1.2, sodium: 11 },
    { name: "Pita Bread", calories: 165, carbs: 33, protein: 5.5, fat: 0.7, sodium: 322 },
    { name: "Naan Bread", calories: 262, carbs: 45, protein: 9, fat: 5.1, sodium: 407 },
    { name: "Crackers", calories: 488, carbs: 60, protein: 10, fat: 22, sodium: 739 },
    { name: "Rice Cakes", calories: 35, carbs: 7, protein: 0.7, fat: 0.3, sodium: 29 },
    { name: "Cereal (Oat)", calories: 390, carbs: 56, protein: 13, fat: 12, sodium: 7 }
  ],

  fruits: [
    { name: "Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Green Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Red Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Gala Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Fuji Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Honeycrisp Apple", calories: 52, carbs: 14, protein: 0.3, fat: 0.2, sodium: 1 },
    { name: "Banana", calories: 89, carbs: 23, protein: 1.1, fat: 0.3, sodium: 1 },
    { name: "Plantain", calories: 122, carbs: 32, protein: 1.3, fat: 0.4, sodium: 4 },
    { name: "Orange", calories: 47, carbs: 12, protein: 0.9, fat: 0.1, sodium: 0 },
    { name: "Navel Orange", calories: 47, carbs: 12, protein: 0.9, fat: 0.1, sodium: 0 },
    { name: "Blood Orange", calories: 47, carbs: 12, protein: 0.9, fat: 0.1, sodium: 0 },
    { name: "Mandarin Orange", calories: 53, carbs: 13, protein: 0.8, fat: 0.3, sodium: 2 },
    { name: "Tangerine", calories: 53, carbs: 13, protein: 0.8, fat: 0.3, sodium: 2 },
    { name: "Clementine", calories: 47, carbs: 12, protein: 0.9, fat: 0.2, sodium: 1 },
    { name: "Grapes", calories: 62, carbs: 16, protein: 0.6, fat: 0.2, sodium: 2 },
    { name: "Red Grapes", calories: 62, carbs: 16, protein: 0.6, fat: 0.2, sodium: 2 },
    { name: "Green Grapes", calories: 62, carbs: 16, protein: 0.6, fat: 0.2, sodium: 2 },
    { name: "Strawberries", calories: 32, carbs: 7.7, protein: 0.7, fat: 0.3, sodium: 1 },
    { name: "Blueberries", calories: 57, carbs: 14, protein: 0.7, fat: 0.3, sodium: 1 },
    { name: "Raspberries", calories: 52, carbs: 12, protein: 1.2, fat: 0.7, sodium: 1 },
    { name: "Blackberries", calories: 43, carbs: 10, protein: 1.4, fat: 0.5, sodium: 1 },
    { name: "Cranberries", calories: 46, carbs: 12, protein: 0.4, fat: 0.1, sodium: 2 },
    { name: "Gooseberries", calories: 44, carbs: 10, protein: 0.9, fat: 0.6, sodium: 1 },
    { name: "Elderberries", calories: 73, carbs: 19, protein: 0.7, fat: 0.5, sodium: 6 },
    { name: "Watermelon", calories: 30, carbs: 8, protein: 0.6, fat: 0.2, sodium: 1 },
    { name: "Cantaloupe", calories: 34, carbs: 8, protein: 0.8, fat: 0.2, sodium: 16 },
    { name: "Honeydew", calories: 36, carbs: 9, protein: 0.5, fat: 0.1, sodium: 18 },
    { name: "Casaba Melon", calories: 28, carbs: 7, protein: 1.1, fat: 0.1, sodium: 15 },
    { name: "Pineapple", calories: 50, carbs: 13, protein: 0.5, fat: 0.1, sodium: 1 },
    { name: "Mango", calories: 60, carbs: 15, protein: 0.8, fat: 0.4, sodium: 1 },
    { name: "Papaya", calories: 43, carbs: 11, protein: 0.5, fat: 0.3, sodium: 8 },
    { name: "Kiwi", calories: 61, carbs: 15, protein: 1.1, fat: 0.5, sodium: 3 },
    { name: "Golden Kiwi", calories: 61, carbs: 15, protein: 1.1, fat: 0.5, sodium: 3 },
    { name: "Peach", calories: 39, carbs: 10, protein: 0.9, fat: 0.3, sodium: 0 },
    { name: "Nectarine", calories: 44, carbs: 11, protein: 1.1, fat: 0.3, sodium: 0 },
    { name: "Pear", calories: 57, carbs: 15, protein: 0.4, fat: 0.1, sodium: 1 },
    { name: "Asian Pear", calories: 42, carbs: 11, protein: 0.5, fat: 0.2, sodium: 0 },
    { name: "Plum", calories: 46, carbs: 11, protein: 0.7, fat: 0.3, sodium: 0 },
    { name: "Apricot", calories: 48, carbs: 11, protein: 1.4, fat: 0.4, sodium: 1 },
    { name: "Cherry", calories: 63, carbs: 16, protein: 1.1, fat: 0.2, sodium: 0 },
    { name: "Sweet Cherry", calories: 63, carbs: 16, protein: 1.1, fat: 0.2, sodium: 0 },
    { name: "Sour Cherry", calories: 50, carbs: 12, protein: 1, fat: 0.3, sodium: 3 },
    { name: "Grapefruit", calories: 42, carbs: 11, protein: 0.8, fat: 0.1, sodium: 0 },
    { name: "Pink Grapefruit", calories: 42, carbs: 11, protein: 0.8, fat: 0.1, sodium: 0 },
    { name: "Lemon", calories: 29, carbs: 9, protein: 1.1, fat: 0.3, sodium: 2 },
    { name: "Lime", calories: 30, carbs: 11, protein: 0.7, fat: 0.2, sodium: 2 },
    { name: "Pomegranate", calories: 83, carbs: 19, protein: 1.7, fat: 1.2, sodium: 3 },
    { name: "Fig", calories: 74, carbs: 19, protein: 0.8, fat: 0.3, sodium: 1 },
    { name: "Persimmon", calories: 70, carbs: 19, protein: 0.6, fat: 0.2, sodium: 1 },
    { name: "Avocado", calories: 160, carbs: 8.5, protein: 2, fat: 15, sodium: 7 },
    { name: "Coconut", calories: 354, carbs: 15, protein: 3.3, fat: 33, sodium: 20 },
    { name: "Dates", calories: 277, carbs: 75, protein: 1.8, fat: 0.2, sodium: 1 },
    { name: "Raisins", calories: 299, carbs: 79, protein: 3.1, fat: 0.5, sodium: 11 },
    { name: "Prunes", calories: 240, carbs: 64, protein: 2.2, fat: 0.4, sodium: 2 }
  ],

  vegetables: [
    { name: "Broccoli", calories: 34, carbs: 7, protein: 2.8, fat: 0.4, sodium: 33 },
    { name: "Broccolini", calories: 34, carbs: 7, protein: 2.8, fat: 0.4, sodium: 33 },
    { name: "Cauliflower", calories: 25, carbs: 5, protein: 1.9, fat: 0.3, sodium: 30 },
    { name: "Romanesco", calories: 25, carbs: 5, protein: 1.9, fat: 0.3, sodium: 30 },
    { name: "Brussels Sprouts", calories: 43, carbs: 9, protein: 3.4, fat: 0.3, sodium: 25 },
    { name: "Cabbage", calories: 25, carbs: 6, protein: 1.3, fat: 0.1, sodium: 18 },
    { name: "Red Cabbage", calories: 31, carbs: 7, protein: 1.4, fat: 0.2, sodium: 27 },
    { name: "Napa Cabbage", calories: 16, carbs: 3.2, protein: 1.2, fat: 0.2, sodium: 9 },
    { name: "Bok Choy", calories: 13, carbs: 2.2, protein: 1.5, fat: 0.2, sodium: 65 },
    { name: "Kale", calories: 49, carbs: 9, protein: 4.3, fat: 0.9, sodium: 38 },
    { name: "Curly Kale", calories: 49, carbs: 9, protein: 4.3, fat: 0.9, sodium: 38 },
    { name: "Lacinato Kale", calories: 49, carbs: 9, protein: 4.3, fat: 0.9, sodium: 38 },
    { name: "Spinach", calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, sodium: 79 },
    { name: "Baby Spinach", calories: 23, carbs: 3.6, protein: 2.9, fat: 0.4, sodium: 79 },
    { name: "Lettuce (Romaine)", calories: 17, carbs: 3.3, protein: 1.2, fat: 0.3, sodium: 8 },
    { name: "Lettuce (Iceberg)", calories: 14, carbs: 3, protein: 0.9, fat: 0.1, sodium: 10 },
    { name: "Lettuce (Butter)", calories: 13, carbs: 2.2, protein: 1.4, fat: 0.2, sodium: 5 },
    { name: "Arugula", calories: 25, carbs: 3.7, protein: 2.6, fat: 0.7, sodium: 27 },
    { name: "Watercress", calories: 11, carbs: 1.3, protein: 2.3, fat: 0.1, sodium: 41 },
    { name: "Swiss Chard", calories: 19, carbs: 3.7, protein: 1.8, fat: 0.2, sodium: 213 },
    { name: "Collard Greens", calories: 32, carbs: 5.4, protein: 3, fat: 0.6, sodium: 28 },
    { name: "Mustard Greens", calories: 27, carbs: 4.7, protein: 2.9, fat: 0.4, sodium: 25 },
    { name: "Turnip Greens", calories: 32, carbs: 7.1, protein: 1.5, fat: 0.3, sodium: 40 },
    { name: "Carrots", calories: 41, carbs: 10, protein: 0.9, fat: 0.2, sodium: 69 },
    { name: "Baby Carrots", calories: 41, carbs: 10, protein: 0.9, fat: 0.2, sodium: 69 },
    { name: "Purple Carrots", calories: 41, carbs: 10, protein: 0.9, fat: 0.2, sodium: 69 },
    { name: "Sweet Potato", calories: 86, carbs: 20, protein: 1.6, fat: 0.1, sodium: 5 },
    { name: "Purple Sweet Potato", calories: 86, carbs: 20, protein: 1.6, fat: 0.1, sodium: 5 },
    { name: "Regular Potato", calories: 77, carbs: 17, protein: 2, fat: 0.1, sodium: 6 },
    { name: "Red Potato", calories: 70, carbs: 16, protein: 1.9, fat: 0.1, sodium: 6 },
    { name: "Yukon Gold Potato", calories: 77, carbs: 17, protein: 2, fat: 0.1, sodium: 6 },
    { name: "Fingerling Potato", calories: 77, carbs: 17, protein: 2, fat: 0.1, sodium: 6 },
    { name: "Bell Pepper (Red)", calories: 31, carbs: 7, protein: 1, fat: 0.3, sodium: 4 },
    { name: "Bell Pepper (Green)", calories: 20, carbs: 5, protein: 0.9, fat: 0.2, sodium: 3 },
    { name: "Bell Pepper (Yellow)", calories: 27, carbs: 6, protein: 1, fat: 0.2, sodium: 2 },
    { name: "Bell Pepper (Orange)", calories: 31, carbs: 7, protein: 1, fat: 0.3, sodium: 4 },
    { name: "Jalapeño", calories: 29, carbs: 6, protein: 0.9, fat: 0.4, sodium: 3 },
    { name: "Serrano Pepper", calories: 32, carbs: 7, protein: 1.7, fat: 0.4, sodium: 11 },
    { name: "Habanero", calories: 40, carbs: 9, protein: 1.9, fat: 0.4, sodium: 8 },
    { name: "Poblano Pepper", calories: 20, carbs: 4, protein: 1, fat: 0.1, sodium: 3 },
    { name: "Tomato", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, sodium: 5 },
    { name: "Cherry Tomato", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, sodium: 5 },
    { name: "Roma Tomato", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, sodium: 5 },
    { name: "Heirloom Tomato", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, sodium: 5 },
    { name: "Grape Tomato", calories: 18, carbs: 3.9, protein: 0.9, fat: 0.2, sodium: 5 },
    { name: "Cucumber", calories: 16, carbs: 4, protein: 0.7, fat: 0.1, sodium: 2 },
    { name: "English Cucumber", calories: 16, carbs: 4, protein: 0.7, fat: 0.1, sodium: 2 },
    { name: "Persian Cucumber", calories: 16, carbs: 4, protein: 0.7, fat: 0.1, sodium: 2 },
    { name: "Zucchini", calories: 17, carbs: 3.1, protein: 1.2, fat: 0.3, sodium: 8 },
    { name: "Yellow Squash", calories: 20, carbs: 4.3, protein: 0.9, fat: 0.2, sodium: 2 },
    { name: "Butternut Squash", calories: 45, carbs: 12, protein: 1, fat: 0.1, sodium: 4 },
    { name: "Acorn Squash", calories: 56, carbs: 15, protein: 1.1, fat: 0.1, sodium: 4 },
    { name: "Delicata Squash", calories: 30, carbs: 7, protein: 1.2, fat: 0.1, sodium: 5 },
    { name: "Spaghetti Squash", calories: 31, carbs: 7, protein: 0.6, fat: 0.6, sodium: 17 },
    { name: "Eggplant", calories: 25, carbs: 6, protein: 1, fat: 0.2, sodium: 2 },
    { name: "Japanese Eggplant", calories: 25, carbs: 6, protein: 1, fat: 0.2, sodium: 2 },
    { name: "Onion", calories: 40, carbs: 9, protein: 1.1, fat: 0.1, sodium: 4 },
    { name: "Yellow Onion", calories: 40, carbs: 9, protein: 1.1, fat: 0.1, sodium: 4 },
    { name: "Red Onion", calories: 40, carbs: 9, protein: 1.1, fat: 0.1, sodium: 4 },
    { name: "White Onion", calories: 40, carbs: 9, protein: 1.1, fat: 0.1, sodium: 4 },
    { name: "Sweet Onion", calories: 32, carbs: 7.6, protein: 0.9, fat: 0.1, sodium: 3 },
    { name: "Shallot", calories: 72, carbs: 17, protein: 2.5, fat: 0.1, sodium: 12 },
    { name: "Green Onion", calories: 32, carbs: 7.3, protein: 1.8, fat: 0.2, sodium: 16 },
    { name: "Leek", calories: 61, carbs: 14, protein: 1.5, fat: 0.3, sodium: 20 },
    { name: "Garlic", calories: 149, carbs: 33, protein: 6.4, fat: 0.5, sodium: 17 },
    { name: "Ginger", calories: 80, carbs: 18, protein: 1.8, fat: 0.8, sodium: 13 },
    { name: "Mushrooms", calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, sodium: 5 },
    { name: "Button Mushrooms", calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, sodium: 5 },
    { name: "Cremini Mushrooms", calories: 22, carbs: 3.3, protein: 3.1, fat: 0.3, sodium: 5 },
    { name: "Portobello Mushrooms", calories: 22, carbs: 3.9, protein: 2.1, fat: 0.4, sodium: 9 },
    { name: "Shiitake Mushrooms", calories: 34, carbs: 7, protein: 2.2, fat: 0.5, sodium: 9 },
    { name: "Oyster Mushrooms", calories: 33, carbs: 6.1, protein: 3.3, fat: 0.4, sodium: 18 },
    { name: "Maitake Mushrooms", calories: 31, carbs: 7, protein: 1.9, fat: 0.2, sodium: 1 },
    { name: "Asparagus", calories: 20, carbs: 3.9, protein: 2.2, fat: 0.1, sodium: 2 },
    { name: "Green Beans", calories: 31, carbs: 7, protein: 1.8, fat: 0.2, sodium: 6 },
    { name: "Snap Peas", calories: 42, carbs: 7.6, protein: 2.8, fat: 0.2, sodium: 4 },
    { name: "Snow Peas", calories: 42, carbs: 7.6, protein: 2.8, fat: 0.2, sodium: 4 },
    { name: "Peas", calories: 81, carbs: 14, protein: 5.4, fat: 0.4, sodium: 5 },
    { name: "Corn", calories: 86, carbs: 19, protein: 3.3, fat: 1.4, sodium: 15 },
    { name: "Sweet Corn", calories: 86, carbs: 19, protein: 3.3, fat: 1.4, sodium: 15 },
    { name: "Baby Corn", calories: 25, carbs: 5, protein: 2.9, fat: 0.3, sodium: 4 },
    { name: "Celery", calories: 16, carbs: 3, protein: 0.7, fat: 0.2, sodium: 80 },
    { name: "Fennel", calories: 31, carbs: 7.3, protein: 1.2, fat: 0.2, sodium: 52 },
    { name: "Radish", calories: 16, carbs: 2, protein: 0.7, fat: 0.1, sodium: 39 },
    { name: "Turnip", calories: 28, carbs: 6.4, protein: 0.9, fat: 0.1, sodium: 67 },
    { name: "Beet", calories: 43, carbs: 10, protein: 1.6, fat: 0.2, sodium: 78 },
    { name: "Parsnip", calories: 75, carbs: 18, protein: 1.2, fat: 0.3, sodium: 10 }
  ],

  nuts_seeds: [
    { name: "Almonds", calories: 575, carbs: 21, protein: 21, fat: 50, sodium: 1 },
    { name: "Raw Almonds", calories: 575, carbs: 21, protein: 21, fat: 50, sodium: 1 },
    { name: "Roasted Almonds", calories: 590, carbs: 22, protein: 22, fat: 52, sodium: 1 },
    { name: "Salted Almonds", calories: 590, carbs: 22, protein: 22, fat: 52, sodium: 268 },
    { name: "Sliced Almonds", calories: 575, carbs: 21, protein: 21, fat: 50, sodium: 1 },
    { name: "Almond Flour", calories: 650, carbs: 10, protein: 25, fat: 60, sodium: 3 },
    { name: "Walnuts", calories: 654, carbs: 14, protein: 15, fat: 65, sodium: 2 },
    { name: "English Walnuts", calories: 654, carbs: 14, protein: 15, fat: 65, sodium: 2 },
    { name: "Black Walnuts", calories: 618, carbs: 10, protein: 24, fat: 59, sodium: 2 },
    { name: "Pistachios", calories: 557, carbs: 28, protein: 20, fat: 45, sodium: 1 },
    { name: "Roasted Pistachios", calories: 567, carbs: 28, protein: 21, fat: 46, sodium: 6 },
    { name: "Salted Pistachios", calories: 567, carbs: 28, protein: 21, fat: 46, sodium: 526 },
    { name: "Cashews", calories: 553, carbs: 30, protein: 18, fat: 44, sodium: 12 },
    { name: "Raw Cashews", calories: 553, carbs: 30, protein: 18, fat: 44, sodium: 12 },
    { name: "Roasted Cashews", calories: 574, carbs: 33, protein: 16, fat: 46, sodium: 16 },
    { name: "Salted Cashews", calories: 574, carbs: 33, protein: 16, fat: 46, sodium: 640 },
    { name: "Pecans", calories: 691, carbs: 14, protein: 9, fat: 72, sodium: 0 },
    { name: "Pecan Halves", calories: 691, carbs: 14, protein: 9, fat: 72, sodium: 0 },
    { name: "Brazil Nuts", calories: 656, carbs: 12, protein: 14, fat: 66, sodium: 3 },
    { name: "Hazelnuts", calories: 628, carbs: 17, protein: 15, fat: 61, sodium: 0 },
    { name: "Filberts", calories: 628, carbs: 17, protein: 15, fat: 61, sodium: 0 },
    { name: "Macadamia Nuts", calories: 718, carbs: 14, protein: 8, fat: 76, sodium: 5 },
    { name: "Pine Nuts", calories: 673, carbs: 13, protein: 14, fat: 68, sodium: 2 },
    { name: "Peanuts", calories: 567, carbs: 16, protein: 26, fat: 49, sodium: 18 },
    { name: "Raw Peanuts", calories: 567, carbs: 16, protein: 26, fat: 49, sodium: 18 },
    { name: "Roasted Peanuts", calories: 587, carbs: 17, protein: 24, fat: 50, sodium: 6 },
    { name: "Salted Peanuts", calories: 587, carbs: 17, protein: 24, fat: 50, sodium: 591 },
    { name: "Peanut Butter", calories: 588, carbs: 20, protein: 25, fat: 50, sodium: 17 },
    { name: "Almond Butter", calories: 614, carbs: 19, protein: 21, fat: 56, sodium: 5 },
    { name: "Sunflower Seeds", calories: 584, carbs: 20, protein: 21, fat: 51, sodium: 9 },
    { name: "Hulled Sunflower Seeds", calories: 584, carbs: 20, protein: 21, fat: 51, sodium: 9 },
    { name: "Salted Sunflower Seeds", calories: 584, carbs: 20, protein: 21, fat: 51, sodium: 2362 },
    { name: "Pumpkin Seeds", calories: 559, carbs: 11, protein: 30, fat: 49, sodium: 7 },
    { name: "Pepitas", calories: 559, carbs: 11, protein: 30, fat: 49, sodium: 7 },
    { name: "Chia Seeds", calories: 486, carbs: 42, protein: 17, fat: 31, sodium: 16 },
    { name: "Black Chia Seeds", calories: 486, carbs: 42, protein: 17, fat: 31, sodium: 16 },
    { name: "White Chia Seeds", calories: 486, carbs: 42, protein: 17, fat: 31, sodium: 16 },
    { name: "Flax Seeds", calories: 534, carbs: 29, protein: 18, fat: 42, sodium: 30 },
    { name: "Ground Flax Seeds", calories: 534, carbs: 29, protein: 18, fat: 42, sodium: 30 },
    { name: "Hemp Seeds", calories: 553, carbs: 9, protein: 31, fat: 49, sodium: 5 },
    { name: "Hemp Hearts", calories: 553, carbs: 9, protein: 31, fat: 49, sodium: 5 },
    { name: "Sesame Seeds", calories: 573, carbs: 23, protein: 18, fat: 50, sodium: 11 },
    { name: "Tahini", calories: 595, carbs: 18, protein: 17, fat: 54, sodium: 115 },
    { name: "Poppy Seeds", calories: 525, carbs: 28, protein: 18, fat: 42, sodium: 26 }
  ],

  beverages: [
    { name: "Water", calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 },
    { name: "Sparkling Water", calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 0 },
    { name: "Coffee", calories: 2, carbs: 0, protein: 0.3, fat: 0, sodium: 5 },
    { name: "Black Coffee", calories: 2, carbs: 0, protein: 0.3, fat: 0, sodium: 5 },
    { name: "Espresso", calories: 9, carbs: 2, protein: 0.5, fat: 0.2, sodium: 14 },
    { name: "Americano", calories: 15, carbs: 3, protein: 1, fat: 0.2, sodium: 9 },
    { name: "Latte", calories: 103, carbs: 8, protein: 6, fat: 6, sodium: 76 },
    { name: "Cappuccino", calories: 74, carbs: 6, protein: 4, fat: 4, sodium: 55 },
    { name: "Macchiato", calories: 13, carbs: 2, protein: 0.7, fat: 0.5, sodium: 6 },
    { name: "Mocha", calories: 175, carbs: 33, protein: 9, fat: 6, sodium: 106 },
    { name: "Tea", calories: 2, carbs: 0.7, protein: 0, fat: 0, sodium: 7 },
    { name: "Green Tea", calories: 2, carbs: 0, protein: 0.5, fat: 0, sodium: 1 },
    { name: "Black Tea", calories: 2, carbs: 0.7, protein: 0, fat: 0, sodium: 7 },
    { name: "Herbal Tea", calories: 2, carbs: 0.5, protein: 0, fat: 0, sodium: 2 },
    { name: "Chai Tea", calories: 21, carbs: 4, protein: 0.4, fat: 0.7, sodium: 7 },
    { name: "Matcha", calories: 5, carbs: 1, protein: 0.6, fat: 0.1, sodium: 1 },
    { name: "Orange Juice", calories: 45, carbs: 11, protein: 0.7, fat: 0.2, sodium: 1 },
    { name: "Apple Juice", calories: 46, carbs: 11, protein: 0.1, fat: 0.1, sodium: 4 },
    { name: "Grape Juice", calories: 60, carbs: 15, protein: 0.6, fat: 0.2, sodium: 2 },
    { name: "Cranberry Juice", calories: 46, carbs: 12, protein: 0.4, fat: 0.1, sodium: 2 },
    { name: "Pomegranate Juice", calories: 54, carbs: 13, protein: 0.15, fat: 0.3, sodium: 11 },
    { name: "Coconut Water", calories: 19, carbs: 3.7, protein: 0.7, fat: 0.2, sodium: 105 },
    { name: "Sports Drink", calories: 25, carbs: 7, protein: 0, fat: 0, sodium: 41 },
    { name: "Energy Drink", calories: 45, carbs: 11, protein: 0, fat: 0, sodium: 10 },
    { name: "Soda", calories: 39, carbs: 10, protein: 0, fat: 0, sodium: 2 },
    { name: "Diet Soda", calories: 0, carbs: 0, protein: 0, fat: 0, sodium: 12 },
    { name: "Beer", calories: 43, carbs: 3.6, protein: 0.5, fat: 0, sodium: 4 },
    { name: "Light Beer", calories: 29, carbs: 1.9, protein: 0.2, fat: 0, sodium: 4 },
    { name: "Wine", calories: 83, carbs: 2.6, protein: 0.1, fat: 0, sodium: 6 },
    { name: "Red Wine", calories: 85, carbs: 2.6, protein: 0.1, fat: 0, sodium: 6 },
    { name: "White Wine", calories: 82, carbs: 2.6, protein: 0.1, fat: 0, sodium: 7 },
    { name: "Champagne", calories: 84, carbs: 1.5, protein: 0.2, fat: 0, sodium: 1 },
    { name: "Vodka", calories: 231, carbs: 0, protein: 0, fat: 0, sodium: 1 },
    { name: "Whiskey", calories: 250, carbs: 0, protein: 0, fat: 0, sodium: 1 },
    { name: "Rum", calories: 231, carbs: 0, protein: 0, fat: 0, sodium: 1 },
    { name: "Gin", calories: 231, carbs: 0, protein: 0, fat: 0, sodium: 1 },
    { name: "Tequila", calories: 231, carbs: 0, protein: 0, fat: 0, sodium: 1 }
  ],

  dairy: [
    { name: "Whole Milk", calories: 61, carbs: 4.8, protein: 3.2, fat: 3.3, sodium: 43 },
    { name: "2% Milk", calories: 50, carbs: 4.9, protein: 3.3, fat: 2, sodium: 44 },
    { name: "1% Milk", calories: 42, carbs: 5, protein: 3.4, fat: 1, sodium: 44 },
    { name: "Skim Milk", calories: 34, carbs: 5, protein: 3.4, fat: 0.2, sodium: 42 },
    { name: "Lactose-Free Milk", calories: 50, carbs: 4.9, protein: 3.3, fat: 2, sodium: 44 },
    { name: "Almond Milk", calories: 17, carbs: 1.5, protein: 0.6, fat: 1.2, sodium: 63 },
    { name: "Soy Milk", calories: 33, carbs: 1.7, protein: 3.3, fat: 1.9, sodium: 51 },
    { name: "Oat Milk", calories: 47, carbs: 7.6, protein: 1.5, fat: 1.5, sodium: 101 },
    { name: "Coconut Milk", calories: 230, carbs: 6, protein: 2.3, fat: 24, sodium: 16 },
    { name: "Rice Milk", calories: 47, carbs: 9.2, protein: 0.3, fat: 1, sodium: 54 },
    { name: "Heavy Cream", calories: 340, carbs: 2.8, protein: 2.8, fat: 36, sodium: 38 },
    { name: "Half and Half", calories: 131, carbs: 4.3, protein: 3.1, fat: 12, sodium: 44 },
    { name: "Sour Cream", calories: 193, carbs: 4.6, protein: 2.4, fat: 19, sodium: 78 },
    { name: "Butter", calories: 717, carbs: 0.1, protein: 0.9, fat: 81, sodium: 643 },
    { name: "Margarine", calories: 719, carbs: 0.9, protein: 0.2, fat: 81, sodium: 943 },
    { name: "Cream Cheese", calories: 342, carbs: 4.1, protein: 6, fat: 34, sodium: 321 },
    { name: "Ricotta Cheese", calories: 174, carbs: 3, protein: 11, fat: 13, sodium: 84 },
    { name: "Feta Cheese", calories: 264, carbs: 4.1, protein: 14, fat: 21, sodium: 1116 },
    { name: "Goat Cheese", calories: 364, carbs: 2.5, protein: 22, fat: 30, sodium: 515 },
    { name: "Blue Cheese", calories: 353, carbs: 2.3, protein: 21, fat: 29, sodium: 1395 },
    { name: "Parmesan Cheese", calories: 431, carbs: 4.1, protein: 38, fat: 29, sodium: 1804 },
    { name: "Swiss Cheese", calories: 380, carbs: 5.4, protein: 27, fat: 28, sodium: 192 },
    { name: "Provolone Cheese", calories: 351, carbs: 2.1, protein: 25, fat: 27, sodium: 876 },
    { name: "Brie Cheese", calories: 334, carbs: 0.5, protein: 21, fat: 28, sodium: 629 },
    { name: "Camembert Cheese", calories: 300, carbs: 0.5, protein: 20, fat: 24, sodium: 842 },
    { name: "Ice Cream", calories: 207, carbs: 24, protein: 3.5, fat: 11, sodium: 80 },
    { name: "Frozen Yogurt", calories: 127, carbs: 22, protein: 3, fat: 4, sodium: 63 },
    { name: "Sherbet", calories: 107, carbs: 22, protein: 1.1, fat: 1.5, sodium: 30 }
  ],

  processed_foods: [
    { name: "White Bread", calories: 265, carbs: 49, protein: 9, fat: 3.2, sodium: 681 },
    { name: "Whole Wheat Bread", calories: 247, carbs: 41, protein: 13, fat: 4.2, sodium: 515 },
    { name: "Sourdough Bread", calories: 289, carbs: 56, protein: 12, fat: 2.1, sodium: 590 },
    { name: "Bagel", calories: 245, carbs: 48, protein: 10, fat: 1.4, sodium: 430 },
    { name: "English Muffin", calories: 134, carbs: 26, protein: 4.4, fat: 1, sodium: 264 },
    { name: "Croissant", calories: 406, carbs: 46, protein: 8.2, fat: 21, sodium: 423 },
    { name: "Danish Pastry", calories: 374, carbs: 45, protein: 6.6, fat: 19, sodium: 366 },
    { name: "Donut", calories: 452, carbs: 51, protein: 4.9, fat: 25, sodium: 373 },
    { name: "Muffin", calories: 377, carbs: 55, protein: 6.7, fat: 15, sodium: 395 },
    { name: "Cookie", calories: 502, carbs: 64, protein: 5.9, fat: 25, sodium: 333 },
    { name: "Cake", calories: 257, carbs: 46, protein: 2.9, fat: 7.4, sodium: 242 },
    { name: "Pie", calories: 237, carbs: 34, protein: 2.4, fat: 11, sodium: 216 },
    { name: "Candy Bar", calories: 535, carbs: 60, protein: 7.7, fat: 31, sodium: 79 },
    { name: "Chocolate", calories: 546, carbs: 61, protein: 4.9, fat: 31, sodium: 24 },
    { name: "Gummy Bears", calories: 322, carbs: 77, protein: 6.9, fat: 0.2, sodium: 10 },
    { name: "Potato Chips", calories: 536, carbs: 50, protein: 7, fat: 35, sodium: 525 },
    { name: "Tortilla Chips", calories: 503, carbs: 61, protein: 7.8, fat: 25, sodium: 400 },
    { name: "Pretzels", calories: 380, carbs: 79, protein: 11, fat: 2.8, sodium: 1715 },
    { name: "Popcorn", calories: 375, carbs: 74, protein: 12, fat: 4.5, sodium: 7 },
    { name: "Crackers", calories: 488, carbs: 60, protein: 10, fat: 22, sodium: 739 },
    { name: "Granola Bar", calories: 471, carbs: 64, protein: 10, fat: 20, sodium: 38 },
    { name: "Protein Bar", calories: 376, carbs: 38, protein: 20, fat: 15, sodium: 189 },
    { name: "Cereal", calories: 357, carbs: 84, protein: 6.3, fat: 2.2, sodium: 729 },
    { name: "Oatmeal", calories: 68, carbs: 12, protein: 2.4, fat: 1.4, sodium: 49 },
    { name: "Pancakes", calories: 227, carbs: 28, protein: 6.2, fat: 10, sodium: 439 },
    { name: "Waffles", calories: 291, carbs: 33, protein: 7.9, fat: 14, sodium: 385 },
    { name: "French Toast", calories: 166, carbs: 17, protein: 6, fat: 7, sodium: 311 },
    { name: "Pizza", calories: 266, carbs: 33, protein: 11, fat: 10, sodium: 598 },
    { name: "Hamburger", calories: 295, carbs: 30, protein: 16, fat: 13, sodium: 396 },
    { name: "Hot Dog", calories: 290, carbs: 2, protein: 11, fat: 26, sodium: 1230 },
    { name: "Sandwich", calories: 256, carbs: 26, protein: 14, fat: 11, sodium: 729 },
    { name: "Burrito", calories: 326, carbs: 58, protein: 14, fat: 6, sodium: 739 },
    { name: "Taco", calories: 226, carbs: 21, protein: 9, fat: 11, sodium: 622 },
    { name: "French Fries", calories: 365, carbs: 63, protein: 4, fat: 17, sodium: 246 },
    { name: "Onion Rings", calories: 411, carbs: 38, protein: 5.7, fat: 27, sodium: 430 },
    { name: "Chicken Nuggets", calories: 296, carbs: 16, protein: 15, fat: 20, sodium: 540 },
    { name: "Fish Sticks", calories: 272, carbs: 18, protein: 12, fat: 18, sodium: 292 },
    { name: "Mac and Cheese", calories: 164, carbs: 20, protein: 6.4, fat: 6.5, sodium: 561 },
    { name: "Instant Noodles", calories: 385, carbs: 56, protein: 8.9, fat: 14, sodium: 1731 },
    { name: "Canned Soup", calories: 56, carbs: 8.8, protein: 2.7, fat: 1.4, sodium: 463 }
  ],

  international: [
    // Asian foods
    { name: "Sushi Rice", calories: 130, carbs: 28, protein: 2.4, fat: 0.3, sodium: 1 },
    { name: "Nori Seaweed", calories: 35, carbs: 5.1, protein: 5.8, fat: 0.3, sodium: 48 },
    { name: "Wasabi", calories: 109, carbs: 24, protein: 4.6, fat: 0.6, sodium: 17 },
    { name: "Soy Sauce", calories: 8, carbs: 0.8, protein: 1.3, fat: 0, sodium: 1005 },
    { name: "Miso Paste", calories: 199, carbs: 26, protein: 12, fat: 6, sodium: 3728 },
    { name: "Kimchi", calories: 15, carbs: 2.4, protein: 1.1, fat: 0.5, sodium: 498 },
    { name: "Tofu", calories: 76, carbs: 1.9, protein: 8, fat: 4.8, sodium: 7 },
    { name: "Edamame", calories: 121, carbs: 8.9, protein: 11, fat: 5.2, sodium: 6 },
    { name: "Mochi", calories: 96, carbs: 22, protein: 1.5, fat: 0.3, sodium: 1 },
    { name: "Dumplings", calories: 41, carbs: 4.1, protein: 2.1, fat: 2, sodium: 146 },
    { name: "Spring Rolls", calories: 100, carbs: 13, protein: 3.5, fat: 4.2, sodium: 200 },
    { name: "Pad Thai", calories: 181, carbs: 21, protein: 15, fat: 6.4, sodium: 575 },
    { name: "Fried Rice", calories: 174, carbs: 25, protein: 5.4, fat: 6.7, sodium: 329 },
    { name: "Ramen", calories: 436, carbs: 65, protein: 9.4, fat: 16, sodium: 1731 },
    { name: "Pho", calories: 404, carbs: 29, protein: 29, fat: 20, sodium: 1610 },
    { name: "Curry", calories: 165, carbs: 9.6, protein: 8.8, fat: 11, sodium: 460 },
    { name: "Tikka Masala", calories: 180, carbs: 8, protein: 14, fat: 11, sodium: 380 },
    { name: "Biryani", calories: 290, carbs: 45, protein: 8, fat: 9, sodium: 420 },
    { name: "Naan Bread", calories: 262, carbs: 45, protein: 9, fat: 5.1, sodium: 407 },
    { name: "Basmati Rice", calories: 121, carbs: 25, protein: 3, fat: 0.4, sodium: 2 },
    { name: "Garam Masala", calories: 379, carbs: 70, protein: 14, fat: 7, sodium: 107 },
    { name: "Turmeric", calories: 312, carbs: 67, protein: 10, fat: 3.2, sodium: 27 },
    
    // Mediterranean foods
    { name: "Hummus", calories: 166, carbs: 14, protein: 8, fat: 10, sodium: 379 },
    { name: "Tahini", calories: 595, carbs: 18, protein: 17, fat: 54, sodium: 115 },
    { name: "Olives", calories: 115, carbs: 6, protein: 0.8, fat: 11, sodium: 735 },
    { name: "Feta Cheese", calories: 75, carbs: 1.2, protein: 4, fat: 6, sodium: 316 },
    { name: "Pita Bread", calories: 165, carbs: 33, protein: 5.5, fat: 0.7, sodium: 322 },
    { name: "Tzatziki", calories: 61, carbs: 3.4, protein: 3.2, fat: 4.6, sodium: 166 },
    { name: "Dolmas", calories: 158, carbs: 17, protein: 3.8, fat: 8.9, sodium: 630 },
    { name: "Couscous", calories: 112, carbs: 23, protein: 3.8, fat: 0.2, sodium: 5 },
    { name: "Tabbouleh", calories: 36, carbs: 6.4, protein: 1.3, fat: 0.9, sodium: 11 },
    { name: "Baba Ganoush", calories: 132, carbs: 13, protein: 3.8, fat: 8.2, sodium: 297 },
    { name: "Falafel", calories: 333, carbs: 31, protein: 13, fat: 18, sodium: 294 },
    { name: "Shawarma", calories: 429, carbs: 23, protein: 23, fat: 27, sodium: 840 },
    { name: "Kebab", calories: 186, carbs: 2, protein: 15, fat: 13, sodium: 82 },
    
    // Mexican foods
    { name: "Avocado", calories: 160, carbs: 8.5, protein: 2, fat: 15, sodium: 7 },
    { name: "Guacamole", calories: 164, carbs: 9, protein: 2, fat: 15, sodium: 7 },
    { name: "Salsa", calories: 4, carbs: 1, protein: 0.2, fat: 0, sodium: 25 },
    { name: "Black Beans", calories: 132, carbs: 24, protein: 8.9, fat: 0.5, sodium: 2 },
    { name: "Refried Beans", calories: 91, carbs: 15, protein: 5.4, fat: 1.4, sodium: 378 },
    { name: "Cilantro", calories: 23, carbs: 3.7, protein: 2.1, fat: 0.5, sodium: 46 },
    { name: "Lime", calories: 30, carbs: 11, protein: 0.7, fat: 0.2, sodium: 2 },
    { name: "Jalapeño", calories: 29, carbs: 6, protein: 0.9, fat: 0.4, sodium: 3 },
    { name: "Corn Tortilla", calories: 96, carbs: 20, protein: 2.5, fat: 1.2, sodium: 11 },
    { name: "Flour Tortilla", calories: 218, carbs: 36, protein: 6, fat: 5.8, sodium: 493 },
    { name: "Cheese Quesadilla", calories: 240, carbs: 18, protein: 14, fat: 14, sodium: 621 },
    { name: "Chicken Quesadilla", calories: 529, carbs: 40, protein: 27, fat: 30, sodium: 1051 },
    { name: "Enchiladas", calories: 323, carbs: 30, protein: 10, fat: 19, sodium: 785 },
    { name: "Tamales", calories: 126, carbs: 11, protein: 5.3, fat: 7.3, sodium: 284 },
    { name: "Nachos", calories: 346, carbs: 36, protein: 9.8, fat: 19, sodium: 816 },
    { name: "Chili", calories: 166, carbs: 16, protein: 15, fat: 6.2, sodium: 934 },
    
    // Italian foods
    { name: "Marinara Sauce", calories: 29, carbs: 7, protein: 1.6, fat: 0.2, sodium: 431 },
    { name: "Pesto", calories: 263, carbs: 5.1, protein: 3.5, fat: 25, sodium: 40 },
    { name: "Parmesan Cheese", calories: 431, carbs: 4.1, protein: 38, fat: 29, sodium: 1804 },
    { name: "Mozzarella", calories: 300, carbs: 2.2, protein: 22, fat: 22, sodium: 627 },
    { name: "Prosciutto", calories: 335, carbs: 0, protein: 25, fat: 25, sodium: 2340 },
    { name: "Pancetta", calories: 563, carbs: 0, protein: 21, fat: 53, sodium: 1555 },
    { name: "Risotto", calories: 166, carbs: 20, protein: 4.4, fat: 7.3, sodium: 286 },
    { name: "Gnocchi", calories: 131, carbs: 32, protein: 4.4, fat: 0.2, sodium: 201 },
    { name: "Lasagna", calories: 135, carbs: 8.6, protein: 8.2, fat: 7.5, sodium: 340 },
    { name: "Ravioli", calories: 175, carbs: 31, protein: 7.3, fat: 2.6, sodium: 348 },
    { name: "Fettuccine Alfredo", calories: 543, carbs: 57, protein: 19, fat: 26, sodium: 924 },
    { name: "Carbonara", calories: 367, carbs: 25, protein: 13, fat: 25, sodium: 423 },
    { name: "Minestrone", calories: 82, carbs: 11, protein: 4.3, fat: 2.8, sodium: 911 },
    { name: "Bruschetta", calories: 194, carbs: 29, protein: 6.6, fat: 6.3, sodium: 335 },
    { name: "Focaccia", calories: 251, carbs: 41, protein: 7.9, fat: 6.6, sodium: 536 },
    { name: "Tiramisu", calories: 240, carbs: 19, protein: 4.4, fat: 16, sodium: 76 },
    { name: "Gelato", calories: 160, carbs: 18, protein: 4, fat: 8, sodium: 55 }
  ]
};

// Expanded brands for variety
const brands = [
  "", "Organic Valley", "Whole Foods", "Trader Joe's", "Fresh Market", "Local Farm", 
  "Nature's Best", "Farm Fresh", "Premium Choice", "Healthy Harvest", "Garden Fresh",
  "Pure Foods", "Simple Truth", "365 Everyday Value", "Great Value", "Kroger",
  "Safeway", "Stop & Shop", "Publix", "H-E-B", "Wegmans", "Costco", "Sam's Club",
  "Target", "Walmart", "Aldi", "Food Lion", "Winn-Dixie", "ShopRite", "Giant",
  "Harris Teeter", "Fresh Direct", "Instacart", "Amazon Fresh", "Blue Apron",
  "HelloFresh", "Meal Kit", "Farm to Table", "Artisan", "Gourmet", "Premium",
  "Select", "Choice", "Natural", "Organic", "Free Range", "Grass Fed", "Wild Caught",
  "Sustainable", "Fair Trade", "Non-GMO", "Gluten Free", "Dairy Free", "Vegan"
];

// Expanded cooking methods and variations
const cookingMethods = [
  "", "Grilled", "Baked", "Roasted", "Steamed", "Boiled", "Pan-fried", 
  "Raw", "Sautéed", "Braised", "Poached", "Smoked", "Marinaded",
  "Air-fried", "Deep-fried", "Slow-cooked", "Pressure-cooked", "Broiled",
  "Stir-fried", "Blackened", "Barbecued", "Charred", "Caramelized",
  "Blanched", "Pickled", "Fermented", "Cured", "Dried", "Dehydrated"
];

const preparations = [
  "", "Skinless", "Boneless", "Organic", "Free-range", "Grass-fed", 
  "Wild-caught", "Fresh", "Frozen", "Canned", "Dried", "Low-sodium",
  "Unsalted", "Extra virgin", "Cold-pressed", "Unprocessed", "Raw",
  "Pasteurized", "Unpasteurized", "Aged", "Smoked", "Seasoned",
  "Marinated", "Stuffed", "Breaded", "Seasoned", "Spiced", "Herbed",
  "Glazed", "Crusted", "Wrapped", "Filled", "Topped", "Layered"
];

const servingSizes = [
  { unit: "g", sizes: [25, 28, 30, 50, 85, 100, 113, 150, 200, 250, 300] },
  { unit: "ml", sizes: [50, 100, 120, 150, 200, 240, 250, 300, 350, 400, 500] },
  { unit: "cup", sizes: [0.25, 0.33, 0.5, 0.75, 1, 1.25, 1.5, 2] },
  { unit: "piece", sizes: [1, 2, 3, 4, 5, 6] },
  { unit: "slice", sizes: [1, 2, 3, 4] },
  { unit: "serving", sizes: [1, 1.5, 2, 2.5, 3] }
];

function generateMassiveFoodDatabase() {
  const foods = [];
  let id = 1;

  // Generate foods for each category
  Object.entries(foodCategories).forEach(([category, baseFoods]) => {
    baseFoods.forEach(baseFood => {
      // Add base food with multiple serving sizes
      const servingOptions = getServingOptionsForFood(baseFood.name);
      servingOptions.forEach(serving => {
        foods.push(createFoodEntry(id++, baseFood.name, baseFood, "", "", serving.quantity, serving.unit));
      });
      
      // Add branded versions with different serving sizes
      brands.slice(1, 8).forEach((brand, brandIndex) => {
        const servingOptions = getServingOptionsForFood(baseFood.name);
        servingOptions.slice(0, 2).forEach(serving => {
          foods.push(createFoodEntry(id++, baseFood.name, baseFood, brand, "", serving.quantity, serving.unit));
        });
      });

      // Add cooking method variations
      cookingMethods.slice(1, 8).forEach((method, methodIndex) => {
        const modifiedNutrition = adjustNutritionForCooking(baseFood, method);
        const servingOptions = getServingOptionsForFood(baseFood.name);
        servingOptions.slice(0, 2).forEach(serving => {
          foods.push(createFoodEntry(id++, `${method} ${baseFood.name}`, modifiedNutrition, "", method, serving.quantity, serving.unit));
        });
      });

      // Add preparation variations
      preparations.slice(1, 6).forEach((prep, prepIndex) => {
        const modifiedNutrition = adjustNutritionForPreparation(baseFood, prep);
        const servingOptions = getServingOptionsForFood(baseFood.name);
        servingOptions.slice(0, 2).forEach(serving => {
          foods.push(createFoodEntry(id++, `${prep} ${baseFood.name}`, modifiedNutrition, "", prep, serving.quantity, serving.unit));
        });
      });

      // Add combination variations (brand + preparation + cooking)
      for (let i = 1; i <= 3; i++) {
        for (let j = 1; j <= 3; j++) {
          for (let k = 1; k <= 2; k++) {
            const brand = brands[i];
            const prep = preparations[j];
            const cooking = cookingMethods[k];
            let modifiedNutrition = adjustNutritionForPreparation(baseFood, prep);
            modifiedNutrition = adjustNutritionForCooking(modifiedNutrition, cooking);
            
            const name = `${prep} ${cooking} ${baseFood.name}`.trim();
            const servingOptions = getServingOptionsForFood(baseFood.name);
            foods.push(createFoodEntry(id++, name, modifiedNutrition, brand, `${prep} ${cooking}`, servingOptions[0].quantity, servingOptions[0].unit));
          }
        }
      }

      // Add restaurant-style variations
      const restaurantStyles = ["Restaurant Style", "Home Style", "Gourmet", "Fast Food", "Deli", "Bakery"];
      restaurantStyles.forEach(style => {
        const modifiedNutrition = adjustNutritionForStyle(baseFood, style);
        const servingOptions = getServingOptionsForFood(baseFood.name);
        foods.push(createFoodEntry(id++, `${style} ${baseFood.name}`, modifiedNutrition, "", style, servingOptions[0].quantity, servingOptions[0].unit));
      });
    });
  });

  return foods;
}

function createFoodEntry(id, name, nutrition, brand = "", preparation = "", quantity = 100, unit = "g") {
  const adjustedQuantity = quantity || getDefaultQuantity(name);
  const adjustedUnit = unit || getDefaultUnit(name);
  
  return {
    id: `food-${id}`,
    name: name.trim(),
    brand: brand,
    barcode: "",
    quantity: adjustedQuantity,
    unit: adjustedUnit,
    calories: Math.round(nutrition.calories * (adjustedQuantity / 100)),
    carbs: Math.round(nutrition.carbs * (adjustedQuantity / 100) * 10) / 10,
    protein: Math.round(nutrition.protein * (adjustedQuantity / 100) * 10) / 10,
    fat: Math.round(nutrition.fat * (adjustedQuantity / 100) * 10) / 10,
    fiber: nutrition.fiber ? Math.round((nutrition.fiber || 0) * (adjustedQuantity / 100) * 10) / 10 : undefined,
    sugar: nutrition.sugar ? Math.round((nutrition.sugar || 0) * (adjustedQuantity / 100) * 10) / 10 : undefined,
    sodium: Math.round((nutrition.sodium || 0) * (adjustedQuantity / 100)),
    saturatedFat: nutrition.saturatedFat ? Math.round((nutrition.saturatedFat || nutrition.fat * 0.3) * (adjustedQuantity / 100) * 10) / 10 : undefined,
    nutritionPer100g: {
      calories: nutrition.calories,
      carbs: nutrition.carbs,
      protein: nutrition.protein,
      fat: nutrition.fat,
      fiber: nutrition.fiber || 0,
      sugar: nutrition.sugar || 0,
      sodium: nutrition.sodium || 0,
      saturatedFat: nutrition.saturatedFat || nutrition.fat * 0.3
    }
  };
}

function getServingOptionsForFood(name) {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('egg') && !lowerName.includes('white')) {
    return [{ quantity: 50, unit: 'g' }, { quantity: 1, unit: 'piece' }];
  }
  if (lowerName.includes('egg white')) {
    return [{ quantity: 33, unit: 'g' }, { quantity: 1, unit: 'piece' }];
  }
  if (lowerName.includes('milk') || lowerName.includes('juice')) {
    return [{ quantity: 240, unit: 'ml' }, { quantity: 1, unit: 'cup' }];
  }
  if (lowerName.includes('cheese')) {
    return [{ quantity: 28, unit: 'g' }, { quantity: 1, unit: 'slice' }];
  }
  if (lowerName.includes('nuts') || lowerName.includes('seeds')) {
    return [{ quantity: 28, unit: 'g' }, { quantity: 30, unit: 'g' }];
  }
  if (lowerName.includes('bread')) {
    return [{ quantity: 28, unit: 'g' }, { quantity: 1, unit: 'slice' }];
  }
  if (lowerName.includes('pasta') || lowerName.includes('rice')) {
    return [{ quantity: 100, unit: 'g' }, { quantity: 0.5, unit: 'cup' }, { quantity: 1, unit: 'cup' }];
  }
  
  return [{ quantity: 100, unit: 'g' }, { quantity: 85, unit: 'g' }, { quantity: 150, unit: 'g' }];
}

function getDefaultQuantity(name) {
  if (name.toLowerCase().includes('egg') && !name.toLowerCase().includes('white')) return 50;
  if (name.toLowerCase().includes('egg white')) return 33;
  if (name.toLowerCase().includes('milk') || name.toLowerCase().includes('juice')) return 240;
  if (name.toLowerCase().includes('cheese')) return 28;
  if (name.toLowerCase().includes('nuts') || name.toLowerCase().includes('seeds')) return 28;
  if (name.toLowerCase().includes('bread')) return 28;
  return 100;
}

function getDefaultUnit(name) {
  if (name.toLowerCase().includes('milk') || name.toLowerCase().includes('juice')) return 'ml';
  return 'g';
}

function adjustNutritionForCooking(baseNutrition, method) {
  const adjusted = { ...baseNutrition };
  
  switch (method.toLowerCase()) {
    case 'grilled':
    case 'baked':
    case 'roasted':
    case 'broiled':
      adjusted.fat = adjusted.fat * 0.9;
      adjusted.calories = adjusted.calories * 0.95;
      break;
    case 'fried':
    case 'pan-fried':
    case 'deep-fried':
      adjusted.fat = adjusted.fat * 1.4;
      adjusted.calories = adjusted.calories * 1.3;
      break;
    case 'air-fried':
      adjusted.fat = adjusted.fat * 1.1;
      adjusted.calories = adjusted.calories * 1.05;
      break;
    case 'steamed':
    case 'boiled':
    case 'poached':
      // Minimal change, might lose some nutrients
      adjusted.calories = adjusted.calories * 0.98;
      break;
    case 'smoked':
    case 'cured':
      adjusted.sodium = (adjusted.sodium || 0) * 2;
      break;
  }
  
  return adjusted;
}

function adjustNutritionForPreparation(baseNutrition, prep) {
  const adjusted = { ...baseNutrition };
  
  switch (prep.toLowerCase()) {
    case 'low-sodium':
    case 'unsalted':
      adjusted.sodium = (adjusted.sodium || 0) * 0.1;
      break;
    case 'organic':
    case 'free-range':
    case 'grass-fed':
      adjusted.protein = adjusted.protein * 1.05;
      break;
    case 'canned':
      adjusted.sodium = (adjusted.sodium || 0) * 2.5;
      break;
    case 'dried':
    case 'dehydrated':
      adjusted.calories = adjusted.calories * 3;
      adjusted.carbs = adjusted.carbs * 3;
      adjusted.protein = adjusted.protein * 3;
      adjusted.fat = adjusted.fat * 3;
      break;
    case 'breaded':
      adjusted.carbs = adjusted.carbs + 10;
      adjusted.calories = adjusted.calories + 50;
      break;
  }
  
  return adjusted;
}

function adjustNutritionForStyle(baseNutrition, style) {
  const adjusted = { ...baseNutrition };
  
  switch (style.toLowerCase()) {
    case 'restaurant style':
    case 'fast food':
      adjusted.calories = adjusted.calories * 1.3;
      adjusted.fat = adjusted.fat * 1.5;
      adjusted.sodium = (adjusted.sodium || 0) * 2;
      break;
    case 'gourmet':
      adjusted.calories = adjusted.calories * 1.2;
      adjusted.fat = adjusted.fat * 1.3;
      break;
    case 'home style':
      adjusted.calories = adjusted.calories * 1.1;
      break;
  }
  
  return adjusted;
}

// Generate the massive database
const foodDatabase = generateMassiveFoodDatabase();

console.log(`Generated ${foodDatabase.length} food items`);

// Write to file
fs.writeFileSync('./client/src/data/comprehensive-foods.json', JSON.stringify(foodDatabase, null, 2));

console.log(`Massive food database written with ${foodDatabase.length} items`);