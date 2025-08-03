import { IdValueObject } from "../value-objects";

export class PlanAggregateModel {
    private constructor(
        public readonly plan_id: IdValueObject,
        public readonly plan_name: string,
        public readonly description: string,
        public readonly default_amount: number,
        public readonly plan_duration: "mensal" | "anual" | "trimestral" | "vitalicio",
        public readonly plan_type_id: IdValueObject,
        public readonly created_at: Date,
        public readonly updated_at: Date
    ) {}

    static create(
        plan_id: string | number,
        plan_type_id: string | number,
        plan_name: string,
        description: string,
        default_amount: number,
        plan_duration: "mensal" | "anual" | "trimestral" | "vitalicio",
        created_at?: Date,
        updated_at?: Date
    ) {
        const planIdOrError = IdValueObject.create(plan_id);
        if (planIdOrError instanceof Error) return planIdOrError;

        const planTypeIdOrError = IdValueObject.create(plan_type_id);
        if (planTypeIdOrError instanceof Error) return planTypeIdOrError;

        if (!plan_name || plan_name.trim().length < 3)
            return new Error("Nome do plano deve ter pelo menos 3 caracteres");

        if (default_amount < 0) return new Error("Valor padrão do plano não pode ser negativo");

        if (!["mensal", "anual", "trimestral", "vitalicio"].includes(plan_duration)) {
            return new Error("Duração do plano inválida");
        }

        return new PlanAggregateModel(
            planIdOrError,
            plan_name.trim(),
            description || "",
            default_amount,
            plan_duration,
            planTypeIdOrError,
            created_at || new Date(),
            updated_at || new Date()
        );
    }
}
