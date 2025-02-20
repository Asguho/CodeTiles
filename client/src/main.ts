import "./style.css";
import { setupGameCanvas } from "./GameCanvas.ts";
import { setupEditor } from "./Editor.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
  <div class="container">
  <button id="run_button">Run</button>
    <div class="editor" id="editor">
      
    </div>
    <div class="sidepanel">
      <div class="gamewindow">
        <canvas id="gameCanvas">
        </canvas>
      </div>
      <div class="gameinfo">
        <pre>
Hello, Vite!
        </pre>
      </div>
    </div>
  </div>
`;

setupGameCanvas(
  document.querySelector<HTMLCanvasElement>("#gameCanvas")!,
  800,
  600,
);

const editor = await setupEditor(document.getElementById("editor")!);

document.getElementById("run_button")!.addEventListener("click", async () => {
  await fetch("http://localhost:8000/api/upload_code", {
    method: "POST",
    body: editor.getValue(),
  });
  console.log(editor.getValue());
});
