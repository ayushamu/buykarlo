"use client"

import React from "react"
import { ShieldCheck, MessageSquare, Users } from "lucide-react"

interface AuthLayoutProps {
  children: React.ReactNode
  step?: number
  stepTitle?: string
}

export function AuthLayout({ children, step = 1, stepTitle = "Getting Started" }: AuthLayoutProps) {
  const progressPercent = step * 25

  return (
    <main className="min-h-screen w-full flex bg-surface overflow-hidden relative">
      {/* CSS Keyframes injected dynamically */}
      <style jsx global>{`
        @keyframes float-laptop {
          0%, 100% { transform: translateY(0px) rotate(-2deg); }
          50% { transform: translateY(-15px) rotate(-1deg); }
        }
        @keyframes float-books {
          0%, 100% { transform: translateY(0px) rotate(3deg); }
          50% { transform: translateY(-20px) rotate(4deg); }
        }
        @keyframes float-cycle {
          0%, 100% { transform: translateY(0px) rotate(-6deg); }
          50% { transform: translateY(18px) rotate(-4deg); }
        }
        @keyframes float-hostel {
          0%, 100% { transform: translateY(0px) rotate(2deg); }
          50% { transform: translateY(-12px) rotate(3deg); }
        }
        .animate-float-laptop { animation: float-laptop 6s ease-in-out infinite; }
        .animate-float-books { animation: float-books 8s ease-in-out infinite; animation-delay: 1s; }
        .animate-float-cycle { animation: float-cycle 7s ease-in-out infinite; animation-delay: 0.5s; }
        .animate-float-hostel { animation: float-hostel 9s ease-in-out infinite; animation-delay: 2s; }
        .mesh-gradient-bg {
          background-color: #f7f9fb;
          background-image: 
            radial-gradient(at 0% 0%, rgba(79, 70, 229, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 0%, rgba(139, 78, 247, 0.12) 0px, transparent 50%),
            radial-gradient(at 100% 100%, rgba(53, 37, 205, 0.08) 0px, transparent 50%),
            radial-gradient(at 0% 100%, rgba(113, 46, 221, 0.08) 0px, transparent 50%);
          background-size: 200% 200%;
        }
        .custom-glass-card {
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4);
        }
        .pulse-soft-badge {
          animation: pulse-soft-badge-anim 2s infinite;
        }
        @keyframes pulse-soft-badge-anim {
          0% { box-shadow: 0 0 0 0 rgba(53, 37, 205, 0.4); }
          70% { box-shadow: 0 0 0 8px rgba(53, 37, 205, 0); }
          100% { box-shadow: 0 0 0 0 rgba(53, 37, 205, 0); }
        }
      `}</style>

      {/* Left Section (60% width) - Hidden on Mobile */}
      <section className="hidden lg:flex lg:w-3/5 relative flex-col justify-between p-12 mesh-gradient-bg overflow-hidden border-r border-border/20">
        {/* Background Illustration Overlay */}
        <div className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none mix-blend-multiply">
          <img 
            alt="Campus Context" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida/AP1WRLsitODfbUyEFi9PlLnVO_HbOeCV0JsvKQSNm834jLpumJKlHgT1VHitSJ1QxDmUGTYVIjo5f5ou8ENg7j08TzucJM9XOQSTs7tqDgsL9pmUN8Y31-QT-VNXF37nVF8Gj_IsdvZXUxaGluc67IZ0NKj3LtPZxEKgqd5W-ckI3o1CV-frm-nF8iqJI6A4NrN6WlxZM3lss32Fdwy21TBphNzwJhB3Qgg3PHFAo4WrktEAgcENqDbeExdAsTo"
          />
        </div>

        {/* Header Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10">
            <div className="size-10 rounded-xl action-gradient flex items-center justify-center text-white shadow-accent">
              <ShieldCheck className="size-6" />
            </div>
            <span className="font-display text-2xl font-black text-slate-800 tracking-tighter">BuyKarlo</span>
          </div>
          
          <h1 className="font-display text-4xl font-black text-slate-800 leading-tight">
            Buy. Sell. <span className="text-primary font-black">Connect.</span>
          </h1>
          <p className="font-body text-sm text-on-surface-variant max-w-md mt-3 leading-relaxed">
            The trusted marketplace built exclusively for Aligarh Muslim University (AMU) students. Find everything you need for campus life in one secure place.
          </p>
        </div>

        {/* Floating Marketplace Elements (Visual Bento) */}
        <div className="relative z-10 flex-grow grid grid-cols-2 gap-6 mt-8 pointer-events-none max-w-xl mx-auto w-full">
          {/* Laptop Listing */}
          <div className="animate-float-laptop custom-glass-card rounded-2xl p-3 shadow-md self-start justify-self-end w-56 transform -rotate-2">
            <div className="h-24 bg-slate-100 rounded-lg mb-2 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="MacBook Pro"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtV3JXe1px5MSKMnxKeqqDDhFTYudmz1eK-iigWqn8CZ5-mngz0WU-9JD5BgSYWEbYD4-q_sPRGWYANI6tkHul-4HYkod6DlO_yPHpp_kXlcSSKD8LyvyPz4fwdeoTIvhXj5Lrczbk-Q0oty4S1P32GzHpmg-oivUhBrclyqqL6clO1j56VTxEez1_ICPm5o5EgA0ygg-pgGRl_4RwKHQqGABtWbK416Sqz-CwYLhGOdAnGPOYNPjn4fpjdGv0zcYQ7Ly2a-HwOLg"
              />
            </div>
            <div className="flex justify-between items-start text-xs font-body">
              <div>
                <p className="font-bold text-slate-800">MacBook Pro M1</p>
                <p className="text-primary font-black mt-0.5">₹75,000</p>
              </div>
              <span className="bg-primary/10 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold pulse-soft-badge">New</span>
            </div>
          </div>

          {/* Books Listing */}
          <div className="animate-float-books custom-glass-card rounded-2xl p-3 shadow-md self-center w-48 transform rotate-3">
            <div className="h-28 bg-slate-100 rounded-lg mb-2 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="DSA Book"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDl73hxQFiUFedag5-P1qOHh4k47tl8-jY5LAZIh03iFHKfgKM5NGwFP_3_oFC8f7xRyzv9PiEQIC3Q_ygO46SCZlSpZEwvg5I42pl0FgYgkD-wa0q1IVal1G0oXaLgjA-AhiceeaOynrHVHr4IleJMQMybg6Vw1YbFWTyJ0WQKesXW2a3io3NlydoxcKwjE5FtPjzpXFg5rwvAE-4zrFwq4BQ8HRyj2BQPEmI21eXXyJpTNqpgBC0EHdmqq3UufQVBi-nZE8fW8SQ"
              />
            </div>
            <p className="font-bold text-slate-800 text-xs truncate">Data Structures & Algo</p>
            <p className="text-secondary font-black text-xs mt-0.5">₹450</p>
          </div>

          {/* Cycle Listing */}
          <div className="animate-float-cycle custom-glass-card rounded-2xl p-3 shadow-md self-end justify-self-center w-52 transform -rotate-6">
            <div className="h-24 bg-slate-100 rounded-lg mb-2 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="MTB Cycle"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDlK0RjvRdP0UymLyXlfHppRVl05HkZhk8Ps_hVcCsxcFehEqBegj0rEffdNhxibv57imdwJbFLfNJ289wcPvr2nulm56irN7T0d1okDXjgROqD0cVIIJgaeTh6aMlzrsKSCbtp-p7gjCANL2e7sKEM70qnNAZ9mN206EL29JY04_yppwGPTbUhs1NwNvQwWDwUFVDRGqmBDX5vmWIG7yPKimrJ4b6sXLk5gJMbPxbKkTPSMCIBnYYI-bboGRWsjjmyf83QHWKlt74"
              />
            </div>
            <p className="font-bold text-slate-800 text-xs truncate">Hercules MTB 2.0</p>
            <p className="text-primary font-black text-xs mt-0.5">₹4,200</p>
          </div>

          {/* Hostel Essentials */}
          <div className="animate-float-hostel custom-glass-card rounded-2xl p-3 shadow-md self-center justify-self-start w-44 transform rotate-2">
            <div className="h-20 bg-slate-100 rounded-lg mb-2 overflow-hidden">
              <img 
                className="w-full h-full object-cover" 
                alt="Lamp"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuANXabPLfsJBIcSCSyftTy-_R4pSv56fr3GZEo81ccq48nyY6eRZhtya4mciBF-ezd0w0J3qkTxAewJooa2lejdXbsq0m7RCMZjMmub8K4DWFeDhSReyURbXkFVzlmZ6OFxaTA4oqEwTZG8cY0ooTUOOp1nJg992u1P2VHKgxfYzK92U4j7CW_Fm9Z66xf8kzeAKc1Cm8kWKJU7IEZl9ZCcPivRpWaNTC35Ir-fcAxYldy414VPV9yjAp_t7J8d7CpAGMqB3Z_Wfzc"
              />
            </div>
            <p className="font-bold text-slate-800 text-xs truncate">Desk Lamp + Organizer</p>
            <p className="text-slate-600 font-black text-xs mt-0.5">₹899</p>
          </div>
        </div>

        {/* Trust Badges Footer */}
        <div className="relative z-10 flex justify-between border-t border-border/20 pt-6 text-xs font-semibold text-on-surface-variant font-body">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="size-4 text-primary" />
            <span>Student Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <MessageSquare className="size-4 text-primary" />
            <span>Secure Messaging</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="size-4 text-primary" />
            <span>Campus Community</span>
          </div>
        </div>
      </section>

      {/* Right Section (40% width) - Authentication Forms */}
      <section className="w-full lg:w-2/5 flex flex-col justify-center items-center p-6 md:p-12 bg-white relative">
        <div className="w-full max-w-md space-y-6">
          
          {/* Top Progress Bar */}
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider">
              <span className="text-primary">Step {step} of 4</span>
              <span className="text-on-surface-variant">{stepTitle}</span>
            </div>
            <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full action-gradient rounded-full transition-all duration-500" 
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
          </div>

          {/* Form Content */}
          <div className="w-full">
            {children}
          </div>

        </div>
      </section>
    </main>
  )
}
