import "./globals.css";

import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1 className="text-4xl font-bold">DND Lore Manager</h1>
      <p className="text-lg">
        Helps you manage your DND Lore as well as the story.
      </p>
      <Link href="/graphview">
        <button className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
          go to graph view
        </button>      
      </Link>
    </main>
  );
}
