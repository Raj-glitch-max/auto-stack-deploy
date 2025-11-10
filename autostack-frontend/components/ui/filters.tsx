"use client"

import { useState } from "react"
import { Filter, X, ChevronDown } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface FilterOption {
  value: string
  label: string
}

interface FiltersProps {
  statusFilter: string
  onStatusFilterChange: (value: string) => void
  sortBy: string
  onSortChange: (value: string) => void
  searchQuery: string
  onSearchChange: (value: string) => void
}

const statusOptions: FilterOption[] = [
  { value: "all", label: "All Status" },
  { value: "success", label: "Success" },
  { value: "running", label: "Running" },
  { value: "failed", label: "Failed" },
  { value: "pending", label: "Pending" },
]

const sortOptions: FilterOption[] = [
  { value: "newest", label: "Newest First" },
  { value: "oldest", label: "Oldest First" },
  { value: "status", label: "By Status" },
  { value: "repo", label: "By Repository" },
]

export function Filters({
  statusFilter,
  onStatusFilterChange,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchChange,
}: FiltersProps) {
  const [isFiltersOpen, setIsFiltersOpen] = useState(false)

  const activeFiltersCount = (statusFilter !== "all" ? 1 : 0) + (sortBy !== "newest" ? 1 : 0) + (searchQuery ? 1 : 0)

  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search deployments..."
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 pl-10 text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 focus:bg-white/10 transition-all text-sm"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          {searchQuery && (
            <button
              onClick={() => onSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFiltersOpen(!isFiltersOpen)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all text-sm font-medium ${
            isFiltersOpen || activeFiltersCount > 0
              ? "bg-purple-600/20 border-purple-500/50 text-white"
              : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
          }`}
        >
          <Filter size={16} />
          Filters
          {activeFiltersCount > 0 && (
            <span className="px-1.5 py-0.5 bg-purple-600 text-white text-xs rounded-full">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Filters Panel */}
      <AnimatePresence>
        {isFiltersOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-white/5 border border-white/10 rounded-lg p-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(e) => onStatusFilterChange(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    {statusOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => onSortChange(e.target.value)}
                    className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>
            </div>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <button
                onClick={() => {
                  onStatusFilterChange("all")
                  onSortChange("newest")
                  onSearchChange("")
                }}
                className="mt-4 text-sm text-purple-400 hover:text-purple-300 transition-colors"
              >
                Clear all filters
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

