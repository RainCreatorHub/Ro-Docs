export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-5xl font-bold mb-4">Ro Docs</h1>
        <p className="text-xl text-gray-400 mb-8">
          A modern documentation site for Roblox development
        </p>
        <a
          href="/docs"
          className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
        >
          Get Started
        </a>
      </div>
    </main>
  );
}
