"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Activity,
  Zap,
  Server,
  TrendingUp,
  Wifi,
  WifiOff,
  AlertTriangle,
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

const statusConfig = {
  operational: {
    icon: CheckCircle2,
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
    text: "text-emerald-500",
    dot: "bg-emerald-500",
    label: "Operational",
  },
  degraded: {
    icon: AlertTriangle,
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
    text: "text-amber-500",
    dot: "bg-amber-500",
    label: "Degraded",
  },
  down: {
    icon: WifiOff,
    bg: "bg-red-500/10",
    border: "border-red-500/20",
    text: "text-red-500",
    dot: "bg-red-500",
    label: "Down",
  },
  unknown: {
    icon: AlertCircle,
    bg: "bg-slate-500/10",
    border: "border-slate-500/20",
    text: "text-slate-500",
    dot: "bg-slate-500",
    label: "Unknown",
  },
};

const systemStatusConfig: Record<string, { label: string; color: string; icon: any }> = {
  operational: { label: "All Systems Operational", color: "emerald", icon: Wifi },
  degraded: { label: "Degraded Performance", color: "amber", icon: AlertTriangle },
  partial_outage: { label: "Partial System Outage", color: "amber", icon: AlertCircle },
  major_outage: { label: "Major System Outage", color: "red", icon: WifiOff },
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

  const formatUptime = (uptime: number) => {
    if (uptime >= 99.9) return "99.9%";
    return `${uptime.toFixed(1)}%`;
  };

  const getColorClass = (color: string, type: string) => {
    const colorMap: Record<string, Record<string, string>> = {
      emerald: { bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500/30", light: "bg-emerald-500/10" },
      amber: { bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500/30", light: "bg-amber-500/10" },
      red: { bg: "bg-red-500", text: "text-red-500", border: "border-red-500/30", light: "bg-red-500/10" },
      slate: { bg: "bg-slate-500", text: "text-slate-500", border: "border-slate-500/30", light: "bg-slate-500/10" },
    };
    return colorMap[color]?.[type] || colorMap.slate[type];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-muted border-t-primary animate-spin" />
          </div>
          <p className="text-muted-foreground">Loading system status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-xl font-semibold mb-2">Failed to Load Status</h1>
          <p className="text-muted-foreground mb-6">{error}</p>
          <button
            onClick={fetchStatus}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const systemStatus = data?.systemStatus || "unknown";
  const config = systemStatusConfig[systemStatus] || systemStatusConfig.unknown;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">System Status</h1>
                <p className="text-sm text-muted-foreground">waspai.in</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span className="text-sm font-medium">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Status Banner */}
        <div className={`rounded-2xl p-8 mb-8 border ${getColorClass(config.color, "light")} ${getColorClass(config.color, "border")}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl ${getColorClass(config.color, "light")} flex items-center justify-center`}>
                <config.icon className={`w-8 h-8 ${getColorClass(config.color, "text")}`} />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{config.label}</h2>
                <p className="text-muted-foreground">
                  Last checked: <span className="font-medium text-foreground">{formatTime(data?.lastChecked || null)}</span>
                </p>
              </div>
            </div>
            <div className={`w-4 h-4 rounded-full ${getColorClass(config.color, "bg")} animate-pulse`} />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Total</span>
            </div>
            <p className="text-3xl font-bold">{data?.summary.total || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">models monitored</p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <p className="text-3xl font-bold text-emerald-500">{data?.summary.operational || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">working perfectly</p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <p className="text-3xl font-bold text-amber-500">{data?.summary.degraded || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">slower response</p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Down</span>
            </div>
            <p className="text-3xl font-bold text-red-500">{data?.summary.down || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">not responding</p>
          </div>
        </div>

        {/* Models Section */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <h3 className="font-semibold">Model Health</h3>
            </div>
            <span className="text-sm text-muted-foreground">{data?.models.length || 0} models</span>
          </div>

          <div className="divide-y divide-border">
            {data?.models.map((model) => {
              const status = statusConfig[model.status];
              const StatusIcon = status.icon;
              return (
                <div
                  key={model.modelId}
                  className="px-6 py-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${status.dot} ${model.status === "operational" ? "animate-pulse" : ""}`} />
                      <div>
                        <h4 className="font-medium">{model.modelId}</h4>
                        <p className="text-sm text-muted-foreground">{model.provider}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      {model.responseTime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>{model.responseTime}ms</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 min-w-[70px]">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className={`text-sm font-medium ${
                          model.uptime >= 99 ? "text-emerald-500" : 
                          model.uptime >= 95 ? "text-amber-500" : "text-red-500"
                        }`}>
                          {formatUptime(model.uptime)}
                        </span>
                      </div>

                      <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${status.bg} ${status.text}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                    </div>
                  </div>

                  {model.errorMessage && (
                    <div className="mt-3 ml-7 text-sm text-red-500 bg-red-500/5 px-3 py-2 rounded-lg">
                      {model.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>Models tested every 12 hours • Uptime calculated over 30 days</p>
          <p className="mt-2">
            <a href="https://waspai.in" className="text-violet-500 hover:underline">waspai.in</a>
          </p>
        </footer>
      </main>
    </div>
  );
}
