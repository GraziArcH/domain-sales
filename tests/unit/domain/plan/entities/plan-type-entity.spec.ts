import { PlanTypeEntity } from "@/domain/plan/entities/plan-type/plan-type-entity";
import { IPlanTypeRepository } from "@/domain/plan/interfaces/database";
import { IdValueObject } from "@/domain/plan/value-objects";

class PlanTypeRepositoryMock implements IPlanTypeRepository {
	private planTypes: any[] = [];
	private planTypeIdCounter = 1;

	async create(planType: any): Promise<any> {
		const newPlanType = {
			...planType,
			plan_type_id: IdValueObject.create(this.planTypeIdCounter++) as IdValueObject,
			// Ensure is_active field is present with default value if not provided
			is_active: planType.is_active !== undefined ? planType.is_active : true
		};
		this.planTypes.push(newPlanType);
		return newPlanType;
	}

	async getById(planTypeId: IdValueObject): Promise<any | null> {
		const planType = this.planTypes.find(p => p.plan_type_id.value === planTypeId.value);
		return planType || null;
	}

	async getAll(): Promise<any[]> {
		return this.planTypes;
	}

	async update(planType: any): Promise<any> {
		const index = this.planTypes.findIndex(p => p.plan_type_id.value === planType.plan_type_id.value);
		if (index >= 0) {
			this.planTypes[index] = { ...planType };
			return this.planTypes[index];
		}
		throw new Error("Plan type not found");
	}

	async delete(planTypeId: IdValueObject): Promise<boolean> {
		const index = this.planTypes.findIndex(p => p.plan_type_id.value === planTypeId.value);
		if (index >= 0) {
			this.planTypes.splice(index, 1);
			return true;
		}
		return false;
	}
}

describe("PlanTypeEntity", () => {
	let repository: PlanTypeRepositoryMock;
	let entity: PlanTypeEntity;

	beforeEach(() => {
		repository = new PlanTypeRepositoryMock();
		entity = new PlanTypeEntity(repository);
	});

	describe("create", () => {
		it("should create a new plan type", async () => {
			const planTypeData = {
				typeName: "Test Type",
				description: "Test Description",
				isActive: true
			};

			const result = await entity.create(planTypeData);

			expect(result).toBeDefined();
			expect(result.typeName).toBe(planTypeData.typeName);
			expect(result.description).toBe(planTypeData.description);
			expect(result.isActive).toBe(planTypeData.isActive);
			expect(result.planTypeId.value).toBe(1);
		});

		it("should create an inactive plan type", async () => {
			const planTypeData = {
				typeName: "Inactive Type",
				description: "Inactive Description",
				isActive: false
			};

			const result = await entity.create(planTypeData);

			expect(result).toBeDefined();
			expect(result.isActive).toBe(false);
		});
	});

	describe("getById", () => {
		it("should get a plan type by id", async () => {
			// Create a plan type first
			const created = await entity.create({
				typeName: "Test Type",
				description: "Test Description",
				isActive: true
			});

			// Get the plan type by id
			const result = await entity.getById(created.planTypeId.value);

			expect(result).toBeDefined();
			expect(result?.typeName).toBe("Test Type");
			expect(result?.description).toBe("Test Description");
			expect(result?.isActive).toBe(true);
			expect(result?.planTypeId.value).toBe(created.planTypeId.value);
		});

		it("should return null for non-existent plan type", async () => {
			const result = await entity.getById(999);
			expect(result).toBeNull();
		});

		it("should throw error for invalid plan type id", async () => {
			await expect(entity.getById("")).rejects.toThrow();
		});
	});

	describe("getAll", () => {
		it("should get all plan types", async () => {
			// Create some plan types first
			await entity.create({
				typeName: "Type 1",
				description: "Description 1",
				isActive: true
			});

			await entity.create({
				typeName: "Type 2",
				description: "Description 2",
				isActive: false
			});

			const results = await entity.getAll();

			expect(results).toHaveLength(2);
			expect(results[0].typeName).toBe("Type 1");
			expect(results[1].typeName).toBe("Type 2");
			expect(results[0].isActive).toBe(true);
			expect(results[1].isActive).toBe(false);
		});

		it("should return empty array when no plan types exist", async () => {
			const results = await entity.getAll();
			expect(results).toEqual([]);
		});
	});

	describe("update", () => {
		it("should update an existing plan type", async () => {
			// Create a plan type first
			const created = await entity.create({
				typeName: "Original Type",
				description: "Original Description",
				isActive: true
			});

			// Update the plan type
			const updated = await entity.update({
				planTypeId: created.planTypeId.value,
				typeName: "Updated Type",
				description: "Updated Description",
				isActive: true
			});

			expect(updated).toBeDefined();
			expect(updated.typeName).toBe("Updated Type");
			expect(updated.description).toBe("Updated Description");
			expect(updated.isActive).toBe(true);
			expect(updated.planTypeId.value).toBe(created.planTypeId.value);
		});

		it("should update isActive status", async () => {
			// Create an active plan type
			const created = await entity.create({
				typeName: "Active Type",
				description: "Active Description",
				isActive: true
			});

			// Update to inactive
			const updated = await entity.update({
				planTypeId: created.planTypeId.value,
				typeName: created.typeName,
				description: created.description,
				isActive: false
			});

			expect(updated.isActive).toBe(false);
		});

		it("should throw error when updating non-existent plan type", async () => {
			await expect(entity.update({
				planTypeId: 999,
				typeName: "Non-existent Type",
				description: "Non-existent Description",
				isActive: true
			})).rejects.toThrow();
		});
	});
});
