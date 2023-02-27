import type { Request, Response } from "express";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { validateProtocol } from "@codaco/protocol-utils";

const protocolController = async (req: Request, res: Response) => {
  const protocol = req.file;

  if (!protocol) {
    res.status(400).send({ error: "Protocol file not found" });
    return;
  }

  if (!protocol?.originalname.endsWith(".netcanvas")) {
    res.status(400).send({ error: "Protocol file must be a .netcanvas file." });
    return;
  }

  if (!protocol.path) {
    res.status(500).send({ error: "Internal error when creating temporary path for protocol file." });
    return;
  }

  const filename = protocol.originalname;

  if (!filename) {
    res.status(400).send({ error: "No filename provided for protocol file." });
  }

  // 1. Unzip the protocol file
  const tempDir = await mkdtemp(tmpdir());

  // To unzip the file, we use the unzip command line tool
  // This requires the unzip command to be installed on the system!
  const unzip = spawn('unzip', [protocol.path, '-d', tempDir]);

  unzip.stdout.on('error', (error) => {
    console.log('Error: ', error);
    res.status(500).send({ error: 'Error unzipping protocol file.' });
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

  // 3. Validate the protocol
  const validationErrors = validateProtocol(protocolJson);

  res.status(200).send({ message: 'Protocol file is valid.' });


  // Cleanup
  if (tempDir) {
    await rm(tempDir, { recursive: true });
  }
};


export default protocolController;
