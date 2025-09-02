import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Users, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const Pricing = () => {
  const plans = [
    {
      name: "Bure",
      price: "0",
      period: "kwa mwezi",
      description: "Kwa wanafunzi wanaotaka kuanza tu",
      features: [
        "Maswali 5 ya AI kwa siku",
        "Masomo yote ya CBC",
        "Msaada wa lugha mbili",
        "Mazingira salama ya kujifunza"
      ],
      popular: false,
      buttonText: "Anza Bure",
      buttonVariant: "outline" as const,
      icon: Star,
      color: "text-muted-foreground",
      bgColor: "bg-card"
    },
    {
      name: "Msingi",
      price: "300",
      period: "kwa mwezi",
      description: "Kwa wanafunzi wa kawaida",
      features: [
        "Maswali 50 ya AI kwa siku",
        "Upatikanaji wa vikundi vya kusoma",
        "Masomo yote ya CBC",
        "Msaada wa lugha mbili",
        "Majibu ya haraka",
        "Ufuatiliaji wa maendeleo"
      ],
      popular: true,
      buttonText: "Chagua Msingi",
      buttonVariant: "kenya" as const,
      icon: Zap,
      color: "text-primary",
      bgColor: "bg-primary/5 border-primary/20"
    },
    {
      name: "Premium",
      price: "500",
      period: "kwa mwezi",
      description: "Kwa wanafunzi wazuri",
      features: [
        "Maswali yasiyo na kikomo ya AI",
        "Uwekwaji wa kwanza wa wataalamu",
        "Vikundi vya kusoma",
        "Mazungumzo ya moja kwa moja na wataalamu",
        "Ripoti za kina za maendeleo",
        "Msaada wa haraka zaidi"
      ],
      popular: false,
      buttonText: "Chagua Premium",
      buttonVariant: "secondary" as const,
      icon: Star,
      color: "text-secondary",
      bgColor: "bg-secondary/5 border-secondary/20"
    },
    {
      name: "Familia",
      price: "1,500",
      period: "kwa mwezi",
      description: "Kwa familia zenye watoto 5",
      features: [
        "Akaunti 5 za wanafunzi",
        "Maswali yasiyo na kikomo ya AI",
        "Uwekwaji wa kwanza wa wataalamu",
        "Dashboard ya wazazi",
        "Ripoti za familia",
        "Msaada wa mzazi 24/7",
        "Makubaliano ya kifamilia"
      ],
      popular: false,
      buttonText: "Chagua Familia",
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
            Bei{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              Nafuu
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tumechagua bei za ukweli ili kila mwanafunzi apate nafasi ya kujifunza. Malipo kwa njia ya M-Pesa.
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
                    Maarufu Zaidi
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
          <h3 className="text-xl font-semibold mb-4">Wataalamu wa Binadamu</h3>
          <p className="text-muted-foreground mb-4">
            Wataalamu wanajibu maswali kulingana na ugumu na bajeti ya mzazi. 
            Kiwango cha chini ni KSh 50 kwa jibu.
          </p>
          <Button variant="outline" asChild>
            <Link to="/experts">Jifunze Zaidi kuhusu Wataalamu</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Pricing;