import React from "react";
import { renderHook, act, render } from "@testing-library/react";
import { useFalconApiContext, FalconApiContext } from "../falcon-api-context";

// Mock the FalconApi from @crowdstrike/foundry-js
jest.mock("@crowdstrike/foundry-js", () => {
  return jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue(),
    isConnected: false,
    navigation: { navigate: jest.fn() },
  }));
});

describe("FalconApiContext", () => {
  describe("useFalconApiContext", () => {
    test("should initialize with default values", () => {
      const { result } = renderHook(() => useFalconApiContext());

      // Initial state before connection completes
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.falcon).toBeTruthy();
      expect(result.current.navigation).toBeUndefined();
    });

    test("should initialize with falcon API connected", async () => {
      const { result, rerender } = renderHook(() => useFalconApiContext());

      // Wait for the connect promise to resolve
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      rerender();

      // After connection completes
      expect(result.current.isInitialized).toBe(true);
      expect(result.current.falcon).toBeTruthy();
      expect(result.current.falcon.connect).toHaveBeenCalled();
      expect(result.current.navigation).toBeTruthy();
    });
  });

  describe("FalconApiContext Provider", () => {
    test("should provide the context value to consumers", () => {
      const contextValue = {
        falcon: { test: "falcon" },
        navigation: { test: "navigation" },
        isInitialized: true,
      };

      const TestConsumer = () => {
        const ctx = React.useContext(FalconApiContext);
        return (
          <div data-testid="context-test">
            {ctx ? "Context available" : "Context not available"}
          </div>
        );
      };

      const { getByTestId } = render(
        <FalconApiContext.Provider value={contextValue}>
          <TestConsumer />
        </FalconApiContext.Provider>
      );

      const element = getByTestId("context-test");
      expect(element.textContent).toBe("Context available");
    });
  });
});
