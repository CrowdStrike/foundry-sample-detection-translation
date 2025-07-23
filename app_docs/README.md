# Detection Translation and Custom Context

Leverage Charlotte AI to provide translation of detection alerts. This application allows security teams to:

- Access AI-powered translations of detection data for improved clarity
- Add customized context to any detection for better team communication
- Streamline investigation workflows with enriched detection information
- Maintain comprehensive documentation of security events

## Configuration

This app requires a Crowdstrike API key.

1. Create an Crowdstrike API key

Navigate to [Support and resources > API clients and keys](/api-clients-and-keys) and press "Create API Client"

Please add these permissions:

- Alerts - read
- Message Center - read

Store in a safe place the client id, the secret and the base URL to use them in the next step

2. Install the app

Install this app. You will be requested for the API details you stored in the previous step

## How It Works

1. **Detection Translation**:

   - When viewing a detection, the extension loads in the sidebar
   - The app checks if a translation already exists for the detection in the user's browser language
   - If no translation exists, it offers a button to generate one
   - When requested, the app:
     - Retrieves the detection details and comments
     - Formats the content as structured HTML
     - Triggers the `translate-with-charlotte-ai` workflow
     - Displays the translated content once complete

2. **Context Management**:

   - Users can add custom contextual information to any detection
   - The system stores this context alongside translations in the `detection_context` collection
   - Each context entry is linked to a specific detection via its `compositeId`

3. **Detection Context Explorer**:
   - Provides a centralized interface for managing all detection context entries
   - Users can create, edit, view, and delete contextual information
   - All entries are saved to the `detection_context` collection for persistence

## Architecture and Components

This sample demonstrates several powerful Foundry capabilities, including UI extensions that integrate directly into existing Falcon interfaces, workflow integration with Charlotte AI for natural language processing, collections for data persistence, and seamless API integrations with the Falcon platform. Together, these components create a cohesive application that enhances security operations by providing translated detection information and enabling teams to maintain comprehensive documentation of security events.

1. **UI Extensions**:

   - A sidebar extension ("Translation and context") that integrates into detection views within the Falcon platform
   - Provides an interface for viewing and managing translations and additional context for security detections

2. **UI Pages**:

   - "Detection context explorer" - A centralized management interface for viewing, editing, and creating detection context entries

3. **Foundry Collections**:

   - `detection_context` collection - Stores all translated content and contextual information linked to detections
   - Uses a schema with properties for `compositeId` (unique identifier), `content` (HTML content), `title`, and `type`

4. **Workflows**:

   - `translate-with-charlotte-ai` - Orchestrates the translation process using Charlotte AI
   - Takes detection content, requested language, and metadata as inputs
   - Uses Charlotte AI to perform translations while preserving HTML formatting
   - Stores translated content back to the `detection_context` collection

5. **API Integrations**:
   - `Crowdstrike alerts and message-center` - Provides access to detection data, comments, and case information
