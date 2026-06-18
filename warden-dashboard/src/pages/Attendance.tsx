import { useState } from 'react';
import { Search, Calendar, Filter, Download, CheckCircle, AlertTriangle, ShieldAlert, ChevronLeft, ChevronRight, MoreVertical } from 'lucide-react';
import TopBar from '../components/TopBar';
import './Attendance.css';

const MOCK_TRANSACTIONS = [
  { id: 'TX01', type: 'success', resident: 'Alex Rivera', residentId: 'ID-88291-K', location: 'North Wing Entry 02', time: '14:22:08', date: 'Oct 24, 2023', verification: 'Biometric-Pass', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDho0UJiLK4UMfc5OLiAzCGp2E7zajNcXKlLxLRG3QrnGotTH_MrofP-4yNxNAHmvWyrdnkiU0tYIR_JjuxQ43sO1FWcCwaCOiAQfctJNRIkoSuWouXQKVwBCBDqox4lHnDegxq3PaOoWBWRK42i7z6SSql-evU0HuA2Wee9SEaS3NfGm4VPMmo8q9tig-SXkLVqUcNqPe7W3OkziTTQr910q4azbfR_-i8HfC7-rOqHoiN0hz6b0q8Q7M2mtVfR-ikaOCZtC97pzI' },
  { id: 'TX02', type: 'anomaly', resident: 'Sarah Chen', residentId: 'ID-12904-X', location: 'Central Cafeteria', time: '13:58:12', date: 'Oct 24, 2023', verification: 'Double Entry Det.', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAhrVPu7onvf_ZKWGmXtAMJMoEybkRVElAmSdvGC-ZiH72eDZm7X-YXkDIbj-QBqsUudZqK9VHIJUlEL1CSnv1Ko7ITsm7BmlCmeYRQ_KnhAfKyVPFv4qxTXpq43DdSJ2QLcKia0mJcMXKdRUNUU0ZX2MW8w1ihrGi6XBLhiW8r9PtFsFbF2IsoftpRcddY1x9uXzM8wgKa-PQeOzQe9YZSOzm19-qYO8KVw3UmC8OKOzl_kwnSYU0nt9-N1fVt_Cffp0fi0DRyhL8' },
  { id: 'TX03', type: 'success', resident: 'Jordan Smyth', residentId: 'ID-99201-M', location: 'Main Gate West', time: '13:45:00', date: 'Oct 24, 2023', verification: 'RFID-Pass', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtP-VOnqKnE_Ghz7A-15M-2t5buElLwlBtX_SHI8e35-2z1-kPJM-MTJrc32Hj4gunEG_D3FIs1CyAO1dX-yLnlIIlG2pFwEsPXpDVyY7aYeYp3l_D9bdajKmnfKWZ8atQt_LJoZF0yVVOec22HMjMrLUaz9J1XDRkw3esY6IN-9ymjm2-tN9fsRXJXMXhxA5wpGGwxIrWjgJHEm3s3vNCOKGTWIqhUqK8LN_ADY5YvCIlVlCleKryMKSlanKk69newo49tGtTSbg' },
  { id: 'TX04', type: 'critical', resident: 'Unknown Subject', residentId: 'TOKEN-ERR-404', location: 'Staff Restricted Zone', time: '13:12:44', date: 'Oct 24, 2023', verification: 'UNAUTHORIZED', avatar: null },
  { id: 'TX05', type: 'success', resident: 'Mia Wong', residentId: 'ID-77212-P', location: 'Residential Lift A', time: '12:50:11', date: 'Oct 24, 2023', verification: 'Biometric-Pass', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBE_lunBO9OXLbB3T_WhncQ_4yOmCsGeHpzLgxaB2iTuR3cGUnEWhipn7nAoG2JnKpZILXek0lPwORb9h_0J1BIyiEx51QQOIIP93lteFNdyreNZQ3kDx9d0F5FZAKbpbgoXXTL591hjJ-fCfPFgNnTppzTzfSyniZsK-sJ58WSVR8NWJIIYfG-baFxBnQsrWEcMauvlAUFUxD0S5mAw0SRSqpfWNi7XAcsXeQHH4xLkcPXzaXlnDSKLAZX0pKeLk304YmLf6GVvRA' }
];

export default function Attendance() {
  const [searchTerm, setSearchTerm] = useState('');

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="text-secondary" />;
      case 'anomaly': return <AlertTriangle size={16} className="text-tertiary" />;
      case 'critical': return <ShieldAlert size={16} className="text-error" />;
      default: return null;
    }
  };

  return (
    <>
      <TopBar title="Operational Overview" />
      <div className="page-content attendance-page">
        {/* Matrix Header Stats */}
        <div className="stats-grid">
          <div className="stat-card border-secondary glow-teal-edge">
            <p className="stat-label">Daily Presence</p>
            <h3 className="stat-value text-secondary">94.2%</h3>
            <p className="stat-sub">+1.2% from yesterday</p>
          </div>
          <div className="stat-card border-tertiary glow-amber-edge">
            <p className="stat-label">Anomalies Detected</p>
            <h3 className="stat-value text-tertiary">07</h3>
            <p className="stat-sub">Requires urgent review</p>
          </div>
          <div className="stat-card border-primary">
            <p className="stat-label">Peak Entry Hour</p>
            <h3 className="stat-value text-primary">08:14</h3>
            <p className="stat-sub">Main Gate Primary</p>
          </div>
          <div className="stat-card border-outline">
            <p className="stat-label">Total Transactions</p>
            <h3 className="stat-value text-on-surface">1,284</h3>
            <p className="stat-sub">Last 24 Hours</p>
          </div>
        </div>

        {/* Filters Section */}
        <div className="filters-section neu-convex">
          <div className="search-bar neu-inset">
            <Search size={18} className="text-outline" />
            <input 
              type="text" 
              placeholder="Search resident, ID or biometric token..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-dropdown neu-inset">
            <Calendar size={18} className="text-outline" />
            <select>
              <option>Today: Oct 24, 2023</option>
              <option>Yesterday</option>
              <option>Last 7 Days</option>
            </select>
          </div>

          <div className="filter-dropdown neu-inset">
            <Filter size={18} className="text-outline" />
            <select>
              <option>All Statuses</option>
              <option>Success Only</option>
              <option className="text-tertiary">Anomalies</option>
              <option className="text-error">Access Denied</option>
            </select>
          </div>

          <button className="download-btn neu-convex text-primary">
            <Download size={20} />
          </button>
        </div>

        {/* Table */}
        <div className="table-container neu-high-lift">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Resident / ID</th>
                <th>Access Point</th>
                <th>Timestamp</th>
                <th>Verification</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className={`tx-row row-${tx.type}`}>
                  <td>
                    <div className="status-indicator">
                      <div className={`status-line bg-${tx.type}`} />
                      <div className="status-icon neu-inset">
                        {getStatusIcon(tx.type)}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="resident-cell">
                      <div className="resident-avatar neu-convex">
                        {tx.avatar ? <img src={tx.avatar} alt="avatar" /> : <ShieldAlert size={20} className="text-outline" />}
                      </div>
                      <div>
                        <p className={`text-body-md font-bold ${tx.type === 'critical' ? 'text-error' : 'text-on-surface'}`}>{tx.resident}</p>
                        <p className="text-label-md text-outline" style={{ fontSize: '10px' }}>{tx.residentId}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className="text-body-sm text-on-surface-variant">{tx.location}</span>
                  </td>
                  <td>
                    <p className="text-body-sm text-on-surface">{tx.time}</p>
                    <p className="text-label-md text-outline" style={{ fontSize: '10px' }}>{tx.date}</p>
                  </td>
                  <td>
                    <span className={`verification-badge badge-${tx.type}`}>
                      {tx.verification}
                    </span>
                  </td>
                  <td className="text-right">
                    {tx.type === 'success' ? (
                      <button className="action-btn">
                        <MoreVertical size={16} />
                      </button>
                    ) : (
                      <button className={`resolve-btn btn-${tx.type} neu-convex`}>
                        {tx.type === 'critical' ? 'Lockdown' : 'Resolve'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="pagination">
            <p className="text-body-sm text-on-surface-variant">Showing 1 - 25 of 1,284 transactions</p>
            <div className="pagination-controls">
              <button className="page-nav neu-convex" disabled><ChevronLeft size={18} /></button>
              <div className="page-numbers">
                <span className="page-num active neu-inset">1</span>
                <span className="page-num">2</span>
                <span className="page-num">3</span>
                <span className="text-on-surface-variant">...</span>
                <span className="page-num">52</span>
              </div>
              <button className="page-nav neu-convex"><ChevronRight size={18} /></button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
