import { useState, useEffect, useCallback } from "react";
import { C } from "../constants";
import { operatorAPI } from "../services/api";
import {
  Search, Trash2, Users, Package, ChevronLeft,
  Loader2, EyeOff, Eye, Lock, Unlock,
  AlertTriangle, RefreshCw, PlusCircle, MinusCircle,
  Shield, UserPlus, UserMinus, Wallet,
} from "lucide-react";

const phoneCore = (v) => String(v || "").replace(/\D/g, "").slice(-9);
const fmtPhone  = (v) => {
  const c = phoneCore(v);
  if (c.length !== 9) return v || "—";
  return `+998 ${c.slice(0,2)} ${c.slice(2,5)} ${c.slice(5,7)} ${c.slice(7,9)}`;
};
const fmtPrice = (n) => Number(n || 0).toLocaleString("uz-UZ") + " so'm";

function Modal({ children }) {
  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.45)",
                  zIndex:999, display:"flex", alignItems:"center", justifyContent:"center", padding:"0 18px" }}>
      <div style={{ background:"white", borderRadius:16, padding:"18px", width:"100%", maxWidth:360,
                    boxShadow:"0 12px 40px rgba(0,0,0,0.2)" }}>
        {children}
      </div>
    </div>
  );
}

function Confirm({ title, msg, onOk, onCancel, okColor }) {
  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
        <AlertTriangle size={16} color={okColor || C.danger} />
        <b style={{ fontSize:14, color:C.text }}>{title}</b>
      </div>
      <p style={{ fontSize:12, color:C.textSub, marginBottom:16, lineHeight:1.5 }}>{msg}</p>
      <div style={{ display:"flex", gap:7 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={okColor || C.danger} onClick={onOk}>Tasdiqlash</Btn>
      </div>
    </Modal>
  );
}

function AmountModal({ title, Icon, iconColor, user, onOk, onCancel, maxAmount }) {
  const [amount, setAmount] = useState("");
  const [busy,   setBusy]   = useState(false);
  const valid = Number(amount) > 0 && (maxAmount === undefined || Number(amount) <= maxAmount);
  const go = async () => {
    if (!valid || busy) return;
    setBusy(true);
    try { await onOk(Number(amount)); } catch { setBusy(false); }
  };
  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:5 }}>
        <Icon size={16} color={iconColor} />
        <b style={{ fontSize:14, color:C.text }}>{title}</b>
      </div>
      <div style={{ fontSize:11, color:C.textMuted, marginBottom:11 }}>
        {fmtPhone(user.phone)} — {user.name}
        {maxAmount !== undefined && <span style={{ color:C.danger, marginLeft:7 }}>Balans: {fmtPrice(maxAmount)}</span>}
      </div>
      <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
        placeholder="Summa (so'm)" autoFocus
        style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:9,
                 border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit",
                 outline:"none", marginBottom:12 }} />
      <div style={{ display:"flex", gap:7 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={iconColor} onClick={go} disabled={!valid || busy}>
          {busy ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> : <Icon size={12} />}
          Tasdiqlash
        </Btn>
      </div>
    </Modal>
  );
}

function AddOpModal({ onOk, onCancel }) {
  const [ident, setIdent] = useState("");
  const [busy,  setBusy]  = useState(false);
  const go = async () => {
    if (!ident.trim() || busy) return;
    setBusy(true);
    try { await onOk(ident.trim()); } catch { setBusy(false); }
  };
  return (
    <Modal>
      <div style={{ display:"flex", alignItems:"center", gap:7, marginBottom:9 }}>
        <UserPlus size={16} color={C.primaryDark} />
        <b style={{ fontSize:14, color:C.text }}>Operator qo'shish</b>
      </div>
      <div style={{ fontSize:11, color:C.textMuted, marginBottom:9 }}>Telefon raqam yoki ism:</div>
      <input value={ident} onChange={e => setIdent(e.target.value)}
        placeholder="901234567 yoki Ism Familiya" autoFocus
        style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px", borderRadius:9,
                 border:`1.5px solid ${C.border}`, fontSize:13, fontFamily:"inherit",
                 outline:"none", marginBottom:12 }} />
      <div style={{ display:"flex", gap:7 }}>
        <Btn ghost onClick={onCancel}>Bekor</Btn>
        <Btn color={C.primaryDark} onClick={go} disabled={!ident.trim() || busy}>
          {busy ? <Loader2 size={12} style={{ animation:"spin 1s linear infinite" }} /> : <UserPlus size={12} />}
          Qo'shish
        </Btn>
      </div>
    </Modal>
  );
}

function Btn({ children, onClick, color, ghost, disabled, style: s = {} }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled}
      style={{ flex:1, padding:"8px 10px", borderRadius:9, cursor:disabled?"default":"pointer",
               border:ghost?`1.5px solid ${C.border}`:"none",
               background:disabled?C.border:ghost?"white":(color||C.primaryDark),
               color:ghost?C.text:"white", fontSize:11, fontWeight:700,
               fontFamily:"inherit", display:"flex", alignItems:"center",
               justifyContent:"center", gap:4, ...s }}>
      {children}
    </button>
  );
}

const STATUS_MAP = {
  active:  { bg:"#DCFCE7", color:"#16A34A", label:"Faol" },
  hidden:  { bg:"#F1F5F9", color:"#64748B", label:"Yashirilgan" },
  deleted: { bg:"#FFF1F0", color:"#EF4444", label:"O'chirilgan" },
};
function Badge({ status }) {
  const s = STATUS_MAP[status] || STATUS_MAP.deleted;
  return (
    <span style={{ fontSize:9, padding:"2px 7px", borderRadius:6,
                   background:s.bg, color:s.color, fontWeight:700, whiteSpace:"nowrap" }}>
      {s.label}
    </span>
  );
}

const TABS = [
  { key:"products",  Icon:Package, label:"Mahsulot" },
  { key:"users",     Icon:Users,   label:"Foydalanuvchi" },
  { key:"operators", Icon:Shield,  label:"Operator" },
];

export default function OperatorPage({ onBack, user }) {
  const isMainOp = phoneCore(user?.phone) === "331350206";

  const [tab,          setTab]          = useState("products");
  const [loading,      setLoading]      = useState(false);
  const [err,          setErr]          = useState("");
  const [toast,        setToast]        = useState("");
  const [confirmDlg,   setConfirmDlg]   = useState(null);
  const [depositUser,  setDepositUser]  = useState(null);
  const [withdrawUser, setWithdrawUser] = useState(null);
  const [addOpDlg,     setAddOpDlg]     = useState(false);

  const [users,        setUsers]        = useState([]);
  const [userQ,        setUserQ]        = useState("");
  const [prods,        setProds]        = useState([]);
  const [prodQ,        setProdQ]        = useState("");
  const [operators,    setOperators]    = useState([]);
  const [stats,        setStats]        = useState(null);

  const toast$ = (msg) => { setToast(msg); setTimeout(() => setToast(""), 2800); };
  const ok   = (msg) => toast$("✓ " + msg);
  const fail = (e)   => toast$("✗ " + (e?.message || e));

  const loadTab = useCallback(async (t = tab) => {
    setLoading(true); setErr("");
    try {
      if (t === "users") {
        setUsers(await operatorAPI.getUsers(userQ));
      } else if (t === "products") {
        const [ps, s] = await Promise.all([
          operatorAPI.getProducts(prodQ),
          operatorAPI.getStats().catch(() => null),
        ]);
        setProds(ps); if (s) setStats(s);
      } else if (t === "operators") {
        setOperators(await operatorAPI.getOperators());
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [tab, userQ, prodQ]);

  useEffect(() => { loadTab(tab); }, [tab]);

  const block   = async (u) => {
    try {
      if (u.is_blocked) { await operatorAPI.unblockUser(u.id); ok("Blok ochildi"); }
      else              { await operatorAPI.blockUser(u.id);   ok("Bloklandi"); }
      setUsers(p => p.map(x => x.id === u.id ? { ...x, is_blocked: !x.is_blocked } : x));
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const delUser = async (id) => {
    try { await operatorAPI.deleteUser(id); setUsers(p => p.filter(x => x.id !== id)); ok("O'chirildi"); }
    catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const deposit  = async (u, amount) => {
    try { await operatorAPI.deposit(u.phone, amount); setDepositUser(null); ok(`${amount.toLocaleString()} qo'shildi`); loadTab("users"); }
    catch(e) { fail(e); throw e; }
  };
  const withdraw = async (u, amount) => {
    try { await operatorAPI.withdraw(u.phone, amount); setWithdrawUser(null); ok(`${amount.toLocaleString()} ayirildi`); loadTab("users"); }
    catch(e) { fail(e); throw e; }
  };
  const hideShow = async (p) => {
    try {
      if (p.status === "hidden") { await operatorAPI.showPost(p.id); setProds(ps => ps.map(x => x.id === p.id ? { ...x, status:"active" } : x)); ok("Ko'rsatildi"); }
      else                       { await operatorAPI.hidePost(p.id); setProds(ps => ps.map(x => x.id === p.id ? { ...x, status:"hidden" } : x)); ok("Yashirildi"); }
    } catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const delProd  = async (id) => {
    try { await operatorAPI.deletePost(id); setProds(p => p.filter(x => x.id !== id)); ok("O'chirildi"); }
    catch(e) { fail(e); }
    setConfirmDlg(null);
  };
  const addOp    = async (ident) => {
    try { await operatorAPI.addOperator(ident); setAddOpDlg(false); ok("Operator qo'shildi"); loadTab("operators"); }
    catch(e) { fail(e); throw e; }
  };
  const removeOp = async (id) => {
    try { await operatorAPI.removeOperator(id); setOperators(p => p.filter(x => x.id !== id)); ok("Olib tashlandi"); }
    catch(e) { fail(e); }
    setConfirmDlg(null);
  };

  return (
    <div style={{ minHeight:"100vh", background:"#F0F9FF", maxWidth:430, margin:"0 auto",
                  fontFamily:"'Nunito','Segoe UI',sans-serif", paddingBottom:24 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      {toast && (
        <div style={{ position:"fixed", top:14, left:"50%", transform:"translateX(-50%)",
                      background:"#1C1C1E", color:"white", padding:"8px 14px", borderRadius:11,
                      fontSize:12, fontWeight:700, zIndex:1000, whiteSpace:"nowrap",
                      boxShadow:"0 4px 20px rgba(0,0,0,0.25)" }}>
          {toast}
        </div>
      )}

      {confirmDlg?.type==="del-user"   && <Confirm title="Foydalanuvchini o'chirish" msg={`"${confirmDlg.d.name}" ni o'chirasizmi?`} onOk={() => delUser(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type==="block-user" && <Confirm title={confirmDlg.d.is_blocked?"Blokni ochish":"Bloklash"} msg={`${confirmDlg.d.name}?`} okColor={confirmDlg.d.is_blocked?C.primaryDark:C.danger} onOk={() => block(confirmDlg.d)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type==="del-prod"   && <Confirm title="Mahsulotni o'chirish" msg={`"${confirmDlg.d.name}"?`} onOk={() => delProd(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type==="hide-prod"  && <Confirm title={confirmDlg.d.status==="hidden"?"Ko'rsatish":"Yashirish"} msg={`"${confirmDlg.d.name}"?`} okColor={confirmDlg.d.status==="hidden"?C.primaryDark:C.danger} onOk={() => hideShow(confirmDlg.d)} onCancel={() => setConfirmDlg(null)} />}
      {confirmDlg?.type==="rem-op"     && <Confirm title="Operatorni o'chirish" msg={`"${confirmDlg.d.name}"?`} onOk={() => removeOp(confirmDlg.d.id)} onCancel={() => setConfirmDlg(null)} />}
      {depositUser  && <AmountModal title="Pul qo'shish"  Icon={PlusCircle}  iconColor={C.primaryDark} user={depositUser}  onOk={(a) => deposit(depositUser,a)}  onCancel={() => setDepositUser(null)} />}
      {withdrawUser && <AmountModal title="Pul ayirish"   Icon={MinusCircle} iconColor={C.danger}      user={withdrawUser} onOk={(a) => withdraw(withdrawUser,a)} onCancel={() => setWithdrawUser(null)} maxAmount={Number(withdrawUser.balance||0)} />}
      {addOpDlg     && <AddOpModal onOk={addOp} onCancel={() => setAddOpDlg(false)} />}

      {/* Header */}
      <div style={{ background:"white", borderBottom:`1px solid ${C.border}`, padding:"13px 14px" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9, marginBottom:stats?10:0 }}>
          <button onClick={onBack}
            style={{ background:"none", border:"none", cursor:"pointer", padding:3,
                     display:"flex", color:C.textSub }}>
            <ChevronLeft size={21} />
          </button>
          <div style={{ fontSize:15, fontWeight:900, color:C.text, flex:1 }}>Operator Panel</div>
          <button onClick={() => loadTab(tab)}
            style={{ background:"none", border:"none", cursor:"pointer", padding:3,
                     display:"flex", color:C.textSub }}>
            <RefreshCw size={17} />
          </button>
        </div>

        {stats && (
          <div style={{ display:"flex", gap:5 }}>
            {[
              [Users,   stats.total_users,    "Foydalanuvchi"],
              [Package, stats.active_products, "Faol mahsulot"],
            ].map(([Icon, val, lbl]) => (
              <div key={lbl} style={{ flex:1, background:"#F0F9FF", borderRadius:9,
                                      padding:"6px 5px", textAlign:"center" }}>
                <Icon size={12} color={C.primaryDark} style={{ marginBottom:1 }} />
                <div style={{ fontSize:14, fontWeight:900, color:C.text }}>{val || 0}</div>
                <div style={{ fontSize:9, color:C.textMuted }}>{lbl}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={{ display:"flex", background:"white", borderBottom:`1px solid ${C.border}`,
                    position:"sticky", top:0, zIndex:10 }}>
        {TABS.filter(t => t.key !== "operators" || isMainOp).map(({ key, Icon, label }) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ flex:1, padding:"10px 2px", border:"none", background:"transparent",
                     cursor:"pointer", fontFamily:"inherit", fontSize:9, fontWeight:700,
                     color:tab===key?C.primaryDark:C.textMuted,
                     borderBottom:`2.5px solid ${tab===key?C.primaryDark:"transparent"}`,
                     display:"flex", flexDirection:"column", alignItems:"center", gap:3 }}>
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      <div style={{ padding:"11px 13px 0" }}>
        {err && (
          <div style={{ background:"#FFF1F0", borderRadius:9, padding:"9px 12px",
                        fontSize:12, color:C.danger, marginBottom:11 }}>
            {err}
          </div>
        )}
        {loading && (
          <div style={{ display:"flex", justifyContent:"center", padding:44 }}>
            <Loader2 size={26} color={C.primaryDark} style={{ animation:"spin 1s linear infinite" }} />
          </div>
        )}

        {/* MAHSULOTLAR */}
        {!loading && tab === "products" && (
          <div>
            <SearchBar value={prodQ} onChange={setProdQ} onSearch={() => loadTab("products")} />
            {prods.length === 0 ? (
              <EmptyState Icon={Package} text="Mahsulot topilmadi" />
            ) : prods.map(p => (
              <div key={p.id} style={{ background:"white", borderRadius:11, marginBottom:7,
                                       border:`1px solid ${C.border}`, padding:"10px 12px",
                                       display:"flex", alignItems:"center", gap:9 }}>
                {p.photo && (
                  <img src={p.photo} alt="" style={{ width:44, height:44, borderRadius:9, objectFit:"cover", flexShrink:0 }} />
                )}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:1 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:C.text, overflow:"hidden",
                                  textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{p.name}</div>
                    <Badge status={p.status} />
                  </div>
                  <div style={{ fontSize:10, color:C.primaryDark, fontWeight:700 }}>
                    1-9: {fmtPrice(p.price_1 || p.price)}
                    {p.price_10 ? ` · 10-50: ${fmtPrice(p.price_10)}` : ""}
                    {p.price_100 ? ` · 100+: ${fmtPrice(p.price_100)}` : ""}
                  </div>
                  {(p.dim_x || p.dim_y) && (
                    <div style={{ fontSize:10, color:C.textMuted }}>
                      📐 {[p.dim_x,p.dim_y,p.dim_z].filter(Boolean).join("×")} mm
                    </div>
                  )}
                  <div style={{ fontSize:10, color:C.textMuted }}>{p.viloyat}{p.tuman?", "+p.tuman:""}</div>
                </div>
                <div style={{ display:"flex", gap:5 }}>
                  <button onClick={() => setConfirmDlg({ type:"hide-prod", d:p })}
                    style={{ padding:"5px 8px", borderRadius:7, border:"none",
                             background:p.status==="hidden"?"#F0FDF4":"#F1F5F9",
                             color:p.status==="hidden"?"#16A34A":C.textSub, cursor:"pointer" }}>
                    {p.status==="hidden" ? <Eye size={14}/> : <EyeOff size={14}/>}
                  </button>
                  <button onClick={() => setConfirmDlg({ type:"del-prod", d:p })}
                    style={{ padding:"5px 8px", borderRadius:7, border:"none",
                             background:"#FEF2F2", color:C.danger, cursor:"pointer" }}>
                    <Trash2 size={14}/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* FOYDALANUVCHILAR */}
        {!loading && tab === "users" && (
          <div>
            <SearchBar value={userQ} onChange={setUserQ} onSearch={() => loadTab("users")} />
            {users.length === 0 ? (
              <EmptyState Icon={Users} text="Foydalanuvchi topilmadi" />
            ) : users.map(u => (
              <div key={u.id} style={{ background:"white", borderRadius:11, marginBottom:7,
                                       border:`1px solid ${u.is_blocked?"#FECACA":C.border}` }}>
                <div style={{ padding:"10px 12px" }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:2 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{u.name}</div>
                    {u.is_blocked && <Badge status="hidden" />}
                  </div>
                  <div style={{ fontSize:11, color:C.textSub }}>{fmtPhone(u.phone)}</div>
                  {u.telegram && <div style={{ fontSize:10, color:"#0088CC" }}>{u.telegram}</div>}
                  <div style={{ fontSize:10, color:C.textMuted, marginTop:1, marginBottom:5,
                                display:"flex", gap:9 }}>
                    <span style={{ fontFamily:"monospace" }}>ID: {String(u.id).slice(0,8)}…</span>
                    <span><Wallet size={9} style={{ verticalAlign:"middle" }} /> {Number(u.balance||0).toLocaleString()} so'm</span>
                    {u.tg_chat_id ? <span style={{ color:"#28A869" }}>✓ Bot</span> : <span style={{ color:C.danger }}>Bot yo'q</span>}
                  </div>
                  <div style={{ display:"flex", gap:5 }}>
                    <button onClick={() => setDepositUser(u)}
                      style={{ flex:1, padding:"5px 0", borderRadius:7, border:"1px solid #BBF7D0",
                               background:"#F0FDF4", color:"#16A34A", fontSize:10, fontWeight:700,
                               cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
                      <PlusCircle size={11}/> Qo'sh
                    </button>
                    <button onClick={() => setWithdrawUser(u)}
                      style={{ flex:1, padding:"5px 0", borderRadius:7, border:"1px solid #FECACA",
                               background:"#FEF2F2", color:"#DC2626", fontSize:10, fontWeight:700,
                               cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:2 }}>
                      <MinusCircle size={11}/> Ayir
                    </button>
                    <button onClick={() => setConfirmDlg({ type:"block-user", d:u })}
                      style={{ padding:"5px 8px", borderRadius:7, border:`1px solid ${C.border}`,
                               background:"white", cursor:"pointer",
                               color:u.is_blocked?"#16A34A":"#D97706" }}>
                      {u.is_blocked ? <Unlock size={13}/> : <Lock size={13}/>}
                    </button>
                    <button onClick={() => setConfirmDlg({ type:"del-user", d:u })}
                      style={{ padding:"5px 8px", borderRadius:7, border:"none",
                               background:"#FEF2F2", color:C.danger, cursor:"pointer" }}>
                      <Trash2 size={13}/>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* OPERATORLAR */}
        {!loading && tab === "operators" && isMainOp && (
          <div>
            <button onClick={() => setAddOpDlg(true)}
              style={{ width:"100%", padding:"10px", borderRadius:11, border:"none",
                       background:C.primaryDark, color:"white", fontSize:12, fontWeight:800,
                       cursor:"pointer", display:"flex", alignItems:"center",
                       justifyContent:"center", gap:6, marginBottom:11 }}>
              <UserPlus size={15}/> Operator qo'shish
            </button>
            {operators.length === 0 ? (
              <EmptyState Icon={Shield} text="Hali operator yo'q" />
            ) : operators.map(op => {
              const isMain = phoneCore(op.phone) === "331350206";
              return (
                <div key={op.id} style={{ background:"white", borderRadius:11, marginBottom:7,
                                           border:`1px solid ${C.border}`, padding:"10px 12px",
                                           display:"flex", alignItems:"center", gap:9 }}>
                  <Shield size={17} color={C.primaryDark} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, fontWeight:800, color:C.text }}>{op.name}</div>
                    <div style={{ fontSize:10, color:C.textSub }}>{fmtPhone(op.phone)}</div>
                    <div style={{ fontSize:9, fontFamily:"monospace", color:C.textMuted }}>
                      ID: {String(op.id).slice(0,8)}…
                    </div>
                  </div>
                  {isMain
                    ? <span style={{ fontSize:9, padding:"2px 7px", borderRadius:6,
                                     background:"#EFF6FF", color:"#2563EB", fontWeight:700 }}>Bosh</span>
                    : <button onClick={() => setConfirmDlg({ type:"rem-op", d:op })}
                        style={{ padding:"5px 9px", borderRadius:7, border:"none",
                                 background:"#FEF2F2", color:C.danger, cursor:"pointer" }}>
                        <UserMinus size={14}/>
                      </button>
                  }
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ Icon, text }) {
  return (
    <div style={{ textAlign:"center", padding:"44px 18px", color:C.textMuted }}>
      <Icon size={34} color={C.border} style={{ marginBottom:9 }} />
      <div style={{ fontSize:12, fontWeight:700 }}>{text}</div>
    </div>
  );
}

function SearchBar({ value, onChange, onSearch }) {
  return (
    <div style={{ position:"relative", marginBottom:9 }}>
      <Search size={13} color={C.textMuted}
        style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)" }} />
      <input value={value} onChange={e => onChange(e.target.value)}
        onKeyDown={e => e.key==="Enter" && onSearch()}
        placeholder="Qidirish..."
        style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px 8px 30px",
                 borderRadius:9, border:`1.5px solid ${C.border}`, fontSize:12,
                 background:"white", color:C.text, outline:"none", fontFamily:"inherit" }} />
    </div>
  );
}
