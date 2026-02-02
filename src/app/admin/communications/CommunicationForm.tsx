'use client';

import { useState, useEffect } from 'react';
import { createCommunication, updateCommunication } from './actions';
import RichTextEditor from '@/components/RichTextEditor';

interface CommunicationFormProps {
  onClose: () => void;
  onSuccess: () => void;
  communication?: {
    id: number;
    title: string;
    content: string;
    startDate: Date;
    endDate: Date;
    visibilityLocations: string[];
  };
}

export default function CommunicationForm({ onClose, onSuccess, communication }: CommunicationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState(communication?.title || '');
  const [content, setContent] = useState(communication?.content || '');
  // Helper to format date for datetime-local input (local time, not UTC)
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  const [startDate, setStartDate] = useState(
    communication?.startDate 
      ? formatLocalDateTime(new Date(communication.startDate))
      : formatLocalDateTime(new Date())
  );
  const [endDate, setEndDate] = useState(
    communication?.endDate
      ? formatLocalDateTime(new Date(communication.endDate))
      : formatLocalDateTime(new Date(Date.now() + 2 * 24 * 60 * 60 * 1000))
  );
  const [visibilityLocations, setVisibilityLocations] = useState<string[]>(
    communication?.visibilityLocations || []
  );

  const handleLocationToggle = (location: string) => {
    setVisibilityLocations(prev =>
      prev.includes(location)
        ? prev.filter(l => l !== location)
        : [...prev, location]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !content.trim() || visibilityLocations.length === 0) {
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = communication
        ? await updateCommunication(
            communication.id,
            title,
            content,
            start,
            end,
            visibilityLocations
          )
        : await createCommunication(
            title,
            content,
            start,
            end,
            visibilityLocations
          );

      if (result.success) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      // Silent fail
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-700">
      <h2 className="text-2xl font-black text-white mb-6">
        {communication ? 'Edit Communication' : 'Create Communication'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#32A5DC]"
            placeholder="Enter communication title"
            required
          />
        </div>

        {/* Content - Rich Text Editor */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Content *
          </label>
          <div className="bg-white rounded-lg">
            <RichTextEditor
              content={content}
              onChange={setContent}
              placeholder="Enter communication content..."
            />
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              Start Date & Time *
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#32A5DC]"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-300 mb-2">
              End Date & Time *
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-900 border border-gray-700 text-white px-4 py-3 rounded-xl focus:outline-none focus:border-[#32A5DC]"
              required
            />
          </div>
        </div>

        {/* Visibility Locations */}
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">
            Visibility Locations *
          </label>
          <div className="space-y-2">
            {['landing', 'dashboard', 'menu', 'login'].map((location) => (
              <label
                key={location}
                className="flex items-center gap-3 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={visibilityLocations.includes(location)}
                  onChange={() => handleLocationToggle(location)}
                  className="w-5 h-5 rounded border-gray-600 bg-gray-900 text-[#32A5DC] focus:ring-[#32A5DC] focus:ring-offset-gray-800"
                />
                <span className="text-white capitalize">
                  {location === 'landing' ? 'Landing Page' : location === 'dashboard' ? 'User Dashboard' : location === 'menu' ? 'Menu Page' : 'Login Page'}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-[#32A5DC] hover:bg-[#288bba] text-white font-bold py-3 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : communication ? 'Update' : 'Create'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
