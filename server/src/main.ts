import { serveDir } from "jsr:@std/http/file-server";
import { type Route, route } from "jsr:@std/http/unstable-route";
import { retry } from "jsr:@std/async";

import { login, signup, validateSessionToken } from "./auth.ts";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import DeploymentClient from "./DeploymentClient.ts";
import { getCookies } from "jsr:@std/http/cookie";
import { GameHandler } from "./GameHandler.ts";
import { desc, eq } from "drizzle-orm/expressions";
import { socketHandler } from "./SocketHandler.ts";
import { getCloudCode } from "./isolates/isolate.ts";

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
					}
				);
			}

			gameHandler.startGame([{ id: user.id, url: latestDeployment.url }]);

			return Response.json(
				{ message: "Game started" },
				{
					headers: corsHeaders,
				}
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
				{ headers: corsHeaders }
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
