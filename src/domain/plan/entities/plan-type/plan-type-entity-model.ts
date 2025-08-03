import { IdValueObject } from "../../value-objects";
import { type PlanTypeDTO } from "./plan-type-dtos";

export class PlanTypeEntityModel {
    private constructor(
        public readonly planTypeId: IdValueObject,
        public readonly typeName: string,
        public readonly description: string,
        public readonly isActive: boolean
    ) {}

    static create({ planTypeId, typeName, description, isActive }: PlanTypeDTO): PlanTypeEntityModel {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) throw planTypeIdObj;

        if (!typeName || typeName.trim().length < 2) {
            throw new Error("Nome do tipo de plano deve ter pelo menos 2 caracteres");
        }

        return new PlanTypeEntityModel(
            planTypeIdObj,
            typeName.trim(),
            description || "",
            isActive !== undefined ? Boolean(isActive) : true
        );
    }

    getValues(): PlanTypeDTO {
        return {
            planTypeId: this.planTypeId.value,
            typeName: this.typeName,
            description: this.description,
            isActive: this.isActive
        };
    }
}
