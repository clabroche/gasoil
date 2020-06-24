<template>
  <l-map ref="myMap" class="map" :zoom="position.zoom" @click="selectStation(null)" @move="moveMap">
    <l-tile-layer :url="tileUrl" :attribution='attribution'></l-tile-layer>
    <l-marker :latLng="position.currentMarkerCenter" :icon="defaultIcon"></l-marker>
    <l-marker
      ref="marker"
      v-for="(station, i) of stations"
      :latLng="[station.data.$.latitude,station.data.$.longitude]"
      :icon="getIconForStation(station)"
      :key="'station-' + i"
      @click="markerClick"
    >
      <l-tooltip class="popup" :options="{direction:'top', offset:[0,-50]}">
        <div class="prices" v-if="station.data.prix">
          <div v-for="price of stationPrices(station)" :key="'station-price' + price.$.nom">
            <span class="label">
              {{price.$.nom}}
            </span>
            {{price.$.valeur}} €
          </div>
        </div>
      </l-tooltip>
    </l-marker>
  </l-map>
</template>

<script>
import {LMap, LTileLayer, LMarker, LTooltip } from 'vue2-leaflet';
import {debounce} from 'debounce'
import L from 'leaflet'
import position  from '../services/position'
import Stations from '../services/stations'
export default {
  components: {
    LMap,
    LTileLayer,
    LMarker,
    LTooltip
  },
  props: {
    stations: {default: []},
    carburant: {default: 'All'}
  },
  data() {
    return {
      position,
      map: null,
      tileUrl: 'https://{s}.tile.osm.org/{z}/{x}/{y}.png',
      attribution: `Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>`,
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
    }
  },
  mounted() {
    this.map = this.$refs.myMap.mapObject
    this.getLocation()
  },
  methods: {
    selectStation(station) {
      this.selectedStation = station; 
      this.$forceUpdate()
    },
    moveMap: debounce(async function(e) {
      if(!e.sourceTarget.getCenter) return
      const newCenter = e.sourceTarget.getCenter()
      position.center = [newCenter.lat, newCenter.lng]
      this.$emit('moveMap', e)
    }, 200),
    async markerClick(ev) {
      this.map.setView([ev.latlng.lat , ev.latlng.lng])
      this.$emit('markerClick', ev)
    },
    async getLocation() {
      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(currentPosition => {
          const lat = currentPosition.coords.latitude
          const lng = currentPosition.coords.longitude
          position.center = [lat, lng]
          position.zoom = 14
          position.currentMarkerCenter = position.center
          this.map.setView(position.center, position.zoom)
          this.moveMap({
            sourceTarget: { getCenter: () => ({lat, lng})}
          })
          resolve()
        });
      });
    },
    stationPrices(station) {
      return station.data.prix.filter(price => price.$.nom === Stations.carburant || Stations.carburant === 'All')
    },
    getIconForStation(station) {
      const prices = station.data.prix
      let price = 10000
      if(prices) {
        if(Stations.carburant !=="All") {
          const priceFound = prices.filter(p => p.$ && p.$.nom === Stations.carburant)[0] || {$:{valeur: null}}
          price = priceFound.$.valeur
          if(!price) return this.redIcon
        } else {
          price = prices[0].$.valeur
        }
        if(Stations.prices.indexOf(price) < 3) {
          return this.greenIcon
        }
        return this.orangeIcon
      }
      return this.redIcon
    },
  }
}
</script>

<style lang="scss" scoped>
.map {
  height: 100vh;
  left: 0;
  top: 0;
  position: fixed;
}
</style>