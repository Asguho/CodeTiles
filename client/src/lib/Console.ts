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
}

function addConsoleLine(el: HTMLDivElement, log: { level: string; values: string[] }) {
	const pre = document.createElement('pre');
	pre.innerText = log.values
		.map((val) => (typeof val === 'string' ? val : JSON.stringify(val)))
		.join(' ');
	pre.style.maxWidth = '100%';
	pre.style.overflowWrap = 'break-word';

	let style = '';
	switch (log.level) {
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

	pre.className = `console-${log.level}`;
	pre.style.cssText = `max-width: 100%; overflow-wrap: break-word; ${style}`;

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

function ingestLogs(el: HTMLDivElement, logs: { level: string; values: string[] }[] | undefined) {
	if (!el || !logs || !Array.isArray(logs)) return;

	logs.forEach((log) => {
		addConsoleLine(el, log);
	});

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
	getConsole
};
