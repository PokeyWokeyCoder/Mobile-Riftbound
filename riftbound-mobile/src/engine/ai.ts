/**
 * AI opponent logic.
 *
 * Easy: Random legal actions.
 * Medium: Greedy heuristic (attack when possible, play highest-cost cards).
 */

import type { GameState, Action, PlayerId } from './types';
import { getLegalActions, applyAction } from './actions';

export type Difficulty = 'easy' | 'medium';

export function getAiAction(
  state: GameState,
  playerId: PlayerId,
  difficulty: Difficulty = 'medium'
): Action | null {
  const actions = getLegalActions(state, playerId);
  if (actions.length === 0) return null;

  if (difficulty === 'easy') {
    return randomChoice(actions);
  }

  return greedyAction(state, playerId, actions);
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Medium AI: simple priority heuristic.
 * Priority order:
 * 1. ADVANCE_PHASE / END_TURN (keep game moving through non-action phases)
 * 2. CHANNEL_RUNE (recycle for power > tap for energy during channel phase)
 * 3. PLAY_UNIT (prefer higher might)
 * 4. MOVE_UNIT to battlefield (attack! prefer contested battlefields)
 * 5. PLAY_SPELL
 * 6. PLAY_GEAR
 * 7. END_TURN (when no better play exists)
 */
function greedyAction(
  state: GameState,
  playerId: PlayerId,
  actions: Action[]
): Action {
  // In non-action phases, just advance
  if (state.phase !== 'action') {
    const advance = actions.find((a) => a.type === 'ADVANCE_PHASE');
    if (advance) return advance;
    const channel = actions.find((a) => a.type === 'CHANNEL_RUNE');
    if (channel) return channel;
    return actions[0];
  }

  const ps = state.players[playerId];

  // Score each action and pick best
  const scored = actions.map((a) => ({ action: a, score: scoreAction(state, playerId, a) }));
  scored.sort((a, b) => b.score - a.score);
  return scored[0].action;
}

function scoreAction(state: GameState, playerId: PlayerId, action: Action): number {
  const ps = state.players[playerId];

  switch (action.type) {
    case 'CHANNEL_RUNE':
      return action.useRecycle ? 15 : 10;

    case 'PLAY_UNIT': {
      const card = ps.hand.find((c) => c.instanceId === action.handCardInstanceId);
      if (!card) return 0;
      // Prefer high-might units
      return 30 + (card.might ?? 0) * 3;
    }

    case 'MOVE_UNIT': {
      if (action.destination === 'base') return 5; // retreat is low priority
      const bfId = action.destination as string;
      const bf = state.board.battlefields[bfId as 'bf1' | 'bf2'];
      if (!bf) return 10;
      // High priority: attack contested or uncontrolled battlefield
      if (bf.controller !== playerId) return 40;
      return 15;
    }

    case 'PLAY_SPELL': {
      const card = ps.hand.find((c) => c.instanceId === action.handCardInstanceId);
      if (!card) return 0;
      return 20 + (card.energy ?? 0);
    }

    case 'PLAY_GEAR': {
      const card = ps.hand.find((c) => c.instanceId === action.handCardInstanceId);
      if (!card) return 0;
      return 18;
    }

    case 'END_TURN':
      // End turn only if no units left to move
      return hasMovableUnits(state, playerId) ? -10 : 0;

    case 'ADVANCE_PHASE':
      return 100; // always advance when it's the only option in non-action phase

    default:
      return 0;
  }
}

function hasMovableUnits(state: GameState, playerId: PlayerId): boolean {
  const base = state.board.bases[playerId];
  if (base.units.some((u) => !u.exhausted)) return true;

  for (const bfId of ['bf1', 'bf2'] as const) {
    const bf = state.board.battlefields[bfId];
    if (bf.units.some((u) => u.controllerId === playerId && !u.exhausted)) return true;
  }

  const champion = state.players[playerId].chosenChampion;
  if (champion && !champion.exhausted) return true;

  return false;
}

/**
 * Run the AI for a full turn until it ends its turn or the game ends.
 * Returns the new state after all AI actions.
 */
export function runAiTurn(
  state: GameState,
  playerId: PlayerId,
  difficulty: Difficulty = 'medium',
  maxActions = 100
): GameState {
  let s = state;
  let count = 0;

  while (!s.winner && s.turnPlayer === playerId && count < maxActions) {
    const action = getAiAction(s, playerId, difficulty);
    if (!action) break;
    s = applyAction(s, action);
    count++;

    // Safety: if we just ended the turn, stop
    if (s.turnPlayer !== playerId) break;
  }

  return s;
}
