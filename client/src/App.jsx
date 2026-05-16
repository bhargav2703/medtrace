import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import NewPatient from './pages/NewPatient'
import Vitals from './pages/Vitals'
import Consultation from './pages/Consultation'
import Procedure from './pages/Procedure'
import Prescription from './pages/Prescription'
import Discharge from './pages/Discharge'
import LegalVault from './pages/LegalVault'

const DEMO_VISIT_ID = '11111111-1111-4111-8111-111111111111'
const DEMO_DOCTOR_ID = '22222222-2222-4222-8222-222222222222'
const DEMO_RECEPTIONIST_ID = '33333333-3333-4333-8333-333333333333'
const DEMO_ALLERGIES = ['NSAIDs (Ibuprofen, Diclofenac)', 'Latex']

function getSession() {
  try { return JSON.parse(localStorage.getItem('medtrace_session') || '{}') }
  catch { return {} }
}

function Wrapper({ children, patientName }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <span className="text-sm font-medium text-gray-900">MedTrace</span>
        <span className="text-xs text-gray-400">{patientName || 'New visit'}</span>
      </div>
      <div className="max-w-2xl mx-auto p-6">{children}</div>
    </div>
  )
}

function StepBar({ current }) {
  const steps = ['Register', 'Vitals', 'Consult', 'Procedure', 'Rx', 'Discharge']
  return (
    <div className="flex mb-6 border border-gray-200 rounded-xl overflow-hidden">
      {steps.map((s, i) => (
        <div key={s} className={`flex-1 py-2 text-center text-xs border-r border-gray-200 last:border-r-0 ${
          i < current ? 'bg-green-50 text-green-700' :
          i === current ? 'bg-white text-gray-900 font-medium' :
          'bg-gray-50 text-gray-400'
        }`}>
          {i < current ? '✓ ' : ''}{s}
        </div>
      ))}
    </div>
  )
}

function SessionRoute({ step, Component, role = 'doctor' }) {
  const s = getSession()
  const performedBy = role === 'receptionist'
    ? (s.receptionistId || DEMO_RECEPTIONIST_ID)
    : (s.doctorId || DEMO_DOCTOR_ID)
  return (
    <Wrapper patientName={s.patientName}>
      {step !== undefined && <StepBar current={step} />}
      <Component
        visitId={s.visitId || DEMO_VISIT_ID}
        performedBy={performedBy}
        allergies={s.allergies || DEMO_ALLERGIES}
      />
    </Wrapper>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/register" />} />

        <Route path="/register" element={
          <Wrapper patientName="New patient">
            <StepBar current={0} />
            <NewPatient />
          </Wrapper>
        } />

        <Route path="/vitals" element={
          <SessionRoute step={1} Component={Vitals} role="receptionist" />
        } />

        <Route path="/consultation" element={
          <SessionRoute step={2} Component={Consultation} />
        } />

        <Route path="/procedure" element={
          <SessionRoute step={3} Component={Procedure} />
        } />

        <Route path="/prescription" element={
          <SessionRoute step={4} Component={Prescription} />
        } />

        <Route path="/discharge" element={
          <SessionRoute step={5} Component={Discharge} />
        } />

        <Route path="/legal-vault" element={(() => {
          const s = getSession()
          return (
            <Wrapper patientName={s.patientName}>
              <LegalVault />
            </Wrapper>
          )
        })()} />
      </Routes>
    </BrowserRouter>
  )
}
