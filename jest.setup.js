// Mock AsyncStorage for testing
const mockAsyncStorage = {
  getItem: jest.fn(() => Promise.resolve(null)),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
  clear: jest.fn(() => Promise.resolve()),
};

// Mock React Native AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

// Make mockAsyncStorage available globally for tests
global.mockAsyncStorage = mockAsyncStorage;