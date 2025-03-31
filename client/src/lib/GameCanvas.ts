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
let previousGameState: TurnData | null = null;
let animationFrameId: number | null = null;
let animationStartTime: number | null = null;
const ANIMATION_DURATION = 100; // Animation duration in milliseconds
const HEALTH_BAR_HEIGHT = 4; // Height of the health bar in pixels
const HEALTH_BAR_OFFSET = 2; // Offset above the unit in pixels

// Store unit animation states
type AnimatedUnit = {
	id: string;
	startPosition: { x: number; y: number };
	targetPosition: { x: number; y: number };
};
let animatingUnits: AnimatedUnit[] = [];

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
	// If we have a previous game state, find units that have moved
	if (currentGameState && gameState.units) {
		// Reset animation list
		animatingUnits = [];

		// Create a map of previous unit positions for quick lookup
		const previousUnitPositions = new Map();
		currentGameState.units.forEach((unit) => {
			previousUnitPositions.set(unit.id, { ...unit.position });
		});

		// Check which units have moved and need animation
		gameState.units.forEach((unit) => {
			const previousPos = previousUnitPositions.get(unit.id);
			if (previousPos && (previousPos.x !== unit.position.x || previousPos.y !== unit.position.y)) {
				// This unit has moved, add it to the animation list
				animatingUnits.push({
					id: unit.id,
					startPosition: previousPos,
					targetPosition: { ...unit.position }
				});
			}
		});

		// Start animation if we have units to animate
		if (animatingUnits.length > 0) {
			animationStartTime = performance.now();
		}
	}

	// Store current state as previous for next update
	previousGameState = currentGameState ? { ...currentGameState } : null;
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

	// Calculate animation progress if we're animating
	let animationProgress = 1; // Default to 1 (animation complete)
	if (animationStartTime !== null && animatingUnits.length > 0) {
		const currentTime = performance.now();
		const elapsedTime = currentTime - animationStartTime;

		if (elapsedTime < ANIMATION_DURATION) {
			// Animation in progress
			animationProgress = elapsedTime / ANIMATION_DURATION;
		} else {
			// Animation complete
			animationStartTime = null;
		}
	}

	// Create a map of animated positions for quick lookup
	const animatedPositions = new Map();
	if (animationProgress < 1) {
		animatingUnits.forEach((unit) => {
			const interpolatedX =
				unit.startPosition.x + (unit.targetPosition.x - unit.startPosition.x) * animationProgress;
			const interpolatedY =
				unit.startPosition.y + (unit.targetPosition.y - unit.startPosition.y) * animationProgress;
			animatedPositions.set(unit.id, { x: interpolatedX, y: interpolatedY });
		});
	}

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
		}
	}

	// Draw units with their current animated position
	gameState.units.forEach((unit) => {
		// Get animated position if available, otherwise use the actual position
		let displayPos = { ...unit.position };
		const animatedPos = animatedPositions.get(unit.id);
		if (animatedPos) {
			displayPos = animatedPos;
		}

		// Calculate pixel position
		const unitSize = gridSize * 0.9;
		const xPos = offsetX + displayPos.x * gridSize + (gridSize - unitSize) / 2;
		const yPos = offsetY + displayPos.y * gridSize + (gridSize - unitSize) / 2;

		// Get the unit type
		const unitType = unit.type;

		// Draw the unit
		if (unitOverlays && ['melee', 'ranged', 'miner'].includes(unitType)) {
			const gifElement = document.createElement('img');
			gifElement.src = unitGifSources[unitType as keyof typeof unitGifSources];
			gifElement.style.position = 'absolute';
			gifElement.style.left = `${xPos}px`;
			gifElement.style.top = `${yPos}px`;
			gifElement.style.width = `${unitSize}px`;
			gifElement.style.height = `${unitSize}px`;
			gifElement.style.imageRendering = 'pixelated'; // For pixelated look

			// Add data attribute to identify the unit
			gifElement.dataset.unitId = unit.id;

			// Create health bar container div
			const healthBarContainer = document.createElement('div');
			healthBarContainer.style.position = 'absolute';
			healthBarContainer.style.left = `${xPos}px`;
			healthBarContainer.style.top = `${yPos - HEALTH_BAR_HEIGHT - HEALTH_BAR_OFFSET}px`;
			healthBarContainer.style.width = `${unitSize}px`;
			healthBarContainer.style.height = `${HEALTH_BAR_HEIGHT}px`;
			healthBarContainer.style.backgroundColor = '#333333';

			// Create health bar fill div
			const healthBarFill = document.createElement('div');
			healthBarFill.style.width = `${(unit.health / 100) * 100}%`;
			healthBarFill.style.height = '100%';
			healthBarFill.style.backgroundColor =
				unit.health > 50 ? '#00FF00' : unit.health > 25 ? '#FFFF00' : '#FF0000';

			healthBarContainer.appendChild(healthBarFill);
			unitOverlays.appendChild(healthBarContainer);
			unitOverlays.appendChild(gifElement);
		} else {
			// Fallback to rectangle
			ctx.fillStyle = '#FF9900'; // Orange fallback
			ctx.fillRect(xPos, yPos, unitSize, unitSize);

			// Draw health bar for fallback rectangles
			const healthBarWidth = unitSize * (unit.health / 100);
			ctx.fillStyle = '#333333';
			ctx.fillRect(xPos, yPos - HEALTH_BAR_HEIGHT - HEALTH_BAR_OFFSET, unitSize, HEALTH_BAR_HEIGHT);
			ctx.fillStyle = unit.health > 50 ? '#00FF00' : unit.health > 25 ? '#FFFF00' : '#FF0000';
			ctx.fillRect(
				xPos,
				yPos - HEALTH_BAR_HEIGHT - HEALTH_BAR_OFFSET,
				healthBarWidth,
				HEALTH_BAR_HEIGHT
			);
		}
	});

	// Draw unit counts (we can't do this in the cell loop anymore since units may be animating)
	const unitCountsByCell = new Map();

	gameState.units.forEach((unit) => {
		// Use the real position for counting, not animated position
		const cellKey = `${Math.floor(unit.position.x)}-${Math.floor(unit.position.y)}`;
		const count = unitCountsByCell.get(cellKey) || 0;
		unitCountsByCell.set(cellKey, count + 1);
	});

	// Draw counts for cells with multiple units
	unitCountsByCell.forEach((count, cellKey) => {
		if (count > 1) {
			const [x, y] = cellKey.split('-').map(Number);
			ctx.fillStyle = '#000000'; // Black for unit count
			ctx.font = `${gridSize * 0.4}px Arial`;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'middle';
			ctx.fillText(
				count.toString(),
				offsetX + x * gridSize + gridSize * 0.25,
				offsetY + y * gridSize + gridSize * 0.25
			);
		}
	});

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
