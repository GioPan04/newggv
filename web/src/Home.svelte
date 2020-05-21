<script>
import UploadPhoto from './UploadPhoto.svelte';
import ArticleOrVideo from './ArticleOrVideo.svelte';
import jwtDecode from 'jwt-decode';
import Article from './Article.svelte'
import Sputo from './Sputo.svelte';
import Video from './Video.svelte';

const cookie = getCookie('session');

const session = jwtDecode(cookie);

let uploadPhotoOpen = false;
let choiceOpen = false;
let lastArticles;
let sputi;
let videos;

function  choiceClosed(reply) {
	console.log(reply);
	choiceOpen = !choiceOpen;
	if(reply == undefined || reply == null) return;
	if(reply == "article") document.href = "/new";
	//if(reply == "video") 
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

async function getLastArticles() {
	let response = await fetch("/api/articles");
	lastArticles = await response.json();
}
getLastArticles();

async function getSputi() {
	let response = await fetch("/api/sputi");
	sputi = await response.json();
	console.log(sputi.data);
}
getSputi();
setInterval(() => {
	getSputi();
}, 2000);

async function getVideos() {
	let response = await fetch("/api/videos");
	videos = await response.json();
}
getVideos();

function timeConverter(UNIX_timestamp){
  var a = new Date(parseInt(UNIX_timestamp));
  var months = ['Gen','Feb','Mar','Apr','Mag','Giu','Lug','Ago','Set','Ott','Nov','Dic'];
  var year = a.getFullYear();
  var month = months[a.getMonth()];
  var date = a.getDate().toString().length == 1 ? `0${a.getDate()}` : a.getDate();
  var hour = a.getHours().toString().length == 1 ? `0${a.getHours()}` : a.getHours();
  var min = a.getMinutes().toString().length == 1 ? `0${a.getMinutes()}` : a.getMinutes();
  var sec = a.getSeconds().toString().length == 1 ? `0${a.getSeconds()}` : a.getSeconds();
  var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
  return time;
}

</script>

<style>
nav {
	background-color: #000;
	border-radius: 0 0 10px 10px;
	box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24);
}
#logo {
	padding: 3px;
	height: 60px;
}
#welcome {
	color: rgba(255, 255, 255, 0.87);
	float: right;
	margin-top: 25px;
	margin-right: 25px;
}
#content {
	display: grid;
	grid-template-columns: 1fr 1fr 1fr;
	grid-column-gap: 1rem;
	padding: 0.5rem;
}
.material-icons {
	font-size: 36px;
	float: right;
	padding-right: 20px;
	margin-top: 15px;
	color: #fff;
	cursor: pointer;
}
.section {
	font-size: 20pt;
	font-weight: 800;
}
</style>

<main>
	<nav>
		<img src="/logo-medium.png" alt="logo" id="logo">
		<span id="welcome">Benvenuto, {session.name}</span>
		<i class="material-icons" on:click={() => choiceOpen = !choiceOpen}>add</i>
		<i class="material-icons" on:click={() => uploadPhotoOpen = !uploadPhotoOpen}>cloud_upload</i>
		
	</nav>
	<div id="content">
		<div>
			<span class="section">Ultimi articoli</span><br>
			{#if lastArticles === undefined}
				Loading...
			{:else}
				{#await lastArticles}
					Loading...
				{:then lastArticles}
					{#each lastArticles.data as article,i}
						<Article thumbnailUrl={article.thumnail_url} title={article.title} author={article.author} views={article.views}></Article>
					{/each}
				{:catch err}
					{err.message}
				{/await}
			{/if}
		</div>
		<div><span class="section">Ultimi sputi</span><br>
			{#if sputi === undefined}
				Loading...
			{:else}
				{#await sputi}
					Loading...
				{:then sputi}
					{#if sputi.data.length != 0}
						{#each sputi.data as sputo,i}
							<Sputo date={timeConverter(sputo.timestamp)} text={sputo.text}></Sputo>
						{/each}
					{:else}
						Ancora nessuno sputo
					{/if}
				{:catch err}
					{err.message}
				{/await}
			{/if}
		</div>
		<div><span class="section">Ultimi video</span><br>
			{#if videos === undefined}
				Loading...
			{:else}
				{#await videos}
					Loading...
				{:then videos}
					{#if videos.data.length != 0}
						{#each videos.data as video,i}
							<Video thumbnailUrl={video.thumbnailUrl} title={video.title} author={video.author} videoUrl={video.videoUrl}></Video>
						{/each}
					{:else}
						Non è stato pubblicato nessun video
					{/if}
				{:catch err}
					{err.message}
				{/await}
			{/if}
		</div>
	</div>
	{#if uploadPhotoOpen}
		<UploadPhoto on:close={() => uploadPhotoOpen = !uploadPhotoOpen}/>
	{/if}
	{#if choiceOpen}
		<ArticleOrVideo on:close={(reply) => choiceClosed(reply)}/>
	{/if}
</main>
