import { initializeGame, resetInstanceIds, SetupValidationError } from '../setup';
import { GameConfig } from '../setup';
import { LORD_OF_FURY, WARDEN_OF_CALM } from '../../data/legends';
import { CHOSEN_CHAMPION_FURY, CHOSEN_CHAMPION_CALM, makeFuryMainDeck, makeCalmMainDeck } from '../../data/cards';
import { makeFuryRuneDeck, makeCalmRuneDeck } from '../../data/runes';
import {
  INFERNO_PEAK,
  BLOOD_PLAINS,
  EMBER_RUINS,
  SERENE_GROVE,
  VERDANT_PASS,
  MOSSY_HOLLOW,
} from '../../data/battlefields';

// ─── Test Config Builder ──────────────────────────────────────────────────────

function makeValidConfig(overrides?: Partial<GameConfig>): GameConfig {
  return {
    players: [
      {
        id: 'fury-player',
        legend: LORD_OF_FURY,
        chosenChampion: CHOSEN_CHAMPION_FURY,
        mainDeck: makeFuryMainDeck(),
        runeDeck: makeFuryRuneDeck(),
        battlefields: [INFERNO_PEAK, BLOOD_PLAINS, EMBER_RUINS],
      },
      {
        id: 'calm-player',
        legend: WARDEN_OF_CALM,
        chosenChampion: CHOSEN_CHAMPION_CALM,
        mainDeck: makeCalmMainDeck(),
        runeDeck: makeCalmRuneDeck(),
        battlefields: [SERENE_GROVE, VERDANT_PASS, MOSSY_HOLLOW],
      },
    ],
    firstPlayerId: 'fury-player',
    ...overrides,
  };
}

beforeEach(() => {
  resetInstanceIds();
});

// ─── Validation ───────────────────────────────────────────────────────────────

describe('initializeGame — validation', () => {
  it('throws if main deck has fewer than 40 cards', () => {
    const config = makeValidConfig();
    config.players[0].mainDeck = config.players[0].mainDeck.slice(0, 39);
    expect(() => initializeGame(config)).toThrow(SetupValidationError);
  });

  it('throws if rune deck does not have exactly 12 runes', () => {
    const config = makeValidConfig();
    config.players[0].runeDeck = config.players[0].runeDeck.slice(0, 11);
    expect(() => initializeGame(config)).toThrow(SetupValidationError);
  });

  it('throws if player does not provide exactly 3 battlefields', () => {
    const config = makeValidConfig();
    config.players[0].battlefields = [INFERNO_PEAK, BLOOD_PLAINS];
    expect(() => initializeGame(config)).toThrow(SetupValidationError);
  });

  it('throws if chosen champion card is not flagged isChosenChampion', () => {
    const config = makeValidConfig();
    config.players[0].chosenChampion = { ...CHOSEN_CHAMPION_FURY, isChosenChampion: false };
    expect(() => initializeGame(config)).toThrow(SetupValidationError);
  });
});

// ─── Legend Zone ─────────────────────────────────────────────────────────────

describe('initializeGame — Legend Zone', () => {
  it('places each player Legend in their Legend Zone', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].legendZone.definition.id).toBe(LORD_OF_FURY.id);
    expect(state.players['calm-player'].legendZone.definition.id).toBe(WARDEN_OF_CALM.id);
  });

  it('Legend Zones have unique instance IDs', () => {
    const state = initializeGame(makeValidConfig());
    const id1 = state.players['fury-player'].legendZone.instanceId;
    const id2 = state.players['calm-player'].legendZone.instanceId;
    expect(id1).not.toBe(id2);
  });
});

// ─── Champion Zone ────────────────────────────────────────────────────────────

describe('initializeGame — Champion Zone', () => {
  it('places each player Chosen Champion in their Champion Zone', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].championZone.definition.id).toBe(CHOSEN_CHAMPION_FURY.id);
    expect(state.players['calm-player'].championZone.definition.id).toBe(CHOSEN_CHAMPION_CALM.id);
  });

  it('Chosen Champion is not in the main deck', () => {
    const state = initializeGame(makeValidConfig());
    const deck = state.players['fury-player'].mainDeck;
    // The deck may contain extra copies but not the instance that is in championZone
    const champInstanceId = state.players['fury-player'].championZone.instanceId;
    const found = deck.find((c) => c.instanceId === champInstanceId);
    expect(found).toBeUndefined();
  });
});

// ─── Main Deck Zone ───────────────────────────────────────────────────────────

describe('initializeGame — Main Deck Zone', () => {
  it('places all main deck cards in the deck zone', () => {
    const config = makeValidConfig();
    const state = initializeGame(config);
    // 40 cards in config - 4 drawn = 36 remaining
    expect(state.players['fury-player'].mainDeck).toHaveLength(
      config.players[0].mainDeck.length - 4,
    );
  });

  it('main deck contains only CardInstances (not runes or legends)', () => {
    const state = initializeGame(makeValidConfig());
    state.players['fury-player'].mainDeck.forEach((c) => {
      expect(c).toHaveProperty('definition');
      expect(c).toHaveProperty('instanceId');
      expect(c).toHaveProperty('damage');
    });
  });
});

// ─── Rune Deck Zone ───────────────────────────────────────────────────────────

describe('initializeGame — Rune Deck Zone', () => {
  it('places exactly 12 runes in the rune deck zone', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].runeDeck).toHaveLength(12);
    expect(state.players['calm-player'].runeDeck).toHaveLength(12);
  });

  it('rune deck instances have unique instanceIds', () => {
    const state = initializeGame(makeValidConfig());
    const ids = state.players['fury-player'].runeDeck.map((r) => r.instanceId);
    const unique = new Set(ids);
    expect(unique.size).toBe(12);
  });
});

// ─── Hand ─────────────────────────────────────────────────────────────────────

describe('initializeGame — Hand', () => {
  it('each player starts with 4 cards in hand', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].hand).toHaveLength(4);
    expect(state.players['calm-player'].hand).toHaveLength(4);
  });

  it('hand cards are drawn from the main deck', () => {
    const config = makeValidConfig();
    const state = initializeGame(config);
    // After drawing 4, deck has 4 fewer cards
    expect(state.players['fury-player'].mainDeck).toHaveLength(
      config.players[0].mainDeck.length - 4,
    );
  });
});

// ─── Board — Battlefields ─────────────────────────────────────────────────────

describe('initializeGame — Battlefields', () => {
  it('places exactly 2 battlefields on the board (1 per player)', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.board.battlefields).toHaveLength(2);
  });

  it('each battlefield comes from the respective player battlefield pool', () => {
    const state = initializeGame(makeValidConfig());
    const furyBfIds = [INFERNO_PEAK.id, BLOOD_PLAINS.id, EMBER_RUINS.id];
    const calmBfIds = [SERENE_GROVE.id, VERDANT_PASS.id, MOSSY_HOLLOW.id];

    const bf1Id = state.board.battlefields[0].battlefield.definition.id;
    const bf2Id = state.board.battlefields[1].battlefield.definition.id;

    expect(furyBfIds).toContain(bf1Id);
    expect(calmBfIds).toContain(bf2Id);
  });

  it('battlefields start with no units and no controller', () => {
    const state = initializeGame(makeValidConfig());
    state.board.battlefields.forEach((bf) => {
      expect(bf.units).toHaveLength(0);
      expect(bf.controller).toBeNull();
      expect(bf.isContested).toBe(false);
    });
  });
});

// ─── Board — Bases ────────────────────────────────────────────────────────────

describe('initializeGame — Bases', () => {
  it('each player has an empty base at game start', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.board.bases['fury-player'].permanents).toHaveLength(0);
    expect(state.board.bases['calm-player'].permanents).toHaveLength(0);
  });
});

// ─── Empty Zones ──────────────────────────────────────────────────────────────

describe('initializeGame — initially empty zones', () => {
  it('trash starts empty', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].trash).toHaveLength(0);
    expect(state.players['calm-player'].trash).toHaveLength(0);
  });

  it('banishment starts empty', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].banishment).toHaveLength(0);
    expect(state.players['calm-player'].banishment).toHaveLength(0);
  });

  it('facedown zone starts empty', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].facedownZone).toHaveLength(0);
    expect(state.players['calm-player'].facedownZone).toHaveLength(0);
  });

  it('chain starts empty and chainState is Open', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.chain).toHaveLength(0);
    expect(state.chainState).toBe('Open');
  });
});

// ─── Points & Turn Order ──────────────────────────────────────────────────────

describe('initializeGame — turn order and scoring', () => {
  it('both players start with 0 points', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.players['fury-player'].points).toBe(0);
    expect(state.players['calm-player'].points).toBe(0);
  });

  it('respects the provided firstPlayerId', () => {
    const state = initializeGame(makeValidConfig({ firstPlayerId: 'calm-player' }));
    expect(state.turnPlayer).toBe('calm-player');
    expect(state.firstPlayer).toBe('calm-player');
  });

  it('starts in Awaken phase turn 1', () => {
    const state = initializeGame(makeValidConfig());
    expect(state.phase).toBe('Awaken');
    expect(state.turnNumber).toBe(1);
  });
});
