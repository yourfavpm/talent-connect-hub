import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Shield, CheckCircle } from "lucide-react";
import taskiveLogo from "@/assets/taskive-logo.png";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm fixed top-0 w-full z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <img src={taskiveLogo} alt="Taskive" className="h-8" />
          <div className="flex items-center gap-4">
            <Link to="/auth/login?portal=client">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="container mx-auto text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-foreground mb-6 leading-tight">
            Find Top Tier <span className="text-primary">Product & Operations</span> Talent
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Connect with vetted professionals who can help scale your business. Fast, reliable, and hassle-free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth/signup">
              <Button size="xl">
                Start Hiring <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/auth/login?portal=client">
              <Button variant="outline" size="xl">Browse Talents</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 bg-muted/30">
        <div className="container mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Taskive?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Users, title: "Vetted Professionals", desc: "Every talent is thoroughly screened and verified" },
              { icon: Briefcase, title: "Fast Matching", desc: "Get matched with the right talent within 48 hours" },
              { icon: Shield, title: "Secure Contracts", desc: "Streamlined contracts and secure payment processing" },
            ].map((f) => (
              <div key={f.title} className="bg-card rounded-xl border border-border p-8 text-center">
                <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                <p className="text-muted-foreground">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Admin Access */}
      <section className="py-12 px-6 border-t border-border">
        <div className="container mx-auto text-center">
          <Link to="/auth/login?portal=admin" className="text-sm text-muted-foreground hover:text-primary">
            Admin Portal Login →
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Index;
