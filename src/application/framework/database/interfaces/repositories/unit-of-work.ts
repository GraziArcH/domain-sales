export interface IUnitOfWork {
    start(): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    runTransaction<T>(callback: () => Promise<T>): Promise<T>;
}
