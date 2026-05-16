import { useState } from 'react'
import { addStep } from '../api'
import StepWarning from '../components/StepWarning'
import { useNavigate } from 'react-router-dom'

const FREQ_OPTIONS = [
  'Once daily', 'Twice daily', 'Three times daily', 'Four times daily',
  'Every 6 hours', 'Every 8 hours', 'As needed', 'Stat (single dose)'
]
const ROUTE_OPTIONS = ['Oral', 'IV', 'IM', 'Topical', 'Inhaled', 'Sublingual', 'Nasal', 'Ophthalmic', 'Rectal']

const RX_CHECKS = [
  'Drug allergy cross-checked against patient record',
  'Drug interactions verified',
  'Dosage appropriate for age / weight / renal function',
  'Patient counseled on side effects',
  'Pharmacy handover note completed'
]
const REQUIRED_RX_CHECKS = ['Drug allergy cross-checked against patient record']

function emptyDrug() {
  return { name: '', dosage: '', frequency: 'Twice daily', route: 'Oral', duration: '', instructions: '' }
}

export default function Prescription({ visitId, performedBy, allergies = [] }) {
  const navigate = useNavigate()
  const [drugs, setDrugs] = useState([emptyDrug()])
  const [checks, setChecks] = useState([])
  const [dispensingNotes, setDispensingNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState(null)

  function toggleCheck(item) {
    setChecks(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item])
  }

  function updateDrug(index, field, value) {
    setDrugs(d => d.map((drug, i) => i === index ? { ...drug, [field]: value } : drug))
  }

  async function savePrescription() {
    setLoading(true)
    await addStep({
      visit_id: visitId,
      step_type: 'prescription',
      performed_by: performedBy,
      data: {
        drugs: drugs.filter(d => d.name),
        checks_completed: checks,
        dispensing_notes: dispensingNotes
      }
    })
    setLoading(false)
    setSaved(true)
  }

  async function handleSubmit() {
    const missed = []
    const validDrugs = drugs.filter(d => d.name)
    if (validDrugs.length === 0) missed.push('At least one drug prescribed')
    drugs.filter(d => d.name && !d.dosage).forEach(d => missed.push(`Dosage for ${d.name}`))
    REQUIRED_RX_CHECKS.forEach(c => { if (!checks.includes(c)) missed.push(c) })

    if (missed.length > 0) {
      setWarning(missed)
      return
    }
    await savePrescription()
  }

  if (saved) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="text-green-600 text-4xl mb-3">✓</div>
      <h2 className="text-lg font-medium text-gray-900">Prescription recorded</h2>
      <p className="text-gray-500 text-sm mt-1">Timestamped and saved</p>
      <button onClick={() => navigate('/discharge')}
        className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
        Next: Discharge →
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Prescription</h2>

      {allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-xs text-red-800 font-medium">
          ⚠ Allergy on file: {allergies.join(', ')}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-700">
            Drugs prescribed <span className="text-red-400">*</span>
          </h3>
          <button onClick={() => setDrugs(d => [...d, emptyDrug()])}
            className="text-xs text-green-700 border border-green-200 px-3 py-1 rounded-lg hover:bg-green-50">
            + Add drug
          </button>
        </div>

        {drugs.map((drug, i) => (
          <div key={i} className="border border-gray-200 rounded-xl p-4 mb-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-gray-400 font-medium">Drug {i + 1}</span>
              {drugs.length > 1 && (
                <button onClick={() => setDrugs(d => d.filter((_, j) => j !== i))}
                  className="text-xs text-red-400 hover:text-red-600">
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="text-xs text-gray-500">
                  Drug name <span className="text-red-400">*</span>
                </label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. Amoxicillin"
                  value={drug.name}
                  onChange={e => updateDrug(i, 'name', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">
                  Dosage <span className="text-red-400">*</span>
                </label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. 500mg"
                  value={drug.dosage}
                  onChange={e => updateDrug(i, 'dosage', e.target.value)} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Frequency</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={drug.frequency}
                  onChange={e => updateDrug(i, 'frequency', e.target.value)}>
                  {FREQ_OPTIONS.map(f => <option key={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Route</label>
                <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  value={drug.route}
                  onChange={e => updateDrug(i, 'route', e.target.value)}>
                  {ROUTE_OPTIONS.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500">Duration</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. 5 days"
                  value={drug.duration}
                  onChange={e => updateDrug(i, 'duration', e.target.value)} />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-gray-500">Instructions</label>
                <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                  placeholder="e.g. Take after meals, avoid alcohol"
                  value={drug.instructions}
                  onChange={e => updateDrug(i, 'instructions', e.target.value)} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Dispensing / pharmacy notes</label>
        <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          rows={2}
          placeholder="Any special dispensing instructions for pharmacy"
          value={dispensingNotes}
          onChange={e => setDispensingNotes(e.target.value)} />
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Prescription checklist</h3>
      <p className="text-xs text-gray-400 mb-3">
        <span className="text-red-400">*</span> marked items are required to proceed
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {RX_CHECKS.map(item => (
          <div key={item} onClick={() => toggleCheck(item)}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700">
            <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
              checks.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {checks.includes(item) ? '✓' : ''}
            </div>
            {item}
            {REQUIRED_RX_CHECKS.includes(item) && <span className="text-red-400 ml-1 text-xs">*</span>}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
        {loading ? 'Saving...' : 'Save prescription →'}
      </button>

      {warning && (
        <StepWarning
          visitId={visitId}
          stepType="prescription"
          missedFields={warning}
          dismissedBy={performedBy}
          onBack={() => setWarning(null)}
          onDismiss={() => { setWarning(null); savePrescription() }}
        />
      )}
    </div>
  )
}
