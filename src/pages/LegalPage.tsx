import { useState } from "react";
import Navbar from "@/components/Navbar";
import MobileSidebar from "@/components/MobileSidebar";
import SEO from "@/components/SEO";

interface LegalPageProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const LegalPage = ({ title, description, children }: LegalPageProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sort, setSort] = useState("recentes");

  return (
    <>
      <SEO title={title} description={description ?? title} />
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        <MobileSidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          onSort={setSort}
          activeSort={sort}
        />
        <main className="flex-1 mx-auto w-full max-w-[800px] px-4 py-12">
          <div className="prose prose-invert max-w-none prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-a:text-primary prose-strong:text-foreground">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default LegalPage;
