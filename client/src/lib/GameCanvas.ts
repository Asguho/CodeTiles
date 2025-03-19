import oneGif from './1.gif';
import twoGif from './2.gif';
import threeGif from './3.gif';

import ground1 from './tiles/tile016.png';
import ground2 from './tiles/tile017.png';
import ground3 from './tiles/tile018.png';
import ground4 from './tiles/tile019.png';
import ground5 from './tiles/tile027.png';
import ground6 from './tiles/tile028.png';
import ground7 from './tiles/tile029.png';

import wall1 from './tiles/tile001.png';
import wall2 from './tiles/tile002.png';
import wall3 from './tiles/tile003.png';
import wall4 from './tiles/tile004.png';

import ore1 from './tiles/oretile000.png';
import ore2 from './tiles/oretile001.png';

import unknown1 from './tiles/cloudtile000.png';
import unknown2 from './tiles/cloudtile001.png';
import unknown3 from './tiles/cloudtile002.png';
import type { TurnData } from '../../../server/src/types';

import { createImage, isBrowser } from './browser';

// Preload images conditionally in browser only
const unitImages: Record<string, HTMLImageElement | null> = {
	melee: createImage(),
	ranged: createImage(),
	miner: createImage()
};

const TileImagesImports = {
	grounds: [ground1, ground2, ground3, ground4, ground5, ground6, ground7],
	walls: [wall1, wall2, wall3, wall4],
	ores: [ore1, ore2],
	unknowns: [unknown1, unknown2, unknown3]
};

const TileImages: Record<string, Array<HTMLImageElement | null>> = {
	grounds: TileImagesImports.grounds.map((src) => {
		const img = createImage();
		if (img && isBrowser) img.src = src;
		return img;
	}),
	walls: TileImagesImports.walls.map((src) => {
		const img = createImage();
		if (img && isBrowser) img.src = src;
		return img;
	}),
	ores: TileImagesImports.ores.map((src) => {
		const img = createImage();
		if (img && isBrowser) img.src = src;
		return img;
	}),
	unknowns: TileImagesImports.unknowns.map((src) => {
		const img = createImage();
		if (img && isBrowser) img.src = src;
		return img;
	})
};

// Only set image sources in browser environment
if (isBrowser) {
	if (unitImages.melee) unitImages.melee.src = oneGif;
	if (unitImages.ranged) unitImages.ranged.src = twoGif;
	if (unitImages.miner) unitImages.miner.src = threeGif;
}

// Store references to GIF sources
const unitGifSources = {
	melee: oneGif,
	ranged: twoGif,
	miner: threeGif
};

// Track unit overlay elements
let unitOverlays: HTMLDivElement | null = null;

// Store internal game state and animation frame reference
let currentGameState: TurnData | null = null;
let animationFrameId: number | null = null;

export function setupGameCanvas(canvas: HTMLCanvasElement) {
	// Create a container for the canvas and overlay elements
	const container = document.createElement('div');
	container.style.position = 'relative';
	canvas.parentNode?.insertBefore(container, canvas);
	container.appendChild(canvas);

	// Create a div for overlaying GIFs
	unitOverlays = document.createElement('div');
	unitOverlays.style.position = 'absolute';
	unitOverlays.style.top = '0';
	unitOverlays.style.left = '0';
	unitOverlays.style.width = '100%';
	unitOverlays.style.height = '100%';
	unitOverlays.style.pointerEvents = 'none'; // Allow clicks to pass through to canvas
	container.appendChild(unitOverlays);

	// Set the canvas dimensions to match the display size
	const updateCanvasDimensions = () => {
		const dpr = window.devicePixelRatio || 1;
		// Store the original CSS dimensions
		const displayWidth = canvas.clientWidth;
		const displayHeight = canvas.clientHeight;

		// Check if the canvas size needs to be updated
		if (canvas.width !== displayWidth * dpr || canvas.height !== displayHeight * dpr) {
			// Update the canvas dimensions and scale
			canvas.width = displayWidth * dpr;
			canvas.height = displayHeight * dpr;

			const ctx = canvas.getContext('2d');
			if (ctx) {
				// Reset scale and then apply the new dpr scaling
				ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
				ctx.scale(dpr, dpr);
			}
		}
	};

	// Initial setup
	updateCanvasDimensions();

	// Set up animation loop for continuous rendering at ~60fps
	function renderLoop() {
		// Only render if we have game state data
		if (currentGameState) {
			renderGame(canvas, currentGameState);
		}
		animationFrameId = requestAnimationFrame(renderLoop);
	}

	// Start the animation loop
	renderLoop();

	// Add resize event listener
	const resizeObserver = new ResizeObserver(() => {
		updateCanvasDimensions();
	});

	// Observe the canvas for size changes
	resizeObserver.observe(canvas);

	// Return a cleanup function to disconnect observers and event listeners
	return () => {
		resizeObserver.disconnect();
		// Cancel animation frame if it's running
		if (animationFrameId !== null) {
			cancelAnimationFrame(animationFrameId);
			animationFrameId = null;
		}
		// Remove the overlay container
		if (unitOverlays && unitOverlays.parentNode) {
			unitOverlays.parentNode.removeChild(unitOverlays);
		}
	};
}

// Function to update the game state without immediately redrawing
export function updateGameState(gameState: TurnData) {
	currentGameState = gameState;
	console.log('Game state updated', gameState);
}

// Internal function to render the current game state
function renderGame(canvas: HTMLCanvasElement, gameState: TurnData) {
	const height = gameState.map.length;
	const width = gameState.map[0].length;

	// Clear the canvas
	const ctx = canvas.getContext('2d')!;
	ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	ctx.fillStyle = '#FFFFFF';
	ctx.imageSmoothingEnabled = false; // Disable image smoothing for pixelated rendering

	// Clear previous overlay elements
	if (unitOverlays) {
		unitOverlays.innerHTML = '';
	}

	// Calculate grid size to ensure square cells
	const cellSizeX = canvas.clientWidth / width;
	const cellSizeY = canvas.clientHeight / height;
	const gridSize = Math.min(cellSizeX, cellSizeY);

	// Calculate the offset to center the grid in the canvas (using CSS dimensions)
	const offsetX = (canvas.clientWidth - width * gridSize) / 2;
	const offsetY = (canvas.clientHeight - height * gridSize) / 2;

	// Draw the grid
	ctx.strokeStyle = '#000000';

	// Draw the cells based on the game state
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const cell = gameState.map[y][x];
			if (!cell) continue;

			// Get image based on cell type
			let img = null;
			const cellType = cell.type;

			// First draw ground tile as the base layer
			const groundIndex = 0; // Use a fixed index for ground tile
			img = TileImages.grounds[groundIndex];

			// Draw the ground tile
			if (img && img.complete) {
				ctx.drawImage(img, offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			}

			// Then overdraw with the specific cell type if it's not ground
			switch (cellType) {
				case 'wall': {
					// Use x,y coordinates to create a deterministic index
					const index = (x * 2 + y * 2) % TileImages.walls.length; //NOT RANDOM
					img = TileImages.walls[index];
					break;
				}
				case 'ore': {
					const index = (x * 3 + y * 3) % TileImages.ores.length; //NOT RANDOM
					img = TileImages.ores[index];
					break;
				}
				case 'unknown': {
					const index = (x * 4 + y * 4) % TileImages.unknowns.length; //NOT RANDOM
					img = TileImages.unknowns[index];
					break;
				}
				case 'ground': {
					const index = (x * 5 + y * 5) % TileImages.grounds.length; //NOT RANDOM
					img = TileImages.grounds[index];
					break;
				}
			}

			// Draw the cell (image or fallback)
			if (img && img.complete) {
				ctx.drawImage(img, offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			} else {
				// Fallback to rectangle if image is null or not loaded
				ctx.fillStyle = '#EEEEEE';
				ctx.fillRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			}

			// Draw base if present
			if (cell.type === 'base') {
				ctx.fillStyle = '#FF6666'; // Red
				const baseSize = gridSize * 0.6;
				const baseOffset = (gridSize - baseSize) / 2;
				ctx.fillRect(
					offsetX + x * gridSize + baseOffset,
					offsetY + y * gridSize + baseOffset,
					baseSize,
					baseSize
				);

				// Draw base outline
				ctx.strokeStyle = '#FF0000';
				ctx.lineWidth = 2;
				ctx.strokeRect(
					offsetX + x * gridSize + baseOffset,
					offsetY + y * gridSize + baseOffset,
					baseSize,
					baseSize
				);
				ctx.lineWidth = 1;
				ctx.strokeStyle = '#000000';
			}

			// Draw units present at this position
			const unitsAtPosition = gameState.units.filter(
				(unit) => unit.position.x === x && unit.position.y === y
			);
			if (unitsAtPosition.length > 0) {
				// Draw unit count if more than one unit
				if (unitsAtPosition.length > 1) {
					ctx.fillStyle = '#000000'; // Black for unit count
					ctx.font = `${gridSize * 0.4}px Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(
						unitsAtPosition.length.toString(),
						offsetX + x * gridSize + gridSize * 0.25,
						offsetY + y * gridSize + gridSize * 0.25
					);
				}

				// Use the first unit for displaying
				const unitType = unitsAtPosition[0].type;
				const unitSize = gridSize * 0.9;
				const xPos = offsetX + x * gridSize + (gridSize - unitSize) / 2;
				const yPos = offsetY + y * gridSize + (gridSize - unitSize) / 2;

				// Instead of drawing to canvas, create an img element for the GIF
				if (unitOverlays && ['melee', 'ranged', 'miner'].includes(unitType)) {
					const gifElement = document.createElement('img');
					gifElement.src = unitGifSources[unitType as keyof typeof unitGifSources];
					gifElement.style.position = 'absolute';
					gifElement.style.left = `${xPos}px`;
					gifElement.style.top = `${yPos}px`;
					gifElement.style.width = `${unitSize}px`;
					gifElement.style.height = `${unitSize}px`;
					gifElement.style.imageRendering = 'pixelated'; // For pixelated look
					unitOverlays.appendChild(gifElement);
				} else {
					// Fallback for canvas drawing if overlay not available
					ctx.fillStyle = '#FF9900'; // Orange fallback color
					ctx.fillRect(xPos, yPos, unitSize, unitSize);
				}
			}
		}
	}

	// Draw game info text
	ctx.fillStyle = '#000000';
	ctx.font = '16px Arial';
	ctx.textAlign = 'left';
	ctx.textBaseline = 'top';
	ctx.fillText(`Turn: ${gameState.turn}`, 10, 10);
	ctx.fillText(`Coins: ${gameState.coins}`, 10, 30);
}

// Legacy function for backwards compatibility, now just updates the internal state
export function drawGame(canvas: HTMLCanvasElement, gameState: TurnData) {
	updateGameState(gameState);
}
