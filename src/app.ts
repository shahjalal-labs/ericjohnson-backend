import express, { Application, NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import cors from "cors";
import router from "./app/routes";
import GlobalErrorHandler from "./app/middlewares/globalErrorHandler";
import path from "path";
import prisma from "./shared/prisma";
import { bullBoardRouter } from "./bullBoard";
import basicAuth from "express-basic-auth";
import axios from "axios";
import xml2js from "xml2js";
import { redis } from "./helpers/game/game.redis";
import { registerMetrics } from "./helpers/game/metrics";
import { generateZegoToken } from "./helpers/game/zego.controller";

const app: Application = express();

// Middleware setup
(async () => {
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully!");
  } catch (error) {
    console.error("Failed to connect to services:", error);
    process.exit(1);
  }
})();

app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://playspark.smtsigma.com",
      "https://internet-bachelor.smtsigma.com"
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Route handler for root endpoint
app.get("/", (req: Request, res: Response) => {
  res.send({
    Message: "Welcome to api main route",
  });
});

app.get("/ready", async (_, res) => {
  try {
    if (!redis.isOpen) {
      return res.status(503).json({ status: "redis_not_ready" });
    }
    await prisma.$runCommandRaw({ ping: 1 });
    return res.status(200).json({ status: "ready" });
  } catch {
    return res.status(503).json({ status: "db_not_ready" });
  }
});

app.get("/zego-token", generateZegoToken);

// // file upload


app.get("/metrics", async (_, res) => {
  res.setHeader("Content-Type", registerMetrics.contentType);
  res.send(await registerMetrics.metrics());
});

app.get("/api/game", async (req, res) => {
  try {
    const response = await axios.get(
      "https://gamemonetize.com/feed.php?format=json",
      {
        headers: {
          "User-Agent": "MyApp",
        },
      },
    );

    const xml = response.data;

    // Parse XML → JS Object
    const result = await xml2js.parseStringPromise(xml, {
      explicitArray: false,
    });

    // Extract items
    const items = result.rss.channel.item;

    // Normalize to array
    const games = Array.isArray(items) ? items : [items];

    // Extract URLs
    const gameUrls = games.map((game) => ({
      id: game.id,
      title: game.title,
      url: game.url,
      thumb: game.thumb,
    }));

    res.json(gameUrls);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching game feed" });
  }
});

// Router setup
app.use("/api/v1", router);
app.use(
  "/admin/queues",
  basicAuth({
    users: { admin: process.env.BULLBOARD_PASSWORD || "supersecret" },
    challenge: true,
  }),
  bullBoardRouter,
);
app.use(GlobalErrorHandler);
app.use((req: Request, res: Response, next: NextFunction) => {
  res.status(httpStatus.NOT_FOUND).json({
    success: false,
    message: "API NOT FOUND!",
    error: {
      path: req.originalUrl,
      message: "Your requested path is not found!",
    },
  });
});

export default app;
