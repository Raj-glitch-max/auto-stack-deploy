import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Terminal, Book, Zap, Shield } from "lucide-react";

const docs = [
  {
    icon: Book,
    title: "Getting Started",
    description: "Learn how to connect your first GitHub repository and deploy to AWS.",
    gradient: "from-primary to-purple-600",
  },
  {
    icon: Zap,
    title: "CI/CD Pipelines",
    description: "Configure Jenkins pipelines, triggers, and deployment strategies.",
    gradient: "from-accent to-blue-600",
  },
  {
    icon: Terminal,
    title: "Infrastructure as Code",
    description: "Understand Terraform modules, state management, and resource provisioning.",
    gradient: "from-success to-green-600",
  },
  {
    icon: Shield,
    title: "Security & Best Practices",
    description: "Learn about IAM roles, secrets management, and production deployment.",
    gradient: "from-warning to-orange-600",
  },
];

const Docs = () => {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-gradient-primary">
              <Terminal className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="bg-gradient-primary bg-clip-text text-transparent">AutoStack</span>
          </Link>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-5xl font-bold">Documentation</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Everything you need to know about deploying with AutoStack
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {docs.map((doc, index) => (
            <Card
              key={index}
              className="group border-border transition-all hover:border-primary/50 hover:shadow-elevated cursor-pointer"
            >
              <CardHeader>
                <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br ${doc.gradient}`}>
                  <doc.icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle>{doc.title}</CardTitle>
                <CardDescription>{doc.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary hover:underline">Read more →</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="mt-12 border-primary/20 bg-gradient-to-br from-primary/10 to-transparent">
          <CardHeader>
            <CardTitle>Quick Start Guide</CardTitle>
            <CardDescription>Deploy your first application in 5 minutes</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  1
                </span>
                <div>
                  <p className="font-semibold">Connect GitHub Repository</p>
                  <p className="text-sm text-muted-foreground">
                    Authorize AutoStack to access your repository via OAuth
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  2
                </span>
                <div>
                  <p className="font-semibold">Configure Deployment</p>
                  <p className="text-sm text-muted-foreground">
                    Select EC2, ECS, or EKS and add environment variables
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                  3
                </span>
                <div>
                  <p className="font-semibold">Push Your Code</p>
                  <p className="text-sm text-muted-foreground">
                    Git push triggers automated pipeline and infrastructure provisioning
                  </p>
                </div>
              </li>
            </ol>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Docs;
