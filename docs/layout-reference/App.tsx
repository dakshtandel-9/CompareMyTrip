/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Zap, 
  ArrowUpRight, 
  Menu, 
  X, 
  Globe, 
  Download, 
  Copy, 
  Check, 
  Sliders, 
  Maximize2, 
  Minimize2,
  Sparkles,
  ChevronRight,
  Sun,
  ShieldCheck,
  TrendingUp,
  Mail,
  Phone,
  Building2,
  Share2
} from 'lucide-react';

export default function App() {
  const [activeNav, setActiveNav] = useState('Home');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState({ code: 'UK', label: 'United Kingdom (EN)' });
  const [aspectRatio, setAspectRatio] = useState<'fullscreen' | '16:9' | '21:9' | 'banner'>('fullscreen');
  const [showControls, setShowControls] = useState(false);
  const [copied, setCopied] = useState(false);
  const [customText, setCustomText] = useState({
    headline1: 'Clean and smart solar',
    headline2: 'energy for your business.',
    subtitle: 'Sustainable energy solutions made easy, reliable, and tailor-made for Europe.',
    cta: "Let's Talk Solar Solutions",
    statHeading: 'Clean energy generated',
    statBody: "Since 2019, we've generated over 946 GWh of clean, sustainable energy. This milestone represents not just power, but a commitment to a greener, healthier future",
    impactHeading: 'Impact',
    impactBody: "Our clean energy solutions currently benefit over 525,555 people. That's thousands of homes, businesses, and communities powered by renewable energy."
  });

  const bannerRef = useRef<HTMLDivElement>(null);

  const navItems = ['Home', 'Solutions', 'Projects', 'About us', 'Contact'];

  const languages = [
    { code: 'UK', label: 'United Kingdom (EN)', flag: '🇬🇧' },
    { code: 'NL', label: 'Netherlands (NL)', flag: '🇳🇱' },
    { code: 'DE', label: 'Germany (DE)', flag: '🇩🇪' },
    { code: 'FR', label: 'France (FR)', flag: '🇫🇷' },
    { code: 'ES', label: 'Spain (ES)', flag: '🇪🇸' },
  ];

  const handleCopyCode = () => {
    const bannerHTML = bannerRef.current?.outerHTML || '';
    navigator.clipboard.writeText(bannerHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-black text-white font-['DM_Sans',sans-serif] selection:bg-white selection:text-black flex flex-col items-center justify-start relative">
      
      {/* Top Floating Control Bar (Subtle & Non-intrusive for viewing/customizing the banner) */}
      <aside aria-label="Banner options" className="fixed top-3 right-3 z-50 flex items-center gap-2 bg-black/80 backdrop-blur-xl border border-white/15 px-3 py-1.5 rounded-full shadow-2xl transition-all">
        <button
          onClick={() => setShowControls(!showControls)}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          title="Banner Settings & View Modes"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>{showControls ? 'Hide Settings' : 'Banner Controls'}</span>
        </button>

        <button
          onClick={handleCopyCode}
          className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-white text-black hover:bg-white/90 transition-all cursor-pointer"
          title="Copy Banner Component HTML"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Copied' : 'Copy HTML'}</span>
        </button>
      </aside>

      {/* Control Drawer / Toolbar */}
      {showControls && (
        <div className="fixed top-14 right-3 z-50 w-80 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 shadow-2xl text-xs space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <span className="font-semibold text-sm text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-400" /> Banner Display Mode
            </span>
            <button 
              onClick={() => setShowControls(false)}
              className="text-white/60 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <label className="block text-white/70 font-medium mb-1.5">Canvas Aspect Ratio:</label>
            <div className="grid grid-cols-2 gap-1.5">
              {(['fullscreen', '16:9', '21:9', 'banner'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setAspectRatio(mode)}
                  className={`px-2.5 py-1.5 rounded-lg border text-center transition ${
                    aspectRatio === mode 
                      ? 'bg-white text-black border-white font-medium' 
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10'
                  }`}
                >
                  {mode === 'fullscreen' ? 'Full Window' : mode === '16:9' ? '16:9 Standard' : mode === '21:9' ? '21:9 Ultrawide' : 'Header (3:1)'}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10">
            <div className="text-[11px] text-white/60 flex items-center justify-between">
              <span>Typography:</span>
              <span className="font-medium text-white">DM Sans (Pure White)</span>
            </div>
            <div className="text-[11px] text-white/60 flex items-center justify-between mt-1">
              <span>Background:</span>
              <span className="font-medium text-white">#000000 (Pure Black)</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Banner Container */}
      <div 
        ref={bannerRef}
        className={`w-full bg-black text-white relative overflow-hidden transition-all duration-300 flex flex-col justify-between ${
          aspectRatio === 'fullscreen' 
            ? 'min-h-screen' 
            : aspectRatio === '16:9' 
            ? 'max-w-7xl my-8 aspect-[16/9] min-h-[680px] rounded-3xl border border-white/15 shadow-2xl' 
            : aspectRatio === '21:9'
            ? 'max-w-[1500px] my-8 aspect-[21/9] min-h-[600px] rounded-3xl border border-white/15 shadow-2xl'
            : 'max-w-7xl my-8 min-h-[560px] rounded-3xl border border-white/15 shadow-2xl'
        }`}
        style={{
          backgroundColor: '#000000',
        }}
      >
        {/* ========================================================================= */}
        {/* 1. TOP HEADER / NAVBAR                                                    */}
        {/* ========================================================================= */}
        <header className="w-full px-6 sm:px-10 md:px-14 pt-8 pb-4 flex items-center justify-between relative z-30">
          
          {/* Brand Logo - Exact Bold SUNROCK match */}
          <div className="flex items-center">
            <a 
              href="#home" 
              className="text-2xl sm:text-3xl font-extrabold tracking-wider text-white select-none hover:opacity-90 transition inline-block"
              style={{ letterSpacing: '0.04em' }}
            >
              SUNROCK
            </a>
          </div>

          {/* Center Navigation Pill Container */}
          <nav 
            aria-label="Main Navigation"
            className="hidden md:flex items-center bg-white/[0.08] backdrop-blur-xl border border-white/15 rounded-full p-1.5 shadow-lg shadow-black/40"
          >
            {navItems.map((item) => {
              const isActive = activeNav === item;
              return (
                <button
                  key={item}
                  onClick={() => {
                    setActiveNav(item);
                    if (item === 'Contact') setIsContactModalOpen(true);
                  }}
                  className={`px-5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-white text-black shadow-sm font-semibold'
                      : 'text-white/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Open menu pill */}
            <button
              onClick={() => setIsMenuOpen(true)}
              className="px-5 py-2 rounded-full bg-white/[0.12] hover:bg-white/[0.2] border border-white/20 text-white text-sm font-medium backdrop-blur-xl transition-all duration-200 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <span>Open menu</span>
              <Menu className="w-4 h-4 md:hidden" />
            </button>

            {/* Country / Language Selector Flag Badge */}
            <div className="relative">
              <button
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="w-10 h-10 rounded-full bg-white/[0.12] hover:bg-white/[0.2] border border-white/20 flex items-center justify-center backdrop-blur-xl transition active:scale-95 cursor-pointer overflow-hidden p-1"
                title="Select Region"
              >
                {/* SVG Union Jack Badge for high crispness */}
                <svg viewBox="0 0 60 30" className="w-6 h-6 rounded-full object-cover">
                  <clipPath id="uk-circle">
                    <circle cx="30" cy="15" r="15" />
                  </clipPath>
                  <g clipPath="url(#uk-circle)">
                    <rect width="60" height="30" fill="#012169"/>
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
                    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#C8102E" strokeWidth="4"/>
                    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
                    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
                  </g>
                </svg>
              </button>

              {/* Language Dropdown */}
              {isLangMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-black/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-2 shadow-2xl z-50 text-xs">
                  <div className="px-3 py-1.5 text-white/50 font-medium uppercase tracking-wider text-[10px]">
                    Select Region
                  </div>
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setCurrentLang({ code: lang.code, label: lang.label });
                        setIsLangMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition ${
                        currentLang.code === lang.code 
                          ? 'bg-white/20 text-white font-medium' 
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-base">{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                      {currentLang.code === lang.code && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* 2. CENTER HERO BANNER HEADLINE & CTA                                      */}
        {/* ========================================================================= */}
        <main className="flex-1 flex flex-col items-center justify-center text-center px-6 sm:px-10 py-12 md:py-16 relative z-20 max-w-5xl mx-auto">
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-semibold text-white tracking-tight leading-[1.1] max-w-4xl">
            Clean and smart solar
            <br />
            energy for your business.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 sm:mt-6 text-base sm:text-lg md:text-xl text-white font-normal max-w-2xl leading-relaxed">
            Sustainable energy solutions made easy,
            <br className="hidden sm:inline" /> reliable, and tailor-made for Europe.
          </p>

          {/* CTA Button with Blue Circular Icon Pill */}
          <div className="mt-8 sm:mt-10">
            <button
              onClick={() => setIsContactModalOpen(true)}
              className="group inline-flex items-center gap-3 bg-white hover:bg-neutral-100 text-black pl-6 pr-2.5 py-2.5 rounded-full font-medium text-sm sm:text-base shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer"
            >
              <span className="font-semibold text-black tracking-tight">Let's Talk Solar Solutions</span>
              
              {/* Blue Circular Icon Container */}
              <div className="w-8 h-8 rounded-full bg-[#0066FF] flex items-center justify-center text-white transition-transform duration-200 group-hover:rotate-45">
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </div>
            </button>
          </div>
        </main>

        {/* ========================================================================= */}
        {/* 3. BOTTOM CARDS (Clean energy generated & Impact)                         */}
        {/* ========================================================================= */}
        <footer className="w-full px-6 sm:px-10 md:px-14 pb-8 sm:pb-12 pt-4 relative z-20">
          <div className="flex flex-col md:flex-row items-stretch md:items-end justify-between gap-6">
            
            {/* Bottom Left Card: Clean energy generated */}
            <div className="w-full md:max-w-[420px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl hover:border-white/35 transition-all duration-300">
              
              {/* Lightning Icon Badge */}
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-5 shadow-md">
                <Zap className="w-5 h-5 fill-[#0066FF] text-[#0066FF]" />
              </div>

              {/* Card Title */}
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Clean energy generated
              </h2>

              {/* Card Description */}
              <p className="mt-3 text-sm sm:text-base text-white/90 font-normal leading-relaxed">
                Since 2019, we've generated over 946 GWh of clean, sustainable energy. This milestone represents not just power, but a commitment to a greener, healthier future
              </p>
            </div>

            {/* Bottom Right Card: Impact */}
            <div className="w-full md:max-w-[440px] bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-3xl p-6 sm:p-7 shadow-2xl hover:border-white/35 transition-all duration-300">
              
              {/* Card Title */}
              <h2 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">
                Impact
              </h2>

              {/* Card Description */}
              <p className="mt-3 text-sm sm:text-base text-white/90 font-normal leading-relaxed">
                Our clean energy solutions currently benefit over 525,555 people. That's thousands of homes, businesses, and communities powered by renewable energy.
              </p>
            </div>

          </div>
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PROUDLY TRUSTED BY LEADING BRANDS ACROSS INDUSTRIES           */}
      {/* ========================================================================= */}
      <section className="w-full bg-black text-white py-24 sm:py-32 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center">
        
        {/* Subtle Ambient Warm Glow behind the headline (exact match to reference) */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] sm:w-[680px] h-[280px] sm:h-[360px] bg-gradient-to-r from-orange-600/15 via-red-500/10 to-blue-500/10 blur-[100px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center relative z-10">
          
          {/* Main Headline with exact typographic combination */}
          <h2 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] leading-[1.08] tracking-tight select-none">
            {/* Line 1: Proudly Trusted in graceful serif italic */}
            <span 
              className="block font-['Instrument_Serif',serif] italic font-normal text-white drop-shadow-sm"
              style={{ fontFamily: "'Instrument Serif', 'Cormorant Garamond', 'Playfair Display', serif" }}
            >
              Proudly Trusted
            </span>
            
            {/* Line 2: by Leading Brands */}
            <span className="block font-['DM_Sans',sans-serif] italic font-light text-white tracking-tight mt-1 sm:mt-2">
              by Leading Brands
            </span>
            
            {/* Line 3: Across Industries with red circled registered mark */}
            <span className="inline-flex items-baseline font-['DM_Sans',sans-serif] italic font-light text-white tracking-tight mt-1 sm:mt-2">
              <span>Across Industries</span>
              <span 
                className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 ml-1.5 sm:ml-2 rounded-full border border-[#FF3B30] text-[#FF3B30] text-[9px] sm:text-[10px] md:text-xs font-bold not-italic align-super translate-y-[-10px] sm:translate-y-[-16px] md:translate-y-[-20px] select-none"
                style={{ verticalAlign: 'super' }}
              >
                R
              </span>
            </span>
          </h2>

          {/* Subtext */}
          <div className="mt-8 sm:mt-10 text-white font-['DM_Sans',sans-serif] text-sm sm:text-base leading-relaxed max-w-md mx-auto text-center space-y-1">
            <p className="italic font-light text-white">We've partnered with leading</p>
            <p className="font-normal text-white">brands to deliver innovative and impactful</p>
            <p className="font-normal text-white">architectural solutions</p>
          </div>

        </div>

        {/* Full-width Horizontal Divider Line */}
        <div className="w-full max-w-6xl mx-auto mt-20 sm:mt-28 mb-12 sm:mb-16 border-t border-white/15" />

        {/* Brand Logos Row */}
        <div className="w-full max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-8 sm:gap-10 items-center justify-items-center opacity-85 hover:opacity-100 transition-opacity">
            
            {/* 1. Construction Brand (Building Silhouette) */}
            <div className="flex flex-col items-center justify-center group cursor-pointer h-16 transition-all duration-300 hover:scale-105">
              <svg viewBox="0 0 100 60" className="h-10 w-auto fill-white text-white">
                {/* 3 Angled Tower silhouettes */}
                <path d="M15,50 L15,25 L25,20 L25,50 Z" fill="white" opacity="0.9"/>
                <path d="M28,50 L28,12 L42,6 L42,50 Z" fill="white"/>
                <path d="M45,50 L45,20 L58,15 L58,50 Z" fill="white" opacity="0.8"/>
                {/* Architectural window stripes */}
                <rect x="32" y="16" width="3" height="4" fill="black" />
                <rect x="37" y="16" width="3" height="4" fill="black" />
                <rect x="32" y="24" width="3" height="4" fill="black" />
                <rect x="37" y="24" width="3" height="4" fill="black" />
                <rect x="32" y="32" width="3" height="4" fill="black" />
                <rect x="37" y="32" width="3" height="4" fill="black" />
                <text x="6" y="58" fill="white" fontSize="6" fontFamily="DM Sans" fontWeight="bold" letterSpacing="1.5">CONSTRUCTION</text>
              </svg>
            </div>

            {/* 2. CONDON CONSTRUCTION */}
            <div className="flex flex-col items-center justify-center group cursor-pointer h-16 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center">
                {/* Stacked geometric hexagon emblem */}
                <svg viewBox="0 0 40 32" className="w-7 h-7 mb-1.5">
                  <path d="M20,2 L34,10 L20,18 L6,10 Z" fill="none" stroke="white" strokeWidth="2.5" strokeLinejoin="round" />
                  <path d="M10,15 L6,17 L20,25 L34,17 L30,15" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M10,22 L6,24 L20,32 L34,24 L30,22" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className="text-xs font-bold tracking-[0.2em] text-white uppercase font-['DM_Sans']">CONDON</span>
                <span className="text-[8px] font-medium tracking-[0.25em] text-white/80 uppercase font-['DM_Sans'] -mt-0.5">CONSTRUCTION</span>
              </div>
            </div>

            {/* 3. Morrison Construction (with red leaf) */}
            <div className="flex flex-col items-center justify-center group cursor-pointer h-16 transition-all duration-300 hover:scale-105">
              <div className="flex items-center gap-1.5">
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold tracking-tight text-white font-['DM_Sans'] leading-tight">Morrison</span>
                  <span className="text-sm font-semibold tracking-tight text-white font-['DM_Sans'] leading-tight">Construction</span>
                </div>
                {/* Red & White Dual Swoosh/Leaf */}
                <svg viewBox="0 0 24 24" className="w-5 h-5 ml-1 self-start mt-0.5">
                  <path d="M4,18 C4,10 14,4 20,4 C20,12 10,18 4,18 Z" fill="#E60000" />
                  <path d="M8,18 C8,13 14,9 18,7 C18,12 13,16 8,18 Z" fill="white" />
                </svg>
              </div>
            </div>

            {/* 4. Creative Spaces / Skyline Emblem */}
            <div className="flex flex-col items-center justify-center group cursor-pointer h-16 transition-all duration-300 hover:scale-105">
              <div className="flex flex-col items-center">
                <svg viewBox="0 0 80 45" className="h-8 w-auto">
                  {/* Skyline / roof peak */}
                  <path d="M22,30 L40,12 L58,30" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" />
                  <rect x="33" y="16" width="6" height="14" fill="white" opacity="0.9" />
                  <rect x="41" y="10" width="6" height="20" fill="white" />
                  <rect x="49" y="19" width="5" height="11" fill="white" opacity="0.8" />
                  <path d="M12,33 Q40,30 68,33" fill="none" stroke="white" strokeWidth="1.5" />
                </svg>
                <span className="text-[7px] font-semibold tracking-[0.3em] text-white uppercase font-['DM_Sans'] mt-0.5">CREATIVE DESIGN</span>
              </div>
            </div>

            {/* 5. Modern Architecture Facade Outline */}
            <div className="flex flex-col items-center justify-center group cursor-pointer h-16 transition-all duration-300 hover:scale-105">
              <svg viewBox="0 0 65 50" className="h-9 w-auto">
                <path d="M8,44 L8,18 L24,10 L24,44 Z" fill="none" stroke="white" strokeWidth="1.8" />
                <path d="M24,10 L44,4 L44,44 L24,44" fill="none" stroke="white" strokeWidth="1.8" />
                <path d="M44,4 L56,12 L56,44 L44,44" fill="none" stroke="white" strokeWidth="1.8" />
                <line x1="16" y1="14" x2="16" y2="44" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                <line x1="34" y1="7" x2="34" y2="44" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
                <line x1="50" y1="10" x2="50" y2="44" stroke="white" strokeWidth="1" strokeOpacity="0.5" />
              </svg>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ABOUT STUDIO (Kinetic Studio & Floating Capabilities Cards)    */}
      {/* ========================================================================= */}
      <section className="w-full bg-black text-white py-24 sm:py-32 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center border-t border-white/10">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] sm:h-[450px] bg-gradient-to-b from-white/[0.04] to-transparent blur-[120px] pointer-events-none rounded-full" />

        <div className="max-w-5xl mx-auto w-full flex flex-col items-center text-center relative z-10">
          
          {/* Top Pill Badge: ✦ ABOUT STUDIO */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.08] border border-white/20 backdrop-blur-xl text-xs sm:text-sm font-medium text-white tracking-wider uppercase mb-8 sm:mb-10 shadow-lg select-none">
            <Sparkles className="w-3.5 h-3.5 text-white fill-white" />
            <span>ABOUT STUDIO</span>
          </div>

          {/* Main Headline */}
          <h2 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-semibold text-white tracking-tight leading-[1.12] max-w-4xl font-['DM_Sans',sans-serif]">
            Kinetic Studio – is an SMM agency of bold creators that delivers the power of social media with cutting-edge strategy
          </h2>

          {/* Subtext */}
          <p className="mt-6 sm:mt-8 text-sm sm:text-base md:text-lg text-white/80 font-normal max-w-2xl leading-relaxed font-['DM_Sans',sans-serif]">
            Empowering forward-thinking brands through disruptive visual storytelling, data-backed growth loops, and bespoke digital campaigns.
          </p>

        </div>

        {/* Floating Glass Capabilities Cards Grid (Exact matching staggered layout and copy) */}
        <div className="w-full max-w-7xl mx-auto mt-16 sm:mt-24 pb-12 relative z-10">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6 items-start">
            
            {/* Card 1: Strategy (Tall, baseline alignment) */}
            <div className="min-h-[460px] sm:min-h-[500px] lg:min-h-[520px] bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-[32px] p-7 sm:p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 group hover:-translate-y-2">
              {/* Top Tag */}
              <div className="flex items-center">
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90">
                  Strategy
                </div>
              </div>

              {/* Lower Content */}
              <div className="space-y-4 pt-20">
                {/* ✦ Star Icon */}
                <div className="text-white text-xl sm:text-2xl select-none">
                  ✦
                </div>
                
                {/* Headline */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-['DM_Sans',sans-serif]">
                  Bold strategies that shape identities
                </h3>

                {/* Subtext */}
                <p className="text-sm text-white/75 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                  We craft concepts that define unique brands and strengthen their presence.
                </p>
              </div>
            </div>

            {/* Card 2: Growth (Staggered offset downwards) */}
            <div className="min-h-[440px] sm:min-h-[470px] lg:min-h-[490px] lg:translate-y-12 bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-[32px] p-7 sm:p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 group hover:lg:translate-y-10">
              {/* Top Tag */}
              <div className="flex items-center">
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90">
                  Growth
                </div>
              </div>

              {/* Lower Content */}
              <div className="space-y-4 pt-16">
                {/* ✦ Star Icon */}
                <div className="text-white text-xl sm:text-2xl select-none">
                  ✦
                </div>
                
                {/* Headline */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-['DM_Sans',sans-serif]">
                  Driving measurable growth through impact
                </h3>

                {/* Subtext */}
                <p className="text-sm text-white/75 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                  Focused on reach, engagement, and real sales — not empty noise.
                </p>
              </div>
            </div>

            {/* Card 3: Creative (Tallest, elevated offset) */}
            <div className="min-h-[480px] sm:min-h-[520px] lg:min-h-[540px] lg:translate-y-3 bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-[32px] p-7 sm:p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 group hover:lg:translate-y-1">
              {/* Top Tag */}
              <div className="flex items-center">
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90">
                  Creative
                </div>
              </div>

              {/* Lower Content */}
              <div className="space-y-4 pt-24">
                {/* ✦ Star Icon */}
                <div className="text-white text-xl sm:text-2xl select-none">
                  ✦
                </div>
                
                {/* Headline */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-['DM_Sans',sans-serif]">
                  Creative processes with rapid delivery
                </h3>

                {/* Subtext */}
                <p className="text-sm text-white/75 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                  Ideas turn into results fast, without losing quality or relevance.
                </p>
              </div>
            </div>

            {/* Card 4: Powerful (Staggered offset downwards) */}
            <div className="min-h-[430px] sm:min-h-[460px] lg:min-h-[480px] lg:translate-y-16 bg-white/[0.06] hover:bg-white/[0.09] backdrop-blur-2xl border border-white/20 hover:border-white/35 rounded-[32px] p-7 sm:p-8 shadow-2xl flex flex-col justify-between transition-all duration-300 group hover:lg:translate-y-14">
              {/* Top Tag */}
              <div className="flex items-center">
                <div className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-white/90">
                  Powerful
                </div>
              </div>

              {/* Lower Content */}
              <div className="space-y-4 pt-16">
                {/* ✦ Star Icon */}
                <div className="text-white text-xl sm:text-2xl select-none">
                  ✦
                </div>
                
                {/* Headline */}
                <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug font-['DM_Sans',sans-serif]">
                  A dedicated team behind success
                </h3>

                {/* Subtext */}
                <p className="text-sm text-white/75 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                  Our experts guide every step, from launch to scale.
                </p>
              </div>
            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: CLIENT TESTIMONIAL & GROWTH CASE STUDY                         */}
      {/* ========================================================================= */}
      <section className="w-full bg-black text-white py-20 sm:py-28 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center border-t border-white/10">
        
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-r from-blue-600/10 via-white/[0.03] to-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

        <div className="w-full max-w-6xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row items-stretch gap-6 sm:gap-8">
            
            {/* Left Column: Portrait Card */}
            <div className="w-full lg:w-[360px] xl:w-[400px] shrink-0 bg-white/[0.06] backdrop-blur-2xl border border-white/20 rounded-[32px] p-3.5 shadow-2xl flex flex-col justify-center items-center overflow-hidden">
              <div className="w-full h-[380px] sm:h-[420px] lg:h-full min-h-[380px] rounded-[24px] overflow-hidden bg-neutral-900 relative">
                <img 
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop" 
                  alt="Bernice Tay"
                  className="w-full h-full object-cover object-center grayscale contrast-105 hover:grayscale-0 transition-all duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-white/90">
                  <span className="font-semibold tracking-wide">Bernice Tay</span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] text-white">Client Partner</span>
                </div>
              </div>
            </div>

            {/* Right Column: Large Glassmorphic Quote & Metric Card */}
            <div className="flex-1 bg-white/[0.06] hover:bg-white/[0.08] backdrop-blur-2xl border border-white/20 rounded-[32px] p-8 sm:p-12 lg:p-14 shadow-2xl flex flex-col justify-between transition-all duration-300">
              
              {/* Quote Headline in exact all-caps typography */}
              <div>
                <blockquote className="text-xl sm:text-2xl lg:text-[27px] font-bold text-white tracking-tight leading-[1.35] uppercase font-['DM_Sans',sans-serif]">
                  « I WASTED MY TIME WITH OTHER AGENCIES, BUT WITH OMNI, WE INCREASED OUR REVENUE AND GOT MORE STUDENTS WITH LOW CPL AND HIGH ROAS »
                </blockquote>
              </div>

              {/* Middle Metrics Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 my-10 sm:my-12 py-8 border-y border-white/15">
                
                {/* Metric 1 */}
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-['DM_Sans',sans-serif]">
                    $15-25
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium tracking-wide">
                    CPL
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-['DM_Sans',sans-serif]">
                    263
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium tracking-wide">
                    Webinar attendees
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="space-y-1">
                  <div className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-['DM_Sans',sans-serif]">
                    11.11X
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium tracking-wide">
                    ROAS for Crash Course
                  </div>
                </div>

              </div>

              {/* Attribution */}
              <div className="space-y-1">
                <div className="text-xs sm:text-sm font-semibold tracking-widest uppercase text-white/90 font-['DM_Sans',sans-serif] flex items-center gap-2">
                  <span>—</span>
                  <span>BERNICE TAY</span>
                </div>
                <div className="text-xs sm:text-sm text-white/60 font-normal">
                  Bright Culture
                </div>
              </div>

            </div>

          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: 4-CARD FEATURE SYSTEM (Tailored Experiences, Logistics, etc.)  */}
      {/* ========================================================================= */}
      <section className="w-full bg-black text-white py-24 sm:py-32 px-6 sm:px-12 relative overflow-hidden flex flex-col items-center border-t border-white/10">
        
        {/* Ambient Dark Atmospheric Fog Background */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/15 via-black to-black pointer-events-none" />

        <div className="w-full max-w-6xl mx-auto relative z-10">
          
          {/* 4 Cards in a clean, balanced 2x2 Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
            
            {/* Card 1: Tailored Experiences */}
            <div className="bg-white/[0.07] hover:bg-white/[0.11] backdrop-blur-2xl border border-white/20 hover:border-white/40 rounded-[28px] p-7 sm:p-9 shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              {/* Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-md">
                <Zap className="w-6 h-6 fill-[#0066FF] text-[#0066FF]" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['DM_Sans',sans-serif]">
                Tailored Experiences
              </h3>
              
              <p className="mt-3 text-sm sm:text-base text-white/80 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                Every detail is customized to match your unique preferences and style of travel.
              </p>
            </div>

            {/* Card 2: Seamless Logistics */}
            <div className="bg-white/[0.07] hover:bg-white/[0.11] backdrop-blur-2xl border border-white/20 hover:border-white/40 rounded-[28px] p-7 sm:p-9 shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              {/* Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-md">
                <Zap className="w-6 h-6 fill-[#0066FF] text-[#0066FF]" />
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['DM_Sans',sans-serif]">
                Seamless Logistics
              </h3>
              
              <p className="mt-3 text-sm sm:text-base text-white/80 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                From transport to ticketing, we handle everything so you can relax and enjoy.
              </p>
            </div>

            {/* Card 3: Expert Guides */}
            <div className="bg-white/[0.07] hover:bg-white/[0.11] backdrop-blur-2xl border border-white/20 hover:border-white/40 rounded-[28px] p-7 sm:p-9 shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              {/* Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-md">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#0066FF] text-[#0066FF]">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['DM_Sans',sans-serif]">
                Expert Guides
              </h3>
              
              <p className="mt-3 text-sm sm:text-base text-white/80 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                Explore with passionate locals who share insider knowledge and hidden gems.
              </p>
            </div>

            {/* Card 4: 24/7 Support */}
            <div className="bg-white/[0.07] hover:bg-white/[0.11] backdrop-blur-2xl border border-white/20 hover:border-white/40 rounded-[28px] p-7 sm:p-9 shadow-2xl transition-all duration-300 group hover:-translate-y-1">
              {/* Icon Badge */}
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center mb-6 shadow-md">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-[#0066FF] text-[#0066FF]">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-['DM_Sans',sans-serif]">
                24/7 Support
              </h3>
              
              <p className="mt-3 text-sm sm:text-base text-white/80 font-normal leading-relaxed font-['DM_Sans',sans-serif]">
                We're always available to ensure your journey is smooth and worry-free.
              </p>
            </div>

          </div>
        </div>

      </section>


      {/* Footer subtle attribution */}
      <footer className="w-full py-8 border-t border-white/10 text-center text-xs text-white/50">
        © {new Date().getFullYear()} SUNROCK Clean Energy & Architecture. All rights reserved.
      </footer>

      {/* ========================================================================= */}
      {/* 4. MODALS & INTERACTIVE OVERLAYS                                          */}
      {/* ========================================================================= */}

      {/* Fullscreen Mobile Navigation & Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col justify-between p-6 sm:p-12 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold tracking-wider text-white">SUNROCK</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex flex-col gap-6 my-auto text-left">
            {navItems.map((item, idx) => (
              <button
                key={item}
                onClick={() => {
                  setActiveNav(item);
                  setIsMenuOpen(false);
                  if (item === 'Contact') setIsContactModalOpen(true);
                }}
                className="text-3xl sm:text-4xl font-semibold text-white hover:text-white/70 transition flex items-center justify-between group text-left cursor-pointer"
              >
                <span>{item}</span>
                <span className="text-sm font-normal text-white/40 group-hover:text-white">0{idx + 1}</span>
              </button>
            ))}
          </div>

          <div className="pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
            <div>Clean and smart solar energy for Europe</div>
            <button
              onClick={() => {
                setIsMenuOpen(false);
                setIsContactModalOpen(true);
              }}
              className="px-6 py-2.5 rounded-full bg-white text-black font-semibold hover:bg-white/90 transition"
            >
              Let's Talk Solar Solutions
            </button>
          </div>
        </div>
      )}

      {/* Contact & Consultation Modal */}
      {isContactModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-black border border-white/20 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-white animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsContactModalOpen(false)}
              className="absolute top-6 right-6 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center mb-4">
              <Sun className="w-5 h-5 text-[#0066FF]" />
            </div>

            <h3 className="text-2xl font-bold text-white">Let's Talk Solar Solutions</h3>
            <p className="text-sm text-white/70 mt-1">
              Connect with Sunrock's clean energy engineers to tailor solar infrastructure for your organization.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); setIsContactModalOpen(false); alert('Thank you! Our energy consultant will contact you shortly.'); }} className="mt-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Company / Organization</label>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Acme Logistics Europe" 
                  className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">Work Email</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="name@company.com" 
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-white/80 mb-1">Phone Number</label>
                  <input 
                    type="tel" 
                    placeholder="+44 20 1234 5678" 
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-white text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-white/80 mb-1">Estimated Roof or Land Space (m²)</label>
                <select className="w-full px-4 py-2.5 rounded-xl bg-black border border-white/20 text-white focus:outline-none focus:border-white text-sm">
                  <option value="small">Under 2,500 m² (Commercial Rooftop)</option>
                  <option value="medium">2,500 m² – 10,000 m² (Industrial/Warehouse)</option>
                  <option value="large">Over 10,000 m² (Large-scale Ground/Logistics)</option>
                  <option value="multi">Multiple Locations Portfolio</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 mt-2 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Request Solar Feasibility Study</span>
                <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
