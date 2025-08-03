import { PlanEntity } from "@/domain/plan/entities/plan/plan-entity";
import { IPlanRepository } from "@/domain/plan/interfaces/database";
import { IdValueObject } from "@/domain/plan/value-objects";

enum PlanDuration {
    MENSAL = "mensal",
    ANUAL = "anual",
    TRIMESTRAL = "trimestral",
    VITALICIO = "vitalicio"
}

class PlanRepositoryMock implements IPlanRepository {
	private plans: any[] = [];
	private planIdCounter = 1;

	async create(plan: any): Promise<any> {
		const newPlan = {
			...plan,
			plan_id: IdValueObject.create(this.planIdCounter++) as IdValueObject
		};
		this.plans.push(newPlan);
		return newPlan;
	}

	async getPlanById(planId: IdValueObject): Promise<any> {
		const plan = this.plans.find(p => p.plan_id.value === planId.value);
		return plan || null;
	}

	async getAll(): Promise<any[]> {
		return this.plans;
	}

	async update(plan: any): Promise<any> {
		const index = this.plans.findIndex(p => p.plan_id.value === plan.plan_id.value);
		if (index >= 0) {
			this.plans[index] = { ...plan };
			return this.plans[index];
		}
		return null;
	}

	async delete(planId: IdValueObject): Promise<boolean> {
		const index = this.plans.findIndex(p => p.plan_id.value === planId.value);
		if (index >= 0) {
			this.plans.splice(index, 1);
			return true;
		}
		return false;
	}
}

describe("PlanEntity", () => {
	let planRepository: PlanRepositoryMock;
	let planEntity: PlanEntity;

	beforeEach(() => {
		planRepository = new PlanRepositoryMock();
		planEntity = new PlanEntity(planRepository);
	});

	describe("create", () => {
		it("should create a new plan", async () => {
			const planData = {
				planName: "Test Plan",
				description: "Test Description",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: PlanDuration.MENSAL
			};

			const result = await planEntity.create(planData);

			expect(result).toBeDefined();
			expect(result.planName).toBe(planData.planName);
			expect(result.description).toBe(planData.description);
			expect(result.defaultAmount).toBe(planData.defaultAmount);
			expect(result.planTypeId.value).toBe(planData.planTypeId);
			expect(result.planId.value).toBe(1);
		});

		it("should throw an error if plan name is too short", async () => {
			const planData = {
				planName: "Te", // Too short
				description: "Test Description",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: PlanDuration.MENSAL
			};

			await expect(planEntity.create(planData)).rejects.toThrow("Nome do plano deve ter pelo menos 3 caracteres");
		});

		it("should throw an error if default amount is negative", async () => {
			const planData = {
				planName: "Test Plan",
				description: "Test Description",
				defaultAmount: -10, // Negative
				planTypeId: 1,
				planDuration: PlanDuration.MENSAL
			};

			await expect(planEntity.create(planData)).rejects.toThrow("Valor padrão do plano não pode ser negativo");
		});
	});

	describe("getById", () => {
		it("should get a plan by id", async () => {
			// Create a plan first
			const planData = {
				planName: "Test Plan",
				description: "Test Description",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: PlanDuration.MENSAL
			};
			const created = await planEntity.create(planData);

			// Get the plan by id
			const result = await planEntity.getById(created.planId.value);

			expect(result).toBeDefined();
			expect(result?.planName).toBe(planData.planName);
			expect(result?.planId.value).toBe(created.planId.value);
		});

		it("should return null for non-existent plan", async () => {
			const result = await planEntity.getById(999);
			expect(result).toBeNull();
		});
	});

	describe("getAll", () => {
		it("should get all plans", async () => {
			// Create some plans first
			await planEntity.create({
				planName: "Plan 1",
				description: "Description 1",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: "mensal"
			});

			await planEntity.create({
				planName: "Plan 2",
				description: "Description 2",
				defaultAmount: 200,
				planTypeId: 2,
				planDuration: "anual"
			});

			const results = await planEntity.getAll();

			expect(results).toHaveLength(2);
			expect(results[0].planName).toBe("Plan 1");
			expect(results[1].planName).toBe("Plan 2");
		});
	});

	describe("update", () => {
		it("should update an existing plan", async () => {
			// Create a plan first
			const created = await planEntity.create({
				planName: "Original Plan",
				description: "Original Description",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: "mensal"
			});

			// Update the plan
			const updated = await planEntity.update({
				planId: created.planId.value,
				planDuration: "anual",
				planName: "Updated Plan",
				description: "Updated Description",
				defaultAmount: 200,
				planTypeId: 1,
				createdAt: created.createdAt,
				updatedAt: new Date()
			});

			expect(updated).toBeDefined();
			expect(updated.planName).toBe("Updated Plan");
			expect(updated.description).toBe("Updated Description");
			expect(updated.defaultAmount).toBe(200);
			expect(updated.planId.value).toBe(created.planId.value);
		});

		it("should throw error when updating non-existent plan", async () => {
			await expect(planEntity.update({
				planId: 999,
				planName: "Non-existent Plan",
				description: "Non-existent Description",
				defaultAmount: 100,
				planTypeId: 1,
				planDuration: "anual",
				createdAt: new Date(),
				updatedAt: new Date()
			})).rejects.toThrow();
		});
	});
});
