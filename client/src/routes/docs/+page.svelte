<script lang="ts">
    let tocWidth = 300; // Initial width of the Table of Contents in pixels
    let isResizing = false;
    let searchQuery = ''; // Search query for filtering TOC
    import { BASE_URL } from '$lib/utils';

    let expandedSections: { [key: string]: boolean } = {};
    let sections: { id: string; title: string; content: string; subsections: { id: string; title: string }[] }[] = [];

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
    function matchesSearch(section: { title: string; content: string; subsections: { title: string }[] }) {
        const query = searchQuery.toLowerCase();
        if (section.title.toLowerCase().includes(query)) return true;
        if (section.content.toLowerCase().includes(query)) return true;
        return section.subsections.some((sub) => sub.title.toLowerCase().includes(query));
    }

    // Extract sections after the DOM is loaded
    import { onMount } from 'svelte';
    onMount(() => {
        extractSections();
    });
</script>

<div class="docs-container">
    <div class="table-of-contents" style="width: {tocWidth}px;">
        <button
            class="go-back-button mb-4"
            on:click={goBack}
        >
            Go Back
        </button>

        <!-- Search Field -->
        <input
            type="text"
            placeholder="Search..."
            class="search-input"
            bind:value={searchQuery}
        >

        <h2 class="text-xl font-semibold text-zinc-300 mt-4">Table of Contents</h2>
        <ul class="mt-4 space-y-1">
            {#each sections as section (section.id)}
            {#if matchesSearch(section)}
                <li>
                    <button
                        class="toggle-button"
                        on:click={() => toggleSection(section.id)}
                    >
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
            <p class="mt-2 text-zinc-400">The Game class is the primary class where all game objects are referenced from. <br>In the main game loop it is referenced as the variable: game</p>
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
                <p>There are no methods in the Game class. </p>

            </section>
        </section>    
        <section id="section2" class="mt-6">
            <h2 class="text-2xl font-semibold text-zinc-300">Class GameMap</h2>
            <p class="mt-2 text-zinc-400">The GameMap class is the primary class where the map is stored <br>Often referenced as map</p>
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
                            <td>Tile[]</td>
                            <td>An array of all tiles on the map.</td>
                        </tr>
                    </tbody>
                </table>
            </section>
            <section id="section2-2" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Methods</h3>
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
                            <td>start: Position (&lbrace; x: number; y: number &rbrace;), isTarget: TileType</td>                            <td>Tile</td>
                            <td>Finds the nearest tile of a specific type from a starting position.</td>
                        </tr>
                    </tbody>
                </table>
            </section>
        </section>
        <section id="section3" class="mt-6">
            <h2 class="text-2xl font-semibold text-zinc-300">Section 3</h2>
            <p class="mt-2 text-zinc-400">Content for section 3.</p>
            <section id="section3-1" class="mt-4">
                <h3 class="text-xl font-semibold text-zinc-300">Subsection 3.1</h3>
                <p>Content for subsection 3.1.</p>
            </section>
            <section id="section3-2" class="mt-4">
                <h3 class="text-xl font-semibold text-zinc-300">Subsection 3.2</h3>
                <p>Content for subsection 3.2.</p>
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
        transition: transform 0.2s ease, fill 0.2s ease; /* Smooth rotation and hover effect */
    }

    .arrow[data-expanded="true"] {
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
</style>