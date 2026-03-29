import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { UnitObject } from '../../engine/types';
import { getMight } from '../../engine/gameState';

interface Props {
  unit: UnitObject;
  onPress?: () => void;
  selected?: boolean;
  isChampion?: boolean;
}

const DOMAIN_COLORS: Record<string, string> = {
  Fury: '#c0392b',
  Calm: '#27ae60',
  Mind: '#2980b9',
  Body: '#e67e22',
  Chaos: '#8e44ad',
  Order: '#f1c40f',
  Colorless: '#7f8c8d',
};

export function UnitToken({ unit, onPress, selected, isChampion }: Props) {
  const domainColor = DOMAIN_COLORS[unit.domain as string] ?? '#7f8c8d';
  const currentMight = getMight(unit);
  const isDamaged = unit.damage > 0;
  const isExhausted = unit.exhausted;

  return (
    <TouchableOpacity
      style={[
        styles.token,
        { borderColor: isChampion ? '#FFD700' : domainColor },
        isExhausted && styles.exhausted,
        selected && styles.selected,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Might */}
      <View style={[styles.mightBadge, { backgroundColor: domainColor }]}>
        <Text style={styles.mightText}>{currentMight}</Text>
      </View>

      {/* Damage */}
      {isDamaged && (
        <View style={styles.damageBadge}>
          <Text style={styles.damageText}>-{unit.damage}</Text>
        </View>
      )}

      {/* Name */}
      <Text style={styles.name} numberOfLines={2}>{unit.name}</Text>

      {/* Exhausted overlay */}
      {isExhausted && (
        <View style={styles.exhaustedOverlay}>
          <Text style={styles.exhaustedText}>⟳</Text>
        </View>
      )}

      {/* Champion crown */}
      {isChampion && <Text style={styles.crown}>♛</Text>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  token: {
    width: 64,
    height: 80,
    backgroundColor: '#16213e',
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
    padding: 2,
    position: 'relative',
  },
  selected: {
    borderWidth: 3,
    shadowColor: '#FFD700',
    shadowRadius: 6,
    shadowOpacity: 1,
  },
  exhausted: {
    opacity: 0.55,
  },
  mightBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mightText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  damageBadge: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: '#e74c3c',
    borderRadius: 8,
    paddingHorizontal: 3,
  },
  damageText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  name: {
    color: '#ddd',
    fontSize: 9,
    textAlign: 'center',
    marginTop: 4,
  },
  exhaustedOverlay: {
    position: 'absolute',
    bottom: 2,
    alignSelf: 'center',
  },
  exhaustedText: {
    fontSize: 14,
    color: '#aaa',
  },
  crown: {
    position: 'absolute',
    top: 2,
    left: 4,
    fontSize: 10,
    color: '#FFD700',
  },
});
