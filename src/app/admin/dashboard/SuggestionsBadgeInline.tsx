import { getUnreadSuggestionsCount } from "../suggestions/actions";

export default async function SuggestionsBadgeInline() {
  const result = await getUnreadSuggestionsCount();
  const count = result.success ? result.count : 0;

  if (count === 0) {
    return null;
  }

  return (
    <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full">
      {count}
    </span>
  );
}
