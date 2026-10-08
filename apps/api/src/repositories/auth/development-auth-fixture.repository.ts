import type { DataSource } from "typeorm";

import {
  ApplicationRole,
  UserRole
} from "../../entities/auth/user-role.entity.js";
import { User } from "../../entities/auth/user.entity.js";

export class DevelopmentAuthFixtureRepository {
  constructor(private readonly dataSource: DataSource) {}

  async ensureAccount(phone: string, role: ApplicationRole): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder()
        .insert()
        .into(User)
        .values({ phone })
        .orIgnore()
        .execute();

      const user = await manager.getRepository(User).findOneByOrFail({ phone });

      await manager
        .createQueryBuilder()
        .insert()
        .into(UserRole)
        .values({ userId: user.id, role })
        .orIgnore()
        .execute();
    });
  }
}
