import "reflect-metadata";

import { fileURLToPath } from "node:url";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { readAuthEnvironment } from "./config/auth-environment.js";
import { readApiEnvironment } from "./config/environment.js";
import { DEVELOPMENT_MEDIA_PREFIX } from "./development/catalog-fixtures.js";
import { AppModule } from "./modules/app.module.js";

const developmentMediaRoot = fileURLToPath(
  new URL("../dev-media", import.meta.url)
);

async function bootstrap(): Promise<void> {
  const environment = readApiEnvironment(process.env);
  const authEnvironment = readAuthEnvironment(process.env);
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // Seeded catalog images exist only for development; production never serves them.
  if (process.env.NODE_ENV !== "production")
    app.useStaticAssets(developmentMediaRoot, {
      prefix: `${DEVELOPMENT_MEDIA_PREFIX}/`,
      maxAge: "1d"
    });

  app.enableCors({ origin: authEnvironment.adminOrigin, credentials: true });
  app.enableShutdownHooks();
  await app.listen(environment.port, "0.0.0.0");
}

await bootstrap();
