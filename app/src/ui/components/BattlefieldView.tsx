import React from "react";
import type { BattlefieldState, GameCard, PlayerId } from "../../engine/types";
import { CardView } from "./CardView";
import "./BattlefieldView.css";

interface BattlefieldViewProps {
  battlefield: BattlefieldState;
  currentPlayer: PlayerId;
  selectedCard?: GameCard | null;
  onDropUnit?: (battlefieldId: string) => void;
  onClickUnit?: (card: GameCard) => void;
}

export const BattlefieldView: React.FC<BattlefieldViewProps> = ({
  battlefield,
  currentPlayer,
  selectedCard,
  onDropUnit,
  onClickUnit,
}) => {
  const isContested = battlefield.isContested;
  const hasMyUnits = battlefield.units.some(
    (u) => u.controllerId === currentPlayer
  );
  const hasEnemyUnits = battlefield.units.some(
    (u) => u.controllerId !== currentPlayer
  );

  const controllerLabel =
    battlefield.controller === null
      ? "Uncontrolled"
      : battlefield.controller === currentPlayer
      ? "You control"
      : "AI controls";

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    if (onDropUnit) onDropUnit(battlefield.id);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  return (
    <div
      className={[
        "battlefield",
        isContested ? "battlefield--contested" : "",
        battlefield.controller === currentPlayer ? "battlefield--mine" : "",
        battlefield.controller && battlefield.controller !== currentPlayer
          ? "battlefield--enemy"
          : "",
        battlefield.controller === null ? "battlefield--neutral" : "",
        selectedCard ? "battlefield--droppable" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={() => {
        if (selectedCard && onDropUnit) onDropUnit(battlefield.id);
      }}
    >
      {/* Header */}
      <div className="battlefield__header">
        <span className="battlefield__name">{battlefield.name}</span>
        <span
          className={`battlefield__controller ${
            battlefield.controller === currentPlayer
              ? "battlefield__controller--mine"
              : battlefield.controller
              ? "battlefield__controller--enemy"
              : ""
          }`}
        >
          {controllerLabel}
        </span>
        {isContested && (
          <span className="battlefield__contested">⚔ CONTESTED</span>
        )}
      </div>

      {/* Rules text */}
      {battlefield.rulesText && (
        <p className="battlefield__rules">{battlefield.rulesText}</p>
      )}

      {/* Units */}
      <div className="battlefield__units">
        {/* AI units (top row) */}
        <div className="battlefield__unit-row battlefield__unit-row--enemy">
          {battlefield.units
            .filter((u) => u.controllerId !== currentPlayer)
            .map((u) => (
              <CardView
                key={u.instanceId}
                card={u}
                compact
                onClick={() => onClickUnit?.(u)}
              />
            ))}
          {hasEnemyUnits === false && (
            <div className="battlefield__empty-row">Enemy units appear here</div>
          )}
        </div>

        <div className="battlefield__divider" />

        {/* Player units (bottom row) */}
        <div className="battlefield__unit-row battlefield__unit-row--mine">
          {battlefield.units
            .filter((u) => u.controllerId === currentPlayer)
            .map((u) => (
              <CardView
                key={u.instanceId}
                card={u}
                compact
                onClick={() => onClickUnit?.(u)}
              />
            ))}
          {hasMyUnits === false && (
            <div className="battlefield__empty-row">
              {selectedCard ? "Tap to deploy here" : "Your units appear here"}
            </div>
          )}
        </div>
      </div>

      {/* Facedown card indicator */}
      {battlefield.facedownCard && (
        <div className="battlefield__facedown">
          <span>Hidden card present</span>
        </div>
      )}
    </div>
  );
};
