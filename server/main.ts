import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import {
  createSession,
  generateRandomId,
  validateSessionToken,
} from "./auth.ts";
import { hash, verify } from "@node-rs/argon2";
import { eq } from "drizzle-orm";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";

const deploymentClient = new DeploymentClient();

const routes: Route[] = [
  {
    method: "POST",
    pattern: new URLPattern({ pathname: "/api/upload_code" }),
    handler: async (req: Request) => {
      const sessionCookie = req.headers.get("auth-session");
      if (!sessionCookie) {
        return new Response("Unauthorized", { status: 401 });
      }
      const { session, user } = await validateSessionToken(sessionCookie);
      if (!session || !user) {
        return new Response("Unauthorized", { status: 401 });
      }

      const code = await req.text();

      const deployment = await deploymentClient.createDeployment(
        user.projectId,
        {
          assets: { "main.ts": { kind: "file", content: code } },
          entryPointUrl: "main.ts",
        },
      );

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
    handler: async (req: Request) => {
      const formData = await req.formData();
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      const [user] = await db
        .select()
        .from(table.user)
        .where(eq(table.user.username, username));

      if (!user) {
        return new Response(
          JSON.stringify({ message: "Invalid username or password" }),
          { status: 400 },
        );
      }
      const validPassword = await verify(user.passwordHash, password, {
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });
      if (!validPassword) {
        return new Response(
          JSON.stringify({ message: "Incorrect username or password" }),
          { status: 400 },
        );
      }
      const sessionToken = generateRandomId();
      await createSession(sessionToken, user.id);
      return new Response(null, {
        status: 302,
        headers: {
          "Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly`,
        },
      });
    },
  },
  {
    pattern: new URLPattern({ pathname: "/api/auth/signup" }),
    method: "POST",
    handler: async (req: Request) => {
      const formData = await req.formData();
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;

      if (!validateUsername(username)) {
        return new Response(JSON.stringify({ message: "Invalid username" }), {
          status: 400,
        });
      }
      if (!validatePassword(password)) {
        return new Response(JSON.stringify({ message: "Invalid password" }), {
          status: 400,
        });
      }

      const passwordHash = await hash(password, {
        // recommended minimum parameters
        memoryCost: 19456,
        timeCost: 2,
        outputLen: 32,
        parallelism: 1,
      });

      try {
        const userId = generateRandomId();
        const { id: projectId } = await deploymentClient.createProject(
          username,
        );
        if (!projectId) {
          console.error("Failed to create project");
          return new Response(
            JSON.stringify({ message: "Failed to create project" }),
            { status: 500 },
          );
        }
        await db.insert(table.user).values({
          id: userId,
          projectId,
          username,
          passwordHash,
        });

        const sessionToken = generateRandomId();
        await createSession(sessionToken, userId);
        return new Response(null, {
          status: 302,
          headers: {
            "Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly`,
          },
        });
      } catch (_e) {
        console.error(_e);
        return new Response(
          JSON.stringify({ message: "An error has occurred" }),
          { status: 500 },
        );
      }
    },
  },
];

function defaultHandler(_req: Request) {
  return serveDir(_req, {
    fsRoot: "../client/dist",
    showIndex: true,
  });
}

Deno.serve(route(routes, defaultHandler));

function validateUsername(username: unknown): username is string {
  return (
    typeof username === "string" &&
    username.length >= 3 &&
    username.length <= 31 &&
    /^[a-zA-ZøæåØÆÅ0-9_-]+$/.test(username)
  );
}

function validatePassword(password: unknown): password is string {
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 255
  );
}
