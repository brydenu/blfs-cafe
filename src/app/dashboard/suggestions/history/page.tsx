import { getUserSuggestions } from '../actions';
import SuggestionsHistoryClient from './SuggestionsHistoryClient';

export const dynamic = 'force-dynamic';

export default async function SuggestionsHistoryPage() {
  const result = await getUserSuggestions();
  const suggestions = result.success ? result.data : [];

  return <SuggestionsHistoryClient suggestions={suggestions as any} />;
}
