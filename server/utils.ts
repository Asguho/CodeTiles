export function verifyClientBuild() {
  try {
    if (!Deno.statSync("../client/dist/index.html").isFile) {
      throw new Error("Not a file");
    }
  } catch (_error) {
    console.error(
      `Please build the client directory first!\nLike this:\n\ncd ../client && deno run build\n`,
    );
    Deno.exit(1);
  }
}
