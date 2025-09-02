import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type Level = {
  name: string;
  ageRange: string;
  subjects: string[];
  color: string;
  badgeColor: string;
};

const CBCSubjects = () => {
  const fallbackLevels: Level[] = [
    {
      name: "Early Years Education (PP1-PP2)",
      ageRange: "Ages 4-5",
      subjects: [
        "Languages (Kiswahili/English)",
        "Mathematical Activities",
        "Environmental Activities",
        "Religious Education",
        "Creative Arts",
        "Health and Physical Education",
        "Psychosocial Activities"
      ],
      color: "bg-primary/10 border-primary/20",
      badgeColor: "bg-primary"
    },
    {
      name: "Lower Primary (Grades 1-3)",
      ageRange: "Ages 6-8",
      subjects: [
        "English",
        "Kiswahili",
        "Indigenous Language",
        "Mathematics",
        "Environmental Activities",
        "Religious Education",
        "Creative Arts",
        "Health and Physical Education"
      ],
      color: "bg-secondary/10 border-secondary/20",
      badgeColor: "bg-secondary"
    },
    {
      name: "Upper Primary (Grades 4-6)",
      ageRange: "Ages 9-11",
      subjects: [
        "English",
        "Kiswahili",
        "Mathematics",
        "Science and Technology",
        "Agriculture and Nutrition",
        "Social Studies",
        "Religious Education",
        "Creative Arts",
        "Health and Physical Education"
      ],
      color: "bg-education/10 border-education/20",
      badgeColor: "bg-education"
    },
    {
      name: "Junior Secondary (Grades 7-9)",
      ageRange: "Ages 12-14",
      subjects: [
        "English",
        "Kiswahili/Sign Language",
        "Mathematics",
        "Integrated Science",
        "Health Education",
        "Pre-Technical and Pre-Career Education",
        "Social Studies",
        "Religious Education",
        "Business Studies",
        "Agriculture",
        "Life Skills",
        "Sports and Physical Education"
      ],
      color: "bg-success/10 border-success/20",
      badgeColor: "bg-success"
    },
    {
      name: "Senior Secondary (Grades 10-12)",
      ageRange: "Ages 15-17",
      subjects: [
        "STEM Pathways: Physics, Chemistry, Biology, Computer",
        "Social Science Pathways: History, Geography, Business",
        "Arts/Sports Pathways: Music, Sports, Performing Arts"
      ],
      color: "bg-accent/10 border-accent/20",
      badgeColor: "bg-accent"
    }
  ];

  const [levels, setLevels] = useState<Level[]>(fallbackLevels);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        const urlBase = import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL_LOCAL;
        const res = await fetch(`${urlBase}/curriculum/subjects`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load subjects');
        const subjects: Array<{ name: string; level?: string; gradeBand?: string }>
          = data.data?.subjects || data.subjects || [];

        // Group subjects roughly into CBC levels if level/grade metadata exists; otherwise keep fallback
        if (Array.isArray(subjects) && subjects.length > 0) {
          const byBand: Record<string, string[]> = {};
          subjects.forEach((s) => {
            const band = s.level || s.gradeBand || 'General';
            if (!byBand[band]) byBand[band] = [];
            byBand[band].push(s.name);
          });

          const mapped: Level[] = Object.entries(byBand).map(([band, list], idx) => ({
            name: band,
            ageRange: '',
            subjects: list.sort(),
            color: [
              "bg-primary/10 border-primary/20",
              "bg-secondary/10 border-secondary/20",
              "bg-education/10 border-education/20",
              "bg-success/10 border-success/20",
              "bg-accent/10 border-accent/20",
            ][idx % 5],
            badgeColor: ["bg-primary","bg-secondary","bg-education","bg-success","bg-accent"][idx % 5],
          }));

          if (mapped.length > 0) setLevels(mapped);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load subjects');
        // keep fallback
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Kenya {" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              CBC Curriculum
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We support learners across all CBC levels, from Early Years to Senior School.
          </p>
        </div>

        {error && (
          <div className="text-center text-destructive mb-6">{error}</div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {levels.map((level, index) => (
            <Card key={index} className={`${level.color} border transition-all duration-300 hover:shadow-soft hover:scale-105`}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">{level.name}</CardTitle>
                  {level.ageRange && (
                    <Badge className={`${level.badgeColor} text-white`}>
                      {level.ageRange}
                    </Badge>
                  )}
                </div>
                <CardDescription className="flex items-center gap-2 text-foreground/70">
                  <BookOpen className="h-4 w-4" />
                  {level.subjects.length} Subjects
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
                Ask a Question Now
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/experts">Talk to an Expert</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CBCSubjects;