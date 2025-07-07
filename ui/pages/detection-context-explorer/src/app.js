import React from "react";
import {
  useFalconApiContext,
  FalconApiContext,
} from "./contexts/falcon-api-context.js";
import ReactDOM from "react-dom/client";
import { CollectionManagement } from "./components/collection-management.js";

function App() {
  const { falcon, navigation, isInitialized } = useFalconApiContext();

  if (!isInitialized) {
    return null;
  }

  return (
    <React.StrictMode>
      <FalconApiContext.Provider value={{ falcon, navigation, isInitialized }}>
        <CollectionManagement />
      </FalconApiContext.Provider>
    </React.StrictMode>
  );
}

const domContainer = document.querySelector("#app");
const root = ReactDOM.createRoot(domContainer);

root.render(<App />);
