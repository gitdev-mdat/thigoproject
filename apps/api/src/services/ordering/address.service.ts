import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import {
  isUuid,
  type AddressDto,
  type AddressInput
} from "../../dto/ordering/ordering.dto.js";
import type { CustomerAddress } from "../../entities/ordering/customer-address.entity.js";
import { AddressRepository } from "../../repositories/ordering/address.repository.js";

export const MAX_ADDRESSES = 10;

export function toAddress(address: CustomerAddress): AddressDto {
  return {
    id: address.id,
    label: address.label,
    line: address.line,
    note: address.note,
    isDefault: address.isDefault
  };
}

@Injectable()
export class AddressService {
  constructor(private readonly addresses: AddressRepository) {}

  async list(userId: string): Promise<AddressDto[]> {
    return (await this.addresses.list(userId)).map(toAddress);
  }

  async create(userId: string, input: AddressInput): Promise<AddressDto> {
    if ((await this.addresses.count(userId)) >= MAX_ADDRESSES)
      throw new BadRequestException(
        `Bạn có thể lưu tối đa ${MAX_ADDRESSES} địa chỉ.`
      );
    if (await this.addresses.findByLabel(userId, input.label))
      throw new ConflictException(`Đã có địa chỉ tên “${input.label}”.`);
    const first = !(await this.addresses.findDefault(userId));
    return toAddress(
      await this.addresses.save(userId, input, input.makeDefault || first)
    );
  }

  async makeDefault(userId: string, id: string): Promise<AddressDto> {
    const address = isUuid(id) ? await this.addresses.find(id, userId) : null;
    if (!address) throw new NotFoundException("Không tìm thấy địa chỉ.");
    return toAddress(await this.addresses.save(userId, address, true));
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!isUuid(id) || !(await this.addresses.delete(id, userId)))
      throw new NotFoundException("Không tìm thấy địa chỉ.");
  }
}
