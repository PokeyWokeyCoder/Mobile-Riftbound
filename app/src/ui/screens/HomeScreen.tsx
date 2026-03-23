import React from "react";
import { DOMAIN_COLORS } from "../../engine/types";
import "./HomeScreen.css";

interface HomeScreenProps {
  onStartGame: (difficulty: "easy" | "medium" | "hard") => void;
}

const DIFFICULTY_DESC = {
  easy: "Random moves. Good for learning.",
  medium: "Greedy strategy. A fair challenge.",
  hard: "Multi-turn planning. Merciless.",
};

export const HomeScreen: React.FC<HomeScreenProps> = ({ onStartGame }) => {
  const domains = Object.entries(DOMAIN_COLORS) as [
    keyof typeof DOMAIN_COLORS,
    string
  ][];

  return (
    <div className="home-screen">
      {/* Background domain orbs */}
      <div className="home-screen__bg" aria-hidden>
        {domains.map(([domain, color]) => (
          <div
            key={domain}
            className="home-screen__orb"
            style={{ background: color }}
          />
        ))}
      </div>

      <div className="home-screen__content">
        {/* Logo */}
        <div className="home-screen__logo">
          <div className="home-screen__logo-title">RIFTBOUND</div>
          <div className="home-screen__logo-sub">Mobile</div>
        </div>

        {/* Domain indicators */}
        <div className="home-screen__domains">
          {domains.map(([domain, color]) => (
            <div
              key={domain}
              className="domain-pill"
              style={{ borderColor: color, color }}
            >
              {domain}
            </div>
          ))}
        </div>

        {/* Start game section */}
        <div className="home-screen__card">
          <h2 className="home-screen__section-title">Choose Difficulty</h2>
          <p className="home-screen__description">
            Play a 1v1 Fury vs Calm duel against the AI. First to 8 points wins.
          </p>
          <div className="home-screen__difficulties">
            {(["easy", "medium", "hard"] as const).map((diff) => (
              <button
                key={diff}
                className={`difficulty-btn difficulty-btn--${diff}`}
                onClick={() => onStartGame(diff)}
              >
                <span className="difficulty-btn__label">
                  {diff.charAt(0).toUpperCase() + diff.slice(1)}
                </span>
                <span className="difficulty-btn__desc">
                  {DIFFICULTY_DESC[diff]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Rules summary */}
        <div className="home-screen__card home-screen__card--rules">
          <h3 className="home-screen__section-title">Quick Rules</h3>
          <ul className="rules-list">
            <li>Score points by controlling Battlefields</li>
            <li>Channel Runes to gain Energy &amp; Power</li>
            <li>Play Units, Gear, and Spells from your hand</li>
            <li>Combat occurs when units from both sides share a Battlefield</li>
            <li>First player to 8 points wins</li>
          </ul>
        </div>

        <div className="home-screen__footer">
          Core Rules 2025-06-02 · 1v1 Duel Mode · Best of 1
        </div>
      </div>
    </div>
  );
};
