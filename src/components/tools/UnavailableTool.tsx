'use client'

interface Props {
  reason?: string
}

export function UnavailableTool({ reason = 'This conversion requires LibreOffice server-side processing.' }: Props) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6">
      <div className="flex flex-col items-center text-center py-8 gap-4">
        <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center">
          <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <div>
          <p className="font-semibold text-gray-900 mb-1">Feature Coming Soon</p>
          <p className="text-sm text-gray-500 max-w-sm">{reason}</p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-800 max-w-sm">
          We&apos;re working on upgrading the server to support this feature. Check back soon.
        </div>
      </div>
    </div>
  )
}
