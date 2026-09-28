"use client";

import { useStore } from "@/zustandStore/zustandStore";
import Script from "next/script";
import dynamic from "next/dynamic";

const PaymentGatewayComponent = dynamic(() => import("./PaymentGatewayComponent"), { ssr: false });
const PaymentStatusShowComponent = dynamic(() => import("./PaymentStatusShowComponent"), { ssr: false });

export default function PaymentGatewayWrapper() {
  const { initiatingCheckout, showPaymentConcluded } = useStore();

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="lazyOnload"
      />
      {initiatingCheckout && <PaymentGatewayComponent />}
      {showPaymentConcluded && <PaymentStatusShowComponent />}
    </>
  );
}

