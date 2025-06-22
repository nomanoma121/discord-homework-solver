# 🤖 Gemini-LaTeX Bot Setup Guide

## 📋 Prerequisites Checklist

Before running the bot, ensure you have:

- ✅ Docker and Docker Compose installed
- ✅ Discord Bot Token
- ✅ Google Gemini API Key

## 🔑 Getting API Keys

### Discord Bot Token

1. Go to https://discord.com/developers/applications
2. Click "New Application" and give it a name
3. Go to the "Bot" section in the left sidebar
4. Click "Add Bot"
5. Under "Token", click "Copy" to get your bot token
6. **Important**: Under "Privileged Gateway Intents", enable "Message Content Intent" if needed

### Discord Bot Permissions

When inviting your bot to a server, it needs these permissions:

- `applications.commands` (to register slash commands)
- `Send Messages`
- `Attach Files`

### Google Gemini API Key

1. Go to https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the generated key

## 🚀 Quick Start

### 1. Configure Environment

Edit the `.env` file in the `bot-app` directory:

```bash
cd /home/kouta/workspaces/personal/dev/discord-homework-solver/gemini-latex-bot
nano bot-app/.env
```

Replace the placeholder values:

```env
DISCORD_TOKEN=your_actual_discord_bot_token_here
GEMINI_API_KEY=your_actual_gemini_api_key_here
```

### 2. Start the Services

Run the automated setup script:

```bash
./start.sh
```

Or manually with Docker Compose:

```bash
docker-compose up --build
```

### 3. Test the LaTeX Compiler (Optional)

Once the services are running, test the LaTeX compiler:

```bash
./test-latex.sh
```

## 🎯 Using the Bot

### Discord Commands

**`/solve`** - Solve a mathematical problem

- **`image`** (optional): Upload an image containing the problem
- **`text`** (optional): Type the problem description
- **`output`** (optional): Choose output format
  - `PDF` (default): Compiled LaTeX as PDF
  - `PNG`: Image format (same as PDF for now)
  - `LaTeX Source`: Raw LaTeX code

### Example Usage

1. **Image Problem**: Upload a photo of a math problem and run `/solve image:[your-image]`
2. **Text Problem**: Type `/solve text:"Solve the equation x² + 5x + 6 = 0"`
3. **Custom Output**: `/solve text:"Find the derivative of x³" output:LaTeX Source`

## 🔧 Troubleshooting

### Common Issues

1. **"Module not found" errors**

   ```bash
   cd bot-app && npm install
   ```

2. **Bot doesn't respond to commands**

   - Check if the bot is online in Discord
   - Verify the bot token is correct
   - Check Docker logs: `docker-compose logs bot-app`

3. **LaTeX compilation fails**

   - Check LaTeX compiler logs: `docker-compose logs latex-compiler`
   - Test the compiler directly: `./test-latex.sh`

4. **Gemini API errors**
   - Verify your API key is correct
   - Check if you have credits/quota remaining
   - Ensure the API key has proper permissions

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f bot-app
docker-compose logs -f latex-compiler
```

### Restarting Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart bot-app
```

### Stopping Services

```bash
docker-compose down
```

### Rebuilding After Changes

```bash
docker-compose down
docker-compose up --build
```

## 📊 Database

The bot automatically creates a SQLite database at `bot-app/data/bot.db` to track:

- User requests
- Token usage
- Timestamps

The database persists between container restarts via Docker volume mounting.

## 🔒 Security Notes

- Keep your `.env` file private - never commit it to version control
- Regularly rotate your API keys
- Monitor your Gemini API usage to avoid unexpected charges
- The LaTeX compiler runs in a sandboxed Docker container for security

## 🎨 Customization

### Adding New Commands

1. Create a new file in `bot-app/src/commands/`
2. Follow the pattern in `solve.ts`
3. Rebuild: `docker-compose up --build`

### Modifying LaTeX Templates

Edit the prompt in `bot-app/src/commands/solve.ts` to change how problems are formatted.

### Database Schema

The database schema is defined in `bot-app/src/db.ts`. You can extend it to track additional metrics.

## 📈 Monitoring

### Health Checks

The LaTeX compiler includes a health check. View status:

```bash
docker-compose ps
```

### Resource Usage

Monitor Docker resource usage:

```bash
docker stats
```

## 🆘 Getting Help

If you encounter issues:

1. Check the logs first: `docker-compose logs -f`
2. Verify your API keys are correct
3. Ensure Docker has sufficient resources
4. Check network connectivity to Discord and Google APIs

The bot is now ready to solve mathematical problems using AI and generate beautiful LaTeX PDFs! 🎉
