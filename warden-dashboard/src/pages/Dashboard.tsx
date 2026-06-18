import { useState, useEffect, useCallback } from 'react';
import { ShieldCheck, AlertTriangle, Clock, Users } from 'lucide-react';
import TopBar from '../components/TopBar';
import { getSocket } from '../socket';
import { API_BASE } from '../types';
import type { AnalyticsData, AttendanceEvent, SecurityAlert, HealthCheck } from '../types';
import './Dashboard.css';

export default function Dashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [feedEvents, setFeedEvents] = useState<AttendanceEvent[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);

  const fetchAnalytics = useCallback(async () => {
    try {
      const [aRes, hRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/analytics/today`),
        fetch(`${API_BASE}/health`),
      ]);
      const aData = await aRes.json();
      const hData = await hRes.json();
      if (aData.success) setAnalytics(aData.data);
      if (hData.status) setHealth(hData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    }
  }, []);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 60000);

    const socket = getSocket();

    socket.on('new_attendance', (data: AttendanceEvent) => {
      setFeedEvents((prev) => [data, ...prev].slice(0, 50));
      fetchAnalytics();
    });

    socket.on('security_alert', (data: SecurityAlert) => {
      setAlerts((prev) => [data, ...prev].slice(0, 30));
      fetchAnalytics();
    });

    return () => {
      clearInterval(interval);
      socket.off('new_attendance');
      socket.off('security_alert');
    };
  }, [fetchAnalytics]);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  };

  const formatTime = (ts: string | number) => {
    const date = typeof ts === 'number' ? new Date(ts * 1000) : new Date(ts);
    return date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const getScoreClass = (score: number) => {
    if (score >= 0.8) return 'score-high';
    if (score >= 0.6) return 'score-medium';
    return 'score-low';
  };

  return (
    <>
      <TopBar title="Warden Dashboard" />
      <div className="page-content">
        {/* Zone A: Stat Tiles */}
        <div className="stat-grid">
          <div className="stat-tile neu-convex">
            <span className="stat-label text-label-md" style={{ color: 'var(--secondary)' }}>INSIDE</span>
            <span className="stat-value text-headline-xl">{analytics?.totalWalkThroughs ?? '—'}</span>
            <div className="stat-bar-track neu-inset">
              <div className="stat-bar-fill" style={{ width: `${Math.min((analytics?.totalWalkThroughs ?? 0) * 5, 100)}%`, background: 'var(--secondary-container)' }} />
            </div>
          </div>
          <div className="stat-tile neu-convex">
            <span className="stat-label text-label-md" style={{ color: 'var(--primary)' }}>UNIQUE</span>
            <span className="stat-value text-headline-xl">{analytics?.uniqueStudents ?? '—'}</span>
            <div className="stat-bar-track neu-inset">
              <div className="stat-bar-fill" style={{ width: `${Math.min((analytics?.uniqueStudents ?? 0) * 5, 100)}%`, background: 'var(--primary-container)' }} />
            </div>
          </div>
          <div className="stat-tile neu-convex">
            <span className="stat-label text-label-md" style={{ color: 'var(--error)' }}>ALERTS</span>
            <span className="stat-value text-headline-xl">{analytics?.totalAlerts ?? '—'}</span>
            <div className="stat-bar-track neu-inset">
              <div className="stat-bar-fill" style={{ width: `${Math.min((analytics?.totalAlerts ?? 0) * 10, 100)}%`, background: 'var(--error)' }} />
            </div>
          </div>
          <div className="stat-tile neu-convex">
            <span className="stat-label text-label-md" style={{ color: 'var(--tertiary)' }}>UPTIME</span>
            <span className="stat-value text-headline-xl">{health ? formatUptime(health.uptime) : '—'}</span>
            <div className="stat-bar-track neu-inset">
              <div className="stat-bar-fill" style={{ width: '85%', background: 'linear-gradient(90deg, var(--primary), var(--tertiary))' }} />
            </div>
          </div>
        </div>

        {/* Zone B + C */}
        <div className="dashboard-grid">
          {/* Zone B: Gate Monitor Feed */}
          <section className="feed-section neu-convex">
            <div className="section-header">
              <div className="section-header-left">
                <ShieldCheck size={20} className="glow-teal" style={{ color: 'var(--secondary)' }} />
                <h3 className="text-headline-md">Gate Monitoring</h3>
              </div>
              <div className="section-header-right">
                <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>
                  {feedEvents.length} events
                </span>
              </div>
            </div>

            <div className="feed-viewport neu-inset">
              {/* Scanning grid overlay */}
              <div className="scan-grid-overlay" />

              <div className="feed-log-overlay">
                {feedEvents.length === 0 && (
                  <div className="feed-empty">
                    <Users size={32} style={{ opacity: 0.3 }} />
                    <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>
                      Waiting for live events from Jetson Nano...
                    </p>
                  </div>
                )}
                {feedEvents.map((evt, i) => (
                  <div key={`${evt.id}-${i}`} className="feed-log-item animate-slide-in" style={{ animationDelay: `${i * 50}ms` }}>
                    <div className="feed-log-left">
                      <ShieldCheck size={14} style={{ color: evt.similarity_score >= 0.6 ? 'var(--secondary)' : 'var(--error)' }} />
                      <span className="text-label-md">
                        {evt.student_name || evt.student_id}: {evt.similarity_score >= 0.6 ? 'Verified Entrance' : 'Unknown Detection'}
                      </span>
                    </div>
                    <div className="feed-log-right">
                      <span className={`score-chip ${getScoreClass(evt.similarity_score)}`}>
                        {(evt.similarity_score * 100).toFixed(0)}%
                      </span>
                      <span className="feed-log-time">{formatTime(evt.timestamp)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Zone C: Alerts + Telemetry */}
          <section className="telemetry-section">
            {/* Alerts */}
            <div className="alerts-card neu-convex">
              <h3 className="text-label-md section-label" style={{ color: 'var(--error)' }}>
                <AlertTriangle size={14} /> SECURITY ALERTS
              </h3>
              <div className="alerts-list">
                {alerts.length === 0 && (
                  <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)', textAlign: 'center', padding: 'var(--stack-lg)' }}>
                    No alerts. All clear.
                  </p>
                )}
                {alerts.map((alert, i) => (
                  <div key={i} className="alert-item animate-flash-alert">
                    <div className="alert-item-header">
                      <span className="text-label-md" style={{ color: 'var(--error)' }}>⚠ {alert.alert_type}</span>
                      <span className="feed-log-time">{formatTime(alert.time)}</span>
                    </div>
                    <p className="text-body-sm" style={{ color: 'var(--on-surface-variant)' }}>{alert.reason}</p>
                    <div className="alert-tags">
                      <span className="alert-tag">ID: {alert.student_id}</span>
                      <span className="alert-tag">Score: {(alert.similarity_score * 100).toFixed(0)}%</span>
                      {alert.camera_id != null && <span className="alert-tag">Cam {alert.camera_id}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Telemetry */}
            <div className="telemetry-card neu-convex">
              <h3 className="text-label-md section-label" style={{ color: 'var(--primary)' }}>
                <Clock size={14} /> TELEMETRY
              </h3>
              <TelemetryGauge label="Core Temperature" value="61°C" percent={62} color="var(--tertiary)" />
              <TelemetryGauge label="Neural Memory" value="78%" percent={78} color="var(--secondary-container)" />
              <TelemetryGauge label="Data Throughput" value="1.2 Gb/s" percent={44} color="var(--primary-container)" />
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function TelemetryGauge({ label, value, percent, color }: { label: string; value: string; percent: number; color: string }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(percent + (Math.random() * 4 - 2)), 100);
    const interval = setInterval(() => setWidth(percent + (Math.random() * 4 - 2)), 3000);
    return () => { clearTimeout(timer); clearInterval(interval); };
  }, [percent]);

  return (
    <div className="gauge">
      <div className="gauge-header">
        <span className="text-label-md" style={{ color: 'var(--on-surface-variant)' }}>{label}</span>
        <span className="text-headline-md" style={{ color }}>{value}</span>
      </div>
      <div className="gauge-track neu-inset">
        <div className="gauge-fill" style={{ width: `${Math.max(0, Math.min(100, width))}%`, background: color, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}
