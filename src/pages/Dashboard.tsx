import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Activity, CheckCircle2, XCircle, Clock, ExternalLink, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

// Mock project data
const projects = [
  {
    id: "1",
    name: "production-api",
    status: "running",
    deployment: "EC2",
    lastDeploy: "2 hours ago",
    health: 98,
    url: "https://api.example.com",
  },
  {
    id: "2",
    name: "web-frontend",
    status: "deploying",
    deployment: "ECS",
    lastDeploy: "deploying...",
    health: 0,
    url: null,
  },
  {
    id: "3",
    name: "analytics-service",
    status: "running",
    deployment: "EKS",
    lastDeploy: "1 day ago",
    health: 100,
    url: "https://analytics.example.com",
  },
  {
    id: "4",
    name: "auth-service",
    status: "failed",
    deployment: "EC2",
    lastDeploy: "3 hours ago",
    health: 0,
    url: null,
  },
];

const getStatusIcon = (status: string) => {
  switch (status) {
    case "running":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "deploying":
      return <Clock className="h-5 w-5 text-warning animate-pulse" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-destructive" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants = {
    running: "bg-success/10 text-success border-success/20",
    deploying: "bg-warning/10 text-warning border-warning/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
  };
  return variants[status as keyof typeof variants] || "";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
              <Activity className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent">AutoStack</span>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">{user.email}</span>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Projects</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your deployments and infrastructure
            </p>
          </div>
          <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
            <Plus className="mr-2 h-5 w-5" />
            New Project
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card
              key={project.id}
              className="group border-border transition-all hover:border-primary/50 hover:shadow-elevated"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {project.name}
                      {getStatusIcon(project.status)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Deployed to {project.deployment}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusBadge(project.status)}>{project.status}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Deploy</span>
                    <span className="font-medium">{project.lastDeploy}</span>
                  </div>
                  {project.health > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Health</span>
                      <span className="font-medium text-success">{project.health}%</span>
                    </div>
                  )}
                  {project.url && (
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <a href={project.url} target="_blank" rel="noopener noreferrer">
                        View Live
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
