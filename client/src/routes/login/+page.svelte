<script>
	import { BASE_URL } from '$lib/utils';
</script>

<h1>login</h1>
<form action={BASE_URL + '/api/auth/login'} method="post">
	<input type="text" name="username" placeholder="Username" required />
	<input type="password" name="password" placeholder="Password" required />
	<button type="submit">Login</button>
</form>

<h1>signup</h1>
<form action={BASE_URL + '/api/auth/signup'} method="post">
	<input type="text" name="username" placeholder="Username" required />
	<input type="password" name="password" placeholder="Password" required />
	<button type="submit">Signup</button>
</form>
