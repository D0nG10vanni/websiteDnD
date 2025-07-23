// Nutzt die bereits vorhandenen CSS-Variablen aus globals.css
export const articleTheme = {
  // Container-Klassen (nutzen bereits definierte Variablen)
  containers: {
    main: 'bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6',
    secondary: 'bg-black/20 backdrop-blur-sm rounded-lg border border-amber-900/30 p-6',
    editor: 'bg-black/40 backdrop-blur-sm rounded-lg border border-amber-900/40 p-6'
  },

  // Buttons (nutzen die bereits definierten btn-Klassen)
  buttons: {
    primary: 'btn btn-primary',
    secondary: 'px-4 py-2 border border-amber-900/40 rounded-sm font-serif text-sm text-amber-200/80 bg-amber-900/10 hover:bg-amber-900/30 transition-colors',
    save: 'px-6 py-2 bg-amber-700 hover:bg-amber-600 disabled:bg-amber-900/50 text-white font-serif rounded-sm transition-colors disabled:cursor-not-allowed'
  },

  // Inputs (konsistent mit dem TTRPG-Theme)
  inputs: {
    text: 'w-full bg-black/50 border border-amber-900/50 rounded-sm px-3 py-2 text-amber-100 placeholder-amber-200/30 font-serif focus:outline-none focus:ring-1 focus:ring-amber-700/50',
    textarea: 'w-full h-[600px] bg-black/30 border border-amber-900/30 rounded-sm p-4 text-amber-100 placeholder-amber-200/20 font-mono text-sm resize-none focus:outline-none focus:ring-1 focus:ring-amber-700/50'
  },

  // Typography (nutzt bereits definierte CSS-Variablen)
  text: {
    title: 'font-serif text-2xl text-amber-200',
    subtitle: 'font-serif text-lg text-amber-200',
    label: 'block text-amber-300 text-sm font-serif mb-2',
    muted: 'text-amber-400/60 text-xs font-serif',
    help: 'text-amber-400/60 text-xs'
  },

  // Toggle/Switch
  toggle: {
    container: 'flex items-center gap-2 cursor-pointer',
    track: (active: boolean) => `w-10 h-5 rounded-full transition-colors ${active ? 'bg-amber-600' : 'bg-amber-900/50'}`,
    thumb: (active: boolean) => `w-4 h-4 bg-white rounded-full shadow transition-transform mt-0.5 ${active ? 'translate-x-5' : 'translate-x-0.5'}`,
    label: 'text-amber-300 text-sm font-serif'
  },

  // Animationen (nutzen bereits definierte Keyframes)
  animations: {
    mysticalGlow: 'animate-mystical-glow',
    campfirePulse: 'animate-campfire-pulse',
    emberFloat: 'animate-ember-float'
  },

  // Spezielle Effekte
  effects: {
    glow: 'glow-warm',
    shadowEmber: 'shadow-ember',
    atmosphericBg: 'atmospheric-bg'
  }
} as const

// Utility-Funktionen für häufig verwendete Kombinationen
export const getContainerClasses = (variant: 'main' | 'secondary' | 'editor' = 'main') => 
  articleTheme.containers[variant]

export const getInputClasses = (variant: 'text' | 'textarea' = 'text') => 
  articleTheme.inputs[variant]

export const getButtonClasses = (variant: 'primary' | 'secondary' | 'save' = 'primary') => 
  articleTheme.buttons[variant]

export const getTextClasses = (variant: keyof typeof articleTheme.text) => 
  articleTheme.text[variant]

export const getToggleClasses = (active: boolean) => ({
  container: articleTheme.toggle.container,
  track: articleTheme.toggle.track(active),
  thumb: articleTheme.toggle.thumb(active),
  label: articleTheme.toggle.label
})