'use client';

import {useCallback, useEffect, useRef, useState} from 'react';

const MUSIC_PREFERENCE = 'hups-music-muted';

export function useThemeMusic(duringPlay: boolean) {
  const audio = useRef<HTMLAudioElement>(null);
  const sound = useRef<{context: AudioContext; gain: GainNode} | null>(null);
  const enabled = useRef(true);
  const [muted, setMuted] = useState(false);
  const volume = duringPlay ? 0.18 : 0.40;
  const currentVolume = useRef(volume);
  currentVolume.current = volume;

  const play = useCallback((fromGesture: boolean) => {
    const track = audio.current;
    if (!track || !enabled.current) return;

    if (fromGesture && !sound.current && typeof AudioContext === 'function') {
      let context: AudioContext | undefined;
      try {
        context = new AudioContext();
        const gain = context.createGain();
        gain.gain.value = currentVolume.current;
        gain.connect(context.destination);
        context.createMediaElementSource(track).connect(gain);
        sound.current = {context, gain};
        track.volume = 1;
      } catch {
        void context?.close().catch(() => {});
      }
    }

    const graph = sound.current;
    if (graph && graph.context.state !== 'running') {
      void graph.context.resume().catch(() => {});
    }
    if (track.paused) void track.play().catch(() => {});
  }, []);

  useEffect(() => {
    const graph = sound.current;
    if (graph) graph.gain.gain.setTargetAtTime(volume, graph.context.currentTime, 0.08);
    else if (audio.current) audio.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    const track = audio.current;
    try {
      enabled.current = localStorage.getItem(MUSIC_PREFERENCE) !== '1';
    } catch {}
    setMuted(!enabled.current);
    play(false);

    function onInteraction(event: Event) {
      if (!event.isTrusted) return;
      if (event.target instanceof Element && event.target.closest('.theme-toggle')) return;
      play(true);
    }

    document.addEventListener('click', onInteraction, true);
    document.addEventListener('keydown', onInteraction, true);
    return () => {
      document.removeEventListener('click', onInteraction, true);
      document.removeEventListener('keydown', onInteraction, true);
      track?.pause();
      if (sound.current) void sound.current.context.close().catch(() => {});
      sound.current = null;
    };
  }, [play]);

  function toggle() {
    enabled.current = !enabled.current;
    setMuted(!enabled.current);
    try {
      localStorage.setItem(MUSIC_PREFERENCE, enabled.current ? '0' : '1');
    } catch {}
    if (enabled.current) play(true);
    else audio.current?.pause();
  }

  return {
    audio: <audio ref={audio} src="/hups-tunnari.mp3" preload="none" loop />,
    button: <button type="button" className="theme-toggle" aria-label="Musiikki"
      aria-pressed={!muted} title={muted ? 'Musiikki päälle' : 'Musiikki pois'} onClick={toggle}>
      <span aria-hidden="true">{muted ? '♪' : '♫'}</span>
    </button>,
  };
}
