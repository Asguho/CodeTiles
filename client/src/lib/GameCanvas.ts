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
	const width = gameState.map.length;
    const height = gameState.map[0].length;
    
    // Clear the canvas
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    ctx.fillStyle = '#FFFFFF';
    
    // Calculate grid size to ensure square cells
    // Use the CSS dimensions (clientWidth/clientHeight) instead of canvas.width/height
    const cellSizeX = canvas.clientWidth / width;
    const cellSizeY = canvas.clientHeight / height;
    const gridSize = Math.min(cellSizeX, cellSizeY);
    
    // Calculate the offset to center the grid in the canvas (using CSS dimensions)
    const offsetX = (canvas.clientWidth - (width * gridSize)) / 2;
    const offsetY = (canvas.clientHeight - (height * gridSize)) / 2;
    
    // Draw the grid
    ctx.strokeStyle = '#000000';
    
    // Draw the cells based on the game state // map[x][y].type = 'unknown' | 'ground' | 'wall' | 'ore'
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const cell = gameState.map[y][x];  
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
