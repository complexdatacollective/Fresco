import path from "path";
import dotenv from "dotenv";
import express from "express";
import morgan from "morgan";
import cors from "cors";
import * as trpcExpress from "@trpc/server/adapters/express";
import connectDB from "./utils/prisma";
import { appRouter, createTRPCContext } from "@codaco/api";

dotenv.config({ path: path.join(__dirname, "./.env") });

const app = express();
if (process.env.NODE_ENV !== "production") app.use(morgan("dev"));

app.use(cors());

// Dev mode middleware to add 2 seconds delay to all requests
if (process.env.NODE_ENV !== "production") {
  app.use(async (_req, _res, next) => {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    next();
  });
}

app.use(
  "/api/trpc",
  trpcExpress.createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

const PORT = 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
  // CONNECT DB
  connectDB();
});