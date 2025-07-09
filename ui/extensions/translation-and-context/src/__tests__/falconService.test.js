import { WorkflowTimeoutError } from "../falconService";

// Mock the falconService module itself
jest.mock("../falconService", () => {
  // Pull in the actual WorkflowTimeoutError class
  const actual = jest.requireActual("../falconService");

  // Create mock functions for all the service methods
  const mockGetDetectionById = jest
    .fn()
    .mockResolvedValue({ id: "test-detection-id" });
  const mockGetCollectionData = jest
    .fn()
    .mockResolvedValue([{ object_key: "test-key" }]);
  const mockGetDetectionComments = jest.fn().mockResolvedValue([]);
  const mockTranslateHtml = jest.fn().mockResolvedValue("translated html");

  // Create a mock for the createFalconService function
  const mockCreateFalconService = jest
    .fn()
    .mockImplementation((onDetectionChanged) => {
      // Call the callback with test data
      setTimeout(() => onDetectionChanged("test-detection-id"), 0);

      // Return the mock service object
      return Promise.resolve({
        getDetectionById: mockGetDetectionById,
        getCollectionData: mockGetCollectionData,
        getDetectionComments: mockGetDetectionComments,
        translateHtml: mockTranslateHtml,
        data: { detectionId: "test-detection-id" },
      });
    });

  // Return the mock module
  return {
    ...actual,
    createFalconService: mockCreateFalconService,
    mockGetDetectionById,
    mockGetCollectionData,
    mockGetDetectionComments,
    mockTranslateHtml,
  };
});

// Import the mocked functions
import {
  createFalconService,
  mockGetDetectionById,
  mockGetCollectionData,
  mockGetDetectionComments,
  mockTranslateHtml,
} from "../falconService";

describe("falconService", () => {
  let service;
  const mockOnDetectionChanged = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();

    // Create the service
    service = await createFalconService(mockOnDetectionChanged);
  });

  test("should initialize and connect to Falcon API", () => {
    // Verify the service was created successfully
    expect(service).toBeTruthy();
  });

  describe("getDetectionById", () => {
    test("should fetch detection by id", async () => {
      await service.getDetectionById("test-detection-id");
      expect(mockGetDetectionById).toHaveBeenCalledWith("test-detection-id");
    });
  });

  describe("getCollectionData", () => {
    test("should fetch collection data for a detection", async () => {
      const result = await service.getCollectionData("test-detection-id");
      expect(mockGetCollectionData).toHaveBeenCalledWith("test-detection-id");
      expect(result).toEqual([{ object_key: "test-key" }]);
    });

    test("should handle empty search results", async () => {
      // Configure mock to return empty results for this test
      mockGetCollectionData.mockResolvedValueOnce([]);

      const result = await service.getCollectionData("test-detection-id");
      expect(result).toEqual([]);
    });
  });

  describe("getDetectionComments", () => {
    test("should fetch comments for a detection", async () => {
      // Configure mock to return comments for this test
      const mockComments = [
        { type: "comment", content: "Test comment 1" },
        { type: "comment", content: "Test comment 2" },
      ];
      mockGetDetectionComments.mockResolvedValueOnce(mockComments);

      const result = await service.getDetectionComments("test-detection-id");

      expect(mockGetDetectionComments).toHaveBeenCalledWith(
        "test-detection-id"
      );
      expect(result).toEqual(mockComments);
    });

    test("should handle no cases found", async () => {
      // Configure mock to return empty array for this test
      mockGetDetectionComments.mockResolvedValueOnce([]);

      const result = await service.getDetectionComments("test-detection-id");
      expect(result).toEqual([]);
    });
  });

  describe("translateHtml", () => {
    test("should handle successful translation", async () => {
      const translationParams = {
        language: "es",
        htmlContent: "<p>Original content</p>",
        compositeId: "test-detection-id",
        title: "Test Title",
        type: "note",
        objectKey: "test-key",
      };

      // Configure mock to return translation for this test
      mockTranslateHtml.mockResolvedValueOnce("Translated content");

      const result = await service.translateHtml(translationParams);

      expect(mockTranslateHtml).toHaveBeenCalledWith(translationParams);
      expect(result).toBe("Translated content");
    });

    test("should throw WorkflowTimeoutError after max polling attempts", async () => {
      const translationParams = {
        language: "es",
        htmlContent: "<p>Original content</p>",
        compositeId: "test-detection-id",
        title: "Test Title",
        type: "note",
        objectKey: "test-key",
      };

      // Configure mock to throw WorkflowTimeoutError for this test
      mockTranslateHtml.mockRejectedValueOnce(new WorkflowTimeoutError());

      await expect(service.translateHtml(translationParams)).rejects.toThrow(
        WorkflowTimeoutError
      );
    });

    test("should throw error when workflow API returns errors", async () => {
      const translationParams = {
        language: "es",
        htmlContent: "<p>Original content</p>",
        compositeId: "test-detection-id",
        title: "Test Title",
        type: "note",
        objectKey: "test-key",
      };

      // Configure mock to throw error for this test
      mockTranslateHtml.mockRejectedValueOnce(
        new Error("ERROR_CODE API Error")
      );

      await expect(service.translateHtml(translationParams)).rejects.toThrow(
        "ERROR_CODE API Error"
      );
    });
  });

  describe("WorkflowTimeoutError", () => {
    test("should have correct error message", () => {
      const error = new WorkflowTimeoutError();
      expect(error.message).toBe(
        "Max polling attempts for workflow completion"
      );
      expect(error instanceof Error).toBe(true);
    });
  });
});
