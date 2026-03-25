import { useState, useEffect, useRef } from "react";
import { useStore, Role, Staff } from "../store/useStore";
import { motion, AnimatePresence } from "motion/react";
import { QRCodeCanvas } from "qrcode.react";
// @ts-ignore
import { getColor } from "colorthief";
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
  Check,
  Loader2,
  LogOut,
  Upload,
  Palette,
  RefreshCw,
  Plus,
  Trash2,
  UserPlus,
  Coffee,
  Moon,
  Sun,
  Star,
  X
} from "lucide-react";

export default function Settings() {
  const businesses = useStore((state) => state.businesses);
  const updateBusiness = useStore((state) => state.updateBusiness);
  const userProfile = useStore((state) => state.userProfile);
  const isProfileLoaded = useStore((state) => state.isProfileLoaded);
  const business = businesses[0]; // Default business for MVP
  const [copied, setCopied] = useState(false);
  const [selectedStaffForQR, setSelectedStaffForQR] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState("");
  const [newStaffRole, setNewStaffRole] = useState<Role>("staff");
  
  const [businessName, setBusinessName] = useState(business?.name || "");
  const [customPrompt, setCustomPrompt] = useState(business?.customPrompt || "");
  const [logo, setLogo] = useState(business?.logo || "");
  const [offers, setOffers] = useState(business?.offers || []);
  const [loyaltyConfig, setLoyaltyConfig] = useState(business?.loyaltyConfig || {
    feedbackThreshold: 10,
    discountValue: "10% off",
    isEnabled: false
  });
  const [theme, setTheme] = useState(business?.theme || {
    primaryColor: "#000000",
    secondaryColor: "#000000",
    accentColor: "#000000",
    isAuto: true
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Update local state when business data changes from store
  useEffect(() => {
    if (business) {
      setBusinessName(business.name);
      setCustomPrompt(business.customPrompt);
      setLogo(business.logo || "");
      setOffers(business.offers || []);
      setLoyaltyConfig(business.loyaltyConfig || {
        feedbackThreshold: 10,
        discountValue: "10% off",
        isEnabled: false
      });
      setTheme(business.theme || {
        primaryColor: "#000000",
        secondaryColor: "#000000",
        accentColor: "#000000",
        isAuto: true
      });
    }
  }, [business]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check file size (max 500KB for Firestore base64)
      if (file.size > 500000) {
        alert("Logo file is too large. Please use a file smaller than 500KB.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setLogo(base64);
        if (theme.isAuto) {
          extractColors(base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const extractColors = (imgUrl: string) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = imgUrl;
    img.onload = async () => {
      try {
        const color = await getColor(img);
        if (color) {
          const rgb = color.rgb();
          const hex = `#${rgb.r.toString(16).padStart(2, '0')}${rgb.g.toString(16).padStart(2, '0')}${rgb.b.toString(16).padStart(2, '0')}`;
          setTheme(prev => ({ ...prev, primaryColor: hex }));
        }
      } catch (err) {
        console.error("Error extracting colors:", err);
      }
    };
  };

  const handleSaveBusiness = async () => {
    if (!business) return;
    setIsSaving(true);
    try {
      await updateBusiness(business.id, {
        name: businessName,
        customPrompt: customPrompt,
        logo: logo,
        offers: offers,
        loyaltyConfig: loyaltyConfig,
        theme: theme
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save business info:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddOffer = () => {
    setOffers([...offers, { title: "", description: "" }]);
  };

  const handleUpdateOffer = (index: number, field: "title" | "description", value: string) => {
    const newOffers = [...offers];
    newOffers[index][field] = value;
    setOffers(newOffers);
  };

  const handleRemoveOffer = (index: number) => {
    setOffers(offers.filter((_, i) => i !== index));
  };

  const handleAddStaffMember = async () => {
    if (!business || !newStaffName) return;
    const newStaff: Staff = {
      id: `staff_${Math.random().toString(36).substring(7)}`,
      name: newStaffName,
      role: newStaffRole,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${newStaffName}`,
      status: "active",
      impression: 85
    };
    
    await updateBusiness(business.id, {
      staff: [...(business.staff || []), newStaff]
    });
    
    setNewStaffName("");
    setIsAddingStaff(false);
  };

  const handleRemoveStaffMember = async (staffId: string) => {
    if (!business) return;
    await updateBusiness(business.id, {
      staff: business.staff.filter(s => s.id !== staffId)
    });
  };

  const handleUpdateStaffStatus = async (staffId: string, status: Staff["status"]) => {
    if (!business) return;
    await updateBusiness(business.id, {
      staff: business.staff.map(s => s.id === staffId ? { ...s, status } : s)
    });
  };

  if (!isProfileLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (isProfileLoaded && !userProfile?.businessId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50 p-6">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Store className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Setup Required</h2>
          <p className="text-slate-600 mb-8">
            We couldn't find a business associated with your account. Please contact your administrator or set up your business.
          </p>
          <div className="flex flex-col gap-3">
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex-1 flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading settings...</p>
        </div>
      </div>
    );
  }

  const baseFeedbackUrl = `${window.location.origin}/feedback/${business.id}`;
  
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
    <div className="flex-1 overflow-y-auto bg-slate-50 p-8 transition-colors duration-300">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your business setup</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Store className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Business Info
                </h2>
              </div>
              <button
                onClick={handleSaveBusiness}
                disabled={isSaving}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  saveSuccess 
                    ? "bg-green-100 text-green-600" 
                    : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
                } disabled:opacity-50`}
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {saveSuccess ? "Saved!" : "Save Changes"}
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Business Name
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Custom Feedback Prompt
                </label>
                <input
                  type="text"
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="e.g. Aaj service kaisi lagi?"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
                <p className="text-xs text-slate-500 mt-1">This is what customers will see when they scan your QR code.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Business Logo
                </label>
                <div className="flex items-center gap-6 p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 hover:border-blue-400 transition-colors group relative overflow-hidden">
                  <div className="relative w-24 h-24 rounded-2xl bg-white shadow-sm border border-slate-100 flex items-center justify-center overflow-hidden shrink-0 group-hover:scale-105 transition-transform duration-300">
                    {logo ? (
                      <img src={logo} alt="Logo Preview" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                    ) : (
                      <Store className="w-8 h-8 text-slate-300" />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-slate-900 mb-1">Upload your brand mark</h4>
                    <p className="text-xs text-slate-500 mb-3 leading-relaxed">
                      This will be displayed on your feedback page and QR codes. PNG or JPG, max 500KB.
                    </p>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleLogoUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Theme Customization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <Palette className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Brand Theme
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Auto-detect</span>
                <button
                  onClick={() => setTheme({ ...theme, isAuto: !theme.isAuto })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${theme.isAuto ? "bg-indigo-500" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${theme.isAuto ? "translate-x-6" : ""}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Primary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value, isAuto: false })}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.primaryColor}
                    onChange={(e) => setTheme({ ...theme, primaryColor: e.target.value, isAuto: false })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Secondary Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value, isAuto: false })}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.secondaryColor}
                    onChange={(e) => setTheme({ ...theme, secondaryColor: e.target.value, isAuto: false })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Accent Color
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value, isAuto: false })}
                    className="w-10 h-10 rounded-lg border-none cursor-pointer"
                  />
                  <input
                    type="text"
                    value={theme.accentColor}
                    onChange={(e) => setTheme({ ...theme, accentColor: e.target.value, isAuto: false })}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono"
                  />
                </div>
              </div>
            </div>

            {theme.isAuto && logo && (
              <div className="mt-6 p-3 bg-indigo-50 rounded-lg flex items-center gap-3">
                <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin-slow" />
                <p className="text-xs text-indigo-700">
                  Colors are being automatically extracted from your logo. Disable "Auto-detect" to set custom colors.
                </p>
              </div>
            )}
          </motion.div>

          {/* Feedback Page Customization */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center">
                  <Smartphone className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 leading-none">
                    Feedback Page Offers
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">These will appear in the moving marquee</p>
                </div>
              </div>
              <button
                onClick={handleAddOffer}
                className="px-4 py-2 bg-pink-600 text-white rounded-xl font-semibold hover:bg-pink-700 transition-all text-sm shadow-sm shadow-pink-100"
              >
                + Add Offer
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {offers.map((offer, index) => (
                <motion.div 
                  key={index}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-5 bg-slate-50/50 border border-slate-100 rounded-2xl relative group hover:bg-white hover:border-pink-200 hover:shadow-md transition-all duration-300"
                >
                  <button
                    onClick={() => handleRemoveOffer(index)}
                    className="absolute -top-2 -right-2 p-1.5 bg-white border border-slate-200 text-slate-400 hover:text-red-500 hover:border-red-100 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                  >
                    <LogOut className="w-3.5 h-3.5 rotate-180" />
                  </button>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Offer Title</label>
                      <input
                        type="text"
                        value={offer.title}
                        onChange={(e) => handleUpdateOffer(index, "title", e.target.value)}
                        placeholder="e.g. 10% Off on Haircut"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Description</label>
                      <input
                        type="text"
                        value={offer.description}
                        onChange={(e) => handleUpdateOffer(index, "description", e.target.value)}
                        placeholder="e.g. Valid for first-time customers"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:ring-2 focus:ring-pink-500 focus:border-pink-500 outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {offers.length === 0 && (
                <div className="py-8 text-center text-slate-400 text-sm italic">
                  No offers added yet.
                </div>
              )}
            </div>
          </motion.div>

          {/* Loyalty System */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-yellow-600" />
                </div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Loyalty System
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-500">Enable</span>
                <button
                  onClick={() => setLoyaltyConfig({ ...loyaltyConfig, isEnabled: !loyaltyConfig.isEnabled })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${loyaltyConfig.isEnabled ? "bg-green-500" : "bg-slate-200"}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${loyaltyConfig.isEnabled ? "translate-x-6" : ""}`} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Feedback Threshold
                </label>
                <input
                  type="number"
                  value={loyaltyConfig.feedbackThreshold}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, feedbackThreshold: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Number of feedbacks for a reward.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Reward Description
                </label>
                <input
                  type="text"
                  value={loyaltyConfig.discountValue}
                  onChange={(e) => setLoyaltyConfig({ ...loyaltyConfig, discountValue: e.target.value })}
                  placeholder="e.g. 20% Off on next visit"
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">What the customer gets.</p>
              </div>
            </div>
          </motion.div>

          {/* Collection Channels */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-orange-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                Collection Channels
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="hidden">
                  <QRCodeCanvas id="qr-code-canvas" value={qrFeedbackUrl} size={512} level="H" />
                </div>
                <QrCode className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="font-semibold text-slate-900">Smart QR Code</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">Print and place on tables or counters.</p>
                <select 
                  className="w-full mb-3 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none bg-white text-slate-900 focus:border-blue-500"
                  value={selectedStaffForQR}
                  onChange={(e) => setSelectedStaffForQR(e.target.value)}
                >
                  <option value="">General (No Staff)</option>
                  {business.staff?.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
                <button 
                  onClick={downloadQR}
                  className="mt-auto px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors w-full"
                >
                  Download QR
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center">
                <Smartphone className="w-12 h-12 text-green-600 mb-3" />
                <h3 className="font-semibold text-slate-900">WhatsApp Bot</h3>
                <p className="text-xs text-slate-500 mt-1 mb-3">Auto-send feedback links to customers.</p>
                <input 
                  type="text" 
                  placeholder="Customer Phone (e.g. 919876543210)"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full mb-3 px-3 py-1.5 border border-slate-200 rounded-lg text-sm outline-none bg-white text-slate-900 focus:border-green-500"
                />
                <button 
                  onClick={handleWhatsApp}
                  className="mt-auto px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm font-medium hover:bg-green-100 transition-colors w-full"
                >
                  Send via WhatsApp
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center md:col-span-2">
                <LinkIcon className="w-8 h-8 text-slate-700 mb-3" />
                <h3 className="font-semibold text-slate-900">Direct Link</h3>
                <p className="text-xs text-slate-500 mt-1">Share via email or SMS. Supports metadata like ?user_id=123&order_id=456</p>
                <div className="flex items-center gap-2 w-full mt-3">
                  <input
                    type="text"
                    readOnly
                    value={baseFeedbackUrl}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm outline-none"
                  />
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors shrink-0"
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
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <Users className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 leading-none">
                    Team & Roles
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">Manage your staff and their status</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddingStaff(!isAddingStaff)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all text-sm shadow-sm"
              >
                {isAddingStaff ? "Cancel" : "+ Add Member"}
              </button>
            </div>

            <AnimatePresence>
              {isAddingStaff && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 overflow-hidden"
                >
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                        <input
                          type="text"
                          value={newStaffName}
                          onChange={(e) => setNewStaffName(e.target.value)}
                          placeholder="Staff Member Name"
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Role</label>
                        <select
                          value={newStaffRole}
                          onChange={(e) => setNewStaffRole(e.target.value as Role)}
                          className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        >
                          <option value="staff">Staff</option>
                          <option value="manager">Manager</option>
                          <option value="owner">Owner</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleAddStaffMember}
                      className="w-full py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-100 flex items-center justify-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Confirm Addition
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="divide-y divide-slate-100">
              {business.staff?.length > 0 ? (
                business.staff.map((staff) => (
                  <div
                    key={staff.id}
                    className="py-5 flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={staff.avatarUrl}
                          alt={staff.name}
                          className="w-12 h-12 rounded-full border-2 border-slate-100 shadow-sm"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          staff.status === "active" ? "bg-green-500" : 
                          staff.status === "break" ? "bg-yellow-500" : "bg-slate-400"
                        }`} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-slate-900">
                            {staff.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] uppercase font-bold tracking-wider">
                            {staff.role}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-500">
                            <Star className={`w-3 h-3 ${staff.impression && staff.impression > 80 ? "text-yellow-500 fill-yellow-500" : "text-slate-300"}`} />
                            Impression: <span className="text-slate-900">{staff.impression || 0}%</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => handleUpdateStaffStatus(staff.id, "active")}
                              className={`p-1 rounded-md transition-all ${staff.status === "active" ? "bg-green-100 text-green-600" : "text-slate-300 hover:text-green-500"}`}
                              title="Active"
                            >
                              <Sun className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStaffStatus(staff.id, "break")}
                              className={`p-1 rounded-md transition-all ${staff.status === "break" ? "bg-yellow-100 text-yellow-600" : "text-slate-300 hover:text-yellow-500"}`}
                              title="On Break"
                            >
                              <Coffee className="w-3 h-3" />
                            </button>
                            <button 
                              onClick={() => handleUpdateStaffStatus(staff.id, "off")}
                              className={`p-1 rounded-md transition-all ${staff.status === "off" ? "bg-slate-100 text-slate-600" : "text-slate-300 hover:text-slate-500"}`}
                              title="Off Duty"
                            >
                              <Moon className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleRemoveStaffMember(staff.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                        title="Remove Staff"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-200" />
                  </div>
                  <p className="text-slate-400 text-sm italic">
                    No team members added yet. Add your first staff member to get started.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        <div className="space-y-6">
          {/* Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-[0_2px_6px_rgba(0,0,0,0.08)] border border-slate-200 p-6 transition-colors"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
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

            <button className="w-full py-2 border border-slate-200 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition-colors">
              Manage Billing
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
