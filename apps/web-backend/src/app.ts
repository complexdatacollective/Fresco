import path from "path";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import connectDB from "@codaco/database";
import { appRouter, createTRPCContext } from "@codaco/api";
import protocolsRouter from "./routes/protocol";
import { tmpdir } from "node:os";

dotenv.config({ path: path.join(__dirname, "./.env") });

// TODO: make these configurable via env vars
const PORT = 3001;
export const PROTOCOLS_DIR = path.join(tmpdir(), "protocols");

const app = express();
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use(cors());

// Protocol upload handling
app.use('/api/protocols', protocolsRouter)

// TRPC API
app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);


// Serve the static front end in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend")));
  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend/index.html"));
  });
}

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  // CONNECT DB
  connectDB();
});