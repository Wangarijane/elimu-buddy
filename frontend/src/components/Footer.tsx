import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import elimubuddyLogo from "@/assets/elimubuddy-logo.jpg";

const Footer = () => {
  const footerSections = [
    {
      title: "ElimuBuddy",
      links: [
        { name: "Kuhusu", href: "/about" },
        { name: "Jinsi inavyofanya kazi", href: "/how-it-works" },
        { name: "Bei", href: "#pricing" },
        { name: "Mawasiliano", href: "/contact" }
      ]
    },
    {
      title: "Masomo",
      links: [
        { name: "Elimu ya Awali (PP1-PP2)", href: "/subjects/pre-primary" },
        { name: "Msingi wa Chini (1-3)", href: "/subjects/lower-primary" },
        { name: "Msingi wa Juu (4-6)", href: "/subjects/upper-primary" },
        { name: "Sekondari ya Chini (7-9)", href: "/subjects/junior-secondary" },
        { name: "Sekondari ya Juu (10-12)", href: "/subjects/senior-secondary" }
      ]
    },
    {
      title: "Msaada",
      links: [
        { name: "Kituo cha Msaada", href: "/help" },
        { name: "Maswali Yanayoulizwa Mara kwa Mara", href: "/faq" },
        { name: "Miongozo ya Wazazi", href: "/parent-guide" },
        { name: "Miongozo ya Wataalamu", href: "/expert-guide" }
      ]
    },
    {
      title: "Sheria",
      links: [
        { name: "Sera ya Faragha", href: "/privacy" },
        { name: "Masharti ya Matumizi", href: "/terms" },
        { name: "Sera ya Kurudisha Pesa", href: "/refund-policy" }
      ]
    }
  ];

  return (
    <footer className="bg-accent text-accent-foreground">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Logo and Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center space-x-2 mb-4">
              <img 
                src={elimubuddyLogo} 
                alt="ElimuBuddy Logo" 
                className="h-8 w-8 rounded-md"
              />
              <span className="text-xl font-bold text-white">ElimuBuddy</span>
            </Link>
            <p className="text-accent-foreground/80 mb-6 max-w-sm">
              Rafiki wako wa kujifunza unayeunganisha teknolojia ya AI na wataalamu wa binadamu 
              ili kukusaidia kufanikiwa katika mfumo wa CBC wa Kenya.
            </p>
            
            {/* Contact Info */}
            <div className="space-y-2 text-sm text-accent-foreground/80">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                <span>info@elimubuddy.co.ke</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>+254 700 123 456</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Nairobi, Kenya</span>
              </div>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-white mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <Link 
                      to={link.href} 
                      className="text-accent-foreground/80 hover:text-white transition-colors text-sm"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Social Media and Bottom Bar */}
        <div className="border-t border-accent-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-accent-foreground/60 mb-4 md:mb-0">
              © 2024 ElimuBuddy. Haki zote zimehifadhiwa.
            </div>
            
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="text-accent-foreground/60 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-accent-foreground/60 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="text-accent-foreground/60 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;