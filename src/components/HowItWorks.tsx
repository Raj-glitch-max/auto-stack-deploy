import { Card, CardContent } from "./ui/card";
import { ArrowRight } from "lucide-react";

const steps = [
  {
    step: "01",
    title: "Connect GitHub",
    description: "Authorize AutoStack to access your repository via OAuth or personal access token.",
  },
  {
    step: "02",
    title: "Configure Pipeline",
    description: "Select your deployment target (EC2/ECS/EKS), add environment variables, and optional RDS.",
  },
  {
    step: "03",
    title: "Push Code",
    description: "Git push triggers webhook → Jenkins builds Docker image → pushes to ECR.",
  },
  {
    step: "04",
    title: "Infrastructure Provisioned",
    description: "Terraform automatically provisions AWS resources with proper networking and security.",
  },
  {
    step: "05",
    title: "Deploy & Monitor",
    description: "Container deployed, health checks run, real-time logs and metrics in your dashboard.",
  },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-gradient-to-b from-background to-secondary/20">
      <div className="container mx-auto px-4">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-4xl font-bold md:text-5xl">
            From Push to{" "}
            <span className="bg-gradient-accent bg-clip-text text-transparent">
              Production
            </span>
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Five simple steps to automate your entire deployment workflow
          </p>
        </div>

        <div className="mx-auto max-w-4xl">
          {steps.map((item, index) => (
            <div key={index} className="relative">
              <Card className="mb-6 border-border bg-card/50 backdrop-blur transition-all hover:border-accent/50 hover:shadow-elevated">
                <CardContent className="flex items-start gap-6 p-6">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gradient-accent text-2xl font-bold text-accent-foreground">
                    {item.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </CardContent>
              </Card>
              {index < steps.length - 1 && (
                <div className="mb-6 flex justify-center">
                  <ArrowRight className="h-8 w-8 text-accent animate-pulse" />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
