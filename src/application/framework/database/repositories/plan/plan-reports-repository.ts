import { DatabaseHelper } from "@/application/framework";
import { IdValueObject } from "@/domain/plan/value-objects";
import { PlanReport, IPlanReportsRepository } from "@/domain/plan/interfaces/database/plan-reports-repository";

export class PlanReportsRepository implements IPlanReportsRepository {
    constructor(private readonly databaseHelper: DatabaseHelper) { }

    private mapper(row: any): PlanReport | null {
        if (!row) return null;

        return {
            plan_report_id: IdValueObject.create(row.plan_report_id) as IdValueObject,
            plan_type_id: IdValueObject.create(row.plan_type_id) as IdValueObject,
            template_id: IdValueObject.create(row.template_id) as IdValueObject
        };
    }

    async create(planReport: PlanReport): Promise<PlanReport> {
        const result = await this.databaseHelper.query(
            `
            INSERT INTO plan_reports (plan_type_id, template_id)
            VALUES ($1, $2)
            RETURNING *
            `,
            [planReport.plan_type_id.value, planReport.template_id.value]
        );

        return this.mapper(result.rows[0])!;
    }

    async getByPlanTypeId(planTypeId: IdValueObject): Promise<PlanReport[]> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_reports WHERE plan_type_id = $1", [
            planTypeId.value
        ]);

        return result.rows.map((row) => this.mapper(row)!);
    }

    async getByTemplateId(templateId: IdValueObject): Promise<PlanReport[]> {
        const result = await this.databaseHelper.query("SELECT * FROM plan_reports WHERE template_id = $1", [
            templateId.value
        ]);

        return result.rows.map((row) => this.mapper(row)!);
    }

    async update(planReport: PlanReport): Promise<PlanReport> {
        const result = await this.databaseHelper.query(
            `
            UPDATE plan_reports
            SET plan_type_id = $1, template_id = $2
            WHERE plan_report_id = $3
            RETURNING *
            `,
            [
                planReport.plan_type_id.value,
                planReport.template_id.value,
                planReport.plan_report_id.value
            ]
        );

        return this.mapper(result.rows[0])!;
    }

    async delete(planReportId: IdValueObject): Promise<boolean> {
        const result = await this.databaseHelper.query(
            "DELETE FROM plan_reports WHERE plan_report_id = $1 RETURNING *",
            [planReportId.value]
        );

        return result.rowCount > 0;
    }
}
