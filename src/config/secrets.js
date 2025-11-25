// Secrets placeholder. In prod, use env vars or secrets manager.
module.exports = {
  ACCESS_SECRET: process.env.ACCESS_SECRET || "access_secret",
  REFRESH_SECRET: process.env.REFRESH_SECRET || "refresh_secret"
};
