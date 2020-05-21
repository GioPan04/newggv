<script>
import { createEventDispatcher } from 'svelte';
const dispatch = createEventDispatcher();

function close(choice) {
    dispatch('close', choice);
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
        width: 350px;
        height: 100px;
    }
    .material-icons {
        float: right;
        cursor: pointer;
    }
    .modal-title {
        font-size: 20px;
    }
    .action {
        margin-right: 15px;
    }
    .actions {
        bottom: 15px;
        right: 10px;
        position: absolute;
        color: #ffffff;
        text-decoration: none;
    }
    a {
        color: #ffffff;
    }
    a:visited {
        color: #ffffff;
    }
    a:hover {
        text-decoration: none;
    }
</style>

<div id="overlay">
    <div id="popup">
        <span class="modal-title">Vuoi pubblicare un articolo o video?</span>
        <i class="material-icons" on:click={close}>close</i>
        <br>
        <div class="actions">
            <span class="md-flat-button action" on:click={close}><a href="/upload/video" title="Carica un nuovo video">VIDEO</a></span>
            <span class="md-flat-button action" on:click={close}><a href="/new" title="Scrivi un nuovo articolo">ARTICOLO</a></span>
        </div>
        
    </div>
</div>