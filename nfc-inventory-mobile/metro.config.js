const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Proxy react-native-nfc-manager to a stub on web
config.resolver.extraNodeModules = {
    ...config.resolver.extraNodeModules,
};

const originalResolveModule = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (platform === 'web' && moduleName === 'react-native-nfc-manager') {
        return {
            filePath: path.resolve(__dirname, 'src/stubs/nfc-stub.js'),
            type: 'sourceFile',
        };
    }

    // Use the standard metro-resolver to handle all other modules
    // This is the correct way to 'fall back' when overriding resolveRequest
    const { resolve } = require('metro-resolver');
    return resolve(context, moduleName, platform);
};

module.exports = config;
