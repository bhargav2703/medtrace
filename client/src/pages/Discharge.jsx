import { useState } from 'react'
import { addStep } from '../api'
import StepWarning from '../components/StepWarning'
import { useNavigate } from 'react-router-dom'

const DISCHARGE_CHECKS = [
  'Discharge summary explained to patient / guardian',
  'Prescription handed over',
  'Follow-up appointment scheduled or advised',
  'Emergency contact instructions given',
  'Patient identity verified on discharge'
]
const REQUIRED_DISCHARGE_CHECKS = [
  'Discharge summary explained to patient / guardian',
  'Patient identity verified on discharge'
]

export default function Discharge({ visitId, performedBy, allergies = [] }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    discharge_condition: 'Stable',
    discharge_summary: '',
    followup_date: '',
    followup_instructions: '',
    activity_restrictions: '',
    diet_instructions: '',
    patient_acknowledged: false
  })
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState(null)

  function toggleCheck(item) {
    setChecks(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item])
  }

  async function saveDischarge() {
    setLoading(true)
    await addStep({
      visit_id: visitId,
      step_type: 'discharge',
      performed_by: performedBy,
      data: { ...form, checks_completed: checks }
    })
    setLoading(false)
    setSaved(true)
  }

  async function handleSubmit() {
    const missed = []
    if (!form.discharge_summary) missed.push('Discharge summary')
    if (!form.patient_acknowledged) missed.push('Patient acknowledgement')
    REQUIRED_DISCHARGE_CHECKS.forEach(c => { if (!checks.includes(c)) missed.push(c) })

    if (missed.length > 0) {
      setWarning(missed)
      return
    }
    await saveDischarge()
  }

  if (saved) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="text-green-600 text-4xl mb-3">✓</div>
      <h2 className="text-lg font-medium text-gray-900">Patient discharged</h2>
      <p className="text-gray-500 text-sm mt-1">Visit complete — all records saved</p>
      <button onClick={() => navigate('/legal-vault')}
        className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
        View Legal Vault →
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Discharge</h2>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Discharge condition <span className="text-red-400">*</span></label>
        <div className="flex gap-2 mt-2 flex-wrap items-center">
          {['Stable', 'Guarded', 'Critical', 'LAMA'].map(c => (
            <button key={c} onClick={() => setForm({ ...form, discharge_condition: c })}
              className={`px-4 py-2 rounded-lg text-xs border transition-all ${
                form.discharge_condition === c
                  ? c === 'Stable' ? 'bg-green-500 border-green-500 text-white'
                    : c === 'LAMA' ? 'bg-red-500 border-red-500 text-white'
                    : 'bg-amber-500 border-amber-500 text-white'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}>
              {c}
            </button>
          ))}
          <span className="text-xs text-gray-400">LAMA = Left Against Medical Advice</span>
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">
          Discharge summary <span className="text-red-400">*</span>
        </label>
        <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          rows={4}
          placeholder="Clinical course, procedures performed, response to treatment..."
          value={form.discharge_summary}
          onChange={e => setForm({ ...form, discharge_summary: e.target.value })} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500">Follow-up date</label>
          <input type="date" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={form.followup_date}
            onChange={e => setForm({ ...form, followup_date: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Follow-up instructions</label>
          <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="e.g. Review with X-ray report"
            value={form.followup_instructions}
            onChange={e => setForm({ ...form, followup_instructions: e.target.value })} />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Activity restrictions</label>
        <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. Bed rest for 3 days, no heavy lifting for 2 weeks"
          value={form.activity_restrictions}
          onChange={e => setForm({ ...form, activity_restrictions: e.target.value })} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Diet instructions</label>
        <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. Low salt diet, increase fluid intake"
          value={form.diet_instructions}
          onChange={e => setForm({ ...form, diet_instructions: e.target.value })} />
      </div>

      <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-medium text-green-800 mb-2">
          Patient acknowledgement <span className="text-red-400">*</span>
        </h3>
        <div onClick={() => setForm({ ...form, patient_acknowledged: !form.patient_acknowledged })}
          className="flex items-center gap-3 cursor-pointer">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs flex-shrink-0 transition-all ${
            form.patient_acknowledged ? 'bg-green-600 border-green-600 text-white' : 'border-green-400'
          }`}>
            {form.patient_acknowledged ? '✓' : ''}
          </div>
          <span className="text-xs text-green-800">
            Patient / guardian has received and understood the discharge instructions.
          </span>
        </div>
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Discharge checklist</h3>
      <p className="text-xs text-gray-400 mb-3">
        <span className="text-red-400">*</span> marked items are required to proceed
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {DISCHARGE_CHECKS.map(item => (
          <div key={item} onClick={() => toggleCheck(item)}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700">
            <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
              checks.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {checks.includes(item) ? '✓' : ''}
            </div>
            {item}
            {REQUIRED_DISCHARGE_CHECKS.includes(item) && <span className="text-red-400 ml-1 text-xs">*</span>}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
        {loading ? 'Saving...' : 'Complete discharge →'}
      </button>

      {warning && (
        <StepWarning
          visitId={visitId}
          stepType="discharge"
          missedFields={warning}
          dismissedBy={performedBy}
          onBack={() => setWarning(null)}
          onDismiss={() => { setWarning(null); saveDischarge() }}
        />
      )}
    </div>
  )
}
