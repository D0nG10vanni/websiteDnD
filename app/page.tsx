import "./globals.css";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-4xl mx-auto p-6 pt-16">
        <div className="card w-full bg-base-100 shadow-xl border border-primary/20">
          <div className="card-body">
            <h1 className="card-title text-4xl font-serif text-center mx-auto mb-6">
              <span className="text-primary">✦</span> TTRPG Spielmanagement <span className="text-primary">✦</span>
            </h1>
            
            <div className="divider">✧ ✦ ✧</div>
            
            <p className="text-center font-serif text-lg mb-8">
              Zur Erstellung und Verwaltung von Kampagnen, Charakteren und Abenteuern. 
              <br /> Beginne damit, eine neue Kampagne zu erstellen
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <Link href="/graphview" className="w-full">
                <button className="btn btn-primary w-full font-serif border border-primary/30 shadow-lg hover:shadow-primary/10">
                  <span className="text-primary mr-2">✧</span>
                  Netzwerk
                  <span className="text-primary ml-2">✧</span>
                </button>      
              </Link>
              
              <Link href="/ArticleView" className="w-full">
                <button className="btn btn-primary w-full font-serif border border-primary/30 shadow-lg hover:shadow-primary/10">
                  <span className="text-primary mr-2">✦</span>
                  Zur Encyclopaedia
                  <span className="text-primary ml-2">✦</span>
                </button>      
              </Link>
              
              <Link href="/games" className="w-full">
                <button className="btn btn-primary w-full font-serif border border-primary/30 shadow-lg hover:shadow-primary/10">
                  <span className="text-primary mr-2">✧</span>
                  Zu den Kampagnen
                  <span className="text-primary ml-2">✧</span>
                </button>
              </Link>
            </div>
            
            <div className="divider mt-12">✦ ✧ ✦</div>
            
            <div className="text-center mt-4 text-xs opacity-70 font-serif">
              ✧ Für Meister der Geschichten und Weber der Welten ✧
            </div>
          </div>
        </div>
        
        <div className="card w-full bg-base-100 shadow-md border border-primary/10 mt-6">
          <div className="card-body p-4">
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/" className="btn btn-ghost btn-sm font-serif text-xs">
                Hauptseite
              </Link>
              <Link href="/graphview" className="btn btn-ghost btn-sm font-serif text-xs">
                Verbindungskarten
              </Link>
              <Link href="/ArticleView" className="btn btn-ghost btn-sm font-serif text-xs">
                Zauber-Kompendium
              </Link>
              <Link href="/games" className="btn btn-ghost btn-sm font-serif text-xs">
                Abenteuer-Portal
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}