"use client"

import { useState } from "react"
import { Plus, Save } from "lucide-react"
import { MainLayout } from "@/components/layout/main-layout"
import { SettingsSection } from "@/components/settings/settings-section"
import { ThemeToggle } from "@/components/settings/theme-toggle"
import { ApiKeyItem } from "@/components/settings/api-key-item"

export default function SettingsPage() {
  const [profile, setProfile] = useState({
    name: "John Developer",
    email: "john@autostack.dev",
  })
  const [apiKeys, setApiKeys] = useState([
    {
      id: 1,
      name: "Production API Key",
      keyProp: "ast_prod_x4f9k2m8n1p5q7r3s9t2u4v6w8x0y1z",
      createdAt: "2 weeks ago",
    },
    {
      id: 2,
      name: "Staging API Key",
      keyProp: "ast_staging_a2b4c6d8e1f3g5h7i9j2k4l6m8n0p1q",
      createdAt: "1 month ago",
    },
  ])

  const [saved, setSaved] = useState(false)

  const handleSaveProfile = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <MainLayout>
      <div className="space-y-8 max-w-3xl">
        {/* Header */}
        <div className="animate-fade-in-slide-down">
          <h1 className="text-3xl font-bold text-text mb-2">Settings</h1>
          <p className="text-text-secondary">Manage your profile and preferences</p>
        </div>

        {/* Profile Section */}
        <SettingsSection title="Profile Information" description="Update your profile details">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Full Name</label>
            <input
              type="text"
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent transition-smooth"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Email Address</label>
            <input
              type="email"
              value={profile.email}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              className="w-full bg-surface text-text border border-white/10 rounded-lg px-4 py-2.5 focus:outline-none focus:border-accent transition-smooth"
            />
          </div>

          <button
            onClick={handleSaveProfile}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-smooth ${
              saved ? "bg-success text-background" : "bg-accent hover:bg-accent/90 text-background"
            }`}
          >
            <Save size={18} />
            {saved ? "Saved!" : "Save Changes"}
          </button>
        </SettingsSection>

        {/* Appearance Section */}
        <SettingsSection title="Appearance" description="Customize your interface">
          <ThemeToggle />
        </SettingsSection>

        {/* API Keys Section */}
        <SettingsSection title="API Keys" description="Manage your API keys for integrations">
          <div className="space-y-3">
            {apiKeys.map((key) => (
              <ApiKeyItem key={key.id} name={key.name} keyProp={key.key} createdAt={key.createdAt} />
            ))}
          </div>

          <button className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-surface hover:bg-surface-light text-accent font-medium transition-smooth w-full justify-center mt-4">
            <Plus size={18} />
            Generate New API Key
          </button>
        </SettingsSection>

        {/* Webhooks Section */}
        <SettingsSection title="Webhooks & Integrations" description="Connect external services">
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-surface flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">GitHub Integration</p>
                <p className="text-xs text-text-secondary mt-1">Connected on Oct 15, 2024</p>
              </div>
              <div className="w-2 h-2 bg-success rounded-full"></div>
            </div>

            <div className="p-3 rounded-lg bg-surface flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">Slack Notifications</p>
                <p className="text-xs text-text-secondary mt-1">Not connected</p>
              </div>
              <button className="text-xs text-accent hover:text-accent/80 font-medium">Connect</button>
            </div>

            <div className="p-3 rounded-lg bg-surface flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-text">PagerDuty</p>
                <p className="text-xs text-text-secondary mt-1">Not connected</p>
              </div>
              <button className="text-xs text-accent hover:text-accent/80 font-medium">Connect</button>
            </div>
          </div>
        </SettingsSection>

        {/* Danger Zone */}
        <SettingsSection title="Danger Zone" description="Irreversible actions">
          <button className="w-full px-4 py-2.5 rounded-lg border border-error text-error hover:bg-error/10 font-medium transition-smooth">
            Delete Account
          </button>
        </SettingsSection>
      </div>
    </MainLayout>
  )
}
