import { DatabaseHelper, DatabaseCacheHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import { CompanyPlan, ICompanyPlanRepository } from "@/domain/plan/interfaces/database/company-plan-repository";

export class CompanyPlanRepository implements ICompanyPlanRepository {
    constructor(
        private readonly databaseHelper: DatabaseHelper,
        private readonly cacheHelper: DatabaseCacheHelper
    ) {}

    private mapper(row: any): CompanyPlan | null {
        if (!row) return null;

        return {
            company_plan_id: IdValueObject.create(row.company_plan_id) as IdValueObject,
            company_id: IdValueObject.create(row.company_id) as IdValueObject,
            plan_id: IdValueObject.create(row.plan_id) as IdValueObject,
            amount: Number(row.amount),
            start_date: new Date(row.start_date),
            end_date: new Date(row.end_date),
            status: row.status,
            additional_user_amount: Number(row.additional_user_amount),
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }

    async create(companyPlan: CompanyPlan): Promise<CompanyPlan> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO company_plan (
                company_id, plan_id, amount, 
                start_date, end_date, status, additional_user_amount,
                created_at, updated_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
            `,
            [
                companyPlan.company_id.value,
                companyPlan.plan_id.value,
                companyPlan.amount,
                companyPlan.start_date,
                companyPlan.end_date,
                companyPlan.status,
                companyPlan.additional_user_amount,
                companyPlan.created_at,
                companyPlan.updated_at
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async getById(companyPlanId: IdValueObject): Promise<CompanyPlan | null> {
        const result = await this.databaseHelper.query("SELECT * FROM company_plan WHERE company_plan_id = $1", [
            companyPlanId.value
        ]);

        return this.mapper(result.rows[0]);
    }

    async getActiveByCompanyId(companyId: IdValueObject): Promise<CompanyPlan | null> {
        try {
            // Try cache first
            const cached = await this.cacheHelper.getCompanyActivePlan(companyId.value.toString());
            if (cached) {
                return this.mapFromCache(cached);
            }

            // Fallback to database with timeout handling
            const result = await this.databaseHelper.query(
                "SELECT * FROM company_plan WHERE company_id = $1 AND status = 'active' LIMIT 1",
                [companyId.value]
            );

            const companyPlan = this.mapper(result.rows[0]);

            // Cache the result if found
            if (companyPlan) {
                await this.cacheHelper.setCompanyActivePlan(companyId.value.toString(), this.mapToCache(companyPlan));
            }

            return companyPlan;
        } catch (error) {
            console.error(`Error fetching active plan for company ${companyId.value}:`, error);
            // Return null instead of throwing to allow the application to handle gracefully
            return null;
        }
    }

    async getHistoryByCompanyId(companyId: IdValueObject): Promise<CompanyPlan[]> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM company_plan WHERE company_id = $1 ORDER BY created_at DESC",
            [companyId.value]
        );

        return result.rows.map((row) => this.mapper(row)!);
    }

    async update(companyPlan: CompanyPlan): Promise<CompanyPlan> {
        const result = await this.databaseHelper.query(
            `
            UPDATE company_plan
            SET company_id = $1, plan_id = $2, 
                amount = $3, start_date = $4, end_date = $5, 
                status = $6, additional_user_amount = $7, updated_at = $8
            WHERE company_plan_id = $9
            RETURNING *
            `,
            [
                companyPlan.company_id.value,
                companyPlan.plan_id.value,
                companyPlan.amount,
                companyPlan.start_date,
                companyPlan.end_date,
                companyPlan.status,
                companyPlan.additional_user_amount,
                companyPlan.updated_at,
                companyPlan.company_plan_id.value
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async updateStatus(companyPlanId: IdValueObject, status: string): Promise<CompanyPlan> {
        const result = await this.databaseHelper.query(
            `
            UPDATE company_plan
            SET status = $1, updated_at = NOW()
            WHERE company_plan_id = $2
            RETURNING *
            `,
            [status, companyPlanId.value]
        );

        return this.mapper(result.rows[0])!;
    }

    private mapFromCache(cached: any): CompanyPlan {
        return {
            company_plan_id: IdValueObject.create(cached.company_plan_id) as IdValueObject,
            company_id: IdValueObject.create(cached.company_id) as IdValueObject,
            plan_id: IdValueObject.create(cached.plan_id) as IdValueObject,
            amount: cached.amount,
            start_date: new Date(cached.start_date),
            end_date: new Date(cached.end_date),
            status: cached.status,
            additional_user_amount: cached.additional_user_amount,
            created_at: new Date(cached.created_at),
            updated_at: new Date(cached.updated_at)
        };
    }

    private mapToCache(companyPlan: CompanyPlan): any {
        return {
            company_plan_id: companyPlan.company_plan_id.value,
            company_id: companyPlan.company_id.value,
            plan_id: companyPlan.plan_id.value,
            amount: companyPlan.amount,
            start_date: companyPlan.start_date.toISOString(),
            end_date: companyPlan.end_date.toISOString(),
            status: companyPlan.status,
            additional_user_amount: companyPlan.additional_user_amount,
            created_at: companyPlan.created_at.toISOString(),
            updated_at: companyPlan.updated_at.toISOString()
        };
    }
}
