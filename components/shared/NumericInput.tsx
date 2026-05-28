"use client";

import { useState, useRef, useCallback, useEffect } from "react";

type Props = {
  value: number | string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  max?: number;
};

export function NumericInput({ value, onChange, placeholder, className, max }: Props) {
  const [display, setDisplay] = useState(String(value ?? ""));
  const ref = useRef<HTMLInputElement>(null);

  // Sync display solo cuando value cambia desde fuera
  useEffect(() => {
    const extNum = typeof value === "string" ? (value === "" ? 0 : Number(value)) : value;
    const dispNum = display === "" ? null : Number(display);
    if (dispNum !== null && !isNaN(extNum) && dispNum === extNum) return;
    setDisplay(String(value ?? ""));
  }, [value]);

  const handleFocus = useCallback(() => {
    ref.current?.select();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value.replace(/[^0-9.]/g, "");
      const n = Number(raw);
      if (raw !== "" && max !== undefined && n > max) {
        setDisplay(String(max));
        onChange(String(max));
        return;
      }
      setDisplay(raw);
      onChange(raw);
    },
    [onChange, max]
  );

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
}
