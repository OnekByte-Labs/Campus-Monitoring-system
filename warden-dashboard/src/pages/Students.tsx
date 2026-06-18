import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, Filter, UserPlus, MoreVertical, X, LogIn, LogOut, FileText, Download } from 'lucide-react';
import TopBar from '../components/TopBar';
import './Students.css';

const MOCK_STUDENTS = [
  { id: '1', roll: 'STU-8829-X', name: 'Alex Rivers', room: 'Block B · 402', status: 'In Residence', lastSync: '12 mins ago', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCE7qyyi65hAJQvcQge9uTeaj7soj11H2XRO1yzKcc3VYciQJQZI4G1IKKqMXd7wU1IELpZd3Z8lMkQ3RzWBtxRipX5jVLYLsz8dw9krlcHmJFEXHfMaRv-t2LpF5ONgCCiSJDdxlva1XnsxDibMIwjl1IRggcwi4Es3ZlxlaGUpsy7FdCIwW-6pAedsLJOODC7w57Ms17Lf-7thW1YAksZz2LjlOcxHSSNWjOmlY-0zzDMz-N8ZQ1Szuum8xWEJ6X_JQmHshqPhgU', role: 'Undergraduate', contact: '+91 99999 00000', parentContact: '+91 99999 00001', registration: '12 Jan 2024' },
  { id: '2', roll: 'STU-1044-A', name: 'Sarah Chen', room: 'Block A · 105', status: 'Off-Campus', lastSync: '2 hrs ago', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCsB1jAfEnHg20r4prBgwqAIyqKROYKa9btDaBbGqOH5TA7A42ty_uXoB9t1-1DctU50E3NjU5W2RfSKFJemUISv5xyZkICYce0HHebTqopgNiVlxOC5dCQS55BubJEr9Rf8Dp0beqj6DP85XZZ1jiZe1J2Z0OHzj15OYfVCkUeRkuc3UtV3e6mxRE51-cNjTXKItyjIJBECQoTvuOZUsyqvySMYtIiInfzIEcJjNFNdQOuHIynSkmZ0y-0YH0bpQbP_97GsCeOF1k', role: 'Senior Bio-Ethics Student', contact: '+91 98765 43210', parentContact: '+91 99887 76655', registration: '12 Jan 2024' },
  { id: '3', roll: 'STU-7731-B', name: 'Jordan Miles', room: 'Block C · 210', status: 'In Residence', lastSync: 'Just Now', avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzsXba9HaXY2RnmmXX2OGf5FCnrSaGz8eKLxN6EJM0ChVo-8jw0T8XrpBlSVnsL4-Yej4gcwWP31VhFpkJSWS8wVP914NC2WAtWr9QWzdWYJtw1Udz34T2KgbPO3icp7czJLXRarp02N6ucbffFw3NxQY_zAQPLnORlj8vPetzVJIHkvA5olpkdzlqrXMAYhpwiacZBUkQH2bIjMw5HR4FiBofOts9R5tOO0vaXkNd0xOkaWExFFFxgREJlnopIuW963zG5fDaBgw', role: 'Freshman', contact: '+91 88888 11111', parentContact: '+91 88888 11112', registration: '12 Jan 2024' },
];

export default function Students() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const selectedStudent = MOCK_STUDENTS.find(s => s.id === id);

  return (
    <>
      <TopBar title="Student Directory" />
      <div className="page-content students-page">
        <div className="students-layout">
          {/* Main List */}
          <div className={`students-list-container ${selectedStudent ? 'drawer-open' : ''}`}>
            {/* Toolbar */}
            <div className="students-toolbar">
              <div className="search-box neu-inset">
                <Search size={18} className="text-outline" />
                <input 
                  type="text" 
                  placeholder="Search by name, ID, or room..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="filter-btn neu-convex">
                <Filter size={18} className="text-primary" />
                <span>Filters</span>
              </button>
              <button className="new-entry-btn neu-convex" onClick={() => navigate('/students/register')}>
                <UserPlus size={18} />
                <span>New Entry</span>
              </button>
            </div>

            {/* List */}
            <div className="students-list neu-convex">
              <div className="list-header">
                <div className="col-identity">Student Identity</div>
                <div className="col-room">Room / Wing</div>
                <div className="col-status">Status</div>
                <div className="col-sync">Last Sync</div>
                <div className="col-actions">Actions</div>
              </div>
              <div className="list-body">
                {MOCK_STUDENTS.map((student) => (
                  <div 
                    key={student.id} 
                    className={`student-row ${selectedStudent?.id === student.id ? 'active neu-inset' : 'neu-convex'}`}
                    onClick={() => navigate(`/students/${student.id}`)}
                  >
                    <div className="col-identity">
                      <img src={student.avatar} alt={student.name} className="student-avatar" />
                      <div>
                        <p className={`font-bold ${selectedStudent?.id === student.id ? 'text-primary' : 'text-on-surface'}`}>{student.name}</p>
                        <p className="text-label-md text-outline" style={{ fontSize: '10px' }}>{student.roll}</p>
                      </div>
                    </div>
                    <div className="col-room text-body-sm text-on-surface-variant">{student.room}</div>
                    <div className="col-status">
                      <span className={`status-badge ${student.status === 'In Residence' ? 'status-in' : 'status-out'}`}>
                        {student.status}
                      </span>
                    </div>
                    <div className="col-sync text-body-sm text-on-surface-variant">{student.lastSync}</div>
                    <div className="col-actions">
                      <button className="more-btn neu-convex" onClick={(e) => { e.stopPropagation(); }}>
                        <MoreVertical size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Details Drawer */}
          <div className={`student-drawer neu-high-lift ${selectedStudent ? 'open' : ''}`}>
            {selectedStudent && (
              <>
                <div className="drawer-header">
                  <h3 className="text-headline-md text-on-surface">Resident Profile</h3>
                  <button className="close-btn neu-convex" onClick={() => navigate('/students')}>
                    <X size={18} />
                  </button>
                </div>
                
                <div className="drawer-profile">
                  <img src={selectedStudent.avatar} alt={selectedStudent.name} className="profile-lg-avatar neu-convex" />
                  <h2 className="text-headline-md text-on-surface">{selectedStudent.name}</h2>
                  <p className="text-primary font-label-md tracking-widest uppercase text-center">{selectedStudent.role}</p>
                </div>

                <div className="drawer-content custom-scrollbar">
                  <div className="info-section">
                    <h4 className="text-body-md font-bold text-on-surface-variant mb-2">Student Information</h4>
                    <div className="info-card neu-inset">
                      <div className="info-row"><span>Full Name</span><p>{selectedStudent.name}</p></div>
                      <div className="info-row"><span>Role</span><p>{selectedStudent.role}</p></div>
                      <div className="info-row"><span>ID</span><p>{selectedStudent.roll}</p></div>
                      <div className="info-row"><span>Room</span><p>{selectedStudent.room}</p></div>
                      <div className="info-row"><span>Contact</span><p>{selectedStudent.contact}</p></div>
                      <div className="info-row"><span>Parent Contact</span><p>{selectedStudent.parentContact}</p></div>
                      <div className="info-row"><span>Registration</span><p>{selectedStudent.registration}</p></div>
                      <div className="info-row"><span>Last Sync</span><p className="text-primary">{selectedStudent.lastSync}</p></div>
                    </div>
                  </div>

                  <div className="info-section">
                    <h4 className="text-body-md font-bold text-on-surface-variant mb-2">Recent Activity</h4>
                    <div className="activity-list">
                      <div className="activity-item neu-convex">
                        <div className="activity-icon neu-inset"><LogIn size={14} className="text-secondary" /></div>
                        <div>
                          <p className="text-body-sm text-on-surface font-bold">Main Gate Entry</p>
                          <p className="text-[10px] text-outline">Oct 24, 08:42 PM</p>
                        </div>
                      </div>
                      <div className="activity-item neu-convex">
                        <div className="activity-icon neu-inset"><LogOut size={14} className="text-tertiary" /></div>
                        <div>
                          <p className="text-body-sm text-on-surface font-bold">Cafeteria Exit</p>
                          <p className="text-[10px] text-outline">Oct 24, 06:15 PM</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="drawer-footer">
                  <button className="download-dossier neu-convex">
                    <FileText size={18} /> Download Dossier
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
