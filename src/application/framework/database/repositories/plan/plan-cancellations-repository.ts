import { DatabaseHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import {
    PlanCancellation,
    IPlanCancellationsRepository
} from "@/domain/plan/interfaces/database/plan-cancellations-repository";

export class PlanCancellationsRepository implements IPlanCancellationsRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) { }

    private mapper(row: any): PlanCancellation | null {
        if (!row) return null;

        return {
            plan_cancellation_id: IdValueObject.create(row.plan_cancellation_id) as IdValueObject,
            company_plan_id: IdValueObject.create(row.company_plan_id) as IdValueObject,
            cancellation_reason: row.cancellation_reason,
            cancelled_by_user_id: IdValueObject.create(row.cancelled_by_user_id) as IdValueObject,
            cancelled_at: row.cancelled_at ? new Date(row.cancelled_at) : null,
            created_at: new Date(row.created_at),
            updated_at: new Date(row.updated_at)
        };
    }

    async create(cancellation: PlanCancellation): Promise<PlanCancellation> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan_cancellations (
                company_plan_id, cancellation_reason, 
                cancelled_by_user_id, cancelled_at
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                cancellation.company_plan_id.value,
                cancellation.cancellation_reason,
                cancellation.cancelled_by_user_id.value,
                cancellation.cancelled_at
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async getById(cancellationId: IdValueObject): Promise<PlanCancellation | null> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_cancellations WHERE plan_cancellation_id = $1", [
            cancellationId.value
        ]);

        return this.mapper(result.rows[0]);
    }

    async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<PlanCancellation[]> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM plan_cancellations WHERE company_plan_id = $1 ORDER BY created_at DESC",
            [companyPlanId.value]
        );

        return result.rows.map((row) => this.mapper(row)!);
    }
}
