import { getUsers } from "./actions";
import { Suspense } from "react";
import UsersTable from "./UsersTable";

export const dynamic = 'force-dynamic';

interface UsersPageProps {
  searchParams: Promise<{ search?: string; includeDeleted?: string }>;
}

async function UsersList({ search, includeDeleted }: { search?: string; includeDeleted: boolean }) {
  const result = await getUsers(search, includeDeleted);
  
  if (!result.success || !result.data) {
    return (
      <div className="bg-red-900/20 border border-red-700 p-4 rounded-xl">
        <p className="text-red-400">Failed to load users. Please try again.</p>
      </div>
    );
  }

  const users = result.data;

  return <UsersTable users={users} />;
}

async function UsersListWrapper({ search, includeDeleted }: { search?: string; includeDeleted: boolean }) {
  return <UsersList search={search} includeDeleted={includeDeleted} />;
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const resolvedSearchParams = await searchParams;
  const search = resolvedSearchParams?.search;
  const includeDeleted = resolvedSearchParams?.includeDeleted === 'true';

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">User Manager</h1>
          <p className="text-gray-400 font-medium">Manage users and view statistics</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
        <form method="get" className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              name="search"
              placeholder="Search by name or email..."
              defaultValue={search}
              className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#32A5DC] transition-colors"
            />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                name="includeDeleted"
                value="true"
                defaultChecked={includeDeleted}
                className="w-4 h-4 rounded bg-gray-900 border-gray-700 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-offset-gray-800"
              />
              <span>Show deleted users</span>
            </label>
            <button
              type="submit"
              className="px-6 py-3 bg-[#32A5DC] hover:bg-[#288bba] text-white rounded-xl font-bold transition-colors"
            >
              Search
            </button>
            {search && (
              <Link
                href="/admin/users"
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-bold transition-colors"
              >
                Clear
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Users List */}
      <Suspense fallback={
        <div className="bg-gray-800 p-12 rounded-2xl shadow-lg border border-gray-700 text-center">
          <p className="text-gray-400">Loading users...</p>
        </div>
      }>
        <UsersListWrapper search={search} includeDeleted={includeDeleted} />
      </Suspense>

    </div>
  );
}
