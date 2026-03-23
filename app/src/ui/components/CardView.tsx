import React, { useState } from "react";
import type { GameCard } from "../../engine/types";
import { DOMAIN_COLORS } from "../../engine/types";
import "./CardView.css";

interface CardViewProps {
  card: GameCard;
  faceDown?: boolean;
  selected?: boolean;
  playable?: boolean;
  compact?: boolean;
  onClick?: () => void;
}

export const CardView: React.FC<CardViewProps> = ({
  card,
  faceDown = false,
  selected = false,
  playable = false,
  compact = false,
  onClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  const primaryDomain = card.domains[0];
  const domainColor = primaryDomain ? DOMAIN_COLORS[primaryDomain] : "#555";
  const isUnit = card.type === "Unit";
  const isExhausted = card.exhausted;
  function handleClick() {
    if (onClick) onClick();
    else setExpanded((e) => !e);
  }

  if (faceDown) {
    return (
      <div
        className={`card card--facedown${compact ? " card--compact" : ""}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      />
    );
  }

  return (
    <>
      <div
        className={[
          "card",
          compact ? "card--compact" : "",
          isExhausted ? "card--exhausted" : "",
          selected ? "card--selected" : "",
          playable ? "card--playable" : "",
          card.type === "Rune" ? "card--rune" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={{ "--domain-color": domainColor } as React.CSSProperties}
        onClick={handleClick}
        role="button"
        tabIndex={0}
        aria-label={`${card.name} card`}
      >
        <div className="card__header">
          <span className="card__name">{card.name}</span>
          <span className="card__cost">{card.energyCost}</span>
        </div>
        <div className="card__type-bar">
          <span className="card__type">{card.type}</span>
          {card.domains.map((d) => (
            <span
              key={d}
              className="card__domain-badge"
              style={{ background: DOMAIN_COLORS[d] }}
            >
              {d}
            </span>
          ))}
        </div>
        {!compact && (
          <div className="card__body">
            <p className="card__rules">{card.rulesText}</p>
            {card.flavorText && (
              <p className="card__flavor">{card.flavorText}</p>
            )}
          </div>
        )}
        <div className="card__footer">
          {isUnit && (
            <div className="card__stats">
              <span
                className={`card__might${card.damageMarked > 0 ? " card__might--damaged" : ""}`}
              >
                ⚔ {card.might ?? 0}
                {card.buffCounters > 0 && `+${card.buffCounters}`}
              </span>
              {card.damageMarked > 0 && (
                <span className="card__damage">💢 {card.damageMarked}</span>
              )}
            </div>
          )}
          {card.keywords.length > 0 && (
            <div className="card__keywords">
              {card.keywords.map((kw, i) => (
                <span key={i} className="card__keyword">
                  {kw.keyword}
                  {kw.value != null ? ` ${kw.value}` : ""}
                </span>
              ))}
            </div>
          )}
        </div>
        {isExhausted && <div className="card__exhausted-overlay">⟳</div>}
      </div>

      {/* Full detail modal */}
      {expanded && (
        <div
          className="card-modal-backdrop"
          onClick={() => setExpanded(false)}
        >
          <div
            className="card-modal"
            style={{ "--domain-color": domainColor } as React.CSSProperties}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="card-modal__header">
              <h2>{card.name}</h2>
              <button
                className="card-modal__close"
                onClick={() => setExpanded(false)}
              >
                ✕
              </button>
            </div>
            <div className="card-modal__meta">
              <span className="card__type">{card.type}</span>
              {card.domains.map((d) => (
                <span
                  key={d}
                  className="card__domain-badge"
                  style={{ background: DOMAIN_COLORS[d] }}
                >
                  {d}
                </span>
              ))}
              <span className="card__cost-label">
                Cost: {card.energyCost} Energy
              </span>
            </div>
            {isUnit && (
              <div className="card-modal__stats">
                <div className="stat-block">
                  <span className="stat-label">Might</span>
                  <span className="stat-value">{card.might}</span>
                </div>
                {card.damageMarked > 0 && (
                  <div className="stat-block stat-block--dmg">
                    <span className="stat-label">Damage</span>
                    <span className="stat-value">{card.damageMarked}</span>
                  </div>
                )}
                {card.buffCounters > 0 && (
                  <div className="stat-block stat-block--buff">
                    <span className="stat-label">Buffs</span>
                    <span className="stat-value">+{card.buffCounters}</span>
                  </div>
                )}
              </div>
            )}
            {card.keywords.length > 0 && (
              <div className="card-modal__keywords">
                {card.keywords.map((kw, i) => (
                  <span key={i} className="card__keyword">
                    {kw.keyword}
                    {kw.value != null ? ` ${kw.value}` : ""}
                  </span>
                ))}
              </div>
            )}
            <p className="card-modal__rules">{card.rulesText}</p>
            {card.flavorText && (
              <p className="card-modal__flavor">"{card.flavorText}"</p>
            )}
            <div className="card-modal__tags">
              {card.tags.map((t) => (
                <span key={t} className="card__tag">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
