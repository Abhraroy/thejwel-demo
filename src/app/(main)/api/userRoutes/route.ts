import { NextRequest,NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-Utils/server";
import { createCart } from "@/utilityFunctions/CartFunctions";
import { getOrCreateWishlist } from "@/utilityFunctions/WishListFunctions";


export async function POST(request: NextRequest) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const body = await request.json();
    console.log('body', body)

    // Normalize phone to avoid "++" when caller includes "+"
    const normalizedPhone =
      typeof body.phone === "string"
        ? body.phone.startsWith("+")
          ? body.phone
          : `+${body.phone}`
        : body.phone;

    const userExists = await supabase
      .from("users")
      .select("*")
      .eq("phone_number", normalizedPhone)
      .maybeSingle();
    console.log('userExists', userExists)
    if (userExists.data) {
        const [cartRes, wishlistRes] = await Promise.allSettled([
            supabase.from("cart").select("cart_id").eq("user_id", userExists.data.user_id).single(),
            supabase.from("wishlist").select("wishlist_id").eq("user_id", userExists.data.user_id).single()
          ]);
          console.log('cartRes', cartRes)
          console.log('wishlistRes', wishlistRes)
          const cartId =
            cartRes.status === "fulfilled" ? cartRes.value.data?.cart_id : null;
          
          const wishlistId =
            wishlistRes.status === "fulfilled" ? wishlistRes.value.data?.wishlist_id : null;
          

        return NextResponse.json({ message:"Successfully Sign in",user:userExists.data,cart:cartId,wishlist:wishlistId }, { status: 200 });
    }
    const { data: insertedUser, error: insertError } = await supabase
      .from("users")
      .insert({
        user_id: data.user?.id || null,
        email: body.email || null,
        first_name: body.first_name || null,
        last_name: body.last_name || null,
        phone_number: normalizedPhone || null,
        password_hash: body.password_hash || null,
        is_active: true,
      })
      .select("user_id")
      .single();

    if (insertError || !insertedUser) {
      return NextResponse.json({ error: insertError?.message || "User insert failed" }, { status: 500 });
    }

    // Create cart and wishlist immediately for the new user (best-effort)
    const cartResult = await createCart(insertedUser.user_id, supabase);
    const wishlistResult = await getOrCreateWishlist(insertedUser.user_id, supabase);
    console.log('cartResult', cartResult)
    console.log('wishlistResult', wishlistResult)

    return NextResponse.json({
      user: insertedUser,
      cart: cartResult?.data ?? null,
      wishlist: wishlistResult?.wishlist_id ?? null,
      warnings: [
        cartResult?.success === false ? cartResult.message : null,
        wishlistResult?.success === false
          ? ((wishlistResult as any)?.error?.message ?? "Failed to create wishlist")
          : null,
      ].filter(Boolean),
    });
}
