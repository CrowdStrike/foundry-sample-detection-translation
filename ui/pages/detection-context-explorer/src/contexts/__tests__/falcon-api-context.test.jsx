import React from "react";
import { renderHook, render, act } from "@testing-library/react";
import { vi, describe, test, expect } from "vitest";
import { useFalconApiContext, FalconApiContext } from "../falcon-api-context";

// Mock the FalconApi from @crowdstrike/foundry-js
vi.mock("@crowdstrike/foundry-js", () => ({
  default: vi.fn().mockImplementation(() => ({
    connect: vi.fn().mockResolvedValue(),
    isConnected: false,
    navigation: { navigate: vi.fn() },
  })),
}));

describe("FalconApiContext", () => {
  describe("useFalconApiContext", () => {
    test("should initialize with default values", async () => {
      const { result } = renderHook(() => useFalconApiContext());

      // Initial state before connection completes
      expect(result.current.isInitialized).toBe(false);
      expect(result.current.falcon).toBeTruthy();
      expect(result.current.navigation).toBeUndefined();

      // Wait for async effects to complete
      await act(async () => {
        // Wait for the useEffect to complete
        await new Promise((resolve) => setTimeout(resolve, 0));
      });
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
