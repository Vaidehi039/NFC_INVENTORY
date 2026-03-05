// Stub for react-native-nfc-manager on web platform.
const NfcEvents = {
    DiscoverTag: 'DiscoverTag',
    SessionClosed: 'SessionClosed',
    StateChanged: 'StateChanged',
};

const NfcManagerStub = {
    start: () => Promise.reject(new Error('NFC not supported on web')),
    isSupported: () => Promise.resolve(false),
    setEventListener: () => { },
    unregisterTagEvent: () => Promise.resolve(),
    registerTagEvent: () => Promise.reject(new Error('NFC not supported on web')),
};

module.exports = {
    default: NfcManagerStub,
    NfcEvents,
};
