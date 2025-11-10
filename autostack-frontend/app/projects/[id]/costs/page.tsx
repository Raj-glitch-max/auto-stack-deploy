"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Download,
  RefreshCw,
  Zap,
  Database,
  HardDrive,
  Network,
} from "lucide-react";

// Project-specific cost details with charts

interface CostSnapshot {
  id: string;
  timestamp: string;
  total_cost: number;
  compute_cost: number;
  storage_cost: number;
  bandwidth_cost: number;
  database_cost: number;
  other_cost: number;
  cloud_provider: string;
}

interface CostSummary {
  total_cost: number;
  average_cost: number;
  min_cost: number;
  max_cost: number;
  trend: string;
  data_points: number;
}

interface CostPrediction {
  predicted_daily_cost: number;
  predicted_monthly_cost: number;
  predicted_yearly_cost: number;
  confidence_score: number;
  model_version: string;
}

export default function ProjectCostDetails() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.id as string;

  const [snapshots, setSnapshots] = useState<CostSnapshot[]>([]);
  const [summary, setSummary] = useState<CostSummary | null>(null);
  const [prediction, setPrediction] = useState<CostPrediction | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

  useEffect(() => {
    if (projectId) {
      fetchCostData();
    }
  }, [projectId, period]);

  const fetchCostData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Fetch snapshots
      const snapshotsRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/costs/projects/${projectId}/snapshots`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch summary
      const summaryRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/costs/projects/${projectId}/summary?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Fetch prediction
      const predictionRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/costs/projects/${projectId}/prediction`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (snapshotsRes.ok) {
        const data = await snapshotsRes.json();
        setSnapshots(data);
      }

      if (summaryRes.ok) {
        const data = await summaryRes.json();
        setSummary(data);
      }

      if (predictionRes.ok) {
        const data = await predictionRes.json();
        setPrediction(data);
      }
    } catch (error) {
      console.error("Error fetching cost data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  const getTrendColor = (trend: string) => {
    if (trend === "increasing") return "text-red-600";
    if (trend === "decreasing") return "text-green-600";
    return "text-gray-600";
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") return <TrendingUp className="w-5 h-5" />;
    if (trend === "decreasing") return <TrendingDown className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => router.back()}
              className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-gray-900">
              Project Cost Details
            </h1>
            <p className="text-gray-600 mt-1">
              Real-time cost tracking and predictions
            </p>
          </div>

          <div className="flex items-center gap-4">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>

            <button
              onClick={fetchCostData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-blue-600" />
              <span className="text-sm text-gray-500">Total</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary?.total_cost || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Total Spend</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-600" />
              <span className="text-sm text-gray-500">Average</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(summary?.average_cost || 0)}
            </p>
            <p className="text-sm text-gray-600 mt-1">Per Day</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={getTrendColor(summary?.trend || "stable")}>
                {getTrendIcon(summary?.trend || "stable")}
              </div>
              <span className="text-sm text-gray-500">Trend</span>
            </div>
            <p className={`text-2xl font-bold capitalize ${getTrendColor(summary?.trend || "stable")}`}>
              {summary?.trend || "Stable"}
            </p>
            <p className="text-sm text-gray-600 mt-1">Cost Trend</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-green-600" />
              <span className="text-sm text-gray-500">Data Points</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {summary?.data_points || 0}
            </p>
            <p className="text-sm text-gray-600 mt-1">Snapshots</p>
          </div>
        </div>

        {/* AI Prediction */}
        {prediction && (
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  <Zap className="w-6 h-6" />
                  AI Cost Prediction
                </h2>
                <p className="text-purple-100 mt-1">
                  Powered by {prediction.model_version} • {(prediction.confidence_score * 100).toFixed(0)}% confidence
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-6">
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">Daily</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(prediction.predicted_daily_cost)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">Monthly</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(prediction.predicted_monthly_cost)}
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-lg p-4">
                <p className="text-purple-100 text-sm mb-1">Yearly</p>
                <p className="text-3xl font-bold">
                  {formatCurrency(prediction.predicted_yearly_cost)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Cost Breakdown */}
        {snapshots.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                Cost Breakdown
              </h2>
              <p className="text-gray-600 mt-1">
                Latest cost distribution
              </p>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                  <Zap className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="text-sm text-gray-600">Compute</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(snapshots[0].compute_cost)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                  <HardDrive className="w-8 h-8 text-green-600" />
                  <div>
                    <p className="text-sm text-gray-600">Storage</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(snapshots[0].storage_cost)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg">
                  <Network className="w-8 h-8 text-purple-600" />
                  <div>
                    <p className="text-sm text-gray-600">Bandwidth</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(snapshots[0].bandwidth_cost)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-lg">
                  <Database className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-sm text-gray-600">Database</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(snapshots[0].database_cost)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Activity className="w-8 h-8 text-gray-600" />
                  <div>
                    <p className="text-sm text-gray-600">Other</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(snapshots[0].other_cost)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Snapshots */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">
              Cost History
            </h2>
            <p className="text-gray-600 mt-1">
              Recent cost snapshots
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Cost
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Compute
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Storage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Provider
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {snapshots.slice(0, 10).map((snapshot) => (
                  <tr key={snapshot.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(snapshot.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                      {formatCurrency(snapshot.total_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(snapshot.compute_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {formatCurrency(snapshot.storage_cost)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                        {snapshot.cloud_provider.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
