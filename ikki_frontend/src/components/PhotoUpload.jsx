import { useRef, useCallback } from "react";
import { C } from "../constants";
import { Camera, Image as ImageIcon, Plus, X } from "lucide-react";

const MAX_PHOTOS = 4;
const MAX_SIZE   = 800;  // px
const QUALITY    = 0.7;  // JPEG sifati

// Rasmni canvas orqali kichraytiradi va data URL qaytaradi
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

export default function PhotoUpload({ photos = [], onPhotos, required = false }) {
  // Ikki ALOHIDA input — biri kamera, biri galereya
  // capture="environment" → orqa kamera (iOS/Android Telegram WebView da ishlaydi)
  // capture yo'q       → galereya / fayl tanlash
  const galleryRef = useRef(null);
  const cameraRef  = useRef(null);

  const canAdd = photos.length < MAX_PHOTOS;

  const handleFileSelect = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      // Input ni tozalash — xuddi shu faylni qayta tanlab bo'lsin
      e.target.value = "";
      if (!file) return;
      try {
        const dataUrl = await resizeImage(file);
        onPhotos([...photos, dataUrl]);
      } catch {
        // Rasm o'qib bo'lmasa jimgina o'tamiz
      }
    },
    [photos, onPhotos]
  );

  const openGallery = () => { if (canAdd) galleryRef.current?.click(); };
  const openCamera  = () => { if (canAdd) cameraRef.current?.click();  };
  const removePhoto = (index) => onPhotos(photos.filter((_, i) => i !== index));

  return (
    <div style={{ marginBottom: 18 }}>

      {/* ── Rasmlar grid ──────────────────────────── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 8,
        marginBottom: 12,
      }}>
        {photos.map((src, i) => (
          <div
            key={i}
            style={{
              position: "relative",
              aspectRatio: "1",
              borderRadius: 12,
              overflow: "hidden",
              background: C.primaryLight,
            }}
          >
            <img
              src={src}
              alt={`rasm ${i + 1}`}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            {i === 0 && (
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "rgba(0,0,0,0.45)", fontSize: 8,
                color: "white", fontWeight: 700, textAlign: "center", padding: "2px 0",
              }}>
                Asosiy
              </div>
            )}
            <button
              onClick={() => removePhoto(i)}
              style={{
                position: "absolute", top: 4, right: 4,
                width: 20, height: 20, borderRadius: "50%",
                border: "none", background: "rgba(0,0,0,0.55)",
                color: "white", cursor: "pointer", padding: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <X size={10} />
            </button>
          </div>
        ))}

        {/* ── Rasm qo'shish tugmasi ── */}
        {canAdd && (
          <button
            onClick={openGallery}
            style={{
              aspectRatio: "1", borderRadius: 12,
              border: `2px dashed ${required && photos.length === 0 ? C.primaryDark : C.primaryBorder}`,
              background: C.primaryLight,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              cursor: "pointer", gap: 4,
              padding: 0,
            }}
          >
            <Plus size={22} color={C.primaryDark} style={{ opacity: 0.6 }} />
            {photos.length === 0 && (
              <div style={{
                fontSize: 9, color: C.primaryDark, fontWeight: 700,
                textAlign: "center", padding: "0 4px",
              }}>
                {required ? "* Majburiy" : "Rasm"}
              </div>
            )}
          </button>
        )}
      </div>

      {/* ── Yashirin inputlar ───────────────────────
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

      {/* ── Galereya / Kamera tugmalari ── */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={openGallery}
          disabled={!canAdd}
          style={{
            flex: 1, padding: "11px 8px", borderRadius: 13,
            border: `1.5px solid ${canAdd ? C.primaryBorder : C.border}`,
            background: canAdd ? C.primaryLight : C.bg,
            color: canAdd ? C.primaryDark : C.textMuted,
            fontSize: 12, fontWeight: 700,
            cursor: canAdd ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <ImageIcon size={16} /> Galereya
        </button>

        <button
          onClick={openCamera}
          disabled={!canAdd}
          style={{
            flex: 1, padding: "11px 8px", borderRadius: 13,
            border: `1.5px solid ${canAdd ? C.primaryBorder : C.border}`,
            background: canAdd ? C.primaryLight : C.bg,
            color: canAdd ? C.primaryDark : C.textMuted,
            fontSize: 12, fontWeight: 700,
            cursor: canAdd ? "pointer" : "not-allowed",
            fontFamily: "inherit",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          <Camera size={16} /> Kamera
        </button>
      </div>

      {photos.length > 0 && (
        <div style={{ fontSize: 10, color: C.textMuted, marginTop: 8, textAlign: "center" }}>
          {photos.length}/{MAX_PHOTOS} ta rasm · Birinchi rasm asosiy bo'ladi
        </div>
      )}
    </div>
  );
}
