import { IUnitOfWork } from "@/application/framework";
import {
	IPlanRepository,
	IPlanTypeRepository,
	ICompanyPlanRepository,
	IPlanUserTypeRepository,
	ICompanyPlanHistoryRepository,
	IPlanCancellationsRepository,
	IPlanReportsRepository,
	ICompanyPlanUsageRepository,
	IPlanUserOverrideRepository,
	PlanUserOverride
} from "@/domain/plan/interfaces/database";
import { PlanAggregate } from "@/domain/plan/aggregates";
import { PlanEntity } from "@/domain/plan/entities/plan/plan-entity";
import { PlanTypeEntity } from "@/domain/plan/entities/plan-type/plan-type-entity";
import { PlanUserTypeEntity } from "@/domain/plan/entities/plan-user-type/plan-user-type-entity";
import { PlanCancellationEntity } from "@/domain/plan/entities/plan-cancellations/plan-cancellations-entity";
import { PlanReportEntity } from "@/domain/plan/entities/plan-reports/plan-reports-entity";
import { CompanyPlanUsageEntity } from "@/domain/plan/entities/company-plan-usage/company-plan-usage-entity";
import { IdValueObject } from "../../../domain/plan";
import { PlanListQueryParams, PublicPlanListResponse, PublicPlanSummary } from "../../../domain/plan/entities/public-plan";

// DTOs for new information retrieval methods
export interface CompanyPlanDetailsDTO {
	planId: number;
	planTypeId: number;
	planName: string;
	planDescription: string;
	companyPlanId: number;
	startDate: Date;
	endDate: Date;
	status: string;
	baseAmount: number;
	usageMetrics: {
		adminUsers: {
			current: number;
			limit: number;
			withinLimit: boolean;
			extraUserPrice: number;
			extraCost: number;
		};
		regularUsers: {
			current: number;
			limit: number;
			withinLimit: boolean;
			extraUserPrice: number;
			extraCost: number;
		};
		totalUsers: number;
		totalExtraCost: number;
		totalCost: number;
	};
	reports: Array<{
		planReportId: number;
		templateId: number;
	}>;
}

export interface PlanCapacityDTO {
	admins: {
		current: number;
		limit: number;
		withinLimit: boolean;
		remaining: number;
	};
	regularUsers: {
		current: number;
		limit: number;
		withinLimit: boolean;
		remaining: number;
	};
	isWithinLimits: boolean;
}

export class PlanFacade extends PlanAggregate {
	constructor(
		protected readonly planEntity: PlanEntity,
		protected readonly planTypeEntity: PlanTypeEntity,
		protected readonly planUserTypeEntity: PlanUserTypeEntity,
		protected readonly planCancellationEntity: PlanCancellationEntity,
		protected readonly planReportEntity: PlanReportEntity,
		protected readonly companyPlanUsageEntity: CompanyPlanUsageEntity,
		protected readonly repository: IPlanRepository,
		protected readonly planTypeRepository: IPlanTypeRepository,
		protected readonly companyPlanRepository: ICompanyPlanRepository,
		protected readonly planUserTypeRepository: IPlanUserTypeRepository,
		protected readonly companyPlanHistoryRepository: ICompanyPlanHistoryRepository,
		protected readonly planCancellationsRepository: IPlanCancellationsRepository,
		protected readonly planReportsRepository: IPlanReportsRepository,
		protected readonly companyPlanUsageRepository: ICompanyPlanUsageRepository,
		protected readonly planUserOverrideRepository: IPlanUserOverrideRepository,
		protected readonly unitOfWork: IUnitOfWork
	) {
		super(
			repository,
			planTypeRepository,
			companyPlanRepository,
			planUserTypeRepository,
			companyPlanHistoryRepository,
			planCancellationsRepository,
			planReportsRepository,
			companyPlanUsageRepository,
			planUserOverrideRepository
		);
	}
	/**
	 * Helper method to create IdValueObject consistently
	 * @param id The numeric ID
	 * @returns IdValueObject instance or Error
	 */
	protected createIdValueObject(id: string | number): IdValueObject | Error {
		return IdValueObject.create(id);
	}

	/**
	 * Creates a new plan template
	 *
	 * @param planTypeId - The plan type identifier (e.g., 1 for Basic, 2 for Premium)
	 * @param planName - Name of the plan (e.g., "Basic Monthly Plan")
	 * @param planDescription - Description of the plan features
	 * @param defaultAmount - Default price for the plan in decimal format (e.g., 99.99)
	 * @param planDuration - Plan billing cycle: 'mensal' | 'anual' | 'trimestral' | 'vitalicio'
	 * @returns Promise<PlanEntity | Error> - Created plan object or Error if creation fails
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.create(
	 *   1,
	 *   "Basic Monthly",
	 *   "Basic plan with essential features",
	 *   29.99,
	 *   'mensal'
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to create plan:', result.message);
	 * } else {
	 *   console.log('Plan created:', result.planId);
	 * }
	 * ```
	 *
	 * @remarks
	 * - All write operations are wrapped in database transactions
	 * - Requires userContext to be set for audit trail
	 */
	async create(
		planTypeId: number,
		planName: string,
		planDescription: string,
		defaultAmount: number,
		planDuration: "mensal" | "anual" | "trimestral" | "vitalicio"
	) {
		try {
			await this.unitOfWork.start();

			const response = await super.create(planTypeId, planName, planDescription, defaultAmount, planDuration);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Creates a new company plan subscription
	 *
	 * @param companyId - The company identifier
	 * @param planId - The plan template ID to subscribe to
	 * @param amount - Subscription amount for this company (can override default plan price)
	 * @param startDate - Plan start date (when subscription becomes active)
	 * @param endDate - Plan end date (when subscription expires)
	 * @param additionalUserAmount - Additional amount per extra user beyond plan limits (default: 0)
	 * @returns Promise<CompanyPlanEntity | Error> - Created company plan subscription or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.createCompanyPlan(
	 *   123,                    // companyId
	 *   1,                      // planId
	 *   199.99,                 // amount
	 *   new Date('2025-01-01'), // startDate
	 *   new Date('2025-12-31'), // endDate
	 *   25.00                   // additionalUserAmount
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to create company plan:', result.message);
	 * } else {
	 *   console.log('Company plan created:', result.companyPlanId);
	 * }
	 * ```
	 *
	 * @remarks
	 * - Creates audit trail entries automatically via database triggers
	 * - Requires userContext to be set for proper audit logging
	 * - Sets plan status to 'active' by default
	 */
	async createCompanyPlan(
		companyId: number,
		planId: number,
		amount: number,
		startDate: Date,
		endDate: Date,
		additionalUserAmount = 0
	) {
		try {
			await this.unitOfWork.start();

			const response = await super.createCompanyPlan(
				companyId,
				planId,
				amount,
				startDate,
				endDate,
				additionalUserAmount
			);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Initiates cancellation of a company plan
	 *
	 * @param companyPlanId - The company plan ID to cancel
	 * @param cancelledByUserId - ID of the user initiating the cancellation
	 * @param reason - Reason for cancellation (e.g., "Downgrade requested", "Payment issues")
	 * @param details - Additional cancellation details (optional)
	 * @returns Promise<PlanCancellationEntity | Error> - Cancellation record or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.cancelCompanyPlan(
	 *   456,                           // companyPlanId
	 *   789,                           // cancelledByUserId
	 *   "Customer requested downgrade", // reason
	 *   "Will switch to basic plan"     // details (optional)
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to cancel plan:', result.message);
	 * } else {
	 *   console.log('Cancellation initiated:', result.cancellationId);
	 * }
	 * ```
	 *
	 * @remarks
	 * - Creates a cancellation record but doesn't immediately cancel the plan
	 * - Use confirmCancelation() to actually execute the cancellation
	 * - Requires userContext for audit trail
	 */
	async cancelCompanyPlan(companyPlanId: number, cancelledByUserId: number, reason: string, details?: string) {
		try {
			await this.unitOfWork.start();

			const response = await super.cancelCompanyPlan(companyPlanId, cancelledByUserId, reason, details);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Confirms a previously initiated plan cancellation
	 *
	 * @param cancellationId - The cancellation ID to confirm
	 * @param changedByUserId - ID of the user confirming the cancellation
	 * @param changeReason - Reason for confirming the cancellation
	 * @returns Promise<PlanCancellationEntity | Error> - Updated cancellation record or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.confirmCancelation(
	 *   123,                    // cancellationId
	 *   456,                    // changedByUserId
	 *   "Approved by manager"   // changeReason
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to confirm cancellation:', result.message);
	 * } else {
	 *   console.log('Cancellation confirmed');
	 * }
	 * ```
	 *
	 * @remarks
	 * - Finalizes the cancellation process
	 * - Changes plan status and updates cancellation record
	 * - Creates audit trail entries
	 */
	async confirmCancelation(cancellationId: number, changedByUserId: number, changeReason: string) {
		try {
			await this.unitOfWork.start();

			const response = await super.confirmCancelation(cancellationId, changedByUserId, changeReason);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Retrieves all plan templates
	 *
	 * @returns Promise<PlanEntity[]> - Array of all plan templates
	 *
	 * @example
	 * ```typescript
	 * const plans = await planFacade.getAll();
	 * plans.forEach(plan => {
	 *   console.log(`Plan: ${plan.planName} - $${plan.defaultAmount}`);
	 * });
	 * ```
	 *
	 * @remarks
	 * - Read-only operation, no transaction required
	 * - Returns all plan templates regardless of status
	 */
	async getAll() {
		return await super.getAll();
	}

	/**
	 * Retrieves a specific plan template by ID
	 *
	 * @param planId - The plan ID to retrieve
	 * @returns Promise<PlanEntity | null> - Plan object or null if not found
	 *
	 * @example
	 * ```typescript
	 * const plan = await planFacade.getPlanById(1);
	 * if (plan) {
	 *   console.log(`Found plan: ${plan.planName}`);
	 * } else {
	 *   console.log('Plan not found');
	 * }
	 * ```
	 */
	async getPlanById(planId: number) {
		return await super.get(planId);
	}

	/**
	 * Retrieves the active plan for a company
	 *
	 * @param companyId - The company identifier
	 * @returns Promise<CompanyPlanEntity | null> - Active company plan or null if no active plan
	 *
	 * @example
	 * ```typescript
	 * const activePlan = await planFacade.getCompanyActivePlan(123);
	 * if (activePlan) {
	 *   console.log(`Active plan: ${activePlan.planName} - Status: ${activePlan.status}`);
	 * } else {
	 *   console.log('No active plan found for company');
	 * }
	 * ```
	 *
	 * @remarks
	 * - Only returns plans with status = 'active'
	 * - Each company can have only one active plan at a time
	 */
	async getCompanyActivePlan(companyId: number) {
		return await super.getCompanyActivePlan(companyId);
	}

	/**
	 * Associates a report template with a plan type
	 *
	 * @param planTypeId - The plan type identifier
	 * @param templateId - The report template ID to associate
	 * @returns Promise<PlanReportEntity | Error> - Created plan report association or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.addReportToPlanType(
	 *   1,     // planTypeId (e.g., Basic plan type)
	 *   5,     // templateId (e.g., Monthly report template)
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to add report:', result.message);
	 * } else {
	 *   console.log('Report added to plan type');
	 * }
	 * ```
	 */
	async addReportToPlanType(planTypeId: number, templateId: number) {
		try {
			await this.unitOfWork.start();

			const result = await super.addReportToPlanType(planTypeId, templateId);

			if (result instanceof Error) {
				await this.unitOfWork.rollback();
				return result;
			}

			await this.unitOfWork.commit();
			return result;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Retrieves all reports associated with a plan type
	 *
	 * @param planTypeId - The plan type identifier
	 * @returns Promise<PlanReportEntity[]> - Array of plan report associations
	 *
	 */
	async getReportsByPlanType(planTypeId: number) {
		return await super.getReportsByPlanType(planTypeId);
	}

	/**
	 * Updates a plan-report association
	 *
	 * @param planReportId - The plan report ID to update
	 * @param planTypeId - The plan type identifier
	 * @param templateId - The report template ID
	 * @returns Promise<PlanReportEntity | Error> - Updated plan report object or Error
	 */
	async updatePlanTypeReport(planReportId: number, planTypeId: number, templateId: number) {
		try {
			await this.unitOfWork.start();

			const result = await super.updatePlanTypeReport(planReportId, planTypeId, templateId);

			if (result instanceof Error) {
				await this.unitOfWork.rollback();
				return result;
			}

			await this.unitOfWork.commit();
			return result;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Removes a plan-report association
	 *
	 * @param planReportId - The plan report ID to delete
	 * @returns Promise<boolean | Error> - Boolean indicating success or Error
	 */
	async deletePlanTypeReport(planReportId: number) {
		try {
			await this.unitOfWork.start();

			const result = await super.deletePlanTypeReport(planReportId);

			if (result instanceof Error) {
				await this.unitOfWork.rollback();
				return result;
			}

			await this.unitOfWork.commit();
			return result;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Updates an existing plan template
	 *
	 * @param planId - The plan ID to update
	 * @param planTypeId - The plan type identifier
	 * @param planName - New name of the plan
	 * @param planDescription - New description of the plan
	 * @param defaultAmount - New default price for the plan
	 * @param planDuration - New plan duration
	 * @returns Promise<PlanEntity | Error> - Updated plan object or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.update(
	 *   1,                      // planId
	 *   1,                      // planTypeId
	 *   "Premium Monthly Plus", // planName
	 *   "Enhanced premium features", // planDescription
	 *   149.99,                 // defaultAmount
	 *   'mensal'                // planDuration
	 * );
	 * ```
	 */
	async update(
		planId: number,
		planTypeId: number,
		planName: string,
		planDescription: string,
		defaultAmount: number,
		planDuration: "mensal" | "anual" | "trimestral" | "vitalicio"
	) {
		try {
			await this.unitOfWork.start();

			const response = await super.update(
				planId,
				planTypeId,
				planName,
				planDescription,
				defaultAmount,
				planDuration
			);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Creates user type configuration for a plan type
	 *
	 * @param planTypeId - The plan type identifier
	 * @param admin - Whether this configuration is for admin users (true) or regular users (false)
	 * @param numberOfUsers - Maximum number of users allowed for this scope
	 * @param extraUserPrice - Price per additional user beyond the limit
	 * @returns Promise<PlanUserTypeEntity | Error> - Created plan user type object or Error
	 *
	 * @example
	 * ```typescript
	 * // Create admin user limit for Basic plan type
	 * const adminLimit = await planFacade.createPlanUserType(
	 *   1,     // planTypeId (Basic)
	 *   true,  // admin = true (for admin users)
	 *   2,     // numberOfUsers (max 2 admin users)
	 *   50.00  // extraUserPrice (additional admin costs $50)
	 * );
	 *
	 * // Create regular user limit for Basic plan type
	 * const regularLimit = await planFacade.createPlanUserType(
	 *   1,      // planTypeId (Basic)
	 *   false,  // admin = false (for regular users)
	 *   10,     // numberOfUsers (max 10 regular users)
	 *   15.00   // extraUserPrice (additional user costs $15)
	 * );
	 * ```
	 *
	 * @remarks
	 * - Each plan type should have separate configurations for admin and regular users
	 * - Used to enforce user limits and calculate additional user pricing
	 */
	// Plan Duration is now an enum in the plan entity
	// Plan User Type methods
	async createPlanUserType(planTypeId: number, admin: boolean, numberOfUsers: number, extraUserPrice: number) {
		try {
			await this.unitOfWork.start();

			const response = await super.createPlanUserType(planTypeId, admin, numberOfUsers, extraUserPrice);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Retrieves a specific plan user type configuration
	 *
	 * @param planUserTypeId - The plan user type ID
	 * @returns Promise<PlanUserTypeEntity | null> - Plan user type object or null if not found
	 */
	async getPlanUserType(planUserTypeId: number) {
		return await super.getPlanUserType(planUserTypeId);
	}

	/**
	 * Retrieves plan user type configuration by plan type and admin scope
	 *
	 * @param planTypeId - The plan type identifier
	 * @param admin - Whether to get admin (true) or regular user (false) configuration
	 * @returns Promise<PlanUserTypeEntity | null> - Plan user type object or null if not found
	 *
	 * @example
	 * ```typescript
	 * // Get admin user limits for Basic plan type
	 * const adminLimits = await planFacade.getPlanUserTypeByPlanTypeAndAdmin(1, true);
	 * if (adminLimits) {
	 *   console.log(`Admin limit: ${adminLimits.numberOfUsers} users`);
	 * }
	 *
	 * // Get regular user limits for Basic plan type
	 * const regularLimits = await planFacade.getPlanUserTypeByPlanTypeAndAdmin(1, false);
	 * ```
	 */
	async getPlanUserTypeByPlanTypeAndAdmin(planTypeId: number, admin: boolean) {
		return await super.getPlanUserTypeByPlanTypeAndAdmin(planTypeId, admin);
	}

	/**
	 * Updates an existing plan user type configuration
	 *
	 * @param planUserTypeId - The plan user type ID to update
	 * @param planTypeId - The plan type identifier
	 * @param admin - Whether this is for admin users
	 * @param numberOfUsers - New maximum number of users
	 * @param extraUserPrice - New price per additional user
	 * @returns Promise<PlanUserTypeEntity | Error> - Updated plan user type object or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.updatePlanUserType(
	 *   1,      // planUserTypeId
	 *   1,      // planTypeId
	 *   true,   // admin (updating admin user limits)
	 *   5,      // numberOfUsers (increase to 5 admins)
	 *   40.00   // extraUserPrice (reduce price to $40)
	 * );
	 * ```
	 */
	async updatePlanUserType(
		planUserTypeId: number,
		planTypeId: number,
		admin: boolean,
		numberOfUsers: number,
		extraUserPrice: number
	) {
		try {
			await this.unitOfWork.start();

			const response = await super.updatePlanUserType(
				planUserTypeId,
				planTypeId,
				admin,
				numberOfUsers,
				extraUserPrice
			);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Deletes a plan user type configuration
	 *
	 * @param planUserTypeId - The plan user type ID to delete
	 * @returns Promise<boolean | Error> - Boolean indicating success or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.deletePlanUserType(1);
	 * if (result instanceof Error) {
	 *   console.error('Failed to delete:', result.message);
	 * } else if (result === true) {
	 *   console.log('Plan user type deleted successfully');
	 * }
	 * ```
	 *
	 * @remarks
	 * - Use with caution as this affects user limit enforcement
	 * - Should only be done when no active company plans depend on this configuration
	 */
	async deletePlanUserType(planUserTypeId: number) {
		try {
			await this.unitOfWork.start();

			const response = await super.deletePlanUserType(planUserTypeId);

			if (response instanceof Error) {
				await this.unitOfWork.rollback();
				return response;
			}

			await this.unitOfWork.commit();
			return response;
		} catch (e) {
			await this.unitOfWork.rollback();
			throw e;
		}
	}

	/**
	 * Creates or updates a custom pricing override for a company plan
	 * Implements RN008 - Personalization by user scope
	 *
	 * @param companyPlanId - The company plan ID
	 * @param isAdmin - Whether this override is for admin or regular users
	 * @param extraUserPrice - Custom price per additional user
	 * @returns Promise<PlanUserOverrideEntity | Error> - Created or updated override record or Error
	 *
	 * @example
	 * ```typescript
	 * // Set custom pricing for additional admin users
	 * const adminOverride = await planFacade.createPlanUserOverride(
	 *   123,   // companyPlanId
	 *   true,  // isAdmin = true (for admin users)
	 *   75.00  // extraUserPrice (custom price for additional admins)
	 * );
	 *
	 * // Set custom pricing for additional regular users
	 * const regularOverride = await planFacade.createPlanUserOverride(
	 *   123,   // companyPlanId
	 *   false, // isAdmin = false (for regular users)
	 *   20.00  // extraUserPrice (custom price for additional users)
	 * );
	 * ```
	 *
	 * @remarks
	 * - If an override already exists for the same company plan and scope, it will be updated
	 * - Overrides have highest precedence in pricing calculations (RN009)
	 * - Use this for custom pricing agreements with specific companies
	 */
	async createPlanUserOverride(
		companyPlanId: number,
		isAdmin: boolean,
		extraUserPrice: number
	): Promise<PlanUserOverride | Error> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				const companyPlanIdObj = this.createIdValueObject(companyPlanId);
				if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

				// Check if company plan exists
				const companyPlan = await this.companyPlanRepository.getById(companyPlanIdObj);
				if (!companyPlan) {
					return new Error("Company plan not found");
				}

				// Check if an override already exists
				const existingOverride = await this.planUserOverrideRepository.getByCompanyPlanIdAndAdmin(
					companyPlanIdObj,
					isAdmin
				);

				if (existingOverride) {
					// Update existing override
					existingOverride.extra_user_price = extraUserPrice;
					existingOverride.updated_at = new Date();
					return await this.planUserOverrideRepository.update(existingOverride);
				} else {
					// Create new override
					const now = new Date();
					const overrideIdObj = IdValueObject.create(0);
					if (overrideIdObj instanceof Error) return overrideIdObj;

					const override = {
						plan_user_override_id: overrideIdObj,
						company_plan_id: companyPlanIdObj,
						admin: isAdmin,
						extra_user_price: extraUserPrice,
						created_at: now,
						updated_at: now
					};

					return await this.planUserOverrideRepository.create(override);
				}
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Deletes a pricing override
	 *
	 * @param overrideId - The override ID to delete
	 * @returns Promise<boolean | Error> - Boolean indicating success or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.deletePlanUserOverride(1);
	 * if (result instanceof Error) {
	 *   console.error('Failed to delete override:', result.message);
	 * } else if (result === true) {
	 *   console.log('Override deleted successfully');
	 * }
	 * ```
	 *
	 * @remarks
	 * - After deletion, pricing will fall back to plan defaults or additional amount
	 * - This affects future pricing calculations immediately
	 */
	async deletePlanUserOverride(overrideId: number): Promise<boolean | Error> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				const overrideIdObj = this.createIdValueObject(overrideId);
				if (overrideIdObj instanceof Error) return overrideIdObj;

				return await this.planUserOverrideRepository.delete(overrideIdObj);
			});
		} catch (error) {
			return error;
		}
	}
	/**
	 * Calculates extra user pricing based on precedence rules
	 * Implements RN009 - Pricing precedence order
	 *
	 * @param companyPlanId - The company plan ID
	 * @param isAdmin - Whether calculating for admin or regular users
	 * @param quantity - Number of additional users (optional, defaults to 1)
	 * @returns Promise<number | Error> - Total price for additional users or Error
	 *
	 * @example
	 * ```typescript
	 * // Calculate cost for 3 additional regular users
	 * const cost = await planFacade.calculateExtraUserPrice(
	 *   123,   // companyPlanId
	 *   false, // isAdmin = false (regular users)
	 *   3      // quantity = 3 users
	 * );
	 *
	 * if (cost instanceof Error) {
	 *   console.error('Calculation failed:', cost.message);
	 * } else {
	 *   console.log(`Total cost for 3 additional users: $${cost}`);
	 * }
	 * ```
	 *
	 * @remarks
	 * **Pricing Precedence (RN009):**
	 * 1. Scope-specific override (highest precedence)
	 * 2. Global additional amount in company plan
	 * 3. Standard price from plan_user_type (lowest precedence)
	 */
	async calculateExtraUserPrice(companyPlanId: number, isAdmin: boolean, quantity = 1): Promise<number | Error> {
		try {
			const companyPlanIdObj = this.createIdValueObject(companyPlanId);
			if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

			// 1. Check for scope-specific override (highest precedence)
			const override = await this.planUserOverrideRepository.getByCompanyPlanIdAndAdmin(
				companyPlanIdObj,
				isAdmin
			);

			if (override) {
				return override.extra_user_price * quantity;
			}

			// 2. Check for global additional amount in company plan
			const companyPlan = await this.companyPlanRepository.getById(companyPlanIdObj);
			if (!companyPlan) {
				return new Error("Company plan not found");
			}

			if (companyPlan.additional_user_amount > 0) {
				return companyPlan.additional_user_amount;
			}

			// 3. Use standard price from plan_user_type (lowest precedence)
			// First need to get the plan to obtain the plan_type_id
			const plan = await this.repository.getPlanById(companyPlan.plan_id);
			if (!plan) {
				return new Error("Plan not found");
			}

			const planUserType = await this.planUserTypeRepository.getByPlanTypeIdAndAdmin(plan.plan_type_id, isAdmin);

			if (!planUserType) {
				return new Error("Plan user type configuration not found");
			}

			return planUserType.extra_user_price * quantity;
		} catch (error) {
			return error;
		}
	}

	/**
	 * Adds a user to a company plan with validation against limits
	 * Implements RN011 - Validation of limits when adding users
	 *
	 * @param companyPlanId - The company plan ID
	 * @param userId - The user ID to add
	 * @param isAdmin - Whether the user is an admin
	 * @returns Promise<CompanyPlanUsageEntity | Error> - Created usage record or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.addUserToCompanyPlan(
	 *   123,   // companyPlanId
	 *   456,   // userId
	 *   false  // isAdmin = false (regular user)
	 * );
	 *
	 * if (result instanceof Error) {
	 *   console.error('Failed to add user:', result.message);
	 * } else {
	 *   console.log('User added to plan:', result.usageId);
	 * }
	 * ```
	 *
	 * @remarks
	 * - Automatically validates user limits before adding
	 * - Creates usage tracking record
	 * - Use canAddUserToPlan() to check limits before calling this method
	 * - Should be called from UserPlanIntegrationService for atomic operations
	 */
	async addUserToCompanyPlan(companyPlanId: number, userId: number, isAdmin: boolean): Promise<any> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				const companyPlanIdObj = IdValueObject.create(companyPlanId);
				if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

				const userIdObj = IdValueObject.create(userId);
				if (userIdObj instanceof Error) return userIdObj;

				// For usage_id, since it's auto-increment, we'll use 0
				const usageIdObj = IdValueObject.create(0);
				if (usageIdObj instanceof Error) return usageIdObj;

				// Check if company plan exists and is active
				const companyPlan = await this.companyPlanRepository.getById(companyPlanIdObj);
				if (!companyPlan) {
					return new Error("Company plan not found");
				}

				if (companyPlan.status !== "active") {
					return new Error("Cannot add user to inactive plan");
				}

				// Validate user limit before adding
				const canAddUser = await this.companyPlanUsageRepository.validateUserLimit(companyPlanIdObj, isAdmin);

				if (!canAddUser) {
					return new Error("Cannot add user: user limit exceeded for this plan");
				}

				// Create usage entry
				const now = new Date();
				const usage = {
					usage_id: usageIdObj,
					company_plan_id: companyPlanIdObj,
					user_id: userIdObj,
					admin: isAdmin,
					created_at: now,
					updated_at: now
				};

				return await this.companyPlanUsageRepository.create(usage);
			});
		} catch (error) {
			return error;
		}
	}
	/**
	 * Checks if a user can be added to a plan based on scope limits
	 * Use this before creating users in the User system
	 *
	 * @param companyPlanId - The company plan ID
	 * @param isAdmin - Whether checking for admin or regular user
	 * @returns Promise<boolean | Error> - Boolean indicating if user can be added, or Error
	 *
	 * @example
	 * ```typescript
	 * const canAdd = await planFacade.canAddUserToPlan(123, false);
	 * if (canAdd === true) {
	 *   // Proceed with user creation
	 *   console.log('User can be added to plan');
	 * } else if (canAdd instanceof Error) {
	 *   console.error('Error checking limits:', canAdd.message);
	 * } else {
	 *   console.log('Cannot add user: limit exceeded');
	 * }
	 * ```
	 *
	 * @remarks
	 * - Call this method before attempting to create users
	 * - Prevents exceeding plan user limits
	 * - Used by UserPlanIntegrationService for validation
	 */
	async canAddUserToPlan(companyPlanId: number, isAdmin: boolean): Promise<boolean | Error> {
		try {
			const companyPlanIdObj = IdValueObject.create(companyPlanId);
			if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

			// Check if company plan exists and is active
			const companyPlan = await this.companyPlanRepository.getById(companyPlanIdObj);
			if (!companyPlan) {
				return new Error("Company plan not found");
			}

			if (companyPlan.status !== "active") {
				return new Error("Cannot add user to inactive plan");
			}

			// Validate user limit
			return await this.companyPlanUsageRepository.validateUserLimit(companyPlanIdObj, isAdmin);
		} catch (error) {
			return error;
		}
	}

	/**
	 * Changes a user's scope (admin status) in the plan
	 * This should be called when changing a user's admin status in the User system
	 *
	 * @param companyId - The company identifier
	 * @param userId - The user ID to update
	 * @param newIsAdmin - New admin status
	 * @returns Promise<CompanyPlanUsageEntity | Error> - Updated usage record or Error
	 *
	 * @example
	 * ```typescript
	 * // Promote user to admin
	 * const result = await planFacade.changeUserScope(123, 456, true);
	 * if (result instanceof Error) {
	 *   console.error('Failed to promote user:', result.message);
	 * } else {
	 *   console.log('User promoted to admin');
	 * }
	 *
	 * // Demote admin to regular user
	 * const result2 = await planFacade.changeUserScope(123, 456, false);
	 * ```
	 *
	 * @remarks
	 * - Validates new scope against plan limits before changing
	 * - Automatically finds user's current usage record
	 * - Should be called from UserPlanIntegrationService for atomic DB operations
	 */
	async changeUserScope(companyId: number, userId: number, newIsAdmin: boolean): Promise<any> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				// 1. Find active company plan
				const companyIdObj = IdValueObject.create(companyId);
				if (companyIdObj instanceof Error) return companyIdObj;

				const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
				if (!activePlan) {
					return new Error("No active plan found for company");
				}

				const userIdObj = IdValueObject.create(userId);
				if (userIdObj instanceof Error) return userIdObj;

				// 2. Find current user scope in plan usage
				const currentUsage = await this.companyPlanUsageRepository.findUserInPlan(
					activePlan.company_plan_id,
					userIdObj
				);

				if (!currentUsage) {
					return new Error("User not found in plan");
				}

				// 3. Check if change is allowed based on plan limits
				const canChange = await this.companyPlanUsageRepository.canChangeUserScope(
					activePlan.company_plan_id,
					currentUsage.admin,
					newIsAdmin
				);

				if (!canChange) {
					return new Error("Cannot change user scope: admin limit would be exceeded");
				}

				// 4. Update usage record with new scope
				return await this.companyPlanUsageRepository.updateUserScope(currentUsage.usage_id, newIsAdmin);
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Synchronizes all company users with the active plan
	 * Useful when setting up a new company or recovering from inconsistencies
	 *
	 * @param companyId - The company ID
	 * @param users - Array of user objects from the User database with { user_Id, admin } properties
	 * @returns Promise<SyncResults | Error> - Synchronization results object with added, skipped, and errors arrays
	 *
	 * @example
	 * ```typescript
	 * const users = [
	 *   { user_Id: 1, admin: true },
	 *   { user_Id: 2, admin: false },
	 *   { user_Id: 3, admin: false }
	 * ];
	 *
	 * const result = await planFacade.syncCompanyUsers(123, users);
	 * if (result instanceof Error) {
	 *   console.error('Sync failed:', result.message);
	 * } else {
	 *   console.log(`Added: ${result.added.length}, Skipped: ${result.skipped.length}, Errors: ${result.errors.length}`);
	 * }
	 * ```
	 *
	 * @remarks
	 * - Validates all users against plan limits before creating usage records
	 * - Skips users already in the plan
	 * - Creates usage records in bulk for efficiency
	 * - Used by UserPlanIntegrationService.fullSyncCompany()
	 */
	async syncCompanyUsers(companyId: number, users: Array<{ user_Id: number; admin: boolean }>): Promise<any> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				// 1. Find active company plan
				const companyIdObj = IdValueObject.create(companyId);
				if (companyIdObj instanceof Error) return companyIdObj;

				const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
				if (!activePlan) {
					return new Error("No active plan found for company");
				}

				// 2. Get existing usage records
				const existingUsage = await this.companyPlanUsageRepository.getByCompanyPlanId(
					activePlan.company_plan_id
				);
				const existingUserIds = existingUsage.map((u) => u.user_id.value.toString());

				// 3. Process each user
				const now = new Date();
				const usagesToCreate = [];
				const results: any = {
					added: [],
					skipped: [],
					errors: []
				};

				for (const user of users) {
					const userIdObj = IdValueObject.create(user.user_Id);
					if (userIdObj instanceof Error) {
						results.errors.push({
							user_Id: user.user_Id,
							error: "Invalid user ID"
						});
						continue;
					}

					// Skip users already in the plan
					if (existingUserIds.includes(user.user_Id.toString())) {
						results.skipped.push(user.user_Id);
						continue;
					}

					// Create usage_id for new record
					const usageIdObj = IdValueObject.create(0);
					if (usageIdObj instanceof Error) {
						results.errors.push({
							user_Id: user.user_Id,
							error: "Failed to create usage ID"
						});
						continue;
					}

					usagesToCreate.push({
						usage_id: usageIdObj,
						company_plan_id: activePlan.company_plan_id,
						user_id: userIdObj,
						admin: user.admin,
						created_at: now,
						updated_at: now
					});
				}

				// 4. Validate limits
				const adminCount =
					existingUsage.filter((u) => u.admin).length + usagesToCreate.filter((u) => u.admin).length;
				const regularCount =
					existingUsage.filter((u) => !u.admin).length + usagesToCreate.filter((u) => !u.admin).length;

				// Get plan limits
				const plan = await this.planEntity.getById(activePlan.plan_id.value);
				if (!plan || plan instanceof Error) {
					return new Error("Could not retrieve plan details");
				}

				// Fetch user type limits
				const userTypesForPlanType = await this.planUserTypeRepository.getByPlanTypeId(plan.planTypeId);
				const adminLimit = userTypesForPlanType.find((ut) => ut.admin);
				const regularLimit = userTypesForPlanType.find((ut) => !ut.admin);
				if (adminLimit && adminCount > adminLimit.number_of_users) {
					return new Error(`Admin limit (${adminLimit.number_of_users}) would be exceeded (${adminCount})`);
				}

				if (regularLimit && regularCount > regularLimit.number_of_users) {
					return new Error(
						`Regular user limit (${regularLimit.number_of_users}) would be exceeded (${regularCount})`
					);
				}

				// 5. Create usage records in bulk
				if (usagesToCreate.length > 0) {
					const created = await this.companyPlanUsageRepository.bulkCreate(usagesToCreate);
					results.added = created.map((u) => u.user_id.value.toString());
				}

				return results;
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Removes a user from a company plan
	 * Should be called when a user is removed from a company in the User database
	 *
	 * @param companyPlanId - The company plan ID
	 * @param userId - The user ID to remove
	 * @returns Promise<boolean | Error> - Boolean indicating success or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.removeUserFromCompanyPlan(123, 456);
	 * if (result instanceof Error) {
	 *   console.error('Failed to remove user:', result.message);
	 * } else if (result === true) {
	 *   console.log('User removed from plan successfully');
	 * }
	 * ```
	 *
	 * @remarks
	 * - Finds and removes the user's usage record
	 * - Should be called from UserPlanIntegrationService for atomic operations
	 * - Does not affect the user record in the User database
	 */
	async removeUserFromCompanyPlan(companyPlanId: number, userId: number): Promise<any> {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				const companyPlanIdObj = IdValueObject.create(companyPlanId);
				if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

				const userIdObj = IdValueObject.create(userId);
				if (userIdObj instanceof Error) return userIdObj;

				// Find the usage record
				const usageRecord = await this.companyPlanUsageRepository.findUserInPlan(companyPlanIdObj, userIdObj);

				if (!usageRecord) {
					return new Error("User not found in plan");
				}

				// Delete the usage record
				return await this.companyPlanUsageRepository.removeUserFromPlan(usageRecord.usage_id);
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Validates that all users in a company are within the plan limits
	 * This is useful when checking if current users already exceed limits
	 * before allowing more users or scope changes
	 *
	 * @param companyId - The company ID
	 * @returns Promise<ValidationResults | Error> - Object with validation results for admin and regular users
	 *
	 * @example
	 * ```typescript
	 * const validation = await planFacade.validateAllUsersWithinLimits(123);
	 * if (validation instanceof Error) {
	 *   console.error('Validation failed:', validation.message);
	 * } else {
	 *   console.log(`Admin users: ${validation.admin.current}/${validation.admin.limit}`);
	 *   console.log(`Regular users: ${validation.regular.current}/${validation.regular.limit}`);
	 *   console.log(`Overall valid: ${validation.isValid}`);
	 * }
	 * ```
	 *
	 * @returns Object with structure:
	 * ```typescript
	 * {
	 *   admin: {
	 *     current: number,
	 *     limit: number,
	 *     withinLimit: boolean
	 *   },
	 *   regular: {
	 *     current: number,
	 *     limit: number,
	 *     withinLimit: boolean
	 *   },
	 *   isValid: boolean
	 * }
	 * ```
	 *
	 * @remarks
	 * - Checks current usage against plan type limits
	 * - Considers custom overrides for pricing (but not for limits)
	 * - Useful for plan migration scenarios
	 */
	async validateAllUsersWithinLimits(companyId: number): Promise<any> {
		try {
			const companyIdObj = IdValueObject.create(companyId);
			if (companyIdObj instanceof Error) return companyIdObj;

			// 1. Find active company plan
			const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
			if (!activePlan) {
				return new Error("No active plan found for company");
			}

			// 2. Get current usage metrics
			const usageMetrics = await this.companyPlanUsageRepository.getUsageMetrics(companyIdObj);
			if (usageMetrics instanceof Error) return usageMetrics;

			// 3. Get plan details
			const plan = await this.planEntity.getById(activePlan.plan_id.value);
			if (!plan || plan instanceof Error) {
				return new Error("Could not retrieve plan details");
			}

			// 4. Get user type limits
			const userTypesForPlanType = await this.planUserTypeRepository.getByPlanTypeId(plan.planTypeId);
			const adminLimit = userTypesForPlanType.find((ut) => ut.admin);
			const regularLimit = userTypesForPlanType.find((ut) => !ut.admin);

			// 7. Compare with current usage
			const adminLimitValue = adminLimit?.number_of_users || 0;
			const regularLimitValue = regularLimit?.number_of_users || 0;

			return {
				admin: {
					current: usageMetrics.admin_count || 0,
					limit: adminLimitValue,
					withinLimit: (usageMetrics.admin_count || 0) <= adminLimitValue
				},
				regular: {
					current: usageMetrics.regular_count || 0,
					limit: regularLimitValue,
					withinLimit: (usageMetrics.regular_count || 0) <= regularLimitValue
				},
				isValid:
					(usageMetrics.admin_count || 0) <= adminLimitValue &&
					(usageMetrics.regular_count || 0) <= regularLimitValue
			};
		} catch (error) {
			return error;
		}
	}

	/**
	 * Gets comprehensive plan information in a single call
	 * @param companyId The company identifier
	 * @returns Promise<CompanyPlanDetailsDTO | Error>
	 *
	 * @example
	 * ```typescript
	 * const details = await planFacade.getCompanyPlanDetails(123);
	 * if (!(details instanceof Error)) {
	 *   console.log(`Plan: ${details.planName}`);
	 *   console.log(`Total Users: ${details.usageMetrics.totalUsers}`);
	 *   console.log(`Total Cost: $${details.usageMetrics.totalCost}`);
	 *   console.log(`Admin Users: ${details.usageMetrics.adminUsers.current}/${details.usageMetrics.adminUsers.limit}`);
	 *   console.log(`Regular Users: ${details.usageMetrics.regularUsers.current}/${details.usageMetrics.regularUsers.limit}`);
	 * }
	 * ```
	 */
	async getCompanyPlanDetails(companyId: number): Promise<CompanyPlanDetailsDTO | Error> {
		try {
			// 1. Get active company plan
			const companyIdObj = IdValueObject.create(companyId);
			if (companyIdObj instanceof Error) return companyIdObj;

			const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
			if (!activePlan) {
				return new Error('No active plan found for company');
			}

			// 2. Get plan details
			const plan = await this.repository.getPlanById(activePlan.plan_id);
			if (!plan) {
				return new Error('Plan not found');
			}

			// 3. Get plan type details
			const planType = await this.planTypeRepository.getById(plan.plan_type_id);
			if (!planType) {
				return new Error('Plan type not found');
			}

			// 4. Get usage metrics
			const usageMetrics = await this.companyPlanUsageRepository.getUsageMetrics(companyIdObj);

			// 5. Get user type limits
			const userTypesForPlanType = await this.planUserTypeRepository.getByPlanTypeId(plan.plan_type_id);
			const adminLimit = userTypesForPlanType.find((ut) => ut.admin);
			const regularLimit = userTypesForPlanType.find((ut) => !ut.admin);

			// 6. Calculate pricing for extra users
			const adminExtraPrice = await this.calculateExtraUserPrice(activePlan.company_plan_id.value, true, 1);
			const regularExtraPrice = await this.calculateExtraUserPrice(activePlan.company_plan_id.value, false, 1);

			// 7. Calculate costs
			const adminCurrent = usageMetrics.admin_count || 0;
			const regularCurrent = usageMetrics.regular_count || 0;
			const adminLimitValue = adminLimit?.number_of_users || 0;
			const regularLimitValue = regularLimit?.number_of_users || 0;

			const adminExtraUsers = Math.max(0, adminCurrent - adminLimitValue);
			const regularExtraUsers = Math.max(0, regularCurrent - regularLimitValue);
			const adminExtraCost = adminExtraUsers * (typeof adminExtraPrice === 'number' ? adminExtraPrice : 0);
			const regularExtraCost = regularExtraUsers * (typeof regularExtraPrice === 'number' ? regularExtraPrice : 0);
			const totalExtraCost = adminExtraCost + regularExtraCost;
			const totalCost = activePlan.amount + totalExtraCost;

			// 8. Get reports
			const reports = await this.planReportsRepository.getByPlanTypeId(plan.plan_type_id);

			return {
				planId: plan.plan_id.value,
				planTypeId: plan.plan_type_id.value,
				planName: plan.plan_name,
				planDescription: plan.description,
				companyPlanId: activePlan.company_plan_id.value,
				startDate: activePlan.start_date,
				endDate: activePlan.end_date,
				status: activePlan.status,
				baseAmount: activePlan.amount,
				usageMetrics: {
					adminUsers: {
						current: adminCurrent,
						limit: adminLimitValue,
						withinLimit: adminCurrent <= adminLimitValue,
						extraUserPrice: typeof adminExtraPrice === 'number' ? adminExtraPrice : 0,
						extraCost: adminExtraCost
					},
					regularUsers: {
						current: regularCurrent,
						limit: regularLimitValue,
						withinLimit: regularCurrent <= regularLimitValue,
						extraUserPrice: typeof regularExtraPrice === 'number' ? regularExtraPrice : 0,
						extraCost: regularExtraCost
					},
					totalUsers: adminCurrent + regularCurrent,
					totalExtraCost,
					totalCost
				},
				reports: reports.map(report => ({
					planReportId: report.plan_report_id.value,
					templateId: report.template_id.value

				}))
			};
		} catch (error) {
			return error instanceof Error ? error : new Error('Failed to get company plan details');
		}
	}

	/**
	 * Gets remaining capacity for adding users
	 * @param companyId The company identifier
	 * @returns Promise<PlanCapacityDTO | Error>
	 */
	async getCompanyPlanCapacity(companyId: number): Promise<PlanCapacityDTO | Error> {
		try {
			// 1. Get active company plan
			const companyIdObj = IdValueObject.create(companyId);
			if (companyIdObj instanceof Error) return companyIdObj;

			const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
			if (!activePlan) {
				return new Error('No active plan found for company');
			}

			// 2. Get plan details
			const plan = await this.repository.getPlanById(activePlan.plan_id);
			if (!plan) {
				return new Error('Plan not found');
			}

			// 3. Get usage metrics
			const usageMetrics = await this.companyPlanUsageRepository.getUsageMetrics(companyIdObj);

			// 4. Get user type limits
			const userTypesForPlanType = await this.planUserTypeRepository.getByPlanTypeId(plan.plan_type_id);
			const adminLimit = userTypesForPlanType.find((ut) => ut.admin);
			const regularLimit = userTypesForPlanType.find((ut) => !ut.admin);

			// 5. Calculate capacity
			const adminCurrent = usageMetrics.admin_count || 0;
			const regularCurrent = usageMetrics.regular_count || 0;
			const adminLimitValue = adminLimit?.number_of_users || 0;
			const regularLimitValue = regularLimit?.number_of_users || 0;

			const adminRemaining = Math.max(0, adminLimitValue - adminCurrent);
			const regularRemaining = Math.max(0, regularLimitValue - regularCurrent);

			const adminWithinLimit = adminCurrent <= adminLimitValue;
			const regularWithinLimit = regularCurrent <= regularLimitValue;

			return {
				admins: {
					current: adminCurrent,
					limit: adminLimitValue,
					withinLimit: adminWithinLimit,
					remaining: adminRemaining
				},
				regularUsers: {
					current: regularCurrent,
					limit: regularLimitValue,
					withinLimit: regularWithinLimit,
					remaining: regularRemaining
				},
				isWithinLimits: adminWithinLimit && regularWithinLimit
			};
		} catch (error) {
			return error instanceof Error ? error : new Error('Failed to get company plan capacity');
		}
	}
	/**
	 * Retrieves all reports associated with a company's active plan
	 * @param companyId The company identifier
	 * @returns Promise<PlanReportEntity[] | Error>
	 *
	 *
	 * @remarks
	 * - Returns reports for the company's active plan type
	 * - Returns empty array if company has no active plan
	 * - Only active reports are typically used for generation
	 */
	async getCompanyPlanReports(companyId: number): Promise<any[] | Error> {
		try {
			// 1. Get company's active plan
			const companyIdObj = IdValueObject.create(companyId);
			if (companyIdObj instanceof Error) return companyIdObj;

			const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
			if (!activePlan) {
				return []; // Return empty array if no active plan
			}

			// 2. Get plan details to find plan type
			const plan = await this.repository.getPlanById(activePlan.plan_id);
			if (!plan) {
				return new Error('Plan not found');
			}

			// 3. Get reports for the plan type
			const reports = await this.planReportsRepository.getByPlanTypeId(plan.plan_type_id);

			// 4. Return mapped report entities
			return reports.map(report => ({
				planReportId: report.plan_report_id.value,
				planTypeId: report.plan_type_id.value,
				templateId: report.template_id.value
			}));
		} catch (error) {
			return error instanceof Error ? error : new Error('Failed to get company plan reports');
		}
	}

	/**
	 * Creates a new plan type
	 *
	 * @param typeName - The name of the plan type
	 * @param description - The description of the plan type
	 * @param isActive - Whether the plan type is active (default: true)
	 * @returns Promise<PlanTypeEntity | Error> - Created plan type object or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.createPlanType(
	 *   "Premium",              // typeName
	 *   "Premium plan features", // description
	 *   true                    // isActive
	 * );
	 * ```
	 */
	async createPlanType(typeName: string, description: string, isActive: boolean = true) {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				return await super.createPlanType(typeName, description, isActive);
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Gets a plan type by ID
	 *
	 * @param planTypeId - The plan type identifier
	 * @returns Promise<PlanTypeEntity | Error | null> - Plan type object, null if not found, or Error
	 *
	 * @example
	 * ```typescript
	 * const planType = await planFacade.getPlanType(1);
	 * ```
	 */
	async getPlanType(planTypeId: number) {
		try {
			return await super.getPlanType(planTypeId);
		} catch (error) {
			return error;
		}
	}

	/**
	 * Gets all plan types
	 *
	 * @returns Promise<PlanTypeEntity[] | Error> - Array of plan types or Error
	 *
	 * @example
	 * ```typescript
	 * const planTypes = await planFacade.getAllPlanTypes();
	 * ```
	 */
	async getAllPlanTypes() {
		try {
			return await super.getAllPlanTypes();
		} catch (error) {
			return error;
		}
	}

	/**
	 * Updates an existing plan type
	 *
	 * @param planTypeId - The plan type identifier
	 * @param typeName - The new name of the plan type
	 * @param description - The new description of the plan type
	 * @param isActive - Whether the plan type is active
	 * @returns Promise<PlanTypeEntity | Error> - Updated plan type object or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.updatePlanType(
	 *   1,                      // planTypeId
	 *   "Premium Plus",         // typeName
	 *   "Enhanced premium features", // description
	 *   true                    // isActive
	 * );
	 * ```
	 */
	async updatePlanType(planTypeId: number, typeName: string, description: string, isActive: boolean) {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				return await super.updatePlanType(planTypeId, typeName, description, isActive);
			});
		} catch (error) {
			return error;
		}
	}

	/**
	 * Deletes a plan type
	 *
	 * @param planTypeId - The plan type identifier
	 * @returns Promise<boolean | Error> - Boolean indicating success or Error
	 *
	 * @example
	 * ```typescript
	 * const result = await planFacade.deletePlanType(1);
	 * ```
	 */
	async deletePlanType(planTypeId: number) {
		try {
			return await this.unitOfWork.runTransaction(async () => {
				return await super.deletePlanType(planTypeId);
			});
		} catch (error) {
			return error;
		}
	}

	/**
 * Retrieves a paginated list of public plan summaries with comprehensive information
 * 
 * @param params - Query parameters for filtering, sorting, and pagination
 * @returns Promise<PublicPlanListResponse | Error> - List of plan summaries or Error
 * 
 * @example
 * ```typescript
 * const result = await planFacade.getPublicPlanList({
 *   limit: 10,
 *   offset: 0,
 *   planType: 'premium',
 *   duration: 'mensal',
 *   minAmount: 50,
 *   maxAmount: 500,
 *   active: true,
 *   sort: 'price',
 *   order: 'asc'
 * });
 * 
 * if (!(result instanceof Error)) {
 *   console.log(`Found ${result.plans.length} plans`);
 *   result.plans.forEach(plan => {
 *     console.log(`${plan.planName}: R$ ${plan.pricing.basePrice}`);
 *     console.log(`  Admin users: ${plan.userLimits.adminUsers}`);
 *     console.log(`  Common users: ${plan.userLimits.commonUsers}`);
 *   });
 * }
 * ```
 * 
 * @remarks
 * - Read-only operation, no transaction required
 * - Returns only plans with active plan types by default
 * - Pagination is enforced with a maximum limit of 100 records
 * - Includes complete pricing information including extra user costs
 * - Currency is hardcoded to 'BRL' (Brazilian Real)
 */
	async getPublicPlanList(params: PlanListQueryParams): Promise<PublicPlanListResponse | Error> {
		try {
			// Validate parameters
			if (params.limit && params.limit < 1) {
				return new Error('Limit must be greater than 0');
			}

			if (params.offset && params.offset < 0) {
				return new Error('Offset cannot be negative');
			}

			if (params.minAmount !== undefined && params.minAmount < 0) {
				return new Error('Minimum amount cannot be negative');
			}

			if (params.maxAmount !== undefined && params.maxAmount < 0) {
				return new Error('Maximum amount cannot be negative');
			}

			if (params.minAmount !== undefined && params.maxAmount !== undefined && params.minAmount > params.maxAmount) {
				return new Error('Minimum amount cannot be greater than maximum amount');
			}

			if (params.sort && !['price', 'name', 'created_at'].includes(params.sort)) {
				return new Error('Invalid sort field. Valid options are: price, name, created_at');
			}

			if (params.order && !['asc', 'desc'].includes(params.order.toLowerCase())) {
				return new Error('Invalid order direction. Valid options are: asc, desc');
			}

			if (params.duration && !['mensal', 'anual', 'trimestral', 'vitalicio'].includes(params.duration)) {
				return new Error('Invalid plan duration');
			}

			// No transaction needed for read-only operation
			return await super.getPublicPlanList(params);
		} catch (error) {
			return error instanceof Error ? error : new Error('Failed to get public plan list');
		}
	}

	/**
 * Retrieves a single public plan with comprehensive information
 * 
 * @param planId - The plan ID to retrieve
 * @returns Promise<PublicPlanSummary | null | Error> - Plan summary, null if not found, or Error
 * 
 * @example
 * ```typescript
 * const plan = await planFacade.getPublicPlanById(1);
 * 
 * if (plan instanceof Error) {
 *   console.error('Failed to get plan:', plan.message);
 * } else if (plan) {
 *   console.log(`Plan: ${plan.planName}`);
 *   console.log(`Price: R$ ${plan.pricing.basePrice}`);
 *   console.log(`Admin users limit: ${plan.userLimits.adminUsers}`);
 *   console.log(`Common users limit: ${plan.userLimits.commonUsers}`);
 * } else {
 *   console.log('Plan not found');
 * }
 * ```
 * 
 * @remarks
 * - Read-only operation, no transaction required
 * - Returns complete plan information including type, limits, and pricing
 * - Uses the same data structure as getPublicPlanList for consistency
 * - Returns null if plan doesn't exist
 */
	async getPublicPlanById(planId: number): Promise<PublicPlanSummary | null | Error> {
		try {
			return await super.getPublicPlanById(planId);
		} catch (error) {
			return error instanceof Error ? error : new Error('Failed to get public plan by ID');
		}
	}
}
