import { useState, useRef, useCallback } from "react";
import { C } from "../constants";
import { Pencil, Image as ImageIcon, Camera, Trash2 } from "lucide-react";

const MAX_SIZE = 300;   // px
const QUALITY  = 0.75;  // JPEG sifati

// Avatar rasmini canvas orqali kichraytiradi va data URL qaytaradi
function resizeImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Fayl o'qib bo'lmadi"));
    reader.onload = (ev) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Rasm yuklanmadi"));
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_SIZE || height > MAX_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_SIZE) / width);
            width  = MAX_SIZE;
          } else {
            width  = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }
        const canvas = document.createElement("canvas");
        canvas.width  = width;
        canvas.height = height;
        canvas.getContext("2d").drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", QUALITY));
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function AvatarUpload({ avatar, name, onAvatar }) {
  const galleryRef = useRef(null);
  const cameraRef  = useRef(null);
  const [showMenu, setShowMenu] = useState(false);

  const initials = name
    .trim()
    .split(/\s+/)
    .map((w) => w[0] || "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleFileSelect = useCallback(async (e) => {
    const file = e.target.files?.[0];
    // Input tozalash — xuddi shu faylni qayta tanlab bo'lsin
    e.target.value = "";
    if (!file) return;
    try {
      const dataUrl = await resizeImage(file);
      onAvatar(dataUrl);
    } catch {
      // Rasm o'qib bo'lmasa jimgina o'tamiz
    }
  }, [onAvatar]);

  const menuItems = [
    {
      Icon: ImageIcon,
      label: "Galereya",
      // capture yo'q → foto kutubxona ochiladi
      action: () => { galleryRef.current?.click(); setShowMenu(false); },
    },
    {
      Icon: Camera,
      label: "Kamera",
      // capture="environment" → orqa kamera to'g'ridan ochiladi
      action: () => { cameraRef.current?.click(); setShowMenu(false); },
    },
    ...(avatar
      ? [{
          Icon: Trash2,
          label: "O'chirish",
          action: () => { onAvatar(null); setShowMenu(false); },
          danger: true,
        }]
      : []),
  ];

  return (
    <div style={{ position: "relative", width: 96, height: 96, margin: "0 auto 16px" }}>

      {/* Avatar doirasi */}
      <div
        onClick={() => setShowMenu((m) => !m)}
        style={{
          width: 96, height: 96, borderRadius: "50%", overflow: "hidden",
          border: `3px solid ${C.primaryBorder}`,
          background: avatar
            ? "transparent"
            : `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer",
        }}
      >
        {avatar
          ? <img src={avatar} alt="avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <span style={{ fontSize: 30, fontWeight: 900, color: "white" }}>{initials}</span>
        }
      </div>

      {/* Tahrirlash belgisi */}
      <div
        onClick={() => setShowMenu((m) => !m)}
        style={{
          position: "absolute", bottom: 2, right: 2,
          width: 28, height: 28, borderRadius: "50%",
          border: "2.5px solid white",
          background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`,
          color: "white", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: C.shadow,
        }}
      >
        <Pencil size={13} color="white" />
      </div>

      {/* Mini menyu */}
      {showMenu && (
        <div style={{
          position: "absolute", top: 106, left: "50%",
          transform: "translateX(-50%)",
          background: C.card, borderRadius: 14, padding: "6px 0",
          boxShadow: C.shadowMd, border: `1px solid ${C.border}`,
          zIndex: 100, minWidth: 160,
        }}>
          {menuItems.map(({ Icon, label, action, danger }) => (
            <div
              key={label}
              onClick={action}
              style={{
                padding: "9px 14px", fontSize: 12, fontWeight: 700,
                color: danger ? C.danger : C.text,
                cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon size={14} color={danger ? C.danger : C.textSub} />
              {label}
            </div>
          ))}
        </div>
      )}

      {/* ── Yashirin inputlar ───────────────────────────────────────
           GALEREYA: capture atributi yo'q → foto kutubxona ochiladi
           KAMERA:   capture="environment" → orqa kamera to'g'ridan ochiladi  */}
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        style={{ display: "none" }}
      />
    </div>
  );
}
