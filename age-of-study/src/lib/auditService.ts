import { getSupabaseServerClient } from '@/lib/supabaseServer';
import type { AuditAction, AuditLogInput, AuditLog } from '@/types/audit';

/**
 * Creates an audit log entry for security and compliance tracking
 * This function should be called for all sensitive operations
 */
export async function createAuditLog(
  userId: string,
  input: AuditLogInput,
  request?: Request
): Promise<void> {
  try {
    const supabase = getSupabaseServerClient();
    
    // Get actor profile info
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('id', userId)
      .single();

    const profile = profileData as any;

    if (!profile) {
      console.warn('Audit log: Profile not found for actor');
      return;
    }

    // Extract context from request headers
    let ipAddress: string | null = null;
    let userAgent: string | null = null;

    if (request) {
      ipAddress = request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') ||
                  null;
      userAgent = request.headers.get('user-agent');
    }

    // Insert audit log
    const { data, error } = await (supabase as any)
      .from('audit_logs')
      .insert({
        actor_id: userId,
        actor_role: profile.role,
        actor_email: profile.email,
        action: input.action,
        resource_type: input.resourceType || null,
        resource_id: input.resourceId || null,
        description: input.description,
        old_values: input.oldValues || null,
        new_values: input.newValues || null,
        metadata: input.metadata || {},
        ip_address: ipAddress,
        user_agent: userAgent,
      });

    if (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Audit logging error:', error);
    // Silently fail - audit logging is important but shouldn't break operations
  }
}

/**
 * Helper function to log PII (Personally Identifiable Information) access
 * Should be called whenever sensitive user data is viewed or exported
 */
export async function logPIIAccess(
  actorUserId: string,
  targetUserId: string,
  fields: string[],
  reason: string,
  request?: Request
): Promise<void> {
  await createAuditLog(actorUserId, {
    action: 'pii_accessed',
    resourceType: 'user',
    resourceId: targetUserId,
    description: `Accessed PII fields: ${fields.join(', ')}. Reason: ${reason}`,
    metadata: { 
      accessed_fields: fields, 
      reason 
    }
  }, request);
}

/**
 * Query audit logs with filters (admin only)
 */
export async function getAuditLogs(params: {
  limit?: number;
  offset?: number;
  action?: AuditAction;
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<{ data: AuditLog[] | null; error: any; count: number }> {
  const supabase = getSupabaseServerClient();

  // Build query
  let query = supabase
    .from('audit_logs')
    .select('*, profiles!audit_logs_actor_id_fkey(username, full_name)', { count: 'exact' })
    .order('created_at', { ascending: false });

  // Apply filters
  if (params.action) {
    query = query.eq('action', params.action);
  }
  if (params.actorId) {
    query = query.eq('actor_id', params.actorId);
  }
  if (params.resourceType) {
    query = query.eq('resource_type', params.resourceType);
  }
  if (params.resourceId) {
    query = query.eq('resource_id', params.resourceId);
  }
  if (params.dateFrom) {
    query = query.gte('created_at', params.dateFrom);
  }
  if (params.dateTo) {
    query = query.lte('created_at', params.dateTo);
  }

  // Pagination
  const limit = params.limit || 50;
  const offset = params.offset || 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  return { 
    data: data as any, 
    error, 
    count: count || 0 
  };
}

/**
 * Get audit log statistics (admin dashboard)
 */
export async function getAuditStats(days: number = 7): Promise<{
  totalLogs: number;
  logsByAction: Record<string, number>;
  logsByActor: Record<string, number>;
  recentCriticalActions: AuditLog[];
}> {
  const supabase = getSupabaseServerClient();
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - days);

  // Get all logs from date range
  const { data: logs, count } = await supabase
    .from('audit_logs')
    .select('action, actor_id, created_at', { count: 'exact' })
    .gte('created_at', dateFrom.toISOString())
    .order('created_at', { ascending: false })
    .limit(10000); // Add reasonable upper bound

  if (!logs) {
    return {
      totalLogs: 0,
      logsByAction: {},
      logsByActor: {},
      recentCriticalActions: []
    };
  }

  // Count by action
  const logsByAction: Record<string, number> = {};
  logs.forEach((log: any) => {
    logsByAction[log.action] = (logsByAction[log.action] || 0) + 1;
  });

  // Count by actor
  const logsByActor: Record<string, number> = {};
  logs.forEach((log: any) => {
    logsByActor[log.actor_id] = (logsByActor[log.actor_id] || 0) + 1;
  });

  // Get critical actions (security-related)
  const criticalActions = [
    'user_deleted',
    'user_blocked',
    'role_changed',
    'system_settings_changed',
    'login_failed'
  ];
  const recentCriticalActions = logs
    .filter((log: any) => criticalActions.includes(log.action))
    .slice(0, 10) as AuditLog[];

  return {
    totalLogs: logs.length,
    logsByAction,
    logsByActor,
    recentCriticalActions
  };
}
