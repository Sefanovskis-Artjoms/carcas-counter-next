import "dotenv/config";
import { createServer } from "http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import {
  ClientToServerEvents,
  ServerToClientEvents,
} from "./src/types/interfaces";

const dev = process.env.NODE_ENV !== "production";

if (!process.env.HOSTNAME) {
  throw new Error("ERROR: HOSTNAME environment variable not set.");
}

if (!process.env.PORT) {
  throw new Error("ERROR: PORT environment variable not set.");
}

const hostname = process.env.HOSTNAME;
const port = parseInt(process.env.PORT, 10);

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer
  );

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
