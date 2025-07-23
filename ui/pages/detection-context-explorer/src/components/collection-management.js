import React, { useContext, useEffect, useState } from "react";
import { FalconApiContext } from "../contexts/falcon-api-context";
import DOMPurify from "dompurify";

export function CollectionManagement() {
  const { falcon } = useContext(FalconApiContext);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editEntry, setEditEntry] = useState(null);
  const [newEntry, setNewEntry] = useState({
    title: "",
    content: "",
    type: "note",
    compositeId: "",
  });
  const [addNewVisible, setAddNewVisible] = useState(false);

  const collection = falcon.collection({ collection: "detection_context" });

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await collection.list();

      if (data?.resources?.length) {
        const promises = data.resources.map((objectKey) =>
          collection.read(objectKey).then((entry) => ({ ...entry, objectKey }))
        );
        const fetchedEntries = await Promise.all(promises);
        setEntries(fetchedEntries);
      } else {
        setEntries([]);
      }
    } catch (err) {
      console.error("Error fetching entries:", err);
      setError("Failed to fetch     entries");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (objectKey) => {
    try {
      await collection.delete(objectKey);
      await fetchEntries();
    } catch (err) {
      console.error("Error deleting  entry:", err);
      setError("Failed to delete entry");
    }
  };

  const handleUpdate = async () => {
    if (!editEntry) return;

    try {
      await collection.write(editEntry.objectKey, {
        title: editEntry.title,
        content: DOMPurify.sanitize(editEntry.content),
        type: editEntry.type,
        compositeId: editEntry.compositeId,
      });
      setEditEntry(null);
      await fetchEntries();
    } catch (err) {
      console.error("Error updating entry:", err);
      setError("Failed to update     entry");
    }
  };

  const handleCreate = async () => {
    if (!newEntry.title || !newEntry.content) {
      setError("Title and content are required");
      return;
    }
    if (!newEntry.compositeId) {
      setError("Composite ID is required");
      return;
    }

    try {
      // Fix the regex to properly replace invalid characters with empty string
      const key = `${newEntry.compositeId.replace(/[^\w\-\.]/g, "")}_${
        newEntry.type
      }`;
      await collection.write(key, {
        compositeId: newEntry.compositeId,
        title: newEntry.title,
        content: DOMPurify.sanitize(newEntry.content),
        type: newEntry.type || "note",
      });
      setNewEntry({ title: "", content: "", type: "note" });
      await fetchEntries();
    } catch (err) {
      console.error("Error creating entry:", err);
      setError("Failed to create entry");
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  return (
    <div className="container mx-auto mt-8 px-4 pb-16 max-w-6xl">
      <h1 className="text-3xl font-bold mb-8 text-gray-800 pb-4 text-center">
        Detection Context Management
      </h1>

      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 shadow-sm flex justify-between items-center">
          <p className="font-medium">{error}</p>
          <button
            className="text-red-500 hover:text-red-700 transition-colors duration-200 text-xl"
            onClick={() => setError(null)}
            aria-label="Dismiss"
          >
            &times;
          </button>
        </div>
      )}

      {/* Create New Entry Form */}
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-200 flex items-center mb-10"
        onClick={() => setAddNewVisible((s) => !s)}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 mr-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
          />
        </svg>
        Create Entry
      </button>
      {addNewVisible && (
        <div className="bg-white p-8 rounded-xl shadow-lg mb-10 border border-gray-100">
          <h2 className="text-2xl font-semibold mb-6 text-gray-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add New Entry
          </h2>
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Composite ID
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={newEntry.compositeId}
                  placeholder="Enter composite ID"
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, compositeId: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                  value={newEntry.type}
                  placeholder="e.g., note, alert, log"
                  onChange={(e) =>
                    setNewEntry({ ...newEntry, type: e.target.value })
                  }
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200"
                value={newEntry.title}
                placeholder="Enter a descriptive title"
                onChange={(e) =>
                  setNewEntry({ ...newEntry, title: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <textarea
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-200 h-40"
                value={newEntry.content}
                placeholder="Enter content details here..."
                onChange={(e) =>
                  setNewEntry({ ...newEntry, content: e.target.value })
                }
              ></textarea>
            </div>
            <div className="pt-3">
              <button
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium shadow-md transition-all duration-200 flex items-center"
                onClick={handleCreate}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Entries */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 mr-2 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
            Existing Entries
          </h2>
          <span className="bg-indigo-100 text-indigo-800 text-sm px-3 py-1 rounded-full font-medium">
            {entries.length} {entries.length === 1 ? "entry" : "entries"}
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <span className="ml-3 text-lg text-gray-600">
              Loading entries...
            </span>
          </div>
        ) : entries.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-10 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-16 w-16 text-gray-400 mx-auto mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="text-xl font-medium text-gray-700 mb-2">
              No entries found
            </h3>
            <p className="text-gray-500">
              Create your first entry using the form above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="border border-gray-100 rounded-xl bg-white shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg"
              >
                {editEntry && editEntry.objectKey === entry.objectKey ? (
                  <div className="p-6 space-y-5">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Editing Entry
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Title
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEntry.title}
                          onChange={(e) =>
                            setEditEntry({
                              ...editEntry,
                              title: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type
                        </label>
                        <input
                          type="text"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                          value={editEntry.type}
                          onChange={(e) =>
                            setEditEntry({ ...editEntry, type: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Content
                      </label>
                      <textarea
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 h-32"
                        value={editEntry.content}
                        onChange={(e) =>
                          setEditEntry({
                            ...editEntry,
                            content: e.target.value,
                          })
                        }
                      ></textarea>
                    </div>
                    <div className="flex space-x-3 pt-3">
                      <button
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                        onClick={handleUpdate}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        Save Changes
                      </button>
                      <button
                        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                        onClick={() => setEditEntry(null)}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4 mr-1"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            {entry.type}
                          </span>

                          <div className="flex space-x-3 mb-3">
                            <span className="inline-flex items-center text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4 mr-1"
                                fill="none"
                                viewBox="0 0 24  24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
                                />
                              </svg>
                              ID: {entry.compositeId}
                            </span>
                          </div>
                          <h3 className="font-semibold text-xl text-gray-800 mb-2">
                            {entry.title}
                          </h3>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 p-2 rounded-lg transition-colors duration-200"
                            onClick={() => setEditEntry(entry)}
                            title="Edit entry"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-lg transition-colors duration-200"
                            onClick={() => handleDelete(entry.objectKey)}
                            title="Delete entry"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div
                          className="text-gray-700 text-sm"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(entry.content),
                          }}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
