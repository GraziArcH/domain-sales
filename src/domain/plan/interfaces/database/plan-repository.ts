import { IdValueObject } from "../../value-objects";

export interface Plan {
  plan_id: IdValueObject;
  plan_name: string;
  description: string;
  default_amount: number;
  plan_duration: "mensal" | "anual" | "trimestral" | "vitalicio"; // Added plan_duration ENUM field with proper type
  plan_type_id: IdValueObject;
  created_at: Date;
  updated_at: Date;
}

export interface PublicPlanQueryParams {
  getById?: IdValueObject; // Optional: Get plan by ID
  limit?: number;
  offset?: number;
  planType?: string;
  duration?: 'mensal' | 'anual' | 'trimestral' | 'vitalicio';
  maxAmount?: number;
  minAmount?: number;
  active?: boolean;
  sort?: string;
  order?: string;
}

export interface IPlanRepository {
  create(plan: Plan): Promise<Plan>;
  getPlanById(planId: IdValueObject): Promise<Plan | null>;
  getAll(): Promise<Plan[]>;
  update(plan: Plan): Promise<Plan>;
  getPublicPlanList(params: PublicPlanQueryParams): Promise<any[]>;
  getPublicPlanById(planId: IdValueObject): Promise<any | null>;
}
