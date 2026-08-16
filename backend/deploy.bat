@echo off
echo ====================================================
echo Deploying LeetCompete Serverless Backend to AWS Lambda
echo ====================================================

where serverless >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Serverless Framework is not installed globally. Installing...
    npm install -g serverless
)

echo Installing backend dependencies...
call npm install

echo Deploying stack to AWS...
call npx serverless deploy

echo.
echo Deployment Complete!
echo Copy the Function URL above and paste it into frontend/.env.production as:
echo VITE_API_URL=your-function-url
pause
