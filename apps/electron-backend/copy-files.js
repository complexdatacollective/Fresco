import { join } from 'node:path';
import { createRequire } from 'module';
// import replace from 'replace-in-file';
// import fsExtra from 'fs-extra';

// const clientPath = join(__dirname, "../../", "packages", "database", "src", "generated", "client");

const require = createRequire(import.meta.url);
const test = require.resolve("@prisma/client");

console.log('TEST:', test);

// // fix long prisma loading times caused by scanning from process.cwd(), which returns "/" when run in electron
// // (thus it scans all files on the computer.) See https://github.com/prisma/prisma/issues/8484
// const files = join(clientPath, "index.js");
// const options = {
//     files: files,
//     from: "findSync(process.cwd()",
//     to: `findSync(require('electron').app.getAppPath()`,
// };

// const results = replace.sync(options);
// console.log('Replacement results:', results);

// console.log("Copying prisma client to local project");
// // Copy the generated prisma client to the src folder, so that tsc will compile correctly
// copySync(clientPath,
//     join(__dirname, "src", "generated", "client"), {
//     filter: (src, dest) => {
//         // Prevent duplicate copy of query engine. It will already be in extraResources in electron-builder.yml
//         if (src.match(/query_engine/) || src.match(/libquery_engine/) || src.match(/esm/)) {
//             return false;
//         }
//         return true;
//     }
// });

// // Copy the generated prisma client to the dist folder
// copySync(clientPath,
//     join(__dirname, "dist", "generated", "client"), {
//     filter: (src, dest) => {
//         // Prevent duplicate copy of query engine. It will already be in extraResources in electron-builder.yml
//         if (src.match(/query_engine/) || src.match(/libquery_engine/) || src.match(/esm/)) {
//             return false;
//         }
//         return true;
//     }
// });

