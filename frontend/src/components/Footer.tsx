import { Link } from "react-router-dom";
import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
import elimubuddyLogo from "@/assets/elimubuddy-logo.jpg";

const Footer = () => {
  const footerSections = [
    {
      title: "ElimuBuddy",
      links: [
        { name: "About", href: "/about" },
        { name: "How it works", href: "/how-it-works" },
        { name: "Pricing", href: "#pricing" },
        { name: "Contact", href: "/contact" }
      ]
    },
    {
      title: "Subjects",
      links: [
        { name: "Early Years (PP1-PP2)", href: "/subjects/pre-primary" },
        { name: "Lower Primary (1-3)", href: "/subjects/lower-primary" },
        { name: "Upper Primary (4-6)", href: "/subjects/upper-primary" },
        { name: "Junior Secondary (7-9)", href: "/subjects/junior-secondary" },
        { name: "Senior Secondary (10-12)", href: "/subjects/senior-secondary" }
      ]
    },
    {
      title: "Support",
      links: [
        { name: "Help Center", href: "/help" },
        { name: "Frequently Asked Questions", href: "/faq" },
        { name: "Parent Guides", href: "/parent-guide" },
        { name: "Expert Guides", href: "/expert-guide" }
      ]
    },
    {
      title: "Legal",
      links: [
        { name: "Privacy Policy", href: "/privacy" },
        { name: "Terms of Use", href: "/terms" },
        { name: "Refund Policy", href: "/refund-policy" }
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
              Your learning buddy combining AI technology and human experts 
              to help you succeed in Kenya's CBC system.
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
              © 2024 ElimuBuddy. All rights reserved.
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