import "reflect-metadata";

import { DataSource } from "typeorm";

import { createDatabaseOptions } from "../config/database.js";
import { readDatabaseEnvironment } from "../config/environment.js";
import { assertDevelopmentSeedEnvironment } from "../development/auth-fixtures.js";
import {
  DEVELOPMENT_EXTRA_DRIVER_PHONE,
  seedDevelopmentOrders
} from "../development/order-fixtures.js";
import { DevelopmentOrderFixtureRepository } from "../repositories/ordering/development-order-fixture.repository.js";
import { assertNoPendingMigrations } from "../repositories/health/pending-migrations.js";

async function run(): Promise<void> {
  assertDevelopmentSeedEnvironment(process.env);

  const dataSource = new DataSource(
    createDatabaseOptions(readDatabaseEnvironment(process.env))
  );
  await dataSource.initialize();

  try {
    await assertNoPendingMigrations(dataSource);
    await dataSource.transaction((manager) =>
      seedDevelopmentOrders(new DevelopmentOrderFixtureRepository(manager))
    );
  } finally {
    await dataSource.destroy();
  }

  console.log(`${DEVELOPMENT_EXTRA_DRIVER_PHONE} -> DRIVER (second driver)`);
  console.log("Development addresses and order history are ready.");
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Development order seed failed: ${message}`);
  process.exitCode = 1;
}
