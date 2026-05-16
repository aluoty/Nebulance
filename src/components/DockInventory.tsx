import { useEffect, useState } from "react";
import { defaultInventory } from "../data/worldConfig";
import type { ShipId } from "../data/ships";
import type { SpaceStationData } from "../types/station";
import { formatPrice } from "../data/economy";
import ShipSelector from "./ShipSelector";

type InventoryItem = {
  id: string;
  name: string;
  qty: number;
  icon: string;
};

type Tab = "dock" | "inventory" | "ship";

function loadInventory(): InventoryItem[] {
  const saved = localStorage.getItem("nebulance_inventory");
  if (saved) {
    try {
      return JSON.parse(saved) as InventoryItem[];
    } catch {
      /* use default */
    }
  }
  return defaultInventory.map((item) => ({ ...item }));
}

type Props = {
  open: boolean;
  onClose: () => void;
  activeStation?: SpaceStationData | null;
  selectedShipId: ShipId;
  onSelectShip: (id: ShipId) => void;
  ownedShipIds: ShipId[];
  balance: number;
  onPurchaseShip: (id: ShipId) => void;
  onDetach: () => void;
  onRefuelCharge: () => void;
  onDockAttach: (stationId: string) => void;
  refuelCost: number;
  isAttached?: boolean;
  isDetaching?: boolean;
};

export default function DockInventory({
  open,
  onClose,
  activeStation = null,
  selectedShipId,
  onSelectShip,
  ownedShipIds,
  balance,
  onPurchaseShip,
  onDetach,
  onRefuelCharge,
  onDockAttach,
  refuelCost,
  isAttached = false,
  isDetaching = false,
}: Props) {
  const [tab, setTab] = useState<Tab>(activeStation ? "dock" : "inventory");
  const [inventory, setInventory] = useState<InventoryItem[]>(loadInventory);
  const [dockStatus, setDockStatus] = useState<"idle" | "attached" | "detaching">(() => {
    return localStorage.getItem("nebulance_docked") === "true" ? "attached" : "idle";
  });

  useEffect(() => {
    if (isAttached) setDockStatus("attached");
  }, [isAttached]);

  useEffect(() => {
    if (!isDetaching && dockStatus === "detaching") setDockStatus("idle");
  }, [isDetaching, dockStatus]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "e" || e.key === "E" || e.key === "Escape") {
        e.preventDefault();
        if (isAttached && activeStation && !isDetaching) {
          setDockStatus("detaching");
          onDetach();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, onDetach, isAttached, activeStation, isDetaching]);

  useEffect(() => {
    localStorage.setItem("nebulance_inventory", JSON.stringify(inventory));
  }, [inventory]);

  useEffect(() => {
    localStorage.setItem("nebulance_docked", dockStatus === "attached" ? "true" : "false");
  }, [dockStatus]);

  useEffect(() => {
    if (open && activeStation) setTab("dock");
  }, [open, activeStation]);

  useEffect(() => {
    if (!isDetaching && dockStatus === "detaching") {
      setDockStatus("idle");
    }
  }, [isDetaching, dockStatus]);

  if (!open) return null;

  const refuelShip = () => {
    if (balance < refuelCost || !activeStation) return;
    onRefuelCharge();
    localStorage.setItem("nebulance_energy", "100");
    const energyBar = document.getElementById("energy-bar-fill");
    if (energyBar) {
      energyBar.style.width = "100%";
      energyBar.style.backgroundColor = "#00ffff";
    }
    setInventory((prev) => {
      const hasFuel = prev.some((i) => i.id === "fuel-cell");
      if (hasFuel) {
        return prev.map((i) => (i.id === "fuel-cell" ? { ...i, qty: i.qty + 4 } : i));
      }
      return [...prev, { id: "fuel-cell", name: "Fuel Cell", qty: 4, icon: "⛽" }];
    });
    setDockStatus("attached");
    onDockAttach(activeStation.id);
    window.dispatchEvent(new Event("nebulance-refuel"));
  };

  const handleAttach = () => {
    if (dockStatus === "idle") {
      setDockStatus("attached");
      if (activeStation) onDockAttach(activeStation.id);
    } else if (dockStatus === "attached") {
      setDockStatus("detaching");
      onDetach();
    }
  };

  const statusLabel =
    dockStatus === "attached"
      ? "ATTACHED — STATION LINK ACTIVE"
      : dockStatus === "detaching"
        ? "DETACHING..."
        : "IN FLIGHT";

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: "12px 8px",
    background: active ? "rgba(0, 255, 255, 0.2)" : "transparent",
    border: "none",
    borderBottom: active ? "2px solid #00ffff" : "2px solid transparent",
    color: active ? "#00ffff" : "#8899aa",
    cursor: "pointer",
    letterSpacing: "2px",
    fontSize: "13px",
  });

  return (
    <>
      <div
        role="presentation"
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 35,
          background: "rgba(0, 0, 0, 0.55)",
          backdropFilter: "blur(3px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(520px, 92vw)",
          maxHeight: "80vh",
          overflow: "auto",
          zIndex: 40,
          background: "rgba(4, 8, 18, 0.94)",
          border: "2px solid #00ffff",
          borderRadius: "10px",
          boxShadow: "0 0 32px rgba(0, 255, 255, 0.25)",
          fontFamily: "monospace",
          color: "#e8f4ff",
        }}
      >
        <div style={{ display: "flex", borderBottom: "1px solid rgba(0,255,255,0.3)" }}>
          <button type="button" style={tabStyle(tab === "dock")} onClick={() => setTab("dock")}>
            DOCK
          </button>
          {activeStation && (
            <button type="button" style={tabStyle(tab === "ship")} onClick={() => setTab("ship")}>
              SHIP
            </button>
          )}
          <button type="button" style={tabStyle(tab === "inventory")} onClick={() => setTab("inventory")}>
            INVENTORY
          </button>
        </div>

        <div style={{ padding: "20px" }}>
          {tab === "ship" && activeStation ? (
            <>
              <p style={{ margin: "0 0 16px", color: "#aabbcc", fontSize: "13px", lineHeight: 1.5 }}>
                Swap your active hull at <span style={{ color: "#00ffff" }}>{activeStation.name}</span>. Changes apply
                when you detach.
              </p>
              <ShipSelector
                selectedId={selectedShipId}
                onSelect={onSelectShip}
                compact
                hangar
                ownedShipIds={ownedShipIds}
                balance={balance}
                onPurchase={onPurchaseShip}
              />
            </>
          ) : tab === "dock" ? (
            <>
              <h3 style={{ margin: "0 0 12px", color: "#00ffff", letterSpacing: "3px", fontSize: "14px" }}>
                {activeStation ? "SPACE STATION" : "DOCKING BAY"}
              </h3>
              {activeStation ? (
                <>
                  <p style={{ margin: "0 0 8px", color: "#aabbcc", fontSize: "13px", lineHeight: 1.5 }}>
                    Attached to <span style={{ color: "#00ffff" }}>{activeStation.name}</span>. Resupply fuel and
                    manage cargo before detaching.
                  </p>
                  <p style={{ margin: "0 0 16px", color: "#ffcc66", fontSize: "12px", letterSpacing: "2px" }}>
                    BALANCE: {formatPrice(balance)}
                  </p>
                  <div
                    style={{
                      padding: "14px",
                      marginBottom: "12px",
                      background: "rgba(0,255,255,0.06)",
                      border: "1px solid rgba(0,255,255,0.25)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    STATUS:{" "}
                    <span style={{ color: dockStatus === "attached" ? "#66ff99" : "#ffcc66" }}>{statusLabel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={refuelShip}
                    disabled={balance < refuelCost}
                    style={{
                      width: "100%",
                      padding: "14px",
                      marginBottom: "10px",
                      background: balance >= refuelCost ? "rgba(0,255,255,0.15)" : "rgba(40,40,40,0.4)",
                      border: balance >= refuelCost ? "2px solid #00ffff" : "2px solid #445566",
                      color: balance >= refuelCost ? "#00ffff" : "#667788",
                      borderRadius: "6px",
                      cursor: balance >= refuelCost ? "pointer" : "not-allowed",
                      letterSpacing: "3px",
                      fontSize: "14px",
                    }}
                  >
                    REFUEL — {formatPrice(refuelCost)} (+4 FUEL CELLS)
                  </button>
                  <p style={{ margin: "0 0 12px", color: "#667788", fontSize: "11px", textAlign: "center" }}>
                    {balance < refuelCost
                      ? `Insufficient funds — need ${formatPrice(refuelCost)}`
                      : "Earning N$ — coming soon"}
                  </p>
                  <button
                    type="button"
                    onClick={handleAttach}
                    disabled={dockStatus === "detaching" || isDetaching}
                    style={{
                      width: "100%",
                      padding: "12px",
                      background: "rgba(255,100,100,0.1)",
                      border: "1px solid #ff6666",
                      color: "#ff8888",
                      borderRadius: "6px",
                      cursor: dockStatus === "detaching" ? "wait" : "pointer",
                      letterSpacing: "2px",
                      fontSize: "13px",
                    }}
                  >
                    {dockStatus === "attached" ? "DETACH" : dockStatus === "detaching" ? "DETACHING..." : "ATTACH"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ margin: "0 0 16px", color: "#aabbcc", fontSize: "13px", lineHeight: 1.5 }}>
                    Fly near a space station and press E to dock. In-flight cargo access is on the Inventory tab.
                  </p>
                  <div
                    style={{
                      padding: "14px",
                      marginBottom: "16px",
                      background: "rgba(0,255,255,0.06)",
                      border: "1px solid rgba(0,255,255,0.25)",
                      borderRadius: "6px",
                      fontSize: "12px",
                    }}
                  >
                    STATUS: <span style={{ color: "#ffcc66" }}>IN FLIGHT</span>
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <h3 style={{ margin: "0 0 16px", color: "#00ffff", letterSpacing: "3px", fontSize: "14px" }}>CARGO HOLD</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                  gap: "10px",
                }}
              >
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      padding: "12px 8px",
                      textAlign: "center",
                      background: "rgba(0,255,255,0.05)",
                      border: "1px solid rgba(0,255,255,0.2)",
                      borderRadius: "6px",
                    }}
                  >
                    <div style={{ fontSize: "28px", marginBottom: "6px" }}>{item.icon}</div>
                    <div style={{ fontSize: "11px", color: "#ccddee", marginBottom: "4px" }}>{item.name}</div>
                    <div style={{ fontSize: "13px", color: "#00ffff" }}>×{item.qty}</div>
                    <button
                      type="button"
                      onClick={() =>
                        setInventory((prev) =>
                          prev
                            .map((i) => (i.id === item.id ? { ...i, qty: Math.max(0, i.qty - 1) } : i))
                            .filter((i) => i.qty > 0)
                        )
                      }
                      style={{
                        marginTop: "8px",
                        padding: "4px 10px",
                        fontSize: "10px",
                        background: "transparent",
                        border: "1px solid #445566",
                        color: "#8899aa",
                        borderRadius: "4px",
                        cursor: "pointer",
                      }}
                    >
                      DROP 1
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <p style={{ margin: 0, padding: "0 20px 16px", fontSize: "11px", color: "#667788", textAlign: "center" }}>
          {isAttached && activeStation ? "Press E or ESC to detach" : "Press E or ESC to close"}
        </p>
      </div>
    </>
  );
}

