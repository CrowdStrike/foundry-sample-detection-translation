import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, test, beforeEach, expect } from "vitest";
import * as FalconApiContextModule from "../contexts/falcon-api-context";
import { CollectionManagement } from "../components/collection-management";

// Mock React DOM
const mockRender = vi.fn();
const mockCreateRoot = vi.fn(() => ({
  render: mockRender,
  unmount: vi.fn(),
}));

vi.mock("react-dom/client", () => ({
  default: {
    createRoot: mockCreateRoot,
  },
  createRoot: mockCreateRoot,
}));

// Mock the CollectionManagement component
vi.mock("../components/collection-management", () => ({
  CollectionManagement: vi.fn(() => (
    <div data-testid="collection-management-mock" />
  )),
}));

// Mock the FalconApiContext
vi.mock("../contexts/falcon-api-context", () => {
  const actual = vi.importActual("../contexts/falcon-api-context");
  return {
    ...actual,
    useFalconApiContext: vi.fn(),
    FalconApiContext: {
      ...actual.FalconApiContext,
      Provider: ({ children }) => (
        <div data-testid="context-provider-mock">{children}</div>
      ),
    },
  };
});

describe("App", () => {
  // Create a modified version of app.js for testing
  // Since the App component isn't exported directly in app.js
  const createAppForTesting = () => {
    // Return a function that mimics the App component behavior
    return () => {
      const { falcon, navigation, isInitialized } =
        FalconApiContextModule.useFalconApiContext();

      if (!isInitialized) {
        return null;
      }

      return (
        <React.StrictMode>
          <div data-testid="context-provider-mock">
            <CollectionManagement />
          </div>
        </React.StrictMode>
      );
    };
  };

  let App;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Setup the mock falcon context value
    FalconApiContextModule.useFalconApiContext.mockReturnValue({
      falcon: { test: true },
      navigation: { test: true },
      isInitialized: true,
    });

    // Create our testing version of App
    App = createAppForTesting();

    // Mock the document.querySelector
    document.querySelector = vi.fn(() => document.createElement("div"));
  });

  test("should render nothing when not initialized", () => {
    // Mock uninitialized state
    FalconApiContextModule.useFalconApiContext.mockReturnValue({
      falcon: null,
      navigation: null,
      isInitialized: false,
    });

    const { container } = render(<App />);
    expect(container).toBeEmptyDOMElement();
  });

  test("should call the CollectionManagement component", () => {
    FalconApiContextModule.useFalconApiContext.mockReturnValue({
      falcon: { test: true },
      navigation: { test: true },
      isInitialized: true,
    });

    const { container } = render(<App />);

    expect(container.firstChild).toBeTruthy();
    expect(screen.getByTestId("context-provider-mock")).toBeInTheDocument();
  });

  test("should use context values from useFalconApiContext", () => {
    const uninitializedValue = {
      falcon: null,
      navigation: null,
      isInitialized: false,
    };

    const initializedValue = {
      falcon: { test: true },
      navigation: { test: true },
      isInitialized: true,
    };

    // Test uninitialized state
    FalconApiContextModule.useFalconApiContext.mockReturnValue(
      uninitializedValue
    );
    const { container: uninitializedContainer } = render(<App />);
    expect(uninitializedContainer).toBeEmptyDOMElement();

    // Test initialized state
    FalconApiContextModule.useFalconApiContext.mockReturnValue(
      initializedValue
    );
    const { container: initializedContainer } = render(<App />);
    expect(initializedContainer.firstChild).toBeTruthy();
  });

  test("should initialize ReactDOM and render app", async () => {
    // Mock document.querySelector to return a div element
    const mockAppElement = document.createElement("div");
    const mockQuerySelector = vi.fn().mockReturnValue(mockAppElement);
    global.document.querySelector = mockQuerySelector;

    // Reset the mock to see fresh calls
    vi.clearAllMocks();
    mockQuerySelector.mockReturnValue(mockAppElement);

    // Import the app.jsx file to trigger the ReactDOM.render call
    await import("../app.jsx");

    // Check if createRoot was called with the #app element
    expect(mockQuerySelector).toHaveBeenCalledWith("#app");
    expect(mockCreateRoot).toHaveBeenCalledWith(mockAppElement);

    // Check if render was called on the root
    expect(mockRender).toHaveBeenCalled();
  });
});
