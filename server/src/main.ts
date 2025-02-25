import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import { login, signup, validateSessionToken } from "./auth.ts";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";

const deploymentClient = new DeploymentClient();

const routes: Route[] = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/start_game" }),
    handler: async (req: Request) => {
      const sessionCookie = req.headers.get("auth-session");
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", { status: 401 });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", { status: 401 });
      }

      return Response.json({ message: "Game started" });
    },
  },
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/upload_code" }),
    handler: async (req: Request) => {
      const sessionCookie = req.headers.get("auth-session");
      if (!sessionCookie) {
        return new Response("Unauthorized | no cookie", { status: 401 });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized | invalid cookie", { status: 401 });
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
      });
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/login" }),
    method: "POST",
    handler: login,
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/signup" }),
    method: "POST",
    handler: signup,
  },
];

function defaultHandler(_req: Request) {
  return serveDir(_req, {
    fsRoot: "../client/dist",
    showIndex: true,
  });
}

Deno.serve(route(routes, defaultHandler));
