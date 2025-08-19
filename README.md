### 🚀 Project Overview

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

2. 