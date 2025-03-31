@echo off
if not exist "node_modules" npm install socket.io bedrock-protocol express
node chatClient.js
pause
