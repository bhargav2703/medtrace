const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// Get all visits for a patient
router.get('/patient/:patientId', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .select(`
      *,
      visit_steps (*)
    `)
    .eq('patient_id', req.params.patientId)
    .order('visit_date', { ascending: false })
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Create new visit
router.post('/', async (req, res) => {
  const { patient_id, doctor_id, chief_complaint } = req.body
  
  const { data, error } = await supabase
    .from('visits')
    .insert([{ patient_id, doctor_id, chief_complaint }])
    .select()
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// Full visit summary for Legal Vault (patient + all steps ordered by timestamp)
router.get('/:id/full', async (req, res) => {
  const { data: visit, error: vErr } = await supabase
    .from('visits')
    .select('*, patients (*)')
    .eq('id', req.params.id)
    .single()

  if (vErr) return res.status(400).json({ error: vErr.message })

  const { data: steps, error: sErr } = await supabase
    .from('visit_steps')
    .select('*')
    .eq('visit_id', req.params.id)
    .order('timestamp', { ascending: true })

  if (sErr) return res.status(400).json({ error: sErr.message })

  res.json({ ...visit, visit_steps: steps })
})

// Complete a visit
router.patch('/:id/complete', async (req, res) => {
  const { data, error } = await supabase
    .from('visits')
    .update({ status: 'completed' })
    .eq('id', req.params.id)
    .select()
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

module.exports = router