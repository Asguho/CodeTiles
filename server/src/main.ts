import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import { retry } from "jsr:@std/async";

import { login, signup, validateSessionToken } from "./auth.ts";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";
import { getCookies } from "jsr:@std/http/cookie";
import { GameHandler } from "./GameHandler.ts";
import { desc, eq, ne } from "drizzle-orm/expressions";
import { socketHandler } from "./SocketHandler.ts";
import { getCloudCode } from "./isolates/isolate.ts";
import { sql } from "drizzle-orm";

const deploymentClient = new DeploymentClient();
const gameHandler = new GameHandler();

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, auth-session",
  "Access-Control-Allow-Credentials": "true",
};

const routes: Route[] = [
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/ws" }),
    handler: async (req) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }

      if (req.headers.get("upgrade") != "websocket") {
        return new Response(null, { status: 501 });
      }
      const { socket, response } = Deno.upgradeWebSocket(req);
      socket.onopen = () => {
        socketHandler.addSocket(user.id, socket);
      };
      return response;
    },
  },
  {
    method: "OPTIONS",
    pattern: new URLPattern({ pathname: "/*" }),
    handler: () => {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    },
  },
  {
    method: "GET",
    pattern: new URLPattern({ pathname: "/api/stats" }),
    handler: async (req: Request) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }

      // Get user stats
      const userStats = await db.select().from(table.user).where(eq(table.user.id, user.id)).limit(1);

      const leaderboard = await db
        .select({
          id: table.user.id,
          username: table.user.username,
          elo: table.user.elo,
        })
        .from(table.user)
        .orderBy(desc(table.user.elo))
        .limit(11);

      // Find user's rank
      const [userRank] = await db
        .select({ count: sql<number>`count(*)` })
        .from(table.user)
        .where(sql`${table.user.elo} > ${user.elo}`);

      const rank = Number(userRank.count) + 1;

      return Response.json({
        user: userStats[0],
        rank,
        leaderboard,
      }, { headers: corsHeaders });
    },
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/start_game" }),
    handler: async (req: Request) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }

      const [latestDeployment] = await db
        .select()
        .from(table.deployment)
        .where(eq(table.deployment.userId, user.id))
        .orderBy(desc(table.deployment.createdAt))
        .limit(1);

      try {
        const startTime = Date.now();
        await retry(async () => {
          console.log("Fetching deployment:", latestDeployment.url, Date.now() - startTime);
          const response = await fetch(latestDeployment.url);
          const text = await response.text();
          const isNotFound = text === "404: Not Found (DEPLOYMENT_NOT_FOUND)\n\nThe requested deployment does not exist.";

          if (isNotFound) {
            throw new Error("Deployment not ready yet");
          }

          return true;
        }, {
          multiplier: 2,
          maxAttempts: 10,
          minTimeout: 1000,
        });
      } catch (error) {
        console.log("Error fetching deployment:", error);
        return Response.json(
          { message: "Deployment not ready yet" },
          {
            headers: corsHeaders,
            status: 503,
          },
        );
      }

      // Check if this is a tutorial game
      const url = new URL(req.url);
      const isTutorial = url.searchParams.get("tutorial") === "true";

      if (isTutorial) {
        // For tutorial, start a game against a bot
        //   gameHandler.startGame([{ id: user.id, url: latestDeployment.url }, { id: "bot", url: "https://tutorial-bot.deno.dev" }]);
        GameHandler.runTutorial({ id: user.id, url: latestDeployment.url });
        return Response.json(
          { message: "Tutorial game started" },
          { headers: corsHeaders },
        );
      }

      // Find enemy player with closest ELO and their latest deployment in one query
      const [{ enemyPlayer, latestEnemyDeployment }] = await db
        .select({
          enemyPlayer: table.user,
          latestEnemyDeployment: table.deployment,
        })
        .from(table.user)
        .where(ne(table.user.id, user.id))
        .innerJoin(
          table.deployment,
          eq(table.deployment.userId, table.user.id),
        )
        .orderBy(
          sql`ABS(${table.user.elo} - ${user.elo})`,
          desc(table.deployment.createdAt),
        )
        .limit(1);

      // console.log("Enemy player:", enemyPlayer, latestEnemyDeployment);

      gameHandler.startGame([{ id: user.id, url: latestDeployment.url }, { id: enemyPlayer.id, url: latestEnemyDeployment.url }]);

      return Response.json(
        { message: "Game started" },
        {
          headers: corsHeaders,
        },
      );
    },
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/upload_code" }),
    handler: async (req: Request) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }

      const code = await req.text();
      console.log(code);
      const deployment = await deploymentClient.createDeployment(user.projectId, {
        entryPointUrl: "main.ts",
        assets: {
          "main.ts": {
            kind: "file",
            content: getCloudCode(code),
            encoding: "utf-8",
          },
          "CodeTiles.ts": {
            kind: "file",
            content: await Deno.readTextFile("./src/isolates/lib/CodeTiles.ts"),
            encoding: "utf-8",
          },
          "pathfinding.ts": {
            kind: "file",
            content: await Deno.readTextFile("./src/isolates/lib/pathfinding.ts"),
            encoding: "utf-8",
          },
        },

        envVars: {
          MY_ENV: "hey",
        },
      });
      console.log(deployment);

      await db.insert(table.deployment).values({
        id: deployment.id,
        userId: user.id,
        code,
        url: `https://${user.projectName}-${deployment.id}.deno.dev`,
        createdAt: new Date(),
      });

      console.log(`created deployment: https://${user.projectName}-${deployment.id}.deno.dev`);
      return Response.json(
        {
          message: "Deployment successful",
          url: `https://${user.projectName}-${deployment.id}.deno.dev`,
        },
        { headers: corsHeaders },
      );
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/validate" }),
    method: "POST",
    handler: async (req: Request) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      return Response.json({ message: "Valid session" }, { headers: corsHeaders });
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/get_code" }),
    method: "GET",
    handler: async (req: Request) => {
      const sessionCookie = getCookies(req.headers)["auth-session"];
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", {
          status: 401,
          headers: corsHeaders,
        });
      }

      const [latestDeployment] = await db
        .select()
        .from(table.deployment)
        .where(eq(table.deployment.userId, user.id))
        .orderBy(desc(table.deployment.createdAt))
        .limit(1);

      return Response.json({ code: latestDeployment.code || null }, { headers: corsHeaders });
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/login" }),
    method: "POST",
    handler: async (req: Request) => {
      const response = await login(req);
      // Add CORS headers to the response
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/signup" }),
    method: "POST",
    handler: async (req: Request) => {
      const response = await signup(req);
      // Add CORS headers to the response
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/types" }),
    method: "GET",
    handler: async () => {
      //serve the types from ./CodeTiles.d.ts
      const file = await Deno.open("./src/CodeTiles.d.ts");
      const response = new Response(file.readable, {
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });
      for (const [key, value] of Object.entries(corsHeaders)) {
        response.headers.set(key, value);
      }
      return response;
    },
  },
];

function defaultHandler(req: Request) {
  // For non-API routes, we still want to add CORS headers
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  return serveDir(req, {
    fsRoot: "../client/build",
    showIndex: true,
  });
}

Deno.serve({ port: 3000, hostname: "0.0.0.0" }, route(routes, defaultHandler));
