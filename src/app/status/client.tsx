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
  Play,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  Filter,
} from "lucide-react";
import { useMemo } from "react";

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

const systemStatusConfig: Record<
  string,
  { label: string; color: string; icon: any }
> = {
  operational: {
    label: "All Systems Operational",
    color: "emerald",
    icon: Wifi,
  },
  degraded: {
    label: "Degraded Performance",
    color: "amber",
    icon: AlertTriangle,
  },
  partial_outage: {
    label: "Partial System Outage",
    color: "amber",
    icon: AlertCircle,
  },
  major_outage: { label: "Major System Outage", color: "red", icon: WifiOff },
  unknown: { label: "No Data Available", color: "slate", icon: AlertCircle },
};

export default function StatusPageClient() {
  const [data, setData] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "issues" | "operational"
  >("all");
  const [expandedBrands, setExpandedBrands] = useState<Record<string, boolean>>(
    {},
  );

  const parseJsonResponse = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return res.json();
    }
    const text = await res.text();
    throw new Error(
      `Invalid JSON response (HTTP ${res.status}). Received: ${text.slice(0, 200)}`,
    );
  };

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Failed to fetch status (HTTP ${res.status}): ${text.slice(0, 200)}`,
        );
      }
      const json = await parseJsonResponse(res);
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

  const filteredModels = useMemo(() => {
    if (!data?.models) return [];

    return data.models.filter((model) => {
      const matchesSearch =
        model.modelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "issues" && model.status !== "operational") ||
        (statusFilter === "operational" && model.status === "operational");

      return matchesSearch && matchesStatus;
    });
  }, [data?.models, searchQuery, statusFilter]);

  const groupedModels = useMemo(() => {
    const groups: Record<string, ModelStatus[]> = {};
    filteredModels.forEach((model) => {
      if (!groups[model.provider]) {
        groups[model.provider] = [];
      }
      groups[model.provider].push(model);
    });
    return groups;
  }, [filteredModels]);

  const toggleBrand = (brand: string) => {
    setExpandedBrands((prev) => ({
      ...prev,
      [brand]: !prev[brand],
    }));
  };

  const expandAll = () => {
    const allBrands = Object.keys(groupedModels);
    const newExpanded: Record<string, boolean> = {};
    allBrands.forEach((b) => (newExpanded[b] = true));
    setExpandedBrands(newExpanded);
  };

  const collapseAll = () => {
    setExpandedBrands({});
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchStatus();
  };

  const handleRunTests = async () => {
    setTesting(true);
    setTestMessage("Testing all models... This may take 1-2 minutes.");
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = await parseJsonResponse(res);
      if (res.ok) {
        setTestMessage(`Success! Tested ${json.totalTested} models.`);
        await fetchStatus();
      } else {
        setTestMessage(json.error || "Failed to run tests");
      }
    } catch (err: any) {
      setTestMessage(err.message);
    } finally {
      setTesting(false);
      setTimeout(() => setTestMessage(null), 5000);
    }
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
      emerald: {
        bg: "bg-emerald-500",
        text: "text-emerald-500",
        border: "border-emerald-500/30",
        light: "bg-emerald-500/10",
      },
      amber: {
        bg: "bg-amber-500",
        text: "text-amber-500",
        border: "border-amber-500/30",
        light: "bg-amber-500/10",
      },
      red: {
        bg: "bg-red-500",
        text: "text-red-500",
        border: "border-red-500/30",
        light: "bg-red-500/10",
      },
      slate: {
        bg: "bg-slate-500",
        text: "text-slate-500",
        border: "border-slate-500/30",
        light: "bg-slate-500/10",
      },
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
                <h1 className="text-2xl font-bold tracking-tight">
                  System Status
                </h1>
                <p className="text-sm text-muted-foreground">waspai.in</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing || testing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-accent transition-colors disabled:opacity-50"
              >
                <RefreshCw
                  className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                />
                <span className="text-sm font-medium">Refresh</span>
              </button>
              <button
                onClick={handleRunTests}
                disabled={testing}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-500 text-white hover:bg-violet-600 transition-colors disabled:opacity-50"
              >
                {testing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span className="text-sm font-medium">
                  {testing ? "Testing..." : "Test Now"}
                </span>
              </button>
              <div className="flex items-center gap-2 p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                <TrendingUp className="w-4 h-4" />
                <span className="text-xs font-bold leading-none">
                  99.9% Uptime
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Intro Message */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">
            Real-time Model Monitoring
          </h2>
          <p className="text-muted-foreground text-sm max-w-2xl">
            We monitor <strong>128+ specialized AI models</strong> across
            multiple providers to ensure you always have access to the best
            intelligence. Status is updated every 30 minutes. Use the search and
            filters below to check specific model health.
          </p>
        </div>

        {/* Status Banner */}
        {testMessage && (
          <div
            className={`rounded-lg p-4 mb-4 ${testMessage.includes("Success") ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600" : "bg-amber-500/10 border border-amber-500/20 text-amber-600"}`}
          >
            <p className="text-sm font-medium">{testMessage}</p>
          </div>
        )}
        <div
          className={`rounded-2xl p-8 mb-8 border ${getColorClass(config.color, "light")} ${getColorClass(config.color, "border")}`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div
                className={`w-16 h-16 rounded-2xl ${getColorClass(config.color, "light")} flex items-center justify-center`}
              >
                <config.icon
                  className={`w-8 h-8 ${getColorClass(config.color, "text")}`}
                />
              </div>
              <div>
                <h2 className="text-3xl font-bold mb-1">{config.label}</h2>
                <p className="text-muted-foreground">
                  Last checked:{" "}
                  <span className="font-medium text-foreground">
                    {formatTime(data?.lastChecked || null)}
                  </span>
                </p>
              </div>
            </div>
            <div
              className={`w-4 h-4 rounded-full ${getColorClass(config.color, "bg")} animate-pulse`}
            />
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
            <p className="text-xs text-muted-foreground mt-1">
              models monitored
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
              <span className="text-sm text-muted-foreground">Operational</span>
            </div>
            <p className="text-3xl font-bold text-emerald-500">
              {data?.summary.operational || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              working perfectly
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <span className="text-sm text-muted-foreground">Degraded</span>
            </div>
            <p className="text-3xl font-bold text-amber-500">
              {data?.summary.degraded || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              slower response
            </p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <WifiOff className="w-5 h-5 text-red-500" />
              </div>
              <span className="text-sm text-muted-foreground">Down</span>
            </div>
            <p className="text-3xl font-bold text-red-500">
              {data?.summary.down || 0}
            </p>
            <p className="text-xs text-muted-foreground mt-1">not responding</p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search models or brands..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-border bg-card focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
            />
          </div>
          <div className="flex items-center gap-2 p-1 rounded-xl border border-border bg-card">
            {(["all", "issues", "operational"] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
                  statusFilter === filter
                    ? "bg-violet-500 text-white shadow-sm"
                    : "hover:bg-accent text-muted-foreground"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Brand Grouping Controls */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Models by Brand
            </h3>
          </div>
          <div className="flex gap-4">
            <button
              onClick={expandAll}
              className="text-xs font-medium text-violet-500 hover:text-violet-600 transition-colors"
            >
              Expand All
            </button>
            <button
              onClick={collapseAll}
              className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Models Section (Grouped) */}
        <div className="space-y-4">
          {Object.entries(groupedModels)
            .sort()
            .map(([brand, models]) => {
              const isExpanded = expandedBrands[brand] !== false; // Default to expanded
              const brandStatus = models.every(
                (m) => m.status === "operational",
              )
                ? "operational"
                : models.some((m) => m.status === "down")
                  ? "down"
                  : "degraded";

              return (
                <div
                  key={brand}
                  className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm"
                >
                  <button
                    onClick={() => toggleBrand(brand)}
                    className="w-full px-6 py-4 flex items-center justify-between bg-accent/20 hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <h3 className="font-bold text-lg">{brand}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-background border border-border text-xs text-muted-foreground font-semibold">
                        {models.length}
                      </span>
                    </div>
                    <div
                      className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
                        brandStatus === "operational"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : brandStatus === "down"
                            ? "bg-red-500/10 text-red-500"
                            : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${
                          brandStatus === "operational"
                            ? "bg-emerald-500"
                            : brandStatus === "down"
                              ? "bg-red-500"
                              : "bg-amber-500"
                        }`}
                      />
                      {brandStatus.toUpperCase()}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="divide-y divide-border animate-in fade-in slide-in-from-top-1 duration-200">
                      <div className="grid grid-cols-1 lg:grid-cols-2 divide-x divide-y lg:divide-y-0 divide-border">
                        {models.map((model) => {
                          const status = statusConfig[model.status];
                          const StatusIcon = status.icon;
                          return (
                            <div
                              key={model.modelId}
                              className="px-6 py-4 hover:bg-accent/30 transition-colors"
                            >
                              <div className="flex items-center justify-between">
                                <div className="space-y-1">
                                  <h4 className="font-semibold text-sm tracking-tight">
                                    {model.modelId}
                                  </h4>
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1.5">
                                      <div
                                        className={`w-2 h-2 rounded-full ${status.dot} ${model.status === "operational" ? "animate-pulse" : ""}`}
                                      />
                                      <span
                                        className={`text-xs font-bold uppercase ${status.text}`}
                                      >
                                        {status.label}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground border-l border-border pl-3">
                                      <Activity className="w-3 h-3" />
                                      <span>
                                        {formatUptime(model.uptime)} Uptime
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-4">
                                  {model.responseTime && (
                                    <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-accent/40 px-2 py-0.5 rounded-md">
                                      <Clock className="w-3 h-3" />
                                      <span>{model.responseTime}ms</span>
                                    </div>
                                  )}
                                  <StatusIcon
                                    className={`w-5 h-5 ${status.text}`}
                                  />
                                </div>
                              </div>

                              {model.errorMessage && (
                                <div className="mt-2 text-[10px] leading-tight text-red-500 bg-red-500/5 px-2 py-1.5 rounded-md border border-red-500/10 font-mono">
                                  {model.errorMessage}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

          {Object.keys(groupedModels).length === 0 && (
            <div className="text-center py-20 rounded-2xl border border-dashed border-border bg-accent/5">
              <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">No models found</h3>
              <p className="text-muted-foreground">
                Adjust your search or filter to see results.
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatusFilter("all");
                }}
                className="mt-4 text-violet-500 font-medium hover:underline"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center text-sm text-muted-foreground">
          <p>
            Models tested on demand • Click &quot;Test Now&quot; to run fresh
            tests • Uptime calculated over 30 days
          </p>
          <p className="mt-2">
            <a
              href="https://waspai.in"
              className="text-violet-500 hover:underline"
            >
              waspai.in
            </a>
          </p>
        </footer>
      </main>
    </div>
  );
}
