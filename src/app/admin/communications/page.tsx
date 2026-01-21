import { getCommunications } from './actions';
import CommunicationList from './CommunicationList';

export const dynamic = 'force-dynamic';

export default async function CommunicationsPage() {
  const result = await getCommunications();
  const communications = result.success ? result.data : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-black text-white">Communications</h1>
          <p className="text-gray-400 font-medium">Manage system-wide communications and announcements</p>
        </div>
      </div>

      {/* Communication List */}
      <CommunicationList
        communications={communications as any}
      />
    </div>
  );
}
