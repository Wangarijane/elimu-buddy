import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Users, Smartphone, Award, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Study Buddy",
      description: "Get fast answers from our CBC-aware AI. Ask anything, anytime.",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Users,
      title: "Human Experts",
      description: "Connect with real teachers and experts for deeper guidance.",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      icon: Smartphone,
      title: "Learn Anywhere",
      description: "Mobile-first experience for learning wherever you are.",
      color: "text-education",
      bgColor: "bg-education/10"
    },
    {
      icon: Award,
      title: "CBC Aligned",
      description: "Content aligned to Kenya’s official CBC from PP1 to Grade 12.",
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      icon: MessageSquare,
      title: "Bilingual Chat",
      description: "Learn in English or Kiswahili – choose your language.",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Track your progress and get insights on what to improve.",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose {" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              ElimuBuddy?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We blend modern AI with human expertise to deliver the best learning experience.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="hover:shadow-soft transition-shadow duration-300 border-0 shadow-soft">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bgColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-foreground/70">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center">
          <Button variant="kenya" size="lg" asChild>
            <Link to="/signup">Start Your Learning Journey</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;