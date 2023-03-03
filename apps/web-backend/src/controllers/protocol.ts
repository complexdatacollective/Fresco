import type { Request, Response } from "express";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { validateProtocol, ValidationError } from "@codaco/protocol-utils";

// Generic typed response, we omit 'json' and we add a new json method with the desired parameter type
type TypedResponse<T> = Omit<Response, 'json'> & { json(data: T): Response };
// An example of a typed response
export type CreateProtocolResponse = TypedResponse<{
  success: boolean,
  data?: unknown,
  error?: string,
  dataErrors?: Array<Array<string>>,
  schemaErrors?: Array<Array<string>>,
}>

const protocolController = async (req: Request, res: CreateProtocolResponse) => {
  const protocol = req.file;

  if (!protocol) {
    res.statusCode = 400;
    return res.json({
      success: false,
      error: "Protocol file not found"
    });
  }

  if (!protocol?.originalname.endsWith(".netcanvas")) {
    res.statusCode = 400;
    return res.json({
      success: false,
      error: "Protocol file must be a .netcanvas file."
    });
  }

  if (!protocol.path) {
    res.statusCode = 500;
    return res.json({
      success: false,
      error: "Internal error when creating temporary path for protocol file."
    });
  }

  // 1. Unzip the protocol file
  const tempDir = await mkdtemp(tmpdir());

  const cleanUp = async () => {
    if (tempDir) {
      console.info('Cleaning up temporary directory: ', tempDir);
      await rm(tempDir, { recursive: true });
    }
  }

  // To unzip the file, we use the unzip command line tool
  // This requires the unzip command to be installed on the system!
  console.log('Unzip start...');
  const unzip = spawn('unzip', [protocol.path, '-d', tempDir]);

  unzip.stdout.on('error', async (error) => {
    console.log('Error: ', error);
    res.status(500).send({ error: 'Error unzipping protocol file.' });
    unzip.kill();

    await cleanUp();
    return;
  });
  await new Promise<void>((resolve) => {
    unzip.stdout.on('close', () => {
      console.log('Unzip complete.');
      resolve();
    });
  })

  // 2. Read the protocol.json file
  const protocolJson = await readFile(`${tempDir}/protocol.json`, 'utf-8');

  // 3. Validate the protocol
  try {
    validateProtocol(protocolJson);
    console.info('Protocol file is valid.');
  } catch (error: unknown) {

    // Protocol is invalid
    if (error instanceof ValidationError) {
      console.info('Protocol file is invalid.');

      res.statusCode = 200;
      res.json({
        success: false,
        dataErrors: [...error.dataErrors.entries()],
        schemaErrors: [...error.schemaErrors.entries()],
      }).send();

      await cleanUp();
      return;
    }

    // Internal error with validation
    if (error instanceof Error) {
      res.status(500).send({ error: error.message });
      await cleanUp();
      return;
    }

    await cleanUp();

    return;
  }

  // 4. Add the protocol to the database

  // 5. Copy assets to the protocol directory

  res.statusCode = 200;
  res.json({
    success: true
  }).send();

  await cleanUp();
};


export default protocolController;
