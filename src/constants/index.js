// ─── DESIGN TOKENS ───────────────────────────────────────────────
export const C = {
  bg:           "#F8F9FA",
  card:         "#FFFFFF",
  primary:      "#FFB380",
  primaryDark:  "#F4894A",
  primaryLight: "#FFF0E8",
  primaryBorder:"#FFD4B8",
  accent:       "#5BA4CF",
  text:         "#1C1C1E",
  textSub:      "#6B7280",
  textMuted:    "#A1A1AA",
  border:       "#EAEAEA",
  danger:       "#FF4D4F",
  dangerLight:  "#FFF1F0",
  shadow:       "0 2px 12px rgba(0,0,0,0.07)",
  shadowMd:     "0 4px 22px rgba(0,0,0,0.10)",
};

export const COND = {
  "A'lo":   { bg:"#E8F8F0", text:"#28A869" },
  "Yaxshi": { bg:"#E8F2FD", text:"#3A85C8" },
  "O'rta":  { bg:"#FFF8E6", text:"#D4920A" },
};

// ─── UZBEKISTON ───────────────────────────────────────────────────
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

export const CATS    = ["Barchasi","g'isht","metall","yog'och","beton","boshqa"];
export const CAT_ICO = { "Barchasi":"🏗","g'isht":"🧱","metall":"🔩","yog'och":"🪵","beton":"⬜","boshqa":"🔧" };

export const EMPTY_FORM = {
  name:"", category:"g'isht", price:"", unit:"dona", qty:"",
  viloyat:"", tuman:"", mahalla:"", condition:"A'lo", photos:[],
};

// Operator ma'lumotlari
export const OPERATOR = {
  telegram: "@Requrilish_admin",
  card:     "9860 1606 1973 1286",
  name:     "Mustafo Ismoiljonov",
};