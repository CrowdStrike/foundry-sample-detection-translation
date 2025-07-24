import { WorkflowTimeoutError } from "./falconService";
import { contextEntryHtml, detectionHtml } from "./htmlGenerator";

export async function translateDetection({
  detectionId,
  language,
  collectionEntry,
  domSlots,
  falconService,
}) {
  const { title, type, objectKey } = collectionEntry;
  const { getDetectionById, getDetectionComments, translateHtml } =
    falconService;
  try {
    domSlots.translationSlot.innerHTML = contextEntryHtml({
      title: "Translation in progress...",
      content:
        "Your translation is being processed. This may take a few moments depending on content size",
    });

    const alert = await getDetectionById(detectionId);

    const comments = await getDetectionComments(detectionId);

    const htmlContent = detectionHtml(alert, comments);

    const translatedContent = await translateHtml({
      language,
      htmlContent,
      collectionEntry,
    });

    domSlots.translationSlot.innerHTML = contextEntryHtml({
      title,
      content: translatedContent ?? htmlContent,
    });
  } catch (error) {
    if (error instanceof WorkflowTimeoutError)
      // Sometimes the workflow is not marked as complete but the translation is already stored in the collection
      return await processDetection({
        detectionId,
        domSlots,
        language,
        falconService,
      });

    console.error("Error processing detection:", error);
    domSlots.translationSlot.innerHTML = `
      <div class="p-4 bg-red-100 border border-red-400 text-red-700  rounded">
        Error translating detection: ${error.message}
      </div>
    `;
  }
}

export async function processDetection({
  detectionId,
  domSlots,
  language,
  falconService,
}) {
  let entries = [];
  const { getCollectionData } = falconService;
  const { translationSlot, contextSlot } = domSlots;

  try {
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
      const collectionEntry = {
        title,
        type,
        objectKey,
        compositeId: detectionId,
      };
      btn.addEventListener("click", () =>
        translateDetection({
          detectionId,
          language,
          collectionEntry,
          falconService,
          domSlots,
        })
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
