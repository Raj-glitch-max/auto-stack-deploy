import { Card, CardContent } from "./ui/card";
import { 
  GitBranch, 
  Container, 
  Cloud, 
  Activity, 
  Shield, 
  Zap,
  Database,
  Terminal,
  Lock
} from "lucide-react";

const features = [
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Connect your repository with OAuth. Push to deploy automatically with webhooks.",
    gradient: "from-primary to-purple-600"
  },
  {
    icon: Container,
    title: "Docker Containerization",
    description: "Automatic Docker builds and ECR registry management. Scale effortlessly.",
    gradient: "from-accent to-blue-600"
  },
  {
    icon: Cloud,
    title: "AWS Infrastructure",
    description: "Terraform-provisioned EC2, ECS, or EKS. Choose your deployment target.",
    gradient: "from-success to-green-600"
  },
  {
    icon: Terminal,
    title: "Jenkins CI/CD",
    description: "Automated pipelines triggered on every push. Build, test, and deploy.",
    gradient: "from-warning to-orange-600"
  },
  {
    icon: Activity,
    title: "Real-time Monitoring",
    description: "CloudWatch integration with CPU, memory, and uptime metrics in dashboard.",
    gradient: "from-pink-500 to-rose-600"
  },
  {
    icon: Database,
    title: "Database Provisioning",
    description: "Optional RDS setup with automatic backups and multi-AZ support.",
    gradient: "from-indigo-500 to-purple-600"
  },
  {
    icon: Shield,
    title: "Security First",
    description: "IAM roles, VPC isolation, encrypted secrets, and RLS policies.",
    gradient: "from-cyan-500 to-blue-600"
  },
  {
    icon: Zap,
    title: "Instant Rollbacks",
    description: "One-click rollback to previous deployments. Zero downtime recovery.",
    gradient: "from-yellow-500 to-orange-600"
  },
  {
    icon: Lock,
    title: "Multi-tenancy",
    description: "Isolated infrastructure per project. Enterprise-grade tenant separation.",
    gradient: "from-purple-500 to-pink-600"
  }
];

const Features = () => {
  return (
    <section id="features" className="py-24">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            Everything You Need for{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Modern DevOps
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            From code push to production deployment, we handle the entire DevOps pipeline
            so you can focus on building great products.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group border-border bg-card transition-all hover:border-primary/50 hover:shadow-glow"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6">
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${feature.gradient}`}>
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
