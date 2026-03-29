/**
 * Parses a plain-text deck list into a DeckList.
 *
 * Expected format:
 *
 *   LEGEND: Lady of Luminosity - Lux
 *   CHAMPION: Lux, Spellweaver
 *
 *   MAIN DECK:
 *   3 Challenge
 *   2 Doran's Blade
 *   1 Fae Dragon
 *
 *   RUNE DECK:
 *   6 Mind Rune
 *   6 Fury Rune
 *
 *   BATTLEFIELDS:
 *   Altar to Unity
 *   Crystal Scar
 *   The Howling Abyss
 *
 * Section headers are case-insensitive.
 * Lines with just a number and a name are "count name".
 * Lines without a count number default to count 1.
 */

import type { DeckList } from '../engine/types';

type Section = 'none' | 'main' | 'rune' | 'battlefields';

export function parseDeckList(text: string): DeckList | { error: string } {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  let legendName = '';
  let chosenChampionName = '';
  const mainDeck: Array<{ count: number; name: string }> = [];
  const runeDeck: Array<{ count: number; name: string }> = [];
  const battlefields: string[] = [];

  let section: Section = 'none';

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detect section headers
    if (lower.startsWith('legend:')) {
      legendName = line.slice(7).trim();
      continue;
    }
    if (lower.startsWith('champion:')) {
      chosenChampionName = line.slice(9).trim();
      continue;
    }
    if (lower.startsWith('main deck:') || lower === 'main deck') {
      section = 'main';
      continue;
    }
    if (lower.startsWith('rune deck:') || lower === 'rune deck') {
      section = 'rune';
      continue;
    }
    if (lower.startsWith('battlefields:') || lower === 'battlefields') {
      section = 'battlefields';
      continue;
    }

    // Parse entry
    if (section === 'battlefields') {
      battlefields.push(line);
      continue;
    }

    if (section === 'main' || section === 'rune') {
      const match = line.match(/^(\d+)\s+(.+)$/);
      const entry = match
        ? { count: parseInt(match[1], 10), name: match[2].trim() }
        : { count: 1, name: line };

      if (section === 'main') mainDeck.push(entry);
      else runeDeck.push(entry);
    }
  }

  if (!legendName) return { error: 'Missing LEGEND line.' };
  if (!chosenChampionName) return { error: 'Missing CHAMPION line.' };
  if (mainDeck.length === 0) return { error: 'Main Deck is empty.' };
  if (runeDeck.length === 0) return { error: 'Rune Deck is empty.' };
  if (battlefields.length === 0) return { error: 'No Battlefields listed.' };

  const mainTotal = mainDeck.reduce((s, e) => s + e.count, 0);
  if (mainTotal < 40) {
    return { error: `Main Deck has only ${mainTotal} cards (minimum 40).` };
  }

  const runeTotal = runeDeck.reduce((s, e) => s + e.count, 0);
  if (runeTotal !== 12) {
    return { error: `Rune Deck must have exactly 12 runes (found ${runeTotal}).` };
  }

  if (battlefields.length < 3) {
    return { error: `Need 3 Battlefields (found ${battlefields.length}).` };
  }

  return { legendName, chosenChampionName, mainDeck, runeDeck, battlefields };
}

export function isDeckListError(
  result: DeckList | { error: string }
): result is { error: string } {
  return 'error' in result;
}
