import { useRef } from "react";
import SlimeOrganism from "./components/SlimeOrganism";
import { useSimulatedData } from "./hooks/useSimulatedData";
import { useRealEvents } from "./hooks/useRealEvents";
import { useState } from "react";
import type { ThreatEvent, AITier, ThreatClass, TarpitNodeState, UpstreamStatus, DNSPoint, Layer22State, ForensicStreamStatus } from "./hooks/useSimulatedData";

// ─────────────────────────────────────────────────────────────────────────────
// Color helpers
// ─────────────────────────────────────────────────────────────────────────────

function eventColor(type: ThreatEvent["type"]): string {
  switch (type) {
    case "canary.fired":              return "#ff6644";
    case "campaign.matched":          return "#ff4488";
    case "honeypot.recursive.descent": return "#00d060";
    case "honeypot.triggered":        return "#00f07a";
    case "session.shadowed":          return "#88ddaa";
    case "threat.classified":         return "#ffcc44";
    case "behavioral.anomaly":        return "#ffaa00";
    case "provider.failover":         return "#aaaaff";
    case "merkle.root.updated":       return "#44aaff";
    case "tarpit.connection.absorbed": return "#ffaa33";
    case "flood.detected":            return "#ff8800";
    case "upstream.escalated":        return "#ff6600";
    case "dependency.mismatch.detected": return "#ff3300";
    case "secret.redacted":              return "#cc44ff";
    case "authn.anomaly.detected":       return "#ff6600";
    case "dns.record.unrecognized":      return "#ffdd00";
    case "dns.takeover.suspected":       return "#ff2200";
    case "client.integrity.low":         return "#ffaa33";
    case "exfiltration.velocity.exceeded": return "#ff4488";
    case "ai.injection.attempt":         return "#aa44ff";
    case "forensic.stream.flushed":      return "#00ccff";
    case "forensic.stream.error":        return "#ff3300";
    case "incident.package.sealed":      return "#00aaff";
    case "compliance.report.generated":  return "#44aaff";
    case "legal.hold.activated":         return "#ff4488";
    case "legal.hold.released":          return "#44ff88";
    default:                          return "#00f07a";
  }
}

function threatClassLabel(cls: ThreatClass | undefined): string {
  switch (cls) {
    case "nation-state":          return "NATION-STATE";
    case "sophisticated-actor":   return "SOPHISTICATED";
    case "automated-scanner":     return "AUTO-SCANNER";
    case "competitor-scraper":    return "COMPETITOR";
    case "script-kiddie":         return "SCRIPT-KIDDIE";
    default:                      return "UNKNOWN";
  }
}

function threatClassColor(cls: ThreatClass | undefined): string {
  switch (cls) {
    case "nation-state":          return "#cc0033";
    case "sophisticated-actor":   return "#f04a00";
    case "automated-scanner":     return "#f0a500";
    case "competitor-scraper":    return "#ddcc00";
    case "script-kiddie":         return "#00f07a";
    default:                      return "#666";
  }
}

function tierColor(tier: AITier): string {
  switch (tier) {
    case "openai":     return "#00f07a";
    case "anthropic":  return "#4488ff";
    case "ollama":     return "#ffaa00";
    case "static":     return "#ffffff";
  }
}

function tierLabel(tier: AITier): string {
  switch (tier) {
    case "openai":     return "GPT-4o";
    case "anthropic":  return "Claude";
    case "ollama":     return "Ollama";
    case "static":     return "Static";
  }
}

function formatAge(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mod 7 Cycle Ring
// ─────────────────────────────────────────────────────────────────────────────

function Mod7Ring({ label, value, color = "#00f07a" }: { label: string; value: number; color?: string }) {
  const r = 16;
  const circumference = 2 * Math.PI * r;
  const filled = (value / 7) * circumference;

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="40" height="40" viewBox="0 0 40 40">
        <circle cx="20" cy="20" r={r} fill="none" stroke="rgba(0,240,122,0.08)" strokeWidth="2.5" />
        <circle
          cx="20" cy="20" r={r}
          fill="none"
          stroke={color}
          strokeWidth="2.5"
          strokeDasharray={`${filled} ${circumference - filled}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 3px ${color}66)` }}
        />
        <text x="20" y="25" textAnchor="middle" fill={color} fontSize="11" fontFamily="JetBrains Mono">
          {value}
        </text>
      </svg>
      <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "9px", fontFamily: "JetBrains Mono", letterSpacing: "0.05em" }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer status blob
// ─────────────────────────────────────────────────────────────────────────────

function LayerBlob({ id, name, enabled, hitCount, isProxy, isTarpit }: { id: number; name: string; enabled: boolean; hitCount: number; isProxy?: boolean; isTarpit?: boolean }) {
  const color = isTarpit ? "#ffaa33" : enabled ? "#00f07a" : "#1a1a1a";
  const textColor = isTarpit ? "rgba(255,170,50,0.8)" : enabled ? "#00f07a" : "#333";
  const glow = isTarpit ? "0 0 6px rgba(255,170,50,0.4)" : enabled ? "0 0 6px rgba(0,240,122,0.3)" : "none";

  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded"
      style={{
        border: `1px solid ${isTarpit ? "rgba(255,170,50,0.2)" : enabled ? "rgba(0,240,122,0.2)" : "rgba(255,255,255,0.04)"}`,
        background: isTarpit ? "rgba(30,12,0,0.6)" : isProxy ? "rgba(0,240,122,0.05)" : "transparent",
        boxShadow: isTarpit ? "0 0 0 1px rgba(255,170,50,0.1)" : isProxy ? "0 0 0 1px rgba(0,240,122,0.15)" : "none",
      }}
    >
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: "6px", height: "6px",
          background: color,
          boxShadow: glow,
          animation: (isTarpit || (enabled && hitCount % 3 === 0)) ? "pulse 2s infinite" : "none",
        }}
      />
      <span style={{ color: textColor, fontSize: "10px", fontFamily: "JetBrains Mono", flex: 1 }}>
        {String(id).padStart(2, "0")} {name}
      </span>
      <span style={{ color: isTarpit ? "rgba(255,170,50,0.3)" : "rgba(0,240,122,0.3)", fontSize: "9px", fontFamily: "JetBrains Mono" }}>
        {hitCount.toLocaleString()}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Shadow session bubble
// ─────────────────────────────────────────────────────────────────────────────

function ShadowBubble({ ip, threatClass, depth, requestCount, startedAt }: {
  ip: string; threatClass: ThreatClass; depth: number; requestCount: number; startedAt: number;
}) {
  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1"
      style={{
        border: "1px solid rgba(0,240,122,0.08)",
        background: "rgba(0, 10, 5, 0.8)",
        animation: "breathe 6s ease-in-out infinite",
      }}
    >
      <div className="flex items-center justify-between">
        <span style={{ color: threatClassColor(threatClass), fontSize: "9px", letterSpacing: "0.1em", fontFamily: "JetBrains Mono" }}>
          {threatClassLabel(threatClass)}
        </span>
        <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "9px", fontFamily: "JetBrains Mono" }}>
          {formatAge(Date.now() - startedAt)}
        </span>
      </div>
      <span style={{ color: "rgba(0,240,122,0.6)", fontSize: "10px", fontFamily: "JetBrains Mono" }}>{ip}</span>
      <div className="flex gap-3">
        <span style={{ color: "rgba(0,240,122,0.4)", fontSize: "9px", fontFamily: "JetBrains Mono" }}>depth {depth}</span>
        <span style={{ color: "rgba(0,240,122,0.4)", fontSize: "9px", fontFamily: "JetBrains Mono" }}>{requestCount} req</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 14 components
// ─────────────────────────────────────────────────────────────────────────────

function TarpitNode({ node }: { node: TarpitNodeState }) {
  const ageSec = Math.floor((Date.now() - node.connectedAt) / 1_000);
  return (
    <div
      className="flex items-center gap-2 px-2 py-1 rounded"
      style={{
        border: "1px solid rgba(255,160,50,0.18)",
        background: "rgba(30,15,0,0.7)",
      }}
    >
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: "6px",
          height: "6px",
          background: "#ffaa33",
          boxShadow: "0 0 6px rgba(255,170,50,0.6)",
          animation: "pulse 3s ease-in-out infinite",
        }}
      />
      <span style={{ color: "rgba(255,170,50,0.7)", fontSize: "9px", fontFamily: "JetBrains Mono", flex: 1 }}>
        {node.ip}
      </span>
      <span style={{ color: "rgba(255,170,50,0.4)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>
        {ageSec}s · {node.bytesDelivered}B · m{node.mod7Seed}
      </span>
    </div>
  );
}

function AbsorptionMeter({ pct, floodActive }: { pct: number; floodActive: boolean }) {
  const barColor = pct > 85 ? "#ff4400" : pct > 50 ? "#ff8800" : "#ffaa33";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ color: "rgba(255,170,50,0.5)", fontSize: "8px", letterSpacing: "0.12em", fontFamily: "JetBrains Mono" }}>
          ABSORPTION CAPACITY
        </span>
        <span style={{ color: barColor, fontSize: "9px", fontFamily: "JetBrains Mono" }}>
          {pct.toFixed(0)}%
        </span>
      </div>
      <div
        className="rounded-full overflow-hidden"
        style={{ height: "4px", background: "rgba(255,170,50,0.08)", position: "relative" }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: barColor,
            boxShadow: floodActive ? `0 0 6px ${barColor}` : "none",
            transition: "width 0.8s ease, background 0.4s ease",
          }}
        />
        {/* Upstream escalation watermark at 85% */}
        <div
          style={{
            position: "absolute",
            left: "85%",
            top: 0,
            height: "100%",
            width: "1px",
            background: "rgba(255,60,0,0.5)",
          }}
        />
      </div>
      <span style={{ color: "rgba(255,80,0,0.4)", fontSize: "7px", fontFamily: "JetBrains Mono", textAlign: "right" }}>
        ↑ UPSTREAM THRESHOLD
      </span>
    </div>
  );
}

function UpstreamStatusBadge({ status, provider }: { status: UpstreamStatus; provider: string | null }) {
  const color = status === "active" ? "#ff4400" : status === "standby" ? "#ffaa33" : "#333";
  const label = status === "active" ? "ACTIVE" : status === "standby" ? "STANDBY" : "NOT CONFIGURED";
  const providerLabel = provider ? provider.toUpperCase() : "—";
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: "5px", height: "5px",
          background: color,
          boxShadow: status === "active" ? `0 0 6px ${color}` : "none",
          animation: status === "active" ? "pulse 1s infinite" : "none",
        }}
      />
      <span style={{ color, fontSize: "9px", fontFamily: "JetBrains Mono" }}>
        {providerLabel}
      </span>
      <span style={{ color: "rgba(255,170,50,0.3)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 15 — Dependency integrity root indicator
// ─────────────────────────────────────────────────────────────────────────────

function DependencyRootIndicator({ status, packageCount, lastVerifiedAt }: {
  status: "clean" | "unverified" | "compromised";
  packageCount: number;
  lastVerifiedAt: number;
}) {
  const color = status === "clean" ? "#00f07a" : status === "unverified" ? "#ffaa33" : "#ff2200";
  const label = status === "clean" ? "CLEAN" : status === "unverified" ? "UNVERIFIED" : "COMPROMISED";
  return (
    <div className="flex items-center gap-2">
      <div className="rounded-full flex-shrink-0" style={{ width: "6px", height: "6px", background: color, boxShadow: `0 0 6px ${color}66`, animation: status !== "clean" ? "pulse 1.5s infinite" : "none" }} />
      <span style={{ color, fontSize: "9px", fontFamily: "JetBrains Mono" }}>{label}</span>
      <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>{packageCount} pkgs</span>
      <span style={{ color: "rgba(0,240,122,0.2)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>{formatAge(Date.now() - lastVerifiedAt)}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 18 — DNS constellation
// ─────────────────────────────────────────────────────────────────────────────

function DNSConstellation({ points }: { points: DNSPoint[] }) {
  const cx = 50;
  const cy = 50;
  return (
    <svg viewBox="0 0 100 100" style={{ width: "100%", height: "100%", position: "absolute", inset: 0, pointerEvents: "none" }}>
      {points.map((p) => {
        const rad = (p.angleDeg * Math.PI) / 180;
        const r = p.distancePct * 0.45;
        const x = cx + r * Math.cos(rad);
        const y = cy + r * Math.sin(rad);
        const color = p.status === "verified" ? "#00f07a" : p.status === "unrecognized" ? "#ffaa33" : "#ff2200";
        return (
          <g key={p.id}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke={color} strokeWidth="0.2" strokeOpacity="0.15" />
            <circle cx={x} cy={y} r={p.status === "flagged" ? 1.5 : 1} fill={color} opacity={p.status === "verified" ? 0.4 : 0.9}>
              {p.status !== "verified" && (
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur={p.status === "flagged" ? "0.8s" : "2s"} repeatCount="indefinite" />
              )}
            </circle>
          </g>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 19 — Client integrity heat legend
// ─────────────────────────────────────────────────────────────────────────────

function ClientIntegrityLegend({ highCount, mediumCount, lowCount, routedToHoneypot }: {
  highCount: number; mediumCount: number; lowCount: number; routedToHoneypot: number;
}) {
  const total = highCount + mediumCount + lowCount || 1;
  return (
    <div className="flex flex-col gap-1">
      {[
        { label: "HIGH", count: highCount, color: "rgba(0,240,122,0.0)", textColor: "rgba(0,240,122,0.3)" },
        { label: "MEDIUM", count: mediumCount, color: "rgba(255,170,50,0.15)", textColor: "rgba(255,170,50,0.6)" },
        { label: "LOW →HONEYPOT", count: lowCount, color: "rgba(255,100,0,0.2)", textColor: "rgba(255,100,0,0.8)" },
      ].map(({ label, count, color, textColor }) => (
        <div key={label} className="flex items-center gap-2">
          <div style={{ width: `${(count / total) * 80}px`, height: "3px", background: textColor, borderRadius: "2px", minWidth: "4px" }} />
          <span style={{ color: textColor, fontSize: "8px", fontFamily: "JetBrains Mono" }}>{label}</span>
          <span style={{ color: "rgba(255,255,255,0.2)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>{count.toLocaleString()}</span>
          <span style={{ color }}>{""}</span>
        </div>
      ))}
      <span style={{ color: "rgba(255,170,50,0.3)", fontSize: "7px", fontFamily: "JetBrains Mono" }}>{routedToHoneypot.toLocaleString()} routed to honeypot</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 20 — Exfiltration tide gauge
// ─────────────────────────────────────────────────────────────────────────────

function ExfiltrationTideGauge({ tideLevel, totalExceeded }: { tideLevel: number; totalExceeded: number }) {
  const color = tideLevel > 70 ? "#ff2200" : tideLevel > 40 ? "#ff6600" : tideLevel > 15 ? "#ffaa33" : "rgba(255,170,50,0.3)";
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ color: "rgba(255,170,50,0.4)", fontSize: "8px", letterSpacing: "0.1em", fontFamily: "JetBrains Mono" }}>EXFIL VELOCITY</span>
        <span style={{ color, fontSize: "9px", fontFamily: "JetBrains Mono" }}>{tideLevel.toFixed(1)}%</span>
      </div>
      <div style={{ height: "24px", background: "rgba(255,170,50,0.05)", borderRadius: "2px", position: "relative", overflow: "hidden", border: "1px solid rgba(255,170,50,0.08)" }}>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: `${tideLevel}%`,
          background: `linear-gradient(to top, ${color}33, ${color}11)`,
          transition: "height 3s ease",
          borderTop: `1px solid ${color}66`,
        }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ color, fontSize: "7px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>
            {totalExceeded > 0 ? `${totalExceeded} THRESHOLD CROSSED` : "NOMINAL"}
          </span>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 21 — AI injection attempt feed item
// ─────────────────────────────────────────────────────────────────────────────

function InjectionAttemptBadge({ pattern, timestamp }: { pattern: string; timestamp: number }) {
  return (
    <div className="flex items-center justify-between" style={{ borderLeft: "2px solid rgba(170,68,255,0.6)", paddingLeft: "6px" }}>
      <span style={{ color: "rgba(170,68,255,0.9)", fontSize: "8px", fontFamily: "JetBrains Mono", flex: 1 }}>
        {pattern.toUpperCase()}
      </span>
      <span style={{ color: "rgba(170,68,255,0.3)", fontSize: "7px", fontFamily: "JetBrains Mono" }}>
        {formatAge(Date.now() - timestamp)} · SANITIZED
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Layer 22 — Forensic Export components
// ─────────────────────────────────────────────────────────────────────────────

function ForensicStreamPulse({ status, exportedLeafCount }: { status: ForensicStreamStatus; exportedLeafCount: number }) {
  const color = status === "streaming" ? "#00ccff" : status === "buffered" ? "#ffaa33" : "#ff3300";
  const label = status === "streaming" ? "STREAMING" : status === "buffered" ? "BUFFERED" : "UNREACHABLE";
  return (
    <div className="flex items-center gap-2">
      <div
        className="rounded-full flex-shrink-0"
        style={{
          width: "6px", height: "6px",
          background: color,
          boxShadow: `0 0 6px ${color}99`,
          animation: status === "streaming" ? "pulse 3s ease-in-out infinite" : status === "unreachable" ? "pulse 0.8s infinite" : "none",
        }}
      />
      <span style={{ color, fontSize: "9px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>
        {label}
      </span>
      <span style={{ color: `${color}55`, fontSize: "8px", fontFamily: "JetBrains Mono" }}>
        {exportedLeafCount.toLocaleString()} leaves
      </span>
    </div>
  );
}

function LegalHoldBadge({ active, since, reason, onToggle }: {
  active: boolean;
  since: number | null;
  reason: string | null;
  onToggle: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  const handleClick = () => {
    if (active) {
      setConfirming(true);
    } else {
      setConfirming(true);
    }
  };

  const handleConfirm = () => {
    onToggle();
    setConfirming(false);
  };

  const durationStr = since ? formatAge(Date.now() - since) : null;

  return (
    <div
      className="flex flex-col gap-1 rounded px-3 py-2"
      style={{
        border: active
          ? "1px solid rgba(255,68,136,0.4)"
          : "1px solid rgba(255,255,255,0.06)",
        background: active ? "rgba(40,0,15,0.8)" : "transparent",
        transition: "all 0.4s ease",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="rounded-full flex-shrink-0"
            style={{
              width: "6px", height: "6px",
              background: active ? "#ff4488" : "rgba(255,255,255,0.1)",
              boxShadow: active ? "0 0 6px rgba(255,68,136,0.8)" : "none",
              animation: active ? "pulse 1.2s ease-in-out infinite" : "none",
            }}
          />
          <span style={{
            color: active ? "#ff4488" : "rgba(255,255,255,0.25)",
            fontSize: "9px",
            fontFamily: "JetBrains Mono",
            letterSpacing: "0.12em",
          }}>
            LEGAL HOLD {active ? "ACTIVE" : "INACTIVE"}
          </span>
        </div>
        {!confirming ? (
          <button
            onClick={handleClick}
            style={{
              background: "none",
              border: `1px solid ${active ? "rgba(255,68,136,0.3)" : "rgba(255,255,255,0.1)"}`,
              color: active ? "rgba(255,68,136,0.7)" : "rgba(255,255,255,0.2)",
              fontSize: "8px",
              fontFamily: "JetBrains Mono",
              padding: "1px 6px",
              borderRadius: "2px",
              cursor: "pointer",
              letterSpacing: "0.05em",
            }}
          >
            {active ? "RELEASE" : "ACTIVATE"}
          </button>
        ) : (
          <div className="flex gap-1">
            <button
              onClick={handleConfirm}
              style={{
                background: "none",
                border: "1px solid rgba(255,68,136,0.5)",
                color: "#ff4488",
                fontSize: "7px",
                fontFamily: "JetBrains Mono",
                padding: "1px 5px",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              CONFIRM
            </button>
            <button
              onClick={() => setConfirming(false)}
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.25)",
                fontSize: "7px",
                fontFamily: "JetBrains Mono",
                padding: "1px 5px",
                borderRadius: "2px",
                cursor: "pointer",
              }}
            >
              CANCEL
            </button>
          </div>
        )}
      </div>
      {active && durationStr && (
        <div className="flex flex-col gap-0.5">
          <span style={{ color: "rgba(255,68,136,0.5)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>
            SINCE {durationStr} · {reason ?? "unspecified reason"}
          </span>
          <span style={{ color: "rgba(255,68,136,0.3)", fontSize: "7px", fontFamily: "JetBrains Mono" }}>
            Frozen Merkle state sealed. No automated rotation until released.
          </span>
        </div>
      )}
    </div>
  );
}

function ComplianceReportPanel({ lastAt, nextAt, incidentCount }: {
  lastAt: number | null;
  nextAt: number | null;
  incidentCount: number;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span style={{ color: "rgba(0,170,255,0.5)", fontSize: "8px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>
          FORENSIC PACKAGES
        </span>
        <span style={{ color: "#00aaff", fontSize: "10px", fontFamily: "JetBrains Mono" }}>
          {incidentCount}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ color: "rgba(0,170,255,0.35)", fontSize: "7px", fontFamily: "JetBrains Mono" }}>LAST REPORT</span>
        <span style={{ color: "rgba(0,170,255,0.6)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>
          {lastAt ? formatAge(Date.now() - lastAt) : "—"}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span style={{ color: "rgba(0,170,255,0.35)", fontSize: "7px", fontFamily: "JetBrains Mono" }}>NEXT REPORT</span>
        <span style={{ color: "rgba(0,170,255,0.6)", fontSize: "8px", fontFamily: "JetBrains Mono" }}>
          {nextAt ? `in ${Math.floor((nextAt - Date.now()) / 86_400_000)}d` : "—"}
        </span>
      </div>
    </div>
  );
}

function ChainOfCustodyVerifierWidget({ merkleRoot }: { merkleRoot: string }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<{ valid: boolean; reason: string } | null>(null);

  const handleVerify = () => {
    if (!input.trim()) return;
    // Simulated verification: check if the pasted value matches the current root
    // or is an 8+ character hex string (simulating a leaf hash lookup)
    const trimmed = input.trim();
    const looksLikeHash = /^[0-9a-f]{8,}$/i.test(trimmed);
    const isCurrentRoot = trimmed === merkleRoot;
    const valid = isCurrentRoot || (looksLikeHash && Math.random() > 0.3);
    setResult({
      valid,
      reason: isCurrentRoot
        ? "Matches current live Merkle root"
        : valid
          ? "Leaf hash found in forensic registry"
          : "Hash not found in current Merkle tree",
    });
  };

  return (
    <div className="flex flex-col gap-1">
      <span style={{ color: "rgba(0,170,255,0.4)", fontSize: "8px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>
        CHAIN OF CUSTODY VERIFY
      </span>
      <div className="flex gap-1">
        <input
          type="text"
          value={input}
          onChange={(e) => { setInput(e.target.value); setResult(null); }}
          placeholder="paste leaf hash or package hash"
          style={{
            background: "rgba(0,170,255,0.04)",
            border: "1px solid rgba(0,170,255,0.15)",
            color: "rgba(0,170,255,0.8)",
            fontSize: "8px",
            fontFamily: "JetBrains Mono",
            padding: "3px 6px",
            borderRadius: "2px",
            flex: 1,
            outline: "none",
          }}
          onKeyDown={(e) => { if (e.key === "Enter") handleVerify(); }}
        />
        <button
          onClick={handleVerify}
          style={{
            background: "none",
            border: "1px solid rgba(0,170,255,0.2)",
            color: "rgba(0,170,255,0.6)",
            fontSize: "7px",
            fontFamily: "JetBrains Mono",
            padding: "2px 6px",
            borderRadius: "2px",
            cursor: "pointer",
          }}
        >
          VERIFY
        </button>
      </div>
      {result && (
        <span style={{
          color: result.valid ? "#00ccff" : "#ff4400",
          fontSize: "8px",
          fontFamily: "JetBrains Mono",
          borderLeft: `2px solid ${result.valid ? "#00ccff44" : "#ff440044"}`,
          paddingLeft: "5px",
        }}>
          {result.valid ? "✓ " : "✗ "}{result.reason}
        </span>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const simData = useSimulatedData();
  const { events: realEvents, connected: proxyConnected } = useRealEvents();

  // When the proxy is live, overlay real events on top of the simulated state.
  // The slime organism, layer stats, and all other panels still run on simulation
  // (they require a full state machine). The event feed and threat panel show
  // real events when the proxy is connected.
  const data = {
    ...simData,
    events: proxyConnected && realEvents.length > 0
      ? [...realEvents, ...simData.events].slice(0, 50)
      : simData.events,
  };

  const feedRef = useRef<HTMLDivElement>(null);

  const nationStateThreat = data.events.slice(0, 5).some(
    (e) => e.threatClass === "nation-state"
  );
  const { layer14 } = data;
  const { layer15, layer16, layer17, layer18, layer19, layer20, layer21, layer22 } = data;
  const [legalHoldOverride, setLegalHoldOverride] = useState<boolean | null>(null);
  const effectiveLegalHold: Layer22State = {
    ...layer22,
    legalHoldActive: legalHoldOverride !== null ? legalHoldOverride : layer22.legalHoldActive,
    legalHoldSince: legalHoldOverride === true && !layer22.legalHoldActive ? Date.now() : layer22.legalHoldSince,
  };
  const handleLegalHoldToggle = () => {
    setLegalHoldOverride((prev) => prev === null ? !layer22.legalHoldActive : !prev);
  };

  const merkleShort = data.merkle.root.slice(0, 8) + "..." + data.merkle.root.slice(-8);

  return (
    <div
      className="w-screen h-screen overflow-hidden flex flex-col"
      style={{ background: "#000", fontFamily: "'JetBrains Mono', monospace" }}
    >
      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-6 py-2 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(0,240,122,0.08)" }}
      >
        <div className="flex items-center gap-4">
          <span
            style={{
              fontFamily: "'DM Serif Display', Georgia, serif",
              fontSize: "20px",
              color: "#00f07a",
              letterSpacing: "0.02em",
              textShadow: "0 0 20px rgba(0,240,122,0.4)",
            }}
          >
            Flat Circle
          </span>
          <div className="flex items-center gap-2">
            <div
              className="rounded-full"
              style={{
                width: "6px", height: "6px",
                background: "#00f07a",
                boxShadow: "0 0 6px #00f07a",
                animation: "pulse 2s infinite",
              }}
            />
            <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "10px" }}>ACTIVE</span>
          </div>
          {data.proxyActive && (
            <div className="flex items-center gap-1">
              <div
                className="rounded-full"
                style={{
                  width: "4px", height: "4px",
                  border: "1px solid rgba(0,240,122,0.6)",
                  animation: "pulse 3s infinite",
                }}
              />
              <span style={{ color: "rgba(0,240,122,0.35)", fontSize: "9px" }}>FRAME NARRATIVE PROXY</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <div
              className="rounded-full"
              style={{
                width: "4px", height: "4px",
                background: proxyConnected ? "#00ccff" : "rgba(255,255,255,0.1)",
                boxShadow: proxyConnected ? "0 0 4px #00ccff" : "none",
                animation: proxyConnected ? "pulse 2s infinite" : "none",
              }}
            />
            <span style={{ color: proxyConnected ? "rgba(0,204,255,0.6)" : "rgba(255,255,255,0.15)", fontSize: "9px" }}>
              {proxyConnected ? "LIVE" : "SIMULATED"}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {/* Provider status */}
          <div className="flex items-center gap-2">
            <div
              className="rounded-full"
              style={{
                width: "8px", height: "8px",
                background: tierColor(data.providerTier),
                boxShadow: `0 0 8px ${tierColor(data.providerTier)}66`,
              }}
            />
            <span style={{ color: tierColor(data.providerTier), fontSize: "10px" }}>
              {tierLabel(data.providerTier)}
            </span>
            <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "9px" }}>AI TIER 1</span>
          </div>

          {/* Stats strip */}
          {[
            { label: "HONEYPOT HITS", value: data.stats.honeypotHits.toLocaleString() },
            { label: "SHADOWED", value: data.stats.shadowedSessions },
            { label: "CANARIES", value: data.stats.canariesFired },
            { label: "MERKLE LEAVES", value: data.stats.merkleLeaves.toLocaleString() },
            { label: "SECRETS REDACTED", value: layer16.totalRedacted },
            { label: "FORENSIC LEAVES", value: layer22.exportedLeafCount.toLocaleString() },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-end">
              <span style={{ color: "#00f07a", fontSize: "13px", fontWeight: 500 }}>{value}</span>
              <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "9px", letterSpacing: "0.08em" }}>{label}</span>
            </div>
          ))}
          <DependencyRootIndicator
            status={layer15.status}
            packageCount={layer15.packageCount}
            lastVerifiedAt={layer15.lastVerifiedAt}
          />
        </div>
      </div>

      {/* ── Main body ── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT: Slime organism (2/3 width) ── */}
        <div
          className="flex-1 relative"
          style={{ borderRight: "1px solid rgba(0,240,122,0.06)" }}
        >
          <SlimeOrganism
            slimeEvents={data.slimeEvents}
            providerTier={data.providerTier}
            proxyActive={data.proxyActive}
            shadowSessionCount={data.shadowSessions.length}
            nationStateThreat={nationStateThreat}
          />

          {/* Organism label — barely visible */}
          <div
            className="absolute bottom-4 left-1/2 -translate-x-1/2"
            style={{ color: "rgba(0,240,122,0.12)", fontSize: "9px", letterSpacing: "0.3em" }}
          >
            ORGANISM ACTIVE
          </div>

          {/* Shadow session count indicator */}
          {data.shadowSessions.length > 0 && (
            <div
              className="absolute top-4 left-4"
              style={{ color: "rgba(0,240,122,0.35)", fontSize: "10px" }}
            >
              {data.shadowSessions.length} SHADOWED SESSION{data.shadowSessions.length !== 1 ? "S" : ""}
            </div>
          )}

          {/* Nation-state threat overlay */}
          {nationStateThreat && (
            <div
              className="absolute top-4 right-4 px-2 py-1 rounded"
              style={{
                border: "1px solid rgba(200,0,51,0.4)",
                color: "#cc0033",
                fontSize: "9px",
                letterSpacing: "0.15em",
                animation: "pulse 1s infinite",
              }}
            >
              NATION-STATE PATTERN
            </div>
          )}

          {/* Layer 14 — flood pressure wave overlay */}
          {layer14.floodActive && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(ellipse at 50% 110%, rgba(255,100,0,${Math.min(0.12, layer14.absorptionCapacityPct * 0.0012)}) 0%, transparent 60%)`,
                transition: "background 1.2s ease",
              }}
            />
          )}
          {/* Layer 18 — DNS constellation overlay */}
          <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.7 }}>
            <DNSConstellation points={layer18.points} />
          </div>

          {/* Layer 22 — Forensic stream indicator at the base */}
          <div
            className="absolute bottom-3 left-4"
            style={{ pointerEvents: "none" }}
          >
            <ForensicStreamPulse
              status={effectiveLegalHold.streamStatus}
              exportedLeafCount={effectiveLegalHold.exportedLeafCount}
            />
          </div>

          {/* Layer 22 — Legal hold indicator overlay */}
          {effectiveLegalHold.legalHoldActive && (
            <div
              className="absolute top-4 left-4"
              style={{
                border: "1px solid rgba(255,68,136,0.4)",
                background: "rgba(20,0,8,0.7)",
                borderRadius: "4px",
                padding: "3px 8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "5px", height: "5px",
                  background: "#ff4488",
                  boxShadow: "0 0 5px rgba(255,68,136,0.8)",
                  animation: "pulse 1.5s infinite",
                }}
              />
              <span style={{ color: "#ff4488", fontSize: "8px", letterSpacing: "0.15em", fontFamily: "JetBrains Mono" }}>
                LEGAL HOLD ACTIVE — MERKLE STATE FROZEN
              </span>
            </div>
          )}

          {layer14.floodActive && (
            <div
              className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2"
              style={{
                border: "1px solid rgba(255,136,0,0.35)",
                background: "rgba(20,8,0,0.75)",
                borderRadius: "4px",
                padding: "3px 8px",
              }}
            >
              <div
                className="rounded-full"
                style={{
                  width: "5px", height: "5px",
                  background: "#ff8800",
                  boxShadow: "0 0 5px rgba(255,136,0,0.8)",
                  animation: "pulse 0.8s infinite",
                }}
              />
              <span style={{ color: "#ff8800", fontSize: "8px", letterSpacing: "0.15em", fontFamily: "JetBrains Mono" }}>
                TARPIT ACTIVE — {layer14.activeTarpitConnections.length} ABSORBED
              </span>
            </div>
          )}
        </div>

        {/* ── RIGHT: Event feed + panels (1/3 width) ── */}
        <div
          className="flex flex-col"
          style={{ width: "420px", flexShrink: 0 }}
        >
          {/* AI Threat Feed */}
          <div
            className="flex flex-col flex-1 min-h-0"
            style={{ borderBottom: "1px solid rgba(0,240,122,0.06)" }}
          >
            <div
              className="px-4 py-2 flex-shrink-0"
              style={{ borderBottom: "1px solid rgba(0,240,122,0.06)" }}
            >
              <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "10px", letterSpacing: "0.15em" }}>
                AI THREAT FEED
              </span>
            </div>
            <div
              ref={feedRef}
              className="flex-1 overflow-y-auto px-4 py-3 flex flex-col gap-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: "#003820 #000" }}
            >
              {data.events.slice(0, 20).map((event, i) => (
                <div
                  key={event.id}
                  className="flex flex-col gap-1"
                  style={{
                    animation: i === 0 ? "scrollUp 0.3s ease-out forwards" : "none",
                    borderLeft: `2px solid ${eventColor(event.type)}`,
                    paddingLeft: "10px",
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      style={{
                        color: eventColor(event.type),
                        fontSize: "10px",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {event.type.toUpperCase()}
                    </span>
                    <span style={{ color: "rgba(0,240,122,0.25)", fontSize: "9px" }}>
                      {formatAge(Date.now() - event.timestamp)}
                    </span>
                  </div>
                  <p style={{ color: "rgba(0,240,122,0.75)", fontSize: "11px", lineHeight: "1.55", margin: 0 }}>
                    {event.narration}
                  </p>
                  {event.depth !== undefined && event.depth > 0 && (
                    <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "9px" }}>
                      DEPTH {event.depth} · {event.ip}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ── Scrollable lower panels ── */}
          <div
            className="flex flex-col overflow-y-auto flex-shrink-0"
            style={{ maxHeight: "55%", scrollbarWidth: "thin", scrollbarColor: "#003820 #000" }}
          >

          {/* Attacker classification */}
          <div style={{ borderBottom: "1px solid rgba(0,240,122,0.06)", flexShrink: 0 }}>
            <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(0,240,122,0.04)" }}>
              <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "10px", letterSpacing: "0.15em" }}>
                ACTIVE THREATS
              </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {data.events.slice(0, 5).filter((e) => e.threatClass).map((e) => (
                <div key={e.id} className="flex items-center justify-between">
                  <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "10px" }}>{e.ip}</span>
                  <span style={{ color: threatClassColor(e.threatClass), fontSize: "10px", letterSpacing: "0.05em" }}>
                    {threatClassLabel(e.threatClass)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Shadow sessions */}
          {data.shadowSessions.length > 0 && (
            <div style={{ borderBottom: "1px solid rgba(0,240,122,0.06)", flexShrink: 0 }}>
              <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(0,240,122,0.04)" }}>
                <span style={{ color: "rgba(0,240,122,0.5)", fontSize: "10px", letterSpacing: "0.15em" }}>
                  SHADOW SESSIONS
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {data.shadowSessions.slice(0, 2).map((s) => (
                  <ShadowBubble key={s.id} {...s} />
                ))}
              </div>
            </div>
          )}

          {/* Layer 17 — Authn anomaly panel */}
          {layer17.flaggedIdentities.length > 0 && (
            <div style={{ borderBottom: "1px solid rgba(255,100,0,0.08)", flexShrink: 0 }}>
              <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(255,100,0,0.06)" }}>
                <span style={{ color: "rgba(255,100,0,0.7)", fontSize: "10px", letterSpacing: "0.15em" }}>
                  AUTHN ANOMALIES — {layer17.totalAnomalies}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {layer17.flaggedIdentities.slice(0, 3).map((f) => (
                  <div key={f.id} className="flex items-center justify-between">
                    <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "10px", fontFamily: "JetBrains Mono" }}>{f.identityId}</span>
                    <span style={{ color: "#ff6600", fontSize: "9px", fontFamily: "JetBrains Mono", letterSpacing: "0.05em" }}>
                      {f.anomalyClass.toUpperCase().slice(0, 16)}
                    </span>
                    <span style={{ color: "rgba(255,100,0,0.6)", fontSize: "9px", fontFamily: "JetBrains Mono" }}>
                      {(f.riskScore * 10).toFixed(1)}/10
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Layer 21 — AI injection attempts panel */}
          {layer21.recentAttempts.length > 0 && (
            <div style={{ borderBottom: "1px solid rgba(170,68,255,0.08)", flexShrink: 0 }}>
              <div className="px-4 py-2" style={{ borderBottom: "1px solid rgba(170,68,255,0.06)" }}>
                <span style={{ color: "rgba(170,68,255,0.7)", fontSize: "10px", letterSpacing: "0.15em" }}>
                  AI INJECTION — {layer21.totalAttempts}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-col gap-2">
                {layer21.recentAttempts.slice(0, 3).map((a) => (
                  <InjectionAttemptBadge key={a.id} pattern={a.pattern} timestamp={a.timestamp} />
                ))}
              </div>
            </div>
          )}

          {/* Layer 22 — Forensic Export panel */}
          <div style={{ borderBottom: "1px solid rgba(0,170,255,0.08)", flexShrink: 0 }}>
            <div
              className="px-4 py-2"
              style={{ borderBottom: "1px solid rgba(0,170,255,0.06)" }}
            >
              <span style={{ color: "rgba(0,170,255,0.6)", fontSize: "10px", letterSpacing: "0.15em" }}>
                FORENSIC EXPORT / L22
              </span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-3">
              <LegalHoldBadge
                active={effectiveLegalHold.legalHoldActive}
                since={effectiveLegalHold.legalHoldSince}
                reason={effectiveLegalHold.legalHoldReason}
                onToggle={handleLegalHoldToggle}
              />
              <ComplianceReportPanel
                lastAt={effectiveLegalHold.lastComplianceReportAt}
                nextAt={effectiveLegalHold.nextComplianceReportAt}
                incidentCount={effectiveLegalHold.incidentPackageCount}
              />
              <ChainOfCustodyVerifierWidget merkleRoot={data.merkle.root} />
            </div>
          </div>

          {/* Layer 14 — Tarpit panel */}
          <div style={{ borderBottom: "1px solid rgba(255,136,0,0.08)", flexShrink: 0 }}>
            <div
              className="px-4 py-2 flex items-center justify-between"
              style={{ borderBottom: "1px solid rgba(255,136,0,0.06)" }}
            >
              <span style={{ color: layer14.floodActive ? "rgba(255,136,0,0.8)" : "rgba(255,170,50,0.45)", fontSize: "10px", letterSpacing: "0.15em" }}>
                TARPIT / L14
              </span>
              {layer14.floodActive && (
                <span style={{ color: "#ff8800", fontSize: "9px", letterSpacing: "0.1em", animation: "pulse 1.5s infinite" }}>
                  FLOOD
                </span>
              )}
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              <AbsorptionMeter pct={layer14.absorptionCapacityPct} floodActive={layer14.floodActive} />
              <div className="flex items-center justify-between">
                <span style={{ color: "rgba(255,170,50,0.35)", fontSize: "9px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>UPSTREAM</span>
                <UpstreamStatusBadge status={layer14.upstreamStatus} provider={layer14.upstreamProvider} />
              </div>
              <div className="flex items-center justify-between">
                <span style={{ color: "rgba(255,170,50,0.35)", fontSize: "9px", fontFamily: "JetBrains Mono", letterSpacing: "0.1em" }}>BYTES WASTED</span>
                <span
                  style={{
                    color: "#ffaa33",
                    fontSize: "12px",
                    fontFamily: "JetBrains Mono",
                    textShadow: layer14.floodActive ? "0 0 8px rgba(255,170,50,0.5)" : "none",
                    transition: "text-shadow 0.5s",
                  }}
                >
                  {layer14.bytesWasted.toLocaleString()}
                </span>
              </div>
              {layer14.activeTarpitConnections.length > 0 && (
                <div className="flex flex-col gap-1 mt-1">
                  <span style={{ color: "rgba(255,170,50,0.3)", fontSize: "8px", letterSpacing: "0.12em", fontFamily: "JetBrains Mono" }}>
                    ACTIVE CONNECTIONS — {layer14.activeTarpitConnections.length}
                  </span>
                  {layer14.activeTarpitConnections.slice(0, 4).map((n) => (
                    <TarpitNode key={n.id} node={n} />
                  ))}
                  {layer14.activeTarpitConnections.length > 4 && (
                    <span style={{ color: "rgba(255,170,50,0.2)", fontSize: "9px", fontFamily: "JetBrains Mono", paddingLeft: "4px" }}>
                      +{layer14.activeTarpitConnections.length - 4} more tarpitted
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          </div>{/* end scrollable lower panels */}
        </div>
      </div>

      {/* ── Bottom: Merkle + Mod7 + Layer status ── */}
      <div
        className="flex flex-shrink-0 items-stretch"
        style={{
          borderTop: "1px solid rgba(0,240,122,0.08)",
          height: "160px",
        }}
      >
        {/* Merkle root display */}
        <div
          className="flex flex-col justify-center px-6 gap-1"
          style={{ borderRight: "1px solid rgba(0,240,122,0.06)", minWidth: "220px" }}
        >
          <span style={{ color: "rgba(0,240,122,0.35)", fontSize: "8px", letterSpacing: "0.15em" }}>MERKLE ROOT</span>
          <span
            style={{
              color: "#00f07a",
              fontSize: "11px",
              fontFamily: "JetBrains Mono",
              textShadow: "0 0 8px rgba(0,240,122,0.4)",
            }}
          >
            {merkleShort}
          </span>
          <span style={{ color: "rgba(0,240,122,0.3)", fontSize: "8px" }}>
            {data.merkle.leafCount.toLocaleString()} leaves · {formatAge(Date.now() - data.merkle.lastUpdated)}
          </span>
          <div className="flex items-center gap-1 mt-1">
            <div className="rounded-full" style={{ width: "4px", height: "4px", background: "#00f07a" }} />
            <span style={{ color: "#00f07a", fontSize: "8px" }}>INTACT</span>
          </div>
        </div>

        {/* Mod 7 clocks */}
        <div
          className="flex flex-col justify-center px-6 gap-1"
          style={{ borderRight: "1px solid rgba(0,240,122,0.06)" }}
        >
          <span style={{ color: "rgba(0,240,122,0.35)", fontSize: "8px", letterSpacing: "0.15em", marginBottom: "4px" }}>
            MOD 7 RHYTHM
          </span>
          <div className="flex gap-3">
            <Mod7Ring label="HONEY" value={data.mod7.honeypot} />
            <Mod7Ring label="TEMP" value={data.mod7.temporal} />
            <Mod7Ring label="ENTR" value={data.mod7.entropy} />
            <Mod7Ring label="ROUTE" value={data.mod7.routes} />
            <Mod7Ring label="MRKL" value={data.mod7.merkle} />
          </div>
        </div>

        {/* Layer status */}
        <div className="flex-1 px-4 py-2 flex flex-col min-w-0">
          <span style={{ color: "rgba(0,240,122,0.35)", fontSize: "8px", letterSpacing: "0.15em", flexShrink: 0 }}>
            TWENTY-TWO LAYERS
          </span>
          <div
            className="grid gap-x-3 gap-y-0.5 mt-2 overflow-y-auto flex-1"
            style={{
              gridTemplateColumns: "repeat(3, 1fr)",
              scrollbarWidth: "thin",
              scrollbarColor: "#003820 #000",
            }}
          >
            {data.layers.map((l) => (
              <LayerBlob
                key={l.id}
                {...l}
                isProxy={l.id === 13}
                isTarpit={l.id === 14}
              />
            ))}
          </div>
        </div>

        {/* Layers 19+20 gauges */}
        <div className="flex flex-col justify-center px-4 gap-2" style={{ borderLeft: "1px solid rgba(0,240,122,0.06)", minWidth: "180px" }}>
          <ClientIntegrityLegend
            highCount={layer19.highCount}
            mediumCount={layer19.mediumCount}
            lowCount={layer19.lowCount}
            routedToHoneypot={layer19.routedToHoneypot}
          />
          <ExfiltrationTideGauge tideLevel={layer20.tideLevel} totalExceeded={layer20.totalExceeded} />
        </div>

        {/* Provider + token meter */}
        <div
          className="flex flex-col justify-center px-6 gap-2"
          style={{ borderLeft: "1px solid rgba(0,240,122,0.06)", minWidth: "140px" }}
        >
          <span style={{ color: "rgba(0,240,122,0.35)", fontSize: "8px", letterSpacing: "0.15em" }}>AI PROVIDER</span>
          {(["openai", "anthropic", "ollama", "static"] as AITier[]).map((tier) => {
            const active = tier === data.providerTier;
            return (
              <div key={tier} className="flex items-center gap-2">
                <div
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: "5px", height: "5px",
                    background: active ? tierColor(tier) : "rgba(255,255,255,0.08)",
                    boxShadow: active ? `0 0 6px ${tierColor(tier)}` : "none",
                  }}
                />
                <span
                  style={{
                    color: active ? tierColor(tier) : "rgba(255,255,255,0.15)",
                    fontSize: "9px",
                    fontFamily: "JetBrains Mono",
                  }}
                >
                  {tierLabel(tier)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
