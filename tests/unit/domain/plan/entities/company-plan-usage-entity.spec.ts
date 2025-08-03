import { CompanyPlanUsageEntity } from "@/domain/plan/entities/company-plan-usage/company-plan-usage-entity";
import { ICompanyPlanUsageRepository } from "@/domain/plan/interfaces/database";
import { IdValueObject } from "@/domain/plan/value-objects";

class CompanyPlanUsageRepositoryMock implements ICompanyPlanUsageRepository {
	private usages: any[] = [];
	private usageIdCounter = 1;

	async create(usage: any): Promise<any> {
		const newUsage = {
			...usage,
			usage_id: IdValueObject.create(this.usageIdCounter++) as IdValueObject
		};
		this.usages.push(newUsage);
		return newUsage;
	}

	async bulkCreate(usages: any[]): Promise<any[]> {
		const newUsages = usages.map(usage => ({
			...usage,
			usage_id: IdValueObject.create(this.usageIdCounter++) as IdValueObject
		}));

		this.usages.push(...newUsages);
		return newUsages;
	}

	async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<any[]> {
		return this.usages.filter(u => u.company_plan_id.value === companyPlanId.value);
	}

	async getUsageMetrics(companyId: IdValueObject): Promise<any> {
		// Mock implementation for metrics
		return {
			totalUsers: this.usages.length,
			activeUsers: 5,
			limitedUsers: 2,
			companyId: companyId.value
		};
	}

	async countUsersByScope(companyPlanId: IdValueObject, isAdmin: boolean): Promise<number> {
		return this.usages.filter(u =>
			u.company_plan_id.value === companyPlanId.value &&
            u.admin === isAdmin
		).length;
	}

	async validateUserLimit(companyPlanId: IdValueObject, isAdmin: boolean): Promise<boolean> {
		// For testing, always allow admin users but limit to 5 regular users
		if (isAdmin) return true;

		const count = await this.countUsersByScope(companyPlanId, false);
		return count < 5;
	}

	async syncWithUserDatabase(companyId: IdValueObject, companyPlanId: IdValueObject): Promise<any[]> {
		// Mock method - return existing usages for the company plan
		return this.usages.filter(u => u.company_plan_id.value === companyPlanId.value);
	}

	async updateUserScope(usageId: IdValueObject, isAdmin: boolean): Promise<any | null> {
		const usage = this.usages.find(u => u.usage_id.value === usageId.value);
		if (!usage) return null;

		usage.admin = isAdmin;
		usage.updated_at = new Date();
		return usage;
	}

	async canChangeUserScope(
		companyPlanId: IdValueObject,
		currentIsAdmin: boolean,
		newIsAdmin: boolean
	): Promise<boolean> {
		if (newIsAdmin) {
			// Check if we can add another admin
			return true; // For testing, always allow adding admins
		} else {
			// Check if we can add another regular user
			return await this.validateUserLimit(companyPlanId, false);
		}
	}

	async findUserInPlan(companyPlanId: IdValueObject, userId: IdValueObject): Promise<any | null> {
		return this.usages.find(u =>
			u.company_plan_id.value === companyPlanId.value &&
            u.user_id.value === userId.value
		) || null;
	}

	async removeUserFromPlan(usageId: IdValueObject): Promise<boolean> {
		const index = this.usages.findIndex(u => u.usage_id.value === usageId.value);
		if (index === -1) return false;

		this.usages.splice(index, 1);
		return true;
	}
}

describe("CompanyPlanUsageEntity", () => {
	let repository: CompanyPlanUsageRepositoryMock;
	let entity: CompanyPlanUsageEntity;

	beforeEach(() => {
		repository = new CompanyPlanUsageRepositoryMock();
		entity = new CompanyPlanUsageEntity(repository);
	});

	describe("create", () => {
		it("should create a new company plan usage", async () => {
			const usageData = {
				companyPlanId: 1,
				userId: 100,
				admin: false
			};

			const result = await entity.create(usageData);

			expect(result).toBeDefined();
			expect(result.companyPlanId.value).toBe(usageData.companyPlanId);
			expect(result.userId.value).toBe(usageData.userId);
			expect(result.admin).toBe(usageData.admin);
			expect(result.usageId.value).toBe(1);
			expect(result.createdAt).toBeInstanceOf(Date);
			expect(result.updatedAt).toBeInstanceOf(Date);
		});
	});

	describe("bulkCreate", () => {
		it("should create multiple company plan usages in bulk", async () => {
			const usagesData = [
				{ companyPlanId: 1, userId: 101, admin: false },
				{ companyPlanId: 1, userId: 102, admin: true },
				{ companyPlanId: 2, userId: 103, admin: false }
			];

			const results = await entity.bulkCreate(usagesData);

			expect(results).toHaveLength(3);
			expect(results[0].companyPlanId.value).toBe(usagesData[0].companyPlanId);
			expect(results[0].userId.value).toBe(usagesData[0].userId);
			expect(results[0].admin).toBe(usagesData[0].admin);
			expect(results[0].usageId.value).toBe(1);

			expect(results[1].companyPlanId.value).toBe(usagesData[1].companyPlanId);
			expect(results[1].userId.value).toBe(usagesData[1].userId);
			expect(results[1].admin).toBe(usagesData[1].admin);
			expect(results[1].usageId.value).toBe(2);

			expect(results[2].companyPlanId.value).toBe(usagesData[2].companyPlanId);
			expect(results[2].userId.value).toBe(usagesData[2].userId);
			expect(results[2].admin).toBe(usagesData[2].admin);
			expect(results[2].usageId.value).toBe(3);
		});

		it("should return empty array when no data is provided", async () => {
			const results = await entity.bulkCreate([]);
			expect(results).toEqual([]);
		});
	});

	describe("getByCompanyPlanId", () => {
		it("should get usages by company plan id", async () => {
			// Create some usages first
			await entity.create({ companyPlanId: 1, userId: 101, admin: false });
			await entity.create({ companyPlanId: 1, userId: 102, admin: true });
			await entity.create({ companyPlanId: 2, userId: 103, admin: false });

			const results = await entity.getByCompanyPlanId(1);

			expect(results).toHaveLength(2);
			expect(results[0].companyPlanId.value).toBe(1);
			expect(results[1].companyPlanId.value).toBe(1);
			expect(results[0].userId.value).toBe(101);
			expect(results[1].userId.value).toBe(102);
			expect(results[0].admin).toBe(false);
			expect(results[1].admin).toBe(true);
		});

		it("should return empty array when no usages found", async () => {
			const results = await entity.getByCompanyPlanId(999);
			expect(results).toEqual([]);
		});

		it("should throw error for invalid company plan id", async () => {
			await expect(entity.getByCompanyPlanId("")).rejects.toThrow();
		});
	});

	describe("getUsageMetrics", () => {
		it("should get usage metrics for a company", async () => {
			// Create some usages first
			await entity.create({ companyPlanId: 1, userId: 101, admin: false });
			await entity.create({ companyPlanId: 1, userId: 102, admin: true });

			const metrics = await entity.getUsageMetrics(5);

			expect(metrics).toBeDefined();
			const values = metrics.getValues();
			expect(values.totalUsers).toBe(2);
			expect(values.activeUsers).toBe(5);
			expect(values.limitedUsers).toBe(2);
			expect(values.companyId).toBe(5);
		});

		it("should throw error for invalid company id", async () => {
			await expect(entity.getUsageMetrics("")).rejects.toThrow();
		});
	});

	// Add tests for new methods
	describe("validateUserLimit", () => {
		it("should validate if a user can be added based on scope limits", async () => {
			// Set up the validateUserLimit mock
			jest.spyOn(repository, "validateUserLimit").mockImplementation(async (companyPlanId, isAdmin) => {
				// Mock implementation for testing
				if (isAdmin) return true;

				const count = await repository.countUsersByScope(companyPlanId, false);
				return count < 5;
			});

			// Add 4 regular users
			for (let i = 0; i < 4; i++) {
				await entity.create({ companyPlanId: 1, userId: 100 + i, admin: false });
			}

			// Check that we can still add one more regular user
			const canAddRegular = await repository.validateUserLimit(IdValueObject.create(1) as IdValueObject, false);
			expect(canAddRegular).toBe(true);

			// Add the 5th regular user
			await entity.create({ companyPlanId: 1, userId: 105, admin: false });

			// Now we should be at the limit for regular users
			const canAddMoreRegular = await repository.validateUserLimit(IdValueObject.create(1) as IdValueObject, false);
			expect(canAddMoreRegular).toBe(false);

			// We should still be able to add admin users
			const canAddAdmin = await repository.validateUserLimit(IdValueObject.create(1) as IdValueObject, true);
			expect(canAddAdmin).toBe(true);
		});
	});

	describe("updateUserScope", () => {
		it("should update a user scope (admin status)", async () => {
			// Create a user usage
			const result = await entity.create({ companyPlanId: 1, userId: 100, admin: false });

			// Update the scope
			const updatedUsage = await repository.updateUserScope(result.usageId, true);

			expect(updatedUsage).toBeDefined();
			expect(updatedUsage.admin).toBe(true);
		});

		it("should return null when trying to update non-existent usage", async () => {
			const updatedUsage = await repository.updateUserScope(IdValueObject.create(999) as IdValueObject, true);
			expect(updatedUsage).toBeNull();
		});
	});

	describe("findUserInPlan", () => {
		it("should find a user in a company plan", async () => {
			// Create some usages
			await entity.create({ companyPlanId: 1, userId: 101, admin: false });
			await entity.create({ companyPlanId: 1, userId: 102, admin: true });

			const foundUsage = await repository.findUserInPlan(
                IdValueObject.create(1) as IdValueObject,
                IdValueObject.create(102) as IdValueObject
			);

			expect(foundUsage).toBeDefined();
			expect(foundUsage.user_id.value).toBe(102);
			expect(foundUsage.admin).toBe(true);
		});

		it("should return null when user is not in plan", async () => {
			const foundUsage = await repository.findUserInPlan(
                IdValueObject.create(1) as IdValueObject,
                IdValueObject.create(999) as IdValueObject
			);

			expect(foundUsage).toBeNull();
		});
	});

	describe("removeUserFromPlan", () => {
		it("should remove a user from a plan", async () => {
			// Create a usage
			const result = await entity.create({ companyPlanId: 1, userId: 100, admin: false });

			// Remove the user
			const removed = await repository.removeUserFromPlan(result.usageId);
			expect(removed).toBe(true);

			// Verify it's gone
			const foundUsage = await repository.findUserInPlan(
                IdValueObject.create(1) as IdValueObject,
                IdValueObject.create(100) as IdValueObject
			);

			expect(foundUsage).toBeNull();
		});

		it("should return false when trying to remove non-existent usage", async () => {
			const removed = await repository.removeUserFromPlan(IdValueObject.create(999) as IdValueObject);
			expect(removed).toBe(false);
		});
	});
});
