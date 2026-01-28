import pg from 'pg';

export async function getProtocolId(databaseUrl: string): Promise<string> {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const result = await pool.query<{ id: string }>(
      `SELECT id FROM "Protocol" LIMIT 1`,
    );
    const row = result.rows[0];
    if (!row) {
      throw new Error('No protocol found in database');
    }
    return row.id;
  } finally {
    await pool.end();
  }
}

export async function updateAppSetting(
  databaseUrl: string,
  key: string,
  value: string,
): Promise<void> {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    await pool.query(`UPDATE "AppSettings" SET value = $2 WHERE key = $1`, [
      key,
      value,
    ]);
  } finally {
    await pool.end();
  }
}

export async function getParticipantCount(
  databaseUrl: string,
  identifier?: string,
): Promise<number> {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 1 });
  try {
    const result = identifier
      ? await pool.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM "Participant" WHERE identifier = $1`,
          [identifier],
        )
      : await pool.query<{ count: string }>(
          `SELECT COUNT(*) as count FROM "Participant"`,
        );
    return Number(result.rows[0]?.count ?? 0);
  } finally {
    await pool.end();
  }
}
