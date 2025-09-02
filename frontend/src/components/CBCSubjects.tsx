import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CBCSubjects = () => {
  const levels = [
    {
      name: "Elimu ya Awali (PP1-PP2)",
      ageRange: "Miaka 4-5",
      subjects: [
        "Lugha (Kiswahili/Kiingereza)",
        "Shughuli za Kihesabu",
        "Shughuli za Mazingira",
        "Elimu ya Kidini",
        "Sanaa za Ubunifu",
        "Elimu ya Afya na Mwili",
        "Shughuli za Kisaikolojia"
      ],
      color: "bg-primary/10 border-primary/20",
      badgeColor: "bg-primary"
    },
    {
      name: "Elimu ya Msingi ya Chini (Daraja 1-3)",
      ageRange: "Miaka 6-8",
      subjects: [
        "Kiingereza",
        "Kiswahili",
        "Lugha ya Kiasili",
        "Hisabati",
        "Shughuli za Mazingira",
        "Elimu ya Kidini",
        "Sanaa za Ubunifu",
        "Elimu ya Afya na Mwili"
      ],
      color: "bg-secondary/10 border-secondary/20",
      badgeColor: "bg-secondary"
    },
    {
      name: "Elimu ya Msingi ya Juu (Daraja 4-6)",
      ageRange: "Miaka 9-11",
      subjects: [
        "Kiingereza",
        "Kiswahili",
        "Hisabati",
        "Sayansi na Teknolojia",
        "Kilimo na Lishe",
        "Masomo ya Kijamii",
        "Elimu ya Kidini",
        "Sanaa za Ubunifu",
        "Elimu ya Afya na Mwili"
      ],
      color: "bg-education/10 border-education/20",
      badgeColor: "bg-education"
    },
    {
      name: "Elimu ya Sekondari ya Chini (Daraja 7-9)",
      ageRange: "Miaka 12-14",
      subjects: [
        "Kiingereza",
        "Kiswahili/Lugha ya Alama",
        "Hisabati",
        "Sayansi Jumuishi",
        "Elimu ya Afya",
        "Elimu ya Kazi na Teknolojia",
        "Masomo ya Kijamii",
        "Elimu ya Kidini",
        "Masomo ya Biashara",
        "Kilimo",
        "Ujuzi wa Maisha",
        "Michezo na Mazoezi"
      ],
      color: "bg-success/10 border-success/20",
      badgeColor: "bg-success"
    },
    {
      name: "Elimu ya Sekondari ya Juu (Daraja 10-12)",
      ageRange: "Miaka 15-17",
      subjects: [
        "Njia za STEM: Fizikia, Kemia, Biolojia, Kompyuta",
        "Njia za Sayansi za Kijamii: Historia, Jiografia, Biashara",
        "Njia za Sanaa/Michezo: Muziki, Mchezo, Sanaa za Maonyesho"
      ],
      color: "bg-accent/10 border-accent/20",
      badgeColor: "bg-accent"
    }
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mfumo wa{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              CBC Kenya
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Tunasaidia wanafunzi katika viwango vyote vya mfumo wa CBC, kuanzia Elimu ya Awali hadi Elimu ya Sekondari ya Juu.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {levels.map((level, index) => (
            <Card key={index} className={`${level.color} border transition-all duration-300 hover:shadow-soft hover:scale-105`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{level.name}</CardTitle>
                  <Badge className={`${level.badgeColor} text-white`}>
                    {level.ageRange}
                  </Badge>
                </div>
                <CardDescription className="flex items-center gap-2 text-foreground/70">
                  <BookOpen className="h-4 w-4" />
                  {level.subjects.length} Masomo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-2 mb-4">
                  {level.subjects.map((subject, subIndex) => (
                    <div key={subIndex} className="flex items-center gap-2 text-sm text-foreground/80">
                      <div className="w-1.5 h-1.5 bg-current rounded-full" />
                      {subject}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="kenya" size="lg" asChild>
              <Link to="/chat" className="group">
                Uliza Swali Sasa
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/experts">Ongea na Mtaalamu</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CBCSubjects;