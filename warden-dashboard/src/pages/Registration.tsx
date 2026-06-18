import { useState } from 'react';
import { UserPlus, FaceIdError, ArrowRight, ShieldCheck, Fingerprint, RefreshCw } from 'lucide-react';
import TopBar from '../components/TopBar';
import { API_BASE } from '../types';
import './Registration.css';

export default function Registration() {
  const [role, setRole] = useState('Student');
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [wingRoom, setWingRoom] = useState('');
  const [contact, setContact] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      setScanComplete(true);
    }, 3000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanComplete) {
      setError('Please complete the face enrollment scan first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: rollNumber,
          full_name: fullName,
          enrollment_status: 'active'
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // Reset form after delay
        setTimeout(() => {
          setSuccess(false);
          setScanComplete(false);
          setFullName('');
          setRollNumber('');
          setWingRoom('');
          setContact('');
          setRole('Student');
        }, 3000);
      } else {
        setError(data.error || 'Failed to enroll resident.');
      }
    } catch (err) {
      setError('Network error. Failed to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TopBar title="Personnel Control" />
      <div className="page-content registration-page">
        <div className="registration-container neu-high-lift">
          <div className="registration-header">
            <div>
              <h2 className="text-headline-lg text-on-surface">Enroll New Resident</h2>
              <p className="text-body-md text-on-surface-variant mt-1">Personnel Registration Phase 01</p>
            </div>
            <div className="registration-icon neu-convex">
              <UserPlus size={24} className="text-on-surface" />
            </div>
          </div>

          <form className="registration-body" onSubmit={handleSubmit}>
            {/* Face Scan Section */}
            <div className="scan-section">
              <label className="text-label-md text-primary-fixed-dim scan-label">
                <Fingerprint size={16} /> FACE ENROLLMENT SCAN
              </label>
              
              <div className="scan-viewport neu-inset">
                <img 
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCcsOEorYFxoNLzZ13c2m3odmSgdfdJJ9pCR3c0_P_HFmWgi7_B0Gcikj6qLkmOh5IwKRQ9QyXmXyYSNQMNLXnD3fxCH_KsKuzKijo5344VWQgzDPjBGOHsz-8KvWlf3ol3mQJ5i1J9M1pLWaAnquuo4B0m4oc8oSfZNTt8350cXqBDOTCkm4EBnkDn210bGo-Q92Loim3_1_R8mVDvudZPXEZRE-0NJMIrOLJ1gfsmD3breVbDACmP0-gPy71vpYR4opdgFXlTobc" 
                  alt="Biometric face scan" 
                  className="scan-bg"
                />
                
                {scanning && <div className="scan-line" />}
                
                <div className="scan-overlay-content">
                  {!scanComplete ? (
                    <button type="button" className={`scan-btn ${scanning ? 'scanning' : ''}`} onClick={handleScan} disabled={scanning}>
                      {scanning ? <RefreshCw size={32} className="animate-spin text-secondary glow-teal" /> : <ShieldCheck size={32} className="text-secondary glow-teal" />}
                    </button>
                  ) : (
                    <div className="scan-success-indicator">
                      <ShieldCheck size={48} className="text-secondary glow-teal" />
                    </div>
                  )}
                  <span className="scan-status-text">
                    {scanning ? 'SCANNING_...' : scanComplete ? 'BIOMETRIC_SAVED' : 'AWAITING_INPUT'}
                  </span>
                </div>
              </div>
            </div>

            {error && (
              <div className="form-error neu-inset text-body-sm text-error">
                {error}
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="form-grid">
              <div className="form-group">
                <label className="text-label-md text-on-surface-variant">Identity Role</label>
                <select className="form-input neu-inset" value={role} onChange={e => setRole(e.target.value)}>
                  <option value="Student">Student</option>
                  <option value="Warden">Warden</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>

              <div className="form-group">
                <label className="text-label-md text-on-surface-variant">Full Name</label>
                <input 
                  type="text" 
                  className="form-input neu-inset" 
                  placeholder="Enter Full Name" 
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="text-label-md text-on-surface-variant">Roll Number / ID</label>
                <input 
                  type="text" 
                  className="form-input neu-inset" 
                  placeholder="E.G. 24-BCE-001" 
                  value={rollNumber}
                  onChange={e => setRollNumber(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="text-label-md text-on-surface-variant">Wing/Room</label>
                <input 
                  type="text" 
                  className="form-input neu-inset" 
                  placeholder="A-201" 
                  value={wingRoom}
                  onChange={e => setWingRoom(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="text-label-md text-on-surface-variant">Contact Number</label>
                <input 
                  type="tel" 
                  className="form-input neu-inset" 
                  placeholder="+1 000 000 000" 
                  value={contact}
                  onChange={e => setContact(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Submit */}
            <button 
              type="submit" 
              className={`submit-btn neu-convex ${success ? 'success' : ''}`} 
              disabled={loading || success}
            >
              <span className="text-headline-md">
                {loading ? 'Processing...' : success ? 'Enrollment Success' : 'Confirm Enrollment'}
              </span>
              {!loading && !success && <ArrowRight size={24} />}
              {success && <ShieldCheck size={24} />}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
