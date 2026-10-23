/**
 * Insere transformações do Cloudinary (formato e qualidade automáticos, largura) logo
 * depois de "/upload/". URLs de outra origem voltam como vieram.
 */
export function optimizeImage(url: string | undefined | null, width: number): string {
  if (!url) return "";
  const marker = "/upload/";
  const index = url.indexOf(marker);
  if (index === -1) return url;
  const cut = index + marker.length;
  return `${url.slice(0, cut)}f_auto,q_auto,w_${width}/${url.slice(cut)}`;
}
