#!/bin/bash
set -e

echo "===================================================="
echo "Deploying LeetCompete Serverless Backend to AWS Lambda"
echo "===================================================="

if ! command -v serverless &> /dev/null; then
    echo "Installing Serverless Framework globally..."
    npm install -g serverless
fi

echo "Installing backend dependencies..."
npm install

echo "Deploying stack to AWS..."
npx serverless deploy

echo ""
echo "Deployment Complete!"
echo "Copy the Function URL and paste it into frontend/.env.production as:"
echo "VITE_API_URL=your-function-url"
