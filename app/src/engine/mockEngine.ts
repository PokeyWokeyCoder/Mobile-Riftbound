/**
 * Mock engine — provides stub implementations of the engine interface
 * so the UI can be developed and tested independently.
 * Replace with real engine implementations as they are built.
 */

import type { GameState, Action, PlayerId, GameCard, Phase } from "./types";
import { STARTER_DECKS } from "../data/cards";
import { SAMPLE_BATTLEFIELDS } from "../data/battlefields";

let instanceCounter = 0;
function newId(prefix: string) {
  return `${prefix}-${++instanceCounter}`;
}

function cloneCard(def: Omit<GameCard, "instanceId" | "ownerId" | "controllerId" | "exhausted" | "damageMarked" | "buffCounters" | "isHidden" | "isToken" | "statusEffects">, owner: PlayerId): GameCard {
  return {
    ...def,
    instanceId: newId(def.id),
    ownerId: owner,
    controllerId: owner,
    exhausted: false,
    damageMarked: 0,
    buffCounters: 0,
    isHidden: false,
    isToken: false,
    statusEffects: [],
  } as GameCard;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function createInitialGameState(): GameState {
  instanceCounter = 0;

  const playerDeck = STARTER_DECKS.fury;
  const aiDeck = STARTER_DECKS.calm;

  const playerMainDeck: GameCard[] = shuffle(
    playerDeck.mainDeck.map((c) => cloneCard(c as never, "player"))
  );
  const aiMainDeck: GameCard[] = shuffle(
    aiDeck.mainDeck.map((c) => cloneCard(c as never, "ai"))
  );

  const playerHand = playerMainDeck.splice(0, 4);
  const aiHand = aiMainDeck.splice(0, 4);

  const playerRuneDeck: GameCard[] = playerDeck.runeDeck.map((c) =>
    cloneCard(c as never, "player")
  );
  const aiRuneDeck: GameCard[] = aiDeck.runeDeck.map((c) =>
    cloneCard(c as never, "ai")
  );

  const playerLegend = cloneCard(playerDeck.legend as never, "player");
  const aiLegend = cloneCard(aiDeck.legend as never, "ai");
  const playerChampion = cloneCard(playerDeck.champion as never, "player");
  const aiChampion = cloneCard(aiDeck.champion as never, "ai");

  const battlefields = SAMPLE_BATTLEFIELDS;

  return {
    turnPlayer: "player",
    phase: "awaken",
    chainState: "Open",
    showdownState: "Neutral",
    priorityHolder: "player",
    focusHolder: null,
    players: {
      player: {
        id: "player",
        hand: playerHand,
        mainDeckCount: playerMainDeck.length,
        runeDeckCount: playerRuneDeck.length,
        trash: [],
        banishment: [],
        runePool: { energy: 0, power: {} },
        points: 0,
        legend: playerLegend,
        chosenChampion: playerChampion,
        championZone: [playerChampion],
        legendZone: [playerLegend],
      },
      ai: {
        id: "ai",
        hand: aiHand,
        mainDeckCount: aiMainDeck.length,
        runeDeckCount: aiRuneDeck.length,
        trash: [],
        banishment: [],
        runePool: { energy: 0, power: {} },
        points: 0,
        legend: aiLegend,
        chosenChampion: aiChampion,
        championZone: [aiChampion],
        legendZone: [aiLegend],
      },
    },
    board: {
      battlefields: [
        {
          id: "battlefield1",
          name: battlefields[0].name,
          controller: null,
          units: [],
          facedownCard: null,
          isContested: false,
          rulesText: battlefields[0].rulesText,
        },
        {
          id: "battlefield2",
          name: battlefields[1].name,
          controller: null,
          units: [],
          facedownCard: null,
          isContested: false,
          rulesText: battlefields[1].rulesText,
        },
      ],
      playerBase: [],
      aiBase: [],
    },
    chain: [],
    pendingCombats: [],
    turnNumber: 1,
    gameLog: ["Game started. Player goes first."],
    winner: null,
  };
}

// Minimal action application — expand as engine is built
export function applyAction(state: GameState, action: Action): GameState {
  const next = structuredClone(state) as GameState;

  switch (action.type) {
    case "PASS_PRIORITY": {
      const newLog = `${action.playerId} passed priority.`;
      next.gameLog = [newLog, ...next.gameLog];
      // Flip priority
      next.priorityHolder =
        next.priorityHolder === "player" ? "ai" : "player";
      break;
    }

    case "END_TURN": {
      next.turnPlayer = next.turnPlayer === "player" ? "ai" : "player";
      next.phase = "awaken";
      next.priorityHolder = next.turnPlayer;
      next.chainState = "Open";
      next.showdownState = "Neutral";
      next.chain = [];
      next.pendingCombats = [];
      next.turnNumber += 1;
      next.gameLog = [
        `Turn ${next.turnNumber} — ${next.turnPlayer === "player" ? "Your" : "AI's"} turn.`,
        ...next.gameLog,
      ];

      // Awaken all units the new turn player controls
      for (const bf of next.board.battlefields) {
        for (const u of bf.units) {
          if (u.controllerId === next.turnPlayer) u.exhausted = false;
        }
      }
      break;
    }

    case "CHANNEL_RUNE": {
      const p = next.players[action.playerId];
      if (p.runeDeckCount > 0) {
        p.runeDeckCount -= 1;
        p.runePool.energy += 1;
        next.gameLog = [
          `${action.playerId} channeled a rune (+1 energy).`,
          ...next.gameLog,
        ];
      }
      break;
    }

    case "PLAY_CARD": {
      const p = next.players[action.playerId];
      const cardIdx = p.hand.findIndex(
        (c) => c.instanceId === action.cardInstanceId
      );
      if (cardIdx === -1) break;
      const [card] = p.hand.splice(cardIdx, 1);

      if (card.type === "Unit") {
        // Place on first battlefield with space
        const bf = next.board.battlefields[0];
        card.exhausted = true;
        bf.units.push(card);
        next.gameLog = [
          `${action.playerId} played ${card.name} to ${bf.name}.`,
          ...next.gameLog,
        ];
      } else if (card.type === "Gear") {
        if (action.playerId === "player") next.board.playerBase.push(card);
        else next.board.aiBase.push(card);
        next.gameLog = [
          `${action.playerId} played ${card.name} to their Base.`,
          ...next.gameLog,
        ];
      } else if (card.type === "Spell") {
        p.trash.push(card);
        next.gameLog = [
          `${action.playerId} cast ${card.name}.`,
          ...next.gameLog,
        ];
      }
      break;
    }

    case "MOVE_UNIT": {
      const card = findUnitOnBoard(next, action.cardInstanceId ?? "");
      if (!card) break;
      removeUnitFromBoard(next, action.cardInstanceId ?? "");
      card.exhausted = true;

      if (action.destinationZone === "base") {
        if (card.controllerId === "player") next.board.playerBase.push(card);
        else next.board.aiBase.push(card);
      } else {
        const bfId = action.destinationZone as "battlefield1" | "battlefield2";
        const bf = next.board.battlefields.find((b) => b.id === bfId);
        if (bf) bf.units.push(card);
      }
      next.gameLog = [
        `${action.playerId} moved ${card.name}.`,
        ...next.gameLog,
      ];
      break;
    }

    default:
      break;
  }

  return next;
}

export function getLegalActions(state: GameState, playerId: PlayerId): Action[] {
  const actions: Action[] = [];
  if (state.winner) return actions;

  const isMyTurn = state.turnPlayer === playerId;
  const hasPriority = state.priorityHolder === playerId;

  if (hasPriority) {
    actions.push({ type: "PASS_PRIORITY", playerId });
  }

  if (isMyTurn && state.phase === "action" && hasPriority) {
    actions.push({ type: "END_TURN", playerId });
  }

  if (isMyTurn && state.phase === "channel" && hasPriority) {
    actions.push({ type: "CHANNEL_RUNE", playerId });
  }

  if (isMyTurn && state.phase === "action" && hasPriority) {
    const p = state.players[playerId];
    for (const card of p.hand) {
      if (card.energyCost <= p.runePool.energy) {
        actions.push({ type: "PLAY_CARD", playerId, cardInstanceId: card.instanceId });
      }
    }
  }

  return actions;
}

export function isGameOver(state: GameState): { over: boolean; winner: PlayerId | null } {
  for (const [id, p] of Object.entries(state.players)) {
    if (p.points >= 8) return { over: true, winner: id as PlayerId };
  }
  return { over: false, winner: null };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findUnitOnBoard(state: GameState, instanceId: string): GameCard | null {
  for (const bf of state.board.battlefields) {
    const c = bf.units.find((u) => u.instanceId === instanceId);
    if (c) return c;
  }
  return null;
}

function removeUnitFromBoard(state: GameState, instanceId: string) {
  for (const bf of state.board.battlefields) {
    bf.units = bf.units.filter((u) => u.instanceId !== instanceId);
  }
}

// ─── Simple AI Turn ───────────────────────────────────────────────────────────

export function runAiTurn(state: GameState): GameState {
  let s = state;
  // AI just passes — expand with real heuristics later
  s = applyAction(s, { type: "PASS_PRIORITY", playerId: "ai" });
  s = applyAction(s, { type: "END_TURN", playerId: "ai" });
  return s;
}

// ─── Phase Advancement ────────────────────────────────────────────────────────

const PHASE_ORDER: Phase[] = [
  "awaken",
  "beginning",
  "channel",
  "draw",
  "action",
  "endOfTurn",
];

export function advancePhase(state: GameState): GameState {
  const next = structuredClone(state) as GameState;
  const idx = PHASE_ORDER.indexOf(next.phase);
  if (idx < PHASE_ORDER.length - 1) {
    next.phase = PHASE_ORDER[idx + 1];
    next.gameLog = [`Entering ${next.phase} phase.`, ...next.gameLog];

    // Auto-draw on Draw Phase
    if (next.phase === "draw") {
      const p = next.players[next.turnPlayer];
      if (p.mainDeckCount > 0) {
        p.mainDeckCount -= 1;
        // In a real engine, push a real card; here we just note it
        next.gameLog = ["Turn player draws a card.", ...next.gameLog];
      }
      // Empty rune pool
      p.runePool = { energy: 0, power: {} };
    }
  }
  return next;
}
