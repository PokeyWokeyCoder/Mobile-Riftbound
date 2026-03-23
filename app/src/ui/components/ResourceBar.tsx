import React from "react";
import type { RunePool } from "../../engine/types";
import { DOMAIN_COLORS } from "../../engine/types";
import "./ResourceBar.css";

interface ResourceBarProps {
  runePool: RunePool;
  deckCount: number;
  runeCount: number;
  handCount: number;
  trashCount: number;
  points: number;
}

export const ResourceBar: React.FC<ResourceBarProps> = ({
  runePool,
  deckCount,
  runeCount,
  handCount,
  trashCount,
  points,
}) => {
  const powerEntries = Object.entries(runePool.power) as [
    keyof typeof DOMAIN_COLORS,
    number
  ][];

  return (
    <div className="resource-bar">
      <div className="resource-group">
        <div className="resource resource--points">
          <span className="resource__icon">★</span>
          <span className="resource__value">{points}</span>
          <span className="resource__label">Points</span>
        </div>
        <div className="resource resource--energy">
          <span className="resource__icon">⚡</span>
          <span className="resource__value">{runePool.energy}</span>
          <span className="resource__label">Energy</span>
        </div>
        {powerEntries.map(([domain, amount]) =>
          amount > 0 ? (
            <div
              key={domain}
              className="resource resource--power"
              style={{ "--domain-color": DOMAIN_COLORS[domain] } as React.CSSProperties}
            >
              <span className="resource__value">{amount}</span>
              <span className="resource__label">{domain}</span>
            </div>
          ) : null
        )}
      </div>
      <div className="resource-group resource-group--zones">
        <div className="zone-count">
          <span className="zone-count__icon">🃏</span>
          <span className="zone-count__value">{handCount}</span>
        </div>
        <div className="zone-count">
          <span className="zone-count__icon">📚</span>
          <span className="zone-count__value">{deckCount}</span>
        </div>
        <div className="zone-count">
          <span className="zone-count__icon">🔮</span>
          <span className="zone-count__value">{runeCount}</span>
        </div>
        <div className="zone-count">
          <span className="zone-count__icon">🗑</span>
          <span className="zone-count__value">{trashCount}</span>
        </div>
      </div>
    </div>
  );
};
