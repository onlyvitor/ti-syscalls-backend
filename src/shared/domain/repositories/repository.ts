export interface Repository<TEntity, TId> {
  insert(entity: TEntity): Promise<void>;
  findById(id: TId): Promise<TEntity | null>;
}
