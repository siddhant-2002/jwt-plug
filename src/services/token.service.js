const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const blacklist = require("../utils/blacklist");
const { ACCESS_SECRET, REFRESH_SECRET } = require("../config/secrets");

module.exports = {
  createAccessToken(userId, time) {
    const jti = uuidv4();
    return jwt.sign({ sub: userId, jti }, ACCESS_SECRET, { expiresIn: time });
  },

  createRefreshToken(userId, time) {
    const jti = uuidv4();
    return jwt.sign({ sub: userId, jti, rt: true }, REFRESH_SECRET, { expiresIn: time });
  },

  verifyAccessToken(token) {
    const decoded = jwt.verify(token, ACCESS_SECRET);

    if (blacklist.has(decoded.jti)) {
      throw new Error("Access token revoked");
    }

    return decoded;
  },

  verifyRefreshToken(token) {
    const decoded = jwt.verify(token, REFRESH_SECRET);

    if (!decoded.rt) throw new Error("Not a refresh token");

    return decoded;
  },

  revokeToken(jti) {
    blacklist.add(jti);
  }
};
