const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";

exports.signToken = (payload) =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });

exports.verifyToken = (token) => jwt.verify(token, JWT_SECRET);
