/* eslint-disable no-console */
/* eslint-disable local-rules/require-data-mapper */
import archiver from 'archiver';
import { type NextApiResponse } from 'next';
import { prisma } from '~/utils/db';
// Assuming your Prisma client setup

export const runtime = 'edge';

export async function POST(req: Request, res: NextApiResponse) {
  try {
    const interviewIds = await req.json();

    const interviews = await prisma.interview.findMany({
      where: {
        id: {
          in: interviewIds as string[],
        },
      },
    });

    const zip = archiver('zip');
    zip.pipe(res);

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="interview_data.zip"',
    );

    let offset = 0;
    const chunkSize = 1000; // Adjust based on dataset size and memory constraints

    // eslint-disable-next-line no-constant-condition
    while (true) {
      const chunk = interviews.slice(offset, offset + chunkSize);
      if (!chunk.length) break;

      const csvBuffer = createCSVBuffer(chunk); // Implement this function
      const graphMLBuffer = createGraphMLBuffer(chunk); // Implement this function

      zip.append('interviews.csv', csvBuffer);
      zip.append('interviews.graphml', graphMLBuffer);

      offset += chunkSize;
    }

    await zip.finalize();
  } catch (error) {
    console.error('Error during export:', error);
    res.status(500).send('Error creating zip archive');
  }
}
