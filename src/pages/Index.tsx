import { useState, useRef } from "react";
import Icon from "@/components/ui/icon";
import { useSoundEngine } from "@/hooks/useSoundEngine";

type Screen = "panel" | "settings";

interface SoundButton {
  id: string;
  label: string;
  emoji: string;
  gradient: string;
  glowColor: string;
  active: boolean;
  customAudio?: string;
  customAudioName?: string;
}

interface Settings {
  masterVolume: number;
  bass: number;
  treble: number;
  reverb: number;
  echo: number;
  balance: number;
}

const SOUND_BUTTONS: SoundButton[] = [
  { id: "kick",  label: "Бас-барабан",    emoji: "🥁", gradient: "linear-gradient(135deg, #7c3aed, #a855f7, #d946ef)", glowColor: "#a855f7", active: false },
  { id: "snare", label: "Малый барабан",  emoji: "🎯", gradient: "linear-gradient(135deg, #db2777, #ec4899, #f43f5e)", glowColor: "#ec4899", active: false },
  { id: "hihat", label: "Хай-хэт",        emoji: "✨", gradient: "linear-gradient(135deg, #0891b2, #22d3ee, #38bdf8)", glowColor: "#22d3ee", active: false },
  { id: "clap",  label: "Хлопок",         emoji: "👏", gradient: "linear-gradient(135deg, #059669, #4ade80, #34d399)", glowColor: "#4ade80", active: false },
  { id: "synth", label: "Синтезатор",     emoji: "🎹", gradient: "linear-gradient(135deg, #ea580c, #fb923c, #fbbf24)", glowColor: "#fb923c", active: false },
  { id: "bass",  label: "Бас",            emoji: "🎸", gradient: "linear-gradient(135deg, #ca8a04, #facc15, #a3e635)", glowColor: "#facc15", active: false },
  { id: "fx1",   label: "Эффект FX1",     emoji: "🌊", gradient: "linear-gradient(135deg, #4f46e5, #8b5cf6, #a78bfa)", glowColor: "#8b5cf6", active: false },
  { id: "fx2",   label: "Эффект FX2",     emoji: "⚡", gradient: "linear-gradient(135deg, #be185d, #f472b6, #fb7185)", glowColor: "#f472b6", active: false },
];

const SETTINGS_CONFIG = [
  { key: "masterVolume" as keyof Settings, label: "Общая громкость", sub: "Master Volume", icon: "Volume2",      color: "#a855f7" },
  { key: "bass"         as keyof Settings, label: "Басы",             sub: "Bass",          icon: "Waves",        color: "#22d3ee" },
  { key: "treble"       as keyof Settings, label: "Высокие частоты",  sub: "Treble",        icon: "TrendingUp",   color: "#4ade80" },
  { key: "reverb"       as keyof Settings, label: "Реверберация",     sub: "Reverb",        icon: "Repeat2",      color: "#fb923c" },
  { key: "echo"         as keyof Settings, label: "Эхо",              sub: "Echo",          icon: "Radio",        color: "#f472b6" },
  { key: "balance"      as keyof Settings, label: "Баланс L/R",       sub: "Balance",       icon: "AlignCenter",  color: "#facc15" },
];

export default function Index() {
  const { playSound } = useSoundEngine();
  const [screen, setScreen] = useState<Screen>("panel");
  const [buttons, setButtons] = useState<SoundButton[]>(SOUND_BUTTONS);
  const [settings, setSettings] = useState<Settings>({
    masterVolume: 75, bass: 50, treble: 60, reverb: 30, echo: 20, balance: 50,
  });
  const [flashId, setFlashId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState<string | null>(null);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const audioRefs = useRef<Record<string, HTMLAudioElement>>({});

  const handleSoundClick = (id: string) => {
    setFlashId(id);
    setButtons(prev => prev.map(b => b.id === id ? { ...b, active: !b.active } : b));
    setTimeout(() => setFlashId(null), 500);

    const btn = buttons.find(b => b.id === id);
    if (btn?.customAudio) {
      if (!audioRefs.current[id]) {
        audioRefs.current[id] = new Audio(btn.customAudio);
      }
      const audio = audioRefs.current[id];
      audio.volume = settings.masterVolume / 100;
      audio.currentTime = 0;
      audio.play();
    } else {
      playSound(id as Parameters<typeof playSound>[0], settings);
    }
  };

  const handleFileUpload = (id: string, file: File) => {
    const url = URL.createObjectURL(file);
    audioRefs.current[id] = new Audio(url);
    setButtons(prev => prev.map(b =>
      b.id === id ? { ...b, customAudio: url, customAudioName: file.name } : b
    ));
  };

  const handleRemoveAudio = (id: string) => {
    if (audioRefs.current[id]) {
      audioRefs.current[id].pause();
      delete audioRefs.current[id];
    }
    setButtons(prev => prev.map(b =>
      b.id === id ? { ...b, customAudio: undefined, customAudioName: undefined } : b
    ));
  };

  const handleLabelChange = (id: string, label: string) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, label } : b));
  };

  const updateSetting = (key: keyof Settings, value: number) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const activeCount = buttons.filter(b => b.active).length;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Ambient glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div style={{ position: 'absolute', top: '-15%', left: '-10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', bottom: '-15%', right: '-5%', width: 450, height: 450, borderRadius: '50%', background: 'radial-gradient(circle, rgba(236,72,153,0.12) 0%, transparent 70%)', filter: 'blur(40px)' }} />
        <div style={{ position: 'absolute', top: '45%', left: '40%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)', filter: 'blur(40px)' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-5 pt-7 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #ec4899)', boxShadow: '0 0 20px rgba(168,85,247,0.5)' }}>
            🎛️
          </div>
          <div>
            <h1 className="font-black text-white tracking-widest text-lg leading-none" style={{ fontFamily: 'Montserrat, sans-serif' }}>SOUNDBOARD</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Звуковая панель</p>
          </div>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border"
          style={{ background: 'rgba(74,222,128,0.08)', borderColor: 'rgba(74,222,128,0.2)' }}>
          <div className="w-2 h-2 rounded-full bg-green-400 animate-neon-pulse" />
          <span className="text-xs font-bold text-green-400">LIVE</span>
        </div>
      </header>

      {/* Tabs */}
      <nav className="relative z-10 flex gap-2 px-5 mb-5">
        <button onClick={() => setScreen("panel")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300"
          style={screen === "panel"
            ? { background: 'linear-gradient(135deg, #7c3aed, #ec4899)', color: '#fff', boxShadow: '0 0 20px rgba(168,85,247,0.4)' }
            : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
          <Icon name="Grid3x3" size={15} />Панель
        </button>
        <button onClick={() => setScreen("settings")}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold transition-all duration-300"
          style={screen === "settings"
            ? { background: 'linear-gradient(135deg, #0891b2, #3b82f6)', color: '#fff', boxShadow: '0 0 20px rgba(34,211,238,0.4)' }
            : { background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', border: '1px solid hsl(var(--border))' }}>
          <Icon name="SlidersHorizontal" size={15} />Настройки
        </button>
      </nav>

      {/* Panel Screen */}
      {screen === "panel" && (
        <main className="relative z-10 px-5 animate-fade-in-up">
          <div className="grid grid-cols-2 gap-3 mb-4">
            {buttons.map((btn) => (
              <button key={btn.id} onClick={() => handleSoundClick(btn.id)}
                className="relative overflow-hidden rounded-3xl p-5 text-left transition-all duration-200 active:scale-95"
                style={{
                  background: btn.gradient,
                  boxShadow: btn.active
                    ? `0 0 30px ${btn.glowColor}70, 0 0 60px ${btn.glowColor}30, inset 0 0 20px rgba(255,255,255,0.1)`
                    : `0 4px 24px ${btn.glowColor}25`,
                  transform: flashId === btn.id ? 'scale(0.95)' : btn.active ? 'scale(1.02)' : 'scale(1)',
                }}>
                <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(160deg, rgba(255,255,255,0.25) 0%, transparent 50%)' }} />
                {btn.active && <div className="absolute inset-0 rounded-3xl border-2 border-white/30 animate-ping" />}
                <div className="relative z-10 flex flex-col gap-2">
                  <div className="flex items-start justify-between">
                    <span className="text-3xl leading-none">{btn.emoji}</span>
                    {btn.customAudio && (
                      <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
                        <Icon name="Music" size={11} className="text-white" />
                      </div>
                    )}
                  </div>
                  <span className="text-sm font-bold text-white leading-tight">{btn.label}</span>
                  <div className="flex items-end gap-0.5 h-5 mt-0.5">
                    {[1,2,3,4,5].map(n => (
                      btn.active
                        ? <div key={n} className="wave-bar w-1 rounded-full bg-white/70" style={{ animationDelay: `${n * 0.1}s` }} />
                        : <div key={n} className="w-1 h-1 rounded-full bg-white/30" />
                    ))}
                  </div>
                </div>
                {btn.active && <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-white animate-pulse shadow-lg" />}
              </button>
            ))}
          </div>

          {/* Status bar */}
          <div className="rounded-2xl p-4 flex items-center justify-between border"
            style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icon name="Music2" size={16} style={{ color: '#a855f7' }} />
              <span className="text-sm font-medium">Активных треков</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-2xl font-black text-white" style={{ fontFamily: 'Montserrat, sans-serif' }}>{activeCount}</span>
              <span className="text-sm text-muted-foreground">/ {buttons.length}</span>
            </div>
          </div>
        </main>
      )}

      {/* Settings Screen */}
      {screen === "settings" && (
        <main className="relative z-10 px-5 animate-fade-in-up space-y-3">

          {/* Button config section */}
          <div className="rounded-2xl border overflow-hidden" style={{ borderColor: 'hsl(var(--border))' }}>
            <div className="px-4 py-3 flex items-center gap-2 border-b" style={{ background: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}>
              <Icon name="Sliders" size={15} style={{ color: '#a855f7' }} />
              <span className="text-sm font-bold text-white">Настройка кнопок</span>
            </div>

            <div className="divide-y" style={{ divideColor: 'hsl(var(--border))' }}>
              {buttons.map((btn) => (
                <div key={btn.id} className="p-4" style={{ background: 'hsl(var(--card))' }}>
                  <div className="flex items-center gap-3">
                    {/* Color dot */}
                    <div className="w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg"
                      style={{ background: btn.gradient, boxShadow: `0 0 10px ${btn.glowColor}40` }}>
                      {btn.emoji}
                    </div>

                    {/* Label edit */}
                    <div className="flex-1 min-w-0">
                      {editingLabel === btn.id ? (
                        <input
                          autoFocus
                          value={btn.label}
                          onChange={e => handleLabelChange(btn.id, e.target.value)}
                          onBlur={() => setEditingLabel(null)}
                          onKeyDown={e => e.key === "Enter" && setEditingLabel(null)}
                          className="w-full text-sm font-semibold bg-transparent text-white border-b outline-none pb-0.5"
                          style={{ borderColor: btn.glowColor }}
                        />
                      ) : (
                        <button onClick={() => setEditingLabel(btn.id)}
                          className="text-sm font-semibold text-white hover:opacity-70 transition-opacity text-left flex items-center gap-1.5">
                          {btn.label}
                          <Icon name="Pencil" size={11} className="text-muted-foreground" />
                        </button>
                      )}
                      {btn.customAudioName
                        ? <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: btn.glowColor }}>🎵 {btn.customAudioName}</p>
                        : <p className="text-xs text-muted-foreground mt-0.5">Встроенный звук</p>
                      }
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {btn.customAudio && (
                        <button onClick={() => handleRemoveAudio(btn.id)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-80"
                          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}
                          title="Удалить звук">
                          <Icon name="Trash2" size={13} className="text-red-400" />
                        </button>
                      )}
                      <button
                        onClick={() => fileInputRefs.current[btn.id]?.click()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:opacity-80"
                        style={{ background: `${btn.glowColor}20`, color: btn.glowColor, border: `1px solid ${btn.glowColor}40` }}>
                        <Icon name="Upload" size={12} />
                        Загрузить
                      </button>
                      <input
                        type="file"
                        accept="audio/*"
                        className="hidden"
                        ref={el => { fileInputRefs.current[btn.id] = el; }}
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(btn.id, file);
                          e.target.value = "";
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Audio settings */}
          {SETTINGS_CONFIG.map((item) => (
            <div key={item.key} className="rounded-2xl p-5 border"
              style={{ background: `linear-gradient(135deg, ${item.color}12, ${item.color}06)`, borderColor: `${item.color}30` }}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ background: `${item.color}20`, border: `1px solid ${item.color}40` }}>
                    <Icon name={item.icon} size={16} style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm leading-none">{item.label}</p>
                    <p className="text-xs mt-1" style={{ color: `${item.color}99` }}>{item.sub}</p>
                  </div>
                </div>
                <span className="text-2xl font-black" style={{ fontFamily: 'Montserrat, sans-serif', color: item.color }}>
                  {settings[item.key]}
                </span>
              </div>
              <input type="range" min="0" max="100" value={settings[item.key]}
                onChange={e => updateSetting(item.key, Number(e.target.value))}
                className="w-full"
                style={{
                  background: `linear-gradient(to right, ${item.color} ${settings[item.key]}%, rgba(255,255,255,0.08) ${settings[item.key]}%)`,
                  accentColor: item.color,
                }} />
            </div>
          ))}

          <button
            onClick={() => setSettings({ masterVolume: 75, bass: 50, treble: 60, reverb: 30, echo: 20, balance: 50 })}
            className="w-full py-4 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 border"
            style={{ background: 'hsl(var(--card))', color: 'hsl(var(--muted-foreground))', borderColor: 'hsl(var(--border))' }}>
            <Icon name="RotateCcw" size={15} />
            Сбросить настройки звука
          </button>
          <div className="h-4" />
        </main>
      )}
    </div>
  );
}
