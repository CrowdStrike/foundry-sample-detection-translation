// Mock DOM elements that our code interacts with
document.getElementById = jest.fn(() => ({
  innerHTML: "",
  addEventListener: jest.fn(),
}));

// Mock for navigator.language
Object.defineProperty(navigator, "language", {
  get: function () {
    return "en-US";
  },
});

// Mock for console methods to avoid test noise
global.console = {
  ...console,
  log: jest.fn(),
  error: jest.fn(),
};

// Mock for setTimeout
global.setTimeout = jest.fn((fn) => fn());
