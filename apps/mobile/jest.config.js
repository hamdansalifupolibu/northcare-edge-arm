/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.(test|spec).(ts|tsx)'],
  clearMocks: true,
  forceExit: true,
  // Reduce flaky AuthSessionProvider races under heavy machine load.
  maxWorkers: '50%',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native/js-polyfills)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|react-native-svg|@noble/hashes|@noble/ed25519|@noble/ciphers|@noble/curves)',
  ],
};
