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
const appOrigin = process.env.APP_ORIGIN ?? `http://${hostname}:${port}`;
const UPDATE_COOLDOWN_MS = 200;
const BATCH_ID_PATTERN = /^\d{1,6}$/;

function isValidBatchId(batchId: unknown): batchId is string {
  return typeof batchId === "string" && BATCH_ID_PATTERN.test(batchId);
}

const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      cors: {
        origin: appOrigin,
        methods: ["GET", "POST"],
      },
    },
  );

  io.on("connection", (socket) => {
    let lastUpdateAt = 0;

    socket.on("join_batch", (batchId) => {
      if (!isValidBatchId(batchId)) return;
      socket.join(batchId);
    });

    socket.on("update_data", (data) => {
      const now = Date.now();
      if (now - lastUpdateAt < UPDATE_COOLDOWN_MS) return;
      if (!data || !isValidBatchId(data.batchId)) return;

      lastUpdateAt = now;
      socket.to(data.batchId).emit("refresh_table");
    });
  });

  httpServer
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO origin: ${appOrigin}`);
    })
    .on("error", (err) => {
      console.error(err);
      process.exit(1);
    });
});
