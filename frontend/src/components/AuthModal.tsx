import React, { useState, useEffect } from "react";
import { X, Phone, ShieldCheck, CheckCircle2, User, Loader2 } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  const [loginMethod, setLoginMethod] = useState<"phone" | "id">("phone");
  const [step, setStep] = useState<"input" | "otp" | "success">("input");
  
  const [phone, setPhone] = useState("");
  const [govId, setGovId] = useState("");
  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(30);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // OTP Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => setTimer(t => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  if (!isOpen) return null;

  const handleGovIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Format ####-####-####
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 12) val = val.substring(0, 12);
    
    let formatted = "";
    for (let i = 0; i < val.length; i++) {
      if (i > 0 && i % 4 === 0) formatted += "-";
      formatted += val[i];
    }
    setGovId(formatted);
  };

  const maskGovId = (id: string) => {
    if (!id || id.length < 12) return id;
    const clean = id.replace(/\D/g, "");
    return `XXXX-XXXX-${clean.substring(8)}`;
  };

  const handleSendOtp = () => {
    setError("");
    if (loginMethod === "phone" && phone.length < 10) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (loginMethod === "id" && govId.replace(/\D/g, "").length !== 12) {
      setError("Please enter a valid 12-digit Gov ID.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("otp");
      setTimer(30);
    }, 1000);
  };

  const handleVerifyOtp = () => {
    setError("");
    if (otp !== "123456") {
      setError("Invalid OTP. Try 123456 for demo.");
      return;
    }
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep("success");
      setTimeout(() => {
        onSuccess();
        onClose();
        reset();
      }, 1500);
    }, 1000);
  };

  const reset = () => {
    setStep("input");
    setPhone("");
    setGovId("");
    setOtp("");
    setError("");
    setActiveTab("login");
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 bg-gray-100 rounded-full p-1 transition">
          <X size={20} />
        </button>

        <div className="bg-[#003366] text-white p-6 text-center">
          <ShieldCheck size={36} className="mx-auto mb-3 text-emerald-400" />
          <h2 className="text-xl font-bold">Citizen Authentication</h2>
          <p className="text-blue-200 text-sm mt-1">Official National Portal Gateway</p>
        </div>

        {step === "success" ? (
          <div className="p-10 text-center flex flex-col items-center">
            <CheckCircle2 size={64} className="text-emerald-500 mb-4 animate-bounce" />
            <h3 className="text-2xl font-bold text-gray-800">Verified Successfully!</h3>
            <p className="text-gray-500 mt-2">
              {loginMethod === "phone" ? "Phone verified." : `ID verified: ${maskGovId(govId)}`}
            </p>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
              <button 
                onClick={() => { setActiveTab("login"); setStep("input"); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${activeTab === "login" ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
              >
                Citizen Login
              </button>
              <button 
                onClick={() => { setActiveTab("register"); setStep("input"); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${activeTab === "register" ? 'bg-white shadow text-blue-900' : 'text-gray-500'}`}
              >
                New Registration
              </button>
            </div>

            {step === "input" && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-left-4">
                <div className="flex gap-4 border-b border-gray-200 pb-2">
                  <button onClick={() => setLoginMethod("phone")} className={`text-sm font-semibold pb-2 border-b-2 transition ${loginMethod === "phone" ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>
                    Use Phone
                  </button>
                  <button onClick={() => setLoginMethod("id")} className={`text-sm font-semibold pb-2 border-b-2 transition ${loginMethod === "id" ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500'}`}>
                    Use Gov ID
                  </button>
                </div>

                {loginMethod === "phone" ? (
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Mobile Number *</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="10-digit mobile number" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-sm font-bold text-gray-700 mb-1 block">Government ID (Aadhaar/EPIC) *</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                      <input 
                        type="text" 
                        value={govId}
                        onChange={handleGovIdChange}
                        placeholder="####-####-####" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      ID securely masked (e.g., XXXX-XXXX-1234)
                    </p>
                  </div>
                )}

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button 
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full bg-[#003366] hover:bg-blue-800 text-white font-bold py-3 rounded-xl mt-2 transition flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Send OTP"}
                </button>
              </div>
            )}

            {step === "otp" && (
              <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-right-4 text-center">
                <p className="text-gray-600 text-sm">
                  We've sent a 6-digit verification code to <br/>
                  <strong className="text-gray-900">{loginMethod === "phone" ? `+91 ${phone}` : maskGovId(govId)}</strong>
                </p>

                <div>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").substring(0, 6))}
                    placeholder="• • • • • •" 
                    className="w-full text-center tracking-[1em] text-xl font-bold py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <p className="text-xs text-emerald-600 font-semibold mt-2">Demo mode: Enter 123456</p>
                </div>

                {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

                <button 
                  onClick={handleVerifyOtp}
                  disabled={isLoading || otp.length !== 6}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white font-bold py-3 rounded-xl transition flex justify-center items-center gap-2"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={20} /> : "Verify & Login"}
                </button>

                <p className="text-sm text-gray-500 mt-2">
                  {timer > 0 ? (
                    `Resend code in ${timer}s`
                  ) : (
                    <button onClick={() => setTimer(30)} className="text-blue-600 font-bold hover:underline">Resend OTP</button>
                  )}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
