import { serveDir } from "jsr:@std/http/file-server";
import { verifyClientBuild } from "./utils.ts";
const IS_IN_DEV = Deno.env.get("IS_IN_DEV") === "true";
Deno.serve((req) => {
  const url = new URL(req.url);
  if (url.pathname.includes("/api")) {
    return Response.json({ message: "Hello World!" });
  }

  // if not in dev mode, serve the client build else proxy to vite
  if (!IS_IN_DEV) {
    console.log("Serving client build...");
    verifyClientBuild();

    return serveDir(req, {
      fsRoot: "../client/dist",
      showIndex: true,
    });
  } else {
    return fetch("http://localhost:5173" + url.pathname, {
      headers: req.headers,
    });
  }
});
