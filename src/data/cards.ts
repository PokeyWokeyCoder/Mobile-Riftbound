import { CardDefinition } from '../engine/gameState';

// ─── Champions ────────────────────────────────────────────────────────────────

export const CHOSEN_CHAMPION_FURY: CardDefinition = {
  id: 'unit-chosen-champion-fury',
  name: 'Rage Champion',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 3,
  powerCost: { Fury: 1 },
  might: 4,
  tags: ['Fury Commander', 'Champion'],
  keywords: [{ type: 'Assault', value: 1 }],
  text: 'Assault 1',
  isChosenChampion: true,
};

export const CHOSEN_CHAMPION_CALM: CardDefinition = {
  id: 'unit-chosen-champion-calm',
  name: 'Serene Champion',
  type: 'Unit',
  domains: ['Calm'],
  energyCost: 3,
  powerCost: { Calm: 1 },
  might: 3,
  tags: ['Calm Sentinel', 'Champion'],
  keywords: [{ type: 'Shield', value: 1 }, { type: 'Tank' }],
  text: 'Shield 1, Tank',
  isChosenChampion: true,
};

// ─── Fury Units ───────────────────────────────────────────────────────────────

export const FURY_WARRIOR: CardDefinition = {
  id: 'unit-fury-warrior',
  name: 'Fury Warrior',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 2,
  powerCost: {},
  might: 3,
  tags: ['Warrior'],
  keywords: [],
};

export const SWIFT_BLADE: CardDefinition = {
  id: 'unit-swift-blade',
  name: 'Swift Blade',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 1,
  powerCost: {},
  might: 2,
  tags: ['Warrior'],
  keywords: [{ type: 'Assault', value: 1 }],
  text: 'Assault 1',
};

export const EMBER_MAGE: CardDefinition = {
  id: 'unit-ember-mage',
  name: 'Ember Mage',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 2,
  powerCost: {},
  might: 2,
  tags: ['Mage'],
  keywords: [{ type: 'Vision' }],
  text: 'Vision',
};

export const INFERNO_KNIGHT: CardDefinition = {
  id: 'unit-inferno-knight',
  name: 'Inferno Knight',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 3,
  powerCost: { Fury: 1 },
  might: 4,
  tags: ['Knight'],
  keywords: [{ type: 'Assault', value: 2 }, { type: 'Accelerate' }],
  text: 'Assault 2, Accelerate',
};

export const VOLCANIC_SENTRY: CardDefinition = {
  id: 'unit-volcanic-sentry',
  name: 'Volcanic Sentry',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 4,
  powerCost: {},
  might: 5,
  tags: ['Warrior'],
  keywords: [{ type: 'Tank' }, { type: 'Deathknell' }],
  text: 'Tank. Deathknell — Deal 2 damage to a unit.',
};

export const BLITZ_RUNNER: CardDefinition = {
  id: 'unit-blitz-runner',
  name: 'Blitz Runner',
  type: 'Unit',
  domains: ['Fury'],
  energyCost: 1,
  powerCost: {},
  might: 2,
  tags: ['Scout'],
  keywords: [{ type: 'Ganking' }],
  text: 'Ganking',
};

// ─── Calm Units ───────────────────────────────────────────────────────────────

export const CALM_GUARDIAN: CardDefinition = {
  id: 'unit-calm-guardian',
  name: 'Calm Guardian',
  type: 'Unit',
  domains: ['Calm'],
  energyCost: 3,
  powerCost: {},
  might: 4,
  tags: ['Guardian'],
  keywords: [{ type: 'Tank' }, { type: 'Shield', value: 1 }],
  text: 'Tank, Shield 1',
};

export const FOREST_STALKER: CardDefinition = {
  id: 'unit-forest-stalker',
  name: 'Forest Stalker',
  type: 'Unit',
  domains: ['Calm'],
  energyCost: 2,
  powerCost: {},
  might: 3,
  tags: ['Ranger'],
  keywords: [{ type: 'Hidden' }],
  text: 'Hidden',
};

// ─── Gear ─────────────────────────────────────────────────────────────────────

export const WAR_BANNER: CardDefinition = {
  id: 'gear-war-banner',
  name: 'War Banner',
  type: 'Gear',
  domains: ['Fury'],
  energyCost: 2,
  powerCost: {},
  tags: [],
  keywords: [],
  text: 'Fury units you control have +1 Might.',
};

export const SHIELD_WALL: CardDefinition = {
  id: 'gear-shield-wall',
  name: 'Shield Wall',
  type: 'Gear',
  domains: ['Calm'],
  energyCost: 3,
  powerCost: {},
  tags: [],
  keywords: [],
  text: 'Units you control have Shield 1.',
};

// ─── Spells ───────────────────────────────────────────────────────────────────

export const FURY_STRIKE: CardDefinition = {
  id: 'spell-fury-strike',
  name: 'Fury Strike',
  type: 'Spell',
  domains: ['Fury'],
  energyCost: 1,
  powerCost: {},
  tags: [],
  keywords: [],
  text: 'Deal 2 damage to a unit.',
};

export const COUNTER_FLAME: CardDefinition = {
  id: 'spell-counter-flame',
  name: 'Counter Flame',
  type: 'Spell',
  domains: ['Fury'],
  energyCost: 2,
  powerCost: {},
  tags: [],
  keywords: [{ type: 'Reaction' }],
  text: 'Reaction — Deal 1 damage to a unit.',
};

export const CALL_TO_ARMS: CardDefinition = {
  id: 'spell-call-to-arms',
  name: 'Call to Arms',
  type: 'Spell',
  domains: ['Fury'],
  energyCost: 3,
  powerCost: { Fury: 1 },
  tags: [],
  keywords: [{ type: 'Action' }],
  text: 'Action — Put a 2/2 Fury Warrior token onto your Base.',
};

export const NATURE_WARD: CardDefinition = {
  id: 'spell-nature-ward',
  name: 'Nature Ward',
  type: 'Spell',
  domains: ['Calm'],
  energyCost: 1,
  powerCost: {},
  tags: [],
  keywords: [{ type: 'Reaction' }],
  text: 'Reaction — A unit you control gains Shield 1 until end of turn.',
};

// ─── Token ───────────────────────────────────────────────────────────────────

export const FURY_WARRIOR_TOKEN: CardDefinition = {
  id: 'token-fury-warrior',
  name: 'Fury Warrior',
  type: 'Token',
  domains: ['Fury'],
  energyCost: 0,
  powerCost: {},
  might: 2,
  tags: ['Warrior'],
  keywords: [],
};

// ─── Deck Builder Helpers ─────────────────────────────────────────────────────

/**
 * Build a 40-card Fury main deck (no Chosen Champion).
 * Returns a new array each call to avoid shared references.
 */
export function makeFuryMainDeck(): CardDefinition[] {
  return [
    // 3x Fury Warrior
    FURY_WARRIOR, FURY_WARRIOR, FURY_WARRIOR,
    // 3x Swift Blade
    SWIFT_BLADE, SWIFT_BLADE, SWIFT_BLADE,
    // 3x Ember Mage
    EMBER_MAGE, EMBER_MAGE, EMBER_MAGE,
    // 3x Inferno Knight
    INFERNO_KNIGHT, INFERNO_KNIGHT, INFERNO_KNIGHT,
    // 3x Volcanic Sentry
    VOLCANIC_SENTRY, VOLCANIC_SENTRY, VOLCANIC_SENTRY,
    // 3x Blitz Runner
    BLITZ_RUNNER, BLITZ_RUNNER, BLITZ_RUNNER,
    // 3x War Banner (Gear)
    WAR_BANNER, WAR_BANNER, WAR_BANNER,
    // 3x Fury Strike
    FURY_STRIKE, FURY_STRIKE, FURY_STRIKE,
    // 3x Counter Flame
    COUNTER_FLAME, COUNTER_FLAME, COUNTER_FLAME,
    // 3x Call to Arms
    CALL_TO_ARMS, CALL_TO_ARMS, CALL_TO_ARMS,
    // 2x Rage Champion (extra copies allowed in deck)
    CHOSEN_CHAMPION_FURY, CHOSEN_CHAMPION_FURY,
    // Padding to reach 40
    FURY_WARRIOR, FURY_WARRIOR, FURY_WARRIOR,
    SWIFT_BLADE, SWIFT_BLADE, SWIFT_BLADE,
    EMBER_MAGE, EMBER_MAGE,
  ];
}

/**
 * Build a 40-card Calm main deck (no Chosen Champion).
 */
export function makeCalmMainDeck(): CardDefinition[] {
  return [
    CALM_GUARDIAN, CALM_GUARDIAN, CALM_GUARDIAN,
    FOREST_STALKER, FOREST_STALKER, FOREST_STALKER,
    SHIELD_WALL, SHIELD_WALL, SHIELD_WALL,
    NATURE_WARD, NATURE_WARD, NATURE_WARD,
    CALM_GUARDIAN, CALM_GUARDIAN, CALM_GUARDIAN,
    FOREST_STALKER, FOREST_STALKER, FOREST_STALKER,
    SHIELD_WALL, SHIELD_WALL, SHIELD_WALL,
    NATURE_WARD, NATURE_WARD, NATURE_WARD,
    CALM_GUARDIAN, CALM_GUARDIAN, CALM_GUARDIAN,
    FOREST_STALKER, FOREST_STALKER, FOREST_STALKER,
    SHIELD_WALL, SHIELD_WALL, SHIELD_WALL,
    NATURE_WARD, NATURE_WARD, NATURE_WARD,
    CHOSEN_CHAMPION_CALM, CHOSEN_CHAMPION_CALM,
    CALM_GUARDIAN, CALM_GUARDIAN,
  ];
}
