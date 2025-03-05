export function setupGameCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
	canvas.width = width ?? 100;
	canvas.height = height ?? 100;

	const ctx = canvas.getContext('2d')!;
	const gridSize = 20;
	const rows = canvas.height / gridSize;
	const cols = canvas.width / gridSize;

	ctx.strokeStyle = '#000000';
	for (let i = 0; i <= rows; i++) {
		ctx.beginPath();
		ctx.moveTo(0, i * gridSize);
		ctx.lineTo(canvas.width, i * gridSize);
		ctx.stroke();
	}

	for (let j = 0; j <= cols; j++) {
		ctx.beginPath();
		ctx.moveTo(j * gridSize, 0);
		ctx.lineTo(j * gridSize, canvas.height);
		ctx.stroke();
	}
}

export function drawGame(canvas: HTMLCanvasElement, gameState: any) {
	const width = gameState.map.length;
	const height = gameState.map[0].length;
	
	// Clear the canvas
	const ctx = canvas.getContext('2d')!;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.fillStyle = '#FFFFFF';
	
	// ctx.fillRect(0, 0, canvas.width, canvas.height);

	// Calculate grid size to ensure square cells
	// Use the smallest dimension to ensure cells stay square
	const cellSizeX = canvas.width / width;
	const cellSizeY = canvas.height / height;
	const gridSize = Math.min(cellSizeX, cellSizeY);
	
	// Calculate the offset to center the grid in the canvas
	const offsetX = (canvas.width - (width * gridSize)) / 2;
	const offsetY = (canvas.height - (height * gridSize)) / 2;
	
	// Draw the grid
	ctx.strokeStyle = '#000000';
	
	// Draw the cells based on the game state // map[x][y].type = 'unknown' | 'ground' | 'wall' | 'ore'
	for (let x = 0; x < width; x++) {
		for (let y = 0; y < height; y++) {
			const cell = gameState.map[x][y];
			if (!cell) continue;
			
			const cellType = cell.type;
			
			// Set fill color based on cell type
			switch (cellType) {
				case 'ground':
					ctx.fillStyle = '#CCFFCC'; // Light green
					break;
				case 'wall':
					ctx.fillStyle = '#6666FF'; // Blue
					break;
				case 'ore':
					ctx.fillStyle = '#FFD700'; // Gold
					break;
				case 'unknown':
				default:
					ctx.fillStyle = '#EEEEEE'; // Light gray
					break;
			}
			
			// Draw the cell
			ctx.fillRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			ctx.strokeRect(offsetX + x * gridSize, offsetY + y * gridSize, gridSize, gridSize);
			
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
					ctx.fillStyle = '#FFFFFF';
					ctx.font = `${gridSize * 0.4}px Arial`;
					ctx.textAlign = 'center';
					ctx.textBaseline = 'middle';
					ctx.fillText(
						cell.units.length.toString(), 
						offsetX + x * gridSize + gridSize * 0.25, 
						offsetY + y * gridSize + gridSize * 0.25
					);
				}
				
				// Draw unit representation
				ctx.fillStyle = '#FF9900'; // Orange
				const unitSize = gridSize * 0.4;
				
				// For each unit up to 3, draw a circle
				const maxUnitsToShow = Math.min(cell.units.length, 3);
				for (let i = 0; i < maxUnitsToShow; i++) {
					const xPos = offsetX + x * gridSize + gridSize * (0.3 + (i % 2) * 0.4);
					const yPos = offsetY + y * gridSize + gridSize * (0.3 + Math.floor(i / 2) * 0.4);
					
					ctx.beginPath();
					ctx.arc(xPos, yPos, unitSize / 2, 0, Math.PI * 2);
					ctx.fill();
					ctx.stroke();
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
