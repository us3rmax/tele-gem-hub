import { Menu, Search } from "lucide-react";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
          aria-label="Menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <h1 className="text-lg font-bold tracking-tight">
          <span className="text-primary">TG</span>
          <span className="text-foreground">Index</span>
        </h1>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <div className="relative hidden w-full max-w-xs sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar grupos..."
              className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
            Enviar Grupo
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
