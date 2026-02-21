/**
 * ConfigOption
 * Opción seleccionable para configuración (idioma, tema, etc.)
 */

import React from 'react';
import { Check } from 'lucide-react';

interface ConfigOptionProps {
  label: string;
  description?: string;
  icon?: string | React.ReactNode;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
}

export default function ConfigOption({
  label,
  description,
  icon,
  selected = false,
  onClick,
  disabled = false,
}: ConfigOptionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`
        group relative w-full cursor-pointer transition-all duration-200
        ${disabled ? 'cursor-not-allowed opacity-50' : ''}
      `}
    >
      <div
        className={`
          flex items-center justify-between rounded-xl p-4
          transition-all duration-200
          ${
            selected
              ? 'border-2 border-[#18B7B0] bg-[#18B7B0]/5'
              : 'border border-gray-200 bg-white hover:border-[#18B7B0]/50 hover:shadow-md'
          }
        `}
      >
        {/* Left side: Icon + Text */}
        <div className="flex items-center gap-4">
          {/* Icon Container */}
          {icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-50 text-2xl shadow-sm">
              {icon}
            </div>
          )}

          {/* Text */}
          <div className="text-left">
            <span className={`block text-lg font-semibold ${selected ? 'text-gray-900' : 'text-gray-700'}`}>
              {label}
            </span>
            {description && (
              <span className="block text-sm text-gray-500">{description}</span>
            )}
          </div>
        </div>

        {/* Right side: Check indicator */}
        {selected ? (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#18B7B0] text-white">
            <Check size={16} strokeWidth={3} />
          </div>
        ) : (
          <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
        )}
      </div>
    </button>
  );
}
