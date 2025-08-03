import {
    CompanyPlanHistoryRepository,
    CompanyPlanRepository,
    CompanyPlanUsageRepository,
    DatabaseCacheHelper,
    DatabaseHelper,
    PlanCancellationsRepository,
    PlanRepository,
    PlanReportsRepository,
    PlanUserTypeRepository,
    PlanUserOverrideRepository,
    UnitOfWork
} from "../framework";

import { PlanFacade } from "../facade";
import { UserPlanIntegrationService } from "../services";
import { PlanTypeRepository } from "../framework/database/repositories/plan/plan-type-repository";
import {
    PlanEntity,
    PlanTypeEntity,
    PlanUserTypeEntity,
    PlanCancellationEntity,
    PlanReportEntity,
    CompanyPlanUsageEntity
} from "@/domain/plan/entities";

// Framework
export const databaseHelper = new DatabaseHelper("plan_configuration"); // For plan-related database queries
export const userDatabaseHelper = new DatabaseHelper("user"); // For user database queries
export const databaseCacheHelper = new DatabaseCacheHelper();
export const unitOfWork = () => new UnitOfWork(databaseHelper);

// Plan Domain Repositories
export const planTypeRepository = new PlanTypeRepository(databaseHelper);
export const planRepository = new PlanRepository(databaseHelper, databaseCacheHelper);
// PlanDurationsRepository removed as it's no longer needed
export const planUserTypeRepository = new PlanUserTypeRepository(databaseHelper);
export const companyPlanRepository = new CompanyPlanRepository(databaseHelper, databaseCacheHelper);
export const companyPlanUsageRepository = new CompanyPlanUsageRepository(databaseHelper, databaseCacheHelper);
export const companyPlanHistoryRepository = new CompanyPlanHistoryRepository(databaseHelper);
export const planCancellationsRepository = new PlanCancellationsRepository(databaseHelper);
export const planReportsRepository = new PlanReportsRepository(databaseHelper);
export const planUserOverrideRepository = new PlanUserOverrideRepository(databaseHelper); // Assuming this is the correct repository for overrides

// Plan Domain Entities
export const planEntity = new PlanEntity(planRepository);
export const planTypeEntity = new PlanTypeEntity(planTypeRepository);
export const planUserTypeEntity = new PlanUserTypeEntity(planUserTypeRepository);
export const planCancellationEntity = new PlanCancellationEntity(planCancellationsRepository);
export const planReportEntity = new PlanReportEntity(planReportsRepository);
export const companyPlanUsageEntity = new CompanyPlanUsageEntity(companyPlanUsageRepository);

// Plan Domain Facade
export const planFacade = new PlanFacade(
    planEntity,
    planTypeEntity,
    planUserTypeEntity,
    planCancellationEntity,
    planReportEntity,
    companyPlanUsageEntity,
    planRepository,
    planTypeRepository,
    companyPlanRepository,
    planUserTypeRepository,
    companyPlanHistoryRepository,
    planCancellationsRepository,
    planReportsRepository,
    companyPlanUsageRepository,
    planUserOverrideRepository,
    unitOfWork()
);

// Integration Services
export const userPlanIntegrationService = new UserPlanIntegrationService(
    planFacade,
    userDatabaseHelper // Using the user database connection specifically
);
