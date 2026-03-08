# Access Audit Logging Module

## Overview

The audit logging module provides comprehensive tracking of doctor access to patient data, ensuring compliance with security requirements and enabling audit trails for all patient data access events.

## Implementation

**File:** `lambda/shared/audit-log.ts`

### Data Model

Audit logs are stored in DynamoDB using the following pattern:

```
PK: AUDIT#{doctorId}
SK: ACCESS#{timestamp}#{patientId}
```

This design allows efficient querying of:
- All access events for a specific doctor
- Access events within a date range
- Access events sorted by timestamp (most recent first)

### AuditLog Interface

```typescript
interface AuditLog {
  auditId: string;              // Unique identifier (UUID)
  doctorId: string;             // Doctor who accessed the data
  patientId: string;            // Patient whose data was accessed
  accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode';
  accessMethod: string;         // QR token ID or unique code
  ipAddress?: string;           // Optional IP address
  userAgent?: string;           // Optional user agent string
  timestamp: string;            // ISO timestamp of access
  TTL: number;                  // Unix timestamp for 30-day retention
}
```

## Functions

### 1. logAccess()

Logs an access event when a doctor accesses patient data.

**Signature:**
```typescript
async function logAccess(
  doctorId: string,
  patientId: string,
  accessType: 'qr_scan' | 'manual_code' | 'view_profile' | 'view_episode',
  accessMethod: string,
  ipAddress?: string,
  userAgent?: string
): Promise<AuditLog>
```

**Parameters:**
- `doctorId` - Doctor's user ID
- `patientId` - Patient's ID
- `accessType` - Type of access event:
  - `qr_scan` - Patient added via QR code scan
  - `manual_code` - Patient added via manual code entry
  - `view_profile` - Doctor viewed patient profile
  - `view_episode` - Doctor viewed treatment episode
- `accessMethod` - QR token ID or unique code used for access
- `ipAddress` - Optional IP address of the request
- `userAgent` - Optional user agent string

**Returns:** Created audit log entry

**Features:**
- Automatically generates unique audit ID (UUID)
- Sets timestamp to current time
- Calculates TTL for 30-day retention (automatic cleanup)
- Stores in DynamoDB with proper partition and sort keys

**Example:**
```typescript
const log = await logAccess(
  'doctor-123',
  'patient-456',
  'qr_scan',
  'qr-token-abc123',
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
);
```

### 2. getAuditLogs()

Retrieves audit logs for a doctor with optional date filtering.

**Signature:**
```typescript
async function getAuditLogs(
  doctorId: string,
  startDate?: string,
  endDate?: string
): Promise<AuditLog[]>
```

**Parameters:**
- `doctorId` - Doctor's user ID
- `startDate` - Optional start date for filtering (ISO string)
- `endDate` - Optional end date for filtering (ISO string)

**Returns:** Array of audit log entries sorted by timestamp (most recent first)

**Features:**
- Efficient querying using DynamoDB partition key
- Optional date range filtering using sort key
- Results sorted in descending order (most recent first)
- Removes DynamoDB internal keys from response

**Example:**
```typescript
// Get all logs for a doctor
const allLogs = await getAuditLogs('doctor-123');

// Get logs within a date range
const filteredLogs = await getAuditLogs(
  'doctor-123',
  '2024-01-01T00:00:00Z',
  '2024-01-31T23:59:59Z'
);
```

### 3. getPatientAccessLogs()

Retrieves audit logs for a specific patient accessed by a doctor.

**Signature:**
```typescript
async function getPatientAccessLogs(
  doctorId: string,
  patientId: string
): Promise<AuditLog[]>
```

**Parameters:**
- `doctorId` - Doctor's user ID
- `patientId` - Patient's ID

**Returns:** Array of audit log entries for this patient

**Features:**
- Filters logs for a specific patient
- Sorted by timestamp (most recent first)
- Useful for tracking all access events for a single patient

**Example:**
```typescript
const patientLogs = await getPatientAccessLogs('doctor-123', 'patient-456');
```

## TTL (Time To Live) Configuration

Audit logs are automatically deleted after 30 days using DynamoDB's TTL feature:

- TTL is calculated as: `current_time + 30 days`
- Stored as Unix timestamp (seconds since epoch)
- DynamoDB automatically deletes expired items within 48 hours
- No manual cleanup required

**TTL Calculation:**
```typescript
const ttlDate = new Date();
ttlDate.setDate(ttlDate.getDate() + 30);
const TTL = Math.floor(ttlDate.getTime() / 1000);
```

## Integration Points

### When to Log Access

1. **QR Scan** - When doctor scans patient QR code
   ```typescript
   await logAccess(doctorId, patientId, 'qr_scan', qrTokenId, ipAddress, userAgent);
   ```

2. **Manual Code Entry** - When doctor enters unique code
   ```typescript
   await logAccess(doctorId, patientId, 'manual_code', uniqueCode, ipAddress, userAgent);
   ```

3. **View Profile** - When doctor opens patient profile
   ```typescript
   await logAccess(doctorId, patientId, 'view_profile', accessMethod, ipAddress);
   ```

4. **View Episode** - When doctor opens treatment episode
   ```typescript
   await logAccess(doctorId, patientId, 'view_episode', accessMethod, ipAddress);
   ```

### Lambda Integration

In Lambda handlers, extract IP address and user agent from the event:

```typescript
const ipAddress = event.requestContext?.identity?.sourceIp;
const userAgent = event.requestContext?.identity?.userAgent;

await logAccess(doctorId, patientId, accessType, accessMethod, ipAddress, userAgent);
```

## Security Considerations

1. **Immutable Logs** - Audit logs should never be modified or deleted manually
2. **Comprehensive Tracking** - All patient data access must be logged
3. **Privacy** - Logs contain only access metadata, not patient data
4. **Retention** - 30-day retention meets compliance requirements
5. **Query Efficiency** - Partition key design enables fast queries per doctor

## Testing

A comprehensive test suite is provided in `test-audit-log.ts`:

```bash
npx ts-node lambda/shared/test-audit-log.ts
```

**Note:** Tests require AWS credentials and DynamoDB access.

**Test Coverage:**
- ✅ Log QR scan access
- ✅ Log manual code access
- ✅ Log profile view
- ✅ Log episode view
- ✅ Get all audit logs for doctor
- ✅ Get patient-specific logs
- ✅ Date range filtering
- ✅ TTL verification
- ✅ Log sorting (most recent first)
- ✅ Required fields validation

## Requirements Validation

This implementation satisfies **Requirement 20.2**:

> When a doctor adds a patient, create an access log entry with doctor ID, patient ID, and timestamp

**Additional Features:**
- Tracks multiple access types (not just patient addition)
- Includes access method for traceability
- Optional IP address and user agent for security
- Automatic 30-day retention with TTL
- Efficient querying with date range filtering

## DynamoDB Table Configuration

Ensure the DynamoDB table has TTL enabled:

1. TTL attribute name: `TTL`
2. TTL is a number (Unix timestamp in seconds)
3. DynamoDB automatically deletes items when TTL expires

**CDK Configuration:**
```typescript
table.addTimeToLive({
  attributeName: 'TTL'
});
```

## Performance Characteristics

- **Write Performance:** O(1) - Single PutCommand per log entry
- **Read Performance:** O(log n) - Efficient query using partition key
- **Storage:** Automatic cleanup after 30 days via TTL
- **Scalability:** Partition key per doctor prevents hot partitions

## Future Enhancements

Potential improvements for future iterations:

1. **Aggregated Reports** - Daily/weekly access summaries
2. **Anomaly Detection** - Alert on unusual access patterns
3. **Export Functionality** - Export logs for compliance audits
4. **Real-time Monitoring** - Stream logs to CloudWatch for alerting
5. **Patient Notifications** - Notify patients when their data is accessed
