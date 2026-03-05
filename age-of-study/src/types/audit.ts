export type AuditAction =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_blocked'
  | 'user_unblocked'
  | 'role_changed'
  | 'password_changed'
  | 'class_created'
  | 'class_updated'
  | 'class_deleted'
  | 'student_added_to_class'
  | 'student_removed_from_class'
  | 'teacher_assigned'
  | 'teacher_removed'
  | 'document_uploaded'
  | 'document_deleted'
  | 'test_created'
  | 'test_updated'
  | 'test_deleted'
  | 'grade_modified'
  | 'system_settings_changed'
  | 'pii_accessed'
  | 'login_success'
  | 'login_failed'
  | 'logout';

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_role: 'student' | 'teacher' | 'system_admin';
  actor_email: string | null;
  action: AuditAction;
  resource_type: string | null;
  resource_id: string | null;
  description: string;
  old_values: Record<string, any> | null;
  new_values: Record<string, any> | null;
  metadata: Record<string, any>;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  created_at: string;
}

export interface AuditLogInput {
  action: AuditAction;
  resourceType?: string;
  resourceId?: string;
  description: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
}
