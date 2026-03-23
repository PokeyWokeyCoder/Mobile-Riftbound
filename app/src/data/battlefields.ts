export interface BattlefieldDefinition {
  id: string;
  name: string;
  rulesText: string;
  flavorText?: string;
}

export const SAMPLE_BATTLEFIELDS: BattlefieldDefinition[] = [
  {
    id: "bf-crossroads",
    name: "Ashen Crossroads",
    rulesText:
      "When a unit is killed here, its controller may draw a card.",
    flavorText: "Every path leads through the ash eventually.",
  },
  {
    id: "bf-grove",
    name: "Ancient Grove",
    rulesText:
      "Units at this Battlefield get +1 Might during the Beginning Phase.",
    flavorText: "The oldest trees remember everything.",
  },
  {
    id: "bf-citadel",
    name: "Ruined Citadel",
    rulesText:
      "The controller of this Battlefield may pay 1 Energy to prevent 1 damage to units here once per turn.",
    flavorText: "Even in ruin, it stands defiant.",
  },
  {
    id: "bf-riftscar",
    name: "Riftscar Valley",
    rulesText:
      "Units played here enter Ready instead of Exhausted.",
    flavorText: "The rift changed everything — even the rules of war.",
  },
];
