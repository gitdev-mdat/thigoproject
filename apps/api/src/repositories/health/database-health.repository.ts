import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import {
  findPendingMigrations,
  pendingMigrationsMessage
} from "./pending-migrations.js";

export type DatabaseStatus = "up" | "down";

@Injectable()
export class DatabaseHealthRepository
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DatabaseHealthRepository.name);
  private initialization: Promise<boolean> | undefined;

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    if (!(await this.isAvailable())) {
      this.logger.warn(
        "Database is unavailable; API health will report degraded until connectivity is restored."
      );
    }
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.dataSource.isInitialized) {
      await this.dataSource.destroy();
    }
  }

  async getStatus(): Promise<DatabaseStatus> {
    return (await this.isAvailable()) ? "up" : "down";
  }

  private async isAvailable(): Promise<boolean> {
    if (!(await this.ensureInitialized())) {
      return false;
    }

    try {
      await this.dataSource.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  private async ensureInitialized(): Promise<boolean> {
    if (this.dataSource.isInitialized) {
      return true;
    }

    this.initialization ??= this.dataSource
      .initialize()
      .then(async () => {
        await this.reportPendingMigrations();
        return true;
      })
      .catch(() => false)
      .finally(() => {
        this.initialization = undefined;
      });

    return this.initialization;
  }

  /**
   * A database behind the code answers 42P01 ("relation does not exist") on
   * every feature route, so name the missing migrations once at connection.
   */
  private async reportPendingMigrations(): Promise<void> {
    try {
      const pending = await findPendingMigrations(this.dataSource);
      if (pending.length) this.logger.error(pendingMigrationsMessage(pending));
    } catch (error) {
      this.logger.warn(
        `Could not read the database migration history: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
}
