"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  Zap,
} from "lucide-react";

type ModelStatus = {
  modelId: string;
  provider: string;
  status: "operational" | "degraded" | "down" | "unknown";
  responseTime: number | null;
  errorMessage: string | null;
  testedAt: string;
  uptime: number;
};

type StatusData = {
  systemStatus: string;
  lastChecked: string | null;
  summary: {
    total: number;
    operational: number;
    degraded: number;
    down: number;
  };
  models: ModelStatus[];
};

const statusColors = {
  operational: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  degraded: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    dot: "bg-amber-500",
  },
  down: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    dot: "bg-red-500",
  },
  unknown: {
    bg: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500/20",
    dot: "bg-slate-500",
  },
};

const systemStatusMessages: Record<string, { label: string; color: string }> = {
  operational: { label: "All Systems Operational", color: "emerald" },
  degraded: { label: "Degraded Performance", color: "amber" },
  partial_outage: { label: "Partial System Outage", color: "amber" },
  major_outage: { label: "Major System Outage", color: "red" },
};

export default function StatusPageClient() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) throw new Error("Failed to fetch status");
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getSystemStatusColor = () => {
    if (!data) return "slate";
    return systemStatusMessages[data.systemStatus]?.color || "slate";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
          <p className="text-slate-400">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-white mb-2">
            Failed to Load Status
          </h1>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-white transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const systemColor = getSystemStatusColor();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">WaspAI Status</h1>
                <p className="text-sm text-slate-400">waspai.in</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {/* System Status Banner */}
      <div
        className={`border-b ${
          systemColor === "emerald"
            ? "border-emerald-500/20 bg-emerald-500/5"
            : systemColor === "amber"
              ? "border-amber-500/20 bg-amber-500/5"
              : systemColor === "red"
                ? "border-red-500/20 bg-red-500/5"
                : "border-slate-800 bg-slate-900"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className={`w-4 h-4 rounded-full ${
                  systemColor === "emerald"
                    ? "bg-emerald-500"
                    : systemColor === "amber"
                      ? "bg-amber-500"
                      : systemColor === "red"
                        ? "bg-red-500"
                        : "bg-slate-500"
                } ${systemColor === "emerald" ? "animate-pulse" : ""}`}
              />
              <div>
                <h2 className="text-2xl font-bold">
                  {systemStatusMessages[data?.systemStatus || ""]?.label ||
                    "Unknown Status"}
                </h2>
                <p className="text-slate-400 mt-1">
                  Last checked: {formatTime(data?.lastChecked || null)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span className="text-slate-400">
                  {data?.summary.operational || 0} Operational
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-slate-400">
                  {data?.summary.degraded || 0} Degraded
                </span>
              </div>
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-slate-400">
                  {data?.summary.down || 0} Down
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Models Grid */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-lg font-semibold">All Models</h3>
          <span className="text-sm text-slate-400">
            {data?.models.length || 0} models monitored
          </span>
        </div>

        <div className="grid gap-3">
          {data?.models.map((model) => {
            const colors = statusColors[model.status];
            return (
              <div
                key={model.modelId}
                className={`${colors.bg} ${colors.border} border rounded-xl p-4 transition-all hover:scale-[1.01]`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-3 h-3 rounded-full ${colors.dot} ${model.status === "operational" ? "animate-pulse" : ""}`}
                    />
                    <div>
                      <h4 className="font-medium">{model.modelId}</h4>
                      <p className="text-sm text-slate-400">{model.provider}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-8">
                    {/* Response Time */}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="text-sm text-slate-400">
                        {model.responseTime
                          ? `${model.responseTime}ms`
                          : "—"}
                      </span>
                    </div>

                    {/* Uptime */}
                    <div className="flex items-center gap-2 min-w-[80px]">
                      <Activity className="w-4 h-4 text-slate-500" />
                      <span
                        className={`text-sm font-medium ${
                          model.uptime >= 99
                            ? "text-emerald-400"
                            : model.uptime >= 95
                              ? "text-amber-400"
                              : "text-red-400"
                        }`}
                      >
                        {model.uptime}%
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div
                      className={`px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text}`}
                    >
                      {model.status.charAt(0).toUpperCase() +
                        model.status.slice(1)}
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {model.errorMessage && (
                  <div className="mt-3 pt-3 border-t border-slate-800">
                    <p className="text-sm text-red-400">{model.errorMessage}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          <p>
            Models are tested every 12 hours. Uptime calculated over 30 days.
          </p>
          <p className="mt-2">
            Status page powered by WaspAI •{" "}
            <a
              href="https://waspai.in"
              className="text-violet-400 hover:underline"
            >
              waspai.in
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
