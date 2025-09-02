import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Users, Clock, Award, MessageCircle, Filter } from "lucide-react";
import Header from "@/components/Header";

const Experts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');

  const [experts, setExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        setLoading(true);
        setError(null);
        const urlBase = import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL_LOCAL;
        const params = new URLSearchParams();
        if (selectedSubject !== 'ALL') params.append('subject', selectedSubject);
        if (selectedLevel !== 'ALL') params.append('grade', selectedLevel);
        const res = await fetch(`${urlBase}/experts/browse?${params.toString()}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Failed to load experts');
        setExperts((data.data?.experts || []).map((e: any) => ({
          id: e._id,
          name: `${e.profile?.firstName || ''} ${e.profile?.lastName || ''}`.trim(),
          title: e.profile?.expertise?.title || 'Subject Expert',
          subjects: e.profile?.expertise?.subjects || [],
          levels: e.profile?.expertise?.grades || [],
          rating: e.profile?.expertise?.rating || 0,
          reviews: e.profile?.expertise?.totalRatings || 0,
          responseTime: e.profile?.expertise?.averageResponseTime ? `${e.profile.expertise.averageResponseTime} min` : '—',
          experience: e.profile?.expertise?.experience || '',
          languages: e.profile?.languages || [],
          price: e.profile?.expertise?.priceRange || '',
          avatar: e.profile?.avatar || '👩‍🏫',
          online: e.profile?.expertise?.online || false,
          verified: true
        })));
      } catch (err: any) {
        setError(err.message || 'Failed to load experts');
      } finally {
        setLoading(false);
      }
    };
    fetchExperts();
  }, [selectedSubject, selectedLevel]);

  const subjects = ["Mathematics", "Kiswahili", "English", "Science", "History", "Geography", "Creative Arts"];
  const levels = ["PP1-PP2", "Grade 1-3", "Grade 4-6", "Grade 7-9", "Grade 10-12"];

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.subjects.some((subject: string) => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'ALL' || expert.subjects.includes(selectedSubject);
    const matchesLevel = selectedLevel === 'ALL' || expert.levels.includes(selectedLevel);

    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Experts in{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              CBC
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Connect with real teachers and experts who can help you with tough questions. 
            Choose an expert to chat with.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Find an Expert
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or subject..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Subjects</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedLevel} onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Levels</SelectItem>
                  {levels.map(level => (
                    <SelectItem key={level} value={level}>{level}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Users className="h-8 w-8 text-primary" />
                <div>
                  <div className="text-2xl font-bold">{experts.length}</div>
                  <div className="text-sm text-muted-foreground">Experts</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Clock className="h-8 w-8 text-education" />
                <div>
                  <div className="text-2xl font-bold">45min</div>
                  <div className="text-sm text-muted-foreground">Avg Response</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-success" />
                <div>
                  <div className="text-2xl font-bold">4.8</div>
                  <div className="text-sm text-muted-foreground">Top Rating</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <MessageCircle className="h-8 w-8 text-secondary" />
                <div>
                  <div className="text-2xl font-bold">1,247</div>
                  <div className="text-sm text-muted-foreground">Questions Answered</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experts Grid */}
        {error && (
          <div className="text-center text-destructive mb-4">{error}</div>
        )}
        {loading ? (
          <div className="text-center py-12">Loading experts...</div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert: any) => (
            <Card key={expert.id} className="hover:shadow-soft transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{expert.avatar || '👩‍🏫'}</div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {expert.name}
                        {expert.verified && (
                          <Award className="h-4 w-4 text-success" />
                        )}
                      </CardTitle>
                      <CardDescription>{expert.title}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={expert.online ? "success" : "secondary"}>
                    {expert.online ? "Online" : "Offline"}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Subjects */}
                <div>
                  <div className="text-sm font-medium mb-2">Subjects:</div>
                  <div className="flex flex-wrap gap-1">
                    {expert.subjects.map((subject: string, index: number) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <div className="text-sm font-medium mb-2">Levels:</div>
                  <div className="flex flex-wrap gap-1">
                    {expert.levels.map((level: string, index: number) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {level}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Rating and Stats */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-education fill-current" />
                    <span className="font-medium">{expert.rating}</span>
                    <span className="text-muted-foreground">({expert.reviews})</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{expert.responseTime}</span>
                  </div>
                </div>

                {/* Languages and Experience */}
                <div className="text-sm text-muted-foreground">
                  <div>Experience: {expert.experience}</div>
                  <div>Languages: {expert.languages.join(', ')}</div>
                  <div className="font-medium text-foreground">{expert.price}</div>
                </div>

                {/* Action Button */}
                <Button variant="kenya" className="w-full">
                  Chat with {expert.name.split(' ')[0]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        )}

        {filteredExperts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">No Results</h3>
            <p className="text-muted-foreground">
              No experts match your filters. Try adjusting your criteria.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Experts;