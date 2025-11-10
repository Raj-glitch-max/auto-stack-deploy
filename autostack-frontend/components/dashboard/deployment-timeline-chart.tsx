"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

interface DeploymentTimelineChartProps {
  data: Array<{
    date: string
    deployments: number
    successful: number
    failed: number
  }>
}

export function DeploymentTimelineChart({ data }: DeploymentTimelineChartProps) {
  if (data.length === 0) {
    return (
      <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6 flex items-center justify-center h-[300px]">
        <p className="text-gray-400 text-sm">No deployment timeline data available</p>
      </div>
    )
  }

  return (
    <div className="bg-[#111]/70 backdrop-blur border border-white/10 rounded-lg p-6">
      <h3 className="text-lg font-semibold mb-4 text-white">Deployment Timeline</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="date" stroke="#a8a8a8" fontSize={12} />
          <YAxis stroke="#a8a8a8" fontSize={12} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
            }}
            labelStyle={{ color: "#eaeaea" }}
          />
          <Legend
            wrapperStyle={{ color: "#a8a8a8", fontSize: "12px" }}
            iconType="square"
          />
          <Bar dataKey="deployments" fill="#8b5cf6" name="Total" radius={[4, 4, 0, 0]} />
          <Bar dataKey="successful" fill="#10b981" name="Successful" radius={[4, 4, 0, 0]} />
          <Bar dataKey="failed" fill="#ef4444" name="Failed" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

