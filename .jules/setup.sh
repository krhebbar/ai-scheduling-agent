#!/bin/bash
set -e

echo "🚀 Setting up AI Scheduling Agent..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build package
echo "🔨 Building project..."
npm run build

# Type check
echo "✅ Running type check..."
npm run type-check

echo ""
echo "✅ AI Scheduling Agent setup complete!"
echo ""
echo "Next steps:"
echo "  - Set OPENAI_API_KEY environment variable (required)"
echo "  - Run examples: npm run example:basic"
