'use client'

import { useState } from 'react'

type CoreStats = {
  INT: number
  REF: number
  DEX: number
  BODY: number
  SPD: number
  EMP: number
  CRA: number
  WILL: number
  LUCK: number
}

type DerivedStats = {
  STUN: number
  RUN: number
  LEAP: number
  HP: number
  STA: number
  ENC: number
  REC: number
  VIGOR: number
}

const baseStats: CoreStats = {
  INT: 5, REF: 5, DEX: 5, BODY: 5, SPD: 5,
  EMP: 5, CRA: 5, WILL: 5, LUCK: 5
}

const professions: Record<string, Partial<CoreStats>> = {
  Witcher: { REF: 1, DEX: 1, EMP: -4 },
  Mage: { WILL: 1, INT: 1 },
  'Man At Arms': { BODY: 1, REF: 1 },
  Bard: { EMP: 1, DEX: 1 },
  Craftsman: { INT: 1, CRA: 1 },
  Criminal: { DEX: 1, LUCK: 1 }
}

function applyProfession(stats: CoreStats, prof: string): CoreStats {
  const mods = professions[prof] || {}
  const result = { ...stats }

  for (const key in mods) {
    const stat = key as keyof CoreStats
    result[stat] += mods[stat] ?? 0
  }

  if (prof === 'Witcher') {
    result.EMP = Math.max(1, result.EMP) // can't go below 1
    result.REF = Math.min(result.REF, 14)
    result.DEX = Math.min(result.DEX, 14)
    result.EMP = Math.min(result.EMP, 6) // Witcher EMP cap
  }

  return result
}

function calcDerived(stats: CoreStats): DerivedStats {
  const STUN = Math.floor(stats.BODY / 2)
  const RUN = stats.SPD * 3
  const LEAP = Math.floor(stats.SPD / 2)
  const HP = stats.BODY + stats.WILL
  const STA = stats.BODY * 5
  const ENC = stats.BODY * 10
  const REC = STUN
  const VIGOR = stats.WILL

  return { STUN, RUN, LEAP, HP, STA, ENC, REC, VIGOR }
}

export default function StatBlockEditor() {
  const [stats, setStats] = useState<CoreStats>(baseStats)
  const [profession, setProfession] = useState<string>('Witcher')

  const modifiedStats = applyProfession(stats, profession)
  const derived = calcDerived(modifiedStats)

  const handleChange = (key: keyof CoreStats, value: string) => {
    const parsed = parseInt(value)
    if (!isNaN(parsed)) {
      setStats(prev => ({ ...prev, [key]: parsed }))
    }
  }

return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
        <h2 className="text-xl font-bold">Charakterwerte</h2>

        <div className="flex flex-col md:flex-row gap-4 items-center">
            <label className="font-medium">Beruf:</label>
            <select
                value={profession}
                onChange={(e) => setProfession(e.target.value)}
                className="select select-bordered w-full max-w-xs"
            >
                {Object.keys(professions).map((prof) => (
                    <option key={prof} value={prof}>{prof}</option>
                ))}
            </select>
        </div>

        <form className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(stats).map(([key, value]) => {
                const modValue = modifiedStats[key as keyof CoreStats];
                const isModified =
                    professions[profession] &&
                    Object.prototype.hasOwnProperty.call(professions[profession], key);
                return (
                    <div key={key} className="flex flex-col">
                        <label className="font-medium">{key}</label>
                        <input
                            type="number"
                            min={1}
                            max={14}
                            value={value}
                            onChange={(e) => handleChange(key as keyof CoreStats, e.target.value)}
                            className="input input-bordered"
                        />
                        {isModified && (
                            <span className="text-sm text-gray-500">
                                mit mod: {modValue}
                            </span>
                        )}
                    </div>
                );
            })}
        </form>

        <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">Abgeleitete Werte</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(derived).map(([key, value]) => (
                    <div key={key} className="flex flex-col">
                        <span className="font-medium">{key}</span>
                        <span className="bg-base-200 rounded p-2">{value}</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
)
}
