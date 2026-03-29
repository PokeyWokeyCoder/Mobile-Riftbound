import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { parseDeckList, isDeckListError } from '../../data/deckParser';
import type { DeckList } from '../../engine/types';

interface Props {
  onDeckReady: (deck: DeckList, label: string) => void;
  onBack: () => void;
  initialText?: string;
  title?: string;
}

const EXAMPLE_DECK = `LEGEND: Lady of Luminosity - Lux
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
3 Recruit (DE)
3 Lux, Luminous
3 Fae Dragon
3 Challenge
3 Annie, Fiery
2 Decisive Strike

RUNE DECK:
6 Mind Rune
6 Fury Rune

BATTLEFIELDS:
Altar to Unity
Crystal Scar
The Howling Abyss`;

export function DeckBuilderScreen({ onDeckReady, onBack, initialText = '', title = 'Build Your Deck' }: Props) {
  const [text, setText] = useState(initialText || EXAMPLE_DECK);
  const [error, setError] = useState('');
  const [deckLabel, setDeckLabel] = useState('My Deck');

  const handleValidate = () => {
    const result = parseDeckList(text);
    if (isDeckListError(result)) {
      setError(result.error);
      return;
    }
    setError('');
    onDeckReady(result, deckLabel);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.labelRow}>
        <Text style={styles.labelText}>Deck Name:</Text>
        <TextInput
          style={styles.labelInput}
          value={deckLabel}
          onChangeText={setDeckLabel}
          placeholderTextColor="#666"
        />
      </View>

      <ScrollView style={styles.instructions}>
        <Text style={styles.instructionText}>
          Paste your deck list below using this format:{'\n\n'}
          {'LEGEND: <legend name>\n'}
          {'CHAMPION: <chosen champion>\n\n'}
          {'MAIN DECK:\n'}
          {'3 Card Name\n'}
          {'2 Another Card\n\n'}
          {'RUNE DECK:\n'}
          {'6 Fury Rune\n'}
          {'6 Mind Rune\n\n'}
          {'BATTLEFIELDS:\n'}
          {'Battlefield Name 1\n'}
          {'Battlefield Name 2\n'}
          {'Battlefield Name 3'}
        </Text>
      </ScrollView>

      <TextInput
        style={styles.input}
        multiline
        value={text}
        onChangeText={(t) => { setText(t); setError(''); }}
        placeholder="Paste deck list here..."
        placeholderTextColor="#555"
        textAlignVertical="top"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleValidate}>
        <Text style={styles.buttonText}>Validate & Use Deck →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a1a',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  backBtn: {
    marginRight: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: '#333',
    borderRadius: 6,
  },
  backText: {
    color: '#aaa',
    fontSize: 14,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    color: '#aaa',
    marginRight: 8,
    fontSize: 14,
  },
  labelInput: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    color: '#fff',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 14,
  },
  instructions: {
    maxHeight: 130,
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  instructionText: {
    color: '#777',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  input: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    color: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    fontSize: 12,
    fontFamily: 'monospace',
    minHeight: 200,
    marginBottom: 8,
  },
  error: {
    color: '#e74c3c',
    fontSize: 13,
    marginBottom: 8,
    backgroundColor: '#2d0000',
    padding: 8,
    borderRadius: 6,
  },
  button: {
    backgroundColor: '#2980b9',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
