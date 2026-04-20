module.exports = (req, res) => {
  res.json({ ok: true, message: "Function ishlayapti!", url: req.url, method: req.method });
};
