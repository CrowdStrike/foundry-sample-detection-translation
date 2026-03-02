export default {
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
  testEnvironment: "jsdom",
  moduleFileExtensions: ["js", "json"],
  testMatch: ["**/__tests__/**/*.js", "**/?(*.)+(spec|test).js"],
  transformIgnorePatterns: ["/node_modules/(?!(@crowdstrike/foundry-js)/)"],
  setupFilesAfterEnv: ["./jest.setup.js"],
};
