import { useState } from 'react';
import { Video, Grid, Maximize, Circle, Camera } from 'lucide-react';
import TopBar from '../components/TopBar';
import './Surveillance.css';

const cameras = [
  { id: 'CAM_01_ENTRANCE', name: 'Entrance', fps: 60, status: 'LIVE', res: '1080p', error: false, image: 'https://lh3.googleusercontent.com/aida/AP1WRLv7Vi7UJgx2dCiVtfWYnrNRx9DDwQHYP65Ww9YBuEhX2T0XEegD-DeHys7x_hEDzPLpCOztBFfFEzdOlIlhQcjZ6HiAat7EmBEQ28bL5QyW7ZDsys7phC6WCmzQhCGJAu5FwwLRDSAXTOD6Xmew1PRVr3Z3LTl_tqgclOOcoHxMFjbfhKustETMdR7kVcS7O61-0TLR38XXmzpNndKnYkvZakd_8N2aUVYNUBumtAHcBioMUrlNMBwGnlc' },
  { id: 'CAM_02_LOBBY', name: 'Lobby', fps: 45, status: 'LIVE', res: '1080p', error: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHqTQ0setz4xK_eQV4ZicNu4R2Af9ozzRHyuN8Eh1DJiHQJP-gLqvQnAnv5-iG_xu_2YGu-mlukSmnHRoa6Rv-ZopkzIEaFMj6CUSR_KkMsOsPipHKIHynswb4KMH2PT2hLdN0WvK22wokEqcWAnRf6EpueJx12u8B5UPcXUDuEphYAIO8nYhLFzyJx5LHwScPgnJ4ssomXChxCGSAuFGA5q9ZkxIF_KZNWJaFyrOrz2LNCOcZstxov0-rOd_GdVT7KnMvYNvdf90' },
  { id: 'CAM_03_PARKING', name: 'Parking', fps: 30, status: 'LIVE', res: '1080p', error: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6r0NpIp-slCOPxrrd_dDUHXxDaMeCb7OsBnwLK9GEBNG_rqb2J_-1OfOBduF_DbzrRThMVb0gbxVU83I9YD9dptnLKqB508V5oKI5ulEIgVfWLZA66pP5b_cgiiNwgx2QbJnwGP2pt0yIee7KwpjdQAWC-d3phLGrTECmoi5rFS_2LU2R3Yaw09CyXSFIPfSQebWCav5ahe9xy9P6ZCn_jVBu5bPIxKJrqrnb5WunsTg8DUFGtqNy41pYGMuql5EOzluNPE5KypM' },
  { id: 'CAM_04_CORRIDOR_A', name: 'Corridor A', fps: 60, status: 'LIVE', res: '1080p', error: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDE3kI0IZMD9-ay3j4I1IEeZGq3QQnSulTTJ78fhrzsYx3qINdvotgPXqGnrBWXYlMemojujEKYltxIE7AtkwlI8-HdirQzlhfMVBgWbdvgiX_NyzR4mq8QeWMj2OHBO8lJJ_4dK84yHaJiJqA8XLEix3xczrInlIdqq_moNNuq69mq2sWuf7DAkZMkcRm9ANE9J35jAPLEsMvHJgXjBXY_wGij7jflzfLjIK2qs0IzZXlE6_Y5_nJCqJBpDGLaU09QqCBhIzc0zCg' },
  { id: 'CAM_05_ROOFTOP', name: 'Rooftop', fps: 24, status: 'LIVE', res: '1080p', error: false, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDxbttdCcQZclp8B1CKZ_tzPHCO4DaiRPLXz4hnCStavd469UCWXWehmy8DfQ9pmWIs32RREXUTjeCfcT8sRSY0ruR9M3R2rRZRC2E29TVDHIaV3vCDDTj8cG1pnwVNDLrFKEKwQF1TXNYwizo1P7wO6izmmLcqWkQN3Z994coa24KHE7l9opuGtVNVqYOurLWzefrbBdHNQGHpWxfV6pkVihQFyjg0e-ZjqZ3xfmTjv_xMkePUkRKMoLFpz1Mjr1ZxP1LxuTnLvXw' },
  { id: 'CAM_06_BACK_EXIT', name: 'Back Exit', fps: 0, status: 'OFFLINE', res: 'N/A', error: true, image: '' },
];

export default function Surveillance() {
  const [activeTab, setActiveTab] = useState('Ground Floor');

  return (
    <>
      <TopBar title="Floor Surveillance Monitor" />
      <div className="page-content surveillance-page">
        {/* Floor selector */}
        <div className="surveillance-header">
          <div>
            <h2 className="text-headline-md text-on-surface">Floor Surveillance Monitor</h2>
            <p className="text-body-sm text-on-surface-variant">Active Nodes: 24 | Connectivity: High-Bandwidth</p>
          </div>
          <div className="surveillance-tabs">
            {['Ground Floor', '1st Floor', '2nd Floor'].map((floor) => (
              <button
                key={floor}
                className={`floor-tab ${activeTab === floor ? 'neu-inset active' : 'neu-convex'}`}
                onClick={() => setActiveTab(floor)}
              >
                {floor}
              </button>
            ))}
            <button className="neu-convex layout-btn">
              <Grid size={16} /> Layout
            </button>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="camera-grid">
          {cameras.map((cam) => (
            <div key={cam.id} className="camera-card neu-convex">
              <div className="camera-header">
                <div className="camera-id">
                  <Video size={16} className={cam.error ? 'text-error' : 'glow-cyan text-secondary'} />
                  <span className="text-label-md font-bold">{cam.id}</span>
                </div>
                <div className="camera-status">
                  <span className={`status-badge ${cam.error ? 'status-offline' : 'status-live'}`}>
                    {!cam.error && <div className="live-dot animate-pulse-glow" />}
                    {cam.status}
                  </span>
                  <span className="text-label-md text-outline" style={{ fontSize: '10px' }}>
                    {cam.res} | {cam.fps} FPS
                  </span>
                </div>
              </div>

              <div className={`camera-viewport neu-inset ${cam.error ? 'viewport-error' : ''}`}>
                {cam.error ? (
                  <div className="camera-offline">
                    <Video size={32} className="text-outline" />
                    <p className="text-label-md text-outline">RECONNECTING...</p>
                  </div>
                ) : (
                  <>
                    <img src={cam.image} alt={cam.name} className="camera-feed" />
                    <div className="camera-overlay"></div>
                    <div className="camera-rec-badge">REC ●</div>
                  </>
                )}
              </div>

              <div className="camera-controls">
                <button className="cam-btn neu-convex" disabled={cam.error}>
                  <Maximize size={14} /> EXPAND
                </button>
                <button className="cam-btn neu-convex" disabled={cam.error}>
                  <Circle size={14} /> RECORD
                </button>
                <button className="cam-btn icon-only neu-convex" disabled={cam.error}>
                  <Camera size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
