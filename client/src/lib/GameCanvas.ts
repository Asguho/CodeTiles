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

// Preload images
const unitImages = {
	melee: new Image(),
	ranged: new Image(),
	miner: new Image()
};

const TileImagesImports = {
	grounds: [ground1, ground2, ground3, ground4, ground5, ground6, ground7],
	walls: [wall1, wall2, wall3, wall4],
	ores: [ore1, ore2],
	unknowns: [unknown1, unknown2, unknown3]
};

const TileImages = {
	grounds: TileImagesImports.grounds.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	}),
	walls: TileImagesImports.walls.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	}),
	ores: TileImagesImports.ores.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	}),
	unknowns: TileImagesImports.unknowns.map((src) => {
		const img = new Image();
		img.src = src;
		return img;
	})
};

unitImages.melee.src = oneGif;
unitImages.ranged.src = twoGif;
unitImages.miner.src = threeGif;

export function setupGameCanvas(canvas: HTMLCanvasElement) {
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

	//farmor2

	// Initial setup
	updateCanvasDimensions();

	// Add resize event listener
	const resizeObserver = new ResizeObserver(() => {
		updateCanvasDimensions();
	});

	// Observe the canvas for size changes
	resizeObserver.observe(canvas);

	// Also listen for window resize events
	// window.addEventListener('resize', updateCanvasDimensions);

	// Return a cleanup function to disconnect observers and event listeners
	return () => {
		resizeObserver.disconnect();
		window.removeEventListener('resize', updateCanvasDimensions);
	};
}

export function drawGame(canvas: HTMLCanvasElement, gameState: any) {
	const height = gameState.map.length;
	const width = gameState.map[0].length;

	// Clear the canvas
	const ctx = canvas.getContext('2d')!;
	ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
	ctx.fillStyle = '#FFFFFF';
	ctx.imageSmoothingEnabled = false; // Disable image smoothing for pixelated rendering
	// Calculate grid size to ensure square cells
	// Use the CSS dimensions (clientWidth/clientHeight) instead of canvas.width/height
	const cellSizeX = canvas.clientWidth / width;
	const cellSizeY = canvas.clientHeight / height;
	const gridSize = Math.min(cellSizeX, cellSizeY);

	// Calculate the offset to center the grid in the canvas (using CSS dimensions)
	const offsetX = (canvas.clientWidth - width * gridSize) / 2;
	const offsetY = (canvas.clientHeight - height * gridSize) / 2;

	// Draw the grid
	ctx.strokeStyle = '#000000';

	// Draw the cells based on the game state // map[x][y].type = 'unknown' | 'ground' | 'wall' | 'ore'
	for (let y = 0; y < height; y++) {
		for (let x = 0; x < width; x++) {
			const cell = gameState.map[y][x];
			if (!cell) continue;

			// Get image based on cell type
			let img = null;
			const cellType = cell.type;

			// First draw ground tile as the base layer
			const groundIndex = Math.floor(Math.random() * TileImages.grounds.length);
			img = TileImages.grounds[groundIndex];

			// Draw the ground tile
			if (img && img.complete) {
				ctx.drawImage(img, offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			}

			// Then overdraw with the specific cell type if it's not ground
			switch (cellType) {
				case 'wall': {
					// Use x,y coordinates to create a deterministic index
					const index = (x * 31 + y * 17) % TileImages.walls.length; //NOT RANDOM
					img = TileImages.walls[index];
					break;
				}
				case 'ore': {
					const index = (x * 23 + y * 29) % TileImages.ores.length; //NOT RANDOM
					img = TileImages.ores[index];
					break;
				}
				case 'unknown': {
					const index = (x * 13 + y * 19) % TileImages.unknowns.length; //NOT RANDOM
					img = TileImages.unknowns[index];
					break;
				}
				case 'ground': {
					const index = (x * 13 + y * 14) % TileImages.grounds.length; //NOT RANDOM
					img = TileImages.grounds[index];
					break;
				}
			}

			// Draw the cell (image or fallback)
			if (img) {
				// Wait for the image to load before drawing
				img.onload = () => {
					ctx.drawImage(img, offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
				};

				// If the image is already cached and loaded
				if (img.complete) {
					ctx.drawImage(img, offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
				} else {
					// Fallback to rectangle while loading
					ctx.fillStyle = '#EEEEEE';
					ctx.fillRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
				}
			} else {
				// Fallback to rectangle if image is null
				ctx.fillStyle = '#EEEEEE';
				ctx.fillRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			}

			// Draw cell border
			//ctx.strokeRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);

			// Draw base if present
			if (cell.base) {
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

			// Draw units if present
			if (cell.units && cell.units.length > 0) {
				// Draw unit count if more than one unit
				if (cell.units.length > 1) {
					ctx.fillStyle = '#000000'; // Black for unit count
					ctx.font = `${gridSize * 0.4}px Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(
						cell.units.length.toString(),
						offsetX + x * gridSize + gridSize * 0.25,
						offsetY + y * gridSize + gridSize * 0.25
					);
				}

				// Use the first unit for displaying
				const unitType = cell.units[0].type;
				let unitImage = null;

				// Calculate unit position and size
				const unitSize = gridSize * 0.9;
				const xPos = offsetX + x * gridSize + (gridSize - unitSize) / 2;
				const yPos = offsetY + y * gridSize + (gridSize - unitSize) / 2;

				switch (unitType) {
					case 'melee':
						unitImage = unitImages.melee;
						break;
					case 'ranged':
						unitImage = unitImages.ranged;
						break;
					case 'miner':
						unitImage = unitImages.miner;
						break;
					default:
						unitImage = null;
						break;
				}

				if (unitImage && unitImage.complete) {
					ctx.drawImage(unitImage, xPos, yPos, unitSize, unitSize);
				} else {
					// Fallback to a colored rectangle if no image or image not loaded
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

	console.log('drawing game', gameState);
}
