import {
  BattlefieldDefinition,
  BattlefieldInstance,
  BattlefieldSlot,
  BaseSlot,
  BoardState,
  CardDefinition,
  CardInstance,
  GameState,
  LegendDefinition,
  LegendInstance,
  PlayerId,
  PlayerState,
  RuneDefinition,
  RuneInstance,
} from './gameState';

// ─── Instance ID Generation ───────────────────────────────────────────────────

let _counter = 0;

export function nextInstanceId(): string {
  return `inst-${++_counter}`;
}

/** Reset instance counter — use in test beforeEach only. */
export function resetInstanceIds(): void {
  _counter = 0;
}

// ─── Instance Factories ──────────────────────────────────────────────────────

export function createCardInstance(def: CardDefinition, ownerId: PlayerId): CardInstance {
  return {
    instanceId: nextInstanceId(),
    definition: def,
    ownerId,
    controllerId: ownerId,
    damage: 0,
    buffs: 0,
    readyStatus: 'Ready',
    isAttacker: false,
    isDefender: false,
    isStunned: false,
    temporaryKeywords: [],
  };
}

export function createRuneInstance(def: RuneDefinition, ownerId: PlayerId): RuneInstance {
  return { instanceId: nextInstanceId(), definition: def, ownerId };
}

export function createLegendInstance(def: LegendDefinition, ownerId: PlayerId): LegendInstance {
  return { instanceId: nextInstanceId(), definition: def, ownerId };
}

export function createBattlefieldInstance(def: BattlefieldDefinition): BattlefieldInstance {
  return { instanceId: nextInstanceId(), definition: def };
}

// ─── Shuffle ──────────────────────────────────────────────────────────────────

/** Fisher-Yates shuffle — returns a new array. */
export function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ─── Game Configuration ───────────────────────────────────────────────────────

export interface PlayerConfig {
  id: PlayerId;
  legend: LegendDefinition;
  /** The Chosen Champion card (Champion-type unit). Placed in Champion Zone — not shuffled into deck. */
  chosenChampion: CardDefinition;
  /** At least 40 Main Deck cards (Units, Gear, Spells). Must not include the Chosen Champion. */
  mainDeck: CardDefinition[];
  /** Exactly 12 Rune cards. */
  runeDeck: RuneDefinition[];
  /** Exactly 3 Battlefields; 1 will be randomly selected. */
  battlefields: BattlefieldDefinition[];
}

export interface GameConfig {
  players: [PlayerConfig, PlayerConfig]; // Exactly 2 players for 1v1 Duel Mode
  /** Override random first-player selection for deterministic tests. */
  firstPlayerId?: PlayerId;
}

// ─── Validation ───────────────────────────────────────────────────────────────

export class SetupValidationError extends Error {}

function validatePlayerConfig(config: PlayerConfig): void {
  if (config.mainDeck.length < 40) {
    throw new SetupValidationError(
      `Player "${config.id}" main deck has ${config.mainDeck.length} cards; minimum is 40`,
    );
  }
  if (config.runeDeck.length !== 12) {
    throw new SetupValidationError(
      `Player "${config.id}" rune deck has ${config.runeDeck.length} runes; must be exactly 12`,
    );
  }
  if (config.battlefields.length !== 3) {
    throw new SetupValidationError(
      `Player "${config.id}" must provide exactly 3 battlefields; got ${config.battlefields.length}`,
    );
  }
  if (!config.chosenChampion.isChosenChampion) {
    throw new SetupValidationError(
      `Player "${config.id}" chosen champion card must have isChosenChampion: true`,
    );
  }
}

// ─── initializeGame ───────────────────────────────────────────────────────────

/**
 * Set up a new 1v1 Duel Mode game from the given configuration.
 *
 * Steps per the official setup rules:
 * 1. Place Champion Legends in Legend Zones.
 * 2. Place Chosen Champions in Champion Zones.
 * 3. Randomly select 1 Battlefield per player; place on board.
 * 4. Shuffle Main Decks and Rune Decks; place in their zones.
 * 5. Determine Turn Order.
 * 6. Each player draws 4 cards.
 */
export function initializeGame(config: GameConfig): GameState {
  config.players.forEach(validatePlayerConfig);

  const [p1Config, p2Config] = config.players;
  const firstPlayer = config.firstPlayerId ?? p1Config.id;

  // 1 & 2: Create legend and champion instances for each player
  const p1Legend = createLegendInstance(p1Config.legend, p1Config.id);
  const p2Legend = createLegendInstance(p2Config.legend, p2Config.id);

  const p1Champion = createCardInstance(p1Config.chosenChampion, p1Config.id);
  const p2Champion = createCardInstance(p2Config.chosenChampion, p2Config.id);

  // 3: Randomly select 1 battlefield per player (others discarded)
  const p1BattlefieldDef = p1Config.battlefields[Math.floor(Math.random() * 3)];
  const p2BattlefieldDef = p2Config.battlefields[Math.floor(Math.random() * 3)];

  const p1BattlefieldSlot: BattlefieldSlot = {
    battlefield: createBattlefieldInstance(p1BattlefieldDef),
    controller: null,
    units: [],
    isContested: false,
    isPendingCombat: false,
  };

  const p2BattlefieldSlot: BattlefieldSlot = {
    battlefield: createBattlefieldInstance(p2BattlefieldDef),
    controller: null,
    units: [],
    isContested: false,
    isPendingCombat: false,
  };

  // 4: Shuffle decks
  const p1MainDeck = shuffleArray(
    p1Config.mainDeck.map((def) => createCardInstance(def, p1Config.id)),
  );
  const p2MainDeck = shuffleArray(
    p2Config.mainDeck.map((def) => createCardInstance(def, p2Config.id)),
  );

  const p1RuneDeck = shuffleArray(
    p1Config.runeDeck.map((def) => createRuneInstance(def, p1Config.id)),
  );
  const p2RuneDeck = shuffleArray(
    p2Config.runeDeck.map((def) => createRuneInstance(def, p2Config.id)),
  );

  const p1Base: BaseSlot = { playerId: p1Config.id, permanents: [] };
  const p2Base: BaseSlot = { playerId: p2Config.id, permanents: [] };

  const board: BoardState = {
    battlefields: [p1BattlefieldSlot, p2BattlefieldSlot],
    bases: { [p1Config.id]: p1Base, [p2Config.id]: p2Base },
  };

  const emptyRunePool = () => ({ energy: 0, power: {} });

  const p1State: PlayerState = {
    id: p1Config.id,
    hand: [],
    mainDeck: p1MainDeck,
    runeDeck: p1RuneDeck,
    trash: [],
    banishment: [],
    legendZone: p1Legend,
    championZone: p1Champion,
    facedownZone: [],
    runePool: emptyRunePool(),
    points: 0,
  };

  const p2State: PlayerState = {
    id: p2Config.id,
    hand: [],
    mainDeck: p2MainDeck,
    runeDeck: p2RuneDeck,
    trash: [],
    banishment: [],
    legendZone: p2Legend,
    championZone: p2Champion,
    facedownZone: [],
    runePool: emptyRunePool(),
    points: 0,
  };

  let state: GameState = {
    phase: 'Setup',
    turnPlayer: firstPlayer,
    turnNumber: 0,
    firstPlayer,
    chainState: 'Open',
    showdownState: 'Neutral',
    priorityHolder: firstPlayer,
    focusHolder: null,
    players: { [p1Config.id]: p1State, [p2Config.id]: p2State },
    board,
    chain: [],
    pendingCombats: [],
  };

  // 6: Each player draws 4 cards
  for (let i = 0; i < 4; i++) {
    state = drawFromDeck(state, p1Config.id);
    state = drawFromDeck(state, p2Config.id);
  }

  return { ...state, phase: 'Awaken', turnNumber: 1 };
}

// ─── Internal draw helper (avoids circular import with zones.ts) ─────────────

function drawFromDeck(state: GameState, playerId: PlayerId): GameState {
  const deck = state.players[playerId].mainDeck;
  if (deck.length === 0) return state;
  const [top, ...rest] = deck;
  return {
    ...state,
    players: {
      ...state.players,
      [playerId]: {
        ...state.players[playerId],
        mainDeck: rest,
        hand: [...state.players[playerId].hand, top],
      },
    },
  };
}
