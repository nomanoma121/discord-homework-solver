#!/bin/bash

echo "🏥 Health Check for Gemini-LaTeX Bot"
echo "=================================="

# Check if Docker containers are running
echo "📦 Checking Docker containers..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker containers are running"
    docker-compose ps
else
    echo "❌ Docker containers are not running"
    echo "💡 Run: docker-compose up -d"
    exit 1
fi

echo ""

# Check LaTeX compiler health
echo "🔧 Testing LaTeX compiler..."
if curl -s http://localhost:8080/compile > /dev/null 2>&1; then
    echo "✅ LaTeX compiler is responding"
else
    echo "⚠️  LaTeX compiler not responding on port 8080"
    echo "💡 Check: docker-compose logs latex-compiler"
fi

echo ""

# Check bot app logs for startup success
echo "🤖 Checking bot status..."
if docker-compose logs bot-app 2>/dev/null | grep -q "Ready! Logged in as"; then
    echo "✅ Discord bot is logged in and ready"
elif docker-compose logs bot-app 2>/dev/null | grep -q "error\|Error\|ERROR"; then
    echo "❌ Bot has errors - check logs:"
    docker-compose logs bot-app | tail -5
else
    echo "⚠️  Bot status unclear - check logs:"
    echo "💡 Run: docker-compose logs bot-app"
fi

echo ""

# Check environment configuration
echo "⚙️  Checking configuration..."
if [ -f "bot-app/.env" ]; then
    if grep -q "YOUR_DISCORD_TOKEN\|YOUR_GEMINI_API_KEY" bot-app/.env; then
        echo "❌ Environment variables not configured"
        echo "💡 Edit bot-app/.env with your actual API keys"
    else
        echo "✅ Environment variables appear to be configured"
    fi
else
    echo "❌ .env file not found"
    echo "💡 Create bot-app/.env with your API keys"
fi

echo ""

# Check data directory
echo "💾 Checking data persistence..."
if [ -d "bot-app/data" ]; then
    echo "✅ Data directory exists"
    if [ -f "bot-app/data/bot.db" ]; then
        echo "✅ Database file found"
        DB_SIZE=$(du -h bot-app/data/bot.db | cut -f1)
        echo "📊 Database size: $DB_SIZE"
    else
        echo "ℹ️  Database file not yet created (will be created on first use)"
    fi
else
    echo "⚠️  Data directory not found"
fi

echo ""
echo "🎯 Next Steps:"
echo "1. If all checks pass, your bot is ready!"
echo "2. Invite the bot to your Discord server"
echo "3. Use /solve command to test functionality"
echo "4. Monitor logs with: docker-compose logs -f"
