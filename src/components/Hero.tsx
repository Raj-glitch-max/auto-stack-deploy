import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Github, Zap } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen overflow-hidden pt-20">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-hero opacity-95" />
        <img 
          src={heroBg} 
          alt="DevOps automation background" 
          className="h-full w-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="container relative z-10 mx-auto px-4 py-32">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm animate-fade-in">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-foreground">Automated CI/CD Pipeline</span>
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight md:text-7xl animate-slide-up">
            Deploy from{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              GitHub to AWS
            </span>
            <br />
            in Seconds
          </h1>

          <p className="mb-10 text-xl text-muted-foreground md:text-2xl animate-slide-up" style={{ animationDelay: "0.1s" }}>
            Enterprise-grade DevOps automation with Jenkins, Docker, and Terraform.
            <br />
            No manual setup. No DevOps expertise required.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <Button size="lg" asChild className="bg-gradient-primary shadow-glow hover:opacity-90 animate-glow-pulse">
              <Link to="/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-border hover:bg-secondary">
              <Link to="/docs">
                <Github className="mr-2 h-5 w-5" />
                View Documentation
              </Link>
            </Button>
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success animate-pulse" />
              <span>Auto-scaling Infrastructure</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              <span>Real-time Monitoring</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>One-click Rollback</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
