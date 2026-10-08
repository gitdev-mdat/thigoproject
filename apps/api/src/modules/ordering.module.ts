import { Module } from "@nestjs/common";
import { CustomerOrderController } from "../controllers/customer/customer-order.controller.js";
import { DriverDeliveryController } from "../controllers/driver/driver-delivery.controller.js";
import { MerchantOrderController } from "../controllers/merchant/merchant-order.controller.js";
import { RoleGuard } from "../guards/role.guard.js";
import { AddressRepository } from "../repositories/ordering/address.repository.js";
import { OrderRepository } from "../repositories/ordering/order.repository.js";
import { AddressService } from "../services/ordering/address.service.js";
import { CheckoutService } from "../services/ordering/checkout.service.js";
import { CustomerOrderService } from "../services/ordering/customer-order.service.js";
import { DriverDeliveryService } from "../services/ordering/driver-delivery.service.js";
import { MerchantOrderService } from "../services/ordering/merchant-order.service.js";
import { AuthModule } from "./auth.module.js";
import { CatalogModule } from "./catalog.module.js";
@Module({
  imports: [AuthModule, CatalogModule],
  controllers: [
    CustomerOrderController,
    MerchantOrderController,
    DriverDeliveryController
  ],
  providers: [
    RoleGuard,
    AddressRepository,
    OrderRepository,
    AddressService,
    CheckoutService,
    CustomerOrderService,
    MerchantOrderService,
    DriverDeliveryService
  ]
})
export class OrderingModule {}
