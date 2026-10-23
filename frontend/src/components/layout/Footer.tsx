import { Link } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { InstagramIcon } from "@/components/icons/InstagramIcon";
import logo from "@/assets/logo.jpg";
import { storeConfig } from "@/config/store";
import { hasWhatsapp, whatsappLink } from "@/lib/whatsapp";
import { Brand } from "./Brand";

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div className="space-y-4">
          <Brand />
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Móveis rústicos exclusivos e decoração, produzidos sob encomenda e entregues na sua porta.
          </p>
          {/* A logo em JPG tem fundo bege próprio: fica numa moldura, nunca solta sobre outra cor. */}
          <img
            src={logo}
            alt="Logo Elizio home&móveis"
            width={160}
            height={160}
            loading="lazy"
            className="size-28 rounded-md border border-border object-cover shadow-sm"
          />
        </div>

        <nav aria-label="Rodapé" className="space-y-3 text-sm">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em]">Loja</h2>
          <ul className="space-y-2 text-muted-foreground">
            <li><Link className="inline-block py-1 hover:text-foreground" to="/produtos">Todos os móveis</Link></li>
            <li><Link className="inline-block py-1 hover:text-foreground" to="/carrinho">Carrinho</Link></li>
            <li><Link className="inline-block py-1 hover:text-foreground" to="/pedidos">Meus pedidos</Link></li>
            <li><Link className="inline-block py-1 hover:text-foreground" to="/#contato">Contato</Link></li>
          </ul>
        </nav>

        <div className="space-y-3 text-sm">
          <h2 className="font-sans text-xs font-semibold uppercase tracking-[0.12em]">Fale com a gente</h2>
          <ul className="space-y-2 text-muted-foreground">
            {hasWhatsapp() && (
              <li>
                <a className="inline-flex items-center gap-2 py-1 hover:text-foreground" href={whatsappLink("Olá! Vim pelo site e gostaria de saber mais.")} target="_blank" rel="noreferrer">
                  <MessageCircle className="size-4" /> WhatsApp
                </a>
              </li>
            )}
            <li>
              <a className="inline-flex items-center gap-2 py-1 hover:text-foreground" href={storeConfig.instagramUrl} target="_blank" rel="noreferrer">
                <InstagramIcon className="size-4" /> {storeConfig.instagramHandle}
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border py-5 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} Elizio home&amp;móveis. Todos os direitos reservados.
      </div>
    </footer>
  );
}
