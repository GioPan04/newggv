<script>
export let title;
export let author;
export let thumbnailUrl;
export let views;
</script>

<style>
    #article {
        display: flex;
        flex-direction: row;
        padding-bottom: 10px;
    }
    #thumbnail {
        width: 70px;
        float: left;
        height: 108.8px;
    }
    #title {
        font-weight: 500;
        font-size: 13pt;
    }
    #author {
        color: rgba(255, 255, 255, 0.6);
    }
    #right {
        margin-left: 5px;
    }
    .material-icons {
        color: rgba(255, 255, 255, 0.6);
    }
    .views {
        color: rgba(255, 255, 255, 0.6);
        display: flex;
    }
    #views-counter {
        margin-top: 1px;
        margin-left: 5px;
    }
</style>

<main>
    <div id="article">
        <img id="thumbnail" src={thumbnailUrl} alt={title}>
        <div id="right">
            <span id="title">
            {title}
            </span><br>
            <span id="author">
                {author}
            </span><br>
            <div class="views">
                <i class="material-icons">visibility</i>
                <span id="views-counter">{views}</span>
            </div>
            
        </div>
        
    </div>
</main>