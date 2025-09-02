import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Search, Users, Clock, Award, MessageCircle, Filter } from "lucide-react";
import Header from "@/components/Header";

const Experts = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  const experts = [
    {
      id: 1,
      name: "Dkt. Mary Wanjiku",
      title: "Mtaalamu wa Hisabati",
      subjects: ["Hisabati", "Sayansi"],
      levels: ["Daraja 4-6", "Daraja 7-9"],
      rating: 4.9,
      reviews: 127,
      responseTime: "2 masaa",
      experience: "8 miaka",
      languages: ["Kiswahili", "Kiingereza"],
      price: "KSh 150-300",
      avatar: "👩‍🏫",
      online: true,
      verified: true
    },
    {
      id: 2,
      name: "Mwalimu John Mwangi",
      title: "Mtaalamu wa Kiswahili",
      subjects: ["Kiswahili", "Masomo ya Kijamii"],
      levels: ["Daraja 1-3", "Daraja 4-6"],
      rating: 4.8,
      reviews: 98,
      responseTime: "1 saa",
      experience: "12 miaka",
      languages: ["Kiswahili"],
      price: "KSh 100-250",
      avatar: "👨‍🏫",
      online: false,
      verified: true
    },
    {
      id: 3,
      name: "Dr. Sarah Adhiambo",
      title: "Mtaalamu wa Sayansi",
      subjects: ["Sayansi", "Kemistri", "Fizikia"],
      levels: ["Daraja 7-9", "Daraja 10-12"],
      rating: 5.0,
      reviews: 89,
      responseTime: "30 dakika",
      experience: "6 miaka",
      languages: ["Kiingereza", "Kiswahili"],
      price: "KSh 200-400",
      avatar: "👩‍🔬",
      online: true,
      verified: true
    },
    {
      id: 4,
      name: "Mwalimu Grace Kemunto",
      title: "Mtaalamu wa Lugha za Kigeni",
      subjects: ["Kiingereza", "Sanaa za Ubunifu"],
      levels: ["PP1-PP2", "Daraja 1-3"],
      rating: 4.7,
      reviews: 156,
      responseTime: "45 dakika",
      experience: "10 miaka",
      languages: ["Kiingereza", "Kiswahili"],
      price: "KSh 120-280",
      avatar: "👩‍🎨",
      online: true,
      verified: true
    },
    {
      id: 5,
      name: "Prof. David Kiprotich",
      title: "Mtaalamu wa Historia",
      subjects: ["Historia", "Jiografia", "Masomo ya Kijamii"],
      levels: ["Daraja 7-9", "Daraja 10-12"],
      rating: 4.9,
      reviews: 203,
      responseTime: "1.5 masaa",
      experience: "15 miaka",
      languages: ["Kiswahili", "Kiingereza"],
      price: "KSh 180-350",
      avatar: "👨‍💼",
      online: false,
      verified: true
    },
    {
      id: 6,
      name: "Bi. Fatuma Hassan",
      title: "Mtaalamu wa Elimu ya Awali",
      subjects: ["Shughuli za Mazingira", "Shughuli za Kihesabu"],
      levels: ["PP1-PP2"],
      rating: 4.8,
      reviews: 92,
      responseTime: "20 dakika",
      experience: "7 miaka",
      languages: ["Kiswahili", "Kiarabu"],
      price: "KSh 100-200",
      avatar: "👩‍🏫",
      online: true,
      verified: true
    }
  ];

  const subjects = ["Hisabati", "Kiswahili", "Kiingereza", "Sayansi", "Historia", "Jiografia", "Sanaa za Ubunifu"];
  const levels = ["PP1-PP2", "Daraja 1-3", "Daraja 4-6", "Daraja 7-9", "Daraja 10-12"];

  const filteredExperts = experts.filter(expert => {
    const matchesSearch = expert.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expert.subjects.some(subject => subject.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = !selectedSubject || expert.subjects.includes(selectedSubject);
    const matchesLevel = !selectedLevel || expert.levels.includes(selectedLevel);

    return matchesSearch && matchesSubject && matchesLevel;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-4">
            Wataalamu wa{" "}
            <span className="bg-gradient-kenya bg-clip-text text-transparent">
              CBC
            </span>
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unganishwa na walimu na wataalamu halisi wanaoweza kukusaidia na maswali yako magumu. 
            Chagua mtaalamu unayetaka kuongea naye.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Tafuta Mtaalamu
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tafuta kwa jina au somo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select onValueChange={setSelectedSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Chagua Somo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Masomo Yote</SelectItem>
                  {subjects.map(subject => (
                    <SelectItem key={subject} value={subject}>{subject}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select onValueChange={setSelectedLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Chagua Kiwango" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Viwango Vyote</SelectItem>
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
                  <div className="text-sm text-muted-foreground">Wataalamu</div>
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
                  <div className="text-sm text-muted-foreground">Wastani wa Majibu</div>
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
                  <div className="text-sm text-muted-foreground">Kiwango cha Juu</div>
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
                  <div className="text-sm text-muted-foreground">Maswali Yamejibiwa</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredExperts.map((expert) => (
            <Card key={expert.id} className="hover:shadow-soft transition-shadow duration-300">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{expert.avatar}</div>
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
                  <div className="text-sm font-medium mb-2">Masomo:</div>
                  <div className="flex flex-wrap gap-1">
                    {expert.subjects.map((subject, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {subject}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Levels */}
                <div>
                  <div className="text-sm font-medium mb-2">Viwango:</div>
                  <div className="flex flex-wrap gap-1">
                    {expert.levels.map((level, index) => (
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
                  <div>Uzoefu: {expert.experience}</div>
                  <div>Lugha: {expert.languages.join(', ')}</div>
                  <div className="font-medium text-foreground">{expert.price}</div>
                </div>

                {/* Action Button */}
                <Button variant="kenya" className="w-full">
                  Ongea na {expert.name.split(' ')[0]}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredExperts.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold mb-2">Hakuna Matokeo</h3>
            <p className="text-muted-foreground">
              Hakuna wataalamu wanaofaa vigezo vyako vya utafutaji. Jaribu kubadilisha vigezo vyako.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Experts;