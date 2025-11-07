"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"

const data = [
  { time: "00:00", cpu: 24, memory: 42, agents: 8 },
  { time: "04:00", cpu: 32, memory: 48, agents: 10 },
  { time: "08:00", cpu: 45, memory: 55, agents: 12 },
  { time: "12:00", cpu: 38, memory: 52, agents: 11 },
  { time: "16:00", cpu: 52, memory: 61, agents: 14 },
  { time: "20:00", cpu: 48, memory: 58, agents: 13 },
  { time: "24:00", cpu: 35, memory: 50, agents: 10 },
]

export function SystemMetricsChart() {
  return (
    <div className="glass rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-4 text-text">System Metrics</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis dataKey="time" stroke="#a8a8a8" />
          <YAxis stroke="#a8a8a8" />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a1a",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
            }}
            labelStyle={{ color: "#eaeaea" }}
          />
          <Legend />
          <Line type="monotone" dataKey="cpu" stroke="#3498db" strokeWidth={2} dot={false} name="CPU %" />
          <Line type="monotone" dataKey="memory" stroke="#1abc9c" strokeWidth={2} dot={false} name="Memory %" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
