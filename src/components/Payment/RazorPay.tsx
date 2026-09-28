"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface RazorPayProps {
    /** Amount in rupees */
    amount: number;
    /** Razorpay order id returned from your backend (e.g. `razorpay_order_id`) */
    razorpayOrderId: string;
    /** Display name on the Razorpay widget */
    name?: string;
    /** Description shown on the widget */
    description?: string;
    /** Logo URL */
    image?: string;
    /** Prefill customer info (name, email, contact) per Razorpay API */
    prefill?: { name?: string; email?: string; contact?: string };
    /** Optional callback URL for server-side verification */
    callbackUrl?: string;
    /** Called when payment succeeds (client-side) */
    onSuccess?: (response: { razorpay_payment_id: string; razorpay_order_id: string, razorpay_signature: string }) => void;
    /** Called when payment fails or user closes popup */
    onClose?: () => void;
    /** Called as soon as the Razorpay popup is opened */
    onPaymentInitiated?: () => void;
    autoOpen?: boolean;
}

export default function RazorPayButton({
    amount,
    razorpayOrderId,
    name = "TheJWEL",
    description = "Order Payment",
    image,
    prefill,
    callbackUrl,
    onSuccess,
    onClose,
    onPaymentInitiated,
    autoOpen = false,
}: RazorPayProps) {
    const [sdkReady, setSdkReady] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [showManualPay, setShowManualPay] = useState(false);
    const hasAutoOpenedRef = useRef(false);

    useEffect(() => {
        if (typeof window === "undefined") return;

        let cancelled = false;
        const start = Date.now();
        const maxWaitMs = 15_000;

        const check = () => {
            if (cancelled) return;

            if ((window as any).Razorpay) {
                setSdkReady(true);
                setLoadError(null);
                return;
            }

            if (Date.now() - start > maxWaitMs) {
                setSdkReady(false);
                setLoadError(
                    "Razorpay is taking too long to load. Please check your internet connection or disable ad-blockers and try again."
                );
                return;
            }

            setTimeout(check, 300);
        };

        check();

        return () => { cancelled = true; };
    }, []);

    const initiatePayment = useCallback(async () => {
        const RazorpayConstructor = (window as any).Razorpay;

        if (!RazorpayConstructor) {
            setSdkReady(false);
            setLoadError(
                "Razorpay could not be initialized. Please refresh the page or disable any ad-blockers and try again."
            );
            return;
        }

        const options: Record<string, unknown> = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
            amount: Math.round(amount * 100),
            currency: "INR",
            name,
            description,
            image: image ?? "https://pub-6da66eab69fe457ca97348b35f86f86b.r2.dev/resources/logo/cropped-logo.svg",
            order_id: razorpayOrderId,
            theme: {
                color: "#3399cc",
            },
            config: {
                display: {
                    blocks: {
                        banks: {
                            name: 'Pay via UPI',
                            instruments: [
                                {
                                    method: 'upi',
                                    flows: ["qr"],
                                    apps: ["google_pay", "phonepe"]
                                }
                            ],
                        },
                    },
                    sequence: ['block.banks'],
                    preferences: {
                        show_default_blocks: true,
                    },
                },
            }
        };

        // const options = {
        //     key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || "",
        //     amount: Math.round(amount * 100),
        //     currency: "INR",
        //     name,
        //     description,
        //     image:
        //       image ??
        //       "https://pub-6da66eab69fe457ca97348b35f86f86b.r2.dev/resources/logo/cropped-logo.svg",
        //     order_id: razorpayOrderId,
        //     theme: {
        //       color: "#3399cc",
        //     },
        // } as any;
        // if (prefill?.name || prefill?.email || prefill?.contact) {
        //     options.prefill = {
        //         ...(prefill.name && { name: prefill.name }),
        //         ...(prefill.email && { email: prefill.email }),
        //         ...(prefill.contact && { contact: prefill.contact }),
        //     };
        // }
        if (callbackUrl) options.callback_url = callbackUrl;
        if (onSuccess) {
            options.handler = async (response: { razorpay_payment_id: string; razorpay_order_id: string, razorpay_signature: string }) => {
                const verifyRes = await fetch("/api/payment/verify-payment", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_signature: response.razorpay_signature
                    })
                })

                const data = await verifyRes.json() as { success: boolean }

                if (data.success) {
                    onSuccess(response as { razorpay_payment_id: string; razorpay_order_id: string, razorpay_signature: string })
                } else {
                    alert("Payment verification failed")
                }
            };
        }
        if (onClose) {
            options.modal = {
                ondismiss: () => {
                    setShowManualPay(true);
                    onClose();
                },
            };
        } else if (autoOpen) {
            options.modal = {
                ondismiss: () => setShowManualPay(true),
            };
        }

        const paymentObject = new RazorpayConstructor(options);
        if (onPaymentInitiated) {
            onPaymentInitiated();
        }
        paymentObject.open();
    }, [
        amount,
        razorpayOrderId,
        name,
        description,
        image,
        prefill,
        callbackUrl,
        onSuccess,
        onClose,
        onPaymentInitiated,
        autoOpen,
    ]);

    useEffect(() => {
        if (!autoOpen || !sdkReady || hasAutoOpenedRef.current) return;
        hasAutoOpenedRef.current = true;
        initiatePayment();
    }, [autoOpen, sdkReady, initiatePayment]);

    return (
        <>
            {autoOpen && !showManualPay && !loadError ? (
                <div className="w-full px-4 py-2.5 rounded-lg bg-[#DECAF2] text-[#360000] text-sm font-semibold text-center">
                    {sdkReady ? "Opening payment checkout…" : "Loading Razorpay…"}
                </div>
            ) : null}
            {(!autoOpen || loadError || showManualPay) && (
                <button
                    disabled={!sdkReady}
                    onClick={initiatePayment}
                    className={`w-full px-4 py-2.5 rounded-lg text-white font-semibold transition-all duration-200 text-sm shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${sdkReady
                        ? "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
                        : "bg-gray-400"
                        }`}
                >
                    {sdkReady ? "Pay with Razorpay" : "Loading Razorpay…"}
                </button>
            )}
            {loadError && (
                <p className="mt-2 text-xs text-red-600 font-medium">{loadError}</p>
            )}
        </>
    );
}
