"use client";

import "./globals.css";
import Link from "next/link";

export default function Home() {
return (
  <>
    {/* Enhanced Floating Embers with more dynamic movement */}
    <div className="floating-embers fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({length: 12}).map((_, i) => (
        <div 
          key={i}
          className="ember absolute bg-gradient-to-t from-orange-500 to-yellow-400 rounded-full animate-float opacity-0" 
          style={{
            width: Math.random() * 3 + 1 + 'px',
            height: Math.random() * 3 + 1 + 'px',
            left: Math.random() * 100 + '%',
            animationDelay: Math.random() * 4 + 's',
            animationDuration: (Math.random() * 2 + 3) + 's'
          }}
        />
      ))}
    </div>

    {/* Hero Section with Enhanced Visual Design */}
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-orange-900/30 relative overflow-hidden">
      
      {/* Atmospheric Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-3 items-center justify-center gap-12 min-h-screen relative z-10">
        
        {/* Enhanced Pixel Art Side with Cinematic Effects */}
        <div className="flex justify-center items-center relative">
          <div className="relative group perspective-1000">
            
            {/* Multiple Layered Glow Effects */}
            <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/30 via-red-500/20 to-yellow-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
            <div className="absolute -inset-6 bg-gradient-to-r from-orange-400/40 to-red-400/40 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute -inset-4 border-2 border-orange-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>
            
            {/* Main Image Container with 3D Transform */}
            <div className="relative transform-gpu transition-all duration-500 group-hover:scale-105 group-hover:rotate-1">
              <img 
                src="assets/geralt_medi_pixelart.jpeg" 
                alt="Pixel Art Geralt am Lagerfeuer" 
                className="max-w-sm w-full h-auto rounded-xl shadow-2xl transition-all duration-500 group-hover:shadow-orange-500/20"
                style={{
                  imageRendering: 'pixelated',
                  filter: 'contrast(1.1) saturate(1.2) brightness(1.05)'
                }}
                onLoad={() => console.log('Bild wurde geladen')}
                onError={() => console.log('Bild konnte nicht geladen werden')}
              />
              
              {/* Overlay Gradient for Depth */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            
            {/* Floating Particles around Image */}
            <div className="absolute -inset-12 pointer-events-none">
              {Array.from({length: 6}).map((_, i) => (
                <div 
                  key={i}
                  className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"
                  style={{
                    top: Math.random() * 100 + '%',
                    left: Math.random() * 100 + '%',
                    animationDelay: Math.random() * 2 + 's'
                  }}
                />
              ))}
            </div>
          </div>
        </div>
        
        {/* Enhanced Content Side */}
        <div className="text-center lg:text-left">
          <div className="card bg-gradient-to-br from-base-100/15 to-base-100/5 backdrop-blur-lg shadow-2xl border border-orange-500/30 hover:border-orange-400/50 transition-all duration-300">
            <div className="card-body p-8">
              
              {/* Enhanced Title with Typography Effects */}
              <div className="mb-6 text-center">
                <h1 className="text-4xl lg:text-6xl font-serif font-bold mb-4 leading-tight break-words max-w-full">
                  <span className="block bg-gradient-to-r from-orange-300 via-yellow-300 to-orange-400 bg-clip-text text-transparent animate-pulse">
                    TTRPG Management
                  </span>
                  <span className="block bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 bg-clip-text text-transparent">
                    ✧ ✦ ✧
                  </span>
                </h1>
                
                {/* Subtitle with better spacing */}
                <div className="h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent my-6"></div>
              </div>
              
              <p className="font-serif text-xl mb-8 text-base-content/90 leading-relaxed text-center">
                Sammle dich am <span className="text-orange-300 font-semibold">digitalen Lagerfeuer</span> und erschaffe epische Geschichten.
                <br />
                <span className="text-orange-200/80 italic text-lg block mt-2">
                I'm going on an adventure! ~ Bilbo Baggins
                </span>
              </p>
              
              {/* Enhanced Primary Action */}
              <div className="mb-8">
                <Link href="/games" className="w-full block">
                  <button className="btn btn-primary btn-lg w-full font-serif text-lg border-2 border-orange-500/60 hover:border-orange-400 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300 group relative overflow-hidden">
                    <span className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <span className="relative flex items-center justify-center">
                      <span className="text-orange-300 mr-3 text-xl">⚔️</span>
                      Zu den Kampagnen
                      <span className="text-orange-300 ml-3 text-xl">⚔️</span>
                    </span>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Hobbit GIF with Pixel Transition Effect */}
        <div className="flex justify-center items-center">
          <div className="relative group perspective-1000">
            <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/30 via-red-500/20 to-yellow-500/30 rounded-2xl blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700 animate-pulse"></div>
            <div className="absolute -inset-6 bg-gradient-to-r from-orange-400/40 to-red-400/40 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500"></div>
            <div className="absolute -inset-4 border-2 border-orange-500/40 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></div>

            <div className="relative transform-gpu transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 overflow-hidden rounded-xl">
              {/* Pixel Transition Overlay */}
              <div className="absolute inset-0 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-1000">
                {Array.from({ length: 200 }).map((_, i) => {
                  const row = Math.floor(i / 20);
                  const col = i % 20;
                  return (
                    <div
                      key={i}
                      className="absolute bg-orange-500/30 pixel-reveal"
                      style={{
                        width: '5%',
                        height: '5%',
                        left: `${col * 5}%`,
                        top: `${row * 10}%`,
                        animationDelay: `${Math.random() * 2}s`,
                        animationDuration: '0.8s'
                      }}
                    />
                  );
                })}
              </div>
              
              <iframe
                src="https://tenor.com/embed/18135104"
                className="w-full h-[450px] rounded-xl shadow-2xl transition-all duration-500 group-hover:shadow-orange-500/20"
                allowFullScreen
              ></iframe>
              
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Floating Particles around the GIF */}
            <div className="absolute -inset-12 pointer-events-none">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
        <div className="flex flex-col items-center animate-bounce">
          <div className="text-orange-400 text-3xl opacity-70 mb-1">⬇</div>
          <div className="text-orange-300 text-xs font-serif opacity-50">Entdecke mehr</div>
        </div>
      </div>
    </div>

    {/* Enhanced Navigation Cards Section */}
    <div className="min-h-screen bg-gradient-to-b from-base-200 to-base-300 relative z-10">
      <div className="max-w-5xl mx-auto p-6 pt-20">
        
        {/* Enhanced Quote Section */}
        <div className="card bg-gradient-to-br from-base-100/90 to-base-100/70 backdrop-blur-sm shadow-xl border border-orange-500/30 mb-16 hover:shadow-2xl hover:shadow-orange-500/10 transition-all duration-300">
          <div className="card-body text-center p-8">
            <div className="text-6xl mb-6 opacity-20">🌓</div>
            <blockquote className="text-2xl font-serif italic text-orange-200 mb-6 leading-relaxed">
              Evil is Evil. Lesser, greater, middling… Makes no difference.<br className="hidden md:block" />
              The degree is arbitary. The definition's blurred.<br className="hidden md:block" />
              If I'm to choose between one evil and another… I'd rather not choose at all.
            </blockquote>
            <div className="text-base font-serif opacity-70 text-orange-300">
              ~ Geralt von Riva ~
            </div>
          </div>
        </div>

        {/* Enhanced Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          
          {/* Network Card */}
          <Link href="/graphview" className="group">
            <div className="card bg-gradient-to-br from-base-100 to-base-100/80 shadow-xl border border-primary/30 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer h-full transform-gpu">
              <div className="card-body text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="text-5xl mb-6 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300 relative z-10">🕸️</div>
                <h2 className="card-title font-serif justify-center text-primary text-xl mb-4 relative z-10">
                  <span className="text-primary mr-2">✧</span>
                  Spielerbereich
                  <span className="text-primary ml-2">✧</span>
                </h2>
                <p className="font-serif text-base opacity-80 flex-grow mb-4 relative z-10">
                  Charaktere ansehen und erstellen, Profil anpassen, Statisken verfolgen 
                </p>
                <div className="card-actions justify-center mt-4 relative z-10">
                  <span className="text-orange-300 text-sm font-serif opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    Spielerbereich öffnen →
                  </span>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Encyclopedia Card */}
          <Link href="/Dummy" className="group">
            <div className="card bg-gradient-to-br from-base-100 to-base-100/80 shadow-xl border border-primary/30 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer h-full transform-gpu">
              <div className="card-body text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="text-5xl mb-6 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300 relative z-10">📚</div>
                <h2 className="card-title font-serif justify-center text-primary text-xl mb-4 relative z-10">
                  <span className="text-primary mr-2">✦</span>
                  Dummy
                  <span className="text-primary ml-2">✦</span>
                </h2>
                <p className="font-serif text-base opacity-80 flex-grow mb-4 relative z-10">
                  Weiß noch nicht, wofür dieser Dummy verwendet werden könnte
                </p>
                <div className="card-actions justify-center mt-4 relative z-10">
                  <span className="text-orange-300 text-sm font-serif opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    Zum Dummy →
                  </span>
                </div>
              </div>
            </div>
          </Link>
          
          {/* Campaigns Card */}
          <Link href="/games" className="group">
            <div className="card bg-gradient-to-br from-base-100 to-base-100/80 shadow-xl border border-primary/30 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/20 cursor-pointer h-full transform-gpu">
              <div className="card-body text-center p-6 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="text-5xl mb-6 group-hover:animate-pulse group-hover:scale-110 transition-all duration-300 relative z-10">⚔️</div>
                <h2 className="card-title font-serif justify-center text-primary text-xl mb-4 relative z-10">
                  <span className="text-primary mr-2">✧</span>
                  Kampagnen
                  <span className="text-primary ml-2">✧</span>
                </h2>
                <p className="font-serif text-base opacity-80 flex-grow mb-4 relative z-10">
                  Verwalte aktive Abenteuer und plane neue Geschichten
                </p>
                <div className="card-actions justify-center mt-4 relative z-10">
                  <span className="text-orange-300 text-sm font-serif opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0">
                    Abenteuer-Portal betreten →
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </div>
        
        {/* Enhanced Bottom Navigation */}
        <div className="card w-full bg-gradient-to-r from-base-100/80 to-base-100/60 shadow-lg border border-orange-500/20 backdrop-blur-sm">
          <div className="card-body p-6">
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/" className="btn btn-ghost btn-sm font-serif hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-300">
                🏠 Hauptseite
              </Link>
              <Link href="/graphview" className="btn btn-ghost btn-sm font-serif hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-300">
                🗺️ Verbindungskarten
              </Link>
              <Link href="/ArticleView" className="btn btn-ghost btn-sm font-serif hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-300">
                📜 Zauber-Kompendium
              </Link>
              <Link href="/games" className="btn btn-ghost btn-sm font-serif hover:text-orange-300 hover:bg-orange-500/10 transition-all duration-300">
                ⚔️ Abenteuer-Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Enhanced Custom Styles */}
    <style jsx>{`
      @keyframes float {
        0% { 
          transform: translateY(100vh) translateX(0px) rotate(0deg);
          opacity: 0;
        }
        10% { opacity: 0.8; }
        50% { 
          opacity: 1;
          transform: translateY(50vh) translateX(10px) rotate(180deg);
        }
        90% { opacity: 0.8; }
        100% { 
          transform: translateY(-10px) translateX(30px) rotate(360deg);
          opacity: 0;
        }
      }
      
      .animate-float {
        animation: float linear infinite;
      }
      
      @keyframes campfireGlow {
        0%, 100% { 
          box-shadow: 0 0 20px rgba(255, 100, 0, 0.3),
                      0 0 40px rgba(255, 100, 0, 0.1),
                      inset 0 0 20px rgba(255, 100, 0, 0.1);
        }
        50% { 
          box-shadow: 0 0 40px rgba(255, 100, 0, 0.6),
                      0 0 80px rgba(255, 100, 0, 0.3),
                      inset 0 0 30px rgba(255, 100, 0, 0.2);
        }
      }
      
      .perspective-1000 {
        perspective: 1000px;
      }
      
      .transform-gpu {
        transform: translateZ(0);
      }
      
      /* Smooth scrolling */
      html {
        scroll-behavior: smooth;
      }
      
      /* Enhanced hover effects */
      .card:hover {
        transform: translateY(-2px) translateZ(0);
      }
      
      /* Pixel Transition Animation */
      @keyframes pixelReveal {
        0% { 
          opacity: 0; 
          transform: scale(0) rotate(0deg);
        }
        50% { 
          opacity: 0.8; 
          transform: scale(1.2) rotate(180deg);
        }
        100% { 
          opacity: 0; 
          transform: scale(1) rotate(360deg);
        }
      }
      
      .pixel-reveal {
        animation: pixelReveal ease-in-out infinite;
      }
  `}</style>
  </>
  );
}