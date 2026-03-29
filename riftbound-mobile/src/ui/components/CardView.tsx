import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import type { HandCard } from '../../engine/types';

interface Props {
  card: HandCard;
  selected?: boolean;
  onPress?: () => void;
  compact?: boolean;
  dimmed?: boolean;
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

export function CardView({ card, selected, onPress, compact, dimmed }: Props) {
  const domainColor = DOMAIN_COLORS[card.domain as string] ?? '#7f8c8d';
  const isUnit = ['Unit', 'Champion Unit', 'Signature Unit', 'Token Unit'].includes(card.cardType);
  const isSpell = card.cardType === 'Spell' || card.cardType === 'Signature Spell';

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compact, { borderColor: domainColor }, selected && styles.selected, dimmed && styles.dimmed]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={styles.compactCost}>{card.energy ?? '–'}</Text>
        <Text style={styles.compactName} numberOfLines={1}>{card.name}</Text>
        {isUnit && <Text style={styles.compactMight}>{card.might ?? '?'}</Text>}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { borderColor: domainColor }, selected && styles.selected, dimmed && styles.dimmed]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: domainColor }]}>
        <Text style={styles.cost}>{card.energy ?? '–'}</Text>
        <Text style={styles.domain}>{card.domain}</Text>
      </View>

      {/* Card image placeholder */}
      {card.imageUrl ? (
        <Image source={{ uri: card.imageUrl }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.imagePlaceholder, { backgroundColor: domainColor + '33' }]}>
          <Text style={styles.typeLabel}>{card.cardType}</Text>
        </View>
      )}

      {/* Name */}
      <Text style={styles.name} numberOfLines={2}>{card.name}</Text>

      {/* Stats */}
      <View style={styles.stats}>
        {isUnit && (
          <View style={styles.might}>
            <Text style={styles.mightText}>{card.might ?? '?'}</Text>
          </View>
        )}
        <Text style={styles.typeSmall}>{card.cardType}</Text>
      </View>

      {/* Ability */}
      {card.ability ? (
        <Text style={styles.ability} numberOfLines={3}>{card.ability}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 110,
    minHeight: 160,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    margin: 4,
  },
  compact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a2e',
    borderRadius: 6,
    borderWidth: 1.5,
    paddingHorizontal: 6,
    paddingVertical: 4,
    margin: 2,
    minWidth: 80,
  },
  selected: {
    borderWidth: 3,
    shadowColor: '#fff',
    shadowRadius: 4,
    shadowOpacity: 0.8,
  },
  dimmed: {
    opacity: 0.4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  cost: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  domain: {
    color: '#fff',
    fontSize: 9,
  },
  image: {
    width: '100%',
    height: 70,
  },
  imagePlaceholder: {
    width: '100%',
    height: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    color: '#aaa',
    fontSize: 9,
  },
  name: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginTop: 2,
  },
  might: {
    backgroundColor: '#e74c3c',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  mightText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  typeSmall: {
    color: '#888',
    fontSize: 8,
  },
  ability: {
    color: '#ccc',
    fontSize: 8,
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  compactCost: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    width: 16,
    textAlign: 'center',
  },
  compactName: {
    color: '#eee',
    fontSize: 11,
    flex: 1,
    marginHorizontal: 4,
  },
  compactMight: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 12,
    width: 16,
    textAlign: 'right',
  },
});
