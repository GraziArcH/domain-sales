import { DatabaseHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import {
    CompanyPlanHistory,
    ICompanyPlanHistoryRepository
} from "@/domain/plan/interfaces/database/company-plan-history-repository";

export class CompanyPlanHistoryRepository implements ICompanyPlanHistoryRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) {}

    private mapper(row: any): CompanyPlanHistory | null {
        if (!row) return null;

        return {
            history_id: IdValueObject.create(row.history_id) as IdValueObject,
            company_plan_id: IdValueObject.create(row.company_plan_id) as IdValueObject,
            previous_plan_id: row.previous_plan_id
                ? (IdValueObject.create(row.previous_plan_id) as IdValueObject)
                : null,
            new_plan_id: IdValueObject.create(row.new_plan_id) as IdValueObject,
            change_type: row.change_type,
            reason: row.reason,
            change_at: new Date(row.change_at),
            changed_by_user_id: IdValueObject.create(row.changed_by_user_id) as IdValueObject,
            created_at: new Date(row.created_at)
        };
    }

    async create(history: CompanyPlanHistory): Promise<CompanyPlanHistory> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO company_plan_history (
                company_plan_id, previous_plan_id, new_plan_id, 
                change_type, reason, change_at, changed_by_user_id, created_at
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
            `,
            [
                history.company_plan_id.value,
                history.previous_plan_id?.value || null,
                history.new_plan_id.value,
                history.change_type,
                history.reason,
                history.change_at,
                history.changed_by_user_id.value,
                history.created_at
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<CompanyPlanHistory[]> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM company_plan_history WHERE company_plan_id = $1 ORDER BY change_at DESC",
            [companyPlanId.value]
        );

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getRecentByCompanyPlanId(companyPlanId: IdValueObject, limit = 10): Promise<CompanyPlanHistory[]> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM company_plan_history WHERE company_plan_id = $1 ORDER BY change_at DESC LIMIT $2",
            [companyPlanId.value, limit]
        );

        return result.rows.map((row) => this.mapper(row)!);
    }
}
