require("dotenv").config();

const app = require("../backend/app");

// DB ga ulanish kerak emas — har bir route o'zi query() orqali lazy ulanadi.
// send-code, health-check kabi endpointlar DB siz ham ishlaydi.
module.exports = (req, res) => app(req, res);
