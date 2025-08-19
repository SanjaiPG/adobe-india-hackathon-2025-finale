# Project Overview

* *PDF Viewing* → Integrated with *Adobe PDF Embed API* for seamless in-browser PDF viewing and text selection.
* *Snippet Extraction* → Users can highlight text directly from the PDF, which is then captured for processing.
* *LLM Integration* → *Google Gemini* generates a *concise podcast script* from the extracted text.
* *Text-to-Speech (TTS)* → Script is converted to natural audio using *Azure OpenAI TTS* (voices like Alloy, Shimmer, etc.).
* *Podcast Experience* → Final output is an engaging *2–3 minute podcast* that can be played or downloaded.
* *Environment Mapping* → Adobe-specified env variables are internally mapped to code variables for evaluator convenience.
* *Deployment Ready* → Packaged into a *single Docker container*, runs with one command, no extra setup required.
* *Flexible Config* → Supports both *Google API Key* and *Service Account JSON* for Gemini integration.
* *Secure & Optimized* → Clean UI, security headers, and standalone Next.js build ensure smooth usage and deployment.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js**: [Download Node.js](https://nodejs.org/) (includes npm).
- **Docker** (if using the Docker setup): [Install Docker](https://www.docker.com/get-started).

## Installation

Follow these steps to install the required dependencies for the project.

1. **Clone the repository**:
   ```bash
   git clone https://github.com/SanjaiPG/adobe-india-hackathon-2025-finale.git
   ```

### Install additional required packages:
You will need to install specific packages for certain functionalities:
```bash
npm install @google/generative-ai
```
```bash
npm install microsoft-cognitiveservices-speech-sdk
```
```bash
npm install pdfjs-dist
```
```
npm install cross-env --save-dev
```

## Running the Application

There are two ways to run this application: using Docker or with npm.

### 1. Running with Docker
#### Build Docker
```bash
docker build -t adobe-hackathon-app .
```
#### To Run in linux distro
```bash
docker run \
  -e GOOGLE_API_KEY=<your-google-api-key-here> \
  -e AZURE_TTS_KEY=<your-azure-tts-key-here> \
  -e AZURE_TTS_ENDPOINT=https://eastus.api.cognitive.microsoft.com/ \
  -e ADOBE_EMBED_API_KEY=<your-adobe-embed-api-key-here> \
  -e NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key-here> \
  -e LLM_PROVIDER=gemini \
  -e TTS_PROVIDER=azure \
  -e GEMINI_MODEL=gemini-2.5-flash \
  -e AZURE_TTS_DEPLOYMENT=tts \
  -p 8080:8080 \
  adobe-hackathon-finale
```

#### To Run in windows
```bash
docker run \
   -e GOOGLE_API_KEY=<your-google-api-key-here> ^
   -e AZURE_TTS_KEY=<your-azure-tts-key-here> ^
   -e AZURE_TTS_ENDPOINT=https://eastus.api.cognitive.microsoft.com/ ^
   -e ADOBE_EMBED_API_KEY=<your-adobe-embed-api-key-here> ^
   -e NEXT_PUBLIC_GEMINI_API_KEY=<your-gemini-api-key-here> ^
   -e LLM_PROVIDER=gemini ^
   -e TTS_PROVIDER=azure ^
   -e GEMINI_MODEL=gemini-2.5-flash ^
   -e AZURE_TTS_DEPLOYMENT=tts ^
   -p 8080:8080 adobe-hackathon-finale
```

### 2. Running with npm (npm run dev)

## To make an .env file
```bash
cp .env.example .env
```

## Configuration

Once you have the .env file set up, make sure to populate it with the required API keys and credentials:

- *Google Generative AI:* Obtain your API key and configuration details from the [Google Cloud Console](https://console.cloud.google.com/).
- *Microsoft Cognitive Services Speech SDK:* Get your credentials from the [Azure Portal](https://portal.azure.com/).
- *PDF.js:* Customize the PDF handling options as required for your project.

*Start the application:*
After installing dependencies, you can start the application with:
```bash
npm run dev
```

This will run the application inside the Docker container and expose it on port 8080