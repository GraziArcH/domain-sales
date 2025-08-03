import { DatabaseHelper, IUnitOfWork } from "@/application/framework";
import { AsyncLocalStorage } from "async_hooks";

// Create a global AsyncLocalStorage instance for user context
export const userContext = new AsyncLocalStorage<{ userId: number }>();

export class UnitOfWork implements IUnitOfWork {
    constructor(private readonly databaseHelper: DatabaseHelper) {}

    async start(): Promise<void> {
        await this.databaseHelper.query("BEGIN");

        // Get the current user context from AsyncLocalStorage
        const context = userContext.getStore();
        if (context?.userId) {
            // Set the user context for database triggers
            await this.databaseHelper.query("SELECT set_config('app.current_user_id', $1, true)", [
                context.userId.toString()
            ]);
        }
    }

    async commit(): Promise<void> {
        await this.databaseHelper.query("COMMIT");
    }

    async rollback(): Promise<void> {
        await this.databaseHelper.query("ROLLBACK");
    }

    async runTransaction<T>(callback: () => Promise<T>): Promise<T> {
        try {
            await this.start();
            const result = await callback();
            await this.commit();
            return result;
        } catch (error) {
            await this.rollback();
            throw error;
        }
    }
}
