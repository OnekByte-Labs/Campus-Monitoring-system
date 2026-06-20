import { useState } from 'react';
import { Video, Grid, Maximize, Circle, Camera } from 'lucide-react';

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
      <div className="flex flex-col gap-stack-lg mb-stack-lg">
        {/* Floor selector */}
        <div className="flex flex-col md:flex-row md:justify-between md:items-end mb-stack-lg gap-stack-md">
          <div>
            <h2 className="font-headline-md text-headline-md text-on-surface">Floor Surveillance Monitor</h2>
            <p className="font-body-sm text-body-sm text-on-surface-variant">Active Nodes: 24 | Connectivity: High-Bandwidth</p>
          </div>
          <div className="flex gap-stack-sm items-center">
            {['Ground Floor', '1st Floor', '2nd Floor'].map((floor) => (
              <button
                key={floor}
                className={`px-4 py-2 rounded-lg text-[12px] font-semibold transition-all duration-300 ${activeTab === floor ? 'neu-inset text-secondary' : 'neu-convex text-on-surface-variant hover:text-primary'}`}
                onClick={() => setActiveTab(floor)}
              >
                {floor}
              </button>
            ))}
            <button className="flex items-center gap-stack-sm px-6 py-2 rounded-full text-[12px] font-semibold text-primary bg-surface-container ml-stack-md neu-convex hover:scale-105 active:scale-95 transition-transform">
              <Grid size={16} /> Layout
            </button>
          </div>
        </div>

        {/* Camera Grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(400px,1fr))] gap-stack-lg max-md:grid-cols-1">
          {cameras.map((cam) => (
            <div key={cam.id} className="bg-surface-container rounded-3xl p-stack-lg transition-transform duration-300 hover:scale-[1.02] neu-convex group">
              <div className="flex justify-between items-center mb-stack-md">
                <div className="flex items-center gap-stack-sm">
                  <Video size={16} className={cam.error ? 'text-error' : 'glow-teal text-secondary'} />
                  <span className="font-label-md text-label-md">{cam.id}</span>
                </div>
                <div className="flex items-center gap-stack-sm">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold ${cam.error ? 'bg-surface-variant text-outline-variant' : 'bg-error-container text-error'}`}>
                    {!cam.error && <div className="w-1 h-1 rounded-full bg-error animate-pulse" />}
                    {cam.status}
                  </span>
                  <span className="font-label-md text-label-md text-outline" style={{ fontSize: '10px' }}>
                    {cam.res} | {cam.fps} FPS
                  </span>
                </div>
              </div>

              <div className={`relative aspect-video rounded-xl bg-surface-container-lowest border mb-stack-md overflow-hidden ${cam.error ? 'border-error/20' : 'border-outline-variant/20 neu-inset'}`}>
                {cam.error ? (
                  <div className="flex flex-col items-center justify-center h-full gap-stack-sm">
                    <Video size={32} className="text-outline" />
                    <p className="font-label-md text-label-md text-outline">RECONNECTING...</p>
                  </div>
                ) : (
                  <>
                    <img src={cam.image} alt={cam.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                    <div className="absolute top-4 left-4 px-2 py-1 bg-black/40 backdrop-blur-md rounded-[4px] text-[10px] font-mono border border-white/10 text-white">REC ●</div>
                  </>
                )}
              </div>

              <div className="flex gap-stack-sm">
                <button className="flex-1 p-2 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-1 transition-all duration-200 hover:text-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed neu-convex" disabled={cam.error}>
                  <Maximize size={14} /> EXPAND
                </button>
                <button className="flex-1 p-2 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-1 transition-all duration-200 hover:text-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed neu-convex" disabled={cam.error}>
                  <Circle size={14} /> RECORD
                </button>
                <button className="flex-none px-4 py-2 rounded-xl text-[11px] font-bold text-on-surface-variant flex items-center justify-center gap-1 transition-all duration-200 hover:text-primary active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed neu-convex" disabled={cam.error}>
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
