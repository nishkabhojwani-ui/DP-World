export default function CompliancePage() {
  return (
    <div className="page-wrapper">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <p className="section-label mb-1">MLC 2006 / STCW</p>
            <h1 className="page-title">Compliance Center</h1>
            <p className="page-subtitle">Crew compliance monitoring and verification</p>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6">
          <h2 className="text-2xl font-bold mb-6">Compliance Status</h2>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border rounded p-4">
              <div className="text-gray-600 text-sm">Crew Onboard</div>
              <div className="text-3xl font-bold mt-2">45</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-gray-600 text-sm">Compliant</div>
              <div className="text-3xl font-bold mt-2 text-green-600">42</div>
            </div>
            <div className="border rounded p-4">
              <div className="text-gray-600 text-sm">At Risk</div>
              <div className="text-3xl font-bold mt-2 text-yellow-600">3</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-lg mb-4">Required Certifications</h3>
            <ul className="space-y-2">
              <li>Certificate of Competency (CoC) - Valid</li>
              <li>GMDSS Certification - Valid</li>
              <li>STCW Basic Safety Training - Valid</li>
              <li>Medical ENG1 - Valid</li>
              <li>Passport - Valid</li>
              <li>Seaman Book - Valid</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
