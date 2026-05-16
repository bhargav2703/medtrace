const express = require('express')
const router = express.Router()
const multer = require('multer')
const fs = require('fs')

const upload = multer({ dest: 'uploads/' })

router.post('/', upload.single('file'), async (req, res) => {
  if (!process.env.SARVAM_API_KEY) {
    return res.status(503).json({ error: 'SARVAM_API_KEY not configured in server/.env' })
  }

  const filePath = req.file.path
  try {
    const fileBuffer = fs.readFileSync(filePath)
    const mimeType = (req.file.mimetype || 'audio/webm').split(';')[0].trim()
    const audioFile = new File([fileBuffer], 'recording.webm', { type: mimeType })

    const language = req.body.language || 'unknown'

    // te-IN-translate = Telugu audio → English text via Sarvam translate mode
    const isTranslate = language === 'te-IN-translate'
    const mode = isTranslate ? 'translate' : language === 'en-IN' ? 'transcribe' : 'codemix'
    const langCode = isTranslate ? 'te-IN' : language === 'unknown' ? null : language

    const form = new FormData()
    form.append('file', audioFile)
    form.append('model', 'saaras:v3')
    form.append('mode', mode)
    if (langCode) form.append('language_code', langCode)

    const response = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: { 'api-subscription-key': process.env.SARVAM_API_KEY },
      body: form
    })

    const data = await response.json()
    fs.unlinkSync(filePath)

    if (!response.ok) {
      console.error('Sarvam error:', JSON.stringify(data))
      return res.status(response.status).json({
        error: data.message || data.error || 'Sarvam transcription failed',
        detail: data
      })
    }

    res.json({
      text: data.transcript,
      diarized: data.diarized_transcript || []
    })
  } catch (err) {
    try { fs.unlinkSync(filePath) } catch {}
    console.error('Transcribe error:', err.message)
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
