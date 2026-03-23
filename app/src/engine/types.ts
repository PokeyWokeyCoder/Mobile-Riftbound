// ─── Domain & Resource Types ──────────────────────────────────────────────────

export type Domain = "Fury" | "Calm" | "Mind" | "Body" | "Chaos" | "Order";

export const DOMAIN_COLORS: Record<Domain, string> = {
  Fury: "#e53e3e",
  Calm: "#38a169",
  Mind: "#3182ce",
  Body: "#dd6b20",
  Chaos: "#805ad5",
  Order: "#d69e2e",
};

export const DOMAIN_ICONS: Record<Domain, string> = {
  Fury: "🔥",
  Calm: "🌿",
  Mind: "💧",
  Body: "🟠",
  Chaos: "🌀",
  Order: "⭐",
};

// ─── Card Types ───────────────────────────────────────────────────────────────

export type CardType = "Unit" | "Gear" | "Spell" | "Rune" | "Battlefield" | "Legend";

export type Keyword =
  | "Accelerate"
  | "Action"
  | "Assault"
  | "Deathknell"
  | "Deflect"
  | "Ganking"
  | "Hidden"
  | "Legion"
  | "Reaction"
  | "Shield"
  | "Tank"
  | "Temporary"
  | "Vision";

export interface KeywordWithValue {
  keyword: Keyword;
  value?: number; // For Assault [X], Shield [X], Deflect [X]
}

// ─── Card Definition ──────────────────────────────────────────────────────────

export interface CardDefinition {
  id: string;
  name: string;
  type: CardType;
  domains: Domain[];
  energyCost: number;
  powerCost?: { domain: Domain; amount: number }[];
  might?: number;          // Units only
  tags: string[];
  keywords: KeywordWithValue[];
  rulesText: string;
  flavorText?: string;
  isChampionType?: boolean;
  isSignature?: boolean;
}

// ─── Game Object (in-play card instance) ─────────────────────────────────────

export interface GameObjectId { id: string }

export interface GameCard extends CardDefinition {
  instanceId: string;
  ownerId: PlayerId;
  controllerId: PlayerId;
  exhausted: boolean;
  damageMarked: number;
  buffCounters: number;
  isHidden: boolean;
  isToken: boolean;
  statusEffects: string[];
}

// ─── Zones ────────────────────────────────────────────────────────────────────

export type ZoneId =
  | "mainDeck"
  | "runeDeck"
  | "hand"
  | "base"
  | "battlefield1"
  | "battlefield2"
  | "legendZone"
  | "championZone"
  | "facedownZone"
  | "trash"
  | "banishment"
  | "chain";

// ─── Board State ──────────────────────────────────────────────────────────────

export type PlayerId = "player" | "ai";

export interface BattlefieldState {
  id: "battlefield1" | "battlefield2";
  name: string;
  controller: PlayerId | null;
  units: GameCard[];
  facedownCard: GameCard | null;
  isContested: boolean;
  rulesText?: string;
}

export interface BoardState {
  battlefields: BattlefieldState[];
  playerBase: GameCard[];   // Gear at player's base
  aiBase: GameCard[];       // Gear at AI's base
}

// ─── Player State ─────────────────────────────────────────────────────────────

export interface RunePool {
  energy: number;
  power: Partial<Record<Domain, number>>;
}

export interface PlayerState {
  id: PlayerId;
  hand: GameCard[];
  mainDeckCount: number;
  runeDeckCount: number;
  trash: GameCard[];
  banishment: GameCard[];
  runePool: RunePool;
  points: number;
  legend: GameCard;
  chosenChampion: GameCard;
  championZone: GameCard[];
  legendZone: GameCard[];
}

// ─── Turn Phases ──────────────────────────────────────────────────────────────

export type Phase =
  | "awaken"
  | "beginning"
  | "channel"
  | "draw"
  | "action"
  | "endOfTurn";

export const PHASE_LABELS: Record<Phase, string> = {
  awaken: "Awaken",
  beginning: "Beginning",
  channel: "Channel",
  draw: "Draw",
  action: "Action",
  endOfTurn: "End of Turn",
};

// ─── Game State ───────────────────────────────────────────────────────────────

export type ChainState = "Open" | "Closed";
export type ShowdownState = "Neutral" | "Showdown";

export interface ChainItem {
  id: string;
  card: GameCard;
  controller: PlayerId;
}

export interface GameState {
  turnPlayer: PlayerId;
  phase: Phase;
  chainState: ChainState;
  showdownState: ShowdownState;
  priorityHolder: PlayerId | null;
  focusHolder: PlayerId | null;
  players: Record<PlayerId, PlayerState>;
  board: BoardState;
  chain: ChainItem[];
  pendingCombats: string[];   // BattlefieldIds
  turnNumber: number;
  gameLog: string[];
  winner: PlayerId | null;
}

// ─── Actions ─────────────────────────────────────────────────────────────────

export type ActionType =
  | "PLAY_CARD"
  | "MOVE_UNIT"
  | "ACTIVATE_ABILITY"
  | "CHANNEL_RUNE"
  | "PASS_PRIORITY"
  | "END_TURN"
  | "DECLARE_ATTACK"
  | "ASSIGN_DAMAGE"
  | "MULLIGAN";

export interface Action {
  type: ActionType;
  playerId: PlayerId;
  cardInstanceId?: string;
  targetId?: string;
  destinationZone?: ZoneId;
  payload?: Record<string, unknown>;
}
