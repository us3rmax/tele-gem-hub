import Navbar from "@/components/Navbar";
import SEO from "@/components/SEO";

interface LegalPageProps {
  title: string;
  children: React.ReactNode;
}

const LegalPage = ({ title, children }: LegalPageProps) => {
  return (
    <>
      <SEO title={title} description={title} />
      <Navbar onMenuClick={() => {}} />
      <main className="mx-auto max-w-[800px] px-4 py-12">
        <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
          {children}
        </div>
      </main>
    </>
  );
};

export default LegalPage;
