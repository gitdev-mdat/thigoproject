import "reflect-metadata";

import { fileURLToPath } from "node:url";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { readAuthEnvironment } from "./config/auth-environment.js";
import { developmentFixturesEnabled } from "./config/development-fixtures.js";
import { readApiEnvironment } from "./config/environment.js";
import {
  assertMediaStorageWritable,
  readMediaStorageDirectory
} from "./config/media-storage.js";
import { DEVELOPMENT_MEDIA_PREFIX } from "./development/catalog-fixtures.js";
import { AppModule } from "./modules/app.module.js";

const developmentMediaRoot = fileURLToPath(
  new URL("../dev-media", import.meta.url)
);

async function bootstrap(): Promise<void> {
  const environment = readApiEnvironment(process.env);
  const authEnvironment = readAuthEnvironment(process.env);
  // Decided before any database connection so a refused production start opens nothing.
  const servesDemoMedia = developmentFixturesEnabled(process.env);
  await assertMediaStorageWritable(readMediaStorageDirectory(process.env));
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Seeded demo images are served only when development fixtures are opted in.
  if (servesDemoMedia)
    app.useStaticAssets(developmentMediaRoot, {
      prefix: `${DEVELOPMENT_MEDIA_PREFIX}/`,
      maxAge: "1d"
    });

  app.enableCors({ origin: authEnvironment.adminOrigin, credentials: true });
  app.enableShutdownHooks();
  await app.listen(environment.port, "0.0.0.0");
}

await bootstrap();
