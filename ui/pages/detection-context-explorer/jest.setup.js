import "@testing-library/jest-dom";

// Mock for console methods to avoid test noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

// Mock for window.matchMedia which is not implemented in JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
