"use client";
import { createClient } from "@/lib/supabase-Utils/client";

import AddressSection from "@/components/Address/AddressSection";
import OptimizedImage from "@/components/OptimizedImage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "@/zustandStore/zustandStore";
import { toast } from "react-toastify";
import {
  formatIstDate,
  formatIstTime,
  parseDbDateAsUtc,
} from "@/lib/datetime";

// Icon Components
const PhoneIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z"
    />
  </svg>
);

const EmailIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
    />
  </svg>
);

const UserIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

const OrderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.4 2.924-6.375a48.567 48.567 0 0 0-8.563-4.137M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

const AddressIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
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
);

const LogoutIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className="w-5 h-5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75"
    />
  </svg>
);

const Skeleton = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export default function AccountPage() {
  const primaryButtonClass =
    "group relative overflow-hidden inline-flex items-center justify-center gap-2  text-white font-semibold text-xs sm:text-sm md:text-base rounded-md px-4 py-2 shadow-md hover:shadow-xl hover:shadow-theme-sage/30 transition-all duration-300 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-rose-200 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed";
  const [userData, setUserData] = useState<any>(null);
  const [emailUpdateState, setEmailUpdateState] = useState(false);
  const [nameUpdateState, setNameUpdateState] = useState(false);
  const [createdAt, setCreatedAt] = useState<string>("");
  const [addresses, setAddresses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [copiedOrderId, setCopiedOrderId] = useState<string | null>(null);
  const [loadingOrderItems, setLoadingOrderItems] = useState<string | null>(
    null
  );
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const router = useRouter();

  const supabase = createClient();
  const {
    refresh,
    setRefresh,
    setAuthenticatedState,
    setAuthUserId,
    setCartId,
    setCartItems,
    setWishListItems,
    setInitiatingCheckout,
    setPaymentConcluded,
    setShowPaymentConcluded,
  } = useStore();

  const copyToClipboard = async (text: string) => {
    // Prefer modern clipboard API when available.
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard");
      return;
    }

    // Fallback for older browsers / non-secure contexts.
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.setAttribute("readonly", "");
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.top = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(textarea);
    if (!ok) throw new Error("Copy failed");
  };

  const fetchUserProfile = async () => {
    setLoadingProfile(true);
    setLoadingOrders(true);
    try {
      // First check if there's an active session
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session) {
        router.push("/");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user profile:", error);
        router.push("/");
        return;
      }
      if (!data?.user?.phone) {
        router.push("/");
        return;
      }
      
      // Merged query: fetch user with addresses and orders in a single query
      const { data: user, error: userError } = await supabase
        .from("users")
        .select(`
          *,
          addresses(*),
          orders(
            *,
            order_items(*, products(*)),
            shipping_address:addresses!orders_shipping_address_id_fkey(*)
          )
        `)
        .eq("phone_number", "+" + data.user.phone)
        .single();
        
      if (userError) {
        console.error("Error fetching user profile:", userError);
        alert("Error fetching user profile. Please try again.");
        return;
      }
      
      // Sort orders by order_date descending and limit to 3
      const sortedOrders = (user?.orders ?? [])
        .sort((a: any, b: any) => {
          const dateA = parseDbDateAsUtc(a.order_date)?.getTime() ?? 0;
          const dateB = parseDbDateAsUtc(b.order_date)?.getTime() ?? 0;
          return dateB - dateA;
        })
        .slice(0, 3);
      
      setUserData(user);
      setAddresses(user?.addresses ?? []);
      setOrders(sortedOrders ?? []);
      setCreatedAt(user?.created_at?.split("T")[0] || "N/A");
    } catch (err) {
      console.error("Unexpected error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchUserProfile();
  }, [refresh]);

  const handleEmailUpdateState = () => {
    setEmailUpdateState(!emailUpdateState);
  };

  const handleNameUpdateState = () => {
    setNameUpdateState(!nameUpdateState);
  };

  const handleEmailUpdate = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const email = (e.target as HTMLFormElement).email.value;

    if (!userData?.user_id) {
      console.error("User ID is missing");
      alert("Unable to update email. Please try again.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ email })
      .eq("user_id", userData.user_id)
      .select("*")
      .single();

    if (error) {
      alert("Failed to update email. Please try again.");
      return;
    }

    if (data) {
      setUserData((prev: any) => ({ ...(prev ?? {}), email: data.email }));
      setEmailUpdateState(false);
      alert("Email updated successfully");
    }
  };

  const handleNameUpdate = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const firstName = (e.target as HTMLFormElement).firstName.value;
    const lastName = (e.target as HTMLFormElement).lastName.value;

    if (!userData?.user_id) {
      console.error("User ID is missing");
      alert("Unable to update name. Please try again.");
      return;
    }

    const { data, error } = await supabase
      .from("users")
      .update({ first_name: firstName, last_name: lastName })
      .eq("user_id", userData.user_id)
      .select("*")
      .single();

    if (error) {
      alert("Failed to update name. Please try again.");
      return;
    }

    if (data) {
      setUserData((prev: any) => ({
        ...(prev ?? {}),
        first_name: data.first_name,
        last_name: data.last_name,
      }));
      setNameUpdateState(false);
      alert("Name updated successfully");
    }
  };

  const toggleOrder = (orderId: string) => {
    setExpandedOrderId((prev) => (prev === orderId ? null : orderId));
  };

  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            My Account
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your account information and preferences
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Main Content - Left Side (2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <UserIcon />
                Account Information
              </h2>

              <div className="space-y-4">
                {/* Name Field */}
                <div className="flex flex-col gap-3 sm:gap-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-row items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="p-2 bg-purple-100 rounded-lg text-purple-600 flex-shrink-0">
                      <UserIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 block mb-1">
                        Full Name
                      </span>
                      {loadingProfile ? (
                        <Skeleton className="h-4 w-40" />
                      ) : (
                        <span className="text-sm sm:text-base text-gray-900 font-medium break-words">
                          {userData?.first_name || userData?.last_name
                            ? `${userData?.first_name || ""} ${
                                userData?.last_name || ""
                              }`.trim()
                            : "Not provided"}
                        </span>
                      )}
                    </div>
                    {!loadingProfile && !nameUpdateState && (
                      <button
                        className={`${primaryButtonClass} self-start sm:self-auto bg-[#360000] hover:bg-[#360000]/90 hover:cursor-pointer`}
                        onClick={handleNameUpdateState}
                      >
                        <span
                          className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                          aria-hidden="true"
                        />
                        <span className="relative flex items-center gap-1.5 md:gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full bg-white/70"
                            aria-hidden="true"
                          />
                          <span>Update Name</span>
                        </span>
                      </button>
                    )}
                  </div>
                  {loadingProfile ? (
                    <Skeleton className="h-8 w-24 ml-11 sm:ml-0" />
                  ) : (
                    nameUpdateState && (
                      <form
                        onSubmit={handleNameUpdate}
                        className="flex flex-col gap-2 ml-11 sm:ml-0"
                      >
                        <div className="flex flex-col sm:flex-row gap-2">
                          <input
                            type="text"
                            name="firstName"
                            placeholder="First name"
                            defaultValue={userData?.first_name || ""}
                            className="flex-1 border border-theme-sage/30 rounded-md px-3 py-2 text-sm outline-0 focus:ring-2 focus:ring-theme-sage focus:border-transparent text-gray-900 placeholder-gray-400"
                            required
                          />
                          <input
                            type="text"
                            name="lastName"
                            placeholder="Last name"
                            defaultValue={userData?.last_name || ""}
                            className="flex-1 border border-theme-sage/30 rounded-md px-3 py-2 text-sm outline-0 focus:ring-2 focus:ring-theme-sage focus:border-transparent text-gray-900 placeholder-gray-400"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className={`${primaryButtonClass} min-w-[90px]`}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={handleNameUpdateState}
                            className={`${primaryButtonClass} min-w-[90px]`}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )
                  )}
                </div>

                {/* Phone Field */}
                <div className="flex flex-col gap-2 sm:gap-4 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-theme-sage/20 rounded-lg text-[#360000] flex-shrink-0">
                      <PhoneIcon />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 block mb-1">
                        Phone Number
                      </span>
                      {loadingProfile ? (
                        <Skeleton className="h-4 w-32" />
                      ) : (
                        <span className="text-sm sm:text-base text-gray-900 font-medium">
                          {userData?.phone_number || "Not provided"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:gap-4 pb-4 border-b border-gray-100">
                  <div className="flex flex-row items-center gap-3 sm:gap-4 flex-wrap">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
                      <EmailIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 block mb-1">
                        Email
                      </span>
                      {loadingProfile ? (
                        <Skeleton className="h-4 w-40" />
                      ) : (
                        <span className="text-sm sm:text-base text-gray-900 font-medium break-words">
                          {userData?.email || "Not provided"}
                        </span>
                      )}
                    </div>
                    {!loadingProfile && !emailUpdateState && (
                      <button
                        className={`${primaryButtonClass} self-start sm:self-auto bg-[#360000] hover:bg-[#360000]/90 hover:cursor-pointer`}
                        onClick={handleEmailUpdateState}
                      >
                        <span
                          className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 ease-out"
                          aria-hidden="true"
                        />
                        <span className="relative flex items-center gap-1.5 md:gap-2">
                          <span
                            className="inline-block h-2 w-2 rounded-full bg-white/70"
                            aria-hidden="true"
                          />
                          <span>Update Email</span>
                        </span>
                      </button>
                    )}
                  </div>
                  {loadingProfile ? (
                    <Skeleton className="h-8 w-24 ml-11 sm:ml-0" />
                  ) : (
                    emailUpdateState && (
                      <form
                        onSubmit={handleEmailUpdate}
                        className="flex flex-col sm:flex-row gap-2 ml-11 sm:ml-0"
                      >
                        <input
                          type="email"
                          name="email"
                          placeholder="Enter your email"
                          className="flex-1 border border-theme-sage/30 rounded-md px-3 py-2 text-sm outline-0 focus:ring-2 focus:ring-theme-sage focus:border-transparent text-gray-900 placeholder-gray-400"
                          required
                        />
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={!emailUpdateState}
                            className={`${primaryButtonClass} min-w-[90px]`}
                          >
                            Update
                          </button>
                          <button
                            type="button"
                            onClick={handleEmailUpdateState}
                            className={`${primaryButtonClass} min-w-[90px]`}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )
                  )}
                </div>

                <div className="flex flex-col gap-2 sm:gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg text-amber-600 flex-shrink-0">
                      <CalendarIcon />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs sm:text-sm font-medium text-gray-500 block mb-1">
                        Customer Since
                      </span>
                      {loadingProfile ? (
                        <Skeleton className="h-4 w-24" />
                      ) : (
                        <span className="text-sm sm:text-base text-gray-900 font-medium">
                          {createdAt || "N/A"}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Orders Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6 flex items-center gap-2">
                <OrderIcon />
                Recent Orders
              </h2>

              {loadingOrders ? (
                <div className="space-y-4">
                  {Array.from({ length: 2 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="border border-gray-200 rounded-lg p-4"
                    >
                      <div className="flex flex-col gap-3">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : orders && orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const orderDate = formatIstDate(order?.order_date) ?? "N/A";
                    const orderTime = formatIstTime(order?.order_date);
                    const orderNumberToCopy =
                      order?.order_number ?? order?.order_id ?? "";
                    const orderNumberToDisplay =
                      order?.order_number?.slice(-8) ??
                      order?.order_id?.slice(0, 8) ??
                      "N/A";
                    const isCodOrder = (order?.order_number || "").startsWith("COD-");
                    const paymentLabel =
                      isCodOrder && order?.payment_status === "pending(cod)"
                        ? "Pending (COD)"
                        : (order?.payment_status || "pending").toUpperCase();
                    const shippingAddress = order?.shipping_address;
                    const isExpanded = expandedOrderId === order?.order_id;
                    const orderItems =
                      order?.order_items && Array.isArray(order.order_items)
                        ? order.order_items
                        : order?.order_items
                        ? [order.order_items]
                        : [];

                    return (
                      <div
                        key={order?.order_id ?? `order-${Math.random()}`}
                        className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col gap-3 sm:gap-4">
                          <div className="flex-1">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-2">
                              <span className="text-xs sm:text-sm font-semibold text-gray-900">
                                Order #
                                {orderNumberToDisplay}
                              </span>
                              <button
                                type="button"
                                onClick={async () => {
                                  if (!orderNumberToCopy) return;
                                  try {
                                    await copyToClipboard(orderNumberToCopy);
                                    setCopiedOrderId(order?.order_id ?? null);
                                    window.setTimeout(
                                      () => setCopiedOrderId(null),
                                      1200
                                    );
                                  } catch (err) {
                                    console.error(
                                      "Failed to copy order number:",
                                      err
                                    );
                                  }
                                }}
                                disabled={!orderNumberToCopy}
                                className=" px-2 py-1 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-fit font-open-sans font-extrabold text-sm
                                cursor-pointer "
                              >
                                {copiedOrderId === (order?.order_id ?? null)
                                  ? "Copied!"
                                  : "Click to copy order number"}
                              </button>
                              <span
                                className={`px-2.5 py-1 rounded-full text-xs font-medium w-fit ${
                                  order?.order_status === "delivered"
                                    ? "bg-green-100 text-green-700"
                                    : order?.order_status === "shipped"
                                    ? "bg-blue-100 text-blue-700"
                                    : order?.order_status === "processing"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : order?.order_status === "cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {order?.order_status?.toUpperCase() ??
                                  "PENDING"}
                              </span>
                              <span className="px-2.5 py-1 rounded-full text-xs font-medium w-fit bg-violet-100 text-violet-700">
                                {paymentLabel}
                              </span>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                              <p className="flex items-center gap-2">
                                <span className="w-4 h-4 flex items-center justify-center">
                                  <CalendarIcon />
                                </span>
                                <span>
                                  {orderDate}
                                  {orderTime && (
                                    <span className="block text-xs text-gray-500">
                                      {orderTime} IST
                                    </span>
                                  )}
                                </span>
                              </p>
                              <p className="flex items-center gap-2">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={1.5}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span className="font-semibold text-gray-900">
                                  ₹
                                  {order?.total_amount?.toFixed(2) ??
                                    order?.order_total?.toFixed(2) ??
                                    "0.00"}
                                </span>
                              </p>
                              {shippingAddress && (
                                <p className="flex items-start gap-2 mt-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={1.5}
                                    stroke="currentColor"
                                    className="w-4 h-4 mt-0.5 flex-shrink-0"
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
                                  <span className="text-xs">
                                    {shippingAddress.street_address},{" "}
                                    {shippingAddress.city},{" "}
                                    {shippingAddress.state} -{" "}
                                    {shippingAddress.postal_code}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                            <button
                              onClick={() => toggleOrder(order?.order_id)}
                              disabled={loadingOrderItems === order?.order_id}
                              className={`${primaryButtonClass} w-full sm:w-auto text-xs sm:text-sm bg-[#360000] hover:bg-[#360000]/90 hover:cursor-pointer`}
                            >
                            {loadingOrderItems === order?.order_id ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Loading...
                              </>
                            ) : isExpanded ? (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M4.5 15.75l7.5-7.5 7.5 7.5"
                                  />
                                </svg>
                                Hide Details
                              </>
                            ) : (
                              <>
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  strokeWidth={2}
                                  stroke="currentColor"
                                  className="w-4 h-4"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                                  />
                                </svg>
                                View Details
                              </>
                            )}
                            </button>
                            {order?.order_status === "delivered" && orderItems.length > 0 && (
                              <a
                                href={`/product/${orderItems[0]?.products?.product_id || ''}`}
                                className={`${primaryButtonClass} w-full sm:w-auto text-xs sm:text-sm bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 hover:from-amber-600 hover:via-yellow-600 hover:to-amber-600`}
                              >
                                <span className="relative flex items-center gap-1.5 md:gap-2">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2}
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z"
                                    />
                                  </svg>
                                  <span>Give Review</span>
                                </span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Order Items - Expandable */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-gray-200">
                            {loadingOrderItems === order?.order_id ? (
                              <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-theme-sage"></div>
                              </div>
                            ) : order?.order_items &&
                              order?.order_items.length > 0 ? (
                              <>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">
                                  Order Items ({order?.order_items?.length ?? 0}
                                  )
                                </h4>
                                <div className="space-y-3">
                                  {order?.order_items?.map(
                                    (item: any, index: number) => (
                                      <div
                                        key={item?.order_item_id ?? index}
                                        className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                                      >
                                        {/* Product Image */}
                                        {item?.products?.thumbnail_image && (
                                          <div className="flex-shrink-0 w-16 h-16 relative rounded-md overflow-hidden">
                                            <OptimizedImage
                                              src={
                                                item.products.thumbnail_image
                                              }
                                              alt={
                                                item?.products?.product_name ??
                                                "Product"
                                              }
                                              preset="thumbnail"
                                              fill
                                              objectFit="cover"
                                              className="rounded-md"
                                            />
                                          </div>
                                        )}
                                        {/* Product Details */}
                                        <div className="flex-1 min-w-0 w-full">
                                          <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                            {item?.products?.product_name ??
                                              "N/A"}
                                          </p>
                                          {item?.products?.description && (
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                              {item.products.description}
                                            </p>
                                          )}
                                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mt-2 text-xs text-gray-600">
                                            <span>
                                              Quantity:{" "}
                                              <span className="font-medium">
                                                {item?.quantity ?? "N/A"}
                                              </span>
                                            </span>
                                            <span>
                                              Unit Price:{" "}
                                              <span className="font-medium">
                                                ₹
                                                {item?.products?.final_price?.toFixed(
                                                  2
                                                ) ?? "0.00"}
                                              </span>
                                            </span>
                                          </div>
                                          {item?.products?.metal_type && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              Metal: {item.products.metal_type}
                                            </p>
                                          )}
                                        </div>
                                        {/* Price */}
                                        <div className="flex-shrink-0 w-full sm:w-auto text-left sm:text-right">
                                          <p className="text-sm sm:text-base font-bold text-gray-900">
                                            ₹
                                            {(item?.products?.final_price?.toFixed(
                                              2
                                            ) ?? 0) * (item?.quantity ?? 0)}
                                          </p>
                                          {item?.products?.final_price &&
                                            item?.quantity && (
                                              <p className="text-xs text-gray-500 mt-1">
                                                ₹
                                                {item.products.final_price.toFixed(
                                                  2
                                                )}{" "}
                                                x {item.quantity}
                                              </p>
                                            )}
                                        </div>
                                      </div>
                                    )
                                  )}
                                </div>
                              </>
                            ) : (
                              <div className="text-center py-6">
                                <p className="text-sm text-gray-600">
                                  No items found for this order
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 text-gray-400 mx-auto mb-4 flex items-center justify-center">
                    <OrderIcon />
                  </div>
                  <p className="mt-4 text-gray-600">No orders yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Your order history will appear here
                  </p>
                  <a
                    href="/"
                    className="inline-block mt-4 px-6 py-2 bg-theme-sage hover:bg-theme-olive text-white font-medium rounded-lg transition-colors duration-200"
                  >
                    Start Shopping
                  </a>
                </div>
              )}

              {!loadingOrders && orders && orders.length > 0 && (
                <div className="mt-5 flex justify-end">
                  <Link
                    href="/account/orders"
                    className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
                  >
                    View all orders
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar - Right Side (1 column) */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Actions Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                Quick Actions
              </h2>

              <div className="space-y-3">
                <a
                  href="/style/american-diamond"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500  hover:cursor-pointer text-white font-medium rounded-lg transition-all duration-200 ease-in-out text-center hover:scale-105 "
                >
                  Browse Styles
                </a>
                <a
                  href="/"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-pink-500 to-red-500  hover:cursor-pointer text-white font-medium rounded-lg transition-all duration-200 ease-in-out text-center hover:scale-105 "
                >
                  Continue Shopping
                </a>
                <button
                  onClick={async () => {
                    const { error } = await supabase.auth.signOut();
                    if (error) {
                    } else {
                      setAuthenticatedState(false);
                      setAuthUserId("");
                      setCartId("");
                      setCartItems([]);
                      setWishListItems([]);
                      setInitiatingCheckout(false);
                      setPaymentConcluded(false);
                      setShowPaymentConcluded(false);
                      setRefresh();
                      router.push("/");
                    }
                  }}
                  className={`${primaryButtonClass} w-full text-sm sm:text-base py-3 bg-[#360000] hover:bg-[#360000]/90 hover:cursor-pointer`}
                >
                  <LogoutIcon />
                  Logout
                </button>
              </div>
            </div>

            {/* Addresses Card */}
            <AddressSection
              addresses={addresses ?? []}
              userId={userData?.user_id ?? ("" as string)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
