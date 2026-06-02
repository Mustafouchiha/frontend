// ─── DESIGN TOKENS (ko'k-moviy rang sxemasi) ─────────────────────────────
export const C = {
  bg:           "#F0F9FF",
  card:         "#FFFFFF",
  primary:      "#38BDF8",
  primaryDark:  "#0284C7",
  primaryLight: "#E0F2FE",
  primaryBorder:"#7DD3FC",
  accent:       "#059669",
  text:         "#0F172A",
  textSub:      "#475569",
  textMuted:    "#94A3B8",
  border:       "#E2E8F0",
  danger:       "#EF4444",
  dangerLight:  "#FFF1F0",
  shadow:       "0 2px 12px rgba(0,0,0,0.07)",
  shadowMd:     "0 4px 22px rgba(0,0,0,0.10)",
};

export const COND = {
  "A'lo":   { bg:"#DCFCE7", text:"#16A34A" },
  "Yaxshi": { bg:"#DBEAFE", text:"#2563EB" },
  "O'rta":  { bg:"#FEF9C3", text:"#A16207" },
};

// ─── UZBEKISTON ───────────────────────────────────────────────────────────
export const UZ = {
  "Toshkent sh.":    ["Yunusobod","Chilonzor","Sergeli","Mirzo Ulug'bek","Yakkasaroy","Bektemir","Yashnobod","Shayxontohur","Olmazor","Uchtepa","Mirobod","Hamza"],
  "Toshkent vil.":   ["Zangiota","Qibray","Ohangaron","Chirchiq","Angren","Bekabad","Bo'ka","Yuqorichirchiq","Quyi Chirchiq","O'rta Chirchiq"],
  "Samarqand":       ["Samarqand sh.","Kattaqo'rg'on","Ishtixon","Jomboy","Nurota","Oqdaryo","Pastdarg'om","Toyloq","Urgut"],
  "Andijon":         ["Andijon sh.","Asaka","Xo'jaobod","Jalolquduq","Marhamat","Oltinkol","Paxtaobod","Shahrixon","Ulug'nor"],
  "Farg'ona":        ["Farg'ona sh.","Marg'ilon","Qo'qon","Buvayda","Dang'ara","Furqat","Qo'shtepa","Rishton","Uchko'prik"],
  "Namangan":        ["Namangan sh.","Chortoq","Chust","Kosonsoy","Mingbuloq","Norin","Pop","To'raqo'rg'on","Uychi"],
  "Buxoro":          ["Buxoro sh.","G'ijduvon","Jondor","Kogon","Peshku","Qorovulbozor","Romitan","Shofirkon","Vobkent"],
  "Xorazm":          ["Urganch sh.","Xiva","Bog'ot","Gurlan","Qo'shko'pir","Shovot","Yangiariq","Yangibozor"],
  "Qashqadaryo":     ["Qarshi sh.","Shahrisabz","Chiroqchi","G'uzor","Kamashi","Kitob","Koson","Muborak","Nishon"],
  "Surxondaryo":     ["Termiz sh.","Angor","Denov","Jarqo'rg'on","Muzrabot","Oltinsoy","Qumqo'rg'on","Sho'rchi"],
  "Sirdaryo":        ["Guliston sh.","Shirin","Boyovut","Mirzaobod","Oqoltin","Sardoba","Sayxunobod","Xovos"],
  "Jizzax":          ["Jizzax sh.","Arnasoy","Baxmal","Do'stlik","Forish","G'allaorol","Mirzacho'l","Paxtakor","Yangiobod","Zarbdor","Zafarobod","Zomin"],
  "Navoiy":          ["Navoiy sh.","Nurota","Tomdi","Uchquduq","Xatirchi","Karmana","Konimex","Qiziltepa"],
  "Qoraqalpog'iston":["Nukus sh.","Beruniy","Chimboy","Ellikkala","Kegeyli","Mo'ynoq","Qonliko'l","Qo'ng'irot","Shumanay","Taxtako'pir","To'rtko'l","Xo'jayli"],
};

// ─── KATEGORIYALAR ───────────────────────────────────────────────────────
export const CATS    = ["Barchasi","yog'och","gipskarton","reka taxtasi","poli laga","metall","g'isht","boshqa"];
export const CAT_ICO = {
  "Barchasi":     "🏗",
  "yog'och":      "🪵",
  "gipskarton":   "📋",
  "reka taxtasi": "🪚",
  "poli laga":    "🏠",
  "metall":       "🔩",
  "g'isht":       "🧱",
  "boshqa":       "🔧",
};

// O'lcham presetlari (kategoriya bo'yicha)
export const DIM_PRESETS = {
  "yog'och":      ["25x50","50x50","50x100","50x150","100x100","150x150","200x200"],
  "gipskarton":   ["1200x2500","1200x3000","600x1200"],
  "reka taxtasi": ["20x100","25x100","25x150","30x150","50x150"],
  "poli laga":    ["50x100","50x150","75x150","100x150","100x200"],
  "metall":       ["20x20","40x40","60x60","40x80","50x100"],
  "g'isht":       ["250x120x65","250x120x88"],
  "boshqa":       [],
};

export const EMPTY_FORM = {
  name:      "",
  category:  "yog'och",
  price_1:   "",
  price_10:  "",
  price_100: "",
  unit:      "dona",
  qty:       "",
  viloyat:   "",
  tuman:     "",
  condition: "A'lo",
  photos:    [],
  mahalla:   "",
  dim_x:     "",
  dim_y:     "",
  dim_z:     "",
};

export const APP_NAME = "ReNarx";

export const STATUS_LABELS = {
  active:           "Faol",
  pending_approval: "Tekshiruvda",
  hidden:           "Yashirilgan",
  deleted:          "O'chirilgan",
};

export const STATUS_COLORS = {
  active:           { bg:"#DCFCE7", color:"#16A34A" },
  pending_approval: { bg:"#FEF9C3", color:"#A16207" },
  hidden:           { bg:"#F1F5F9", color:"#64748B" },
  deleted:          { bg:"#FFF1F0", color:"#EF4444" },
};

// Operator ma'lumotlari
export const OPERATOR = {
  telegram: "@ReNarx_admin",
  name:     "Operator",
};
