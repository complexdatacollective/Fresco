import { type Interview } from '@prisma/client';
import { Transform } from 'stream';
import Graph from 'graphology'; // Corrected import statement
import { toString } from 'graphology-graphml';
import { createWriteStream } from 'fs';

export async function createCSVBuffer(
  interviews: Interview[],
): Promise<Buffer> {
  const csvStream = new Transform({
    transform(chunk, encoding, callback) {
      // Transform each interview object into a CSV row string
      const csvRow = Object.values(chunk).join(',');
      callback(null, csvRow + '\n');
    },
  });

  const csvStreamBuffer = createWriteStream('interviews.csv');
  csvStream.pipe(csvStreamBuffer);

  for (const interview of interviews) {
    csvStream.write(interview);
  }

  await new Promise((resolve, reject) => {
    csvStreamBuffer.on('finish', resolve);
    csvStreamBuffer.on('error', reject);
    csvStream.end();
  });

  return csvStreamBuffer.buffer!;
}

export async function createGraphMLBuffer(
  interviews: Interview[],
): Promise<Buffer> {
  const graph = new Graph();

  // Add nodes and edges based on your interview data structure and relationships
  for (const interview of interviews) {
    graph.addNode('interview', interview.id);
    // ... add edges
  }

  const graphMLString = await write(graph); // Use the 'write' function

  return Buffer.from(graphMLString);
}
