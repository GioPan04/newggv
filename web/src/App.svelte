<script>
	import { Router, Route } from 'svelte-routing';

	import Home from './Home.svelte';
	import Login from './Login.svelte';
	import New from './New.svelte';
	import UploadVideo from './UploadVideo.svelte';
</script>

<Router>
	<Route path="/" component={Home}/>
	<Route path="/login" component={Login}/>
	<Route path="/new" component={New}/>
	<Route path="/upload/video" component={UploadVideo}/>
</Router>
