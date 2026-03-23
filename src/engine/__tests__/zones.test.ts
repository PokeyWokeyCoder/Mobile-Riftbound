import {
  addToBanishment,
  addToBase,
  addToChain,
  addToFacedownZone,
  addToHand,
  addToMainDeck,
  addToTrash,
  addUnitToBattlefield,
  channelRune,
  clearTempModifications,
  drawCard,
  recycleRune,
  removeFromBase,
  removeFromFacedownZone,
  removeFromHand,
  removeUnitFromBattlefield,
  resolveTopChainItem,
} from '../zones';
import { createCardInstance, createRuneInstance, resetInstanceIds } from '../setup';
import { GameState } from '../gameState';
import { FURY_WARRIOR, FURY_STRIKE, WAR_BANNER, FURY_WARRIOR_TOKEN } from '../../data/cards';
import { FURY_ENERGY_RUNE } from '../../data/runes';
import { INFERNO_PEAK, BLOOD_PLAINS } from '../../data/battlefields';

// ─── Test Fixtures ─────────────────────────────────────────────────────────────

const P1 = 'player-1';
const P2 = 'player-2';

function makeBattlefieldSlot(def: { id: string; name: string }) {
  return {
    battlefield: { instanceId: `bf-inst-${def.id}`, definition: def },
    controller: null as string | null,
    units: [],
    isContested: false,
    isPendingCombat: false,
  };
}

function makeEmptyGameState(): GameState {
  return {
    phase: 'Action',
    turnPlayer: P1,
    turnNumber: 1,
    firstPlayer: P1,
    chainState: 'Open',
    showdownState: 'Neutral',
    priorityHolder: P1,
    focusHolder: null,
    chain: [],
    pendingCombats: [],
    board: {
      battlefields: [
        makeBattlefieldSlot(INFERNO_PEAK),
        makeBattlefieldSlot(BLOOD_PLAINS),
      ],
      bases: {
        [P1]: { playerId: P1, permanents: [] },
        [P2]: { playerId: P2, permanents: [] },
      },
    },
    players: {
      [P1]: {
        id: P1,
        hand: [],
        mainDeck: [],
        runeDeck: [],
        trash: [],
        banishment: [],
        legendZone: { instanceId: 'legend-p1', definition: { id: 'l1', name: 'Legend', domainIdentity: ['Fury'], tag: 'FC' }, ownerId: P1 },
        championZone: createCardInstance({ id: 'champ', name: 'Champ', type: 'Unit', domains: ['Fury'], energyCost: 3, powerCost: {}, might: 4, tags: ['FC'], keywords: [], isChosenChampion: true }, P1),
        facedownZone: [],
        runePool: { energy: 0, power: {} },
        points: 0,
      },
      [P2]: {
        id: P2,
        hand: [],
        mainDeck: [],
        runeDeck: [],
        trash: [],
        banishment: [],
        legendZone: { instanceId: 'legend-p2', definition: { id: 'l2', name: 'Legend 2', domainIdentity: ['Calm'], tag: 'CS' }, ownerId: P2 },
        championZone: createCardInstance({ id: 'champ2', name: 'Champ 2', type: 'Unit', domains: ['Calm'], energyCost: 3, powerCost: {}, might: 3, tags: ['CS'], keywords: [], isChosenChampion: true }, P2),
        facedownZone: [],
        runePool: { energy: 0, power: {} },
        points: 0,
      },
    },
  };
}

beforeEach(() => {
  resetInstanceIds();
});

// ─── clearTempModifications ───────────────────────────────────────────────────

describe('clearTempModifications', () => {
  it('clears damage, buffs, attack/defend/stun flags, and temp keywords', () => {
    const card = createCardInstance(FURY_WARRIOR, P1);
    const dirty: typeof card = {
      ...card,
      damage: 2,
      buffs: 1,
      isAttacker: true,
      isDefender: false,
      isStunned: true,
      temporaryKeywords: [{ type: 'Assault', value: 1 }],
      readyStatus: 'Exhausted',
    };

    const clean = clearTempModifications(dirty);

    expect(clean.damage).toBe(0);
    expect(clean.buffs).toBe(0);
    expect(clean.isAttacker).toBe(false);
    expect(clean.isDefender).toBe(false);
    expect(clean.isStunned).toBe(false);
    expect(clean.temporaryKeywords).toEqual([]);
    expect(clean.readyStatus).toBe('Ready');
  });

  it('preserves instanceId, definition, ownerId, and controllerId', () => {
    const card = createCardInstance(FURY_WARRIOR, P1);
    const clean = clearTempModifications(card);
    expect(clean.instanceId).toBe(card.instanceId);
    expect(clean.definition).toBe(card.definition);
    expect(clean.ownerId).toBe(P1);
    expect(clean.controllerId).toBe(P1);
  });
});

// ─── Hand ─────────────────────────────────────────────────────────────────────

describe('addToHand', () => {
  it('places a card in the player hand', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const next = addToHand(state, P1, card);
    expect(next.players[P1].hand).toHaveLength(1);
    expect(next.players[P1].hand[0].instanceId).toBe(card.instanceId);
  });

  it('applies the zone change rule (clears temp modifications)', () => {
    const state = makeEmptyGameState();
    const card = { ...createCardInstance(FURY_WARRIOR, P1), damage: 3, buffs: 1 };
    const next = addToHand(state, P1, card);
    expect(next.players[P1].hand[0].damage).toBe(0);
    expect(next.players[P1].hand[0].buffs).toBe(0);
  });

  it('does not place tokens in hand — they cease to exist', () => {
    const state = makeEmptyGameState();
    const token = createCardInstance(FURY_WARRIOR_TOKEN, P1);
    const next = addToHand(state, P1, token);
    expect(next.players[P1].hand).toHaveLength(0);
  });

  it('does not mutate the original state', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    addToHand(state, P1, card);
    expect(state.players[P1].hand).toHaveLength(0);
  });
});

describe('removeFromHand', () => {
  it('removes a card from hand by instanceId', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const withCard = addToHand(state, P1, card);
    const without = removeFromHand(withCard, P1, card.instanceId);
    expect(without.players[P1].hand).toHaveLength(0);
  });

  it('leaves other cards intact', () => {
    const state = makeEmptyGameState();
    const a = createCardInstance(FURY_WARRIOR, P1);
    const b = createCardInstance(FURY_STRIKE, P1);
    let s = addToHand(state, P1, a);
    s = addToHand(s, P1, b);
    const next = removeFromHand(s, P1, a.instanceId);
    expect(next.players[P1].hand).toHaveLength(1);
    expect(next.players[P1].hand[0].instanceId).toBe(b.instanceId);
  });
});

// ─── Main Deck ────────────────────────────────────────────────────────────────

describe('addToMainDeck', () => {
  it('places a card on top of the deck', () => {
    const state = makeEmptyGameState();
    const first = createCardInstance(FURY_WARRIOR, P1);
    const second = createCardInstance(FURY_STRIKE, P1);
    let s = addToMainDeck(state, P1, first, 'bottom');
    s = addToMainDeck(s, P1, second, 'top');
    expect(s.players[P1].mainDeck[0].instanceId).toBe(second.instanceId);
    expect(s.players[P1].mainDeck[1].instanceId).toBe(first.instanceId);
  });

  it('places a card on the bottom of the deck', () => {
    const state = makeEmptyGameState();
    const first = createCardInstance(FURY_WARRIOR, P1);
    const second = createCardInstance(FURY_STRIKE, P1);
    let s = addToMainDeck(state, P1, first, 'top');
    s = addToMainDeck(s, P1, second, 'bottom');
    expect(s.players[P1].mainDeck[1].instanceId).toBe(second.instanceId);
  });

  it('applies the zone change rule', () => {
    const state = makeEmptyGameState();
    const card = { ...createCardInstance(FURY_WARRIOR, P1), damage: 2 };
    const next = addToMainDeck(state, P1, card, 'top');
    expect(next.players[P1].mainDeck[0].damage).toBe(0);
  });

  it('does not place tokens in the deck', () => {
    const state = makeEmptyGameState();
    const token = createCardInstance(FURY_WARRIOR_TOKEN, P1);
    const next = addToMainDeck(state, P1, token, 'top');
    expect(next.players[P1].mainDeck).toHaveLength(0);
  });
});

describe('drawCard', () => {
  it('moves the top deck card to hand', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const withDeck = addToMainDeck(state, P1, card, 'top');
    const afterDraw = drawCard(withDeck, P1);
    expect(afterDraw.players[P1].mainDeck).toHaveLength(0);
    expect(afterDraw.players[P1].hand).toHaveLength(1);
    expect(afterDraw.players[P1].hand[0].instanceId).toBe(card.instanceId);
  });

  it('does nothing if the deck is empty', () => {
    const state = makeEmptyGameState();
    const next = drawCard(state, P1);
    expect(next.players[P1].hand).toHaveLength(0);
  });
});

// ─── Rune Deck ────────────────────────────────────────────────────────────────

describe('channelRune', () => {
  it('removes the top rune from the rune deck', () => {
    const state = makeEmptyGameState();
    const rune = createRuneInstance(FURY_ENERGY_RUNE, P1);
    const withRune = {
      ...state,
      players: {
        ...state.players,
        [P1]: { ...state.players[P1], runeDeck: [rune] },
      },
    };
    const { state: after, rune: channeled } = channelRune(withRune, P1);
    expect(after.players[P1].runeDeck).toHaveLength(0);
    expect(channeled?.instanceId).toBe(rune.instanceId);
  });

  it('returns null rune when rune deck is empty', () => {
    const state = makeEmptyGameState();
    const { rune } = channelRune(state, P1);
    expect(rune).toBeNull();
  });
});

describe('recycleRune', () => {
  it('places a rune at the bottom of the rune deck', () => {
    const state = makeEmptyGameState();
    const rune = createRuneInstance(FURY_ENERGY_RUNE, P1);
    const next = recycleRune(state, P1, rune);
    expect(next.players[P1].runeDeck).toHaveLength(1);
    expect(next.players[P1].runeDeck[0].instanceId).toBe(rune.instanceId);
  });
});

// ─── Trash ────────────────────────────────────────────────────────────────────

describe('addToTrash', () => {
  it('places a card in the trash', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const next = addToTrash(state, P1, card);
    expect(next.players[P1].trash).toHaveLength(1);
    expect(next.players[P1].trash[0].instanceId).toBe(card.instanceId);
  });

  it('applies the zone change rule (clears damage and buffs)', () => {
    const state = makeEmptyGameState();
    const card = { ...createCardInstance(FURY_WARRIOR, P1), damage: 3, buffs: 1, isAttacker: true };
    const next = addToTrash(state, P1, card);
    expect(next.players[P1].trash[0].damage).toBe(0);
    expect(next.players[P1].trash[0].buffs).toBe(0);
    expect(next.players[P1].trash[0].isAttacker).toBe(false);
  });

  it('tokens cease to exist and are not placed in trash', () => {
    const state = makeEmptyGameState();
    const token = createCardInstance(FURY_WARRIOR_TOKEN, P1);
    const next = addToTrash(state, P1, token);
    expect(next.players[P1].trash).toHaveLength(0);
  });
});

// ─── Banishment ───────────────────────────────────────────────────────────────

describe('addToBanishment', () => {
  it('places a card in the banishment zone', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const next = addToBanishment(state, P1, card);
    expect(next.players[P1].banishment).toHaveLength(1);
    expect(next.players[P1].banishment[0].instanceId).toBe(card.instanceId);
  });

  it('applies the zone change rule', () => {
    const state = makeEmptyGameState();
    const card = { ...createCardInstance(FURY_WARRIOR, P1), damage: 2, isStunned: true };
    const next = addToBanishment(state, P1, card);
    expect(next.players[P1].banishment[0].damage).toBe(0);
    expect(next.players[P1].banishment[0].isStunned).toBe(false);
  });

  it('tokens cease to exist and are not banished', () => {
    const state = makeEmptyGameState();
    const token = createCardInstance(FURY_WARRIOR_TOKEN, P1);
    const next = addToBanishment(state, P1, token);
    expect(next.players[P1].banishment).toHaveLength(0);
  });
});

// ─── Base ─────────────────────────────────────────────────────────────────────

describe('addToBase', () => {
  it('places a unit at a player base', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const next = addToBase(state, P1, unit);
    expect(next.board.bases[P1].permanents).toHaveLength(1);
    expect(next.board.bases[P1].permanents[0].instanceId).toBe(unit.instanceId);
  });

  it('places gear at a player base', () => {
    const state = makeEmptyGameState();
    const gear = createCardInstance(WAR_BANNER, P1);
    const next = addToBase(state, P1, gear);
    expect(next.board.bases[P1].permanents).toHaveLength(1);
    expect(next.board.bases[P1].permanents[0].definition.type).toBe('Gear');
  });

  it('does not affect the other player base', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const next = addToBase(state, P1, unit);
    expect(next.board.bases[P2].permanents).toHaveLength(0);
  });
});

describe('removeFromBase', () => {
  it('removes a permanent from the base by instanceId', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const withUnit = addToBase(state, P1, unit);
    const without = removeFromBase(withUnit, P1, unit.instanceId);
    expect(without.board.bases[P1].permanents).toHaveLength(0);
  });
});

// ─── Battlefield ──────────────────────────────────────────────────────────────

describe('addUnitToBattlefield', () => {
  it('places a unit at a battlefield', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const next = addUnitToBattlefield(state, unit, INFERNO_PEAK.id);
    const bf = next.board.battlefields.find((b) => b.battlefield.definition.id === INFERNO_PEAK.id)!;
    expect(bf.units).toHaveLength(1);
    expect(bf.units[0].instanceId).toBe(unit.instanceId);
  });

  it('allows units from both players at the same battlefield', () => {
    const state = makeEmptyGameState();
    const unit1 = createCardInstance(FURY_WARRIOR, P1);
    const unit2 = createCardInstance(FURY_WARRIOR, P2);
    let s = addUnitToBattlefield(state, unit1, INFERNO_PEAK.id);
    s = addUnitToBattlefield(s, unit2, INFERNO_PEAK.id);
    const bf = s.board.battlefields.find((b) => b.battlefield.definition.id === INFERNO_PEAK.id)!;
    expect(bf.units).toHaveLength(2);
  });

  it('throws if the battlefield is not on the board', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    expect(() => addUnitToBattlefield(state, unit, 'bf-does-not-exist')).toThrow();
  });

  it('does not affect other battlefields', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const next = addUnitToBattlefield(state, unit, INFERNO_PEAK.id);
    const other = next.board.battlefields.find((b) => b.battlefield.definition.id === BLOOD_PLAINS.id)!;
    expect(other.units).toHaveLength(0);
  });
});

describe('removeUnitFromBattlefield', () => {
  it('removes a unit from a battlefield', () => {
    const state = makeEmptyGameState();
    const unit = createCardInstance(FURY_WARRIOR, P1);
    const withUnit = addUnitToBattlefield(state, unit, INFERNO_PEAK.id);
    const without = removeUnitFromBattlefield(withUnit, INFERNO_PEAK.id, unit.instanceId);
    const bf = without.board.battlefields.find((b) => b.battlefield.definition.id === INFERNO_PEAK.id)!;
    expect(bf.units).toHaveLength(0);
  });
});

// ─── Facedown (Hidden) Zone ───────────────────────────────────────────────────

describe('addToFacedownZone', () => {
  it('places a card in the facedown zone for the specified battlefield', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const next = addToFacedownZone(state, P1, card, INFERNO_PEAK.id);
    expect(next.players[P1].facedownZone).toHaveLength(1);
    expect(next.players[P1].facedownZone[0].card.instanceId).toBe(card.instanceId);
    expect(next.players[P1].facedownZone[0].atBattlefieldId).toBe(INFERNO_PEAK.id);
  });

  it('records which turn the card was hidden', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const next = addToFacedownZone(state, P1, card, INFERNO_PEAK.id);
    expect(next.players[P1].facedownZone[0].hiddenOnTurn).toBe(state.turnNumber);
  });

  it('allows hiding cards at different battlefields', () => {
    const state = makeEmptyGameState();
    const card1 = createCardInstance(FURY_WARRIOR, P1);
    const card2 = createCardInstance(FURY_STRIKE, P1);
    let s = addToFacedownZone(state, P1, card1, INFERNO_PEAK.id);
    s = addToFacedownZone(s, P1, card2, BLOOD_PLAINS.id);
    expect(s.players[P1].facedownZone).toHaveLength(2);
  });

  it('enforces max 1 facedown card per battlefield', () => {
    const state = makeEmptyGameState();
    const card1 = createCardInstance(FURY_WARRIOR, P1);
    const card2 = createCardInstance(FURY_STRIKE, P1);
    const withFirst = addToFacedownZone(state, P1, card1, INFERNO_PEAK.id);
    expect(() => addToFacedownZone(withFirst, P1, card2, INFERNO_PEAK.id)).toThrow();
  });
});

describe('removeFromFacedownZone', () => {
  it('removes a facedown card by instanceId', () => {
    const state = makeEmptyGameState();
    const card = createCardInstance(FURY_WARRIOR, P1);
    const withCard = addToFacedownZone(state, P1, card, INFERNO_PEAK.id);
    const without = removeFromFacedownZone(withCard, P1, card.instanceId);
    expect(without.players[P1].facedownZone).toHaveLength(0);
  });
});

// ─── Chain ────────────────────────────────────────────────────────────────────

describe('addToChain', () => {
  it('places a card on the chain and sets chainState to Closed', () => {
    const state = makeEmptyGameState();
    const spell = createCardInstance(FURY_STRIKE, P1);
    const next = addToChain(state, spell, P1);
    expect(next.chain).toHaveLength(1);
    expect(next.chain[0].card.instanceId).toBe(spell.instanceId);
    expect(next.chain[0].controller).toBe(P1);
    expect(next.chainState).toBe('Closed');
  });

  it('stacks items (LIFO)', () => {
    const state = makeEmptyGameState();
    const spell1 = createCardInstance(FURY_STRIKE, P1);
    const spell2 = createCardInstance(FURY_STRIKE, P2);
    let s = addToChain(state, spell1, P1);
    s = addToChain(s, spell2, P2);
    expect(s.chain).toHaveLength(2);
    expect(s.chain[1].controller).toBe(P2);
  });

  it('records targets', () => {
    const state = makeEmptyGameState();
    const spell = createCardInstance(FURY_STRIKE, P1);
    const target = createCardInstance(FURY_WARRIOR, P2);
    const next = addToChain(state, spell, P1, [target.instanceId]);
    expect(next.chain[0].targets).toContain(target.instanceId);
  });
});

describe('resolveTopChainItem', () => {
  it('removes and returns the top chain item', () => {
    const state = makeEmptyGameState();
    const spell = createCardInstance(FURY_STRIKE, P1);
    const withSpell = addToChain(state, spell, P1);
    const { state: after, item } = resolveTopChainItem(withSpell);
    expect(after.chain).toHaveLength(0);
    expect(item?.card.instanceId).toBe(spell.instanceId);
  });

  it('sets chainState to Open when chain becomes empty', () => {
    const state = makeEmptyGameState();
    const spell = createCardInstance(FURY_STRIKE, P1);
    const withSpell = addToChain(state, spell, P1);
    const { state: after } = resolveTopChainItem(withSpell);
    expect(after.chainState).toBe('Open');
  });

  it('keeps chainState Closed while items remain', () => {
    const state = makeEmptyGameState();
    const spell1 = createCardInstance(FURY_STRIKE, P1);
    const spell2 = createCardInstance(FURY_STRIKE, P2);
    let s = addToChain(state, spell1, P1);
    s = addToChain(s, spell2, P2);
    const { state: after } = resolveTopChainItem(s);
    expect(after.chainState).toBe('Closed');
    expect(after.chain).toHaveLength(1);
  });

  it('returns null item when chain is empty', () => {
    const state = makeEmptyGameState();
    const { item } = resolveTopChainItem(state);
    expect(item).toBeNull();
  });
});
