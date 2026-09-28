"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase-Utils/client";
import { useStore } from "@/zustandStore/zustandStore";
import {
  createCart,
  getLocalCartItems,
  hydrateCartAfterLogin,
} from "@/utilityFunctions/CartFunctions";

export default function CartBootstrapper() {
  const {
    setAuthenticatedState,
    setAuthUserId,
    setCartId,
    setCartItems,
  } = useStore();

  useEffect(() => {
    const supabase = createClient();

    // Hydrate cart from localStorage immediately (for unauthenticated users with local cart)
    // This shows the correct count on first paint; auth check will overwrite with DB cart if logged in
    setCartItems(getLocalCartItems());

    const checkAuthentication = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data?.user) {
        setAuthenticatedState(false);
        setCartItems(getLocalCartItems());
        return;
      }
      setAuthenticatedState(true);
      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("*")
        .eq("phone_number", "+" + data?.user?.phone)
        .single();
      if (userError || !userData?.user_id) {
        setAuthenticatedState(false);
        return;
      }
      setAuthUserId(userData?.user_id);
      const { data: cartData, error: cartError } = await supabase
        .from("cart")
        .select("cart_id")
        .eq("user_id", userData?.user_id)
        .maybeSingle();
      if (cartError || !cartData?.cart_id) {
        const {
          success,
          data: newCart,
          error: createError,
        } = await createCart(userData.user_id, supabase);

        if (success && newCart?.cart_id) {
          setCartId(newCart.cart_id);
          await hydrateCartAfterLogin(newCart.cart_id, supabase, setCartItems);
        } else {
          console.error("Failed to create recovery cart:", createError);
          setCartId("");
        }
        return;
      }
      setCartId(cartData.cart_id);
      await hydrateCartAfterLogin(cartData.cart_id, supabase, setCartItems);
    };

    checkAuthentication();
  }, [setAuthenticatedState, setAuthUserId, setCartId, setCartItems]);

  return null;
}
