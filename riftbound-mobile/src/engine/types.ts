// ─── Card Data Types ──────────────────────────────────────────────────────────

export type Domain =
  | 'Fury'
  | 'Calm'
  | 'Mind'
  | 'Body'
  | 'Chaos'
  | 'Order'
  | 'Colorless';

export type CardType =
  | 'Unit'
  | 'Champion Unit'
  | 'Signature Unit'
  | 'Token Unit'
  | 'Gear'
  | 'Signature Gear'
  | 'Token Gear'
  | 'Spell'
  | 'Signature Spell'
  | 'Basic Rune'
  | 'Battlefield'
  | 'Champion Legend'
  | 'Legend'
  | 'Token';

export interface CardDef {
  id: string;
  name: string;
  set: string;
  cardType: CardType;
  domain: Domain | string;
  rarity: string;
  energy: number | null;
  might: number | null;
  tags: string[];
  ability: string;
  imageUrl: string | null;
  artist: string | null;
}

// ─── Game Object IDs ─────────────────────────────────────────────────────────

export type PlayerId = 'player' | 'opponent';
export type ZoneId =
  | 'hand'
  | 'mainDeck'
  | 'runeDeck'
  | 'trash'
  | 'banishment'
  | 'board'
  | 'champion'
  | 'legend';
export type LocationId = 'base' | BattlefieldId;
export type BattlefieldId = 'bf1' | 'bf2';

// ─── Game Objects (runtime instances) ────────────────────────────────────────

export interface GameObjectBase {
  instanceId: string;      // unique runtime ID
  defId: string;           // CardDef.id reference
  name: string;
  cardType: CardType;
  domain: Domain | string;
  ownerId: PlayerId;
  controllerId: PlayerId;
}

export interface UnitObject extends GameObjectBase {
  cardType: 'Unit' | 'Champion Unit' | 'Signature Unit' | 'Token Unit';
  mightBase: number;
  mightBonus: number;        // from Buff counters, Assault, Shield
  damage: number;
  exhausted: boolean;
  location: LocationId;
  hasBuff: boolean;
  tags: string[];
  ability: string;
  energy: number;
  isToken: boolean;
}

export interface GearObject extends GameObjectBase {
  cardType: 'Gear' | 'Signature Gear' | 'Token Gear';
  exhausted: boolean;
  location: LocationId;
  tags: string[];
  ability: string;
  energy: number;
  attachedTo: string | null;  // instanceId of unit it's attached to
}

export interface SpellObject extends GameObjectBase {
  cardType: 'Spell' | 'Signature Spell';
  energy: number;
  tags: string[];
  ability: string;
}

export type BoardObject = UnitObject | GearObject;
export type CardObject = UnitObject | GearObject | SpellObject;

// ─── Hand / Deck cards (not yet in play) ─────────────────────────────────────

export interface HandCard {
  instanceId: string;
  defId: string;
  name: string;
  cardType: CardType;
  domain: Domain | string;
  energy: number | null;
  might: number | null;
  tags: string[];
  ability: string;
  imageUrl: string | null;
  ownerId: PlayerId;
}

export interface RuneCard {
  instanceId: string;
  defId: string;
  name: string;
  domain: Domain | string;
  recycled: boolean;
}

// ─── Board State ──────────────────────────────────────────────────────────────

export interface BattlefieldState {
  id: BattlefieldId;
  name: string;
  ability: string;
  imageUrl: string | null;
  controller: PlayerId | null;  // who holds this battlefield
  isContested: boolean;
  pendingCombat: boolean;
  units: UnitObject[];
  facedownCard: HandCard | null;   // hidden card
}

export interface BaseState {
  ownerId: PlayerId;
  units: UnitObject[];
  gear: GearObject[];
}

export interface BoardState {
  bases: Record<PlayerId, BaseState>;
  battlefields: Record<BattlefieldId, BattlefieldState>;
}

// ─── Player State ─────────────────────────────────────────────────────────────

export interface RunePool {
  energy: number;
  power: Partial<Record<Domain, number>>;
}

export interface PlayerState {
  id: PlayerId;
  hand: HandCard[];
  mainDeck: HandCard[];
  runeDeck: RuneCard[];
  trash: HandCard[];
  banishment: HandCard[];
  runePool: RunePool;
  points: number;
  legend: CardDef | null;
  chosenChampion: UnitObject | null;     // in champion zone
  battlefieldChoices: CardDef[];         // the 3 provided battlefields
  scoredThisTurn: BattlefieldId[];       // battlefields scored this turn
}

// ─── Phase / Turn Structure ───────────────────────────────────────────────────

export type Phase =
  | 'awaken'
  | 'beginning'
  | 'channel'
  | 'draw'
  | 'action'
  | 'end'
  | 'expiration'
  | 'cleanup'
  | 'gameOver';

export type TurnState =
  | 'NeutralOpen'
  | 'NeutralClosed'
  | 'ShowdownOpen'
  | 'ShowdownClosed';

// ─── Actions ──────────────────────────────────────────────────────────────────

export type ActionType =
  | 'CHANNEL_RUNE'
  | 'DRAW_CARD'
  | 'PLAY_UNIT'
  | 'PLAY_GEAR'
  | 'PLAY_SPELL'
  | 'MOVE_UNIT'
  | 'PASS_PRIORITY'
  | 'END_TURN'
  | 'ADVANCE_PHASE'
  | 'RESOLVE_COMBAT'
  | 'MULLIGAN';

export interface ChannelRuneAction {
  type: 'CHANNEL_RUNE';
  playerId: PlayerId;
  runeInstanceId: string;
  useRecycle: boolean;  // true = Power (recycle rune), false = Energy tap
}

export interface PlayUnitAction {
  type: 'PLAY_UNIT';
  playerId: PlayerId;
  handCardInstanceId: string;
  payAccelerate: boolean;
}

export interface PlayGearAction {
  type: 'PLAY_GEAR';
  playerId: PlayerId;
  handCardInstanceId: string;
  attachToUnitId: string | null;
}

export interface PlaySpellAction {
  type: 'PLAY_SPELL';
  playerId: PlayerId;
  handCardInstanceId: string;
  targets: string[];  // instanceIds of targets
}

export interface MoveUnitAction {
  type: 'MOVE_UNIT';
  playerId: PlayerId;
  unitInstanceId: string;
  destination: LocationId;
}

export interface PassPriorityAction {
  type: 'PASS_PRIORITY';
  playerId: PlayerId;
}

export interface EndTurnAction {
  type: 'END_TURN';
  playerId: PlayerId;
}

export interface AdvancePhaseAction {
  type: 'ADVANCE_PHASE';
}

export interface ResolveCombatAction {
  type: 'RESOLVE_COMBAT';
  battlefieldId: BattlefieldId;
}

export interface ChannelAction {
  type: 'CHANNEL_RUNE';
  playerId: PlayerId;
  runeInstanceId: string;
  useRecycle: boolean;
}

export interface MulliganAction {
  type: 'MULLIGAN';
  playerId: PlayerId;
  cardInstanceIds: string[];  // up to 2 cards to set aside
}

export type Action =
  | ChannelRuneAction
  | PlayUnitAction
  | PlayGearAction
  | PlaySpellAction
  | MoveUnitAction
  | PassPriorityAction
  | EndTurnAction
  | AdvancePhaseAction
  | ResolveCombatAction
  | MulliganAction;

// ─── Top-Level Game State ─────────────────────────────────────────────────────

export interface GameState {
  turnNumber: number;
  turnPlayer: PlayerId;
  phase: Phase;
  turnState: TurnState;
  priorityHolder: PlayerId | null;
  focusHolder: PlayerId | null;
  players: Record<PlayerId, PlayerState>;
  board: BoardState;
  chain: CardObject[];
  pendingCombats: BattlefieldId[];
  winner: PlayerId | null;
  victoryScore: number;
  log: string[];
  // Mulligan tracking
  mulliganDone: Record<PlayerId, boolean>;
  runesChanneledThisTurn: number;
}

// ─── Deck Input ───────────────────────────────────────────────────────────────

export interface DeckList {
  legendName: string;
  chosenChampionName: string;
  mainDeck: Array<{ count: number; name: string }>;
  runeDeck: Array<{ count: number; name: string }>;
  battlefields: string[];
}
