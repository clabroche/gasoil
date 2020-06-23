const path = require('path')
let BASE 
BASE = "gasoil"
const stack = [
  {
    label: 'Front',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd: path.resolve(__dirname, 'gasoil'),
      env: Object.assign({
        VUE_APP_API_URL: "http://localhost:3006",
      }, process.env)
    }
  },
  {
    label: 'Server',
    spawnCmd: 'npm',
    spawnArgs: ['run', 'serve'],
    spawnOptions: {
      cwd:  path.resolve(__dirname, 'server'),
      env: Object.assign({
        PORT:"3006",
        mongoDbURL:`mongodb://root:123456@localhost:27017/${BASE}?authSource=admin`,
      }, process.env)
    }
  },
]

module.exports = stack
