import { createFalconService } from "./falconService.js";
import { processDetection } from "./processDetection.js";

async function main() {
  let detectionId;
  const domSlots = {
    translationSlot: document.getElementById("translationSlot"),
    contextSlot: document.getElementById("contextSlot"),
  };
  const language = navigator.language
    ? navigator.language.toLowerCase().split("-")[0]
    : "en";

  const detectionChangedHandler = (newId) => {
    if (detectionId && newId && detectionId !== newId) {
      processDetection({
        detectionId: newId,
        language,
        domSlots,
        falconService,
      });
    }
  };

  const { data, ...falconService } = await createFalconService(
    detectionChangedHandler
  );

  detectionId = data.detectionId;
  await processDetection({
    detectionId,
    language,
    domSlots,
    falconService,
  });
}

if (typeof window !== "undefined") {
  main();
}
