import { PlanFacade } from "../facade";
import { IdValueObject } from "../../domain/plan";
import { DatabaseHelper } from "../framework";

/**
 * Service responsible for integrating operations between
 * the User database and the Plan system
 *
 * @remarks
 * This service ensures atomic operations across both databases,
 * maintaining data consistency and enforcing business rules.
 * All methods handle transactions automatically.
 */
export class UserPlanIntegrationService {
    /**
     * @param planFacade - The plan facade instance for plan operations
     * @param userDatabaseHelper - Database helper MUST be initialized with "user" database name
     */
    constructor(
        private readonly planFacade: PlanFacade,
        private readonly userDatabaseHelper: DatabaseHelper // This MUST be initialized with "user" database name
    ) {}

    /**
     * Creates a new user in both User database and Plan system atomically
     *
     * @param companyId - The company identifier
     * @param userData - User data object containing all required user information
     * @param userData.name - User's first name
     * @param userData.surname - User's last name
     * @param userData.cpf - User's CPF (optional)
     * @param userData.email - User's email address
     * @param userData.admin - Whether the user is an admin
     * @param userData.user_type_id - User type identifier
     * @returns Promise<UserWithPlanUsage | Error> - Created user object with plan_usage_id or Error
     *
     * @example
     * ```typescript
     * const result = await userPlanIntegrationService.createUserWithPlanValidation(
     *   123, // companyId
     *   {
     *     name: "John",
     *     surname: "Doe",
     *     email: "john.doe@company.com",
     *     admin: false,
     *     user_type_id: 1,
     *     cpf: "12345678901" // optional
     *   }
     * );
     *
     * if (result instanceof Error) {
     *   console.error('User creation failed:', result.message);
     * } else {
     *   console.log('User created:', result.user_id);
     *   console.log('Plan usage ID:', result.plan_usage_id);
     * }
     * ```
     *
     * @remarks
     * **Process Steps:**
     * 1. Validates plan limits before creation
     * 2. Creates user in User database
     * 3. Creates email record
     * 4. Adds user to company plan
     * 5. Returns created user with plan usage ID
     *
     * **Business Rules Applied:**
     * - RN001: Must have active plan
     * - RN011: Validates user limits
     * - All operations are atomic (rollback on any failure)
     */
    async createUserWithPlanValidation(
        companyId: number,
        userData: {
            name: string;
            surname: string;
            cpf?: string;
            email: string;
            admin: boolean;
            user_type_id: number;
        }
    ): Promise<any> {
        try {
            // Begin transaction
            await this.userDatabaseHelper.query("BEGIN");

            try {
                // 1. Get active company plan
                const companyIdObj = IdValueObject.create(companyId);
                if (companyIdObj instanceof Error) throw companyIdObj;

                const activePlan = await this.planFacade.getCompanyActivePlan(companyId);
                if (!activePlan || activePlan instanceof Error) {
                    throw new Error("No active plan found for company");
                }

                // 2. Check if user can be added based on limits
                const canAdd = await this.planFacade.canAddUserToPlan(activePlan.company_plan_id.value, userData.admin);

                if (!canAdd || canAdd instanceof Error) {
                    return new Error("Cannot add user: user limit exceeded for this plan");
                }

                // 3. Create user in User database
                const userResult = await this.userDatabaseHelper.query(
                    `
                    INSERT INTO "user" (name, surname, cpf, company_id, admin, active, user_type_id)
                    VALUES ($1, $2, $3, $4, $5, true, $6)
                    RETURNING user_id
                    `,
                    [
                        userData.name,
                        userData.surname,
                        userData.cpf || null,
                        companyId,
                        userData.admin,
                        userData.user_type_id
                    ]
                );

                const userId = userResult.rows[0].user_id;

                // 4. Create email entry
                await this.userDatabaseHelper.query(
                    `
                    INSERT INTO email (user_id, email, type)
                    VALUES ($1, $2, 'primary')
                    `,
                    [userId, userData.email]
                );

                // 5. Add user to company plan
                const planResult = await this.planFacade.addUserToCompanyPlan(
                    activePlan.company_plan_id.value,
                    userId,
                    userData.admin
                );

                if (planResult instanceof Error) {
                    return planResult;
                }

                // 6. Commit transaction
                await this.userDatabaseHelper.query("COMMIT");

                // 7. Return created user
                return {
                    user_id: userId,
                    ...userData,
                    active: true,
                    plan_usage_id: planResult.usage_id.value
                };
            } catch (error) {
                // Rollback transaction on error
                await this.userDatabaseHelper.query("ROLLBACK");
                throw error;
            }
        } catch (error) {
            return error;
        }
    }

    /**
     * Changes a user's admin status in both User database and Plan system atomically
     *
     * @param userId - The user ID to update
     * @param newIsAdmin - The new admin status
     * @returns Promise<UpdatedUser | Error> - Updated user object or Error
     *
     * @example
     * ```typescript
     * // Promote user to admin
     * const result = await userPlanIntegrationService.changeUserAdminStatus(456, true);
     * if (result instanceof Error) {
     *   console.error('Promotion failed:', result.message);
     * } else {
     *   console.log('User promoted to admin:', result.user_id);
     * }
     *
     * // Demote admin to regular user
     * const result2 = await userPlanIntegrationService.changeUserAdminStatus(456, false);
     * ```
     *
     * @remarks
     * **Process Steps:**
     * 1. Validates scope change against plan limits
     * 2. Updates user scope in Plan system
     * 3. Updates admin status in User database
     * 4. Returns updated user
     *
     * **Business Rules Applied:**
     * - RN011: Validates admin limits before promotion
     * - RN015: Scope change validation
     * - All operations are atomic (rollback on any failure)
     */
    async changeUserAdminStatus(userId: number, newIsAdmin: boolean): Promise<any> {
        try {
            // Begin transaction
            await this.userDatabaseHelper.query("BEGIN");

            try {
                // 1. Get user details and company
                const userResult = await this.userDatabaseHelper.query(
                    'SELECT company_id FROM "user" WHERE user_id = $1',
                    [userId]
                );

                if (!userResult.rows.length) {
                    return new Error("User not found");
                }

                const companyId = userResult.rows[0].company_id;

                // 2. Validate change in plan system
                const planResult = await this.planFacade.changeUserScope(
                    companyId, // Using number directly
                    userId,
                    newIsAdmin
                );

                if (planResult instanceof Error) {
                    return planResult;
                }

                // 3. Update user in User DB
                const updatedUser = await this.userDatabaseHelper.query(
                    `
                    UPDATE "user"
                    SET admin = $1
                    WHERE user_id = $2
                    RETURNING *
                    `,
                    [newIsAdmin, userId]
                );

                // 4. Commit transaction
                await this.userDatabaseHelper.query("COMMIT");

                return updatedUser.rows[0];
            } catch (error) {
                // Transaction will be rolled back
                await this.userDatabaseHelper.query("ROLLBACK");
                return error;
            }
        } catch (error) {
            return error;
        }
    }

    /**
     * Removes a user from both User database and Plan system atomically (soft delete in User DB)
     *
     * @param userId - The user ID to remove
     * @returns Promise<SuccessStatus | Error> - Success object `{ success: true }` or Error
     *
     * @example
     * ```typescript
     * const result = await userPlanIntegrationService.removeUser(456);
     * if (result instanceof Error) {
     *   console.error('User removal failed:', result.message);
     * } else {
     *   console.log('User removed successfully');
     * }
     * ```
     *
     * @remarks
     * **Process Steps:**
     * 1. Removes user from company plan
     * 2. Deactivates user in User database (sets active = false)
     * 3. Returns success status
     *
     * **Important Notes:**
     * - This is a soft delete (sets active = false, doesn't delete record)
     * - User data is preserved for audit purposes
     * - All operations are atomic (rollback on any failure)
     */
    async removeUser(userId: number): Promise<any> {
        try {
            // Begin transaction
            await this.userDatabaseHelper.query("BEGIN");

            try {
                // 1. Get user and company details
                const userResult = await this.userDatabaseHelper.query(
                    `
                    SELECT u.user_id, u.company_id 
                    FROM "user" u
                    WHERE u.user_id = $1
                    `,
                    [userId]
                );

                if (!userResult.rows.length) {
                    return new Error("User not found");
                }

                const { company_id } = userResult.rows[0];

                // 2. Get active company plan
                const activePlan = await this.planFacade.getCompanyActivePlan(company_id);
                if (!activePlan || activePlan instanceof Error) {
                    return new Error("No active plan found for company");
                }

                // 3. Remove from plan first
                const planResult = await this.planFacade.removeUserFromCompanyPlan(
                    activePlan.company_plan_id.value,
                    userId
                );

                if (planResult instanceof Error) {
                    return planResult;
                }

                // 4. Deactivate in User DB (soft delete)
                await this.userDatabaseHelper.query(
                    `
                    UPDATE "user"
                    SET active = false
                    WHERE user_id = $1
                    `,
                    [userId]
                );

                // 5. Commit transaction
                await this.userDatabaseHelper.query("COMMIT");

                return { success: true };
            } catch (error) {
                // Transaction will be rolled back
                await this.userDatabaseHelper.query("ROLLBACK");
                return error;
            }
        } catch (error) {
            return error;
        }
    }

    /**
     * Performs full synchronization between User database and Plan system for a company
     *
     * @param companyId - The company identifier to synchronize
     * @returns Promise<SynchronizationResults | Error> - Synchronization results object with arrays of added, skipped, and error records
     *
     * @example
     * ```typescript
     * const result = await userPlanIntegrationService.fullSyncCompany(123);
     * if (result instanceof Error) {
     *   console.error('Sync failed:', result.message);
     * } else {
     *   console.log(`Synchronization completed:`);
     *   console.log(`- Added users: ${result.added.length}`);
     *   console.log(`- Skipped users: ${result.skipped.length}`);
     *   console.log(`- Errors: ${result.errors.length}`);
     *
     *   // Log specific results
     *   result.added.forEach(userId => console.log(`Added user ${userId}`));
     *   result.errors.forEach(error => console.log(`Error: ${error.error} for user ${error.user_Id}`));
     * }
     * ```
     *
     * @returns Object with structure:
     * ```typescript
     * {
     *   added: string[],    // Array of user IDs that were added to the plan
     *   skipped: string[],  // Array of user IDs that were already in the plan
     *   errors: Array<{    // Array of errors encountered
     *     user_Id: number,
     *     error: string
     *   }>
     * }
     * ```
     *
     * @remarks
     * **Process Steps:**
     * 1. Retrieves all active users from User database
     * 2. Synchronizes with Plan system usage records
     * 3. Validates against plan limits
     * 4. Returns synchronization results
     *
     * **Use Cases:**
     * - Setting up plan system for existing companies
     * - Recovering from data inconsistencies
     * - Migrating companies to new plan types
     * - Periodic validation of data integrity
     */
    async fullSyncCompany(companyId: number): Promise<any> {
        try {
            // 1. Get all active users from the User database
            const userResult = await this.userDatabaseHelper.query(
                `
                SELECT user_id, admin
                FROM "user"
                WHERE company_id = $1 AND active = true
                `,
                [companyId]
            );

            // 2. Format users for sync
            const users = userResult.rows.map((u) => ({
                user_Id: u.user_id, // Using user_Id to match the expected interface
                admin: u.admin
            }));

            // 3. Run sync operation
            return await this.planFacade.syncCompanyUsers(companyId, users);
        } catch (error) {
            return error;
        }
    }
}
