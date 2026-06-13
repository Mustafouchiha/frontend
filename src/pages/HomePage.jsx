import { useState, useEffect, useRef } from "react";
import { Pill, BtnPrimary, BtnGhost, Sheet, Lbl, TInput } from "../components/UI";
import PCard from "../components/ProductCard";
import LocIcon from "../components/LocIcon";
import PhotoUpload from "../components/PhotoUpload";
import StepBar from "../components/StepBar";
import { C, COND, UZ, CATS, CAT_ICO, EMPTY_FORM, DIM_PRESETS } from "../constants";
import { productsAPI, authAPI } from "../services/api";
import Logo from "../components/Logo";
import {
  Bell, Search, SearchX, Image as ImageIcon,
  Check, Loader2, CheckCircle, Package,
  Home, Plus, Camera, AlertCircle, Rocket,
  ChevronDown, X, ArrowLeft, ArrowRight,
  Ruler, TrendingDown,
} from "lucide-react";

const BOT_LINK = "https://t.me/ReNarx_admin";

function priceTier(p, qty) {
  const n = Number(qty) || 1;
  if (n >= 100 && p.price_100) return Number(p.price_100);
  if (n >= 10  && p.price_10)  return Number(p.price_10);
  return Number(p.price_1 || p.price || 0);
}

function fmtPrice(n) {
  return Number(n || 0).toLocaleString("uz-UZ") + " so'm";
}

function dimStr(p) {
  const parts = [p.dim_x, p.dim_y, p.dim_z].filter(Boolean);
  return parts.length ? parts.join("×") + " mm" : "";
}

export default function HomePage({
  user, products, setProducts, offers, setOffers,
  onNavChange, homeAction, setHomeAction,
  onProductAdded, onDelete, isOperator = false, loggedIn, onRequireAuth,
}) {
  const [search,        setSearch]        = useState("");
  const [activeCats,    setActiveCats]    = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [showNotifs,    setShowNotifs]    = useState(false);
  const [showLoc,       setShowLoc]       = useState(false);
  const [fVil,          setFVil]          = useState("");
  const [fTum,          setFTum]          = useState("");
  const [tVil,          setTVil]          = useState("");
  const [tTum,          setTTum]          = useState("");
  const [showAdd,       setShowAdd]       = useState(false);
  const [step,          setStep]          = useState(1);
  const [addImgIdx,     setAddImgIdx]     = useState(0);
  const [form,          setForm]          = useState(EMPTY_FORM);
  const [submitting,    setSubmitting]    = useState(false);
  const [photoIdx,      setPhotoIdx]      = useState(0);
  const [lightbox,      setLightbox]      = useState(null);
  const [lbZoom,        setLbZoom]        = useState(1);
  const [showDimFilter, setShowDimFilter] = useState(false);
  const [dimFilter,     setDimFilter]     = useState({ x_min:"", x_max:"", y_min:"", y_max:"" });
  const [similarProds,  setSimilarProds]  = useState([]);
  const [qtyForPrice,   setQtyForPrice]   = useState(1);
  const [postId,        setPostId]        = useState(null);
  const lbTouch = useRef({ count:0, startX:0, startDist:0, startZoom:1 });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPostId = urlParams.get('postId');
    if (urlPostId) setPostId(urlPostId);
  }, []);

  if (postId) {
    try {
      const OperatorPostView = require('../OperatorPostView').default;
      return <OperatorPostView postId={postId} onClose={() => setPostId(null)} />;
    } catch { setPostId(null); }
  }

  const openLb  = (photos, idx) => { setLightbox({ photos, idx }); setLbZoom(1); };
  const closeLb = () => { setLightbox(null); setLbZoom(1); };
  const lbPrev  = () => setLightbox(lb => ({ ...lb, idx:(lb.idx-1+lb.photos.length)%lb.photos.length }));
  const lbNext  = () => setLightbox(lb => ({ ...lb, idx:(lb.idx+1)%lb.photos.length }));

  const lbTouchStart = (e) => {
    lbTouch.current.count = e.touches.length;
    if (e.touches.length === 1) lbTouch.current.startX = e.touches[0].clientX;
    else if (e.touches.length === 2) {
      lbTouch.current.startDist = Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);
      lbTouch.current.startZoom = lbZoom;
    }
  };
  const lbTouchMove = (e) => {
    if (e.touches.length === 2) {
      const d = Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);
      setLbZoom(z => Math.min(5, Math.max(1, lbTouch.current.startZoom*d/lbTouch.current.startDist)));
    }
  };
  const lbTouchEnd = (e) => {
    if (lbTouch.current.count === 1 && lbZoom <= 1.1) {
      const dx = e.changedTouches[0].clientX - lbTouch.current.startX;
      if (dx < -60) lbNext(); else if (dx > 60) lbPrev();
    }
    lbTouch.current.count = 0;
  };

  const f = (key) => (val) => setForm(prev => ({ ...prev, [key]: val }));

  const hasDimFilter = dimFilter.x_min || dimFilter.x_max || dimFilter.y_min || dimFilter.y_max;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const catOk  = activeCats.length === 0 || activeCats.includes(p.category);
    const locOk  = (!fVil || p.viloyat === fVil) && (!fTum || p.tuman === fTum);
    const nameOk = !search || p.name.toLowerCase().includes(q)
                || (p.viloyat||"").toLowerCase().includes(q)
                || (p.tuman||"").toLowerCase().includes(q);
    let dimOk = true;
    if (dimFilter.x_min && p.dim_x) dimOk = dimOk && p.dim_x >= Number(dimFilter.x_min);
    if (dimFilter.x_max && p.dim_x) dimOk = dimOk && p.dim_x <= Number(dimFilter.x_max);
    if (dimFilter.y_min && p.dim_y) dimOk = dimOk && p.dim_y >= Number(dimFilter.y_min);
    if (dimFilter.y_max && p.dim_y) dimOk = dimOk && p.dim_y <= Number(dimFilter.y_max);
    return catOk && locOk && nameOk && dimOk;
  });

  const showSimilar = filtered.length === 0 && hasDimFilter && similarProds.length > 0;

  useEffect(() => {
    if (filtered.length === 0 && hasDimFilter) {
      const dim_x = dimFilter.x_min
        ? (Number(dimFilter.x_min) + Number(dimFilter.x_max || dimFilter.x_min)) / 2 : null;
      const dim_y = dimFilter.y_min
        ? (Number(dimFilter.y_min) + Number(dimFilter.y_max || dimFilter.y_min)) / 2 : null;
      productsAPI.getSimilar({ dim_x, dim_y, category: activeCats[0] })
        .then(setSimilarProds).catch(() => {});
    } else {
      setSimilarProds([]);
    }
  }, [filtered.length, hasDimFilter]);

  const openSelected = (p) => { setSelected(p); setPhotoIdx(0); setQtyForPrice(1); };
  const openLoc  = () => { setTVil(fVil); setTTum(fTum); setShowLoc(true); };
  const applyLoc = () => { setFVil(tVil); setFTum(tVil?tTum:""); setShowLoc(false); };
  const clearLoc = () => { setTVil(""); setTTum(""); setFVil(""); setFTum(""); setShowLoc(false); };
  const requireAuth = () => { if (onRequireAuth) onRequireAuth(); else onNavChange?.("login"); };
  const openAdd  = () => {
    if (!isOperator) return;
    setForm(EMPTY_FORM); setStep(1); setAddImgIdx(0); setShowAdd(true);
  };
  const closeAdd = () => { setShowAdd(false); setStep(1); setForm(EMPTY_FORM); setAddImgIdx(0); };

  useEffect(() => {
    if (homeAction === "openAdd") { openAdd(); setHomeAction(null); }
  }, [homeAction]);

  const anySheetOpen = showLoc || !!selected || showNotifs || showAdd || showDimFilter;

  const submitProd = async () => {
    if (!form.name || !form.price_1 || !form.qty || !form.viloyat || !form.photos?.length) return;
    setSubmitting(true);
    try {
      const newProd = await productsAPI.create({
        ...form,
        photo:     form.photos[0],
        photos:    form.photos,
        price_1:   parseInt(form.price_1),
        price_10:  parseInt(form.price_10  || form.price_1),
        price_100: parseInt(form.price_100 || form.price_1),
        qty:       parseInt(form.qty),
        dim_x: form.dim_x ? Number(form.dim_x) : null,
        dim_y: form.dim_y ? Number(form.dim_y) : null,
        dim_z: form.dim_z ? Number(form.dim_z) : null,
        mahalla: form.mahalla || "",
      });
      if (onProductAdded) onProductAdded(newProd);
      closeAdd();
    } catch (e) { alert(e.message); }
    finally { setSubmitting(false); }
  };

  const myNotifs    = offers || [];
  const isLocOn     = !!fVil;
  const locLabel    = fVil ? (fTum||fVil) : "Joylashuv";
  const canStep2    = form.photos?.length > 0;
  const canStep3    = form.name && form.price_1 && form.qty;
  const canStep4    = !!form.viloyat;


  return (
    <div style={{ fontFamily:"'Nunito','Segoe UI',sans-serif", background:C.bg,
                  minHeight:"100vh", paddingBottom:84, maxWidth:430,
                  margin:"0 auto", position:"relative",
                  overflowY:anySheetOpen?"hidden":"auto",
                  height:anySheetOpen?"100vh":"auto" }}>

      {/* HEADER */}
      <div style={{ padding:"13px 15px 9px", background:"rgba(255,255,255,0.95)",
                    backdropFilter:"blur(14px)", position:"sticky", top:0, zIndex:20,
                    borderBottom:`1px solid ${C.border}`, boxShadow:"0 1px 8px rgba(0,0,0,0.04)" }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:9 }}>
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <Logo size={28} />
              <span style={{ fontSize:18, fontWeight:900, color:C.text, letterSpacing:"-0.4px" }}>ReNarx</span>
            </div>
            <div style={{ fontSize:10, color:C.textMuted, marginTop:1 }}>Qurilish materiallari do'koni</div>
          </div>
          <div style={{ display:"flex", gap:7, alignItems:"center" }}>
            <a href={BOT_LINK} target="_blank" rel="noopener noreferrer"
              style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 9px",
                       borderRadius:9, background:"#E0F2FE", border:`1.5px solid ${C.primaryBorder}`,
                       color:C.primaryDark, fontSize:10, fontWeight:700, textDecoration:"none" }}>
              📱 Bot
            </a>
            <button onClick={openLoc}
              style={{ display:"flex", alignItems:"center", gap:4, padding:"5px 9px",
                       borderRadius:9, border:`1.5px solid ${isLocOn?C.primary:C.border}`,
                       background:isLocOn?C.primaryLight:C.card,
                       color:isLocOn?C.primaryDark:C.textSub,
                       fontSize:10, fontWeight:700, cursor:"pointer", fontFamily:"inherit",
                       maxWidth:108, overflow:"hidden" }}>
              <LocIcon size={11} color={isLocOn ? C.primaryDark : C.textSub}/>
              <span style={{ overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", flex:1 }}>{locLabel}</span>
              <ChevronDown size={10} style={{ flexShrink:0 }} />
            </button>
          </div>
        </div>

        <div style={{ display:"flex", gap:7 }}>
          <div style={{ position:"relative", flex:1 }}>
            <Search size={13} style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", opacity:0.4 }} />
            <input placeholder="Mahsulot, shahar, tuman..." value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width:"100%", boxSizing:"border-box", padding:"8px 10px 8px 32px",
                       borderRadius:11, border:`1.5px solid ${C.border}`, background:C.bg,
                       fontSize:12, color:C.text, outline:"none", fontFamily:"inherit" }}
              onFocus={e=>e.target.style.borderColor=C.primary}
              onBlur={e=>e.target.style.borderColor=C.border}
            />
          </div>
          <button onClick={() => setShowDimFilter(true)}
            style={{ padding:"0 11px", borderRadius:11,
                     border:`1.5px solid ${hasDimFilter?C.primary:C.border}`,
                     background:hasDimFilter?C.primaryLight:C.card,
                     color:hasDimFilter?C.primaryDark:C.textSub,
                     cursor:"pointer", display:"flex", alignItems:"center", gap:4,
                     fontSize:10, fontWeight:700, fontFamily:"inherit", whiteSpace:"nowrap" }}>
            <Ruler size={13} /> O'lcham
          </button>
        </div>
      </div>

      {/* Category pills */}
      <div style={{ padding:"7px 15px", display:"flex", flexWrap:"wrap", gap:5 }}>
        {CATS.map(cat => {
          if (cat === "Barchasi") return (
            <Pill key={cat} active={activeCats.length===0} onClick={() => setActiveCats([])}>
              {CAT_ICO["Barchasi"]} Barchasi
            </Pill>
          );
          const isActive = activeCats.includes(cat);
          return (
            <Pill key={cat} active={isActive}
              onClick={() => setActiveCats(prev => prev.includes(cat) ? prev.filter(c=>c!==cat) : [...prev, cat])}>
              {CAT_ICO[cat]} {cat}
            </Pill>
          );
        })}
      </div>

      {/* Active filters */}
      {(isLocOn || hasDimFilter) && (
        <div style={{ padding:"0 15px 6px", display:"flex", gap:6, flexWrap:"wrap" }}>
          {isLocOn && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:4,
                          background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                          borderRadius:18, padding:"3px 9px",
                          fontSize:10, color:C.primaryDark, fontWeight:700 }}>
              <LocIcon size={9} color={C.primaryDark}/> {fVil}{fTum?` › ${fTum}`:""}
              <X size={9} onClick={clearLoc} style={{ cursor:"pointer", opacity:0.65 }} />
            </div>
          )}
          {hasDimFilter && (
            <div style={{ display:"inline-flex", alignItems:"center", gap:4,
                          background:"#F0FDF4", border:"1px solid #BBF7D0",
                          borderRadius:18, padding:"3px 9px",
                          fontSize:10, color:"#16A34A", fontWeight:700 }}>
              <Ruler size={9} />
              {dimFilter.x_min && `X:${dimFilter.x_min}${dimFilter.x_max?"-"+dimFilter.x_max:""}`}
              {dimFilter.y_min && ` Y:${dimFilter.y_min}${dimFilter.y_max?"-"+dimFilter.y_max:""}`}
              <X size={9} onClick={() => setDimFilter({x_min:"",x_max:"",y_min:"",y_max:""})} style={{ cursor:"pointer", opacity:0.65 }} />
            </div>
          )}
        </div>
      )}

      <div style={{ padding:"2px 15px 8px" }}>
        <span style={{ fontSize:11, color:C.textMuted, fontWeight:600 }}>
          {filtered.length} ta mahsulot
        </span>
      </div>

      {/* Products */}
      <div style={{ padding:"0 15px", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        {filtered.map(p => <PCard key={p.id} p={p} isOwn={false} onClick={() => openSelected(p)} />)}
      </div>

      {/* Similar items */}
      {showSimilar && (
        <div style={{ padding:"10px 15px 0" }}>
          <div style={{ fontSize:12, fontWeight:800, color:"#A16207", marginBottom:8,
                        display:"flex", alignItems:"center", gap:5 }}>
            <TrendingDown size={13}/> Aynan topilmadi — yaqin o'lchamdagi mahsulotlar:
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            {similarProds.map(p => <PCard key={p.id} p={p} isOwn={false} onClick={() => openSelected(p)} />)}
          </div>
        </div>
      )}

      {filtered.length===0 && !showSimilar && (
        <div style={{ textAlign:"center", padding:"54px 20px", color:C.textMuted }}>
          <SearchX size={42} color={C.textMuted} style={{ opacity:0.5, display:"block", margin:"0 auto 10px" }} />
          <div style={{ fontSize:14, fontWeight:700 }}>Hech narsa topilmadi</div>
          <div style={{ fontSize:11, marginTop:4 }}>Filtr yoki qidiruvni o'zgartiring</div>
        </div>
      )}


      {/* ── SHEETS ── */}

      {/* LOCATION */}
      {showLoc && (
        <Sheet onClose={() => setShowLoc(false)}>
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11 }}>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
              <LocIcon size={13} color={C.primaryDark}/> Joylashuv filtri
            </span>
          </div>
          <Lbl>Viloyat / Shahar</Lbl>
          <div style={{ display:"flex", flexWrap:"wrap", gap:6, marginBottom:13 }}>
            {Object.keys(UZ).map(v => (
              <Pill key={v} active={tVil===v} onClick={() => { setTVil(tVil===v?"":v); setTTum(""); }}>{v}</Pill>
            ))}
          </div>
          {tVil && (
            <>
              <Lbl>Tuman — {tVil}</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:13 }}>
                {UZ[tVil].map(t => (
                  <Pill key={t} active={tTum===t} accent onClick={() => setTTum(tTum===t?"":t)}>{t}</Pill>
                ))}
              </div>
            </>
          )}
          <div style={{ display:"flex", gap:8 }}>
            <BtnGhost onClick={clearLoc}>Tozalash</BtnGhost>
            <BtnPrimary onClick={applyLoc}><Check size={13} /> Qo'llash</BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* DIM FILTER */}
      {showDimFilter && (
        <Sheet onClose={() => setShowDimFilter(false)}>
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11,
                        display:"flex", alignItems:"center", gap:5 }}>
            <Ruler size={13} color={C.primaryDark}/> O'lcham oraliq filtri (mm)
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:9, marginBottom:9 }}>
            <div><Lbl>X kenglik (min)</Lbl>
              <TInput type="number" placeholder="0" value={dimFilter.x_min}
                onChange={v => setDimFilter(d => ({...d, x_min:v}))} /></div>
            <div><Lbl>X kenglik (max)</Lbl>
              <TInput type="number" placeholder="999" value={dimFilter.x_max}
                onChange={v => setDimFilter(d => ({...d, x_max:v}))} /></div>
            <div><Lbl>Y balandlik (min)</Lbl>
              <TInput type="number" placeholder="0" value={dimFilter.y_min}
                onChange={v => setDimFilter(d => ({...d, y_min:v}))} /></div>
            <div><Lbl>Y balandlik (max)</Lbl>
              <TInput type="number" placeholder="999" value={dimFilter.y_max}
                onChange={v => setDimFilter(d => ({...d, y_max:v}))} /></div>
          </div>
          <div style={{ fontSize:10, color:C.textMuted, marginBottom:12 }}>
            💡 Aynan mos kelmasa — yaqin o'lchamli mahsulotlar ham ko'rsatiladi
          </div>
          <div style={{ display:"flex", gap:8 }}>
            <BtnGhost onClick={() => { setDimFilter({x_min:"",x_max:"",y_min:"",y_max:""}); setShowDimFilter(false); }}>Tozalash</BtnGhost>
            <BtnPrimary onClick={() => setShowDimFilter(false)}><Check size={13} /> Qo'llash</BtnPrimary>
          </div>
        </Sheet>
      )}

      {/* PRODUCT DETAIL */}
      {selected && (() => {
        const selPhotos = (selected.photos?.length ? selected.photos : (selected.photo ? [selected.photo] : []));
        const hasManyPhotos = selPhotos.length > 1;
        const showDims = dimStr(selected);
        const curPrice = priceTier(selected, qtyForPrice);

        return (
          <Sheet onClose={() => setSelected(null)} maxH="90vh">
            <div style={{ position:"relative", width:"100%", height:185, borderRadius:14, overflow:"hidden",
                          background:C.primaryLight, marginBottom:12,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              {selPhotos.length > 0
                ? <img src={selPhotos[photoIdx]} alt={selected.name}
                    onClick={() => openLb(selPhotos, photoIdx)}
                    style={{ width:"100%", height:"100%", objectFit:"cover", cursor:"zoom-in" }} />
                : <ImageIcon size={52} color={C.primaryBorder} style={{ opacity:0.4 }} />
              }
              {hasManyPhotos && (
                <>
                  <button onClick={() => setPhotoIdx(i => (i-1+selPhotos.length)%selPhotos.length)}
                    style={{ position:"absolute", left:7, top:"50%", transform:"translateY(-50%)",
                             width:28, height:28, borderRadius:"50%", border:"none",
                             background:"rgba(0,0,0,0.45)", color:"white", cursor:"pointer",
                             display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>‹</button>
                  <button onClick={() => setPhotoIdx(i => (i+1)%selPhotos.length)}
                    style={{ position:"absolute", right:7, top:"50%", transform:"translateY(-50%)",
                             width:28, height:28, borderRadius:"50%", border:"none",
                             background:"rgba(0,0,0,0.45)", color:"white", cursor:"pointer",
                             display:"flex", alignItems:"center", justifyContent:"center", fontSize:14 }}>›</button>
                  <div style={{ position:"absolute", bottom:7, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
                    {selPhotos.map((_, i) => (
                      <div key={i} onClick={() => setPhotoIdx(i)}
                        style={{ width:i===photoIdx?14:5, height:5, borderRadius:3,
                                 background:i===photoIdx?"white":"rgba(255,255,255,0.5)",
                                 cursor:"pointer", transition:"all 0.2s" }} />
                    ))}
                  </div>
                </>
              )}
            </div>

            <div style={{ fontSize:17, fontWeight:900, color:C.text, marginBottom:5 }}>{selected.name}</div>

            {showDims && (
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginBottom:9,
                            background:C.primaryLight, border:`1px solid ${C.primaryBorder}`,
                            borderRadius:9, padding:"3px 9px" }}>
                <Ruler size={11} color={C.primaryDark} />
                <span style={{ fontSize:11, fontWeight:700, color:C.primaryDark }}>{showDims}</span>
              </div>
            )}

            {/* Narx darajalari */}
            <div style={{ background:C.bg, borderRadius:12, padding:"10px 12px", marginBottom:10,
                          border:`1px solid ${C.border}` }}>
              <div style={{ fontSize:10, fontWeight:800, color:C.textSub, marginBottom:7,
                            textTransform:"uppercase", letterSpacing:0.5 }}>Narx darajalari</div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:5 }}>
                {[
                  ["1–9 dona",   selected.price_1],
                  ["10–50 dona", selected.price_10],
                  ["100+ dona",  selected.price_100],
                ].map(([lbl, pr]) => (
                  <div key={lbl} style={{ background:C.card, borderRadius:9, padding:"7px 5px", textAlign:"center",
                                          border:`1px solid ${C.border}` }}>
                    <div style={{ fontSize:9, color:C.textMuted }}>{lbl}</div>
                    <div style={{ fontSize:10, fontWeight:800, color:C.primaryDark, marginTop:2 }}>
                      {fmtPrice(pr)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Qancha olasiz */}
            <div style={{ background:C.primaryLight, borderRadius:12, padding:"9px 12px",
                          marginBottom:10, border:`1px solid ${C.primaryBorder}` }}>
              <div style={{ fontSize:10, color:C.textSub, marginBottom:5 }}>Qancha olasiz?</div>
              <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                <input type="number" min="1" value={qtyForPrice}
                  onChange={e => setQtyForPrice(Math.max(1, Number(e.target.value)))}
                  style={{ width:64, padding:"5px 9px", borderRadius:9, border:`1.5px solid ${C.border}`,
                           fontSize:14, fontWeight:700, textAlign:"center", outline:"none", fontFamily:"inherit" }} />
                <span style={{ fontSize:11, color:C.textSub }}>{selected.unit}</span>
                <div style={{ fontSize:14, fontWeight:900, color:C.primaryDark, marginLeft:"auto" }}>
                  = {fmtPrice(curPrice * qtyForPrice)}
                </div>
              </div>
            </div>

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7, marginBottom:12 }}>
              {[
                ["Miqdor",   `${selected.qty} ${selected.unit}`],
                ["Toifa",    `${CAT_ICO[selected.category]||""} ${selected.category}`],
                ["Holat",    selected.condition],
                ["Manzil",   `${selected.viloyat}${selected.tuman?", "+selected.tuman:""}`],
              ].map(([l,v]) => (
                <div key={l} style={{ background:C.bg, borderRadius:9, padding:"7px 9px", border:`1px solid ${C.border}` }}>
                  <div style={{ fontSize:9, color:C.textMuted }}>{l}</div>
                  <div style={{ fontSize:11, fontWeight:700, color:C.text, marginTop:1 }}>{v}</div>
                </div>
              ))}
            </div>

            <BtnGhost onClick={() => setSelected(null)} fullWidth>Yopish</BtnGhost>
          </Sheet>
        );
      })()}

      {/* NOTIFICATIONS */}
      {showNotifs && (
        <Sheet onClose={() => setShowNotifs(false)} maxH="85vh">
          <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:14,
                        display:"flex", alignItems:"center", gap:6 }}>
            <Bell size={14} color={C.primaryDark} /> Xabarnomalar
          </div>
          <div style={{ textAlign:"center", padding:"36px 16px", color:C.textMuted }}>
            <Bell size={38} color={C.textMuted} style={{ opacity:0.3, display:"block", margin:"0 auto 8px" }} />
            <div style={{ fontSize:13, fontWeight:700 }}>Hali xabarnoma yo'q</div>
          </div>
        </Sheet>
      )}

      {/* ADD PRODUCT (operator only) */}
      {showAdd && isOperator && (
        <Sheet onClose={closeAdd} maxH="95vh">
          <StepBar current={step} />

          {step===1 && (
            <>
              <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11,
                            display:"flex", alignItems:"center", gap:5 }}>
                <Camera size={14} color={C.primaryDark} /> Mahsulot rasmi
              </div>
              <PhotoUpload photos={form.photos} onPhotos={f("photos")} required />
              {!form.photos?.length && (
                <div style={{ fontSize:11, color:C.danger, marginBottom:9, fontWeight:600,
                              display:"flex", alignItems:"center", gap:4 }}>
                  <AlertCircle size={12} /> Rasm yuklash majburiy
                </div>
              )}
              <BtnPrimary onClick={() => canStep2 && setStep(2)} disabled={!canStep2} fullWidth>
                Davom <ArrowRight size={13} />
              </BtnPrimary>
            </>
          )}

          {step===2 && (
            <>
              <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11,
                            display:"flex", alignItems:"center", gap:5 }}>
                <Package size={14} color={C.primaryDark} /> Mahsulot ma'lumoti
              </div>

              <Lbl>Nom *</Lbl>
              <TInput placeholder="Masalan: Yog'och taxta 50x100" value={form.name} onChange={f("name")} />

              <Lbl>Kategoriya</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:11 }}>
                {["yog'och","gipskarton","reka taxtasi","poli laga","metall","g'isht","boshqa"].map(c => (
                  <Pill key={c} active={form.category===c} onClick={()=>f("category")(c)}>
                    {CAT_ICO[c]} {c}
                  </Pill>
                ))}
              </div>

              <Lbl>Holati</Lbl>
              <div style={{ display:"flex", gap:5, marginBottom:11 }}>
                {["A'lo","Yaxshi","O'rta"].map(c => { const cc=COND[c]; return (
                  <button key={c} onClick={()=>f("condition")(c)}
                    style={{ flex:1, padding:"7px 4px", borderRadius:9,
                             border:`1.5px solid ${form.condition===c?cc.text:C.border}`,
                             background:form.condition===c?cc.bg:C.card,
                             color:form.condition===c?cc.text:C.textSub,
                             fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                    {c}
                  </button>
                );})}              </div>

              {/* O'lchamlar */}
              <Lbl>O'lchamlar (mm) — ixtiyoriy</Lbl>
              {DIM_PRESETS[form.category]?.length > 0 && (
                <div style={{ display:"flex", flexWrap:"wrap", gap:4, marginBottom:7 }}>
                  {DIM_PRESETS[form.category].map(preset => {
                    const parts = preset.split("x");
                    const isActive = String(form.dim_x)===parts[0] && String(form.dim_y)===parts[1];
                    return (
                      <button key={preset} onClick={() => {
                        f("dim_x")(parts[0]||""); f("dim_y")(parts[1]||""); f("dim_z")(parts[2]||"");
                      }}
                        style={{ padding:"3px 9px", borderRadius:18,
                                 border:`1.5px solid ${isActive?C.primaryDark:C.border}`,
                                 background:isActive?C.primaryLight:C.card,
                                 color:isActive?C.primaryDark:C.textSub,
                                 fontSize:11, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
                        {preset}
                      </button>
                    );
                  })}
                </div>
              )}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7, marginBottom:11 }}>
                <div><Lbl>X kenglik</Lbl><TInput type="number" placeholder="50" value={form.dim_x} onChange={f("dim_x")} /></div>
                <div><Lbl>Y balandlik</Lbl><TInput type="number" placeholder="100" value={form.dim_y} onChange={f("dim_y")} /></div>
                <div><Lbl>Z uzunlik</Lbl><TInput type="number" placeholder="3000" value={form.dim_z} onChange={f("dim_z")} /></div>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginBottom:4 }}>
                <div><Lbl>Miqdori *</Lbl><TInput type="number" min="0" placeholder="100" value={form.qty} onChange={f("qty")} /></div>
                <div>
                  <Lbl>O'lchov</Lbl>
                  <select value={form.unit} onChange={e=>f("unit")(e.target.value)}
                    style={{ width:"100%", padding:"8px 9px", borderRadius:10,
                             border:`1.5px solid ${C.border}`, fontSize:12, color:C.text,
                             fontFamily:"inherit", outline:"none", background:C.bg, marginBottom:11 }}>
                    {["dona","kg","m²","m","m³","ton"].map(u => <option key={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Narx darajalari */}
              <Lbl>Narx darajalari (so'm) *</Lbl>
              <div style={{ background:C.bg, borderRadius:11, padding:"9px", marginBottom:11,
                            border:`1px solid ${C.border}` }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:7 }}>
                  {[["1–9 dona","price_1","50000",true],
                    ["10–50 dona","price_10","45000",false],
                    ["100+ dona","price_100","40000",false]].map(([lbl,key,ph,req]) => (
                    <div key={key}>
                      <div style={{ fontSize:9, color:C.textMuted, marginBottom:3 }}>{lbl}{req?" *":""}</div>
                      <TInput type="number" min="0" placeholder={ph} value={form[key]} onChange={f(key)} />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize:9, color:C.textMuted, marginTop:5 }}>
                  💡 Bo'sh qolsa 1-9 narhi ishlatiladi
                </div>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <BtnGhost onClick={() => setStep(1)}><ArrowLeft size={13} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep3 && setStep(3)} disabled={!canStep3}>
                  Davom <ArrowRight size={13} />
                </BtnPrimary>
              </div>
            </>
          )}

          {step===3 && (
            <>
              <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11 }}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:5 }}>
                  <LocIcon size={13} color={C.primaryDark}/> Joylashuv
                </span>
              </div>
              <Lbl>Viloyat / Shahar *</Lbl>
              <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:11 }}>
                {Object.keys(UZ).map(v => (
                  <Pill key={v} active={form.viloyat===v}
                    onClick={() => { f("viloyat")(v); f("tuman")(""); f("mahalla")(""); }}>{v}</Pill>
                ))}
              </div>
              {form.viloyat && (
                <>
                  <Lbl>Tuman — {form.viloyat}</Lbl>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:5, marginBottom:11 }}>
                    {UZ[form.viloyat].map(t => (
                      <Pill key={t} active={form.tuman===t} accent onClick={() => f("tuman")(t)}>{t}</Pill>
                    ))}
                  </div>
                </>
              )}
              <Lbl>Mahalla (ixtiyoriy)</Lbl>
              <TInput placeholder="Mahalla nomi" value={form.mahalla || ""} onChange={f("mahalla")} />
              <div style={{ display:"flex", gap:8 }}>
                <BtnGhost onClick={() => setStep(2)}><ArrowLeft size={13} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={() => canStep4 && setStep(4)} disabled={!canStep4}>
                  Davom <ArrowRight size={13} />
                </BtnPrimary>
              </div>
            </>
          )}

          {step===4 && (
            <>
              <div style={{ fontSize:14, fontWeight:800, color:C.text, marginBottom:11,
                            display:"flex", alignItems:"center", gap:5 }}>
                <CheckCircle size={14} color={C.primaryDark} /> Tasdiqlash
              </div>

              <div style={{ background:C.primaryLight, borderRadius:14, overflow:"hidden",
                            marginBottom:12, border:`1px solid ${C.primaryBorder}` }}>
                {form.photos[0] && (
                  <div style={{ position:"relative", width:"100%", height:150, overflow:"hidden", background:"#000" }}>
                    <img src={form.photos[addImgIdx]} alt="preview"
                      style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }} />
                    {form.photos.length > 1 && (<>
                      <button onClick={() => setAddImgIdx(i => (i-1+form.photos.length)%form.photos.length)}
                        style={{ position:"absolute", left:6, top:"50%", transform:"translateY(-50%)",
                                 width:24, height:24, borderRadius:"50%", border:"none",
                                 background:"rgba(0,0,0,0.45)", color:"white", fontSize:13,
                                 cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                      <button onClick={() => setAddImgIdx(i => (i+1)%form.photos.length)}
                        style={{ position:"absolute", right:6, top:"50%", transform:"translateY(-50%)",
                                 width:24, height:24, borderRadius:"50%", border:"none",
                                 background:"rgba(0,0,0,0.45)", color:"white", fontSize:13,
                                 cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                    </>)}
                  </div>
                )}
                <div style={{ padding:"9px 12px" }}>
                  <div style={{ fontSize:14, fontWeight:900, color:C.text }}>{form.name}</div>
                  {(form.dim_x || form.dim_y) && (
                    <div style={{ fontSize:11, color:C.primaryDark, fontWeight:700, marginTop:1 }}>
                      📐 {[form.dim_x,form.dim_y,form.dim_z].filter(Boolean).join("×")} mm
                    </div>
                  )}
                  <div style={{ fontSize:11, color:C.primaryDark, fontWeight:700, marginTop:1 }}>
                    1–9: {fmtPrice(form.price_1)} · 10–50: {fmtPrice(form.price_10||form.price_1)} · 100+: {fmtPrice(form.price_100||form.price_1)}
                  </div>
                  <div style={{ fontSize:10, color:C.textSub, marginTop:1 }}>
                    {form.viloyat}{form.tuman?` › ${form.tuman}`:""}
                  </div>
                </div>
              </div>

              <div style={{ display:"flex", gap:8 }}>
                <BtnGhost onClick={() => setStep(3)}><ArrowLeft size={13} /> Orqaga</BtnGhost>
                <BtnPrimary onClick={submitProd} disabled={submitting}>
                  {submitting
                    ? <><Loader2 size={13} className="spin" /> Yuklanmoqda...</>
                    : <><Rocket size={13} /> Qo'shish!</>
                  }
                </BtnPrimary>
              </div>
            </>
          )}
        </Sheet>
      )}

      {/* LIGHTBOX */}
      {lightbox && (
        <div style={{ position:"fixed", inset:0, background:"black", zIndex:500,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      userSelect:"none", touchAction:"none" }}
          onTouchStart={lbTouchStart} onTouchMove={lbTouchMove} onTouchEnd={lbTouchEnd}>
          <button onClick={closeLb}
            style={{ position:"absolute", top:14, right:14, width:36, height:36,
                     borderRadius:"50%", border:"none", background:"rgba(255,255,255,0.18)",
                     color:"white", cursor:"pointer", zIndex:6,
                     display:"flex", alignItems:"center", justifyContent:"center" }}>
            <X size={17} />
          </button>
          <img src={lightbox.photos[lightbox.idx]} alt=""
            onDoubleClick={() => setLbZoom(z => z>1?1:2.5)}
            style={{ maxWidth:"100%", maxHeight:"100dvh", objectFit:"contain",
                     transform:`scale(${lbZoom})`, transformOrigin:"center",
                     transition:"transform 0.2s" }} />
          {lightbox.photos.length > 1 && (
            <>
              <button onClick={lbPrev}
                style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)",
                         width:40, height:40, borderRadius:"50%", border:"none",
                         background:"rgba(255,255,255,0.18)", color:"white", cursor:"pointer",
                         fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", zIndex:6 }}>‹</button>
              <button onClick={lbNext}
                style={{ position:"absolute", right:10, top:"50%", transform:"translateY(-50%)",
                         width:40, height:40, borderRadius:"50%", border:"none",
                         background:"rgba(255,255,255,0.18)", color:"white", cursor:"pointer",
                         fontSize:22, display:"flex", alignItems:"center", justifyContent:"center", zIndex:6 }}>›</button>
            </>
          )}
        </div>
      )}

      {/* Guest bottom nav */}
      {!loggedIn && (
        <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)",
                      width:"100%", maxWidth:430, background:"rgba(255,255,255,0.96)",
                      backdropFilter:"blur(16px)", borderTop:`1px solid ${C.border}`,
                      display:"flex", alignItems:"center", padding:"10px 0 20px", zIndex:30 }}>
          <div onClick={() => onNavChange("home")} style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
            <Home size={21} color={C.primaryDark} style={{ display:"block", margin:"0 auto" }} />
            <div style={{ fontSize:9, marginTop:3, color:C.primaryDark, fontWeight:700 }}>Bosh</div>
          </div>
          <div style={{ flex:1, textAlign:"center" }}>
            <div style={{ fontSize:9, color:C.textMuted }}>Do'kon</div>
          </div>
          <div onClick={requireAuth} style={{ flex:1, textAlign:"center", cursor:"pointer" }}>
            <div style={{ width:26, height:26, borderRadius:"50%", margin:"0 auto",
                          background:`linear-gradient(135deg,${C.primary},${C.primaryDark})`,
                          display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontSize:10, fontWeight:900, color:"white" }}>?</span>
            </div>
            <div style={{ fontSize:9, marginTop:3, color:C.textMuted }}>Kirish</div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
}
