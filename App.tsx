
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Sparkles, 
  Shirt, 
  Check, 
  Loader2, 
  Image as ImageIcon,
  History,
  Info,
  UserCheck,
  Palette,
  Accessibility,
  Maximize,
  MapPin,
  Columns,
  LogOut,
  Users,
  ShieldCheck,
  XCircle,
  Clock,
  LogIn
} from 'lucide-react';
import { GarmentType, ModelType, ModelPose, ModelBackground, DrapingConfig, User, UserRole, UserStatus } from './types';
import { generateDrapedImage } from './services/geminiService';

const COLOR_PRESETS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Black', hex: '#000000' },
  { name: 'Beige', hex: '#F5F5DC' },
  { name: 'Navy', hex: '#000080' },
  { name: 'Grey', hex: '#808080' },
  { name: 'Cream', hex: '#FFFDD0' },
];

const ASPECT_RATIOS = ['1:1', '3:4', '4:3', '16:9'];

const LIGHT_BACKGROUNDS = [
  ModelBackground.LIGHT_MINIMAL,
  ModelBackground.SOFT_GREY,
  ModelBackground.NEUTRAL_BEIGE,
];

const KURTA_BACKGROUNDS = [
  ...LIGHT_BACKGROUNDS,
  ModelBackground.STUDIO,
  ModelBackground.LUXURY_INTERIOR,
  ModelBackground.ROYAL_PALACE,
  ModelBackground.HERITAGE_HAVELI,
  ModelBackground.FESTIVE_COURTYARD,
];

const SHIRT_BACKGROUNDS = [
  ...LIGHT_BACKGROUNDS,
  ModelBackground.STUDIO,
  ModelBackground.LUXURY_INTERIOR,
  ModelBackground.MODERN_LOFT,
  ModelBackground.URBAN_STREET,
  ModelBackground.CORPORATE_OFFICE,
  ModelBackground.YACHT_DECK,
  ModelBackground.CHIC_CAFE,
];

const UNIVERSAL_BACKGROUNDS = [
  ...LIGHT_BACKGROUNDS,
  ModelBackground.STUDIO,
  ModelBackground.LUXURY_INTERIOR,
  ModelBackground.MODERN_LOFT,
  ModelBackground.YACHT_DECK,
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('drape_ai_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [view, setView] = useState<'auth' | 'app' | 'admin' | 'pending'>('auth');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '', name: '' });
  const [authError, setAuthError] = useState('');

  const [config, setConfig] = useState<DrapingConfig>({
    garmentType: GarmentType.KURTA,
    modelType: ModelType.INDIAN_CLASSIC,
    modelPose: ModelPose.STANDING,
    modelBackground: ModelBackground.LIGHT_MINIMAL,
    aspectRatio: '3:4',
    fabricImage: null,
    bottomColor: 'White',
    promptNotes: ''
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize hardcoded Admin if no users exist
  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('drape_ai_users') || '[]');
    if (users.length === 0) {
      const admin: User = {
        id: 'admin-1',
        email: 'admin@drape.ai',
        password: 'admin',
        role: UserRole.ADMIN,
        status: UserStatus.APPROVED,
        name: 'System Admin'
      };
      localStorage.setItem('drape_ai_users', JSON.stringify([admin]));
    }
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setView('auth');
    } else if (currentUser.status === UserStatus.PENDING) {
      setView('pending');
    } else {
      setView('app');
    }
  }, [currentUser]);

  const handleAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    const users: User[] = JSON.parse(localStorage.getItem('drape_ai_users') || '[]');

    if (authMode === 'login') {
      const user = users.find(u => u.email === authForm.email && u.password === authForm.password);
      if (user) {
        localStorage.setItem('drape_ai_current_user', JSON.stringify(user));
        setCurrentUser(user);
      } else {
        setAuthError('Invalid email or password.');
      }
    } else {
      if (users.find(u => u.email === authForm.email)) {
        setAuthError('Email already exists.');
        return;
      }
      const newUser: User = {
        id: Date.now().toString(),
        email: authForm.email,
        password: authForm.password,
        name: authForm.name,
        role: UserRole.USER,
        status: UserStatus.PENDING
      };
      localStorage.setItem('drape_ai_users', JSON.stringify([...users, newUser]));
      localStorage.setItem('drape_ai_current_user', JSON.stringify(newUser));
      setCurrentUser(newUser);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('drape_ai_current_user');
    setCurrentUser(null);
    setView('auth');
  };

  const isKurtaOnly = config.garmentType === GarmentType.KURTA || config.garmentType === GarmentType.LONG_KURTA;
  const isDuo = config.garmentType === GarmentType.DUO_VIEW;

  const currentBackgroundOptions = isDuo 
    ? UNIVERSAL_BACKGROUNDS 
    : isKurtaOnly ? KURTA_BACKGROUNDS : SHIRT_BACKGROUNDS;

  useEffect(() => {
    if (!currentBackgroundOptions.includes(config.modelBackground)) {
      setConfig(prev => ({ ...prev, modelBackground: currentBackgroundOptions[0] }));
    }
    if (isDuo && (config.aspectRatio === '3:4')) {
      setConfig(prev => ({ ...prev, aspectRatio: '4:3' }));
    }
  }, [config.garmentType, currentBackgroundOptions]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setConfig(prev => ({ ...prev, fabricImage: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrape = async () => {
    if (!config.fabricImage) {
      setError("Please upload a fabric design first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDrapedImage(
        config.fabricImage,
        config.garmentType,
        config.modelType,
        config.modelPose,
        config.modelBackground,
        config.bottomColor,
        config.aspectRatio,
        config.promptNotes
      );
      setResultImage(result);
      setHistory(prev => [result, ...prev].slice(0, 5));
    } catch (err: any) {
      setError(err.message || "Studio encountered an error. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (view === 'auth') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,#1a1a1a,black)]">
        <div className="w-full max-w-md">
          <div className="text-center mb-10">
            <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-amber-500/20">
              <Sparkles className="text-black w-8 h-8" />
            </div>
            <h1 className="text-4xl font-serif font-bold text-white mb-2 italic">DrapeAI</h1>
            <p className="text-amber-500/60 uppercase tracking-[0.3em] text-[10px] font-bold">The Virtual Tailor Studio</p>
          </div>

          <form onSubmit={handleAuth} className="bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl space-y-6">
            <h2 className="text-xl font-medium text-white text-center">
              {authMode === 'login' ? 'Welcome Back' : 'Create an Account'}
            </h2>
            
            {authError && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl text-red-400 text-xs text-center">
                {authError}
              </div>
            )}

            <div className="space-y-4">
              {authMode === 'signup' && (
                <input 
                  type="text" 
                  required
                  placeholder="Full Name"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all"
                  value={authForm.name}
                  onChange={e => setAuthForm(prev => ({...prev, name: e.target.value}))}
                />
              )}
              <input 
                type="email" 
                required
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all"
                value={authForm.email}
                onChange={e => setAuthForm(prev => ({...prev, email: e.target.value}))}
              />
              <input 
                type="password" 
                required
                placeholder="Password"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-all"
                value={authForm.password}
                onChange={e => setAuthForm(prev => ({...prev, password: e.target.value}))}
              />
            </div>

            <button type="submit" className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
              {authMode === 'login' ? <LogIn size={18}/> : <UserCheck size={18}/>}
              {authMode === 'login' ? 'Enter Studio' : 'Request Access'}
            </button>

            <button 
              type="button"
              onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
              className="w-full text-white/40 text-sm hover:text-white transition-colors"
            >
              {authMode === 'login' ? "Don't have an account? Sign up" : "Already have an account? Login"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (view === 'pending') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
            <Clock className="text-amber-500 animate-pulse" size={32} />
          </div>
          <h1 className="text-3xl font-serif text-white mb-4 italic">Awaiting Approval</h1>
          <p className="text-white/40 leading-relaxed mb-8">
            Hello <span className="text-white">{currentUser?.name}</span>, your account request is pending admin review. You will be able to access the studio once approved.
          </p>
          <button onClick={handleLogout} className="text-amber-500 text-sm font-bold uppercase tracking-widest hover:underline">
            Log Out
          </button>
        </div>
      </div>
    );
  }

  if (view === 'admin') {
    const users: User[] = JSON.parse(localStorage.getItem('drape_ai_users') || '[]');
    const handleStatusUpdate = (userId: string, status: UserStatus) => {
      const updated = users.map(u => u.id === userId ? { ...u, status } : u);
      localStorage.setItem('drape_ai_users', JSON.stringify(updated));
      window.location.reload(); 
    };

    return (
      <div className="min-h-screen bg-black text-white flex flex-col">
        <header className="h-20 border-b border-white/10 flex items-center justify-between px-8 bg-black/50 backdrop-blur-md sticky top-0 z-50">
          <div className="flex items-center gap-4">
            <ShieldCheck className="text-amber-500" />
            <h1 className="text-xl font-bold font-serif italic">Admin Dashboard</h1>
          </div>
          <button onClick={() => setView('app')} className="px-6 py-2 bg-white/10 rounded-full text-sm font-medium hover:bg-white/20 transition-all">
            Back to Studio
          </button>
        </header>
        <main className="flex-1 p-8 max-w-5xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium">User Management</h2>
            <div className="flex items-center gap-2 text-white/40 text-xs uppercase tracking-widest">
              <Users size={14} /> {users.length} Registered Users
            </div>
          </div>
          <div className="grid gap-4">
            {users.filter(u => u.role !== UserRole.ADMIN).map(u => (
              <div key={u.id} className="bg-white/5 border border-white/10 p-6 rounded-3xl flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-medium">{u.name}</h3>
                  <p className="text-white/40 text-sm">{u.email}</p>
                  <div className={`mt-2 inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-tighter
                    ${u.status === UserStatus.PENDING ? 'bg-amber-500/20 text-amber-500' : u.status === UserStatus.APPROVED ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
                    {u.status}
                  </div>
                </div>
                <div className="flex gap-3">
                  {u.status !== UserStatus.APPROVED && (
                    <button 
                      onClick={() => handleStatusUpdate(u.id, UserStatus.APPROVED)}
                      className="p-3 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-black rounded-xl transition-all"
                    >
                      <Check size={20} />
                    </button>
                  )}
                  {u.status !== UserStatus.REJECTED && (
                    <button 
                      onClick={() => handleStatusUpdate(u.id, UserStatus.REJECTED)}
                      className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all"
                    >
                      <XCircle size={20} />
                    </button>
                  )}
                </div>
              </div>
            ))}
            {users.length <= 1 && (
              <div className="text-center py-20 bg-white/5 border border-dashed border-white/10 rounded-3xl">
                <Users className="mx-auto mb-4 text-white/20" size={48} />
                <p className="text-white/40">No user requests found.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-900/20">
              <Sparkles className="text-black w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">DrapeAI</h1>
              <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest">Virtual Fabric Studio</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-white/40 text-[10px] uppercase font-bold tracking-[0.2em] bg-white/5 px-4 py-2 rounded-full border border-white/10">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {currentUser?.name}
            </div>
            {currentUser?.role === UserRole.ADMIN && (
              <button 
                onClick={() => setView('admin')}
                className="p-2 text-white/60 hover:text-amber-500 transition-colors"
                title="Admin Dashboard"
              >
                <ShieldCheck />
              </button>
            )}
            <button 
              onClick={handleLogout}
              className="p-2 text-white/60 hover:text-red-400 transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Controls Sidebar */}
        <aside className="w-full lg:w-[450px] border-r border-white/10 bg-[#0f0f0f] overflow-y-auto custom-scrollbar">
          <div className="p-8 space-y-10">
            {/* 1. Fabric Upload */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 flex items-center gap-2">
                  <ImageIcon size={14} /> 1. Upload Fabric
                </h3>
                {config.fabricImage && (
                  <button 
                    onClick={() => setConfig(prev => ({ ...prev, fabricImage: null }))}
                    className="text-xs text-amber-500 hover:underline"
                  >
                    Clear
                  </button>
                )}
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative group cursor-pointer border-2 border-dashed transition-all rounded-2xl overflow-hidden aspect-video flex items-center justify-center
                  ${config.fabricImage ? 'border-amber-500/50' : 'border-white/10 hover:border-white/30 bg-white/5'}`}
              >
                {config.fabricImage ? (
                  <>
                    <img src={config.fabricImage} className="w-full h-full object-cover" alt="Fabric" />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-sm font-medium text-white flex items-center gap-2">
                        <Upload size={16} /> Change Fabric
                      </p>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-white/10 transition-colors">
                      <Upload className="text-white/40 group-hover:text-white transition-colors" />
                    </div>
                    <p className="text-sm text-white/60 font-medium">Click or drag to upload design</p>
                    <p className="text-[10px] text-white/30 mt-1 uppercase tracking-tighter">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
              />
            </section>

            {/* 2. Aspect Ratio */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Maximize size={14} /> 2. Aspect Ratio
              </h3>
              <div className="grid grid-cols-4 gap-2">
                {ASPECT_RATIOS.map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setConfig(prev => ({ ...prev, aspectRatio: ratio }))}
                    className={`px-2 py-3 rounded-xl border text-[10px] font-bold transition-all flex flex-col items-center gap-1
                      ${config.aspectRatio === ratio 
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}`}
                  >
                    <div className={`w-4 border border-current rounded-[1px] ${ratio === '1:1' ? 'h-4' : ratio === '3:4' ? 'h-5' : ratio === '4:3' ? 'h-3' : 'h-2'}`}></div>
                    {ratio}
                  </button>
                ))}
              </div>
            </section>

            {/* 3. Garment Selection */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Shirt size={14} /> 3. Select Garment
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {Object.values(GarmentType).map((type) => (
                  <button
                    key={type}
                    onClick={() => setConfig(prev => ({ ...prev, garmentType: type }))}
                    className={`px-4 py-3 rounded-xl border text-[11px] font-medium transition-all flex items-center justify-between
                      ${config.garmentType === type 
                        ? 'border-amber-500 bg-amber-500/10 text-white shadow-lg shadow-amber-500/5' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}
                      ${type === GarmentType.DUO_VIEW ? 'col-span-2 bg-gradient-to-r from-amber-500/20 to-transparent' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {type === GarmentType.DUO_VIEW && <Columns size={14} className="text-amber-500" />}
                      {type}
                    </div>
                    {config.garmentType === type && <Check size={14} className="text-amber-500" />}
                  </button>
                ))}
              </div>
            </section>

            {/* 4. Model Appearance */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <UserCheck size={14} /> 4. Model Appearance
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ModelType).map((model) => (
                  <button
                    key={model}
                    onClick={() => setConfig(prev => ({ ...prev, modelType: model }))}
                    className={`px-4 py-3 rounded-xl border text-[11px] font-bold transition-all text-left flex flex-col gap-1
                      ${config.modelType === model 
                        ? 'border-white bg-white text-black' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}`}
                  >
                    <span>{model}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* 5. Model Pose */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Accessibility size={14} /> 5. Model Pose
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {Object.values(ModelPose).map((pose) => (
                  <button
                    key={pose}
                    onClick={() => setConfig(prev => ({ ...prev, modelPose: pose }))}
                    className={`px-4 py-3 rounded-xl border text-xs font-bold transition-all
                      ${config.modelPose === pose 
                        ? 'border-amber-500 bg-amber-500/10 text-white' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}`}
                  >
                    {pose}
                  </button>
                ))}
              </div>
            </section>

            {/* 6. Environment */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <MapPin size={14} /> 6. Environment
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {currentBackgroundOptions.map((bg) => (
                  <button
                    key={bg}
                    onClick={() => setConfig(prev => ({ ...prev, modelBackground: bg }))}
                    className={`px-3 py-3 rounded-xl border text-[10px] font-bold transition-all text-left flex items-center gap-2
                      ${config.modelBackground === bg 
                        ? 'border-amber-500 bg-amber-500/10 text-white' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </section>

            {/* 7. Bottom Color */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Palette size={14} /> 7. Bottom Color
              </h3>
              <div className="grid grid-cols-3 gap-2">
                {COLOR_PRESETS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => setConfig(prev => ({ ...prev, bottomColor: color.name }))}
                    className={`px-3 py-2 rounded-lg border text-[10px] font-bold transition-all flex flex-col items-center gap-2
                      ${config.bottomColor === color.name 
                        ? 'border-amber-500 bg-amber-500/10 text-white' 
                        : 'border-white/10 bg-white/5 text-white/60 hover:border-white/30'}`}
                  >
                    <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: color.hex }} />
                    {color.name}
                  </button>
                ))}
              </div>
            </section>

            {/* 8. Fine Tuning */}
            <section>
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                <Info size={14} /> 8. Custom Notes
              </h3>
              <textarea
                value={config.promptNotes}
                onChange={(e) => setConfig(prev => ({ ...prev, promptNotes: e.target.value }))}
                placeholder="E.g. Elegant pose, dramatic lighting..."
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors h-24 resize-none"
              />
            </section>

            <button
              onClick={handleDrape}
              disabled={isGenerating || !config.fabricImage}
              className={`w-full py-5 rounded-2xl font-bold text-lg flex items-center justify-center gap-3 transition-all
                ${isGenerating || !config.fabricImage 
                  ? 'bg-white/10 text-white/20 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-amber-400 to-amber-600 text-black hover:scale-[1.02] shadow-xl shadow-amber-900/20'}`}
            >
              {isGenerating ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
              {isGenerating ? 'Draping...' : 'Drape My Design'}
            </button>

            {error && (
              <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 p-3 rounded-lg border border-red-500/20">
                {error}
              </p>
            )}

            {history.length > 0 && (
              <section className="pt-6 border-t border-white/5">
                <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4 flex items-center gap-2">
                  <History size={14} /> Recent Drapes
                </h3>
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                  {history.map((img, i) => (
                    <div key={i} onClick={() => setResultImage(img)} className="w-16 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-white/10 hover:border-amber-500">
                      <img src={img} className="w-full h-full object-cover" alt="History" />
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </aside>

        {/* Preview Area */}
        <section className="flex-1 bg-black relative flex items-center justify-center p-6 md:p-12 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(212,175,55,0.05),transparent_70%)] pointer-events-none"></div>
          
          <div className={`relative w-full max-w-2xl ${(() => {
            switch(config.aspectRatio) {
              case '1:1': return 'aspect-square';
              case '4:3': return 'aspect-[4/3]';
              case '16:9': return 'aspect-video';
              default: return 'aspect-[3/4]';
            }
          })()} rounded-[2rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/5 group bg-[#0a0a0a]`}>
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-black/40 backdrop-blur-sm">
                <div className="w-24 h-24 relative mb-6">
                  <div className="absolute inset-0 border-t-4 border-amber-500 rounded-full animate-spin"></div>
                </div>
                <p className="text-white font-serif italic text-2xl">Crafting Perfection</p>
                <p className="text-white/40 text-xs mt-4 animate-pulse uppercase tracking-[0.2em]">High-Resolution Rendering</p>
              </div>
            )}

            {resultImage ? (
              <img src={resultImage} className="w-full h-full object-cover" alt="Result" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-8">
                  <Sparkles className="text-white/20 w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif text-white mb-4 italic">Visualize Your Creation</h2>
                <p className="text-white/40 max-w-md">Upload fabric to begin the transformation.</p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
