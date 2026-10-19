import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * Provedor de tema do Growth OS.
 *
 * Três estados, não dois: claro, escuro e "sistema" — que acompanha a
 * preferência do sistema operacional e é o que a maioria das pessoas espera
 * como padrão de um produto moderno.
 *
 * O padrão aqui é **escuro**, não "sistema": o produto foi desenhado dark-first
 * e é assim que ele deve se apresentar a quem nunca escolheu nada.
 *
 * A classe inicial é aplicada por um script inline no index.html, antes do
 * primeiro paint. Sem ele, o React só adiciona a classe na montagem e o usuário
 * vê um flash branco a cada carregamento — o clássico FOUC.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="keystone-theme"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
