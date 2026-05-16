import type { SpaceStationData } from "../types/station";

type Props = {
  station: SpaceStationData | null;
  visible: boolean;
  detachProgress: number;
};

export default function StationDetachPrompt({ station, visible, detachProgress }: Props) {
  if (!visible || !station) return null;

  return (
    <>
      <div
        style={{
          position: "absolute",
          top: "38%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          zIndex: 25,
          pointerEvents: "none",
          fontFamily: "monospace",
          textAlign: "center",
          animation: "detachPulse 0.7s ease-in-out infinite",
        }}
      >
        <div
          style={{
            padding: "14px 28px",
            background: "rgba(4, 12, 24, 0.88)",
            border: `1px solid rgba(255, 136, 102, ${0.35 + (1 - detachProgress) * 0.5})`,
            borderRadius: "8px",
            boxShadow: `0 0 ${28 + (1 - detachProgress) * 24}px rgba(255, 100, 80, ${0.2 + (1 - detachProgress) * 0.25})`,
          }}
        >
          <div
            style={{
              color: "#ff8866",
              fontSize: "18px",
              letterSpacing: "4px",
              marginBottom: "8px",
              textShadow: "0 0 12px rgba(255,120,80,0.45)",
            }}
          >
            DETACHING
          </div>
          <div style={{ color: "#aabbcc", fontSize: "12px", marginBottom: "6px" }}>{station.name}</div>
          <div style={{ color: "#ffaa88", fontSize: "13px", letterSpacing: "3px", marginBottom: "8px" }}>
            DE-ATTACHING… {Math.round(detachProgress * 100)}%
          </div>
          <div
            style={{
              height: "4px",
              background: "rgba(255,120,80,0.15)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${detachProgress * 100}%`,
                height: "100%",
                background: "linear-gradient(90deg, #ff6644, #ffaa66)",
                boxShadow: "0 0 8px #ff8866",
                transition: "width 0.05s linear",
              }}
            />
          </div>
        </div>
      </div>
      <style>{`
        @keyframes detachPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.02); }
        }
      `}</style>
    </>
  );
}
