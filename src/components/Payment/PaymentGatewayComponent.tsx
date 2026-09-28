import axios from "axios";
import { useState, useEffect } from "react";
import { useStore } from "@/zustandStore/zustandStore";
import { useRouter } from "next/navigation";
import {
  MdOutlineKeyboardArrowDown,
  MdOutlineKeyboardArrowUp,
} from "react-icons/md";
import PhoneNumberInput from "../AuthUI/PhoneNumberInput";
import OtpInput from "../AuthUI/OtpInput";
import AddressForm from "../Address/AddressForm";
import CashOnDeliveryConfirmation from "./CashOnDeliveryConfirmation";
import RazorPayButton from "./RazorPay";
import OptimizedImage from "@/components/OptimizedImage";
import { createClient } from "@/lib/supabase-Utils/client";
import type { AnyCart } from "@/types/CartTypes";
import { getAttribution } from "@/lib/attribution";
import { trackPurchase } from "@/lib/meta/pixel";
import { Truck, PartyPopper, Check } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  SHIPPING_ENABLED,
  getShippingCost,
} from "@/lib/shipping-config";

type MarketingCoupon = {
  coupon_code: string;
  description?: string | null;
  discount_type?: "percentage" | "fixed" | null;
  discount_value: number;
  min_purchase_amount?: number | null;
  max_discount_amount?: number | null;
};

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[PaymentGatewayComponent]", ...args);
  }
};

export default function PaymentGatewayComponent() {
  const router = useRouter();
  // const [transacToken, setTransacToken] = useState<string | null>(null);
  const {
    setInitiatingCheckout,
    cartItems,
    AuthenticatedState,
    AuthUserId,
    setPaymentConcluded,
    setShowPaymentConcluded,
  } = useStore();
  const [showPhoneNumberInput, setShowPhoneNumberInput] = useState(true);
  const [showOrderdetails, setShowOrderdetails] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [isLoadingPayment, setIsLoadingPayment] = useState(false);
  const [showCodConfirmation, setShowCodConfirmation] = useState(false);
  const [prepaidOrderData, setPrepaidOrderData] = useState<{
    razorpay_order_id: string;
    total_amount: number;
  } | null>(null);
  const [isPlacingCodOrder, setIsPlacingCodOrder] = useState(false);
  const [codError, setCodError] = useState<string | null>(null);
  const [userFirstName, setUserFirstName] = useState<string>("");
  const [userLastName, setUserLastName] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [existingFirstName, setExistingFirstName] = useState<string | null>(null);
  const [existingLastName, setExistingLastName] = useState<string | null>(null);
  const [existingEmail, setExistingEmail] = useState<string | null>(null);
  const [existingPhoneNumber, setExistingPhoneNumber] = useState<string | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(false);
  const [prepaidCoupon, setPrepaidCoupon] = useState<MarketingCoupon | null>(null);
  const [isFetchingCoupon, setIsFetchingCoupon] = useState(false);
  const [isCouponApplied, setIsCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [userCouponInput, setUserCouponInput] = useState("");
  const [userCoupon, setUserCoupon] = useState<MarketingCoupon | null>(null);
  const [isVerifyingCoupon, setIsVerifyingCoupon] = useState(false);
  const [userCouponDiscount, setUserCouponDiscount] = useState(0);
  const [codShippingOrderData, setCodShippingOrderData] =
  useState<{
    razorpay_order_id: string;
    total_amount: number;
  } | null>(null);
  const supabase = createClient();
  const COD_FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;
  const COD_SHIPPING_FEE = SHIPPING_FEE;

  const cartItemCount = (cartItems as AnyCart).reduce(
    (sum, item: any) => sum + (Number(item?.quantity ?? 1) || 0),
    0
  );
  
  const orderTotal = (cartItems as AnyCart)
    .reduce((sum: number, item: any) => {
      const product = item?.products ?? item?.product ?? item;
      const price = Number(product?.final_price ?? product?.price ?? 0);
      const qty = Number(item?.quantity ?? 1) || 0;
      return sum + price * qty;
    }, 0)
    .toFixed(2);
  const orderTotalNumber = Number(orderTotal);
  const codShippingCost = getShippingCost(orderTotalNumber);
  const isFreeShippingUnlocked =
    !SHIPPING_ENABLED || orderTotalNumber >= COD_FREE_SHIPPING_THRESHOLD;
  const freeShippingProgress = Math.min(100, (orderTotalNumber / COD_FREE_SHIPPING_THRESHOLD) * 100);
  const amountLeftForFreeShipping = Math.max(0, COD_FREE_SHIPPING_THRESHOLD - orderTotalNumber);
  const activeCoupon = userCoupon ?? (isCouponApplied ? prepaidCoupon : null);
  const couponMinPurchaseAmount = Number(activeCoupon?.min_purchase_amount ?? 0);
  const prepaidOfferText = prepaidCoupon
    ? prepaidCoupon.discount_type === "fixed"
      ? `₹${Number(prepaidCoupon.discount_value ?? 0).toFixed(2)} off`
      : `${Number(prepaidCoupon.discount_value ?? 0)}% off`
    : "";
  const isCouponEligible = !activeCoupon || orderTotalNumber >= couponMinPurchaseAmount;
  const prepaidCouponDiscount = (() => {
    if (!activeCoupon) return userCoupon ? userCouponDiscount : 0;
    if (userCoupon) return userCouponDiscount;
    const discountType = activeCoupon.discount_type;
    const discountValue = Number(activeCoupon.discount_value ?? 0);
    let computedDiscount =
      discountType === "fixed"
        ? discountValue
        : (orderTotalNumber * discountValue) / 100;
    const maxDiscount = Number(activeCoupon.max_discount_amount ?? 0);
    if (maxDiscount > 0) {
      computedDiscount = Math.min(computedDiscount, maxDiscount);
    }
    return Number(Math.max(0, Math.min(computedDiscount, orderTotalNumber)).toFixed(2));
  })();
  const prepaidPayableAmount = Math.max(
    0,
    Math.round(orderTotalNumber - prepaidCouponDiscount)
  );
  const selectedAddressDetails = addresses.find(
    (address) => address.address_id === selectedAddress
  );
  const getCartContentIds = () =>
    (cartItems as AnyCart)
      .map((item: any) => {
        const product = item?.products ?? item?.product ?? item;
        return product?.product_id;
      })
      .filter(Boolean) as string[];
  const isCheckoutDisabled =
    isLoadingPayment ||
    !AuthenticatedState ||
    (AuthenticatedState && !selectedAddress && addresses.length > 0) ||
    (AuthenticatedState && !existingFirstName && !userFirstName.trim()) ||
    (AuthenticatedState && !existingLastName && !userLastName.trim()) ||
    (AuthenticatedState && !existingEmail && !userEmail.trim());

  // Fetch user data and addresses when authenticated
  useEffect(() => {
    const fetchUserDataAndAddresses = async () => {
      if (AuthenticatedState && AuthUserId) {
        setLoadingAddresses(true);
        setLoadingUserData(true);
        try {
          // Fetch user data for name, email, and phone
          const { data: userData, error: userError } = await supabase
            .from("users")
            .select("first_name, last_name, email, phone_number")
            .eq("user_id", AuthUserId)
            .single();

          if (!userError && userData) {
            setExistingFirstName(userData.first_name || null);
            setExistingLastName(userData.last_name || null);
            setExistingEmail(userData.email || null);
            setExistingPhoneNumber(userData.phone_number || null);
            if (userData.first_name) setUserFirstName(userData.first_name);
            if (userData.last_name) setUserLastName(userData.last_name);
            if (userData.email) setUserEmail(userData.email);
          }

          // Fetch addresses
          const { data, error } = await supabase
            .from("addresses")
            .select("*")
            .eq("user_id", AuthUserId)
            .order("is_default", { ascending: false });

          if (error) {
            console.error("Error fetching addresses:", error);
          } else {
            setAddresses(data || []);
            // Auto-select default address if available
            const defaultAddress = data?.find((addr) => addr.is_default);
            if (defaultAddress) {
              setSelectedAddress(defaultAddress.address_id);
            } else if (data && data.length > 0) {
              setSelectedAddress(data[0].address_id);
            }
          }
        } catch (err) {
          console.error("Error fetching data:", err);
        } finally {
          setLoadingAddresses(false);
          setLoadingUserData(false);
        }
      }
    };
    fetchUserDataAndAddresses();
  }, [AuthenticatedState, AuthUserId]);

  useEffect(() => {
    const fetchPrepaidCoupon = async () => {
      if (!AuthenticatedState) {
        setPrepaidCoupon(null);
        setIsCouponApplied(false);
        setCouponMessage(null);
        return;
      }

      setIsFetchingCoupon(true);
      setCouponMessage(null);
      try {
        const res = await axios.get("/api/payment/coupon");
        setPrepaidCoupon(res.data?.coupon ?? null);
        setIsCouponApplied(false);
      } catch (error: any) {
        setPrepaidCoupon(null);
        setIsCouponApplied(false);
        if (error?.response?.status !== 404) {
          setCouponMessage("Could not load prepaid coupon right now.");
        }
      } finally {
        setIsFetchingCoupon(false);
      }
    };

    fetchPrepaidCoupon();
  }, [AuthenticatedState]);

  useEffect(() => {
    if (userCoupon && !isCouponEligible) {
      setUserCoupon(null);
      setUserCouponDiscount(0);
      setUserCouponInput("");
      setCouponMessage(
        `Minimum purchase should be ₹${couponMinPurchaseAmount.toFixed(2)} for this coupon.`
      );
    }
    if (isCouponApplied && !userCoupon && !isCouponEligible) {
      setIsCouponApplied(false);
      if (prepaidCoupon) {
        setCouponMessage(
          `Minimum purchase should be ₹${couponMinPurchaseAmount.toFixed(2)} for this coupon.`
        );
      }
    }
  }, [isCouponApplied, isCouponEligible, prepaidCoupon, userCoupon, couponMinPurchaseAmount]);

  const saveUserDetailsIfNeeded = async () => {
    if (AuthUserId && (!existingFirstName || !existingLastName || !existingEmail)) {
      const updateData: { first_name?: string; last_name?: string; email?: string } = {};
      if (!existingFirstName && userFirstName.trim()) {
        updateData.first_name = userFirstName.trim();
      }
      if (!existingLastName && userLastName.trim()) {
        updateData.last_name = userLastName.trim();
      }
      if (!existingEmail && userEmail.trim()) {
        updateData.email = userEmail.trim();
      }
      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("users")
          .update(updateData)
          .eq("user_id", AuthUserId);
        if (updateError) {
          console.error("Error updating user details:", updateError);
        } else {
          if (updateData.first_name) setExistingFirstName(updateData.first_name);
          if (updateData.last_name) setExistingLastName(updateData.last_name);
          if (updateData.email) setExistingEmail(updateData.email);
        }
      }
    }
  };

  const handleProceedToPayment = async () => {
    setIsLoadingPayment(true);
    devLog("proceed-to-payment:clicked", {
      selectedAddress,
      hasCoupon: Boolean(activeCoupon?.coupon_code),
      orderTotal: orderTotalNumber,
    });
    try {
      await saveUserDetailsIfNeeded();
      const res = await axios.post(
        "/api/payment/createOrder",
        {
          address_id: selectedAddress,
          coupon_code: activeCoupon?.coupon_code ?? null,
          attribution: getAttribution(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setShowCodConfirmation(false);
      setPrepaidOrderData({
        razorpay_order_id: res.data.razorpay_order_id,
        total_amount: res.data.razorpay_order.amount / 100,
      });
      devLog("proceed-to-payment:order-created", {
        razorpayOrderId: res.data.razorpay_order_id,
        amount: res.data?.razorpay_order?.amount / 100,
      });
    } catch (error: any) {
      devLog("proceed-to-payment:failed", {
        message: error?.response?.data?.message ?? error?.message,
      });
      console.error("Error creating order:", error);
    } finally {
      setIsLoadingPayment(false);
    }
  };

  const handleApplyCoupon = () => {
    if (!prepaidCoupon) return;
    if (!isCouponEligible) {
      setCouponMessage(
        `Minimum purchase should be ₹${couponMinPurchaseAmount.toFixed(2)} for this coupon.`
      );
      return;
    }
    setUserCoupon(null);
    setUserCouponInput("");
    setUserCouponDiscount(0);
    setIsCouponApplied(true);
    setCouponMessage(`Coupon ${prepaidCoupon.coupon_code} applied successfully.`);
  };

  const handleVerifyUserCoupon = async () => {
    const code = userCouponInput.trim().toUpperCase();
    if (!code) {
      setCouponMessage("Please enter a coupon code");
      return;
    }
    setIsVerifyingCoupon(true);
    setCouponMessage(null);
    try {
      const res = await axios.post("/api/payment/verify-coupon", {
        coupon_code: code,
        order_total: orderTotalNumber,
      });
      if (res.data?.valid) {
        setUserCoupon({
          coupon_code: res.data.coupon.coupon_code,
          description: res.data.coupon.description,
          discount_type: res.data.coupon.discount_type,
          discount_value: res.data.coupon.discount_value,
          min_purchase_amount: res.data.coupon.min_purchase_amount,
          max_discount_amount: res.data.coupon.max_discount_amount,
        });
        setUserCouponDiscount(res.data.discount_amount ?? 0);
        setIsCouponApplied(false);
        setCouponMessage(`You saved ₹${(res.data.discount_amount ?? 0).toFixed(2)}! Coupon applied.`);
      } else {
        setUserCoupon(null);
        setUserCouponDiscount(0);
        setCouponMessage(res.data?.message ?? "Invalid coupon code");
      }
    } catch (err: any) {
      setUserCoupon(null);
      setUserCouponDiscount(0);
      setCouponMessage(err?.response?.data?.message ?? "Could not verify coupon. Try again.");
    } finally {
      setIsVerifyingCoupon(false);
    }
  };

  const handleRemoveUserCoupon = () => {
    setUserCoupon(null);
    setUserCouponInput("");
    setUserCouponDiscount(0);
    setCouponMessage(null);
  };

  const handleAddressSuccess = () => {
    setShowAddressForm(false);
    // Refresh addresses
    if (AuthenticatedState && AuthUserId) {
      supabase
        .from("addresses")
        .select("*")
        .eq("user_id", AuthUserId)
        .order("is_default", { ascending: false })
        .then(({ data, error }) => {
          if (!error && data) {
            setAddresses(data);
            if (data.length > 0 && !selectedAddress) {
              const defaultAddress = data.find((addr) => addr.is_default);
              setSelectedAddress(defaultAddress?.address_id || data[0].address_id);
            }
          }
        });
    }
  };

  // Reset all payment state to default
  const resetPaymentState = () => {
    setShowPhoneNumberInput(true);
    setShowOrderdetails(false);
    setShowCodConfirmation(false);
    setPrepaidOrderData(null);
    setCodShippingOrderData(null);
    setIsPlacingCodOrder(false);
    setCodError(null);
    setAddresses([]);
    setSelectedAddress(null);
    setShowAddressForm(false);
    setLoadingAddresses(false);
    setUserFirstName("");
    setUserLastName("");
    setUserEmail("");
    setExistingFirstName(null);
    setExistingLastName(null);
    setExistingEmail(null);
    setLoadingUserData(false);
    setUserCoupon(null);
    setUserCouponInput("");
    setUserCouponDiscount(0);
    setInitiatingCheckout(false); // Close the modal
  };

  const handleConfirmCashOnDelivery = async () => {
    if (codShippingCost > 0) {
      await handleCodShippingPayment();
      return;
    }
    setIsPlacingCodOrder(true);
    setCodError(null);
    if (!selectedAddress) {
      setIsPlacingCodOrder(false);
      return;
    }
    devLog("cod:confirm-clicked", {
      selectedAddress,
      hasCoupon: Boolean(activeCoupon?.coupon_code),
    });
    try {
      await saveUserDetailsIfNeeded();
      const res = await axios.post("/api/payment/cod", {
        address_id: selectedAddress,
        coupon_code: activeCoupon?.coupon_code ?? null,
        attribution: getAttribution(),
      });
      if (res.status === 200) {
        devLog("cod:success", {
          orderId: res.data?.orderId,
          orderNumber: res.data?.orderNumber,
        });
        const codEventId = res.data?.eventId ?? res.data?.orderId;
        if (codEventId) {
          trackPurchase({
            eventId: codEventId,
            value:
              typeof res.data?.purchaseValue === "number"
                ? res.data.purchaseValue
                : activeCoupon
                  ? prepaidPayableAmount
                  : orderTotalNumber,
            currency: "INR",
            contentIds: Array.isArray(res.data?.contentIds)
              ? res.data.contentIds
              : getCartContentIds(),
          });
        }
        setPaymentConcluded(true);
        setShowPaymentConcluded(true);
        resetPaymentState();
        router.push("/account/orders");
      }
    } catch (error: any) {
      devLog("cod:failed", {
        message: error?.response?.data?.message ?? error?.message,
      });
      const message =
        error?.response?.data?.message ||
        "Could not place COD order. Please try again.";
      setCodError(message);
    } finally {
      setIsPlacingCodOrder(false);
    }
  };
  const handleCodShippingPayment = async () => {
    if (!selectedAddress) {
      setCodError("Please select a delivery address.");
      return;
    }
    setIsPlacingCodOrder(true);
    setCodError(null);
    try {
      await saveUserDetailsIfNeeded();
      const res = await axios.post(
        "/api/payment/createOrder",
        {
          address_id: selectedAddress,
          payment_type: "COD_SHIPPING",
          coupon_code: activeCoupon?.coupon_code ?? null,
          attribution: getAttribution(),
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      setCodShippingOrderData({
        razorpay_order_id: res.data.razorpay_order_id,
        total_amount: res.data.amount_in_paise / 100,
      });
    } catch (error: any) {
      devLog("cod-shipping:create-order-failed", {
        message: error?.response?.data?.message ?? error?.message,
      });
      const message =
        error?.response?.data?.message ||
        "Could not start shipping payment. Please try again.";
      setCodError(message);
    } finally {
      setIsPlacingCodOrder(false);
    }
  };

  const handleCodShippingPaymentSuccess = async (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => {
    devLog("cod-shipping:razorpay-success", {
      razorpayOrderId: response.razorpay_order_id,
      razorpayPaymentId: response.razorpay_payment_id,
    });
    try {
      const completeRes = await axios.post(
        "/api/payment/complete-razorpay",
        {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature,
        },
        { headers: { "Content-Type": "application/json" } }
      );
      if (completeRes.status === 200) {
        const codEventId = completeRes.data?.event_id ?? completeRes.data?.order_id;
        if (codEventId && !completeRes.data?.already_existed) {
          const shippingPurchaseValue =
            typeof completeRes.data?.purchase_value === "number" &&
            completeRes.data.purchase_value > 0
              ? completeRes.data.purchase_value
              : orderTotalNumber + COD_SHIPPING_FEE;
          trackPurchase({
            eventId: codEventId,
            value: shippingPurchaseValue,
            currency: "INR",
            contentIds: Array.isArray(completeRes.data?.content_ids)
              ? completeRes.data.content_ids
              : getCartContentIds(),
          });
        }
        setPaymentConcluded(true);
        setShowPaymentConcluded(true);
        resetPaymentState();
        router.push("/account/orders");
      } else {
        alert(
          "Could not complete order. Contact support with payment ID: " +
            response.razorpay_payment_id
        );
      }
    } catch (error: any) {
      devLog("cod-shipping:complete-failed", {
        message: error?.response?.data?.message ?? error?.message,
      });
      const msg = error?.response?.data?.message ?? "Could not complete order.";
      alert(msg + " Contact support with payment ID: " + response.razorpay_payment_id);
    }
  };
  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] transition-opacity duration-300"
        aria-hidden="true"
      />

      {/* Payment Gateway Modal */}
      <div className="fixed inset-0 sm:inset-auto sm:top-[50%] sm:left-[50%] sm:transform sm:-translate-x-1/2 sm:-translate-y-1/2 w-full sm:w-[85vw] md:w-[75vw] lg:w-[65vw] xl:w-[55vw] 2xl:w-[45vw] sm:max-w-md h-full sm:h-[90vh] sm:max-h-[90vh] bg-white rounded-none sm:rounded-xl shadow-2xl z-[70] overflow-hidden flex flex-col ">
        {/* Header */}
        <div className="pt-4 sm:pt-5 pb-4 sm:pb-5 border-b border-amber-600/30 flex items-center justify-between gap-4 px-4 sm:px-6 bg-[#FAF9F6]">
          <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
            <button
              onClick={() => setInitiatingCheckout(false)}
              className="flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition-all duration-200 hover:scale-110 active:scale-95 flex-shrink-0"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-5 h-5 sm:w-6 sm:h-6 text-[#360000]"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 19.5L8.25 12l7.5-7.5"
                />
              </svg>
            </button>
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#360000] truncate">
              Payment Gateway
            </h1>
          </div>
        </div>

        {showCodConfirmation ? (
          <div className="flex flex-col flex-1 overflow-hidden">
            <div className="shrink-0 px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              {/* Coupon Code Input - Only visible in Cash on Delivery section */}
              <div className="rounded-xl border-2 border-black border-dashed  p-4 shadow-sm mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg" aria-hidden>✨</span>
                  <h3 className="text-base font-bold text-black">
                    Got a promo code? Unlock your savings!
                  </h3>
                </div>
                <p className="text-sm text-gray-900 mb-3">
                  Enter your coupon below and watch the price drop.
                </p>
                {userCoupon ? (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#360000] font-semibold shrink-0">✓</span>
                      <div>
                        <p className="font-bold text-green-800">
                          {userCoupon.coupon_code} applied — You save ₹{userCouponDiscount.toFixed(2)}!
                        </p>
                        <p className="text-sm text-green-700">
                          Pay ₹{prepaidPayableAmount} instead of ₹{orderTotalNumber.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveUserCoupon}
                      className="px-2.5 py-1.5 text-xs font-semibold text-green-700 bg-green-100 hover:bg-green-200 rounded-md transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={userCouponInput}
                      onChange={(e) => {
                        setUserCouponInput(e.target.value.toUpperCase());
                        setCouponMessage(null);
                      }}
                      onKeyDown={(e) => e.key === "Enter" && handleVerifyUserCoupon()}
                      placeholder="Enter coupon code (e.g. SAVE10)"
                      className="flex-1 px-4 py-2.5 text-base font-medium border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-black focus:border-amber-500 transition-all placeholder:text-gray-600 uppercase tracking-wide"
                      disabled={isVerifyingCoupon}
                      aria-label="Coupon code"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyUserCoupon}
                      disabled={isVerifyingCoupon || !userCouponInput.trim()}
                      className="px-4 py-2.5 font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all hover:shadow-md active:scale-[0.98] shrink-0 hover:cursor-pointer"
                    >
                      {isVerifyingCoupon ? (
                        <span className="flex items-center gap-1.5">
                          <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          Verifying…
                        </span>
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
                {couponMessage && !userCoupon && (
                  <p className={`text-sm mt-2 font-medium ${couponMessage.includes("saved") ? "text-green-600" : "text-rose-600"}`}>
                    {couponMessage}
                  </p>
                )}
              </div>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <CashOnDeliveryConfirmation
              cartItems={cartItems as AnyCart}
              selectedAddressDetails={selectedAddressDetails}
              orderTotal={activeCoupon ? prepaidPayableAmount.toFixed(2) : orderTotal}
              couponDiscount={activeCoupon ? prepaidCouponDiscount : 0}
              codShippingCost={codShippingCost}
              onBack={() => {
                setCodShippingOrderData(null);
                setCodError(null);
                setShowCodConfirmation(false);
              }}
              onContinueShopping={() => setInitiatingCheckout(false)}
              onConfirm={handleConfirmCashOnDelivery}
              isLoadingConfirm={isPlacingCodOrder}
              errorMessage={codError}
              codShippingOrderData={codShippingOrderData}
              razorpayPrefill={{
                name: [existingFirstName || userFirstName, existingLastName || userLastName]
                  .filter(Boolean)
                  .join(" ")
                  .trim() || undefined,
                email: (existingEmail || userEmail) || undefined,
                contact: existingPhoneNumber || undefined,
              }}
              onCodShippingSuccess={handleCodShippingPaymentSuccess}
              onPaymentInitiated={() => setInitiatingCheckout(false)}
            />
            </div>
          </div>
        ) : (
          <>
        {/* Content Area - Scrollable */}
        <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="w-full space-y-4">
            {/* Order Summary Card */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-lg border border-black p-3 shadow-sm">
              <button
                onClick={() => setShowOrderdetails(!showOrderdetails)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6 text-amber-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-5h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z"
                      />
                    </svg>
                    {cartItems && cartItems.length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                        {(cartItems as AnyCart).reduce((sum, item: any) => sum + (Number(item?.quantity ?? 1) || 0), 0)}
                      </span>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-gray-900 text-base font-bold block">
                      Order Summary
                    </span>
                    <span className="text-gray-700 text-sm font-medium">
                      {cartItemCount} items • ₹{orderTotal}
                      {(activeCoupon || userCoupon) && (
                        <span className="text-green-700"> • Prepaid ₹{prepaidPayableAmount}</span>
                      )}
                    </span>

                  </div>
                </div>
                {showOrderdetails ? (
                  <MdOutlineKeyboardArrowUp className="text-xl text-gray-600" />
                ) : (
                  <MdOutlineKeyboardArrowDown className="text-xl text-gray-600" />
                )}
              </button>
              {showOrderdetails && (
                <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                  {/* Product list with thumbnails */}
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {(cartItems as AnyCart).map((item: any, index: number) => {
                      const product = item?.products ?? item?.product ?? item;
                      const productName = product?.product_name ?? product?.name ?? "Product";
                      const qty = Number(item?.quantity ?? 1) || 0;
                      const price = Number(product?.final_price ?? product?.price ?? 0);
                      const lineTotal = price * qty;
                      const thumbnail =
                        product?.thumbnail_image ??
                        product?.product_images?.[0]?.image_url ??
                        product?.image_url ??
                        null;
                      return (
                        <div
                          key={`${product?.product_id ?? index}`}
                          className="flex items-center gap-2 rounded-md border border-gray-200 bg-white p-2"
                        >
                          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded border border-gray-100">
                            {thumbnail ? (
                              <OptimizedImage
                                src={thumbnail}
                                alt={productName}
                                preset="thumbnail"
                                fill
                                objectFit="cover"
                                sizes="48px"
                              />
                            ) : (
                              <div className="h-full w-full bg-gray-100" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {productName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {qty} × ₹{price.toFixed(2)} = ₹{lineTotal.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="text-gray-900 font-semibold">
                      ₹
                      {(cartItems as AnyCart)
                        .reduce((sum: number, item: any) => {
                          const product = item?.products ?? item?.product ?? item;
                          const price = Number(product?.base_price ?? 0);
                          const qty = Number(item?.quantity ?? 1) || 0;
                          return sum + price * qty;
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Discount:</span>
                    <span className="text-green-600 font-semibold">
                      -₹
                      {(
                        (cartItems as AnyCart).reduce((sum: number, item: any) => {
                          const product = item?.products ?? item?.product ?? item;
                          const price = Number(product?.base_price ?? 0);
                          const qty = Number(item?.quantity ?? 1) || 0;
                          return sum + price * qty;
                        }, 0) -
                        (cartItems as AnyCart).reduce((sum: number, item: any) => {
                          const product = item?.products ?? item?.product ?? item;
                          const price = Number(product?.final_price ?? product?.price ?? 0);
                          const qty = Number(item?.quantity ?? 1) || 0;
                          return sum + price * qty;
                        }, 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping (COD)*:</span>
                    <span
                      className={`font-semibold ${
                        codShippingCost > 0 ? "text-amber-700" : "text-green-600"
                      }`}
                    >
                      {codShippingCost > 0 ? `₹${codShippingCost.toFixed(2)}` : "FREE"}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1.5 border-t border-gray-200">
                    <span className="text-sm font-bold text-gray-900">Total:</span>
                    <span className="text-base font-bold text-amber-600">
                      ₹
                      {(cartItems as AnyCart)
                        .reduce((sum: number, item: any) => {
                          const product = item?.products ?? item?.product ?? item;
                          const price = Number(product?.final_price ?? product?.price ?? 0);
                          const qty = Number(item?.quantity ?? 1) || 0;
                          return sum + price * qty;
                        }, 0)
                        .toFixed(2)}
                    </span>
                  </div>
                  {activeCoupon && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">
                          Coupon ({activeCoupon.coupon_code}):
                        </span>
                        <span className="text-green-600 font-semibold">
                          -₹{prepaidCouponDiscount.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-gray-200">
                        <span className="text-sm font-bold text-gray-900">Prepaid Payable:</span>
                        <span className="text-base font-bold text-green-700">
                          ₹{prepaidPayableAmount}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Authentication Section */}
            {!AuthenticatedState ? (
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                {showPhoneNumberInput ? (
                  <PhoneNumberInput
                    containerClassName="w-full"
                    onClick={() => setShowPhoneNumberInput(false)}
                  />
                ) : (
                  <OtpInput
                    containerClassName="w-full"
                    onClick={() => setShowPhoneNumberInput(true)}
                  />
                )}
              </div>
            ) : (
              <>
              {isFetchingCoupon || prepaidCoupon ? <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200 p-4">
                {isFetchingCoupon ? (
                  <p className="text-sm text-gray-700 font-medium">Checking prepaid offers...</p>
                ) : prepaidCoupon ? (
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-base font-bold text-green-900">
                        {prepaidOfferText} on all prepaid deliveries. Use coupon{" "}
                        <span className="bg-white border border-green-300 rounded px-1.5 py-0.5 font-bold">
                          {prepaidCoupon.coupon_code}
                        </span>
                      </p>
                      {couponMessage && (
                        <p
                          className={`text-sm mt-1 font-medium ${
                            isCouponApplied ? "text-green-700" : "text-rose-600"
                          }`}
                        >
                          {couponMessage}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      disabled={isCouponApplied || !isCouponEligible}
                      className="px-3 py-1.5 rounded-md text-sm font-bold bg-green-600 text-white hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {isCouponApplied ? "Applied" : "Apply"}
                    </button>
                  </div>
                ) : (
                  <p className="text-sm text-gray-700 font-medium">
                    No prepaid coupon available right now.
                  </p>
                )}
                {!isFetchingCoupon && !prepaidCoupon && couponMessage && (
                  <p className="text-sm mt-1 font-medium text-rose-600">{couponMessage}</p>
                )}
              </div> : null}
              {/* Shipping progress — mirrors cart */}
              <div className="space-y-2.5 border-2 border-[#360000] bg-[#FFF8F6] p-3 sm:p-4 flex flex-col rounded-lg w-full shadow-sm">
                <div className="flex items-center justify-between gap-3 w-full">
                  <div className="flex items-center gap-2 text-[#360000] font-open-sans tracking-wider flex-1 min-w-0">
                    {isFreeShippingUnlocked && (
                      <PartyPopper className="w-5 h-5 shrink-0 text-[#360000]" />
                    )}
                    <span className="text-xs sm:text-sm font-bold">
                      {isFreeShippingUnlocked
                        ? "Congratulations! You've unlocked FREE shipping on Cash on Delivery!"
                        : `Add ₹${amountLeftForFreeShipping} more to get free shipping on Cash on Delivery`}
                    </span>
                  </div>
                  <Truck className="w-5 h-5 text-[#360000] shrink-0" />
                </div>

                <div className="flex items-center gap-2 w-full">
                  <div className="relative flex-1 h-2.5 bg-[#360000]/15 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-[#360000] rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${freeShippingProgress}%` }}
                    />
                  </div>
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                      isFreeShippingUnlocked
                        ? "bg-[#360000] border-[#360000] text-white"
                        : "bg-transparent border-[#360000]/25 text-[#360000]/30"
                    }`}
                  >
                    <Check className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-[#360000]/15">
                  <span className="text-sm font-bold text-[#360000]">Shipping charges (COD)</span>
                  <span
                    className={`text-base font-extrabold ${
                      codShippingCost > 0 ? "text-amber-700" : "text-green-700"
                    }`}
                  >
                    {codShippingCost > 0 ? `₹${codShippingCost.toFixed(2)}` : "FREE"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setInitiatingCheckout(false)}
                  className="w-full mt-1 px-4 py-2.5 font-bold text-white bg-gradient-to-r from-pink-500 to-red-500 rounded-lg transition-all hover:shadow-md active:scale-[0.98] hover:cursor-pointer text-sm font-open-sans tracking-wider"
                >
                  Continue Shopping
                </button>
              </div>

              {/* Shipping policy notice */}
              <div className="rounded-lg border-2 border-dashed border-amber-500 bg-amber-50 px-3 py-2.5 sm:px-4 sm:py-3 shadow-sm">
                <p className="text-xs sm:text-sm font-bold text-[#360000] leading-relaxed">
                  <span className="text-amber-700 text-base align-super">*</span>{" "}
                  ₹{COD_SHIPPING_FEE} shipping will be charged on all Cash on Delivery orders below ₹
                  {COD_FREE_SHIPPING_THRESHOLD}.
                </p>
                <p className="text-[11px] sm:text-xs text-[#360000]/80 mt-1 font-medium">
                  Prepaid orders are not charged this shipping fee.
                </p>
              </div>

              {codShippingCost > 0 && (
                <div className="rounded-lg border border-green-300 bg-gradient-to-r from-green-50 to-emerald-50 p-3 sm:p-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-bold text-green-900">
                    Pay online to save ₹{codShippingCost} on Cash on Delivery shipping
                  </span>
                </div>
              )}
              {/* Customer Details Section - Name & Email */}
              {(!existingFirstName || !existingLastName || !existingEmail) && (
                <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-amber-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                      />
                    </svg>
                    Customer Details
                  </h3>
                  
                  {loadingUserData ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {/* Name Fields */}
                      {(!existingFirstName || !existingLastName) && (
                        <div className="grid grid-cols-2 gap-2">
                          {!existingFirstName && (
                            <div>
                              <label htmlFor="customer-first-name" className="block text-sm font-semibold text-gray-700 mb-1">
                                First Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="customer-first-name"
                                value={userFirstName}
                                onChange={(e) => setUserFirstName(e.target.value)}
                                placeholder="First name"
                                className="w-full px-3 py-2.5 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder:text-gray-400"
                              />
                            </div>
                          )}
                          {!existingLastName && (
                            <div>
                              <label htmlFor="customer-last-name" className="block text-sm font-semibold text-gray-700 mb-1">
                                Last Name <span className="text-red-500">*</span>
                              </label>
                              <input
                                type="text"
                                id="customer-last-name"
                                value={userLastName}
                                onChange={(e) => setUserLastName(e.target.value)}
                                placeholder="Last name"
                                className="w-full px-3 py-2.5 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder:text-gray-400"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Email Field */}
                      {!existingEmail && (
                        <div>
                          <label htmlFor="customer-email" className="block text-sm font-semibold text-gray-700 mb-1">
                            Email Address <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="email"
                            id="customer-email"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            placeholder="Enter your email address"
                            className="w-full px-3 py-2.5 text-base font-medium border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors placeholder:text-gray-400"
                          />
                        </div>
                      )}
                      
                      <p className="text-xs font-medium text-gray-600">
                        This information will be used for order confirmation and updates.
                      </p>
                    </div>
                  )}
                </div>
              )}
              <div className="bg-white rounded-lg border border-black p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-4 h-4 text-amber-600"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                    Delivery Address
                  </h3>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-md transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-3.5 h-3.5"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 4.5v15m7.5-7.5h-15"
                      />
                    </svg>
                    Add New
                  </button>
                </div>

                {loadingAddresses ? (
                  <div className="flex items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                  </div>
                ) : addresses.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {addresses.map((address) => (
                      <label
                        key={address.address_id}
                        className={`block p-3 rounded-md border-2 cursor-pointer transition-all ${
                          selectedAddress === address.address_id
                            ? "border-amber-500 bg-amber-50"
                            : "border-gray-200 hover:border-gray-300 bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="address"
                            value={address.address_id}
                            checked={selectedAddress === address.address_id}
                            onChange={() => setSelectedAddress(address.address_id)}
                            className="mt-0.5 w-4 h-4 text-amber-600 focus:ring-amber-500"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-1">
                              <span className="text-sm font-bold text-gray-900 capitalize">
                                {address.address_type}
                              </span>
                              {address.is_default && (
                                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 font-medium leading-relaxed break-words">
                              {address.street_address}
                              {address.house_no && `, ${address.house_no}`}
                              {address.landmark && `, ${address.landmark}`}
                            </p>
                            <p className="text-sm text-gray-700 mt-0.5">
                              {address.city}, {address.state} - {address.postal_code}
                            </p>
                            <p className="text-sm text-gray-700">{address.country}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="w-10 h-10 text-gray-400 mx-auto mb-2"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                      />
                    </svg>
                    <p className="text-gray-700 text-sm font-medium mb-3">No addresses saved</p>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-md transition-colors"
                    >
                      Add Address
                    </button>
                  </div>
                )}
              </div>
              </>
            )}
          </div>
        </div>

        {/* Footer with Continue Button */}
        <div className="w-full px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 bg-gray-50">
          <>
            {prepaidOrderData ? (
              <RazorPayButton
                amount={prepaidOrderData.total_amount}
                razorpayOrderId={prepaidOrderData.razorpay_order_id}
                prefill={{
                  name: [existingFirstName || userFirstName, existingLastName || userLastName].filter(Boolean).join(" ").trim() || undefined,
                  email: (existingEmail || userEmail) || undefined,
                  contact: existingPhoneNumber || undefined,
                }}
                onPaymentInitiated={() => setInitiatingCheckout(false)}
                onSuccess={async (response) => {
                  devLog("razorpay:onSuccess", {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                  });
                  try {
                    const completeRes = await axios.post(
                      "/api/payment/complete-razorpay",
                      {
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                      },
                      { headers: { "Content-Type": "application/json" } }
                    );
                    if (completeRes.status === 200) {
                      devLog("complete-razorpay:success", {
                        orderId: completeRes.data?.order_id,
                        orderNumber: completeRes.data?.order_number,
                      });
                      const prepaidEventId =
                        completeRes.data?.event_id ?? completeRes.data?.order_id;
                      if (prepaidEventId && !completeRes.data?.already_existed) {
                        trackPurchase({
                          eventId: prepaidEventId,
                          value:
                            typeof completeRes.data?.purchase_value === "number" &&
                            completeRes.data.purchase_value > 0
                              ? completeRes.data.purchase_value
                              : prepaidOrderData.total_amount,
                          currency: "INR",
                          contentIds: Array.isArray(completeRes.data?.content_ids)
                            ? completeRes.data.content_ids
                            : getCartContentIds(),
                        });
                      }
                      setPaymentConcluded(true);
                      setShowPaymentConcluded(true);
                      resetPaymentState();
                      router.push("/account/orders");
                    } else {
                      devLog("complete-razorpay:unexpected-status", {
                        status: completeRes.status,
                      });
                      alert(
                        "Could not complete order. Contact support with payment ID: " +
                          response.razorpay_payment_id
                      );
                    }
                  } catch (error: any) {
                    devLog("complete-razorpay:failed", {
                      message: error?.response?.data?.message ?? error?.message,
                    });
                    const msg =
                      error?.response?.data?.message ??
                      "Could not complete order.";
                    alert(
                      msg +
                        " Contact support with payment ID: " +
                        response.razorpay_payment_id
                    );
                  }
                }}
              />
            ) : (
              <button
                onClick={() => {
                  setShowCodConfirmation(false);
                  handleProceedToPayment();
                }}
                className="w-full px-4 py-2.5 bg-linear-to-r from-pink-500 to-red-500 text-white font-bold rounded-lg transition-all duration-200 text-base shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center justify-center gap-2"
                disabled={isCheckoutDisabled}
              >
                {isLoadingPayment ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-[#360000]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Processing...</span>
                  </>
                ) : AuthenticatedState ? (
                  activeCoupon
                    ? `Proceed to Payment • ₹${prepaidPayableAmount}`
                    : `Proceed to Payment • ₹${orderTotalNumber.toFixed(2)}`
                ) : (
                  "Login to Continue"
                )}
              </button>
            )}
              {AuthenticatedState && (
                prepaidOrderData ? (
                  <button
                    onClick={() => setPrepaidOrderData(null)}
                    className="w-full mt-2 px-4 py-2.5 border border-[#360000]/30 bg-[#CAF2FF] text-[#360000] font-bold rounded-lg transition-all duration-200 text-base shadow-sm hover:shadow-md"
                  >
                    ← Back to payment options
                  </button>
                ) : (
                <button
                  onClick={() => {
                    setCodError(null);
                    setShowCodConfirmation(true);
                  }}
                  className="w-full mt-2 px-4 py-2.5 border border-[#360000]/30 bg-[#CAF2FF] text-[#360000] font-bold rounded-lg transition-all duration-200 text-base shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                  disabled={isCheckoutDisabled}
                >
                  Cash on Delivery
                </button>
                )
              )}
              {AuthenticatedState && !isLoadingPayment && (
                (() => {
                  const missingFields = [];
                  if ((!existingFirstName && !userFirstName.trim()) || (!existingLastName && !userLastName.trim())) {
                    missingFields.push("name");
                  }
                  if (!existingEmail && !userEmail.trim()) missingFields.push("email");
                  if (!selectedAddress && addresses.length > 0) missingFields.push("delivery address");
                  
                  if (missingFields.length === 0) return null;
                  
                  return (
                    <p className="text-sm text-[#360000] mt-2 text-center font-semibold">
                      Please enter your {missingFields.join(" and ")}
                    </p>
                  );
                })()
              )}
          </>
        </div>
        </>
        )}
      </div>

      {/* Address Form Modal */}
      {showAddressForm && AuthUserId && (
        <AddressForm
          userId={AuthUserId}
          onClose={() => setShowAddressForm(false)}
          onSuccess={handleAddressSuccess}
        />
      )}
    </>
  );
}
