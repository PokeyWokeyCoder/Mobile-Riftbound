import React, { useRef, useEffect } from "react";
import "./GameLog.css";

interface GameLogProps {
  entries: string[];
}

export const GameLog: React.FC<GameLogProps> = ({ entries }) => {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [entries.length]);

  return (
    <div className="game-log">
      <div className="game-log__title">Game Log</div>
      <div className="game-log__entries" ref={listRef}>
        {entries.slice(0, 30).map((entry, i) => (
          <div key={i} className={`game-log__entry${i === 0 ? " game-log__entry--latest" : ""}`}>
            {entry}
          </div>
        ))}
      </div>
    </div>
  );
};
