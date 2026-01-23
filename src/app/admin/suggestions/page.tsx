import { getSuggestions } from './actions';
import SuggestionsPageClient from './SuggestionsPageClient';

export const dynamic = 'force-dynamic';

export default async function SuggestionsPage() {
  const [activeResult, archivedResult] = await Promise.all([
    getSuggestions(false),
    getSuggestions(true),
  ]);

  const activeSuggestions = activeResult.success ? activeResult.data : [];
  const archivedSuggestions = archivedResult.success ? archivedResult.data : [];

  return (
    <SuggestionsPageClient
      activeSuggestions={activeSuggestions as any}
      archivedSuggestions={archivedSuggestions as any}
    />
  );
}
