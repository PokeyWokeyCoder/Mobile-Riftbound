import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RunePool, Domain } from '../../engine/types';

interface Props {
  runePool: RunePool;
  points: number;
  deckCount: number;
  handCount: number;
  runeCount: number;
  isPlayer?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  Fury: '#c0392b',
  Calm: '#27ae60',
  Mind: '#2980b9',
  Body: '#e67e22',
  Chaos: '#8e44ad',
  Order: '#f1c40f',
};

export function ResourceBar({ runePool, points, deckCount, handCount, runeCount, isPlayer }: Props) {
  const powerEntries = Object.entries(runePool.power).filter(([, v]) => v > 0);

  return (
    <View style={[styles.bar, isPlayer ? styles.playerBar : styles.oppBar]}>
      {/* Points */}
      <View style={styles.stat}>
        <Text style={styles.label}>★</Text>
        <Text style={styles.value}>{points}</Text>
      </View>

      {/* Energy */}
      <View style={styles.stat}>
        <Text style={styles.label}>⚡</Text>
        <Text style={styles.value}>{runePool.energy}</Text>
      </View>

      {/* Power */}
      {powerEntries.map(([domain, amount]) => (
        <View key={domain} style={[styles.stat, { backgroundColor: DOMAIN_COLORS[domain] + '44' }]}>
          <Text style={[styles.label, { color: DOMAIN_COLORS[domain] }]}>{domain[0]}</Text>
          <Text style={styles.value}>{amount}</Text>
        </View>
      ))}

      {/* Deck */}
      <View style={styles.stat}>
        <Text style={styles.label}>📚</Text>
        <Text style={styles.value}>{deckCount}</Text>
      </View>

      {/* Hand */}
      <View style={styles.stat}>
        <Text style={styles.label}>🃏</Text>
        <Text style={styles.value}>{handCount}</Text>
      </View>

      {/* Runes */}
      <View style={styles.stat}>
        <Text style={styles.label}>💎</Text>
        <Text style={styles.value}>{runeCount}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexWrap: 'wrap',
    gap: 6,
  },
  playerBar: {
    backgroundColor: '#0a1628',
    borderTopWidth: 1,
    borderColor: '#2c5282',
  },
  oppBar: {
    backgroundColor: '#1a0a0a',
    borderBottomWidth: 1,
    borderColor: '#7b2121',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff15',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  label: {
    color: '#aaa',
    fontSize: 11,
    marginRight: 2,
  },
  value: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
