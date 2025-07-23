import { contextEntryHtml, commentHtml, detectionHtml } from "../htmlGenerator";
import DOMPurify from "dompurify";

// Mock DOMPurify to isolate our tests from the actual implementation
jest.mock("dompurify", () => ({
  sanitize: jest.fn((content) => `sanitized_${content}`),
}));

describe("htmlGenerator", () => {
  beforeEach(() => {
    // Clear mock calls before each test
    jest.clearAllMocks();
  });

  describe("contextEntryHtml", () => {
    test("should generate HTML with title and content", () => {
      const mockEntry = {
        title: "Test Title",
        content: "Test Content",
      };

      const result = contextEntryHtml(mockEntry);

      // Check that DOMPurify sanitize was called for both title and content
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("Test Title");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("Test Content");

      // Check the structure of the generated HTML
      expect(result).toContain("sanitized_Test Title");
      expect(result).toContain("sanitized_Test Content");
      expect(result).toContain(
        '<div class="space-y-2 rounded bg-surface-md p-3 shadow-base">'
      );
    });
  });

  describe("commentHtml", () => {
    test("should generate HTML for a comment", () => {
      const mockComment = {
        created_by: { display_name: "Test User" },
        created_time: "2023-01-01T12:00:00Z",
        body: "This is a test comment",
      };

      const result = commentHtml(mockComment);

      // Check that DOMPurify sanitize was called with the expected values
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("Test User");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("2023-01-01T12:00:00Z");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("This is a test comment");

      // Check the structure of the generated HTML
      expect(result).toContain('<li class="grid gap-1">');
      expect(result).toContain("sanitized_Test User");
      expect(result).toContain("sanitized_2023-01-01T12:00:00Z");
      expect(result).toContain("sanitized_This is a test comment");
    });
  });

  describe("detectionHtml", () => {
    test("should generate HTML for a detection without comments", () => {
      const mockAlert = {
        description: "Test Description",
        overwatch_note: "Test Overwatch Note",
        overwatch_note_timestamp: "2023-01-01T12:00:00Z",
        automated_triage: {
          triage_explanation: "Test Triage Explanation",
        },
      };

      const result = detectionHtml(mockAlert);

      // Check that DOMPurify sanitize was called with the expected values
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("Test Description");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("Test Overwatch Note");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("2023-01-01T12:00:00Z");
      expect(DOMPurify.sanitize).toHaveBeenCalledWith(
        "Test Triage Explanation"
      );

      // Check the structure of the generated HTML
      expect(result).toContain('<dl class="space-y-6">');
      expect(result).toContain("sanitized_Test Description");
      expect(result).toContain("sanitized_Test Overwatch Note");
      expect(result).toContain("sanitized_2023-01-01T12:00:00Z");
      expect(result).toContain("sanitized_Test Triage Explanation");

      // Verify no comments section
      expect(result).not.toContain("<h2>Comments</h2>");
    });

    test("should generate HTML for a detection with comments", () => {
      const mockAlert = {
        description: "Test Description",
        overwatch_note: "Test Overwatch Note",
        overwatch_note_timestamp: "2023-01-01T12:00:00Z",
        automated_triage: {
          triage_explanation: "Test Triage Explanation",
        },
      };

      const mockComments = [
        {
          created_by: { display_name: "User 1" },
          created_time: "2023-01-01T12:00:00Z",
          body: "Comment 1",
        },
        {
          created_by: { display_name: "User 2" },
          created_time: "2023-01-02T12:00:00Z",
          body: "Comment 2",
        },
      ];

      const result = detectionHtml(mockAlert, mockComments);

      // Check that comments are included
      expect(result).toContain(
        '<h3 class="font-semibold text-gray-900 text-sm">Comments</h3>'
      );
      expect(DOMPurify.sanitize).toHaveBeenCalled();
    });
  });
});
