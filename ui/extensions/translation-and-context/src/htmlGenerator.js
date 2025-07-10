import DomPurify from "dompurify";

const sanitize = DomPurify.sanitize;

export const contextEntryHtml = ({ title, content }) =>
  `<div class="my-4 space-y-2 rounded bg-surface-md p-3 shadow-base">
      <header class="type-md-tight-medium overflow-hidden text-titles-and-attributes">
        ${sanitize(title)}
      </header>
      <div class="type-md min-h-6 text-titles-and-attributes">
        ${sanitize(content)}
      </div>
    </div>`;

export const commentHtml = ({
  created_by: { display_name },
  created_time,
  body,
}) => `
  <li class="grid gap-1">
    <div class="font-semibold text-gray-900">
        ${sanitize(display_name)} on ${sanitize(created_time)}
    </div>
    ${sanitize(body)}
  </li>`;

export const detectionHtml = (alert, comments = []) => {
  const {
    description,
    overwatch_note,
    overwatch_note_timestamp,
    automated_triage,
  } = alert;
  const { triage_explanation } = automated_triage ?? {};

  let html = `
  <dl class="space-y-6">  
    <div class="grid gap-1">
      <dt class="font-semibold text-gray-900">Description</dt>
      <dd class="text-gray-600">
        ${sanitize(description)}
      </dd>
    </div>

    <div class="grid gap-1">
      <dt class="font-semibold text-gray-900">
        Overwatch notes ${
          overwatch_note_timestamp
            ? "(" + sanitize(overwatch_note_timestamp) + ")"
            : ""
        }
      </dt>
      <dd class="text-gray-600">
        ${sanitize(overwatch_note)}
      </dd>
    </div>
      
    <div class="grid gap-1">
      <dt class="font-semibold text-gray-900">AI Triage</dt>
      <dd class="text-gray-600">
        ${sanitize(triage_explanation)}
      </dd>
    </div>
  </dl>
`;

  if (comments.length) {
    html += `
    <div class="mt-6">
      <h2 class="font-semibold text-gray-900">Falcon complete</h2> 
      <h3 class="font-semibold text-gray-900 text-sm">Comments</h3> 
      <ul class="space-y-6">
        ${comments.map(commentHtml).map(sanitize).join("\n")}
      </ul>
    </div>`;
  }

  return html;
};
