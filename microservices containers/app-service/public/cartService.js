/* ==========================================================================
   WORDS. — CART SERVICE (Client-side LocalStorage Persistence)
   ========================================================================== */

class CartService {
    constructor() {
        this.cart = this.loadCart();
    }

    loadCart() {
        try {
            const stored = localStorage.getItem("words_shop_cart");
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error("LocalStorage access error:", e);
            return [];
        }
    }

    saveCart() {
        try {
            localStorage.setItem("words_shop_cart", JSON.stringify(this.cart));
            window.dispatchEvent(new CustomEvent("cart-updated"));
        } catch (e) {
            console.error("LocalStorage save error:", e);
        }
    }

    getCart() {
        return this.cart;
    }

    addToCart(quoteId) {
        const existing = this.cart.find(item => item.quoteId === String(quoteId));
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ quoteId: String(quoteId), quantity: 1 });
        }
        this.saveCart();
    }

    removeFromCart(quoteId) {
        this.cart = this.cart.filter(item => item.quoteId !== String(quoteId));
        this.saveCart();
    }

    updateQuantity(quoteId, delta) {
        const item = this.cart.find(item => item.quoteId === String(quoteId));
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeFromCart(quoteId);
            } else {
                this.saveCart();
            }
        }
    }

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getCartTotal(quoteDatabase) {
        return this.cart.reduce((total, item) => {
            const quote = quoteDatabase.find(q => String(q.id) === String(item.quoteId));
            return total + (quote ? quote.price * item.quantity : 0);
        }, 0);
    }
}

const cartService = new CartService();
