import FalconApi from "@crowdstrike/foundry-js";
import { createContext, useEffect, useMemo, useState } from "react";

const FalconApiContext = createContext(null);

function useFalconApiContext() {
  const [isInitialized, setIsInitialized] = useState(false);
  const falcon = useMemo(() => new FalconApi(), []);
  const [navigation, setNavigation] = useState(undefined);

  useEffect(() => {
    (async () => {
      await falcon.connect();
      setNavigation(falcon.navigation);
      setIsInitialized(true);
    })();
  }, []);

  return { falcon, navigation, isInitialized };
}

export { useFalconApiContext, FalconApiContext };
