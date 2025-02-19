import "./style.css";
import typescriptLogo from "./typescript.svg";
import viteLogo from "/vite.svg";
import { setupGameCanvas } from "./GameCanvas.ts";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = /*html*/ `
  <div class="container">
    <div class="editor">
      <pre>
        <code class="language-js">
console.log("Hello, Vite!");
        </code>
      </pre>
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
  document.querySelector<HTMLCanvasElement>("#gameCanvas"),
  800,
  600,
);
