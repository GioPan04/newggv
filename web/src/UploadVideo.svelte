<script>
    
    let files;
    let title;
    let thumbnailUrl;
    let error;
    let uploaded;

    async function upload() {
        const formData = new FormData();
        title = document.getElementById('title').value;
        thumbnailUrl = prompt('Scrivi il link dell\'immagine');
        if(thumbnailUrl == null) return;
        formData.append('title', title);
        formData.append('thumbnailUrl', thumbnailUrl);
        formData.append('video', files[0]);

        console.log(files[0]);

        const res = await fetch('/api/upload/video', {
            credentials: 'include',
            method: 'POST',
            body: formData,
        });

        const json = await res.json();

        console.log(json);

        if (!json.uploaded) {
            error = json.error;
            return;
        }

        uploaded = json;
    }

</script>


<style>
    #overlay {
        background-color: rgba(0, 0, 0, 0.5);
        width: 100%;
        height: 100vh;
        z-index: 999;
        position: absolute;
        top: 0;
    }
    #popup {
        background-color: #000;
        padding: 15px;
        border-radius: 20px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: min-content;
    }
    span {
        font-size: 20pt;
    }
    #message {
        font-size: 11px;
    }
    .material-icons {
        float: right;
        cursor: pointer;
    }
</style>


    <span>Nuovo video</span>
    <i class="material-icons">close</i>
    <form on:submit={ev => {
        ev.preventDefault();
        ev.stopPropagation();
        upload();
    }}>
    <input id="title" type="text" name="title" placeholder="Titolo" required/><br>
    <input type="file" name="image" bind:files required/>
    <input type="submit" value="Carica"/><br>
    {#if error !== void 0}
        <span id="message">Si è verificato un errore nel caricare il file</span>
    {:else if uploaded !== void 0}
        <span id="message">Il video è stato caricato</span>
    {/if}
</form>
