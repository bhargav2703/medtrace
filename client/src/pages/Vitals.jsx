import { useState } from 'react'
import { addStep } from '../api'
import StepWarning from '../components/StepWarning'
import { useNavigate } from 'react-router-dom'
const VITALS_FLAGS = {
  bp_systolic: { low: 90, high: 140, label: 'Systolic BP' },
  bp_diastolic: { low: 60, high: 90, label: 'Diastolic BP' },
  heart_rate: { low: 60, high: 100, label: 'Heart rate' },
  temperature: { low: 97, high: 99.5, label: 'Temperature' },
  spo2: { low: 95, high: 100, label: 'SpO2' },
  weight: { low: 0, high: 999, label: 'Weight' },
  height: { low: 0, high: 999, label: 'Height' },
}

const REQUIRED_VITALS = {
  bp_systolic: 'Systolic BP',
  bp_diastolic: 'Diastolic BP',
  heart_rate: 'Heart rate',
  temperature: 'Temperature',
  spo2: 'SpO2',
}

const REQUIRED_CHECKS = [
  'Allergy status confirmed with patient verbally',
  'Patient informed of visit recording policy'
]

const RECEPTIONIST_CHECKS = [
  'Allergy status confirmed with patient verbally',
  'Current medications list reviewed',
  'Patient informed of visit recording policy',
  'Previous records / referral letter collected',
  'Insurance / payment mode confirmed'
]

function getStatus(key, value) {
  const f = VITALS_FLAGS[key]
  if (!f || !value) return null
  const v = parseFloat(value)
  if (v < f.low) return 'low'
  if (v > f.high) return 'high'
  return 'normal'
}

export default function Vitals({ visitId, performedBy, allergies = [], onDone }) {
  const navigate = useNavigate()
  const [vitals, setVitals] = useState({
    bp_systolic: '', bp_diastolic: '', heart_rate: '',
    temperature: '', spo2: '', weight: '', height: ''
  })
  const [checks, setChecks] = useState([])
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [warning, setWarning] = useState(null)

  function toggleCheck(item) {
    setChecks(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item])
  }

  function bmi() {
    const w = parseFloat(vitals.weight)
    const h = parseFloat(vitals.height) / 100
    if (!w || !h) return null
    return (w / (h * h)).toFixed(1)
  }

  async function saveVitals() {
    setLoading(true)
    await addStep({
      visit_id: visitId,
      step_type: 'vitals',
      performed_by: performedBy,
      data: { vitals, checks_completed: checks, bmi: bmi() }
    })
    setLoading(false)
    setSaved(true)
    if (onDone) onDone()
  }

  async function handleSubmit() {
    const missedVitals = Object.entries(REQUIRED_VITALS)
      .filter(([k]) => !vitals[k])
      .map(([, label]) => label)

    const missedChecks = REQUIRED_CHECKS
      .filter(c => !checks.includes(c))

    const allMissed = [...missedVitals, ...missedChecks]

    if (allMissed.length > 0) {
      setWarning(allMissed)
      return
    }

    await saveVitals()
  }

  const flags = Object.entries(vitals).filter(([k, v]) => {
    const s = getStatus(k, v)
    return s === 'low' || s === 'high'
  })

  if (saved) return (
  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
    <div className="text-green-600 text-4xl mb-3">✓</div>
    <h2 className="text-lg font-medium text-gray-900">Vitals recorded</h2>
    <p className="text-gray-500 text-sm mt-1">Timestamped and saved</p>
    <button onClick={() => navigate('/consultation')}
      className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
      Next: Consultation →
    </button>
  </div>
)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Vitals</h2>

      {allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-xs text-red-800 font-medium">
          ⚠ Allergy on file: {allergies.join(', ')}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 mb-4">
        {[
          { key: 'bp_systolic', label: 'Systolic BP', unit: 'mmHg', placeholder: '120' },
          { key: 'bp_diastolic', label: 'Diastolic BP', unit: 'mmHg', placeholder: '80' },
          { key: 'heart_rate', label: 'Heart rate', unit: 'bpm', placeholder: '72' },
          { key: 'temperature', label: 'Temperature', unit: '°F', placeholder: '98.6' },
          { key: 'spo2', label: 'SpO2', unit: '%', placeholder: '98' },
          { key: 'weight', label: 'Weight', unit: 'kg', placeholder: '70' },
          { key: 'height', label: 'Height', unit: 'cm', placeholder: '170' },
        ].map(({ key, label, unit, placeholder }) => {
          const status = getStatus(key, vitals[key])
          return (
            <div key={key}>
              <label className="text-xs text-gray-500">
                {label}
                {REQUIRED_VITALS[key] && <span className="text-red-400 ml-1">*</span>}
              </label>
              <div className="flex mt-1">
                <input
                  type="number"
                  placeholder={placeholder}
                  value={vitals[key]}
                  onChange={e => setVitals({ ...vitals, [key]: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-l-lg text-sm ${
                    status === 'high' || status === 'low'
                      ? 'border-red-300 bg-red-50'
                      : 'border-gray-200'
                  }`}
                />
                <span className="px-2 py-2 bg-gray-50 border border-l-0 border-gray-200 rounded-r-lg text-xs text-gray-400">
                  {unit}
                </span>
              </div>
              {status === 'high' && <p className="text-xs text-red-600 mt-1">Above normal range</p>}
              {status === 'low' && <p className="text-xs text-red-600 mt-1">Below normal range</p>}
              {status === 'normal' && vitals[key] && <p className="text-xs text-green-600 mt-1">Normal</p>}
            </div>
          )
        })}

        {bmi() && (
          <div>
            <label className="text-xs text-gray-500">BMI (auto)</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
              {bmi()} kg/m²
            </div>
          </div>
        )}
      </div>

      {flags.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs font-medium text-amber-800 mb-1">⚠ Flags to note</p>
          {flags.map(([k]) => (
            <p key={k} className="text-xs text-amber-700">
              {VITALS_FLAGS[k].label} is outside normal range
            </p>
          ))}
        </div>
      )}

      <h3 className="text-sm font-medium text-gray-700 mb-3 mt-4">Pre-visit checklist</h3>
      <p className="text-xs text-gray-400 mb-3">
        <span className="text-red-400">*</span> marked items are required to proceed
      </p>
      <div className="flex flex-col gap-2 mb-6">
        {RECEPTIONIST_CHECKS.map(item => (
          <div key={item} onClick={() => toggleCheck(item)}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700">
            <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
              checks.includes(item)
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-300'
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
        {loading ? 'Saving...' : 'Save vitals →'}
      </button>

      {warning && (
        <StepWarning
          visitId={visitId}
          stepType="vitals"
          missedFields={warning}
          dismissedBy={performedBy}
          onBack={() => setWarning(null)}
          onDismiss={() => {
            setWarning(null)
            saveVitals()
          }}
        />
      )}
    </div>
  )
}