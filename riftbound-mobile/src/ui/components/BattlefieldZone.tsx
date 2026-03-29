import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { BattlefieldState, UnitObject } from '../../engine/types';
import { UnitToken } from './UnitToken';

interface Props {
  battlefield: BattlefieldState;
  selectedUnitId?: string | null;
  onUnitPress?: (unit: UnitObject) => void;
  onBattlefieldPress?: () => void;
  highlight?: boolean;
}

export function BattlefieldZone({
  battlefield,
  selectedUnitId,
  onUnitPress,
  onBattlefieldPress,
  highlight,
}: Props) {
  const playerUnits = battlefield.units.filter((u) => u.controllerId === 'player');
  const oppUnits = battlefield.units.filter((u) => u.controllerId === 'opponent');

  const controllerLabel =
    battlefield.controller === 'player'
      ? '▲ You'
      : battlefield.controller === 'opponent'
      ? '▼ CPU'
      : 'Neutral';

  return (
    <TouchableOpacity
      style={[
        styles.battlefield,
        highlight && styles.highlight,
        battlefield.isContested && styles.contested,
      ]}
      onPress={onBattlefieldPress}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.name} numberOfLines={1}>{battlefield.name}</Text>
        <Text style={styles.controller}>{controllerLabel}</Text>
      </View>

      {/* Opponent units */}
      <View style={styles.unitRow}>
        {oppUnits.map((u) => (
          <UnitToken
            key={u.instanceId}
            unit={u}
            selected={selectedUnitId === u.instanceId}
            onPress={() => onUnitPress?.(u)}
          />
        ))}
      </View>

      {/* VS divider */}
      {battlefield.isContested && (
        <View style={styles.vsDivider}>
          <Text style={styles.vsText}>⚔ Combat Pending</Text>
        </View>
      )}

      {/* Player units */}
      <View style={styles.unitRow}>
        {playerUnits.map((u) => (
          <UnitToken
            key={u.instanceId}
            unit={u}
            selected={selectedUnitId === u.instanceId}
            onPress={() => onUnitPress?.(u)}
          />
        ))}
      </View>

      {/* Ability */}
      {battlefield.ability ? (
        <Text style={styles.ability} numberOfLines={2}>{battlefield.ability}</Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  battlefield: {
    flex: 1,
    minHeight: 180,
    backgroundColor: '#0f3460',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2c3e50',
    margin: 4,
    padding: 6,
  },
  highlight: {
    borderColor: '#2ecc71',
    borderWidth: 2,
    shadowColor: '#2ecc71',
    shadowRadius: 6,
    shadowOpacity: 0.5,
  },
  contested: {
    borderColor: '#e74c3c',
    borderWidth: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#ecf0f1',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
  },
  controller: {
    color: '#bdc3c7',
    fontSize: 10,
    marginLeft: 4,
  },
  unitRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    minHeight: 40,
    justifyContent: 'center',
  },
  vsDivider: {
    alignItems: 'center',
    paddingVertical: 2,
    backgroundColor: '#e74c3c22',
    borderRadius: 4,
    marginVertical: 2,
  },
  vsText: {
    color: '#e74c3c',
    fontSize: 10,
    fontWeight: 'bold',
  },
  ability: {
    color: '#95a5a6',
    fontSize: 9,
    marginTop: 4,
    fontStyle: 'italic',
  },
});
