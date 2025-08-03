import { PlanFacade } from "@/application/facade/plan";
import { PlanEntity } from "@/domain/plan/entities/plan/plan-entity";
import { PlanUserTypeEntity } from "@/domain/plan/entities/plan-user-type/plan-user-type-entity";
import { PlanCancellationEntity } from "@/domain/plan/entities/plan-cancellations/plan-cancellations-entity";
import { PlanReportEntity } from "@/domain/plan/entities/plan-reports/plan-reports-entity";
import { CompanyPlanUsageEntity } from "@/domain/plan/entities/company-plan-usage/company-plan-usage-entity";
import { IdValueObject } from "@/domain/plan/value-objects";
import { Plan } from "@/domain/plan/interfaces/database";
import { PlanCancellation } from "@/domain/plan/interfaces/database/plan-cancellations-repository";
import { PlanReport } from "@/domain/plan/interfaces/database/plan-reports-repository";
import { PlanUserOverride } from "@/domain/plan/interfaces/database/plan-user-override-repository";
import { PlanTypeEntity } from "../../../../src/domain/plan";

// Mock repositories
const createMockRepository = () => ({
	items: new Map(),
	idCounter: 1,
	create: jest.fn(),
	getAll: jest.fn(),
	getById: jest.fn(),
	getPlanById: jest.fn(),
	update: jest.fn(),
	updateStatus: jest.fn(),
	delete: jest.fn(),
	getByPlanId: jest.fn(),
	getActiveByCompanyId: jest.fn(),
	getByCompanyPlanId: jest.fn(),
	getUsageMetrics: jest.fn(),
	validateUserLimit: jest.fn(),
	getByPlanTypeId: jest.fn(),
	getByCompanyPlanIdAndAdmin: jest.fn(),
	getByPlanTypeIdAndAdmin: jest.fn(),
	bulkCreate: jest.fn()
});

// Mock UnitOfWork
class MockUnitOfWork {
	start = jest.fn().mockResolvedValue(undefined);
	commit = jest.fn().mockResolvedValue(undefined);
	rollback = jest.fn().mockResolvedValue(undefined);
	runTransaction = jest.fn().mockImplementation(async (callback) => {
		await this.start();
		try {
			const result = await callback();
			await this.commit();
			return result;
		} catch (error) {
			await this.rollback();
			return error;
		}
	});
}

describe("PlanFacade", () => {
	let facade: PlanFacade;
	let planEntity;
	let planTypeEntity;
	let planUserTypeEntity;
	let planCancellationEntity;
	let planReportEntity;
	let companyPlanUsageEntity;
	let planRepository;
	let planTypeRepository;
	let companyPlanRepository;
	let planUserTypeRepository;
	let companyPlanHistoryRepository;
	let planCancellationsRepository;
	let planReportsRepository;
	let companyPlanUsageRepository;
	let planUserOverrideRepository;
	let unitOfWork;

	beforeEach(() => {
		// Create mock entities using Jest mocks instead of real instances
		planEntity = {
			getById: jest.fn(),
			create: jest.fn(),
			update: jest.fn()
		};

		planTypeEntity = {
			getById: jest.fn(),
			getAll: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		planUserTypeEntity = {
			getByPlanTypeId: jest.fn(),
			getByPlanTypeIdAndAdmin: jest.fn(),
			create: jest.fn(),
			update: jest.fn(),
			delete: jest.fn()
		};

		planCancellationEntity = {
			create: jest.fn(),
			getById: jest.fn(),
			getByPlanId: jest.fn()
		};

		planReportEntity = {
			create: jest.fn(),
			getById: jest.fn(),
			getByPlanTypeId: jest.fn()
		};

		companyPlanUsageEntity = {
			validateUserLimit: jest.fn(),
			create: jest.fn(),
			getUsageMetrics: jest.fn(),
			findUserInPlan: jest.fn(),
			updateUserScope: jest.fn(),
			removeUserFromPlan: jest.fn()
		};

		// Create mock repositories
		planRepository = createMockRepository();
		planTypeRepository = createMockRepository();
		companyPlanRepository = createMockRepository();
		planUserTypeRepository = createMockRepository();
		companyPlanHistoryRepository = createMockRepository();
		planCancellationsRepository = createMockRepository();
		planReportsRepository = createMockRepository();
		companyPlanUsageRepository = createMockRepository();
		planUserOverrideRepository = createMockRepository();

		unitOfWork = new MockUnitOfWork();

		facade = new PlanFacade(
			planEntity,
			planTypeEntity,
			planUserTypeEntity,
			planCancellationEntity,
			planReportEntity,
			companyPlanUsageEntity,
			planRepository as any,
			planTypeRepository as any,
			companyPlanRepository as any,
			planUserTypeRepository as any,
			companyPlanHistoryRepository as any,
			planCancellationsRepository as any,
			planReportsRepository as any,
			companyPlanUsageRepository as any,
			planUserOverrideRepository as any,
			unitOfWork as any
		);
	});

	describe("create", () => {
		it("should start transaction, create plan and commit", async () => {
			// Mock successful plan creation
			const planId = IdValueObject.create(1) as IdValueObject;
			const planTypeId = IdValueObject.create(1) as IdValueObject;
			const mockPlan: Plan = {
				plan_id: planId,
				plan_name: "Test Plan",
				description: "Test Description",
				default_amount: 100,
				plan_type_id: planTypeId,
				plan_duration: "mensal",
				created_at: new Date(),
				updated_at: new Date()
			};

			// Mock plan type exists
			planTypeRepository.getById.mockResolvedValue({
				plan_type_id: planTypeId,
				type_name: "Basic",
				created_at: new Date(),
				updated_at: new Date()
			});

			// Mock plan creation
			planRepository.create.mockResolvedValue(mockPlan);

			const result = await facade.create(1, "Test Plan", "Test Description", 100, "mensal");

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(planTypeRepository.getById).toHaveBeenCalled();
			expect(planRepository.create).toHaveBeenCalled();
			expect(unitOfWork.commit).toHaveBeenCalled();
			expect(unitOfWork.rollback).not.toHaveBeenCalled();
			expect(result).toEqual(mockPlan);
		});

		it("should rollback transaction if plan type does not exist", async () => {
			// Mock plan type not found
			planTypeRepository.getById.mockResolvedValue(null);

			const result = await facade.create(999, "Test Plan", "Test Description", 100, "mensal");

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(unitOfWork.commit).not.toHaveBeenCalled();
			expect(unitOfWork.rollback).toHaveBeenCalled();
			expect(result).toBeInstanceOf(Error);
			if (result instanceof Error) {
				expect(result.message).toBe("Esse tipo de plano não existe");
			}
		});
	});

	describe("cancelCompanyPlan", () => {
		it("should start transaction, cancel plan and commit", async () => {
			// Mock successful cancellation
			const cancellationId = IdValueObject.create(1) as IdValueObject;
			const companyPlanId = IdValueObject.create(1) as IdValueObject;
			const cancelledByUserId = IdValueObject.create(1) as IdValueObject;
			const mockCancellation: PlanCancellation = {
				plan_cancellation_id: cancellationId,
				company_plan_id: companyPlanId,
				cancellation_reason: "Test Reason",
				cancelled_at: new Date(),
				cancelled_by_user_id: cancelledByUserId,
				created_at: new Date(),
				updated_at: new Date()
			};

			// Mock company plan exists and is active
			companyPlanRepository.getById.mockResolvedValue({
				company_plan_id: companyPlanId,
				company_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1),
				plan_duration_id: IdValueObject.create(1),
				amount: 100,
				start_date: new Date(),
				end_date: new Date(Date.now() + 86400000),
				status: "active",
				additional_user_amount: 0
			});

			// Mock cancellation creation
			planCancellationsRepository.create.mockResolvedValue(mockCancellation);

			const result = await facade.cancelCompanyPlan(1, 1, "Test Reason", "Test Details");

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(companyPlanRepository.getById).toHaveBeenCalled();
			expect(planCancellationsRepository.create).toHaveBeenCalled();
			expect(unitOfWork.commit).toHaveBeenCalled();
			expect(unitOfWork.rollback).not.toHaveBeenCalled();
			expect(result).toEqual(mockCancellation);
		});

		it("should rollback transaction if plan not found", async () => {
			// Mock company plan not found
			companyPlanRepository.getById.mockResolvedValue(null);

			const result = await facade.cancelCompanyPlan(999, 1, "Test Reason", "Test Details");

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(unitOfWork.commit).not.toHaveBeenCalled();
			expect(unitOfWork.rollback).toHaveBeenCalled();
			expect(result).toBeInstanceOf(Error);
			if (result instanceof Error) {
				expect(result.message).toBe("Plano não encontrado");
			}
		});
	});

	describe("addReportToPlanType", () => {
		it("should start transaction, create report and commit", async () => {
			// Mock successful plan report creation
			const planReportId = IdValueObject.create(1) as IdValueObject;
			const planTypeId = IdValueObject.create(1) as IdValueObject;
			const templateId = IdValueObject.create(1) as IdValueObject;
			const mockReport: PlanReport = {
				plan_report_id: planReportId,
				plan_type_id: planTypeId,
				template_id: templateId
			};

			// Mock plan type exists
			planTypeRepository.getById.mockResolvedValue({
				plan_type_id: planTypeId,
				type_name: "Basic",
				created_at: new Date(),
				updated_at: new Date()
			});

			// Mock report creation
			planReportsRepository.create.mockResolvedValue(mockReport);

			const result = await facade.addReportToPlanType(1, 1);

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(planTypeRepository.getById).toHaveBeenCalled();
			expect(planReportsRepository.create).toHaveBeenCalled();
			expect(unitOfWork.commit).toHaveBeenCalled();
			expect(unitOfWork.rollback).not.toHaveBeenCalled();
			expect(result).toEqual(mockReport);
		});

		it("should rollback transaction if plan type does not exist", async () => {
			// Mock plan type not found
			planTypeRepository.getById.mockResolvedValue(null);

			const result = await facade.addReportToPlanType(999, 1);

			expect(unitOfWork.start).toHaveBeenCalled();
			expect(unitOfWork.commit).not.toHaveBeenCalled();
			expect(unitOfWork.rollback).toHaveBeenCalled();
			expect(result).toBeInstanceOf(Error);
			if (result instanceof Error) {
				expect(result.message).toBe("Tipo de plano não encontrado");
			}
		});
	});

	describe("validateAllUsersWithinLimits", () => {
		it("should validate if all users are within plan limits", async () => {
			const companyId = IdValueObject.create(1) as IdValueObject;
			const activePlan = {
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				plan_id: IdValueObject.create(2) as IdValueObject,
				status: "active"
			};

			const mockPlan = {
				plan_id: IdValueObject.create(2),
				planTypeId: IdValueObject.create(3)
			};
			const mockUsageMetrics = {
				admin_count: 2,
				regular_count: 8
			};

			const mockUserTypes = [
				{
					plan_user_type_id: IdValueObject.create(1),
					admin: true,
					number_of_users: 3
				},
				{
					plan_user_type_id: IdValueObject.create(2),
					admin: false,
					number_of_users: 10
				}
			];

			const mockOverrides = [];

			// Setup mock implementations
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(activePlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planEntity.getById.mockResolvedValue(mockPlan);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);
			planUserOverrideRepository.getByCompanyPlanId.mockResolvedValue(mockOverrides);

			const expectedResult = {
				admin: {
					current: 2,
					limit: 3,
					withinLimit: true
				},
				regular: {
					current: 8,
					limit: 10,
					withinLimit: true
				},
				isValid: true
			};

			const result = await facade.validateAllUsersWithinLimits(1);

			expect(result).toEqual(expectedResult);
			// This is a read operation but uses multiple repositories, so no transaction expected
			expect(companyPlanRepository.getActiveByCompanyId).toHaveBeenCalled();
			expect(companyPlanUsageRepository.getUsageMetrics).toHaveBeenCalled();
		});

		it("should return isValid as false if regular user is over the limit", async () => {
			const companyId = IdValueObject.create(1) as IdValueObject;
			const activePlan = {
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				plan_id: IdValueObject.create(2) as IdValueObject,
				status: "active"
			};

			const mockPlan = {
				plan_id: IdValueObject.create(2),
				planTypeId: IdValueObject.create(3)
			};

			const mockUsageMetrics = {
				admin_count: 2,
				regular_count: 12
			};

			const mockUserTypes = [
				{
					plan_user_type_id: IdValueObject.create(1),
					admin: true,
					number_of_users: 3,
				},
				{
					plan_user_type_id: IdValueObject.create(2),
					admin: false,
					number_of_users: 10,
				}
			];

			const mockOverrides = [];

			// Setup mock implementations
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(activePlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planEntity.getById.mockResolvedValue(mockPlan);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);
			planUserOverrideRepository.getByCompanyPlanId.mockResolvedValue(mockOverrides);

			const expectedResult = {
				admin: {
					current: 2,
					limit: 3,
					withinLimit: true
				},
				regular: {
					current: 12,
					limit: 10,
					withinLimit: false
				},
				isValid: false
			};

			const result = await facade.validateAllUsersWithinLimits(1);

			expect(result).toEqual(expectedResult);
		});

		it("should return isValid as false if admin user is over the limit", async () => {
			const companyId = IdValueObject.create(1) as IdValueObject;
			const activePlan = {
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				plan_id: IdValueObject.create(2) as IdValueObject,
				status: "active"
			};

			const mockPlan = {
				plan_id: IdValueObject.create(2),
				planTypeId: IdValueObject.create(3)
			};

			const mockUsageMetrics = {
				admin_count: 4,
				regular_count: 8
			};

			const mockUserTypes = [
				{
					plan_user_type_id: IdValueObject.create(1),
					admin: true,
					number_of_users: 3,
				},
				{
					plan_user_type_id: IdValueObject.create(2),
					admin: false,
					number_of_users: 10,
				}
			];

			const mockOverrides = [];

			// Setup mock implementations
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(activePlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planEntity.getById.mockResolvedValue(mockPlan);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);
			planUserOverrideRepository.getByCompanyPlanId.mockResolvedValue(mockOverrides);

			const expectedResult = {
				admin: {
					current: 4,
					limit: 3,
					withinLimit: false
				},
				regular: {
					current: 8,
					limit: 10,
					withinLimit: true
				},
				isValid: false
			};

			const result = await facade.validateAllUsersWithinLimits(1);

			expect(result).toEqual(expectedResult);
		});

		it("should consider overrides when validating user limits", async () => {
			const companyId = IdValueObject.create(1) as IdValueObject;
			const activePlan = {
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				plan_id: IdValueObject.create(2) as IdValueObject,
				status: "active"
			};

			const mockPlan = {
				plan_id: IdValueObject.create(2),
				planTypeId: IdValueObject.create(3)
			};

			const mockUsageMetrics = {
				admin_count: 2,
				regular_count: 8
			};

			const mockUserTypes = [
				{
					plan_user_type_id: IdValueObject.create(1),
					admin: true,
					number_of_users: 3,
				},
				{
					plan_user_type_id: IdValueObject.create(2),
					admin: false,
					number_of_users: 10,
				}
			];

			const mockOverrides = [
				{
					plan_user_override_id: IdValueObject.create(1),
					company_plan_id: IdValueObject.create(1),
					admin: true,
					extra_user_price: 50,
					created_at: new Date(),
					updated_at: new Date()
				}
			];

			// Setup mock implementations
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(activePlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planEntity.getById.mockResolvedValue(mockPlan);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);
			planUserOverrideRepository.getByCompanyPlanId.mockResolvedValue(mockOverrides);

			const expectedResult = {
				admin: {
					current: 2,
					limit: 3,
					withinLimit: true
				},
				regular: {
					current: 8,
					limit: 10,
					withinLimit: true
				},
				isValid: true
			};

			const result = await facade.validateAllUsersWithinLimits(1);

			expect(result).toEqual(expectedResult);
		});
	});

	describe("createPlanUserOverride", () => {
		it("should create a plan user override entry", async () => {
			// Mock data
			const companyPlanId = 1;
			const isAdmin = true;
			const extraUserPrice = 50;

			const companyPlanIdObj = IdValueObject.create(companyPlanId) as IdValueObject;

			// Mock company plan exists
			companyPlanRepository.getById.mockResolvedValue({
				company_plan_id: companyPlanIdObj,
				status: "active",
				company_id: IdValueObject.create(1)
			});

			// Mock override creation
			const mockOverride: PlanUserOverride = {
				plan_user_override_id: IdValueObject.create(1) as IdValueObject,
				company_plan_id: companyPlanIdObj,
				admin: isAdmin,
				extra_user_price: extraUserPrice,
				created_at: new Date(),
				updated_at: new Date()
			};

			// Mock the runTransaction method to simulate a successful transaction
			unitOfWork.runTransaction = jest.fn().mockImplementation(async (callback) => {
				return await callback();
			});

			planUserOverrideRepository.create.mockResolvedValue(mockOverride);

			const result = await facade.createPlanUserOverride(companyPlanId, isAdmin, extraUserPrice);

			expect(unitOfWork.runTransaction).toHaveBeenCalled();
			expect(companyPlanRepository.getById).toHaveBeenCalled();
			expect(planUserOverrideRepository.create).toHaveBeenCalled();
			expect(result).toEqual(mockOverride);
		});

		it("should return error when company plan does not exist", async () => {
			// Mock company plan not found
			companyPlanRepository.getById.mockResolvedValue(null);

			// Mock the runTransaction method
			unitOfWork.runTransaction = jest.fn().mockImplementation(async (callback) => {
				return await callback();
			});

			const result = await facade.createPlanUserOverride(999, true, 50);

			expect(result).toBeInstanceOf(Error);
			expect(companyPlanRepository.getById).toHaveBeenCalled();
			expect(planUserOverrideRepository.create).not.toHaveBeenCalled();
		});
	});

	describe('getCompanyPlanDetails', () => {
		it('should return comprehensive plan details', async () => {
			// Setup mocks
			const mockCompanyPlan = {
				company_plan_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1),
				amount: 100,
				start_date: new Date('2024-01-01'),
				end_date: new Date('2024-12-31'),
				status: 'active'
			};

			const mockPlan = {
				plan_id: IdValueObject.create(1),
				plan_name: 'Test Plan',
				description: 'Test Description',
				plan_type_id: IdValueObject.create(1)
			};

			const mockPlanType = {
				plan_type_id: IdValueObject.create(1),
				type_name: 'Basic'
			};

			const mockUsageMetrics = {
				admin_count: 2,
				regular_count: 5
			};

			const mockUserTypes = [
				{ admin: true, number_of_users: 3 },
				{ admin: false, number_of_users: 10 }
			];

			const mockReports = [
				{
					plan_report_id: IdValueObject.create(1),
					template_id: IdValueObject.create(100),
					is_active: true
				}
			];

			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(mockCompanyPlan);
			planRepository.getPlanById.mockResolvedValue(mockPlan);
			planTypeRepository.getById.mockResolvedValue(mockPlanType);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);
			planReportsRepository.getByPlanTypeId.mockResolvedValue(mockReports);

			// Mock calculateExtraUserPrice method
			jest.spyOn(facade, 'calculateExtraUserPrice').mockResolvedValue(15);

			const result = await facade.getCompanyPlanDetails(1);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.planId).toBe(1);
				expect(result.planName).toBe('Test Plan');
				expect(result.companyPlanId).toBe(1);
				expect(result.baseAmount).toBe(100);
				expect(result.usageMetrics.adminUsers.current).toBe(2);
				expect(result.usageMetrics.adminUsers.limit).toBe(3);
				expect(result.usageMetrics.adminUsers.withinLimit).toBe(true);
				expect(result.usageMetrics.regularUsers.current).toBe(5);
				expect(result.usageMetrics.regularUsers.limit).toBe(10);
				expect(result.usageMetrics.regularUsers.withinLimit).toBe(true);
				expect(result.usageMetrics.totalUsers).toBe(7);
				expect(result.reports).toHaveLength(1);
				expect(result.reports[0].planReportId).toBe(1);
				expect(result.reports[0].templateId).toBe(100);
			}
		});

		it('should return error when no active plan found', async () => {
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(null);

			const result = await facade.getCompanyPlanDetails(1);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toContain('No active plan found');
		});
	});

	describe('getCompanyPlanCapacity', () => {
		it('should return plan capacity information', async () => {
			// Setup mocks
			const mockCompanyPlan = {
				company_plan_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1)
			};

			const mockPlan = {
				plan_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1)
			};

			const mockUsageMetrics = {
				admin_count: 2,
				regular_count: 8
			};

			const mockUserTypes = [
				{ admin: true, number_of_users: 5 },
				{ admin: false, number_of_users: 10 }
			];

			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(mockCompanyPlan);
			planRepository.getPlanById.mockResolvedValue(mockPlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);

			const result = await facade.getCompanyPlanCapacity(1);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.admins.current).toBe(2);
				expect(result.admins.limit).toBe(5);
				expect(result.admins.withinLimit).toBe(true);
				expect(result.admins.remaining).toBe(3);
				expect(result.regularUsers.current).toBe(8);
				expect(result.regularUsers.limit).toBe(10);
				expect(result.regularUsers.withinLimit).toBe(true);
				expect(result.regularUsers.remaining).toBe(2);
				expect(result.isWithinLimits).toBe(true);
			}
		});

		it('should handle over-limit scenarios', async () => {
			// Setup mocks for over-limit scenario
			const mockCompanyPlan = {
				company_plan_id: IdValueObject.create(1),
				plan_id: IdValueObject.create(1)
			};

			const mockPlan = {
				plan_id: IdValueObject.create(1),
				plan_type_id: IdValueObject.create(1)
			};

			const mockUsageMetrics = {
				admin_count: 6,
				regular_count: 12
			};

			const mockUserTypes = [
				{ admin: true, number_of_users: 5 },
				{ admin: false, number_of_users: 10 }
			];

			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(mockCompanyPlan);
			planRepository.getPlanById.mockResolvedValue(mockPlan);
			companyPlanUsageRepository.getUsageMetrics.mockResolvedValue(mockUsageMetrics);
			planUserTypeRepository.getByPlanTypeId.mockResolvedValue(mockUserTypes);

			const result = await facade.getCompanyPlanCapacity(1);

			expect(result).not.toBeInstanceOf(Error);
			if (!(result instanceof Error)) {
				expect(result.admins.current).toBe(6);
				expect(result.admins.limit).toBe(5);
				expect(result.admins.withinLimit).toBe(false);
				expect(result.admins.remaining).toBe(0);
				expect(result.regularUsers.current).toBe(12);
				expect(result.regularUsers.limit).toBe(10);
				expect(result.regularUsers.withinLimit).toBe(false);
				expect(result.regularUsers.remaining).toBe(0);
				expect(result.isWithinLimits).toBe(false);
			}
		});

		it('should return error when no active plan found', async () => {
			companyPlanRepository.getActiveByCompanyId.mockResolvedValue(null);

			const result = await facade.getCompanyPlanCapacity(1);

			expect(result).toBeInstanceOf(Error);
			expect((result as Error).message).toContain('No active plan found');
		});
	});

});