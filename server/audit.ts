import { getDb, saveDb } from './database';

export interface AuditLogEntry {
  id: string;
  time: string;
  level: 'success' | 'info' | 'warn' | 'critical';
  code: string;
  message: string;
  ip: string;
  user?: string;
  details?: any;
}

/**
 * Log a security, system, or business audit event
 */
export async function logAuditEvent(
  level: 'success' | 'info' | 'warn' | 'critical',
  code: string,
  message: string,
  ip: string = 'system',
  user?: string,
  details?: any
): Promise<AuditLogEntry> {
  const db = await getDb();
  
  const newEntry: AuditLogEntry = {
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    time: new Date().toISOString(),
    level,
    code,
    message,
    ip,
    user,
    details
  };

  db.securityLogs = db.securityLogs || [];
  // Keep logs bounded to last 1000 items to prevent db bloat in mock storage
  db.securityLogs.unshift(newEntry);
  if (db.securityLogs.length > 1000) {
    db.securityLogs = db.securityLogs.slice(0, 1000);
  }

  await saveDb();
  console.log(`[AUDIT] [${level.toUpperCase()}] [${code}] ${message} (${ip})`);
  return newEntry;
}

/**
 * Analyze logs for suspicious behaviors or anomalies
 */
export async function detectAnomalies(): Promise<Array<{ code: string; message: string; severity: 'high' | 'medium' }>> {
  const db = await getDb();
  const logs = db.securityLogs || [];
  const anomalies: Array<{ code: string; message: string; severity: 'high' | 'medium' }> = [];

  // Group failed logouts/logins by IP in the last 10 minutes
  const loginFailuresByIP: Record<string, number> = {};
  const recentTime = Date.now() - 10 * 60 * 1000; // 10 minutes ago

  for (const log of logs) {
    const logTime = new Date(log.time).getTime();
    if (logTime < recentTime) continue;

    if (log.code === 'AUTH_FAILURE') {
      loginFailuresByIP[log.ip] = (loginFailuresByIP[log.ip] || 0) + 1;
    }
  }

  for (const [ip, count] of Object.entries(loginFailuresByIP)) {
    if (count >= 5) {
      anomalies.push({
        code: 'BRUTE_FORCE_SUSPECT',
        message: `Múltiples intentos de login fallidos (${count}) desde IP: ${ip}`,
        severity: 'high'
      });
    } else if (count >= 3) {
      anomalies.push({
        code: 'SUSPICIOUS_ACTIVITY',
        message: `Intento de acceso repetido (${count}) desde IP: ${ip}`,
        severity: 'medium'
      });
    }
  }

  return anomalies;
}
