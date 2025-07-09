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
