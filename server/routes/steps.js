const express = require('express')
const router = express.Router()
const supabase = require('../config/supabase')

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(value) {
  return typeof value === 'string' && UUID_RE.test(value)
}

// Get all steps for a visit
router.get('/visit/:visitId', async (req, res) => {
  const { data, error } = await supabase
    .from('visit_steps')
    .select('*')
    .eq('visit_id', req.params.visitId)
    .order('timestamp', { ascending: true })
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data)
})

// Add a step to a visit
router.post('/', async (req, res) => {
  const { visit_id, step_type, performed_by, data: stepData } = req.body
  
  const { data, error } = await supabase
    .from('visit_steps')
    .insert([{ visit_id, step_type, performed_by, data: stepData }])
    .select()
  
  if (error) return res.status(400).json({ error: error.message })
  res.json(data[0])
})

// Log a dismissed warning (audit_log: user_id/record_id are uuid; full context in note)
router.post('/dismissal', async (req, res) => {
  const { visit_id, step_type, missed_fields, dismissed_by, reason } = req.body

  const note = JSON.stringify({
    step_type,
    missed_fields,
    reason,
    visit_id: visit_id ?? null,
    dismissed_by: dismissed_by ?? null,
  })

  const row = {
    action: 'WARNING_DISMISSED',
    table_name: 'visit_steps',
    note,
  }
  // Do not set user_id unless it exists in users(); dismissed_by is always in note JSON.
  if (isUuid(visit_id)) row.record_id = visit_id

  const { data, error } = await supabase.from('audit_log').insert([row]).select()

  if (error) {
    console.error('audit_log insert failed:', error.message, { body: req.body })
    return res.status(400).json({ error: error.message })
  }
  res.json(data[0])
})

// Lock a step (makes it immutable)
router.patch('/:id/lock', async (req, res) => {
    const { data, error } = await supabase
      .from('visit_steps')
      .update({ is_locked: true })
      .eq('id', req.params.id)
      .select()
    
    if (error) return res.status(400).json({ error: error.message })
    res.json(data[0])
  })
module.exports = router