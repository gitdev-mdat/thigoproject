import { Injectable } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";
import { CustomerAddress } from "../../entities/ordering/customer-address.entity.js";

@Injectable()
export class AddressRepository {
  constructor(@InjectDataSource() private readonly db: DataSource) {}

  list(userId: string): Promise<CustomerAddress[]> {
    return this.db.getRepository(CustomerAddress).find({
      where: { userId },
      order: { isDefault: "DESC", updatedAt: "DESC" }
    });
  }

  find(id: string, userId: string): Promise<CustomerAddress | null> {
    return this.db
      .getRepository(CustomerAddress)
      .findOne({ where: { id, userId } });
  }

  findDefault(userId: string): Promise<CustomerAddress | null> {
    return this.db
      .getRepository(CustomerAddress)
      .findOne({ where: { userId, isDefault: true } });
  }

  count(userId: string): Promise<number> {
    return this.db.getRepository(CustomerAddress).count({ where: { userId } });
  }

  findByLabel(userId: string, label: string): Promise<CustomerAddress | null> {
    return this.db
      .getRepository(CustomerAddress)
      .findOne({ where: { userId, label } });
  }

  /** Saves an address; when it becomes the default, the old default is cleared in the same transaction. */
  async save(
    userId: string,
    values: { id?: string; label: string; line: string; note: string | null },
    makeDefault: boolean
  ): Promise<CustomerAddress> {
    return this.db.transaction(async (manager) => {
      const repository = manager.getRepository(CustomerAddress);
      if (makeDefault)
        await repository.update(
          { userId, isDefault: true },
          { isDefault: false }
        );
      const existing = values.id
        ? await repository.findOne({ where: { id: values.id, userId } })
        : null;
      return repository.save(
        repository.create({
          ...(existing ?? { userId, isDefault: false }),
          label: values.label,
          line: values.line,
          note: values.note,
          ...(makeDefault ? { isDefault: true } : {})
        })
      );
    });
  }

  /** Deletes an address and promotes the most recent remaining one if it was the default. */
  async delete(id: string, userId: string): Promise<boolean> {
    return this.db.transaction(async (manager) => {
      const repository = manager.getRepository(CustomerAddress);
      const address = await repository.findOne({ where: { id, userId } });
      if (!address) return false;
      await repository.delete({ id, userId });
      if (address.isDefault) {
        const next = await repository.findOne({
          where: { userId },
          order: { updatedAt: "DESC" }
        });
        if (next) await repository.update({ id: next.id }, { isDefault: true });
      }
      return true;
    });
  }
}
