import Image from "next/image";
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
    </main>
  );
}