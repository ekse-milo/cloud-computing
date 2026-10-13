/* ==========================================================================
   WORDS. — CART SERVICE
   ========================================================================== */

class CartService {
    constructor() {
        this.cart = this.loadCart();
    }

    // Load cart from LocalStorage
    loadCart() {
        const stored = localStorage.getItem("words_shop_cart");
        return stored ? JSON.parse(stored) : [];
    }

    // Persist cart to LocalStorage and notify subscribers
    saveCart() {
        localStorage.setItem("words_shop_cart", JSON.stringify(this.cart));
        // Dispatch custom event to notify UI components (e.g. navigation header) of state change
        window.dispatchEvent(new CustomEvent("cart-updated"));
    }

    // Retrieve active cart items
    getCart() {
        return this.cart;
    }

    // Add a single item to the cart
    addToCart(quoteId) {
        const existing = this.cart.find(item => item.quoteId === quoteId);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ quoteId, quantity: 1 });
        }
        this.saveCart();
    }

    // Remove an item entirely from the cart
    removeFromCart(quoteId) {
        this.cart = this.cart.filter(item => item.quoteId !== quoteId);
        this.saveCart();
    }

    // Increment/Decrement the quantity of a specific item
    updateQuantity(quoteId, delta) {
        const item = this.cart.find(item => item.quoteId === quoteId);
        if (item) {
            item.quantity += delta;
            if (item.quantity <= 0) {
                this.removeFromCart(quoteId);
            } else {
                this.saveCart();
            }
        }
    }

    // Clear the cart contents
    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    // Get the total quantity of items in the cart
    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    // Calculate the subtotal price based on the current quote database
    getCartTotal(quoteDatabase) {
        return this.cart.reduce((total, item) => {
            const quote = quoteDatabase.find(q => q.id === item.quoteId);
            return total + (quote ? quote.price * item.quantity : 0);
        }, 0);
    }
}

// Instantiated as a global service for application-wide access
const cartService = new CartService();
