<script lang="ts">
    let tocWidth = 300; // Initial width of the Table of Contents in pixels
    let isResizing = false;
    import { BASE_URL } from '$lib/utils';

    let expandedSections: { [key: string]: boolean } = {
        section1: false,
        section2: false,
        section3: false
    };

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
</script>

<div class="docs-container">
    <div class="table-of-contents" style="width: {tocWidth}px;">
        <button
            class="go-back-button mb-4"
            on:click={goBack}
        >
            Go Back
        </button>
        <h2 class="text-lg font-semibold text-zinc-300">Table of Contents</h2>
        <ul class="mt-4 space-y-1">
            <li>
                <button
                    class="toggle-button"
                    on:click={() => toggleSection('section1')}
                >
                    <svg
                        class="arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        data-expanded={expandedSections.section1}
                    >
                        <path d="M8 5l8 7-8 7z" />
                    </svg>
                    Section 1
                </button>
                {#if expandedSections.section1}
                    <ul class="ml-4 space-y-1">
                        <li><a href="#section1-1">Subsection 1.1</a></li>
                        <li><a href="#section1-2">Subsection 1.2</a></li>
                    </ul>
                {/if}
            </li>
            <li>
                <button
                    class="toggle-button"
                    on:click={() => toggleSection('section2')}
                >
                    <svg
                        class="arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        data-expanded={expandedSections.section2}
                    >
                        <path d="M8 5l8 7-8 7z" />
                    </svg>
                    Section 2
                </button>
                {#if expandedSections.section2}
                    <ul class="ml-4 space-y-1">
                        <li><a href="#section2-1">Subsection 2.1</a></li>
                        <li><a href="#section2-2">Subsection 2.2</a></li>
                    </ul>
                {/if}
            </li>
            <li>
                <button
                    class="toggle-button"
                    on:click={() => toggleSection('section3')}
                >
                    <svg
                        class="arrow"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        data-expanded={expandedSections.section3}
                    >
                        <path d="M8 5l8 7-8 7z" />
                    </svg>
                    Section 3
                </button>
                {#if expandedSections.section3}
                    <ul class="ml-4 space-y-1">
                        <li><a href="#section3-1">Subsection 3.1</a></li>
                        <li><a href="#section3-2">Subsection 3.2</a></li>
                    </ul>
                {/if}
            </li>
        </ul>
    </div>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="resizer" on:mousedown={startResize}></div>
    <div class="documentation">
        <h1 class="text-3xl font-bold text-white">Documentation</h1>
        <section id="section1" class="mt-6">
            <h2 class="text-xl font-semibold text-zinc-300">Section 1</h2>
            <p class="mt-2 text-zinc-400">Content for section 1...</p>
            <section id="section1-1" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 1.1</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 1.1...</p>
            </section>
            <section id="section1-2" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 1.2</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 1.2...</p>
            </section>
        </section>
        <section id="section2" class="mt-6">
            <h2 class="text-xl font-semibold text-zinc-300">Section 2</h2>
            <p class="mt-2 text-zinc-400">Content for section 2...</p>
            <section id="section2-1" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 2.1</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 2.1...</p>
            </section>
            <section id="section2-2" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 2.2</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 2.2...</p>
            </section>
        </section>
        <section id="section3" class="mt-6">
            <h2 class="text-xl font-semibold text-zinc-300">Section 3</h2>
            <p class="mt-2 text-zinc-400">Content for section 3...</p>
            <section id="section3-1" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 3.1</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 3.1...</p>
            </section>
            <section id="section3-2" class="mt-4">
                <h3 class="text-lg font-semibold text-zinc-300">Subsection 3.2</h3>
                <p class="mt-2 text-zinc-400">Content for subsection 3.2...</p>
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
        color: #60a5fa; /* Light blue links */
    }

    .table-of-contents a:hover {
        text-decoration: underline;
    }

    .table-of-contents ul ul {
        margin-top: 0.25rem; /* Reduced margin for nested subsections */
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
</style>