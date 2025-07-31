import type { OmphalosWorldState } from '../omphalosWorldState';
import { CombinedMemory } from '../memory/combined';
import OpenAI from 'openai';

export type Action =
  // --- Movement & Location ---
  | { type: 'MOVE'; targetCity: string }

  // --- Social & Diplomacy ---
  | { type: 'INSPECT'; targetId: string }
  | { type: 'CHAT'; targetId: string; content: string }
  | { type: 'NEGOTIATE'; targetId: string; proposal: string }
  | { type: 'FORM_ALLIANCE'; targetId: string }

  // --- Enhanced Combat & Defense ---
  | { type: 'ATTACK'; targetId: string; power: number; weapon?: string; specialMove?: string }
  | { type: 'DEFEND'; targetId?: string; defenseType: 'BLOCK' | 'DODGE' | 'COUNTER' }
  | { type: 'USE_WEAPON'; targetId: string; weapon: string; specialAbility?: string }
  | { type: 'USE_ARMOR'; defenseType: 'ACTIVATE' | 'REPAIR' }
  | { type: 'USE_CONSUMABLE'; item: string; targetId?: string }
  | { type: 'BUILD_DEFENSE'; cityId: string; defenseType: 'WALL' | 'WATCHTOWER' }

  // --- Resource & Economy ---
  | { type: 'FORAGE' } // General-purpose low-yield gathering
  | { type: 'GATHER_RESOURCES'; resource: 'WOOD' | 'STONE' | 'MANA_CRYSTAL' }
  | { type: 'CRAFT_ITEM'; itemName: string; materials: Record<string, number> }
  | { type: 'TRADE'; targetId: string; offer: Record<string, number>; request: Record<string, number>; message?: string }
  | { type: 'GIFT'; targetId: string; items: string[]; resources: Record<string, number>; message?: string }

  // --- World & Self ---
  | { type: 'CLEANSE_CORRUPTION'; areaId: string; power: number }
  | { type: 'REST' }
  
  // --- Special & Abilities ---
  | { type: 'USE_ABILITY'; abilityName: string; targetId?: string; payload?: any }
  | { type: 'SPECIAL'; name: string; payload: any } // Legacy/flexible special action
  
  // --- World Events ---
  | { type: 'WORLD_EVENT'; target: string; parameters: { eventId: string; eventName: string; description: string; severity: string } }
  | { type: 'ENVIRONMENT_CHANGE'; target: string; parameters: { changeType: string; magnitude: number; description: string } };

export interface AICallLog {
  timestamp: number;
  agentId: string;
  model: string;
  prompt: string;
  response: string;
  duration: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface CombatStats {
  attackPower: number;
  defenseRating: number;
  magicPower: number;
  health: number;
  maxHealth: number;
  stamina: number;
  maxStamina: number;
  equippedWeapon?: string;
  equippedArmor?: string;
  activeEffects: CombatEffect[];
}

export interface CombatEffect {
  type: 'BUFF' | 'DEBUFF' | 'DOT' | 'HOT';
  name: string;
  magnitude: number;
  duration: number;
  source: string;
}

export interface Equipment {
  name: string;
  type: 'WEAPON' | 'ARMOR' | 'ACCESSORY' | 'CONSUMABLE';
  attackPower?: number;
  defenseRating?: number;
  magicPower?: number;
  specialEffects?: string[];
  durability: number;
  maxDurability: number;
}

export abstract class BaseAgent {
  public id: string;
  public name: string;
  public memory: CombinedMemory;
  public openaiClient: OpenAI;
  public combatStats: CombatStats;
  public equipment: Equipment[];

  constructor(
    id: string,
    name: string,
    openaiClient: OpenAI,
    initialStats?: Partial<CombatStats>
  ) {
    this.id = id;
    this.name = name;
    this.openaiClient = openaiClient;
    this.memory = new CombinedMemory(openaiClient);
    this.equipment = [];
    
    // Initialize combat stats
    this.combatStats = {
      attackPower: initialStats?.attackPower || 10,
      defenseRating: initialStats?.defenseRating || 5,
      magicPower: initialStats?.magicPower || 0,
      health: initialStats?.health || 100,
      maxHealth: initialStats?.maxHealth || 100,
      stamina: initialStats?.stamina || 100,
      maxStamina: initialStats?.maxStamina || 100,
      activeEffects: []
    };
  }

  abstract decide(world: OmphalosWorldState, context: any): Promise<Action[]>;

  // Enhanced combat methods
  public equipItem(item: Equipment): boolean {
    if (item.type === 'WEAPON') {
      // Unequip current weapon
      const currentWeapon = this.equipment.find(e => e.type === 'WEAPON');
      if (currentWeapon) {
        this.unequipItem(currentWeapon);
      }
      
      this.equipment.push(item);
      this.combatStats.equippedWeapon = item.name;
      this.combatStats.attackPower += item.attackPower || 0;
      this.combatStats.magicPower += item.magicPower || 0;
      return true;
    } else if (item.type === 'ARMOR') {
      // Unequip current armor
      const currentArmor = this.equipment.find(e => e.type === 'ARMOR');
      if (currentArmor) {
        this.unequipItem(currentArmor);
      }
      
      this.equipment.push(item);
      this.combatStats.equippedArmor = item.name;
      this.combatStats.defenseRating += item.defenseRating || 0;
      this.combatStats.magicPower += item.magicPower || 0;
      return true;
    }
    return false;
  }

  public unequipItem(item: Equipment): void {
    const index = this.equipment.findIndex(e => e.name === item.name);
    if (index !== -1) {
      this.equipment.splice(index, 1);
      
      if (item.type === 'WEAPON') {
        this.combatStats.equippedWeapon = undefined;
        this.combatStats.attackPower -= item.attackPower || 0;
        this.combatStats.magicPower -= item.magicPower || 0;
      } else if (item.type === 'ARMOR') {
        this.combatStats.equippedArmor = undefined;
        this.combatStats.defenseRating -= item.defenseRating || 0;
        this.combatStats.magicPower -= item.magicPower || 0;
      }
    }
  }

  public useConsumable(itemName: string, _targetId?: string): boolean {
    const item = this.equipment.find(e => e.name === itemName && e.type === 'CONSUMABLE');
    if (!item) return false;

    // Apply consumable effects
    if (item.specialEffects?.includes('healing')) {
      this.combatStats.health = Math.min(this.combatStats.maxHealth, this.combatStats.health + 30);
    }
    if (item.specialEffects?.includes('mana_restoration')) {
      this.combatStats.stamina = Math.min(this.combatStats.maxStamina, this.combatStats.stamina + 50);
    }

    // Remove consumable after use
    const index = this.equipment.findIndex(e => e.name === itemName);
    if (index !== -1) {
      this.equipment.splice(index, 1);
    }

    return true;
  }

  public addCombatEffect(effect: CombatEffect): void {
    this.combatStats.activeEffects.push(effect);
  }

  public removeCombatEffect(effectName: string): void {
    this.combatStats.activeEffects = this.combatStats.activeEffects.filter(e => e.name !== effectName);
  }

  public updateCombatEffects(): void {
    // Update effect durations and apply effects
    this.combatStats.activeEffects = this.combatStats.activeEffects.filter(effect => {
      effect.duration--;
      
      // Apply ongoing effects
      if (effect.type === 'DOT' && effect.duration > 0) {
        this.combatStats.health = Math.max(0, this.combatStats.health - effect.magnitude);
      } else if (effect.type === 'HOT' && effect.duration > 0) {
        this.combatStats.health = Math.min(this.combatStats.maxHealth, this.combatStats.health + effect.magnitude);
      }
      
      return effect.duration > 0;
    });
  }

  public calculateAttackDamage(basePower: number, weapon?: string): number {
    let damage = basePower;
    
    // Add weapon damage
    if (weapon) {
      const weaponItem = this.equipment.find(e => e.name === weapon);
      if (weaponItem) {
        damage += weaponItem.attackPower || 0;
      }
    }
    
    // Apply buffs/debuffs
    this.combatStats.activeEffects.forEach(effect => {
      if (effect.type === 'BUFF' && effect.name.includes('attack')) {
        damage += effect.magnitude;
      } else if (effect.type === 'DEBUFF' && effect.name.includes('attack')) {
        damage -= effect.magnitude;
      }
    });
    
    return Math.max(1, damage);
  }

  public calculateDefenseRating(): number {
    let defense = this.combatStats.defenseRating;
    
    // Apply buffs/debuffs
    this.combatStats.activeEffects.forEach(effect => {
      if (effect.type === 'BUFF' && effect.name.includes('defense')) {
        defense += effect.magnitude;
      } else if (effect.type === 'DEBUFF' && effect.name.includes('defense')) {
        defense -= effect.magnitude;
      }
    });
    
    return Math.max(0, defense);
  }
}
