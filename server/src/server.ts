import cors from "cors";
import "dotenv/config";
import express from "express";
import { router } from "./routes.js";
import { errorHandler } from "./middlewares/errorHandler.js";

if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET não definido no .env");
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// A origem do navegador nunca termina em "/": normaliza para o CORS bater mesmo com barra no final do .env.
const frontendOrigin = process.env.FRONTEND_URL?.trim().replace(/\/+$/, "");
if (!frontendOrigin) {
    console.warn("FRONTEND_URL não definido: CORS aberto para qualquer origem.");
}
app.use(cors(frontendOrigin ? { origin: frontendOrigin } : undefined));

app.use(router);

app.use(errorHandler);

const port = process.env.PORT || 3000;

app.get("/", (req, res) => {
    res.send("Hello World");
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta http://localhost:${port}`);
})
