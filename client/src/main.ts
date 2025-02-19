import "./style.css";
import { setupGameCanvas } from "./GameCanvas.ts";
import { setupEditor } from "./Editor.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
  <div class="container">
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

setupGameCanvas(document.querySelector<HTMLCanvasElement>("#gameCanvas")!, 800, 600);

setupEditor(document.getElementById("editor")!);
