import { create } from "zustand";
import { addProductToCart, getCartStatus, removeProductFromCart } from "../utils/api/cart";

const cartResetState = {
  isCartEmpty: false,
  cartItems: {},
  cartItemCount: 0,
  showGoToCart: false,
};

export const useCartStore = create((set, get) => ({
  ...cartResetState,
  isLoadingByVariant: {},

  initializeCartData: async () => {
    try {
      const data = await getCartStatus();
      set({
        isCartEmpty: Object.keys(data?.data || {}).length === 0,
        cartItems: data?.data || {},
        cartItemCount: data?.total_cart_items || 0,
      });
    } catch (err) {
      return "Something went wrong!";
    }
    return null;
  },

  addToCart: async (variantId, _blockInfo = {}, isLighteningItem = false) => {
    const payload = { id: variantId, quantity: 1, is_litem: isLighteningItem };
    const previousQty = get().cartItems?.[variantId]?.qty || 0;

    set((state) => ({
      isLoadingByVariant: { ...state.isLoadingByVariant, [variantId]: true },
      cartItems: {
        ...state.cartItems,
        [variantId]: {
          ...(state.cartItems?.[variantId] || {}),
          qty: previousQty + 1,
        },
      },
    }));

    try {
      const data = await addProductToCart(payload);
      const item = data?.data || {};
      set((state) => ({
        cartItems: {
          ...state.cartItems,
          [variantId]: {
            ...item,
            qty: item.total_quantity ?? previousQty + 1,
          },
        },
        cartItemCount: data?.total_cart_items ?? state.cartItemCount,
        showGoToCart: true,
        isCartEmpty: false,
      }));
    } catch (err) {
      set((state) => {
        const nextItems = { ...state.cartItems };
        if (previousQty <= 0) {
          delete nextItems[variantId];
        } else {
          nextItems[variantId] = {
            ...(nextItems[variantId] || {}),
            qty: previousQty,
          };
        }
        return { cartItems: nextItems };
      });
      return "Something went wrong!";
    } finally {
      set((state) => ({
        isLoadingByVariant: { ...state.isLoadingByVariant, [variantId]: false },
      }));
    }

    return null;
  },

  removeFromCart: async (variantId, _blockInfo = {}, isDeleted = false, isLighteningItem = false, quantity = 1) => {
    const existingQty = get().cartItems?.[variantId]?.qty || 0;
    if (!existingQty) return null;

    const payload = { id: variantId, quantity: isDeleted ? existingQty : quantity, is_litem: isLighteningItem };
    const optimisticQty = Math.max(existingQty - (isDeleted ? existingQty : quantity), 0);

    set((state) => {
      const nextItems = { ...state.cartItems };
      if (optimisticQty === 0) {
        delete nextItems[variantId];
      } else {
        nextItems[variantId] = {
          ...(nextItems[variantId] || {}),
          qty: optimisticQty,
        };
      }
      return {
        cartItems: nextItems,
        isLoadingByVariant: { ...state.isLoadingByVariant, [variantId]: true },
      };
    });

    try {
      const data = await removeProductFromCart(payload);
      const totalQty = data?.data?.total_quantity || 0;

      set((state) => {
        const nextItems = { ...state.cartItems };
        if (totalQty === 0) {
          delete nextItems[variantId];
        } else {
          nextItems[variantId] = {
            ...(nextItems[variantId] || {}),
            ...(data?.data || {}),
            qty: totalQty,
          };
        }
        return {
          cartItems: nextItems,
          cartItemCount: data?.total_cart_items ?? state.cartItemCount,
          showGoToCart: true,
          isCartEmpty: !data?.total_cart_items,
        };
      });
    } catch (err) {
      set((state) => ({
        cartItems: {
          ...state.cartItems,
          [variantId]: {
            ...(state.cartItems?.[variantId] || {}),
            qty: existingQty,
          },
        },
      }));
      return "Something went wrong!";
    } finally {
      set((state) => ({
        isLoadingByVariant: { ...state.isLoadingByVariant, [variantId]: false },
      }));
    }

    return null;
  },
}));
