import { eq } from "drizzle-orm";
import { sha256 } from "@oslojs/crypto/sha2";
import { encodeBase64url, encodeHexLowerCase } from "@oslojs/encoding";
import { db } from "./db/index.ts";
import * as table from "./db/schema.ts";
import { hash, verify } from "@node-rs/argon2";
const DAY_IN_MS = 1000 * 60 * 60 * 24;

import DeploymentClient from "../src/DeploymentClient.ts";

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

  const renewSession =
    Date.now() >= session.expiresAt.getTime() - DAY_IN_MS * 15;
  if (renewSession) {
    session.expiresAt = new Date(Date.now() + DAY_IN_MS * 30);
    await db
      .update(table.session)
      .set({ expiresAt: session.expiresAt })
      .where(eq(table.session.id, session.id));
  }

  return { session, user };
}

export type SessionValidationResult = Awaited<
  ReturnType<typeof validateSessionToken>
>;

export async function invalidateSession(sessionId: string) {
  await db.delete(table.session).where(eq(table.session.id, sessionId));
}
export const login = async (req: Request) => {
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
};
export const signup = async (req: Request) => {
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
    const userId = crypto.randomUUID();
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
  return (
    typeof password === "string" &&
    password.length >= 6 &&
    password.length <= 255
  );
}
