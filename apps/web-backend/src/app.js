"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const trpcExpress = __importStar(require("@trpc/server/adapters/express"));
const prisma_1 = __importDefault(require("./utils/prisma"));
const api_1 = require("@codaco/api");
dotenv_1.default.config({ path: path_1.default.join(__dirname, "./.env") });
const app = (0, express_1.default)();
if (process.env.NODE_ENV !== "production")
    app.use((0, morgan_1.default)("dev"));
app.use((0, cors_1.default)());
// Dev mode middleware to add 2 seconds delay to all requests
if (process.env.NODE_ENV !== "production") {
    app.use(async (_req, _res, next) => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        next();
    });
}
app.use("/api/trpc", trpcExpress.createExpressMiddleware({
    router: api_1.appRouter,
    createContext: api_1.createTRPCContext,
}));
const PORT = 3001;
app.listen(PORT, () => {
    console.log(`🚀 Server listening on port ${PORT}`);
    // CONNECT DB
    (0, prisma_1.default)();
});
