// Recipe definitions for crafting system
export interface Recipe {
  name: string;
  materials: Record<string, number>; // resource -> amount needed
  output: { item: string; quantity: number };
  category: 'WEAPON' | 'ARMOR' | 'TOOL' | 'CONSUMABLE' | 'MAGICAL' | 'DEFENSE';
  difficulty: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';
  craftingTime: number; // in days
  requiredSkills?: string[];
  itemProperties?: ItemProperties;
  rarity?: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export interface ItemProperties {
  attackPower?: number;
  defenseRating?: number;
  durability?: number;
  magicPower?: number;
  specialEffects?: string[];
  rarity: 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
}

export const RECIPES: Record<string, Recipe> = {
  // === BASIC WEAPONS ===
  'wooden_shield': {
    name: 'Wooden Shield',
    materials: { 'wood': 3 },
    output: { item: 'wooden_shield', quantity: 1 },
    category: 'DEFENSE',
    difficulty: 'BASIC',
    craftingTime: 1,
    itemProperties: {
      defenseRating: 5,
      durability: 20,
      rarity: 'COMMON'
    }
  },
  'stone_sword': {
    name: 'Stone Sword',
    materials: { 'stone': 2, 'wood': 1 },
    output: { item: 'stone_sword', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'BASIC',
    craftingTime: 1,
    itemProperties: {
      attackPower: 8,
      durability: 25,
      rarity: 'COMMON'
    }
  },
  'wooden_spear': {
    name: 'Wooden Spear',
    materials: { 'wood': 4 },
    output: { item: 'wooden_spear', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'BASIC',
    craftingTime: 1,
    itemProperties: {
      attackPower: 6,
      durability: 15,
      rarity: 'COMMON'
    }
  },
  'stone_hammer': {
    name: 'Stone Hammer',
    materials: { 'stone': 3, 'wood': 2 },
    output: { item: 'stone_hammer', quantity: 1 },
    category: 'TOOL',
    difficulty: 'BASIC',
    craftingTime: 2,
    itemProperties: {
      attackPower: 10,
      durability: 30,
      rarity: 'COMMON'
    }
  },

  // === INTERMEDIATE WEAPONS ===
  'iron_sword': {
    name: 'Iron Sword',
    materials: { 'stone': 4, 'wood': 2, 'mana_crystal': 1 },
    output: { item: 'iron_sword', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'INTERMEDIATE',
    craftingTime: 3,
    requiredSkills: ['blacksmithing'],
    itemProperties: {
      attackPower: 15,
      durability: 40,
      rarity: 'UNCOMMON'
    }
  },
  'steel_blade': {
    name: 'Steel Blade',
    materials: { 'stone': 6, 'mana_crystal': 2 },
    output: { item: 'steel_blade', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'INTERMEDIATE',
    craftingTime: 4,
    requiredSkills: ['blacksmithing'],
    itemProperties: {
      attackPower: 20,
      durability: 50,
      rarity: 'UNCOMMON'
    }
  },

  // === ADVANCED WEAPONS ===
  'enchanted_blade': {
    name: 'Enchanted Blade',
    materials: { 'stone': 3, 'wood': 2, 'mana_crystal': 3 },
    output: { item: 'enchanted_blade', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'ADVANCED',
    craftingTime: 5,
    requiredSkills: ['blacksmithing', 'enchanting'],
    itemProperties: {
      attackPower: 25,
      magicPower: 10,
      durability: 60,
      specialEffects: ['magic_damage'],
      rarity: 'RARE'
    }
  },
  'mana_staff': {
    name: 'Mana Staff',
    materials: { 'wood': 3, 'mana_crystal': 4 },
    output: { item: 'mana_staff', quantity: 1 },
    category: 'MAGICAL',
    difficulty: 'ADVANCED',
    craftingTime: 4,
    requiredSkills: ['enchanting'],
    itemProperties: {
      attackPower: 8,
      magicPower: 25,
      durability: 45,
      specialEffects: ['spell_amplification'],
      rarity: 'RARE'
    }
  },

  // === ARMOR ===
  'leather_armor': {
    name: 'Leather Armor',
    materials: { 'food': 5, 'wood': 1 },
    output: { item: 'leather_armor', quantity: 1 },
    category: 'ARMOR',
    difficulty: 'BASIC',
    craftingTime: 2,
    itemProperties: {
      defenseRating: 8,
      durability: 30,
      rarity: 'COMMON'
    }
  },
  'chain_mail': {
    name: 'Chain Mail',
    materials: { 'stone': 5, 'mana_crystal': 2 },
    output: { item: 'chain_mail', quantity: 1 },
    category: 'ARMOR',
    difficulty: 'INTERMEDIATE',
    craftingTime: 4,
    requiredSkills: ['blacksmithing'],
    itemProperties: {
      defenseRating: 15,
      durability: 50,
      rarity: 'UNCOMMON'
    }
  },
  'enchanted_armor': {
    name: 'Enchanted Armor',
    materials: { 'stone': 4, 'mana_crystal': 5 },
    output: { item: 'enchanted_armor', quantity: 1 },
    category: 'ARMOR',
    difficulty: 'ADVANCED',
    craftingTime: 6,
    requiredSkills: ['blacksmithing', 'enchanting'],
    itemProperties: {
      defenseRating: 20,
      magicPower: 5,
      durability: 70,
      specialEffects: ['magic_resistance'],
      rarity: 'RARE'
    }
  },

  // === TOOLS ===
  'basic_tool': {
    name: 'Basic Tool',
    materials: { 'wood': 2, 'stone': 1 },
    output: { item: 'basic_tool', quantity: 1 },
    category: 'TOOL',
    difficulty: 'BASIC',
    craftingTime: 1,
    itemProperties: {
      attackPower: 3,
      durability: 20,
      rarity: 'COMMON'
    }
  },
  'advanced_tool': {
    name: 'Advanced Tool',
    materials: { 'stone': 3, 'mana_crystal': 1 },
    output: { item: 'advanced_tool', quantity: 1 },
    category: 'TOOL',
    difficulty: 'INTERMEDIATE',
    craftingTime: 3,
    requiredSkills: ['blacksmithing'],
    itemProperties: {
      attackPower: 5,
      durability: 35,
      rarity: 'UNCOMMON'
    }
  },

  // === DEFENSE STRUCTURES ===
  'ward_stone': {
    name: 'Ward Stone',
    materials: { 'stone': 5, 'mana_crystal': 3 },
    output: { item: 'ward_stone', quantity: 1 },
    category: 'DEFENSE',
    difficulty: 'ADVANCED',
    craftingTime: 5,
    requiredSkills: ['enchanting'],
    itemProperties: {
      defenseRating: 25,
      magicPower: 15,
      durability: 100,
      specialEffects: ['corruption_ward'],
      rarity: 'RARE'
    }
  },
  'guardian_totem': {
    name: 'Guardian Totem',
    materials: { 'wood': 4, 'mana_crystal': 6 },
    output: { item: 'guardian_totem', quantity: 1 },
    category: 'DEFENSE',
    difficulty: 'MASTER',
    craftingTime: 8,
    requiredSkills: ['enchanting', 'ritual_magic'],
    itemProperties: {
      defenseRating: 30,
      magicPower: 20,
      durability: 150,
      specialEffects: ['area_protection', 'healing_aura'],
      rarity: 'EPIC'
    }
  },

  // === CONSUMABLES ===
  'healing_potion': {
    name: 'Healing Potion',
    materials: { 'food': 3, 'mana_crystal': 1 },
    output: { item: 'healing_potion', quantity: 2 },
    category: 'CONSUMABLE',
    difficulty: 'BASIC',
    craftingTime: 1,
    itemProperties: {
      specialEffects: ['healing'],
      rarity: 'COMMON'
    }
  },
  'mana_potion': {
    name: 'Mana Potion',
    materials: { 'mana_crystal': 2 },
    output: { item: 'mana_potion', quantity: 1 },
    category: 'CONSUMABLE',
    difficulty: 'INTERMEDIATE',
    craftingTime: 2,
    requiredSkills: ['alchemy'],
    itemProperties: {
      specialEffects: ['mana_restoration'],
      rarity: 'UNCOMMON'
    }
  },

  // === LEGENDARY ITEMS ===
  'titan_slayer': {
    name: 'Titan Slayer',
    materials: { 'stone': 10, 'mana_crystal': 15 },
    output: { item: 'titan_slayer', quantity: 1 },
    category: 'WEAPON',
    difficulty: 'MASTER',
    craftingTime: 15,
    requiredSkills: ['blacksmithing', 'enchanting', 'titan_lore'],
    itemProperties: {
      attackPower: 50,
      magicPower: 30,
      durability: 200,
      specialEffects: ['titan_damage', 'unbreakable'],
      rarity: 'LEGENDARY'
    }
  },
  'omphalos_core': {
    name: 'Omphalos Core',
    materials: { 'mana_crystal': 20 },
    output: { item: 'omphalos_core', quantity: 1 },
    category: 'MAGICAL',
    difficulty: 'MASTER',
    craftingTime: 20,
    requiredSkills: ['enchanting', 'world_magic'],
    itemProperties: {
      magicPower: 100,
      specialEffects: ['reality_manipulation', 'corruption_immunity'],
      rarity: 'LEGENDARY'
    }
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

export function getAvailableRecipes(inventory: Record<string, number>, skills: string[] = []): Recipe[] {
  return Object.values(RECIPES).filter(recipe => {
    // Check materials
    const hasMaterials = Object.entries(recipe.materials).every(([material, needed]) => 
      (inventory[material] || 0) >= needed
    );
    
    // Check skills
    const hasSkills = !recipe.requiredSkills || recipe.requiredSkills.every(skill => 
      skills.includes(skill)
    );
    
    return hasMaterials && hasSkills;
  });
}

export function getRecipesByCategory(category: string): Recipe[] {
  return Object.values(RECIPES).filter(recipe => recipe.category === category);
}

export function getRecipesByDifficulty(difficulty: string): Recipe[] {
  return Object.values(RECIPES).filter(recipe => recipe.difficulty === difficulty);
}

export function getItemProperties(itemName: string): ItemProperties | null {
  const recipe = getRecipe(itemName);
  return recipe?.itemProperties || null;
}