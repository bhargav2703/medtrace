const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

// Get all patients
router.get('/', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Get single patient with full visit history
router.get('/:id', async (req, res) => {
  const { data, error } = await supabase
    .from('patients')
    .select(`
      *,
      visits (
        *,
        visit_steps (*)
      )
    `)
    .eq('id', req.params.id)
    .single()
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Create new patient
router.post('/', async (req, res) => {
  const { name, age, gender, phone, allergies, known_conditions, current_medications, abha_id } = req.body
  
  const { data, error } = await supabase
    .from('patients')
    .insert([{ name, age, gender, phone, allergies, known_conditions, current_medications, abha_id }])
    .select()
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

module.exports = router