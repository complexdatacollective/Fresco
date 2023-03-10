import type { Request, Response } from "express";
import { prisma } from "@codaco/database";
import { tmpdir } from "node:os";
import { mkdtemp, rm, readFile, cp } from "node:fs/promises";
import { spawn } from "node:child_process";
import { PROTOCOLS_DIR } from "../app";
import { validateProtocol, ValidationError } from "@codaco/protocol-utils";
import { APP_SUPPORTED_SCHEMA_VERSIONS } from "../config";
import { subtle } from "node:crypto";

// Generic typed response, we omit 'json' and we add a new json method with the desired parameter type
export type TypedResponse<T> = Omit<Response, 'json'> & { json(data: T): Response };

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

  const protocolName = protocol.originalname.replace(".netcanvas", "");

  // TODO: check if this protocol has already been imported
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

  // To unzip the file, we use the unzip command line tool because it is
  // much faster than using node's unzip library.
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

  // This allows us to await the unzip process
  await new Promise<void>((resolve) => {
    unzip.stdout.on('close', () => {
      console.log('Unzip complete.');
      resolve();
    });
  })

  // 2. Read the protocol.json file
  const protocolString = await readFile(`${tempDir}/protocol.json`, 'utf-8');

  // 3. Validate the protocol
  let protocolJson;
  try {
    protocolJson = validateProtocol(protocolString);
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

  // Check if the schema version is supported
  const protocolVersion = protocolJson.schemaVersion;

  if (!APP_SUPPORTED_SCHEMA_VERSIONS.includes(protocolVersion)) {
    res.statusCode = 200;
    res.json({
      success: false,
      error: `Protocol schema version ${protocolVersion} is not supported. Supported versions are: ${APP_SUPPORTED_SCHEMA_VERSIONS.join(', ')}`,
    }).send();

    await cleanUp();
    return;
  }

  // Create a hash of the protocol codebook to use as the UUID
  const protocolHash = await subtle.digest('SHA-256', await readFile(protocol.path))
  const protocolHashHex = Array.from(new Uint8Array(protocolHash)).map((b) => b.toString(16).padStart(2, '0')).join('');

  // Use node fs to copy assets folder to the protocol directory
  const protocolAssetsDirectory = `${PROTOCOLS_DIR}/${protocolHashHex}`;
  await cp(`${tempDir}/assets`, protocolAssetsDirectory, { recursive: true });

  // 5. Add the protocol to the database
  await prisma.protocol.create({
    data: {
      name: protocolName,
      description: protocolJson.description,
      lastModified: protocolJson.lastModified,
      hash: protocolHashHex,
      schemaVersion: protocolVersion.toString(),
      assetPath: protocolAssetsDirectory, // Do we need this? We could assume the path based on the hash
      data: protocolString,
    },
  });


  await cleanUp();

  res.statusCode = 200;
  res.json({
    success: true
  }).send();
};


export default protocolController;
