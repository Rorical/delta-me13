// Recipe definitions for crafting system
export interface Recipe {
  name: string;
  materials: Record<string, number>; // resource -> amount needed
  output: { item: string; quantity: number };
}

export const RECIPES: Record<string, Recipe> = {
  // Basic tools and weapons
  'wooden_shield': {
    name: 'Wooden Shield',
    materials: { 'wood': 3 },
    output: { item: 'wooden_shield', quantity: 1 }
  },
  'stone_sword': {
    name: 'Stone Sword',
    materials: { 'stone': 2, 'wood': 1 },
    output: { item: 'stone_sword', quantity: 1 }
  },
  'basic_tool': {
    name: 'Basic Tool',
    materials: { 'wood': 2, 'stone': 1 },
    output: { item: 'basic_tool', quantity: 1 }
  },
  'wooden_spear': {
    name: 'Wooden Spear',
    materials: { 'wood': 4 },
    output: { item: 'wooden_spear', quantity: 1 }
  },
  'stone_hammer': {
    name: 'Stone Hammer',
    materials: { 'stone': 3, 'wood': 2 },
    output: { item: 'stone_hammer', quantity: 1 }
  },
  'leather_armor': {
    name: 'Leather Armor',
    materials: { 'food': 5, 'wood': 1 }, // Using food as leather substitute
    output: { item: 'leather_armor', quantity: 1 }
  },
  // Advanced items requiring mana crystals
  'enchanted_blade': {
    name: 'Enchanted Blade',
    materials: { 'stone': 3, 'wood': 2, 'mana_crystal': 1 },
    output: { item: 'enchanted_blade', quantity: 1 }
  },
  'mana_staff': {
    name: 'Mana Staff',
    materials: { 'wood': 3, 'mana_crystal': 2 },
    output: { item: 'mana_staff', quantity: 1 }
  },
  'ward_stone': {
    name: 'Ward Stone',
    materials: { 'stone': 5, 'mana_crystal': 3 },
    output: { item: 'ward_stone', quantity: 1 }
  }
};

export function getRecipe(itemName: string): Recipe | null {
  // Handle both camelCase and snake_case inputs
  const normalizedName = itemName.toLowerCase().replace(/[\s-]/g, '_');
  return RECIPES[normalizedName] || null;
}

export function getAllRecipes(): Recipe[] {
  return Object.values(RECIPES);
}

export function getAvailableRecipes(inventory: Record<string, number>): Recipe[] {
  return Object.values(RECIPES).filter(recipe => {
    return Object.entries(recipe.materials).every(([material, needed]) => 
      (inventory[material] || 0) >= needed
    );
  });
}