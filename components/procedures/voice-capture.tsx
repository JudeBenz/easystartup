"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

/**
 * Minimal Web Speech API typings — the browser SpeechRecognition interface is not
 * in the TS DOM lib, so we declare just the surface we use (avoids `any`).
 */
interface SpeechResultLike {
  isFinal: boolean;
  0: { transcript: string };
}
interface SpeechEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechResultLike>;
}
interface SpeechErrorLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechEventLike) => void) | null;
  onerror: ((e: SpeechErrorLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}

/** True only on the client where the Web Speech API exists. */
export function isVoiceSupported(): boolean {
  return !!getRecognitionCtor();
}

export function VoiceCapture({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(isVoiceSupported());
    return () => {
      try {
        recRef.current?.stop();
      } catch {
        // already stopped
      }
    };
  }, []);

  function start() {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setSupported(false);
      return;
    }
    setError(null);
    const rec = new Ctor();
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        if (r.isFinal) finalChunk += r[0].transcript;
        else interimChunk += r[0].transcript;
      }
      if (finalChunk) {
        setTranscript((prev) => {
          const next = `${prev} ${finalChunk}`.replace(/\s+/g, " ").trim();
          onTranscript(next);
          return next;
        });
      }
      setInterim(interimChunk);
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError(
          "Microphone blocked — allow it in your browser, or type instead."
        );
      }
      // no-speech: just auto-stop via onend and keep the transcript.
    };

    rec.onend = () => {
      setListening(false);
      setInterim("");
    };

    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      // start() throws if called while already running — ignore.
    }
  }

  function stop() {
    try {
      recRef.current?.stop();
    } catch {
      // already stopped
    }
    setListening(false);
  }

  function toggle() {
    if (listening) stop();
    else start();
  }

  if (!supported) {
    return (
      <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        Voice dictation isn&apos;t supported in this browser — type instead.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={toggle}
          aria-pressed={listening}
          aria-label="Dictate the procedure"
        >
          {listening ? (
            <Square className="h-4 w-4" />
          ) : (
            <Mic className="h-4 w-4" />
          )}
          {listening ? "Stop" : "Start dictation"}
        </Button>
        {listening && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.1em] text-navy">
            <span
              aria-hidden
              className="inline-block h-[9px] w-[9px] animate-pulse bg-navy"
            />
            Listening
          </span>
        )}
      </div>

      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-faint">
        Speak the steps in order · tap stop when done
      </p>

      <div className="mt-3" aria-live="polite">
        {listening ? (
          <div className="min-h-[120px] border border-rule2 bg-paper p-4 text-sm leading-relaxed">
            {transcript ? (
              <span className="text-ink">{transcript} </span>
            ) : (
              <span className="text-faint">Listening…</span>
            )}
            {interim && <span className="text-faint">{interim}</span>}
          </div>
        ) : (
          <Textarea
            value={transcript}
            onChange={(e) => {
              setTranscript(e.target.value);
              onTranscript(e.target.value);
            }}
            rows={5}
            placeholder="Your spoken words appear here. Edit before generating if needed."
            className="bg-paper"
          />
        )}
      </div>

      {error && (
        <div className="mt-3 border-l-4 border-amber bg-amber-bg px-4 py-3 text-sm text-ink">
          {error}
        </div>
      )}
    </div>
  );
}
