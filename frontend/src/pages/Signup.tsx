import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowLeft, CheckCircle } from "lucide-react";
import elimubuddyLogo from "@/assets/elimubuddy-logo.jpg";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [userType, setUserType] = useState("student");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    grade: "",
    school: "",
    agreeToTerms: false,
  });
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();

  const grades = [
    "PP1 (Age 4)",
    "PP2 (Age 5)",
    "Grade 1 (Age 6)",
    "Grade 2 (Age 7)",
    "Grade 3 (Age 8)",
    "Grade 4 (Age 9)",
    "Grade 5 (Age 10)",
    "Grade 6 (Age 11)",
    "Grade 7 (Age 12)",
    "Grade 8 (Age 13)",
    "Grade 9 (Age 14)",
    "Grade 10 (Age 15)",
    "Grade 11 (Age 16)",
    "Grade 12 (Age 17)",
  ];

  const userTypes = [
    { id: "student", name: "Student", description: "I want to learn and get study help", icon: "👨‍🎓" },
    { id: "parent", name: "Parent", description: "I want to support my child’s learning", icon: "👩‍👧‍👦" },
    { id: "expert", name: "Expert/Teacher", description: "I want to help learners and earn", icon: "👩‍🏫" },
  ];

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSuccess(false);

    // Validate Kenyan phone number format
    const kenyanPhoneRegex = /^\+254[17]\d{8}$/;
    if (!kenyanPhoneRegex.test(formData.phone)) {
      setError("Please enter a valid Kenyan phone number (start with +254 followed by 7/1 and 8 digits)");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    if (!formData.agreeToTerms) {
      setError("Please accept the terms of use!");
      return;
    }

    try {
      const userData = {
        email: formData.email,
        password: formData.password,
        phoneNumber: formData.phone,
        role: userType,
        firstName: formData.firstName,
        lastName: formData.lastName,
        studentInfo:
          userType === "student"
            ? {
                grade: formData.grade,
                school: formData.school,
              }
            : undefined,
      };

      console.log("Registering user:", JSON.stringify(userData, null, 2));
      await register(userData);
      setIsSuccess(true);
    } catch (error: any) {
      // Parse server error message if it's JSON
      try {
        const errorObj = JSON.parse(error.message);
        if (errorObj && typeof errorObj === 'object') {
          // Format object errors into a readable string
          const errorMessages = Object.values(errorObj).flat().join(', ');
          setError(errorMessages || "Registration error. Please try again.");
        } else {
          setError(error.message || "Registration error. Please try again.");
        }
      } catch (parseError) {
        // If it's not JSON, use the message as is
        setError(error.message || "Registration error. Please try again.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-6">
          <Link to="/" className="inline-flex items-center text-white hover:text-white/80 transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back Home
          </Link>
        </div>

        <Card className="shadow-kenya">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img src={elimubuddyLogo} alt="ElimuBuddy Logo" className="h-12 w-12 rounded-lg" />
            </div>
            <CardTitle className="text-2xl font-bold">Join ElimuBuddy</CardTitle>
            <CardDescription>Start your learning journey with modern technology</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
                {error.includes('{') ? 'Registration issue. Please check the provided details.' : error}
              </div>
            )}

            {isSuccess && (
              <div className="bg-success/15 text-success p-3 rounded-md text-sm">
                Registration complete! Please log in to your account.
              </div>
            )}

            {/* User Type Selection */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {userTypes.map((type) => (
                <div
                  key={type.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    userType === type.id
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-primary/50"
                  }`}
                  onClick={() => setUserType(type.id)}
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium">{type.name}</div>
                  <div className="text-sm text-muted-foreground">{type.description}</div>
                </div>
              ))}
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="firstName"
                      placeholder="Amina"
                      value={formData.firstName}
                      onChange={(e) => handleInputChange("firstName", e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Mwangi"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="amina@mfano.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+254 7XX XXX XXX"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      className="pl-10"
                      required
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </div>

              {(userType === "student" || userType === "parent") && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="grade">{userType === "student" ? "Grade/Level" : "Child’s Grade"}</Label>
                    <Select 
                      onValueChange={(value) => handleInputChange("grade", value)} 
                      value={formData.grade}
                      disabled={isLoading}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {grades.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="school">{userType === "student" ? "School" : "Child’s School"}</Label>
                    <Input
                      id="school"
                      placeholder="School name"
                      value={formData.school}
                      onChange={(e) => handleInputChange("school", e.target.value)}
                      disabled={isLoading}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Password"
                      value={formData.password}
                      onChange={(e) => handleInputChange("password", e.target.value)}
                      className="pl-10 pr-10"
                      required
                      disabled={isLoading}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repeat password"
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="terms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => handleInputChange("agreeToTerms", checked as boolean)}
                  disabled={isLoading}
                />
                <div className="text-sm leading-relaxed">
                  <Label htmlFor="terms" className="cursor-pointer">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Use
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>{" "}
                    of ElimuBuddy.
                  </Label>
                </div>
              </div>

              <Button type="submit" variant="kenya" className="w-full" disabled={isLoading || !formData.agreeToTerms}>
                {isLoading ? "Registering..." : "Sign Up Now"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Signup;

