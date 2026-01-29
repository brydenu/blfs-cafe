'use client';

import Link from "next/link";
import { useState } from "react";
import { submitSuggestion } from "./actions";

export default function SuggestionsPage() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [message, setMessage] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus('loading');
    setMessage("");

    const result = await submitSuggestion(content);

    setStatus(result.success ? 'success' : 'idle');
    setMessage(result.message);

    if (result.success) {
      setContent("");
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const textareaClass = "w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#32A5DC]/50 transition-all text-gray-900 font-medium placeholder-gray-500 min-h-[200px] resize-y";

  return (
    <div className="min-h-screen relative overflow-hidden flex justify-center p-4">
      
      {/* --- BACKGROUND --- */}
      <div className="absolute inset-0 z-0 bg-[#004876] fixed">
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20 animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#32A5DC] rounded-full mix-blend-multiply filter blur-[128px] opacity-20"></div>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
      </div>

      {/* --- CONTENT CONTAINER --- */}
      <div className="relative z-10 w-full max-w-2xl space-y-6 pt-8 pb-12 px-2 sm:px-0">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
            <h1 className="text-3xl font-black text-white drop-shadow-md">Suggestions</h1>
            <div className="flex gap-2 sm:gap-3 flex-shrink-0">
              <Link href="/dashboard/suggestions/history">
                <button className="bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap">
                  <span className="hidden sm:inline">View History</span>
                  <span className="sm:hidden">History</span>
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="bg-[#003355] hover:bg-[#002a4d] border border-white/10 text-white px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1 sm:gap-2 whitespace-nowrap">
                    <span>←</span> <span>Back</span>
                </button>
              </Link>
            </div>
        </div>

        {/* --- SUGGESTIONS FORM --- */}
        <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-white/10">
            <h2 className="text-xl font-black text-[#004876] mb-6 border-b pb-2 flex items-center gap-2">
                <span>💡</span> Share Your Ideas
            </h2>
            
            <p className="text-sm text-gray-600 mb-6">
                Have a suggestion to improve BioLife Cafe? We'd love to hear from you! Share your ideas, feedback, or feature requests below.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-sm font-bold text-gray-700 ml-1">Your Suggestion</label>
                    <textarea 
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        required
                        placeholder="Enter your suggestion here..."
                        maxLength={5000}
                        className={textareaClass}
                    />
                    <p className="text-xs text-gray-500 ml-1">
                        {content.length}/5000 characters
                    </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center gap-4">
                    <button 
                        type="submit"
                        disabled={status === 'loading' || content.trim().length === 0}
                        className="w-full sm:w-auto bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {status === 'loading' ? 'Submitting...' : 'Submit Suggestion'}
                    </button>
                    {message && (
                        <span className={`text-sm font-bold ${status === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                            {message}
                        </span>
                    )}
                </div>
            </form>
        </div>
      </div>
    </div>
  );
}
