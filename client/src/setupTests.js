// Jest setup for CRA test runs.

// axios >=1.x ships ESM in its main entry which jest cannot transform inside
// node_modules. Map ALL 'axios' imports (app code + tests) to the CJS build so
// everyone shares one interceptable instance.
jest.mock('axios', () => jest.requireActual('axios/dist/node/axios.cjs'));

// matchMedia polyfill - MUI useMediaQuery needs it in jsdom
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  });
}

// URL.createObjectURL polyfill for the Web Worker blob path
if (typeof URL.createObjectURL !== 'function') {
  URL.createObjectURL = jest.fn(() => 'blob:mock-worker-url');
  URL.revokeObjectURL = jest.fn();
}

// Suppress the noisy render warnings from MUI dialogs in tests
const originalError = console.error;
console.error = (...args) => {
  if (/Warning: validateDOMNesting|not wrapped in act/.test(args[0] || '')) {
    return;
  }
  originalError.call(console, ...args);
};
