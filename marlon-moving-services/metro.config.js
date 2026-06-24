const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

require("./patch-react-19-web");

const config = getDefaultConfig(__dirname);

module.exports = withRorkMetro(config);
