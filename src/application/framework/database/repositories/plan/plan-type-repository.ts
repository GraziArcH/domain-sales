import { DatabaseHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import { PlanType, IPlanTypeRepository } from "@/domain/plan/interfaces/database/plan-type-repository";

export class PlanTypeRepository implements IPlanTypeRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) { }

    private mapper(row: any): PlanType | null {
        if (!row) return null;

        return {
            plan_type_id: IdValueObject.create(row.plan_type_id) as IdValueObject,
            type_name: row.type_name,
            description: row.description,
            is_active: row.is_active !== undefined ? row.is_active : true // Default to true if not provided
        };
    }

    async create(planType: PlanType): Promise<PlanType> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan_type (type_name, description, is_active)
            VALUES ($1, $2, $3)
            RETURNING *
            `,
            [planType.type_name, planType.description, planType.is_active]
        );

        return this.mapper(result.rows[0])!;
    }

    async getById(planTypeId: IdValueObject): Promise<PlanType | null> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_type WHERE plan_type_id = $1", [
            planTypeId.value
        ]);

        return this.mapper(result.rows[0]);
    }

    async getAll(): Promise<PlanType[]> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_type");

        return result.rows.map((row) => this.mapper(row)!);
    }

    async update(planType: PlanType): Promise<PlanType> {
        const result = await this.databaseHelper.query(
            `
            UPDATE plan_type
            SET type_name = $1, description = $2, is_active = $3
            WHERE plan_type_id = $4
            RETURNING *
            `,
            [planType.type_name, planType.description, planType.is_active, planType.plan_type_id.value]
        );

        return this.mapper(result.rows[0])!;
    }

    async delete(planTypeId: IdValueObject): Promise<boolean> {
        const result = await this.databaseHelper.query(
            "DELETE FROM plan_type WHERE plan_type_id = $1 RETURNING *",
            [planTypeId.value]
        );

        return result.rowCount > 0;
    }
}
