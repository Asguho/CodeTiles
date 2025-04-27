import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import { hash, verify } from "@node-rs/argon2";
const DAY_IN_MS = 1000 * 60 * 60 * 24;

import DeploymentClient from "../src/DeploymentClient.ts";
const GITHUB_CLIENT_ID = Deno.env.get("GITHUB_CLIENT_ID")!;
const GITHUB_CLIENT_SECRET = Deno.env.get("GITHUB_CLIENT_SECRET")!;
const REDIRECT_URI = Deno.env.get("GITHUB_CALLBACK_URI")!;


const deploymentClient = new DeploymentClient();

export const sessionCookieName = "auth-session";

export function generateRandomId() {
	const bytes = crypto.getRandomValues(new Uint8Array(18));
	const token = encodeBase64url(bytes);
	return token;
}

export async function createSession(token: string, userId: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const session: table.Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + DAY_IN_MS * 30),
	};
	await db.insert(table.session).values(session);
	return session;
}

export async function validateSessionToken(token: string) {
	const sessionId = encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	const [result] = await db
		.select({
			// Adjust user table here to tweak returned data
			user: {
				id: table.user.id,
				username: table.user.username,
				projectId: table.user.projectId,
				projectName: table.user.projectName,
				elo: table.user.elo,
			},
			session: table.session,
		})
		.from(table.session)
		.innerJoin(table.user, eq(table.session.userId, table.user.id))
		.where(eq(table.session.id, sessionId));

	if (!result) {
		return { session: null, user: null };
	}
	const { session, user } = result;

	const sessionExpired = Date.now() >= session.expiresAt.getTime();
	if (sessionExpired) {
		await db.delete(table.session).where(eq(table.session.id, session.id));
		return { session: null, user: null };
	}

	const renewSession = Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
	if (renewSession) {
		session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
		await db.update(table.session).set({ expiresAt: session.expiresAt }).where(eq(table.session.id, session.id));
	}

	return { session, user };
}

export type SessionValidationResult = Awaited<ReturnType<typeof validateSessionToken>>;

export async function invalidateSession(sessionId: string) {
	await db.delete(table.session).where(eq(table.session.id, sessionId));
}
export const login = async (req: Request) => {
	const formData = await req.formData();
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;

	const [user] = await db.select().from(table.user).where(eq(table.user.username, username));
	if (!user) {
		return new Response(JSON.stringify({ message: "Invalid username or password" }), { status: 400 });
	}
	const [userAuth] = await db.select().from(table.userAuth).where(eq(table.userAuth.userId, user.id));


	const validPassword = await verify(userAuth.passwordHash, password, {
		memoryCost: 19456,
		timeCost: 2,
		outputLen: 32,
		parallelism: 1,
	});
	if (!validPassword) {
		return new Response(JSON.stringify({ message: "Incorrect username or password" }), { status: 400 });
	}
	const sessionToken = generateRandomId();
	await createSession(sessionToken, user.id);
	return new Response(null, {
		status: 302,
		headers: {
			"Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly; Max-Age=${DAY_IN_MS * 30};`,
			Location: req.headers.get("origin") || "/",
		},
	});
};
export const signup = async (req: Request) => {
	const formData = await req.formData();
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;
	const [existingusername] = await db.select().from(table.user).where(eq(table.user.username, username));
	if (existingusername) {
		return new Response(JSON.stringify({ message: "Username already exists" }), { status: 400 });
	}

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
		const userId = crypto.randomUUID();
		const { id: projectId, name: projectName } = await deploymentClient.createProject();
		if (!projectId) {
			console.error("Failed to create project");
			return new Response(JSON.stringify({ message: "Failed to create project" }), { status: 500 });
		}
		await db.insert(table.user).values({
			id: userId,
			projectId,
			projectName,
			username
		});
		await db.insert(table.userAuth).values({
			userId,
			passwordHash,
		});

		const sessionToken = generateRandomId();
		await createSession(sessionToken, userId);
		return new Response(null, {
			status: 302,
			headers: {
				"Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly; Max-Age=${DAY_IN_MS * 30};`,
				Location: req.headers.get("origin") || "/",
			},
		});
	} catch (_e) {
		console.error(_e);
		return new Response(JSON.stringify({ message: "An error has occurred" }), { status: 500 });
	}

};
export const githubLogin = async (req: Request) => {
	const url = new URL("https://github.com/login/oauth/authorize");
	url.searchParams.set("client_id", GITHUB_CLIENT_ID);
	url.searchParams.set("redirect_uri", REDIRECT_URI);
	url.searchParams.set("scope", "read:user user:email");

	return new Response(null, {
		status: 302,
		headers: { Location: url.toString() },
	});
};

export const githubCallback = async (req: Request) => {
	const { searchParams } = new URL(req.url);
	const code = searchParams.get("code");

	if (!code) {
		return new Response("Missing code", { status: 400 });
	}

	// Exchange code for access token
	const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
		method: "POST",
		headers: { Accept: "application/json" },
		body: new URLSearchParams({
			client_id: GITHUB_CLIENT_ID,
			client_secret: GITHUB_CLIENT_SECRET,
			code,
			redirect_uri: REDIRECT_URI,
		}),
	});
	const tokenData = await tokenResponse.json();
	const accessToken = tokenData.access_token;

	if (!accessToken) {
		return new Response("Failed to get access token", { status: 400 });
	}

	// Fetch user data from GitHub
	const userResponse = await fetch("https://api.github.com/user", {
		headers: { Authorization: `Bearer ${accessToken}` },
	});
	const userData = await userResponse.json();

	// Check if the providerUserId already exists in the database
	const [existingusername] = await db.select().from(table.user).where(eq(table.user.username, userData.login));
	const [existingUserOAuth] = await db
		.select()
		.from(table.userOAuth)
		.where(eq(table.userOAuth.providerUserId, userData.id.toString()));

	if (existingusername) {
		if (!(existingUserOAuth)) {
			return new Response(JSON.stringify({ message: "Username already exists" }), { status: 400 });
		}
	}

	if (existingUserOAuth) {
		// Log in the user
		const sessionToken = generateRandomId();
		await createSession(sessionToken, existingUserOAuth.userId);
		return new Response(null, {
			status: 302,
			headers: {
				"Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly; Max-Age=${DAY_IN_MS * 30};`,
				Location: "/",
			},
		});
	}

	// If the user does not exist, create a new user
	const userId = crypto.randomUUID();
	const { id: projectId, name: projectName } = await deploymentClient.createProject();
	if (!projectId) {
		console.error("Failed to create project");
		return new Response(JSON.stringify({ message: "Failed to create project" }), { status: 500 });
	}
	await db.insert(table.user).values({
		id: userId,
		username: userData.login,
		projectId,
		projectName,
	});
	await db.insert(table.userOAuth).values({
		userId,
		provider: "github",
		providerUserId: userData.id.toString(),
	});

	const sessionToken = generateRandomId();
	await createSession(sessionToken, userId);
	return new Response(null, {
		status: 302,
		headers: {
			"Set-Cookie": `auth-session=${sessionToken}; Path=/; HttpOnly; Max-Age=${DAY_IN_MS * 30};`,
			Location: req.headers.get("origin") || "/",
		},
	});
};

// export function setSessionTokenCookie(
//   event: RequestEvent,
//   token: string,
//   expiresAt: Date,
// ) {
//   event.cookies.set(sessionCookieName, token, {
//     expires: expiresAt,
//     path: "/",
//   });
// }

// export function deleteSessionTokenCookie(event: RequestEvent) {
//   event.cookies.delete(sessionCookieName, {
//     path: "/",
//   });
// }
function validateUsername(username: unknown): username is string {
	return (
		typeof username === "string" &&
		username.length >= 3 &&
		username.length <= 31 &&
		/^[a-zA-ZøæåØÆÅ0-9_-]+$/.test(username)
	);
}

function validatePassword(password: unknown): password is string {
	return typeof password === "string" && password.length >= 6 && password.length <= 255;
}
