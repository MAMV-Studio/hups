'use client';

import {useEffect, useRef, useState} from 'react';

export function ThemeMusic({duringPlay}: {duringPlay: boolean}) {
  const audio = useRef<HTMLAudioElement>(null);
  const sound = useRef<{context: AudioContext, gain: GainNode} | null>(null);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const volume = duringPlay ? 0.18 : 0.40;

  useEffect(() => {
    const track = audio.current;
    const graph = sound.current;
    if (graph) graph.gain.gain.setTargetAtTime(volume, graph.context.currentTime, 0.08);
    else if (track) track.volume = volume;
  }, [volume]);

  useEffect(() => {
    const track = audio.current;
    return () => {
      track?.pause();
      if (sound.current) void sound.current.context.close().catch(() => {});
      sound.current = null;
    };
  }, []);

  function toggle() {
    const track = audio.current;
    if (!track) return;
    if (!track.paused) {
      track.pause();
      return;
    }

    setFailed(false);
    if (!sound.current && typeof AudioContext === 'function') {
      try {
        const context = new AudioContext();
        const gain = context.createGain();
        gain.connect(context.destination);
        try {
          context.createMediaElementSource(track).connect(gain);
        } catch (error) {
          void context.close().catch(() => {});
          throw error;
        }
        gain.gain.value = volume;
        track.volume = 1;
        sound.current = {context, gain};
      } catch {
        track.volume = volume;
      }
    }

    const context = sound.current?.context;
    if (context && context.state !== 'running') {
      void context.resume().catch(() => setFailed(true));
    }

    void track.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
    });
  }

  return <div className="theme-controls">
    <audio ref={audio} src="/hups-tunnari.mp3" preload="none" loop
      onPlaying={() => setPlaying(true)} onPause={() => setPlaying(false)}
      onError={() => {setPlaying(false); setFailed(true);}} />
    <button type="button" className="theme-toggle" aria-label="Musiikki"
      aria-pressed={playing} title={playing ? 'Musiikki pois' : 'Musiikki päälle'} onClick={toggle}>
      <span aria-hidden="true">{playing ? '♫' : '♪'}</span>
      <span>Musiikki</span>
    </button>
    <span className="version">VERSIO 39</span>
    {failed && <span className="theme-error" role="status">Musiikki ei käynnistynyt. Kokeile uudelleen.</span>}
  </div>;
}
