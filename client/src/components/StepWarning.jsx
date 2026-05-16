import { useState } from 'react'
import { logDismissal } from '../api'

const DISMISS_REASONS = [
  'Patient refused',
  'Not clinically required',
  'Will complete later',
  'Emergency — no time',
  'Other'
]

export default function StepWarning({ visitId, stepType, missedFields, dismissedBy, onBack, onDismiss }) {
  const [reason, setReason] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saveError, setSaveError] = useState('')

  async function handleDismiss() {
    if (!reason) return setConfirming(true)
    setSaveError('')
    setLoading(true)
    try {
      await logDismissal({
        visit_id: visitId,
        step_type: stepType,
        missed_fields: missedFields,
        dismissed_by: dismissedBy,
        reason
      })
      onDismiss(reason)
    } catch (e) {
      setSaveError(e.message || 'Could not write audit log. Check the server and Supabase config.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl border border-gray-200 max-w-md w-full p-6">

        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0 text-lg">
            ⚠
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-900">Incomplete step</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              The following fields were not completed
            </p>
          </div>
        </div>

        {/* Missed fields */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
          {missedFields.map(f => (
            <div key={f} className="flex items-center gap-2 text-xs text-amber-800 py-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0"></span>
              {f}
            </div>
          ))}
        </div>

        {/* Legal warning */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 text-xs text-red-700">
          Skipping required fields may affect the legal admissibility of this visit record. 
          If you proceed, this dismissal will be logged with your name and timestamp.
        </div>

        {/* Reason selection */}
        <p className="text-xs text-gray-600 mb-2 font-medium">
          Reason for skipping {confirming && <span className="text-red-500">— required</span>}
        </p>
        <div className="flex flex-col gap-2 mb-5">
          {DISMISS_REASONS.map(r => (
            <div key={r} onClick={() => setReason(r)}
              className={`px-3 py-2 rounded-lg border text-xs cursor-pointer transition-all ${
                reason === r
                  ? 'bg-gray-900 border-gray-900 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-gray-300'
              }`}>
              {r}
            </div>
          ))}
        </div>

        {saveError && (
          <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
            {saveError}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button onClick={onBack}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-700 hover:bg-gray-50 transition-all">
            ← Go back
          </button>
          <button onClick={handleDismiss} disabled={loading || !reason}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm hover:bg-red-700 disabled:opacity-50 transition-all">
            {loading ? 'Logging...' : 'Proceed anyway'}
          </button>
        </div>

        {reason && (
          <p className="text-xs text-center text-gray-400 mt-3">
            This will be logged as: "{reason}" by staff member
          </p>
        )}
      </div>
    </div>
  )
}