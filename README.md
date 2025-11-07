# Snipply

A Next.js application that transforms PDF content into engaging podcasts using Adobe PDF Services API, Google Gemini AI, and Azure Text-to-Speech.

## Features

- **PDF Integration**
  - Seamless in-browser PDF viewing with Adobe PDF Embed API
  - Interactive text selection and highlighting
  - Multi-document support with document library
  - Smart document outline detection

- **AI-Powered Processing**
  - Text snippet extraction from PDFs
  - Intelligent content summarization using Google Gemini
  - Natural podcast script generation
  - High-quality audio synthesis with Azure OpenAI TTS

- **User Experience**
  - Clean, modern interface
  - Drag-and-drop file upload
  - Real-time processing feedback
  - Downloadable audio output
  - Document navigation through headings

## Technical Stack

- **Frontend**: Next.js with React
- **PDF Processing**: Adobe PDF Embed API
- **AI Processing**: Google Gemini
- **Audio Generation**: Azure OpenAI TTS
- **Containerization**: Docker
- **State Management**: React Context API

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (includes npm)
- [Docker](https://www.docker.com/get-started) (optional, for containerized deployment)

## Required API Keys

You'll need the following API credentials:
- Adobe PDF Embed API Key
- Google Gemini API Key
- Azure TTS API Key and Endpoint

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SanjaiPG/Snipply.git
   cd Snipply
   ```

2. **Install dependencies**
   ```bash
   npm install
   npm install @google/generative-ai microsoft-cognitiveservices-speech-sdk pdfjs-dist
   npm install cross-env --save-dev
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Then edit `.env` with your API keys and configuration.

## Running the Application

### Local Development

```bash
npm run dev
```

### Docker Deployment

1. **Build the Docker image**
   ```bash
   docker build -t adobe-hackathon-finale .
   ```

2. **Run the container**

   For Windows:
   ```powershell
   docker run ^
   -e GOOGLE_API_KEY=<your-key> ^
   -e AZURE_TTS_KEY=<your-key> ^
   -e AZURE_TTS_ENDPOINT=https://eastus.api.cognitive.microsoft.com/ ^
   -e ADOBE_EMBED_API_KEY=<your-key> ^
   -e NEXT_PUBLIC_GEMINI_API_KEY=<your-key> ^
   -e LLM_PROVIDER=gemini ^
   -e TTS_PROVIDER=azure ^
   -e GEMINI_MODEL=gemini-2.5-flash ^
   -e AZURE_TTS_DEPLOYMENT=tts ^
   -p 8080:8080 adobe-hackathon-finale
   ```

   For Linux/macOS:
   ```bash
   docker run \
   -e GOOGLE_API_KEY=<your-key> \
   -e AZURE_TTS_KEY=<your-key> \
   -e AZURE_TTS_ENDPOINT=https://eastus.api.cognitive.microsoft.com/ \
   -e ADOBE_EMBED_API_KEY=<your-key> \
   -e NEXT_PUBLIC_GEMINI_API_KEY=<your-key> \
   -e LLM_PROVIDER=gemini \
   -e TTS_PROVIDER=azure \
   -e GEMINI_MODEL=gemini-2.5-flash \
   -e AZURE_TTS_DEPLOYMENT=tts \
   -p 8080:8080 adobe-hackathon-finale
   ```

## 🏆 Recognition

This project was developed as part of the Adobe India Hackathon 2025 Finals, where our team Ritzy, achieved the distinction of being ranked among the Top 100 teams nationwide. The project showcases innovative use of Adobe's PDF Services API combined with modern AI technologies to create a unique document-to-podcast conversion solution.

## Team

### Sanjai P G
* [GitHub](https://github.com/SanjaiPG)
* [LinkedIn](https://www.linkedin.com/in/sanjai-p-g)
* [Instagram](https://www.instagram.com/_sanjai_pgs)
* [Email](mailto:sanjaigukesan8686@gmail.com)

### Dharun S
* [GitHub](https://github.com/dharuns2)
* [LinkedIn](https://www.linkedin.com/in/dharun2)
* [Instagram](https://www.instagram.com/_dharun.4)
* [Email](mailto:Dharunsaravanan10@gmail.com)

### Abhinav G 
* [GitHub](https://github.com/Abhinav-Gopalakrishnan)
* [LinkedIn](https://www.linkedin.com/in/abhinav-g-486343295/)
* [Instagram](https://www.instagram.com/_abhinav___g)
* [Email](mailto:abhi67devil@gmail.com)