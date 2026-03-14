import type { CardDef, CardType, Domain } from '../engine/types';
import cardsJson from './cards.json';

const ALL_CARDS: CardDef[] = (cardsJson as any[]).map((c) => ({
  id: c.id,
  name: c.name,
  set: c.set,
  cardType: c.cardType as CardType,
  domain: c.domain as Domain,
  rarity: c.rarity,
  energy: c.energy ?? null,
  might: c.might ?? null,
  tags: c.tags ?? [],
  ability: c.ability ?? '',
  imageUrl: c.imageUrl ?? null,
  artist: c.artist ?? null,
}));

export function getAllCards(): CardDef[] {
  return ALL_CARDS;
}

export function findCardByName(name: string): CardDef | undefined {
  const lower = name.toLowerCase().trim();
  return ALL_CARDS.find((c) => c.name.toLowerCase() === lower);
}

export function findCardById(id: string): CardDef | undefined {
  return ALL_CARDS.find((c) => c.id === id);
}

export function getBasicRunes(): CardDef[] {
  return ALL_CARDS.filter((c) => c.cardType === 'Basic Rune');
}

export function getBattlefields(): CardDef[] {
  return ALL_CARDS.filter((c) => c.cardType === 'Battlefield');
}

export function getLegends(): CardDef[] {
  return ALL_CARDS.filter(
    (c) => c.cardType === 'Champion Legend' || c.cardType === 'Legend'
  );
}
