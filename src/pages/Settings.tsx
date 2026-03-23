import { useState } from "react";
import { useStore } from "../store/useStore";
import { motion } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
import {
  Settings as SettingsIcon,
  Store,
  Users,
  CreditCard,
  Save,
  MessageSquare,
  QrCode,
  Smartphone,
  Link as LinkIcon,
  Check
} from "lucide-react";

export default function Settings() {
  const businesses = useStore((state) => state.businesses);
  const updateBusiness = useStore((state) => state.updateBusiness);
  const business = businesses[0]; // Default business for MVP
  const [copied, setCopied] = useState(false);
  const [selectedStaffForQR, setSelectedStaffForQR] = useState("");
  const [waPhone, setWaPhone] = useState("");

  const baseFeedbackUrl = `https://echomictap.in/feedback/${business.id}`;
  
  const qrFeedbackUrl = selectedStaffForQR 
    ? `${baseFeedbackUrl}?source=qr&staffId=${selectedStaffForQR}&qr_id=qr_${Math.random().toString(36).substring(7)}`
    : `${baseFeedbackUrl}?source=qr&qr_id=qr_general`;

  const waFeedbackUrl = `${baseFeedbackUrl}?source=wa`;

  const handleCopy = () => {
    navigator.clipboard.writeText(baseFeedbackUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const canvas = document.getElementById("qr-code-canvas") as HTMLCanvasElement;
    if (canvas) {
      const pngUrl = canvas
        .toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `${business.name.replace(/\s+/g, '_')}_QR.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  const handleWhatsApp = () => {
    if (!waPhone) {
      alert("Please enter a phone number first.");
      return;
    }
    const text = encodeURIComponent(`Hi! Please share your feedback for ${business.name} here: ${waFeedbackUrl}`);
    window.open(`https://wa.me/${waPhone.replace(/\D/g, '')}?text=${text}`, '_blank');
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 dark:bg-zinc-950 p-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-zinc-50">Settings</h1>
        <p className="text-slate-500 dark:text-zinc-400 mt-1">Manage your business setup</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-zinc-800 p-6 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Store className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                Business Info
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  defaultValue={business.name}
                  onChange={(e) => updateBusiness(business.id, { name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-zinc-300 mb-1">
                  Custom Feedback Prompt
                </label>
                <input
                  type="text"
                  defaultValue={business.customPrompt}
                  onChange={(e) => updateBusiness(business.id, { customPrompt: e.target.value })}
                  placeholder="e.g. Aaj service kaisi lagi?"
                  className="w-full px-4 py-2 border border-slate-200 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-500 dark:text-zinc-500 mt-1">This is what customers will see when they scan your QR code.</p>
              </div>
            </div>
          </motion.div>

          {/* Collection Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-zinc-800 p-6 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                Collection Channels
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="hidden">
                  <QRCodeCanvas id="qr-code-canvas" value={qrFeedbackUrl} size={512} level="H" />
                </div>
                <QrCode className="w-12 h-12 text-slate-700 dark:text-zinc-300 mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Smart QR Code</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-3">Print and place on tables or counters.</p>
                <select 
                  className="w-full mb-3 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm outline-none bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-blue-500"
                  value={selectedStaffForQR}
                  onChange={(e) => setSelectedStaffForQR(e.target.value)}
                >
                  <option value="">General (No Staff)</option>
                  {business.staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button 
                  onClick={downloadQR}
                  className="mt-auto px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors w-full"
                >
                  Download QR
                </button>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center">
                <Smartphone className="w-12 h-12 text-green-600 dark:text-green-400 mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100">WhatsApp Bot</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 mb-3">Auto-send feedback links to customers.</p>
                <input 
                  type="text" 
                  placeholder="Customer Phone (e.g. 919876543210)"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full mb-3 px-3 py-1.5 border border-slate-200 dark:border-zinc-700 rounded-lg text-sm outline-none bg-white dark:bg-zinc-800 text-slate-900 dark:text-zinc-100 focus:border-green-500"
                />
                <button 
                  onClick={handleWhatsApp}
                  className="mt-auto px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-lg text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors w-full"
                >
                  Send via WhatsApp
                </button>
              </div>

              <div className="border border-slate-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col items-center text-center md:col-span-2">
                <LinkIcon className="w-8 h-8 text-slate-700 dark:text-zinc-300 mb-3" />
                <h3 className="font-semibold text-slate-900 dark:text-zinc-100">Direct Link</h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">Share via email or SMS. Supports metadata like ?user_id=123&order_id=456</p>
                <div className="flex items-center gap-2 w-full mt-3">
                  <input
                    type="text"
                    readOnly
                    value={baseFeedbackUrl}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-slate-500 dark:text-zinc-400 text-sm outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-zinc-700 transition-colors shrink-0"
                  >
                    {copied ? <><Check className="w-4 h-4 text-green-600" /> Copied</> : "Copy"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Staff List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-zinc-800 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                  Team & Roles
                </h2>
              </div>
              <button className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors text-sm">
                + Add Member
              </button>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-zinc-800">
              {business.staff.map((staff) => (
                <div
                  key={staff.id}
                  className="py-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={staff.avatarUrl}
                      alt={staff.name}
                      className="w-10 h-10 rounded-full border border-slate-200 dark:border-zinc-800"
                    />
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-zinc-50 flex items-center gap-2">
                        {staff.name}
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded text-[10px] uppercase font-bold tracking-wider">
                          {staff.role}
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-zinc-500">ID: {staff.id}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-sm font-medium text-slate-500 hover:text-blue-600 transition-colors">
                      Edit
                    </button>
                    <button className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-zinc-900 rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 dark:border-zinc-800 p-6 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-zinc-50">
                Subscription
              </h2>
            </div>

            <div className="p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white mb-6">
              <h3 className="text-lg font-bold mb-1">Pro Plan</h3>
              <p className="text-blue-100 text-sm mb-4">₹999 / month</p>
              <div className="text-xs text-blue-200 mb-1">
                Next billing date:
              </div>
              <div className="font-medium">15 April 2026</div>
            </div>

            <button className="w-full py-2 border border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors">
              Manage Billing
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
