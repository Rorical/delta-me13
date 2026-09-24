import type {
  AgentStatus, Ember, HeirStatus, NpcStatus, OmphalosWorldState, TitanStatus
} from '../omphalosWorldState';
import { createCities } from './cities';
import { GOLDEN_HEIRS } from '../agent/goldenHeirProfiles';
import { TWELVE_TITANS, emberIdFor } from '../agent/titanProfiles';
import { NPC_ROLES, generateNPCs, type NPCSeed } from '../agent/npcProfiles';

const emptyCounters = () => ({ actions: 0, failures: 0, damageDealt: 0, chats: 0 });

export interface WorldOptions {
  npcCount: number;
  npcs?: NPCSeed[];   // 复用已有NPC（纪元轮回时保持同一批居民）
}

export function createWorldAgents(npcSeeds: NPCSeed[]): Record<string, AgentStatus> {
  const agents: Record<string, AgentStatus> = {};

  for (const t of TWELVE_TITANS) {
    const titan: TitanStatus = {
      id: t.id, name: t.name, kind: 'titan', subtitle: `${t.title} · ${t.path}泰坦`,
      location: t.home, hp: t.hp, maxHp: t.hp, power: t.power, defense: t.defense,
      inventory: {}, allies: [], relations: {}, condition: 'active', counters: emptyCounters(),
      path: t.path, disposition: t.disposition, emberId: emberIdFor(t), emberTaken: false, respect: {}
    };
    agents[t.id] = titan;
  }

  for (const h of GOLDEN_HEIRS) {
    const heir: HeirStatus = {
      id: h.id, name: h.trueName, kind: 'heir', subtitle: `${h.path}的黄金裔`,
      location: h.home, hp: h.hp, maxHp: h.hp, power: h.power, defense: h.defense,
      inventory: { ...h.inventory }, allies: [], relations: {}, condition: 'active', counters: emptyCounters(),
      codename: h.codename, path: h.path, targetTitanId: h.titanTarget, embers: [], deaths: 0, xp: 0, level: 1
    };
    agents[h.id] = heir;
  }

  const cityIds = Object.keys(createCities()).filter(c => c !== '创世涡心');
  npcSeeds.forEach((seed, i) => {
    const role = NPC_ROLES[seed.role];
    const id = `npc_${i + 1}`;
    const npc: NpcStatus = {
      id, name: seed.name, kind: 'npc', subtitle: role.label,
      location: cityIds[i % cityIds.length], hp: role.hp, maxHp: role.hp, power: role.power, defense: role.defense,
      inventory: { ...role.inventory }, allies: [], relations: {}, condition: 'active', counters: emptyCounters(),
      role: seed.role
    };
    agents[id] = npc;
  });

  return agents;
}

export function createEmbers(): Record<string, Ember> {
  const embers: Record<string, Ember> = {};
  for (const t of TWELVE_TITANS) {
    const id = emberIdFor(t);
    embers[id] = { id, name: `${t.path}火种`, path: t.path, titanId: t.id };
  }
  return embers;
}

export function createWorld(options: WorldOptions): { state: OmphalosWorldState; npcs: NPCSeed[] } {
  const npcs = options.npcs ?? generateNPCs(options.npcCount);
  const state: OmphalosWorldState = {
    era: 1,
    day: 0,
    totalDays: 0,
    timeOfDay: 'dawn',
    cities: createCities(),
    agents: createWorldAgents(npcs),
    embers: createEmbers(),
    darkTide: { global: 0, growth: 1.1 },
    worldStability: 80,
    activeEvents: [],
    eraHistory: [],
    logs: [],
    messages: [],
    ai: { calls: 0, failures: 0, promptTokens: 0, completionTokens: 0, totalMs: 0, recent: [] }
  };
  const regions = Object.values(state.cities).filter(c => c.id !== '创世涡心');
  state.darkTide.global = Math.round(regions.reduce((sum, c) => sum + c.darkTide, 0) / regions.length * 10) / 10;
  return { state, npcs };
}
