import { serveDir } from "jsr:@std/http/file-server";
import { verifyClientBuild } from "./utils.ts";
import DeploymentClient from "./DeploymentClient.ts";

const IS_IN_DEV = Deno.env.get("IS_IN_DEV") === "true";
if (!IS_IN_DEV) verifyClientBuild();

const dc = new DeploymentClient();

const pr = dc.createProject();
const pr_info = await pr.then((res) => res.json());
console.log(pr_info);
const dp = dc.createDeployment(pr_info.id, {
  entryPointUrl: "main.ts",
  assets: {
    "main.ts": {
      "kind": "file",
      "content": 'Deno.serve((req: Request) => new Response("Hello World"));\n',
      "encoding": "utf-8",
    },
  },
  "envVars": {
    "MY_ENV": "hey",
  },
});
const dp_info = await dp.then((res) => res.json());
console.log(dp_info);

console.log(`https://${pr_info.name}-${dp_info.id}.deno.dev`);

Deno.serve(async (req) => {
  const url = new URL(req.url);
  if (url.pathname == ("/api/upload_code")) {
    const code = await req.text();
    // dc.createDeployment({
    //   code,
    // });
  }

  // if not in dev mode, serve the client build else proxy to vite
  if (!IS_IN_DEV) {
    return serveDir(req, {
      fsRoot: "../client/dist",
      showIndex: true,
    });
  } else {
    try {
      return fetch("http://localhost:5173" + url.pathname + url.search, {
        headers: req.headers,
        method: req.method,
        body: req.body,
      });
    } catch (error) {
      console.error(error);
      return new Response("Vite server is not running", { status: 502 });
    }
  }
});
