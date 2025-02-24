export function setupGameCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
	console.log('setupGameCanvas', canvas, width, height);

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
