import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { ExternalLink, LayoutDashboard, LogOut, Menu, Package, Receipt, Tags, Truck } from "lucide-react";
import { Brand } from "@/components/layout/Brand";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { usePageTitle } from "@/hooks/usePageTitle";
import { cn } from "@/lib/utils";

const links = [
  { to: "/admin", label: "Resumo", icon: LayoutDashboard, end: true },
  { to: "/admin/produtos", label: "Produtos", icon: Package, end: false },
  { to: "/admin/pedidos", label: "Pedidos", icon: Receipt, end: false },
  { to: "/admin/frete", label: "Frete", icon: Truck, end: false },
  { to: "/admin/categorias", label: "Categorias", icon: Tags, end: false },
];

function Nav({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Painel admin" className="flex flex-col gap-1">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors hover:bg-accent",
              isActive && "bg-primary/25 text-foreground"
            )
          }
        >
          <link.icon className="size-4" aria-hidden />
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  usePageTitle("Painel admin");
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => window.scrollTo({ top: 0 }), [pathname]);

  const footer = (
    <div className="space-y-1 border-t border-border pt-3">
      <p className="truncate px-3 text-xs text-muted-foreground">{user?.email}</p>
      <Link to="/" className="flex min-h-11 items-center gap-3 rounded-md px-3 text-sm hover:bg-accent">
        <ExternalLink className="size-4" aria-hidden /> Ver loja
      </Link>
      <button
        type="button"
        onClick={() => {
          logout();
          navigate("/");
        }}
        className="flex min-h-11 w-full items-center gap-3 rounded-md px-3 text-left text-sm hover:bg-accent"
      >
        <LogOut className="size-4" aria-hidden /> Sair
      </button>
    </div>
  );

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-svh flex-col justify-between border-r border-border bg-sidebar p-4 lg:flex">
        <div className="space-y-6">
          <Brand to="/admin" />
          <Nav />
        </div>
        {footer}
      </aside>

      <div className="min-w-0">
        {/* Barra superior (mobile) */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-border bg-background/95 px-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu do painel">
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[85vw] max-w-xs flex-col justify-between bg-sidebar p-4">
              <div className="space-y-6">
                <SheetHeader className="p-0">
                  <SheetTitle className="sr-only">Menu do painel</SheetTitle>
                  <Brand to="/admin" />
                </SheetHeader>
                <Nav onNavigate={() => setOpen(false)} />
              </div>
              {footer}
            </SheetContent>
          </Sheet>
          <span className="font-heading text-lg font-bold">Painel admin</span>
        </header>

        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
