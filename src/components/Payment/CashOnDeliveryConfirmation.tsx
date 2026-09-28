import type { AnyCart } from "@/types/CartTypes";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import RazorPayButton from "./RazorPay";
import { Truck, PartyPopper, Check } from "lucide-react";
import {
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  SHIPPING_ENABLED,
} from "@/lib/shipping-config";

const COD_FREE_SHIPPING_THRESHOLD = FREE_SHIPPING_THRESHOLD;
const COD_SHIPPING_FEE = SHIPPING_FEE;

interface CashOnDeliveryConfirmationProps {
  cartItems: AnyCart;
  selectedAddressDetails: any | null;
  orderTotal: string;
  couponDiscount?: number;
  codShippingCost?: number;
  onBack: () => void;
  onContinueShopping?: () => void;
  onConfirm: () => Promise<void> | void;
  isLoadingConfirm?: boolean;
  errorMessage?: string | null;
  codShippingOrderData?: {
    razorpay_order_id: string;
    total_amount: number;
  } | null;
  razorpayPrefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onCodShippingSuccess?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => Promise<void> | void;
  onPaymentInitiated?: () => void;
}

export default function CashOnDeliveryConfirmation({
  cartItems,
  selectedAddressDetails,
  orderTotal,
  couponDiscount = 0,
  codShippingCost = 0,
  onBack,
  onContinueShopping,
  onConfirm,
  isLoadingConfirm = false,
  errorMessage = null,
  codShippingOrderData = null,
  razorpayPrefill,
  onCodShippingSuccess,
  onPaymentInitiated,
}: CashOnDeliveryConfirmationProps) {
  const orderTotalNumber = Number(orderTotal);
  const requiresShippingPayment = codShippingCost > 0;
  const isFreeShippingUnlocked =
    !SHIPPING_ENABLED || orderTotalNumber >= COD_FREE_SHIPPING_THRESHOLD;
  const freeShippingProgress = Math.min(
    100,
    (orderTotalNumber / COD_FREE_SHIPPING_THRESHOLD) * 100
  );
  const amountLeftForFreeShipping = Math.max(
    0,
    COD_FREE_SHIPPING_THRESHOLD - orderTotalNumber
  );
  const confirmButtonLabel = requiresShippingPayment
    ? `Pay ₹${codShippingCost}`
    : "Confirm Order";
  const loadingButtonLabel = requiresShippingPayment
    ? "Preparing payment..."
    : "Placing COD Order...";

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="w-full space-y-3">
          {/* Shipping progress — mirrors payment gateway */}
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
              onClick={onContinueShopping ?? onBack}
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

          <div className="rounded-lg border border-[#360000]/20 bg-white p-3 sm:p-4 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-[#360000]">
              Confirm Cash on Delivery
            </h3>

            <div className="rounded-md border border-[#360000]/40 bg-black/10 backdrop-blur-sm p-2.5">
              <p className="text-xs font-semibold text-[#360000] mb-1">Products</p>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                {cartItems.map((item: any, index: number) => {
                  const product = item?.products ?? item?.product ?? item;
                  const productName = product?.product_name ?? product?.name ?? "Product";
                  const qty = Number(item?.quantity ?? 1) || 0;
                  const productPrice = Number(product?.final_price ?? product?.price ?? 0);
                  const productImage =
                    product?.thumbnail_image ?? product?.image_url ?? null;
                  const productId = product?.product_id ?? product?.id ?? null;
                  const productLink = productId ? `/product/${productId}` : null;

                  return (
                    <div
                      key={`${product?.product_id ?? productName}-${index}`}
                      className="flex items-center gap-3 rounded-md border border-[#360000]/15 bg-white p-2.5"
                    >
                      {productLink ? (
                        <Link
                          href={productLink}
                          className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-md border border-[#7A1C1C]/20 bg-white"
                        >
                          {productImage ? (
                            <OptimizedImage
                              src={productImage}
                              alt={productName}
                              preset="thumbnail"
                              fill
                              objectFit="cover"
                              sizes="(max-width: 640px) 80px, 96px"
                            />
                          ) : (
                            <div className="h-full w-full bg-[#CAF2FF]" />
                          )}
                        </Link>
                      ) : (
                        <div className="relative h-20 w-20 sm:h-24 sm:w-24 shrink-0 overflow-hidden rounded-md border border-[#7A1C1C]/20 bg-white">
                          {productImage ? (
                            <OptimizedImage
                              src={productImage}
                              alt={productName}
                              preset="thumbnail"
                              fill
                              objectFit="cover"
                              sizes="(max-width: 640px) 80px, 96px"
                            />
                          ) : (
                            <div className="h-full w-full bg-[#CAF2FF]" />
                          )}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        {productLink ? (
                          <Link
                            href={productLink}
                            className="block text-sm sm:text-base font-semibold text-[#360000] hover:underline wrap-break-word leading-snug"
                          >
                            {productName}
                          </Link>
                        ) : (
                          <p className="text-sm sm:text-base font-semibold text-[#360000] wrap-break-word leading-snug">
                            {productName}
                          </p>
                        )}
                        <p className="mt-1 text-xs sm:text-sm text-gray-700">
                          Qty: {qty}
                        </p>
                        <p className="text-sm font-bold text-[#360000]">
                          ₹{(productPrice * qty).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-md border border-gray-200 bg-gray-50 p-2.5">
              <p className="text-xs font-semibold text-[#360000] mb-1">Delivery Address</p>
              {selectedAddressDetails ? (
                <>
                  <p className="text-xs text-gray-700">
                    {selectedAddressDetails.street_address}
                    {selectedAddressDetails.house_no && `, ${selectedAddressDetails.house_no}`}
                    {selectedAddressDetails.landmark && `, ${selectedAddressDetails.landmark}`}
                  </p>
                  <p className="text-xs text-gray-700">
                    {selectedAddressDetails.city}, {selectedAddressDetails.state} -{" "}
                    {selectedAddressDetails.postal_code}
                  </p>
                  <p className="text-xs text-gray-700">{selectedAddressDetails.country}</p>
                </>
              ) : (
                <p className="text-xs text-gray-600">Please select an address to continue.</p>
              )}
            </div>

            {couponDiscount > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Coupon discount</span>
                <span className="text-green-600 font-semibold">-₹{couponDiscount.toFixed(2)}</span>
              </div>
            )}
            {requiresShippingPayment && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Shipping (COD)*</span>
                <span className="text-amber-700 font-semibold">₹{codShippingCost.toFixed(2)}</span>
              </div>
            )}
            <div className="flex items-center justify-between pt-1 border-t border-gray-200">
              <span className="text-sm font-semibold text-gray-900">Total Amount</span>
              <span className="text-base font-bold text-amber-600">₹{orderTotal}</span>
            </div>
            {errorMessage ? (
              <p className="text-xs text-red-600 font-medium">{errorMessage}</p>
            ) : null}
          </div>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2">
          {codShippingOrderData ? (
            <div className="flex-1 min-w-0">
              <RazorPayButton
                amount={codShippingOrderData.total_amount}
                razorpayOrderId={codShippingOrderData.razorpay_order_id}
                description="COD Shipping Charges"
                prefill={razorpayPrefill}
                autoOpen
                onPaymentInitiated={onPaymentInitiated}
                onSuccess={onCodShippingSuccess}
              />
            </div>
          ) : (
            <button
              onClick={onConfirm}
              disabled={!selectedAddressDetails || isLoadingConfirm}
              className="flex-1 px-3 py-2.5 bg-[#360000] text-white text-sm font-semibold rounded-md hover:bg-[#360000]/80 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoadingConfirm ? loadingButtonLabel : confirmButtonLabel}
            </button>
          )}
          <button
            onClick={onBack}
            disabled={isLoadingConfirm}
            className="flex-1 px-3 py-2.5 border border-[#360000]/30 text-[#360000] text-sm font-semibold rounded-md hover:bg-gray-100 hover:cursor-pointer transition-colors"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
