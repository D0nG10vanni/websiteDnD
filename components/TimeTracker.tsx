import React, { useState, useCallback } from 'react';
import { Clock, Plus, RotateCcw, Calendar } from 'lucide-react';

const TimeTracker = () => {
  // Startkonfiguration: 23. Mai 1337, 08:00 Uhr
  const INITIAL_DATE = new Date(1337, 4, 23, 8, 0);
  
  const [gameDate, setGameDate] = useState(INITIAL_DATE);
  const [hours, setHours] = useState('');
  const [minutes, setMinutes] = useState('');
  const [isEditingDate, setIsEditingDate] = useState(false);
  
  // Separate Felder für Datum-Bearbeitung
  const [editYear, setEditYear] = useState('');
  const [editMonth, setEditMonth] = useState('');
  const [editDay, setEditDay] = useState('');
  const [editHour, setEditHour] = useState('');
  const [editMinute, setEditMinute] = useState('');

  // Zeit-Presets für häufige Aktionen
  const TIME_PRESETS = [
    { label: 'Untersuchen', hours: 0, minutes: 10, icon: '🔍' },
    { label: 'Kurze Rast', hours: 1, minutes: 0, icon: '☕' },
    { label: 'Halber Tag', hours: 4, minutes: 0, icon: '🚶' },
    { label: 'Lange Rast', hours: 8, minutes: 0, icon: '🛌' },
    { label: 'Ganzer Tag', hours: 24, minutes: 0, icon: '🌅' },
    { label: 'Woche', hours: 168, minutes: 0, icon: '📅' },
  ];

  // Zeit vorwärts bewegen
  const advanceTime = useCallback((hoursToAdd: number, minutesToAdd: number) => {
    setGameDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setHours(newDate.getHours() + hoursToAdd);
      newDate.setMinutes(newDate.getMinutes() + minutesToAdd);
      return newDate;
    });
  }, []);

  // Handler für manuelle Zeitaddition
  const handleManualAdd = useCallback(() => {
    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    
    if (h === 0 && m === 0) return;
    
    advanceTime(h, m);
    setHours('');
    setMinutes('');
  }, [hours, minutes, advanceTime]);

  // Enter-Taste Handler
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualAdd();
    }
  }, [handleManualAdd]);

  // Datum-Bearbeitungsmodus starten
  const startEditingDate = useCallback(() => {
    setEditYear(gameDate.getFullYear().toString());
    setEditMonth((gameDate.getMonth() + 1).toString());
    setEditDay(gameDate.getDate().toString());
    setEditHour(gameDate.getHours().toString());
    setEditMinute(gameDate.getMinutes().toString());
    setIsEditingDate(true);
  }, [gameDate]);

  // Datum speichern
  const saveDateEdit = useCallback(() => {
    const year = parseInt(editYear) || 1337;
    const month = (parseInt(editMonth) || 1) - 1; // 0-basiert
    const day = parseInt(editDay) || 1;
    const hour = parseInt(editHour) || 0;
    const minute = parseInt(editMinute) || 0;
    
    const newDate = new Date(year, month, day, hour, minute);
    setGameDate(newDate);
    setIsEditingDate(false);
  }, [editYear, editMonth, editDay, editHour, editMinute]);

  // Datum-Bearbeitung abbrechen
  const cancelDateEdit = useCallback(() => {
    setIsEditingDate(false);
  }, []);

  // Reset zur Startzeit
  const resetTime = useCallback(() => {
    setGameDate(INITIAL_DATE);
    setHours('');
    setMinutes('');
  }, []);

  // Formatierung
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Tageszeit-Indikator
  const getTimeOfDay = (date: Date) => {
    const hour = date.getHours();
    if (hour >= 5 && hour < 12) return { label: 'Morgen', emoji: '🌅' };
    if (hour >= 12 && hour < 17) return { label: 'Nachmittag', emoji: '☀️' };
    if (hour >= 17 && hour < 21) return { label: 'Abend', emoji: '🌆' };
    return { label: 'Nacht', emoji: '🌙' };
  };

  const timeOfDay = getTimeOfDay(gameDate);

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'var(--font-geist-sans, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif)',
      padding: '1.5rem',
      boxSizing: 'border-box',
      background: 'var(--background-secondary)',
      color: 'var(--foreground)',
      overflow: 'auto',
      borderRadius: '8px',
      border: '1px solid hsla(30, 50%, 50%, 0.3)'
    }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        marginBottom: '1.5rem',
        borderBottom: '2px solid var(--accent)',
        paddingBottom: '0.75rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Clock size={24} style={{ color: 'var(--accent)' }} />
          <h2 style={{ 
            margin: 0, 
            fontSize: '1.5rem', 
            fontWeight: '600',
            fontFamily: 'var(--font-serif, Cinzel, serif)',
            color: 'var(--accent)',
            textShadow: 'var(--glow-warm)'
          }}>
            Kampagnen-Zeit
          </h2>
        </div>
        <button
          onClick={resetTime}
          style={{
            background: 'hsla(30, 50%, 50%, 0.2)',
            border: '1px solid hsla(30, 50%, 50%, 0.3)',
            borderRadius: '8px',
            padding: '0.5rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem',
            color: 'var(--foreground)',
            fontSize: '0.875rem',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'hsla(30, 50%, 50%, 0.3)';
            e.currentTarget.style.boxShadow = 'var(--shadow-ember)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'hsla(30, 50%, 50%, 0.2)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          title="Zur Startzeit zurücksetzen"
        >
          <RotateCcw size={16} />
        </button>
      </div>

      {/* Zeit-Anzeige */}
      {!isEditingDate ? (
        <div 
          onClick={startEditingDate}
          style={{
            background: 'var(--background)',
            borderRadius: '12px',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: 'var(--shadow-deep)',
            color: 'var(--foreground)',
            border: '1px solid hsla(30, 50%, 50%, 0.3)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-ember)';
            e.currentTarget.style.transform = 'translateY(-2px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-deep)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            marginBottom: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: 'var(--accent)'
          }}>
            <span>{timeOfDay.emoji}</span>
            <span>{timeOfDay.label}</span>
          </div>
          
          <div style={{
            textAlign: 'center',
            fontSize: '3rem',
            fontWeight: '700',
            lineHeight: '1',
            marginBottom: '0.5rem',
            color: 'var(--accent)',
            fontFamily: 'var(--font-mono, monospace)',
            textShadow: 'var(--glow-warm)'
          }}>
            {formatTime(gameDate)}
          </div>
          
          <div style={{
            textAlign: 'center',
            fontSize: '1rem',
            color: 'var(--foreground-muted)',
            fontWeight: '500',
            fontFamily: 'var(--font-serif, serif)'
          }}>
            {formatDate(gameDate)}
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--foreground-muted)',
            marginTop: '0.5rem',
            opacity: 0.7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem'
          }}>
            <Calendar size={12} />
            <span>Klicken zum Bearbeiten</span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'var(--background)',
          borderRadius: '12px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-ember)',
          border: '2px solid var(--primary)'
        }}>
          <div style={{ marginBottom: '1rem', fontSize: '0.875rem', fontWeight: '500', color: 'var(--accent)' }}>
            Datum & Zeit bearbeiten
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--foreground-muted)' }}>
                Tag
              </label>
              <input
                type="number"
                value={editDay}
                onChange={(e) => setEditDay(e.target.value)}
                min="1"
                max="31"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid hsla(30, 50%, 50%, 0.3)',
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--foreground-muted)' }}>
                Monat
              </label>
              <input
                type="number"
                value={editMonth}
                onChange={(e) => setEditMonth(e.target.value)}
                min="1"
                max="12"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid hsla(30, 50%, 50%, 0.3)',
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--foreground-muted)' }}>
                Jahr
              </label>
              <input
                type="number"
                value={editYear}
                onChange={(e) => setEditYear(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid hsla(30, 50%, 50%, 0.3)',
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--foreground-muted)' }}>
                Stunde
              </label>
              <input
                type="number"
                value={editHour}
                onChange={(e) => setEditHour(e.target.value)}
                min="0"
                max="23"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid hsla(30, 50%, 50%, 0.3)',
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--foreground-muted)' }}>
                Minute
              </label>
              <input
                type="number"
                value={editMinute}
                onChange={(e) => setEditMinute(e.target.value)}
                min="0"
                max="59"
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid hsla(30, 50%, 50%, 0.3)',
                  background: 'var(--background-secondary)',
                  color: 'var(--foreground)',
                  fontSize: '0.875rem'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={saveDateEdit}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--primary)',
                color: 'var(--background)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--primary-dark)';
                e.currentTarget.style.boxShadow = 'var(--glow-warm)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--primary)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Speichern
            </button>
            <button
              onClick={cancelDateEdit}
              style={{
                flex: 1,
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid hsla(30, 50%, 50%, 0.3)',
                background: 'transparent',
                color: 'var(--foreground)',
                fontSize: '0.875rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'hsla(30, 50%, 50%, 0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}

      {/* Schnell-Aktionen */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.5rem'
      }}>
        {TIME_PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => advanceTime(preset.hours, preset.minutes)}
            style={{
              background: 'hsla(30, 50%, 50%, 0.15)',
              backdropFilter: 'blur(10px)',
              border: '1px solid hsla(30, 50%, 50%, 0.3)',
              borderRadius: '12px',
              padding: '0.875rem 0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s',
              color: 'var(--foreground)',
              fontSize: '0.875rem',
              fontWeight: '500',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '0.25rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'hsla(30, 50%, 50%, 0.25)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = 'var(--shadow-ember)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'hsla(30, 50%, 50%, 0.15)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <span style={{ fontSize: '1.5rem' }}>{preset.icon}</span>
            <span>{preset.label}</span>
            <span style={{ fontSize: '0.75rem', opacity: 0.8, color: 'var(--foreground-muted)' }}>
              +{preset.hours > 0 ? `${preset.hours}h` : ''}{preset.hours > 0 && preset.minutes > 0 ? ' ' : ''}{preset.minutes > 0 ? `${preset.minutes}min` : ''}
            </span>
          </button>
        ))}
      </div>

      {/* Manuelle Eingabe */}
      <div style={{
        background: 'hsla(30, 50%, 50%, 0.1)',
        backdropFilter: 'blur(10px)',
        border: '1px solid hsla(30, 50%, 50%, 0.3)',
        borderRadius: '12px',
        padding: '1.25rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          marginBottom: '0.75rem',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: 'var(--accent)'
        }}>
          <Plus size={16} />
          <span>Benutzerdefiniert</span>
        </div>
        
        <div style={{
          display: 'flex',
          gap: '0.75rem',
          alignItems: 'flex-end'
        }}>
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
              color: 'var(--foreground-muted)'
            }}>
              Stunden
            </label>
            <input
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid hsla(30, 50%, 50%, 0.3)',
                background: 'var(--background-secondary)',
                fontSize: '1rem',
                color: 'var(--foreground)',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <div style={{ flex: 1 }}>
            <label style={{
              display: 'block',
              fontSize: '0.75rem',
              marginBottom: '0.25rem',
              color: 'var(--foreground-muted)'
            }}>
              Minuten
            </label>
            <input
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="0"
              min="0"
              style={{
                width: '100%',
                padding: '0.625rem',
                borderRadius: '8px',
                border: '1px solid hsla(30, 50%, 50%, 0.3)',
                background: 'var(--background-secondary)',
                fontSize: '1rem',
                color: 'var(--foreground)',
                boxSizing: 'border-box'
              }}
            />
          </div>
          
          <button
            onClick={handleManualAdd}
            disabled={!hours && !minutes}
            style={{
              padding: '0.625rem 1.5rem',
              borderRadius: '8px',
              border: 'none',
              background: (!hours && !minutes) ? 'hsla(30, 50%, 50%, 0.2)' : 'var(--primary)',
              color: (!hours && !minutes) ? 'var(--foreground-muted)' : 'var(--background)',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: (!hours && !minutes) ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
              opacity: (!hours && !minutes) ? 0.5 : 1
            }}
            onMouseEnter={(e) => {
              if (hours || minutes) {
                e.currentTarget.style.background = 'var(--primary-dark)';
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = 'var(--glow-warm)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = (!hours && !minutes) ? 'hsla(30, 50%, 50%, 0.2)' : 'var(--primary)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
};

export default TimeTracker;