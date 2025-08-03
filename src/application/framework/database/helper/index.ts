import ArchFramework from "versatus-arch-framework/src";
import { type QueryResult, type QueryResultRow } from "pg";
import type ArcHPgDb from "versatus-arch-framework/src/cross/ArcH-Postgres-Wrapper";
import CacheCore from "versatus-arch-framework/src/core/CacheCore";

export class DatabaseHelper {
    private readonly db: ArcHPgDb;

    constructor(databaseName: string) {
        this.db = ArchFramework.getPgInstance(databaseName);
    }

    async disconnect(): Promise<void> {
        await this.db.close();
    }

    async query(query: string, parameters?: unknown[]): Promise<QueryResult<QueryResultRow>> {
        return await this.db.query(query, parameters);
    }
}

export interface EventData {
    company_id?: string;
    plan_type_id?: string;
    plan_id?: string;
    [key: string]: any;
}

export const CACHE_KEYS = {
    PLANS_CATALOG: {
        key: "plans:catalog",
        ttl: 14400,
        description: "Catálogo completo de planos (4h)"
    },
    COMPANY_ACTIVE_PLAN: {
        key: "company:{company_id}:active_plan",
        ttl: 300,
        description: "Plano ativo de uma empresa (5min)"
    },
    PLAN_TYPE_USER_CONFIGS: {
        key: "plan_type:{plan_type_id}:user_configs",
        ttl: 7200,
        description: "Configurações de usuários por tipo de plano (2h)"
    },
    COMPANY_RECENT_HISTORY: {
        key: "company:{company_id}:recent_history",
        ttl: 1800,
        description: "Histórico recente de mudanças (30min)"
    },
    COMPANY_USAGE_METRICS: {
        key: "company:{company_id}:usage_metrics",
        ttl: 3600,
        description: "Métricas de uso agregadas (1h)"
    },
    COMPANY_CANCELLATIONS: {
        key: "company:{company_id}:cancellations",
        ttl: 3600,
        description: "Dados de cancelamentos (1h)"
    },
    PLAN_AVAILABLE_REPORTS: {
        key: "plan:{plan_id}:available_reports",
        ttl: 21600,
        description: "Relatórios disponíveis para um plano (6h)"
    }
};

export const EVENT_TYPES = {
    PLAN_CREATED: "plan.created",
    PLAN_UPDATED: "plan.updated",
    PLAN_DELETED: "plan.deleted",
    PLAN_TYPE_UPDATED: "plan_type.updated",
    PLAN_DURATION_CREATED: "plan_duration.created",
    PLAN_DURATION_UPDATED: "plan_duration.updated",
    PLAN_DURATION_DELETED: "plan_duration.deleted",
    PLAN_USER_TYPE_CREATED: "plan_user_type.created",
    PLAN_USER_TYPE_UPDATED: "plan_user_type.updated",
    PLAN_USER_TYPE_DELETED: "plan_user_type.deleted",
    COMPANY_PLAN_CREATED: "company_plan.created",
    COMPANY_PLAN_UPDATED: "company_plan.updated",
    COMPANY_PLAN_STATUS_CHANGED: "company_plan.status_changed",
    COMPANY_PLAN_HISTORY_CREATED: "company_plan_history.created",
    COMPANY_PLAN_USAGE_BULK_INSERT: "company_plan_usage.bulk_insert",
    PLAN_CANCELLATIONS_CREATED: "plan_cancellations.created",
    PLAN_CANCELLATIONS_STATUS_CHANGED: "plan_cancellations.status_changed",
    PLAN_REPORTS_CREATED: "plan_reports.created",
    PLAN_REPORTS_UPDATED: "plan_reports.updated",
    PLAN_REPORTS_DELETED: "plan_reports.deleted"
};

export class DatabaseCacheHelper {
    private client: CacheCore;
    private readonly EVENT_CACHE_INVALIDATION = {
        [EVENT_TYPES.PLAN_CREATED]: [CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_UPDATED]: [
            CACHE_KEYS.PLANS_CATALOG.key,
            "company:*:active_plan",
            "plan:{plan_id}:available_reports"
        ],
        [EVENT_TYPES.PLAN_DELETED]: [CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_TYPE_UPDATED]: [CACHE_KEYS.PLANS_CATALOG.key, "plan_type:{plan_type_id}:user_configs"],
        [EVENT_TYPES.PLAN_DURATION_CREATED]: [CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_DURATION_UPDATED]: [CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_DURATION_DELETED]: [CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_USER_TYPE_CREATED]: ["plan_type:{plan_type_id}:user_configs", CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_USER_TYPE_UPDATED]: ["plan_type:{plan_type_id}:user_configs", CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.PLAN_USER_TYPE_DELETED]: ["plan_type:{plan_type_id}:user_configs", CACHE_KEYS.PLANS_CATALOG.key],
        [EVENT_TYPES.COMPANY_PLAN_CREATED]: ["company:{company_id}:active_plan"],
        [EVENT_TYPES.COMPANY_PLAN_UPDATED]: ["company:{company_id}:active_plan", "company:{company_id}:usage_metrics"],
        [EVENT_TYPES.COMPANY_PLAN_STATUS_CHANGED]: ["company:{company_id}:active_plan"],
        [EVENT_TYPES.COMPANY_PLAN_HISTORY_CREATED]: ["company:{company_id}:recent_history"],
        [EVENT_TYPES.COMPANY_PLAN_USAGE_BULK_INSERT]: ["company:{company_id}:usage_metrics"],
        [EVENT_TYPES.PLAN_CANCELLATIONS_CREATED]: [
            "company:{company_id}:cancellations",
            "company:{company_id}:active_plan"
        ],
        [EVENT_TYPES.PLAN_CANCELLATIONS_STATUS_CHANGED]: ["company:{company_id}:cancellations"],
        [EVENT_TYPES.PLAN_REPORTS_CREATED]: ["plan:{plan_id}:available_reports"],
        [EVENT_TYPES.PLAN_REPORTS_UPDATED]: ["plan:{plan_id}:available_reports"],
        [EVENT_TYPES.PLAN_REPORTS_DELETED]: ["plan:{plan_id}:available_reports"]
    };

    constructor() {
        this.client = ArchFramework.getCacheInstance();
    }

    // Métodos base
    async set(key: string, value: string, expireIn = 3600): Promise<void> {
        return this.client.set(key, value, expireIn);
    }

    async get(key: string): Promise<string> {
        return this.client.getVal(key);
    }

    async getKeys(pattern = "*"): Promise<string[]> {
        return this.client.getKeys(pattern);
    }

    async del(key: string): Promise<void> {
        return this.client.del(key);
    }

    // Métodos específicos para planos
    async setCatalog(data: any): Promise<void> {
        return this.set(CACHE_KEYS.PLANS_CATALOG.key, JSON.stringify(data), CACHE_KEYS.PLANS_CATALOG.ttl);
    }

    async getCatalog(): Promise<any> {
        const result = await this.get(CACHE_KEYS.PLANS_CATALOG.key);
        return result ? JSON.parse(result) : null;
    }

    async setCompanyActivePlan(companyId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.COMPANY_ACTIVE_PLAN.key.replace("{company_id}", companyId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.COMPANY_ACTIVE_PLAN.ttl);
    }

    async getCompanyActivePlan(companyId: string): Promise<any> {
        const key = CACHE_KEYS.COMPANY_ACTIVE_PLAN.key.replace("{company_id}", companyId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    async setPlanTypeUserConfigs(planTypeId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.PLAN_TYPE_USER_CONFIGS.key.replace("{plan_type_id}", planTypeId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.PLAN_TYPE_USER_CONFIGS.ttl);
    }

    async getPlanTypeUserConfigs(planTypeId: string): Promise<any> {
        const key = CACHE_KEYS.PLAN_TYPE_USER_CONFIGS.key.replace("{plan_type_id}", planTypeId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    async setCompanyRecentHistory(companyId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.COMPANY_RECENT_HISTORY.key.replace("{company_id}", companyId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.COMPANY_RECENT_HISTORY.ttl);
    }

    async getCompanyRecentHistory(companyId: string): Promise<any> {
        const key = CACHE_KEYS.COMPANY_RECENT_HISTORY.key.replace("{company_id}", companyId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    async setCompanyUsageMetrics(companyId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.COMPANY_USAGE_METRICS.key.replace("{company_id}", companyId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.COMPANY_USAGE_METRICS.ttl);
    }

    async getCompanyUsageMetrics(companyId: string): Promise<any> {
        const key = CACHE_KEYS.COMPANY_USAGE_METRICS.key.replace("{company_id}", companyId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    async setCompanyCancellations(companyId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.COMPANY_CANCELLATIONS.key.replace("{company_id}", companyId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.COMPANY_CANCELLATIONS.ttl);
    }

    async getCompanyCancellations(companyId: string): Promise<any> {
        const key = CACHE_KEYS.COMPANY_CANCELLATIONS.key.replace("{company_id}", companyId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    async setPlanAvailableReports(planId: string, data: any): Promise<void> {
        const key = CACHE_KEYS.PLAN_AVAILABLE_REPORTS.key.replace("{plan_id}", planId);
        return this.set(key, JSON.stringify(data), CACHE_KEYS.PLAN_AVAILABLE_REPORTS.ttl);
    }

    async getPlanAvailableReports(planId: string): Promise<any> {
        const key = CACHE_KEYS.PLAN_AVAILABLE_REPORTS.key.replace("{plan_id}", planId);
        const result = await this.get(key);
        return result ? JSON.parse(result) : null;
    }

    // Sistema de invalidação de cache baseado em eventos
    async invalidateByEvent(eventName: string, eventData: EventData): Promise<void> {
        const cacheKeys = this.EVENT_CACHE_INVALIDATION[eventName] || [];

        for (const keyPattern of cacheKeys) {
            const actualKeys = await this.resolveKeyPatterns(keyPattern, eventData);

            for (const key of actualKeys) {
                await this.del(key);
            }
        }
    }

    private async resolveKeyPatterns(pattern: string, data: EventData): Promise<string[]> {
        if (pattern.includes("{company_id}") && data.company_id) {
            return [pattern.replace("{company_id}", data.company_id)];
        } else if (pattern.includes("{plan_type_id}") && data.plan_type_id) {
            return [pattern.replace("{plan_type_id}", data.plan_type_id)];
        } else if (pattern.includes("{plan_id}") && data.plan_id) {
            return [pattern.replace("{plan_id}", data.plan_id)];
        } else if (pattern.includes("*")) {
            // Buscar todas as chaves que correspondem ao padrão
            return await this.getKeys(pattern);
        } else {
            return [pattern];
        }
    }

    // Invalidação específica para sobrescrever preços
    async invalidatePriceOverrides(companyId: string, fieldChanged: string): Promise<void> {
        if (["amount", "additional_user_amount"].includes(fieldChanged)) {
            const activePlanKey = CACHE_KEYS.COMPANY_ACTIVE_PLAN.key.replace("{company_id}", companyId);
            await this.del(activePlanKey);

            // Forçar recálculo de métricas que incluem custos
            const usageMetricsKey = CACHE_KEYS.COMPANY_USAGE_METRICS.key.replace("{company_id}", companyId);
            await this.del(usageMetricsKey);
        }
    }
}
