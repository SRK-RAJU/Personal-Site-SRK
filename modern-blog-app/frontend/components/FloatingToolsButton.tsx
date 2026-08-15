'use client';

import { useState } from 'react';
import toolsData from '@/data/industry-tools.json';

interface Tool {
  name: string;
  officialUrl: string;
  description: string;
  tags: string[];
}

interface Category {
  id: string;
  displayName: string;
  tools: Tool[];
}

export default function FloatingToolsButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = (toolsData as any).categories as Category[];

  const filteredCategories = categories
    .map((cat) => ({
      ...cat,
      tools: cat.tools.filter((tool) => {
        const matchesSearch =
          searchQuery === '' ||
          tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        return matchesSearch;
      }),
    }))
    .filter((cat) => cat.tools.length > 0 || !searchQuery);

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg hover:shadow-2xl transition-all hover:scale-110 transform duration-200"
        title="Open Tools List"
        aria-label="Open Tools List"
      >
        <svg
          className="w-6 h-6"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
        </svg>
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-start justify-center pt-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Industry Tools Catalog</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:bg-white/20 p-2 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            {/* Search Bar */}
            <div className="bg-gray-50 px-6 py-3 border-b">
              <input
                type="text"
                placeholder="Search tools by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="mt-2 text-sm text-gray-600">
                {searchQuery && `Showing ${filteredCategories.reduce((sum, cat) => sum + cat.tools.length, 0)} matching tools`}
              </div>
            </div>

            {/* Tools Content */}
            <div className="overflow-y-auto flex-1">
              <div className="px-6 py-4">
                {filteredCategories.map((category) => (
                  <div key={category.id} className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <span className="inline-block w-1 h-6 bg-blue-600 rounded-full"></span>
                      {category.displayName}
                      <span className="text-sm font-normal text-gray-500 ml-auto">
                        ({category.tools.length} tools)
                      </span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {category.tools.map((tool, idx) => (
                        <a
                          key={idx}
                          href={tool.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-md transition-all group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 group-hover:text-blue-600 transition">
                                {tool.name}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {tool.description}
                              </p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {tool.tags.slice(0, 3).map((tag, i) => (
                                  <span
                                    key={i}
                                    className="inline-block px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {tool.tags.length > 3 && (
                                  <span className="inline-block text-xs text-gray-500">
                                    +{tool.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                            <svg
                              className="w-4 h-4 text-gray-400 group-hover:text-blue-600 flex-shrink-0"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M11 3a1 1 0 100 2h3.586L9.293 9.293a1 1 0 001.414 1.414L16 6.414V10a1 1 0 102 0V4a1 1 0 00-1-1h-6z" />
                            </svg>
                          </div>
                        </a>
                      ))}
                    </div>
                  </div>
                ))}

                {filteredCategories.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No tools found matching "{searchQuery}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer Stats */}
            <div className="bg-gray-50 px-6 py-3 border-t text-sm text-gray-600">
              <p>
                Total: <strong>{categories.reduce((sum, cat) => sum + cat.tools.length, 0)} tools</strong> across{' '}
                <strong>{categories.length} categories</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
