import { useRef, useCallback } from "react";

interface Settings {
  masterVolume: number;
  bass: number;
  treble: number;
  reverb: number;
  echo: number;
  balance: number;
}

type SoundId = "kick" | "snare" | "hihat" | "clap" | "synth" | "bass" | "fx1" | "fx2";

export function useSoundEngine() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback((): AudioContext => {
    if (!ctxRef.current || ctxRef.current.state === "closed") {
      ctxRef.current = new AudioContext();
    }
    if (ctxRef.current.state === "suspended") {
      ctxRef.current.resume();
    }
    return ctxRef.current;
  }, []);

  const buildChain = useCallback((ctx: AudioContext, settings: Settings) => {
    const masterGain = ctx.createGain();
    masterGain.gain.value = settings.masterVolume / 100;

    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = "lowshelf";
    bassFilter.frequency.value = 200;
    bassFilter.gain.value = (settings.bass - 50) / 5;

    const trebleFilter = ctx.createBiquadFilter();
    trebleFilter.type = "highshelf";
    trebleFilter.frequency.value = 3000;
    trebleFilter.gain.value = (settings.treble - 50) / 5;

    const panner = ctx.createStereoPanner();
    panner.pan.value = (settings.balance - 50) / 50;

    // Echo delay
    const echoDelay = ctx.createDelay(1.0);
    echoDelay.delayTime.value = 0.3;
    const echoFeedback = ctx.createGain();
    echoFeedback.gain.value = settings.echo / 200;
    const echoWet = ctx.createGain();
    echoWet.gain.value = settings.echo / 150;
    const echoDry = ctx.createGain();
    echoDry.gain.value = 1.0;

    // Reverb convolver (simple impulse)
    const reverbConvolver = ctx.createConvolver();
    const reverbLength = ctx.sampleRate * (settings.reverb / 100) * 2;
    const reverbBuffer = ctx.createBuffer(2, Math.max(reverbLength, 1), ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const channelData = reverbBuffer.getChannelData(ch);
      for (let i = 0; i < channelData.length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / channelData.length, 2);
      }
    }
    reverbConvolver.buffer = reverbBuffer;
    const reverbWet = ctx.createGain();
    reverbWet.gain.value = settings.reverb / 150;
    const reverbDry = ctx.createGain();
    reverbDry.gain.value = 1.0;

    // Chain: source → bassFilter → trebleFilter → echoDry → echoDelay → echoFeedback (loop)
    //                                            → echoWet  → reverbDry → masterGain → panner → dest
    //                                                        → reverbConvolver → reverbWet

    bassFilter.connect(trebleFilter);

    trebleFilter.connect(echoDry);
    trebleFilter.connect(echoDelay);
    echoDelay.connect(echoFeedback);
    echoFeedback.connect(echoDelay);
    echoDelay.connect(echoWet);

    echoDry.connect(reverbDry);
    echoWet.connect(reverbDry);
    reverbDry.connect(masterGain);
    reverbDry.connect(reverbConvolver);
    reverbConvolver.connect(reverbWet);
    reverbWet.connect(masterGain);

    masterGain.connect(panner);
    panner.connect(ctx.destination);

    return { input: bassFilter };
  }, []);

  const playKick = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(input);

    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.15);
    gain.gain.setValueAtTime(1.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    osc.start(now);
    osc.stop(now + 0.5);
  }, [buildChain]);

  const playSnare = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1500;
    noiseFilter.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.8, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(input);
    noise.start(now);
    noise.stop(now + 0.2);

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.frequency.value = 180;
    oscGain.gain.setValueAtTime(0.7, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    osc.connect(oscGain);
    oscGain.connect(input);
    osc.start(now);
    osc.stop(now + 0.1);
  }, [buildChain]);

  const playHihat = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const bufferSize = ctx.sampleRate * 0.08;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;

    const hihatFilter = ctx.createBiquadFilter();
    hihatFilter.type = "highpass";
    hihatFilter.frequency.value = 7000;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    noise.connect(hihatFilter);
    hihatFilter.connect(gain);
    gain.connect(input);
    noise.start(now);
    noise.stop(now + 0.08);
  }, [buildChain]);

  const playClap = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    for (let i = 0; i < 3; i++) {
      const offset = i * 0.012;
      const bufferSize = ctx.sampleRate * 0.1;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let j = 0; j < bufferSize; j++) data[j] = Math.random() * 2 - 1;

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1200;
      filter.Q.value = 0.6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.9, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(input);
      noise.start(now + offset);
      noise.stop(now + offset + 0.1);
    }
  }, [buildChain]);

  const playSynth = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const notes = [261.63, 329.63, 392.0];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.4);
      osc.connect(gain);
      gain.connect(input);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.4);
    });
  }, [buildChain]);

  const playBass = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.setValueAtTime(60, now + 0.1);
    osc.frequency.setValueAtTime(70, now + 0.2);

    gain.gain.setValueAtTime(1.0, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(input);
    osc.start(now);
    osc.stop(now + 0.6);
  }, [buildChain]);

  const playFx1 = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(400 + i * 150, now + i * 0.07);
      osc.frequency.linearRampToValueAtTime(800 + i * 200, now + i * 0.07 + 0.3);
      gain.gain.setValueAtTime(0.25, now + i * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.3);
      osc.connect(gain);
      gain.connect(input);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.3);
    }
  }, [buildChain]);

  const playFx2 = useCallback((ctx: AudioContext, settings: Settings) => {
    const { input } = buildChain(ctx, settings);
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    const gain = ctx.createGain();

    osc.type = "square";
    osc.frequency.value = 220;

    lfo.frequency.value = 18;
    lfoGain.gain.value = 80;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.frequency);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(input);
    osc.start(now);
    osc.stop(now + 0.6);
    lfo.start(now);
    lfo.stop(now + 0.6);
  }, [buildChain]);

  const playSound = useCallback((id: SoundId, settings: Settings) => {
    const ctx = getCtx();
    switch (id) {
      case "kick":   playKick(ctx, settings); break;
      case "snare":  playSnare(ctx, settings); break;
      case "hihat":  playHihat(ctx, settings); break;
      case "clap":   playClap(ctx, settings); break;
      case "synth":  playSynth(ctx, settings); break;
      case "bass":   playBass(ctx, settings); break;
      case "fx1":    playFx1(ctx, settings); break;
      case "fx2":    playFx2(ctx, settings); break;
    }
  }, [getCtx, playKick, playSnare, playHihat, playClap, playSynth, playBass, playFx1, playFx2]);

  return { playSound };
}
