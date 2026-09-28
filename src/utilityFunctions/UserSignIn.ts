// import axios from 'axios';


// export const userSignIn = async (completeOtp: string, customerMobno: string, supabase: any) => {
//   const {
//     data: { session },
//     error,
//   } = await supabase.auth.verifyOtp({
//     phone: customerMobno,
//     token: completeOtp,
//     type: 'sms',
//   });

//   console.log('session', session);
//   console.log('error', error);

//   if (session && !error) {
//     try {
//       const response = await axios.post('/api/userRoutes', {
//         phone: customerMobno,
//       });
//       console.log('response from /api/userRoutes', response);
//       return { success: true, error: null, session: session, message: "User signed in successfully", completeResponse: response.data };
//     } catch (apiError) {
//       console.error('create user api error', apiError);
//     }

//     return { success: true, error: null, session: session, message: "User signed in successfully" };
//   } else {
//     return { success: false, error: error, session: null, message: "User not signed in" };
//   }
// }







import axios from "axios";
import { useStore } from "@/zustandStore/zustandStore";
import { hydrateCartAfterLogin } from "@/utilityFunctions/CartFunctions";

export const userSignIn = async (
  completeOtp: string,
  customerMobno: string,
  supabase: any
) => {
  // 2️⃣ Verify OTP with Supabase
  const {
    data: { session },
    error,
  } = await supabase.auth.verifyOtp({
    phone: customerMobno,
    token: completeOtp,
    type: "sms",
  });

  if (error || !session) {
    return {
      success: false,
      error,
      session: null,
      message: "OTP verification failed",
    };
  }

  try {
    // 3️⃣ Call backend to get/create user + cart + wishlist
    const { data } = await axios.post("/api/userRoutes", {
      phone: customerMobno,
    });

    const { user, cart, wishlist } = data;
    const cartId =
      typeof cart === "string" ? cart : cart?.cart_id ?? null;
    const wishlistId = typeof wishlist === "string" ? wishlist : wishlist ?? null;

    // 4️⃣ Hydrate Zustand (CLIENT SIDE)
    const store = useStore.getState();
    store.setAuthenticatedState(true);
    store.setAuthUserId(user.user_id);
    store.setCartId(cartId);
    store.setWishlistId(wishlistId ?? null);

    // 5️⃣ Hydrate cart instantly (merge local + fetch DB cart, update count)
    if (cartId) {
      await hydrateCartAfterLogin(cartId, supabase, store.setCartItems);
    } else {
      store.setCartItems([]);
    }

    // 6️⃣ Return clean result
    return {
      success: true,
      error: null,
      session,
      user,
      cart_id: cartId,
      wishlist_id: wishlistId,
      message: "User signed in successfully",
    };
  } catch (apiError: any) {
    console.error("User setup API error:", apiError);

    return {
      success: false,
      error: apiError,
      session,
      message: "User signed in, but setup failed",
    };
  }
};
