"use client";
import { useEffect, useMemo } from "react";
import { usePathname } from "next/navigation";
import { useStore } from "@/zustandStore/zustandStore";
import { calculateCartCount } from "@/utilityFunctions/CartFunctions";
import Navbar from "./Navbar";
import OtpInput from "../AuthUI/OtpInput";
import PhoneNumberInput from "../AuthUI/PhoneNumberInput";
import Cart from "../CartUI/Cart";

export default function ParentNavbar() {
    const pathname = usePathname();
    const { setIsCartOpen, MobnoInputState, OtpInputState, isCartOpen, cartItems } = useStore();
    const cartCount = useMemo(() => calculateCartCount(cartItems), [cartItems]);

    useEffect(() => {
        setIsCartOpen(false);
    }, [pathname, setIsCartOpen]);
    const handleOpenCart = () => {
        setIsCartOpen(true);
    };
    const handleCloseCart = () => {
        setIsCartOpen(false);
    };
    return (
        <div>
            <Navbar cartCount={cartCount} onCartClick={handleOpenCart} />
            {MobnoInputState && !OtpInputState && <PhoneNumberInput />}
            {OtpInputState && !MobnoInputState && <OtpInput />}
            <Cart isOpen={isCartOpen} onClose={handleCloseCart} />
        </div>
    )
}