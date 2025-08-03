import { PlanReportEntity } from "@/domain/plan/entities/plan-reports/plan-reports-entity";
import { IPlanReportsRepository } from "@/domain/plan/interfaces/database";
import { IdValueObject } from "@/domain/plan/value-objects";

class PlanReportsRepositoryMock implements IPlanReportsRepository {
	private planReports: any[] = [];
	private planReportIdCounter = 1;

	async create(planReport: any): Promise<any> {
		const newPlanReport = {
			...planReport,
			plan_report_id: IdValueObject.create(this.planReportIdCounter++) as IdValueObject
		};
		this.planReports.push(newPlanReport);
		return newPlanReport;
	}

	async getByPlanTypeId(planTypeId: IdValueObject): Promise<any[]> {
		return this.planReports.filter(report => report.plan_type_id.value === planTypeId.value);
	}

	async getByTemplateId(templateId: IdValueObject): Promise<any[]> {
		return this.planReports.filter(report => report.template_id.value === templateId.value);
	}

	async update(planReport: any): Promise<any> {
		const index = this.planReports.findIndex(report =>
			report.plan_report_id.value === planReport.plan_report_id.value);

		if (index >= 0) {
			this.planReports[index] = { ...planReport };
			return this.planReports[index];
		}
		throw new Error("Plan report not found");
	}

	async delete(planReportId: IdValueObject): Promise<boolean> {
		const index = this.planReports.findIndex(report =>
			report.plan_report_id.value === planReportId.value);

		if (index >= 0) {
			this.planReports.splice(index, 1);
			return true;
		}
		return false;
	}
}

describe("PlanReportEntity", () => {
	let repository: PlanReportsRepositoryMock;
	let entity: PlanReportEntity;

	beforeEach(() => {
		repository = new PlanReportsRepositoryMock();
		entity = new PlanReportEntity(repository);
	});

	describe("create", () => {
		it("should create a new plan report", async () => {
			const reportData = {
				planTypeId: 1,
				templateId: 100
			};

			const result = await entity.create(reportData);

			expect(result).toBeDefined();
			expect(result.planTypeId.value).toBe(reportData.planTypeId);
			expect(result.templateId.value).toBe(reportData.templateId);
			expect(result.planReportId.value).toBe(1);
		});
	});

	describe("getByPlanTypeId", () => {
		it("should get reports by plan type id", async () => {
			// Create some plan reports first
			await entity.create({ planTypeId: 1, templateId: 100 });
			await entity.create({ planTypeId: 1, templateId: 101 });
			await entity.create({ planTypeId: 2, templateId: 102 });

			const results = await entity.getByPlanTypeId(1);

			expect(results).toHaveLength(2);
			expect(results[0].planTypeId.value).toBe(1);
			expect(results[1].planTypeId.value).toBe(1);
			expect(results[0].templateId.value).toBe(100);
			expect(results[1].templateId.value).toBe(101);
		});

		it("should return empty array when no reports found", async () => {
			const results = await entity.getByPlanTypeId(999);
			expect(results).toEqual([]);
		});

		it("should throw error for invalid plan type id", async () => {
			await expect(entity.getByPlanTypeId("")).rejects.toThrow();
		});
	});

	describe("getByTemplateId", () => {
		it("should get reports by template id", async () => {
			// Create some plan reports first
			await entity.create({ planTypeId: 1, templateId: 100 });
			await entity.create({ planTypeId: 2, templateId: 100 });
			await entity.create({ planTypeId: 3, templateId: 102 });

			const results = await entity.getByTemplateId(100);

			expect(results).toHaveLength(2);
			expect(results[0].templateId.value).toBe(100);
			expect(results[1].templateId.value).toBe(100);
			expect(results[0].planTypeId.value).toBe(1);
			expect(results[1].planTypeId.value).toBe(2);
		});

		it("should throw error for invalid template id", async () => {
			await expect(entity.getByTemplateId("")).rejects.toThrow();
		});
	});

	describe("update", () => {
		it("should update an existing plan report", async () => {
			// Create a report first
			const created = await entity.create({
				planTypeId: 1,
				templateId: 100
			});

			// Update the report
			const updated = await entity.update({
				planReportId: created.planReportId.value,
				planTypeId: 2,
				templateId: 200
			});

			expect(updated).toBeDefined();
			expect(updated.planReportId.value).toBe(created.planReportId.value);
			expect(updated.planTypeId.value).toBe(2);
			expect(updated.templateId.value).toBe(200);
		});

		it("should throw error when updating non-existent report", async () => {
			await expect(entity.update({
				planReportId: 999,
				planTypeId: 1,
				templateId: 100
			})).rejects.toThrow();
		});
	});

	describe("delete", () => {
		it("should delete an existing plan report", async () => {
			// Create a report first
			const created = await entity.create({
				planTypeId: 1,
				templateId: 100
			});

			// Delete the report
			const result = await entity.delete(created.planReportId.value);
			expect(result).toBe(true);

			// Try to get it
			const reports = await entity.getByPlanTypeId(1);
			expect(reports).toHaveLength(0);
		});

		it("should return false when deleting non-existent report", async () => {
			const result = await entity.delete(999);
			expect(result).toBe(false);
		});

		it("should throw error for invalid report id", async () => {
			await expect(entity.delete("")).rejects.toThrow();
		});
	});
});
