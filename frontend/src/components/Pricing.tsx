import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Free",
      price: "0",
      period: "per month",
      description: "For learners getting started",
      features: [
        "5 AI questions per day",
        "All CBC subjects",
        "Bilingual support",
        "Safe learning environment"
      ],
      popular: false,
      buttonText: "Start Free",
      buttonVariant: "outline" as const,
      icon: Star,
      color: "text-muted-foreground",
      bgColor: "bg-card"
    },
    {
      name: "Basic",
      price: "300",
      period: "per month",
      description: "For regular learners",
      features: [
        "50 AI questions per day",
        "Study group access",
        "All CBC subjects",
        "Bilingual support",
        "Faster responses",
        "Progress tracking"
      ],
      popular: true,
      buttonText: "Choose Basic",
      buttonVariant: "kenya" as const,
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/5 border-primary/20"
    },
    {
      name: "Premium",
      price: "500",
      period: "per month",
      description: "For power learners",
      features: [
        "Unlimited AI questions",
        "Priority expert matching",
        "Study groups",
        "Direct chats with experts",
        "Detailed progress reports",
        "Fastest support"
      ],
      popular: false,
      buttonText: "Choose Premium",
      buttonVariant: "secondary" as const,
      icon: Star,
      color: "text-secondary",
      bgColor: "bg-secondary/5 border-secondary/20"
    },
    {
      name: "Family",
      price: "1,500",
      period: "per month",
      description: "For families up to 5 learners",
      features: [
        "5 student accounts",
        "Unlimited AI questions",
        "Priority expert matching",
        "Parent dashboard",
        "Family reports",
        "24/7 parent support",
        "Family agreements"
      ],
      popular: false,
      buttonText: "Choose Family",
      buttonVariant: "education" as const,
      icon: Users,
      color: "text-education",
      bgColor: "bg-education/5 border-education/20"
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Affordable {" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Fair pricing so every learner can access quality education. M-Pesa supported.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative ${plan.bgColor} ${plan.popular ? 'border-primary shadow-kenya scale-105' : 'border hover:shadow-soft'} transition-all duration-300`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-12 h-12 mx-auto rounded-full bg-current/10 flex items-center justify-center mb-4 ${plan.color}`}>
                    <Icon className={`h-6 w-6 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">KSh {plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-foreground/80">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full mt-6" 
                    asChild
                  >
                    <Link to="/signup">{plan.buttonText}</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center bg-card rounded-lg p-8 shadow-soft">
          <h3 className="text-xl font-semibold mb-4">Human Experts</h3>
          <p className="text-muted-foreground mb-4">
            Experts answer questions based on complexity and your budget. 
            Minimum KSh 50 per answer.
          </p>
          <Button variant="outline" asChild>
            <Link to="/experts">Learn More about Experts</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;