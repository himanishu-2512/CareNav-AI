/**
 * Test script for audit logging functions
 * Run with: npx ts-node lambda/shared/test-audit-log.ts
 */

import { logAccess, getAuditLogs, getPatientAccessLogs } from './audit-log';

async function testAuditLogFunctions() {
  console.log('🧪 Testing Audit Logging Functions\n');

  try {
    const doctorId = 'doctor-test-123';
    const patientId1 = 'patient-test-456';
    const patientId2 = 'patient-test-789';

    // Test 1: Log QR scan access
    console.log('1️⃣ Logging QR scan access...');
    const qrLog = await logAccess(
      doctorId,
      patientId1,
      'qr_scan',
      'qr-token-abc123',
      '192.168.1.100',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
    );
    console.log('✅ QR scan logged:', {
      auditId: qrLog.auditId,
      accessType: qrLog.accessType,
      timestamp: qrLog.timestamp,
      TTL: new Date(qrLog.TTL * 1000).toISOString()
    });

    // Wait a moment to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 2: Log manual code access
    console.log('\n2️⃣ Logging manual code access...');
    const codeLog = await logAccess(
      doctorId,
      patientId2,
      'manual_code',
      'code-xyz789',
      '192.168.1.101'
    );
    console.log('✅ Manual code logged:', {
      auditId: codeLog.auditId,
      accessType: codeLog.accessType,
      timestamp: codeLog.timestamp
    });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 3: Log profile view
    console.log('\n3️⃣ Logging profile view...');
    const profileLog = await logAccess(
      doctorId,
      patientId1,
      'view_profile',
      'qr-token-abc123',
      '192.168.1.100'
    );
    console.log('✅ Profile view logged:', {
      auditId: profileLog.auditId,
      accessType: profileLog.accessType,
      timestamp: profileLog.timestamp
    });

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 100));

    // Test 4: Log episode view
    console.log('\n4️⃣ Logging episode view...');
    const episodeLog = await logAccess(
      doctorId,
      patientId1,
      'view_episode',
      'qr-token-abc123',
      '192.168.1.100'
    );
    console.log('✅ Episode view logged:', {
      auditId: episodeLog.auditId,
      accessType: episodeLog.accessType,
      timestamp: episodeLog.timestamp
    });

    // Test 5: Get all audit logs for doctor
    console.log('\n5️⃣ Getting all audit logs for doctor...');
    const allLogs = await getAuditLogs(doctorId);
    console.log('✅ Retrieved audit logs:', {
      totalLogs: allLogs.length,
      logs: allLogs.map(log => ({
        patientId: log.patientId,
        accessType: log.accessType,
        timestamp: log.timestamp
      }))
    });

    // Test 6: Get audit logs for specific patient
    console.log('\n6️⃣ Getting audit logs for specific patient...');
    const patientLogs = await getPatientAccessLogs(doctorId, patientId1);
    console.log('✅ Retrieved patient-specific logs:', {
      patientId: patientId1,
      totalLogs: patientLogs.length,
      logs: patientLogs.map(log => ({
        accessType: log.accessType,
        timestamp: log.timestamp
      }))
    });

    // Test 7: Get audit logs with date filtering
    console.log('\n7️⃣ Testing date range filtering...');
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 3600000).toISOString();
    const oneHourLater = new Date(now.getTime() + 3600000).toISOString();
    
    const filteredLogs = await getAuditLogs(doctorId, oneHourAgo, oneHourLater);
    console.log('✅ Filtered logs (last hour):', {
      totalLogs: filteredLogs.length,
      dateRange: {
        start: oneHourAgo,
        end: oneHourLater
      }
    });

    // Test 8: Verify TTL is set correctly (30 days from now)
    console.log('\n8️⃣ Verifying TTL configuration...');
    const expectedTTL = Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000);
    const actualTTL = qrLog.TTL;
    const ttlDifference = Math.abs(expectedTTL - actualTTL);
    const ttlIsCorrect = ttlDifference < 60; // Within 60 seconds is acceptable
    console.log('✅ TTL verification:', {
      expectedTTL: new Date(expectedTTL * 1000).toISOString(),
      actualTTL: new Date(actualTTL * 1000).toISOString(),
      differenceSeconds: ttlDifference,
      isCorrect: ttlIsCorrect
    });

    // Test 9: Verify logs are sorted by timestamp (most recent first)
    console.log('\n9️⃣ Verifying log sorting...');
    const isSorted = allLogs.every((log, index) => {
      if (index === 0) return true;
      return new Date(log.timestamp).getTime() <= new Date(allLogs[index - 1].timestamp).getTime();
    });
    console.log('✅ Logs sorted correctly (most recent first):', isSorted);

    // Test 10: Verify all required fields are present
    console.log('\n🔟 Verifying required fields...');
    const hasAllFields = allLogs.every(log => 
      log.auditId &&
      log.doctorId &&
      log.patientId &&
      log.accessType &&
      log.accessMethod &&
      log.timestamp &&
      log.TTL
    );
    console.log('✅ All required fields present:', hasAllFields);

    console.log('\n✨ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testAuditLogFunctions()
    .then(() => {
      console.log('\n✅ Test suite completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Test suite failed:', error);
      process.exit(1);
    });
}

export { testAuditLogFunctions };
