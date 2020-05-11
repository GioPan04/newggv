<script>
	import { Router, Route } from 'svelte-routing';

	import Home from './Home.svelte';
	import Login from './Login.svelte';
</script>

<Router>
	<Route path="/" component={Home}/>
	<Route path="/login" component={Login}/>
</Router>
