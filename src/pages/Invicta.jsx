// src/pages/Invicta.jsx
import React, { useEffect, useState } from 'react';
import { CloudinaryService } from '../services/cloudinaryService';
import { InvictaService } from '../services/invictaService';
import { toast } from 'react-hot-toast';

const WORKSHOPS = [
  { id: 'build-it-better', label: 'Build It Better' },
  { id: 'cam-vision', label: 'Cam Vision' },
  { id: 'blendforge', label: 'Blendforge' },
  { id: 'crystal-clear', label: 'Crystal Clear' },
  { id: 'microcontroller', label: 'Microcontroller' },
];

const Invicta = () => {
  const [config, setConfig] = useState({ qrUrl: '', upiId: '', amount: '', accountName: '', note: '' });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    college: '',
    workshop: '',
    paymentProofUrl: '',
    paymentProofPublicId: '',
  });

  useEffect(() => {
    (async () => {
      const cfg = await InvictaService.getConfig();
      setConfig(cfg || {});
    })();
  }, []);

  const onChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file for payment proof');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large. Max 5MB');
      return;
    }

    try {
      CloudinaryService.validateEnvironment();
      setUploading(true);
      const res = await CloudinaryService.uploadFile(file, {
        folder: 'invicta',
        domain: 'payment-proof',
        transformation: 'q_auto:eco',
      });
      setForm((f) => ({
        ...f,
        paymentProofUrl: res.secure_url,
        paymentProofPublicId: res.public_id,
      }));
      toast.success('Payment proof uploaded');
    } catch (e) {
      console.error(e);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    if (!form.name.trim()) return 'Name is required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Valid email is required';
    if (!form.college.trim()) return 'College is required';
    if (!form.workshop) return 'Please select a workshop';
    if (!form.paymentProofUrl) return 'Please upload payment proof screenshot';
    return '';
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }

    try {
      setLoading(true);
      await InvictaService.saveRegistration(form);
      toast.success('Registration submitted successfully!');
      setForm({ name: '', email: '', college: '', workshop: '', paymentProofUrl: '', paymentProofPublicId: '' });
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white">
      <div className="max-w-5xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-400">Invicta 2025</h1>
          <p className="mt-3 text-slate-300 max-w-2xl mx-auto">Inter-college event featuring five immersive, hands-on workshops. Choose one and elevate your skills.</p>
        </div>

        {/* Workshops overview */}
        <div className="grid md:grid-cols-3 gap-5 mb-10">
          {WORKSHOPS.map((w) => (
            <div key={w.id} className="rounded-xl border border-slate-700/60 bg-slate-800/40 p-4">
              <h3 className="text-lg font-semibold text-white">{w.label}</h3>
              <p className="mt-2 text-sm text-slate-300">Hands-on guided session with real-world applications. Limited seats. Certificates provided.</p>
            </div>
          ))}
        </div>

        {/* Payment instructions */}
        <div className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6 mb-10">
          <h2 className="text-2xl font-bold mb-4">Registration & Payment</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              {config.qrUrl ? (
                <img src={config.qrUrl} alt="Payment QR" className="w-full max-w-xs rounded-lg border border-slate-700" />
              ) : (
                <div className="w-full max-w-xs h-56 rounded-lg bg-slate-700/40 border border-slate-700 flex items-center justify-center text-slate-300">
                  Payment QR not configured
                </div>
              )}
              <div className="mt-4 space-y-1 text-sm text-slate-300">
                <div><span className="text-slate-400">Amount:</span> ₹{config.amount || '—'}</div>
                <div><span className="text-slate-400">UPI ID:</span> {config.upiId || '—'}</div>
                <div><span className="text-slate-400">Account:</span> {config.accountName || '—'}</div>
                <div><span className="text-slate-400">Note:</span> {config.note || 'Invicta workshop fee'}</div>
              </div>
            </div>
            <ol className="list-decimal pl-5 text-slate-300 text-sm space-y-2">
              <li>Open your UPI app and scan the QR or pay to the UPI ID shown.</li>
              <li>Use note/reference: <span className="font-semibold text-white">{config.note || 'Invicta workshop fee'}</span>.</li>
              <li>Take a screenshot of the payment confirmation.</li>
              <li>Fill the form and upload the payment screenshot.</li>
              <li>Submit the form. You will receive confirmation via email.</li>
            </ol>
          </div>
        </div>

        {/* Registration form */}
        <form onSubmit={onSubmit} className="rounded-2xl border border-slate-700/60 bg-slate-800/40 p-6">
          <h2 className="text-2xl font-bold mb-6">Registration Form</h2>

          <div className="grid md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm text-slate-300 mb-1">Full Name</label>
              <input name="name" value={form.name} onChange={onChange} className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g., Shivam Patil" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Email</label>
              <input name="email" value={form.email} onChange={onChange} type="email" className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="you@example.com" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">College</label>
              <input name="college" value={form.college} onChange={onChange} className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Your College Name" />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1">Select Workshop (choose one)</label>
              <select name="workshop" value={form.workshop} onChange={onChange} className="w-full rounded-lg bg-slate-900/60 border border-slate-700 px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">-- Select --</option>
                {WORKSHOPS.map(w => (
                  <option key={w.id} value={w.id}>{w.label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5">
            <label className="block text-sm text-slate-300 mb-2">Upload Payment Proof (screenshot, max 5MB)</label>
            {form.paymentProofUrl && (
              <div className="mb-3">
                <img src={form.paymentProofUrl} alt="Payment Proof" className="max-h-48 rounded border border-slate-700" />
              </div>
            )}
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" onChange={(e) => handleUpload(e.target.files?.[0])} className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500" />
              {uploading && <span className="text-slate-300">Uploading...</span>}
            </div>
          </div>

          <div className="mt-8">
            <button type="submit" disabled={loading || uploading} className="w-full md:w-auto px-6 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 font-semibold">
              {loading ? 'Submitting...' : 'Submit Registration'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-slate-400 text-sm">This page is public. You can share the link with anyone: <span className="text-slate-200">/invicta</span></p>
      </div>
    </div>
  );
};

export default Invicta;
