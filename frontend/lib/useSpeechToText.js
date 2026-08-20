"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Wraps the browser's built-in SpeechRecognition — free, no API key, no
 * backend round-trip. Chrome/Edge/Safari implement it; Firefox and older
 * Safari don't, so callers must check `supported` and skip rendering a mic
 * button entirely rather than showing one that silently fails.
 *
 * One-shot by design (continuous: false): a search box wants a phrase, not
 * an open mic. A fresh SpeechRecognition instance is created per `start()`
 * call instead of being reused, which sidesteps "recognition already
 * started" errors some browsers throw on a second `.start()`.
 */
export default function useSpeechToText({ lang, onResult, onError } = {}) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    if (listening) return;
    const SpeechRecognition = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "ur" ? "ur-PK" : "en-US";
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onresult = (event) => {
      const result = event.results[event.results.length - 1];
      onResult?.(result[0].transcript.trim(), result.isFinal);
    };
    recognition.onerror = (event) => {
      // "no-speech"/"aborted" are routine (silence, or the user re-tapped) — not real failures.
      if (event.error === "no-speech" || event.error === "aborted") return;
      onError?.(event.error === "not-allowed" || event.error === "service-not-allowed" ? "denied" : "error");
    };
    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    setListening(true);
    recognition.start();
  }, [lang, listening, onResult, onError]);

  // Stop any in-flight recognition if the component unmounts mid-listen.
  useEffect(() => () => recognitionRef.current?.stop(), []);

  return { supported, listening, start, stop };
}
