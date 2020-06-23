<template>
  <div>
    <l-map ref="myMap" class="map" :zoom="this.zoom" @click="selectedStation = null; $forceUpdate()" @move="moveMap">
      <l-tile-layer url="http://{s}.tile.osm.org/{z}/{x}/{y}.png" attribution='Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>'></l-tile-layer>
      <l-marker :latLng="currentMarkerCenter" :icon="defaultIcon"></l-marker>
      <l-marker
        ref="marker"
        @click="markerClick"
        :latLng="[station.data.$.latitude,station.data.$.longitude]"
        :icon="getIconForStation(station)"
        v-for="station of stations"
      >
        <l-tooltip class="popup" :options="{direction:'top', offset:[0,-50]}">
          <div class="prices" v-if="station.data.prix">
            <div v-for="price of station.data.prix" v-if="price.$.nom === carburant || carburant === 'All'">
              <span class="label">
                {{price.$.nom}}
              </span>
              {{price.$.valeur}} €
            </div>
          </div>
        </l-tooltip>
      </l-marker>
    </l-map>

    <div class="overlay">
      <div>Type de carburant:</div>
      <select v-model="carburant">
        <option value="All">Tous</option>
        <option value="Gazole">Gazole</option>
        <option value="GPLc">GPLc</option>
        <option value="E10">E10</option>
        <option value="E85">E85</option>
        <option value="SP95">SP95</option>
        <option value="SP98">SP98</option>
      </select>
    </div>
    <transition name="fade">
      <div class="station" v-if="selectedStation" :key="selectedStation.data.$.latitude + selectedStation.data.$.longitude">
        <section class="title">
          <div class="icon"><i class="fas fa-compass"></i></div>
          <div class="content">
            <div>{{selectedStation.data.adresse[0]}}</div>
            <div>{{selectedStation.data.ville[0]}}</div>
          </div>
        </section>
        <section class="title">
          <div class="icon"><i class="fas fa-road"></i></div>
          <div class="content" v-if="selectedStation.data.distances">
            <div>{{selectedStation.data.place_name}}</div>
            <div>{{humanize(selectedStation.data.distances.duration)}}</div>
            <div>{{(selectedStation.data.distances.distance / 1000).toFixed(3)}} km</div>
          </div>
          <div class="content" v-else>
            <i class="fas fa-spinner"></i>
          </div>
        </section>
        <section class="prices" v-if="selectedStation.data.prix">
          <div class="icon"><i class="fas fa-money-bill"></i></div>
          <div class="content">
            <div v-if="hasThisFuel(selectedStation)">
              <div v-for="price of selectedStation.data.prix" v-if="price.$.nom === carburant || carburant === 'All'">
                <span class="label">
                  {{price.$.nom}}
                </span>
                {{price.$.valeur}} €
              </div>
            </div>
            <div v-else>Cette pompe ne fait pas de {{carburant}}</div>
          </div>
        </section>
        <section class="horaires" v-if="selectedStation.data.horaires">
          <div class="icon"><i class="fas fa-clock"></i></div>
          <div class="content">
            <div class="automate" v-if="selectedStation.data.horaires[0].$['automate-24-24']">
              24h/24
            </div>
            <div class="horaire" v-for="day of selectedStation.data.horaires[0].jour" v-if="day.horaire">
              <span class="label">
                {{day.$.nom}}
              </span>
              {{day.horaire[0].$.ouverture}} - {{day.horaire[0].$.fermeture}}
            </div>
          </div>
        </section>
      </div>
    </transition>
  </div>
</template>

<script>
import {LMap, LTileLayer, LMarker, LPopup, LTooltip, LIcon } from 'vue2-leaflet';
import defaultMarkerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import defaultMarkerIcon from 'leaflet/dist/images/marker-icon.png'
import defaultMarkerShadow from 'leaflet/dist/images/marker-shadow.png'
import {debounce} from 'debounce'
import L from 'leaflet'
import { Icon }  from 'leaflet'
import axios from 'axios'
import PromiseB from 'bluebird'
import moment from 'moment'
moment.locale('fr')

export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      debounce,
      latitude: 0,
      longitude: 0,
      zoom: 0,
      center: [0,0],
      map: null,
      currentMarkerCenter: [0,0],
      selectedStation: null,
      stations: [],
      defaultIcon: L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'compass',
        markerColor: 'blue',
      }),
      greenIcon: L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'gas-pump',
        markerColor: 'green',
      }),
      orangeIcon: L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'gas-pump',
        markerColor: 'orange',
      }),
      redIcon: L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'gas-pump',
        markerColor: 'red',
      }),
      carburant: 'All',
      prices: []
    }
  },
  watch: {
    carburant() {
      this.updatePrices()
    }
  },
  computed: {
    currentDay() {
      return moment().day()
    }
  },
  components: {
    LMap,
    LPopup,
    LTooltip,
    LTileLayer,
    LMarker,
    LIcon
  },
  async mounted() {
    if(!!window.cordova) {
      await this.appReady()
    }
    this.map = this.$refs.myMap.mapObject
    this.getLocation()
      .then(_ => this.getGasoilAround())
      .then(_ => this.updatePrices())
  },
  methods: {
    appReady() {
      return new Promise((resolve, reject) => {
        document.addEventListener("deviceready", resolve, false);
      });
    },
    moveMap: debounce(async function(e) {
      if(!e.sourceTarget.getCenter) return
      const newCenter = e.sourceTarget.getCenter()
      this.center = [newCenter.lat, newCenter.lng]
      await this.getGasoilAround()
      await this.updatePrices()
    }, 200),
    hasThisFuel(selectedStation) {
      const res = selectedStation.data.prix.reduce((res, price) => {
        if(!res && price.$.nom === this.carburant || this.carburant === 'All') res = true
        return res
      }, false)
      return res
    },
    async markerClick(ev) {
      this.map.setView([ev.latlng.lat , ev.latlng.lng])
      this.selectedStation = this.stations.filter(s => s.data.$.latitude === ev.latlng.lat && s.data.$.longitude === ev.latlng.lng).pop()
      const res = await PromiseB.all([
        axios.get(`${process.env.VUE_APP_API_URL}/station-name/${this.selectedStation.data.$.latitude}/${this.selectedStation.data.$.longitude}`),
        axios.get(`${process.env.VUE_APP_API_URL}/distances/${this.selectedStation.data.$.latitude}/${this.selectedStation.data.$.longitude}/${this.currentMarkerCenter[0]}/${this.currentMarkerCenter[1]}`)
      ]).then(res =>res)
      if(this.selectedStation) {
        this.$set(this.selectedStation.data, 'place_name',  res[0].data)
        this.$set(this.selectedStation.data, 'distances',  res[1].data)
      }
    },
    humanize(sec) {
      return moment.duration(sec, "seconds").humanize();
    },
    updatePrices() {
      this.prices = this.stations.map(station => {
        const prices = station.data.prix
        if(prices){
          if(this.carburant !=="All") {
            const price = prices.filter(p => p.$ && p.$.nom === this.carburant)[0] || {$:{valeur: 10000}}
            return price.$.valeur
          } else {
            return prices[0].$.valeur
          }
        } else {
          return 10000
        }
      }).sort()
    },
    getIconForStation(station) {
      const prices = station.data.prix
      let price = 10000
      if(prices) {
        if(this.carburant !=="All") {
          const priceFound = prices.filter(p => p.$ && p.$.nom === this.carburant)[0] || {$:{valeur: null}}
          price = priceFound.$.valeur
          if(!price) return this.redIcon
        } else {
          price = prices[0].$.valeur
        }
        if(this.prices.indexOf(price) < 3) {
          return this.greenIcon
        }
        return this.orangeIcon
      }
      return this.redIcon
    },
    async getGasoilAround() {
      const {data: stations} = await axios.get(`${process.env.VUE_APP_API_URL}/sort/${this.center[0].toFixed(6)}/${this.center[1].toFixed(6)}`)
      this.stations = stations.map(station => {
        return {
          data: station,
        }
      })
    },
    async getLocation() {
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(position => {
          this.center = [position.coords.latitude, position.coords.longitude]
          this.zoom = 14
          this.map.setView(this.center, this.zoom)
          this.currentMarkerCenter = this.center
          resolve()
        });
      });
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
.prices,.horaires {
}
.overlay {
  position: fixed;
  right: 0;
  top:0;
  padding: 20px;
  box-sizing: border-box;
  background-color: #3c3b42;
  border-bottom: 4px solid #3d7cc6;
  box-shadow: 0px 1px 7px 5px #4a4a4a;
  color: white;
  width: 100%;
  select {
    width: 100%;
    background-color: #53545f;
    color: white;
    border: none;
    outline: none;
    padding: 5px;
    margin-top: 10px;
  }
}

.station {
  position: fixed;
  right: 0;
  bottom:0;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #3c3b42;
  border-top: 4px solid #3d7cc6;
  box-shadow: 0px 1px 4px 5px #4a4a4a;
  max-height: 40vh;
  overflow: auto;
  section {
    margin-bottom: 20px;
    background-color: #53545f;
    color: white;
    padding: 10px;
    box-sizing: border-box;
    box-shadow: 0px 0px 4px 0px #1e1e1e;
    border-radius: 4px;
    display: flex;
    align-items: center;
    transition: 300ms;
    .icon {
      border-right: 2px solid lightgrey;
      margin-right:10px;
      padding-right:10px;
    }
  }
}
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
.map {
  height: 100vh;
  left: 0;
  top: 0;
  position: fixed;
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
</style>
