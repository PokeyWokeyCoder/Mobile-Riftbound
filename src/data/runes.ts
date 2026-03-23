import { RuneDefinition } from '../engine/gameState';

// ─── Fury Runes ───────────────────────────────────────────────────────────────

/** Basic energy rune: [T]: Add 1 Energy */
export const FURY_ENERGY_RUNE: RuneDefinition = {
  id: 'rune-fury-energy',
  name: 'Fury Energy Rune',
  domain: 'Fury',
};

/** Power rune: Recycle this: Add 1 Fury Power */
export const FURY_POWER_RUNE: RuneDefinition = {
  id: 'rune-fury-power',
  name: 'Fury Power Rune',
  domain: 'Fury',
};

/**
 * A full Fury rune deck: 12 runes (6 energy, 6 power).
 * Returns a new array each call so instances are distinct.
 */
export function makeFuryRuneDeck(): RuneDefinition[] {
  return [
    FURY_ENERGY_RUNE,
    FURY_ENERGY_RUNE,
    FURY_ENERGY_RUNE,
    FURY_ENERGY_RUNE,
    FURY_ENERGY_RUNE,
    FURY_ENERGY_RUNE,
    FURY_POWER_RUNE,
    FURY_POWER_RUNE,
    FURY_POWER_RUNE,
    FURY_POWER_RUNE,
    FURY_POWER_RUNE,
    FURY_POWER_RUNE,
  ];
}

// ─── Calm Runes ───────────────────────────────────────────────────────────────

export const CALM_ENERGY_RUNE: RuneDefinition = {
  id: 'rune-calm-energy',
  name: 'Calm Energy Rune',
  domain: 'Calm',
};

export const CALM_POWER_RUNE: RuneDefinition = {
  id: 'rune-calm-power',
  name: 'Calm Power Rune',
  domain: 'Calm',
};

export function makeCalmRuneDeck(): RuneDefinition[] {
  return [
    CALM_ENERGY_RUNE,
    CALM_ENERGY_RUNE,
    CALM_ENERGY_RUNE,
    CALM_ENERGY_RUNE,
    CALM_ENERGY_RUNE,
    CALM_ENERGY_RUNE,
    CALM_POWER_RUNE,
    CALM_POWER_RUNE,
    CALM_POWER_RUNE,
    CALM_POWER_RUNE,
    CALM_POWER_RUNE,
    CALM_POWER_RUNE,
  ];
}
