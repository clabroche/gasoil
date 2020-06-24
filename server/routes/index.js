var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/sort/:latitude/:longitude', async function(req, res, next) {
  const {latitude, longitude} = req.params
  const stations = sortListByCoordinate({latitude:+latitude, longitude:+longitude}).slice(0, 40)
  res.json(stations)
});

router.get('/station-name/:latitude/:longitude', async function(req, res, next) {
  const {latitude, longitude} = req.params
  let station = pdvList.filter(pdv => +pdv.$.latitude === +latitude && +pdv.$.longitude === +longitude).pop()
  const stationName = await getStationName(station)
  res.json(stationName)
})
router.get('/distances/:latitude/:longitude/:currentLatitude/:currentLongitude', async function(req, res, next) {
  const {latitude, longitude, currentLatitude, currentLongitude} = req.params
  let station = pdvList.filter(pdv => +pdv.$.latitude === +latitude && +pdv.$.longitude === +longitude).pop()
  const duration = await getStationDistance([+currentLatitude, +currentLongitude], [+station.$.latitude, +station.$.longitude])
  res.json(duration)
})

const JsZip = require('jszip')
const url = 'http://donnees.roulez-eco.fr/opendata/instantane'
const {exec} = require('child_process')
var xmlParser = require('xml2js').parseStringPromise;
const sortByDistance = require('sort-by-distance')
const fs = require('fs')
const PromiseB = require('bluebird')
const path = require('path')
/**@type {PdvList[]} */
let pdvList = []
/**@type {Coordinate[]} */
let coordinates = []
;(async _ => { 
  await fetchAndUpdateGasoil()
  setInterval(fetchAndUpdateGasoil, 10000000);
})().catch(console.error)

var MapboxClient = require('mapbox');

let client
try {
  // @ts-ignore
  client = new MapboxClient(fs.readFileSync(path.resolve(__dirname, '..', 'mapbox.key'), 'utf-8').trim())
} catch (e) {
  console.error('Please create a file mapbox.key with an apikey for mapbox into it')
  process.exit(0)
}

async function getStationName(station) {
  const places = await reverse(station.$.latitude, station.$.longitude)
  let geo = places.features.filter(place=>
    place.properties.category && (place.properties.category.includes('gas') || place.properties.category.includes('shop'))
  ).pop() || places.features[0]
  return geo && geo.text ? geo.text : ''
}

async function getStationDistance(currentPosition, point) {
  const directions = await getDirections(currentPosition, point)
  const {duration, distance} = directions.routes[0]
  return {
    duration, distance
  }
}

async function getDirections(currentPosition, point) {
  return new Promise((resolve, reject) => {
    client.getDirections([
      {latitude: +currentPosition[0], longitude: +currentPosition[1]},
      {latitude: +point[0], longitude: +point[1]},
    ], (err, res) => {
      resolve(res)
    })
  });
}
async function reverse(latitude, longitude) {
  return new Promise((resolve, reject) => {
    client.geocodeReverse({
      latitude, longitude
    }, {
      types:'poi'
    }, (err, data, res) => {
      resolve(data)
    })
    
  });
}
async function fetchAndUpdateGasoil() {
  console.log('=> Get Gasoil')
  await bash('wget -O gasoil.zip ' + url)
  console.log('=> Gasoil downloaded')
  await getJSONfromZip()
  coordinates = []
  await PromiseB.map(pdvList, async (pdv, i) => {
    pdv.$.index = i
    pdv.$.latitude = +pdv.$.latitude / 100000
    pdv.$.longitude = +pdv.$.longitude / 100000
    coordinates.push(pdv.$)
  })
  console.log('=> Gasoil parsed')
}
async function getJSONfromZip() {
  return new JsZip.external.Promise(function (resolve, reject) {
    fs.readFile("gasoil.zip", function(err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  }).then(async function (data) {
    const zip = await JsZip.loadAsync(data)
    const xml = await zip.files['PrixCarburants_instantane.xml'].async('text')
    const json = (await xmlParser(xml))
    pdvList = json.pdv_liste.pdv
  })
}
function sortListByCoordinate(currentLocation) {
  const opts = {
    yName: 'latitude',
    xName: 'longitude'
  }
  let coordSortedDistance = sortByDistance(currentLocation, coordinates , opts)
  if(coordSortedDistance instanceof Error) {
    coordSortedDistance = []
  }
  const sortedDistance = [] 
  coordSortedDistance.forEach(coord => {
    sortedDistance.push(pdvList[coord.index])
  })
  return sortedDistance
}
function bash(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (err,stdout,stderr) => {
      if(err) return reject(err)
      resolve(stdout)
    })
  });
}

/**
 * @typedef PdvList
 * @type {Object}
 * @property {Coordinate} $
 * @property {String[]} addresse
 * @property {String[]} ville
 * @property {Horaires[]} horaires
 * @property {Service[]} services
 * @property {Price[]} prix
 */

/**
 * @typedef Coordinate
 * @type {Object}
 * @property {String} id
 * @property {Number} latitude
 * @property {Number} longitude
 * @property {String} cp
 * @property {String} pop
 * @property {Number} index Position in list
 */

/**
 * @typedef Horaires
 * @type {Object}
 * @property {HorairesOptions} $
 * @property {Day[]} jour
 */

/**
 * @typedef HorairesOptions
 * @type {Object}
 * @property {String} automate-24-24
 */

/**
 * @typedef Day
 * @type {Object}
 * @property {DayOptions} $
 * @property {DayHoraire[]} horaire
 */

/**
 * @typedef DayOptions
 * @type {Object}
 * @property {String} id
 * @property {String} nom
 * @property {String} ferme
 */


/**
 * @typedef DayHoraire
 * @type {Object}
 * @property {DayHoraireOptions} $
 */


/**
 * @typedef DayHoraireOptions
 * @type {Object}
 * @property {String} ouverture
 * @property {String} fermeture
 */


/**
 * @typedef Service
 * @type {Object}
 * @property {String[]} service
 */



/**
 * @typedef Price
 * @type {Object}
 * @property {PriceOptions} $
 */
/**
 * @typedef PriceOptions
 * @type {Object}
 * @property {String} nom
 * @property {String} id
 * @property {String} maj
 * @property {String} valeur
 */



module.exports = router;
