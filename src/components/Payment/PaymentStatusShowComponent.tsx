"use client";
import { useStore } from "@/zustandStore/zustandStore";
import { useEffect } from "react";

export default function PaymentStatusShowComponent() {
    const {paymentConcluded, showPaymentConcluded, setShowPaymentConcluded} = useStore();

    // Auto-hide after 5 seconds for success, 8 seconds for error
    useEffect(() => {
        if (showPaymentConcluded) {
            const timer = setTimeout(() => {
                setShowPaymentConcluded(false);
            }, paymentConcluded ? 5000 : 8000);
            return () => clearTimeout(timer);
        }
    }, [showPaymentConcluded, paymentConcluded, setShowPaymentConcluded]);

    if (!showPaymentConcluded) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fadeIn">
            <div className={`relative w-full max-w-md transform transition-all duration-300 ${
                paymentConcluded ? 'animate-scaleIn' : 'animate-scaleIn'
            }`}>
                {/* Close Button */}
                <button
                    onClick={() => setShowPaymentConcluded(false)}
                    className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white/95 backdrop-blur-sm shadow-xl flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 group border border-gray-100"
                    aria-label="Close"
                >
                    <svg
                        className="w-4.5 h-4.5 text-gray-500 group-hover:text-gray-900 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
                </button>

                {/* Success Card */}
                {paymentConcluded ? (
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-theme-sage/40 backdrop-blur-sm">
                        {/* Animated Background Gradient */}
                        <div className="h-1.5 bg-linear-to-r from-theme-sage via-theme-olive to-theme-sage"></div>
                        
                        <div className="p-7 sm:p-8 text-center">
                            {/* Success Icon */}
                            <div className="mb-5 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-theme-sage/30 rounded-full animate-ping opacity-40"></div>
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-theme-sage via-theme-olive to-theme-sage rounded-2xl flex items-center justify-center shadow-lg shadow-theme-sage/40">
                                        <svg
                                            className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Success Message */}
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2.5 leading-tight">
                                Order Placed Successfully!
                            </h2>
                            <p className="text-sm sm:text-base text-gray-500 mb-6 leading-relaxed px-1">
                                Thank you for shopping with us. Your order has been confirmed and you'll receive a confirmation email shortly.
                            </p>

                            {/* Action Button */}
                            <button
                                onClick={() => setShowPaymentConcluded(false)}
                                className="inline-flex items-center justify-center px-6 py-2.5 sm:py-3 bg-linear-to-r from-theme-sage to-theme-olive text-white text-sm font-semibold rounded-xl hover:from-theme-olive hover:to-theme-sage transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg shadow-theme-sage/40"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Error Card */
                    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-theme-sage/40 backdrop-blur-sm">
                        {/* Animated Background Gradient */}
                        <div className="h-1.5 bg-linear-to-r from-theme-olive via-theme-sage to-theme-olive"></div>
                        
                        <div className="p-7 sm:p-8 text-center">
                            {/* Error Icon */}
                            <div className="mb-5 flex justify-center">
                                <div className="relative">
                                    <div className="absolute inset-0 bg-theme-sage/20 rounded-full animate-pulse opacity-40"></div>
                                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 bg-linear-to-br from-theme-olive via-theme-sage to-theme-olive rounded-2xl flex items-center justify-center shadow-lg shadow-theme-sage/40">
                                        <svg
                                            className="w-8 h-8 sm:w-10 sm:h-10 text-white"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={3}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Error Message */}
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2.5 leading-tight">
                                Payment Failed
                            </h2>
                            <p className="text-sm sm:text-base text-gray-500 mb-3 leading-relaxed px-1">
                                Oops! Something went wrong and your order could not be placed.
                            </p>
                            <p className="text-xs sm:text-sm text-gray-600 mb-5 font-medium">
                                Please reach out to our support team for assistance.
                            </p>

                            {/* Contact Info */}
                            <div className="bg-linear-to-br from-gray-50 to-gray-100/50 rounded-xl p-3.5 mb-5 border border-gray-100">
                                <p className="text-xs text-gray-500 mb-1 font-medium">Contact Support</p>
                                <a
                                    href="tel:+"
                                    className="text-base sm:text-lg font-semibold text-theme-olive hover:text-theme-sage transition-colors inline-block"
                                >
                                    +91 XXXXX XXXXX
                                </a>
                            </div>

                            {/* Action Button */}
                            <button
                                onClick={() => setShowPaymentConcluded(false)}
                                className="inline-flex items-center justify-center px-6 py-2.5 sm:py-3 bg-linear-to-r from-theme-olive to-theme-sage text-white text-sm font-semibold rounded-xl hover:from-theme-sage hover:to-theme-olive transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg shadow-theme-sage/40"
                            >
                                Try Again
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}