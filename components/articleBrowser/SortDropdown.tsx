'use client'

interface SortDropdownProps {
  value: 'alpha' | 'newest' | 'oldest'
  onChange: (value: 'alpha' | 'newest' | 'oldest') => void
}

export function SortDropdown({ value, onChange }: SortDropdownProps) {
  return (
    <div className="p-4">
      <label className="text-xs font-serif text-amber-400 mr-2">Sortieren nach:</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortDropdownProps['value'])}
        className="bg-black/40 border border-amber-900/40 text-amber-100 text-xs px-2 py-1 rounded"
      >
        <option value="alpha">A–Z</option>
        <option value="newest">Neueste zuerst</option>
        <option value="oldest">Älteste zuerst</option>
      </select>
    </div>
  )
}