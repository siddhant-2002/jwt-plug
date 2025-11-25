// Public API for the jwt-plug package
module.exports = {
	token: require("./src/services/token.service"),
	secrets: require("./src/config/secrets")
};
