import React from "react";
import type { Phase } from "../../engine/types";
import { PHASE_LABELS } from "../../engine/types";
import "./PhaseBar.css";

const PHASES: Phase[] = [
  "awaken",
  "beginning",
  "channel",
  "draw",
  "action",
  "endOfTurn",
];

interface PhaseBarProps {
  currentPhase: Phase;
  turnPlayer: "player" | "ai";
  onAdvancePhase?: () => void;
}

export const PhaseBar: React.FC<PhaseBarProps> = ({
  currentPhase,
  turnPlayer,
  onAdvancePhase,
}) => {
  const currentIdx = PHASES.indexOf(currentPhase);
  const isPlayerTurn = turnPlayer === "player";

  return (
    <div className={`phase-bar ${isPlayerTurn ? "phase-bar--player" : "phase-bar--ai"}`}>
      <div className="phase-bar__turn-indicator">
        {isPlayerTurn ? "Your Turn" : "AI Turn"}
      </div>
      <div className="phase-bar__phases">
        {PHASES.map((phase, idx) => (
          <div
            key={phase}
            className={[
              "phase-step",
              idx === currentIdx ? "phase-step--active" : "",
              idx < currentIdx ? "phase-step--done" : "",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <span className="phase-step__label">
              {PHASE_LABELS[phase]}
            </span>
          </div>
        ))}
      </div>
      {isPlayerTurn && onAdvancePhase && (
        <button className="phase-bar__advance-btn" onClick={onAdvancePhase}>
          Next Phase →
        </button>
      )}
    </div>
  );
};
