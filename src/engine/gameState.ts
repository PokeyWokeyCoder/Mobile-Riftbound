// ─── Identifiers ────────────────────────────────────────────────────────────

export type PlayerId = string;
export type InstanceId = string;
export type BattlefieldId = string;

// ─── Domains ────────────────────────────────────────────────────────────────

export type Domain = 'Fury' | 'Calm' | 'Mind' | 'Body' | 'Chaos' | 'Order';

// ─── Card Types ─────────────────────────────────────────────────────────────

export type CardType = 'Unit' | 'Gear' | 'Spell' | 'Rune' | 'Legend' | 'Battlefield' | 'Token';

export type ReadyStatus = 'Ready' | 'Exhausted';

// ─── Keywords ───────────────────────────────────────────────────────────────

export type KeywordType =
  | 'Accelerate'
  | 'Action'
  | 'Assault'
  | 'Deathknell'
  | 'Deflect'
  | 'Ganking'
  | 'Hidden'
  | 'Legion'
  | 'Reaction'
  | 'Shield'
  | 'Tank'
  | 'Temporary'
  | 'Vision';

export interface Keyword {
  type: KeywordType;
  value?: number; // For Assault [X], Shield [X], Deflect [X]
}

// ─── Card Definitions (printed) ─────────────────────────────────────────────

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  domains: Domain[];
  energyCost: number;
  powerCost: Partial<Record<Domain, number>>;
  might?: number; // Units and Tokens only
  tags: string[];
  keywords: Keyword[];
  text?: string;
  isSignature?: boolean;
  isChosenChampion?: boolean;
}

export interface RuneDefinition {
  id: string;
  name: string;
  domain: Domain;
}

export interface LegendDefinition {
  id: string;
  name: string;
  domainIdentity: Domain[];
  tag: string; // Champion Legend tag; Chosen Champions must match this
  text?: string;
}

export interface BattlefieldDefinition {
  id: BattlefieldId;
  name: string;
  text?: string;
}

// ─── Card Instances (runtime state) ─────────────────────────────────────────

export interface CardInstance {
  instanceId: InstanceId;
  definition: CardDefinition;
  ownerId: PlayerId;
  controllerId: PlayerId;
  // Runtime state — cleared by zone change rule when moving to/from a non-board zone
  damage: number;
  buffs: number;
  readyStatus: ReadyStatus;
  isAttacker: boolean;
  isDefender: boolean;
  isStunned: boolean;
  temporaryKeywords: Keyword[];
}

export interface RuneInstance {
  instanceId: InstanceId;
  definition: RuneDefinition;
  ownerId: PlayerId;
}

export interface LegendInstance {
  instanceId: InstanceId;
  definition: LegendDefinition;
  ownerId: PlayerId;
}

export interface BattlefieldInstance {
  instanceId: InstanceId;
  definition: BattlefieldDefinition;
}

// ─── Facedown (Hidden) Zone ──────────────────────────────────────────────────

export interface FacedownCard {
  card: CardInstance;
  atBattlefieldId: BattlefieldId;
  hiddenOnTurn: number; // Turn the card was hidden; may be played free the following turn
}

// ─── Board State ─────────────────────────────────────────────────────────────

/** Per-player home zone. Contains units and gear. */
export interface BaseSlot {
  playerId: PlayerId;
  permanents: CardInstance[]; // Units and Gear stationed here
}

/** Shared battlefield zone. Only units may be present (no gear). */
export interface BattlefieldSlot {
  battlefield: BattlefieldInstance;
  controller: PlayerId | null;
  units: CardInstance[]; // Units from any player
  isContested: boolean;
  isPendingCombat: boolean;
}

export interface BoardState {
  battlefields: BattlefieldSlot[];
  bases: Record<PlayerId, BaseSlot>;
}

// ─── Resources ───────────────────────────────────────────────────────────────

export interface RunePool {
  energy: number;
  power: Partial<Record<Domain, number>>;
}

// ─── Player State ─────────────────────────────────────────────────────────────

export interface PlayerState {
  id: PlayerId;
  hand: CardInstance[];          // Private
  mainDeck: CardInstance[];      // Secret
  runeDeck: RuneInstance[];      // Secret
  trash: CardInstance[];         // Public, unordered
  banishment: CardInstance[];    // Public, unordered
  legendZone: LegendInstance;    // Public, immovable
  championZone: CardInstance;    // Public, immovable
  facedownZone: FacedownCard[];  // Private, max 1 per Battlefield
  runePool: RunePool;
  points: number;
}

// ─── Chain ───────────────────────────────────────────────────────────────────

export interface ChainItem {
  instanceId: InstanceId;
  card: CardInstance;
  controller: PlayerId;
  targets: InstanceId[];
}

// ─── Game Phases ─────────────────────────────────────────────────────────────

export type Phase =
  | 'Setup'
  | 'Awaken'
  | 'Beginning'
  | 'Channel'
  | 'Draw'
  | 'Action'
  | 'EndOfTurn';

// ─── Game State ──────────────────────────────────────────────────────────────

export interface GameState {
  phase: Phase;
  turnPlayer: PlayerId;
  turnNumber: number;
  firstPlayer: PlayerId;
  chainState: 'Open' | 'Closed';
  showdownState: 'Neutral' | 'Showdown';
  priorityHolder: PlayerId | null;
  focusHolder: PlayerId | null;
  players: Record<PlayerId, PlayerState>;
  board: BoardState;
  chain: ChainItem[];
  pendingCombats: BattlefieldId[];
}
