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
import { useEffect, useState } from "react";

const Dashboard = () => {
  const { user } = useAuth();

  const [stats, setStats] = useState<Array<{ title: string; value: string; change?: string; icon: any; color: string }>>([
    { title: "Questions Asked", value: "-", change: "", icon: MessageCircle, color: "text-primary" },
    { title: "Answers Provided", value: "-", change: "", icon: BookOpen, color: "text-education" },
    { title: "Subscriptions", value: "-", change: "", icon: TrendingUp, color: "text-success" },
    { title: "Payments", value: "-", change: "", icon: Clock, color: "text-secondary" }
  ]);

  const [recentActivity, setRecentActivity] = useState<Array<{ action: string; time: string; status: string }>>([]);
  const [subjects, setSubjects] = useState<Array<{ name: string; progress: number; grade: string; color: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = localStorage.getItem('token');
        const urlBase = import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL_LOCAL;

        // Stats
        const statsRes = await fetch(`${urlBase}/users/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const statsJson = await statsRes.json();
        if (!statsRes.ok) throw new Error(statsJson.message || 'Failed to load stats');
        const s = statsJson.data?.stats || {};
        setStats([
          { title: 'Questions Asked', value: String(s.questionsAsked ?? 0), icon: MessageCircle, color: 'text-primary' },
          { title: 'Answers Provided', value: String(s.answersProvided ?? 0), icon: BookOpen, color: 'text-education' },
          { title: 'Subscriptions', value: String(s.subscriptions ?? 0), icon: TrendingUp, color: 'text-success' },
          { title: 'Payments', value: String(s.paymentsMade ?? 0), icon: Clock, color: 'text-secondary' },
        ]);

        // Recent questions as activity
        const qRes = await fetch(`${urlBase}/users/questions`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const qJson = await qRes.json();
        const questions = qJson.data?.questions || [];
        const activity = questions.slice(0, 5).map((q: any) => ({
          action: `Asked: ${q.title || q.subject || 'Question'}`,
          time: new Date(q.createdAt).toLocaleString(),
          status: q.status || 'Open'
        }));
        setRecentActivity(activity);

        // Optional: subject progress placeholder until backend provides
        setSubjects([]);
      } catch (e: any) {
        setError(e.message || 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back,{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              {user?.firstName}!
            </span>
          </h1>
          <p className="text-muted-foreground">
            Your learning snapshot across the CBC curriculum.
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
                    {stat.change ? (<p className="text-xs text-success">{stat.change}</p>) : null}
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
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="subjects">Subjects</TabsTrigger>
              </TabsList>
              
              <TabsContent value="activity">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest activity in the system
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {error && <div className="text-destructive mb-2">{error}</div>}
                    {loading ? (
                      <div>Loading...</div>
                    ) : (
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => (
                        <div key={index} className="flex justify-between items-start">
                          <div className="space-y-1">
                            <p className="text-sm font-medium">{activity.action}</p>
                            <p className="text-xs text-muted-foreground">{activity.time}</p>
                          </div>
                          <Badge 
                            variant={activity.status?.toLowerCase() === "in_progress" ? "secondary" : "default"}
                          >
                            {activity.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="subjects">
                <Card>
                  <CardHeader>
                    <CardTitle>Subject Progress</CardTitle>
                    <CardDescription>
                      Your subjects overview and progress
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {subjects.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No subject progress yet.</div>
                    ) : (
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
                    )}
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
                  Achievements
                </CardTitle>
                <CardDescription>
                  Your learning achievements
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-primary/20 rounded-lg p-4 text-center">
                    <Star className="w-8 h-8 mx-auto mb-2 text-primary" />
                    <p className="text-xs">Top Learner</p>
                  </div>
                  <div className="bg-secondary/20 rounded-lg p-4 text-center">
                    <Target className="w-8 h-8 mx-auto mb-2 text-secondary" />
                    <p className="text-xs">Goal Achieved</p>
                  </div>
                  <div className="bg-education/20 rounded-lg p-4 text-center">
                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-education" />
                    <p className="text-xs">Great Progress</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Upcoming Events
                </CardTitle>
                <CardDescription>
                  Your upcoming learning schedule
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="bg-primary text-primary-foreground rounded-lg p-2 text-center min-w-[50px]">
                      <p className="text-sm">Fri</p>
                      <p className="font-bold">15</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Mathematics Exam</p>
                      <p className="text-xs text-muted-foreground">10:00 AM - 11:30 AM</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <div className="bg-secondary text-secondary-foreground rounded-lg p-2 text-center min-w-[50px]">
                      <p className="text-sm">Sat</p>
                      <p className="font-bold">16</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Kiswahili Exercise</p>
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