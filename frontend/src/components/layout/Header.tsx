import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, Package, ShoppingBag, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { cn } from "@/lib/utils";
import { Brand } from "./Brand";

const navLinks = [
  { to: "/", label: "Início", end: true },
  { to: "/produtos", label: "Móveis", end: false },
  { to: "/#contato", label: "Contato", end: false },
];

function CartLink({ overlay }: { overlay: boolean }) {
  const { itemCount } = useCart();
  return (
    <Button asChild variant="ghost" size="icon" className={cn("relative", overlay && "text-white hover:bg-white/15 hover:text-white")}>
      <Link to="/carrinho" aria-label={itemCount > 0 ? `Carrinho, ${itemCount} ${itemCount === 1 ? "item" : "itens"}` : "Carrinho"}>
        <ShoppingBag className="size-5" />
        {itemCount > 0 && (
          <span className="absolute right-1 top-1 flex min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[0.7rem] font-bold leading-5 text-primary-foreground">
            {itemCount}
          </span>
        )}
      </Link>
    </Button>
  );
}

function UserMenu({ overlay }: { overlay: boolean }) {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return (
      <Button asChild variant="ghost" size="sm" className={cn("hidden md:inline-flex", overlay && "text-white hover:bg-white/15 hover:text-white")}>
        <Link to="/entrar">Entrar</Link>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Minha conta" className={cn("hidden md:inline-flex", overlay && "text-white hover:bg-white/15 hover:text-white")}>
          <UserIcon className="size-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{user.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => navigate("/pedidos")} className="min-h-10">
          <Package /> Meus pedidos
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem onSelect={() => navigate("/admin")} className="min-h-10">
            <LayoutDashboard /> Painel admin
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            logout();
            navigate("/");
          }}
          className="min-h-10"
        >
          <LogOut /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const isHome = pathname === "/";
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Na home o header fica transparente sobre o hero e ganha fundo ao rolar.
  const overlay = isHome && !scrolled;

  return (
    <header
      className={cn(
        "z-40 w-full transition-colors duration-200",
        isHome ? "fixed inset-x-0 top-0" : "sticky top-0",
        overlay ? "bg-transparent text-white" : "border-b border-border bg-background/95 text-foreground backdrop-blur"
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <div className="flex items-center gap-1">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu" className={cn("-ml-2 md:hidden", overlay && "text-white hover:bg-white/15 hover:text-white")}>
                <Menu className="size-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[85vw] max-w-sm bg-background p-0">
              <SheetHeader className="border-b border-border p-5">
                <SheetTitle asChild>
                  <div>
                    <Brand />
                  </div>
                </SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col p-3" aria-label="Menu principal">
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <Link to={link.to} className="flex min-h-12 items-center rounded-md px-3 text-base font-medium hover:bg-accent">
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto flex flex-col gap-1 border-t border-border p-3">
                {user ? (
                  <>
                    <p className="truncate px-3 py-2 text-sm text-muted-foreground">Olá, {user.name}</p>
                    <SheetClose asChild>
                      <Link to="/pedidos" className="flex min-h-12 items-center gap-2 rounded-md px-3 hover:bg-accent">
                        <Package className="size-4" /> Meus pedidos
                      </Link>
                    </SheetClose>
                    {isAdmin && (
                      <SheetClose asChild>
                        <Link to="/admin" className="flex min-h-12 items-center gap-2 rounded-md px-3 hover:bg-accent">
                          <LayoutDashboard className="size-4" /> Painel admin
                        </Link>
                      </SheetClose>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setMenuOpen(false);
                        navigate("/");
                      }}
                      className="flex min-h-12 items-center gap-2 rounded-md px-3 text-left hover:bg-accent"
                    >
                      <LogOut className="size-4" /> Sair
                    </button>
                  </>
                ) : (
                  <div className="grid grid-cols-2 gap-2 p-2">
                    <SheetClose asChild>
                      <Button asChild variant="outline">
                        <Link to="/entrar">Entrar</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button asChild>
                        <Link to="/cadastrar">Cadastrar</Link>
                      </Button>
                    </SheetClose>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
          <Brand light={overlay} />
        </div>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Principal">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                cn(
                  "text-[0.8rem] font-medium uppercase tracking-[0.1em] transition-colors hover:text-primary",
                  isActive && !link.to.includes("#") && "text-primary-hover underline decoration-primary decoration-2 underline-offset-8",
                  overlay && "hover:text-white/80"
                )
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <UserMenu overlay={overlay} />
          <CartLink overlay={overlay} />
        </div>
      </div>
    </header>
  );
}
