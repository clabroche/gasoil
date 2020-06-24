<template>
  <div class="overlay">
      <div>Type de carburant:</div>
      <select :value="Stations.carburant" @input="Stations.setCarburant($event.target.value)">
        <option :value="carburant.id" v-for="carburant of Stations.carburants" :key="carburant.id">{{carburant.label}}</option>
      </select>
    </div>
</template>

<script>
import Stations from '../services/stations'
export default {
  data() {
    return {
      Stations
    }
  }
}
</script>

<style lang="scss" scoped>
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
</style>