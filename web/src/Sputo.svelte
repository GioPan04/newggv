<script>
export let text;
export let date;
</script>

<style>
main {
    padding-bottom: 20px;
}
#sputo {
    padding: 0;
    margin: 0;
}
#time {
    color: rgba(255, 255, 255, 0.6)
}
</style>

<main>
    <p id="sputo">
        <span id="time">{date}</span> {text}
    </p>
</main>