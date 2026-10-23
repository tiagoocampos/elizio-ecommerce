import prismaClient from "../../prisma/index.js";
import { serializeDecimals } from "../../utils/serializeDecimals.js";

class ListShippingZonesService {
    async execute() {
        const zones = await prismaClient.shippingZone.findMany({
            orderBy: [{ active: "desc" }, { cepStart: "asc" }],
        });

        return serializeDecimals(zones);
    }
}

export { ListShippingZonesService };
