import { IdValueObject } from "../../value-objects";
import { type PlanUserTypeDTO } from "./plan-user-type-dtos";

export class PlanUserTypeEntityModel {
    private constructor(
        public readonly planUserTypeId: IdValueObject,
        public readonly planTypeId: IdValueObject,
        public readonly admin: boolean,
        public readonly numberOfUsers: number,
        public readonly extraUserPrice: number
    ) {}

    static create({
        planUserTypeId,
        planTypeId,
        admin,
        numberOfUsers,
        extraUserPrice
    }: PlanUserTypeDTO): PlanUserTypeEntityModel {
        const planUserTypeIdObj = IdValueObject.create(planUserTypeId);
        if (planUserTypeIdObj instanceof Error) throw planUserTypeIdObj;

        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) throw planTypeIdObj;

        if (numberOfUsers <= 0) {
            throw new Error("Número de usuários deve ser maior que zero");
        }

        if (extraUserPrice < 0) {
            throw new Error("Preço por usuário extra não pode ser negativo");
        }

        return new PlanUserTypeEntityModel(
            planUserTypeIdObj,
            planTypeIdObj,
            Boolean(admin),
            numberOfUsers,
            extraUserPrice
        );
    }

    getValues(): PlanUserTypeDTO {
        return {
            planUserTypeId: this.planUserTypeId.value,
            planTypeId: this.planTypeId.value,
            admin: this.admin,
            numberOfUsers: this.numberOfUsers,
            extraUserPrice: this.extraUserPrice
        };
    }
}
