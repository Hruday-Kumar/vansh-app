// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Disable lazy/split bundling — forces a single bundle download.
// Prevents java.io.IOException on Android over tunnel connections.
config.server = {
  ...config.server,
  experimentalImportBundleSupport: false,
};

module.exports = config;
