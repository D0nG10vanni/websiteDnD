'use client';

import React, { useMemo, useState } from 'react';

type StatKey =
  | 'INT'
  | 'REF'
  | 'DEX'
  | 'BODY'
  | 'SPD'
  | 'EMP'
  | 'CRA'
  | 'WILL'
  | 'LUCK';

type Mode = 'dc' | 'opposed' | 'target_dc';

type Character = {
  id: string;
  name: string;
  luckMax: number;
  stats: Record<StatKey, number>;
  skills: Record<string, number>;
};

type SkillDef = {
  key: string;
  label: string;
  stat: StatKey;
};

type Tab = 'skill' | 'damage';

const DIFFICULTY_PRESETS = [
  { key: 'easy', label: 'Easy', dc: 10 },
  { key: 'average', label: 'Average', dc: 14 },
  { key: 'challenging', label: 'Challenging', dc: 18 },
  { key: 'difficult', label: 'Difficult', dc: 20 },
  { key: 'nearly_impossible', label: 'Nearly Impossible', dc: 30 },
] as const;

const SITUATION_MODS = [
  { key: 'no_parts', label: "Don’t have the right parts", dcAdd: 2 },
  { key: 'no_tools', label: "Don’t have the right tools", dcAdd: 3 },
  { key: 'distracting', label: 'Distracting environment', dcAdd: 3 },
  { key: 'under_attack', label: 'Under attack', dcAdd: 5 },
  { key: 'drunk', label: 'Drunk', dcAdd: 3 },
  { key: 'sleep_deprived', label: 'Sleep-deprived', dcAdd: 3 },
  { key: 'hostile', label: 'Hostile environment', dcAdd: 4 },
  { key: 'glare', label: 'Glaring light', dcAdd: 2 },
  { key: 'dim', label: 'Dim light', dcAdd: 2 },
  { key: 'darkness', label: 'Darkness', dcAdd: 5 },
] as const;

const SKILLS: SkillDef[] = [
  { key: 'swordsmanship', label: 'Swordsmanship', stat: 'REF' },
  { key: 'pick_lock', label: 'Pick Lock', stat: 'DEX' },
  { key: 'spell_casting', label: 'Spell Casting', stat: 'WILL' },
  { key: 'persuasion', label: 'Persuasion', stat: 'EMP' },
  { key: 'athletics', label: 'Athletics', stat: 'BODY' },
  { key: 'awareness', label: 'Awareness', stat: 'INT' },
  { key: 'crafting', label: 'Crafting', stat: 'CRA' },
];

const DUMMY_CHARACTERS: Character[] = [
  {
    id: 'geralt',
    name: 'Geralt (Dummy)',
    luckMax: 5,
    stats: { INT: 7, REF: 9, DEX: 7, BODY: 9, SPD: 7, EMP: 3, CRA: 3, WILL: 7, LUCK: 5 },
    skills: {
      swordsmanship: 11,
      athletics: 6,
      awareness: 6,
      persuasion: 1,
      pick_lock: 0,
      spell_casting: 0,
      crafting: 0,
    },
  },
  {
    id: 'dandelion',
    name: 'Dandelion (Dummy)',
    luckMax: 7,
    stats: { INT: 6, REF: 5, DEX: 5, BODY: 4, SPD: 6, EMP: 8, CRA: 4, WILL: 5, LUCK: 7 },
    skills: {
      swordsmanship: 2,
      athletics: 2,
      awareness: 5,
      persuasion: 8,
      pick_lock: 5,
      spell_casting: 0,
      crafting: 2,
    },
  },
  {
    id: 'wolf',
    name: 'Wolf (Dummy Target)',
    luckMax: 0,
    stats: { INT: 2, REF: 6, DEX: 6, BODY: 7, SPD: 8, EMP: 1, CRA: 0, WILL: 4, LUCK: 0 },
    skills: {
      swordsmanship: 0,
      athletics: 5,
      awareness: 6,
      persuasion: 0,
      pick_lock: 0,
      spell_casting: 0,
      crafting: 0,
    },
  },
];

type CheckHistoryEntry = {
  id: string;
  ts: number;
  kind: 'check';
  actorName: string;
  skillLabel: string;
  mode: Mode;
  breakdown: string;
  success: boolean;
};

type ManualDie = {
  id: string;
  label: string;
  faces: number;
  value: number | null; // wird manuell eingetragen
};

type DamageHistoryEntry = {
  id: string;
  ts: number;
  kind: 'damage';
  title: string;
  total: number;
  breakdown: string;
};

type HistoryEntry = CheckHistoryEntry | DamageHistoryEntry;

function clampInt(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function isValidInteger(v: number | null) {
  return v !== null && Number.isFinite(v) && Number.isInteger(v);
}

function isValidFaces(v: number | null) {
  return isValidInteger(v) && (v as number) >= 2 && (v as number) <= 1000;
}

function isValidDieValue(value: number | null, faces: number) {
  return isValidInteger(value) && (value as number) >= 1 && (value as number) <= faces;
}

function fmtSigned(n: number) {
  return `${n >= 0 ? '+' : ''}${n}`;
}

export default function SkillCheck() {
  const [tab, setTab] = useState<Tab>('skill');

  // ===== Skill Check State =====
  const [mode, setMode] = useState<Mode>('dc');
  const [actorId, setActorId] = useState(DUMMY_CHARACTERS[0].id);
  const [skillKey, setSkillKey] = useState(SKILLS[0].key);

  const [opponentId, setOpponentId] = useState(DUMMY_CHARACTERS[2].id);
  const [opponentSkillKey, setOpponentSkillKey] = useState(SKILLS[2].key);

  // Spieler würfelt selbst -> Werte werden eingegeben (nicht simuliert)
  const [actorD10, setActorD10] = useState<number | null>(null);
  const [defenderD10, setDefenderD10] = useState<number | null>(null);

  const [presetKey, setPresetKey] =
    useState<(typeof DIFFICULTY_PRESETS)[number]['key']>('average');
  const [manualDc, setManualDc] = useState<number>(
    DIFFICULTY_PRESETS.find(p => p.key === 'average')!.dc
  );

  const [selectedMods, setSelectedMods] = useState<Record<string, boolean>>({});
  const [customDcMod, setCustomDcMod] = useState<number>(0);

  const [targetStat, setTargetStat] = useState<StatKey>('WILL');
  const [targetStatValue, setTargetStatValue] = useState<number>(4);

  const [luckRemaining, setLuckRemaining] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const c of DUMMY_CHARACTERS) init[c.id] = c.luckMax;
    return init;
  });
  const [luckSpend, setLuckSpend] = useState<number>(0);

  const [checkError, setCheckError] = useState<string>('');

  // ===== Damage / Dice State =====
  const [damageTitle, setDamageTitle] = useState<string>('Damage');
  const [damageFlatBonus, setDamageFlatBonus] = useState<number>(0);
  const [dice, setDice] = useState<ManualDie[]>([
    { id: `die_${Date.now()}_1`, label: 'Die 1', faces: 6, value: null },
    { id: `die_${Date.now()}_2`, label: 'Die 2', faces: 6, value: null },
  ]);
  const [damageError, setDamageError] = useState<string>('');

  // ===== History =====
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const actor = useMemo(() => DUMMY_CHARACTERS.find(c => c.id === actorId)!, [actorId]);
  const opponent = useMemo(
    () => DUMMY_CHARACTERS.find(c => c.id === opponentId)!,
    [opponentId]
  );

  const skillDef = useMemo(() => SKILLS.find(s => s.key === skillKey)!, [skillKey]);
  const opponentSkillDef = useMemo(
    () => SKILLS.find(s => s.key === opponentSkillKey)!,
    [opponentSkillKey]
  );

  const actorSkillValue = actor.skills[skillKey] ?? 0;
  const actorStatValue = actor.stats[skillDef.stat] ?? 0;

  const oppSkillValue = opponent.skills[opponentSkillKey] ?? 0;
  const oppStatValue = opponent.stats[opponentSkillDef.stat] ?? 0;

  const presetDc = useMemo(
    () => DIFFICULTY_PRESETS.find(p => p.key === presetKey)!.dc,
    [presetKey]
  );

  const dcModsSum = useMemo(() => {
    let sum = 0;
    for (const m of SITUATION_MODS) {
      if (selectedMods[m.key]) sum += m.dcAdd;
    }
    sum += Number.isFinite(customDcMod) ? customDcMod : 0;
    return sum;
  }, [selectedMods, customDcMod]);

  const effectiveDc = useMemo(() => {
    if (mode === 'dc') return manualDc + dcModsSum;
    if (mode === 'target_dc') return targetStatValue * 3 + dcModsSum;
    return 0;
  }, [mode, manualDc, targetStatValue, dcModsSum]);

  const canSpendLuckMax = useMemo(() => {
    const remaining = luckRemaining[actor.id] ?? 0;
    return clampInt(remaining, 0, 20);
  }, [luckRemaining, actor.id]);

  const damageDiceSum = useMemo(() => {
    return dice.reduce((acc, d) => acc + (d.value ?? 0), 0);
  }, [dice]);

  const damageTotal = useMemo(() => {
    return damageDiceSum + (Number.isFinite(damageFlatBonus) ? damageFlatBonus : 0);
  }, [damageDiceSum, damageFlatBonus]);

  function toggleMod(key: string) {
    setSelectedMods(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function resetLuck() {
    setLuckRemaining(() => {
      const next: Record<string, number> = {};
      for (const c of DUMMY_CHARACTERS) next[c.id] = c.luckMax;
      return next;
    });
    setLuckSpend(0);
  }

  function resolveCheck() {
    setCheckError('');

    const spend = clampInt(luckSpend, 0, canSpendLuckMax);

    // Skill Checks sind im Witcher i.d.R. d10 -> wir validieren 1..10
    const d10Valid = isValidInteger(actorD10) && (actorD10 as number) >= 1 && (actorD10 as number) <= 10;
    if (!d10Valid) {
      setCheckError('Bitte gib einen gültigen d10-Wert für den Spieler ein (1–10).');
      return;
    }

    if (mode === 'opposed') {
      const defValid =
        isValidInteger(defenderD10) &&
        (defenderD10 as number) >= 1 &&
        (defenderD10 as number) <= 10;

      if (!defValid) {
        setCheckError('Bitte gib einen gültigen d10-Wert für den Defender ein (1–10).');
        return;
      }
    }

    const total = (actorD10 as number) + actorSkillValue + actorStatValue + spend;

    let success = false;
    let breakdown = '';

    if (mode === 'dc') {
      success = total > effectiveDc; // tie = fail
      breakdown = [
        `Actor: ${actor.name}`,
        `Check: 1d10(${actorD10}) + Skill(${actorSkillValue}) + ${skillDef.stat}(${actorStatValue}) + Luck(${spend}) = ${total}`,
        `DC: Base(${manualDc}) + Mods(${fmtSigned(dcModsSum)}) = ${effectiveDc}`,
        success ? 'Result: SUCCESS (total > DC)' : 'Result: FAILURE (total <= DC)',
      ].join(' • ');
    }

    if (mode === 'target_dc') {
      success = total > effectiveDc; // tie = fail
      breakdown = [
        `Actor: ${actor.name}`,
        `Check: 1d10(${actorD10}) + Skill(${actorSkillValue}) + ${skillDef.stat}(${actorStatValue}) + Luck(${spend}) = ${total}`,
        `Target DC: ${targetStat}(${targetStatValue}) * 3 = ${targetStatValue * 3}`,
        `Mods(${fmtSigned(dcModsSum)}) => DC ${effectiveDc}`,
        success ? 'Result: SUCCESS (total > DC)' : 'Result: FAILURE (total <= DC)',
      ].join(' • ');
    }

    if (mode === 'opposed') {
      const oppTotal = (defenderD10 as number) + oppSkillValue + oppStatValue;
      success = total > oppTotal; // tie -> defender wins
      breakdown = [
        `Actor: ${actor.name}`,
        `Actor: 1d10(${actorD10}) + Skill(${actorSkillValue}) + ${skillDef.stat}(${actorStatValue}) + Luck(${spend}) = ${total}`,
        `Defender: ${opponent.name}`,
        `Defender: 1d10(${defenderD10}) + Skill(${oppSkillValue}) + ${opponentSkillDef.stat}(${oppStatValue}) = ${oppTotal}`,
        success ? 'Result: SUCCESS (actor > defender)' : 'Result: FAILURE (actor <= defender; tie goes to defender)',
      ].join(' • ');
    }

    if (spend > 0) {
      setLuckRemaining(prev => ({
        ...prev,
        [actor.id]: clampInt((prev[actor.id] ?? 0) - spend, 0, 999),
      }));
    }

    const entry: CheckHistoryEntry = {
      id: `${Date.now()}_${Math.random()}`,
      ts: Date.now(),
      kind: 'check',
      actorName: actor.name,
      skillLabel: skillDef.label,
      mode,
      breakdown,
      success,
    };

    setHistory(prev => [entry, ...prev].slice(0, 18));

    // UX: Werte leeren
    setActorD10(null);
    setDefenderD10(null);
  }

  function addDie() {
    setDamageError('');
    setDice(prev => [
      ...prev,
      {
        id: `die_${Date.now()}_${Math.random()}`,
        label: `Die ${prev.length + 1}`,
        faces: 6,
        value: null,
      },
    ]);
  }

  function removeDie(id: string) {
    setDamageError('');
    setDice(prev => prev.filter(d => d.id !== id));
  }

  function updateDie(id: string, patch: Partial<ManualDie>) {
    setDamageError('');
    setDice(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)));
  }

  function clearDiceValues() {
    setDamageError('');
    setDice(prev => prev.map(d => ({ ...d, value: null })));
  }

  function resolveDamage() {
    setDamageError('');

    // Validate faces & values
    for (const d of dice) {
      if (!isValidFaces(d.faces)) {
        setDamageError(`Ungültige Faces bei "${d.label}". Erlaubt: 2–1000 (Integer).`);
        return;
      }
      if (!isValidDieValue(d.value, d.faces)) {
        setDamageError(`Ungültiger Wert bei "${d.label}". Erlaubt: 1–${d.faces} (Integer).`);
        return;
      }
    }

    const breakdownParts: string[] = [];
    for (const d of dice) {
      breakdownParts.push(`${d.label}: d${d.faces}=${d.value}`);
    }
    if (damageFlatBonus !== 0) breakdownParts.push(`Flat ${fmtSigned(damageFlatBonus)}`);
    breakdownParts.push(`Total=${damageTotal}`);

    const entry: DamageHistoryEntry = {
      id: `${Date.now()}_${Math.random()}`,
      ts: Date.now(),
      kind: 'damage',
      title: damageTitle.trim() ? damageTitle.trim() : 'Damage',
      total: damageTotal,
      breakdown: breakdownParts.join(' • '),
    };

    setHistory(prev => [entry, ...prev].slice(0, 18));
    clearDiceValues();
  }

  function TabButton({ t, label }: { t: Tab; label: string }) {
    const active = tab === t;
    return (
      <button
        onClick={() => {
          setTab(t);
          setCheckError('');
          setDamageError('');
        }}
        className={`px-2 py-1 text-[11px] rounded border transition ${
          active
            ? 'border-amber-500/40 text-amber-200 bg-amber-500/10'
            : 'border-white/10 text-gray-300 hover:bg-white/5'
        }`}
      >
        {label}
      </button>
    );
  }

  return (
    <div className="h-full w-full bg-[#0b0b0b] text-gray-200 p-4 overflow-y-auto custom-scrollbar">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-amber-500/80 font-bold">
            Checks & Dice
          </div>
          <div className="text-sm text-gray-400">
            No simulation — values are always entered manually.
          </div>
        </div>
        <div className="flex gap-2">
          <TabButton t="skill" label="Skill Check" />
          <TabButton t="damage" label="Damage / Dice" />
        </div>
      </div>

      {tab === 'skill' && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
                Setup
              </div>
              <button
                onClick={resetLuck}
                className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition"
                title="Refill Luck (Dummy: wie Session-Start)"
              >
                Reset Luck
              </button>
            </div>

            <label className="block text-[11px] text-gray-400 mb-1">Mode</label>
            <div className="flex gap-2 mb-3 flex-wrap">
              {(['dc', 'opposed', 'target_dc'] as Mode[]).map(m => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setCheckError('');
                    setActorD10(null);
                    setDefenderD10(null);
                  }}
                  className={`px-2 py-1 text-[11px] rounded border transition ${
                    mode === m
                      ? 'border-amber-500/40 text-amber-200 bg-amber-500/10'
                      : 'border-white/10 text-gray-300 hover:bg-white/5'
                  }`}
                >
                  {m === 'dc' ? 'Against DC' : m === 'opposed' ? 'Opposed' : 'Target DC (Stat*3)'}
                </button>
              ))}
            </div>

            <label className="block text-[11px] text-gray-400 mb-1">Actor</label>
            <select
              value={actorId}
              onChange={e => {
                setActorId(e.target.value);
                setLuckSpend(0);
                setActorD10(null);
                setDefenderD10(null);
                setCheckError('');
              }}
              className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px] mb-3"
            >
              {DUMMY_CHARACTERS.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name} (Luck {luckRemaining[c.id] ?? c.luckMax}/{c.luckMax})
                </option>
              ))}
            </select>

            <label className="block text-[11px] text-gray-400 mb-1">Skill</label>
            <select
              value={skillKey}
              onChange={e => {
                setSkillKey(e.target.value);
                setCheckError('');
              }}
              className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
            >
              {SKILLS.map(s => (
                <option key={s.key} value={s.key}>
                  {s.label} (Stat: {s.stat})
                </option>
              ))}
            </select>

            <div className="mt-3 text-[12px] text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Stat ({skillDef.stat})</span>
                <span className="font-mono">{actorStatValue}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Skill</span>
                <span className="font-mono">{actorSkillValue}</span>
              </div>
            </div>

            {/* Manual d10 inputs */}
            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Player d10 (1–10)</label>
                  <input
                    inputMode="numeric"
                    type="number"
                    min={1}
                    max={10}
                    value={actorD10 ?? ''}
                    onChange={e => {
                      const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                      setActorD10(Number.isFinite(v as number) ? (v as number) : null);
                      setCheckError('');
                    }}
                    className={`w-full bg-[#121212] border rounded px-2 py-1 text-[12px] ${
                      checkError && !(isValidInteger(actorD10) && actorD10! >= 1 && actorD10! <= 10)
                        ? 'border-red-500/40'
                        : 'border-white/10'
                    }`}
                    placeholder="e.g. 7"
                  />
                </div>

                {mode === 'opposed' && (
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Defender d10 (1–10)</label>
                    <input
                      inputMode="numeric"
                      type="number"
                      min={1}
                      max={10}
                      value={defenderD10 ?? ''}
                      onChange={e => {
                        const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                        setDefenderD10(Number.isFinite(v as number) ? (v as number) : null);
                        setCheckError('');
                      }}
                      className={`w-full bg-[#121212] border rounded px-2 py-1 text-[12px] ${
                        checkError &&
                        mode === 'opposed' &&
                        !(isValidInteger(defenderD10) && defenderD10! >= 1 && defenderD10! <= 10)
                          ? 'border-red-500/40'
                          : 'border-white/10'
                      }`}
                      placeholder="e.g. 4"
                    />
                  </div>
                )}
              </div>

              {checkError && (
                <div className="mt-2 text-[11px] text-red-300 border border-red-500/20 bg-red-500/5 rounded p-2">
                  {checkError}
                </div>
              )}
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <label className="block text-[11px] text-gray-400 mb-1">
                Luck spend (declare before resolve)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min={0}
                  max={canSpendLuckMax}
                  value={clampInt(luckSpend, 0, canSpendLuckMax)}
                  onChange={e => setLuckSpend(parseInt(e.target.value, 10))}
                  className="w-full"
                />
                <div className="w-10 text-right text-[12px] font-mono">
                  {clampInt(luckSpend, 0, canSpendLuckMax)}
                </div>
              </div>
              <div className="text-[10px] text-gray-500 mt-1">
                Remaining: {luckRemaining[actor.id] ?? actor.luckMax} / {actor.luckMax}
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
              Difficulty / Opponent
            </div>

            {mode === 'dc' && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Preset</label>
                  <select
                    value={presetKey}
                    onChange={e => {
                      const k = e.target.value as (typeof DIFFICULTY_PRESETS)[number]['key'];
                      setPresetKey(k);
                      const p = DIFFICULTY_PRESETS.find(x => x.key === k)!;
                      setManualDc(p.dc);
                    }}
                    className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                  >
                    {DIFFICULTY_PRESETS.map(p => (
                      <option key={p.key} value={p.key}>
                        {p.label} (DC {p.dc})
                      </option>
                    ))}
                  </select>
                  <div className="mt-1 text-[10px] text-gray-500">Preset DC: {presetDc}</div>
                </div>

                <div>
                  <label className="block text-[11px] text-gray-400 mb-1">Manual DC</label>
                  <input
                    type="number"
                    value={manualDc}
                    onChange={e => setManualDc(parseInt(e.target.value || '0', 10))}
                    className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                  />
                </div>
              </div>
            )}

            {mode === 'target_dc' && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Target Stat</label>
                    <select
                      value={targetStat}
                      onChange={e => setTargetStat(e.target.value as StatKey)}
                      className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                    >
                      {(['INT', 'REF', 'DEX', 'BODY', 'SPD', 'EMP', 'CRA', 'WILL'] as StatKey[]).map(
                        k => (
                          <option key={k} value={k}>
                            {k}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">
                      Target Stat Value
                    </label>
                    <input
                      type="number"
                      value={targetStatValue}
                      onChange={e => setTargetStatValue(parseInt(e.target.value || '0', 10))}
                      className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                    />
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-gray-500">
                  Target DC = {targetStatValue} * 3 ={' '}
                  <span className="font-mono text-gray-300">{targetStatValue * 3}</span>
                </div>
              </>
            )}

            {mode === 'opposed' && (
              <>
                <label className="block text-[11px] text-gray-400 mb-1">Defender</label>
                <select
                  value={opponentId}
                  onChange={e => {
                    setOpponentId(e.target.value);
                    setCheckError('');
                  }}
                  className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px] mb-2"
                >
                  {DUMMY_CHARACTERS.filter(c => c.id !== actor.id).map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <label className="block text-[11px] text-gray-400 mb-1">Defender Skill</label>
                <select
                  value={opponentSkillKey}
                  onChange={e => {
                    setOpponentSkillKey(e.target.value);
                    setCheckError('');
                  }}
                  className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                >
                  {SKILLS.map(s => (
                    <option key={s.key} value={s.key}>
                      {s.label} (Stat: {s.stat})
                    </option>
                  ))}
                </select>

                <div className="mt-3 text-[12px] text-gray-300">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Defender Stat ({opponentSkillDef.stat})</span>
                    <span className="font-mono">{oppStatValue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Defender Skill</span>
                    <span className="font-mono">{oppSkillValue}</span>
                  </div>
                </div>
              </>
            )}

            <div className="mt-4 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest text-gray-400">
                  Modifiers (add to DC)
                </div>
                <div className="text-[11px] text-gray-300">
                  Sum: <span className="font-mono">{fmtSigned(dcModsSum)}</span>
                </div>
              </div>

              <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SITUATION_MODS.map(m => (
                  <button
                    key={m.key}
                    onClick={() => toggleMod(m.key)}
                    className={`text-left px-2 py-1 rounded border text-[11px] transition ${
                      selectedMods[m.key]
                        ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
                        : 'border-white/10 bg-black/20 text-gray-300 hover:bg-white/5'
                    }`}
                  >
                    <span className="font-mono text-gray-400 mr-2">+{m.dcAdd}</span>
                    {m.label}
                  </button>
                ))}
              </div>

              <div className="mt-2">
                <label className="block text-[11px] text-gray-400 mb-1">
                  Custom DC Mod (can be negative)
                </label>
                <input
                  type="number"
                  value={customDcMod}
                  onChange={e => setCustomDcMod(parseInt(e.target.value || '0', 10))}
                  className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                />
              </div>

              {(mode === 'dc' || mode === 'target_dc') && (
                <div className="mt-2 text-[12px] text-gray-300">
                  Effective DC: <span className="font-mono">{effectiveDc}</span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <button
                onClick={resolveCheck}
                className="w-full px-3 py-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-100 hover:bg-amber-500/25 transition font-bold tracking-widest text-[12px]"
              >
                RESOLVE CHECK
              </button>
              <div className="mt-2 text-[10px] text-gray-500">
                Success requires <span className="font-mono">total &gt; DC</span> (or{' '}
                <span className="font-mono">actor &gt; defender</span>). Tie = defender.
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'damage' && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
              Damage / Dice (manual)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Title</label>
                <input
                  value={damageTitle}
                  onChange={e => setDamageTitle(e.target.value)}
                  className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                  placeholder="e.g. Steel Sword Damage"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Flat Bonus</label>
                <input
                  type="number"
                  value={damageFlatBonus}
                  onChange={e => setDamageFlatBonus(parseInt(e.target.value || '0', 10))}
                  className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                />
              </div>
            </div>

            <div className="mt-3 border-t border-white/10 pt-3">
              <div className="flex items-center justify-between">
                <div className="text-[11px] uppercase tracking-widest text-gray-400">
                  Dice
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={addDie}
                    className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    + Die
                  </button>
                  <button
                    onClick={clearDiceValues}
                    className="px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition"
                  >
                    Clear Values
                  </button>
                </div>
              </div>

              <div className="mt-2 space-y-2">
                {dice.map(d => {
                  const facesOk = isValidFaces(d.faces);
                  const valueOk = facesOk && isValidDieValue(d.value, d.faces);
                  return (
                    <div
                      key={d.id}
                      className="p-2 rounded border border-white/10 bg-black/20"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                        <div className="sm:col-span-5">
                          <label className="block text-[11px] text-gray-400 mb-1">Label</label>
                          <input
                            value={d.label}
                            onChange={e => updateDie(d.id, { label: e.target.value })}
                            className="w-full bg-[#121212] border border-white/10 rounded px-2 py-1 text-[12px]"
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-gray-400 mb-1">Faces (dX)</label>
                          <input
                            inputMode="numeric"
                            type="number"
                            min={2}
                            max={1000}
                            value={d.faces}
                            onChange={e => {
                              const v = parseInt(e.target.value || '0', 10);
                              updateDie(d.id, { faces: Number.isFinite(v) ? v : 6, value: null });
                            }}
                            className={`w-full bg-[#121212] border rounded px-2 py-1 text-[12px] ${
                              facesOk ? 'border-white/10' : 'border-red-500/40'
                            }`}
                          />
                        </div>

                        <div className="sm:col-span-3">
                          <label className="block text-[11px] text-gray-400 mb-1">Value (1..X)</label>
                          <input
                            inputMode="numeric"
                            type="number"
                            min={1}
                            max={d.faces}
                            value={d.value ?? ''}
                            onChange={e => {
                              const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                              updateDie(d.id, { value: Number.isFinite(v as number) ? (v as number) : null });
                            }}
                            className={`w-full bg-[#121212] border rounded px-2 py-1 text-[12px] ${
                              d.value === null
                                ? 'border-white/10'
                                : valueOk
                                  ? 'border-white/10'
                                  : 'border-red-500/40'
                            }`}
                            placeholder={facesOk ? `1..${d.faces}` : '—'}
                          />
                        </div>

                        <div className="sm:col-span-1">
                          <button
                            onClick={() => removeDie(d.id)}
                            className="w-full px-2 py-1 text-[11px] rounded border border-white/10 text-gray-300 hover:text-white hover:bg-white/5 transition"
                            title="Remove die"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="mt-1 text-[10px] text-gray-500">
                        Current: d{d.faces}={d.value ?? '—'}
                      </div>
                    </div>
                  );
                })}
              </div>

              {damageError && (
                <div className="mt-2 text-[11px] text-red-300 border border-red-500/20 bg-red-500/5 rounded p-2">
                  {damageError}
                </div>
              )}

              <div className="mt-3 border-t border-white/10 pt-3 flex items-center justify-between">
                <div className="text-[12px] text-gray-300">
                  Dice Sum: <span className="font-mono">{damageDiceSum}</span> • Flat:{' '}
                  <span className="font-mono">{fmtSigned(damageFlatBonus)}</span>
                </div>
                <div className="text-[12px] text-gray-300">
                  Total: <span className="font-mono text-amber-200">{damageTotal}</span>
                </div>
              </div>

              <div className="mt-3">
                <button
                  onClick={resolveDamage}
                  className="w-full px-3 py-2 rounded bg-amber-500/15 border border-amber-500/30 text-amber-100 hover:bg-amber-500/25 transition font-bold tracking-widest text-[12px]"
                >
                  RESOLVE DAMAGE
                </button>
                <div className="mt-2 text-[10px] text-gray-500">
                  No roll simulation. You must enter every die value manually.
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border border-white/10 rounded-lg p-3">
            <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
              Quick Notes (optional)
            </div>
            <div className="text-[12px] text-gray-400 leading-relaxed">
              - Du kannst hiermit alles abbilden: Damage (z. B. 2×d6), Random Tables (d100), usw.<br />
              - “Faces” ist dein frei wählbarer Würfel (d4, d6, d8, d10, d12, d20, d100 …).<br />
              - “Value” ist das Ergebnis, das am Tisch gefallen ist.
            </div>
          </div>
        </div>
      )}

      {/* History */}
      <div className="mt-4 bg-black/30 border border-white/10 rounded-lg p-3">
        <div className="text-[11px] uppercase tracking-widest text-gray-400 mb-2">
          History
        </div>
        {history.length === 0 ? (
          <div className="text-[12px] text-gray-500 italic">No entries yet.</div>
        ) : (
          <div className="space-y-2">
            {history.map(h => {
              if (h.kind === 'check') {
                return (
                  <div
                    key={h.id}
                    className={`p-2 rounded border text-[12px] ${
                      h.success
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-red-500/20 bg-red-500/5'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] text-gray-300">
                        <span className="font-bold">{h.actorName}</span> • {h.skillLabel} •{' '}
                        <span className="text-gray-500">{h.mode}</span>
                      </div>
                      <div
                        className={`text-[11px] font-bold ${
                          h.success ? 'text-emerald-300' : 'text-red-300'
                        }`}
                      >
                        {h.success ? 'SUCCESS' : 'FAIL'}
                      </div>
                    </div>
                    <div className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                      {h.breakdown}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={h.id}
                  className="p-2 rounded border text-[12px] border-amber-500/20 bg-amber-500/5"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] text-gray-300">
                      <span className="font-bold">{h.title}</span> • <span className="text-gray-500">damage/dice</span>
                    </div>
                    <div className="text-[11px] font-bold text-amber-200">
                      TOTAL {h.total}
                    </div>
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400 leading-relaxed">
                    {h.breakdown}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
