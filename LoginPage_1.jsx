import React, { useState } from "react";
import {
  Sun, Moon, Mail, Lock, Eye, EyeOff, CheckSquare, Square, ChevronLeft,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Brand palette                                                      */
/* ------------------------------------------------------------------ */

const BRAND = {
  gradientLight: "linear-gradient(135deg, #8b5cf6 0%, #4c1d95 100%)",
  violet: "#8b5cf6",
  indigo: "#4c1d95",
};

/* ------------------------------------------------------------------ */
/*  Logo mark (two rounded bars + circle, matches the reference)       */
/* ------------------------------------------------------------------ */

function LogoMark({ size = 90 }) {
  const barW = size, barH = size * 0.24, gap = size * 0.06, r = barH / 2;
  return (
    <div style={{ position: "relative", width: barW, height: barH * 2 + gap }}>
      <div style={{ position: "absolute", top: 0, left: 0, width: barW, height: barH, borderRadius: r, background: "linear-gradient(180deg,#f4f4f6,#c9cad0)" }} />
      <div style={{ position: "absolute", bottom: 0, left: 0, width: barW, height: barH, borderRadius: r, background: "linear-gradient(180deg,#f4f4f6,#c9cad0)" }} />
      <div style={{ position: "absolute", top: barH * 0.5 - (barH * 0.9) / 2, left: barW * 0.18, width: barH * 0.9, height: barH * 0.9, borderRadius: "50%", background: "radial-gradient(circle at 35% 30%, #ffffff, #d8d9dd)" }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Small building blocks                                              */
/* ------------------------------------------------------------------ */

function FieldRow({ icon: Icon, placeholder, value, onChange, type = "text", fieldBg, fieldBorder, textColor, trailing }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, background: fieldBg, border: `1px solid ${fieldBorder}`, borderRadius: 24, padding: "12px 16px" }}>
      <Icon size={16} color="#9a9a97" />
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ flex: 1, border: "none", outline: "none", background: "transparent", color: textColor, fontSize: 14 }}
      />
      {trailing}
    </div>
  );
}

function SocialDot({ label, bg, disabled }) {
  return (
    <div
      style={{
        width: 42, height: 42, borderRadius: 12, background: bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: bg === "#fff" ? "#000" : "#fff", fontWeight: 700, fontSize: 14,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  LoginPage — splash -> sign in / sign up card                       */
/*                                                                      */
/*  Props:                                                             */
/*   onAuthenticated(theme) — called once the user submits a valid     */
/*                            form. Wire this to your own auth logic   */
/*                            and route into the rest of your app.     */
/*   startTheme            — "dark" | "light" (default "dark")         */
/* ------------------------------------------------------------------ */

export default function LoginPage({ onAuthenticated, startTheme = "dark" }) {
  const [theme, setTheme] = useState(startTheme);
  const [stage, setStage] = useState("splash"); // splash | auth
  const [mode, setMode] = useState("signup"); // signup | signin
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const isDark = theme === "dark";
  const cardBg = isDark ? "#1c1c1c" : "#ffffff";
  const cardText = isDark ? "#f2f2f0" : "#1a1a1a";
  const cardSub = isDark ? "#8f8f8c" : "#6b6b68";
  const fieldBg = isDark ? "#242424" : "#ffffff";
  const fieldBorder = isDark ? "#333" : "#dcdbd6";

  const shellStyle = {
    background: isDark ? "#161616" : "#f4f3ef",
    height: "100vh",
    minHeight: "100vh",
    width: "100%",
    maxWidth: 480,
    margin: "0 auto",
    overflow: "hidden",
    position: "relative",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', sans-serif",
  };

  function submit() {
    if (mode === "signup" && !agreed) {
      setError("Agree to the terms and conditions to continue.");
      return;
    }
    if (!email.trim() || !password.trim()) {
      setError("Enter your email and password.");
      return;
    }
    setError("");
    if (onAuthenticated) onAuthenticated(theme);
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", width: "100%", minHeight: "100vh", background: isDark ? "#161616" : "#f4f3ef" }}>
      <div style={shellStyle}>
        {/* theme toggle, always available pre-login */}
        <button
          onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          style={{
            position: "absolute", top: 16, right: 16, zIndex: 5,
            width: 34, height: 34, borderRadius: 17,
            border: "1px solid rgba(255,255,255,0.35)",
            background: "rgba(0,0,0,0.25)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", cursor: "pointer",
          }}
          aria-label="Toggle dark mode"
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* purple gradient header */}
        <div
          style={{
            height: stage === "splash" ? "100%" : "30%",
            background: BRAND.gradientLight,
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: stage === "splash" ? "space-between" : "center",
            padding: stage === "splash" ? "70px 28px 40px" : "0",
            transition: "height .25s ease",
          }}
        >
          {/* diagonal accent lines, decorative */}
          <svg style={{ position: "absolute", inset: 0, opacity: 0.25 }} width="100%" height="100%">
            <line x1="10%" y1="90%" x2="30%" y2="60%" stroke="#fff" strokeWidth="1.5" />
            <line x1="60%" y1="95%" x2="80%" y2="65%" stroke="#fff" strokeWidth="1.5" />
            <line x1="40%" y1="20%" x2="60%" y2="0%" stroke="#fff" strokeWidth="1.5" />
          </svg>

          {stage === "splash" ? (
            <>
              <div />
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, zIndex: 1 }}>
                <LogoMark size={84} />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 26 }}>Daily Task Reminder</div>
              </div>
              <div style={{ width: "100%", zIndex: 1 }}>
                <button
                  onClick={() => { setMode("signup"); setStage("auth"); }}
                  style={{ width: "100%", padding: "16px 0", borderRadius: 30, border: "none", background: "#fff", color: BRAND.indigo, fontWeight: 700, fontSize: 15, cursor: "pointer" }}
                >
                  Get started
                </button>
                <div
                  onClick={() => { setMode("signin"); setStage("auth"); }}
                  style={{ textAlign: "center", color: "rgba(255,255,255,0.85)", fontSize: 12.5, marginTop: 12, cursor: "pointer" }}
                >
                  I already have an account
                </div>
              </div>
            </>
          ) : (
            <div style={{ zIndex: 1 }}>
              <LogoMark size={68} />
            </div>
          )}
        </div>

        {/* auth card */}
        {stage === "auth" && (
          <div
            style={{
              position: "absolute",
              top: "26%",
              left: 0,
              right: 0,
              bottom: 0,
              background: cardBg,
              borderRadius: "26px 26px 0 0",
              padding: "26px 22px",
              display: "flex",
              flexDirection: "column",
              overflowY: "auto",
            }}
          >
            <div style={{ textAlign: "center", fontWeight: 800, fontSize: 22, color: BRAND.violet, marginBottom: 18 }}>
              {mode === "signup" ? "hello!" : "welcome back!"}
            </div>

            <FieldRow icon={Mail} placeholder="Email" value={email} onChange={setEmail} fieldBg={fieldBg} fieldBorder={fieldBorder} textColor={cardText} />
            <div style={{ height: 12 }} />
            <FieldRow
              icon={Lock}
              placeholder="Password"
              value={password}
              onChange={setPassword}
              type={showPw ? "text" : "password"}
              fieldBg={fieldBg} fieldBorder={fieldBorder} textColor={cardText}
              trailing={
                <button onClick={() => setShowPw((s) => !s)} style={{ background: "none", border: "none", color: cardSub, cursor: "pointer" }}>
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {mode === "signup" && (
              <div onClick={() => setAgreed((a) => !a)} style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 12, fontSize: 12, color: cardSub, cursor: "pointer" }}>
                {agreed ? <CheckSquare size={15} color={BRAND.violet} /> : <Square size={15} />}
                I agree to the <b style={{ color: cardText }}>&nbsp;terms and conditions</b>
              </div>
            )}

            {error && <div style={{ color: "#e05a5a", fontSize: 12, marginTop: 10 }}>{error}</div>}

            <button
              onClick={submit}
              style={{
                marginTop: 18, width: "100%", padding: "15px 0", borderRadius: 30, border: "none",
                background: BRAND.gradientLight, color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
              }}
            >
              {mode === "signup" ? "Sign up" : "Sign in"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: cardSub, fontSize: 11 }}>
              <div style={{ flex: 1, height: 1, background: fieldBorder }} />
              or
              <div style={{ flex: 1, height: 1, background: fieldBorder }} />
            </div>

            <div style={{ display: "flex", justifyContent: "center", gap: 14, marginBottom: 10 }}>
              <SocialDot label="G" bg="#ea4335" disabled />
              <SocialDot label="" bg={isDark ? "#fff" : "#000"} disabled />
            </div>
            <div style={{ textAlign: "center", fontSize: 11.5, color: cardSub }}>
              Google and Apple sign-in <b style={{ color: cardText }}>coming soon</b>
            </div>

            <div style={{ textAlign: "center", marginTop: 14, fontSize: 12.5, color: cardSub }}>
              {mode === "signup" ? (
                <>Already have an account?{" "}
                  <span onClick={() => setMode("signin")} style={{ color: BRAND.violet, fontWeight: 700, cursor: "pointer" }}>Sign in</span>
                </>
              ) : (
                <>New here?{" "}
                  <span onClick={() => setMode("signup")} style={{ color: BRAND.violet, fontWeight: 700, cursor: "pointer" }}>Create an account</span>
                </>
              )}
            </div>

            <button
              onClick={() => setStage("splash")}
              style={{ position: "absolute", top: 14, left: 14, background: "none", border: "none", color: cardSub }}
            >
              <ChevronLeft size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
