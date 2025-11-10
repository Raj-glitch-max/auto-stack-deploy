"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"

interface DeploymentStatusChartProps {
  data: {
    success: number
    failed: number
    running: number
    pending: number
  }
}

const COLORS = {
  success: "#10b981",
  failed: "#ef4444",
  running: "#f59e0b",
  pending: "#6b7280",
}

export function DeploymentStatusChart({ data }: DeploymentStatusChartProps) {
  const chartData = [
    { name: "Success", value: data.success, color: COLORS.success },
    { name: "Failed", value: data.failed, color: COLORS.failed },
    { name: "Running", value: data.running, color: COLORS.running },
    { name: "Pending", value: data.pending, color: COLORS.pending },
  ].filter((item) => item.value > 0)

  if (chartData.length === 0) {
    return (
      <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6 flex items-center justify-center h-[300px]">
        <p className="text-gray-400 text-sm">No deployment data available</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Deployment Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
          />
          <Legend
            wrapperStyle={{ color: "#a8a8a8", fontSize: "12px" }}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

