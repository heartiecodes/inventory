import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Package, BarChart3, ScanLine, Shield, ArrowRight } from "lucide-react";
import { LaptopMockup } from "@/components/LaptopMockup";

export default function Landing() {
  const navigate = useNavigate();

  const features = [
    { icon: Package, title: "Inventory Tracking", desc: "Track every item by generating unique barcodes and real-time status updates." },
    { icon: ScanLine, title: "Barcode Scanning", desc: "Scan items individually or in bulk with a barcode scanner." },
    { icon: BarChart3, title: "Analytics Dashboard", desc: "Visualize inventory data with charts and department breakdowns." },
    { icon: Shield, title: "Simple & Reliable Workflow", desc: "Admin adds items → System generates the barcode(s) → Item is stored in the database → Print out the barcodes." },
  ];

  return (
    <div
      className="min-h-screen bg-center bg-cover"
      style={{ backgroundImage: "url(/bg-gradient.png)" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
            <Package className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Inventory Management System</span>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate("/auth?mode=signup")}>
            Get Started
          </Button>
          <Button variant="outline" onClick={() => navigate("/auth") }>
            Login
          </Button>
        </div>
      </header>

      {/* Hero with laptop mockup */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="flex flex-col items-center gap-8">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground leading-tight mb-0 max-w-3xl">
            <span className="text-primary inline-block mr-2">
              Simplify
            </span>
            Your Inventory Management
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            An intelligent solution that centralizes inventory tracking, reduces errors, and provides real-time insights for smarter decision-making.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-base px-8" onClick={() => navigate("/auth?mode=signup")}>
              Get Started
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>

          <LaptopMockup
            imageSrc="/laptop-screen-dashboard.png"
            alt="Dashboard preview"
            className="w-full max-w-6xl max-h-[720px]"
          />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => (
            <div key={f.title} className="glass rounded-2xl p-6 hover:shadow-lg transition-shadow">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © All rights reserved. 2026. Golden Key Integrated School of St. Joseph
      </footer>
    </div>
  );
}
