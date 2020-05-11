<script>
    let username = '';
    let password = '';
</script>

<main>
    <input type="text" bind:value={username}/>
    <input type="password" bind:value={password}/>
    {username}
</main>
