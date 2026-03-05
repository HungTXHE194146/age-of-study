"use client";

import { useState, useEffect } from "react";
import { Shield, Search, Filter, Calendar, User, FileText, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import type { AuditLog } from "@/types/audit";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [actionFilter, setActionFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const LIMIT = 50;
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    loadLogs();
  }, [page, actionFilter, dateFrom, dateTo]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      // Build query
      let query = supabase
        .from('audit_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (actionFilter) query = query.eq('action', actionFilter);
      if (dateFrom) query = query.gte('created_at', dateFrom);
      if (dateTo) query = query.lte('created_at', dateTo);

      // Pagination
      const offset = page * LIMIT;
      query = query.range(offset, offset + LIMIT - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('Failed to load audit logs:', error);
        return;
      }

      setLogs(data as AuditLog[] || []);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const getActionColor = (action: string) => {
    if (action.includes('delete') || action.includes('blocked')) return 'text-red-600 bg-red-50';
    if (action.includes('create')) return 'text-green-600 bg-green-50';
    if (action.includes('update') || action.includes('changed')) return 'text-blue-600 bg-blue-50';
    if (action.includes('login')) return 'text-purple-600 bg-purple-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      'user_created': 'Tạo người dùng',
      'user_updated': 'Cập nhật người dùng',
      'user_deleted': 'Xóa người dùng',
      'user_blocked': 'Chặn người dùng',
      'user_unblocked': 'Mở chặn người dùng',
      'role_changed': 'Đổi vai trò',
      'system_settings_changed': 'Thay đổi cài đặt',
      'document_uploaded': 'Tải tài liệu',
      'document_deleted': 'Xóa tài liệu',
      'login_success': 'Đăng nhập thành công',
      'login_failed': 'Đăng nhập thất bại',
    };
    return labels[action] || action;
  };

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      log.description.toLowerCase().includes(search) ||
      log.actor_email?.toLowerCase().includes(search) ||
      log.action.toLowerCase().includes(search)
    );
  });

  const totalPages = Math.ceil(totalCount / LIMIT);

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-3 bg-red-100 rounded-xl">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
            <p className="text-gray-600">Lịch sử hoạt động hệ thống - Bảo mật & Tuân thủ</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-semibold text-gray-900">Bộ lọc</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm mô tả, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Action Filter */}
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <option value="">Tất cả hành động</option>
            <option value="user_created">Tạo người dùng</option>
            <option value="user_updated">Cập nhật người dùng</option>
            <option value="user_deleted">Xóa người dùng</option>
            <option value="user_blocked">Chặn người dùng</option>
            <option value="system_settings_changed">Thay đổi cài đặt</option>
            <option value="login_failed">Đăng nhập thất bại</option>
          </select>

          {/* Date From */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Date To */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <div>
            Hiển thị {filteredLogs.length} / {totalCount} logs
          </div>
          {(actionFilter || dateFrom || dateTo || searchTerm) && (
            <button
              onClick={() => {
                setActionFilter('');
                setDateFrom('');
                setDateTo('');
                setSearchTerm('');
                setPage(0);
              }}
              className="text-red-600 hover:text-red-700 font-medium"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-12 h-12 border-4 border-red-200 border-t-red-600 rounded-full mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải audit logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-600">Không có audit logs nào</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Thời gian</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Người thực hiện</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Hành động</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">Mô tả</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase">IP</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Clock className="w-4 h-4" />
                          {formatDate(log.created_at)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {log.actor_email || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 capitalize">{log.actor_role}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                          {getActionLabel(log.action)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {log.description}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.ip_address || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Trang {page + 1} / {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedLog(null)}>
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Chi tiết Audit Log</h3>
                <p className="text-sm text-gray-600">{formatDate(selectedLog.created_at)}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Hành động</label>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(selectedLog.action)}`}>
                  {getActionLabel(selectedLog.action)}
                </span>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả</label>
                <p className="text-gray-900">{selectedLog.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Người thực hiện</label>
                  <p className="text-gray-900">{selectedLog.actor_email || 'N/A'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Vai trò</label>
                  <p className="text-gray-900 capitalize">{selectedLog.actor_role}</p>
                </div>
              </div>

              {selectedLog.resource_type && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Resource Type</label>
                    <p className="text-gray-900">{selectedLog.resource_type}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Resource ID</label>
                    <p className="text-gray-900 font-mono text-sm">{selectedLog.resource_id}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">IP Address</label>
                  <p className="text-gray-900 font-mono">{selectedLog.ip_address || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">User Agent</label>
                  <p className="text-gray-900 text-xs truncate">{selectedLog.user_agent || '-'}</p>
                </div>
              </div>

              {selectedLog.old_values && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giá trị cũ</label>
                  <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.old_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.new_values && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Giá trị mới</label>
                  <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.new_values, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Metadata</label>
                  <pre className="bg-gray-50 p-4 rounded-xl text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
