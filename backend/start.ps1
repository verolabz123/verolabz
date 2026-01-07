Write-Host "🚀 Starting HR Automation Backend..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ Error: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with your configuration."
    Write-Host "Copy .env.example to .env and fill in your API keys."
    exit 1
}

# Check if GROQ_API_KEY is set
$envContent = Get-Content .env -Raw
if ($envContent -notmatch "GROQ_API_KEY=") {
    Write-Host "❌ Error: GROQ_API_KEY not found in .env" -ForegroundColor Red
    Write-Host "Please add your Groq API key to .env file"
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "✅ Starting server..." -ForegroundColor Green
npm run dev
