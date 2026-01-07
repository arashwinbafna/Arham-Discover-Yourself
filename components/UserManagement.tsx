
import React, { useState, useEffect } from 'react';
import { storageService } from '../services/storageService';
import { User, Leader } from '../types';
import { COLORS, MASTER_PASSWORD } from '../constants';

interface UserManagementProps {
  admin: User;
}

const UserManagement: React.FC<UserManagementProps> = ({ admin }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [leaders, setLeaders] = useState<Leader[]>([]);

  useEffect(() => {
    setUsers(storageService.getUsers());
    setLeaders(storageService.getLeaders());
  }, []);

  const handleDelete = (u: User) => {
    if (u.id === admin.id) {
      alert("You cannot delete your own profile.");
      return;
    }

    const mp = prompt(`Delete user account "${u.username}"? This action requires Master Password:`);
    if (mp?.toLowerCase() === MASTER_PASSWORD.toLowerCase()) {
      storageService.deleteUser(u.id);
      
      // If user was a leader, optionally remove their leader profile too
      if (u.role === 'LEADER') {
        const confirmProfile = window.confirm(`Also delete leader profile data for ${u.username}?`);
        if (confirmProfile) {
          storageService.deleteLeader(u.username); // Assuming ID is name as per system design
        }
      }

      setUsers(storageService.getUsers());
      setLeaders(storageService.getLeaders());
      storageService.log(admin.username, 'Account Deleted', `Permanently removed user account: ${u.username}`);
    } else if (mp !== null) {
      alert("Unauthorized.");
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <header>
        <h1 className="text-2xl font-bold">User Management</h1>
        <p className="text-gray-500">Manage all application users and administrative access</p>
      </header>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4">Username</th>
              <th className="p-4">Role</th>
              <th className="p-4">Linked Profile</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                      u.role === 'ADMIN' ? 'bg-deepRed' : 'bg-primary'
                    }`}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold">{u.username}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${
                    u.role === 'ADMIN' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="p-4 text-gray-500">
                  {u.role === 'LEADER' ? (
                    leaders.find(l => l.name === u.username) ? (
                      <span className="text-green-600 flex items-center">
                        <i className="fas fa-check-circle mr-1"></i> Active Leader Profile
                      </span>
                    ) : (
                      <span className="text-orange-500 flex items-center">
                        <i className="fas fa-exclamation-triangle mr-1"></i> No Profile Info
                      </span>
                    )
                  ) : 'N/A'}
                </td>
                <td className="p-4 text-right">
                  {u.id !== admin.id && (
                    <button 
                      onClick={() => handleDelete(u)}
                      className="text-red-500 hover:text-red-700 p-2 rounded hover:bg-red-50 transition-colors"
                      title="Delete User"
                    >
                      <i className="fas fa-user-minus"></i>
                    </button>
                  )}
                  {u.id === admin.id && <span className="text-[10px] text-gray-400 font-bold uppercase italic">Current Session</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gray-100 p-4 rounded-lg flex items-start space-x-3 border border-gray-200">
        <i className="fas fa-info-circle text-gray-500 mt-1"></i>
        <p className="text-xs text-gray-600 italic">
          <strong>Security Note:</strong> Deleting a user account removes their login credentials. All deletions require the Master Password. 
          Deleting an Admin account is restricted to other Admins.
        </p>
      </div>
    </div>
  );
};

export default UserManagement;
