"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AdminPanelLogin() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/admin-panel/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        setLoading(false);
        return;
      }
      router.push("/admin-panel");
      router.refresh();
    } catch {
      setError("Something went wrong. Try again.");
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* Animated background */}
      <div style={styles.bg}>
        <div style={styles.orb1} />
        <div style={styles.orb2} />
        <div style={styles.orb3} />
      </div>

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoWrap}>
          <div style={styles.logoIcon}>W</div>
          <div>
            <div style={styles.logoTitle}>Wasp AI</div>
            <div style={styles.logoSub}>Admin Panel</div>
          </div>
        </div>

        <h1 style={styles.heading}>Restricted Access</h1>
        <p style={styles.sub}>
          Authorised personnel only. All access is logged.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="ap-email">
              Admin Email
            </label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>✉</span>
              <input
                id="ap-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="waspai@admin.in"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.fieldGroup}>
            <label style={styles.label} htmlFor="ap-pass">
              Password
            </label>
            <div style={styles.inputWrap}>
              <span style={styles.inputIcon}>🔐</span>
              <input
                id="ap-pass"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                style={styles.input}
              />
            </div>
          </div>

          {error && <div style={styles.error}>⚠ {error}</div>}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...styles.btn,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <span style={styles.spinner} />
            ) : (
              "Sign in to Admin Panel →"
            )}
          </button>
        </form>

        <div style={styles.footer}>
          🔒 Secured · Server-side verified · Session expires in 8 hours
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes float1 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(40px,-40px) scale(1.1)} }
        @keyframes float2 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(-30px,50px) scale(0.9)} }
        @keyframes float3 { 0%,100%{transform:translate(0,0) scale(1)} 50%{transform:translate(20px,30px) scale(1.05)} }
        @keyframes spin { to { transform: rotate(360deg); } }
        #ap-email:focus, #ap-pass:focus {
          outline: none;
          border-color: rgba(139,92,246,0.8) !important;
          box-shadow: 0 0 0 3px rgba(139,92,246,0.2);
        }
        button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 32px rgba(139,92,246,0.5) !important;
        }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background:
      "linear-gradient(135deg, #0f0f1a 0%, #1a0a2e 50%, #0d1117 100%)",
    fontFamily: "'Inter', sans-serif",
    position: "relative",
    overflow: "hidden",
  },
  bg: { position: "absolute", inset: 0, pointerEvents: "none" },
  orb1: {
    position: "absolute",
    width: 500,
    height: 500,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
    top: -100,
    left: -100,
    animation: "float1 8s ease-in-out infinite",
  },
  orb2: {
    position: "absolute",
    width: 400,
    height: 400,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
    bottom: -80,
    right: -80,
    animation: "float2 10s ease-in-out infinite",
  },
  orb3: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
    top: "50%",
    right: "20%",
    animation: "float3 12s ease-in-out infinite",
  },
  card: {
    position: "relative",
    zIndex: 10,
    background: "rgba(255,255,255,0.04)",
    backdropFilter: "blur(24px)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: "48px 40px",
    width: "100%",
    maxWidth: 440,
    boxShadow:
      "0 32px 80px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
  },
  logoWrap: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  logoIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    background: "linear-gradient(135deg, #8b5cf6, #6366f1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 22,
    fontWeight: 700,
    color: "#fff",
    boxShadow: "0 4px 16px rgba(139,92,246,0.4)",
  },
  logoTitle: { fontSize: 18, fontWeight: 700, color: "#fff" },
  logoSub: { fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 },
  heading: {
    fontSize: 26,
    fontWeight: 700,
    color: "#fff",
    marginBottom: 8,
    letterSpacing: "-0.5px",
  },
  sub: {
    fontSize: 14,
    color: "rgba(255,255,255,0.4)",
    marginBottom: 32,
    lineHeight: 1.5,
  },
  form: { display: "flex", flexDirection: "column", gap: 20 },
  fieldGroup: { display: "flex", flexDirection: "column", gap: 8 },
  label: { fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.6)" },
  inputWrap: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: {
    position: "absolute",
    left: 14,
    fontSize: 15,
    pointerEvents: "none",
    zIndex: 1,
  },
  input: {
    width: "100%",
    padding: "12px 14px 12px 40px",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
  },
  error: {
    background: "rgba(239,68,68,0.12)",
    border: "1px solid rgba(239,68,68,0.3)",
    borderRadius: 10,
    padding: "10px 14px",
    color: "#f87171",
    fontSize: 14,
    fontWeight: 500,
  },
  btn: {
    padding: "14px",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    border: "none",
    borderRadius: 12,
    color: "#fff",
    fontSize: 15,
    fontWeight: 600,
    transition: "transform 0.2s, box-shadow 0.2s, opacity 0.2s",
    boxShadow: "0 4px 20px rgba(139,92,246,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  spinner: {
    width: 20,
    height: 20,
    border: "2px solid rgba(255,255,255,0.3)",
    borderTop: "2px solid #fff",
    borderRadius: "50%",
    animation: "spin 0.7s linear infinite",
    display: "inline-block",
  },
  footer: {
    marginTop: 28,
    textAlign: "center" as const,
    fontSize: 12,
    color: "rgba(255,255,255,0.25)",
    letterSpacing: "0.3px",
  },
};
