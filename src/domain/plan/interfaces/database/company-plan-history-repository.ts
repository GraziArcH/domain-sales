import { IdValueObject } from "../../value-objects";

export interface CompanyPlanHistory {
    history_id: IdValueObject;
    company_plan_id: IdValueObject; // Changed from company_id
    previous_plan_id: IdValueObject | null;
    new_plan_id: IdValueObject;
    change_type: "upgrade" | "downgrade" | "renewal" | "cancellation"; // Restricted enum values
    reason: string | null; // Changed from change_reason and made optional
    change_at: Date; // Changed from change_date
    changed_by_user_id: IdValueObject;
    created_at: Date; // Added created_at field
}

export interface ICompanyPlanHistoryRepository {
    create(history: CompanyPlanHistory): Promise<CompanyPlanHistory>;
    getByCompanyPlanId(companyPlanId: IdValueObject): Promise<CompanyPlanHistory[]>; // Changed from companyId
    getRecentByCompanyPlanId(companyPlanId: IdValueObject, limit?: number): Promise<CompanyPlanHistory[]>; // Changed from companyId
}
