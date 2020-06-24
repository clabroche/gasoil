import position from '../services/position'
import axios from 'axios'

export default {
  stations: [],
  prices: [],
  carburant: 'All',
  carburants: [
    { id: 'All', label: 'Tous'}, 
    { id: 'Gazole', label: 'Gazole'},
    {id: 'GPLc', label: 'GPLc'},
    {id: 'E10', label: 'E10'},
    {id: 'E85', label: 'E85'},
    {id: 'SP95', label: 'SP95'},
    {id: 'SP98', label: 'SP98'},
  ],

  setStations(stations) {
    this.stations.length = 0
    this.stations = this.stations.concat(stations)
    this.prices = getPrices(stations, this.carburant)
  },
  async getGasoilAround() {
    const lat = position.center[0].toFixed(6)
    const lng = position.center[1].toFixed(6)
    const { data } = await axios.get(`${process.env.VUE_APP_API_URL}/sort/${lat}/${lng}`)
    const stations = data.map(station => {
      return { data: station }
    })
    this.setStations(stations)
  },
  setCarburant(carburant) {
    this.carburant = carburant
    this.prices = getPrices(this.stations, carburant)
  }
}

function getPrices(stations, carburant) {
  return stations.map(station => {
    const prices = station.data.prix
    if (!prices) return 10000
    if (carburant !== "All") {
      return getPriceFromCarburant(prices, carburant)
    } else {
      return prices[0].$.valeur
    }
  }).sort()
}
function getPriceFromCarburant(prices, carburant) {
  const price = prices.filter(p => p.$ && p.$.nom === carburant)[0]
  return price
    ? price.$.valeur
    : { $: { valeur: 10000 } }
}

