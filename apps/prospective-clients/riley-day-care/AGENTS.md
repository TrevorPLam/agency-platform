# Riley Day Care Application

## User Information

- User has no formal software development experience or education
- User develops repositories 100% through agentic coding as a "solo-developer"
- User prefers best practices and highest standards
- User prefers up to date (2026) research conducted before task execution on proper implementation, best practices, and advanced coding patterns

## Purpose

Demo template application showcasing childcare center management features. This serves as a reference implementation for prospective clients in the childcare industry.

## Agent Skills (Available Commands)
- `pnpm dev` - Start development server
- `pnpm build` - Build application
- `pnpm test` - Run tests with coverage
- `pnpm test:e2e` - Run end-to-end tests

## Integration Points
- Depends on: `@agency/database` for data, `@agency/ui` for components
- Uses: Childcare-specific features and workflows
- See also: `@packages/ui/AGENTS.md` for component usage
- Reference: `@packages/database/AGENTS.md` for database patterns

## Application-Specific Patterns

### Child Management
```typescript
// ✅ Correct - Child-specific data handling
import { createChild, updateChildStatus } from '@/lib/child-management';

async function enrollChild(childData: ChildData, tenantId: string) {
  return await createChild({
    ...childData,
    tenant_id: tenantId,
    enrollment_date: new Date().toISOString(),
    status: 'active',
  });
}

// ❌ Incorrect - Generic user handling
async function badEnrollChild(userData: any) {
  return await createUser(userData); // Not child-specific!
}
```

### Parent Communication
```typescript
// ✅ Correct - Parent notification system
import { notifyParent } from '@/lib/notifications';

async function sendDailyReport(parentId: string, childId: string, tenantId: string) {
  const report = await generateDailyReport(childId, tenantId);
  
  return await notifyParent({
    parent_id: parentId,
    type: 'daily_report',
    content: report,
    tenant_id: tenantId,
  });
}

// ❌ Incorrect - Generic messaging
async function badSendMessage(parentId: string, message: string) {
  return await sendMessage(parentId, message); // No context!
}
```

## Package Commands

```bash
# Development
pnpm dev

# Build
pnpm build

# Type check
pnpm type-check

# Lint
pnpm lint

# Run tests
pnpm test

# E2E tests
pnpm test:e2e
```

## File Structure

```
apps/prospective-clients/riley-day-care/
├── src/
│   ├── app/
│   │   ├── (dashboard)/       # Dashboard routes
│   │   ├── (children)/       # Child management
│   │   ├── (parents)/        # Parent portal
│   │   ├── api/              # API routes
│   │   ├── globals.css
│   │   ├── layout.tsx        # App layout
│   │   └── page.tsx          # Homepage
│   ├── components/
│   │   ├── childcare/        # Childcare-specific components
│   │   ├── parent-portal/    # Parent interface
│   │   ├── scheduling/       # Calendar and scheduling
│   │   └── ui/               # Reusable UI
│   ├── lib/
│   │   ├── child-management.ts # Child operations
│   │   ├── notifications.ts   # Parent communications
│   │   ├── scheduling.ts      # Calendar management
│   │   └── billing.ts         # Payment processing
│   └── types/
│       ├── childcare.ts        # Childcare types
│       ├── scheduling.ts       # Calendar types
│       └── billing.ts           # Payment types
├── AGENTS.md                  # This file
├── package.json
└── next.config.js
```

## Key Features

### Child Management
- Child enrollment and registration
- Daily attendance tracking
- Health and medication records
- Developmental milestones
- Emergency contact information

### Parent Portal
- Real-time activity updates
- Daily reports and photos
- Communication with staff
- Payment and billing management
- Schedule management

### Staff Management
- Staff scheduling and assignments
- Child-to-staff ratio tracking
- Professional development records
- Background check compliance
- Performance evaluations

### Administrative Features
- Licensing and compliance tracking
- Health and safety inspections
- Financial reporting
- Waitlist management
- Facility capacity planning

## Industry-Specific Patterns

### Childcare Compliance
```typescript
// ✅ Correct - Compliance-aware operations
import { checkCompliance } from '@/lib/compliance';

async function updateChildRecords(childId: string, updates: any, tenantId: string) {
  const compliance = await checkCompliance({
    operation: 'update_child_records',
    tenant_id: tenantId,
    requirements: ['HIPAA', 'CPSL', 'State_Licensing'],
  });
  
  if (!compliance.allowed) {
    throw new Error(`Compliance violation: ${compliance.reason}`);
  }
  
  return await updateChild(childId, updates);
}

// ❌ Incorrect - No compliance checks
async function badUpdateChildRecords(childId: string, updates: any) {
  return await updateChild(childId, updates); // No compliance!
}
```

### Ratio Management
```typescript
// ✅ Correct - Staff-to-child ratio enforcement
import { checkStaffRatio } from '@/lib/ratio-management';

async function assignStaffToRoom(roomId: string, staffId: string, tenantId: string) {
  const ratio = await checkStaffRatio({
    room_id: roomId,
    tenant_id: tenantId,
    age_group: 'toddlers',
  });
  
  if (ratio.exceeds_limit) {
    throw new Error(`Staff-to-child ratio exceeded: ${ratio.current}:${ratio.required}`);
  }
  
  return await assignStaff(roomId, staffId);
}

// ❌ Incorrect - No ratio checking
async function badAssignStaff(roomId: string, staffId: string) {
  return await assignStaff(roomId, staffId); // Could violate ratios!
}
```

## Security Requirements

### Child Privacy Protection
```typescript
// ✅ Correct - Child data protection
import { sanitizeChildData } from '@/lib/privacy';

async function getChildProfile(childId: string, parentId: string, tenantId: string) {
  const child = await getChild(childId, tenantId);
  
  if (!await canAccessChild(parentId, childId, tenantId)) {
    throw new Error('Unauthorized access to child data');
  }
  
  return await sanitizeChildData(child, 'parent_view');
}

// ❌ Incorrect - No privacy protection
async function badGetChildProfile(childId: string) {
  return await getChild(childId); // No access control!
}
```

### Emergency Information Access
```typescript
// ✅ Correct - Emergency data handling
import { getEmergencyContacts } from '@/lib/emergency';

async function getEmergencyInfo(childId: string, staffId: string, tenantId: string) {
  // Only authorized staff can access emergency info
  if (!await isAuthorizedStaff(staffId, tenantId)) {
    throw new Error('Unauthorized staff');
  }
  
  return await getEmergencyContacts(childId, tenantId);
}

// ❌ Incorrect - No authorization check
async function badGetEmergencyInfo(childId: string) {
  return await getEmergencyContacts(childId); // No auth!
}
```

## Testing Patterns

### Child Management Testing
```typescript
import { render, screen } from '@testing-library/react';
import { ChildProfile } from '@/components/childcare/child-profile';

describe('Child Management', () => {
  it('displays child information with privacy controls', async () => {
    const mockChild = createMockChild({
      id: 'child-123',
      name: 'Test Child',
      allergies: ['peanuts'],
    });
    
    render(<ChildProfile child={mockChild} />);
    
    expect(screen.getByText('Test Child')).toBeInTheDocument();
    expect(screen.getByText('Allergies: peanuts')).toBeInTheDocument();
  });
});
```

## Progressive Documentation

For more details:
- `@.agents/security.md` - Security guidelines
- `@packages/database/AGENTS.md` - Database patterns
- `@packages/ui/AGENTS.md` - Component usage
- `docs/CHILDCARE.md` - Childcare industry guide
