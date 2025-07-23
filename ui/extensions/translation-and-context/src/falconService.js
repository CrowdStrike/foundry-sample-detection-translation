import FalconApi from "@crowdstrike/foundry-js";
const POLL_MS = 5000;
const POLL_MAX_ATTEMPTS = 60000 / POLL_MS;
const WORKFLOW_NAME = "translate-with-charlotte-ai";

export const createFalconService = async (onDetectionChanged) => {
  const falcon = new FalconApi();
  falcon.events.on("data", (data) => {
    onDetectionChanged(data?.detectionId ?? data?.detection?.composite_id);
  });
  await falcon.connect();

  const getDetectionById = async (detectionId) => {
    const postEntitiesAlertsV2 = api("PostEntitiesAlertsV2", { json: true });
    const alert = await postEntitiesAlertsV2.get({
      composite_ids: [detectionId],
    });

    return alert;
  };

  const getCollectionData = async (detectionId) => {
    const collection = falcon.collection({ collection: "detection_context" });

    const keys = await collection.search({
      filter: `compositeId:'${detectionId}'`,
    });

    const entries = await Promise.all(
      keys?.resources?.map(({ object_key }) =>
        collection.read(object_key).then((entry) => ({ ...entry, object_key }))
      )
    );

    return entries.filter(Boolean);
  };

  const getDetectionComments = async (detectionId) => {
    const queryCasesIdsByFilter = api("QueryCasesIdsByFilter");
    const queryActivityByCaseID = api("QueryActivityByCaseID");
    const getCaseActivityByIds = api("GetCaseActivityByIds", { json: true });

    const cases = await queryCasesIdsByFilter.list({
      query: {
        filter: `case.detections.id:'${detectionId}'`,
      },
    });

    const activityIds = await Promise.all(
      cases.map((case_id) => queryActivityByCaseID.list({ query: { case_id } }))
    );

    const ids = activityIds
      .flat()
      .filter(Boolean)
      .filter((id) => typeof id === "string");

    const activities = ids.length
      ? await getCaseActivityByIds.list({ ids })
      : [];

    return activities.filter(({ type }) => type === "comment");
  };

  const translateHtml = async ({ language, htmlContent, collectionEntry }) => {
    const triggerResult = await falcon.api.workflows.postEntitiesExecuteV1(
      { language, htmlContent, ...collectionEntry },
      { name: WORKFLOW_NAME, depth: 0 }
    );

    if (triggerResult.errors?.length) {
      throw Error(
        `${triggerResult?.errors[0].code} ${triggerResult.errors[0].message}`
      );
    }

    const ids = triggerResult?.resources?.[0];

    const poll = async () =>
      falcon.api.workflows.getEntitiesExecutionResultsV1({ ids });

    let errors = [];
    let resources = [{ status: "In progress" }];
    let attempts = 0;
    while (!errors?.length && resources?.[0]?.status === "In progress") {
      if (attempts >= POLL_MAX_ATTEMPTS) throw new WorkflowTimeoutError();
      attempts++;
      await aMoment();
      ({ errors, resources } = await poll());
    }

    return Object.values(resources?.[0]?.output_data ?? {}).join("\n");
  };

  const api = (operationId, { json } = {}) => {
    const _api = falcon.apiIntegration({
      definitionId: "Crowdstrike alerts and message-center",
      operationId,
    });

    const exec = (params) =>
      _api.execute({ request: { [json ? "json" : "params"]: params } });

    const getResults = (res) =>
      res?.resources?.[0]?.response_body?.resources ?? [];

    return {
      get: (params) => exec(params).then((res) => getResults(res)?.[0] ?? {}),
      list: (params) => exec(params).then(getResults),
    };
  };

  return {
    getDetectionById,
    getCollectionData,
    getDetectionComments,
    translateHtml,
    data: {
      ...falcon.data,
      detectionId:
        falcon.data?.detectionId ?? falcon.data?.detection?.composite_id,
    },
  };
};

const aMoment = () => new Promise((resolve) => setTimeout(resolve, POLL_MS));

export class WorkflowTimeoutError extends Error {
  constructor() {
    super("Max polling attempts for workflow completion");
  }
}
