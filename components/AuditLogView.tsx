
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { AuditLog, User } from '../types';
import { formatIST } from '../constants';

interface AuditLogViewProps {
  user: User;
}

const AuditLogView: React.FC<AuditLogViewProps> = ({ user }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const allLogs = storageService.getAuditLogs();
    if (user.role === 'LEADER') {
      // Leaders only see logs related to their own actions or their group
      // For simulation we just filter by actor
      setLogs(allLogs.filter(l => l.actor === user.username));
    } else {
      setLogs(allLogs);
    }
  }, [user]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Audit Logs</h1>
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Timestamp (IST)</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action</th>
              <th className="p-4">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {logs.map(log => (
              <tr key={log.id} className="hover:bg-gray-50">
                <td className="p-4 whitespace-nowrap text-gray-500">
                  {formatIST(log.timestamp)}
                </td>
                <td className="p-4 font-bold">{log.actor}</td>
                <td className="p-4">
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                    {log.action}
                  </span>
                </td>
                <td className="p-4 text-gray-600">{log.details}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={4} className="p-8 text-center text-gray-400">
                  No activity logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AuditLogView;
