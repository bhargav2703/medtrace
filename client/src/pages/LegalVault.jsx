import { useState, useEffect } from 'react'
import { getVisitFull } from '../api'
import { useNavigate } from 'react-router-dom'

const STEP_LABELS = {
  reception: 'Registration',
  vitals: 'Vitals',
  consultation: 'Consultation',
  procedure: 'Procedure',
  prescription: 'Prescription',
  discharge: 'Discharge'
}

function getSession() {
  try { return JSON.parse(localStorage.getItem('medtrace_session') || '{}') }
  catch { return {} }
}

function Row({ label, value }) {
  if (value === null || value === undefined || value === '') return null
  const display = Array.isArray(value) ? value.join(', ') : String(value)
  if (!display) return null
  return (
    <div className="flex gap-3 py-1.5 border-b border-gray-100 last:border-0">
      <span className="text-xs text-gray-500 w-44 shrink-0">{label}</span>
      <span className="text-xs text-gray-900">{display}</span>
    </div>
  )
}

function StepSection({ step, index }) {
  const label = STEP_LABELS[step.step_type] || step.step_type
  const d = step.data || {}
  const ts = new Date(step.timestamp).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-gray-900">Step {index + 1}: {label}</h3>
        <div className="flex items-center gap-2">
          {step.is_locked && (
            <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded">
              Locked
            </span>
          )}
          <span className="text-xs text-gray-400">{ts}</span>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg p-3">
        {step.step_type === 'vitals' && (
          <>
            {d.vitals && Object.entries(d.vitals).filter(([, v]) => v).map(([k, v]) => (
              <Row key={k} label={k.replace(/_/g, ' ')} value={v} />
            ))}
            <Row label="BMI" value={d.bmi} />
            <Row label="Checks completed" value={d.checks_completed} />
          </>
        )}

        {step.step_type === 'consultation' && (
          <>
            <Row label="Diagnosis" value={d.diagnosis} />
            <Row label="Clinical notes" value={d.clinical_notes} />
            <Row label="Referrals / investigations" value={d.referrals} />
            <Row label="Consent obtained" value={d.consent_obtained ? 'Yes' : 'No'} />
            <Row label="Consent notes" value={d.consent_notes} />

            {d.soap_note && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  AI SOAP Note · Gemini 2.5 Flash
                </p>
                {d.soap_note.red_flags?.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                    <p className="text-xs font-semibold text-red-800">
                      ⚠ Red flags: {d.soap_note.red_flags.join(' · ')}
                    </p>
                  </div>
                )}
                {[['S (Subjective)', d.soap_note.subjective], ['O (Objective)', d.soap_note.objective],
                  ['A (Assessment)', d.soap_note.assessment], ['P (Plan)', d.soap_note.plan]
                ].map(([label, val]) => <Row key={label} label={label} value={val} />)}
                {d.soap_note.clinical_entities?.length > 0 && (
                  <Row label="Clinical entities"
                    value={d.soap_note.clinical_entities.map(e => `${e.term} (${e.original})`).join(', ')} />
                )}
                {d.soap_note.icd_codes?.length > 0 && (
                  <Row label="ICD-10 codes" value={d.soap_note.icd_codes.join(', ')} />
                )}
              </div>
            )}

            {d.diarized_transcript?.length > 0 && (
              <div className="mt-3 pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                  Diarized Transcript · Sarvam Saarika:v2
                </p>
                {d.diarized_transcript.map((seg, i) => (
                  <div key={i} className="flex gap-2 py-0.5 text-xs">
                    <span className={`font-semibold shrink-0 ${seg.speaker_id === 'SPEAKER_0' ? 'text-blue-600' : 'text-emerald-700'}`}>
                      {seg.speaker_id === 'SPEAKER_0' ? 'Doctor' : 'Patient'}:
                    </span>
                    <span className="text-gray-700">{seg.transcript}</span>
                  </div>
                ))}
              </div>
            )}

            {!d.diarized_transcript?.length && d.audio_transcript && (
              <Row label="Audio transcript" value={d.audio_transcript} />
            )}
            <Row label="Checks completed" value={d.checks_completed} />
          </>
        )}

        {step.step_type === 'procedure' && (
          <>
            <Row label="Procedure" value={d.procedure_name} />
            <Row label="Type" value={d.procedure_type} />
            <Row label="Surgeon" value={d.surgeon} />
            <Row label="Anaesthesia" value={d.anesthesia} />
            <Row label="Duration (mins)" value={d.duration_minutes} />
            <Row label="Instruments" value={d.instruments} />
            <Row label="Complications" value={d.complications} />
            <Row label="Procedural notes" value={d.clinical_notes} />
            <Row label="Consent obtained" value={d.consent_obtained ? 'Yes' : 'No'} />
            <Row label="Consent notes" value={d.consent_notes} />
            <Row label="Checks completed" value={d.checks_completed} />
          </>
        )}

        {step.step_type === 'prescription' && (
          <>
            {(d.drugs || []).map((drug, i) => {
              const parts = [drug.dosage, drug.frequency, drug.route, drug.duration].filter(Boolean)
              const instructions = drug.instructions ? ` — ${drug.instructions}` : ''
              return (
                <Row key={i} label={`Drug ${i + 1}: ${drug.name}`}
                  value={parts.join(' · ') + instructions} />
              )
            })}
            <Row label="Dispensing notes" value={d.dispensing_notes} />
            <Row label="Checks completed" value={d.checks_completed} />
          </>
        )}

        {step.step_type === 'discharge' && (
          <>
            <Row label="Discharge condition" value={d.discharge_condition} />
            <Row label="Discharge summary" value={d.discharge_summary} />
            <Row label="Follow-up date" value={d.followup_date} />
            <Row label="Follow-up instructions" value={d.followup_instructions} />
            <Row label="Activity restrictions" value={d.activity_restrictions} />
            <Row label="Diet instructions" value={d.diet_instructions} />
            <Row label="Patient acknowledged" value={d.patient_acknowledged ? 'Yes' : 'No'} />
            <Row label="Checks completed" value={d.checks_completed} />
          </>
        )}
      </div>
    </div>
  )
}

export default function LegalVault() {
  const navigate = useNavigate()
  const [visit, setVisit] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const session = getSession()
    if (!session.visitId) {
      setError('No active visit found. Please complete a patient visit first.')
      setLoading(false)
      return
    }
    getVisitFull(session.visitId)
      .then(data => { setVisit(data); setLoading(false) })
      .catch(err => { setError(err.message); setLoading(false) })
  }, [])

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p className="text-sm text-gray-500">Loading visit record...</p>
    </div>
  )

  if (error) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <p className="text-sm text-red-600 mb-4">{error}</p>
      <button onClick={() => navigate('/register')}
        className="px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
        Start new visit
      </button>
    </div>
  )

  const patient = visit.patients || {}
  const steps = visit.visit_steps || []
  const visitDate = new Date(visit.visit_date || visit.created_at)
    .toLocaleDateString('en-IN', { dateStyle: 'long' })
  const generated = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <div>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-page { padding: 0 !important; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>

      <div className="no-print flex gap-3 mb-4">
        <button onClick={() => window.print()}
          className="px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700 font-medium">
          Download / Print PDF
        </button>
        <button onClick={() => navigate('/register')}
          className="px-6 py-2 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
          New visit
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6 print-page">
        {/* Document header */}
        <div className="border-b-2 border-gray-800 pb-4 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-base font-bold text-gray-900 tracking-tight">
                MedTrace — Legal Visit Record
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Tamper-evident electronic medical record
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400">Generated: {generated}</p>
              <p className="text-xs text-gray-400 font-mono">ID: {visit.id?.slice(0, 8)}…</p>
            </div>
          </div>
        </div>

        {/* Patient info */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Patient Information
          </h2>
          <div className="grid grid-cols-2 gap-x-8">
            <div>
              <Row label="Name" value={patient.name} />
              <Row label="Age" value={patient.age} />
              <Row label="Gender" value={patient.gender} />
              <Row label="Phone" value={patient.phone} />
            </div>
            <div>
              <Row label="ABHA ID" value={patient.abha_id} />
              <Row label="Visit date" value={visitDate} />
              <Row label="Chief complaint" value={visit.chief_complaint} />
              <Row label="Known conditions" value={patient.known_conditions} />
            </div>
          </div>
          {patient.allergies?.length > 0 && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <span className="text-xs font-semibold text-red-800">
                ALLERGIES ON FILE: {patient.allergies.join(', ')}
              </span>
            </div>
          )}
          {patient.current_medications?.length > 0 && (
            <Row label="Current medications" value={patient.current_medications} />
          )}
        </div>

        {/* Visit steps */}
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
            Visit Record ({steps.length} step{steps.length !== 1 ? 's' : ''} recorded)
          </h2>
          {steps.length === 0 ? (
            <p className="text-xs text-gray-400">No steps recorded for this visit.</p>
          ) : (
            steps.map((step, i) => <StepSection key={step.id} step={step} index={i} />)
          )}
        </div>

        {/* Footer */}
        <div className="border-t-2 border-gray-800 pt-4 mt-6">
          <p className="text-xs text-gray-500 leading-relaxed">
            This document was generated by MedTrace and represents the digital audit trail of this
            patient visit. All entries are timestamped at the time of entry. Locked steps are
            immutable and cannot be modified. Any field dismissals are recorded in the system audit
            log with the reason and responsible staff member.
          </p>
        </div>
      </div>
    </div>
  )
}
