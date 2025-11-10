"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Play,
  Edit,
  Trash2,
  GitBranch,
  Clock,
  CheckCircle,
  XCircle,
  Loader,
} from "lucide-react";

// UNIQUE FEATURE #2 - Visual Pipeline Builder
// List all pipelines

interface Pipeline {
  id: string;
  name: string;
  description: string;
  version: number;
  trigger_type: string;
  is_active: boolean;
  created_at: string;
  last_run_at: string | null;
}

export default function PipelinesPage() {
  const router = useRouter();
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPipelines();
  }, []);

  const fetchPipelines = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // TODO: Get project ID from context
      const projectId = "default";

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/project/${projectId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPipelines(data);
      }
    } catch (error) {
      console.error("Error fetching pipelines:", error);
    } finally {
      setLoading(false);
    }
  };

  const createNewPipeline = () => {
    router.push("/pipelines/new/builder");
  };

  const editPipeline = (id: string) => {
    router.push(`/pipelines/${id}/builder`);
  };

  const deletePipeline = async (id: string) => {
    if (!confirm("Are you sure you want to delete this pipeline?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchPipelines();
      }
    } catch (error) {
      console.error("Error deleting pipeline:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
              <GitBranch className="w-10 h-10 text-purple-600" />
              Visual Pipelines
            </h1>
            <p className="text-gray-600 mt-2">
              Build CI/CD pipelines visually - No YAML required!
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

          <button
            onClick={createNewPipeline}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Pipeline
          </button>
        </div>

        {/* Pipelines Grid */}
        {pipelines.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pipelines.map((pipeline) => (
              <div
                key={pipeline.id}
                className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-shadow overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">
                        {pipeline.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {pipeline.description || "No description"}
                      </p>
                    </div>
                    {pipeline.is_active ? (
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full">
                        Inactive
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="w-4 h-4" />
                      <span>
                        Version {pipeline.version} • {pipeline.trigger_type}
                      </span>
                    </div>
                    {pipeline.last_run_at && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span>
                          Last run:{" "}
                          {new Date(pipeline.last_run_at).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => editPipeline(pipeline.id)}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => router.push(`/pipelines/${pipeline.id}/runs`)}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Play className="w-4 h-4" />
                      Runs
                    </button>
                    <button
                      onClick={() => deletePipeline(pipeline.id)}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <GitBranch className="w-20 h-20 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No Pipelines Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              Create your first visual pipeline and say goodbye to YAML files!
              Build, test, and deploy with drag-and-drop simplicity.
            </p>
            <button
              onClick={createNewPipeline}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center gap-2 mx-auto shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Your First Pipeline
            </button>
          </div>
        )}

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
            <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mb-4">
              <GitBranch className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Visual Builder
            </h3>
            <p className="text-gray-600 text-sm">
              Drag and drop steps to build your pipeline. No YAML knowledge
              required!
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
            <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mb-4">
              <Play className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Real-time Execution
            </h3>
            <p className="text-gray-600 text-sm">
              Watch your pipeline execute in real-time with live logs and
              status updates.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
            <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">
              Export to YAML
            </h3>
            <p className="text-gray-600 text-sm">
              Export your visual pipeline to GitHub Actions YAML with one
              click.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
