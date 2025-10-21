import "@testing-library/jest-dom";
import { vi } from "vitest";

// Add React 18 test environment support
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock for window.matchMedia which is not implemented in JSDOM
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
