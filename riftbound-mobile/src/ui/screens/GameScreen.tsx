import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import type { GameState, UnitObject, HandCard, BattlefieldId, LocationId, Action } from '../../engine/types';
import { getLegalActions, applyAction } from '../../engine/actions';
import { runAiTurn, type Difficulty } from '../../engine/ai';
import { BattlefieldZone } from '../components/BattlefieldZone';
import { UnitToken } from '../components/UnitToken';
import { CardView } from '../components/CardView';
import { ResourceBar } from '../components/ResourceBar';

interface Props {
  gameState: GameState;
  difficulty: Difficulty;
  onGameOver: (winner: 'player' | 'opponent' | null) => void;
  onQuit: () => void;
}

type SelectionMode = 'none' | 'move-unit' | 'card-target';

export function GameScreen({ gameState: initialState, difficulty, onGameOver, onQuit }: Props) {
  const [state, setState] = useState<GameState>(initialState);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('none');
  const [logVisible, setLogVisible] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);

  const isPlayerTurn = state.turnPlayer === 'player';
  const ps = state.players.player;
  const opp = state.players.opponent;
  const legalActions = isPlayerTurn ? getLegalActions(state, 'player') : [];

  // ─── AI turn ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state.winner) {
      onGameOver(state.winner);
      return;
    }
    if (state.turnPlayer === 'opponent' && !aiThinking) {
      setAiThinking(true);
      // Small delay so the UI updates before AI runs
      const timer = setTimeout(() => {
        const newState = runAiTurn(state, 'opponent', difficulty);
        setState(newState);
        setAiThinking(false);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [state.turnPlayer, state.phase, state.turnNumber]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const dispatch = useCallback((action: Action) => {
    setState((prev) => applyAction(prev, action));
    setSelectedUnitId(null);
    setSelectedCardId(null);
    setSelectionMode('none');
  }, []);

  const handleAdvance = () => dispatch({ type: 'ADVANCE_PHASE' });
  const handleEndTurn = () => dispatch({ type: 'END_TURN', playerId: 'player' });

  // ─── Unit selection / move ────────────────────────────────────────────────
  const handleUnitPress = (unit: UnitObject) => {
    if (!isPlayerTurn) return;
    if (unit.controllerId !== 'player') return;

    if (selectionMode === 'move-unit' && selectedUnitId === unit.instanceId) {
      // Deselect
      setSelectedUnitId(null);
      setSelectionMode('none');
      return;
    }
    setSelectedUnitId(unit.instanceId);
    setSelectionMode('move-unit');
  };

  const handleBattlefieldPress = (bfId: BattlefieldId) => {
    if (!isPlayerTurn) return;

    if (selectionMode === 'move-unit' && selectedUnitId) {
      dispatch({ type: 'MOVE_UNIT', playerId: 'player', unitInstanceId: selectedUnitId, destination: bfId });
    }
  };

  const handleBasePress = () => {
    if (!isPlayerTurn) return;
    if (selectionMode === 'move-unit' && selectedUnitId) {
      dispatch({ type: 'MOVE_UNIT', playerId: 'player', unitInstanceId: selectedUnitId, destination: 'base' });
    }
  };

  // ─── Card selection / play ────────────────────────────────────────────────
  const handleCardPress = (card: HandCard) => {
    if (!isPlayerTurn) return;

    const ct = card.cardType;
    const isUnit = ['Unit', 'Champion Unit', 'Signature Unit'].includes(ct);
    const isGear = ct === 'Gear' || ct === 'Signature Gear';
    const isSpell = ct === 'Spell' || ct === 'Signature Spell';
    const cost = card.energy ?? 0;
    const hasEnergy = ps.runePool.energy >= cost;

    if (!hasEnergy) {
      // Show why card can't be played
      return;
    }

    if (selectedCardId === card.instanceId) {
      // Second tap: confirm play
      if (isUnit) {
        dispatch({ type: 'PLAY_UNIT', playerId: 'player', handCardInstanceId: card.instanceId, payAccelerate: false });
      } else if (isGear) {
        dispatch({ type: 'PLAY_GEAR', playerId: 'player', handCardInstanceId: card.instanceId, attachToUnitId: null });
      } else if (isSpell) {
        dispatch({ type: 'PLAY_SPELL', playerId: 'player', handCardInstanceId: card.instanceId, targets: [] });
      }
    } else {
      setSelectedCardId(card.instanceId);
    }
  };

  // ─── Channel rune ─────────────────────────────────────────────────────────
  const handleChannelRune = (useRecycle: boolean) => {
    if (!isPlayerTurn || state.phase !== 'channel') return;
    const rune = ps.runeDeck[0];
    if (!rune) return;
    dispatch({ type: 'CHANNEL_RUNE', playerId: 'player', runeInstanceId: rune.instanceId, useRecycle });
  };

  // ─── Phase label ──────────────────────────────────────────────────────────
  const phaseLabel: Record<string, string> = {
    awaken: 'Awaken',
    beginning: 'Beginning',
    channel: 'Channel',
    draw: 'Draw',
    action: 'Action',
    end: 'End of Turn',
    expiration: 'Expiration',
    cleanup: 'Cleanup',
    gameOver: 'Game Over',
  };

  const canAdvance =
    isPlayerTurn &&
    ['awaken', 'beginning', 'draw', 'end', 'expiration', 'cleanup'].includes(state.phase);

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Opponent info bar */}
      <View style={styles.oppHeader}>
        <Text style={styles.playerLabel}>CPU {opp.legend ? `— ${opp.legend.name}` : ''}</Text>
        <Text style={styles.oppHandCount}>Hand: {opp.hand.length}</Text>
        <Text style={styles.pointsBadge}>★ {opp.points} / {state.victoryScore}</Text>
      </View>
      <ResourceBar
        runePool={opp.runePool}
        points={opp.points}
        deckCount={opp.mainDeck.length}
        handCount={opp.hand.length}
        runeCount={opp.runeDeck.length}
        isPlayer={false}
      />

      {/* Opponent base (minimal) */}
      <View style={styles.oppBase}>
        <Text style={styles.baseLabel}>CPU Base</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {opp.chosenChampion && (
            <UnitToken unit={opp.chosenChampion} isChampion />
          )}
          {state.board.bases.opponent.units.map((u) => (
            <UnitToken key={u.instanceId} unit={u} />
          ))}
        </ScrollView>
      </View>

      {/* Battlefields */}
      <View style={styles.battlefieldsRow}>
        {(['bf1', 'bf2'] as BattlefieldId[]).map((bfId) => (
          <BattlefieldZone
            key={bfId}
            battlefield={state.board.battlefields[bfId]}
            selectedUnitId={selectedUnitId}
            onUnitPress={handleUnitPress}
            onBattlefieldPress={() => handleBattlefieldPress(bfId)}
            highlight={selectionMode === 'move-unit' && selectedUnitId !== null}
          />
        ))}
      </View>

      {/* Player base */}
      <TouchableOpacity
        style={[styles.playerBase, selectionMode === 'move-unit' && styles.highlightBase]}
        onPress={handleBasePress}
      >
        <Text style={styles.baseLabel}>
          Your Base {selectionMode === 'move-unit' ? '(tap to recall)' : ''}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ps.chosenChampion && (
            <UnitToken
              unit={ps.chosenChampion}
              isChampion
              selected={selectedUnitId === ps.chosenChampion.instanceId}
              onPress={() => handleUnitPress(ps.chosenChampion!)}
            />
          )}
          {state.board.bases.player.units.map((u) => (
            <UnitToken
              key={u.instanceId}
              unit={u}
              selected={selectedUnitId === u.instanceId}
              onPress={() => handleUnitPress(u)}
            />
          ))}
        </ScrollView>
      </TouchableOpacity>

      {/* Player resource bar */}
      <ResourceBar
        runePool={ps.runePool}
        points={ps.points}
        deckCount={ps.mainDeck.length}
        handCount={ps.hand.length}
        runeCount={ps.runeDeck.length}
        isPlayer
      />

      {/* Player hand */}
      <View style={styles.hand}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {ps.hand.map((card) => {
            const cost = card.energy ?? 0;
            const canPlay = ps.runePool.energy >= cost;
            return (
              <CardView
                key={card.instanceId}
                card={card}
                compact
                selected={selectedCardId === card.instanceId}
                dimmed={!isPlayerTurn || !canPlay}
                onPress={() => handleCardPress(card)}
              />
            );
          })}
        </ScrollView>
      </View>

      {/* Action bar */}
      <View style={styles.actionBar}>
        {/* Phase indicator */}
        <View style={styles.phaseContainer}>
          <Text style={styles.turnLabel}>
            {isPlayerTurn ? '▲ Your Turn' : `▼ CPU (${aiThinking ? 'thinking…' : state.phase})`}
          </Text>
          <Text style={styles.phaseText}>
            Turn {state.turnNumber} · {phaseLabel[state.phase] ?? state.phase}
          </Text>
        </View>

        {/* Context-sensitive actions */}
        {isPlayerTurn && state.phase === 'channel' && (
          <View style={styles.channelBtns}>
            <TouchableOpacity style={styles.smallBtn} onPress={() => handleChannelRune(false)}>
              <Text style={styles.smallBtnText}>⚡ +Energy</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.smallBtn, styles.powerBtn]} onPress={() => handleChannelRune(true)}>
              <Text style={styles.smallBtnText}>💎 +Power</Text>
            </TouchableOpacity>
          </View>
        )}

        {isPlayerTurn && canAdvance && (
          <TouchableOpacity style={styles.advanceBtn} onPress={handleAdvance}>
            <Text style={styles.advanceBtnText}>Advance Phase →</Text>
          </TouchableOpacity>
        )}

        {isPlayerTurn && state.phase === 'action' && (
          <TouchableOpacity style={styles.endTurnBtn} onPress={handleEndTurn}>
            <Text style={styles.endTurnBtnText}>End Turn ✓</Text>
          </TouchableOpacity>
        )}

        {/* Log and Quit */}
        <TouchableOpacity style={styles.iconBtn} onPress={() => setLogVisible(true)}>
          <Text style={styles.iconBtnText}>📜</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={onQuit}>
          <Text style={styles.iconBtnText}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Hint for selection */}
      {selectionMode === 'move-unit' && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>
            Select a battlefield to move unit there, or tap base to recall.
          </Text>
          <TouchableOpacity onPress={() => { setSelectedUnitId(null); setSelectionMode('none'); }}>
            <Text style={styles.hintCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {selectedCardId && (
        <View style={styles.hintBar}>
          <Text style={styles.hintText}>Tap card again to play it.</Text>
          <TouchableOpacity onPress={() => setSelectedCardId(null)}>
            <Text style={styles.hintCancel}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Game Log Modal */}
      <Modal visible={logVisible} transparent animationType="slide" onRequestClose={() => setLogVisible(false)}>
        <View style={styles.logModal}>
          <View style={styles.logHeader}>
            <Text style={styles.logTitle}>Game Log</Text>
            <TouchableOpacity onPress={() => setLogVisible(false)}>
              <Text style={styles.logClose}>Close ✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.logScroll} ref={(ref) => { if (ref) (ref as any).scrollToEnd?.({ animated: false }); }}>
            {state.log.map((entry, i) => (
              <Text key={i} style={styles.logEntry}>{entry}</Text>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070f',
  },
  oppHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1a0a0a',
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
  },
  playerLabel: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 12,
    flex: 1,
  },
  oppHandCount: {
    color: '#888',
    fontSize: 11,
    marginRight: 8,
  },
  pointsBadge: {
    color: '#f39c12',
    fontWeight: 'bold',
    fontSize: 13,
  },
  oppBase: {
    minHeight: 56,
    backgroundColor: '#110505',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderColor: '#300',
  },
  baseLabel: {
    color: '#555',
    fontSize: 10,
    marginBottom: 2,
  },
  battlefieldsRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 4,
  },
  playerBase: {
    minHeight: 90,
    backgroundColor: '#050a11',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderColor: '#0a2a4a',
  },
  highlightBase: {
    borderColor: '#2ecc71',
    borderWidth: 2,
  },
  hand: {
    height: 60,
    backgroundColor: '#03060d',
    paddingHorizontal: 4,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderColor: '#0a2a4a',
  },
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0a1e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderColor: '#1a1a3a',
    flexWrap: 'wrap',
    gap: 6,
  },
  phaseContainer: {
    flex: 1,
    minWidth: 100,
  },
  turnLabel: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 12,
  },
  phaseText: {
    color: '#7788aa',
    fontSize: 10,
  },
  channelBtns: {
    flexDirection: 'row',
    gap: 4,
  },
  smallBtn: {
    backgroundColor: '#1a3a5a',
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  powerBtn: {
    backgroundColor: '#3a1a5a',
  },
  smallBtnText: {
    color: '#fff',
    fontSize: 12,
  },
  advanceBtn: {
    backgroundColor: '#1e6040',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  advanceBtnText: {
    color: '#2ecc71',
    fontWeight: 'bold',
    fontSize: 13,
  },
  endTurnBtn: {
    backgroundColor: '#5a1e1e',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  endTurnBtnText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    fontSize: 13,
  },
  iconBtn: {
    backgroundColor: '#222',
    borderRadius: 6,
    padding: 6,
  },
  iconBtnText: {
    fontSize: 16,
  },
  hintBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a3a1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'space-between',
  },
  hintText: {
    color: '#2ecc71',
    fontSize: 12,
    flex: 1,
  },
  hintCancel: {
    color: '#e74c3c',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  logModal: {
    flex: 1,
    backgroundColor: '#07070fdd',
    marginTop: 60,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#0a0a1e',
    borderBottomWidth: 1,
    borderColor: '#222',
  },
  logTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  logClose: {
    color: '#e74c3c',
    fontSize: 14,
  },
  logScroll: {
    padding: 12,
  },
  logEntry: {
    color: '#aaa',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 2,
  },
});
