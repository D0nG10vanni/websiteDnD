import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">Graph View</h1>
      <Link href="/">
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          go back to home
        </button>      
      </Link>
      <h1 className="text-4xl font-bold mb-6">Willkommen bei DaisyUI!</h1>
      {/* Einfache Primary-Button */}
      <button className="btn btn-primary mb-4">
        Primary Button
      </button>
      {/* Sekundär, Outline, Akzent, etc. */}
      <div className="space-x-2">
        <button className="btn btn-secondary">Secondary</button>
        <button className="btn btn-accent">Accent</button>
        <button className="btn btn-outline">Outline</button>
      </div>
    </main>
  );
}