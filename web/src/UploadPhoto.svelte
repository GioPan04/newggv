<script>
	import { createEventDispatcher } from 'svelte';
	const dispatch = createEventDispatcher();
    
    let files;
    let error;
    let url;

    function close() {
        dispatch('close');
    }

    async function upload() {
        const formData = new FormData();
        
        formData.append('image', files[0]);

        console.log(files[0]);

        const res = await fetch('/api/upload/image', {
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

        url = json.url;
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

<div id="overlay">
    <div id="popup">
        <span>Carica una foto</span>
        <i class="material-icons" on:click={close}>close</i>
        <form on:submit={ev => {
            ev.preventDefault();
            ev.stopPropagation();
            upload();
        }}>
            <input type="file" name="image" bind:files/>
            <input type="submit" value="Carica"/><br>
            {#if error !== void 0}
                <span id="message">Si è verificato un errore nel caricare il file</span>
            {:else if url !== void 0}
                <span id="message">Il file è stato caricato a questo link <br>{url}</span>
            {/if}
        </form>
    </div>
</div>
