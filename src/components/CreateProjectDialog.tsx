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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const CreateProjectDialog = ({ onProjectCreated }: { onProjectCreated: () => void }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    repo_url: '',
    repo_branch: 'main',
    jenkins_job_name: '',
    aws_service: 'ecs',
    aws_region: 'ap-south-1',
    ecr_repository: '',
    ecs_cluster_name: '',
    ecs_service_name: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('projects').insert([{
        ...formData,
        user_id: user.id,
      }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Project created successfully',
      });

      setOpen(false);
      setFormData({
        name: '',
        description: '',
        repo_url: '',
        repo_branch: 'main',
        jenkins_job_name: '',
        aws_service: 'ecs',
        aws_region: 'ap-south-1',
        ecr_repository: '',
        ecs_cluster_name: '',
        ecs_service_name: '',
      });
      onProjectCreated();
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-primary shadow-glow hover:opacity-90">
          <Plus className="mr-2 h-5 w-5" />
          New Project
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Configure your project deployment settings
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="my-awesome-app"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="A brief description of your project"
                rows={3}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="repo_url">GitHub Repository URL</Label>
                <Input
                  id="repo_url"
                  value={formData.repo_url}
                  onChange={(e) => setFormData({ ...formData, repo_url: e.target.value })}
                  placeholder="https://github.com/user/repo"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="repo_branch">Branch</Label>
                <Input
                  id="repo_branch"
                  value={formData.repo_branch}
                  onChange={(e) => setFormData({ ...formData, repo_branch: e.target.value })}
                  placeholder="main"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="jenkins_job_name">Jenkins Job Name</Label>
              <Input
                id="jenkins_job_name"
                value={formData.jenkins_job_name}
                onChange={(e) => setFormData({ ...formData, jenkins_job_name: e.target.value })}
                placeholder="autostack-deploy"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="aws_service">AWS Service</Label>
                <Select
                  value={formData.aws_service}
                  onValueChange={(value) => setFormData({ ...formData, aws_service: value })}
                >
                  <SelectTrigger id="aws_service">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ecs">ECS</SelectItem>
                    <SelectItem value="ec2">EC2</SelectItem>
                    <SelectItem value="eks">EKS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="aws_region">AWS Region</Label>
                <Input
                  id="aws_region"
                  value={formData.aws_region}
                  onChange={(e) => setFormData({ ...formData, aws_region: e.target.value })}
                  placeholder="ap-south-1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ecr_repository">ECR Repository</Label>
              <Input
                id="ecr_repository"
                value={formData.ecr_repository}
                onChange={(e) => setFormData({ ...formData, ecr_repository: e.target.value })}
                placeholder="my-app-repo"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="ecs_cluster_name">ECS Cluster Name</Label>
                <Input
                  id="ecs_cluster_name"
                  value={formData.ecs_cluster_name}
                  onChange={(e) => setFormData({ ...formData, ecs_cluster_name: e.target.value })}
                  placeholder="my-cluster"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ecs_service_name">ECS Service Name</Label>
                <Input
                  id="ecs_service_name"
                  value={formData.ecs_service_name}
                  onChange={(e) => setFormData({ ...formData, ecs_service_name: e.target.value })}
                  placeholder="my-service"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.name}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};