export interface IUserPlanIntegrationService {
    /**
     * Creates a new user in both systems atomically
     */
    createUserWithPlanValidation(
        companyId: string,
        userData: {
            name: string;
            surname: string;
            cpf?: string;
            email: string;
            admin: boolean;
            user_type_id: number;
        }
    ): Promise<any>;

    /**
     * Changes a user's admin status in both systems atomically
     */
    changeUserAdminStatus(userId: string, newIsAdmin: boolean): Promise<any>;

    /**
     * Removes a user from both systems atomically
     */
    removeUser(userId: string): Promise<any>;

    /**
     * Run a full synchronization between User DB and Plan system for a specific company
     */
    fullSyncCompany(companyId: string): Promise<any>;
}
