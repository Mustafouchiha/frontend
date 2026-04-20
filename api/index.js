const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../backend/.env") });

// App yuklanishida xato bo'lsa — HTML emas, JSON qaytarsin
let app;
try {
  app = require("../backend/app");
} catch (err) {
  console.error("Backend yuklanmadi:", err);
  app = (_req, res) =>
    res.status(500).json({ message: "Server xatosi: " + err.message });
}

module.exports = (req, res) => {
  try {
    app(req, res);
  } catch (err) {
    console.error("Request xatosi:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Ichki server xatosi" });
    }
  }
};
