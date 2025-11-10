"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Star, TrendingUp, Zap, Code, Database, Layers } from "lucide-react";

// UNIQUE FEATURE #4 - Template Marketplace

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tech_stack: string[];
  icon: string;
  tags: string[];
  usage_count: number;
  rating: number;
  is_featured: boolean;
}

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, [category]);

  const fetchTemplates = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const url = category === "all"
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/templates`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/templates?category=${category}`;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case "frontend": return <Code className="w-5 h-5" />;
      case "backend": return <Database className="w-5 h-5" />;
      case "fullstack": return <Layers className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Sparkles className="w-10 h-10 text-purple-600" />
            Template Marketplace
          </h1>
          <p className="text-gray-600 mt-2">
            Deploy production-ready apps in 5 minutes
          </p>
          <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-purple-100 to-pink-100 border border-purple-200 rounded-full">
            <span className="text-xs font-semibold text-purple-700">
              UNIQUE FEATURE - 10+ PRODUCTION-READY TEMPLATES!
            </span>
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3">
          {["all", "frontend", "backend", "fullstack"].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                category === cat
                  ? "bg-purple-600 text-white shadow-lg"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all overflow-hidden group"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="text-4xl">{template.icon}</div>
                  {template.is_featured && (
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded-full flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Featured
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {template.name}
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  {template.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  {template.tech_stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="px-2 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded"
                    >
                      {tech}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>{template.rating}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{template.usage_count} uses</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/templates/${template.id}/deploy`)}
                  className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 flex items-center justify-center gap-2 group-hover:shadow-lg transition-all"
                >
                  <Zap className="w-4 h-4" />
                  Deploy Now
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
