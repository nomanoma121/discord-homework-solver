# Gemini-LaTeX Bot 🤖📐

A Discord bot that solves mathematical problems using Google's Gemini AI and generates LaTeX-formatted solutions compiled to PDF.

## ✨ Features

- 🔍 Solve problems from images or text using Gemini AI
- 📄 Generate solutions in LaTeX format
- 🔧 Compile LaTeX to PDF using a dedicated Go service
- 🎨 Support for multiple output formats (PDF, PNG, LaTeX Source)
- 💾 SQLite database for usage tracking
- 🐳 Dockerized deployment

## 🚀 Quick Start

1. **Configure your API keys:**

   ```bash
   cp bot-app/.env.example bot-app/.env
   # Edit bot-app/.env with your Discord and Gemini API keys
   ```

2. **Start the bot:**

   ```bash
   ./start.sh
   ```

3. **Health check:**
   ```bash
   ./health-check.sh
   ```

## 📚 Documentation

- **[📖 Detailed Setup Guide](SETUP.md)** - Complete installation and configuration instructions
- **[🔧 API Documentation](#api-endpoints)** - Technical details about the services

## 🎯 Discord Commands

- `/solve` - Solve a mathematical problem
  - `image` (optional): Upload an image containing the problem
  - `text` (optional): Type the problem description
  - `output` (optional): Choose format (PDF, PNG, LaTeX Source)

## 🏗️ Architecture

## Project Structure

```
gemini-latex-bot/
├── bot-app/                 # TypeScript Discord bot
│   ├── src/
│   │   ├── commands/
│   │   │   └── solve.ts     # Main /solve command
│   │   ├── index.ts         # Bot entry point
│   │   └── db.ts           # Database management
│   ├── Dockerfile
│   ├── package.json
│   └── .env                # Environment variables
├── latex-compiler/          # Go LaTeX compilation service
│   ├── main.go             # HTTP server for LaTeX compilation
│   ├── go.mod
│   └── Dockerfile
└── docker-compose.yml      # Container orchestration
```

## Setup Instructions

### 1. Clone and Navigate

```bash
cd /home/kouta/workspaces/personal/dev/discord-homework-solver/gemini-latex-bot
```

### 2. Configure Environment Variables

Edit `bot-app/.env` and replace the placeholder values:

```env
DISCORD_TOKEN=your_actual_discord_bot_token
GEMINI_API_KEY=your_actual_gemini_api_key
```

### 3. Install Dependencies (Optional - for development)

If you want to develop locally:

```bash
cd bot-app
npm install
```

### 4. Build and Run with Docker

From the project root directory:

```bash
docker-compose up --build
```

## API Endpoints

### LaTeX Compiler Service

- **POST** `/compile`
  - Body: `{"latex_code": "..."}`
  - Response: PDF binary data or error JSON

## Discord Commands

- `/solve` - Solve a mathematical problem
  - `image` (optional): Image containing the problem
  - `text` (optional): Text description of the problem
  - `output` (optional): Output format (PDF, PNG, LaTeX Source)

## Requirements

- Docker and Docker Compose
- Discord Bot Token
- Google Gemini API Key

## Getting API Keys

1. **Discord Bot Token**:

   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to "Bot" section
   - Create a bot and copy the token

2. **Google Gemini API Key**:
   - Go to https://makersuite.google.com/app/apikey
   - Create a new API key

## Development

For local development without Docker:

1. Start the LaTeX compiler service:

   ```bash
   cd latex-compiler
   go run main.go
   ```

2. Start the bot in development mode:
   ```bash
   cd bot-app
   npm run dev
   ```

## Troubleshooting

- Ensure both API keys are correctly set in the `.env` file
- Check Docker logs: `docker-compose logs -f`
- Verify the bot has necessary Discord permissions
- Make sure port 8080 is available for the LaTeX compiler service
