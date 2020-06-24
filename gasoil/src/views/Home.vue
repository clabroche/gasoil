<template>
  <div>
    <map-cmp
      @moveMap="Stations.getGasoilAround()"
      @markerClick="markerClick"
      >
    </map-cmp>
    <fuel-overlay></fuel-overlay>
    <station-overlay :station="Stations.selectedStation"></station-overlay>
    <a class="download" href="/gasoil.apk" target="__blank" v-if="!isApp" @click="isApp = true">
      <i class="fab fa-android" aria-hidden="true"></i>
    </a>
  </div>
</template>

<script>
import {debounce} from 'debounce'
import axios from 'axios'
import MapVue from '../components/Map.vue';
import PromiseB from 'bluebird'
import Stations from '../services/stations'
import position from '../services/position'
import FuelOverlayVue from '../components/FuelOverlay.vue';
import StationOverlayVue from '../components/StationOverlay.vue';

export default {
  name: 'Home',
  components: {
    mapCmp: MapVue,
    fuelOverlay: FuelOverlayVue,
    stationOverlay: StationOverlayVue
  },
  data() {
    return {
      debounce,
      latitude: 0,
      longitude: 0,
      Stations,
      prices: [],
      isApp: window.cordova ? true : false
    }
  },
  async mounted() {
    if(window.cordova) {
      await this.appReady()
    }
  },
  methods: {
    appReady() {
      return new Promise((resolve) => {
        document.addEventListener("deviceready", resolve, false);
      });
    },
    async markerClick(ev) {
      Stations.selectedStation = Stations.stations.filter(s => s.data.$.latitude === ev.latlng.lat && s.data.$.longitude === ev.latlng.lng).pop()
      const [{data: placeName}, {data: distances}] = await PromiseB.all([
        axios.get(`${process.env.VUE_APP_API_URL}/station-name/${Stations.selectedStation.data.$.latitude}/${Stations.selectedStation.data.$.longitude}`),
        axios.get(`${process.env.VUE_APP_API_URL}/distances/${Stations.selectedStation.data.$.latitude}/${Stations.selectedStation.data.$.longitude}/${position.currentMarkerCenter[0]}/${position.currentMarkerCenter[1]}`)
      ])
      if(Stations.selectedStation) {
        this.$set(Stations.selectedStation.data, 'place_name',  placeName)
        this.$set(Stations.selectedStation.data, 'distances',  distances)
      }
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">

.popup{
  .title{
    font-size: 1.2em;
    font-weight: bold;
  }
  .label {
    width: 70px;
    display: inline-block;
  }
}
h3 {
  margin: 40px 0 0;
}
ul {
  list-style-type: none;
  padding: 0;
}
li {
  display: inline-block;
  margin: 0 10px;
}
a {
  color: #42b983;
}
.fa-spinner {
  animation-name: spinner;
  animation-duration: 1000ms;
  animation-fill-mode: forwards;
  animation-iteration-count: infinite;
}
@keyframes spinner {
  0% {
    transform: rotateZ(0)
  }
  100% {
    transform: rotateZ(360deg)
  }
}
.fade-enter-active, .fade-leave-active {
  transition: .5s;
}
.fade-enter, .fade-leave-to /* .fade-leave-active below version 2.1.8 */ {
  transform: translateY(70vh)
}
.download {
  position: fixed;
  bottom: 10px;
  right: 10px;
  display: flex;
  height: 60px;
  width: 60px;
  justify-content: center;
  align-items: center;
  background-color: #3c3b42;
  border-radius: 50%;
  border: 1px solid darkgrey;
  box-sizing: border-box;
  box-shadow: 0px 0px 8px 0px darkgrey;
  z-index: 0;
  animation-name: bounce;
  animation-duration: 900ms;
  animation-fill-mode: both;
  animation-iteration-count: infinite;
  &:hover {
    background-color: #eee;
  }
  i {
    color: white;
  }
}
@keyframes bounce {
  0% {
    box-shadow: 0px 0px 0px 0px #3d7cc6;
  }
  100% {
    box-shadow: 0px 0px 0px 20px transparent;
    transform: scale(1.1);
  }
}
</style>
