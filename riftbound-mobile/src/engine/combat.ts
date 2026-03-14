/**
 * Combat resolution.
 *
 * v1: simplified combat (no showdown step — goes straight to damage).
 * Handles: Tank priority, Assault/Shield bonus might, Stun (no might contribution).
 */

import type {
  GameState,
  BattlefieldId,
  UnitObject,
  PlayerId,
  HandCard,
} from './types';
import { getMight, isLethal, getOpponent } from './gameState';

/** Extract Assault bonus from ability text (e.g. "Assault 2" → 2) */
function getAssaultValue(unit: UnitObject): number {
  const m = unit.ability.match(/\bAssault\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

/** Extract Shield bonus from ability text (e.g. "Shield 2" → 2) */
function getShieldValue(unit: UnitObject): number {
  const m = unit.ability.match(/\bShield\s+(\d+)/i);
  return m ? parseInt(m[1], 10) : 0;
}

function hasTank(unit: UnitObject): boolean {
  return /\bTank\b/i.test(unit.ability);
}

function hasStun(unit: UnitObject): boolean {
  return /\bStunned\b/i.test(unit.ability);
}

/**
 * Apply combat at a battlefield.
 *
 * Attacker = the player who caused the contested status (simplified: the player
 * who moved units there). In v1 we treat both as attacking each other.
 *
 * Steps:
 * 1. Calculate effective might for each side (Assault for attackers, Shield for defenders).
 * 2. Assign attacker damage to defenders (Tank first, then lethal before moving on).
 * 3. Assign defender damage to attackers (same rules).
 * 4. Remove lethal units to trash.
 * 5. Determine if battlefield changes control (all defenders removed).
 */
export function resolveCombat(
  state: GameState,
  bfId: BattlefieldId
): GameState {
  const bf = state.board.battlefields[bfId];
  const log = [...state.log];

  const playerUnits = bf.units.filter((u) => u.controllerId === 'player');
  const oppUnits = bf.units.filter((u) => u.controllerId === 'opponent');

  if (playerUnits.length === 0 || oppUnits.length === 0) {
    // No combat needed
    return state;
  }

  log.push(`[Combat] at ${bf.name}`);

  // Determine attacker / defender
  // In v1: whoever moved there last is attacker; we'll use the existing
  // isContested flag — if controller is null or opponent, player is attacker.
  const attackerId: PlayerId = bf.controller === 'opponent' ? 'player' : 'opponent';
  const defenderId = getOpponent(attackerId);

  const attackers = bf.units.filter((u) => u.controllerId === attackerId);
  const defenders = bf.units.filter((u) => u.controllerId === defenderId);

  // Apply combat bonuses
  const attackersWithBonus = attackers.map((u) => ({
    ...u,
    mightBonus: u.mightBonus + getAssaultValue(u),
  }));
  const defendersWithBonus = defenders.map((u) => ({
    ...u,
    mightBonus: u.mightBonus + getShieldValue(u),
  }));

  // Total might pools
  const atkPool = attackersWithBonus
    .filter((u) => !hasStun(u))
    .reduce((s, u) => s + getMight(u), 0);
  const defPool = defendersWithBonus
    .filter((u) => !hasStun(u))
    .reduce((s, u) => s + getMight(u), 0);

  log.push(`  ${attackerId} attacks with ${atkPool} total might`);
  log.push(`  ${defenderId} defends with ${defPool} total might`);

  // Assign damage to defenders
  const damagedDefenders = assignDamage(defendersWithBonus, atkPool);
  // Assign damage to attackers
  const damagedAttackers = assignDamage(attackersWithBonus, defPool);

  // Separate surviving and killed units
  const survivingDefenders = damagedDefenders.filter((u) => !isLethal(u));
  const killedDefenders = damagedDefenders.filter(isLethal);
  const survivingAttackers = damagedAttackers.filter((u) => !isLethal(u));
  const killedAttackers = damagedAttackers.filter(isLethal);

  for (const u of killedAttackers) log.push(`  ${u.name} (${attackerId}) killed.`);
  for (const u of killedDefenders) log.push(`  ${u.name} (${defenderId}) killed.`);

  // Determine new battlefield state
  let newController = bf.controller;
  const allDefendersKilled = survivingDefenders.length === 0 && defenders.length > 0;
  const allAttackersKilled = survivingAttackers.length === 0 && attackers.length > 0;

  if (allDefendersKilled && !allAttackersKilled) {
    // Conquer
    newController = attackerId;
    log.push(`  [Conquer] ${attackerId} conquers ${bf.name}!`);
  }

  // After combat: if both sides survive, attackers recalled to base
  let finalAttackers = [...survivingAttackers];
  if (!allDefendersKilled && survivingAttackers.length > 0) {
    log.push(`  Attackers recalled to ${attackerId}'s base.`);
    finalAttackers = []; // they'll be moved to base below
  }

  // Build new unit list for battlefield (surviving units + strippers removed damage bonus)
  const cleanUnit = (u: UnitObject): UnitObject => ({
    ...u,
    mightBonus: 0, // combat bonuses are temporary
    damage: 0,     // damage is cleared after combat (expiration step handles end-of-turn; here we clear post-combat)
  });

  const newBfUnits = [
    ...finalAttackers.map(cleanUnit),
    ...survivingDefenders.map(cleanUnit),
  ];

  // Move recalled attackers back to base
  const recalledUnits = survivingAttackers.filter(() => !allDefendersKilled).map((u) => ({
    ...u,
    mightBonus: 0,
    damage: 0,
    location: 'base' as const,
    exhausted: true,
  }));

  // Move killed units to trash
  const sendToTrash = (
    units: UnitObject[],
    currentState: GameState
  ): GameState => {
    let s = currentState;
    for (const u of units) {
      if (u.isToken) continue; // tokens cease to exist
      const trashCard: HandCard = {
        instanceId: u.instanceId,
        defId: u.defId,
        name: u.name,
        cardType: u.cardType,
        domain: u.domain,
        energy: u.energy,
        might: u.mightBase,
        tags: u.tags,
        ability: u.ability,
        imageUrl: null,
        ownerId: u.ownerId,
      };
      s = {
        ...s,
        players: {
          ...s.players,
          [u.ownerId]: {
            ...s.players[u.ownerId],
            trash: [...s.players[u.ownerId].trash, trashCard],
          },
        },
      };
    }
    return s;
  };

  let newState = sendToTrash([...killedAttackers, ...killedDefenders], state);

  // Update base with recalled attackers
  const atkBase = newState.board.bases[attackerId];
  const newAtkBase = {
    ...atkBase,
    units: [...atkBase.units, ...recalledUnits],
  };

  // Update battlefield
  const newBf = {
    ...bf,
    units: newBfUnits,
    controller: newController,
    isContested: false,
    pendingCombat: false,
  };

  newState = {
    ...newState,
    board: {
      ...newState.board,
      bases: { ...newState.board.bases, [attackerId]: newAtkBase },
      battlefields: { ...newState.board.battlefields, [bfId]: newBf },
    },
    pendingCombats: newState.pendingCombats.filter((id) => id !== bfId),
    log,
  };

  // Score conquer if applicable
  if (allDefendersKilled && !allAttackersKilled) {
    newState = scoreConquer(newState, attackerId, bfId);
  }

  return newState;
}

/**
 * Distribute `pool` damage to targets.
 * Tank units must receive lethal damage before non-tank units.
 * A unit must receive lethal damage before moving to the next.
 */
function assignDamage(targets: UnitObject[], pool: number): UnitObject[] {
  if (pool === 0) return targets;

  const result = targets.map((u) => ({ ...u }));

  // Sort: tanks first
  const tanks = result.filter(hasTank);
  const nonTanks = result.filter((u) => !hasTank(u));
  const ordered = [...tanks, ...nonTanks];

  let remaining = pool;
  for (const unit of ordered) {
    if (remaining <= 0) break;
    const lethalNeeded = getMight(unit) - unit.damage;
    const dmg = Math.min(remaining, lethalNeeded + remaining); // must assign at least lethal before next
    // Rules: must assign enough to kill before moving on, but excess can go elsewhere
    // We assign exactly lethal to each target (can't split past that unless all are lethal)
    const assignedDmg = Math.min(remaining, Math.max(lethalNeeded, 0) + 0);
    // Simple v1: assign up to lethal, then remainder carries over
    const toAssign = remaining >= lethalNeeded ? lethalNeeded : remaining;
    unit.damage += toAssign;
    remaining -= toAssign;
  }

  // Any overflow damage is lost (units were already at lethal)
  return result;
}

/** Score a Conquer and check win condition */
function scoreConquer(
  state: GameState,
  playerId: PlayerId,
  bfId: BattlefieldId
): GameState {
  const ps = state.players[playerId];
  const log = [...state.log];

  if (ps.scoredThisTurn.includes(bfId)) return state; // already scored this bf this turn

  const allBfs: BattlefieldId[] = ['bf1', 'bf2'];
  const newScored = [...ps.scoredThisTurn, bfId];
  const scoredAll = allBfs.every((id) => newScored.includes(id));

  const newPts = ps.points + 1;
  log.push(`[Conquer] ${playerId} scores ${bfId} → +1 point (total: ${newPts})`);

  // Final point rules
  if (newPts === state.victoryScore - 1) {
    // At 7 pts with victory at 8
    if (scoredAll) {
      log.push(`[Final Point] ${playerId} conquered all battlefields — wins!`);
      return {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...ps, points: newPts + 1, scoredThisTurn: newScored },
        },
        phase: 'gameOver',
        winner: playerId,
        log,
      };
    } else {
      // Draw a card instead
      log.push(`[Final Point] ${playerId} draws a card instead of winning.`);
      let newState = {
        ...state,
        players: {
          ...state.players,
          [playerId]: { ...ps, points: newPts, scoredThisTurn: newScored },
        },
        log,
      };
      // drawCards import would cause circular dep — inline simple draw
      const psCopy = { ...newState.players[playerId] };
      if (psCopy.mainDeck.length > 0) {
        const [drawn, ...rest] = psCopy.mainDeck;
        psCopy.hand = [...psCopy.hand, drawn];
        psCopy.mainDeck = rest;
        newState.players = { ...newState.players, [playerId]: psCopy };
        newState.log = [...newState.log, `[Draw] ${playerId} draws ${drawn.name}.`];
      }
      return newState;
    }
  }

  let newState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...ps, points: newPts, scoredThisTurn: newScored },
    },
    log,
  };

  if (newPts >= state.victoryScore) {
    return { ...newState, phase: 'gameOver', winner: playerId };
  }

  return newState;
}
