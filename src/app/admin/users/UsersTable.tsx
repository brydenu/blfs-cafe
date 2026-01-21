'use client';

import { useState, useMemo } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string | null;
  role: string;
  phone: string | null;
  createdAt: Date;
  deletedAt: Date | null;
  totalOrders: number;
  lastOrderDate: Date | null;
  drinksPerDay: number;
}

interface UsersTableProps {
  users: User[];
}

type SortColumn = 'name' | 'email' | 'role' | 'orders' | 'drinksPerDay' | 'lastOrder' | null;
type SortDirection = 'asc' | 'desc';

export default function UsersTable({ users }: UsersTableProps) {
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      // Toggle direction if clicking same column
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New column, start with descending
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortColumn) return users;

    return [...users].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'name':
          const aName = a.firstName && a.lastName
            ? `${a.firstName} ${a.lastName}`
            : a.name || a.email || 'Unknown';
          const bName = b.firstName && b.lastName
            ? `${b.firstName} ${b.lastName}`
            : b.name || b.email || 'Unknown';
          aValue = aName.toLowerCase();
          bValue = bName.toLowerCase();
          break;
        case 'email':
          aValue = (a.email || '').toLowerCase();
          bValue = (b.email || '').toLowerCase();
          break;
        case 'role':
          aValue = a.role.toLowerCase();
          bValue = b.role.toLowerCase();
          break;
        case 'orders':
          aValue = a.totalOrders;
          bValue = b.totalOrders;
          break;
        case 'drinksPerDay':
          aValue = a.drinksPerDay;
          bValue = b.drinksPerDay;
          break;
        case 'lastOrder':
          aValue = a.lastOrderDate ? new Date(a.lastOrderDate).getTime() : 0;
          bValue = b.lastOrderDate ? new Date(b.lastOrderDate).getTime() : 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [users, sortColumn, sortDirection]);

  const formatDate = (date: Date | null) => {
    if (!date) return 'Never';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(date));
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) {
      return <span className="text-gray-600 ml-1">↕</span>;
    }
    return sortDirection === 'asc' 
      ? <span className="text-[#32A5DC] ml-1">↑</span>
      : <span className="text-[#32A5DC] ml-1">↓</span>;
  };

  return (
    <div className="space-y-4">
      {sortedUsers.length === 0 ? (
        <div className="bg-gray-800 p-12 rounded-2xl shadow-lg border border-gray-700 text-center">
          <div className="text-6xl mb-4 opacity-30">👥</div>
          <h3 className="text-xl font-bold text-white mb-2">No Users Found</h3>
          <p className="text-gray-400">No users match the current filters.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-2xl shadow-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900 border-b border-gray-700">
                <tr>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    User <SortIcon column="name" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    Email <SortIcon column="email" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('role')}
                  >
                    Role <SortIcon column="role" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('orders')}
                  >
                    Orders <SortIcon column="orders" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('drinksPerDay')}
                  >
                    Drinks/Day <SortIcon column="drinksPerDay" />
                  </th>
                  <th 
                    className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('lastOrder')}
                  >
                    Last Order <SortIcon column="lastOrder" />
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {sortedUsers.map((user) => {
                  const displayName = user.firstName && user.lastName
                    ? `${user.firstName} ${user.lastName}`
                    : user.name || user.email || 'Unknown';
                  
                  const isDeleted = !!user.deletedAt;

                  return (
                    <tr key={user.id} className="hover:bg-gray-900/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-white">{displayName}</div>
                        {user.phone && (
                          <div className="text-xs text-gray-500">{user.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-300">
                          {isDeleted ? (
                            <span className="text-gray-500 italic">Deleted</span>
                          ) : (
                            user.email || 'No email'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          user.role === 'admin'
                            ? 'bg-[#32A5DC]/20 text-[#32A5DC] border border-[#32A5DC]/50'
                            : 'bg-gray-700 text-gray-400 border border-gray-600'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-bold">{user.totalOrders}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-white font-bold">{user.drinksPerDay}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-400">{formatDate(user.lastOrderDate)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isDeleted ? (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-red-900/50 text-red-400 border border-red-800">
                            Deleted
                          </span>
                        ) : (
                          <span className="text-xs font-bold px-2 py-1 rounded-full bg-green-900/50 text-green-400 border border-green-800">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="text-sm text-[#32A5DC] hover:text-[#5bc0de] font-bold transition-colors"
                        >
                          View →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
