/**
 * Legal action generation and action application.
 *
 * v1 simplifications:
 * - Spells resolve immediately (no chain/reaction window)
 * - No showdown before combat
 * - Channel phase: turn player channels 2 runes; auto-advance after 2 channeled
 */

import type {
  GameState,
  Action,
  PlayerId,
  UnitObject,
  GearObject,
  HandCard,
  LocationId,
  BattlefieldId,
  Domain,
  RuneCard,
} from './types';
import { newId, getOpponent, shuffleArray } from './gameState';
import { performCleanup } from './cleanup';
import { resolveCombat } from './combat';
import { advancePhase, isChannelPhaseComplete, runesPerChannel } from './phases';

// ─── Legal Actions ────────────────────────────────────────────────────────────

export function getLegalActions(state: GameState, playerId: PlayerId): Action[] {
  if (state.winner) return [];
  if (state.phase === 'gameOver') return [];

  // Only turn player acts (v1 simplification — no reactions)
  if (playerId !== state.turnPlayer) return [];

  const actions: Action[] = [];

  switch (state.phase) {
    case 'awaken':
    case 'beginning':
      actions.push({ type: 'ADVANCE_PHASE' });
      break;

    case 'channel': {
      const ps = state.players[playerId];
      if (!isChannelPhaseComplete(state)) {
        // Can channel remaining runes
        for (const rune of ps.runeDeck) {
          // Tap for energy
          actions.push({ type: 'CHANNEL_RUNE', playerId, runeInstanceId: rune.instanceId, useRecycle: false });
          // Recycle for power
          actions.push({ type: 'CHANNEL_RUNE', playerId, runeInstanceId: rune.instanceId, useRecycle: true });
        }
      } else {
        actions.push({ type: 'ADVANCE_PHASE' });
      }
      break;
    }

    case 'draw':
      actions.push({ type: 'ADVANCE_PHASE' });
      break;

    case 'action': {
      // Can play cards from hand
      const ps = state.players[playerId];
      for (const card of ps.hand) {
        const ct = card.cardType;
        if (ct === 'Unit' || ct === 'Champion Unit' || ct === 'Signature Unit') {
          if (canAfford(ps.runePool, card)) {
            actions.push({ type: 'PLAY_UNIT', playerId, handCardInstanceId: card.instanceId, payAccelerate: false });
            // Accelerate option if has matching domain power
            if (card.domain && card.domain !== 'Colorless' && canAffordAccelerate(ps.runePool, card)) {
              actions.push({ type: 'PLAY_UNIT', playerId, handCardInstanceId: card.instanceId, payAccelerate: true });
            }
          }
        } else if (ct === 'Gear' || ct === 'Signature Gear') {
          if (canAfford(ps.runePool, card)) {
            actions.push({ type: 'PLAY_GEAR', playerId, handCardInstanceId: card.instanceId, attachToUnitId: null });
          }
        } else if (ct === 'Spell' || ct === 'Signature Spell') {
          if (canAfford(ps.runePool, card)) {
            actions.push({ type: 'PLAY_SPELL', playerId, handCardInstanceId: card.instanceId, targets: [] });
          }
        }
      }

      // Move units
      const base = state.board.bases[playerId];
      for (const unit of base.units) {
        if (!unit.exhausted) {
          // Can move to either battlefield (if not already occupied by 2 other players' units)
          for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
            if (canMoveTo(state, unit, bfId)) {
              actions.push({ type: 'MOVE_UNIT', playerId, unitInstanceId: unit.instanceId, destination: bfId });
            }
          }
        }
      }

      // Move units from battlefields back to base
      for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
        const bf = state.board.battlefields[bfId];
        for (const unit of bf.units) {
          if (unit.controllerId === playerId && !unit.exhausted) {
            actions.push({ type: 'MOVE_UNIT', playerId, unitInstanceId: unit.instanceId, destination: 'base' });
          }
        }
      }

      // Champion move (champion zone to battlefield if champion is at base)
      const champion = state.players[playerId].chosenChampion;
      if (champion && champion.location === 'base' && !champion.exhausted) {
        for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
          if (canMoveTo(state, champion, bfId)) {
            actions.push({ type: 'MOVE_UNIT', playerId, unitInstanceId: champion.instanceId, destination: bfId });
          }
        }
      }
      if (champion && (champion.location === 'bf1' || champion.location === 'bf2') && !champion.exhausted) {
        actions.push({ type: 'MOVE_UNIT', playerId, unitInstanceId: champion.instanceId, destination: 'base' });
      }

      // End turn
      actions.push({ type: 'END_TURN', playerId });
      break;
    }

    case 'end':
    case 'expiration':
    case 'cleanup':
      actions.push({ type: 'ADVANCE_PHASE' });
      break;
  }

  return actions;
}

function canMoveTo(state: GameState, unit: UnitObject, bfId: BattlefieldId): boolean {
  const bf = state.board.battlefields[bfId];
  // Battlefield can't have units from 2 other players (already covered by isContested logic)
  // For v1: can always move to a battlefield (even contested — that triggers combat)
  return true;
}

function canAfford(
  pool: { energy: number; power: Partial<Record<Domain, number>> },
  card: HandCard
): boolean {
  const cost = card.energy ?? 0;
  return pool.energy >= cost;
}

function canAffordAccelerate(
  pool: { energy: number; power: Partial<Record<Domain, number>> },
  card: HandCard
): boolean {
  const domain = card.domain as Domain;
  if (!domain || domain === 'Colorless') return false;
  return (pool.power[domain] ?? 0) >= 1;
}

// ─── Apply Action ─────────────────────────────────────────────────────────────

export function applyAction(state: GameState, action: Action): GameState {
  if (state.winner) return state;

  switch (action.type) {
    case 'ADVANCE_PHASE':
      return advancePhase(state);

    case 'CHANNEL_RUNE':
      return applyChannelRune(state, action.playerId, action.runeInstanceId, action.useRecycle);

    case 'PLAY_UNIT':
      return applyPlayUnit(state, action.playerId, action.handCardInstanceId, action.payAccelerate);

    case 'PLAY_GEAR':
      return applyPlayGear(state, action.playerId, action.handCardInstanceId, action.attachToUnitId);

    case 'PLAY_SPELL':
      return applyPlaySpell(state, action.playerId, action.handCardInstanceId, action.targets);

    case 'MOVE_UNIT':
      return applyMoveUnit(state, action.playerId, action.unitInstanceId, action.destination);

    case 'END_TURN':
      return applyEndTurn(state);

    case 'RESOLVE_COMBAT':
      return resolveCombatAction(state, action.battlefieldId);

    default:
      return state;
  }
}

// ─── Channel Rune ─────────────────────────────────────────────────────────────

function applyChannelRune(
  state: GameState,
  playerId: PlayerId,
  runeInstanceId: string,
  useRecycle: boolean
): GameState {
  let ps = { ...state.players[playerId] };
  const rune = ps.runeDeck.find((r) => r.instanceId === runeInstanceId);
  if (!rune) return state;

  let log = [...state.log];
  let pool = { ...ps.runePool, power: { ...ps.runePool.power } };
  let runeDeck = [...ps.runeDeck];

  if (useRecycle) {
    // Recycle: add 1 Power of rune's domain, remove rune from deck (recycled)
    const domain = rune.domain as Domain;
    pool.power[domain] = (pool.power[domain] ?? 0) + 1;
    runeDeck = runeDeck.filter((r) => r.instanceId !== runeInstanceId);
    log.push(`[Channel] ${playerId} recycles ${rune.name} → +1 ${domain} power.`);
  } else {
    // Tap: add 1 Energy
    pool.energy += 1;
    // Rune stays in deck (tapping doesn't remove it)
    log.push(`[Channel] ${playerId} channels ${rune.name} → +1 energy.`);
  }

  ps = { ...ps, runePool: pool, runeDeck };

  const newChanneled = state.runesChanneledThisTurn + 1;
  let newState: GameState = {
    ...state,
    players: { ...state.players, [playerId]: ps },
    runesChanneledThisTurn: newChanneled,
    log,
  };

  // Auto-advance after required runes channeled
  if (newChanneled >= runesPerChannel(newState)) {
    newState = advancePhase(newState);
  }

  return newState;
}

// ─── Play Unit ────────────────────────────────────────────────────────────────

function applyPlayUnit(
  state: GameState,
  playerId: PlayerId,
  handCardInstanceId: string,
  payAccelerate: boolean
): GameState {
  let ps = { ...state.players[playerId] };
  const card = ps.hand.find((c) => c.instanceId === handCardInstanceId);
  if (!card) return state;

  const cost = card.energy ?? 0;
  if (ps.runePool.energy < cost) return state;

  // Spend energy
  let pool = { ...ps.runePool, power: { ...ps.runePool.power } };
  pool.energy -= cost;

  // Spend accelerate cost if applicable
  let enterExhausted = true;
  if (payAccelerate) {
    const domain = card.domain as Domain;
    if ((pool.power[domain] ?? 0) >= 1) {
      pool.power[domain] = (pool.power[domain] ?? 0) - 1;
      enterExhausted = false;
    }
  }

  // Check for Vision keyword
  let newState = { ...state };
  if (/\bVision\b/i.test(card.ability)) {
    // Look at top card — for AI/v1 we just log it
    if (ps.mainDeck.length > 0) {
      const topCard = ps.mainDeck[0];
      newState = { ...newState, log: [...newState.log, `[Vision] ${playerId} sees: ${topCard.name}.`] };
    }
  }

  // Remove from hand
  ps = {
    ...ps,
    hand: ps.hand.filter((c) => c.instanceId !== handCardInstanceId),
    runePool: pool,
  };

  // Create unit object on board
  const unit: UnitObject = {
    instanceId: handCardInstanceId,
    defId: card.defId,
    name: card.name,
    cardType: card.cardType as UnitObject['cardType'],
    domain: card.domain,
    ownerId: playerId,
    controllerId: playerId,
    mightBase: card.might ?? 1,
    mightBonus: 0,
    damage: 0,
    exhausted: enterExhausted,
    location: 'base',
    hasBuff: false,
    tags: card.tags,
    ability: card.ability,
    energy: card.energy ?? 0,
    isToken: false,
  };

  const base = newState.board.bases[playerId];
  const newBase = { ...base, units: [...base.units, unit] };

  const log = [
    ...newState.log,
    `[Play] ${playerId} plays ${card.name} (${cost} energy)${payAccelerate ? ' with Accelerate' : ''} → base.`,
  ];

  newState = {
    ...newState,
    players: {
      ...newState.players,
      [playerId]: ps,
    },
    board: {
      ...newState.board,
      bases: { ...newState.board.bases, [playerId]: newBase },
    },
    log,
  };

  return performCleanup(newState);
}

// ─── Play Gear ────────────────────────────────────────────────────────────────

function applyPlayGear(
  state: GameState,
  playerId: PlayerId,
  handCardInstanceId: string,
  attachToUnitId: string | null
): GameState {
  let ps = { ...state.players[playerId] };
  const card = ps.hand.find((c) => c.instanceId === handCardInstanceId);
  if (!card) return state;

  const cost = card.energy ?? 0;
  if (ps.runePool.energy < cost) return state;

  let pool = { ...ps.runePool };
  pool.energy -= cost;

  ps = {
    ...ps,
    hand: ps.hand.filter((c) => c.instanceId !== handCardInstanceId),
    runePool: pool,
  };

  const gear: GearObject = {
    instanceId: handCardInstanceId,
    defId: card.defId,
    name: card.name,
    cardType: card.cardType as GearObject['cardType'],
    domain: card.domain,
    ownerId: playerId,
    controllerId: playerId,
    exhausted: false,
    location: 'base',
    tags: card.tags,
    ability: card.ability,
    energy: card.energy ?? 0,
    attachedTo: attachToUnitId,
  };

  const base = state.board.bases[playerId];
  const newBase = { ...base, gear: [...base.gear, gear] };

  const log = [
    ...state.log,
    `[Play] ${playerId} plays gear ${card.name} (${cost} energy) → base.`,
  ];

  return performCleanup({
    ...state,
    players: { ...state.players, [playerId]: ps },
    board: { ...state.board, bases: { ...state.board.bases, [playerId]: newBase } },
    log,
  });
}

// ─── Play Spell ───────────────────────────────────────────────────────────────

function applyPlaySpell(
  state: GameState,
  playerId: PlayerId,
  handCardInstanceId: string,
  targets: string[]
): GameState {
  let ps = { ...state.players[playerId] };
  const card = ps.hand.find((c) => c.instanceId === handCardInstanceId);
  if (!card) return state;

  const cost = card.energy ?? 0;
  if (ps.runePool.energy < cost) return state;

  let pool = { ...ps.runePool };
  pool.energy -= cost;

  // Move spell from hand to trash after resolving
  const trashCard: HandCard = { ...card };
  ps = {
    ...ps,
    hand: ps.hand.filter((c) => c.instanceId !== handCardInstanceId),
    runePool: pool,
    trash: [...ps.trash, trashCard],
  };

  const log = [
    ...state.log,
    `[Play] ${playerId} plays spell ${card.name} (${cost} energy).`,
  ];

  let newState = {
    ...state,
    players: { ...state.players, [playerId]: ps },
    log,
  };

  // Apply spell effects (v1: basic pattern matching)
  newState = applySpellEffect(newState, playerId, card, targets);

  return performCleanup(newState);
}

/**
 * Very basic spell effect parsing for v1.
 * Handles damage spells and buff spells by pattern-matching ability text.
 */
function applySpellEffect(
  state: GameState,
  casterId: PlayerId,
  card: HandCard,
  targets: string[]
): GameState {
  const text = card.ability.toLowerCase();
  let s = state;

  // "Deal X damage to target unit" / "deal X to all units"
  const dmgMatch = text.match(/deal\s+(\d+)\s+(?:damage\s+)?to\s+(all\s+units|all\s+enemy\s+units|all\s+friendly\s+units|a\s+unit|target\s+unit)/);
  if (dmgMatch) {
    const amount = parseInt(dmgMatch[1], 10);
    const scope = dmgMatch[2];
    s = applyDamageSpell(s, casterId, amount, scope, targets);
  }

  // "Give friendly units +X Might"
  const buffMatch = text.match(/give\s+(?:friendly\s+)?(?:all\s+)?units?\s+\+(\d+)\s+might/);
  if (buffMatch) {
    const bonus = parseInt(buffMatch[1], 10);
    s = applyBuffSpell(s, casterId, bonus);
  }

  return s;
}

function applyDamageSpell(
  state: GameState,
  casterId: PlayerId,
  amount: number,
  scope: string,
  targets: string[]
): GameState {
  const oppId = getOpponent(casterId);
  const log = [...state.log];

  const dealDmg = (unit: UnitObject): UnitObject => {
    log.push(`  ${unit.name} takes ${amount} damage.`);
    return { ...unit, damage: unit.damage + amount };
  };

  const applyToBf = (bfId: BattlefieldId, predicate: (u: UnitObject) => boolean) => {
    const bf = state.board.battlefields[bfId];
    return { ...bf, units: bf.units.map((u) => (predicate(u) ? dealDmg(u) : u)) };
  };

  if (scope.includes('all enemy') || scope.includes('all units')) {
    const bfs: Record<BattlefieldId, any> = {
      bf1: applyToBf('bf1', (u) => scope.includes('all units') || u.controllerId === oppId),
      bf2: applyToBf('bf2', (u) => scope.includes('all units') || u.controllerId === oppId),
    };
    return { ...state, board: { ...state.board, battlefields: bfs }, log };
  }

  if (scope.includes('all friendly')) {
    const bfs: Record<BattlefieldId, any> = {
      bf1: applyToBf('bf1', (u) => u.controllerId === casterId),
      bf2: applyToBf('bf2', (u) => u.controllerId === casterId),
    };
    return { ...state, board: { ...state.board, battlefields: bfs }, log };
  }

  // target unit — apply to targets list
  if (targets.length > 0) {
    const allUnits = getAllUnitsOnBoard(state);
    const target = allUnits.find((u) => targets.includes(u.instanceId));
    if (target) {
      return applyDamageToUnit(state, target.instanceId, amount);
    }
  }

  return state;
}

function applyBuffSpell(state: GameState, casterId: PlayerId, bonus: number): GameState {
  const buffUnit = (u: UnitObject): UnitObject =>
    u.controllerId === casterId ? { ...u, mightBonus: u.mightBonus + bonus } : u;

  const newBases = {
    ...state.board.bases,
    [casterId]: {
      ...state.board.bases[casterId],
      units: state.board.bases[casterId].units.map(buffUnit),
    },
  };
  const newBfs = {
    bf1: { ...state.board.battlefields.bf1, units: state.board.battlefields.bf1.units.map(buffUnit) },
    bf2: { ...state.board.battlefields.bf2, units: state.board.battlefields.bf2.units.map(buffUnit) },
  };
  return {
    ...state,
    board: { ...state.board, bases: newBases, battlefields: newBfs },
    log: [...state.log, `[Spell] All friendly units get +${bonus} Might.`],
  };
}

function applyDamageToUnit(state: GameState, instanceId: string, amount: number): GameState {
  const transform = (units: UnitObject[]) =>
    units.map((u) => (u.instanceId === instanceId ? { ...u, damage: u.damage + amount } : u));

  return {
    ...state,
    board: {
      ...state.board,
      bases: {
        player: { ...state.board.bases.player, units: transform(state.board.bases.player.units) },
        opponent: { ...state.board.bases.opponent, units: transform(state.board.bases.opponent.units) },
      },
      battlefields: {
        bf1: { ...state.board.battlefields.bf1, units: transform(state.board.battlefields.bf1.units) },
        bf2: { ...state.board.battlefields.bf2, units: transform(state.board.battlefields.bf2.units) },
      },
    },
  };
}

function getAllUnitsOnBoard(state: GameState): UnitObject[] {
  const units: UnitObject[] = [];
  for (const pid of ['player', 'opponent'] as PlayerId[]) {
    units.push(...state.board.bases[pid].units);
  }
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    units.push(...state.board.battlefields[bfId].units);
  }
  return units;
}

// ─── Move Unit ────────────────────────────────────────────────────────────────

function applyMoveUnit(
  state: GameState,
  playerId: PlayerId,
  unitInstanceId: string,
  destination: LocationId
): GameState {
  // Find unit (in base or battlefields)
  let unit: UnitObject | undefined;
  let fromLocation: LocationId | undefined;
  let isChampion = false;

  // Check champion zone
  const champion = state.players[playerId].chosenChampion;
  if (champion && champion.instanceId === unitInstanceId) {
    unit = champion;
    fromLocation = champion.location;
    isChampion = true;
  }

  if (!unit) {
    const base = state.board.bases[playerId];
    unit = base.units.find((u) => u.instanceId === unitInstanceId);
    if (unit) fromLocation = 'base';
  }

  if (!unit) {
    for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
      const bf = state.board.battlefields[bfId];
      const found = bf.units.find((u) => u.instanceId === unitInstanceId);
      if (found) {
        unit = found;
        fromLocation = bfId;
        break;
      }
    }
  }

  if (!unit || !fromLocation) return state;
  if (unit.exhausted) return state;

  const movedUnit: UnitObject = {
    ...unit,
    exhausted: true,
    location: destination,
    damage: 0, // zone change clears damage
    mightBonus: 0, // zone change clears temp buffs
    hasBuff: false,
  };

  const log = [
    ...state.log,
    `[Move] ${playerId} moves ${unit.name} from ${fromLocation} to ${destination}.`,
  ];

  // Remove from source
  let newState = removeUnitFromLocation(state, unit, fromLocation, isChampion);

  // Add to destination
  newState = addUnitToLocation(newState, movedUnit, destination, isChampion);

  newState = { ...newState, log };

  return performCleanup(newState);
}

function removeUnitFromLocation(
  state: GameState,
  unit: UnitObject,
  location: LocationId,
  isChampion: boolean
): GameState {
  if (isChampion) {
    return state; // champion is tracked separately; we update it below
  }
  if (location === 'base') {
    const base = state.board.bases[unit.controllerId];
    return {
      ...state,
      board: {
        ...state.board,
        bases: {
          ...state.board.bases,
          [unit.controllerId]: { ...base, units: base.units.filter((u) => u.instanceId !== unit.instanceId) },
        },
      },
    };
  }
  // Battlefield
  const bf = state.board.battlefields[location as BattlefieldId];
  return {
    ...state,
    board: {
      ...state.board,
      battlefields: {
        ...state.board.battlefields,
        [location]: { ...bf, units: bf.units.filter((u) => u.instanceId !== unit.instanceId) },
      },
    },
  };
}

function addUnitToLocation(
  state: GameState,
  unit: UnitObject,
  destination: LocationId,
  isChampion: boolean
): GameState {
  if (isChampion) {
    // Update champion object and location
    return {
      ...state,
      players: {
        ...state.players,
        [unit.controllerId]: {
          ...state.players[unit.controllerId],
          chosenChampion: unit,
        },
      },
    };
  }
  if (destination === 'base') {
    const base = state.board.bases[unit.controllerId];
    return {
      ...state,
      board: {
        ...state.board,
        bases: {
          ...state.board.bases,
          [unit.controllerId]: { ...base, units: [...base.units, unit] },
        },
      },
    };
  }
  // Battlefield
  const bf = state.board.battlefields[destination as BattlefieldId];
  return {
    ...state,
    board: {
      ...state.board,
      battlefields: {
        ...state.board.battlefields,
        [destination]: { ...bf, units: [...bf.units, unit] },
      },
    },
  };
}

// ─── End Turn ─────────────────────────────────────────────────────────────────

function applyEndTurn(state: GameState): GameState {
  // Before ending, resolve any pending combats
  let s = state;
  for (const bfId of s.pendingCombats) {
    s = resolveCombat(s, bfId);
    if (s.winner) return s;
  }
  return advancePhase({ ...s, phase: 'action' });
}

// ─── Resolve Combat (explicit action) ────────────────────────────────────────

function resolveCombatAction(state: GameState, bfId: BattlefieldId): GameState {
  return resolveCombat(state, bfId);
}
