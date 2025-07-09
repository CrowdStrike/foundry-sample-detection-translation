export default {
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  testEnvironment: "jsdom",
  moduleFileExtensions: ["js", "jsx", "json"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  setupFilesAfterEnv: ["./jest.setup.js"],
  transformIgnorePatterns: ["/node_modules/(?!(@crowdstrike/foundry-js)/)"],
};
