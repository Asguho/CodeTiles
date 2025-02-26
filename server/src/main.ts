import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import { login, signup, validateSessionToken } from "./auth.ts";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";

const deploymentClient = new DeploymentClient();

// CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:5173",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, auth-session",
  "Access-Control-Allow-Credentials": "true",
};

const routes: Route[] = [
  {
    method: "OPTIONS",
    pattern: new URLPattern({ pathname: "/*" }),
    handler: async () => {
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
      const sessionCookie = req.headers.get("auth-session");
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

      return Response.json({ message: "Game started" }, {
        headers: corsHeaders,
      });
    },
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/upload_code" }),
    handler: async (req: Request) => {
      console.log(req.headers);
      const sessionCookie = req.headers.get("auth-session");
      console.log(sessionCookie);
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

      const deployment = await deploymentClient.createDeployment(
        user.projectId,
        {
          assets: { "main.ts": { kind: "file", content: code } },
          entryPointUrl: "main.ts",
        },
      );

      await db.insert(table.deployment).values({
        id: deployment.id,
        userId: user.id,
        createdAt: new Date(),
      });

      console.log(
        `created deployment: https://${user.projectId}-${deployment.id}.deno.dev`,
      );
      return Response.json({
        message: "Deployment successful",
        url: `https://${user.projectId}-${deployment.id}.deno.dev`,
      }, { headers: corsHeaders });
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

Deno.serve(route(routes, defaultHandler));
