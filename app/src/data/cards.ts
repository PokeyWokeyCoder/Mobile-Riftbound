import type { CardDefinition } from "../engine/types";

// ─── Fury Domain Sample Cards ─────────────────────────────────────────────────

export const FURY_LEGEND: CardDefinition = {
  id: "legend-kael",
  name: "Kael, the Ashen Warlord",
  type: "Legend",
  domains: ["Fury"],
  energyCost: 0,
  tags: ["Kael"],
  keywords: [],
  rulesText: "Fury units you control get +1 Might during your Action Phase.",
  flavorText: "From ash and ruin, victory is forged.",
};

export const FURY_CHAMPION: CardDefinition = {
  id: "champion-kael-ashen",
  name: "Kael, Ashen Knight",
  type: "Unit",
  domains: ["Fury"],
  energyCost: 2,
  powerCost: [{ domain: "Fury", amount: 1 }],
  might: 4,
  tags: ["Kael", "Champion", "Warrior"],
  keywords: [{ keyword: "Assault", value: 2 }],
  rulesText: "Assault 2. When Kael attacks, deal 1 damage to each defending unit.",
  flavorText: "He enters every battle as the last flame of a dying fire.",
  isChampionType: true,
};

export const FURY_CARDS: CardDefinition[] = [
  {
    id: "fury-blademaster",
    name: "Blademaster Recruit",
    type: "Unit",
    domains: ["Fury"],
    energyCost: 1,
    might: 2,
    tags: ["Warrior"],
    keywords: [],
    rulesText: "When this unit is played, gain 1 Energy.",
    flavorText: "Every warrior starts somewhere.",
  },
  {
    id: "fury-berserker",
    name: "Frenzied Berserker",
    type: "Unit",
    domains: ["Fury"],
    energyCost: 2,
    might: 4,
    tags: ["Warrior", "Berserker"],
    keywords: [{ keyword: "Assault", value: 1 }],
    rulesText: "Assault 1. This unit deals 1 damage to itself at the start of your Beginning Phase.",
    flavorText: "Pain is just victory waiting to happen.",
  },
  {
    id: "fury-ironclad",
    name: "Ironclad Veteran",
    type: "Unit",
    domains: ["Fury"],
    energyCost: 3,
    might: 5,
    tags: ["Warrior"],
    keywords: [{ keyword: "Tank" }],
    rulesText: "Tank.",
    flavorText: "He has faced a thousand blades. He will face a thousand more.",
  },
  {
    id: "fury-warcry",
    name: "Warcry",
    type: "Spell",
    domains: ["Fury"],
    energyCost: 1,
    tags: [],
    keywords: [],
    rulesText: "All Fury units you control get +1 Might until end of turn.",
    flavorText: "The sound of it alone breaks lesser warriors.",
  },
  {
    id: "fury-smash",
    name: "Smash Through",
    type: "Spell",
    domains: ["Fury"],
    energyCost: 2,
    tags: [],
    keywords: [],
    rulesText: "Target unit you control deals 2 damage to target unit an opponent controls.",
    flavorText: "There is no defense against absolute force.",
  },
  {
    id: "fury-blade-amulet",
    name: "Blade Amulet",
    type: "Gear",
    domains: ["Fury"],
    energyCost: 2,
    tags: ["Equipment"],
    keywords: [],
    rulesText: "Fury units you control get Assault 1.",
    flavorText: "Crafted from the first blade of the Ashen Line.",
  },
  {
    id: "fury-war-banner",
    name: "War Banner",
    type: "Gear",
    domains: ["Fury"],
    energyCost: 3,
    tags: ["Object"],
    keywords: [],
    rulesText: "At the start of your Action Phase, each Fury unit you control gets +1 Might until end of turn.",
    flavorText: "Where the banner flies, warriors follow.",
  },
  {
    id: "fury-scout",
    name: "Scout Runner",
    type: "Unit",
    domains: ["Fury"],
    energyCost: 1,
    might: 1,
    tags: ["Warrior", "Scout"],
    keywords: [{ keyword: "Ganking" }, { keyword: "Vision" }],
    rulesText: "Ganking. Vision.",
    flavorText: "Fast enough to be everywhere at once.",
  },
];

// ─── Fury Rune Deck ───────────────────────────────────────────────────────────

export const FURY_RUNES: CardDefinition[] = Array.from({ length: 12 }, (_, i) => ({
  id: `fury-rune-${i + 1}`,
  name: "Fury Rune",
  type: "Rune" as const,
  domains: ["Fury" as const],
  energyCost: 0,
  tags: [],
  keywords: [],
  rulesText: "[T]: Add 1 Energy. | Recycle: Add 1 Fury Power.",
}));

// ─── Calm Domain Sample Cards ─────────────────────────────────────────────────

export const CALM_LEGEND: CardDefinition = {
  id: "legend-sylva",
  name: "Sylva, Grove Warden",
  type: "Legend",
  domains: ["Calm"],
  energyCost: 0,
  tags: ["Sylva"],
  keywords: [],
  rulesText: "At the start of your Beginning Phase, heal 1 damage from each Calm unit you control.",
  flavorText: "The forest endures. So shall we.",
};

export const CALM_CHAMPION: CardDefinition = {
  id: "champion-sylva-guardian",
  name: "Sylva, Guardian of Roots",
  type: "Unit",
  domains: ["Calm"],
  energyCost: 2,
  powerCost: [{ domain: "Calm", amount: 1 }],
  might: 3,
  tags: ["Sylva", "Champion", "Druid"],
  keywords: [{ keyword: "Shield", value: 2 }, { keyword: "Accelerate" }],
  rulesText: "Shield 2. Accelerate. When Sylva blocks, draw a card.",
  flavorText: "Patience is the sharpest weapon.",
  isChampionType: true,
};

export const CALM_CARDS: CardDefinition[] = [
  {
    id: "calm-seedling",
    name: "Seedling Sprout",
    type: "Unit",
    domains: ["Calm"],
    energyCost: 1,
    might: 1,
    tags: ["Plant", "Token"],
    keywords: [{ keyword: "Temporary" }],
    rulesText: "Temporary.",
    flavorText: "Tiny, but persistent.",
  },
  {
    id: "calm-grove-tender",
    name: "Grove Tender",
    type: "Unit",
    domains: ["Calm"],
    energyCost: 2,
    might: 2,
    tags: ["Druid"],
    keywords: [],
    rulesText: "When played, heal 2 damage from target unit you control.",
    flavorText: "To nurture life is to understand it.",
  },
  {
    id: "calm-ancient-oak",
    name: "Ancient Oak",
    type: "Unit",
    domains: ["Calm"],
    energyCost: 4,
    might: 6,
    tags: ["Plant", "Ancient"],
    keywords: [{ keyword: "Tank" }, { keyword: "Shield", value: 2 }],
    rulesText: "Tank. Shield 2.",
    flavorText: "Ten thousand winters. Still standing.",
  },
  {
    id: "calm-regrowth",
    name: "Regrowth",
    type: "Spell",
    domains: ["Calm"],
    energyCost: 2,
    tags: [],
    keywords: [{ keyword: "Reaction" }],
    rulesText: "Reaction. Heal 3 damage from target unit you control. Draw a card.",
    flavorText: "The forest always recovers.",
  },
  {
    id: "calm-entangle",
    name: "Entangle",
    type: "Spell",
    domains: ["Calm"],
    energyCost: 3,
    tags: [],
    keywords: [],
    rulesText: "Exhaust up to 2 target units. Those units can't be readied until end of turn.",
    flavorText: "The roots hold everything eventually.",
  },
  {
    id: "calm-mossy-armor",
    name: "Mossy Armor",
    type: "Gear",
    domains: ["Calm"],
    energyCost: 2,
    tags: ["Equipment"],
    keywords: [],
    rulesText: "Calm units you control get Shield 1.",
    flavorText: "Living armor, grown to fit.",
  },
  {
    id: "calm-barrier",
    name: "Thornwall",
    type: "Gear",
    domains: ["Calm"],
    energyCost: 3,
    tags: ["Structure"],
    keywords: [],
    rulesText: "Opponents' units at your Battlefields get -1 Might.",
    flavorText: "Every thorn has a purpose.",
  },
  {
    id: "calm-drifter",
    name: "Wind Drifter",
    type: "Unit",
    domains: ["Calm"],
    energyCost: 2,
    might: 2,
    tags: ["Druid", "Scout"],
    keywords: [{ keyword: "Ganking" }, { keyword: "Accelerate" }],
    rulesText: "Ganking. Accelerate.",
    flavorText: "She moves like the wind — before you see her, she's already gone.",
  },
];

export const CALM_RUNES: CardDefinition[] = Array.from({ length: 12 }, (_, i) => ({
  id: `calm-rune-${i + 1}`,
  name: "Calm Rune",
  type: "Rune" as const,
  domains: ["Calm" as const],
  energyCost: 0,
  tags: [],
  keywords: [],
  rulesText: "[T]: Add 1 Energy. | Recycle: Add 1 Calm Power.",
}));

// ─── Starter Deck Bundles ─────────────────────────────────────────────────────

function buildDeck(cards: CardDefinition[], copies = 3): CardDefinition[] {
  const deck: CardDefinition[] = [];
  for (const card of cards) {
    const count = Math.min(copies, 3);
    for (let i = 0; i < count; i++) deck.push(card);
  }
  // Pad to 40 if needed
  let i = 0;
  while (deck.length < 40) {
    deck.push(cards[i % cards.length]);
    i++;
  }
  return deck.slice(0, 40);
}

export const STARTER_DECKS = {
  fury: {
    legend: FURY_LEGEND,
    champion: FURY_CHAMPION,
    mainDeck: buildDeck(FURY_CARDS),
    runeDeck: FURY_RUNES,
  },
  calm: {
    legend: CALM_LEGEND,
    champion: CALM_CHAMPION,
    mainDeck: buildDeck(CALM_CARDS),
    runeDeck: CALM_RUNES,
  },
};
