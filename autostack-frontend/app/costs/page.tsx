"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Target,
  Activity,
} from "lucide-react";

// UNIQUE FEATURE #1 - Cost Optimization Dashboard
// NO COMPETITOR HAS THIS!

interface CostData {
  total_monthly_cost: number;
  total_predicted_monthly_cost: number;
  projects: ProjectCost[];
  total_savings_potential: number;
  active_alerts: number;
}

interface ProjectCost {
  project_id: string;
  project_name: string;
  current_monthly_cost: number;
  predicted_monthly_cost: number;
  trend: string;
  budget_status: BudgetStatus | null;
}

interface BudgetStatus {
  budget_limit: number;
  current_spend: number;
  remaining: number;
  percentage_used: number;
  is_exceeded: boolean;
  status: string;
}

export default function CostDashboard() {
  const router = useRouter();
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("month");

  useEffect(() => {
    fetchCostData();
  }, []);

  const fetchCostData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/costs/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCostData(data);
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
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getTrendIcon = (trend: string) => {
    if (trend === "increasing") {
      return <TrendingUp className="w-4 h-4 text-red-500" />;
    } else if (trend === "decreasing") {
      return <TrendingDown className="w-4 h-4 text-green-500" />;
    }
    return <Activity className="w-4 h-4 text-gray-500" />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 text-green-800 border-green-200";
      case "warning":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "exceeded":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
              <DollarSign className="w-10 h-10 text-green-600" />
              Cost Optimization
            </h1>
            <p className="text-gray-600 mt-2">
              Real-time cost tracking with AI-powered predictions
            </p>
            <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-xs font-semibold text-purple-700">
                UNIQUE FEATURE - NO COMPETITOR HAS THIS!
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Total Cost */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <span className="text-sm text-gray-500">Current Month</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(costData?.total_monthly_cost || 0)}
              </p>
              <p className="text-sm text-gray-600">Total Spend</p>
            </div>
          </div>

          {/* Predicted Cost */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <span className="text-sm text-gray-500">AI Prediction</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(costData?.total_predicted_monthly_cost || 0)}
              </p>
              <p className="text-sm text-gray-600">Predicted Monthly</p>
            </div>
          </div>

          {/* Savings Potential */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <Lightbulb className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm text-gray-500">Optimization</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(costData?.total_savings_potential || 0)}
              </p>
              <p className="text-sm text-gray-600">Potential Savings</p>
            </div>
          </div>

          {/* Active Alerts */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200 hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <span className="text-sm text-gray-500">Budget Alerts</span>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-gray-900">
                {costData?.active_alerts || 0}
              </p>
              <p className="text-sm text-gray-600">Active Warnings</p>
            </div>
          </div>
        </div>

        {/* Projects List */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Project Costs
            </h2>
            <p className="text-gray-600 mt-1">
              Real-time cost breakdown by project
            </p>
          </div>

          <div className="divide-y divide-gray-200">
            {costData?.projects && costData.projects.length > 0 ? (
              costData.projects.map((project) => (
                <div
                  key={project.project_id}
                  className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => router.push(`/projects/${project.project_id}/costs`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {project.project_name}
                        </h3>
                        {getTrendIcon(project.trend)}
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div>
                          <p className="text-sm text-gray-500">Current</p>
                          <p className="text-lg font-semibold text-gray-900">
                            {formatCurrency(project.current_monthly_cost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Predicted</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {formatCurrency(project.predicted_monthly_cost)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Trend</p>
                          <p className="text-lg font-semibold capitalize">
                            {project.trend}
                          </p>
                        </div>
                      </div>
                    </div>

                    {project.budget_status && (
                      <div className="ml-6">
                        <div
                          className={`px-4 py-2 rounded-lg border ${getStatusColor(
                            project.budget_status.status
                          )}`}
                        >
                          <div className="text-center">
                            <p className="text-2xl font-bold">
                              {project.budget_status.percentage_used.toFixed(0)}%
                            </p>
                            <p className="text-xs mt-1">
                              {formatCurrency(project.budget_status.current_spend)} /{" "}
                              {formatCurrency(project.budget_status.budget_limit)}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  No projects with cost data yet
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Deploy a project to start tracking costs
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <button
            onClick={() => router.push("/costs/recommendations")}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl p-6 hover:from-green-600 hover:to-green-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Lightbulb className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">
              View Recommendations
            </h3>
            <p className="text-sm opacity-90">
              Get AI-powered cost optimization suggestions
            </p>
          </button>

          <button
            onClick={() => router.push("/costs/budget")}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl p-6 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
          >
            <Target className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Manage Budgets</h3>
            <p className="text-sm opacity-90">
              Set budget limits and configure alerts
            </p>
          </button>

          <button
            onClick={() => router.push("/costs/anomalies")}
            className="bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl p-6 hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-xl"
          >
            <AlertTriangle className="w-8 h-8 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Check Anomalies</h3>
            <p className="text-sm opacity-90">
              Detect unusual cost spikes and patterns
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}
