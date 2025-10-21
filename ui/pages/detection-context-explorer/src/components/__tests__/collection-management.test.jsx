vi.mock("dompurify");

import DOMPurify from "dompurify";

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, beforeEach, expect } from "vitest";
import { CollectionManagement } from "../collection-management";
import { FalconApiContext } from "../../contexts/falcon-api-context";

// Mock DOMPurify
DOMPurify.sanitize = vi.fn((content) => `sanitized_${content}`);

// Create a mock collection with all required methods
const createMockCollection = () => ({
  list: vi.fn(),
  read: vi.fn(),
  write: vi.fn(),
  delete: vi.fn(),
});

describe("CollectionManagement", () => {
  let mockCollection;
  let mockFalcon;
  let mockEntries;
  let user;

  beforeEach(() => {
    // Setup test user for interactions
    user = userEvent.setup();

    // Reset mocks
    mockCollection = createMockCollection();

    // Setup mock entries
    mockEntries = [
      {
        objectKey: "entry1",
        title: "Entry 1",
        content: "Content 1",
        type: "note",
        compositeId: "id-1",
      },
      {
        objectKey: "entry2",
        title: "Entry 2",
        content: "Content 2",
        type: "translation",
        compositeId: "id-2",
      },
    ];

    // Setup mock collection responses
    mockCollection.list.mockResolvedValue({
      resources: ["entry1", "entry2"],
    });

    mockCollection.read.mockImplementation((key) => {
      const entry = mockEntries.find((e) => e.objectKey === key);
      return Promise.resolve(entry);
    });

    // Setup mock falcon api
    mockFalcon = {
      collection: vi.fn(() => mockCollection),
    };

    // Mock console errors to avoid test output noise
    console.error = vi.fn();
  });

  const renderComponent = () => {
    return render(
      <FalconApiContext.Provider
        value={{ falcon: mockFalcon, isInitialized: true }}
      >
        <CollectionManagement />
      </FalconApiContext.Provider>
    );
  };

  test("should fetch and display entries on initial render", async () => {
    renderComponent();

    // Wait for entries to load
    await waitFor(() => {
      expect(mockCollection.list).toHaveBeenCalledWith();
      expect(mockCollection.read).toHaveBeenCalledTimes(2);
    });

    // Should display the entries
    await waitFor(() => {
      expect(screen.getByText("Entry 1")).toBeInTheDocument();
      expect(screen.getByText("Entry 2")).toBeInTheDocument();
    });
  });

  test("should show empty state when no entries found", async () => {
    // Mock empty collection
    mockCollection.list.mockResolvedValue({ resources: [] });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("No entries found")).toBeInTheDocument();
      expect(
        screen.getByText("Create your first entry using the form above.")
      ).toBeInTheDocument();
    });
  });

  test("should toggle add new entry form when button is clicked", async () => {
    renderComponent();

    // Initially form should be hidden
    expect(screen.queryByText("Add New Entry")).not.toBeInTheDocument();

    // Click to show form
    const createButton = await screen.findByText("Create Entry");
    await user.click(createButton);

    // Form should be visible
    expect(screen.getByText("Add New Entry")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Enter composite ID")
    ).toBeInTheDocument();

    // Click again to hide
    await user.click(createButton);

    // Form should be hidden again
    await waitFor(() => {
      expect(screen.queryByText("Add New Entry")).not.toBeInTheDocument();
    });
  });

  test("should create a new entry when form is submitted", async () => {
    renderComponent();

    // Show the form
    const createButton = await screen.findByText("Create Entry");
    await user.click(createButton);

    // Clear and fill out the form
    await user.type(
      screen.getByPlaceholderText("Enter composite ID"),
      "new-id"
    );

    // Need to clear the type field first since it starts with "note" value
    const typeInput = screen.getByPlaceholderText("e.g., note, alert, log");
    await user.clear(typeInput);
    await user.type(typeInput, "note");

    await user.type(
      screen.getByPlaceholderText("Enter a descriptive title"),
      "New Entry Title"
    );
    await user.type(
      screen.getByPlaceholderText("Enter content details here..."),
      "New entry content"
    );

    // Update the test expectation to match what's actually being sent
    mockCollection.write.mockImplementation((key, data) => {
      // Mock the write to return a successful promise
      return Promise.resolve({});
    });

    // Submit the form
    const submitButton = screen.getAllByText("Create Entry")[1]; // Second button is the submit one
    await user.click(submitButton);

    // Check if collection.write was called with correct params
    await waitFor(() => {
      expect(mockCollection.write).toHaveBeenCalledWith("new-id_note", {
        compositeId: "new-id",
        title: "New Entry Title",
        content: "sanitized_New entry content",
        type: "note",
      });
      expect(DOMPurify.sanitize).toHaveBeenCalledWith("New entry content");
    });

    // Should refresh entries
    expect(mockCollection.list).toHaveBeenCalledTimes(2);
  });

  test("should show validation errors when form is incomplete", async () => {
    renderComponent();

    // Show the form
    const createButton = await screen.findByText("Create Entry");
    await user.click(createButton);

    // Submit without filling
    const submitButton = screen.getAllByText("Create Entry")[1];
    await user.click(submitButton);

    // Should show error
    expect(
      screen.getByText("Title and content are required")
    ).toBeInTheDocument();

    // Fill only title
    await user.type(
      screen.getByPlaceholderText("Enter a descriptive title"),
      "Title only"
    );
    await user.click(submitButton);

    // Should still show error
    expect(
      screen.getByText("Title and content are required")
    ).toBeInTheDocument();

    // Add content but not ID
    await user.type(
      screen.getByPlaceholderText("Enter content details here..."),
      "Content added"
    );
    await user.click(submitButton);

    // Should show different error
    expect(screen.getByText("Composite ID is required")).toBeInTheDocument();
  });

  test("should allow editing an entry", async () => {
    renderComponent();

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByText("Entry 1")).toBeInTheDocument();
    });

    // Find and click edit button on first entry
    const editButtons = await screen.findAllByTitle("Edit entry");
    await user.click(editButtons[0]);

    // Edit form should be visible
    expect(screen.getByText("Editing Entry")).toBeInTheDocument();

    // Edit the title
    const titleInputs = screen.getAllByRole("textbox");
    // Find the input that's within the editing form by finding the one after the "Editing Entry" heading
    const editingSection = screen.getByText("Editing Entry").closest("div");
    const titleInput = editingSection.querySelector('input[type="text"]');

    await user.clear(titleInput);
    await user.type(titleInput, "Updated Title");

    // Save changes
    const saveButton = screen.getByText("Save Changes");
    await user.click(saveButton);

    // Check if collection.write was called with correct params
    await waitFor(() => {
      expect(mockCollection.write).toHaveBeenCalledWith(
        "entry1",
        expect.objectContaining({
          title: "Updated Title",
        })
      );
    });

    // Should refresh entries
    expect(mockCollection.list).toHaveBeenCalledTimes(2);
  });

  test("should delete an entry when delete button is clicked", async () => {
    renderComponent();

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByText("Entry 1")).toBeInTheDocument();
    });

    // Find and click delete button on first entry
    const deleteButtons = await screen.findAllByTitle("Delete entry");
    await user.click(deleteButtons[0]);

    // Check if collection.delete was called with correct key
    await waitFor(() => {
      expect(mockCollection.delete).toHaveBeenCalledWith("entry1");
    });

    // Should refresh entries
    expect(mockCollection.list).toHaveBeenCalledTimes(2);
  });

  test("should handle API errors during fetch", async () => {
    // Mock API error
    mockCollection.list.mockRejectedValue(new Error("API Error"));

    renderComponent();

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch entries")).toBeInTheDocument();
    });
  });

  test("should dismiss error when close button is clicked", async () => {
    // Mock API error to trigger error state
    mockCollection.list.mockRejectedValue(new Error("API Error"));

    renderComponent();

    // Wait for error to appear
    await waitFor(() => {
      expect(screen.getByText("Failed to fetch entries")).toBeInTheDocument();
    });

    // Find and click close button on error
    const dismissButton = screen.getByLabelText("Dismiss");
    await user.click(dismissButton);

    // Error should be gone
    expect(
      screen.queryByText("Failed to fetch entries")
    ).not.toBeInTheDocument();
  });
});
