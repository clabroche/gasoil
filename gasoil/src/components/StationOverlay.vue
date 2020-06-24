<template>
  <transition name="fade">
    <div class="station" v-if="station" :key="station.data.$.latitude + station.data.$.longitude">
      <section class="title">
        <div class="icon"><i class="fas fa-compass" aria-hidden="true"></i></div>
        <div class="content">
          <div>{{station.data.adresse[0]}}</div>
          <div>{{station.data.ville[0]}}</div>
        </div>
      </section>
      <section class="title">
        <div class="icon"><i class="fas fa-road" aria-hidden="true"></i></div>
        <div class="content" v-if="station.data.distances">
          <div>{{station.data.place_name}}</div>
          <div>{{humanize(station.data.distances.duration)}}</div>
          <div>{{(station.data.distances.distance / 1000).toFixed(3)}} km</div>
        </div>
        <div class="content" v-else>
          <i class="fas fa-spinner" aria-hidden="true"></i>
        </div>
      </section>
      <section class="prices" v-if="station.data.prix">
        <div class="icon"><i class="fas fa-money-bill" aria-hidden="true"></i></div>
        <div class="content">
          <div v-if="hasThisFuel(station)">
            <div v-for="price of stationPrices" :key="'selected-' + price.$.nom">
              <span class="label">
                {{price.$.nom}}
              </span>
              {{price.$.valeur}} €
            </div>
          </div>
          <div v-else>Cette pompe ne fait pas de {{carburant}}</div>
        </div>
      </section>
      <section class="horaires" v-if="station.data.horaires">
        <div class="icon"><i class="fas fa-clock" aria-hidden="true"></i></div>
        <div class="content">
          <div class="automate" v-if="station.data.horaires[0].$['automate-24-24']">
            24h/24
          </div>
          <div class="horaire" v-for="(day, i) of stationDays" :key="day+'-'+i">
            <span class="label">
              {{day.$.nom}}
            </span>
            {{day.horaire[0].$.ouverture}} - {{day.horaire[0].$.fermeture}}
          </div>
        </div>
      </section>
    </div>
  </transition>
</template>

<script>
import moment from 'moment'
import Stations from '../services/stations'
export default {
  props: {
    station: {default: null}
  },
  computed: {
    stationDays() {
      return this.station.data.horaires[0].jour.filter(day => day.horaire)
    },
    stationPrices() {
      return this.station.data.prix.filter(price => price.$.nom === Stations.carburant || Stations.carburant === 'All')
    }
  },
  methods: {
    hasThisFuel(selectedStation) {
      return selectedStation.data.prix.reduce((res, price) => {
        if(!res && price.$.nom === Stations.carburant || Stations.carburant === 'All') res = true
        return res
      }, false)
    },
    humanize(sec) {
      return moment.duration(sec, "seconds").humanize();
    },
  }
}
</script>

<style lang="scss" scoped>
$maxwidth: 600px;
.station {
  z-index: 1;
  position: fixed;
  max-width: $maxwidth;
  right: calc(50% - #{$maxwidth / 2});
  bottom:0;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
  background-color: #3c3b42;
  border-top: 4px solid #3d7cc6;
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  box-shadow: 0px 1px 4px 5px #4a4a4a;
  max-height: 40vh;
  overflow: auto;
  @media (max-width: $maxwidth) { 
    & {
      right: 0; 
      width: 100%;
    }
  } 
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
</style>