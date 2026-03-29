import type {
  GameState,
  PlayerState,
  BoardState,
  UnitObject,
  HandCard,
  RuneCard,
  DeckList,
  PlayerId,
  BattlefieldId,
  CardDef,
  Domain,
} from './types';
import { findCardByName, getBasicRunes } from '../data/loader';

let _instanceCounter = 0;
export function newId(): string {
  return `obj_${++_instanceCounter}`;
}

function cardDefToHandCard(def: CardDef, owner: PlayerId): HandCard {
  return {
    instanceId: newId(),
    defId: def.id,
    name: def.name,
    cardType: def.cardType,
    domain: def.domain,
    energy: def.energy,
    might: def.might,
    tags: def.tags,
    ability: def.ability,
    imageUrl: def.imageUrl,
    ownerId: owner,
  };
}

function cardDefToRune(def: CardDef): RuneCard {
  return {
    instanceId: newId(),
    defId: def.id,
    name: def.name,
    domain: def.domain,
    recycled: false,
  };
}

function buildMainDeck(
  deckList: DeckList,
  owner: PlayerId,
  championName: string
): HandCard[] {
  const cards: HandCard[] = [];
  for (const entry of deckList.mainDeck) {
    const def = findCardByName(entry.name);
    if (!def) {
      console.warn(`Card not found: "${entry.name}"`);
      continue;
    }
    // Chosen champion is placed in champion zone, not deck
    // (up to 2 extra copies may be in deck though)
    for (let i = 0; i < entry.count; i++) {
      cards.push(cardDefToHandCard(def, owner));
    }
  }
  return shuffleArray(cards);
}

function buildRuneDeck(deckList: DeckList, owner: PlayerId): RuneCard[] {
  const runes: RuneCard[] = [];
  for (const entry of deckList.runeDeck) {
    const def = findCardByName(entry.name);
    if (!def) {
      console.warn(`Rune not found: "${entry.name}"`);
      continue;
    }
    for (let i = 0; i < entry.count; i++) {
      runes.push(cardDefToRune(def));
    }
  }
  return shuffleArray(runes);
}

function buildChosenChampion(
  deckList: DeckList,
  owner: PlayerId
): UnitObject | null {
  const def = findCardByName(deckList.chosenChampionName);
  if (!def) {
    console.warn(`Chosen champion not found: "${deckList.chosenChampionName}"`);
    return null;
  }
  return {
    instanceId: newId(),
    defId: def.id,
    name: def.name,
    cardType: def.cardType as UnitObject['cardType'],
    domain: def.domain,
    ownerId: owner,
    controllerId: owner,
    mightBase: def.might ?? 1,
    mightBonus: 0,
    damage: 0,
    exhausted: false,
    location: 'base',
    hasBuff: false,
    tags: def.tags,
    ability: def.ability,
    energy: def.energy ?? 0,
    isToken: false,
  };
}

export function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickRandomBattlefield(
  playerDeck: DeckList,
  opponentDeck: DeckList
): { bf1: CardDef; bf2: CardDef } {
  const allBfs: CardDef[] = [];

  for (const bfName of playerDeck.battlefields) {
    const def = findCardByName(bfName);
    if (def) allBfs.push(def);
  }
  for (const bfName of opponentDeck.battlefields) {
    const def = findCardByName(bfName);
    if (def) allBfs.push(def);
  }

  const shuffled = shuffleArray(allBfs);
  const bf1 = shuffled[0] ?? { id: 'bf1', name: 'Battlefield 1', ability: '', imageUrl: null, cardType: 'Battlefield', domain: 'Colorless', energy: null, might: null, tags: [], rarity: 'Common', set: '', artist: null };
  const bf2 = shuffled[1] ?? { id: 'bf2', name: 'Battlefield 2', ability: '', imageUrl: null, cardType: 'Battlefield', domain: 'Colorless', energy: null, might: null, tags: [], rarity: 'Common', set: '', artist: null };
  return { bf1, bf2 };
}

function buildPlayerState(
  owner: PlayerId,
  deckList: DeckList,
  legend: CardDef | null,
  chosenChampion: UnitObject | null,
  mainDeck: HandCard[],
  runeDeck: RuneCard[],
  battlefieldChoices: CardDef[]
): PlayerState {
  return {
    id: owner,
    hand: [],
    mainDeck,
    runeDeck,
    trash: [],
    banishment: [],
    runePool: { energy: 0, power: {} },
    points: 0,
    legend,
    chosenChampion,
    battlefieldChoices,
    scoredThisTurn: [],
  };
}

export function createInitialGameState(
  playerDeck: DeckList,
  opponentDeck: DeckList,
  firstPlayer: PlayerId = 'player'
): GameState {
  // Build player data
  const playerLegend = findCardByName(playerDeck.legendName) ?? null;
  const oppLegend = findCardByName(opponentDeck.legendName) ?? null;

  const playerChampion = buildChosenChampion(playerDeck, 'player');
  const oppChampion = buildChosenChampion(opponentDeck, 'opponent');

  const playerMain = buildMainDeck(playerDeck, 'player', playerDeck.chosenChampionName);
  const oppMain = buildMainDeck(opponentDeck, 'opponent', opponentDeck.chosenChampionName);

  const playerRunes = buildRuneDeck(playerDeck, 'player');
  const oppRunes = buildRuneDeck(opponentDeck, 'opponent');

  const playerBfs = playerDeck.battlefields.map(n => findCardByName(n)).filter(Boolean) as CardDef[];
  const oppBfs = opponentDeck.battlefields.map(n => findCardByName(n)).filter(Boolean) as CardDef[];

  // Pick 2 battlefields total (1 from each player's pool, randomly)
  const { bf1, bf2 } = pickRandomBattlefield(playerDeck, opponentDeck);

  const board: BoardState = {
    bases: {
      player: { ownerId: 'player', units: [], gear: [] },
      opponent: { ownerId: 'opponent', units: [], gear: [] },
    },
    battlefields: {
      bf1: {
        id: 'bf1',
        name: bf1.name,
        ability: bf1.ability,
        imageUrl: bf1.imageUrl,
        controller: null,
        isContested: false,
        pendingCombat: false,
        units: [],
        facedownCard: null,
      },
      bf2: {
        id: 'bf2',
        name: bf2.name,
        ability: bf2.ability,
        imageUrl: bf2.imageUrl,
        controller: null,
        isContested: false,
        pendingCombat: false,
        units: [],
        facedownCard: null,
      },
    },
  };

  const players: Record<PlayerId, PlayerState> = {
    player: buildPlayerState('player', playerDeck, playerLegend, playerChampion, playerMain, playerRunes, playerBfs),
    opponent: buildPlayerState('opponent', opponentDeck, oppLegend, oppChampion, oppMain, oppRunes, oppBfs),
  };

  // Draw opening hands (4 cards each)
  for (const pid of ['player', 'opponent'] as PlayerId[]) {
    const ps = players[pid];
    const drawn = ps.mainDeck.slice(0, 4);
    players[pid] = {
      ...ps,
      hand: drawn,
      mainDeck: ps.mainDeck.slice(4),
    };
  }

  return {
    turnNumber: 1,
    turnPlayer: firstPlayer,
    phase: 'awaken',
    turnState: 'NeutralOpen',
    priorityHolder: firstPlayer,
    focusHolder: null,
    players,
    board,
    chain: [],
    pendingCombats: [],
    winner: null,
    victoryScore: 8,
    log: ['Game started. Turn 1.'],
    mulliganDone: { player: false, opponent: false },
    runesChanneledThisTurn: 0,
  };
}

export function getMight(unit: UnitObject): number {
  return unit.mightBase + unit.mightBonus;
}

export function isLethal(unit: UnitObject): boolean {
  return unit.damage >= getMight(unit);
}

export function getOpponent(playerId: PlayerId): PlayerId {
  return playerId === 'player' ? 'opponent' : 'player';
}
