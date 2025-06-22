#!/bin/bash

echo "🚀 Setting up Gemini-LaTeX Bot..."

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker and Docker Compose are available"

# Check if .env file has been configured
if [ ! -f "bot-app/.env" ]; then
    echo "❌ bot-app/.env file not found"
    exit 1
fi

# Check if environment variables are set
if grep -q "YOUR_DISCORD_TOKEN" bot-app/.env || grep -q "YOUR_GEMINI_API_KEY" bot-app/.env; then
    echo "⚠️  Please update bot-app/.env with your actual Discord and Gemini API keys"
    echo "   Edit bot-app/.env and replace:"
    echo "   - YOUR_DISCORD_TOKEN with your Discord bot token"
    echo "   - YOUR_GEMINI_API_KEY with your Gemini API key"
    exit 1
fi

echo "✅ Environment variables configured"

# Build and start the services
echo "🏗️  Building and starting services..."
docker-compose up --build -d

if [ $? -eq 0 ]; then
    echo "✅ Services started successfully!"
    echo ""
    echo "📊 Service Status:"
    docker-compose ps
    echo ""
    echo "📝 To view logs:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 To stop services:"
    echo "   docker-compose down"
else
    echo "❌ Failed to start services"
    exit 1
fi
