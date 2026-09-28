import { NextRequest, NextResponse } from "next/server";
import adminsupabase from "@/lib/supabase-Utils/admin";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  console.log("Webhook hit successfully");
  console.log("Headers:", request.headers);
  const authHeader = request.headers.get("Authorization");
  const hash = crypto
    .createHash("sha256")
    .update(`${process.env.WEBHOOK_USERNAME}:${process.env.WEBHOOK_PASSWORD}`)
    .digest("hex");
  if (authHeader !== hash) {
    console.log("Invalid authorization header");
    return NextResponse.json(
      { message: "Invalid authorization header" },
      { status: 401 }
    );
  } else {
    console.log("Valid authorization header");
    console.log("authHeader", authHeader);
    console.log("hash", hash);

    let body;
    try {
      const text = await request.text();
      console.log("Raw body text:", text);
      console.log("Body length:", text.length);
      
      if (!text || text.length === 0) {
        console.error("Empty request body");
        return NextResponse.json(
          { message: "Empty request body" },
          { status: 400 }
        );
      }
      
      body = JSON.parse(text);
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json(
        { message: "Invalid JSON body" },
        { status: 400 }
      );
    }
    console.log("body", body);
    const orderData = {
        user_id:body.payload.metaInfo.udf1,
        order_number:body.payload.orderId,
        order_status:body.payload.state,
        payment_status:body.payload.state,
        subtotal:body.payload.amount/100,
        total_amount:body.payload.amount/100,
    }
    const { data, error } = await adminsupabase.from("orders")
    .insert(orderData)
    .select("*")
    .single();
    if(error){
        console.log("error",error);
        return NextResponse.json({ message: "Error creating order" }, { status: 500 });
    }
    const orderId = data.order_id;
    const cartId = body.payload.metaInfo.udf5;
    const lastAddedProductTime = body.payload.metaInfo.udf4;
    const cartData = await adminsupabase.from("cart_items")
    .select("*,products(*)")
    .eq("cart_id",cartId)
    .order("added_at", { ascending: false });
    if(cartData.error){
      console.log("error in the cart, no order items to be created")
    }else{
      if(cartData.data[0].added_at === lastAddedProductTime){
        cartData.data.forEach(async (item: any) => {
          const orderItemsPayload = {
            order_id:orderId,
            product_id:item.product_id,
            quantity:item.quantity,
            unit_price:item.products.final_price,
            total_price:item.products.final_price * item.quantity,
          }
          const { data, error } = await adminsupabase.from("order_items")
          .insert(orderItemsPayload)
          .select("*")
          .single();
          if(error){
            console.log("error",error);
            return NextResponse.json({ message: "Error creating order items" }, { status: 500 });
          }
          console.log("order items created",data);
        });
      }else{
        console.log("cart data is different, no order items to be created somebody messed with the cart")
      }
    }

    return NextResponse.json({ message: "Webhook received" }, { status: 200 });
  }
}
