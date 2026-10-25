import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete, X, ShieldCheck } from 'lucide-react';

interface PinLockModalProps {
  isOpen: boolean;
  mode: 'unlock' | 'set' | 'remove';
  savedPin: string | null;
  onSuccess: (pin?: string) => void;
  onCancel?: () => void;
}

export const PinLockModal: React.FC<PinLockModalProps> = ({
  isOpen,
  mode,
  savedPin,
  onSuccess,
  onCancel,
}) => {
  const [pin, setPin] = useState<string>('');
  const [confirmPin, setConfirmPin] = useState<string>('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setConfirmPin('');
      setStep('enter');
      setErrorMsg(null);
    }
  }, [isOpen, mode]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    setErrorMsg(null);
    if (mode === 'set' && step === 'confirm') {
      if (confirmPin.length < 4) {
        const next = confirmPin + digit;
        setConfirmPin(next);
        if (next.length === 4) {
          if (next === pin) {
            onSuccess(next);
          } else {
            setErrorMsg('PINs do not match. Try again.');
            setConfirmPin('');
          }
        }
      }
      return;
    }

    if (pin.length < 4) {
      const next = pin + digit;
      setPin(next);

      if (next.length === 4) {
        if (mode === 'unlock') {
          if (next === savedPin) {
            onSuccess();
          } else {
            setErrorMsg('Incorrect PIN');
            setTimeout(() => setPin(''), 400);
          }
        } else if (mode === 'remove') {
          if (next === savedPin) {
            onSuccess();
          } else {
            setErrorMsg('Incorrect PIN');
            setTimeout(() => setPin(''), 400);
          }
        } else if (mode === 'set') {
          setStep('confirm');
        }
      }
    }
  };

  const handleBackspace = () => {
    setErrorMsg(null);
    if (mode === 'set' && step === 'confirm') {
      setConfirmPin((prev) => prev.slice(0, -1));
    } else {
      setPin((prev) => prev.slice(0, -1));
    }
  };

  const currentDisplayPin = mode === 'set' && step === 'confirm' ? confirmPin : pin;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xs bg-[#181818] border border-[#2D2D2D] rounded-2xl p-6 shadow-2xl flex flex-col items-center"
        role="dialog"
        aria-labelledby="pin-modal-title"
      >
        {/* Cancel button if optional */}
        {onCancel && mode !== 'unlock' && (
          <div className="w-full flex justify-end -mt-2 -mr-2 mb-2">
            <button
              onClick={onCancel}
              className="p-1 rounded text-[#777] hover:text-[#CCC]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="w-12 h-12 rounded-full bg-[#202020] border border-[#333] flex items-center justify-center mb-3">
          <Lock className="w-5 h-5 text-[#E07A5F]" />
        </div>

        <h2 id="pin-modal-title" className="text-sm font-semibold text-[#ECECEC] text-center">
          {mode === 'unlock'
            ? 'Enter 4-Digit Passcode'
            : mode === 'remove'
            ? 'Confirm PIN to Remove Lock'
            : step === 'confirm'
            ? 'Confirm New Passcode'
            : 'Create 4-Digit Passcode'}
        </h2>

        <p className="text-[11px] text-[#7A7A7A] text-center mt-1 mb-5">
          {mode === 'unlock'
            ? 'Your personal reset journal is protected.'
            : mode === 'remove'
            ? 'Disable privacy lock on this browser.'
            : step === 'confirm'
            ? 'Re-enter the same 4 digits.'
            : 'Keep your urge logs & habit records private.'}
        </p>

        {/* 4 PIN Dots */}
        <div className="flex items-center gap-4 mb-6">
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = idx < currentDisplayPin.length;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all ${
                  isFilled
                    ? 'bg-[#ECECEC] scale-110 shadow-sm'
                    : 'bg-[#292929] border border-[#444]'
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <div className="text-xs text-[#E07A5F] font-medium mb-3 text-center animate-shake">
            {errorMsg}
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-[240px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-13 rounded-full bg-[#202020] hover:bg-[#282828] active:bg-[#333] text-lg font-mono font-medium text-white transition-colors flex items-center justify-center border border-[#2B2B2B]"
            >
              {digit}
            </button>
          ))}

          <div className="h-13 flex items-center justify-center">
            {mode === 'set' && step === 'confirm' && (
              <button
                type="button"
                onClick={() => {
                  setStep('enter');
                  setConfirmPin('');
                }}
                className="text-[11px] text-[#888] hover:text-white"
              >
                Back
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-13 rounded-full bg-[#202020] hover:bg-[#282828] active:bg-[#333] text-lg font-mono font-medium text-white transition-colors flex items-center justify-center border border-[#2B2B2B]"
          >
            0
          </button>

          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Delete last digit"
            className="h-13 rounded-full bg-[#202020] hover:bg-[#282828] active:bg-[#333] text-sm text-[#888] hover:text-white transition-colors flex items-center justify-center border border-[#2B2B2B]"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
