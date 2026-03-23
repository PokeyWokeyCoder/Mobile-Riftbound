import React, { useState, useCallback, useEffect } from "react";
import type { GameState, GameCard, Action } from "../../engine/types";
import {
  applyAction,
  getLegalActions,
  advancePhase,
  runAiTurn,
} from "../../engine/mockEngine";
import { PhaseBar } from "../components/PhaseBar";
import { ResourceBar } from "../components/ResourceBar";
import { BattlefieldView } from "../components/BattlefieldView";
import { HandView } from "../components/HandView";
import { CardView } from "../components/CardView";
import { GameLog } from "../components/GameLog";
import "./GameScreen.css";

interface GameScreenProps {
  initialState: GameState;
  onExitGame: () => void;
}

type Tab = "board" | "log" | "legend";

export const GameScreen: React.FC<GameScreenProps> = ({
  initialState,
  onExitGame,
}) => {
  const [state, setState] = useState<GameState>(initialState);
  const [selectedCard, setSelectedCard] = useState<GameCard | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("board");

  const isPlayerTurn = state.turnPlayer === "player";
  const player = state.players.player;
  const ai = state.players.ai;

  const legalActions = getLegalActions(state, "player");
  const playableIds = new Set(
    legalActions
      .filter((a) => a.type === "PLAY_CARD" && a.cardInstanceId)
      .map((a) => a.cardInstanceId!)
  );

  // AI turn trigger
  useEffect(() => {
    if (state.turnPlayer === "ai" && !state.winner) {
      const timer = setTimeout(() => {
        setState((s) => runAiTurn(s));
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [state.turnPlayer, state.winner]);

  const dispatch = useCallback((action: Action) => {
    setState((s) => applyAction(s, action));
  }, []);

  function handleSelectCard(card: GameCard) {
    setSelectedCard((prev) => (prev?.instanceId === card.instanceId ? null : card));
  }

  function handleDeployToField(battlefieldId: string) {
    if (!selectedCard) return;
    dispatch({
      type: "PLAY_CARD",
      playerId: "player",
      cardInstanceId: selectedCard.instanceId,
      destinationZone: battlefieldId as "battlefield1" | "battlefield2",
    });
    setSelectedCard(null);
  }

  function handleAdvancePhase() {
    setSelectedCard(null);
    setState((s) => advancePhase(s));
  }

  function handleEndTurn() {
    setSelectedCard(null);
    dispatch({ type: "END_TURN", playerId: "player" });
  }

  function handlePassPriority() {
    dispatch({ type: "PASS_PRIORITY", playerId: "player" });
  }

  function handleChannelRune() {
    dispatch({ type: "CHANNEL_RUNE", playerId: "player" });
  }

  const canEndTurn =
    isPlayerTurn &&
    state.phase === "action" &&
    state.priorityHolder === "player";
  const canChannel =
    isPlayerTurn &&
    state.phase === "channel" &&
    state.priorityHolder === "player";
  const canPass =
    isPlayerTurn && state.priorityHolder === "player";

  // Win screen
  if (state.winner) {
    const won = state.winner === "player";
    return (
      <div className="game-screen game-screen--over">
        <div className="game-over">
          <div className={`game-over__icon ${won ? "game-over__icon--win" : "game-over__icon--loss"}`}>
            {won ? "🏆" : "💀"}
          </div>
          <h1 className="game-over__title">{won ? "Victory!" : "Defeated"}</h1>
          <p className="game-over__sub">
            {won
              ? `You reached ${player.points} points!`
              : `AI reached ${ai.points} points.`}
          </p>
          <div className="game-over__scores">
            <div className="score-block">
              <span>You</span>
              <span className="score-block__pts">{player.points} pts</span>
            </div>
            <div className="score-block">
              <span>AI</span>
              <span className="score-block__pts">{ai.points} pts</span>
            </div>
          </div>
          <button className="btn btn--primary" onClick={onExitGame}>
            Play Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="game-screen">
      {/* Top bar */}
      <div className="game-screen__topbar">
        <button className="btn-icon" onClick={onExitGame} title="Exit game">
          ←
        </button>
        <div className="topbar__score">
          <span className="topbar__score-label">You</span>
          <span className="topbar__score-value">{player.points}</span>
          <span className="topbar__score-sep">·</span>
          <span className="topbar__score-value">{ai.points}</span>
          <span className="topbar__score-label">AI</span>
        </div>
        <div className="topbar__turn">T{state.turnNumber}</div>
      </div>

      {/* Phase bar */}
      <div className="game-screen__phasebar">
        <PhaseBar
          currentPhase={state.phase}
          turnPlayer={state.turnPlayer}
          onAdvancePhase={isPlayerTurn ? handleAdvancePhase : undefined}
        />
      </div>

      {/* Tab navigation */}
      <div className="game-screen__tabs">
        {(["board", "log", "legend"] as Tab[]).map((tab) => (
          <button
            key={tab}
            className={`tab-btn${activeTab === tab ? " tab-btn--active" : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "board" ? "Board" : tab === "log" ? "Log" : "Legends"}
          </button>
        ))}
      </div>

      {/* Main content */}
      <div className="game-screen__main">
        {activeTab === "board" && (
          <>
            {/* AI Info */}
            <div className="game-screen__ai-info">
              <ResourceBar
                runePool={ai.runePool}
                deckCount={ai.mainDeckCount}
                runeCount={ai.runeDeckCount}
                handCount={ai.hand.length}
                trashCount={ai.trash.length}
                points={ai.points}
              />
            </div>

            {/* Battlefields */}
            <div className="game-screen__battlefields">
              {state.board.battlefields.map((bf) => (
                <BattlefieldView
                  key={bf.id}
                  battlefield={bf}
                  currentPlayer="player"
                  selectedCard={selectedCard}
                  onDropUnit={handleDeployToField}
                />
              ))}
            </div>

            {/* Player resources */}
            <div className="game-screen__player-resources">
              <ResourceBar
                runePool={player.runePool}
                deckCount={player.mainDeckCount}
                runeCount={player.runeDeckCount}
                handCount={player.hand.length}
                trashCount={player.trash.length}
                points={player.points}
              />
            </div>
          </>
        )}

        {activeTab === "log" && (
          <div className="game-screen__log">
            <GameLog entries={state.gameLog} />
          </div>
        )}

        {activeTab === "legend" && (
          <div className="game-screen__legends">
            <div className="legend-section">
              <div className="legend-section__label">Your Legend</div>
              <CardView card={player.legend} />
              <div className="legend-section__label" style={{ marginTop: 16 }}>
                Your Champion
              </div>
              <CardView card={player.chosenChampion} />
            </div>
            <div className="legend-section">
              <div className="legend-section__label">AI Legend</div>
              <CardView card={ai.legend} />
              <div className="legend-section__label" style={{ marginTop: 16 }}>
                AI Champion
              </div>
              <CardView card={ai.chosenChampion} />
            </div>
          </div>
        )}
      </div>

      {/* Hand */}
      {activeTab === "board" && (
        <div className="game-screen__hand">
          <HandView
            hand={player.hand}
            playableIds={playableIds}
            selectedId={selectedCard?.instanceId}
            onSelectCard={handleSelectCard}
          />
        </div>
      )}

      {/* Action toolbar */}
      <div className="game-screen__toolbar">
        {selectedCard && (
          <div className="toolbar__selected-info">
            <span>{selectedCard.name}</span>
            <button
              className="btn-small btn--ghost"
              onClick={() => setSelectedCard(null)}
            >
              ✕
            </button>
          </div>
        )}
        <div className="toolbar__actions">
          {canChannel && (
            <button
              className="btn btn--secondary"
              onClick={handleChannelRune}
              disabled={player.runeDeckCount === 0}
            >
              Channel Rune
            </button>
          )}
          {canPass && !canEndTurn && (
            <button
              className="btn btn--ghost"
              onClick={handlePassPriority}
            >
              Pass Priority
            </button>
          )}
          {canEndTurn && (
            <button className="btn btn--primary" onClick={handleEndTurn}>
              End Turn
            </button>
          )}
          {!isPlayerTurn && (
            <div className="toolbar__waiting">
              AI is thinking…
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
