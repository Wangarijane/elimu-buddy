import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Users, Smartphone, Award, MessageSquare, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Features = () => {
  const features = [
    {
      icon: Bot,
      title: "AI Study Buddy",
      description: "Pata majibu ya haraka kutoka kwa AI yetu iliyoelezwa mfumo wa CBC. Uliza swali lolote, wakati wowote.",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: Users,
      title: "Wataalamu wa Binadamu",
      description: "Unganishwa na walimu na wataalamu halisi wanaoweza kukusaidia na maswali magumu zaidi.",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    },
    {
      icon: Smartphone,
      title: "Jifunze Popote",
      description: "Jukwaa letu limeundwa kwa simu za mkononi ili uweze kujifunza popote ulipo.",
      color: "text-education",
      bgColor: "bg-education/10"
    },
    {
      icon: Award,
      title: "Mfumo wa CBC",
      description: "Maudhui yote yameundwa kulingana na mfumo rasmi wa CBC wa Kenya kuanzia PP1 hadi Daraja la 12.",
      color: "text-success",
      bgColor: "bg-success/10"
    },
    {
      icon: MessageSquare,
      title: "Mazungumzo ya Lugha Mbili",
      description: "Jifunze kwa Kiingereza au Kiswahili - chagua lugha unayotaka kutumia.",
      color: "text-primary",
      bgColor: "bg-primary/10"
    },
    {
      icon: TrendingUp,
      title: "Ufuatiliaji wa Maendeleo",
      description: "Fuata maendeleo yako na upate ripoti za kina kuhusu maeneo ya kuboresha.",
      color: "text-secondary",
      bgColor: "bg-secondary/10"
    }
  ];

  return (
    <section className="py-20 bg-gradient-card">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kwa Nini Uchague{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              ElimuBuddy?
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Tunachanganya teknolojia ya kisasa na ujuzi wa binadamu ili kukupa uzoefu bora wa kujifunza.
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
            <Link to="/signup">Anza Safari Yako ya Kujifunza</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Features;