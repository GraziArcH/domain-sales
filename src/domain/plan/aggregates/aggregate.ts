import { IPlanRepository } from "../interfaces/database";
import { ICompanyPlanHistoryRepository } from "../interfaces/database/company-plan-history-repository";
import { ICompanyPlanRepository } from "../interfaces/database/company-plan-repository";
import { IPlanCancellationsRepository } from "../interfaces/database/plan-cancellations-repository";
import { IPlanReportsRepository } from "../interfaces/database/plan-reports-repository";
import { IPlanTypeRepository } from "../interfaces/database/plan-type-repository";
import { IPlanUserTypeRepository } from "../interfaces/database/plan-user-type-repository";
import { ICompanyPlanUsageRepository } from "../interfaces/database/company-plan-usage-repository";
import { IPlanUserOverrideRepository } from "../interfaces/database/plan-user-override-repository";
import { IdValueObject } from "../value-objects";
import { PlanAggregateModel } from "./aggregate-model";
import { PlanDuration, PlanListQueryParams, PublicPlanListResponse, PublicPlanSummary } from "../entities/public-plan";

export class PlanAggregate {
    constructor(
        protected readonly repository: IPlanRepository,
        protected readonly planTypeRepository: IPlanTypeRepository,
        protected readonly companyPlanRepository: ICompanyPlanRepository,
        protected readonly planUserTypeRepository: IPlanUserTypeRepository,
        protected readonly companyPlanHistoryRepository: ICompanyPlanHistoryRepository,
        protected readonly planCancellationsRepository: IPlanCancellationsRepository,
        protected readonly planReportsRepository: IPlanReportsRepository,
        protected readonly companyPlanUsageRepository: ICompanyPlanUsageRepository,
        protected readonly planUserOverrideRepository: IPlanUserOverrideRepository
    ) { }

    async create(
        planTypeId: string | number,
        planName: string,
        planDescription: string,
        defaultAmount: number,
        planDuration: "mensal" | "anual" | "trimestral" | "vitalicio"
    ) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        const planTypeExists = await this.planTypeRepository.getById(planTypeIdObj);
        if (!planTypeExists) return new Error("Esse tipo de plano não existe");

        const planModel = PlanAggregateModel.create(
            0, // Será gerado pelo banco
            planTypeId,
            planName,
            planDescription,
            defaultAmount,
            planDuration
        );

        if (planModel instanceof Error) return planModel;

        const plan = {
            plan_id: planModel.plan_id,
            plan_name: planModel.plan_name,
            description: planModel.description,
            default_amount: planModel.default_amount,
            plan_duration: planModel.plan_duration,
            plan_type_id: planModel.plan_type_id,
            created_at: new Date(),
            updated_at: new Date()
        };

        return await this.repository.create(plan);
    }

    async get(planId: string | number) {
        const planIdObj = IdValueObject.create(planId);
        if (planIdObj instanceof Error) return planIdObj;

        return await this.repository.getPlanById(planIdObj);
    }

    async getAll() {
        return await this.repository.getAll();
    }

    async update(
        planId: string | number,
        planTypeId: string | number,
        planName: string,
        planDescription: string,
        defaultAmount: number,
        planDuration: "mensal" | "anual" | "trimestral" | "vitalicio"
    ) {
        const planModel = PlanAggregateModel.create(
            planId,
            planTypeId,
            planName,
            planDescription,
            defaultAmount,
            planDuration
        );

        if (planModel instanceof Error) return planModel;

        const planExists = await this.repository.getPlanById(planModel.plan_id);
        if (!planExists) return new Error("Plano não existe");

        const plan = {
            plan_id: planModel.plan_id,
            plan_name: planModel.plan_name,
            description: planModel.description,
            default_amount: planModel.default_amount,
            plan_duration: planModel.plan_duration,
            plan_type_id: planModel.plan_type_id,
            created_at: planExists.created_at,
            updated_at: new Date()
        };

        return await this.repository.update(plan);
    }

    async createCompanyPlan(
        companyId: string | number,
        planId: string | number,
        amount: number,
        startDate: Date,
        endDate: Date,
        additionalUserAmount = 0
    ) {
        const companyIdObj = IdValueObject.create(companyId);
        if (companyIdObj instanceof Error) return companyIdObj;

        const planIdObj = IdValueObject.create(planId);
        if (planIdObj instanceof Error) return planIdObj;

        // Verificar se já existe um plano ativo para esta empresa
        const activePlan = await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
        if (activePlan) {
            return new Error("Esta empresa já possui um plano ativo");
        }

        // Verificar se o plano existe
        const planExists = await this.repository.getPlanById(planIdObj);
        if (!planExists) {
            return new Error("O plano especificado não existe");
        }

        // Validar datas
        if (startDate >= endDate) {
            return new Error("A data de término deve ser posterior à data de início");
        }

        const now = new Date();
        const companyPlan = {
            company_plan_id: IdValueObject.create(0) as IdValueObject,
            company_id: companyIdObj,
            plan_id: planIdObj,
            amount: amount,
            start_date: startDate,
            end_date: endDate,
            status: "active",
            additional_user_amount: additionalUserAmount,
            created_at: now,
            updated_at: now
        };

        return await this.companyPlanRepository.create(companyPlan);
    }

    async getCompanyActivePlan(companyId: string | number) {
        const companyIdObj = IdValueObject.create(companyId);
        if (companyIdObj instanceof Error) return companyIdObj;

        return await this.companyPlanRepository.getActiveByCompanyId(companyIdObj);
    }

    async cancelCompanyPlan(
        companyPlanId: string | number,
        cancelledByUserId: string | number,
        reason: string,
        details?: string
    ) {
        const companyPlanIdObj = IdValueObject.create(companyPlanId);
        if (companyPlanIdObj instanceof Error) return companyPlanIdObj;

        const userIdObj = IdValueObject.create(cancelledByUserId);
        if (userIdObj instanceof Error) return userIdObj;

        // Verificar se o plano existe e está ativo
        const plan = await this.companyPlanRepository.getById(companyPlanIdObj);
        if (!plan) {
            return new Error("Plano não encontrado");
        }

        if (plan.status !== "active") {
            return new Error("Apenas planos ativos podem ser cancelados");
        }

        // Criar registro de cancelamento
        const cancellation = {
            plan_cancellation_id: IdValueObject.create(0) as IdValueObject,
            company_plan_id: companyPlanIdObj,
            cancellation_reason: reason,
            cancelled_by_user_id: userIdObj,
            cancelled_at: new Date(), // Set to current time when cancellation is created
            created_at: new Date(),
            updated_at: new Date()
        };

        const cancellationResult = await this.planCancellationsRepository.create(cancellation);

        return cancellationResult;
    }

    async confirmCancelation(cancellationId: string | number, changedByUserId: string | number, changeReason: string) {
        const cancellationIdObj = IdValueObject.create(cancellationId);
        if (cancellationIdObj instanceof Error) return cancellationIdObj;

        const userIdObj = IdValueObject.create(changedByUserId);
        if (userIdObj instanceof Error) return userIdObj;

        // Verificar se o cancelamento existe
        const cancellation = await this.planCancellationsRepository.getById(cancellationIdObj);
        if (!cancellation) {
            return new Error("Solicitação de cancelamento não encontrada");
        }

        // Verificar se já foi processado (se cancelled_at já está preenchido)
        if (cancellation.cancelled_at) {
            return new Error("Esta solicitação de cancelamento já foi processada");
        }

        // Atualizar status do plano para cancelado
        await this.companyPlanRepository.updateStatus(cancellation.company_plan_id, "cancelled");

        // Registrar no histórico
        const companyPlan = await this.companyPlanRepository.getById(cancellation.company_plan_id);
        if (!companyPlan) {
            return new Error("Plano não encontrado");
        }

        const history = {
            history_id: IdValueObject.create(0) as IdValueObject,
            company_plan_id: companyPlan.company_plan_id,
            previous_plan_id: companyPlan.plan_id,
            new_plan_id: null, // No new plan since it's a cancellation
            change_type: "cancellation" as "cancellation" | "upgrade" | "downgrade" | "renewal",
            reason: changeReason || "Cancelamento confirmado",
            change_at: new Date(),
            changed_by_user_id: userIdObj,
            created_at: new Date()
        };

        await this.companyPlanHistoryRepository.create(history);

        return await this.planCancellationsRepository.getById(cancellationIdObj);
    }

    async createPlanUserType(
        planTypeId: string | number,
        admin: boolean,
        numberOfUsers: number,
        extraUserPrice: number
    ) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        const planTypeExists = await this.planTypeRepository.getById(planTypeIdObj);
        if (!planTypeExists) return new Error("Tipo de plano não encontrado");

        // Check if there's already a configuration for this plan type and admin setting
        const existingConfig = await this.planUserTypeRepository.getByPlanTypeIdAndAdmin(planTypeIdObj, admin);
        if (existingConfig)
            return new Error(`Já existe uma configuração de usuários para este tipo de plano com admin=${admin}`);

        // Validate number of users
        if (numberOfUsers <= 0) {
            return new Error("Número de usuários deve ser maior que zero");
        }

        // Validate extra user price
        if (extraUserPrice < 0) {
            return new Error("Preço por usuário extra não pode ser negativo");
        }

        const planUserType = {
            plan_user_type_id: IdValueObject.create(0) as IdValueObject,
            plan_type_id: planTypeIdObj,
            admin: admin,
            number_of_users: numberOfUsers,
            extra_user_price: extraUserPrice
        };

        return await this.planUserTypeRepository.create(planUserType);
    }

    async getPlanUserType(planUserTypeId: string | number) {
        const planUserTypeIdObj = IdValueObject.create(planUserTypeId);
        if (planUserTypeIdObj instanceof Error) return planUserTypeIdObj;

        return await this.planUserTypeRepository.getById(planUserTypeIdObj);
    }

    async getPlanUserTypeByPlanTypeAndAdmin(planTypeId: string | number, admin: boolean) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        return await this.planUserTypeRepository.getByPlanTypeIdAndAdmin(planTypeIdObj, admin);
    }

    async updatePlanUserType(
        planUserTypeId: string | number,
        planTypeId: string | number,
        admin: boolean,
        numberOfUsers: number,
        extraUserPrice: number
    ) {
        const planUserTypeIdObj = IdValueObject.create(planUserTypeId);
        if (planUserTypeIdObj instanceof Error) return planUserTypeIdObj;

        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        // Check if plan user type exists
        const planUserTypeExists = await this.planUserTypeRepository.getById(planUserTypeIdObj);
        if (!planUserTypeExists) return new Error("Configuração de usuários não encontrada");

        // Check if plan type exists
        const planTypeExists = await this.planTypeRepository.getById(planTypeIdObj);
        if (!planTypeExists) return new Error("Tipo de plano não encontrado");

        // Validate number of users
        if (numberOfUsers <= 0) {
            return new Error("Número de usuários deve ser maior que zero");
        }

        // Validate extra user price
        if (extraUserPrice < 0) {
            return new Error("Preço por usuário extra não pode ser negativo");
        }

        const planUserType = {
            plan_user_type_id: planUserTypeIdObj,
            plan_type_id: planTypeIdObj,
            admin: admin,
            number_of_users: numberOfUsers,
            extra_user_price: extraUserPrice
        };

        return await this.planUserTypeRepository.update(planUserType);
    }

    async deletePlanUserType(planUserTypeId: string | number) {
        const planUserTypeIdObj = IdValueObject.create(planUserTypeId);
        if (planUserTypeIdObj instanceof Error) return planUserTypeIdObj;

        return await this.planUserTypeRepository.delete(planUserTypeIdObj);
    }

    // Plan Type CRUD methods
    async createPlanType(typeName: string, description: string, isActive: boolean = true) {
        if (!typeName || typeName.trim().length < 2) {
            return new Error("Nome do tipo de plano deve ter pelo menos 2 caracteres");
        }

        const planType = {
            plan_type_id: IdValueObject.create(0) as IdValueObject,
            type_name: typeName.trim(),
            description: description || "",
            is_active: isActive
        };

        return await this.planTypeRepository.create(planType);
    }

    async getPlanType(planTypeId: string | number) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        return await this.planTypeRepository.getById(planTypeIdObj);
    }

    async getAllPlanTypes() {
        return await this.planTypeRepository.getAll();
    }

    async updatePlanType(planTypeId: string | number, typeName: string, description: string, isActive: boolean) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        if (!typeName || typeName.trim().length < 2) {
            return new Error("Nome do tipo de plano deve ter pelo menos 2 caracteres");
        }

        // Check if plan type exists
        const planTypeExists = await this.planTypeRepository.getById(planTypeIdObj);
        if (!planTypeExists) return new Error("Tipo de plano não encontrado");

        const planType = {
            plan_type_id: planTypeIdObj,
            type_name: typeName.trim(),
            description: description || "",
            is_active: isActive
        };

        return await this.planTypeRepository.update(planType);
    }

    async deletePlanType(planTypeId: string | number) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        return await this.planTypeRepository.delete(planTypeIdObj);
    }

    async addReportToPlanType(planTypeId: string | number, templateId: string | number) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        const templateIdObj = IdValueObject.create(templateId);
        if (templateIdObj instanceof Error) return templateIdObj;

        // Check if plan type exists
        const planTypeExists = await this.planTypeRepository.getById(planTypeIdObj);
        if (!planTypeExists) return new Error("Tipo de plano não encontrado");

        const planReport = {
            plan_report_id: IdValueObject.create(0) as IdValueObject,
            plan_type_id: planTypeIdObj,
            template_id: templateIdObj
        };

        return await this.planReportsRepository.create(planReport);
    }

    async getReportsByPlanType(planTypeId: string | number) {
        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        return await this.planReportsRepository.getByPlanTypeId(planTypeIdObj);
    }

    async updatePlanTypeReport(
        planReportId: string | number,
        planTypeId: string | number,
        templateId: string | number
    ) {
        const planReportIdObj = IdValueObject.create(planReportId);
        if (planReportIdObj instanceof Error) return planReportIdObj;

        const planTypeIdObj = IdValueObject.create(planTypeId);
        if (planTypeIdObj instanceof Error) return planTypeIdObj;

        const templateIdObj = IdValueObject.create(templateId);
        if (templateIdObj instanceof Error) return templateIdObj;

        const planReport = {
            plan_report_id: planReportIdObj,
            plan_type_id: planTypeIdObj,
            template_id: templateIdObj
        };

        return await this.planReportsRepository.update(planReport);
    }

    async deletePlanTypeReport(planReportId: string | number) {
        const planReportIdObj = IdValueObject.create(planReportId);
        if (planReportIdObj instanceof Error) return planReportIdObj;

        return await this.planReportsRepository.delete(planReportIdObj);
    }

    async getPublicPlanList(params: PlanListQueryParams): Promise<PublicPlanListResponse | Error> {
        try {
            const planRows = await this.repository.getPublicPlanList({
                limit: params.limit,
                offset: params.offset,
                planType: params.planType,
                duration: params.duration,
                maxAmount: params.maxAmount,
                minAmount: params.minAmount,
                active: params.active,
                sort: params.sort,
                order: params.order
            });

            const plans: PublicPlanSummary[] = planRows.map(row => ({
                planId: row.plan_id,
                planName: row.plan_name,
                description: row.plan_description || '',
                defaultAmount: Number(row.default_amount),
                planDuration: row.plan_duration as PlanDuration,
                planType: {
                    planTypeId: row.plan_type_id,
                    typeName: row.type_name,
                    description: row.plan_type_description || '',
                    isActive: row.plan_type_is_active || false
                },
                userLimits: {
                    adminUsers: row.admin_user_limit || 0,
                    commonUsers: row.regular_user_limit || 0
                },
                pricing: {
                    basePrice: Number(row.default_amount),
                    currency: 'BRL',
                    extraAdminUserPrice: Number(row.admin_extra_price || 0),
                    extraCommonUserPrice: Number(row.regular_extra_price || 0)
                }
            }));

            return {
                plans
            };
        } catch (error) {
            return error instanceof Error ? error : new Error('Failed to get public plan list');
        }
    }

    async getPublicPlanById(planId: string | number): Promise<PublicPlanSummary | null | Error> {
        try {
            const planIdObj = IdValueObject.create(planId);
            if (planIdObj instanceof Error) return planIdObj;

            const planRow = await this.repository.getPublicPlanById(planIdObj);

            if (!planRow) {
                return null;
            }

            // Use the same mapping logic as getPublicPlanList
            const plan: PublicPlanSummary = {
                planId: planRow.plan_id,
                planName: planRow.plan_name,
                description: planRow.plan_description || '',
                defaultAmount: Number(planRow.default_amount),
                planDuration: planRow.plan_duration as PlanDuration,
                planType: {
                    planTypeId: planRow.plan_type_id,
                    typeName: planRow.type_name,
                    description: planRow.plan_type_description || '',
                    isActive: planRow.plan_type_is_active || false
                },
                userLimits: {
                    adminUsers: planRow.admin_user_limit || 0,
                    commonUsers: planRow.regular_user_limit || 0
                },
                pricing: {
                    basePrice: Number(planRow.default_amount),
                    currency: 'BRL',
                    extraAdminUserPrice: Number(planRow.admin_extra_price || 0),
                    extraCommonUserPrice: Number(planRow.regular_extra_price || 0)
                }
            };

            return plan;
        } catch (error) {
            return error instanceof Error ? error : new Error('Failed to get public plan by ID');
        }
    }
}
