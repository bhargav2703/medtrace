const express = require('express')
const router = express.Router()
const OpenAI = require('openai')

const SYSTEM_PROMPT = `You are an advanced AI medical scribe specialising in Indian clinical contexts. You will receive a bilingual (Telugu-English) transcript from a doctor-patient consultation. Speakers are labelled Doctor and Patient.

Your task:
1. DENOISE: Remove fillers (um, uh, acha, hmm) and non-clinical chatter.
2. CLINICAL TRANSLATION: Convert all Telugu symptom descriptions into precise English medical terms. Examples: "nalippiga undi" → "malaise/body ache", "kallu thirugutunnayi" → "vertigo/dizziness", "thala noppi" → "cephalalgia/headache", "chest lo bharam" → "precordial heaviness".
3. STRUCTURE: Generate a formal SOAP note in clinical English.
4. SAFETY CHECK: Identify red flag symptoms requiring urgent attention (chest pain, sudden numbness, vision loss, syncope, severe headache, breathlessness, haemoptysis).

Return ONLY a valid JSON object — no markdown, no extra text:
{
  "subjective": "Chief complaint and patient-reported symptoms in clinical English",
  "objective": "Vitals, examination findings, or observations mentioned",
  "assessment": "Clinical impression / working diagnosis in 1-2 sentences",
  "plan": "Investigations ordered, treatments, follow-up instructions",
  "red_flags": [],
  "clinical_entities": [{ "term": "English medical term", "original": "Telugu/colloquial phrase" }],
  "icd_codes": []
}`

router.post('/', async (req, res) => {
  const { transcript, diarized } = req.body
  if (!transcript) return res.status(400).json({ error: 'transcript is required' })

  if (!process.env.GROQ_API_KEY) {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured in server/.env' })
  }

  let transcriptText = transcript
  if (diarized && diarized.length > 0) {
    transcriptText = diarized
      .map(seg => `${seg.speaker_id === 'SPEAKER_0' ? 'Doctor' : 'Patient'}: ${seg.transcript}`)
      .join('\n')
  }

  try {
    const groq = new OpenAI({
      apiKey: process.env.GROQ_API_KEY,
      baseURL: 'https://api.groq.com/openai/v1'
    })

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Transcript:\n\n${transcriptText}` }
      ],
      response_format: { type: 'json_object' }
    })

    const soap = JSON.parse(completion.choices[0].message.content)
    res.json(soap)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
