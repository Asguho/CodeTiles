import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import { login, signup, validateSessionToken } from "./auth.ts";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";
import { getCookies } from "jsr:@std/http/cookie";
import { GameHandler } from "./GameHandler.ts";
import { desc, eq } from "drizzle-orm/expressions";
import { SocketHandler } from "./SocketHandler.ts";

const deploymentClient = new DeploymentClient();
const gameHandler = new GameHandler();
const socketHandler = new SocketHandler();

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
    handler: (req) => {
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

      gameHandler.startGame([{ id: user.id, url: latestDeployment.url }]);

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
      const deployment = await deploymentClient.createDeployment(
        user.projectId,
        {
          entryPointUrl: "main.ts",
          assets: {
            "main.ts": {
              kind: "file",
              content: code,
              encoding: "utf-8",
            },
          },
          envVars: {
            MY_ENV: "hey",
          },
        },
      );
      console.log(deployment);

      await db.insert(table.deployment).values({
        id: deployment.id,
        userId: user.id,
        url: `https://${user.projectName}-${deployment.id}.deno.dev`,
        createdAt: new Date(),
      });

      console.log(
        `created deployment: https://${user.projectName}-${deployment.id}.deno.dev`,
      );
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
