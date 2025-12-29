'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock, Plus, RotateCcw, Calendar, Moon, Sun, Sunrise, Sunset } from 'lucide-react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';

// ------------------------------------------------------------
// Konfiguration
// ------------------------------------------------------------
const CLOCK_TABLE = 'ingame_clock';
const CLOCK_TIME_COL = 'ingame_timestamp';
const CLOCK_GAME_ID_COL = 'game_id';

// Ingame Startzeit (UTC)
const INITIAL_ISO = '1337-05-23T08:00:00.000Z';

type TimeTrackerProps = {
  gameId: number;
};

const TimeTracker: React.FC<TimeTrackerProps> = ({ gameId }) => {
  const supabase = useSupabaseClient();

  // ✅ STABIL: verhindert useEffect loops
  const INITIAL_DATE = useMemo(() => new Date(INITIAL_ISO), []);

  const [gameDate, setGameDate] = useState<Date>(INITIAL_DATE);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);

  const [isLoadingClock, setIsLoadingClock] = useState(true);
  const [isSavingClock, setIsSavingClock] = useState(false);

  // Edit Fields (für UTC)
  const [editYear, setEditYear] = useState('');
  const [editMonth, setEditMonth] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editHour, setEditHour] = useState('');
  const [editMinute, setEditMinute] = useState('');

  // Presets
  const TIME_PRESETS = useMemo(
    () => [
      { label: 'Untersuchen', hours: 0, minutes: 10, icon: <Clock size={18} /> },
      { label: 'Kurze Rast', hours: 1, minutes: 0, icon: <CoffeeCupIcon /> },
      { label: 'Halber Tag', hours: 4, minutes: 0, icon: <Sun size={18} /> },
      { label: 'Lange Rast', hours: 8, minutes: 0, icon: <Moon size={18} /> },
      { label: 'Ganzer Tag', hours: 24, minutes: 0, icon: <Sunrise size={18} /> },
      { label: 'Woche', hours: 168, minutes: 0, icon: <Calendar size={18} /> },
    ],
    []
  );

  // ---------------------------------------------
  // DB helpers
  // ---------------------------------------------
  const fetchClock = useCallback(async () => {
    // Prefer maybeSingle if available in your supabase client version
    const base = supabase
      .from(CLOCK_TABLE)
      .select(CLOCK_TIME_COL)
      .eq(CLOCK_GAME_ID_COL, gameId)
      .limit(1);

    const maybeSingleFn = (base as any).maybeSingle;
    if (typeof maybeSingleFn === 'function') {
      return await (base as any).maybeSingle();
    }

    // Fallback: single() (kann bei "no rows" werfen/err)
    return await base.single();
  }, [supabase, gameId]);

  const upsertClock = useCallback(
    async (date: Date) => {
      return await supabase
        .from(CLOCK_TABLE)
        .upsert(
          {
            [CLOCK_GAME_ID_COL]: gameId,
            [CLOCK_TIME_COL]: date.toISOString(),
          } as any,
          { onConflict: CLOCK_GAME_ID_COL as any }
        );
    },
    [supabase, gameId]
  );

  // ---------------------------------------------
  // Load Clock
  // ---------------------------------------------
  useEffect(() => {
    let cancelled = false;

    (async () => {
      // ✅ WICHTIG: wenn gameId fehlt, NICHT ewig laden
      if (!gameId || Number.isNaN(gameId)) {
        setIsLoadingClock(false);
        return;
      }

      setIsLoadingClock(true);

      try {
        const { data, error } = await fetchClock();

        if (cancelled) return;

        const ts = data?.[CLOCK_TIME_COL as keyof typeof data] as unknown as string | undefined;

        if (!error && ts) {
          setGameDate(new Date(ts));
        } else {
          // Keine Zeile / Fehler -> initial setzen + upsert versuchen
          setGameDate(INITIAL_DATE);
          await upsertClock(INITIAL_DATE);
        }
      } catch {
        if (cancelled) return;
        setGameDate(INITIAL_DATE);
        // optional: upsert versuchen
        try {
          await upsertClock(INITIAL_DATE);
        } catch {
          // ignore
        }
      } finally {
        if (!cancelled) setIsLoadingClock(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gameId, fetchClock, upsertClock, INITIAL_DATE]);

  // ---------------------------------------------
  // Persist (manuell aufgerufen bei Änderungen)
  // ---------------------------------------------
  const persistGameDate = useCallback(
    async (date: Date) => {
      if (!gameId || Number.isNaN(gameId)) return;

      setIsSavingClock(true);
      try {
        const { error } = await upsertClock(date);
        if (error) console.error('Failed to persist ingame clock:', error);
      } finally {
        setIsSavingClock(false);
      }
    },
    [gameId, upsertClock]
  );

  // ---------------------------------------------
  // Logik: alles in UTC rechnen
  // ---------------------------------------------
  const advanceTime = useCallback(
    (hoursToAdd: number, minutesToAdd: number) => {
      const newDate = new Date(gameDate);
      newDate.setUTCHours(newDate.getUTCHours() + hoursToAdd);
      newDate.setUTCMinutes(newDate.getUTCMinutes() + minutesToAdd);
      setGameDate(newDate);
      void persistGameDate(newDate);
    },
    [gameDate, persistGameDate]
  );

  const handleManualAdd = useCallback(() => {
    const h = parseInt(hours, 10) || 0;
    const m = parseInt(minutes, 10) || 0;
    if (h === 0 && m === 0) return;

    advanceTime(h, m);
    setHours('');
    setMinutes('');
  }, [hours, minutes, advanceTime]);

  const handleKeyPress = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleManualAdd();
    },
    [handleManualAdd]
  );

  const startEditingDate = useCallback(() => {
    // UTC values
    setEditYear(gameDate.getUTCFullYear().toString());
    setEditMonth((gameDate.getUTCMonth() + 1).toString());
    setEditDay(gameDate.getUTCDate().toString());
    setEditHour(gameDate.getUTCHours().toString());
    setEditMinute(gameDate.getUTCMinutes().toString());
    setIsEditingDate(true);
  }, [gameDate]);

  const saveDateEdit = useCallback(() => {
    const year = parseInt(editYear, 10) || 1337;
    const month = (parseInt(editMonth, 10) || 1) - 1; // 0-based
    const day = parseInt(editDay, 10) || 1;
    const hour = parseInt(editHour, 10) || 0;
    const minute = parseInt(editMinute, 10) || 0;

    const ms = Date.UTC(year, month, day, hour, minute, 0, 0);
    const newDate = new Date(ms);

    setGameDate(newDate);
    setIsEditingDate(false);
    void persistGameDate(newDate);
  }, [editYear, editMonth, editDay, editHour, editMinute, persistGameDate]);

  const cancelDateEdit = useCallback(() => setIsEditingDate(false), []);

  const resetTime = useCallback(() => {
    setGameDate(INITIAL_DATE);
    setHours('');
    setMinutes('');
    void persistGameDate(INITIAL_DATE);
  }, [INITIAL_DATE, persistGameDate]);

  // ---------------------------------------------
  // Formatter: fix UTC, damit es “Ingame” bleibt
  // ---------------------------------------------
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'UTC',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);

  const formatTime = (date: Date) =>
    new Intl.DateTimeFormat('de-DE', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

  const getTimeOfDay = (date: Date) => {
    const hour = date.getUTCHours();
    if (hour >= 5 && hour < 12) return { label: 'Morgen', icon: <Sunrise className="text-[var(--accent)]" /> };
    if (hour >= 12 && hour < 17) return { label: 'Nachmittag', icon: <Sun className="text-[var(--accent)]" /> };
    if (hour >= 17 && hour < 21) return { label: 'Abend', icon: <Sunset className="text-[var(--primary)]" /> };
    return { label: 'Nacht', icon: <Moon className="text-[var(--foreground-muted)]" /> };
  };

  const timeOfDay = getTimeOfDay(gameDate);

  // ---------------------------------------------
  // UI
  // ---------------------------------------------
  if (isLoadingClock) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg border border-[hsla(30,50%,50%,0.3)] bg-[var(--background-secondary)] p-6 text-[var(--foreground)] animate-pulse">
        <span className="font-[var(--font-serif)]">Lade Zeit…</span>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col gap-4 overflow-y-auto rounded-lg border border-[hsla(30,50%,50%,0.3)] bg-[var(--background-secondary)] p-6 text-[var(--foreground)]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[hsla(30,50%,50%,0.3)] pb-3">
        <div className="flex items-center gap-3">
          <Clock className="text-[var(--accent)]" />
          <div className="flex flex-col leading-tight">
            <span className="font-[var(--font-serif)] text-lg text-[var(--accent)]">Kampagnen-Zeit</span>
            {isSavingClock ? (
              <span className="text-xs text-[var(--foreground-muted)]">speichert…</span>
            ) : (
              <span className="text-xs text-[var(--foreground-muted)]">UTC-Ingame-Zeit</span>
            )}
          </div>
        </div>

        <button
          onClick={resetTime}
          className="btn btn-sm bg-[hsla(30,50%,50%,0.15)] border border-[hsla(30,50%,50%,0.3)] text-[var(--foreground)] hover:bg-[hsla(30,50%,50%,0.25)]"
          title="Zur Startzeit zurücksetzen"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Anzeige / Edit */}
      {!isEditingDate ? (
        <button
          onClick={startEditingDate}
          className="group w-full rounded-xl border border-[hsla(30,50%,50%,0.3)] bg-[var(--background)] p-5 text-left shadow-[var(--shadow-deep)] hover:shadow-[var(--shadow-ember)] transition"
        >
          <div className="mb-2 flex items-center justify-center gap-2 text-sm text-[var(--accent)]">
            <span className="inline-flex items-center">{timeOfDay.icon}</span>
            <span className="font-medium">{timeOfDay.label}</span>
          </div>

          <div className="text-center font-[var(--font-mono)] text-5xl font-bold text-[var(--accent)] drop-shadow-[var(--glow-warm)]">
            {formatTime(gameDate)}
          </div>

          <div className="mt-2 text-center font-[var(--font-serif)] text-sm text-[var(--foreground-muted)]">
            {formatDate(gameDate)}
          </div>

          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-[var(--foreground-muted)] opacity-80">
            <Calendar size={14} />
            <span>klicken zum Bearbeiten</span>
          </div>
        </button>
      ) : (
        <div className="rounded-xl border border-[hsla(30,50%,50%,0.3)] bg-[var(--background)] p-5 shadow-[var(--shadow-ember)]">
          <div className="mb-3 text-sm font-medium text-[var(--accent)]">Datum & Zeit bearbeiten (UTC)</div>

          <div className="grid grid-cols-3 gap-3">
            <DateInput label="Tag" value={editDay} onChange={setEditDay} max={31} />
            <DateInput label="Monat" value={editMonth} onChange={setEditMonth} max={12} />
            <DateInput label="Jahr" value={editYear} onChange={setEditYear} max={9999} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3">
            <DateInput label="Stunde" value={editHour} onChange={setEditHour} max={23} />
            <DateInput label="Minute" value={editMinute} onChange={setEditMinute} max={59} />
          </div>

          <div className="mt-4 flex gap-3">
            <button
              onClick={saveDateEdit}
              className="btn btn-sm flex-1 bg-[var(--primary)] text-[var(--background)] hover:bg-[var(--primary-dark)] border-none"
            >
              Speichern
            </button>
            <button
              onClick={cancelDateEdit}
              className="btn btn-sm flex-1 bg-transparent border border-[hsla(30,50%,50%,0.3)] text-[var(--foreground)] hover:bg-[hsla(30,50%,50%,0.1)]"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Presets */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {TIME_PRESETS.map((p) => (
          <button
            key={p.label}
            onClick={() => advanceTime(p.hours, p.minutes)}
            className="btn btn-sm h-auto flex flex-col gap-2 rounded-xl border border-[hsla(30,50%,50%,0.3)] bg-[hsla(30,50%,50%,0.12)] text-[var(--foreground)] hover:bg-[hsla(30,50%,50%,0.22)]"
          >
            <span className="text-[var(--accent)]">{p.icon}</span>
            <span className="text-xs font-medium">{p.label}</span>
            <span className="text-[10px] text-[var(--foreground-muted)]">
              +{p.hours ? `${p.hours}h` : ''}{p.hours && p.minutes ? ' ' : ''}{p.minutes ? `${p.minutes}m` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Manual Add */}
      <div className="rounded-xl border border-[hsla(30,50%,50%,0.3)] bg-[hsla(30,50%,50%,0.08)] p-5">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--accent)]">
          <Plus size={16} />
          <span>Benutzerdefiniert</span>
        </div>

        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Std</label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="0"
              min="0"
              className="input input-bordered input-sm w-full bg-[var(--background)] text-[var(--foreground)] border-[hsla(30,50%,50%,0.3)] focus:border-[var(--accent)] focus:outline-none text-center"
            />
          </div>

          <div className="flex-1">
            <label className="mb-1 block text-xs text-[var(--foreground-muted)]">Min</label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="0"
              min="0"
              className="input input-bordered input-sm w-full bg-[var(--background)] text-[var(--foreground)] border-[hsla(30,50%,50%,0.3)] focus:border-[var(--accent)] focus:outline-none text-center"
            />
          </div>

          <button
            onClick={handleManualAdd}
            disabled={!hours && !minutes}
            className={`btn btn-sm ${(!hours && !minutes) ? 'btn-disabled opacity-50' : 'btn-primary text-[var(--background)]'}`}
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

// ------------------------------------------------------------
// Kleine Helfer
// ------------------------------------------------------------
const DateInput = ({
  label,
  value,
  onChange,
  max,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
}) => (
  <div>
    <label className="mb-1 block text-xs text-[var(--foreground-muted)]">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      min="0"
      max={max}
      className="input input-bordered input-sm w-full bg-[var(--background-secondary)] text-[var(--foreground)] border-[hsla(30,50%,50%,0.3)] focus:border-[var(--accent)] focus:outline-none text-center"
    />
  </div>
);

// Custom Icon für “Kurze Rast”
const CoffeeCupIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
    <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
    <line x1="6" y1="1" x2="6" y2="4" />
    <line x1="10" y1="1" x2="10" y2="4" />
    <line x1="14" y1="1" x2="14" y2="4" />
  </svg>
);

export default TimeTracker;
