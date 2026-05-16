import { useState } from 'react'
import { addStep } from '../api'
import StepWarning from '../components/StepWarning'
import { useNavigate } from 'react-router-dom'

const PROCEDURE_CHECKS = [
  'Procedure site marked and verified',
  'Surgical timeout / WHO checklist completed',
  'Patient allergy flag acknowledged',
  'Sterile technique confirmed',
  'Informed consent document signed'
]

const REQUIRED_CHECKS = [
  'Patient allergy flag acknowledged',
  'Informed consent document signed'
]

export default function Procedure({ visitId, performedBy, allergies = [] }) {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    procedure_name: '',
    procedure_type: 'Minor',
    surgeon: '',
    anesthesia: 'None',
    instruments: '',
    duration_minutes: '',
    complications: '',
    clinical_notes: '',
    consent_obtained: false,
    consent_notes: ''
  })
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState(null)

  function toggleCheck(item) {
    setChecks(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item])
  }

  async function saveProcedure() {
    setLoading(true)
    await addStep({
      visit_id: visitId,
      step_type: 'procedure',
      performed_by: performedBy,
      data: { ...form, checks_completed: checks }
    })
    setLoading(false)
    setSaved(true)
  }

  async function handleSubmit() {
    const missed = []
    if (!form.procedure_name) missed.push('Procedure name')
    if (!form.consent_obtained) missed.push('Procedural consent')
    REQUIRED_CHECKS.forEach(c => { if (!checks.includes(c)) missed.push(c) })

    if (missed.length > 0) {
      setWarning(missed)
      return
    }
    await saveProcedure()
  }

  if (saved) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="text-green-600 text-4xl mb-3">✓</div>
      <h2 className="text-lg font-medium text-gray-900">Procedure recorded</h2>
      <p className="text-gray-500 text-sm mt-1">Timestamped and saved</p>
      <button onClick={() => navigate('/prescription')}
        className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
        Next: Prescription →
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Procedure</h2>

      {allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-xs text-red-800 font-medium">
          ⚠ Allergy on file: {allergies.join(', ')}
        </div>
      )}

      <div className="mb-4">
        <label className="text-xs text-gray-500">
          Procedure performed <span className="text-red-400">*</span>
        </label>
        <input
          className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. Incision and drainage of abscess"
          value={form.procedure_name}
          onChange={e => setForm({ ...form, procedure_name: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-xs text-gray-500">Type</label>
          <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={form.procedure_type}
            onChange={e => setForm({ ...form, procedure_type: e.target.value })}>
            <option>Minor</option>
            <option>Major</option>
            <option>Diagnostic</option>
            <option>Therapeutic</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Anaesthesia</label>
          <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            value={form.anesthesia}
            onChange={e => setForm({ ...form, anesthesia: e.target.value })}>
            <option>None</option>
            <option>Local</option>
            <option>IV Sedation</option>
            <option>General</option>
            <option>Spinal</option>
            <option>Epidural</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-gray-500">Surgeon / performed by</label>
          <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="Dr. ..."
            value={form.surgeon}
            onChange={e => setForm({ ...form, surgeon: e.target.value })} />
        </div>
        <div>
          <label className="text-xs text-gray-500">Duration (mins)</label>
          <input type="number" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
            placeholder="30"
            value={form.duration_minutes}
            onChange={e => setForm({ ...form, duration_minutes: e.target.value })} />
        </div>
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Instruments / materials used</label>
        <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. Scalpel no. 11, suture 3-0 vicryl"
          value={form.instruments}
          onChange={e => setForm({ ...form, instruments: e.target.value })} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Complications / intraoperative findings</label>
        <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          rows={2}
          placeholder="None / describe any complications"
          value={form.complications}
          onChange={e => setForm({ ...form, complications: e.target.value })} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Procedural notes</label>
        <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          rows={3}
          placeholder="Post-procedure care, wound closure, dressings..."
          value={form.clinical_notes}
          onChange={e => setForm({ ...form, clinical_notes: e.target.value })} />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-medium text-blue-800 mb-2">
          Procedural consent <span className="text-red-400">*</span>
        </h3>
        <div onClick={() => setForm({ ...form, consent_obtained: !form.consent_obtained })}
          className="flex items-center gap-3 cursor-pointer mb-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs flex-shrink-0 transition-all ${
            form.consent_obtained ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'
          }`}>
            {form.consent_obtained ? '✓' : ''}
          </div>
          <span className="text-xs text-blue-800">
            Patient consented to this procedure with risks and alternatives explained.
          </span>
        </div>
        {form.consent_obtained && (
          <input
            className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs bg-white"
            placeholder="Consent notes (optional)"
            value={form.consent_notes}
            onChange={e => setForm({ ...form, consent_notes: e.target.value })}
          />
        )}
      </div>

      <h3 className="text-sm font-medium text-gray-700 mb-3">Procedure checklist</h3>
      <p className="text-xs text-gray-400 mb-3">
        <span className="text-red-400">*</span> marked items are required to proceed
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {PROCEDURE_CHECKS.map(item => (
          <div key={item} onClick={() => toggleCheck(item)}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700">
            <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
              checks.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {checks.includes(item) ? '✓' : ''}
            </div>
            {item}
            {REQUIRED_CHECKS.includes(item) && <span className="text-red-400 ml-1 text-xs">*</span>}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
        {loading ? 'Saving...' : 'Save procedure →'}
      </button>

      {warning && (
        <StepWarning
          visitId={visitId}
          stepType="procedure"
          missedFields={warning}
          dismissedBy={performedBy}
          onBack={() => setWarning(null)}
          onDismiss={() => { setWarning(null); saveProcedure() }}
        />
      )}
    </div>
  )
}
