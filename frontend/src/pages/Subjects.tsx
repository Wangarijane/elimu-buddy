import Header from "@/components/Header";
import CBCSubjects from "@/components/CBCSubjects";
import Footer from "@/components/Footer";

const Subjects = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <CBCSubjects />
      </main>
      <Footer />
    </div>
  );
};

export default Subjects;


