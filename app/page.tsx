"use client";
import { useState } from "react";

export default function MemeMaker() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ url: string; template: string; texts: string[]; explanation: string } | null>(null);
  const [error, setError] = useState("");
  const [history, setHistory] = useState<typeof result[]>([]);

  const examples = ["mondays", "debugging at 2am", "AI taking my job", "eating salad when you wanted pizza", "git push to main", "when the tests pass on first try"];

  async function generate(t = topic) {
    if (!t.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/meme", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: t }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
      setHistory(prev => [data, ...prev].slice(0, 6));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">😂</div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Meme Maker AI</h1>
          <p className="text-gray-500">Type anything. Get a meme. It&apos;s that simple.</p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex gap-3 mb-4">
            <input
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 text-lg focus:outline-none focus:border-orange-400 transition-colors"
              placeholder="What should the meme be about?"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              onKeyDown={e => e.key === "Enter" && generate()}
            />
            <button
              onClick={() => generate()}
              disabled={loading || !topic.trim()}
              className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-200 text-white font-bold px-6 py-3 rounded-xl transition-colors"
            >
              {loading ? "..." : "Make it"}
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {examples.map(ex => (
              <button key={ex} onClick={() => { setTopic(ex); generate(ex); }}
                className="text-sm bg-orange-50 hover:bg-orange-100 text-orange-700 px-3 py-1.5 rounded-full transition-colors border border-orange-200">
                {ex}
              </button>
            ))}
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6">{error}</div>}

        {loading && (
          <div className="bg-white rounded-2xl shadow-lg p-12 mb-6 text-center">
            <div className="text-4xl mb-3 animate-bounce">🧠</div>
            <p className="text-gray-500">AI is cooking up something spicy...</p>
          </div>
        )}

        {result && (
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
            <img src={result.url} alt="Generated meme" className="w-full" />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{result.template}</span>
              </div>
              <p className="text-gray-600 text-sm italic">&quot;{result.explanation}&quot;</p>
              <div className="mt-4 flex gap-3">
                <a href={result.url} target="_blank" rel="noreferrer"
                  className="flex-1 text-center bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2 rounded-lg transition-colors text-sm">
                  Open full size
                </a>
                <button onClick={() => generate()}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-2 rounded-lg transition-colors text-sm">
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {history.length > 1 && (
          <div>
            <h2 className="font-bold text-gray-600 mb-3 text-sm uppercase tracking-wide">Recent</h2>
            <div className="grid grid-cols-3 gap-3">
              {history.slice(1).map((h, i) => h && (
                <img key={i} src={h.url} alt="meme" className="rounded-xl w-full cursor-pointer hover:opacity-80 transition-opacity shadow"
                  onClick={() => setResult(h)} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
