import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

interface Props {
  onNewGame: () => void;
}

export function HomeScreen({ onNewGame }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>RIFTBOUND</Text>
        <Text style={styles.subtitle}>Mobile · Deck Tester</Text>
        <View style={styles.divider} />
        <Text style={styles.tagline}>Test your decks against the AI</Text>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.primaryBtn} onPress={onNewGame}>
          <Text style={styles.primaryBtnText}>⚔  New Game vs CPU</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Core Rules 2025-06-02 · v1 Engine</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070f',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  hero: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#e8c46a',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 8,
    textShadowColor: '#e8c46a88',
    textShadowRadius: 20,
  },
  subtitle: {
    color: '#8899aa',
    fontSize: 16,
    marginTop: 4,
    letterSpacing: 4,
  },
  divider: {
    width: 120,
    height: 1,
    backgroundColor: '#e8c46a55',
    marginVertical: 20,
  },
  tagline: {
    color: '#6677aa',
    fontSize: 14,
    fontStyle: 'italic',
  },
  menu: {
    width: '100%',
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: '#1e3a5f',
    borderRadius: 12,
    paddingVertical: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2c5f8a',
  },
  primaryBtnText: {
    color: '#e8f4f8',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  footer: {
    marginTop: 40,
  },
  footerText: {
    color: '#333',
    fontSize: 11,
  },
});
