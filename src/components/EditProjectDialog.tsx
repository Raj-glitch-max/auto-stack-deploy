import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Edit } from 'lucide-react';
import { Project } from '@/hooks/useProjects';

interface EditProjectDialogProps {
  project: Project;
  onProjectUpdated: () => void;
}

export function EditProjectDialog({ project, onProjectUpdated }: EditProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || '',
    repo_url: project.repo_url || '',
    repo_branch: project.repo_branch,
    jenkins_job_name: project.jenkins_job_name || '',
    aws_service: project.aws_service,
    aws_region: project.aws_region,
    ecr_repository: project.ecr_repository || '',
    ecs_cluster_name: project.ecs_cluster_name || '',
    ecs_service_name: project.ecs_service_name || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('projects')
        .update(formData)
        .eq('id', project.id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project updated successfully',
      });

      setOpen(false);
      onProjectUpdated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Project</DialogTitle>
          <DialogDescription>Update your project configuration</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Project Name *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-repo-url">Repository URL</Label>
              <Input
                id="edit-repo-url"
                value={formData.repo_url}
                onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                placeholder="https://github.com/user/repo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-branch">Branch</Label>
              <Input
                id="edit-branch"
                value={formData.repo_branch}
                onChange={(e) => setFormData({ ...formData, repo_branch: e.target.value })}
                placeholder="main"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-jenkins">Jenkins Job Name</Label>
            <Input
              id="edit-jenkins"
              value={formData.jenkins_job_name}
              onChange={(e) => setFormData({ ...formData, jenkins_job_name: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-service">AWS Service</Label>
              <Input
                id="edit-service"
                value={formData.aws_service}
                onChange={(e) => setFormData({ ...formData, aws_service: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-region">AWS Region</Label>
              <Input
                id="edit-region"
                value={formData.aws_region}
                onChange={(e) => setFormData({ ...formData, aws_region: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-ecr">ECR Repository</Label>
            <Input
              id="edit-ecr"
              value={formData.ecr_repository}
              onChange={(e) => setFormData({ ...formData, ecr_repository: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-cluster">ECS Cluster Name</Label>
              <Input
                id="edit-cluster"
                value={formData.ecs_cluster_name}
                onChange={(e) => setFormData({ ...formData, ecs_cluster_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ecs-service">ECS Service Name</Label>
              <Input
                id="edit-ecs-service"
                value={formData.ecs_service_name}
                onChange={(e) => setFormData({ ...formData, ecs_service_name: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Updating...' : 'Update Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
