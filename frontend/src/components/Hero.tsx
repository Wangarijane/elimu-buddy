import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Brain, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-learning.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/90 via-accent/70 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Rafiki Wako wa Kujifunza{" "}
            <span className="bg-gradient-education bg-clip-text text-transparent">
              CBC
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl mb-8 text-white/90 max-w-3xl mx-auto">
            ElimuBuddy ni msaidizi wako wa kujifunza unayeunganisha teknolojia ya AI na wataalamu wa binadamu 
            ili kukusaidia kufanikiwa katika mfumo wa CBC wa Kenya.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button variant="hero" asChild>
              <Link to="/chat" className="group">
                Anza Kujifunza Sasa
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white hover:text-accent" asChild>
              <Link to="/subjects">Angalia Masomo</Link>
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <BookOpen className="h-8 w-8 text-education" />
              </div>
              <div className="text-2xl font-bold">13</div>
              <div className="text-sm text-white/80">Miaka ya Elimu</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Brain className="h-8 w-8 text-education" />
              </div>
              <div className="text-2xl font-bold">50+</div>
              <div className="text-sm text-white/80">Masomo</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Users className="h-8 w-8 text-education" />
              </div>
              <div className="text-2xl font-bold">200+</div>
              <div className="text-sm text-white/80">Wataalamu</div>
            </div>
            <div className="text-center">
              <div className="flex justify-center mb-2">
                <Zap className="h-8 w-8 text-education" />
              </div>
              <div className="text-2xl font-bold">24/7</div>
              <div className="text-sm text-white/80">Msaada</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};

export default Hero;