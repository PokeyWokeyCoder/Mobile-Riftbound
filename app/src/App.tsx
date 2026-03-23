import { useState } from "react";
import { HomeScreen } from "./ui/screens/HomeScreen";
import { GameScreen } from "./ui/screens/GameScreen";
import { createInitialGameState } from "./engine/mockEngine";
import type { GameState } from "./engine/types";

type AppScreen = "home" | "game";

function App() {
  const [screen, setScreen] = useState<AppScreen>("home");
  const [gameState, setGameState] = useState<GameState | null>(null);

  function startGame(_difficulty: "easy" | "medium" | "hard") {
    setGameState(createInitialGameState());
    setScreen("game");
  }

  function exitGame() {
    setGameState(null);
    setScreen("home");
  }

  if (screen === "game" && gameState) {
    return <GameScreen initialState={gameState} onExitGame={exitGame} />;
  }

  return <HomeScreen onStartGame={startGame} />;
}

export default App;
