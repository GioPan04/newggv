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
        location.href = "/";
    }
</script>

<style>
form {
    text-align: center;
}
input[type=text] {
    margin-top: 10px;
}
input[type=text], input[type=password] {
    width: 300px;
}
input[type=submit] {
    float: right;
}
#logo {
    height: 100px;
    margin: 0 auto;
    display: block;
}
#login {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
}
#message {
    color: #fff;
}
</style>

<main>
    <div id="login">
        <img src="/logo-medium.png" alt="logo" id="logo">
        <form on:submit={ev => {
            ev.preventDefault();
            ev.stopPropagation();
        }}>
            <span id="welcome">Perfavore, effettua il login per continuare</span><br>
            <input placeholder="Username" type="text" bind:value={username}/><br>
            <input placeholder="Password" type="password" bind:value={password}/><br>
            <span id="message">
                {#if loginStatus}
                    {#await loginStatus}
                        Login...
                    {:then _}
                        Loggato
                    {:catch err}
                        {err.message}
                    {/await}
                {/if}
            </span>
            <input type="submit" value="Login" on:click={() => loginStatus = login()}/>
        </form>
    </div>
</main>
