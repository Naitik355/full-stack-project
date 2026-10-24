
const http = require("http");
const WebSocket = require("ws");
const Y = require("yjs");
const { setupWSConnection } = require("y-websocket/bin/utils");

const server = http.createServer((request, response) => {
  response.writeHead(200, { "Content-Type": "text/plain" });
  response.end("Code collaboration server is running.");
});

const wss = new WebSocket.Server({ server });

wss.on("connection", (socket, request) => {
  setupWSConnection(socket, request);
});

const PORT = 1234;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Collaboration server running on port ${PORT}`);
});
