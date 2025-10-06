import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, XCircle, Clock, ExternalLink, LogOut, Loader2, Rocket } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProjects } from "@/hooks/useProjects";
import { CreateProjectDialog } from "@/components/CreateProjectDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const getStatusIcon = (status: string) => {
  switch (status) {
    case "active":
    case "running":
      return <CheckCircle2 className="h-5 w-5 text-success" />;
    case "deploying":
      return <Clock className="h-5 w-5 text-warning animate-pulse" />;
    case "failed":
      return <XCircle className="h-5 w-5 text-destructive" />;
    case "pending":
      return <Clock className="h-5 w-5 text-muted-foreground" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, string> = {
    active: "bg-success/10 text-success border-success/20",
    running: "bg-success/10 text-success border-success/20",
    deploying: "bg-warning/10 text-warning border-warning/20",
    failed: "bg-destructive/10 text-destructive border-destructive/20",
    pending: "bg-muted/10 text-muted-foreground border-muted/20",
    stopped: "bg-muted/10 text-muted-foreground border-muted/20",
  };
  return variants[status] || "";
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { projects, loading, refetch } = useProjects();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleDeploy = async (projectId: string) => {
    try {
      toast({
        title: 'Deploying...',
        description: 'Triggering Jenkins build',
      });

      const { data, error } = await supabase.functions.invoke('trigger-jenkins', {
        body: { projectId },
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Deployment triggered successfully',
      });
    } catch (error: any) {
      console.error('Deploy error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to trigger deployment',
        variant: 'destructive',
      });
    }
  };

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
          <CreateProjectDialog onProjectCreated={refetch} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : projects.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Activity className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first project to get started
              </p>
              <CreateProjectDialog onProjectCreated={refetch} />
            </CardContent>
          </Card>
        ) : (
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
                        {project.aws_service.toUpperCase()} • {project.aws_region}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusBadge(project.status)}>{project.status}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {project.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                      </p>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Health</span>
                      <span className={`font-medium ${
                        project.health_status === 'healthy' ? 'text-success' :
                        project.health_status === 'unhealthy' ? 'text-destructive' :
                        'text-muted-foreground'
                      }`}>
                        {project.health_status}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDeploy(project.id)}
                        disabled={project.status === 'deploying'}
                      >
                        <Rocket className="mr-2 h-4 w-4" />
                        Deploy
                      </Button>
                      {project.deployment_url && (
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a href={project.deployment_url} target="_blank" rel="noopener noreferrer">
                            View Live
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
