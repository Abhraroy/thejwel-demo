import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase-Utils/server";
import CopyOrderNumberButton from "./CopyOrderNumberButton";
import OptimizedImage from "@/components/OptimizedImage";
import { orderItemsWithProducts, orderWithItemsAndProducts, userWithOrdersAndItemsAndProducts } from "@/types/RelationTypeInterface";
import {
  formatIstDate,
  formatIstTime,
  parseDbDateAsUtc,
} from "@/lib/datetime";

const devLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV === "development") {
    console.log("[account/orders/page]", ...args);
  }
};





const CalendarIcon = () => (
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
      d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
    />
  </svg>
);

export default async function OrdersPage() {
  const supabase = await createClient();
  devLog("page-load:start");

  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) redirect("/");

  const { data, error } = await supabase.auth.getUser();
  if (error || !data?.user?.phone) redirect("/");

  const phoneNumber = "+" + data.user.phone;
  devLog("fetch-user-orders:start", { phoneSuffix: phoneNumber.slice(-4) });

  const { data: user, error: userError } = await supabase
    .from("users")
    .select(
      `
        user_id,
        phone_number,
        orders(
          *,
          order_items(*, products(*)),
          shipping_address:addresses!orders_shipping_address_id_fkey(*)
        )
      `
    )
    .eq("phone_number", phoneNumber)
    .single<userWithOrdersAndItemsAndProducts>();










  if (userError) {
    devLog("fetch-user-orders:failed", { error: userError.message });
    return (
      <div className="min-h-screen bg-theme-cream">
        <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h1 className="text-xl font-semibold text-gray-900 mb-2">
              Orders
            </h1>
            <p className="text-sm text-gray-600">
              Failed to load orders. Please try again.
            </p>
            <div className="mt-4">
              <Link
                href="/account"
                className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors inline-block"
              >
                Back to account
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const ordersAll = [...(user?.orders ?? [])].sort((a: orderWithItemsAndProducts, b: orderWithItemsAndProducts) => {
    const dateA = parseDbDateAsUtc(a.order_date)?.getTime() ?? 0;
    const dateB = parseDbDateAsUtc(b.order_date)?.getTime() ?? 0;
    return dateB - dateA;
  });
  devLog("fetch-user-orders:success", {
    userId: user?.user_id ?? null,
    totalOrders: ordersAll.length,
  });

  return (
    <div className="min-h-screen bg-theme-cream">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-3 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            All Orders
          </h1>
          <Link
            href="/account"
            className="px-4 py-2 text-sm font-semibold rounded-md border border-gray-200 text-gray-800 hover:bg-gray-50 transition-colors"
          >
            Back
          </Link>
        </div>

        {ordersAll.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <p className="text-gray-700 font-medium">No orders yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Your order history will appear here
            </p>
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2 bg-theme-sage hover:bg-theme-olive text-white font-medium rounded-lg transition-colors duration-200"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersAll.map((order: orderWithItemsAndProducts) => {
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
              const orderItems =
                order?.order_items && Array.isArray(order.order_items)
                  ? order.order_items
                  : order?.order_items
                  ? [order.order_items]
                  : [];

              return (
                <div
                  key={order?.order_id ?? `order-${Math.random()}`}
                  className="bg-white border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex flex-col gap-3 sm:gap-4">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <span className="text-xs sm:text-sm font-semibold text-gray-900">
                        Order #{orderNumberToDisplay}
                      </span>
                      <CopyOrderNumberButton valueToCopy={orderNumberToCopy} />
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
                        {order?.order_status?.toUpperCase() ?? "PENDING"}
                      </span>
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-violet-100 text-violet-700 w-fit">
                        {paymentLabel}
                      </span>
                    </div>

                    {/* Meta */}
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
                        <span className="font-semibold text-gray-900">
                          ₹
                          {order?.total_amount?.toFixed(2) ??
                            "0.00"}
                        </span>
                      </p>
                      {shippingAddress && (
                        <p className="flex items-start gap-2 mt-2">
                          <span className="text-xs">
                            {shippingAddress.street_address},{" "}
                            {shippingAddress.city}, {shippingAddress.state} -{" "}
                            {shippingAddress.postal_code}
                          </span>
                        </p>
                      )}
                    </div>

                    {/* Details (server-native toggle) */}
                    <details className="border-t border-gray-200 pt-3">
                      <summary className="cursor-pointer text-sm font-semibold text-gray-800">
                        View details
                      </summary>

                      <div className="mt-3">
                        {orderItems.length > 0 ? (
                          <div className="space-y-3">
                            {orderItems.map((item, index: number) => (
                              <div
                                key={item.order_item_id ?? index}
                                className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200"
                              >
                                {item?.products?.thumbnail_image && (
                                  <div className="shrink-0 w-16 h-16 relative rounded-md overflow-hidden">
                                    <OptimizedImage
                                      src={item.products.thumbnail_image}
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
                                <div className="flex-1 min-w-0 w-full">
                                  <p className="text-xs sm:text-sm font-semibold text-gray-900">
                                    {item?.products?.product_name ?? "N/A"}
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
                                </div>
                                <div className="shrink-0 w-full sm:w-auto text-left sm:text-right">
                                  <p className="text-sm sm:text-base font-bold text-gray-900">
                                    ₹
                                    {(item?.products?.final_price?.toFixed(2) ??
                                      0) * (item?.quantity ?? 0)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-600">
                            No items found for this order
                          </p>
                        )}
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

