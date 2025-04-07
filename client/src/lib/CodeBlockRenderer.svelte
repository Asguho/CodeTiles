<script lang="ts">
	export let text: string;
	export let lang: string;

	// create a hash of the text must only contain letters and numbers and be less than 32 characters
	const hash = (text: string) => {
		let hash = 0;
		for (let i = 0; i < text.length; i++) {
			const chr = text.charCodeAt(i);
			hash = (hash << 5) - hash + chr;
			hash |= 0;
		}
		return Math.abs(hash).toString(36).slice(0, 32);
	};

	const contentHash = hash(text);

	import { codeToHtml } from 'shiki';
	import { onMount } from 'svelte';

	let ready = false;
	onMount(() => {
		ready = true;
	});

	async function codeBlockRenderer({ code, lang }: { code: string; lang: string }) {
		const html = await codeToHtml(code, {
			lang: lang,
			theme: 'material-theme-darker'
		});
		return html;
	}
</script>

<div class="w-[calc(100vw-32px)] max-w-full">
	{#await codeBlockRenderer({ code: text, lang: lang })}
		<pre class="my-6 w-full bg-white text-black dark:bg-black dark:text-white"><code class="w-full"
				>{text}</code
			></pre>
	{:then html}
		{@html html}
	{:catch error}
		<pre class="my-6 w-full bg-white text-black dark:bg-black dark:text-white"><code class="w-full"
				>{text}</code
			></pre>
	{/await}
</div>
