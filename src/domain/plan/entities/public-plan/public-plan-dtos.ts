export type PlanDuration = 'mensal' | 'anual' | 'trimestral' | 'vitalicio';

export interface PlanListQueryParams {
    // Paginação (obrigatórios)
    limit?: number;          // Máximo de planos por página (padrão: 20, máximo: 100)
    offset?: number;         // Número de registros a pular (padrão: 0)

    // Filtros de negócio
    planType?: string;       // Tipo do plano: 'basic' | 'premium' | 'enterprise'
    duration?: PlanDuration; // Duração: 'mensal' | 'anual' | 'trimestral' | 'vitalicio'
    maxAmount?: number;      // Preço máximo (ex: 1000)
    minAmount?: number;      // Preço mínimo (ex: 100)

    // Filtros técnicos
    active?: boolean;        // Apenas planos ativos (padrão: true)

    // Ordenação
    sort?: string;          // Campo: 'price' | 'name' | 'created_at' (padrão: 'name')
    order?: string;         // Direção: 'asc' | 'desc' (padrão: 'asc')
}

export interface PublicPlanSummary {
    planId: number;                    // plan.plan_id
    planName: string;                  // plan.plan_name
    description: string;               // plan.description
    defaultAmount: number;             // plan.default_amount
    planDuration: PlanDuration;        // plan.plan_duration
    planType: {
        planTypeId: number;            // plan_type.plan_type_id
        typeName: string;              // plan_type.type_name
        description: string;           // plan_type.description
        isActive: boolean;             // plan_type.is_active
    };
    userLimits: {
        adminUsers: number;            // plan_user_type.number_of_users (admin=true)
        commonUsers: number;           // plan_user_type.number_of_users (admin=false)
    };
    pricing: {
        basePrice: number;             // plan.default_amount
        currency: string;              // 'BRL'
        extraAdminUserPrice: number;   // plan_user_type.extra_user_price (admin=true)
        extraCommonUserPrice: number;  // plan_user_type.extra_user_price (admin=false)
    };
}

export interface PublicPlanListResponse {
    plans: PublicPlanSummary[];
}