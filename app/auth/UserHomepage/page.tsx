'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { User } from '@/lib/types'
import { Character } from '@/lib/types'


export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null)
  const [characters, setCharacters] = useState<Character[]>([])
  const [artifacts, setArtifacts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'characters' | 'artifacts' | 'grimoire'>('characters')

  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true)
      
      // Nutzer-Informationen abrufen
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (userError) {
        console.error('Fehler beim Laden des Nutzers:', userError)
      } else {
        setUser(userData)
      }
      
      // Charaktere des Nutzers abrufen
      const { data: charactersData, error: charactersError } = await supabase
        .from('characters')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (charactersError) {
        console.error('Fehler beim Laden der Charaktere:', charactersError)
      } else {
        setCharacters(charactersData || [])
      }
      
      // Artefakte des Nutzers abrufen
      const { data: artifactsData, error: artifactsError } = await supabase
        .from('artifacts')
        .select('*')
        .eq('creator_id', userId)
        .order('rarity', { ascending: false })
      
      if (artifactsError) {
        console.error('Fehler beim Laden der Artefakte:', artifactsError)
      } else {
        setArtifacts(artifactsData || [])
      }
      
      setIsLoading(false)
    }
    
    fetchUserData()
  }, [userId])

  // Häufigkeits-/Seltenheitsbewertung berechnen (für Charaktereigenschaften)
  const getRarityClass = (rarity: number) => {
    if (rarity >= 90) return "text-purple-300"
    if (rarity >= 75) return "text-amber-400"
    if (rarity >= 50) return "text-cyan-300"
    if (rarity >= 25) return "text-emerald-400"
    return "text-slate-300"
  }

  // Level-zu-Stern-Konverter
  const getLevelStars = (level: number) => {
    const fullStars = Math.floor(level / 20)
    const remainder = level % 20
    const hasHalfStar = remainder >= 10
    
    return (
      <div className="flex gap-1">
        {[...Array(fullStars)].map((_, i) => (
          <span key={i} className="text-amber-400">★</span>
        ))}
        {hasHalfStar && <span className="text-amber-400">✧</span>}
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121017] bg-[url('/textures/parchment-dark.png')] bg-repeat flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse w-16 h-16 mx-auto">
            <div className="relative w-full h-full">
              <div className="absolute inset-0 rounded-full border-2 border-t-amber-500/80 border-r-amber-500/40 border-b-amber-500/20 border-l-amber-500/60 animate-spin"></div>
            </div>
          </div>
          <p className="mt-4 font-serif text-amber-200/60 italic">Das Schicksal wird enthüllt...</p>
        </div>
      </div>
    )
  }

//  if (!user) {
//    return (
//      <div className="min-h-screen bg-[#121017] bg-[url('/textures/parchment-dark.png')] bg-repeat flex items-center justify-center">
//        <div className="text-center max-w-md p-8 backdrop-blur-sm bg-black/40 rounded-lg border border-amber-900/40">
//          <div className="text-4xl text-amber-500/40 mb-4">✧</div>
//          <h2 className="text-xl font-serif text-amber-200 mb-4">Die Pergamente verweigern Einblick</h2>
//          <p className="text-amber-200/60 italic mb-6">
//            Dieses Wesen existiert nicht in unseren Aufzeichnungen oder ist vor neugierigen Blicken verborgen.
//          </p>
//          <Link href="/" className="inline-block px-6 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-700/50 rounded-sm font-serif tracking-wider text-center">
//            Zurück zum Grimoire
//          </Link>
//        </div>
//      </div>
//    )
//  }

  return (
    <div className="min-h-screen bg-[#121017] bg-[url('/textures/parchment-dark.png')] bg-repeat">
      <div className="max-w-7xl mx-auto p-4 pt-8 md:p-6 md:pt-12">
        
        {/* Header/Profil-Banner */}
        <div className="backdrop-blur-sm bg-black/40 rounded-lg border border-amber-900/40 shadow-[0_0_15px_rgba(0,0,0,0.7)] mb-8 relative overflow-hidden">
          {user && user.banner_url ? (
            <div className="h-40 w-full overflow-hidden opacity-20">
              <img 
                src={user.banner_url} 
                alt="Banner" 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80"></div>
            </div>
          ) : null}
          
          <div className="p-6 relative z-10 flex flex-col md:flex-row items-center gap-6">
            <div className="shrink-0">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-amber-700/50 shadow-[0_0_10px_rgba(255,170,0,0.3)]">
                {user && user.avatar_url ? (
                  <img 
                    src={user.avatar_url} 
                    alt={user.username || "MissingData"} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-amber-900/30 flex items-center justify-center">
                    <span className="text-3xl text-amber-500">{user ? (user.username || "MissingData").charAt(0).toUpperCase() : "M"}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="text-center md:text-left flex-1">
              <h1 className="text-2xl md:text-3xl font-serif text-amber-200 mb-2 tracking-wider">
                {user && user.title && <span className="text-amber-500 mr-2">{user.title}</span>}
                {user ? user.username || "MissingData" : "MissingData"}
              </h1>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3">
                <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-sm text-amber-200/80 text-sm">
                  <span className="text-amber-500 mr-1">✦</span>
                  Stufe {user ? user.level || "MissingData" : "MissingData"}
                </div>
                {user && user.faction ? (
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-sm text-amber-200/80 text-sm">
                    <span className="text-amber-500 mr-1">❖</span>
                    {user.faction}
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-sm text-amber-200/80 text-sm">
                    <span className="text-amber-500 mr-1">❖</span>
                    MissingData
                  </div>
                )}
                {user && user.rank ? (
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-sm text-amber-200/80 text-sm">
                    <span className="text-amber-500 mr-1">⍟</span>
                    {user.rank}
                  </div>
                ) : (
                  <div className="px-3 py-1 bg-amber-900/20 border border-amber-900/30 rounded-sm text-amber-200/80 text-sm">
                    <span className="text-amber-500 mr-1">⍟</span>
                    MissingData
                  </div>
                )}
              </div>
              
              {user && user.bio ? (
                <div className="mt-4 text-amber-200/70 italic font-serif max-w-2xl text-sm">
                  "{user.bio}"
                </div>
              ) : (
                <div className="mt-4 text-amber-200/70 italic font-serif max-w-2xl text-sm">
                  "MissingData"
                </div>
              )}
            </div>
            
            <div>
              <div className="px-4 py-2 bg-amber-900/20 border border-amber-700/30 rounded-sm text-amber-200/90 text-sm tracking-wide font-serif">
                <div className="flex items-center gap-2">
                  <span className="text-amber-500">⍟</span>
                  <span>{user ? user.joined_date || "MissingData" : "MissingData"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex border-b border-amber-900/40 mb-6">
          <button
            onClick={() => setActiveTab('characters')}
            className={`px-6 py-3 font-serif tracking-wide text-sm ${
              activeTab === 'characters'
                ? 'text-amber-400 border-b-2 border-amber-500/80'
                : 'text-amber-200/60 hover:text-amber-300/80'
            }`}
          >
            <span className="text-amber-500 mr-2">✦</span>
            Charaktere
          </button>
          <button
            onClick={() => setActiveTab('artifacts')}
            className={`px-6 py-3 font-serif tracking-wide text-sm ${
              activeTab === 'artifacts'
                ? 'text-amber-400 border-b-2 border-amber-500/80'
                : 'text-amber-200/60 hover:text-amber-300/80'
            }`}
          >
            <span className="text-amber-500 mr-2">✧</span>
            Artefakte
          </button>
          <button
            onClick={() => setActiveTab('grimoire')}
            className={`px-6 py-3 font-serif tracking-wide text-sm ${
              activeTab === 'grimoire'
                ? 'text-amber-400 border-b-2 border-amber-500/80'
                : 'text-amber-200/60 hover:text-amber-300/80'
            }`}
          >
            <span className="text-amber-500 mr-2">❖</span>
            Grimoire
          </button>
        </div>
        
        {/* Character Tab Content */}
        {activeTab === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {characters.length > 0 ? (
              characters.map(character => (
                <div
                  key={character.id}
                  className="backdrop-blur-sm bg-black/30 rounded-lg border border-amber-900/30 shadow-[0_0_10px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="h-32 bg-gradient-to-b from-amber-900/20 to-black/40 flex justify-center items-center overflow-hidden relative">
                    {character.portrait_url ? (
                      <img 
                        src={character.portrait_url} 
                        alt={character.name || "MissingData"} 
                        className="w-full h-full object-cover opacity-70"
                      />
                    ) : (
                      <div className="text-3xl text-amber-500/20 font-serif">
                        {(character.name || "MissingData").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    <div className="absolute bottom-0 left-0 w-full p-3">
                      <div className="flex justify-between items-end">
                        <h3 className="font-serif text-xl text-amber-200 tracking-wide">
                          {character.name || "MissingData"}
                        </h3>
                        <div className="text-sm">
                          {getLevelStars((character.level ?? 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="text-amber-200/80 text-xs">
                        <span className="text-amber-500/70 mr-1">✧</span>
                        Klasse
                      </div>
                      <div className="text-amber-200 text-xs tracking-wide font-serif">
                        {character.class || "MissingData"}
                      </div>
                      
                      <div className="text-amber-200/80 text-xs">
                        <span className="text-amber-500/70 mr-1">✧</span>
                        Rasse
                      </div>
                      <div className="text-amber-200 text-xs tracking-wide font-serif">
                        {character.race || "MissingData"}
                      </div>
                      
                      <div className="text-amber-200/80 text-xs">
                        <span className="text-amber-500/70 mr-1">✧</span>
                        Spezialisierung
                      </div>
                      <div className="text-amber-200 text-xs tracking-wide font-serif">
                        {character.specialization || "MissingData"}
                      </div>
                      
                      <div className="text-amber-200/80 text-xs">
                        <span className="text-amber-500/70 mr-1">✧</span>
                        Alter
                      </div>
                      <div className="text-amber-200 text-xs tracking-wide font-serif">
                        {character.age ? `${character.age} Jahre` : "MissingData"}
                      </div>
                    </div>
                    
                    {character.traits && character.traits.length > 0 ? (
                      <div className="mt-4">
                        <div className="text-xs text-amber-400 mb-2 font-serif tracking-wide">Charaktereigenschaften</div>
                        <div className="flex flex-wrap gap-2">
                          {character.traits.map((trait: { name: string; rarity: number }, idx: number) => (
                            <div 
                              key={idx} 
                              className={`text-xs px-2 py-1 rounded-sm border border-amber-900/30 bg-black/30 ${getRarityClass(trait.rarity || 0)}`}
                            >
                              {trait.name || "MissingData"}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4">
                        <div className="text-xs text-amber-400 mb-2 font-serif tracking-wide">Charaktereigenschaften</div>
                        <div className="text-xs px-2 py-1 rounded-sm border border-amber-900/30 bg-black/30 text-slate-300">
                          MissingData
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 flex justify-end">
                      <Link 
                        href={`/character/${character.id || "MissingData"}`}
                        className="px-3 py-1 text-xs bg-amber-900/20 hover:bg-amber-900/40 text-amber-300 border border-amber-700/40 rounded-sm font-serif tracking-wide"
                      >
                        Pergament öffnen
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full backdrop-blur-sm bg-black/20 rounded-lg border border-amber-900/30 p-8 text-center">
                <div className="text-4xl text-amber-500/30 mb-4">✦</div>
                <p className="font-serif text-amber-200/50 italic mb-6">
                  Noch keine Charaktere erschaffen. Die Seiten des Schicksals warten darauf, beschrieben zu werden.
                </p>
                <Link 
                  href="/character/create"
                  className="inline-block px-6 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-700/50 rounded-sm font-serif tracking-wider"
                >
                  Ersten Charakter erschaffen
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Artifacts Tab Content */}
        {activeTab === 'artifacts' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {artifacts.length > 0 ? (
              artifacts.map(artifact => (
                <div
                  key={artifact.id || "MissingData"}
                  className="backdrop-blur-sm bg-black/30 rounded-lg border border-amber-900/30 shadow-[0_0_10px_rgba(0,0,0,0.5)] p-4 relative overflow-hidden"
                >
                  <div className={`absolute top-0 right-0 w-16 h-16 overflow-hidden ${
                    (artifact.rarity || 0) >= 90 ? 'bg-purple-500/10' :
                    (artifact.rarity || 0) >= 75 ? 'bg-amber-500/10' :
                    (artifact.rarity || 0) >= 50 ? 'bg-cyan-500/10' :
                    'bg-emerald-500/10'
                  }`}>
                    <div className={`absolute top-0 right-0 rotate-45 transform origin-bottom-right w-24 ${
                      (artifact.rarity || 0) >= 90 ? 'bg-purple-500/30' :
                      (artifact.rarity || 0) >= 75 ? 'bg-amber-500/30' :
                      (artifact.rarity || 0) >= 50 ? 'bg-cyan-500/30' :
                      'bg-emerald-500/30'
                    }`}>
                      <div className="py-1 text-center text-xs tracking-wider font-serif text-white/80">
                        {(artifact.rarity || 0) >= 90 ? 'Legendär' :
                         (artifact.rarity || 0) >= 75 ? 'Episch' :
                         (artifact.rarity || 0) >= 50 ? 'Selten' :
                         'Gewöhnlich'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-6">
                    <h3 className={`font-serif text-lg mb-2 tracking-wide ${
                      (artifact.rarity || 0) >= 90 ? 'text-purple-300' :
                      (artifact.rarity || 0) >= 75 ? 'text-amber-400' :
                      (artifact.rarity || 0) >= 50 ? 'text-cyan-300' :
                      'text-emerald-400'
                    }`}>
                      {artifact.name || "MissingData"}
                    </h3>
                    
                    <div className="text-xs text-amber-200/70 mb-3 italic">
                      {artifact.type || "MissingData"}
                    </div>
                    
                    <p className="text-amber-100/80 text-sm mb-4">
                      {artifact.description || "MissingData"}
                    </p>
                    
                    {artifact.effects && artifact.effects.length > 0 ? (
                      <div className="border-t border-amber-900/30 pt-3 mt-3">
                        <div className="text-xs text-amber-400 mb-2">Effekte</div>
                        <ul className="space-y-1">
                          {artifact.effects.map((effect: string, idx: number) => (
                            <li key={idx} className="text-xs text-amber-200/90 flex items-start">
                              <span className="text-amber-500 mr-2 mt-0.5">✧</span>
                              {effect || "MissingData"}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div className="border-t border-amber-900/30 pt-3 mt-3">
                        <div className="text-xs text-amber-400 mb-2">Effekte</div>
                        <ul className="space-y-1">
                          <li className="text-xs text-amber-200/90 flex items-start">
                            <span className="text-amber-500 mr-2 mt-0.5">✧</span>
                            MissingData
                          </li>
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full backdrop-blur-sm bg-black/20 rounded-lg border border-amber-900/30 p-8 text-center">
                <div className="text-4xl text-amber-500/30 mb-4">✧</div>
                <p className="font-serif text-amber-200/50 italic mb-6">
                  Keine Artefakte in deinem Besitz. Die Welt birgt noch viele verborgene Schätze.
                </p>
                <Link 
                  href="/quest/artifacts"
                  className="inline-block px-6 py-2 bg-amber-900/30 hover:bg-amber-900/50 text-amber-200 border border-amber-700/50 rounded-sm font-serif tracking-wider"
                >
                  Auf Schatzsuche gehen
                </Link>
              </div>
            )}
          </div>
        )}
        
        {/* Grimoire Tab Content */}
        {activeTab === 'grimoire' && (
          <div className="backdrop-blur-sm bg-black/30 rounded-lg border border-amber-900/30 p-6 shadow-[0_0_15px_rgba(0,0,0,0.5)]">
            <h2 className="font-serif text-xl text-amber-400 mb-6 tracking-wider">
              <span className="text-amber-500">❖</span> Persönliche Aufzeichnungen
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Statistik */}
              <div className="border border-amber-900/20 bg-black/20 rounded-lg p-5">
                <h3 className="font-serif text-amber-300 mb-4 text-lg">Statistiken der Reise</h3>
                
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-amber-200/70">Questen abgeschlossen</span>
                      <span className="text-amber-300">{user?.stats?.quests_completed ?? "MissingData"}</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-800 to-amber-500"
                        style={{ width: `${Math.min(100, (((user?.stats?.quests_completed || 0) / 100) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-amber-200/70">Ruhmespunkte</span>
                      <span className="text-amber-300">{user?.stats?.fame_points ?? "MissingData"}</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-purple-800 to-purple-500"
                        style={{ width: `${Math.min(100, (((user?.stats?.fame_points || 0) / 1000) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-amber-200/70">Artefakte entdeckt</span>
                      <span className="text-amber-300">{artifacts.length || "MissingData"}</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-800 to-cyan-500"
                        style={{ width: `${Math.min(100, (artifacts.length / 20) * 100)}%` }}
                      ></div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between items-center text-sm mb-1">
                      <span className="text-amber-200/70">Weisheit der Zeitalter</span>
                      <span className="text-amber-300">{user?.stats?.wisdom_score ?? "MissingData"}</span>
                    </div>
                    <div className="h-1.5 bg-black/60 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-800 to-emerald-500"
                        style={{ width: `${Math.min(100, (((user?.stats?.wisdom_score ?? 0) / 500) * 100))}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Errungenschaften */}
              <div className="border border-amber-900/20 bg-black/20 rounded-lg p-5">
                <h3 className="font-serif text-amber-300 mb-4 text-lg">Errungenschaften</h3>
                
                {user && user.achievements && user.achievements.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3">
                    {user.achievements.map((achievement: { icon: string; name: string; description: string }, idx: number) => (
                      <div key={idx} className="border border-amber-900/30 bg-black/30 p-3 rounded-sm flex">
                        <div className="mr-3 text-amber-500 text-xl">{achievement.icon || "✧"}</div>
                        <div>
                          <div className="text-amber-300 text-sm">{achievement.name || "MissingData"}</div>
                          <div className="text-amber-200/60 text-xs mt-1">{achievement.description || "MissingData"}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="border border-amber-900/10 bg-black/10 rounded-sm p-4 text-center">
                    <p className="text-amber-200/50 italic text-sm">
                      Die Seiten sind noch leer. Große Taten warten darauf, vollbracht zu werden.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Chronik der Reisen (Timeline) */}
            <div className="mt-8">
              <h3 className="font-serif text-amber-300 mb-6 text-lg">Chronik der Reisen</h3>
              
              {user && user.timeline && user.timeline.length > 0 ? (
                <div className="relative border-l border-amber-900/50 pl-6 ml-3 space-y-6">
                  {user.timeline.map((event: { date: string; title: string; description: string }, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-10 w-4 h-4 rounded-full border border-amber-500 bg-black"></div>
                      <div className="absolute -left-9 w-2 h-2 rounded-full bg-amber-500"></div>
                      <div className="text-amber-300 text-sm">{event.date}</div>
                      <div className="text-amber-200 font-serif mt-1">{event.title}</div>
                      <div className="text-amber-200/70 text-sm mt-2">{event.description}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-amber-900/10 bg-black/10 rounded-sm p-6 text-center">
                  <p className="text-amber-200/50 italic">
                    Deine Reise hat gerade erst begonnen. Die Chronik wartet darauf, mit Abenteuern gefüllt zu werden.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}