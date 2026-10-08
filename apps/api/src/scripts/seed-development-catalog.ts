import "reflect-metadata";

import { DataSource } from "typeorm";

import { createDatabaseOptions } from "../config/database.js";
import { readDatabaseEnvironment } from "../config/environment.js";
import { assertDevelopmentSeedEnvironment } from "../development/auth-fixtures.js";
import {
  DEVELOPMENT_STORE_FIXTURES,
  seedDevelopmentCatalog
} from "../development/catalog-fixtures.js";
import { DevelopmentCatalogFixtureRepository } from "../repositories/catalog/development-catalog-fixture.repository.js";

async function run(): Promise<void> {
  assertDevelopmentSeedEnvironment(process.env);

  const dataSource = new DataSource(
    createDatabaseOptions(readDatabaseEnvironment(process.env))
  );
  await dataSource.initialize();

  try {
    await dataSource.transaction((manager) =>
      seedDevelopmentCatalog(new DevelopmentCatalogFixtureRepository(manager))
    );
  } finally {
    await dataSource.destroy();
  }

  for (const store of DEVELOPMENT_STORE_FIXTURES) {
    console.log(`${store.ownerPhone} -> ${store.name}`);
  }
  console.log("Development catalog fixtures are ready.");
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Development catalog seed failed: ${message}`);
  process.exitCode = 1;
}
