// components/GameHeader.tsx
import React from 'react';
import Link from 'next/link';

interface GameHeaderProps {
  id: number;
  name: string;
  playerCount: number;
  lastPlayed?: string | null;
  active: boolean;
}

const GameHeader: React.FC<GameHeaderProps> = ({
  id,
  name,
  playerCount,
  lastPlayed,
  active,
}) => {
  const status = active ? 'active' : 'paused';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-amber-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '⚡';
      case 'paused': return '⏸️';
      case 'completed': return '🏆';
      default: return '❓';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Aktiv';
      case 'paused': return 'Pausiert';
      case 'completed': return 'Abgeschlossen';
      default: return 'Unbekannt';
    }
  };

  return (
    <header className="bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6 shadow-lg mb-6">
      <div className="text-center mb-4">
        <h1 className="font-serif text-3xl text-amber-200 tracking-wider mb-2">
          <span className="text-amber-500">❖</span> {name} <span className="text-amber-500">❖</span>
        </h1>
      </div>

      <div className="flex items-center justify-center mb-4">
        <div className="flex-1 border-t border-amber-900/30"></div>
        <span className="px-4 text-amber-500/50">✦</span>
        <div className="flex-1 border-t border-amber-900/30"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-center">
        <div>
          <div className="text-amber-300/70 font-serif text-sm mb-1">Status</div>
          <div className={`font-serif text-lg ${getStatusColor(status)}`}>
            {getStatusIcon(status)} {getStatusText(status)}
          </div>
        </div>
        <div>
          <div className="text-amber-300/70 font-serif text-sm mb-1">Abenteurer</div>
          <div className="font-serif text-lg text-amber-200">
            <span className="text-amber-500">♦</span> {playerCount} Helden
          </div>
        </div>
        <div>
          <div className="text-amber-300/70 font-serif text-sm mb-1">Letztes Abenteuer</div>
          <div className="font-serif text-lg text-amber-200">
            {lastPlayed ? (
              <span className="text-amber-400">
                {new Date(lastPlayed).toLocaleDateString('de-DE')}
              </span>
            ) : (
              <span className="text-amber-300/50 italic">Noch nicht gespielt</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <Link href={`/games/${id}/logs`} className="game-header-link">
          ✎ Tagebuch
        </Link>
        <Link href={`/games/${id}/characters`} className="game-header-link">
          ⚔️ Charaktere
        </Link>
        <Link href={`/games/${id}/encyclopedia`} className="game-header-link">
          📚 Enzyklopädie
        </Link>
        <Link href={`/games/${id}/settings`} className="game-header-link">
          ⚙️ Einstellungen
        </Link>
      </div>

      <div className="text-center mt-4 text-amber-500/30 font-serif text-xs">
        ✧ ✦ ✧
      </div>
    </header>
  );
};

export default GameHeader;
