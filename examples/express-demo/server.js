const express = require("express");
const bodyParser = require("body-parser");
const { token } = require("../../index");

const app = express();
app.use(bodyParser.json());

// Simple in-memory "users" for demo purposes
const users = new Map();
users.set("alice", { id: "alice", password: "password" });

// Login: provide { userId }
app.post("/login", (req, res) => {
  const { userId } = req.body;
  if (!userId || !users.has(userId)) return res.status(401).json({ error: "invalid credentials" });

  // Create access and refresh tokens
  const accessToken = token.createAccessToken(userId, "15m");
  const refreshToken = token.createRefreshToken(userId, "7d");

  res.json({ accessToken, refreshToken });
});

// Protected route
app.get("/protected", (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith("Bearer ")) return res.status(401).json({ error: "missing token" });

  const token = auth.slice("Bearer ".length);
  try {
    const decoded = token.verifyAccessToken(token);
    res.json({ message: "protected", userId: decoded.sub, jti: decoded.jti });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Refresh access token: provide { refreshToken }
app.post("/refresh", (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });

  try {
    const decoded = token.verifyRefreshToken(refreshToken);
    const newAccess = token.createAccessToken(decoded.sub, "15m");
    res.json({ accessToken: newAccess });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

// Logout / revoke: provide { token } (access token) or jti
app.post("/logout", (req, res) => {
  const { token, jti } = req.body;
  if (!jti && !token) return res.status(400).json({ error: "token or jti required" });

  try {
    let tokenJti = jti;
    if (token) {
      const decoded = token.verifyAccessToken(token);
      tokenJti = decoded.jti;
    }

    token.revokeToken(tokenJti);
    res.json({ revoked: tokenJti });
  } catch (err) {
    // If verifyAccessToken throws because token is already revoked, still accept
    if (err.message && err.message.includes("revoked")) return res.json({ revoked: jti || "already revoked" });
    res.status(400).json({ error: err.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Express demo running on http://localhost:${port}`);
  console.log("POST /login with { userId:'alice' } to receive tokens");
});

module.exports = app;
