const express = require('express')
const cors = require('cors')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3001

app.use(cors())
app.use(express.json())

app.use('/api/patients', require('./routes/patients'))
app.use('/api/visits', require('./routes/visits'))
app.use('/api/steps', require('./routes/steps'))
app.use('/api/transcribe', require('./routes/transcribe'))
app.use('/api/soap', require('./routes/soap'))
app.get('/', (req, res) => {
  res.json({ message: 'MedTrace API running' })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
