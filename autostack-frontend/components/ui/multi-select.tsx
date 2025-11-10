"use client"

import { useState } from "react"
import { Check } from "lucide-react"

interface MultiSelectProps<T> {
  items: T[]
  selectedItems: T[]
  onSelectionChange: (selected: T[]) => void
  getItemId: (item: T) => string
  getItemLabel: (item: T) => string
  renderItem?: (item: T) => React.ReactNode
}

export function MultiSelect<T>({
  items,
  selectedItems,
  onSelectionChange,
  getItemId,
  getItemLabel,
  renderItem,
}: MultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleItem = (item: T) => {
    const itemId = getItemId(item)
    const isSelected = selectedItems.some((selected) => getItemId(selected) === itemId)

    if (isSelected) {
      onSelectionChange(selectedItems.filter((selected) => getItemId(selected) !== itemId))
    } else {
      onSelectionChange([...selectedItems, item])
    }
  }

  const selectAll = () => {
    if (selectedItems.length === items.length) {
      onSelectionChange([])
    } else {
      onSelectionChange([...items])
    }
  }

  const isAllSelected = selectedItems.length === items.length && items.length > 0

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium text-gray-300"
      >
        <span>
          {selectedItems.length > 0
            ? `${selectedItems.length} selected`
            : "Select items"}
        </span>
        <svg
          className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-2 w-64 bg-[#111] border border-white/10 rounded-lg shadow-xl z-20 max-h-96 overflow-y-auto">
            <div className="p-2 border-b border-white/10">
              <button
                onClick={selectAll}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm font-medium text-gray-300"
              >
                {isAllSelected ? "Deselect All" : "Select All"}
              </button>
            </div>
            <div className="p-2">
              {items.map((item) => {
                const itemId = getItemId(item)
                const isSelected = selectedItems.some((selected) => getItemId(selected) === itemId)

                return (
                  <button
                    key={itemId}
                    onClick={() => toggleItem(item)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                  >
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                        isSelected
                          ? "bg-purple-600 border-purple-600"
                          : "border-gray-400"
                      }`}
                    >
                      {isSelected && <Check size={12} className="text-white" />}
                    </div>
                    <span className="text-sm text-gray-300 flex-1">
                      {renderItem ? renderItem(item) : getItemLabel(item)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

