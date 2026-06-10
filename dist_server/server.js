"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const http_1 = require("http");
const next_1 = __importDefault(require("next"));
const socket_io_1 = require("socket.io");
const dev = process.env.NODE_ENV !== "production";
if (!process.env.HOSTNAME) {
    throw new Error("ERROR: HOSTNAME environment variable not set.");
}
if (!process.env.PORT) {
    throw new Error("ERROR: PORT environment variable not set.");
}
const hostname = process.env.HOSTNAME;
const port = parseInt(process.env.PORT, 10);
const app = (0, next_1.default)({ dev, hostname, port });
const handler = app.getRequestHandler();
app.prepare().then(() => {
    const httpServer = (0, http_1.createServer)(handler);
    const io = new socket_io_1.Server(httpServer);
    io.on("connection", (socket) => {
        socket.on("join_batch", (batchId) => {
            socket.join(batchId);
        });
        socket.on("update_data", (data) => {
            socket.to(data.batchId).emit("refresh_table");
        });
        // socket.on("disconnect", () => {});
    });
    httpServer
        .listen(port, () => {
        console.log(`> Ready on http://${hostname}:${port}`);
    })
        .on("error", (err) => {
        console.error(err);
        process.exit(1);
    });
});
