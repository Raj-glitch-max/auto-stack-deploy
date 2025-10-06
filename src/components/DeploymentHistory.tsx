import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { History, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface Deployment {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  commit_sha: string | null;
  commit_message: string | null;
  docker_image_tag: string | null;
  jenkins_build_url: string | null;
  logs: string | null;
  error_message: string | null;
}

interface DeploymentHistoryProps {
  projectId: string;
}

export function DeploymentHistory({ projectId }: DeploymentHistoryProps) {
  const [open, setOpen] = useState(false);
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState<Deployment | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchDeployments();
    }
  }, [open, projectId]);

  const fetchDeployments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('deployments')
        .select('*')
        .eq('project_id', projectId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setDeployments(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch deployment history',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      success: 'bg-success/10 text-success border-success/20',
      failed: 'bg-destructive/10 text-destructive border-destructive/20',
      pending: 'bg-warning/10 text-warning border-warning/20',
      running: 'bg-info/10 text-info border-info/20',
    };
    return variants[status] || '';
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="mr-2 h-4 w-4" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Deployment History</DialogTitle>
          <DialogDescription>View past deployments and their details</DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : deployments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">No deployments yet</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <ScrollArea className="h-[500px] pr-4">
              <div className="space-y-2">
                {deployments.map((deployment, index) => (
                  <motion.div
                    key={deployment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedDeployment(deployment)}
                    className={`cursor-pointer rounded-lg border p-3 transition-all hover:border-primary/50 hover:shadow-lg ${
                      selectedDeployment?.id === deployment.id ? 'border-primary bg-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(deployment.status)}
                        <div className="text-sm">
                          <div className="font-medium">
                            {new Date(deployment.started_at).toLocaleString()}
                          </div>
                          {deployment.commit_message && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {deployment.commit_message}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={getStatusBadge(deployment.status)}>
                        {deployment.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            <div className="rounded-lg border bg-card/50 p-4">
              {selectedDeployment ? (
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-semibold">Deployment Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge className={getStatusBadge(selectedDeployment.status)}>
                          {selectedDeployment.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Started:</span>
                        <span>{new Date(selectedDeployment.started_at).toLocaleString()}</span>
                      </div>
                      {selectedDeployment.completed_at && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Completed:</span>
                          <span>{new Date(selectedDeployment.completed_at).toLocaleString()}</span>
                        </div>
                      )}
                      {selectedDeployment.commit_sha && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Commit:</span>
                          <span className="font-mono text-xs">
                            {selectedDeployment.commit_sha.substring(0, 7)}
                          </span>
                        </div>
                      )}
                      {selectedDeployment.docker_image_tag && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Image Tag:</span>
                          <span className="font-mono text-xs">
                            {selectedDeployment.docker_image_tag}
                          </span>
                        </div>
                      )}
                      {selectedDeployment.jenkins_build_url && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Jenkins:</span>
                          <a
                            href={selectedDeployment.jenkins_build_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-primary hover:underline"
                          >
                            View Build
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {selectedDeployment.error_message && (
                    <div>
                      <h4 className="mb-2 font-semibold text-destructive">Error Message</h4>
                      <ScrollArea className="h-24 rounded border bg-destructive/5 p-2">
                        <pre className="text-xs text-destructive">
                          {selectedDeployment.error_message}
                        </pre>
                      </ScrollArea>
                    </div>
                  )}

                  {selectedDeployment.logs && (
                    <div>
                      <h4 className="mb-2 font-semibold">Deployment Logs</h4>
                      <ScrollArea className="h-48 rounded border bg-muted/50 p-2">
                        <pre className="text-xs">{selectedDeployment.logs}</pre>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Select a deployment to view details
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
