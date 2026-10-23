import "dotenv/config";
import { hash } from "bcrypt";
import prismaClient from "../src/prisma/index.js";
import { Prisma } from "../src/generated/prisma/client.js";
import { generateSlug } from "../src/utils/generateSlug.js";

const CATEGORIES = ["Estantes", "Mesas", "Cadeiras", "Armários", "Decoração"];

async function seedAdmin() {
    const email = process.env.ADMIN_EMAIL;
    const password = process.env.ADMIN_PASSWORD;

    if (!email || !password) {
        throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD no .env para criar o admin.");
    }

    const passwordHash = await hash(password, 10);

    await prismaClient.user.upsert({
        where: { email },
        update: { passwordHash, role: "ADMIN" },
        create: { name: "Admin", email, passwordHash, role: "ADMIN" },
    });

    console.log(`Admin pronto: ${email}`);
}

async function seedCategories() {
    for (const name of CATEGORIES) {
        await prismaClient.category.upsert({
            where: { name },
            update: {},
            create: { name, slug: generateSlug(name) },
        });
    }

    console.log(`Categorias prontas: ${CATEGORIES.join(", ")}`);
}

// Valores FICTÍCIOS: as faixas e os preços reais virão do Elizio.
async function seedSampleShippingZones() {
    if (process.env.SEED_SAMPLE_DATA !== "true") {
        return;
    }

    if (process.env.NODE_ENV === "production") {
        console.warn("SEED_SAMPLE_DATA ignorado em produção.");
        return;
    }

    const samples = [
        { name: "EXEMPLO - Zona 1 (próxima)", cepStart: "01000000", cepEnd: "01999999", price: "80.00", minDays: 1, maxDays: 3 },
        { name: "EXEMPLO - Zona 2 (distante)", cepStart: "02000000", cepEnd: "02999999", price: "150.00", minDays: 3, maxDays: 7 },
    ];

    for (const sample of samples) {
        const exists = await prismaClient.shippingZone.findFirst({ where: { name: sample.name } });

        if (!exists) {
            await prismaClient.shippingZone.create({
                data: { ...sample, price: new Prisma.Decimal(sample.price) },
            });
        }
    }

    console.log("Zonas de entrega de EXEMPLO criadas (SEED_SAMPLE_DATA=true).");
}

async function main() {
    await seedAdmin();
    await seedCategories();
    await seedSampleShippingZones();
}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    })
    .finally(() => prismaClient.$disconnect());
