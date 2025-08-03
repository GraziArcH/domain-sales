import { IdValueObject } from "../../value-objects";
import { type PlanDTO } from "./plan-dtos";

export class PlanEntityModel {
    private constructor(
        public readonly planId: IdValueObject,
        public readonly planName: string,
        public readonly description: string,
        public readonly defaultAmount: number,
        public readonly planDuration: "mensal" | "anual" | "trimestral" | "vitalicio",
        public readonly planTypeId: IdValueObject,
        public readonly createdAt: Date,
        public readonly updatedAt: Date
    ) {}

    static create({
        planId,
        planName,
        description,
        defaultAmount,
        planDuration,
        planTypeId,
        createdAt,
        updatedAt
    }: PlanDTO): PlanEntityModel {
        const planIdObj = IdValueObject.create(planId);
        if (planIdObj instanceof Error) throw planIdObj;

        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) throw planTypeIdObj;

        if (!planName || planName.trim().length < 3) {
            throw new Error("Nome do plano deve ter pelo menos 3 caracteres");
        }

        if (defaultAmount < 0) {
            throw new Error("Valor padrão do plano não pode ser negativo");
        }

        if (!["mensal", "anual", "trimestral", "vitalicio"].includes(planDuration)) {
            throw new Error("Duração do plano inválida");
        }

        return new PlanEntityModel(
            planIdObj,
            planName.trim(),
            description || "",
            defaultAmount,
            planDuration as "mensal" | "anual" | "trimestral" | "vitalicio",
            planTypeIdObj,
            createdAt || new Date(),
            updatedAt || new Date()
        );
    }

    getValues(): PlanDTO {
        return {
            planId: this.planId.value,
            planName: this.planName,
            description: this.description,
            defaultAmount: this.defaultAmount,
            planDuration: this.planDuration,
            planTypeId: this.planTypeId.value,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
