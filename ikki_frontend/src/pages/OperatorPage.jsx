import { useState, useEffect } from "react";
import { C } from "../constants";
import { operatorAPI } from "../services/api";
import {
  Search, Trash2, PlusCircle, MinusCircle, Users, Package,
  Loader2, ChevronLeft, Wallet, Lock, Unlock, Eye, EyeOff, CheckCircle,
} from "lucide-react";

const phoneCore = (value) => {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return digits.startsWith("998") ? digits.slice(-9) : digits.slice(-9);
};

const formatUzPhone = (value) => {
  const core = phoneCore(value);
  if (core.length !== 9) return value || "—";
  return `+998 ${core.slice(0, 2)} ${core.slice(2, 5)} ${core.slice(5, 7)} ${core.slice(7, 9)}`;
};

// ── Post status konfiguratsiyasi ──────────────────────────────────
const STATUS_CONFIG = {
  active:          { label: "ACTIVE",    color: "#28A869", bg: "#E8F8F0" },
  hidden:          { label: "YASHIRIN",  color: "#D4920A", bg: "#FFF8E6" },
  deleted:         { label: "O'CHIRILGAN", color: "#FF4D4F", bg: "#FFF1F0" },
  pending_payment: { label: "TO'LOV KUTMOQDA", color: "#7B5CF5", bg: "#F3F0FF" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  return (
    <span style={{
      fontSize: 9, fontWeight: 800, padding: "2px 7px", borderRadius: 6,
      background: cfg.bg, color: cfg.color, letterSpacing: 0.3,
    }}>
      {cfg.label}
    </span>
  );
}

// ── Yordamchi komponentlar ────────────────────────────────────────
function TabBar({ active, onChange }) {
  return (
    <div style={{ display:"flex", background:C.card, borderRadius:16, padding:4,
                  marginBottom:16, gap:4, border:`1px solid ${C.border}` }}>
      {[["users", <Users size={14}/>, "Foydalanuvchilar"],
        ["products", <Package size={14}/>, "Mahsulotlar"]].map(([tab, icon, lbl]) => (
        <button key={tab} onClick={() => onChange(tab)} style={{
          flex:1, padding:"9px 0", borderRadius:12, border:"none",
          cursor:"pointer", fontFamily:"inherit", fontSize:12, fontWeight:700,
          background: active===tab ? C.primaryDark : "transparent",
          color: active===tab ? "white" : C.textMuted,
          display:"flex", alignItems:"center", justifyContent:"center", gap:6,
        }}>{icon} {lbl}</button>
      ))}
    </div>
  );
}

function SearchBar({ value, onChange, placeholder }) {
  return (
    <div style={{ position:"relative", marginBottom:14 }}>
      <Search size={15} color={C.textMuted} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)" }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        style={{ width:"100%", boxSizing:"border-box", padding:"10px 12px 10px 36px",
                 borderRadius:12, border:`1.5px solid ${C.border}`, fontSize:13,
                 background:C.bg, color:C.text, outline:"none", fontFamily:"inherit" }} />
    </div>
  );
}

function ConfirmModal({ msg, confirmLabel = "O'chirish", confirmColor = "#FF4D4F", onConfirm, onCancel }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:999,
                  display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:C.card, borderRadius:20, padding:"24px 20px", maxWidth:340, width:"100%" }}>
        <div style={{ fontSize:15, fontWeight:700, color:C.text, marginBottom:20, textAlign:"center" }}>{msg}</div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px", borderRadius:12,
            border:`1.5px solid ${C.border}`, background:"transparent", cursor:"pointer",
            fontFamily:"inherit", fontSize:13, fontWeight:700, color:C.textSub }}>
            Bekor
          </button>
          <button onClick={onConfirm} style={{ flex:1, padding:"11px", borderRadius:12,
            border:"none", background:confirmColor, color:"white", cursor:"pointer",
            fontFamily:"inherit", fontSize:13, fontWeight:700 }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ASOSIY KOMPONENT ─────────────────────────────────────────────
export default function OperatorPage({ onBack }) {
  const [tab,      setTab]     = useState("users");
  const [query,    setQuery]   = useState("");
  const [users,    setUsers]   = useState([]);
  const [products, setProducts] = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [confirm,  setConfirm]  = useState(null); // { type, id, name, action }
  const [deposit,  setDeposit]  = useState(null); // { phone, name, mode: 'add'|'withdraw' }
  const [amount,   setAmount]   = useState("");
  const [msg,      setMsg]      = useState("");

  const load = async (q = "") => {
    setLoading(true);
    setMsg("");
    try {
      if (tab === "users") {
        const data = await operatorAPI.getUsers(q);
        setUsers(data);
      } else {
        const data = await operatorAPI.getProducts(q);
        setProducts(data);
      }
    } catch (e) {
      setMsg(e.message || "Xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(""); setQuery(""); }, [tab]);

  useEffect(() => {
    const t = setTimeout(() => load(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  // ── Foydalanuvchi o'chirish ──
  const handleDeleteUser = async () => {
    if (!confirm || confirm.type !== "user") return;
    try {
      const res = await operatorAPI.deleteUser(confirm.id);
      setMsg(`✅ ${res.message}`);
      setConfirm(null);
      load(query);
    } catch (e) {
      setMsg(e.message);
      setConfirm(null);
    }
  };

  // ── Mahsulot harakatlari ──
  const handleProductAction = async () => {
    if (!confirm || confirm.type !== "product") return;
    try {
      let res;
      if (confirm.action === "delete")   res = await operatorAPI.deleteProduct(confirm.id);
      else if (confirm.action === "hide") res = await operatorAPI.hideProduct(confirm.id);
      else if (confirm.action === "show") res = await operatorAPI.showProduct(confirm.id);
      else if (confirm.action === "approve") res = await operatorAPI.approveProduct(confirm.id);

      setMsg(`✅ ${res?.message || "Bajarildi"}`);
      setConfirm(null);
      load(query);
    } catch (e) {
      setMsg(e.message);
      setConfirm(null);
    }
  };

  const handleConfirm = () => {
    if (confirm?.type === "user") handleDeleteUser();
    else handleProductAction();
  };

  const toggleUserBlock = async (u) => {
    try {
      const res = await operatorAPI.setUserBlocked(u.id, !u.is_blocked);
      setMsg(`✅ ${res.message}`);
      load(query);
    } catch (e) {
      setMsg(e.message);
    }
  };

  const handleDeposit = async () => {
    const sum = Number(amount);
    if (!sum || sum <= 0) { setMsg("Summa kiriting"); return; }
    try {
      const res =
        deposit.mode === "withdraw"
          ? await operatorAPI.withdraw(deposit.phone, sum)
          : await operatorAPI.deposit(deposit.phone, sum);
      setMsg(`✅ ${res.message}`);
      setDeposit(null);
      setAmount("");
      load(query);
    } catch (e) {
      setMsg(e.message);
    }
  };

  // ── Mahsulot status bo'yicha tugma konfiguratsiyasi ──
  const getProductActions = (p) => {
    const actions = [];
    const s = p.status || (p.is_active ? "active" : "hidden");

    if (s === "pending_payment") {
      actions.push({
        icon: <CheckCircle size={14} />,
        bg: "#E8F8F0", color: "#28A869",
        title: "To'lovni tasdiqlash va ochish",
        action: "approve",
        msg: `"${p.name}" uchun to'lovni tasdiqlaysizmi? Post ochiladi.`,
        confirmLabel: "Tasdiqlash",
        confirmColor: "#28A869",
      });
    }

    if (s === "active") {
      actions.push({
        icon: <EyeOff size={14} />,
        bg: "#FFF8E6", color: "#D4920A",
        title: "Yashirish",
        action: "hide",
        msg: `"${p.name}" ni yashirasizmi?`,
        confirmLabel: "Yashirish",
        confirmColor: "#D4920A",
      });
    }

    if (s === "hidden" || s === "pending_payment") {
      actions.push({
        icon: <Eye size={14} />,
        bg: "#E8F8F0", color: "#28A869",
        title: "Ochish",
        action: "show",
        msg: `"${p.name}" ni ochmoqchimisiz?`,
        confirmLabel: "Ochish",
        confirmColor: "#28A869",
      });
    }

    if (s !== "deleted") {
      actions.push({
        icon: <Trash2 size={14} />,
        bg: "#FFF1F0", color: "#FF4D4F",
        title: "O'chirish",
        action: "delete",
        msg: `"${p.name}" ni o'chirishni tasdiqlaysizmi?`,
        confirmLabel: "O'chirish",
        confirmColor: "#FF4D4F",
      });
    }

    return actions;
  };

  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
                  minHeight:"100vh", maxWidth:430, margin:"0 auto",
                  padding:"16px 16px 80px" }}>

      {/* Header */}
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
        <button onClick={onBack} style={{ background:"none", border:"none", cursor:"pointer",
          padding:4, display:"flex", alignItems:"center" }}>
          <ChevronLeft size={22} color={C.text} />
        </button>
        <div style={{ fontSize:18, fontWeight:900, color:C.text }}>Operator paneli</div>
      </div>

      {/* Xabar */}
      {msg && (
        <div style={{ padding:"10px 14px", borderRadius:12, marginBottom:12, fontSize:13, fontWeight:600,
          background: msg.startsWith("✅") ? "#E8F8F0" : "#FFF1F0",
          color: msg.startsWith("✅") ? "#28A869" : "#FF4D4F" }}>
          {msg}
        </div>
      )}

      <TabBar active={tab} onChange={setTab} />

      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder={tab === "users" ? "Telefon, ism yoki ID..." : "Mahsulot nomi, ID yoki egasi..."}
      />

      {loading && (
        <div style={{ textAlign:"center", padding:"40px 0", color:C.textMuted }}>
          <Loader2 size={28} style={{ margin:"0 auto", display:"block" }} />
        </div>
      )}

      {/* ── FOYDALANUVCHILAR ── */}
      {!loading && tab === "users" && (
        <div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>
            {users.length} ta foydalanuvchi
          </div>
          {users.map(u => (
            <div key={u.id} style={{ background:C.card, borderRadius:14, marginBottom:10,
              border:`1px solid ${C.border}`, padding:"12px 14px",
              display:"flex", alignItems:"center", gap:10 }}>
              {/* Avatar */}
              <div style={{ width:40, height:40, borderRadius:"50%", flexShrink:0,
                background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:14, fontWeight:900, color:"white" }}>
                {(u.name||"?")[0].toUpperCase()}
              </div>
              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:800, color:C.text,
                  overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                  {u.name}
                </div>
                <div style={{ fontSize:11, color:C.textMuted }}>
                  ID: {u.public_id || "—"} · {formatUzPhone(u.phone)}
                </div>
                <div style={{ fontSize:11, color:C.primaryDark, fontWeight:700 }}>
                  {Number(u.balance).toLocaleString()} so'm
                </div>
                <div style={{ fontSize:10, color: u.is_blocked ? "#FF4D4F" : "#28A869", fontWeight:800 }}>
                  {u.is_blocked ? "BLOCK" : "ACTIVE"}
                </div>
              </div>
              {/* Tugmalar */}
              <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                <button onClick={() => { setDeposit({ phone: u.phone, name: u.name, mode: "add" }); setAmount(""); setMsg(""); }}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"#E8F8F0", color:"#28A869", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}
                  title="Pul qo'shish">
                  <PlusCircle size={16} />
                </button>
                <button onClick={() => { setDeposit({ phone: u.phone, name: u.name, mode: "withdraw" }); setAmount(""); setMsg(""); }}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"#FFF1F0", color:"#FF4D4F", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}
                  title="Balansdan yechish">
                  <MinusCircle size={16} />
                </button>
                <button
                  onClick={() => toggleUserBlock(u)}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                    background: u.is_blocked ? "#E8F8F0" : "#FFF8E6",
                    color: u.is_blocked ? "#28A869" : "#D4920A",
                    cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                  title={u.is_blocked ? "Blokdan chiqarish" : "Bloklash"}>
                  {u.is_blocked ? <Unlock size={15} /> : <Lock size={15} />}
                </button>
                <button onClick={() => setConfirm({ type:"user", id:u.id, name:u.name,
                    msg:`"${u.name}" ni o'chirasizmi? Uning postlari saqlanib qoladi.`,
                    confirmLabel:"O'chirish", confirmColor:"#FF4D4F" })}
                  style={{ width:34, height:34, borderRadius:10, border:"none",
                    background:"#FFF1F0", color:"#FF4D4F", cursor:"pointer",
                    display:"flex", alignItems:"center", justifyContent:"center" }}
                  title="O'chirish">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px", color:C.textMuted, fontSize:13 }}>
              Foydalanuvchi topilmadi
            </div>
          )}
        </div>
      )}

      {/* ── MAHSULOTLAR ── */}
      {!loading && tab === "products" && (
        <div>
          <div style={{ fontSize:11, color:C.textMuted, marginBottom:8 }}>
            {products.length} ta mahsulot
          </div>
          {products.map(p => {
            const productActions = getProductActions(p);
            return (
              <div key={p.id} style={{ background:C.card, borderRadius:14, marginBottom:10,
                border:`1px solid ${C.border}`, padding:"12px 14px",
                display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:800, color:C.text,
                    overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize:11, color:C.primaryDark, fontWeight:700 }}>
                    {Number(p.price).toLocaleString()} so'm/{p.unit}
                  </div>
                  <div style={{ fontSize:11, color:C.textMuted }}>
                    {p.owner_name ? `${p.owner_name} (${p.owner_public_id || "—"}) · ${formatUzPhone(p.owner_phone)}` : "Egasiz"}
                  </div>
                  <div style={{ marginTop: 3 }}>
                    <StatusBadge status={p.status || (p.is_active ? "active" : "hidden")} />
                  </div>
                </div>
                <div style={{ display:"flex", gap:6, flexShrink:0 }}>
                  {productActions.map((act) => (
                    <button
                      key={act.action}
                      onClick={() => setConfirm({
                        type: "product",
                        id: p.id,
                        name: p.name,
                        action: act.action,
                        msg: act.msg,
                        confirmLabel: act.confirmLabel,
                        confirmColor: act.confirmColor,
                      })}
                      style={{ width:34, height:34, borderRadius:10, border:"none",
                        background: act.bg, color: act.color,
                        cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
                      title={act.title}>
                      {act.icon}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          {products.length === 0 && (
            <div style={{ textAlign:"center", padding:"32px", color:C.textMuted, fontSize:13 }}>
              Mahsulot topilmadi
            </div>
          )}
        </div>
      )}

      {/* ── PUL QO'SHISH MODAL ── */}
      {deposit && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)", zIndex:999,
          display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
          <div style={{ background:C.card, borderRadius:20, padding:"24px 20px", width:"100%", maxWidth:340 }}>
            <div style={{ fontSize:15, fontWeight:800, color:C.text, marginBottom:4 }}>
              {deposit.mode === "withdraw" ? "Balansdan yechish" : "Pul qo'shish"}
            </div>
            <div style={{ fontSize:12, color:C.textMuted, marginBottom:16 }}>
              {deposit.name} · {formatUzPhone(deposit.phone)}
            </div>
            <input
              value={amount}
              onChange={e => setAmount(e.target.value.replace(/\D/g,""))}
              placeholder="Summa (so'm)"
              inputMode="numeric"
              autoFocus
              style={{ width:"100%", boxSizing:"border-box", padding:"12px 14px",
                borderRadius:12, border:`1.5px solid ${C.primaryBorder}`,
                fontSize:16, fontWeight:700, color:C.text, background:C.bg,
                outline:"none", fontFamily:"inherit", marginBottom:14 }}
            />
            {amount && (
              <div style={{ fontSize:13, color:C.primaryDark, fontWeight:700, marginBottom:14 }}>
                = {Number(amount).toLocaleString()} so'm
              </div>
            )}
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={() => setDeposit(null)} style={{ flex:1, padding:"11px",
                borderRadius:12, border:`1.5px solid ${C.border}`, background:"transparent",
                cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700, color:C.textSub }}>
                Bekor
              </button>
              <button onClick={handleDeposit} style={{ flex:1, padding:"11px",
                borderRadius:12, border:"none",
                background: deposit.mode === "withdraw"
                  ? "linear-gradient(135deg,#FF6B6B,#FF4D4F)"
                  : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                color:"white", cursor:"pointer", fontFamily:"inherit", fontSize:13, fontWeight:700 }}>
                <Wallet size={14} style={{ verticalAlign:"middle", marginRight:4 }} />
                {deposit.mode === "withdraw" ? "Yechish" : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TASDIQLASH MODALI ── */}
      {confirm && (
        <ConfirmModal
          msg={confirm.msg || `"${confirm.name}" ni o'chirishni tasdiqlaysizmi?`}
          confirmLabel={confirm.confirmLabel || "O'chirish"}
          confirmColor={confirm.confirmColor || "#FF4D4F"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  );
}
