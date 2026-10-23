import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface State {
  error: Error | null;
}

// Evita a "tela em branco": qualquer erro de renderização cai nesta mensagem, com opção de recarregar.
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Erro de renderização:", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div role="alert" className="mx-auto flex min-h-svh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-display">Algo deu errado</h1>
        <p className="text-sm text-muted-foreground">Não foi possível exibir esta página. Recarregue; se continuar, avise o suporte.</p>
        <div className="flex gap-3">
          <Button onClick={() => window.location.reload()}>Recarregar</Button>
          <Button variant="outline" onClick={() => window.location.assign("/")}>Ir para o início</Button>
        </div>
      </div>
    );
  }
}
