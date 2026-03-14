/**
 * Cleanup step — performed after any action completes.
 *
 * 1. Kill units with damage ≥ Might → Trash.
 * 2. Evaluate battlefield contest status.
 * 3. Mark Combat as Pending where opposing units exist at the same battlefield.
 */

import type { GameState, UnitObject, BattlefieldId, HandCard, PlayerId } from './types';
import { isLethal } from './gameState';

export function performCleanup(state: GameState): GameState {
  let s = removeDeadUnits(state);
  s = updateContestStatus(s);
  s = markPendingCombats(s);
  return s;
}

function removeDeadUnits(state: GameState): GameState {
  let s = state;

  // Check battlefields
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = s.board.battlefields[bfId];
    const dead = bf.units.filter(isLethal);
    const alive = bf.units.filter((u) => !isLethal(u));
    if (dead.length > 0) {
      s = sendUnitsToTrash(s, dead);
      s = {
        ...s,
        board: {
          ...s.board,
          battlefields: {
            ...s.board.battlefields,
            [bfId]: { ...s.board.battlefields[bfId], units: alive },
          },
        },
      };
    }
  }

  // Check bases
  for (const pid of ['player', 'opponent'] as PlayerId[]) {
    const base = s.board.bases[pid];
    const dead = base.units.filter(isLethal);
    const alive = base.units.filter((u) => !isLethal(u));
    if (dead.length > 0) {
      s = sendUnitsToTrash(s, dead);
      s = {
        ...s,
        board: {
          ...s.board,
          bases: {
            ...s.board.bases,
            [pid]: { ...s.board.bases[pid], units: alive },
          },
        },
      };
    }
  }

  return s;
}

function sendUnitsToTrash(state: GameState, units: UnitObject[]): GameState {
  let s = state;
  for (const u of units) {
    if (u.isToken) continue;
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
      log: [...s.log, `[Cleanup] ${u.name} killed → trash.`],
    };
  }
  return s;
}

function updateContestStatus(state: GameState): GameState {
  let s = state;
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = s.board.battlefields[bfId];
    const playerUnits = bf.units.filter((u) => u.controllerId === 'player');
    const oppUnits = bf.units.filter((u) => u.controllerId === 'opponent');
    const isContested = playerUnits.length > 0 && oppUnits.length > 0;

    // Update controller: whoever has units here (and no contest)
    let controller = bf.controller;
    if (!isContested) {
      if (playerUnits.length > 0) controller = 'player';
      else if (oppUnits.length > 0) controller = 'opponent';
      // If no units, controller remains (holding territory)
    }

    if (bf.isContested !== isContested || bf.controller !== controller) {
      s = {
        ...s,
        board: {
          ...s.board,
          battlefields: {
            ...s.board.battlefields,
            [bfId]: { ...s.board.battlefields[bfId], isContested, controller },
          },
        },
      };
    }
  }
  return s;
}

function markPendingCombats(state: GameState): GameState {
  const pending: BattlefieldId[] = [];
  for (const bfId of ['bf1', 'bf2'] as BattlefieldId[]) {
    const bf = state.board.battlefields[bfId];
    if (bf.isContested) {
      pending.push(bfId);
    }
  }
  return { ...state, pendingCombats: pending };
}
