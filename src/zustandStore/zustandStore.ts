import { create } from "zustand"
import type { AnyCart, CartProduct } from "@/types/CartTypes";

interface StoreState {
    MobnoInputState: boolean;
    setMobnoInputState: () => void;
    customerMobno: string;
    setCustomerMobno: (mobno: string) => void;
    OtpInputState: boolean;
    setOtpInputState: () => void;
    updateEmailState: boolean;
    setUpdateEmailState: () => void;
    AuthenticatedState: boolean;
    setAuthenticatedState: (auth: boolean) => void;
    cartItems: AnyCart;
    setCartItems: (items: AnyCart) => void;
    checkoutState: boolean;
    setCheckoutState: (state: boolean) => void;
    AuthUserId: string;
    setAuthUserId: (userId: string) => void;
    CartId: string;
    setCartId: (cartId: string) => void;
    productDetails: any;
    setProductDetails: (productDetails: any) => void;
    productImages: any;
    setProductImages: (productImages: any) => void;
    isCartOpen: boolean;
    setIsCartOpen: (isCartOpen: boolean) => void;
    categories: any;
    setCategories: (categories: any) => void;
    refresh: boolean;
    setRefresh: () => void;
    wishListItems: any;
    setWishListItems: (wishListItems: any) => void;
    initiatingCheckout: boolean;
    setInitiatingCheckout: (initiatingCheckout: boolean) => void;
    paymentConcluded: boolean;
    setPaymentConcluded: (paymentConcluded: boolean) => void;
    showPaymentConcluded: boolean;
    setShowPaymentConcluded: (showPaymentConcluded: boolean) => void;
    WishlistId: string;
    setWishlistId: (wishlistId: string) => void;
}

export const useStore = create<StoreState>((set) => ({
    MobnoInputState: false,
    setMobnoInputState: () => set((state) => ({ MobnoInputState: !state.MobnoInputState })),
    customerMobno: '',
    setCustomerMobno: (mobno: string) => set({ customerMobno: mobno }),
    OtpInputState: false,
    setOtpInputState: () => set((state) => ({ OtpInputState: !state.OtpInputState })),
    updateEmailState: false,
    setUpdateEmailState: () => set((state) => ({ updateEmailState: !state.updateEmailState })),
    AuthenticatedState: false,
    setAuthenticatedState: (auth: boolean) => set({ AuthenticatedState: auth }),
    cartItems: [],
    setCartItems: (items: AnyCart) => set({ cartItems: items }),
    checkoutState:false,
    setCheckoutState: (state: boolean) => set({ checkoutState: state }),
    AuthUserId:"",
    setAuthUserId: (userId: string) => set({ AuthUserId: userId }),
    CartId:"",
    setCartId: (cartId: string) => set({ CartId: cartId }),
    productDetails: null,
    setProductDetails: (productDetails: any) => set({ productDetails: productDetails }),
    productImages: null,
    setProductImages: (productImages: any) => set({ productImages: productImages }),
    isCartOpen:false,
    setIsCartOpen: (isCartOpen: boolean) => set({ isCartOpen: isCartOpen }),
    categories: [],
    setCategories: (categories: any) => set({ categories: categories }),
    refresh:false,
    setRefresh: () => set((state) => ({ refresh: !state.refresh })),
    WishlistId:"",
    setWishlistId: (wishlistId: string) => set({ WishlistId: wishlistId }),
    wishListItems: [],
    setWishListItems: (wishListItems: any) => set({ wishListItems: wishListItems }),
    initiatingCheckout:false,
    setInitiatingCheckout: (initiatingCheckout: boolean) => set({ initiatingCheckout: initiatingCheckout }),
    paymentConcluded:false,
    setPaymentConcluded: (paymentConcluded: boolean) => set({ paymentConcluded: paymentConcluded }),
    showPaymentConcluded:false,
    setShowPaymentConcluded: (showPaymentConcluded: boolean) => set({ showPaymentConcluded: showPaymentConcluded }),
}))

