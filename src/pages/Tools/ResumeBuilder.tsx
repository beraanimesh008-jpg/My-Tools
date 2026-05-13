import { useState } from 'react';
import Navbar from '@/src/components/Navbar';
import { FileText, Download, User, Mail, Phone, MapPin, Briefcase, GraduationCap, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

interface Experience {
  company: string;
  role: string;
  duration: string;
  desc: string;
}

interface Education {
  school: string;
  degree: string;
  year: string;
}

export default function ResumeBuilder() {
  const [name, setName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [phone, setPhone] = useState('+1 234 567 890');
  const [address, setAddress] = useState('New York, USA');
  const [summary, setSummary] = useState('Passionate software developer with 5 years of experience...');
  
  const [experiences, setExperiences] = useState<Experience[]>([
    { company: 'Tech Corp', role: 'Senior Developer', duration: '2020 - Present', desc: 'Leading the frontend team...' }
  ]);
  
  const [education, setEducation] = useState<Education[]>([
    { school: 'State University', degree: 'B.Sc in Computer Science', year: '2019' }
  ]);

  const addExperience = () => setExperiences([...experiences, { company: '', role: '', duration: '', desc: '' }]);
  const removeExperience = (i: number) => setExperiences(experiences.filter((_, idx) => idx !== i));
  
  const addEducation = () => setEducation([...education, { school: '', degree: '', year: '' }]);
  const removeEducation = (i: number) => setEducation(education.filter((_, idx) => idx !== i));

  const handleDownload = () => {
    window.print();
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Editor */}
          <div className="space-y-8 no-print">
            <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-700">
              <h2 className="text-3xl font-black text-slate-800 dark:text-white mb-8 flex items-center gap-3">
                <div className="p-2 bg-emerald-500 rounded-xl">
                  <FileText className="text-white w-6 h-6" />
                </div>
                Edit Resume
              </h2>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Full Name</label>
                    <input value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                    <input value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Professional Summary</label>
                  <textarea value={summary} onChange={e => setSummary(e.target.value)} rows={3} className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-700 rounded-xl p-3 resize-none" />
                </div>

                {/* Experience */}
                <div className="pt-4">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Experience</label>
                    <button onClick={addExperience} className="text-emerald-500 hover:text-emerald-600 font-bold flex items-center gap-1 text-sm"><Plus className="w-4 h-4" /> Add</button>
                  </div>
                  {experiences.map((exp, i) => (
                    <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl mb-4 border border-slate-100 dark:border-slate-700 relative group">
                      <button onClick={() => removeExperience(i)} className="absolute top-2 right-2 p-1 text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="w-4 h-4" /></button>
                      <input placeholder="Company" value={exp.company} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].company = e.target.value;
                        setExperiences(newExp);
                      }} className="w-full bg-transparent font-bold mb-2 outline-none" />
                      <input placeholder="Role" value={exp.role} onChange={e => {
                        const newExp = [...experiences];
                        newExp[i].role = e.target.value;
                        setExperiences(newExp);
                      }} className="w-full bg-transparent text-sm mb-2 outline-none" />
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleDownload}
                className="w-full mt-10 bg-emerald-500 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl shadow-emerald-100 dark:shadow-none hover:bg-emerald-600 transition-all"
              >
                <Download className="w-6 h-6" />
                Download PDF
              </button>
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white p-16 rounded shadow-2xl min-h-[800px] text-slate-800" id="resume-preview">
            <div className="text-center mb-12 border-b-2 border-slate-100 pb-12">
              <h1 className="text-5xl font-serif font-black mb-4 uppercase tracking-tighter">{name}</h1>
              <div className="flex justify-center flex-wrap gap-6 text-sm font-medium text-slate-500 uppercase tracking-widest">
                <span className="flex items-center gap-2"><Mail className="w-4 h-4" /> {email}</span>
                <span className="flex items-center gap-2"><Phone className="w-4 h-4" /> {phone}</span>
                <span className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {address}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-12">
              <div className="md:col-span-1 space-y-12">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-6 border-b border-emerald-100 pb-2">Profile</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{summary}</p>
                </section>
                
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-6 border-b border-emerald-100 pb-2">Education</h3>
                  {education.map((edu, i) => (
                    <div key={i} className="mb-6">
                      <div className="font-bold text-slate-800 text-sm">{edu.school}</div>
                      <div className="text-xs text-slate-500 italic mb-1">{edu.degree}</div>
                      <div className="text-[10px] font-black text-emerald-500 uppercase">{edu.year}</div>
                    </div>
                  ))}
                </section>
              </div>

              <div className="md:col-span-2">
                <section>
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600 mb-8 border-b border-emerald-100 pb-2">Professional Experience</h3>
                  <div className="space-y-10">
                    {experiences.map((exp, i) => (
                      <div key={i} className="relative pl-6 before:absolute before:left-0 before:top-2 before:w-1 before:h-full before:bg-slate-100">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-lg text-slate-800 leading-tight">{exp.role}</h4>
                          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">{exp.duration}</span>
                        </div>
                        <div className="text-sm font-bold text-emerald-600 mb-3">{exp.company}</div>
                        <p className="text-sm text-slate-600 leading-relaxed">{exp.desc}</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .min-h-screen { min-height: auto !important; }
          main { padding: 0 !important; margin: 0 !important; max-width: 100% !important; }
          #resume-preview { 
            box-shadow: none !important; 
            padding: 0 !important; 
            margin: 0 !important;
            width: 100% !important;
          }
          nav { display: none !important; }
          footer { display: none !important; }
        }
      `}</style>
    </div>
  );
}
