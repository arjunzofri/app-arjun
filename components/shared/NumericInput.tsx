"use client";

import { useRef, useCallback } from "react";

type Props = {
  value: number | string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  className?: string;
};

export function NumericInput({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLInputElement>(null);

  const handleFocus = useCallback(() => {
    ref.current?.select();
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Permitir solo dígitos y punto decimal
      const filtered = raw.replace(/[^0-9.]/g, "");
      onChange(filtered);
    },
    [onChange]
  );

  return (
    <input
      ref={ref}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={value}
      onChange={handleChange}
      onFocus={handleFocus}
      placeholder={placeholder}
      className={className}
    />
  );
}
