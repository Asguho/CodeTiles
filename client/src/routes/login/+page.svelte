<script lang="ts">
	import { BASE_URL } from '$lib/utils';


	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		const formData = new FormData(event.target as HTMLFormElement);

		try {
			const response = await fetch(BASE_URL + '/api/auth/login', {
				method: 'POST',
				body: formData
			});

			if (!response.ok) {
				const errorText = await response.json();
				alert(errorText.message || 'An error occurred during login.');
				return;
			}

			// Successful signup - redirect or handle as needed
			window.location.href = '/';
		} catch (error) {
			// @ts-ignore
			alert('Error during signup: ' + error.message);
		}
	}
	function continueWithGitHub() {
        window.location.href = `${BASE_URL}/api/auth/github`;
    }
</script>

<div class="flex min-h-screen items-center justify-center bg-zinc-900">
	<div class="flex w-full max-w-xl overflow-hidden rounded-lg bg-zinc-950 shadow-lg">
		<div class="w-3/5 p-8">
			<h1 class="mb-6 text-2xl font-bold text-white">Welcome back</h1>
			<p class="mb-6 text-zinc-400">Login to your CodeTiles account</p>
			<form on:submit={handleSubmit} class="space-y-4">
				<div>
					<label for="username" class="block text-sm font-medium text-zinc-300">Username</label>
					<input
						type="text"
						name="username"
						id="username"
						placeholder="john doe"
						required
						class="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-white shadow-sm focus:border-zinc-200 focus:outline-none focus:ring-zinc-200 sm:text-sm"
					/>
				</div>
				<div>
					<label for="password" class="block text-sm font-medium text-zinc-300">Password</label>
					<input
						type="password"
						name="password"
						id="password"
						placeholder="Password"
						required
						class="mt-1 block w-full rounded-md border border-zinc-600 bg-zinc-700 px-3 py-2 text-white shadow-sm focus:border-zinc-200 focus:outline-none focus:ring-zinc-200 sm:text-sm"
					/>
				</div>
				<button
					type="submit"
					class="flex w-full justify-center rounded-md border border-transparent bg-white px-4 py-2 text-sm font-medium text-black shadow-sm hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-200 focus:ring-offset-2"
					>Login</button
				>
			</form>
			<div class="mt-6 flex items-center justify-between">
				<div class="w-full border-t border-zinc-600"></div>
				<span class="mx-4 text-zinc-400">or</span>
				<div class="w-full border-t border-zinc-600"></div>
			</div>
			<button
				class="mt-6 flex w-full justify-center rounded-md border border-zinc-600 bg-zinc-700 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-600 focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
				onclick={continueWithGitHub}
			>
				<svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
					<path
						fill-rule="evenodd"
						d="M12 0C5.373 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.111.82-.261.82-.58 0-.287-.01-1.046-.015-2.053-3.338.726-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.09-.745.083-.73.083-.73 1.205.085 1.84 1.237 1.84 1.237 1.07 1.835 2.807 1.305 3.492.998.108-.775.418-1.305.76-1.605-2.665-.305-5.466-1.332-5.466-5.93 0-1.31.467-2.38 1.235-3.22-.124-.303-.535-1.527.117-3.18 0 0 1.008-.322 3.3 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.046.138 3.003.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.877.118 3.18.77.84 1.235 1.91 1.235 3.22 0 4.61-2.803 5.62-5.475 5.92.43.37.814 1.102.814 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.218.696.825.578C20.565 21.795 24 17.297 24 12c0-6.627-5.373-12-12-12z"
						clip-rule="evenodd"
					/>
				</svg>
				Continue with GitHub
			</button>
			<p class="mt-6 text-center text-zinc-400">
				Don't have an account? <a href="/signup" class="text-zinc-500 hover:text-zinc-200"
					>Sign up</a
				>
			</p>
		</div>
		<div class="w-2/5">
			<img src="/login.png" alt="gameplay" class="hidden h-full w-full object-cover lg:block" />
		</div>
	</div>
</div>
