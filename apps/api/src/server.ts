import "dotenv/config";

import cors from "cors";
import express from "express";
import helmet from "helmet";
import pino from "pino";

import { router } from "./routes";

const port = Number(process.env.PORT ?? 4000);
const logger = pino({ name: "goal-app-api" });

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN ?? "*" }));
app.use(express.json());
app.use("/api", router);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, "Unhandled error");
  res.status(500).json({ error: "Internal Server Error" });
});

app.listen(port, () => {
  logger.info({ port }, "Server listening");
});
