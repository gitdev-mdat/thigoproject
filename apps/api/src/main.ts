import "reflect-metadata";

import { NestFactory } from "@nestjs/core";

import { readApiEnvironment } from "./config/environment.js";
import { AppModule } from "./modules/app.module.js";

async function bootstrap(): Promise<void> {
  const environment = readApiEnvironment(process.env);
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();
  await app.listen(environment.port, "0.0.0.0");
}

await bootstrap();
