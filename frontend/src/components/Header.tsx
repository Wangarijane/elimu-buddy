import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, BookOpen, MessageCircle, Users, BarChart3, Languages } from "lucide-react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import elimubuddyLogo from "@/assets/elimubuddy-logo.jpg";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  // Move navigation inside render so it updates when language changes
  const navigation = [
    { name: t('subjects'), href: "/subjects", icon: BookOpen },
    { name: t('aiChat'), href: "/chat", icon: MessageCircle },
    { name: t('experts'), href: "/experts", icon: Users },
    { name: t('dashboard'), href: "/dashboard", icon: BarChart3 },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img 
              src={elimubuddyLogo} 
              alt="ElimuBuddy Logo" 
              className="h-8 w-8 rounded-md"
            />
            <span className="text-xl font-bold bg-gradient-kenya bg-clip-text text-transparent">
              ElimuBuddy
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className="flex items-center space-x-1 text-foreground/80 hover:text-primary transition-colors"
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Language Switcher & Auth Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center space-x-1">
                  <Languages className="h-4 w-4" />
                  <span>{language === 'en' ? 'EN' : 'SW'}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => {
                    setLanguage('en');
                    setIsMenuOpen(false);
                  }}
                  className={language === 'en' ? 'bg-accent' : ''}
                >
                  {t('english')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => {
                    setLanguage('sw');
                    setIsMenuOpen(false);
                  }}
                  className={language === 'sw' ? 'bg-accent' : ''}
                >
                  {t('kiswahili')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="ghost" asChild>
              <Link to="/login">{t('login')}</Link>
            </Button>
            <Button variant="kenya" asChild>
              <Link to="/signup">{t('signup')}</Link>
            </Button>
          </div>

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col space-y-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className="flex items-center space-x-2 text-foreground/80 hover:text-primary transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              <div className="pt-4 border-t space-y-2">
                <div className="px-4 py-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="w-full justify-start">
                        <Languages className="h-4 w-4 mr-2" />
                        {t('language')} ({language === 'en' ? 'EN' : 'SW'})
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          setLanguage('en');
                          setIsMenuOpen(false);
                        }}
                        className={language === 'en' ? 'bg-accent' : ''}
                      >
                        {t('english')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          setLanguage('sw');
                          setIsMenuOpen(false);
                        }}
                        className={language === 'sw' ? 'bg-accent' : ''}
                      >
                        {t('kiswahili')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                <Button variant="ghost" className="w-full justify-start" asChild>
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button variant="kenya" className="w-full" asChild>
                  <Link to="/signup">{t('signup')}</Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;