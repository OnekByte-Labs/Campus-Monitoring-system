import React, { useState, useEffect } from 'react';
import { Network, Server, PlusCircle, CheckCircle, Activity, Box } from 'lucide-react';
import axios from 'axios';
import { TopBar } from '../components/TopBar';

interface Device {
  id: string;
  device_id: string;
  name: string;
  role: 'IN' | 'OUT';
  status: string;
  created_at: string;
}

export default function DeviceRegistry() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [formData, setFormData] = useState({
    device_id: '',
    name: '',
    role: 'IN'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/devices');
      if (res.data && res.data.success) {
        setDevices(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch devices', err);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const res = await axios.post('http://localhost:3000/api/v1/devices', formData);
      if (res.status === 201) {
        setFormData({ device_id: '', name: '', role: 'IN' });
        fetchDevices(); // Refresh list
      }
    } catch (err: any) {
      console.error(err.response?.data?.error || 'Failed to register device.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-stack-lg min-h-screen pb-32">
        <TopBar title="Hardware Architecture Registry" />

        <div className="flex-1 px-margin-desktop w-full max-w-[1440px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          
          {/* Left Side: Registration Form */}
          <div className="lg:col-span-4">
            <div className="bg-surface-container rounded-3xl p-stack-lg neu-convex border border-outline-variant/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 mb-stack-lg">
                <div className="w-12 h-12 rounded-xl bg-surface-container-low neu-inset flex items-center justify-center text-primary">
                  <Box size={24} />
                </div>
                <div>
                  <h3 className="font-headline-md text-xl font-bold text-on-surface">Provision Node</h3>
                  <p className="font-label-md text-on-surface-variant text-[12px] uppercase tracking-widest mt-1">Deploy Hardware Gate</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                    Hardware Payload ID (camera_id)
                  </label>
                  <input
                    type="text"
                    name="device_id"
                    required
                    value={formData.device_id}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface font-mono text-lg rounded-xl py-4 px-4 outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. 0 or 1"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                    System Alias Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg rounded-xl py-4 px-4 outline-none transition-all placeholder:text-on-surface-variant/50"
                    placeholder="e.g. Main Entry Gate"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="font-label-md text-[12px] font-bold text-on-surface-variant uppercase tracking-widest pl-2">
                    Directional Logic Role
                  </label>
                  <select
                    name="role"
                    required
                    value={formData.role}
                    onChange={handleChange}
                    className="w-full bg-surface-container-lowest neu-inset border border-transparent focus:border-primary/50 text-on-surface text-lg rounded-xl py-4 px-4 outline-none transition-all cursor-pointer"
                  >
                    <option value="IN">ENTRY GATE (IN)</option>
                    <option value="OUT">EXIT GATE (OUT)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full py-4 rounded-xl bg-primary-container text-on-primary-container font-headline-sm font-bold flex items-center justify-center gap-3 hover:scale-[1.02] active:neu-inset active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  <PlusCircle size={20} />
                  REGISTER DEVICE
                </button>
              </form>
            </div>
          </div>

          {/* Right Side: Active Devices Table */}
          <div className="lg:col-span-8">
            <div className="bg-surface-container rounded-3xl p-stack-lg neu-convex border border-outline-variant/10 shadow-[0_0_40px_rgba(0,0,0,0.5)] h-full">
              <div className="flex items-center justify-between mb-stack-lg">
                <div className="flex items-center gap-3">
                  <Network className="text-secondary" size={24} />
                  <h3 className="font-headline-md text-2xl font-bold text-on-surface">Active Sensor Grid</h3>
                </div>
                <div className="px-4 py-2 bg-surface-container-lowest neu-inset rounded-lg flex items-center gap-2">
                  <Activity className="text-secondary" size={16} />
                  <span className="font-label-md text-[12px] text-on-surface-variant font-bold tracking-widest">{devices.length} NODES LINKED</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md">
                {devices.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-on-surface-variant font-body-md bg-surface-container-low neu-inset rounded-2xl">
                    No hardware nodes deployed yet.
                  </div>
                ) : (
                  devices.map((device) => (
                    <div key={device.id} className="p-stack-md bg-surface-container-low neu-convex rounded-2xl flex flex-col gap-4 border border-outline-variant/5">
                      <div className="flex justify-between items-start">
                        <div className="flex flex-col">
                          <span className="font-headline-sm text-[18px] font-bold text-on-surface">{device.name}</span>
                          <span className="font-mono text-[12px] text-on-surface-variant mt-1">ID: {device.device_id}</span>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <span className={`px-2 py-1 rounded-[4px] text-[10px] font-bold tracking-widest ${device.role === 'IN' ? 'bg-secondary/20 text-secondary' : 'bg-error/20 text-error'}`}>
                            {device.role} GATE
                          </span>
                          <span className="flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-on-surface uppercase">
                            <div className="w-2 h-2 rounded-full bg-secondary drop-shadow-[0_0_4px_rgba(0,229,203,0.8)]"></div>
                            {device.status}
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-surface-container-highest rounded-full h-1 mt-auto">
                        <div className={`h-full rounded-full ${device.role === 'IN' ? 'bg-secondary' : 'bg-error'}`} style={{ width: '100%' }}></div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
