import { useState, useRef } from 'react'
import { addStep, generateSoap } from '../api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'
import StepWarning from '../components/StepWarning'
import { useNavigate } from 'react-router-dom'

const CLINICAL_CHECKS = [
  'Patient complaint reviewed',
  'Allergy flag acknowledged',
  'Vitals flag noted and discussed',
  'Diagnosis explained to patient',
  'Informed consent obtained',
  'Follow-up plan discussed'
]

const LANGUAGES = [
  { code: 'unknown', label: 'Auto (codemix)' },
  { code: 'te-IN', label: 'తెలుగు' },
  { code: 'te-IN-translate', label: 'Telugu → English' },
  { code: 'en-IN', label: 'English' },
]

export default function Consultation({ visitId, performedBy, allergies = [] }) {
  const navigate = useNavigate()
  const [notes, setNotes] = useState({
    diagnosis: '', clinical_notes: '', referrals: '',
    consent_obtained: false, consent_notes: ''
  })
  const [checks, setChecks] = useState([])

  // Audio
  const [language, setLanguage] = useState('unknown')
  const [recording, setRecording] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcribing, setTranscribing] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [diarized, setDiarized] = useState([])
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  // SOAP
  const [soap, setSoap] = useState(null)
  const [generatingSoap, setGeneratingSoap] = useState(false)

  const [warning, setWarning] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  function toggleCheck(item) {
    setChecks(c => c.includes(item) ? c.filter(i => i !== item) : [...c, item])
  }

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    mediaRef.current = new MediaRecorder(stream)
    chunksRef.current = []
    mediaRef.current.ondataavailable = e => chunksRef.current.push(e.data)
    mediaRef.current.onstop = () => {
      setAudioBlob(new Blob(chunksRef.current, { type: 'audio/webm' }))
      setTranscript('')
      setDiarized([])
      setSoap(null)
    }
    mediaRef.current.start()
    setRecording(true)
  }

  function stopRecording() {
    mediaRef.current.stop()
    mediaRef.current.stream.getTracks().forEach(t => t.stop())
    setRecording(false)
  }

  async function transcribeAudio() {
    if (!audioBlob) return
    setTranscribing(true)
    const form = new FormData()
    form.append('file', audioBlob, 'audio.webm')
    form.append('language', language)
    const res = await fetch(`${API_URL}/transcribe`, { method: 'POST', body: form })
    const data = await res.json()
    setTranscript(data.text || data.error || '')
    setDiarized(data.diarized || [])
    setTranscribing(false)
  }

  async function handleGenerateSoap() {
    if (!transcript) return
    setGeneratingSoap(true)
    try {
      const result = await generateSoap({ transcript, diarized })
      setSoap(result)
      if (!notes.diagnosis && result.assessment)
        setNotes(n => ({ ...n, diagnosis: result.assessment }))
      if (!notes.clinical_notes) {
        const soapText = [
          result.subjective && `S: ${result.subjective}`,
          result.objective && `O: ${result.objective}`,
          result.assessment && `A: ${result.assessment}`,
          result.plan && `P: ${result.plan}`
        ].filter(Boolean).join('\n\n')
        setNotes(n => ({ ...n, clinical_notes: soapText }))
      }
    } catch (err) {
      alert('SOAP generation failed: ' + err.message)
    }
    setGeneratingSoap(false)
  }

  async function saveConsultation() {
    setLoading(true)
    await addStep({
      visit_id: visitId,
      step_type: 'consultation',
      performed_by: performedBy,
      data: {
        ...notes,
        checks_completed: checks,
        audio_transcript: transcript,
        diarized_transcript: diarized,
        soap_note: soap,
        has_audio: !!audioBlob
      }
    })
    setLoading(false)
    setSaved(true)
  }

  async function handleSubmit() {
    const missed = []
    if (!notes.diagnosis) missed.push('Diagnosis / clinical impression')
    if (!notes.consent_obtained) missed.push('Informed consent obtained')
    if (!checks.includes('Informed consent obtained')) missed.push('Consent checkbox not ticked')
    if (missed.length > 0) { setWarning(missed); return }
    await saveConsultation()
  }

  if (saved) return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
      <div className="text-green-600 text-4xl mb-3">✓</div>
      <h2 className="text-lg font-medium text-gray-900">Consultation recorded</h2>
      <p className="text-gray-500 text-sm mt-1">Timestamped and saved</p>
      <button onClick={() => navigate('/procedure')}
        className="mt-4 px-6 py-2 bg-green-800 text-white rounded-xl text-sm hover:bg-green-700">
        Next: Procedure →
      </button>
    </div>
  )

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 mb-4">
      <h2 className="text-sm font-medium text-gray-700 mb-4">Consultation</h2>

      {allergies.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 mb-4 text-xs text-red-800 font-medium">
          ⚠ Allergy on file: {allergies.join(', ')}
        </div>
      )}

      {/* ── Audio + Sarvam ── */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-700">
            Audio · <span className="text-gray-400">Sarvam Saarika:v2</span>
          </h3>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs">
            {LANGUAGES.map(({ code, label }) => (
              <button key={code} onClick={() => setLanguage(code)} disabled={recording}
                className={`px-3 py-1 transition-all disabled:opacity-50 ${
                  language === code ? 'bg-green-800 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {!recording ? (
            <button onClick={startRecording}
              className="px-4 py-2 bg-green-800 text-white rounded-lg text-xs hover:bg-green-700">
              ● Start recording
            </button>
          ) : (
            <button onClick={stopRecording}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs hover:bg-red-700 animate-pulse">
              ■ Stop
            </button>
          )}

          {audioBlob && !recording && (
            <button onClick={transcribeAudio} disabled={transcribing}
              className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-xs text-gray-700 hover:bg-gray-50 disabled:opacity-50">
              {transcribing ? 'Transcribing...' : '↻ Transcribe'}
            </button>
          )}

          {transcript && !transcribing && (
            <button onClick={handleGenerateSoap} disabled={generatingSoap}
              className="px-4 py-2 bg-blue-700 text-white rounded-lg text-xs hover:bg-blue-800 disabled:opacity-50">
              {generatingSoap ? 'Generating...' : '⚕ Generate SOAP'}
            </button>
          )}

          {audioBlob && <span className="text-xs text-green-600 ml-auto">Audio captured</span>}
        </div>

        {/* ── Transcript + SOAP side-by-side ── */}
        {transcript && (
          <div className={`mt-4 grid gap-3 ${soap ? 'grid-cols-2' : 'grid-cols-1'}`}>

            {/* Left: raw diarized transcript */}
            <div>
              <p className="text-xs text-gray-400 mb-1">Raw transcript</p>
              <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-52 overflow-y-auto">
                {diarized.length > 0 ? (
                  <div className="space-y-2">
                    {diarized.map((seg, i) => {
                      const isDoctor = seg.speaker_id === 'SPEAKER_0'
                      return (
                        <div key={i} className="text-xs leading-relaxed">
                          <span className={`font-semibold mr-1 ${isDoctor ? 'text-blue-600' : 'text-emerald-700'}`}>
                            {isDoctor ? 'Doctor' : 'Patient'}:
                          </span>
                          <span className="text-gray-700">{seg.transcript}</span>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-gray-600 italic leading-relaxed">{transcript}</p>
                )}
              </div>
            </div>

            {/* Right: SOAP note */}
            {soap && (
              <div>
                <p className="text-xs text-gray-400 mb-1">
                  SOAP note · <span className="text-gray-300">GPT-4o / MedLM</span>
                </p>
                <div className="bg-white border border-gray-200 rounded-lg p-3 max-h-52 overflow-y-auto">
                  {soap.red_flags?.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-2">
                      <p className="text-xs font-semibold text-red-800">
                        ⚠ Red flags: {soap.red_flags.join(' · ')}
                      </p>
                    </div>
                  )}
                  {[['S', soap.subjective], ['O', soap.objective], ['A', soap.assessment], ['P', soap.plan]].map(([k, v]) =>
                    v ? (
                      <div key={k} className="mb-2">
                        <span className="text-xs font-bold text-gray-700">{k}: </span>
                        <span className="text-xs text-gray-600">{v}</span>
                      </div>
                    ) : null
                  )}
                  {soap.clinical_entities?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
                      {soap.clinical_entities.map((e, i) => (
                        <span key={i} className="text-xs bg-blue-50 border border-blue-100 text-blue-700 px-2 py-0.5 rounded-full"
                          title={e.original}>
                          {e.term}
                        </span>
                      ))}
                    </div>
                  )}
                  {soap.icd_codes?.length > 0 && (
                    <p className="mt-2 text-xs text-gray-400 pt-2 border-t border-gray-100">
                      {soap.icd_codes.join(' · ')}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Clinical fields (auto-filled from SOAP, editable) ── */}
      <div className="mb-4">
        <label className="text-xs text-gray-500">
          Diagnosis / clinical impression <span className="text-red-400">*</span>
        </label>
        <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. Early osteoarthritis, right knee"
          value={notes.diagnosis}
          onChange={e => setNotes({ ...notes, diagnosis: e.target.value })} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Clinical notes</label>
        <textarea className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          rows={5}
          placeholder="Detailed findings, SOAP breakdown, observations, plan..."
          value={notes.clinical_notes}
          onChange={e => setNotes({ ...notes, clinical_notes: e.target.value })} />
      </div>

      <div className="mb-4">
        <label className="text-xs text-gray-500">Referrals / investigations ordered</label>
        <input className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-sm"
          placeholder="e.g. X-ray bilateral knees, blood sugar fasting"
          value={notes.referrals}
          onChange={e => setNotes({ ...notes, referrals: e.target.value })} />
      </div>

      {/* ── Consent ── */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <h3 className="text-xs font-medium text-blue-800 mb-2">
          Informed consent <span className="text-red-400">*</span>
        </h3>
        <div onClick={() => setNotes({ ...notes, consent_obtained: !notes.consent_obtained })}
          className="flex items-center gap-3 cursor-pointer mb-3">
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center text-xs flex-shrink-0 transition-all ${
            notes.consent_obtained ? 'bg-blue-600 border-blue-600 text-white' : 'border-blue-300'
          }`}>
            {notes.consent_obtained ? '✓' : ''}
          </div>
          <span className="text-xs text-blue-800">
            Patient has been informed of the diagnosis, proposed treatment, risks, and alternatives. Consent obtained.
          </span>
        </div>
        {notes.consent_obtained && (
          <input className="w-full px-3 py-2 border border-blue-200 rounded-lg text-xs bg-white"
            placeholder="Any notes on consent discussion (optional)"
            value={notes.consent_notes}
            onChange={e => setNotes({ ...notes, consent_notes: e.target.value })} />
        )}
      </div>

      {/* ── Clinical checklist ── */}
      <h3 className="text-sm font-medium text-gray-700 mb-3">Clinical checklist</h3>
      <div className="flex flex-col gap-2 mb-6">
        {CLINICAL_CHECKS.map(item => (
          <div key={item} onClick={() => toggleCheck(item)}
            className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg cursor-pointer text-sm text-gray-700">
            <div className={`w-4 h-4 rounded border flex items-center justify-center text-xs flex-shrink-0 ${
              checks.includes(item) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'
            }`}>
              {checks.includes(item) ? '✓' : ''}
            </div>
            {item}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit} disabled={loading}
        className="w-full py-3 bg-green-800 text-white rounded-xl text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-all">
        {loading ? 'Saving...' : 'Save consultation →'}
      </button>

      {warning && (
        <StepWarning
          visitId={visitId}
          stepType="consultation"
          missedFields={warning}
          dismissedBy={performedBy}
          onBack={() => setWarning(null)}
          onDismiss={() => { setWarning(null); saveConsultation() }}
        />
      )}
    </div>
  )
}
