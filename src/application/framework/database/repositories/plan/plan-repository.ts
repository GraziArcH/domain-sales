import { DatabaseHelper, DatabaseCacheHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import { Plan, IPlanRepository, PublicPlanQueryParams } from "@/domain/plan/interfaces/database/plan-repository";

export class PlanRepository implements IPlanRepository {
    constructor(
        private readonly databaseHelper: DatabaseHelper,
        private readonly cacheHelper: DatabaseCacheHelper
    ) { }

    private mapper(row: any): Plan | null {
        if (!row) return null;

        return {
            plan_id: IdValueObject.create(row.plan_id) as IdValueObject,
            plan_name: row.plan_name,
            description: row.description,
            default_amount: Number(row.default_amount),
            plan_type_id: IdValueObject.create(row.plan_type_id) as IdValueObject,
            plan_duration: row.plan_duration,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async create(plan: Plan): Promise<Plan> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan (plan_name, description, default_amount, plan_type_id, plan_duration)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [plan.plan_name, plan.description, plan.default_amount, plan.plan_type_id.value, plan.plan_duration]
        );

        return this.mapper(result.rows[0])!;
    }

    async getPlanById(planId: IdValueObject): Promise<Plan | null> {
        const result = await this.databaseHelper.query("SELECT * FROM plan WHERE plan_id = $1", [planId.value]);

        return this.mapper(result.rows[0]);
    }
    async getAll(): Promise<Plan[]> {
        // Try cache first
        const cached = await this.cacheHelper.getCatalog();
        if (cached) {
            return cached
        }

        // Fallback to database
        const result = await this.databaseHelper.query("SELECT * FROM plan");
        const plans = result.rows.map((row) => this.mapper(row)!);

        // Cache the catalog
        if (plans.length > 0) {
            await this.cacheHelper.setCatalog(this.mapCatalogToCache(plans));
        }

        return plans;
    }

    async update(plan: Plan): Promise<Plan> {
        const result = await this.databaseHelper.query(
            `
            UPDATE plan
            SET plan_name = $1, description = $2, default_amount = $3, plan_type_id = $4
            WHERE plan_id = $5
            RETURNING *
            `,
            [plan.plan_name, plan.description, plan.default_amount, plan.plan_type_id.value, plan.plan_id.value]
        );

        return this.mapper(result.rows[0])!;
    }


    private mapCatalogToCache(plans: Plan[]): any {
        const catalog: any = {};
        for (const plan of plans) {
            catalog[plan.plan_name.toLowerCase().replace(" ", "_")] = {
                plan_id: plan.plan_id.value,
                plan_name: plan.plan_name,
                default_amount: plan.default_amount,
                plan_type_id: plan.plan_type_id.value,
                plan_duration: plan.plan_duration,
                is_active: true
            };
        }
        return catalog;
    }

    /**
     * Builds the base query for fetching plan details with joins
     * This is a private method used by both getPublicPlanList and getPublicPlanById
     */
    private buildPlanDetailsQuery(whereClause: string = '', orderByClause: string = '', limitClause: string = ''): string {
        return `
        SELECT 
            p.plan_id,
            p.plan_name,
            p.description as plan_description,
            p.default_amount,
            p.plan_duration,
            p.created_at,
            pt.plan_type_id,
            pt.type_name,
            pt.description as plan_type_description,
            pt.is_active as plan_type_is_active,
            put_admin.number_of_users as admin_user_limit,
            put_admin.extra_user_price as admin_extra_price,
            put_regular.number_of_users as regular_user_limit,
            put_regular.extra_user_price as regular_extra_price
        FROM plan p
        INNER JOIN plan_type pt ON p.plan_type_id = pt.plan_type_id
        LEFT JOIN plan_user_type put_admin ON pt.plan_type_id = put_admin.plan_type_id AND put_admin.admin = true
        LEFT JOIN plan_user_type put_regular ON pt.plan_type_id = put_regular.plan_type_id AND put_regular.admin = false
        ${whereClause}
        ${orderByClause}
        ${limitClause}
    `;
    }

    /**
     * Get a single plan with all its details including type and user limits
     */
    async getPublicPlanById(planId: IdValueObject): Promise<any | null> {
        const query = this.buildPlanDetailsQuery('WHERE p.plan_id = $1');
        const result = await this.databaseHelper.query(query, [planId.value]);

        return result.rows.length > 0 ? result.rows[0] : null;
    }

    /**
     * Get a list of plans with filtering, sorting, and pagination
     */
    async getPublicPlanList(params: PublicPlanQueryParams): Promise<any[]> {
        // Set defaults
        const limit = Math.min(params.limit || 20, 100);
        const offset = params.offset || 0;
        const active = params.active !== undefined ? params.active : true;
        const sort = params.sort || 'name';
        const order = params.order || 'asc';

        // Build WHERE conditions
        const conditions: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (active !== undefined) {
            conditions.push(`pt.is_active = $${paramIndex}`);
            values.push(active);
            paramIndex++;
        }

        if (params.planType) {
            conditions.push(`LOWER(pt.type_name) = LOWER($${paramIndex})`);
            values.push(params.planType);
            paramIndex++;
        }

        if (params.duration) {
            conditions.push(`p.plan_duration = $${paramIndex}`);
            values.push(params.duration);
            paramIndex++;
        }

        if (params.minAmount !== undefined) {
            conditions.push(`p.default_amount >= $${paramIndex}`);
            values.push(params.minAmount);
            paramIndex++;
        }

        if (params.maxAmount !== undefined) {
            conditions.push(`p.default_amount <= $${paramIndex}`);
            values.push(params.maxAmount);
            paramIndex++;
        }

        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

        // Map sort field
        const sortField = sort === 'price' ? 'p.default_amount' :
            sort === 'name' ? 'p.plan_name' :
                'p.created_at';

        const orderDirection = order.toLowerCase() === 'desc' ? 'DESC' : 'ASC';
        const orderByClause = `ORDER BY ${sortField} ${orderDirection}`;

        // Add limit and offset to values
        values.push(limit, offset);
        const limitClause = `LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;

        // Build and execute query
        const query = this.buildPlanDetailsQuery(whereClause, orderByClause, limitClause);
        const result = await this.databaseHelper.query(query, values);

        return result.rows;
    }
}
