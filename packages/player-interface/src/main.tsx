import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameExperience } from "./GameExperience";
import { useDemoGame } from "./demo/demoState";
import "./styles.css";

function Demo() {
  const game = useDemoGame();
  return <GameExperience {...game} />;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Demo />
  </StrictMode>,
);
