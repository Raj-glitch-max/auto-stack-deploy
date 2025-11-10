"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  Play,
  Save,
  Download,
  Settings,
  Plus,
  Trash2,
  Code,
  TestTube,
  Rocket,
  Bell,
  GitBranch,
  Database,
  Cloud,
} from "lucide-react";

// UNIQUE FEATURE #2 - Visual Pipeline Builder
// NO COMPETITOR HAS THIS!

// Node types are handled by default React Flow nodes

const initialNodes: Node[] = [
  {
    id: "1",
    type: "default",
    data: { label: "Start" },
    position: { x: 250, y: 50 },
  },
];

const initialEdges: Edge[] = [];

export default function PipelineBuilder() {
  const router = useRouter();
  const params = useParams();
  const pipelineId = params.id as string;

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [pipelineName, setPipelineName] = useState("My Pipeline");
  const [saving, setSaving] = useState(false);
  const [executing, setExecuting] = useState(false);

  useEffect(() => {
    if (pipelineId && pipelineId !== "new") {
      loadPipeline();
    }
  }, [pipelineId]);

  const loadPipeline = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/${pipelineId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const pipeline = await response.json();
        setPipelineName(pipeline.name);
        if (pipeline.definition?.nodes) {
          setNodes(pipeline.definition.nodes);
        }
        if (pipeline.definition?.edges) {
          setEdges(pipeline.definition.edges);
        }
      }
    } catch (error) {
      console.error("Error loading pipeline:", error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            markerEnd: { type: MarkerType.ArrowClosed },
            animated: true,
          },
          eds
        )
      ),
    [setEdges]
  );

  const addNode = (type: string, label: string, icon: any) => {
    const newNode: Node = {
      id: `${nodes.length + 1}`,
      type: "default",
      data: {
        label: (
          <div className="flex items-center gap-2">
            {icon}
            <span>{label}</span>
          </div>
        ),
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      style: {
        background: getNodeColor(type),
        color: "white",
        border: "2px solid #fff",
        borderRadius: "8px",
        padding: "10px",
        fontSize: "14px",
        fontWeight: "600",
      },
    };

    setNodes((nds) => [...nds, newNode]);
  };

  const getNodeColor = (type: string) => {
    switch (type) {
      case "build":
        return "#3b82f6"; // blue
      case "test":
        return "#10b981"; // green
      case "deploy":
        return "#8b5cf6"; // purple
      case "notify":
        return "#f59e0b"; // orange
      default:
        return "#6b7280"; // gray
    }
  };

  const savePipeline = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const definition = {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.type,
          position: node.position,
          data: { label: pipelineName },
        })),
        edges: edges.map((edge) => ({
          id: edge.id,
          source: edge.source,
          target: edge.target,
        })),
      };

      const url =
        pipelineId === "new"
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines`
          : `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/${pipelineId}`;

      const method = pipelineId === "new" ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: pipelineName,
          definition,
          project_id: "default", // TODO: Get from context
        }),
      });

      if (response.ok) {
        alert("Pipeline saved successfully!");
      }
    } catch (error) {
      console.error("Error saving pipeline:", error);
      alert("Failed to save pipeline");
    } finally {
      setSaving(false);
    }
  };

  const executePipeline = async () => {
    setExecuting(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/${pipelineId}/execute`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            trigger_type: "manual",
          }),
        }
      );

      if (response.ok) {
        const run = await response.json();
        alert(`Pipeline execution started! Run #${run.run_number}`);
        router.push(`/pipelines/${pipelineId}/runs/${run.id}`);
      }
    } catch (error) {
      console.error("Error executing pipeline:", error);
      alert("Failed to execute pipeline");
    } finally {
      setExecuting(false);
    }
  };

  const exportYAML = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/pipelines/${pipelineId}/export/yaml`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const blob = new Blob([data.yaml], { type: "text/yaml" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${pipelineName}.yml`;
        a.click();
      }
    } catch (error) {
      console.error("Error exporting YAML:", error);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900"
            >
              ← Back
            </button>
            <input
              type="text"
              value={pipelineName}
              onChange={(e) => setPipelineName(e.target.value)}
              className="text-2xl font-bold border-none focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2"
            />
            <div className="px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full">
              <span className="text-xs font-semibold text-purple-700">
                UNIQUE FEATURE - NO COMPETITOR HAS THIS!
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportYAML}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export YAML
            </button>
            <button
              onClick={savePipeline}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={executePipeline}
              disabled={executing || pipelineId === "new"}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Play className="w-4 h-4" />
              {executing ? "Running..." : "Run"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar - Node Library */}
        <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Pipeline Steps
          </h3>

          <div className="space-y-2">
            <button
              onClick={() =>
                addNode("build", "Build", <Code className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 flex items-center gap-3 text-left"
            >
              <Code className="w-5 h-5" />
              <div>
                <div className="font-semibold">Build</div>
                <div className="text-xs text-blue-600">Compile & bundle</div>
              </div>
            </button>

            <button
              onClick={() =>
                addNode("test", "Test", <TestTube className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 flex items-center gap-3 text-left"
            >
              <TestTube className="w-5 h-5" />
              <div>
                <div className="font-semibold">Test</div>
                <div className="text-xs text-green-600">Run tests</div>
              </div>
            </button>

            <button
              onClick={() =>
                addNode("deploy", "Deploy", <Rocket className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 flex items-center gap-3 text-left"
            >
              <Rocket className="w-5 h-5" />
              <div>
                <div className="font-semibold">Deploy</div>
                <div className="text-xs text-purple-600">Ship to production</div>
              </div>
            </button>

            <button
              onClick={() =>
                addNode("notify", "Notify", <Bell className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 flex items-center gap-3 text-left"
            >
              <Bell className="w-5 h-5" />
              <div>
                <div className="font-semibold">Notify</div>
                <div className="text-xs text-orange-600">Send alerts</div>
              </div>
            </button>

            <button
              onClick={() =>
                addNode("database", "Database", <Database className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 flex items-center gap-3 text-left"
            >
              <Database className="w-5 h-5" />
              <div>
                <div className="font-semibold">Database</div>
                <div className="text-xs text-indigo-600">Run migrations</div>
              </div>
            </button>

            <button
              onClick={() =>
                addNode("cloud", "Cloud", <Cloud className="w-4 h-4" />)
              }
              className="w-full px-4 py-3 bg-cyan-50 text-cyan-700 rounded-lg hover:bg-cyan-100 flex items-center gap-3 text-left"
            >
              <Cloud className="w-5 h-5" />
              <div>
                <div className="font-semibold">Cloud Sync</div>
                <div className="text-xs text-cyan-600">Upload assets</div>
              </div>
            </button>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">💡 Pro Tip</h4>
            <p className="text-sm text-gray-600">
              Drag nodes onto the canvas and connect them to build your CI/CD
              pipeline visually. No YAML required!
            </p>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            className="bg-gray-50"
          >
            <Background color="#e5e7eb" gap={16} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                const type = node.type || "default";
                return getNodeColor(type);
              }}
              className="bg-white border border-gray-200"
            />
          </ReactFlow>

          {nodes.length === 1 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-white p-8 rounded-lg shadow-lg border-2 border-dashed border-gray-300 max-w-md text-center">
                <GitBranch className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Start Building Your Pipeline
                </h3>
                <p className="text-gray-600">
                  Click on the steps in the sidebar to add them to your
                  pipeline, then connect them together.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
