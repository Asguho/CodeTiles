const consoleLines: HTMLPreElement[] = [];

function setupConsole(el: HTMLDivElement) {
	console.log('setting up console');
	//the console consists of a div with and array of pre elements
	//the pre elements are the lines of the console, max width 100
	//new lines can be appended to the console
	//the console is scrollable
	//new console lines are added to the bottom of the console
	//the console automatically scrolls to the bottom on new lines
	el.innerHTML = '';
	el.style.overflowY = 'auto';
	el.style.maxHeight = '100%';
	el.style.width = '100%';
	el.style.fontFamily = 'JetBrains Mono';
	el.style.fontSize = '14px';
	el.style.whiteSpace = 'pre-wrap';
	el.style.textWrapMode = 'break-word';
	//flex flex-col items-start justify-start
	el.style.display = 'flex';
	el.style.flexDirection = 'column';
	el.style.alignItems = 'flex-start';
	el.style.justifyContent = 'flex-start';
}

function addConsoleLine(el: HTMLDivElement, log: { type: string; values: string[] }) {
	console.log('adding console line', log);
	const pre = document.createElement('pre');
	pre.innerText = log.values
		.map((val) => (typeof val === 'string' ? val : JSON.stringify(val)))
		.join(' ');
	pre.style.width = '100%';
	pre.style.maxWidth = '100%';
	pre.style.display = 'block';
	pre.style.overflowWrap = 'break-word';

	let style = '';
	switch (log.type) {
		case 'error':
			style = 'color: #ff5555; font-weight: bold;';
			break;
		case 'warn':
			style = 'color: #ffb86c;';
			break;
		case 'info':
			style = 'color: #8be9fd;';
			break;
		default: // 'log' and others
			style = 'color: #f8f8f2;';
	}

	pre.className = `console-${log.type}`;
	pre.style.cssText += style;

	el.appendChild(pre);
	consoleLines.push(pre);
	//scroll to bottom
	el.scrollTop = el.scrollHeight;

	//remove old lines
	if (consoleLines.length > 100) {
		const oldLine = consoleLines.shift();
		if (oldLine) {
			el.removeChild(oldLine);
		}
	}
}

function ingestLogs(el: HTMLDivElement, logs: { type: string; values: string[] }[] | undefined) {
	if (!el || !logs || !Array.isArray(logs)) return;

	logs.forEach((log) => {
		addConsoleLine(el, log);
	});

	//scroll to bottom
	el.scrollTop = el.scrollHeight;
}

function addTurnDivider(el: HTMLDivElement, t: number) {
	console.log('adding turn divider', t);

	const pre = document.createElement('pre');
	pre.innerText = `Turn ${t}`;
	pre.style.width = '100%';
	pre.style.maxWidth = '100%';
	pre.style.display = 'block';
	pre.style.overflowWrap = 'break-word';
	pre.className = 'console-turn-divider';
	pre.style.cssText +=
		'color: #50fa7b; font-weight: bold; font-size: 16px; text-align: center; ' +
		'padding: 10px 0; margin: 15px 0; border-top: 1px solid rgba(80,250,123,0.4); ' +
		'background-image: linear-gradient(to bottom, rgba(80,250,123,0.1), transparent);';

	el.appendChild(pre);
	consoleLines.push(pre);

	//scroll to bottom
	el.scrollTop = el.scrollHeight;
}

function clearConsole(el: HTMLDivElement) {
	el.innerHTML = '';
	consoleLines.length = 0;
}

function getConsoleLines() {
	return consoleLines;
}

function getAmountOfLines() {
	return consoleLines.length;
}

function getAmountOfErrors() {
	return consoleLines.filter((line) => line.className === 'console-error').length;
}

function getAmountOfWarnings() {
	return consoleLines.filter((line) => line.className === 'console-warn').length;
}

function getAmountOfInfos() {
	return consoleLines.filter((line) => line.className === 'console-info').length;
}

function getAmountOfLogs() {
	return consoleLines.filter((line) => line.className === 'console-log').length;
}

function getConsole() {
	return consoleLines;
}

export {
	setupConsole,
	addConsoleLine,
	ingestLogs,
	clearConsole,
	getConsoleLines,
	getAmountOfErrors,
	getAmountOfWarnings,
	getAmountOfInfos,
	getAmountOfLogs,
	getConsole,
	addTurnDivider,
	getAmountOfLines
};
