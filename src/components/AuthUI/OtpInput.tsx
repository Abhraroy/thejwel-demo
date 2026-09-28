import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/zustandStore/zustandStore';
import { createClient } from '@/lib/supabase-Utils/client';
import { useRouter } from 'next/navigation';
import { userSignIn } from '@/utilityFunctions/UserSignIn';
interface OtpInputProps {
  length?: number;
  onComplete?: (otp: string) => void;
  containerClassName?: string;
  onClick?: () => void;
}

export default function OtpInput({ length = 6, onComplete, containerClassName = 'w-full bg-white border-b border-theme-sage/30 sticky top-[70px] md:top-[80px] z-50 shadow-sm flex items-center justify-center transition-all ease-in-out duration-900', onClick }: OtpInputProps) {
  const [otp, setOtp] = useState<string[]>(Array(length).fill(''));
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setOtpInputState, customerMobno, CartId } = useStore();
  const supabase = createClient();
  const router = useRouter();
  // Focus first input on mount
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // Handle OTP change
  const handleChange = (index: number, value: string) => {
    // Filter out non-numeric characters
    const cleaned = value.replace(/\D/g, '');
    
    if (cleaned.length === 0) {
      // Clear current input
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      setError('');
      
      // Focus previous input on backspace
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else {
      // Take only the first digit
      const digit = cleaned[0];
      const newOtp = [...otp];
      newOtp[index] = digit;
      setOtp(newOtp);
      setError('');

      // Auto-focus next input
      if (index < length - 1 && digit) {
        inputRefs.current[index + 1]?.focus();
      }

      // Check if OTP is complete
      const completeOtp = newOtp.join('');
      if (completeOtp.length === length && onComplete) {
        onComplete(completeOtp);
      }
    }
  };

  // Handle key down for backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent non-numeric characters
    if (!/[0-9]/.test(e.key) && e.key !== 'Backspace' && e.key !== 'Delete' && e.key !== 'Tab' && e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') {
      e.preventDefault();
    }

    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }

    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      e.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    const cleaned = pastedText.replace(/\D/g, '').slice(0, length);
    
    if (cleaned.length > 0) {
      const newOtp = [...otp];
      for (let i = 0; i < length; i++) {
        newOtp[i] = cleaned[i] || '';
      }
      setOtp(newOtp);
      setError('');

      // Focus the last filled input or the last input
      const focusIndex = Math.min(cleaned.length, length - 1);
      inputRefs.current[focusIndex]?.focus();

      // Check if OTP is complete
      if (cleaned.length === length && onComplete) {
        onComplete(cleaned);
      }
    }
  };


  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const completeOtp = otp.join('');
    
    if (completeOtp.length === length) {
      setError('');
      setIsVerifying(true);
      
      const {success,error,session,message} = await userSignIn(completeOtp,customerMobno,supabase)
      if(success && !error && session){
        if (onClick) {
          onClick();
          setIsVerifying(false);
          return;
        }
        setOtpInputState();
        router.push('/account');
      }
      else{
        setError(message);
      }
      setIsVerifying(false);
      if (onComplete) {
         onComplete(completeOtp);
      }
    } else {
      setError(`Please enter all ${length} digits`);
    }

  };

  return (
    <>
      <div className={containerClassName}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 md:py-4'>
          <form onSubmit={handleSubmit} className='flex flex-col items-center gap-4'>
            <div className='w-full max-w-md'>
              <label htmlFor="otp-input-0" className='block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2 text-center'>
                <span className='hidden sm:inline'>Enter the OTP sent to your phone number:</span>
                <span className='sm:hidden'>Enter OTP:</span>
              </label>
              
              {/* OTP Input Boxes */}
              <div className='flex justify-center gap-2 sm:gap-3 mb-2'>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`otp-input-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el;
                    }}
                    type="tel"
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={index === 0 ? handlePaste : undefined}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    className='w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 text-center text-lg sm:text-xl md:text-2xl font-semibold border-2 border-theme-sage/60 rounded-lg focus:outline-none focus:ring-2 focus:ring-theme-sage focus:border-theme-sage text-gray-900 transition-all'
                  />
                ))}
              </div>
              
              {error && (
                <p className='mt-1 text-xs text-red-600 text-center'>{error}</p>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isVerifying}
              className='w-full sm:w-auto px-6 py-2.5 bg-[#360000]/80 hover:bg-[#360000] hover:cursor-pointer text-white font-medium rounded-lg transition-colors duration-200 text-sm sm:text-base shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-theme-sage focus:ring-offset-2 whitespace-nowrap disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-30'
            >
              {isVerifying ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying…
                </>
              ) : (
                'Verify OTP'
              )}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}

