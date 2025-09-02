import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BookOpen, 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  Award, 
  Users, 
  BarChart3,
  Calendar,
  Target,
  Star
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Maswali ya Wiki Hii",
      value: "23",
      change: "+12%",
      icon: MessageCircle,
      color: "text-primary"
    },
    {
      title: "Masomo Yaliyokamilika",
      value: "8",
      change: "+2",
      icon: BookOpen,
      color: "text-education"
    },
    {
      title: "Alama za Wastani",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      color: "text-success"
    },
    {
      title: "Muda wa Kujifunza",
      value: "12h",
      change: "+3h",
      icon: Clock,
      color: "text-secondary"
    }
  ];

  const recentActivity = [
    {
      action: "Uliuliza swali kuhusu Hisabati ya Daraja la 5",
      time: "Dakika 2 zilizopita",
      status: "Imejibiwa"
    },
    {
      action: "Umekamilisha Zoezi la Kiswahili",
      time: "Saa 1 iliyopita",
      status: "Imekamilika"
    },
    {
      action: "Umeongea na Mwalimu Mary kuhusu Sayansi",
      time: "Jana",
      status: "Imekamilika"
    },
    {
      action: "Umeanza Somo la Historia ya Kenya",
      time: "Siku 2 zilizopita",
      status: "Inaendelea"
    }
  ];

  const subjects = [
    { name: "Hisabati", progress: 75, grade: "B+", color: "bg-primary" },
    { name: "Kiswahili", progress: 90, grade: "A-", color: "bg-secondary" },
    { name: "Sayansi", progress: 65, grade: "B", color: "bg-education" },
    { name: "Kiingereza", progress: 80, grade: "B+", color: "bg-success" },
    { name: "Masomo ya Kijamii", progress: 70, grade: "B", color: "bg-accent" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Karibu Tena,{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              {user?.firstName}!
            </span>
          </h1>
          <p className="text-muted-foreground">
            Hii ni takwimu ya maendeleo yako ya kujifunza katika mfumo wa CBC.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                    <h3 className="text-2xl font-bold">{stat.value}</h3>
                    <p className="text-xs text-success">{stat.change}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.color} bg-opacity-20`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="activity" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="activity">Shughuli Za Hivi Karibuni</TabsTrigger>
                <TabsTrigger value="subjects">Masomo</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Shughuli Za Hivi Karibuni</CardTitle>
                    <CardDescription>
                      Shughuli zako za hivi karibuni katika mfumo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          <Badge 
                            variant={activity.status === "Inaendelea" ? "secondary" : "default"}
                            className={
                              activity.status === "Imejibiwa" ? "bg-success" : 
                              activity.status === "Imekamilika" ? "bg-primary" : ""
                            }
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="subjects">
                <Card>
                  <CardHeader>
                    <CardTitle>Maendeleo ya Masomo</CardTitle>
                    <CardDescription>
                      Wasifu wako wa masomo yote na maendeleo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subjects.map((subject, index) => (
                        <div key={index}>
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-medium">{subject.name}</span>
                            <span className="text-sm text-muted-foreground">{subject.grade}</span>
                          </div>
                          <Progress value={subject.progress} className="mb-4" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Achievements Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Mafanikio
                </CardTitle>
                <CardDescription>
                  Medali zako za mafanikio ya kujifunza
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary/20 rounded-lg p-4 text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-xs">Mwanafunzi Bora</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="text-xs">Lengo Limetimia</p>
                  </div>
                  <div className="bg-education/20 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-education" />
                    <p className="text-xs">Mwerekano Mzuri</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Matukio Yajayo
                </CardTitle>
                <CardDescription>
                  Ratiba yako ya kujifunza ijayo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="bg-primary text-primary-foreground rounded-lg p-2 text-center min-w-[50px]">
                      <p className="text-sm">Jum</p>
                      <p className="font-bold">15</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mitihani ya Hisabati</p>
                      <p className="text-xs text-muted-foreground">10:00 AM - 11:30 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-2 text-center min-w-[50px]">
                      <p className="text-sm">Jtn</p>
                      <p className="font-bold">16</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Zoezi la Kiswahili</p>
                      <p className="text-xs text-muted-foreground">2:00 PM - 3:00 PM</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;