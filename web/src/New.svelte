<script>
    function insertAtCaret(areaId, text) {
        var txtarea = document.getElementById(areaId);
        if (!txtarea) {
            return;
        }

        var scrollPos = txtarea.scrollTop;
        var strPos = 0;
        var br = ((txtarea.selectionStart || txtarea.selectionStart == '0') ?
            "ff" : (document.selection ? "ie" : false));
        if (br == "ie") {
            txtarea.focus();
            var range = document.selection.createRange();
            range.moveStart('character', -txtarea.value.length);
            strPos = range.text.length;
        } else if (br == "ff") {
            strPos = txtarea.selectionStart;
        }

        var front = (txtarea.value).substring(0, strPos);
        var back = (txtarea.value).substring(strPos, txtarea.value.length);
        txtarea.value = front + text + back;
        strPos = strPos + text.length;
        if (br == "ie") {
            txtarea.focus();
            var ieRange = document.selection.createRange();
            ieRange.moveStart('character', -txtarea.value.length);
            ieRange.moveStart('character', strPos);
            ieRange.moveEnd('character', 0);
            ieRange.select();
        } else if (br == "ff") {
            txtarea.selectionStart = strPos;
            txtarea.selectionEnd = strPos;
            txtarea.focus();
        }

        txtarea.scrollTop = scrollPos;
    }
    function insertImage() {
        var image = prompt("Scrivi il link dell'immagine", "https://example.com/image.png");
        insertAtCaret("text", `![image](${image})`);
    }
    function insertLink() {
        var link = prompt("Scrivi il link", "https://example.com");
        var linktext = prompt("Scrivi il testo del link", "Google");
        insertAtCaret("text", `[${linktext}](${link})`);
    }
    function insertImageLink() {
        var link = prompt("Scrivi il link", "https://example.com");
        var linktext = prompt("Scrivi il testo del link", "Google");
        insertAtCaret("text", `[${linktext}](${link})`);
    }
    function preview() {
        var html_content = "";
        html_content = markdown.toHTML( document.getElementById('text').value );  
        var win = window.open("", "Title", "toolbar=no,location=no,directories=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=780,height=200,top="+(screen.height-400)+",left="+(screen.width-840));
        win.document.body.innerHTML = html_content;
        win.document.head.innerHTML = '<link href="https://fonts.googleapis.com/css?family=Roboto+Slab&display=swap" rel="stylesheet"><link rel="stylesheet" href="https://ggv.pangio.it/admin/new/static/preview.css"><title>GGV Editor Preview</title>';
    }
    async function send() {
        const formData = new URLSearchParams();
        formData.append('title', document.getElementById('articleTitle').innerHTML );
        console.log(document.getElementById('articleTitle').innerHTML);
        formData.append('article', document.getElementById('text').value );
        let image = prompt("Scrivi il link all'immagine", "https://example.com/image.png");
        if(image === null) {
            return;
        }
        formData.append('thumbnailUrl', image);
        const res = await fetch('/api/new_article', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            body: formData,
        });
        console.log(await res.json());
    }
</script>

<style>
main {
    padding: 0;
    margin: 0;
    margin-top: -21px;
    font-family: 'Roboto Slab', sans-serif;
    background-color: #ffffff;
    height: 100vh;
}
#sidebar {
    background-color: #d6d4d4;
    width: min-content;
    padding: 0;
    position: fixed;
    left: 0;
    top: 200px;
    margin: 0;
    border-top-right-radius: 10px;
    border-bottom-right-radius: 10px;
}
#sidebar > ul {
    list-style-type: none;
    padding: 15px;
    padding-left: 10px;
    margin: 0;
    cursor: pointer;
}
#sidebar > ul > li > i {
    font-size: 35px;
    color: #000;
}
#root {
    margin-left: 100px;
    margin-right: 100px;
}
#articleTitle {
    color: rgba(0, 0, 0, 0.87);
    font-family: 'Roboto Slab', sans-serif;
    margin-bottom: 6px;
    outline: none;
}
#author {
    color: rgb(0, 0, 0, .6);
}
#text {
    margin-top: 40px;
    width: 100%;
    height: calc(100vh - 40px - 75px);
    resize: none;
    font-size: 17px;
    outline: none;
    border: none;
    text-align: justify;
    color: rgba(0, 0, 0, 0.87);
    margin-bottom: 0;
}
#actions {
    position: absolute;
    top: 10px;
    right: 10px;
    cursor: pointer;
    background-color: #ffffff;
    color: #000;
}
#actions > i {
    font-size: 35px;
}

@media (min-width: 320px) and (max-width: 480px) {
    #sidebar {
        left: unset;
        top: unset;
        bottom: 0;
        width: 100%;
        border-top-left-radius: 10px;
        border-top-right-radius: 10px;
        border-bottom-right-radius: 0;
    }
    #sidebar > ul > li {
        display: inline-block;
        *display:inline;
        padding: 0;
    }
}
</style>

<main>
    <div id="actions">
        <i id="preview" title="Visualizza anteprima" class="material-icons" on:click={() => preview()}>play_circle_filled</i>
        <i id="send" title="Pubblica articolo" class="material-icons" on:click={() => send()}>send</i>
    </div>
    <div id="sidebar">
        <ul>
            <li><i title="Aggiungi titolo primario" class="material-icons" id="add_title" on:click={() => insertAtCaret('text', '#')}>title</i></li>
            <li><i title="Aggiungi sottotitolo" class="material-icons" id="add_subtitle" on:click={() => insertAtCaret('text', '##')}>text_fields</i></li>
            <li><i title="Aggiungi immagine" class="material-icons" id="add_image" on:click={() => insertImage()}>insert_photo</i></li>
            <li><i title="Aggiungi link" class="material-icons" id="add_link" on:click={() => insertLink()}>insert_link</i></li>
            <li><i title="Aggiungi immagine con link" class="material-icons" id="add_image_link" on:click={() => insertImageLink()}>collections</i></li>
        </ul>
    </div>
    <div id="root">
        <h1 contenteditable="true" id="articleTitle" tabindex="1">Nome articolo</h1>
        <span id="author">Autore: Gioele Pannetto</span><br>
        <textarea id="text" tabindex="2">#Titolo primario</textarea>
    </div>
</main>