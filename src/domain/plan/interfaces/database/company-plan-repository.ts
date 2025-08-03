import { IdValueObject } from "../../value-objects";

export interface CompanyPlan {
    company_plan_id: IdValueObject;
    company_id: IdValueObject;
    plan_id: IdValueObject;
    // plan_duration_id removed as it's now part of the plan table
    amount: number;
    start_date: Date;
    end_date: Date;
    status: string;
    additional_user_amount: number;
    created_at: Date; // Added created_at field
    updated_at: Date; // Added updated_at field
}

export interface ICompanyPlanRepository {
    create(companyPlan: CompanyPlan): Promise<CompanyPlan>;
    getById(companyPlanId: IdValueObject): Promise<CompanyPlan | null>;
    getActiveByCompanyId(companyId: IdValueObject): Promise<CompanyPlan | null>;
    getHistoryByCompanyId(companyId: IdValueObject): Promise<CompanyPlan[]>;
    update(companyPlan: CompanyPlan): Promise<CompanyPlan>;
    updateStatus(companyPlanId: IdValueObject, status: string): Promise<CompanyPlan>;
}
