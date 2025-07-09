// Mock implementation of FalconApi
export default class FalconApi {
  constructor() {
    this.events = {
      on: jest.fn(),
    };
    this.data = {};
    this.isConnected = true;
    this.api = {
      workflows: {
        postEntitiesExecuteV1: jest.fn(),
        getEntitiesExecutionResultsV1: jest.fn(),
      },
    };
    this.apiIntegration = jest.fn();
    this.navigation = { navigate: jest.fn() };
  }

  connect() {
    return Promise.resolve();
  }

  collection() {
    return {
      search: jest.fn().mockResolvedValue({ resources: [] }),
      read: jest.fn().mockResolvedValue({}),
      write: jest.fn().mockResolvedValue({}),
      list: jest.fn().mockResolvedValue({ resources: [] }),
      delete: jest.fn().mockResolvedValue({}),
    };
  }
}
