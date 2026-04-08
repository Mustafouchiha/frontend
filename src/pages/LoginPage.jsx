import { useState, useEffect } from "react";
import { BtnPrimary, BtnGhost, Lbl, TInput } from "../components/UI";
import { C } from "../constants";
import { authAPI, setToken } from "../services/api";

// 90 999 90 90 formatida ko'rsatish
function formatPhone(raw) {
  const d = raw.replace(/\D/g, "").slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5)}`;
  return `${d.slice(0,2)} ${d.slice(2,5)} ${d.slice(5,7)} ${d.slice(7)}`;
}

export default function LoginPage({ onLogin }) {
  const [mode,       setMode]       = useState("login");   // "login" | "register"
  const [step,       setStep]       = useState(1);         // 1: telefon, 2: kod
  const [phone,      setPhone]      = useState("");
  const [name,       setName]       = useState("");
  const [telegram,   setTelegram]   = useState("");
  const [tgChatId,   setTgChatId]   = useState("");
  const [code,       setCode]       = useState("");
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState("");
  const [autoLoading, setAutoLoading] = useState(false);

  // ── Bot redirect URL parametrlarini o'qish ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tgToken = params.get("tgToken");

    if (tgToken) {
      // Mavjud foydalanuvchi — bot token bilan avtomatik login
      setAutoLoading(true);
      authAPI.loginWithTgToken(tgToken)
        .then(data => {
          setToken(data.token);
          localStorage.setItem("rm_user", JSON.stringify(data.user));
          window.history.replaceState({}, "", window.location.pathname);
          onLogin(data.user);
        })
        .catch(e => {
          setError(e.message || "Havola yaroqsiz. Qaytadan /start bosing.");
          setAutoLoading(false);
        });
      return;
    }

    if (params.get("register") === "1") {
      const p  = params.get("phone")    || "";
      const n  = params.get("name")     || "";
      const tg = params.get("telegram") || "";
      const cid = params.get("tgChatId") || "";

      if (p && n) {
        // Barcha ma'lumotlar bor — avtomatik ro'yxatdan o'tish
        setAutoLoading(true);
        authAPI.register({ name: n, phone: p, telegram: tg, tgChatId: cid })
          .then(data => {
            setToken(data.token);
            localStorage.setItem("rm_user", JSON.stringify(data.user));
            window.history.replaceState({}, "", window.location.pathname);
            onLogin(data.user);
          })
          .catch(e => {
            setError(e.message || "Ro'yxatdan o'tishda xatolik");
            setAutoLoading(false);
            // Fallback: formni to'ldirish
            setMode("register");
            setPhone(p); setName(n); setTelegram(tg); setTgChatId(cid);
          });
      } else {
        // Ma'lumotlar to'liq emas — formni to'ldirish
        setMode("register");
        if (p) setPhone(p);
        if (n) setName(n);
        if (tg) setTelegram(tg);
        if (cid) setTgChatId(cid);
      }
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const switchMode = (m) => { setMode(m); setError(""); setCode(""); setStep(1); };

  // 1-bosqich: telefon tekshirish → OTP yuborish → 2-bosqichga o'tish
  const handleNextStep = async () => {
    setError("");
    if (!phone.trim()) { setError("Telefon raqam kiriting"); return; }
    if (mode === "register" && !name.trim()) { setError("Ism familiya kiriting"); return; }

    if (mode === "login") {
      // OTP kod yuborish
      setLoading(true);
      try {
        await authAPI.sendCode(phone.trim());
      } catch (e) {
        // Demo mode yoki bot yo'q bo'lsa ham davom etamiz
        if (e.message?.includes("needBot") || e.message?.includes("ro'yxatdan o'tmagan")) {
          setError(e.message);
          setLoading(false);
          return;
        }
        // Boshqa xatolik bo'lsa ham step 2 ga o'tamiz (demo rejim)
      } finally {
        setLoading(false);
      }
    }
    setStep(2);
  };

  // 2-bosqich: kod + API chaqirish
  const handleSubmit = async () => {
    setError("");
    if (code.trim().length < 4) {
      setError("Kamida 4 xonali kod kiriting"); return;
    }

    setLoading(true);
    try {
      let data;
      if (mode === "login") {
        data = await authAPI.login({ phone: phone.trim(), code: code.trim() });
      } else {
        data = await authAPI.register({
          name:      name.trim(),
          phone:     phone.trim(),
          telegram:  telegram.trim(),
          tgChatId:  tgChatId || undefined,
        });
      }
      setToken(data.token);
      localStorage.setItem("rm_user", JSON.stringify(data.user));
      onLogin(data.user);
    } catch (e) {
      if (mode === "login" && e.message?.includes("topilmadi")) {
        setError("Bu raqam topilmadi. \"Ro'yxatdan o'tish\" ni tanlang.");
      } else {
        setError(e.message || "Xatolik yuz berdi");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Bot token yuklanmoqda ────────────────────────────────────────
  if (autoLoading) {
    return (
      <div style={{
        fontFamily: "'Nunito','Segoe UI',sans-serif",
        background: C.bg, minHeight: "100vh",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", gap: 16,
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
          display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
        }}>♻️</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Yuklanmoqda...</div>
        <div style={{ fontSize: 12, color: C.textMuted }}>Telegram orqali kirilmoqda</div>
        {error && <div style={{ background:"#FFF1F0", color:"#FF4D4F", borderRadius:12,
          padding:"10px 18px", fontSize:12, fontWeight:600, maxWidth:320, textAlign:"center" }}>
          ⚠️ {error}
        </div>}
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'Nunito','Segoe UI',sans-serif",
      background: C.bg,
      minHeight: "100vh",
      maxWidth: 430,
      margin: "0 auto",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "40px 28px",
    }}>

      {/* Logo */}
      <div style={{
        width: 80, height: 80, borderRadius: 24, marginBottom: 16,
        background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 38,
      }}>♻️</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: C.text, marginBottom: 4 }}>
        ReMarket
      </div>
      <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 32, textAlign: "center" }}>
        Qayta ishlangan qurilish materiallari bozori
      </div>

      {/* Step 1 — Telefon */}
      {step === 1 && (
        <div style={{
          width: "100%",
          background: C.card,
          borderRadius: 22,
          border: `1px solid ${C.border}`,
          padding: "24px 20px",
          boxShadow: "0 4px 22px rgba(0,0,0,0.08)",
        }}>

          {/* Mode tabs */}
          <div style={{
            display: "flex", background: C.bg, borderRadius: 14,
            padding: 4, marginBottom: 22, gap: 4,
          }}>
            {[["login", "Kirish"], ["register", "Ro'yxatdan o'tish"]].map(([m, lbl]) => (
              <button key={m} onClick={() => switchMode(m)} style={{
                flex: 1, padding: "9px 0", borderRadius: 11, border: "none",
                cursor: "pointer", fontFamily: "inherit", fontSize: 12,
                fontWeight: 700, transition: "all .2s",
                background: mode === m ? C.primaryDark : "transparent",
                color:      mode === m ? "white" : C.textMuted,
              }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Ism (faqat register) */}
          {mode === "register" && (
            <>
              <Lbl>Ism Familiya *</Lbl>
              <TInput value={name} onChange={setName} placeholder="Abdulloh Karimov" />
            </>
          )}

          {/* Telefon */}
          <Lbl>Telefon raqam *</Lbl>
          <PhoneInput value={phone} onChange={setPhone} onEnter={handleNextStep} />

          {/* Telegram (ixtiyoriy, faqat register) */}
          {mode === "register" && (
            <>
              <Lbl>Telegram (ixtiyoriy)</Lbl>
              <TInput value={telegram} onChange={setTelegram} placeholder="@username" />
            </>
          )}

          {error && <ErrorBox msg={error} />}

          <BtnPrimary onClick={handleNextStep} fullWidth>
            📲 Kod yuborish →
          </BtnPrimary>

          {/* Mode switch */}
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
            {mode === "login" ? (
              <>Hisobingiz yo'qmi?{" "}
                <span onClick={() => switchMode("register")}
                  style={{ color: C.primaryDark, fontWeight: 700, cursor: "pointer" }}>
                  Ro'yxatdan o'ting
                </span>
              </>
            ) : (
              <>Hisobingiz bormi?{" "}
                <span onClick={() => switchMode("login")}
                  style={{ color: C.primaryDark, fontWeight: 700, cursor: "pointer" }}>
                  Kiring
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 2 — SMS kod */}
      {step === 2 && (
        <div style={{
          width: "100%",
          background: C.card,
          borderRadius: 22,
          border: `1px solid ${C.border}`,
          padding: "24px 20px",
          boxShadow: "0 4px 22px rgba(0,0,0,0.08)",
        }}>

          {/* Orqaga */}
          <button onClick={() => { setStep(1); setCode(""); setError(""); }} style={{
            display: "flex", alignItems: "center", gap: 5, background: "none",
            border: "none", cursor: "pointer", color: C.textSub,
            fontSize: 12, fontWeight: 700, marginBottom: 20,
            padding: 0, fontFamily: "inherit",
          }}>
            ← Orqaga
          </button>

          {/* Sarlavha */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: 18, margin: "0 auto 14px",
              background: C.primaryLight,
              border: `2px solid ${C.primaryBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28,
            }}>📲</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: C.text, marginBottom: 6 }}>
              SMS kod
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, lineHeight: 1.5 }}>
              Quyidagi raqamga kod yuborildi:
            </div>
            <div style={{
              display: "inline-block", marginTop: 6,
              background: C.primaryLight, border: `1px solid ${C.primaryBorder}`,
              borderRadius: 10, padding: "5px 14px",
              fontSize: 15, fontWeight: 900, color: C.primaryDark,
            }}>
              +998 {phone}
            </div>
          </div>

          {/* Kod input */}
          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
            placeholder="• • • •"
            inputMode="numeric"
            autoFocus
            style={{
              width: "100%", boxSizing: "border-box",
              padding: "16px", borderRadius: 16, marginBottom: 8,
              border: `2.5px solid ${code.length >= 4 ? C.primaryDark : C.primaryBorder}`,
              background: C.bg, fontSize: 36, fontWeight: 900,
              letterSpacing: 14, textAlign: "center", color: C.text,
              outline: "none", fontFamily: "inherit",
              transition: "border-color .2s",
            }}
            onFocus={e => e.target.style.borderColor = C.primaryDark}
            onBlur={e  => e.target.style.borderColor = code.length >= 4 ? C.primaryDark : C.primaryBorder}
            onKeyDown={e => e.key === "Enter" && handleSubmit()}
          />

          {/* Izoh */}
          <div style={{
            background: C.primaryLight,
            border: `1px solid ${C.primaryBorder}`,
            borderRadius: 10, padding: "8px 12px",
            marginBottom: 16,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 14 }}>{mode === "login" ? "📲" : "🧪"}</span>
            <span style={{ fontSize: 11, color: C.primaryDark, fontWeight: 600 }}>
              {mode === "login"
                ? "Telegram botingizga 6 xonali kod yuborildi"
                : "Demo rejim: ixtiyoriy 4 ta raqam kiriting (masalan: 1234)"}
            </span>
          </div>

          {error && <ErrorBox msg={error} />}

          <BtnPrimary onClick={handleSubmit} fullWidth>
            {loading
              ? "⏳ Tekshirilmoqda..."
              : mode === "login" ? "🔑 Kirish" : "✅ Ro'yxatdan o'tish"}
          </BtnPrimary>

          {/* Qayta yuborish */}
          <div style={{ textAlign: "center", marginTop: 14, fontSize: 11, color: C.textMuted }}>
            Kod kelmadimi?{" "}
            <span
              onClick={() => setCode("")}
              style={{ color: C.primaryDark, fontWeight: 700, cursor: "pointer" }}>
              Qayta yuborish
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function PhoneInput({ value, onChange, onEnter }) {
  const [focus, setFocus] = useState(false);
  return (
    <div style={{ position:"relative", marginBottom:13 }}>
      <span style={{
        position:"absolute", left:13, top:"50%", transform:"translateY(-50%)",
        fontSize:13, color:C.textSub, fontWeight:700, userSelect:"none", pointerEvents:"none",
      }}>+998</span>
      <input
        value={value}
        inputMode="numeric"
        placeholder="90 000 00 00"
        onChange={e => onChange(formatPhone(e.target.value))}
        onKeyDown={e => e.key === "Enter" && onEnter?.()}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        style={{
          width:"100%", boxSizing:"border-box",
          padding:"10px 13px 10px 54px",
          borderRadius:12, border:`1.5px solid ${focus ? C.primary : C.border}`,
          fontSize:15, fontWeight:700, color:C.text,
          fontFamily:"inherit", outline:"none",
          background:C.bg, transition:"border-color 0.2s",
          letterSpacing:1,
        }}
      />
    </div>
  );
}

function ErrorBox({ msg }) {
  return (
    <div style={{
      padding: "10px 14px", borderRadius: 10, marginBottom: 12,
      background: "#FFF1F0", color: "#FF4D4F",
      fontSize: 12, fontWeight: 600,
    }}>
      ⚠️ {msg}
    </div>
  );
}
