import { PlanUserTypeEntity } from "@/domain/plan/entities/plan-user-type/plan-user-type-entity";
import { IPlanUserTypeRepository } from "@/domain/plan/interfaces/database";
import { IdValueObject } from "@/domain/plan/value-objects";

class PlanUserTypeRepositoryMock implements IPlanUserTypeRepository {
	private planUserTypes: any[] = [];
	private planUserTypeIdCounter = 1;

	async create(planUserType: any): Promise<any> {
		const newPlanUserType = {
			...planUserType,
			plan_user_type_id: IdValueObject.create(this.planUserTypeIdCounter++) as IdValueObject
		};
		this.planUserTypes.push(newPlanUserType);
		return newPlanUserType;
	}

	async getById(planUserTypeId: IdValueObject): Promise<any | null> {
		const planUserType = this.planUserTypes.find(p =>
			p.plan_user_type_id.value === planUserTypeId.value);
		return planUserType || null;
	}

	async getByPlanTypeId(planTypeId: IdValueObject): Promise<any[]> {
		return this.planUserTypes.filter(p => p.plan_type_id.value === planTypeId.value);
	}

	async getByPlanTypeIdAndAdmin(planTypeId: IdValueObject, isAdmin: boolean): Promise<any | null> {
		return this.planUserTypes.find(p =>
			p.plan_type_id.value === planTypeId.value &&
			p.admin === isAdmin) || null;
	}

	async update(planUserType: any): Promise<any> {
		const index = this.planUserTypes.findIndex(p =>
			p.plan_user_type_id.value === planUserType.plan_user_type_id.value);

		if (index >= 0) {
			this.planUserTypes[index] = { ...planUserType };
			return this.planUserTypes[index];
		}
		throw new Error("Plan user type not found");
	}

	async delete(planUserTypeId: IdValueObject): Promise<boolean> {
		const index = this.planUserTypes.findIndex(p =>
			p.plan_user_type_id.value === planUserTypeId.value);

		if (index >= 0) {
			this.planUserTypes.splice(index, 1);
			return true;
		}
		return false;
	}
}

describe("PlanUserTypeEntity", () => {
	let repository: PlanUserTypeRepositoryMock;
	let entity: PlanUserTypeEntity;

	beforeEach(() => {
		repository = new PlanUserTypeRepositoryMock();
		entity = new PlanUserTypeEntity(repository);
	});

	describe("create", () => {
		it("should create a new plan user type", async () => {
			const planUserTypeData = {
				planTypeId: 1,
				admin: true,
				numberOfUsers: 5,
				extraUserPrice: 10
			};

			const result = await entity.create(planUserTypeData);

			expect(result).toBeDefined();
			expect(result.planTypeId.value).toBe(planUserTypeData.planTypeId);
			expect(result.admin).toBe(planUserTypeData.admin);
			expect(result.numberOfUsers).toBe(planUserTypeData.numberOfUsers);
			expect(result.extraUserPrice).toBe(planUserTypeData.extraUserPrice);
			expect(result.planUserTypeId.value).toBe(1);
		});
	});

	describe("getById", () => {
		it("should get a plan user type by id", async () => {
			// Create a plan user type first
			const created = await entity.create({
				planTypeId: 1,
				admin: true,
				numberOfUsers: 5,
				extraUserPrice: 10
			});

			// Get the plan user type by id
			const result = await entity.getById(created.planUserTypeId.value);

			expect(result).toBeDefined();
			expect(result?.planTypeId.value).toBe(1);
			expect(result?.admin).toBe(true);
			expect(result?.numberOfUsers).toBe(5);
			expect(result?.extraUserPrice).toBe(10);
		});

		it("should return null for non-existent plan user type", async () => {
			const result = await entity.getById(999);
			expect(result).toBeNull();
		});

		it("should throw error for invalid plan user type id", async () => {
			await expect(entity.getById("")).rejects.toThrow();
		});
	});

	describe("getByPlanTypeId", () => {
		it("should get plan user types by plan type id", async () => {
			// Create some plan user types first
			await entity.create({
				planTypeId: 1,
				admin: false,
				numberOfUsers: 5,
				extraUserPrice: 10
			});

			await entity.create({
				planTypeId: 1,
				admin: true,
				numberOfUsers: 10,
				extraUserPrice: 15
			});

			await entity.create({
				planTypeId: 2,
				admin: false,
				numberOfUsers: 15,
				extraUserPrice: 20
			});

			const results = await entity.getByPlanTypeId(1);

			expect(results).toHaveLength(2);
			expect(results[0].planTypeId.value).toBe(1);
			expect(results[1].planTypeId.value).toBe(1);
			expect(results[0].admin).toBe(false);
			expect(results[1].admin).toBe(true);
		});

		it("should throw error for invalid plan type id", async () => {
			await expect(entity.getByPlanTypeId("")).rejects.toThrow();
		});
	});

	describe("getByPlanTypeIdAndAdmin", () => {
		it("should get plan user type by plan type id and admin status", async () => {
			// Create some plan user types first
			await entity.create({
				planTypeId: 1,
				admin: false,
				numberOfUsers: 5,
				extraUserPrice: 10
			});

			await entity.create({
				planTypeId: 1,
				admin: true,
				numberOfUsers: 10,
				extraUserPrice: 15
			});

			await entity.create({
				planTypeId: 2,
				admin: false,
				numberOfUsers: 15,
				extraUserPrice: 20
			});

			// Get by planTypeId=1 and admin=true
			const result = await entity.getByPlanTypeIdAndAdmin(1, true);

			expect(result).toBeDefined();
			expect(result?.planTypeId.value).toBe(1);
			expect(result?.admin).toBe(true);
			expect(result?.numberOfUsers).toBe(10);
			expect(result?.extraUserPrice).toBe(15);

			// Get by planTypeId=1 and admin=false
			const resultNonAdmin = await entity.getByPlanTypeIdAndAdmin(1, false);

			expect(resultNonAdmin).toBeDefined();
			expect(resultNonAdmin?.planTypeId.value).toBe(1);
			expect(resultNonAdmin?.admin).toBe(false);
			expect(resultNonAdmin?.numberOfUsers).toBe(5);
		});

		it("should return null when no matching plan user type is found", async () => {
			const result = await entity.getByPlanTypeIdAndAdmin(999, true);
			expect(result).toBeNull();
		});

		it("should throw error for invalid plan type id", async () => {
			await expect(entity.getByPlanTypeIdAndAdmin("", true)).rejects.toThrow();
		});
	});

	describe("update", () => {
		it("should update an existing plan user type", async () => {
			// Create a plan user type first
			const created = await entity.create({
				planTypeId: 1,
				admin: false,
				numberOfUsers: 5,
				extraUserPrice: 10
			});

			// Update the plan user type
			const updated = await entity.update({
				planUserTypeId: created.planUserTypeId.value,
				planTypeId: 1,
				admin: true,
				numberOfUsers: 20,
				extraUserPrice: 25
			});

			expect(updated).toBeDefined();
			expect(updated.planUserTypeId.value).toBe(created.planUserTypeId.value);
			expect(updated.planTypeId.value).toBe(1);
			expect(updated.admin).toBe(true);
			expect(updated.numberOfUsers).toBe(20);
			expect(updated.extraUserPrice).toBe(25);
		});

		it("should throw error when updating non-existent plan user type", async () => {
			await expect(entity.update({
				planUserTypeId: 999,
				planTypeId: 1,
				admin: false,
				numberOfUsers: 20,
				extraUserPrice: 25
			})).rejects.toThrow();
		});
	});

	describe("delete", () => {
		it("should delete an existing plan user type", async () => {
			// Create a plan user type first
			const created = await entity.create({
				planTypeId: 1,
				admin: false,
				numberOfUsers: 5,
				extraUserPrice: 10
			});

			// Delete the plan user type
			const result = await entity.delete(created.planUserTypeId.value);
			expect(result).toBe(true);

			// Try to get it
			const planUserType = await entity.getById(created.planUserTypeId.value);
			expect(planUserType).toBeNull();
		});

		it("should return false when deleting non-existent plan user type", async () => {
			const result = await entity.delete(999);
			expect(result).toBe(false);
		});

		it("should throw error for invalid plan user type id", async () => {
			await expect(entity.delete("")).rejects.toThrow();
		});
	});
});
