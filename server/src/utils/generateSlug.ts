export function generateSlug(text: string): string {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")   // remove acentos
        .replace(/\s+/g, "-")               // espaços -> hífen
        .replace(/[^a-z0-9-]/g, "")         // remove tudo que não é letra/número/hífen
        .replace(/-+/g, "-")                // colapsa hífens duplicados
        .replace(/^-|-$/g, "");             // remove hífen do início/fim
}
