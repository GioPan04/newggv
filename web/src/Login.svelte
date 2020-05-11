<script>
    let username = '';
    let password = '';

    let loginStatus;

    async function login() {

        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData,
        });

        const data = await res.json();

        if (!data.logged) {
            throw new Error(data.error);
        }
    }
</script>

<main>
    <form on:submit={ev => {
        ev.preventDefault();
        ev.stopPropagation();
    }}>
        <input type="text" bind:value={username}/>
        <input type="password" bind:value={password}/>
        <input type="submit" value="Login" on:click={() => loginStatus = login()}/>
    </form>
    {#if loginStatus}
        {#await loginStatus}
            Login...
        {:then _}
            Loggato
        {:catch err}
            {err.message}
        {/await}
    {/if}
</main>
