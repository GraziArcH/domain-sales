import { PlanAggregate } from "@/domain/plan/aggregates";
import { IdValueObject } from "@/domain/plan/value-objects";

// Mock repositories
class MockRepository {
	items = new Map();
	idCounter = 1;

	clear() {
		this.items.clear();
		this.idCounter = 1;
	}
}

class PlanRepositoryMock extends MockRepository {
	async create(plan) {
		const id = this.idCounter++;
		const newPlan = {
			...plan,
			plan_id: IdValueObject.create(id)
		};
		this.items.set(id, newPlan);
		return newPlan;
	}

	async getPlanById(planId) {
		return this.items.get(planId.value) || null;
	}

	async getAll() {
		return Array.from(this.items.values());
	}

	async update(plan) {
		if (!this.items.has(plan.plan_id.value)) return null;
		this.items.set(plan.plan_id.value, plan);
		return plan;
	}

	async delete(planId) {
		return this.items.delete(planId.value);
	}
}

class PlanTypeRepositoryMock extends MockRepository {
	constructor() {
		super();
		// Add some default plan types
		this.items.set(1, {
			plan_type_id: IdValueObject.create(1),
			type_name: "Basic",
			created_at: new Date(),
			updated_at: new Date()
		});
		this.items.set(2, {
			plan_type_id: IdValueObject.create(2),
			type_name: "Premium",
			created_at: new Date(),
			updated_at: new Date()
		});
	}

	async getById(planTypeId) {
		return this.items.get(planTypeId.value) || null;
	}

	async getAll() {
		return Array.from(this.items.values());
	}

	// Stub methods to satisfy IPlanTypeRepository interface
	async create(planType) {
		// Just return the input for test purposes
		return planType;
	}

	async update(planType) {
		// Just return the input for test purposes
		return planType;
	}

	async delete(planTypeId) {
		return this.items.delete(planTypeId.value);
	}
}

class CompanyPlanRepositoryMock extends MockRepository {
	async create(companyPlan) {
		const id = this.idCounter++;
		const newCompanyPlan = {
			...companyPlan,
			company_plan_id: IdValueObject.create(id)
		};
		this.items.set(id, newCompanyPlan);
		return newCompanyPlan;
	}

	async getById(companyPlanId) {
		return this.items.get(companyPlanId.value) || null;
	}

	async getActiveByCompanyId(companyId) {
		for (const plan of this.items.values()) {
			if (plan.company_id.value === companyId.value && plan.status === "active") {
				return plan;
			}
		}
		return null;
	}

	async updateStatus(companyPlanId, status) {
		const plan = this.items.get(companyPlanId.value);
		if (!plan) return null;

		plan.status = status;
		this.items.set(companyPlanId.value, plan);
		return plan;
	}

	// Add missing methods to satisfy ICompanyPlanRepository
	async getHistoryByCompanyId(companyId) {
		// Return empty array or mock data as needed for tests
		return [];
	}

	async update(companyPlan) {
		if (!this.items.has(companyPlan.company_plan_id.value)) return null;
		this.items.set(companyPlan.company_plan_id.value, companyPlan);
		return companyPlan;
	}
}

class PlanDurationsRepositoryMock extends MockRepository {
	constructor() {
		super();
		// Add some default durations in new format
		this.items.set(1, {
			plan_duration_id: IdValueObject.create(1),
			plan_id: IdValueObject.create(1),
			duration_type: "mensal",
			duration_value: 1
		});
		this.items.set(2, {
			plan_duration_id: IdValueObject.create(2),
			plan_id: IdValueObject.create(1),
			duration_type: "anual",
			duration_value: 1
		});
	}

	async getById(durationId) {
		return this.items.get(durationId.value) || null;
	}

	async create(duration) {
		const id = this.idCounter++;
		const newDuration = {
			...duration,
			plan_duration_id: IdValueObject.create(id)
		};
		this.items.set(id, newDuration);
		return newDuration;
	}

	async getByPlanId(planId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.plan_id.value === planId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async update(duration) {
		if (!this.items.has(duration.plan_duration_id.value)) return null;
		this.items.set(duration.plan_duration_id.value, duration);
		return duration;
	}

	async delete(planDurationId) {
		return this.items.delete(planDurationId.value);
	}
}

class PlanUserTypeRepositoryMock extends MockRepository {
	async create(userType) {
		const id = this.idCounter++;
		const newType = {
			...userType,
			plan_user_type_id: IdValueObject.create(id)
		};
		this.items.set(id, newType);
		return newType;
	}

	async getById(id) {
		return this.items.get(id.value) || null;
	}

	async getByPlanTypeId(planTypeId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.plan_type_id.value === planTypeId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getByPlanTypeAndUserId(planTypeId, userId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.plan_type_id.value === planTypeId.value && item.user_id.value === userId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getByPlanTypeIdAndAdmin(planTypeId, admin) {
		for (const item of this.items.values()) {
			if (item.plan_type_id.value === planTypeId.value && item.admin === admin) {
				return item;
			}
		}
		return null;
	}

	async update(planUserType) {
		if (!this.items.has(planUserType.plan_user_type_id.value)) return null;
		this.items.set(planUserType.plan_user_type_id.value, planUserType);
		return planUserType;
	}

	async delete(planUserTypeId) {
		return this.items.delete(planUserTypeId.value);
	}
}

class CompanyPlanHistoryRepositoryMock extends MockRepository {
	async create(history) {
		const id = this.idCounter++;
		const newHistory = {
			...history,
			company_plan_history_id: IdValueObject.create(id)
		};
		this.items.set(id, newHistory);
		return newHistory;
	}

	async getByCompanyId(companyId) {
		// Return all history items for the given companyId
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_id && item.company_id.value === companyId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getRecentByCompanyId(companyId, limit = 5) {
		// Return the most recent history items for the given companyId
		const all = await this.getByCompanyId(companyId);
		// Sort by created_at descending, fallback to history_id if needed
		all.sort((a, b) => {
			if (a.created_at && b.created_at) {
				return b.created_at - a.created_at;
			}
			return b.history_id.value - a.history_id.value;
		});
		return all.slice(0, limit);
	}

	async getByCompanyPlanId(companyPlanId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getRecentByCompanyPlanId(companyPlanId) {
		const histories = await this.getByCompanyPlanId(companyPlanId);
		if (histories.length === 0) return null;

		// Return the most recently created history (assuming higher ID = more recent)
		return histories.reduce((recent, current) =>
			recent.company_plan_history_id.value > current.company_plan_history_id.value ? recent : current
		);
	}
}

class PlanCancellationsRepositoryMock extends MockRepository {
	async create(cancellation) {
		const id = this.idCounter++;
		const newCancellation = {
			...cancellation,
			cancellation_id: IdValueObject.create(id)
		};
		this.items.set(id, newCancellation);
		return newCancellation;
	}

	async getById(cancellationId) {
		return this.items.get(cancellationId.value) || null;
	}

	async getByCompanyPlanId(companyPlanId) {
		// Return all cancellations for the given companyPlanId
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_plan_id && item.company_plan_id.value === companyPlanId.value) {
				result.push(item);
			}
		}
		return result;
	}

	// updateStatus method removed - status column doesn't exist in actual schema
}

class PlanReportsRepositoryMock extends MockRepository {
	async create(report) {
		const id = this.idCounter++;
		const newReport = {
			...report,
			plan_report_id: IdValueObject.create(id)
		};
		this.items.set(id, newReport);
		return newReport;
	}

	async getByPlanId(planId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.plan_id.value === planId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getByTemplateId(templateId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.template_id && item.template_id.value === templateId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async update(report) {
		if (!this.items.has(report.plan_report_id.value)) return null;
		this.items.set(report.plan_report_id.value, report);
		return report;
	}

	async delete(planReportId) {
		return this.items.delete(planReportId.value);
	}

	async getByPlanTypeId(planTypeId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.plan_type_id.value === planTypeId.value) {
				result.push(item);
			}
		}
		return result;
	}
}

class CompanyPlanUsageRepositoryMock extends MockRepository {
	async create(usage) {
		const id = this.idCounter++;
		const newUsage = {
			...usage,
			company_plan_usage_id: IdValueObject.create(id)
		};
		this.items.set(id, newUsage);
		return newUsage;
	}

	async bulkCreate(usages) {
		const newUsages = usages.map(usage => {
			const id = this.idCounter++;
			const newUsage = {
				...usage,
				company_plan_usage_id: IdValueObject.create(id)
			};
			this.items.set(id, newUsage);
			return newUsage;
		});
		return newUsages;
	}

	async getByCompanyPlanId(companyPlanId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async getUsageMetrics(companyId) {
		// Mock implementation for metrics
		return {
			totalUsers: this.items.size,
			activeUsers: 5,
			limitedUsers: 2,
			companyId: companyId.value
		};
	}

	async countUsersByScope(companyPlanId, isAdmin) {
		let count = 0;
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value &&
				item.is_admin === isAdmin) {
				count++;
			}
		}
		return count;
	}

	async validateUserLimit(companyPlanId, isAdmin) {
		// For testing purposes, always allow
		return true;
	}

	async syncWithUserDatabase(companyId, companyPlanId) {
		return [];
	}

	async updateUserScope(usageId, isAdmin) {
		const usage = [...this.items.values()].find(
			item => item.company_plan_usage_id.value === usageId.value
		);

		if (!usage) return null;

		usage.is_admin = isAdmin;
		return usage;
	}

	async canChangeUserScope(companyPlanId, currentIsAdmin, newIsAdmin) {
		return true;
	}

	async findUserInPlan(companyPlanId, userId) {
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value &&
				item.user_id.value === userId.value) {
				return item;
			}
		}
		return null;
	}

	async removeUserFromPlan(usageId) {
		for (const [key, item] of this.items.entries()) {
			if (item.company_plan_usage_id.value === usageId.value) {
				this.items.delete(key);
				return true;
			}
		}
		return false;
	}
}

class PlanUserOverrideRepositoryMock extends MockRepository {
	async create(override) {
		const id = this.idCounter++;
		const newOverride = {
			...override,
			plan_user_override_id: IdValueObject.create(id)
		};
		this.items.set(id, newOverride);
		return newOverride;
	}

	async getById(overrideId) {
		return this.items.get(overrideId.value) || null;
	}

	async getByCompanyPlanIdAndAdmin(companyPlanId, isAdmin) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value &&
				item.is_admin === isAdmin) {
				result.push(item);
			}
		}
		return result.length > 0 ? result[0] : null;
	}

	async getByCompanyPlanId(companyPlanId) {
		const result = [];
		for (const item of this.items.values()) {
			if (item.company_plan_id.value === companyPlanId.value) {
				result.push(item);
			}
		}
		return result;
	}

	async update(override) {
		if (!this.items.has(override.plan_user_override_id.value)) return null;
		this.items.set(override.plan_user_override_id.value, override);
		return override;
	}

	async delete(overrideId) {
		return this.items.delete(overrideId.value);
	}
}

describe("PlanAggregate", () => {
	let aggregate: PlanAggregate;
	let planRepository: PlanRepositoryMock;
	let planTypeRepository: PlanTypeRepositoryMock;
	let companyPlanRepository: CompanyPlanRepositoryMock;
	let planDurationsRepository: PlanDurationsRepositoryMock;
	let planUserTypeRepository: PlanUserTypeRepositoryMock;
	let companyPlanHistoryRepository: CompanyPlanHistoryRepositoryMock;
	let planCancellationsRepository: PlanCancellationsRepositoryMock;
	let planReportsRepository: PlanReportsRepositoryMock;
	let companyPlanUsageRepository: CompanyPlanUsageRepositoryMock;
	let planUserOverrideRepository: PlanUserOverrideRepositoryMock;

	beforeEach(() => {
		planRepository = new PlanRepositoryMock();
		planTypeRepository = new PlanTypeRepositoryMock();
		companyPlanRepository = new CompanyPlanRepositoryMock();
		planDurationsRepository = new PlanDurationsRepositoryMock();
		planUserTypeRepository = new PlanUserTypeRepositoryMock();
		companyPlanHistoryRepository = new CompanyPlanHistoryRepositoryMock();
		planCancellationsRepository = new PlanCancellationsRepositoryMock();
		planReportsRepository = new PlanReportsRepositoryMock();
		companyPlanUsageRepository = new CompanyPlanUsageRepositoryMock();
		planUserOverrideRepository = new PlanUserOverrideRepositoryMock();

		aggregate = new PlanAggregate(
			planRepository,
			planTypeRepository,
			companyPlanRepository,
			planUserTypeRepository,
			companyPlanHistoryRepository,
			planCancellationsRepository,
			planReportsRepository,
			companyPlanUsageRepository,
			planUserOverrideRepository
		);
	});

	describe("create", () => {
		it("should create a new plan", async () => {
			const result = await aggregate.create(1, "Test Plan", "Test Description", 100, "mensal");

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_id).toBeDefined();
				expect(result.plan_name).toBe("Test Plan");
				expect(result.description).toBe("Test Description");
				expect(result.default_amount).toBe(100);
				expect(result.plan_duration).toBe("mensal");
			}
		});

		it("should return error if plan type does not exist", async () => {
			const result = await aggregate.create(999, "Test Plan", "Test Description", 100, "mensal");

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Esse tipo de plano não existe");
		});

		it("should return error with invalid duration type", async () => {
			const result = await aggregate.create(1, "Test Plan", "Test Description", 100, "invalid" as any);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Duração do plano inválida");
		});
	});

	describe("createCompanyPlan", () => {
		beforeEach(async () => {
			// Create a test plan first
			await planRepository.create({
				plan_id: IdValueObject.create(1),
				plan_name: "Test Plan",
				description: "Test Description",
				default_amount: 100,
				plan_duration: "mensal",
				plan_type_id: IdValueObject.create(1),
				created_at: new Date(),
				updated_at: new Date()
			});
		});

		it("should create a new company plan", async () => {
			const startDate = new Date();
			const endDate = new Date();
			endDate.setFullYear(endDate.getFullYear() + 1);

			const result = await aggregate.createCompanyPlan(
				1,  // companyId
				1,  // planId
				200, // amount
				startDate,
				endDate,
				5   // additionalUserAmount
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.company_id.value).toBe(1);
				expect(result.plan_id.value).toBe(1);
				expect(result.amount).toBe(200);
				expect(result.additional_user_amount).toBe(5);
				expect(result.status).toBe("active");
			}
		});

		it("should return error if company already has active plan", async () => {
			// Create an active plan for company id 1
			await companyPlanRepository.create({
				company_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1),
				amount: 100,
				start_date: new Date(),
				end_date: new Date(Date.now() + 86400000), // tomorrow
				status: "active",
				additional_user_amount: 0
			});

			const startDate = new Date();
			const endDate = new Date();
			endDate.setFullYear(endDate.getFullYear() + 1);

			const result = await aggregate.createCompanyPlan(
				1,  // same companyId
				1,
				200,
				startDate,
				endDate
			);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Esta empresa já possui um plano ativo");
		});
	});

	describe("cancelCompanyPlan", () => {
		beforeEach(async () => {
			// Create a company plan to cancel
			await companyPlanRepository.create({
				company_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1),
				plan_duration_id: IdValueObject.create(1),
				amount: 100,
				start_date: new Date(),
				end_date: new Date(Date.now() + 86400000), // tomorrow
				status: "active",
				additional_user_amount: 0
			});
		});

		it("should request cancellation of a company plan", async () => {
			const result = await aggregate.cancelCompanyPlan(
				1, // companyPlanId
				2, // cancelledByUserId
				"No longer needed",
				"Customer moving to different service"
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.company_plan_id.value).toBe(1);
				expect(result.cancellation_reason).toBe("No longer needed");
				expect(result.cancelled_by_user_id.value).toBe(2);
				// Note: status column doesn't exist in actual schema
			}
		});
	});

	describe("confirmCancelation", () => {
		beforeEach(async () => {
			// Create a company plan
			await companyPlanRepository.create({
				company_plan_id: IdValueObject.create(1),
				company_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1),
				amount: 100,
				start_date: new Date(),
				end_date: new Date(Date.now() + 86400000), // tomorrow
				status: "active",
				additional_user_amount: 0
			});

			// Create a cancellation request
			await planCancellationsRepository.create({
				cancellation_id: IdValueObject.create(1),
				company_plan_id: IdValueObject.create(1),
				cancellation_reason: "Test reason",
				cancelled_by_user_id: IdValueObject.create(2),
				status: "requested",
				created_at: new Date(),
				updated_at: new Date()
			});
		});

		it("should confirm cancellation of a company plan", async () => {
			const result = await aggregate.confirmCancelation(
				1, // cancellationId
				3, // changedByUserId
				"Confirmed due to payment issues"
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				// Note: status column doesn't exist in actual schema

				// Check that company plan was updated to cancelled
				const companyPlan = await companyPlanRepository.getById(IdValueObject.create(1));
				expect(companyPlan?.status).toBe("cancelled");

				// Check that history was created
				const histories = await companyPlanHistoryRepository.getByCompanyPlanId(IdValueObject.create(1));
				expect(histories.length).toBeGreaterThan(0);
				expect(histories[0].change_type).toBe("cancellation");
				expect(histories[0].reason).toBe("Confirmed due to payment issues");
			}
		});

		it("should return error if cancellation does not exist", async () => {
			const result = await aggregate.confirmCancelation(999, 3, "Confirmed cancellation");

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Solicitação de cancelamento não encontrada");
		});

		// Test removed: status column doesn't exist in actual schema
	});

	describe("createPlanUserType", () => {
		it("should create a new plan user type", async () => {
			const result = await aggregate.createPlanUserType(
				1, // planTypeId
				true, // admin
				5, // numberOfUsers
				20, // extraUserPrice
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_type_id.value).toBe(1);
				expect(result.admin).toBe(true);
				expect(result.number_of_users).toBe(5);
				expect(result.extra_user_price).toBe(20);
			}
		});

		it("should return error if plan type does not exist", async () => {
			const result = await aggregate.createPlanUserType(
				999, // non-existent planTypeId
				true,
				5,
				20
			);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Tipo de plano não encontrado");
		});

		it("should return error if the configuration for this plan type and admin already exists", async () => {
			// First create a configuration
			await aggregate.createPlanUserType(1, true, 5, 20);

			// Try to create another with the same plan type and admin setting
			const result = await aggregate.createPlanUserType(1, true, 10, 30);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Já existe uma configuração de usuários para este tipo de plano com admin=true");
		});

		it("should return error if number of users is not valid", async () => {
			const result = await aggregate.createPlanUserType(1, false, 0, 20);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Número de usuários deve ser maior que zero");
		});

		it("should return error if extra user price is negative", async () => {
			const result = await aggregate.createPlanUserType(1, false, 5, -10);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Preço por usuário extra não pode ser negativo");
		});
	});

	describe("getPlanUserType", () => {
		beforeEach(async () => {
			// Create a test plan user type
			await planUserTypeRepository.create({
				plan_user_type_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1),
				admin: true,
				number_of_users: 5,
				extra_user_price: 20
			});
		});

		it("should get plan user type by id", async () => {
			const result = await aggregate.getPlanUserType(1);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_user_type_id.value).toBe(1);
				expect(result.plan_type_id.value).toBe(1);
				expect(result.admin).toBe(true);
			}
		});
	});

	describe("updatePlanUserType", () => {
		beforeEach(async () => {
			// Create a test plan user type
			await planUserTypeRepository.create({
				plan_user_type_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1),
				admin: true,
				number_of_users: 5,
				extra_user_price: 20
			});
		});

		it("should update plan user type", async () => {
			const result = await aggregate.updatePlanUserType(
				1, // planUserTypeId
				1, // planTypeId
				true, // admin
				10, // updated numberOfUsers
				30, // updated extraUserPrice
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_user_type_id.value).toBe(1);
				expect(result.number_of_users).toBe(10);
				expect(result.extra_user_price).toBe(30);
			}
		});

		it("should return error if plan user type does not exist", async () => {
			const result = await aggregate.updatePlanUserType(999, 1, true, 10, 30);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Configuração de usuários não encontrada");
		});
	});

	describe("addReportToPlanType", () => {
		it("should add a report to a plan type", async () => {
			const result = await aggregate.addReportToPlanType(
				1, // planTypeId
				123 // templateId
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_type_id.value).toBe(1);
				expect(result.template_id.value).toBe(123);
			}
		});

		it("should return error if plan type does not exist", async () => {
			const result = await aggregate.addReportToPlanType(999, 123);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toBe("Tipo de plano não encontrado");
		});
	});

	describe("getReportsByPlanType", () => {
		beforeEach(async () => {
			// Create test reports for planTypeId 1
			await planReportsRepository.create({
				plan_report_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1),
				template_id: IdValueObject.create(100)
			});

			await planReportsRepository.create({
				plan_report_id: IdValueObject.create(2),
				plan_type_id: IdValueObject.create(1),
				template_id: IdValueObject.create(101)
			});
		});

		it("should get all reports by plan type id", async () => {
			const result = await aggregate.getReportsByPlanType(1);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBe(2);

				// Check both reports exist
				expect(result[0].template_id.value).toBe(100);
				expect(result[1].template_id.value).toBe(101);
			}
		});
	});

	describe("updatePlanTypeReport", () => {
		beforeEach(async () => {
			await planReportsRepository.create({
				plan_report_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1),
				template_id: IdValueObject.create(100)
			});
		});

		it("should update a plan type report", async () => {
			const result = await aggregate.updatePlanTypeReport(
				1, // reportId
				1, // planTypeId
				200 // new templateId
			);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.plan_report_id.value).toBe(1);
				expect(result.template_id.value).toBe(200);
			}
		});
	});

	describe("deletePlanTypeReport", () => {
		beforeEach(async () => {
			await planReportsRepository.create({
				plan_report_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1),
				template_id: IdValueObject.create(100)
			});
		});

		it("should delete a plan type report", async () => {
			const result = await aggregate.deletePlanTypeReport(1);

			expect(result).toBe(true);

			// Verify it's deleted
			const reports = await planReportsRepository.getByPlanTypeId(IdValueObject.create(1));
			expect(reports.length).toBe(0);
		});
	});
});
