import { IdValueObject } from "../../value-objects";

export interface PlanUserType {
    plan_user_type_id: IdValueObject;
    plan_type_id: IdValueObject;
    admin: boolean; // Replaced user_id with admin boolean
    number_of_users: number;
    extra_user_price: number;
}

export interface IPlanUserTypeRepository {
    create(planUserType: PlanUserType): Promise<PlanUserType>;
    getById(planUserTypeId: IdValueObject): Promise<PlanUserType | null>;
    getByPlanTypeId(planTypeId: IdValueObject): Promise<PlanUserType[]>;
    getByPlanTypeIdAndAdmin(planTypeId: IdValueObject, isAdmin: boolean): Promise<PlanUserType | null>; // Updated method
    update(planUserType: PlanUserType): Promise<PlanUserType>;
    delete(planUserTypeId: IdValueObject): Promise<boolean>;
}
