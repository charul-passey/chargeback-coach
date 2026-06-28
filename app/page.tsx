"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Result = {
  reasonCode: string;
  reasonCodeName: string;
  network: string;
  winProbability: number;
  winAssessment: string;
  evidenceNeeded: string[];
  script: string;
  timeLimit: string;
  tips: string[];
};

const NETWORKS = ["Visa", "Mastercard", "Amex", "Discover"];
const EXAMPLES = [
  "Customer says they never received the item",
  "Customer claims the charge was unauthorized",
  "Customer says the product was not as described",
  "Subscription was cancelled but still charged",
];

function ProbabilityBar({ value }: { value: number }) {
  const color = value >= 70 ? "bg-green-500" : value >= 40 ? "bg-yellow-500" : "bg-red-500";
  const label = value >= 70 ? "text-green-700" : value >= 40 ? "text-yellow-700" : "text-red-600";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Win probability</span>
        <span className={`text-sm font-bold ${label}`}>{value}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ChargebackCoach() {
  const [role, setRole] = useState<"merchant" | "cardholder">("merchant");
  const [network, setNetwork] = useState("Visa");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [copied, setCopied] = useState(false);

  async function coach() {
    if (!description.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setChecked(new Set());
    try {
      const res = await fetch("/api/coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role, network, amount, description }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  function toggleCheck(item: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(item) ? next.delete(item) : next.add(item);
      return next;
    });
  }

  function copyScript() {
    if (result) {
      navigator.clipboard.writeText(result.script);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-2">
          <span className="text-lg font-semibold text-gray-900">Chargeback Coach</span>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Chargeback Coach</h1>
          <p className="text-gray-500 mt-1">Describe your dispute, get the right reason code, evidence list, and a ready-to-send response.</p>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-700">I am a...</label>
              <div className="flex gap-2">
                {(["merchant", "cardholder"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`px-4 py-1.5 rounded-full text-sm border capitalize transition-colors ${
                      role === r
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {r === "merchant" ? "Merchant fighting a chargeback" : "Cardholder filing a dispute"}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Card Network</label>
                <select
                  value={network}
                  onChange={(e) => setNetwork(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-400 bg-white"
                >
                  {NETWORKS.map((n) => <option key={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700">Transaction Amount ($) <span className="text-gray-400 font-normal">optional</span></label>
                <input
                  type="number"
                  placeholder="e.g. 250"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Describe what happened</label>
              <textarea
                rows={4}
                placeholder="Describe the dispute in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-400 resize-y"
              />
              <div className="flex flex-wrap gap-2">
                {EXAMPLES.map((ex) => (
                  <button
                    key={ex}
                    onClick={() => setDescription(ex)}
                    className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full transition-colors border border-gray-200"
                  >
                    {ex}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={coach} disabled={loading || !description.trim()} className="w-full sm:w-auto">
              {loading ? "Coaching you..." : "Coach me"}
            </Button>
          </CardContent>
        </Card>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-md p-4 mb-6 text-sm">{error}</div>
        )}

        {loading && (
          <Card>
            <CardContent className="py-12 text-center text-gray-400 text-sm">
              Analyzing your dispute...
            </CardContent>
          </Card>
        )}

        {result && (
          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="flex flex-wrap items-start gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Reason Code</p>
                    <Badge className="bg-gray-900 text-white hover:bg-gray-900 text-sm px-3 py-1">
                      {result.network} {result.reasonCode} — {result.reasonCodeName}
                    </Badge>
                  </div>
                </div>
                <ProbabilityBar value={result.winProbability} />
                <p className="text-sm text-gray-700">{result.winAssessment}</p>
                <div className="bg-amber-50 border border-amber-200 rounded-md px-4 py-2">
                  <p className="text-sm text-amber-800 font-medium">⏱ {result.timeLimit}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evidence checklist</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {result.evidenceNeeded.map((item) => (
                    <li key={item} className="flex items-center gap-3">
                      <button
                        onClick={() => toggleCheck(item)}
                        className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                          checked.has(item) ? "bg-gray-900 border-gray-900" : "border-gray-300"
                        }`}
                      >
                        {checked.has(item) && <span className="text-white text-xs">✓</span>}
                      </button>
                      <span className={`text-sm ${checked.has(item) ? "line-through text-gray-400" : "text-gray-700"}`}>{item}</span>
                    </li>
                  ))}
                </ul>
                {result.evidenceNeeded.length > 0 && (
                  <p className="text-xs text-gray-400 mt-3">{checked.size} of {result.evidenceNeeded.length} gathered</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-base">Response script</CardTitle>
                <button
                  onClick={copyScript}
                  className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded border border-gray-200 transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </CardHeader>
              <CardContent>
                <pre className="text-xs text-gray-700 bg-gray-50 border border-gray-100 rounded p-4 whitespace-pre-wrap font-mono leading-relaxed">{result.script}</pre>
              </CardContent>
            </Card>

            {result.tips.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Additional tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {result.tips.map((tip, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-gray-400 shrink-0">→</span>{tip}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Describe your dispute above to get coaching
          </div>
        )}
      </div>
    </div>
  );
}
