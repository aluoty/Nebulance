import type { SpaceStationData } from "../types/station";

type Props = {
  station: SpaceStationData | null;
  visible: boolean;
  isLinking: boolean;
  linkProgress: number;
};

export default function StationPrompt({ station, visible, isLinking, linkProgress }: Props) {
  if (!visible || !station) return null;

  const outer: React.CSSProperties = {
    position: "absolute",
    top: "38%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: 25,
    pointerEvents: "none",
    fontFamily: "monospace",
    textAlign: "center",
    animation: isLinking ? "stationLinkPulse 0.6s ease-in-out infinite" : "stationPromptIn 0.45s ease-out",
  };

  const card: React.CSSProperties = {
    padding: "14px 28px",
    background: "rgba(4, 12, 24, 0.88)",
    border: `1px solid rgba(0, 255, 255, ${isLinking ? 0.35 + linkProgress * 0.65 : 0.5})`,
    borderRadius: "8px",
    boxShadow: `0 0 ${24 + linkProgress * 20}px rgba(0, 255, 255, ${0.15 + linkProgress * 0.25})`,
  };

  const title: React.CSSProperties = {
    color: "#00ffff",
    fontSize: "18px",
    letterSpacing: "4px",
    marginBottom: "8px",
    textShadow: "0 0 12px rgba(0,255,255,0.4)",
  };

  return (
    <>
      <div style={outer}>
        <div style={card}>
          <div style={title}>SPACE STATION</div>
          <div style={{ color: "#aabbcc", fontSize: "12px", marginBottom: "6px" }}>{station.name}</div>
          {isLinking ? (
            <>
              <div style={{ color: "#00ffff", fontSize: "13px", letterSpacing: "3px", marginBottom: "8px" }}>
                LINKING… {Math.round(linkProgress * 100)}%
              </div>
              <div
                style={{
                  height: "4px",
                  background: "rgba(0,255,255,0.15)",
                  borderRadius: "2px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${linkProgress * 100}%`,
                    height: "100%",
                    background: "#00ffff",
                    boxShadow: "0 0 8px #00ffff",
                    transition: "width 0.05s linear",
                  }}
                />
              </div>
            </>
          ) : (
            <div style={{ color: "#88ffcc", fontSize: "13px", letterSpacing: "2px" }}>
              Press <span style={{ color: "#00ffff", fontWeight: "bold" }}>E</span> to dock and resupply
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes stationPromptIn {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes stationLinkPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.03); }
        }
      `}</style>
    </>
  );
}
