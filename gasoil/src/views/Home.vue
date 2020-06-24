<template>
  <div>
    <map-cmp
      :stations="stations"
      @selectStation="this.selectedStation = $event"
      @moveMap="moveMap"
      @markerClick="markerClick"
      >
    </map-cmp>
    <div class="overlay">
      <div>Type de carburant:</div>
      <select :value="Stations.carburant" @input="Stations.setCarburant($event.target.value)">
        <option :value="carburant.id" v-for="carburant of Stations.carburants" :key="carburant.id">{{carburant.label}}</option>
      </select>
    </div>
    <transition name="fade">
      <div class="station" v-if="selectedStation" :key="selectedStation.data.$.latitude + selectedStation.data.$.longitude">
        <section class="title">
          <div class="icon"><i class="fas fa-compass" aria-hidden="true"></i></div>
          <div class="content">
            <div>{{selectedStation.data.adresse[0]}}</div>
            <div>{{selectedStation.data.ville[0]}}</div>
          </div>
        </section>
        <section class="title">
          <div class="icon"><i class="fas fa-road" aria-hidden="true"></i></div>
          <div class="content" v-if="selectedStation.data.distances">
            <div>{{selectedStation.data.place_name}}</div>
            <div>{{humanize(selectedStation.data.distances.duration)}}</div>
            <div>{{(selectedStation.data.distances.distance / 1000).toFixed(3)}} km</div>
          </div>
          <div class="content" v-else>
            <i class="fas fa-spinner" aria-hidden="true"></i>
          </div>
        </section>
        <section class="prices" v-if="selectedStation.data.prix">
          <div class="icon"><i class="fas fa-money-bill" aria-hidden="true"></i></div>
          <div class="content">
            <div v-if="hasThisFuel(selectedStation)">
              <div v-for="price of selectedStationPrices" :key="'selected-' + price.$.nom">
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
          <div class="icon"><i class="fas fa-clock" aria-hidden="true"></i></div>
          <div class="content">
            <div class="automate" v-if="selectedStation.data.horaires[0].$['automate-24-24']">
              24h/24
            </div>
            <div class="horaire" v-for="(day, i) of selectedStationDays" :key="day+'-'+i">
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
import {debounce} from 'debounce'
import axios from 'axios'
import moment from 'moment'
import MapVue from '../components/Map.vue';
import PromiseB from 'bluebird'
import Stations from '../services/stations'
import position from '../services/position'
moment.locale('fr')

export default {
  name: 'Home',
  components: {
    mapCmp: MapVue
  },
  data() {
    return {
      debounce,
      latitude: 0,
      longitude: 0,
      selectedStation: null,
      stations: Stations.stations,
      Stations,
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
    },
    selectedStationDays() {
      return this.selectedStation.data.horaires[0].jour.filter(day => day.horaire)
    },
    selectedStationPrices() {
      return this.selectedStation.data.prix.filter(price => price.$.nom === this.carburant || this.carburant === 'All')
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
    async moveMap() {
      await Stations.getGasoilAround()
      this.stations = Stations.stations
    },
    hasThisFuel(selectedStation) {
      return selectedStation.data.prix.reduce((res, price) => {
        if(!res && price.$.nom === this.carburant || this.carburant === 'All') res = true
        return res
      }, false)
    },
    async markerClick(ev) {
      this.selectedStation = this.stations.filter(s => s.data.$.latitude === ev.latlng.lat && s.data.$.longitude === ev.latlng.lng).pop()
      const [{data: placeName}, {data: distances}] = await PromiseB.all([
        axios.get(`${process.env.VUE_APP_API_URL}/station-name/${this.selectedStation.data.$.latitude}/${this.selectedStation.data.$.longitude}`),
        axios.get(`${process.env.VUE_APP_API_URL}/distances/${this.selectedStation.data.$.latitude}/${this.selectedStation.data.$.longitude}/${position.currentMarkerCenter[0]}/${position.currentMarkerCenter[1]}`)
      ])
      if(this.selectedStation) {
        this.$set(this.selectedStation.data, 'place_name',  placeName)
        this.$set(this.selectedStation.data, 'distances',  distances)
      }
    },
    humanize(sec) {
      return moment.duration(sec, "seconds").humanize();
    },
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped lang="scss">
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
