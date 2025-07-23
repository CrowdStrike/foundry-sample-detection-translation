![CrowdStrike Falcon](/images/cs-logo.png?raw=true)

# Detection translation and context sample Foundry app

The Detection translation and context sample Foundry app is a community-driven, open source project which serves as an example of an app which can be built using CrowdStrike's Foundry ecosystem. `foundry-sample-detection-translation` is an open source project, not a CrowdStrike product. As such, it carries no formal support, expressed or implied.

This app is one of several App Templates included in Foundry that you can use to jumpstart your development. It comes complete with a set of preconfigured capabilities aligned to its business purpose. Deploy this app from the Templates page with a single click in the Foundry UI, or create an app from this template using the CLI.

> [!IMPORTANT]  
> To view documentation and deploy this sample app, you need access to the Falcon console.

## Description

Enhance your security operations with this powerful extension that leverages Charlotte AI to provide translation of detection alerts. This application allows security teams to:

- Access AI-powered translations of detection data for improved clarity
- Add customized context to any detection for better team communication
- Streamline investigation workflows with enriched detection information
- Maintain comprehensive documentation of security events

## Prerequisites

- The Foundry CLI (instructions below).
- [Nodejs](https://nodejs.org/) and [PNPM](https://pnpm.io/) if you want to change the UI.

### Install the Foundry CLI

You can install the Foundry CLI with Scoop on Windows or Homebrew on Linux/macOS.

**Windows**:

Install [Scoop](https://scoop.sh/). Then, add the Foundry CLI bucket and install the Foundry CLI.

```shell
scoop bucket add foundry https://github.com/crowdstrike/scoop-foundry-cli.git
scoop install foundry
```

Or, you can download the [latest Windows zip file](https://assets.foundry.crowdstrike.com/cli/latest/foundry_Windows_x86_64.zip), expand it, and add the install directory to your PATH environment variable.

**Linux and macOS**:

Install [Homebrew](https://docs.brew.sh/Installation). Then, add the Foundry CLI repository to the list of formulae that Homebrew uses and install the CLI:

```shell
brew tap crowdstrike/foundry-cli
brew install crowdstrike/foundry-cli/foundry
```

Run `foundry version` to verify it's installed correctly.

## Getting Started

Clone this sample to your local system, or [download as a zip file](https://github.com/CrowdStrike/foundry-sample-detection-translation/archive/refs/heads/main.zip) and import it into Foundry.

```shell
git clone https://github.com/CrowdStrike/foundry-sample-detection-translation
cd foundry-sample-detection-translation
```

Log in to Foundry:

```shell
foundry login
```

Select the following permissions:

- [ ] Create and run RTR scripts
- [x] Create, execute and test workflow templates
- [x] Create, run and view API integrations
- [ ] Create, edit, delete, and list queries

Deploy the app:

```shell
foundry apps deploy
```

> [!TIP]
> If you get an error that the name already exists, change the name to something unique to your CID in `manifest.yml`.

Once the deployment has finished, you can release the app:

```shell
foundry apps release
```

Next, go to **Foundry** > **App catalog**, find your app, and install it. You will be requested to add the API credentials for the app, you can create them in Support and resources > API clients and keys.

Once it's installed you can find the **Translation and custom context** extension in the right sidebar of detections:

- Next-Gen SIEM > Monitor and investigate > Incidents
- Endpoint security > Monitor > Endpoint detections
- Next-Gen SIEM > Monitor and investigate > Detections

## About this sample app

This sample app showcases a Foundry application that enhances detection alerts with AI-powered translations and custom contextual information. The app demonstrates how various Foundry artifacts can work together to provide extended functionality for security operations teams.

### Architecture and Components

The application consists of several integrated components working together:

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

### How It Works

1. **Detection Translation**:

   - When viewing a detection, the extension loads in the sidebar
   - The app checks if a translation already exists for the detection in the user's language
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

This sample demonstrates several powerful Foundry capabilities, including UI extensions that integrate directly into existing Falcon interfaces, workflow integration with Charlotte AI for natural language processing, collections for data persistence, and seamless API integrations with the Falcon platform. Together, these components create a cohesive application that enhances security operations by providing translated detection information and enabling teams to maintain comprehensive documentation of security events.

## Foundry resources

- Foundry documentation: [US-1](https://falcon.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [US-2](https://falcon.us-2.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry) | [EU](https://falcon.eu-1.crowdstrike.com/documentation/category/c3d64B8e/falcon-foundry)
- Foundry learning resources: [US-1](https://falcon.crowdstrike.com/foundry/learn) | [US-2](https://falcon.us-2.crowdstrike.com/foundry/learn) | [EU](https://falcon.eu-1.crowdstrike.com/foundry/learn)

---

<p align="center"><img src="/images/cs-logo-footer.png"><br/><img width="300px" src="/images/adversary-goblin-panda.png"></p>
<h3><p align="center">WE STOP BREACHES</p></h3>
