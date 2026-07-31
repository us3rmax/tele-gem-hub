import { useState } from "react";
import { X, Home, Grid3X3, Search, Shield, Send, FolderOpen, LogOut } from "lucide-react";
import logo from "@/assets/logo.png";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
  onSort: (sort: string) => void;
  activeSort: string;
}

const mainItems = [
  { icon: Home, label: "Página Inicial", path: "/" },
  { icon: Grid3X3, label: "Categorias", path: "/categorias" },
  { icon: Shield, label: "Modelos Privacy", path: "/modelos" },
];

const legalItems = [
  { icon: Shield, label: "Política de Privacidade", path: "/privacy" },
  { icon: Shield, label: "DMCA", path: "/dmca" },
  { icon: Shield, label: "2257", path: "/2257" },
  { icon: Shield, label: "Remoção de Links", path: "/removal" },
];

const SidebarSearch = ({ onClose }: { onClose: () => void }) => {
  const [term, setTerm] = useState("");
  const nav = useNavigate();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = term.trim();
    nav(trimmed ? `/?search=${encodeURIComponent(trimmed)}` : "/");
    onClose();
  };

  return (
    <form onSubmit={submit} className="relative mb-3">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
        placeholder="Buscar grupos..."
        className="h-9 w-full rounded-lg border border-border bg-secondary pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
      />
    </form>
  );
};

const MobileSidebar = ({ open, onClose, onSort, activeSort }: MobileSidebarProps) => {
  const navigate = useNavigate();
  const { user, isAdmin, signOut } = useAuth();

  const authGuard = (path: string) => {
    if (user) {
      navigate(path);
    } else {
      navigate(`/auth/login?returnUrl=${encodeURIComponent(path)}`);
    }
    onClose();
  };

  const handleMenuClick = (path: string) => {
    navigate(path);
    onClose();
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 transition-opacity duration-300 ${open ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-border bg-background transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <img src={logo} alt="Canais18" className="h-12 w-auto" />
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <SidebarSearch onClose={onClose} />

          {mainItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}

          <div className="my-3 border-t border-border" />

          {legalItems.map((item) => (
            <button
              key={item.path}
              onClick={() => handleMenuClick(item.path)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </button>
          ))}

          {/* Auth links (only visible when logged in) */}
          {user && (
            <>
              <div className="my-3 border-t border-border" />
              <button
                onClick={() => handleMenuClick("/my-groups")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                Meus Grupos
              </button>
              <button
                onClick={() => handleMenuClick("/submit")}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Send className="h-4 w-4 shrink-0" />
                Enviar Grupo
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleMenuClick("/admin")}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  <Shield className="h-4 w-4 shrink-0" />
                  Dashboard Admin
                </button>
              )}
              <button
                onClick={() => { signOut(); onClose(); }}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <LogOut className="h-4 w-4 shrink-0" />
                Sair
              </button>
            </>
          )}

          {!user && (
            <div className="mt-3">
              <button
                onClick={() => authGuard("/submit")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Entrar
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

export default MobileSidebar;
