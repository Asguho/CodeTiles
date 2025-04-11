<script lang="ts">
	let tocWidth = 300; // Initial width of the Table of Contents in pixels
	let isResizing = false;
	let searchQuery = ''; // Search query for filtering TOC
	import { BASE_URL } from '$lib/utils';

	let expandedSections: { [key: string]: boolean } = {};
	let sections: {
		id: string;
		title: string;
		content: string;
		subsections: { id: string; title: string }[];
	}[] = [];

	function extractSections() {
		const sectionElements = document.querySelectorAll('.documentation > section'); // Only top-level sections
		sections = Array.from(sectionElements).map((section) => {
			// Set expandedSections to false for all sections
			expandedSections[section.id] = false;
			const id = section.id;
			const title = section.querySelector('h2')?.textContent || 'Untitled';

			// Extract text content, including tables
			const content = Array.from(section.querySelectorAll('*'))
				.map((el) => el.textContent?.trim() || '')
				.join(' ');

			// Extract subsections
			const subsectionElements = section.querySelectorAll(':scope > section'); // Direct child sections
			const subsections = Array.from(subsectionElements).map((subsection) => ({
				id: subsection.id,
				title: subsection.querySelector('h3')?.textContent || 'Untitled'
			}));

			return { id, title, content, subsections };
		});
	}

	function toggleSection(section: string) {
		expandedSections[section] = !expandedSections[section];
	}

	function startResize(event: MouseEvent) {
		isResizing = true;
		document.addEventListener('mousemove', resize);
		document.addEventListener('mouseup', stopResize);
	}

	function resize(event: MouseEvent) {
		if (isResizing) {
			tocWidth = Math.max(200, Math.min(event.clientX, 600)); // Restrict width between 200px and 600px
		}
	}

	function stopResize() {
		isResizing = false;
		document.removeEventListener('mousemove', resize);
		document.removeEventListener('mouseup', stopResize);
	}

	function goBack() {
		window.location.href = BASE_URL || '/';
	}
	function matchesSearch(section: {
		title: string;
		content: string;
		subsections: { title: string }[];
	}) {
		const query = searchQuery.toLowerCase();
		if (section.title.toLowerCase().includes(query)) return true;
		if (section.content.toLowerCase().includes(query)) return true;
		return section.subsections.some((sub) => sub.title.toLowerCase().includes(query));
	}

	const findNear = `const nearestOre = game.map.findNearest(game.base.position, tile => tile.type === TileType.ore);`;
	const unitMethods = `
unit.move("south"); // Moves the unit south

const target = { x: 3, y: 3 };
const withinRange = unit.isWithinRange(target); // Checks if the target is within range

const directions = unit.moveTowards(target); // Calculates directions to move towards the target


const tile = game.map.tiles[1][1];
const isUnitPresent = unit.isUnitOnTile(tile); // Checks if the unit is on the specified tile

const isOwned = unit.isOwnedBy('player1'); // Checks if the unit is owned by player1

const isminer = unit.isMiner(); // Checks if the unit is a miner
const isMelee = unit.isMelee(); // Checks if the unit is a melee unit
const isRanged = unit.isRanged(); // Checks if the unit is a ranged unit
`;
	const getDistance = `const distance = game.getDistance({ x: 1, y: 2 }, { x: 3, y: 4 });  // Distance will be 7`;

	const buyExample = `
game.shop.buy("melee", 5); // Buys 5 melee units 
const canBuy = game.shop.canAfford("melee", 5); // Checks if the player can buy 5 melee units
const cost = game.shop.getPrice("melee", 5); // Gets the cost of 5 melee units

`;

	const attackExample = `const targetPosition = { x: 5, y: 5 };
meleeUnit.attack(targetPosition); // Attacks the target position`;

	const mineExamples = `const oreTile = game.map.tiles[2][3];
minerUnit.mine(oreTile); // Mines ore from the specified tile
minerUnit.sell(); // Sells the ore in the miner's inventory`;

	const isBaseExample = `const tile = game.map.tiles[0][0];
const isBase = tile.isBase(); // Returns true if the tile is a base`;

	// Extract sections after the DOM is loaded
	import { onMount } from 'svelte';
	import './prism.css';
	let Prism;

	onMount(async () => {
		extractSections();
		const module = await import('./prism.js');
		Prism = module.default; // Assign the default export to Prism
		Prism.highlightAll();
	});
</script>

<div class="docs-container">
	<div class="table-of-contents" style="width: {tocWidth}px;">
		<button class="go-back-button mb-4" on:click={goBack}> Go Back </button>

		<!-- Search Field -->
		<input type="text" placeholder="Search..." class="search-input" bind:value={searchQuery} />

		<h2 class="mt-4 text-xl font-semibold text-zinc-300">Table of Contents</h2>
		<ul class="mt-4 space-y-1">
			{#each sections as section (section.id)}
				{#if matchesSearch(section)}
					<li>
						<button class="toggle-button" on:click={() => toggleSection(section.id)}>
							<svg
								class="arrow"
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								data-expanded={expandedSections[section.id]}
							>
								<path d="M8 5l8 7-8 7z" />
							</svg>
							<a href={`#${section.id}`}>{section.title}</a>
						</button>
						{#if expandedSections[section.id]}
							<ul class="ml-4 space-y-1">
								{#each section.subsections as subsection (subsection.id)}
									<li>
										<a href={`#${subsection.id}`}>{subsection.title}</a>
									</li>
								{/each}
							</ul>
						{/if}
					</li>
				{/if}
			{/each}
		</ul>
	</div>

	<!-- Resizer -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="resizer" on:mousedown={startResize}></div>

	<div class="documentation">
		<h1 class="text-3xl font-bold text-white">Documentation</h1>
		<section id="section1" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class Game</h2>
			<p class="mt-2 text-zinc-400">
				The Game class is the primary class where all game objects are referenced from. <br />In the
				main game loop it is referenced as the variable: game
			</p>
			<section id="section1-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>base</td>
							<td>Base</td>
							<td>The base of a player.</td>
						</tr>
						<tr>
							<td>coins</td>
							<td>number</td>
							<td>The player's current coin balance.</td>
						</tr>
						<tr>
							<td>map</td>
							<td>GameMap</td>
							<td>The game map containing all tiles.</td>
						</tr>
						<tr>
							<td>playerId</td>
							<td>string</td>
							<td>The ID of the current player.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section1-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Parameters</th>
							<th>Return Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>getDistance</td>
							<td
								>pos1: Position (&lbrace; x, y &rbrace;), pos2: Position (&lbrace; x, y &rbrace;)</td
							>
							<td>number</td>
							<td>Calculates the distance between the two positions.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section1-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
				<div class="code-container">
					<pre><code class="language-js">{getDistance}</code></pre>
				</div>
			</section>
		</section>

		<section id="section2" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class GameMap</h2>
			<p class="mt-2 text-zinc-400">
				The GameMap class represents the game map and provides methods for interacting with it.
			</p>
			<section id="section2-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>tiles</td>
							<td>Tile[][]</td>
							<td>A 2D array of tiles representing the game map.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section2-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Parameters</th>
							<th>Return Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>findNearest</td>
							<td>start: Position, isTarget: (tile: Tile) => boolean</td>
							<td>Tile</td>
							<td>Finds the nearest tile of a specific type from a starting position.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section2-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
				<div class="code-container">
					<pre><code class="language-js">{findNear}</code></pre>
				</div>
			</section>
		</section>

		<section id="section3" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class Tile</h2>
			<p class="mt-2 text-zinc-400">The Tile class represents a single tile on the game map.</p>
			<section id="section3-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>type</td>
							<td>TileType</td>
							<td>The type of the tile.</td>
						</tr>
						<tr>
							<td>position</td>
							<td>Position</td>
							<td>The position of the tile on the map.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section3-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Parameters</th>
							<th>Return Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>isBase</td>
							<td>None</td>
							<td>boolean</td>
							<td>Checks if the tile is a base.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section3-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
				<div class="code-container">
					<pre><code class="language-js">{isBaseExample}</code></pre>
				</div>
			</section>
		</section>

		<section id="section4" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class Base</h2>
			<p class="mt-2 text-zinc-400">
				The Base class represents a player's base. It inherits from
				<a href="#section3" class="text-blue-400 hover:underline">Class Tile</a>.
			</p>
			<section id="section4-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>owner</td>
							<td>string</td>
							<td>The ID of the player who owns the base.</td>
						</tr>
						<tr>
							<td>health</td>
							<td>number</td>
							<td>The current health of the base.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section4-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				The Base class inherits all methods from the Tile class, and does currently not have any specific
				methods.
			</section>
		</section>

		<section id="section5" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class Shop</h2>
			<p class="mt-2 text-zinc-400">The Shop class allows players to buy units.</p>
			<section id="section5-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<p>This class does not currently have any properties.</p>
			</section>
			<section id="section5-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Parameters</th>
							<th>Return Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>buy</td>
							<td>item: UnitType, quantity: number</td>
							<td>void</td>
							<td>Buys a specified quantity of units of the given type.</td>
						</tr>
					</tbody>
					<tbody>
						<tr>
							<td>canAfford</td>
							<td>item: UnitType, quantity: number</td>
							<td>boolean</td>
							<td>Checks if the player can afford the specified quantity of units.</td>
						</tr>
					</tbody>
					<tbody>
						<tr>
							<td>getPrice</td>
							<td>item: UnitType, quantity: number</td>
							<td>number</td>
							<td>Gets the price of the specified quantity of units.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section5-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
				<div class="code-container">
					<pre><code class="language-js">{buyExample}</code></pre>
				</div>
			</section>
		</section>

		<section id="section6" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Enums and Types</h2>
			<p class="mt-2 text-zinc-400">
				Various enums and types used throughout the CodeTiles library.
			</p>
			<section id="section6-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">TileType</h3>
				<p class="mt-2 text-zinc-400">Represents the type of a tile.</p>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>unknown</td>
							<td>The tile type is unknown.</td>
						</tr>
						<tr>
							<td>ground</td>
							<td>The tile is ground.</td>
						</tr>
						<tr>
							<td>base</td>
							<td>The tile is a base.</td>
						</tr>
						<tr>
							<td>ore</td>
							<td>The tile contains ore.</td>
						</tr>
						<tr>
							<td>wall</td>
							<td>The tile is a wall.</td>
						</tr>
					</tbody>
				</table>
			</section>

			<section id="section6-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Position</h3>
				<p class="mt-2 text-zinc-400">Represents a position on the game map.</p>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>x</td>
							<td>number</td>
							<td>The x-coordinate of the position.</td>
						</tr>
						<tr>
							<td>y</td>
							<td>number</td>
							<td>The y-coordinate of the position.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section6-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Direction</h3>
				<p class="mt-2 text-zinc-400">Represents a direction on the game map.</p>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>north</td>
							<td>Direction north.</td>
						</tr>
						<tr>
							<td>south</td>
							<td>Direction south.</td>
						</tr>
						<tr>
							<td>east</td>
							<td>Direction east.</td>
						</tr>
						<tr>
							<td>west</td>
							<td>Direction west.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section6-4" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">UnitType</h3>
				<p class="mt-2 text-zinc-400">Represents the type of a unit.</p>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>melee</td>
							<td>Melee unit type.</td>
						</tr>
						<tr>
							<td>ranged</td>
							<td>Ranged unit type.</td>
						</tr>
						<tr>
							<td>miner</td>
							<td>Miner unit type.</td>
						</tr>
					</tbody>
				</table>
			</section>
		</section>
		<section id="section7" class="mt-6">
			<h2 class="text-2xl font-semibold text-zinc-300">Class Unit</h2>
			<p class="mt-2 text-zinc-400">The Unit class represents a unit in the game.</p>
			<section id="section7-1" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>id</td>
							<td>string</td>
							<td>The unique identifier of the unit.</td>
						</tr>
						<tr>
							<td>type</td>
							<td>UnitType</td>
							<td>The type of the unit (e.g., melee, ranged, miner).</td>
						</tr>
						<tr>
							<td>owner</td>
							<td>string</td>
							<td>The ID of the player who owns the unit.</td>
						</tr>
						<tr>
							<td>health</td>
							<td>number</td>
							<td>The current health of the unit.</td>
						</tr>
						<tr>
							<td>position</td>
							<td>Position</td>
							<td>The position of the unit on the map.</td>
						</tr>
						<tr>
							<td>actionTaken</td>
							<td>boolean (optional)</td>
							<td>Indicates whether the unit has taken an action this turn.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section7-2" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
				<table class="table">
					<thead>
						<tr>
							<th>Name</th>
							<th>Parameters</th>
							<th>Return Type</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>move</td>
							<td>direction: Direction</td>
							<td>void</td>
							<td>Moves the unit in the specified direction.</td>
						</tr>
						<tr>
							<td>isWithinRange</td>
							<td>target: Position</td>
							<td>boolean</td>
							<td>Checks if the target position is within the unit's range.</td>
						</tr>
						<tr>
							<td>moveTowards</td>
							<td>target: Position</td>
							<td>null | Direction[]</td>
							<td>Calculates the directions to move towards the target position.</td>
						</tr>
						<tr>
							<td>isOwnedBy</td>
							<td>playerId: string</td>
							<td>boolean</td>
							<td>Checks if the unit is owned by the specified player.</td>
						</tr>
						<tr>
							<td>isMiner</td>
							<td>None</td>
							<td>boolean</td>
							<td>Checks if the unit is a miner.</td>
						</tr>
						<tr>
							<td>isMelee</td>
							<td>None</td>
							<td>boolean</td>
							<td>Checks if the unit is a melee unit.</td>
						</tr>
						<tr>
							<td>isRanged</td>
							<td>None</td>
							<td>boolean</td>
							<td>Checks if the unit is a ranged unit.</td>
						</tr>
						<tr>
							<td>isUnitOnTile</td>
							<td>tile: Tile</td>
							<td>boolean</td>
							<td>Checks if the unit is on the specified tile.</td>
						</tr>
					</tbody>
				</table>
			</section>
			<section id="section7-3" class="mt-4">
				<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
				<div class="code-container">
					<pre><code class="language-js">{unitMethods}</code></pre>
				</div>
			</section>
        </section>
			<section id="section8" class="mt-6">
				<h2 class="text-2xl font-semibold text-zinc-300">Class MeleeUnit</h2>
				<p class="mt-2 text-zinc-400">
					The MeleeUnit class represents a melee unit in the game. It inherits from
					<a href="#section7" class="text-blue-400 hover:underline">Class Unit</a>.
				</p>
				<section id="section8-1" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
					<p>
						This class does not currently have any specific properties, however it inherits from the
						Unit Class
					</p>
				</section>
				<section id="section8-2" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Parameters</th>
								<th>Return Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>attack</td>
								<td>target: Position</td>
								<td>void</td>
								<td>Attacks the specified target position.</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section id="section8-3" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
					<div class="code-container">
						<pre><code class="language-js">{attackExample}</code></pre>
					</div>
				</section>
			</section>

			<section id="section9" class="mt-6">
				<h2 class="text-2xl font-semibold text-zinc-300">Class RangedUnit</h2>
				<p class="mt-2 text-zinc-400">
					The RangedUnit class represents a ranged unit in the game. It inherits from
					<a href="#section7" class="text-blue-400 hover:underline">Class Unit</a>.
				</p>
				<section id="section9-1" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
					<p>
						This class does not currently have any specific properties, however it inherits from the
						Unit Class
					</p>
				</section>
				<section id="section9-2" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Parameters</th>
								<th>Return Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>attack</td>
								<td>target: Position</td>
								<td>void</td>
								<td>Attacks the specified target position.</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section id="section9-3" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
					<div class="code-container">
						<pre><code class="language-js">{attackExample}</code></pre>
					</div>
				</section>
			</section>

			<section id="section10" class="mt-6">
				<h2 class="text-2xl font-semibold text-zinc-300">Class MinerUnit</h2>
				<p class="mt-2 text-zinc-400">
					The MinerUnit class represents a miner unit in the game. It inherits from
					<a href="#section7" class="text-blue-400 hover:underline">Class Unit</a>.
				</p>
				<section id="section10-1" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Properties</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>inventory</td>
								<td>&lbrace; ore: number &rbrace;</td>
								<td>The inventory of the miner, containing the amount of ore.</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section id="section10-2" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Methods</h3>
					<table class="table">
						<thead>
							<tr>
								<th>Name</th>
								<th>Parameters</th>
								<th>Return Type</th>
								<th>Description</th>
							</tr>
						</thead>
						<tbody>
							<tr>
								<td>mine</td>
								<td>target: Tile</td>
								<td>void</td>
								<td>Mines ore from the specified tile.</td>
							</tr>
							<tr>
								<td>sell</td>
								<td>None</td>
								<td>void</td>
								<td>Sells the ore in the miner's inventory.</td>
							</tr>
						</tbody>
					</table>
				</section>
				<section id="section10-3" class="mt-4">
					<h3 class="text-xl font-semibold text-zinc-300">Examples</h3>
					<div class="code-container">
						<pre><code class="language-js">{mineExamples}</code></pre>
				</div>
			</section>
		</section>
	</div>
</div>

<style>
	/* General container styling */
	.docs-container {
		display: grid;
		grid-template-columns: auto 5px 1fr; /* Table of Contents, Resizer, Documentation */
		height: 100vh; /* Full height */
		background-color: #18181b; /* Dark background */
		color: #e0e0e0; /* Light text */
	}

	/* Table of Contents */
	.table-of-contents {
		background-color: #1e1e1e; /* Darker background for TOC */
		padding: 0.5rem 1rem; /* Reduced padding for compact layout */
		border-right: 1px solid #333;
		overflow-y: auto; /* Scrollable if content overflows */
	}

	.table-of-contents h2 {
		color: #d4d4d8;
	}

	.table-of-contents ul {
		list-style-type: none;
		padding: 0;
	}

	.table-of-contents li {
		margin: 0.25rem 0; /* Reduced margin for compact layout */
	}

	.table-of-contents a {
		text-decoration: none;
		color: #a1a1aa; /* Grey color for links */
	}

	.table-of-contents a:hover {
		text-decoration: underline;
		color: #d4d4d8; /* Slightly lighter grey on hover */
	}
	.search-input {
		width: 100%; /* Full width of the container */
		padding: 0.5rem; /* Add padding for better usability */
		margin-top: 0.5rem; /* Add spacing from the "Go Back" button */
		border: 1px solid #333; /* Border color */
		border-radius: 5px; /* Rounded corners */
		background-color: #2d2d2d; /* Dark background */
		color: #e0e0e0; /* Light text color */
		font-size: 1rem; /* Font size */
		box-sizing: border-box; /* Ensure padding doesn't affect width */
	}

	.search-input::placeholder {
		color: #a1a1aa; /* Placeholder text color */
	}

	.search-input:focus {
		outline: none; /* Remove default outline */
		border-color: #60a5fa; /* Light blue border on focus */
	}

	.toggle-button {
		background: none;
		border: none;
		color: #d4d4d8;
		cursor: pointer;
		font-size: 1rem;
		text-align: left;
		padding: 0.2rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.toggle-button:hover {
		color: #ffffff;
	}

	.arrow {
		width: 1rem;
		height: 1rem;
		fill: #6b7280; /* Grey arrow */
		transition:
			transform 0.2s ease,
			fill 0.2s ease; /* Smooth rotation and hover effect */
	}

	.arrow[data-expanded='true'] {
		transform: rotate(90deg); /* Rotate when expanded */
	}

	.arrow:hover {
		fill: #9ca3af; /* Slightly lighter grey on hover */
	}

	.go-back-button {
		background-color: #333;
		color: #e0e0e0;
		border: none;
		padding: 0.5rem 1rem;
		border-radius: 5px;
		cursor: pointer;
		width: 100%;
		text-align: left;
	}

	.go-back-button:hover {
		background-color: #444;
	}

	/* Resizer */
	.resizer {
		background-color: #333;
		cursor: col-resize;
		width: 5px;
		height: 100%;
	}

	.resizer:hover {
		background-color: #444;
	}

	/* Documentation */
	.documentation {
		padding: 1rem;
		overflow-y: auto; /* Scrollable if content overflows */
		background-color: #1e1e1e; /* Darker background for content */
		border-left: 1px solid #333;
	}

	.documentation h1 {
		color: #ffffff;
	}

	.documentation h2 {
		color: #d4d4d8;
	}

	.documentation h3 {
		color: #a1a1aa;
	}

	.documentation p {
		line-height: 1.6;
		color: #a1a1aa;
	}
	.table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
		background-color: #1e1e1e; /* Dark background for the table */
		color: #e0e0e0; /* Light text */
	}

	.table th,
	.table td {
		border: 1px solid #333; /* Border color */
		padding: 0.5rem;
		text-align: left;
	}

	.table th {
		background-color: #2d2d2d; /* Slightly darker background for headers */
		color: #ffffff; /* White text for headers */
		font-weight: bold;
	}

	.table tr:nth-child(even) {
		background-color: #252525; /* Alternate row background */
	}

	.table tr:hover {
		background-color: #333; /* Highlight row on hover */
	}
	.code-container {
		margin: 0.5rem 0; /* Reduced vertical spacing */
		background-color: #272727; /* Slightly lighter grey than the code box */
		padding: 0.5rem 0.75rem; /* Reduced padding for a smaller container */
		border-radius: 8px; /* Slightly smaller rounded corners */
		overflow-x: auto;
		box-shadow: 0 3px 5px rgba(0, 0, 0, 0.1); /* Subtle shadow for a box effect */
	}
</style>
