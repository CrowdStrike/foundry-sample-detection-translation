import { createFalconService, WorkflowTimeoutError } from "./falconService.js";
import { contextEntryHtml, detectionHtml } from "./htmlGenerator.js";

// Extracted for testability
export async function translateDetection(
  getDetectionById,
  getDetectionComments,
  translateHtml,
  translationSlot,
  detectionId,
  language,
  title,
  type,
  objectKey
) {
  try {
    translationSlot.innerHTML = contextEntryHtml({
      title: "Translation in progress...",
      content:
        "Your translation is being processed. This may take a few moments depending on content size",
    });

    const alert = await getDetectionById(detectionId);
    console.log({ alert });

    const comments = await getDetectionComments(detectionId);
    console.log({ comments });

    const htmlContent = detectionHtml(alert, comments);

    const translatedContent = await translateHtml({
      language,
      htmlContent,
      compositeId: detectionId,
      title,
      type,
      objectKey,
    });

    translationSlot.innerHTML = contextEntryHtml({
      title,
      content: translatedContent ?? htmlContent,
    });
  } catch (error) {
    if (error instanceof WorkflowTimeoutError)
      // Sometimes the workflow is not marked as complete but the translation is already stored in the collection
      return await processDetection(detectionId);

    console.error("Error processing detection:", error);
    translationSlot.innerHTML = `
      <div class="p-4 bg-red-100 border border-red-400 text-red-700  rounded">
        Error translating detection: ${error.message}
      </div>
    `;
  }
}

// Extracted for testability
export async function processDetection(
  detectionId,
  getCollectionData,
  translateDetection,
  translationSlot,
  contextSlot,
  currentLanguage
) {
  let entries = [];
  const language =
    currentLanguage ||
    (navigator.language
      ? navigator.language.toLowerCase().split("-")[0]
      : "en");

  try {
    console.log({ detectionId, language });

    translationSlot.innerHTML = "";
    contextSlot.innerHTML = contextEntryHtml({
      title: "",
      content: "Loading detection context...",
    });

    entries = await getCollectionData(detectionId);

    const cleanDetectionId = detectionId.replace(/[^\w\-\.]/g, "");
    const title = `Detection translation (${language})`;
    const type = `translation_${language}`;
    const objectKey = `${cleanDetectionId}_${type}`;
    const translationEntry = entries.find(
      ({ object_key }) => object_key === objectKey
    );

    let translationHtml = "";

    if (translationEntry) translationHtml = contextEntryHtml(translationEntry);
    else if (language === "en")
      translationHtml = contextEntryHtml({
        title,
        content: `Your browser language is already configured in English. No translation needed.`,
      });
    else
      translationHtml = contextEntryHtml({
        title,
        content: `
        <div>
          <p>There is no yet translation available for this detection. Click in the button to get an AI translation of the detection details.<p>
          <p>The translation will use Charlotte AI credit</p>
          <button id="translateBtn"  
            class="focusable interactive-normal type-md-medium rounded-sm my-2 py-1 px-3 transition duration-150 ease-in-out focusable transition">
            Translate detection details
          </button>
        </div>`,
      });

    translationSlot.innerHTML = translationHtml;
    const otherEntries = entries.filter(
      ({ object_key }) => object_key !== objectKey
    );
    contextSlot.innerHTML = otherEntries.map(contextEntryHtml).join("");

    const btn = document.getElementById("translateBtn");
    if (btn) {
      btn.addEventListener("click", () =>
        translateDetection(
          detectionId,
          language,
          title,
          type,
          objectKey,
          getDetectionById,
          getDetectionComments,
          translateHtml,
          translationSlot
        )
      );
    }
  } catch (error) {
    console.error("Error processing detection:", error);
    translationSlot.innerHTML = `
      <div class="p-4 bg-red-100 border border-red-400 text-red-700  rounded">
        Error processing detection: ${error.message}
      </div>
    `;
  }

  return { entries, language };
}

// Extracted for testability
export function onDetectionChanged(
  newId,
  currentDetectionId,
  processDetectionFn
) {
  if (currentDetectionId && newId && currentDetectionId !== newId) {
    processDetectionFn(newId);
  }
}

// Main function that initializes the application
async function main() {
  let currentDetectionId;
  const translationSlot = document.getElementById("translationSlot");
  const contextSlot = document.getElementById("contextSlot");

  const detectionChangedHandler = (newId) =>
    onDetectionChanged(newId, currentDetectionId, async (id) => {
      currentDetectionId = id;
      await processDetection(
        id,
        getCollectionData,
        translateDetection,
        translationSlot,
        contextSlot
      );
    });

  const {
    getDetectionById,
    getCollectionData,
    getDetectionComments,
    translateHtml,
    data,
  } = await createFalconService(detectionChangedHandler);

  currentDetectionId = data.detectionId;
  await processDetection(
    data.detectionId,
    getCollectionData,
    (detectionId, language, title, type, objectKey) =>
      translateDetection(
        detectionId,
        language,
        title,
        type,
        objectKey,
        getDetectionById,
        getDetectionComments,
        translateHtml,
        translationSlot
      ),
    translationSlot,
    contextSlot
  );
}

// Only run main in browser environment
if (typeof window !== "undefined") {
  main();
}
