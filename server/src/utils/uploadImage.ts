import { Readable } from "stream";
import cloudinary from "../config/cloudinary.js";
import { generateSlug } from "./generateSlug.js";
import { ImageUploadError } from "../exceptions/ProductErrors.js";

const FOLDER = "products";

export async function uploadImage(buffer: Buffer, name: string): Promise<string> {
    const baseName = generateSlug(name.split(".")[0] ?? "") || "image";

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: FOLDER,
                resource_type: "image",
                public_id: `${Date.now()}-${Math.round(Math.random() * 1e6)}-${baseName}`,
            },
            (error, uploaded) => {
                if (error || !uploaded) {
                    reject(error ?? new Error("Falha no upload da imagem"));
                } else {
                    resolve(uploaded);
                }
            }
        );

        Readable.from(buffer).pipe(uploadStream);
    });

    return result.secure_url;
}

// Deriva o public_id (pasta/nome, sem versão nem extensão) de uma URL do Cloudinary.
function publicIdFromUrl(url: string): string | null {
    const match = url.match(/\/upload\/(?:[^/]+\/)*?(?:v\d+\/)?([^/]+\/[^/.]+(?:\.[^/]+)?)$/);
    const path = match?.[1];
    if (!path) {
        return null;
    }
    return path.replace(/\.[^/.]+$/, "");
}

export async function deleteImageByUrl(url: string): Promise<void> {
    const publicId = publicIdFromUrl(url);
    if (!publicId) {
        console.error("Não foi possível derivar o public_id da imagem:", url);
        return;
    }

    try {
        await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    } catch (error) {
        console.error("Falha ao apagar imagem no Cloudinary:", url, error);
    }
}

export async function deleteImagesByUrl(urls: string[]): Promise<void> {
    await Promise.all(urls.map((url) => deleteImageByUrl(url)));
}

export interface ImageFile {
    buffer: Buffer;
    name: string;
}

// Envia todas as imagens (mantendo a ordem). Se alguma falhar, apaga as que já subiram e lança erro.
export async function uploadImages(files: ImageFile[]): Promise<string[]> {
    const results = await Promise.allSettled(files.map((file) => uploadImage(file.buffer, file.name)));

    const uploaded = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));

    if (uploaded.length !== files.length) {
        const failed = results.find((result) => result.status === "rejected");
        console.error("Falha no upload de imagem:", failed && "reason" in failed ? failed.reason : failed);
        await deleteImagesByUrl(uploaded);
        throw new ImageUploadError();
    }

    return uploaded;
}
