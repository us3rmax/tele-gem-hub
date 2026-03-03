import { useState } from "react";
import { Menu, Search, User, LogOut, Shield, Send, FolderOpen, X } from "lucide-react";
import logo from "@/assets/logo.png";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";

interface NavbarProps {
  onMenuClick: () => void;
}

const Navbar = ({ onMenuClick }: NavbarProps) => {
  const { user, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchTerm.trim();
    if (trimmed) {
      navigate(`/?search=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/");
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    navigate("/");
  };

  const handleAuthLink = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate(`/auth/login?returnUrl=${encodeURIComponent(path)}`);
    }
  };

  return (
    <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Menu">

          <Menu className="h-5 w-5" />
        </button>

        <Link to="/" className="flex items-center">
          <img src={logo} alt="Canais18" className="h-18 w-auto" />
        </Link>

        <div className="ml-auto flex flex-1 items-center justify-end gap-2">
          <form onSubmit={handleSearchSubmit} className="relative hidden w-full max-w-xs sm:block">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar grupos..."
              className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-8 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            {searchTerm && (
              <button type="button" onClick={clearSearch} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            )}
          </form>



          <button
            onClick={() => handleAuthLink("/submit")}
            className="hidden items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex">

            <Send className="h-4 w-4" />
            Enviar Grupo
          </button>

          {user ?
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-secondary/80">
                  <User className="h-4 w-4" />
                  <span>Minha Conta</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link to="/my-groups" className="flex items-center gap-2">
                    <FolderOpen className="h-4 w-4" />
                    Meus Grupos
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/submit" className="flex items-center gap-2">
                    <Send className="h-4 w-4" />
                    Enviar Canal
                  </Link>
                </DropdownMenuItem>
                {isAdmin &&
              <DropdownMenuItem asChild>
                    <Link to="/admin" className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Dashboard Admin
                    </Link>
                  </DropdownMenuItem>
              }
                <DropdownMenuItem onClick={signOut} className="flex items-center gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu> :

          <Link
            to="/auth/login"
            className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 whitespace-nowrap">
            Entrar
          </Link>
          }
        </div>
      </div>
    </nav>);

};

export default Navbar;