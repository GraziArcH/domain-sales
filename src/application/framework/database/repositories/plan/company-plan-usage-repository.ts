import { DatabaseHelper, DatabaseCacheHelper, EVENT_TYPES } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import {
    CompanyPlanUsage,
    ICompanyPlanUsageRepository
} from "@/domain/plan/interfaces/database/company-plan-usage-repository";

export class CompanyPlanUsageRepository implements ICompanyPlanUsageRepository {
    constructor(
        private readonly databaseHelper: DatabaseHelper,
        private readonly cacheHelper: DatabaseCacheHelper
    ) { }

    private mapper(row: any): CompanyPlanUsage | null {
        if (!row) return null;

        return {
            usage_id: IdValueObject.create(row.usage_id) as IdValueObject,
            company_plan_id: IdValueObject.create(row.company_plan_id) as IdValueObject,
            user_id: IdValueObject.create(row.user_id) as IdValueObject,
            admin: row.admin, // Added admin field to track user scope
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at) // Added updated_at field
        };
    }

    async create(usage: CompanyPlanUsage): Promise<CompanyPlanUsage> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO company_plan_usage (company_plan_id, user_id, admin, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [usage.company_plan_id.value, usage.user_id.value, usage.admin, usage.created_at, usage.updated_at]
        );

        // Get company_id for cache invalidation
        const companyPlanResult = await this.databaseHelper.query(
            "SELECT company_id FROM company_plan WHERE company_plan_id = $1",
            [usage.company_plan_id.value]
        );

        const companyId = companyPlanResult.rows[0]?.company_id;

        if (companyId) {
            await this.cacheHelper.invalidateByEvent(EVENT_TYPES.COMPANY_PLAN_USAGE_BULK_INSERT, {
                company_id: companyId
            });
        }

        return this.mapper(result.rows[0])!;
    }

    async bulkCreate(usages: CompanyPlanUsage[]): Promise<CompanyPlanUsage[]> {
        if (usages.length === 0) return [];

        // Prepare values for bulk insert with admin field
        const values = usages
            .map(
                (u) =>
                    `(${u.company_plan_id.value}, ${u.user_id.value}, ${u.admin}, '${u.created_at.toISOString()}', '${u.updated_at.toISOString()}')`
            )
            .join(", ");

        const query = `
            INSERT INTO company_plan_usage (company_plan_id, user_id, admin, created_at, updated_at)
            VALUES ${values}
            RETURNING *
        `;

        const result = await this.databaseHelper.query(query);

        // Get company_id for cache invalidation (using the first usage entry)
        const companyPlanResult = await this.databaseHelper.query(
            "SELECT company_id FROM company_plan WHERE company_plan_id = $1",
            [usages[0].company_plan_id.value]
        );

        const companyId = companyPlanResult.rows[0]?.company_id;

        if (companyId) {
            await this.cacheHelper.invalidateByEvent(EVENT_TYPES.COMPANY_PLAN_USAGE_BULK_INSERT, {
                company_id: companyId
            });
        }

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<CompanyPlanUsage[]> {
        const result = await this.databaseHelper.query("SELECT * FROM company_plan_usage WHERE company_plan_id = $1", [
            companyPlanId.value
        ]);

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getUsageMetrics(companyId: IdValueObject): Promise<any> {
        // First check cache
        const cachedMetrics = await this.cacheHelper.getCompanyUsageMetrics(companyId.value.toString());
        if (cachedMetrics) return cachedMetrics;

        // If not in cache, query and build metrics
        const result = await this.databaseHelper.query(
            `
            SELECT 
                cp.company_plan_id,
                cp.plan_id,
                p.plan_name,
                p.plan_type_id,
                COUNT(CASE WHEN cpu.admin = true THEN 1 END) as admin_count,
                COUNT(CASE WHEN cpu.admin = false THEN 1 END) as regular_count,
                COUNT(cpu.usage_id) as total_count,
                cp.amount,
                cp.additional_user_amount
            FROM company_plan cp
            JOIN plan p ON cp.plan_id = p.plan_id
            LEFT JOIN company_plan_usage cpu ON cp.company_plan_id = cpu.company_plan_id
            WHERE cp.company_id = $1 AND cp.status = 'active'
            GROUP BY cp.company_plan_id, cp.plan_id, p.plan_name, p.plan_type_id, cp.amount, cp.additional_user_amount
            ORDER BY cp.created_at DESC
            `,
            [companyId.value]
        );

        if (result.rows.length === 0) {
            return {
                usage_summary: [],
                total_usage: 0,
                total_cost: 0,
                admin_count: 0,
                regular_count: 0
            };
        }

        // Calculate costs according to RN009 - Pricing precedence
        const promises = result.rows.map(async (row) => {
            // Get standard limits for admins and regular users
            const planUserTypeResult = await this.databaseHelper.query(
                `
                SELECT admin, number_of_users, extra_user_price
                FROM plan_user_type
                WHERE plan_type_id = $1
                `,
                [row.plan_type_id]
            );

            // Get overrides for this company plan if any
            const overrideResult = await this.databaseHelper.query(
                `
                SELECT admin, extra_user_price
                FROM plan_user_override
                WHERE company_plan_id = $1
                `,
                [row.company_plan_id]
            );

            // Calculate admin and regular user costs
            const adminLimit = planUserTypeResult.rows.find((r) => r.admin)?.number_of_users || 0;
            const regularLimit = planUserTypeResult.rows.find((r) => !r.admin)?.number_of_users || 0;

            const adminOverride = overrideResult.rows.find((r) => r.admin)?.extra_user_price;
            const regularOverride = overrideResult.rows.find((r) => !r.admin)?.extra_user_price;

            const adminStandardPrice = planUserTypeResult.rows.find((r) => r.admin)?.extra_user_price || 0;
            const regularStandardPrice = planUserTypeResult.rows.find((r) => !r.admin)?.extra_user_price || 0;

            // Apply pricing precedence RN009
            const adminPrice =
                adminOverride ?? (row.additional_user_amount > 0 ? row.additional_user_amount : adminStandardPrice);
            const regularPrice =
                regularOverride ?? (row.additional_user_amount > 0 ? row.additional_user_amount : regularStandardPrice);

            const adminExtraUsers = Math.max(0, row.admin_count - adminLimit);
            const regularExtraUsers = Math.max(0, row.regular_count - regularLimit);

            const adminExtraCost = adminExtraUsers * adminPrice;
            const regularExtraCost = regularExtraUsers * regularPrice;

            return {
                plan_id: row.plan_id,
                plan_name: row.plan_name,
                admin_count: parseInt(row.admin_count || "0"),
                regular_count: parseInt(row.regular_count || "0"),
                total_count: parseInt(row.total_count || "0"),
                base_amount: Number(row.amount),
                additional_user_amount: Number(row.additional_user_amount),
                admin_extra_cost: adminExtraCost,
                regular_extra_cost: regularExtraCost,
                total_extra_cost: adminExtraCost + regularExtraCost,
                total_cost: Number(row.amount) + adminExtraCost + regularExtraCost
            };
        });

        const usageSummaries = await Promise.all(promises);

        const metrics = {
            usage_summary: usageSummaries,
            total_usage: result.rows.reduce((sum, row) => sum + parseInt(row.total_count || "0"), 0),
            total_cost: usageSummaries.reduce((sum, item) => sum + item.total_cost, 0),
            admin_count: result.rows.reduce((sum, row) => sum + parseInt(row.admin_count || "0"), 0),
            regular_count: result.rows.reduce((sum, row) => sum + parseInt(row.regular_count || "0"), 0)
        };

        // Store in cache
        await this.cacheHelper.setCompanyUsageMetrics(companyId.value.toString(), metrics);

        return metrics;
    }

    /**
     * Counts the number of users by scope (admin/common) for a specific company plan
     * Required for implementing RN011 - Validation of limits when adding or modifying users
     */
    async countUsersByScope(companyPlanId: IdValueObject, isAdmin: boolean): Promise<number> {
        const result = await this.databaseHelper.query(
            `
            SELECT COUNT(*) as user_count
            FROM company_plan_usage
            WHERE company_plan_id = $1 AND admin = $2
            `,
            [companyPlanId.value, isAdmin]
        );

        return parseInt(result.rows[0]?.user_count || "0", 10);
    }

    /**
     * Validates if a user can be added to a company plan based on scope limits
     * Implements RN011 - Checks available slots before allowing new users
     *
     * @return true if the user can be added, false if limits are reached
     */
    async validateUserLimit(companyPlanId: IdValueObject, isAdmin: boolean): Promise<boolean> {
        // 1. Get the current user count by scope
        const currentUserCount = await this.countUsersByScope(companyPlanId, isAdmin);

        // 2. Get the company plan to find the plan_type_id
        const companyPlanResult = await this.databaseHelper.query(
            `
            SELECT cp.plan_id, p.plan_type_id
            FROM company_plan cp
            JOIN plan p ON cp.plan_id = p.plan_id
            WHERE cp.company_plan_id = $1
            `,
            [companyPlanId.value]
        );

        if (!companyPlanResult.rows[0]) {
            throw new Error("Company plan not found");
        }

        const planTypeId = companyPlanResult.rows[0].plan_type_id;

        // 3. Get the standard limit from plan_user_type (plan_user_override only affects pricing, not user limits)
        const limitResult = await this.databaseHelper.query(
            `
            SELECT number_of_users
            FROM plan_user_type
            WHERE plan_type_id = $1 AND admin = $2
            `,
            [planTypeId, isAdmin]
        );

        if (!limitResult.rows[0]) {
            throw new Error(`No user limit configuration found for plan type ${planTypeId} and admin=${isAdmin}`);
        }

        return currentUserCount < limitResult.rows[0].number_of_users;
    }

    /**
     * Synchronizes company plan usage with the current state of users in the company
     * This is useful when integrating with the existing User database
     *
     * @param companyId The company ID to synchronize
     * @param companyPlanId The company plan ID to associate users with
     */
    async syncWithUserDatabase(companyId: IdValueObject, companyPlanId: IdValueObject): Promise<CompanyPlanUsage[]> {
        // 1. Get current active users from the User database for this company
        const usersResult = await this.databaseHelper.query(
            `
            SELECT user_id, admin 
            FROM "user" 
            WHERE company_id = $1 AND active = true
            `,
            [companyId.value]
        );

        if (!usersResult.rows.length) {
            return [];
        }

        // 2. Get current usage records
        const existingUsageRecords = await this.getByCompanyPlanId(companyPlanId);

        // Create a map of existing user_id -> usage record
        const existingUsageMap = new Map();
        existingUsageRecords.forEach((record) => {
            existingUsageMap.set(record.user_id.value.toString(), record);
        });

        // 3. Create, update, or remove usage records to match User database
        const usagesToCreate: CompanyPlanUsage[] = [];
        const now = new Date();

        for (const user of usersResult.rows) {
            const userId = IdValueObject.create(user.user_id);
            if (userId instanceof Error) continue;

            // If user doesn't exist in usage records, add them
            if (!existingUsageMap.has(user.user_id.toString())) {
                usagesToCreate.push({
                    usage_id: IdValueObject.create(0) as IdValueObject, // Will be generated by DB
                    company_plan_id: companyPlanId,
                    user_id: userId as IdValueObject,
                    admin: user.admin,
                    created_at: now,
                    updated_at: now
                });
            }
            // If admin status differs, update it
            else {
                const existingUsage = existingUsageMap.get(user.user_id.toString());
                if (existingUsage.admin !== user.admin) {
                    await this.updateUserScope(existingUsage.usage_id, user.admin);
                }
                // Remove from map to track what was processed
                existingUsageMap.delete(user.user_id.toString());
            }
        }

        // 4. Create new usage records in bulk if needed
        let createdRecords: CompanyPlanUsage[] = [];
        if (usagesToCreate.length > 0) {
            createdRecords = await this.bulkCreate(usagesToCreate);
        }

        // 5. Return all current usage records after sync
        return [
            ...createdRecords,
            ...existingUsageRecords.filter((r) => existingUsageMap.has(r.user_id.value.toString()))
        ];
    }

    /**
     * Updates the scope (admin status) of a user in the company plan usage
     * This should be called when a user's admin status changes in the User database
     *
     * @param usageId The usage record ID to update
     * @param isAdmin The new admin status
     */
    async updateUserScope(usageId: IdValueObject, isAdmin: boolean): Promise<CompanyPlanUsage | null> {
        const result = await this.databaseHelper.query(
            `
            UPDATE company_plan_usage
            SET admin = $1, updated_at = NOW()
            WHERE usage_id = $2
            RETURNING *
            `,
            [isAdmin, usageId.value]
        );

        return result.rows.length > 0 ? this.mapper(result.rows[0]) : null;
    }

    /**
     * Checks if changing a user's scope (admin status) would exceed plan limits
     * This should be called before promoting/demoting a user in the User database
     *
     * @param companyPlanId The company plan ID
     * @param currentIsAdmin The current admin status
     * @param newIsAdmin The new admin status to check
     */
    async canChangeUserScope(
        companyPlanId: IdValueObject,
        currentIsAdmin: boolean,
        newIsAdmin: boolean
    ): Promise<boolean> {
        // If demoting from admin to regular, no need to check limits
        if (currentIsAdmin && !newIsAdmin) {
            return true;
        }

        // If promoting from regular to admin, check admin limit
        if (!currentIsAdmin && newIsAdmin) {
            return await this.validateUserLimit(companyPlanId, true);
        }

        return true;
    }

    /**
     * Find a user's usage record in a company plan
     * Useful for checking if a user is already part of a plan
     *
     * @param companyPlanId The company plan ID
     * @param userId The user ID to find
     */
    async findUserInPlan(companyPlanId: IdValueObject, userId: IdValueObject): Promise<CompanyPlanUsage | null> {
        const result = await this.databaseHelper.query(
            `
            SELECT * FROM company_plan_usage
            WHERE company_plan_id = $1 AND user_id = $2
            `,
            [companyPlanId.value, userId.value]
        );

        return result.rows.length > 0 ? this.mapper(result.rows[0]) : null;
    }

    /**
     * Removes a user from a company plan
     * This should be called when a user is deactivated or removed from a company
     *
     * @param usageId The usage ID to remove
     * @return true if the user was successfully removed, false otherwise
     */
    async removeUserFromPlan(usageId: IdValueObject): Promise<boolean> {
        try {
            // First get the usage record to find the company plan for cache invalidation
            const usageResult = await this.databaseHelper.query(
                "SELECT company_plan_id FROM company_plan_usage WHERE usage_id = $1",
                [usageId.value]
            );

            if (!usageResult.rows.length) {
                return false;
            }

            const companyPlanId = usageResult.rows[0].company_plan_id;

            // Delete the usage record
            const result = await this.databaseHelper.query("DELETE FROM company_plan_usage WHERE usage_id = $1", [
                usageId.value
            ]);

            if (result.rowCount > 0) {
                // Get company_id for cache invalidation
                const companyPlanResult = await this.databaseHelper.query(
                    "SELECT company_id FROM company_plan WHERE company_plan_id = $1",
                    [companyPlanId]
                );

                const companyId = companyPlanResult.rows[0]?.company_id;

                if (companyId) {
                    await this.cacheHelper.invalidateByEvent(EVENT_TYPES.COMPANY_PLAN_UPDATED, {
                        company_id: companyId
                    });
                }

                return true;
            }

            return false;
        } catch (error) {
            console.error("Error removing user from plan:", error);
            return false;
        }
    }
}
