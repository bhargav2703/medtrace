import { useState } from 'react'
import { createPatient, createVisit } from '../api'
import { useNavigate } from 'react-router-dom'

const DEMO_DOCTOR_ID = '22222222-2222-4222-8222-222222222222'
const DEMO_RECEPTIONIST_ID = '33333333-3333-4333-8333-333333333333'
const ALLERGY_GROUPS = {
  'Antibiotics': ['Penicillin / Amoxicillin', 'Cephalosporins', 'Sulfa drugs', 'Metronidazole'],
  'Pain relief': ['NSAIDs (Ibuprofen, Diclofenac)', 'Aspirin', 'Opioids (Codeine, Morphine)', 'Paracetamol'],
  'Anaesthesia & procedure': ['Local anaesthetics (Lignocaine)', 'General anaesthetic', 'Latex', 'Iodine / Betadine', 'Contrast dye'],
  'Cardiac & chronic': ['ACE inhibitors', 'Statins', 'Insulin', 'Steroids'],
  'Food & environmental': ['Nuts', 'Shellfish', 'Dairy', 'Dust / Pollen'],
  'Other': ['Other drug allergy', 'Other food allergy', 'Unknown allergy']
}

const REACTION_TYPES = ['Rash', 'Swelling', 'Anaphylaxis', 'Nausea / Vomiting', 'Unknown']
const CONDITIONS = ['Type 2 Diabetes', 'Hypertension', 'Heart disease', 'Asthma', 'Thyroid', 'Kidney disease']

export default function NewPatient() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', age: '', gender: '', phone: '', abha_id: '',
    chief_complaint: '',
    allergies: [], allergy_reactions: {}, known_conditions: [], current_medications: ''
  })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  function toggleItem(field, item) {
    setForm(f => ({
      ...f,
      [field]: f[field].includes(item)
        ? f[field].filter(i => i !== item)
        : [...f[field], item]
    }))
  }

  async function handleSubmit() {
    setLoading(true)
    try {
      const patient = await createPatient({
        name: form.name,
        age: parseInt(form.age) || null,
        gender: form.gender,
        phone: form.phone,
        abha_id: form.abha_id,
        allergies: form.allergies.filter(a => a !== 'No known allergies'),
        allergy_reactions: form.allergy_reactions,
        known_conditions: form.known_conditions,
        current_medications: form.current_medications ? [form.current_medications] : []
      })
      const visit = await createVisit({
        patient_id: patient.id,
        chief_complaint: form.chief_complaint,
        doctor_id: DEMO_DOCTOR_ID
      })
      localStorage.setItem('medtrace_session', JSON.stringify({
        visitId: visit.id,
        patientId: patient.id,
        patientName: patient.name,
        allergies: patient.allergies || [],
        doctorId: DEMO_DOCTOR_ID,
        receptionistId: DEMO_RECEPTIONIST_ID
      }))
      setSaved(true)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  if (saved) return (
  <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
    <div className="text-green-600 text-4xl mb-3">✓</div>
    <h2 className="text-lg font-medium text-gray-900">Patient registered</h2>
    <p className="text-gray-500 text-sm mt-1">Record saved and timestamped</p>
    <button onClick={() => navigate('/vitals')}
      className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
      Next: Vitals →
    </button>
  </div>
)

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-xl font-medium text-gray-900 mb-1">New patient</h1>
        <p className="text-sm text-gray-500 mb-6">All fields are timestamped on save</p>

        {/* Patient details */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Patient details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Full name</label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.name} onChange={e => setForm({...form, name: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Age</label>
              <input type="number" className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.age} onChange={e => setForm({...form, age: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-500">Gender</label>
              <select className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.gender} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">Select</option>
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500">Phone</label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
            </div>
            <div>
              <label className="text-xs text-gray-500">ABHA ID</label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                value={form.abha_id} onChange={e => setForm({...form, abha_id: e.target.value})} />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-gray-500">Chief complaint <span className="text-red-400">*</span></label>
              <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
                placeholder="e.g. Fever and cough for 3 days"
                value={form.chief_complaint} onChange={e => setForm({...form, chief_complaint: e.target.value})} />
            </div>
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-4">Allergies</h2>
          {Object.entries(ALLERGY_GROUPS).map(([group, items]) => (
            <div key={group} className="mb-4">
              <p className="text-xs text-gray-400 mb-2">{group}</p>
              <div className="flex flex-wrap gap-2">
                {items.map(a => (
                  <button key={a} onClick={() => toggleItem('allergies', a)}
                    className={`px-3 py-1 rounded-full text-xs border transition-all ${
                      form.allergies.includes(a)
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-red-50 border-red-200 text-red-800'
                    }`}>{a}</button>
                ))}
              </div>
            </div>
          ))}

          {form.allergies.length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-500 mb-3">Reaction type for each allergy</p>
              {form.allergies.map(allergy => (
                <div key={allergy} className="flex items-center gap-3 mb-2">
                  <span className="text-xs text-red-700 w-48 truncate">{allergy}</span>
                  <select
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1"
                    value={form.allergy_reactions[allergy] || ''}
                    onChange={e => setForm(f => ({
                      ...f,
                      allergy_reactions: { ...f.allergy_reactions, [allergy]: e.target.value }
                    }))}>
                    <option value="">Select reaction</option>
                    {REACTION_TYPES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
              ))}
            </div>
          )}

          <button onClick={() => toggleItem('allergies', 'No known allergies')}
            className={`mt-3 px-3 py-1 rounded-full text-xs border transition-all ${
              form.allergies.includes('No known allergies')
                ? 'bg-green-500 border-green-500 text-white'
                : 'bg-green-50 border-green-200 text-green-800'
            }`}>No known allergies</button>
        </div>

        {/* Known conditions */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Known conditions</h2>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map(c => (
              <button key={c} onClick={() => toggleItem('known_conditions', c)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  form.known_conditions.includes(c)
                    ? 'bg-amber-500 border-amber-500 text-white'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}>{c}</button>
            ))}
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-3">Current medications</h2>
          <textarea className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
            rows={3} placeholder="e.g. Metformin 500mg twice daily"
            value={form.current_medications}
            onChange={e => setForm({...form, current_medications: e.target.value})} />
        </div>

        <button onClick={handleSubmit} disabled={loading || !form.name || !form.chief_complaint}
          className="w-full py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
          {loading ? 'Saving...' : 'Register patient →'}
        </button>
      </div>
    </div>
  )
}