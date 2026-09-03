# TI Syscalls Backend

## Repository abstractions

Shared repository ports live in `src/shared/domain/repositories`. They only use
domain and application concepts and have no dependency on NestJS, an ORM, or a
database.

`Repository<TEntity, TId>` contains only persistence operations that currently
have common semantics across aggregates: inserting an entity and finding one by
its identity. Operations such as update, delete, and aggregate-specific queries
remain on contracts such as `UserRepository` because their rules and failure
semantics can differ by aggregate.

`SearchableRepository<TEntity, TFilter, TSortField>` defines search separately.
It uses reusable pagination, paginated-result, and ordering types, while each
aggregate supplies its own filter and sortable-field types. For example,
`UserFilter` supports name, email, role, and the existing broad name-or-email
query without adding User knowledge to the shared port.

`SearchableRepository` does not extend `Repository`. A searchable read model may
not support writes or identity lookup, so coupling both responsibilities would
make that valid implementation impossible. Aggregate contracts combine the
ports when needed: `SearchableUserRepository` extends both `UserRepository` and
`SearchableRepository` and can still add User-specific operations.

Contracts stay in domain directories. Storage adapters, such as the in-memory
User repositories, stay in `src/users/infrastructure/repositories` and implement
those contracts. This avoids a generic CRUD repository that would hide domain
queries and force unrelated aggregates to share persistence semantics.
