import React from "react";
import type { GameCard } from "../../engine/types";
import { CardView } from "./CardView";
import "./HandView.css";

interface HandViewProps {
  hand: GameCard[];
  playableIds: Set<string>;
  selectedId?: string | null;
  onSelectCard: (card: GameCard) => void;
}

export const HandView: React.FC<HandViewProps> = ({
  hand,
  playableIds,
  selectedId,
  onSelectCard,
}) => {
  return (
    <div className="hand-view">
      <div className="hand-view__label">
        Hand <span className="hand-view__count">({hand.length})</span>
      </div>
      <div className="hand-view__cards">
        {hand.length === 0 && (
          <div className="hand-view__empty">No cards in hand</div>
        )}
        {hand.map((card) => (
          <div
            key={card.instanceId}
            className={`hand-card-wrapper${selectedId === card.instanceId ? " hand-card-wrapper--selected" : ""}`}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.setData("cardInstanceId", card.instanceId);
              onSelectCard(card);
            }}
          >
            <CardView
              card={card}
              selected={selectedId === card.instanceId}
              playable={playableIds.has(card.instanceId)}
              onClick={() => onSelectCard(card)}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
