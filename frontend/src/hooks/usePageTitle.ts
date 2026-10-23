import { useEffect } from "react";

const SITE = "Elizio home&móveis";

export function usePageTitle(title?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Móveis rústicos sob encomenda`;
  }, [title]);
}
