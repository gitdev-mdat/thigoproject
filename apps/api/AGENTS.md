# API Rules

Follow `Controller -> Service -> Repository -> Database` without shortcuts.

- `controllers`: transport boundary, validation/input mapping, authorization boundary, and delegation only. No meaningful business logic and no repository imports.
- `services`: business rules, orchestration, transactions, and business decisions.
- `repositories`: persistence access only. No HTTP/UI knowledge or workflow orchestration.
- `entities`: persistence/domain data representation when a real model exists.
- `dto`: transport contracts grouped by feature.
- `modules`: NestJS dependency wiring, not the repository's organizing architecture.
- `gateways`: server-mediated realtime or external transport boundaries.

Database access stays inside repositories or the approved TypeORM configuration/migration boundary. `DataSource`, `EntityManager`, and TypeORM repositories must not be used by controllers or services. Schema synchronization is forbidden; every schema change uses a migration. Follow an existing layer/feature pattern before creating another. Do not replace TypeORM, spread framework abstractions, create generic base repositories, or invent entities without a demonstrated feature need. Tests must prove the changed layer's behavior.
