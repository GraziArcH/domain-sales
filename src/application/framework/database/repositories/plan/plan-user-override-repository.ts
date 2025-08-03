import { DatabaseHelper } from "@/application/framework";
import {
    PlanUserOverride,
    IPlanUserOverrideRepository
} from "@/domain/plan/interfaces/database/plan-user-override-repository";
import { IdValueObject } from "@/domain/plan/value-objects";

export class PlanUserOverrideRepository implements IPlanUserOverrideRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) {}

    private mapper(row: any): PlanUserOverride | null {
        if (!row) return null;

        return {
            plan_user_override_id: IdValueObject.create(row.plan_user_override_id) as IdValueObject,
            company_plan_id: IdValueObject.create(row.company_plan_id) as IdValueObject,
            admin: row.admin,
            extra_user_price: row.extra_user_price,
            created_at: row.created_at,
            updated_at: row.updated_at
        };
    }

    async create(override: PlanUserOverride): Promise<PlanUserOverride> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan_user_override (company_plan_id, admin, extra_user_price, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING *
            `,
            [
                override.company_plan_id.value,
                override.admin,
                override.extra_user_price,
                override.created_at,
                override.updated_at
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async getById(overrideId: IdValueObject): Promise<PlanUserOverride | null> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM plan_user_override WHERE plan_user_override_id = $1",
            [overrideId.value]
        );

        return this.mapper(result.rows[0]);
    }

    async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<PlanUserOverride[]> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_user_override WHERE company_plan_id = $1", [
            companyPlanId.value
        ]);

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getByCompanyPlanIdAndAdmin(companyPlanId: IdValueObject, isAdmin: boolean): Promise<PlanUserOverride | null> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM plan_user_override WHERE company_plan_id = $1 AND admin = $2",
            [companyPlanId.value, isAdmin]
        );

        return this.mapper(result.rows[0]);
    }

    async update(override: PlanUserOverride): Promise<PlanUserOverride> {
        const result = await this.databaseHelper.query(
            `
            UPDATE plan_user_override
            SET company_plan_id = $1, admin = $2, extra_user_price = $3, updated_at = $4
            WHERE plan_user_override_id = $5
            RETURNING *
            `,
            [
                override.company_plan_id.value,
                override.admin,
                override.extra_user_price,
                override.updated_at,
                override.plan_user_override_id.value
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async delete(overrideId: IdValueObject): Promise<boolean> {
        const result = await this.databaseHelper.query(
            "DELETE FROM plan_user_override WHERE plan_user_override_id = $1",
            [overrideId.value]
        );

        return result.rowCount > 0;
    }
}
