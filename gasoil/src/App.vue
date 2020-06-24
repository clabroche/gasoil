<template>
  <div id="app">
    <router-view/>
  </div>
</template>

<style lang="scss">
@import '~@fortawesome/fontawesome-free/css/all.min.css';
@import '~leaflet.awesome-markers/dist/leaflet.awesome-markers.css';
@import './assets/Jost/jost.css';
body {
  font-family: Jost, sans-serif;
  margin:0
}
::-webkit-scrollbar {
  width: 10px;
}

/* Track */
::-webkit-scrollbar-track {
  background: #f1f1f100;
}

/* Handle */
::-webkit-scrollbar-thumb {
  background: #888;
}

/* Handle on hover */
::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
