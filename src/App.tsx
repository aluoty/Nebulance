import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import SpaceScene from "./components/SpaceScene";
import DockInventory from "./components/DockInventory";
import StationPrompt from "./components/StationPrompt";
import GuideMenu from "./components/GuideMenu";
import type { StationProximityState } from "./types/station";
import { generateGalaxy } from "./generators/starSystem";
import { generateStations, getHomeStation } from "./generators/stations";
import { stationConfig } from "./data/worldConfig";

const generateRandomSeed = () => Math.floor(100000 + Math.random() * 900000).toString();

const NEW_GAME_FLAG = "nebulance_newGame";

function clearSaveData() {
  localStorage.removeItem("nebulance_shipPos");
  localStorage.removeItem("nebulance_shipRot");
  localStorage.removeItem("nebulance_energy");
  localStorage.removeItem("nebulance_inventory");
  localStorage.removeItem("nebulance_docked");
}

type GameState = "MAIN_MENU" | "SEED_MENU" | "GUIDE" | "PLAYING" | "QUIT_CONFIRM";

export default function App() {
  const hasSave = localStorage.getItem("nebulance_shipPos") !== null;
  const [gameState, setGameState] = useState<GameState>(hasSave ? "PLAYING" : "MAIN_MENU");
  const [worldSeed, setWorldSeed] = useState(() => {
    return localStorage.getItem("nebulance_worldSeed") || generateRandomSeed();
  });
  const [inputWorldSeed, setInputWorldSeed] = useState(worldSeed);
  const [dockOpen, setDockOpen] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [linkProgress, setLinkProgress] = useState(0);
  const linkTimerRef = useRef<number | null>(null);
  const [stationProximity, setStationProximity] = useState<StationProximityState>({
    near: false,
    station: null,
    distance: Infinity,
  });

  const guideHomeStation = useMemo(() => {
    if (gameState !== "GUIDE") return null;
    return getHomeStation(generateStations(worldSeed, generateGalaxy(worldSeed)));
  }, [gameState, worldSeed]);

  useEffect(() => {
    localStorage.setItem("nebulance_worldSeed", worldSeed);
  }, [worldSeed]);

  const startStationLink = useCallback(() => {
    if (linkTimerRef.current !== null) {
      window.clearInterval(linkTimerRef.current);
    }
    setIsLinking(true);
    setLinkProgress(0);
    const start = performance.now();
    const duration = stationConfig.linkDurationMs;

    linkTimerRef.current = window.setInterval(() => {
      const t = Math.min(1, (performance.now() - start) / duration);
      setLinkProgress(t);
      if (t >= 1) {
        if (linkTimerRef.current !== null) {
          window.clearInterval(linkTimerRef.current);
          linkTimerRef.current = null;
        }
        setIsLinking(false);
        setDockOpen(true);
      }
    }, 32);
  }, []);

  useEffect(() => {
    return () => {
      if (linkTimerRef.current !== null) {
        window.clearInterval(linkTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isLinking) {
          if (linkTimerRef.current !== null) {
            window.clearInterval(linkTimerRef.current);
            linkTimerRef.current = null;
          }
          setIsLinking(false);
          setLinkProgress(0);
        } else if (dockOpen) {
          setDockOpen(false);
        } else if (gameState === "PLAYING") {
          setGameState("QUIT_CONFIRM");
        } else if (gameState === "QUIT_CONFIRM") {
          setGameState("PLAYING");
        }
        return;
      }
      if ((e.key === "e" || e.key === "E") && gameState === "PLAYING" && !isLinking) {
        e.preventDefault();
        if (dockOpen) {
          setDockOpen(false);
          return;
        }
        if (stationProximity.near && stationProximity.station) {
          startStationLink();
          return;
        }
        setDockOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameState, dockOpen, isLinking, stationProximity.near, stationProximity.station, startStationLink]);

  const handlePlayClick = () => {
    setInputWorldSeed(worldSeed);
    setGameState("SEED_MENU");
  };

  const handleExitClick = () => {
    document.body.innerHTML =
      "<div style='width: 100vw; height: 100vh; background: black; color: white; display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 2rem; letter-spacing: 4px;'>COMMUNICATIONS SEVERED.</div>";
  };

  const handleStartGame = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSeed = inputWorldSeed.trim() === "" ? generateRandomSeed() : inputWorldSeed;
    clearSaveData();
    setWorldSeed(finalSeed);
    setInputWorldSeed(finalSeed);
    setGameState("GUIDE");
  };

  const handleLaunchFromGuide = () => {
    localStorage.setItem(NEW_GAME_FLAG, "true");
    setGameState("PLAYING");
  };

  const handleQuitToMenu = () => {
    setGameState("MAIN_MENU");
    setDockOpen(false);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", position: "relative", backgroundColor: "#000" }}>
      {gameState === "MAIN_MENU" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            background: "radial-gradient(circle, #1a0b2e 0%, #000000 100%)",
          }}
        >
          <h1
            style={{
              color: "#00ffff",
              fontSize: "5rem",
              fontFamily: "monospace",
              letterSpacing: "8px",
              textShadow: "0 0 20px #00ffff",
              marginBottom: "4rem",
            }}
          >
            NEBULANCE
          </h1>
          <button
            onClick={handlePlayClick}
            style={{
              fontSize: "2rem",
              padding: "16px 64px",
              background: "transparent",
              border: "2px solid #00ffff",
              color: "#00ffff",
              borderRadius: "8px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "4px",
              marginBottom: "24px",
            }}
          >
            Play
          </button>
          <button
            onClick={handleExitClick}
            style={{
              fontSize: "1.5rem",
              padding: "12px 48px",
              background: "transparent",
              border: "2px solid #ff4444",
              color: "#ff4444",
              borderRadius: "8px",
              cursor: "pointer",
              textTransform: "uppercase",
              letterSpacing: "4px",
            }}
          >
            Exit
          </button>
        </div>
      )}

      {gameState === "SEED_MENU" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            background: "radial-gradient(circle, #0b1a2e 0%, #000000 100%)",
          }}
        >
          <h2 style={{ color: "#fff", fontSize: "2rem", fontFamily: "monospace", letterSpacing: "4px", marginBottom: "2rem" }}>
            Enter World Seed
          </h2>
          <form onSubmit={handleStartGame} style={{ display: "flex", flexDirection: "column", gap: "24px", alignItems: "center" }}>
            <input
              type="text"
              value={inputWorldSeed}
              onChange={(e) => setInputWorldSeed(e.target.value)}
              placeholder="e.g. 123456"
              style={{
                fontSize: "1.5rem",
                padding: "16px",
                background: "rgba(0,0,0,0.5)",
                border: "2px solid #00ffff",
                color: "#fff",
                borderRadius: "8px",
                textAlign: "center",
                width: "300px",
              }}
              autoFocus
            />
            <div style={{ display: "flex", gap: "16px" }}>
              <button
                type="button"
                onClick={() => setGameState("MAIN_MENU")}
                style={{
                  fontSize: "1.2rem",
                  padding: "12px 32px",
                  background: "transparent",
                  border: "1px solid #aaa",
                  color: "#aaa",
                  borderRadius: "4px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Back
              </button>
              <button
                type="submit"
                style={{
                  fontSize: "1.2rem",
                  padding: "12px 32px",
                  background: "rgba(0,255,255,0.2)",
                  border: "2px solid #00ffff",
                  color: "#00ffff",
                  borderRadius: "4px",
                  cursor: "pointer",
                  textTransform: "uppercase",
                  letterSpacing: "2px",
                }}
              >
                Start
              </button>
            </div>
          </form>
        </div>
      )}

      {gameState === "GUIDE" && guideHomeStation && (
        <GuideMenu homeStationName={guideHomeStation.name} onLaunch={handleLaunchFromGuide} />
      )}

      {(gameState === "PLAYING" || gameState === "QUIT_CONFIRM") && (
        <>
          <SpaceScene
            worldSeed={worldSeed}
            dockOpen={dockOpen}
            onStationProximityChange={setStationProximity}
            linkTarget={stationProximity.near ? stationProximity.station : null}
            isLinking={isLinking}
            linkProgress={linkProgress}
          />
          <StationPrompt
            visible={(stationProximity.near || isLinking) && !dockOpen}
            station={stationProximity.station}
            isLinking={isLinking}
            linkProgress={linkProgress}
          />
          <DockInventory
            open={dockOpen}
            onClose={() => setDockOpen(false)}
            activeStation={stationProximity.near ? stationProximity.station : null}
          />
          <div
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              zIndex: 10,
              color: "rgba(255,255,255,0.5)",
              fontFamily: "monospace",
              pointerEvents: "none",
            }}
          >
            <div>Press ESC to pause/quit</div>
            <div style={{ marginTop: 6, fontSize: "12px" }}>E — Dock / Inventory · Z/C — Roll</div>
          </div>
          <div
            style={{
              position: "absolute",
              bottom: 40,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 10,
              width: "300px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              pointerEvents: "none",
            }}
          >
            <div style={{ color: "#00ffff", fontFamily: "monospace", fontSize: "14px", letterSpacing: "2px" }}>
              BOOST ENERGY
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "rgba(0,0,0,0.5)",
                border: "1px solid rgba(0,255,255,0.3)",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                id="energy-bar-fill"
                style={{
                  width: "100%",
                  height: "100%",
                  backgroundColor: "#00ffff",
                  boxShadow: "0 0 10px #00ffff",
                  transition: "width 0.1s linear, background-color 0.2s",
                }}
              />
            </div>
          </div>

          {gameState === "QUIT_CONFIRM" && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 50,
                background: "rgba(0,0,0,0.85)",
                backdropFilter: "blur(4px)",
              }}
            >
              <h2
                style={{
                  color: "#fff",
                  fontSize: "2rem",
                  fontFamily: "monospace",
                  letterSpacing: "4px",
                  marginBottom: "1rem",
                  textAlign: "center",
                }}
              >
                Return to Main Menu?
              </h2>
              <p style={{ color: "#aaa", fontFamily: "monospace", marginBottom: "3rem" }}>
                Your progress has been automatically saved.
              </p>
              <div style={{ display: "flex", gap: "24px" }}>
                <button
                  onClick={() => setGameState("PLAYING")}
                  style={{
                    fontSize: "1.2rem",
                    padding: "12px 32px",
                    background: "transparent",
                    border: "1px solid #aaa",
                    color: "#aaa",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  Cancel (ESC)
                </button>
                <button
                  onClick={handleQuitToMenu}
                  style={{
                    fontSize: "1.2rem",
                    padding: "12px 32px",
                    background: "rgba(255,68,68,0.2)",
                    border: "2px solid #ff4444",
                    color: "#ff4444",
                    borderRadius: "4px",
                    cursor: "pointer",
                    textTransform: "uppercase",
                    letterSpacing: "2px",
                  }}
                >
                  Quit
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
