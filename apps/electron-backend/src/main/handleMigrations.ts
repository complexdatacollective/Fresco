import { app } from 'electron';
import { dbPath, dbUrl, latestMigration, Migration } from './constants';
import { prisma, runPrismaCommand } from './prisma';
import log from 'electron-log';
import { existsSync, closeSync, openSync } from "node:fs";
import { join } from "node:path";

const handleMigrations = async () => {
  let needsMigration;
  const dbExists = existsSync(dbPath);
  if (!dbExists) {
    needsMigration = true;
    // prisma for whatever reason has trouble if the database file does not exist yet.
    // So just touch it here
    closeSync(openSync(dbPath, 'w'));
  } else {
    try {
      const latest: Migration[] = await prisma.$queryRaw`select * from _prisma_migrations order by finished_at`;
      needsMigration = latest[latest.length - 1]?.migration_name !== latestMigration;
    } catch (e) {
      log.error(e);
      needsMigration = true;
    }
  }

  if (needsMigration) {
    try {

      const schemaPath = join(
        app.getAppPath().replace('app.asar', 'app.asar.unpacked'),
        'prisma',
        "schema.prisma"
      );

      log.info(`Needs a migration. Running prisma migrate with schema path ${schemaPath}`);

      // first create or migrate the database! If you were deploying prisma to a cloud service, this migrate deploy
      // command you would run as part of your CI/CD deployment. Since this is an electron app, it just needs
      // to run every time the production app is started. That way if the user updates the app and the schema has
      // changed, it will transparently migrate their DB.
      await runPrismaCommand({
        command: ["migrate", "deploy", "--schema", schemaPath],
        dbUrl
      });
      log.info("Migration done.")

      // seed
      // log.info("Seeding...");
      // await seed(prisma);

    } catch (e) {
      log.error(e);
      process.exit(1);
    }
  } else {
    log.info("Does not need migration");
  }
}

export default handleMigrations;