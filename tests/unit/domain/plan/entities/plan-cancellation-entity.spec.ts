import { PlanCancellationEntity } from "@/domain/plan/entities/plan-cancellations/plan-cancellations-entity";
import { IPlanCancellationsRepository } from "@/domain/plan/interfaces/database/plan-cancellations-repository";
import { IdValueObject } from "@/domain/plan/value-objects";

class PlanCancellationsRepositoryMock implements IPlanCancellationsRepository {
	private cancellations: any[] = [];
	private idCounter = 1;

	async create(cancellation: any): Promise<any> {
		const newCancellation = {
			...cancellation,
			plan_cancellation_id: IdValueObject.create(this.idCounter++) as IdValueObject,
			created_at: new Date(),
			updated_at: new Date()
		};
		this.cancellations.push(newCancellation);
		return newCancellation;
	}

	async getById(cancellationId: IdValueObject): Promise<any> {
		const cancellation = this.cancellations.find(c => c.plan_cancellation_id.value === cancellationId.value);
		return cancellation || null;
	}

	async getByCompanyPlanId(companyPlanId: IdValueObject): Promise<any[]> {
		return this.cancellations.filter(c => c.company_plan_id.value === companyPlanId.value);
	}
}

describe("PlanCancellationEntity", () => {
	let repository: PlanCancellationsRepositoryMock;
	let entity: PlanCancellationEntity;

	beforeEach(() => {
		repository = new PlanCancellationsRepositoryMock();
		entity = new PlanCancellationEntity(repository);
	});

	describe("getById", () => {
		it("should get a cancellation by id", async () => {
			// Create a cancellation first
			const createdCancellation = await repository.create({
				plan_cancellation_id: IdValueObject.create(0) as IdValueObject,
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				cancellation_reason: "Test Reason",
				cancelled_at: new Date(),
				cancelled_by_user_id: IdValueObject.create(2) as IdValueObject,
				created_at: new Date(),
				updated_at: new Date()
			});

			// Get by id
			const result = await entity.getById(createdCancellation.plan_cancellation_id.value);

			expect(result).toBeDefined();
			expect(result?.planCancellationId.value).toBe(createdCancellation.plan_cancellation_id.value);
			expect(result?.cancellationReason).toBe("Test Reason");
		});

		it("should return null for non-existent cancellation id", async () => {
			const result = await entity.getById(999);
			expect(result).toBeNull();
		});
	});

	describe("getByCompanyPlanId", () => {
		it("should get cancellations by company plan id", async () => {
			// Create some cancellations
			await repository.create({
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				cancellation_reason: "Reason 1",
				cancelled_at: new Date(),
				cancelled_by_user_id: IdValueObject.create(2) as IdValueObject,
				created_at: new Date(),
				updated_at: new Date()
			});

			await repository.create({
				company_plan_id: IdValueObject.create(1) as IdValueObject,
				cancellation_reason: "Reason 2",
				cancelled_at: new Date(),
				cancelled_by_user_id: IdValueObject.create(3) as IdValueObject,
				created_at: new Date(),
				updated_at: new Date()
			});

			await repository.create({
				company_plan_id: IdValueObject.create(2) as IdValueObject,
				cancellation_reason: "Different Plan",
				cancelled_at: new Date(),
				cancelled_by_user_id: IdValueObject.create(2) as IdValueObject,
				created_at: new Date(),
				updated_at: new Date()
			});

			// Get by company plan id
			const results = await entity.getByCompanyPlanId(1);

			expect(results).toHaveLength(2);
			expect(results[0].companyPlanId.value).toBe(1);
			expect(results[1].companyPlanId.value).toBe(1);
		});
	});

	describe("create", () => {
		it("should create a new cancellation", async () => {
			const data = {
				companyPlanId: 1,
				cancellationReason: "New Cancellation",
				cancelledAt: new Date(),
				cancelledByUserId: 2
			};

			const result = await entity.create(data);

			expect(result).toBeDefined();
			expect(result.planCancellationId.value).toBe(1);
			expect(result.companyPlanId.value).toBe(data.companyPlanId);
			expect(result.cancellationReason).toBe(data.cancellationReason);
			expect(result.cancelledByUserId.value).toBe(data.cancelledByUserId);
		});

		it("should throw error if cancellation reason is empty", async () => {
			const data = {
				companyPlanId: 1,
				cancellationReason: "", // Empty reason
				cancelledAt: new Date(),
				cancelledByUserId: 2
			};

			await expect(entity.create(data)).rejects.toThrow("Motivo do cancelamento é obrigatório");
		});
	});
});
