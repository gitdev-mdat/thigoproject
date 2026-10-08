import "reflect-metadata";

import { DataSource } from "typeorm";

import { createDatabaseOptions } from "../config/database.js";
import { readDatabaseEnvironment } from "../config/environment.js";
import {
  assertDevelopmentSeedEnvironment,
  DEVELOPMENT_AUTH_FIXTURES,
  seedDevelopmentAuthFixtures
} from "../development/auth-fixtures.js";
import { DevelopmentAuthFixtureRepository } from "../repositories/auth/development-auth-fixture.repository.js";

async function run(): Promise<void> {
  assertDevelopmentSeedEnvironment(process.env);

  const dataSource = new DataSource(
    createDatabaseOptions(readDatabaseEnvironment(process.env))
  );
  await dataSource.initialize();

  try {
    await seedDevelopmentAuthFixtures(
      new DevelopmentAuthFixtureRepository(dataSource)
    );
  } finally {
    await dataSource.destroy();
  }

  for (const fixture of DEVELOPMENT_AUTH_FIXTURES) {
    console.log(`${fixture.phone} -> ${fixture.role}`);
  }
  console.log("Development authentication fixtures are ready.");
}

try {
  await run();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`Development authentication seed failed: ${message}`);
  process.exitCode = 1;
}
