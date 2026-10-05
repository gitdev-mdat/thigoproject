import "reflect-metadata";

import { DataSource } from "typeorm";

import { createDatabaseOptions } from "./config/database.js";
import { readDatabaseEnvironment } from "./config/environment.js";

export default new DataSource(
  createDatabaseOptions(readDatabaseEnvironment(process.env))
);
