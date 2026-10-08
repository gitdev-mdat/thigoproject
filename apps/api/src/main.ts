import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { readAuthEnvironment } from "./config/auth-environment.js";
import { readApiEnvironment } from "./config/environment.js";
import { AppModule } from "./modules/app.module.js";

async function bootstrap(): Promise<void> {
  const environment = readApiEnvironment(process.env);
  const authEnvironment = readAuthEnvironment(process.env);
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: authEnvironment.adminOrigin, credentials: true });
  app.enableShutdownHooks();
  await app.listen(environment.port, "0.0.0.0");
}

await bootstrap();
