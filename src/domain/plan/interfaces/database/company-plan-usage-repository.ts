import { IdValueObject } from "../../value-objects";

export interface CompanyPlanUsage {
    usage_id: IdValueObject;
    company_plan_id: IdValueObject;
    user_id: IdValueObject;
    admin: boolean; // Added admin field to track user scope
    created_at: Date;
    updated_at: Date; // Added updated_at field
}

export interface ICompanyPlanUsageRepository {
    create(usage: CompanyPlanUsage): Promise<CompanyPlanUsage>;
    bulkCreate(usages: CompanyPlanUsage[]): Promise<CompanyPlanUsage[]>;
    getByCompanyPlanId(companyPlanId: IdValueObject): Promise<CompanyPlanUsage[]>;
    getUsageMetrics(companyId: IdValueObject): Promise<any>;

    /**
     * Counts the number of users by scope (admin/common) for a specific company plan
     */
    countUsersByScope(companyPlanId: IdValueObject, isAdmin: boolean): Promise<number>;

    /**
     * Validates if a user can be added to a company plan based on scope limits
     * @return true if the user can be added, false if limits are reached
     */
    validateUserLimit(companyPlanId: IdValueObject, isAdmin: boolean): Promise<boolean>;

    /**
     * Synchronizes company plan usage with the current state of users in the company
     * This is useful when integrating with the existing User database
     */
    syncWithUserDatabase(companyId: IdValueObject, companyPlanId: IdValueObject): Promise<CompanyPlanUsage[]>;

    /**
     * Updates the scope (admin status) of a user in the company plan usage
     */
    updateUserScope(usageId: IdValueObject, isAdmin: boolean): Promise<CompanyPlanUsage | null>;

    /**
     * Checks if changing a user's scope would exceed plan limits
     */
    canChangeUserScope(companyPlanId: IdValueObject, currentIsAdmin: boolean, newIsAdmin: boolean): Promise<boolean>;

    /**
     * Find a user's usage record in a company plan
     */
    findUserInPlan(companyPlanId: IdValueObject, userId: IdValueObject): Promise<CompanyPlanUsage | null>;

    /**
     * Removes a user from a company plan
     */
    removeUserFromPlan(usageId: IdValueObject): Promise<boolean>;
}
