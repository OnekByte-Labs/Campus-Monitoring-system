import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ChevronRight, UserPlus } from 'lucide-react';
import { TopBar } from '../components/TopBar';

const PERSONNEL_DATA = [
  {
    id: 'STU-1044-A',
    name: 'Sarah Chen',
    type: 'Student',
    status: 'Off Campus',
    statusColor: 'text-tertiary',
    statusBg: 'bg-tertiary',
    statusGlow: 'drop-shadow-[0_0_10px_rgba(255,184,0,0.4)]',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPvIgErypi_bhIF23DYD8mAv6qB9e6QFsVDEoahxztscmJ9GL4fem0rg57txfTgUw7CR_OXbO4rZR-J9hx9q54ufY0gahcxLfNoiHdyoKLmnm3hEEaFmJ7j7cWymTNpDlfX4t6M0xH0iaVZKt7fzaC4yrNzo3s71EfZIipajPms6-4bTwYMTsbUKgujzvLhe4Lub633eW6xy8jYv_I4lVS08Zv-g7Q0azczF32WfHLdEldK9GiFio3uG_Gf1LBzeDSMr29_hfbR7o'
  },
  {
    id: 'STU-8829-X',
    name: 'Alex Rivers',
    type: 'Student',
    status: 'In Residence',
    statusColor: 'text-secondary',
    statusBg: 'bg-secondary',
    statusGlow: 'drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKbHzB7TkyznaNvjFl8Eyl42OJSU_hba95r8cis7qs0AZp2B-jxb6VCt046NzrY8HRdJfw0EhYF5cCmXu0We-w2i3j5Igrf6cL59BUUnAXzhVwLhmwXkKowrJwJI_0WPXWOelrlDQUR3TAKm0vTd7-0c24Vjt8hwoDkApoOviteht5k33K0wMa8QCxVZN9XezwF7Rbc1BlHvuo7auXhW8LqUn-b_XpD76PM9rJA1FcoHep9ZwuxgQ4T9INpMR0NPo1YP37nR8o67g'
  },
  {
    id: 'STAFF-102',
    name: 'Chef Rajesh',
    type: 'Staff',
    role: 'Culinary Div.',
    status: 'On Duty',
    statusColor: 'text-primary',
    statusBg: 'bg-primary',
    statusGlow: '',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC3agdzVP-ReC18e3TEqce9SCQZZxsvXjo7OmEe44Vs-OREwwM2KkPJKD0ZQuF-_aAbY66W4ZeeSxHcV_Zb8erpfSWfUecq737bIi0T_bCaIlWWVYPNfclWrbnPbCMF30A7twDMKihcLtNQJDYkW_iVr8agumzN4HpXbhHVOe2JD-Lmf6EE7NfYhZ5yPG6lifQexzg2rr-_A5FX-XKEDp8rkwlEL1tSzO63wlweiYIlveDe7E_KOpF3Y-bjiBz5UdPAm3dt3VlPcy4'
  },
  {
    id: 'STAFF-203-Z',
    name: 'Jordan Vane',
    type: 'Staff',
    status: 'In Residence',
    statusColor: 'text-secondary',
    statusBg: 'bg-secondary',
    statusGlow: 'drop-shadow-[0_0_10px_rgba(0,255,136,0.4)]',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBirvO9TqytMtW_Qa_Gxu5MXkKFR_hkQv56mMbew7rFTTNc9fX_IzlmkP8uaxW-pbL661v0Y7mkw-vP88zdSms9ROwkfR62LVyUgkP0XnYqiPU4U2N-9QfxpmQZB-raTdc5AWzsPGWWp9fsAlXPqgkrIenLT8dqORW-j3JxgtemAU7BxdQA4UTpJlr6nBDZy2V3jAdfcsQxMepFAD4q8u6KbsQhXdEJGuJ1yNxXjobu-roU7UMFn8WLtoCUEMcjW4E8yh-yZI062pk'
  }
];

export default function Students() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPersonnel = PERSONNEL_DATA.filter(p => {
    if (filter !== 'All' && p.type !== filter) return false;
    if (searchTerm && !p.name.toLowerCase().includes(searchTerm.toLowerCase()) && !p.id.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen pb-32">
      <TopBar title="Personnel Directory" />
      
      <main className="px-margin-mobile pt-stack-md space-y-gutter max-w-4xl mx-auto w-full">
        {/* Filters */}
        <section className="flex gap-stack-sm overflow-x-auto pb-stack-sm -mx-margin-mobile px-margin-mobile custom-scrollbar">
          {['All', 'Student', 'Staff', 'Wardens'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-6 py-2 rounded-full font-label-md text-label-md whitespace-nowrap transition-transform active:scale-95 ${filter === f ? 'neu-inset bg-surface-container-highest text-secondary' : 'neu-convex bg-surface-container text-on-surface-variant'}`}
            >
              {f === 'Student' ? 'Students' : f}
            </button>
          ))}
        </section>

        {/* Search Area */}
        <section className="w-full h-14 neu-inset bg-surface-container-lowest rounded-xl flex items-center px-4 gap-3">
          <Search className="text-outline" size={20} />
          <input 
            type="text"
            className="bg-transparent border-none outline-none focus:ring-0 text-on-surface w-full font-body-md text-body-md placeholder:text-outline-variant" 
            placeholder="Search by name or ID..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </section>

        {/* Directory List */}
        <section className="space-y-gutter">
          {filteredPersonnel.map((person) => (
            <div key={person.id} className="neu-convex bg-surface-container-high rounded-2xl p-margin-mobile flex items-center gap-4 group transition-all duration-300 active:neu-inset cursor-pointer" onClick={() => navigate(`/students/${person.id}`)}>
              <div className="w-16 h-16 rounded-full neu-inset p-1 flex-shrink-0">
                <img alt={person.name} className="w-full h-full rounded-full object-cover" src={person.avatar} />
              </div>
              <div className="flex-grow">
                <h3 className="font-headline-md text-[18px] text-on-surface font-semibold">{person.name}</h3>
                <p className="font-label-md text-label-md text-outline mb-2">{person.role ? `Staff: ${person.role}` : `ID: ${person.id}`}</p>
                <div className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-surface-dim border border-opacity-20 ${person.statusColor.replace('text-', 'border-')} ${person.statusGlow}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${person.statusBg}`}></span>
                  <span className={`${person.statusColor} font-label-md text-[10px] uppercase tracking-wider`}>{person.status}</span>
                </div>
              </div>
              <button className="neu-convex w-10 h-10 rounded-full flex items-center justify-center text-primary group-active:scale-90 transition-transform">
                <ChevronRight size={20} />
              </button>
            </div>
          ))}
        </section>
      </main>

      {/* FAB: Add New Personnel */}
      <button 
        onClick={() => navigate('/students/register')}
        className="fixed bottom-28 right-6 w-16 h-16 rounded-full bg-primary-container text-white neu-high-lift drop-shadow-[0_0_15px_rgba(139,110,255,0.6)] flex items-center justify-center z-50 active:scale-95 duration-150 group"
      >
        <UserPlus size={32} className="group-active:rotate-90 transition-transform text-on-primary-container" />
      </button>
    </div>
  );
}
