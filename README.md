# Domain Sales - Plan Management Library

This library provides a comprehensive solution for managing company plans, user limits, and pricing overrides with atomic operations and audit trails.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [User Context Requirements](#user-context-requirements)
- [PlanFacade Methods](#planfacade-methods)
- [UserPlanIntegrationService Methods](#userplanintegrationservice-methods)
- [Installation & Setup](#installation--setup)
- [Usage Examples](#usage-examples)

## Architecture Overview

The library follows Domain-Driven Design (DDD) principles with:

- **PlanFacade**: Main entry point for plan operations with transaction management
- **UserPlanIntegrationService**: Handles atomic operations between User database and Plan system
- **Unit of Work**: Manages database transactions and user context
- **Database Triggers**: Automatic audit trail for plan changes

## User Context Requirements

### Why User Context is Critical

The library requires **user context** to be provided through the API for several important reasons:

#### 1. **Audit Trail Requirements**

All write operations automatically create audit trail entries that track:

- **Who** made the change (requires user ID)
- **When** the change was made (automatic timestamp)
- **What** was changed (automatic field tracking)
- **Why** the change was made (change reason/context)

#### 2. **Compliance and Governance**

- **Regulatory Compliance**: Many industries require complete audit trails
- **Data Governance**: Track all plan and user modifications
- **Security Auditing**: Monitor who performs sensitive operations

#### 3. **Business Intelligence**

- **Usage Analytics**: Track which users create/modify plans
- **Performance Metrics**: Measure user productivity and system usage
- **Operational Insights**: Identify patterns in plan management

#### 4. **Automatic Database Triggers**

Database triggers automatically populate audit fields:

```sql
-- Example trigger behavior
created_by_user_id = userContext.userId
updated_by_user_id = userContext.userId
created_at = NOW()
updated_at = NOW()
```

### How to Provide User Context

The user context should be set at the API level before calling any facade methods:

```typescript
// Example: Setting user context in API middleware
app.use((req, res, next) => {
	const userId = req.user.id; // From authentication
	const userRole = req.user.role;

	// Set context in Unit of Work or dependency injection
	unitOfWork.setUserContext({
		userId: userId,
		userRole: userRole,
		requestId: req.id,
		timestamp: new Date()
	});

	next();
});

// Usage in API endpoint
app.post("/api/plans", async (req, res) => {
	// User context is already set by middleware
	const result = await planFacade.create(
		req.body.planTypeId,
		req.body.planName,
		req.body.planDescription,
		req.body.defaultAmount,
		req.body.planDuration
	);

	if (result instanceof Error) {
		return res.status(400).json({ error: result.message });
	}

	res.json(result);
});
```

### What Happens Without User Context

If user context is not provided:

- **Audit trail will be incomplete** (missing user identification)
- **Compliance requirements may not be met**
- **Database triggers may fail** or insert null values
- **System may reject operations** depending on configuration

## PlanFacade Methods

The `PlanFacade` class is the primary interface for all plan-related operations. All methods that modify data are wrapped in database transactions and require user context for audit trails.

### Plan Template Management

#### `create(planTypeId: number, planName: string, planDescription: string, defaultAmount: number, planDuration: 'mensal' | 'anual' | 'trimestral' | 'vitalicio')`

Creates a new plan template.

**Parameters:**

- `planTypeId`: The plan type identifier (e.g., 1 for Basic, 2 for Premium)
- `planName`: Name of the plan (e.g., "Basic Monthly Plan")
- `planDescription`: Description of the plan features
- `defaultAmount`: Default price for the plan in decimal format (e.g., 99.99)
- `planDuration`: Plan billing cycle: 'mensal' | 'anual' | 'trimestral' | 'vitalicio'

**Returns:** `Promise<PlanEntity | Error>` - Created plan object or Error if creation fails

**Example:**

```typescript
const result = await planFacade.create(1, "Basic Monthly", "Basic plan with essential features", 29.99, "mensal");

if (result instanceof Error) {
	console.error("Failed to create plan:", result.message);
} else {
	console.log("Plan created:", result.planId);
}
```

**Important:** Requires userContext to be set for audit trail.

#### `update(planId: number, planTypeId: number, planName: string, planDescription: string, defaultAmount: number, planDuration: 'mensal' | 'anual' | 'trimestral' | 'vitalicio')`

Updates an existing plan template.

**Parameters:**

- `planId`: The plan ID to update
- `planTypeId`: The plan type identifier
- `planName`: New name of the plan
- `planDescription`: New description of the plan
- `defaultAmount`: New default price for the plan
- `planDuration`: New plan duration

**Returns:** `Promise<PlanEntity | Error>` - Updated plan object or Error

#### `getAll()`

Retrieves all plan templates.

**Returns:** `Promise<PlanEntity[]>` - Array of all plan templates

**Note:** Read-only operation, no transaction or user context required.

#### `getPlanById(planId: number)`

Retrieves a specific plan template by ID.

**Parameters:**

- `planId`: The plan ID to retrieve

**Returns:** `Promise<PlanEntity | null>` - Plan object or null if not found

### Company Plan Management

#### `createCompanyPlan(companyId: number, planId: number, amount: number, startDate: Date, endDate: Date, additionalUserAmount: number = 0)`

Creates a new company plan subscription.

**Parameters:**

- `companyId`: The company identifier
- `planId`: The plan template ID to subscribe to
- `amount`: Subscription amount for this company (can override default plan price)
- `startDate`: Plan start date (when subscription becomes active)
- `endDate`: Plan end date (when subscription expires)
- `additionalUserAmount`: Additional amount per extra user beyond plan limits (default: 0)

**Returns:** `Promise<CompanyPlanEntity | Error>` - Created company plan subscription or Error

**Example:**

```typescript
const result = await planFacade.createCompanyPlan(
	123, // companyId
	1, // planId
	199.99, // amount
	new Date("2025-01-01"), // startDate
	new Date("2025-12-31"), // endDate
	25.0 // additionalUserAmount
);

if (result instanceof Error) {
	console.error("Failed to create company plan:", result.message);
} else {
	console.log("Company plan created:", result.companyPlanId);
}
```

**Important:** Creates audit trail entries automatically via database triggers.

#### `getCompanyActivePlan(companyId: number)`

Retrieves the active plan for a company.

**Parameters:**

- `companyId`: The company identifier

**Returns:** `Promise<CompanyPlanEntity | null>` - Active company plan or null if no active plan

**Example:**

```typescript
const activePlan = await planFacade.getCompanyActivePlan(123);
if (activePlan) {
	console.log(`Active plan: ${activePlan.planName} - Status: ${activePlan.status}`);
} else {
	console.log("No active plan found for company");
}
```

**Note:** Only returns plans with status = 'active'. Each company can have only one active plan at a time.

#### `getCompanyPlanDetails(companyId: number)`

Gets comprehensive plan information in a single call.

**Parameters:**

- `companyId`: The company identifier

**Returns:** `Promise<CompanyPlanDetailsDTO | Error>` - Comprehensive plan details object or Error

**Example:**

```typescript
const details = await planFacade.getCompanyPlanDetails(123);
if (!(details instanceof Error)) {
	console.log(`Plan: ${details.planName}`);
	console.log(`Total Users: ${details.usageMetrics.totalUsers}`);
	console.log(`Total Cost: $${details.usageMetrics.totalCost}`);
	console.log(`Admin Users: ${details.usageMetrics.adminUsers.current}/${details.usageMetrics.adminUsers.limit}`);
	console.log(
		`Regular Users: ${details.usageMetrics.regularUsers.current}/${details.usageMetrics.regularUsers.limit}`
	);

	// Check if within limits
	if (details.usageMetrics.adminUsers.withinLimit && details.usageMetrics.regularUsers.withinLimit) {
		console.log("All users are within plan limits");
	} else {
		console.log(`Extra costs: $${details.usageMetrics.totalExtraCost}`);
	}

	// List available reports
	details.reports.forEach((report) => {
		console.log(`Report ${report.templateId}: active`);
	});
} else {
	console.error("Failed to get plan details:", details.message);
}
```

**Returns object structure:**

```typescript
{
  planId: number,
  planTypeId: number,
  planName: string,
  planDescription: string,
  companyPlanId: number,
  startDate: Date,
  endDate: Date,
  status: string,
  baseAmount: number,
  usageMetrics: {
    adminUsers: {
      current: number,
      limit: number,
      withinLimit: boolean,
      extraUserPrice: number,
      extraCost: number
    },
    regularUsers: {
      current: number,
      limit: number,
      withinLimit: boolean,
      extraUserPrice: number,
      extraCost: number
    },
    totalUsers: number,
    totalExtraCost: number,
    totalCost: number
  },
  reports: Array<{
    planReportId: number,
    templateId: number,
  }>
}
```

**Use Cases:**

- Dashboard displays showing complete plan overview
- Billing calculations and cost breakdowns
- User management interfaces showing capacity usage
- Report generation with current plan status
- Customer support tools requiring full plan context

#### `getCompanyPlanCapacity(companyId: number)`

Gets remaining capacity for adding users to the plan.

**Parameters:**

- `companyId`: The company identifier

**Returns:** `Promise<PlanCapacityDTO | Error>` - Plan capacity information or Error

**Example:**

```typescript
const capacity = await planFacade.getCompanyPlanCapacity(123);
if (!(capacity instanceof Error)) {
	console.log(
		`Admin Capacity: ${capacity.admins.current}/${capacity.admins.limit} (${capacity.admins.remaining} remaining)`
	);
	console.log(
		`Regular User Capacity: ${capacity.regularUsers.current}/${capacity.regularUsers.limit} (${capacity.regularUsers.remaining} remaining)`
	);

	if (capacity.isWithinLimits) {
		console.log("✅ Company is within all plan limits");
	} else {
		console.log("⚠️ Company has exceeded plan limits");
	}

	// Check if specific user types can be added
	if (capacity.admins.remaining > 0) {
		console.log(`Can add ${capacity.admins.remaining} more admin users`);
	} else {
		console.log("Cannot add more admin users without upgrading");
	}

	if (capacity.regularUsers.remaining > 0) {
		console.log(`Can add ${capacity.regularUsers.remaining} more regular users`);
	} else {
		console.log("Cannot add more regular users without extra charges");
	}
} else {
	console.error("Failed to get capacity info:", capacity.message);
}
```

**Returns object structure:**

```typescript
{
  admins: {
    current: number,
    limit: number,
    withinLimit: boolean,
    remaining: number
  },
  regularUsers: {
    current: number,
    limit: number,
    withinLimit: boolean,
    remaining: number
  },
  isWithinLimits: boolean
}
```

**Use Cases:**

- Pre-validation before user creation attempts
- User interface elements showing available slots
- Automated alerts when approaching limits
- Integration with user invitation systems
- Capacity planning and upgrade recommendations

#### `getCompanyPlanReports(companyId: number)`

Retrieves all reports associated with a company's active plan.

**Parameters:**

- `companyId`: The company identifier

**Returns:** `Promise<PlanReportEntity[] | Error>` - Array of plan report objects or Error

**Example:**

```typescript
const reports = await planFacade.getCompanyPlanReports(123);
if (!(reports instanceof Error)) {
	if (reports.length === 0) {
		console.log("No reports available for this company");
	} else {
		console.log(`Found ${reports.length} reports for company plan:`);

		reports.forEach((report) => {
			console.log(`- Report Template ID: ${report.templateId}`);
			console.log(`  Plan Report ID: ${report.planReportId}`);
			console.log(`  Plan Type ID: ${report.planTypeId}`);
		});

		console.log(`Total reports available: ${reports.length}`);
	}
} else {
	console.error("Failed to get reports:", reports.message);
}
```

**Returns object structure:**

```typescript
Array<{
	planReportId: number;
	planTypeId: number;
	templateId: number;
}>;
```

**Use Cases:**

- Report generation interfaces showing available templates
- Dashboard widgets displaying company-specific reports
- Automated report scheduling based on plan features
- Customer portal showing accessible reports
- Integration with business intelligence tools

**Important Notes:**

- Returns reports for the company's active plan type
- Returns empty array if company has no active plan
- All reports for the plan type are returned
- Report templates are shared across all companies with the same plan type

#### `cancelCompanyPlan(companyPlanId: number, cancelledByUserId: number, reason: string, details?: string)`

Initiates cancellation of a company plan.

**Parameters:**

- `companyPlanId`: The company plan ID to cancel
- `cancelledByUserId`: ID of the user initiating the cancellation
- `reason`: Reason for cancellation (e.g., "Downgrade requested", "Payment issues")
- `details`: Additional cancellation details (optional)

**Returns:** `Promise<PlanCancellationEntity | Error>` - Cancellation record or Error

**Example:**

```typescript
const result = await planFacade.cancelCompanyPlan(
	456, // companyPlanId
	789, // cancelledByUserId
	"Customer requested downgrade", // reason
	"Will switch to basic plan" // details (optional)
);

if (result instanceof Error) {
	console.error("Failed to cancel plan:", result.message);
} else {
	console.log("Cancellation initiated:", result.cancellationId);
}
```

**Important:** Creates a cancellation record but doesn't immediately cancel the plan. Use `confirmCancelation()` to actually execute the cancellation.

#### `confirmCancelation(cancellationId: number, changedByUserId: number, changeReason: string)`

Confirms a previously initiated plan cancellation.

**Parameters:**

- `cancellationId`: The cancellation ID to confirm
- `changedByUserId`: ID of the user confirming the cancellation
- `changeReason`: Reason for confirming the cancellation

**Returns:** `Promise<PlanCancellationEntity | Error>` - Updated cancellation record or Error

### Plan Type Management

#### `createPlanType(typeName: string, description: string, isActive: boolean = true)`

Creates a new plan type.

**Parameters:**

- `typeName`: The name of the plan type
- `description`: The description of the plan type
- `isActive`: Whether the plan type is active (default: true)

**Returns:** `Promise<PlanTypeEntity | Error>` - Created plan type object or Error

**Example:**

```typescript
const result = await planFacade.createPlanType(
	"Premium", // typeName
	"Premium plan features", // description
	true // isActive
);

if (result instanceof Error) {
	console.error("Failed to create plan type:", result.message);
} else {
	console.log("Plan type created:", result.planTypeId);
}
```

**Important:** Requires userContext to be set for audit trail.

#### `getPlanType(planTypeId: number)`

Gets a plan type by ID.

**Parameters:**

- `planTypeId`: The plan type identifier

**Returns:** `Promise<PlanTypeEntity | Error | null>` - Plan type object, null if not found, or Error

**Example:**

```typescript
const planType = await planFacade.getPlanType(1);
if (planType && !(planType instanceof Error)) {
	console.log(`Plan Type: ${planType.typeName} - Active: ${planType.isActive}`);
} else if (planType instanceof Error) {
	console.error("Error getting plan type:", planType.message);
} else {
	console.log("Plan type not found");
}
```

#### `getAllPlanTypes()`

Gets all plan types.

**Returns:** `Promise<PlanTypeEntity[] | Error>` - Array of plan types or Error

**Example:**

```typescript
const planTypes = await planFacade.getAllPlanTypes();
if (!(planTypes instanceof Error)) {
	planTypes.forEach((planType) => {
		console.log(`${planType.typeName}: ${planType.description}`);
	});
} else {
	console.error("Failed to get plan types:", planTypes.message);
}
```

**Note:** Read-only operation, no transaction or user context required.

#### `updatePlanType(planTypeId: number, typeName: string, description: string, isActive: boolean)`

Updates an existing plan type.

**Parameters:**

- `planTypeId`: The plan type identifier
- `typeName`: The new name of the plan type
- `description`: The new description of the plan type
- `isActive`: Whether the plan type is active

**Returns:** `Promise<PlanTypeEntity | Error>` - Updated plan type object or Error

**Example:**

```typescript
const result = await planFacade.updatePlanType(
	1, // planTypeId
	"Premium Plus", // typeName
	"Enhanced premium features", // description
	true // isActive
);

if (result instanceof Error) {
	console.error("Failed to update plan type:", result.message);
} else {
	console.log("Plan type updated successfully");
}
```

**Important:** Requires userContext to be set for audit trail.

#### `deletePlanType(planTypeId: number)`

Deletes a plan type.

**Parameters:**

- `planTypeId`: The plan type identifier

**Returns:** `Promise<boolean | Error>` - Boolean indicating success or Error

**Example:**

```typescript
const result = await planFacade.deletePlanType(1);
if (result instanceof Error) {
	console.error("Failed to delete plan type:", result.message);
} else if (result === true) {
	console.log("Plan type deleted successfully");
}
```

**Warning:** Use with caution as this affects all plans and configurations that depend on this plan type. Ensure no active company plans are using this plan type before deletion.

### Plan Report Management

#### `addReportToPlanType(planTypeId: number, templateId: number)`

Associates a report template with a plan type.

**Parameters:**

- `planTypeId`: The plan type identifier
- `templateId`: The report template ID to associate

**Returns:** `Promise<PlanReportEntity | Error>` - Created plan report association or Error

**Example:**

```typescript
const result = await planFacade.addReportToPlanType(
	1, // planTypeId (e.g., Basic plan type)
	5 // templateId (e.g., Monthly report template)
);

if (result instanceof Error) {
	console.error("Failed to add report:", result.message);
} else {
	console.log("Report added to plan type");
}
```

**Important:** Requires userContext to be set for audit trail.

#### `getReportsByPlanType(planTypeId: number)`

Retrieves all reports associated with a plan type.

**Parameters:**

- `planTypeId`: The plan type identifier

**Returns:** `Promise<PlanReportEntity[]>` - Array of plan report associations

**Example:**

```typescript
const reports = await planFacade.getReportsByPlanType(1);
reports.forEach((report) => {
	console.log(`Report ID: ${report.planReportId}, Template: ${report.templateId}`);
});
```

**Note:** Read-only operation, no transaction or user context required.

#### `updatePlanTypeReport(planReportId: number, planTypeId: number, templateId: number)`

Updates a plan-report association.

**Parameters:**

- `planReportId`: The plan report ID to update
- `planTypeId`: The plan type identifier
- `templateId`: The report template ID

**Returns:** `Promise<PlanReportEntity | Error>` - Updated plan report object or Error

**Example:**

```typescript
const result = await planFacade.updatePlanTypeReport(
	1, // planReportId
	1, // planTypeId
	10 // new templateId
);

if (result instanceof Error) {
	console.error("Failed to update report:", result.message);
} else {
	console.log("Report association updated");
}
```

**Important:** Requires userContext to be set for audit trail.

#### `deletePlanTypeReport(planReportId: number)`

Removes a plan-report association.

**Parameters:**

- `planReportId`: The plan report ID to delete

**Returns:** `Promise<boolean | Error>` - Boolean indicating success or Error

**Example:**

```typescript
const result = await planFacade.deletePlanTypeReport(1);
if (result instanceof Error) {
	console.error("Failed to delete report:", result.message);
} else if (result === true) {
	console.log("Report association removed");
}
```

**Important:** This only removes the association between the plan type and the report template. The report template itself is not deleted.

### Plan User Type Management

#### `createPlanUserType(planTypeId: number, admin: boolean, numberOfUsers: number, extraUserPrice: number)`

Creates user type configuration for a plan type.

**Parameters:**

- `planTypeId`: The plan type identifier
- `admin`: Whether this configuration is for admin users (true) or regular users (false)
- `numberOfUsers`: Maximum number of users allowed for this scope
- `extraUserPrice`: Price per additional user beyond the limit

**Returns:** `Promise<PlanUserTypeEntity | Error>` - Created plan user type object or Error

**Example:**

```typescript
// Create admin user limit for Basic plan type
const adminLimit = await planFacade.createPlanUserType(
	1, // planTypeId (Basic)
	true, // admin = true (for admin users)
	2, // numberOfUsers (max 2 admin users)
	50.0 // extraUserPrice (additional admin costs $50)
);

// Create regular user limit for Basic plan type
const regularLimit = await planFacade.createPlanUserType(
	1, // planTypeId (Basic)
	false, // admin = false (for regular users)
	10, // numberOfUsers (max 10 regular users)
	15.0 // extraUserPrice (additional user costs $15)
);
```

**Important:** Each plan type should have separate configurations for admin and regular users. Used to enforce user limits and calculate additional user pricing.

#### `getPlanUserTypeByPlanTypeAndAdmin(planTypeId: number, admin: boolean)`

Retrieves plan user type configuration by plan type and admin scope.

**Parameters:**

- `planTypeId`: The plan type identifier
- `admin`: Whether to get admin (true) or regular user (false) configuration

**Returns:** `Promise<PlanUserTypeEntity | null>` - Plan user type object or null if not found

#### `updatePlanUserType(planUserTypeId: number, planTypeId: number, admin: boolean, numberOfUsers: number, extraUserPrice: number)`

Updates an existing plan user type configuration.

**Parameters:**

- `planUserTypeId`: The plan user type ID to update
- `planTypeId`: The plan type identifier
- `admin`: Whether this is for admin users
- `numberOfUsers`: New maximum number of users
- `extraUserPrice`: New price per additional user

**Returns:** `Promise<PlanUserTypeEntity | Error>` - Updated plan user type object or Error

#### `deletePlanUserType(planUserTypeId: number)`

Deletes a plan user type configuration.

**Parameters:**

- `planUserTypeId`: The plan user type ID to delete

**Returns:** `Promise<boolean | Error>` - Boolean indicating success or Error

**Warning:** Use with caution as this affects user limit enforcement. Should only be done when no active company plans depend on this configuration.

### User Management & Limits

#### `addUserToCompanyPlan(companyPlanId: number, userId: number, isAdmin: boolean)`

Adds a user to a company plan with validation against limits.

**Parameters:**

- `companyPlanId`: The company plan ID
- `userId`: The user ID to add
- `isAdmin`: Whether the user is an admin

**Returns:** `Promise<CompanyPlanUsageEntity | Error>` - Created usage record or Error

**Example:**

```typescript
const result = await planFacade.addUserToCompanyPlan(
	123, // companyPlanId
	456, // userId
	false // isAdmin = false (regular user)
);

if (result instanceof Error) {
	console.error("Failed to add user:", result.message);
} else {
	console.log("User added to plan:", result.usageId);
}
```

**Important:**

- Automatically validates user limits before adding
- Creates usage tracking record
- Use `canAddUserToPlan()` to check limits before calling this method
- Should be called from UserPlanIntegrationService for atomic operations

#### `canAddUserToPlan(companyPlanId: number, isAdmin: boolean)`

Checks if a user can be added to a plan based on scope limits.

**Parameters:**

- `companyPlanId`: The company plan ID
- `isAdmin`: Whether checking for admin or regular user

**Returns:** `Promise<boolean | Error>` - Boolean indicating if user can be added, or Error

**Example:**

```typescript
const canAdd = await planFacade.canAddUserToPlan(123, false);
if (canAdd === true) {
	// Proceed with user creation
	console.log("User can be added to plan");
} else if (canAdd instanceof Error) {
	console.error("Error checking limits:", canAdd.message);
} else {
	console.log("Cannot add user: limit exceeded");
}
```

**Important:** Call this method before attempting to create users. Prevents exceeding plan user limits. Used by UserPlanIntegrationService for validation.

#### `changeUserScope(companyId: number, userId: number, newIsAdmin: boolean)`

Changes a user's scope (admin status) in the plan.

**Parameters:**

- `companyId`: The company identifier
- `userId`: The user ID to update
- `newIsAdmin`: New admin status

**Returns:** `Promise<CompanyPlanUsageEntity | Error>` - Updated usage record or Error

**Example:**

```typescript
// Promote user to admin
const result = await planFacade.changeUserScope(123, 456, true);
if (result instanceof Error) {
	console.error("Failed to promote user:", result.message);
} else {
	console.log("User promoted to admin");
}

// Demote admin to regular user
const result2 = await planFacade.changeUserScope(123, 456, false);
```

**Important:**

- Validates new scope against plan limits before changing
- Automatically finds user's current usage record
- Should be called from UserPlanIntegrationService for atomic DB operations

#### `syncCompanyUsers(companyId: number, users: Array<{ user_Id: number, admin: boolean }>)`

Synchronizes all company users with the active plan.

**Parameters:**

- `companyId`: The company identifier
- `users`: Array of user objects with user_Id and admin properties

**Returns:** `Promise<SyncResults | Error>` - Synchronization results object with added, skipped, and errors arrays

**Example:**

```typescript
const users = [
	{ user_Id: 1, admin: true },
	{ user_Id: 2, admin: false },
	{ user_Id: 3, admin: false }
];

const result = await planFacade.syncCompanyUsers(123, users);
if (result instanceof Error) {
	console.error("Sync failed:", result.message);
} else {
	console.log(`Added: ${result.added.length}, Skipped: ${result.skipped.length}, Errors: ${result.errors.length}`);
}
```

**Important:**

- Validates all users against plan limits before creating usage records
- Skips users already in the plan
- Creates usage records in bulk for efficiency
- Used by UserPlanIntegrationService.fullSyncCompany()

#### `removeUserFromCompanyPlan(companyPlanId: number, userId: number)`

Removes a user from a company plan.

**Parameters:**

- `companyPlanId`: The company plan ID
- `userId`: The user ID to remove

**Returns:** `Promise<boolean | Error>` - Boolean indicating success or Error

#### `validateAllUsersWithinLimits(companyId: number)`

Validates that all users in a company are within the plan limits.

**Parameters:**

- `companyId`: The company identifier

**Returns:** `Promise<ValidationResults | Error>` - Object with validation results for admin and regular users

**Example:**

```typescript
const validation = await planFacade.validateAllUsersWithinLimits(123);
if (validation instanceof Error) {
	console.error("Validation failed:", validation.message);
} else {
	console.log(`Admin users: ${validation.admin.current}/${validation.admin.limit}`);
	console.log(`Regular users: ${validation.regular.current}/${validation.regular.limit}`);
	console.log(`Overall valid: ${validation.isValid}`);
}
```

**Returns object structure:**

```typescript
{
  admin: {
    current: number,
    limit: number,
    withinLimit: boolean
  },
  regular: {
    current: number,
    limit: number,
    withinLimit: boolean
  },
  isValid: boolean
}
```

### Pricing & Overrides

#### `createPlanUserOverride(companyPlanId: number, isAdmin: boolean, extraUserPrice: number)`

Creates or updates a custom pricing override for a company plan.

**Parameters:**

- `companyPlanId`: The company plan ID
- `isAdmin`: Whether this override is for admin or regular users
- `extraUserPrice`: Custom price per additional user

**Returns:** `Promise<PlanUserOverrideEntity | Error>` - Created or updated override record or Error

**Example:**

```typescript
// Set custom pricing for additional admin users
const adminOverride = await planFacade.createPlanUserOverride(
	123, // companyPlanId
	true, // isAdmin = true (for admin users)
	75.0 // extraUserPrice (custom price for additional admins)
);

// Set custom pricing for additional regular users
const regularOverride = await planFacade.createPlanUserOverride(
	123, // companyPlanId
	false, // isAdmin = false (for regular users)
	20.0 // extraUserPrice (custom price for additional users)
);
```

**Important:**

- If an override already exists for the same company plan and scope, it will be updated
- Overrides have highest precedence in pricing calculations (RN009)
- Use this for custom pricing agreements with specific companies

#### `deletePlanUserOverride(overrideId: number)`

Deletes a pricing override.

**Parameters:**

- `overrideId`: The override ID to delete

**Returns:** `Promise<boolean | Error>` - Boolean indicating success or Error

#### `calculateExtraUserPrice(companyPlanId: number, isAdmin: boolean, quantity: number = 1)`

Calculates extra user pricing based on precedence rules.

**Parameters:**

- `companyPlanId`: The company plan ID
- `isAdmin`: Whether calculating for admin or regular users
- `quantity`: Number of additional users (optional, defaults to 1)

**Returns:** `Promise<number | Error>` - Total price for additional users or Error

**Example:**

```typescript
// Calculate cost for 3 additional regular users
const cost = await planFacade.calculateExtraUserPrice(
	123, // companyPlanId
	false, // isAdmin = false (regular users)
	3 // quantity = 3 users
);

if (cost instanceof Error) {
	console.error("Calculation failed:", cost.message);
} else {
	console.log(`Total cost for 3 additional users: $${cost}`);
}
```

**Pricing Precedence (RN009):**

1. Scope-specific override (highest precedence)
2. Global additional amount in company plan
3. Standard price from plan_user_type (lowest precedence)

## UserPlanIntegrationService Methods

The `UserPlanIntegrationService` handles atomic operations between the User database and Plan system, ensuring data consistency across both systems. All methods handle transactions automatically.

### Service Initialization

```typescript
const userPlanIntegrationService = new UserPlanIntegrationService(
	planFacade, // PlanFacade instance
	userDatabaseHelper // DatabaseHelper MUST be initialized with "user" database name
);
```

**Important:** The `userDatabaseHelper` must be specifically configured for the User database, not the Plan database.

### `createUserWithPlanValidation(companyId: number, userData: UserData)`

Creates a new user in both User database and Plan system atomically.

**Parameters:**

- `companyId`: The company identifier
- `userData`: User data object containing all required user information
    - `name`: User's first name
    - `surname`: User's last name
    - `cpf`: User's CPF (optional)
    - `email`: User's email address
    - `admin`: Whether the user is an admin
    - `user_type_id`: User type identifier

**Returns:** `Promise<UserWithPlanUsage | Error>` - Created user object with plan_usage_id or Error

**Example:**

```typescript
const result = await userPlanIntegrationService.createUserWithPlanValidation(
	123, // companyId
	{
		name: "John",
		surname: "Doe",
		email: "john.doe@company.com",
		admin: false,
		user_type_id: 1,
		cpf: "12345678901" // optional
	}
);

if (result instanceof Error) {
	console.error("User creation failed:", result.message);
} else {
	console.log("User created:", result.user_id);
	console.log("Plan usage ID:", result.plan_usage_id);
}
```

**Process Steps:**

1. Validates plan limits before creation
2. Creates user in User database
3. Creates email record
4. Adds user to company plan
5. Returns created user with plan usage ID

**Business Rules Applied:**

- RN001: Must have active plan
- RN011: Validates user limits
- All operations are atomic (rollback on any failure)

### `changeUserAdminStatus(userId: number, newIsAdmin: boolean)`

Changes a user's admin status in both User database and Plan system atomically.

**Parameters:**

- `userId`: The user ID to update
- `newIsAdmin`: The new admin status

**Returns:** `Promise<UpdatedUser | Error>` - Updated user object or Error

**Example:**

```typescript
// Promote user to admin
const result = await userPlanIntegrationService.changeUserAdminStatus(456, true);
if (result instanceof Error) {
	console.error("Promotion failed:", result.message);
} else {
	console.log("User promoted to admin:", result.user_id);
}

// Demote admin to regular user
const result2 = await userPlanIntegrationService.changeUserAdminStatus(456, false);
```

**Process Steps:**

1. Validates scope change against plan limits
2. Updates user scope in Plan system
3. Updates admin status in User database
4. Returns updated user

**Business Rules Applied:**

- RN011: Validates admin limits before promotion
- RN015: Scope change validation
- All operations are atomic (rollback on any failure)

### `removeUser(userId: number)`

Removes a user from both User database and Plan system atomically (soft delete in User DB).

**Parameters:**

- `userId`: The user ID to remove

**Returns:** `Promise<SuccessStatus | Error>` - Success object `{ success: true }` or Error

**Example:**

```typescript
const result = await userPlanIntegrationService.removeUser(456);
if (result instanceof Error) {
	console.error("User removal failed:", result.message);
} else {
	console.log("User removed successfully");
}
```

**Process Steps:**

1. Removes user from company plan
2. Deactivates user in User database (sets active = false)
3. Returns success status

**Important Notes:**

- This is a soft delete (sets active = false, doesn't delete record)
- User data is preserved for audit purposes
- All operations are atomic (rollback on any failure)

### `fullSyncCompany(companyId: number)`

Performs full synchronization between User database and Plan system for a company.

**Parameters:**

- `companyId`: The company identifier to synchronize

**Returns:** `Promise<SynchronizationResults | Error>` - Synchronization results object with arrays of added, skipped, and error records

**Example:**

```typescript
const result = await userPlanIntegrationService.fullSyncCompany(123);
if (result instanceof Error) {
	console.error("Sync failed:", result.message);
} else {
	console.log(`Synchronization completed:`);
	console.log(`- Added users: ${result.added.length}`);
	console.log(`- Skipped users: ${result.skipped.length}`);
	console.log(`- Errors: ${result.errors.length}`);

	// Log specific results
	result.added.forEach((userId) => console.log(`Added user ${userId}`));
	result.errors.forEach((error) => console.log(`Error: ${error.error} for user ${error.user_Id}`));
}
```

**Returns object structure:**

```typescript
{
  added: string[],    // Array of user IDs that were added to the plan
  skipped: string[],  // Array of user IDs that were already in the plan
  errors: Array<{    // Array of errors encountered
    user_Id: number,
    error: string
  }>
}
```

**Process Steps:**

1. Retrieves all active users from User database
2. Synchronizes with Plan system usage records
3. Validates against plan limits
4. Returns synchronization results

**Use Cases:**

- Setting up plan system for existing companies
- Recovering from data inconsistencies
- Migrating companies to new plan types
- Periodic validation of data integrity

## Installation & Setup

```bash
npm install domain-sales-plan-management
```

### Configuration

```typescript
import { PlanFacade, UserPlanIntegrationService } from "domain-sales-plan-management";

// Initialize databases and dependencies
const planDatabase = new DatabaseHelper("plan_database");
const userDatabase = new DatabaseHelper("user_database");
const unitOfWork = new UnitOfWork(planDatabase);

// Initialize facades
const planFacade = new PlanFacade(/* dependencies */);
const userPlanIntegrationService = new UserPlanIntegrationService(planFacade, userDatabase);
```

## Usage Examples

### Complete User Creation Workflow

```typescript
// API endpoint for creating a user
app.post("/api/users", async (req, res) => {
	try {
		// User context should be set by middleware
		const result = await userPlanIntegrationService.createUserWithPlanValidation(req.body.companyId, {
			name: req.body.name,
			surname: req.body.surname,
			email: req.body.email,
			admin: req.body.admin,
			user_type_id: req.body.user_type_id,
			cpf: req.body.cpf
		});

		if (result instanceof Error) {
			return res.status(400).json({ error: result.message });
		}

		res.status(201).json(result);
	} catch (error) {
		res.status(500).json({ error: "Internal server error" });
	}
});
```

### Company Plan Setup Workflow

```typescript
// Complete company plan setup
async function setupCompanyPlan(companyId: number, planTypeId: number) {
	try {
		// 1. Create plan template if needed
		const plan = await planFacade.create(
			planTypeId,
			"Company Custom Plan",
			"Customized plan for specific company",
			199.99,
			"mensal"
		);

		if (plan instanceof Error) throw plan;

		// 2. Create company subscription
		const companyPlan = await planFacade.createCompanyPlan(
			companyId,
			plan.planId,
			199.99,
			new Date(),
			new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
		);

		if (companyPlan instanceof Error) throw companyPlan;

		// 3. Sync existing users
		const syncResult = await userPlanIntegrationService.fullSyncCompany(companyId);

		if (syncResult instanceof Error) throw syncResult;

		console.log("Company plan setup completed successfully");
		return { plan, companyPlan, syncResult };
	} catch (error) {
		console.error("Company plan setup failed:", error);
		throw error;
	}
}
```

### User Promotion Workflow

```typescript
// Promote user to admin with proper validation
async function promoteUserToAdmin(userId: number) {
	try {
		const result = await userPlanIntegrationService.changeUserAdminStatus(userId, true);

		if (result instanceof Error) {
			if (result.message.includes("limit")) {
				console.log("Cannot promote: admin limit would be exceeded");
				return { success: false, reason: "Admin limit exceeded" };
			}
			throw result;
		}

		console.log("User promoted to admin successfully");
		return { success: true, user: result };
	} catch (error) {
		console.error("Promotion failed:", error);
		throw error;
	}
}
```

This library provides comprehensive plan management with built-in validation, audit trails, and atomic operations across multiple databases. Always ensure user context is properly set for compliance and operational requirements.
