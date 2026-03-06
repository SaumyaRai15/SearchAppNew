const BASE_URL = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/v2`
  : "https://ecomm.api.nathabit.in/v2";
const CART_COOKIE_NAME = "cust_cart";

const getCookie = (name) => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.split("; ").find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=")[1]) : null;
};

const setCookie = (name, value, days = 30) => {
  if (typeof document === "undefined" || !value) return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
};

const getCartToken = () => getCookie(CART_COOKIE_NAME) || "";

const getAuthToken = () => {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("auth_token") || "";
};

const noticeError = (error, payload) => {
  if (typeof window !== "undefined" && window.NREUM?.noticeError) {
    window.NREUM.noticeError(error, {
      cart_token: getCartToken(),
      ...payload,
    });
  }
};

const withCartTokenFromResponse = (data) => {
  if (data?.token) {
    setCookie(CART_COOKIE_NAME, data.token);
  }
  return data;
};

export const getCartStatus = async () => {
  const res = await fetch(`${BASE_URL}/api/v2/cart/item/stock-quantity/status`, {
    credentials: "include",
    headers: {
      cart: getCartToken(),
      Authorization: getAuthToken(),
    },
  });

  if (!res.ok) {
    const err = new Error("Failed to fetch cart status");
    noticeError(err, {});
    throw err;
  }

  const data = await res.json();
  return withCartTokenFromResponse(data);
};

export const addProductToCart = async (payload) => {
  if (!getCookie(CART_COOKIE_NAME)) {
    await getCartStatus();
  }

  const res = await fetch(`${BASE_URL}/api/v2/cart/add/cart/item`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      cart: getCartToken(),
      Authorization: getAuthToken(),
    },
  });

  if (!res.ok) {
    const err = new Error("Failed to add product");
    noticeError(err, payload);
    throw err;
  }

  const data = await res.json();
  if (data.message === "Cart updated") {
    return withCartTokenFromResponse(data);
  }

  const err = new Error("Failed to add product");
  noticeError(err, payload);
  throw err;
};

export const removeProductFromCart = async (payload) => {
  if (!getCookie(CART_COOKIE_NAME)) {
    await getCartStatus();
  }

  const res = await fetch(`${BASE_URL}/api/v2/cart/remove/cart/item`, {
    method: "POST",
    body: JSON.stringify(payload),
    headers: {
      "Content-type": "application/json; charset=UTF-8",
      cart: getCartToken(),
      Authorization: getAuthToken(),
    },
  });

  if (!res.ok) {
    const err = new Error("Failed to remove product");
    noticeError(err, payload);
    throw err;
  }

  const data = await res.json();
  if (data.message === "Cart updated") {
    return withCartTokenFromResponse(data);
  }

  const err = new Error("Failed to remove product");
  noticeError(err, payload);
  throw err;
};
