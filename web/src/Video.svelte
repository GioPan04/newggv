<script>
export let title;
export let author;
export let thumbnailUrl;
export let videoUrl;
</script>

<style>
    #article {
        display: flex;
        flex-direction: row;
        padding-bottom: 10px;
    }
    #thumbnail {
        width: 177.7px;
        float: left;
        height: 100px;
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
</style>

<main>
    <div id="article">
        <a href={videoUrl} target="_blank" {title}><img id="thumbnail" src={thumbnailUrl} alt={title}></a>
        <div id="right">
            <span id="title">
            {title}
            </span><br>
            <span id="author">
                {author}
            </span>
        </div>
    </div>
</main>