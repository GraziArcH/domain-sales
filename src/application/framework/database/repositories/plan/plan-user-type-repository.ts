import { DatabaseHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import { PlanUserType, IPlanUserTypeRepository } from "@/domain/plan/interfaces/database/plan-user-type-repository";

export class PlanUserTypeRepository implements IPlanUserTypeRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) {}

    async getByPlanTypeIdAndAdmin(planTypeId: IdValueObject, isAdmin: boolean): Promise<PlanUserType | null> {
        console.log(`Searching for plan user type with planTypeId: ${planTypeId.value}, isAdmin: ${isAdmin}`);

        try {
            const result = await this.databaseHelper.query(
                "SELECT * FROM plan_user_type WHERE plan_type_id = $1 AND admin = $2",
                [planTypeId.value, isAdmin]
            );

            console.log(`Query result: ${result.rows.length} rows found`);

            if (result.rows.length > 0) {
                console.log(`Row data: ${JSON.stringify(result.rows[0])}`);
                return this.mapper(result.rows[0]);
            }
            return null;
        } catch (error) {
            console.error(`Error in getByPlanTypeIdAndAdmin: ${error}`);
            throw error;
        }
    }

    private mapper(row: any): PlanUserType | null {
        if (!row) return null;

        return {
            plan_user_type_id: IdValueObject.create(row.plan_user_type_id) as IdValueObject,
            plan_type_id: IdValueObject.create(row.plan_type_id) as IdValueObject,
            admin: Boolean(row.admin),
            number_of_users: Number(row.number_of_users),
            extra_user_price: Number(row.extra_user_price)
        };
    }

    async create(planUserType: PlanUserType): Promise<PlanUserType> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan_user_type (
                plan_type_id, admin, number_of_users, 
                extra_user_price
            )
            VALUES ($1, $2, $3, $4)
            RETURNING *
            `,
            [
                planUserType.plan_type_id.value,
                planUserType.admin,
                planUserType.number_of_users,
                planUserType.extra_user_price
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async getById(planUserTypeId: IdValueObject): Promise<PlanUserType | null> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_user_type WHERE plan_user_type_id = $1", [
            planUserTypeId.value
        ]);

        return this.mapper(result.rows[0]);
    }

    async getByPlanTypeId(planTypeId: IdValueObject): Promise<PlanUserType[]> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_user_type WHERE plan_type_id = $1", [
            planTypeId.value
        ]);

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getByPlanTypeAndUserId(planTypeId: IdValueObject, admin: boolean): Promise<PlanUserType[]> {
        const result = await this.databaseHelper.query(
            "SELECT * FROM plan_user_type WHERE plan_type_id = $1 AND admin = $2",
            [planTypeId.value, admin]
        );

        return result.rows.map((row) => this.mapper(row)!);
    }

    async update(planUserType: PlanUserType): Promise<PlanUserType> {
        const result = await this.databaseHelper.query(
            `
            UPDATE plan_user_type
            SET plan_type_id = $1, admin = $2, number_of_users = $3,
                extra_user_price = $4
            WHERE plan_user_type_id = $5
            RETURNING *
            `,
            [
                planUserType.plan_type_id.value,
                planUserType.admin,
                planUserType.number_of_users,
                planUserType.extra_user_price,
                planUserType.plan_user_type_id.value
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async delete(planUserTypeId: IdValueObject): Promise<boolean> {
        const result = await this.databaseHelper.query(
            "DELETE FROM plan_user_type WHERE plan_user_type_id = $1 RETURNING *",
            [planUserTypeId.value]
        );

        return result.rowCount > 0;
    }
}
