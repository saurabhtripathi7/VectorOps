import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRouter from "./routes/chat";
import sessionsRouter from "./routes/sessions";
import messagesRouter from "./routes/messages";
import knowledgeRouter from "./routes/knowledge";
import ingestRouter from "./routes/injest";

const app = express();

const corsOrigins = [process.env.CORS_ORIGIN, process.env.CORS_ORIGIN_ALT]
  .filter(Boolean)
  .flatMap((value) => (value as string).split(","))
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = corsOrigins.length > 0 ? corsOrigins : ["http://localhost:5173"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    const ms = Date.now() - start;
    console.info("[http]", {
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      ms,
    });
  });
  next();
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/chat", chatRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/messages", messagesRouter);
app.use("/api/knowledge", knowledgeRouter);
app.use("/api/injest", ingestRouter);
app.use("/api/ingest", ingestRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`);
});
