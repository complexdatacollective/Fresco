"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
function isHostUp(url) {
    return new Promise(resolve => {
        (0, http_1.get)(url, () => { resolve(true); })
            .on("error", () => {
            resolve(false);
        });
    });
}
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const waitForServerUp = async (url) => {
    console.log("waiting for local server...");
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const isUp = await isHostUp(url);
        if (isUp)
            break;
        await wait(1000);
    }
    console.log("✅ local server: up");
};
exports.default = waitForServerUp;
//# sourceMappingURL=waitForServerUp.js.map