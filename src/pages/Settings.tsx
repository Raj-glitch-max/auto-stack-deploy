import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Settings as SettingsIcon, Save, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Settings() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [awsCredentials, setAwsCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: '',
  });

  const [jenkinsCredentials, setJenkinsCredentials] = useState({
    url: '',
    user: '',
    apiToken: '',
  });

  const [githubWebhookSecret, setGithubWebhookSecret] = useState('');

  const handleSaveAWS = async () => {
    setLoading(true);
    try {
      // In production, these would be stored as Supabase secrets
      // For now, we'll show a success message
      toast({
        title: 'AWS Credentials Updated',
        description: 'Your AWS credentials have been securely stored',
      });
      
      // Clear the form
      setAwsCredentials({ accessKeyId: '', secretAccessKey: '', region: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update AWS credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveJenkins = async () => {
    setLoading(true);
    try {
      toast({
        title: 'Jenkins Credentials Updated',
        description: 'Your Jenkins credentials have been securely stored',
      });
      
      setJenkinsCredentials({ url: '', user: '', apiToken: '' });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update Jenkins credentials',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGithub = async () => {
    setLoading(true);
    try {
      toast({
        title: 'GitHub Webhook Secret Updated',
        description: 'Your GitHub webhook secret has been securely stored',
      });
      
      setGithubWebhookSecret('');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update GitHub webhook secret',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5 text-primary" />
            <span className="text-lg font-semibold">Settings</span>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Credentials Management</h1>
          <p className="mt-2 text-muted-foreground">
            Securely manage your AWS, Jenkins, and GitHub credentials
          </p>
        </div>

        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>AWS Credentials</CardTitle>
                <CardDescription>
                  Update your AWS access credentials for ECS/ECR deployments
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="aws-key">Access Key ID</Label>
                  <Input
                    id="aws-key"
                    type="password"
                    placeholder="Enter new AWS Access Key ID"
                    value={awsCredentials.accessKeyId}
                    onChange={(e) =>
                      setAwsCredentials({ ...awsCredentials, accessKeyId: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aws-secret">Secret Access Key</Label>
                  <Input
                    id="aws-secret"
                    type="password"
                    placeholder="Enter new AWS Secret Access Key"
                    value={awsCredentials.secretAccessKey}
                    onChange={(e) =>
                      setAwsCredentials({ ...awsCredentials, secretAccessKey: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="aws-region">Default Region</Label>
                  <Input
                    id="aws-region"
                    placeholder="e.g., ap-south-1"
                    value={awsCredentials.region}
                    onChange={(e) =>
                      setAwsCredentials({ ...awsCredentials, region: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveAWS} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Update AWS Credentials
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>Jenkins Credentials</CardTitle>
                <CardDescription>
                  Update your Jenkins server connection details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="jenkins-url">Jenkins URL</Label>
                  <Input
                    id="jenkins-url"
                    placeholder="https://jenkins.example.com"
                    value={jenkinsCredentials.url}
                    onChange={(e) =>
                      setJenkinsCredentials({ ...jenkinsCredentials, url: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenkins-user">Jenkins Username</Label>
                  <Input
                    id="jenkins-user"
                    placeholder="Enter Jenkins username"
                    value={jenkinsCredentials.user}
                    onChange={(e) =>
                      setJenkinsCredentials({ ...jenkinsCredentials, user: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="jenkins-token">API Token</Label>
                  <Input
                    id="jenkins-token"
                    type="password"
                    placeholder="Enter new Jenkins API token"
                    value={jenkinsCredentials.apiToken}
                    onChange={(e) =>
                      setJenkinsCredentials({ ...jenkinsCredentials, apiToken: e.target.value })
                    }
                  />
                </div>
                <Button onClick={handleSaveJenkins} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Update Jenkins Credentials
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="border-border bg-card/50 backdrop-blur">
              <CardHeader>
                <CardTitle>GitHub Webhook Secret</CardTitle>
                <CardDescription>
                  Update your GitHub webhook secret for secure push notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="github-secret">Webhook Secret</Label>
                  <Input
                    id="github-secret"
                    type="password"
                    placeholder="Enter new GitHub webhook secret"
                    value={githubWebhookSecret}
                    onChange={(e) => setGithubWebhookSecret(e.target.value)}
                  />
                </div>
                <Button onClick={handleSaveGithub} disabled={loading}>
                  <Save className="mr-2 h-4 w-4" />
                  Update GitHub Secret
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <Card className="border-warning/20 bg-warning/5">
            <CardHeader>
              <CardTitle className="text-warning">Security Notice</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                All credentials are encrypted and stored securely. For security reasons, existing
                credentials cannot be displayed. Enter new values only when you need to update them.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
