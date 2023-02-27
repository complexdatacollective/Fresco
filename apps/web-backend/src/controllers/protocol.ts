import type { Request, Response } from "express";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { validateProtocol } from "@codaco/protocol-utils";

const protocolController = async (req: Request, res: Response) => {
  const protocol = req.file;

  console.log('protocol: ', protocol);

  if (!protocol) {
    res.status(400).send("Protocol file not found");
    return;
  }

  if (!protocol?.originalname.endsWith(".zip")) {
    res.status(400).send("Protocol file must be a zip file.");
    return;
  }

  if (!protocol.path) {
    res.status(400).send("No path provided for protocol file.");
    return;
  }

  const filename = protocol.originalname;

  if (!filename) {
    res.status(400).send("No filename provided for protocol file.");
  }

  // 1. Unzip the protocol file
  const tempDir = await mkdtemp(tmpdir());

  // To unzip the file, we use the unzip command line tool
  // This requires the unzip command to be installed on the system!
  const unzip = spawn('unzip', [protocol.path, '-d', tempDir]);

  unzip.stdout.on('error', (error) => {
    console.log('Error: ', error);
    res.status(500).send('Error unzipping protocol file.');
    unzip.kill();
    // Cleanup
    if (tempDir) {
      rm(tempDir, { recursive: true });
    }

    return;
  });

  unzip.stdout.on('data', (data) => {
    console.log('Data: ', data);
  });

  await new Promise<void>((resolve) => {
    unzip.stdout.on('close', () => {
      resolve();
    });
  })

  // 2. Read the protocol.json file
  const protocolJson = await readFile(`${tempDir}/protocol.json`, 'utf-8');

  console.log('PROTOCOL!!!', protocolJson);

  // Cleanup
  if (tempDir) {
    await rm(tempDir, { recursive: true });
  }
};


export default protocolController;
