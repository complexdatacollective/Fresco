"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ipcRequestHandler = void 0;
const http_1 = require("@trpc/server/http");
async function ipcRequestHandler(opts) {
    const createContext = async () => {
        var _a;
        return (_a = opts.createContext) === null || _a === void 0 ? void 0 : _a.call(opts, { req: opts.req });
    };
    const url = new URL("https://electron" + opts.req.url);
    const path = url.pathname.slice(opts.endpoint.length + 1);
    const req = {
        query: url.searchParams,
        method: opts.req.method,
        headers: opts.req.headers,
        body: opts.req.body,
    };
    const result = await (0, http_1.resolveHTTPResponse)({
        req,
        createContext,
        path,
        router: opts.router,
        batching: opts.batching,
        onError(o) {
            var _a;
            (_a = opts === null || opts === void 0 ? void 0 : opts.onError) === null || _a === void 0 ? void 0 : _a.call(opts, { ...o, req: opts.req });
        },
    });
    return {
        body: result.body,
        headers: result.headers,
        status: result.status,
    };
}
exports.ipcRequestHandler = ipcRequestHandler;
