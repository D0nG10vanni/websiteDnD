// EntryDetailModal.tsx - Detail-Modal Komponente

import React from 'react'
import { Dialog } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import type { TimelineEntry } from '../types'
import { getEraName } from '../eraUtils'

interface EntryDetailModalProps {
  selectedEntry: TimelineEntry | null
  onClose: () => void
}

const EntryDetailModal: React.FC<EntryDetailModalProps> = ({ 
  selectedEntry, 
  onClose 
}) => {
  if (!selectedEntry) return null

  const getTypeIcon = (dateType: string) => {
    switch (dateType) {
      case 'era': return '👑'
      case 'period': return '📜'
      case 'event': return '⚡'
      default: return '❓'
    }
  }

  const getTypeLabel = (dateType: string) => {
    switch (dateType) {
      case 'era': return 'Ära'
      case 'period': return 'Periode'
      case 'event': return 'Ereignis'
      default: return 'Unbekannt'
    }
  }

  return (
    <Dialog open={!!selectedEntry} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="max-w-4xl w-full bg-gray-900 rounded-xl p-6 border border-amber-700 shadow-xl overflow-y-auto max-h-[80vh] text-white">
          
          {/* Header */}
          <div className="flex justify-between items-start mb-4">
            <Dialog.Title className="text-xl font-bold text-amber-300 font-serif">
              <span className="text-amber-500 mr-2">
                {getTypeIcon(selectedEntry.dateType)}
              </span>
              {selectedEntry.name}
              <span className="text-amber-500 ml-2">❖</span>
            </Dialog.Title>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-red-400 transition-colors p-1 rounded hover:bg-red-900/20"
              title="Schließen"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
          
          {/* Content */}
          <div className="border-t border-amber-900/30 pt-4 space-y-4">
            
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-amber-200/60 text-xs mb-1">Typ</div>
                <div className="text-amber-300 font-semibold flex items-center gap-2">
                  {getTypeIcon(selectedEntry.dateType)}
                  {getTypeLabel(selectedEntry.dateType)}
                </div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-amber-200/60 text-xs mb-1">Datum/Zeitraum</div>
                <div className="text-amber-300 font-semibold">{selectedEntry.displayDate}</div>
              </div>
              
              <div className="bg-black/30 rounded-lg p-3">
                <div className="text-amber-200/60 text-xs mb-1">Zeitalter</div>
                <div className="text-amber-300 font-semibold">{getEraName(selectedEntry.startYear)}</div>
              </div>
            </div>
            
            {/* Dauer (nur für Äras und Perioden) */}
            {selectedEntry.duration && (
              <div className="bg-amber-900/10 border border-amber-900/30 rounded-lg p-3">
                <div className="text-amber-200/60 text-xs mb-1">Dauer</div>
                <div className="text-amber-300 font-medium">
                  {selectedEntry.duration} Jahre
                  {selectedEntry.startYear && selectedEntry.endYear && (
                    <span className="text-amber-200/80 text-sm ml-2">
                      ({selectedEntry.startYear} bis {selectedEntry.endYear})
                    </span>
                  )}
                </div>
              </div>
            )}
            
            {/* Beschreibung */}
            <div className="bg-black/20 rounded-lg p-4">
              <div className="text-amber-200/60 text-xs mb-2">Beschreibung</div>
              <div className="text-gray-200 leading-relaxed whitespace-pre-wrap">
                {selectedEntry.description}
              </div>
            </div>
            
            {/* Technische Details (collapsed by default) */}
            <details className="bg-gray-800/50 rounded-lg">
              <summary className="cursor-pointer p-3 text-sm text-gray-400 hover:text-gray-300 transition-colors">
                Technische Details anzeigen
              </summary>
              <div className="px-3 pb-3 space-y-2 text-xs text-gray-400 border-t border-gray-700/50 pt-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-gray-500">Datenbank-ID:</span> {selectedEntry.id}
                  </div>
                  <div>
                    <span className="text-gray-500">Sort-Key:</span> {selectedEntry.sortKey}
                  </div>
                  <div>
                    <span className="text-gray-500">Lane:</span> {selectedEntry.lane}
                  </div>
                  <div>
                    <span className="text-gray-500">Erstellt am:</span> {new Date(selectedEntry.dbEntry.created_at).toLocaleString('de-DE')}
                  </div>
                </div>
                
                {/* Rohe Datumsfelder aus der DB */}
                <div className="mt-3 pt-2 border-t border-gray-700/30">
                  <div className="text-gray-500 mb-1">Rohdaten aus Datenbank:</div>
                  <div className="font-mono text-xs bg-black/30 p-2 rounded">
                    {selectedEntry.dbEntry.event_date && (
                      <div>event_date: {selectedEntry.dbEntry.event_date}</div>
                    )}
                    {selectedEntry.dbEntry.starting_date && (
                      <div>starting_date: {selectedEntry.dbEntry.starting_date}</div>
                    )}
                    {selectedEntry.dbEntry.end_date && (
                      <div>end_date: {selectedEntry.dbEntry.end_date}</div>
                    )}
                  </div>
                </div>
              </div>
            </details>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}

export default EntryDetailModal