import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, View, Text, TouchableOpacity, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';

import { HomeScreen } from './src/ui/screens/HomeScreen';
import { DeckBuilderScreen } from './src/ui/screens/DeckBuilderScreen';
import { GameScreen } from './src/ui/screens/GameScreen';
import { createInitialGameState } from './src/engine/gameState';
import { parseDeckList, isDeckListError } from './src/data/deckParser';
import { getAllCards } from './src/data/loader';
import type { GameState, DeckList } from './src/engine/types';
import type { Difficulty } from './src/engine/ai';

// ─── CPU default deck ─────────────────────────────────────────────────────────

const CPU_DECK_TEXT = `LEGEND: Lady of Luminosity - Lux
CHAMPION: Lux, Luminous

MAIN DECK:
3 Challenge
3 Doran's Blade
3 Fae Dragon
3 Tibbers
3 Annie, Fiery
3 Annie, Stubborn
3 Decisive Strike
3 Heimerdinger, Inventor
3 Fae Dragon
3 Challenge
3 Annie, Fiery
2 Decisive Strike
1 Tibbers

RUNE DECK:
6 Mind Rune
6 Fury Rune

BATTLEFIELDS:
Altar to Unity
Crystal Scar
The Howling Abyss`;

function buildCpuDeck(): DeckList {
  const parsed = parseDeckList(CPU_DECK_TEXT);
  if (!isDeckListError(parsed)) return parsed;

  // Fallback: auto-build from card data if names don't match
  const allCards = getAllCards();
  const units = allCards
    .filter((c) =>
      ['Unit', 'Champion Unit'].includes(c.cardType) &&
      c.domain === 'Fury' &&
      c.energy !== null &&
      c.energy <= 5
    )
    .slice(0, 10);

  const spells = allCards
    .filter((c) =>
      c.cardType === 'Spell' && c.domain === 'Fury' && c.energy !== null && c.energy <= 4
    )
    .slice(0, 5);

  const legend = allCards.find((c) => c.cardType === 'Champion Legend' && c.domain === 'Fury');
  const champion = allCards.find(
    (c) => c.cardType === 'Champion Unit' && c.domain === 'Fury'
  );
  const rune = allCards.find((c) => c.cardType === 'Basic Rune' && c.domain === 'Fury');
  const battlefields = allCards.filter((c) => c.cardType === 'Battlefield').slice(0, 3);

  return {
    legendName: legend?.name ?? '',
    chosenChampionName: champion?.name ?? units[0]?.name ?? '',
    mainDeck: [
      ...units.map((c) => ({ count: 4, name: c.name })),
      ...spells.map((c) => ({ count: 4, name: c.name })),
    ],
    runeDeck: [{ count: 12, name: rune?.name ?? 'Fury Rune' }],
    battlefields: battlefields.map((c) => c.name),
  };
}

// ─── App screen states ────────────────────────────────────────────────────────

type AppScreen = 'home' | 'deck-builder-player' | 'deck-builder-cpu' | 'game' | 'game-over';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('home');
  const [playerDeck, setPlayerDeck] = useState<DeckList | null>(null);
  const [cpuDeck, setCpuDeck] = useState<DeckList | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [gameWinner, setGameWinner] = useState<'player' | 'opponent' | null>(null);

  const startGame = (pDeck: DeckList, cDeck: DeckList) => {
    try {
      const firstPlayer: 'player' | 'opponent' = Math.random() < 0.5 ? 'player' : 'opponent';
      const gs = createInitialGameState(pDeck, cDeck, firstPlayer);
      setGameState(gs);
      setScreen('game');
    } catch (err: any) {
      Alert.alert('Setup Error', err?.message ?? 'Failed to start game.');
    }
  };

  const handlePlayerDeckReady = (deck: DeckList) => {
    setPlayerDeck(deck);
    setScreen('deck-builder-cpu');
  };

  const handleCpuDeckReady = (deck: DeckList) => {
    setCpuDeck(deck);
    startGame(playerDeck!, deck);
  };

  const handleUseCpuDefault = () => {
    const cpu = buildCpuDeck();
    setCpuDeck(cpu);
    if (playerDeck) startGame(playerDeck, cpu);
  };

  const handleGameOver = (winner: 'player' | 'opponent' | null) => {
    setGameWinner(winner);
    setScreen('game-over');
  };

  const handleQuit = () => {
    Alert.alert('Quit Game', 'Are you sure you want to quit?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Quit', style: 'destructive', onPress: () => setScreen('home') },
    ]);
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />

      {screen === 'home' && <HomeScreen onNewGame={() => setScreen('deck-builder-player')} />}

      {screen === 'deck-builder-player' && (
        <DeckBuilderScreen
          title="Your Deck"
          onDeckReady={handlePlayerDeckReady}
          onBack={() => setScreen('home')}
        />
      )}

      {screen === 'deck-builder-cpu' && (
        <View style={styles.cpuDeckScreen}>
          <DeckBuilderScreen
            title="CPU Deck (or use default below)"
            onDeckReady={handleCpuDeckReady}
            onBack={() => setScreen('deck-builder-player')}
          />
          <TouchableOpacity style={styles.defaultBtn} onPress={handleUseCpuDefault}>
            <Text style={styles.defaultBtnText}>Use Default CPU Deck →</Text>
          </TouchableOpacity>
          <View style={styles.difficultyRow}>
            <Text style={styles.diffLabel}>AI Difficulty:</Text>
            {(['easy', 'medium'] as Difficulty[]).map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.diffBtn, difficulty === d && styles.diffBtnActive]}
                onPress={() => setDifficulty(d)}
              >
                <Text style={[styles.diffBtnText, difficulty === d && styles.diffBtnTextActive]}>
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {screen === 'game' && gameState && (
        <GameScreen
          gameState={gameState}
          difficulty={difficulty}
          onGameOver={handleGameOver}
          onQuit={handleQuit}
        />
      )}

      {screen === 'game-over' && (
        <View style={styles.gameOverScreen}>
          <Text style={styles.gameOverTitle}>
            {gameWinner === 'player' ? '🏆 You Win!' : gameWinner === 'opponent' ? '💀 CPU Wins' : 'Game Over'}
          </Text>
          <Text style={styles.gameOverSub}>
            {gameWinner === 'player' ? 'Well played!' : 'Better luck next time.'}
          </Text>
          <TouchableOpacity
            style={styles.rematchBtn}
            onPress={() => { if (playerDeck && cpuDeck) startGame(playerDeck, cpuDeck); }}
          >
            <Text style={styles.rematchText}>⚔  Rematch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.homeBtn} onPress={() => setScreen('home')}>
            <Text style={styles.homeBtnText}>← Main Menu</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#07070f',
  },
  cpuDeckScreen: {
    flex: 1,
  },
  defaultBtn: {
    backgroundColor: '#1e3a5f',
    margin: 12,
    marginTop: 0,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  defaultBtnText: {
    color: '#7ec8e3',
    fontWeight: 'bold',
    fontSize: 15,
  },
  difficultyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
  },
  diffLabel: {
    color: '#aaa',
    fontSize: 13,
    marginRight: 4,
  },
  diffBtn: {
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    backgroundColor: '#1a1a2e',
    borderWidth: 1,
    borderColor: '#333',
  },
  diffBtnActive: {
    backgroundColor: '#2c5282',
    borderColor: '#4a90d9',
  },
  diffBtnText: { color: '#666', fontSize: 13 },
  diffBtnTextActive: { color: '#fff', fontWeight: 'bold' },
  gameOverScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#07070f',
    padding: 40,
  },
  gameOverTitle: {
    color: '#e8c46a',
    fontSize: 44,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  gameOverSub: {
    color: '#8899aa',
    fontSize: 18,
    marginBottom: 40,
  },
  rematchBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 40,
    marginBottom: 16,
  },
  rematchText: {
    color: '#7ec8e3',
    fontWeight: 'bold',
    fontSize: 18,
  },
  homeBtn: { paddingVertical: 12, paddingHorizontal: 24 },
  homeBtnText: { color: '#666', fontSize: 15 },
});
