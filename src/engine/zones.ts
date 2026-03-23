import {
  BattlefieldId,
  BattlefieldSlot,
  CardInstance,
  ChainItem,
  FacedownCard,
  GameState,
  InstanceId,
  PlayerId,
  RuneInstance,
} from './gameState';

// ─── Zone Change Rule ────────────────────────────────────────────────────────

/**
 * Per the Zone Change Rule: when a Game Object moves to or from a Non-Board
 * Zone, all temporary modifications (damage, buffs, keywords, statuses) are
 * cleared. Tokens cease to exist instead of entering a non-board zone.
 */
export function clearTempModifications(card: CardInstance): CardInstance {
  return {
    ...card,
    damage: 0,
    buffs: 0,
    isAttacker: false,
    isDefender: false,
    isStunned: false,
    temporaryKeywords: [],
    readyStatus: 'Ready',
  };
}

// ─── Hand ────────────────────────────────────────────────────────────────────

/** Add a card to a player's hand. Clears temp modifications (non-board zone). */
export function addToHand(state: GameState, playerId: PlayerId, card: CardInstance): GameState {
  if (card.definition.type === 'Token') return state; // Tokens cease to exist
  const cleared = clearTempModifications(card);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        hand: [...state.players[playerId].hand, cleared],
      },
    },
  };
}

/** Remove a specific card from a player's hand by instanceId. */
export function removeFromHand(
  state: GameState,
  playerId: PlayerId,
  instanceId: InstanceId,
): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        hand: state.players[playerId].hand.filter((c) => c.instanceId !== instanceId),
      },
    },
  };
}

// ─── Main Deck ───────────────────────────────────────────────────────────────

/** Place a card into a player's main deck. Clears temp modifications. */
export function addToMainDeck(
  state: GameState,
  playerId: PlayerId,
  card: CardInstance,
  position: 'top' | 'bottom',
): GameState {
  if (card.definition.type === 'Token') return state;
  const cleared = clearTempModifications(card);
  const deck = state.players[playerId].mainDeck;
  const newDeck = position === 'top' ? [cleared, ...deck] : [...deck, cleared];
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...state.players[playerId], mainDeck: newDeck },
    },
  };
}

/** Draw the top card of a player's main deck into their hand. */
export function drawCard(state: GameState, playerId: PlayerId): GameState {
  const deck = state.players[playerId].mainDeck;
  if (deck.length === 0) return state; // Burn Out handled externally
  const [top, ...rest] = deck;
  return addToHand(
    {
      ...state,
      players: {
        ...state.players,
        [playerId]: { ...state.players[playerId], mainDeck: rest },
      },
    },
    playerId,
    top,
  );
}

// ─── Rune Deck ───────────────────────────────────────────────────────────────

/** Draw the top rune from a player's rune deck (used during Channel Phase). */
export function channelRune(state: GameState, playerId: PlayerId): { state: GameState; rune: RuneInstance | null } {
  const runeDeck = state.players[playerId].runeDeck;
  if (runeDeck.length === 0) return { state, rune: null };
  const [top, ...rest] = runeDeck;
  const newState = {
    ...state,
    players: {
      ...state.players,
      [playerId]: { ...state.players[playerId], runeDeck: rest },
    },
  };
  return { state: newState, rune: top };
}

/** Return a rune to the bottom of a player's rune deck (recycle). */
export function recycleRune(state: GameState, playerId: PlayerId, rune: RuneInstance): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        runeDeck: [...state.players[playerId].runeDeck, rune],
      },
    },
  };
}

// ─── Trash ───────────────────────────────────────────────────────────────────

/** Move a card to a player's trash. Clears temp modifications (non-board zone). */
export function addToTrash(state: GameState, playerId: PlayerId, card: CardInstance): GameState {
  if (card.definition.type === 'Token') return state; // Tokens cease to exist
  const cleared = clearTempModifications(card);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        trash: [...state.players[playerId].trash, cleared],
      },
    },
  };
}

// ─── Banishment ──────────────────────────────────────────────────────────────

/** Move a card to a player's banishment zone. Clears temp modifications. */
export function addToBanishment(
  state: GameState,
  playerId: PlayerId,
  card: CardInstance,
): GameState {
  if (card.definition.type === 'Token') return state;
  const cleared = clearTempModifications(card);
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        banishment: [...state.players[playerId].banishment, cleared],
      },
    },
  };
}

// ─── Base ────────────────────────────────────────────────────────────────────

/** Place a permanent (Unit or Gear) onto a player's base. */
export function addToBase(
  state: GameState,
  playerId: PlayerId,
  card: CardInstance,
): GameState {
  const base = state.board.bases[playerId];
  return {
    ...state,
    board: {
      ...state.board,
      bases: {
        ...state.board.bases,
        [playerId]: {
          ...base,
          permanents: [...base.permanents, card],
        },
      },
    },
  };
}

/** Remove a permanent from a player's base by instanceId. */
export function removeFromBase(
  state: GameState,
  playerId: PlayerId,
  instanceId: InstanceId,
): GameState {
  const base = state.board.bases[playerId];
  return {
    ...state,
    board: {
      ...state.board,
      bases: {
        ...state.board.bases,
        [playerId]: {
          ...base,
          permanents: base.permanents.filter((c) => c.instanceId !== instanceId),
        },
      },
    },
  };
}

// ─── Battlefield ──────────────────────────────────────────────────────────────

/** Move a unit to a specific battlefield. Only units may be at battlefields. */
export function addUnitToBattlefield(
  state: GameState,
  unit: CardInstance,
  battlefieldId: BattlefieldId,
): GameState {
  const idx = state.board.battlefields.findIndex(
    (bf) => bf.battlefield.definition.id === battlefieldId,
  );
  if (idx === -1) throw new Error(`Battlefield "${battlefieldId}" not found on board`);

  const bf = state.board.battlefields[idx];
  const updated: BattlefieldSlot = { ...bf, units: [...bf.units, unit] };
  const battlefields = [...state.board.battlefields];
  battlefields[idx] = updated;

  return { ...state, board: { ...state.board, battlefields } };
}

/** Remove a unit from a battlefield by instanceId. */
export function removeUnitFromBattlefield(
  state: GameState,
  battlefieldId: BattlefieldId,
  instanceId: InstanceId,
): GameState {
  const idx = state.board.battlefields.findIndex(
    (bf) => bf.battlefield.definition.id === battlefieldId,
  );
  if (idx === -1) throw new Error(`Battlefield "${battlefieldId}" not found on board`);

  const bf = state.board.battlefields[idx];
  const updated: BattlefieldSlot = {
    ...bf,
    units: bf.units.filter((u) => u.instanceId !== instanceId),
  };
  const battlefields = [...state.board.battlefields];
  battlefields[idx] = updated;

  return { ...state, board: { ...state.board, battlefields } };
}

// ─── Facedown (Hidden) Zone ──────────────────────────────────────────────────

/**
 * Hide a card facedown at a specific battlefield (Hidden keyword).
 * Max 1 facedown card per battlefield is enforced.
 */
export function addToFacedownZone(
  state: GameState,
  playerId: PlayerId,
  card: CardInstance,
  battlefieldId: BattlefieldId,
): GameState {
  const player = state.players[playerId];
  const alreadyHidden = player.facedownZone.some((fd) => fd.atBattlefieldId === battlefieldId);
  if (alreadyHidden) {
    throw new Error(
      `Cannot hide card: battlefield "${battlefieldId}" already has a facedown card`,
    );
  }

  const facedownCard: FacedownCard = {
    card,
    atBattlefieldId: battlefieldId,
    hiddenOnTurn: state.turnNumber,
  };

  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...player,
        facedownZone: [...player.facedownZone, facedownCard],
      },
    },
  };
}

/** Remove a facedown card from a player's facedown zone by the card's instanceId. */
export function removeFromFacedownZone(
  state: GameState,
  playerId: PlayerId,
  instanceId: InstanceId,
): GameState {
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        facedownZone: state.players[playerId].facedownZone.filter(
          (fd) => fd.card.instanceId !== instanceId,
        ),
      },
    },
  };
}

// ─── Chain ───────────────────────────────────────────────────────────────────

/** Place a card onto the chain (when a card is played or ability activated). */
export function addToChain(
  state: GameState,
  card: CardInstance,
  controller: PlayerId,
  targets: InstanceId[] = [],
): GameState {
  const item: ChainItem = { instanceId: card.instanceId, card, controller, targets };
  return {
    ...state,
    chain: [...state.chain, item],
    chainState: 'Closed',
  };
}

/** Remove the top item from the chain (during resolution). */
export function resolveTopChainItem(state: GameState): { state: GameState; item: ChainItem | null } {
  if (state.chain.length === 0) return { state, item: null };
  const chain = [...state.chain];
  const item = chain.pop()!;
  const newState = {
    ...state,
    chain,
    chainState: chain.length === 0 ? ('Open' as const) : ('Closed' as const),
  };
  return { state: newState, item };
}
