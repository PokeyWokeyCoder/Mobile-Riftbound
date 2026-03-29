/**
 * Phase advancement and per-phase logic.
 *
 * Turn order:
 *   awaken → beginning → channel → draw → action → end → expiration → cleanup
 *   then next player's awaken
 */

import type { GameState, PlayerId, BattlefieldId, UnitObject, Phase } from './types';
import { getOpponent, shuffleArray, newId } from './gameState';

// How many runes the turn player channels per turn (base 2; second player first turn gets 3)
export function runesPerChannel(state: GameState): number {
  if (state.turnNumber === 1 && state.turnPlayer !== state.players.player.id) {
    return 3; // going-second bonus on turn 1
  }
  return 2;
}

export function advancePhase(state: GameState): GameState {
  const phases: Phase[] = [
    'awaken',
    'beginning',
    'channel',
    'draw',
    'action',
    'end',
    'expiration',
    'cleanup',
  ];
  const idx = phases.indexOf(state.phase);
  const next = phases[idx + 1] as Phase | undefined;

  if (!next) {
    // End of turn — switch players
    return startNextTurn(state);
  }

  let newState = { ...state, phase: next };
  return applyPhaseEntry(newState);
}

function applyPhaseEntry(state: GameState): GameState {
  switch (state.phase) {
    case 'awaken':
      return applyAwaken(state);
    case 'beginning':
      return applyBeginning(state);
    case 'channel':
      return { ...state, runesChanneledThisTurn: 0 };
    case 'draw':
      return applyDraw(state);
    case 'action':
      return { ...state, priorityHolder: state.turnPlayer, turnState: 'NeutralOpen' };
    case 'end':
      return applyEnd(state);
    case 'expiration':
      return applyExpiration(state);
    case 'cleanup':
      return applyCleanupPhase(state);
    default:
      return state;
  }
}

// ── Awaken Phase ──────────────────────────────────────────────────────────────

function applyAwaken(state: GameState): GameState {
  const tp = state.turnPlayer;
  const base = state.board.bases[tp];

  // Ready all units in base and battlefields controlled by turn player
  const readyUnits = (units: UnitObject[]) =>
    units.map((u) => (u.controllerId === tp ? { ...u, exhausted: false } : u));

  const newBases = {
    ...state.board.bases,
    [tp]: { ...base, units: readyUnits(base.units) },
  };

  const newBattlefields = { ...state.board.battlefields };
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = newBattlefields[bfId];
    newBattlefields[bfId] = { ...bf, units: readyUnits(bf.units) };
  }

  const log = [...state.log, `[Turn ${state.turnNumber}] ${tp} — Awaken Phase: all units readied.`];
  return { ...state, board: { ...state.board, bases: newBases, battlefields: newBattlefields }, log };
}

// ── Beginning Phase (Scoring Step) ────────────────────────────────────────────

function applyBeginning(state: GameState): GameState {
  const tp = state.turnPlayer;
  let newState = { ...state };
  const log = [...state.log];

  // Reset scored-this-turn tracker
  newState = {
    ...newState,
    players: {
      ...newState.players,
      [tp]: { ...newState.players[tp], scoredThisTurn: [] },
    },
  };

  // Score for each battlefield the turn player controls (Hold scoring)
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = newState.board.battlefields[bfId];
    if (bf.controller === tp && !newState.players[tp].scoredThisTurn.includes(bfId)) {
      const pts = newState.players[tp].points;
      const newPts = pts + 1;
      const alreadyScored = newState.players[tp].scoredThisTurn;

      log.push(`[Scoring] ${tp} holds ${bf.name} → +1 point (total: ${newPts})`);

      newState = {
        ...newState,
        players: {
          ...newState.players,
          [tp]: {
            ...newState.players[tp],
            points: newPts,
            scoredThisTurn: [...alreadyScored, bfId],
          },
        },
      };

      // Check win condition (hold final point at 7 → win at 8)
      if (newPts >= newState.victoryScore) {
        return { ...newState, phase: 'gameOver', winner: tp, log };
      }
    }
  }

  return { ...newState, log };
}

// ── Draw Phase ────────────────────────────────────────────────────────────────

function applyDraw(state: GameState): GameState {
  let newState = drawCards(state, state.turnPlayer, 1);

  // Empty rune pool at end of draw phase
  newState = {
    ...newState,
    players: {
      ...newState.players,
      [state.turnPlayer]: {
        ...newState.players[state.turnPlayer],
        runePool: { energy: 0, power: {} },
      },
    },
  };

  return newState;
}

export function drawCards(state: GameState, playerId: PlayerId, count: number): GameState {
  let ps = { ...state.players[playerId] };
  const log = [...state.log];

  for (let i = 0; i < count; i++) {
    if (ps.mainDeck.length === 0) {
      // Burn Out
      if (ps.trash.length === 0) {
        log.push(`[Burn Out] ${playerId} has no cards to draw — skipped.`);
        break;
      }
      const shuffled = shuffleArray([...ps.trash]);
      ps = { ...ps, trash: [], mainDeck: shuffled };
      const opp = getOpponent(playerId);
      const oppPts = state.players[opp].points + 1;
      log.push(`[Burn Out] ${playerId} shuffles trash into deck. ${opp} gains 1 point.`);

      const newState = {
        ...state,
        players: {
          ...state.players,
          [playerId]: ps,
          [opp]: { ...state.players[opp], points: oppPts },
        },
        log,
      };

      if (oppPts >= state.victoryScore) {
        return { ...newState, phase: 'gameOver', winner: opp };
      }
      state = newState;
    }

    const [drawn, ...remaining] = ps.mainDeck;
    ps = { ...ps, hand: [...ps.hand, drawn], mainDeck: remaining };
    log.push(`[Draw] ${playerId} draws ${drawn.name}.`);
  }

  return { ...state, players: { ...state.players, [playerId]: ps }, log };
}

// ── End of Turn Phase ─────────────────────────────────────────────────────────

function applyEnd(state: GameState): GameState {
  const log = [...state.log, `[End Phase] ${state.turnPlayer} end-of-turn effects.`];
  return { ...state, log };
}

// ── Expiration Step ───────────────────────────────────────────────────────────

function applyExpiration(state: GameState): GameState {
  const tp = state.turnPlayer;
  const log = [...state.log, `[Expiration] Damage cleared, rune pools emptied.`];

  // Clear damage from all units at end of turn
  const clearDamage = (units: UnitObject[]) => units.map((u) => ({ ...u, damage: 0 }));

  const newBases = {
    ...state.board.bases,
    [tp]: { ...state.board.bases[tp], units: clearDamage(state.board.bases[tp].units) },
  };
  const opp = getOpponent(tp);
  newBases[opp] = { ...state.board.bases[opp], units: clearDamage(state.board.bases[opp].units) };

  const newBattlefields = { ...state.board.battlefields };
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = newBattlefields[bfId];
    newBattlefields[bfId] = { ...bf, units: clearDamage(bf.units) };
  }

  // Empty rune pools
  const newPlayers = { ...state.players };
  newPlayers[tp] = { ...newPlayers[tp], runePool: { energy: 0, power: {} } };

  return {
    ...state,
    board: { ...state.board, bases: newBases, battlefields: newBattlefields },
    players: newPlayers,
    log,
  };
}

// ── Cleanup Phase (end-of-turn) ───────────────────────────────────────────────

function applyCleanupPhase(state: GameState): GameState {
  // Perform cleanup then transition to next turn
  const log = [...state.log, `[Cleanup] End of turn cleanup.`];
  return { ...state, log };
}

// ── Start Next Turn ───────────────────────────────────────────────────────────

export function startNextTurn(state: GameState): GameState {
  const nextPlayer = getOpponent(state.turnPlayer);
  const newTurnNumber = nextPlayer === 'player' ? state.turnNumber + 1 : state.turnNumber;
  const log = [...state.log, `--- Turn ${newTurnNumber}: ${nextPlayer}'s turn ---`];

  const newState: GameState = {
    ...state,
    turnNumber: newTurnNumber,
    turnPlayer: nextPlayer,
    phase: 'awaken',
    turnState: 'NeutralOpen',
    priorityHolder: nextPlayer,
    focusHolder: null,
    runesChanneledThisTurn: 0,
    log,
  };

  return applyPhaseEntry(newState);
}

export function isChannelPhaseComplete(state: GameState): boolean {
  return state.runesChanneledThisTurn >= runesPerChannel(state);
}
