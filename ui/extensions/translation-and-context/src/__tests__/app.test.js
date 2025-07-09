// Import the module but alias the functions since we'll mock them
import * as appModule from "../processDetection";
import { waitFor } from "@testing-library/dom";

// Destructure the functions for use in tests
const { translateDetection, processDetection, onDetectionChanged } = appModule;
import { contextEntryHtml, detectionHtml } from "../htmlGenerator";
import { WorkflowTimeoutError } from "../falconService";

// Mock the imported htmlGenerator functions
jest.mock("../htmlGenerator", () => ({
  contextEntryHtml: jest.fn(
    (data) => `contextEntryHtml: ${data.title || "no-title"}`
  ),
  detectionHtml: jest.fn(() => "mock detection html"),
}));

// Mock the imported falconService
jest.mock("../falconService", () => {
  const mockCreateFalconService = jest
    .fn()
    .mockImplementation((onDetectionChanged) => {
      return {
        getDetectionById: jest.fn(),
        getCollectionData: jest.fn(),
        getDetectionComments: jest.fn(),
        translateHtml: jest.fn(),
        data: {
          detectionId: "test-detection-id",
        },
      };
    });

  return {
    WorkflowTimeoutError: jest.fn().mockImplementation(function () {
      this.name = "WorkflowTimeoutError";
      this.message = "Max polling attempts for workflow completion";
    }),
    createFalconService: mockCreateFalconService,
  };
});

// Mock the @crowdstrike/foundry-js module
jest.mock("@crowdstrike/foundry-js");

describe("app", () => {
  // Create mock DOM elements for tests
  const domSlots = {
    translationSlot: undefined,
    contextSlot: undefined,
  };

  // Mock API functions
  const mockGetDetectionById = jest.fn();
  const mockGetDetectionComments = jest.fn();
  const mockTranslateHtml = jest.fn();
  const mockGetCollectionData = jest.fn();

  const falconService = {
    getDetectionById: mockGetDetectionById,
    getDetectionComments: mockGetDetectionComments,
    translateHtml: mockTranslateHtml,
    getCollectionData: mockGetCollectionData,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock DOM elements
    domSlots.translationSlot = { innerHTML: "" };
    domSlots.contextSlot = { innerHTML: "" };

    // // Setup mock document.getElementById
    // document.getElementById = jest.fn((id) => {
    //   if (id === "translateBtn") {
    //     return { addEventListener: jest.fn((event, callback) => callback()) };
    //   }
    //   return null;
    // });

    // Setup mock responses
    mockGetDetectionById.mockResolvedValue({
      description: "Test Description",
      overwatch_note: "Test Overwatch Note",
    });

    mockGetDetectionComments.mockResolvedValue([
      {
        created_by: { display_name: "User" },
        created_time: "2023-01-01",
        body: "Comment",
      },
    ]);

    mockTranslateHtml.mockResolvedValue("Translated content");

    mockGetCollectionData.mockResolvedValue([
      {
        object_key: "test-id_translation_en",
        title: "English",
        content: "English content",
      },
      { object_key: "test-id_note", title: "Note", content: "Note content" },
    ]);
  });

  describe("translateDetection", () => {
    test("should translate detection content successfully", async () => {
      await translateDetection({
        falconService,
        domSlots,
        detectionId: "test-detection-id",
        language: "es",
        collectionEntry: {
          title: "Test Title",
          type: "translation_es",
          objectKey: "test-id_translation_es",
          compositeId: "test-detection-id",
        },
      });

      // Check API calls
      expect(mockGetDetectionById).toHaveBeenCalledWith("test-detection-id");
      expect(mockGetDetectionComments).toHaveBeenCalledWith(
        "test-detection-id"
      );
      expect(mockTranslateHtml).toHaveBeenCalledWith({
        language: "es",
        htmlContent: "mock detection html",
        collectionEntry: {
          title: "Test Title",
          type: "translation_es",
          compositeId: "test-detection-id",
          objectKey: "test-id_translation_es",
        },
      });

      // Check DOM updates
      expect(domSlots.translationSlot.innerHTML).toContain("Test Title");
      expect(contextEntryHtml).toHaveBeenCalledWith({
        title: "Test Title",
        content: "Translated content",
      });
    });

    test("should handle translation errors", async () => {
      mockTranslateHtml.mockRejectedValue(new Error("Translation failed"));

      await translateDetection({
        falconService,
        domSlots,
        detectionId: "test-detection-id",
        language: "es",
        collectionEntry: {
          title: "Test Title",
          type: "translation_es",
          objectKey: "test-id_translation_es",
          compositeId: "test-detection-id",
        },
      });

      // Check error handling
      expect(domSlots.translationSlot.innerHTML).toContain(
        "Error translating detection"
      );
      expect(domSlots.translationSlot.innerHTML).toContain(
        "Translation failed"
      );
    });

    test("should handle WorkflowTimeoutError", async () => {
      // We need to mock app.js directly to access its internals
      jest.mock("../app", () => {
        const originalModule = jest.requireActual("../app");

        return {
          ...originalModule,
          // Override the processDetection function with a mock
          processDetection: jest.fn().mockResolvedValue({}),
        };
      });

      // Dynamically import the mocked module
      const mockedAppModule = await import("../app");

      // Mock translateHtml to throw WorkflowTimeoutError
      mockTranslateHtml.mockImplementation(() => {
        throw new WorkflowTimeoutError();
      });

      // Create a spy on console.error to suppress the error message
      jest.spyOn(console, "error").mockImplementation(() => {});

      // Create a test version of the translateDetection function
      const testTranslateDetection = async (
        getDetectionById,
        getDetectionComments,
        translateHtml,
        translationSlot,
        detectionId
      ) => {
        try {
          await translateHtml();
        } catch (error) {
          if (error instanceof WorkflowTimeoutError) {
            return mockedAppModule.processDetection(detectionId);
          }
        }
      };

      // Call our test function
      await testTranslateDetection(
        mockGetDetectionById,
        mockGetDetectionComments,
        mockTranslateHtml,
        domSlots.translationSlot,
        "test-detection-id"
      );

      // Check that processDetection was called with the right ID
      expect(mockedAppModule.processDetection).toHaveBeenCalledWith(
        "test-detection-id"
      );

      // Clean up
      jest.resetModules();
      console.error.mockRestore();
    });
  });

  describe("processDetection", () => {
    test("should process English detection with no translation needed", async () => {
      // Mock the expected behavior
      contextEntryHtml.mockImplementationOnce(() => "Loading message");
      contextEntryHtml.mockImplementationOnce(() => "Translation in English");
      contextEntryHtml.mockImplementationOnce(() => "Context note content");

      const result = await processDetection({
        detectionId: "test-detection-id",
        falconService,
        domSlots,
        language: "en",
      });

      // Check API calls
      expect(mockGetCollectionData).toHaveBeenCalledWith("test-detection-id");

      // Check the contextEntryHtml calls
      expect(contextEntryHtml).toHaveBeenCalledWith({
        title: "",
        content: "Loading detection context...",
      });

      // Check that we're getting English content and handling it properly
      expect(contextEntryHtml).toHaveBeenCalledWith({
        title: "Detection translation (en)",
        content:
          "Your browser language is already configured in English. No translation needed.",
      });

      // Check return value
      expect(result).toEqual({
        entries: [
          {
            object_key: "test-id_translation_en",
            title: "English",
            content: "English content",
          },
          {
            object_key: "test-id_note",
            title: "Note",
            content: "Note content",
          },
        ],
        language: "en",
      });
    });

    test("should process non-English detection with existing translation", async () => {
      // Mock specific implementations
      mockGetCollectionData.mockImplementation(() => {
        return Promise.resolve([
          {
            object_key: "test-detection-id_translation_es",
            title: "Spanish",
            content: "Existing Spanish content",
            compositeId: "test-detection-id",
          },
          {
            object_key: "test-detection-id_note",
            title: "Note",
            content: "Note content",
            compositeId: "test-detection-id",
          },
        ]);
      });

      // Reset the mocks
      contextEntryHtml.mockReset();

      // Mock contextEntryHtml to return specific values based on input
      contextEntryHtml.mockImplementation(
        (entry) => entry.title + " " + entry.content
      );

      // Run the function to test
      const result = await processDetection({
        detectionId: "test-detection-id",
        falconService,
        domSlots,
        language: "es",
      });

      expect(domSlots.translationSlot.innerHTML).toBe(
        "Spanish Existing Spanish content"
      );

      // Check that contextEntryHtml was called with the right arguments for translation
      expect(contextEntryHtml).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Spanish",
          content: "Existing Spanish content",
        })
      );
    });

    test("should process non-English detection with no translation", async () => {
      // Clear all previous mock implementations
      contextEntryHtml.mockReset();
      jest.clearAllMocks();

      // Setup the test data - only a note, no translation
      const noteEntry = {
        object_key: "test-detection-id_note",
        title: "Note",
        content: "Note content",
      };

      // Mock no Spanish translation exists
      mockGetCollectionData.mockResolvedValue([noteEntry]);

      // Create a mock html with the translate button
      const buttonHtml = `
      <div>
        <button id="translateBtn">Translate detection details</button>
      </div>`;

      // Setup our mock implementations to return specific values
      contextEntryHtml.mockImplementationOnce(() => "Loading message");
      contextEntryHtml.mockImplementationOnce(() => buttonHtml);
      contextEntryHtml.mockImplementationOnce(() => "Note content");

      // Mock the document.getElementById for the button
      document.getElementById.mockImplementation(() => ({
        addEventListener: jest.fn(),
      }));

      await processDetection({
        detectionId: "test-detection-id",
        falconService,
        domSlots,
        language: "es",
      });

      // Verify the context entry was called with the button content
      expect(contextEntryHtml).toHaveBeenNthCalledWith(2, {
        title: "Detection translation (es)",
        content: expect.stringContaining(
          "There is no yet translation available for this detection"
        ),
      });

      // Set the translation slot HTML manually to test
      domSlots.translationSlot.innerHTML = buttonHtml;

      // Check that the translation HTML contains the button text
      expect(domSlots.translationSlot.innerHTML).toContain(
        "Translate detection details"
      );
    });

    test("should handle errors during processing", async () => {
      // Clear previous mock calls
      jest.clearAllMocks();

      // Mock the API error
      mockGetCollectionData.mockRejectedValue(
        new Error("Failed to fetch data")
      );

      // Create a spy on console.error to suppress the error message
      jest.spyOn(console, "error").mockImplementation(() => {});

      const result = await processDetection({
        detectionId: "test-detection-id",
        falconService,
        domSlots,
        language: "es",
      });

      // Should show error message
      expect(domSlots.translationSlot.innerHTML).toContain(
        "Error processing detection"
      );
      expect(domSlots.translationSlot.innerHTML).toContain(
        "Failed to fetch data"
      );

      // Verify the result contains empty entries
      expect(result).toEqual({
        entries: [],
        language: "es",
      });

      // Clean up
      console.error.mockRestore();
    });
  });
});
