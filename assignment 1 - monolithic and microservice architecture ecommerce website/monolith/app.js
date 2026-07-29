/* ==========================================================================
   WORDS. — UNIFIED MONOLITHIC APPLICATION SCRIPT
   ==========================================================================
   Architecture: Monolithic Application
   Description: Consolidates database records, cart management, author search
                filtering, application routing, and single-page view rendering
                into a single, unified runtime module.
   ========================================================================== */

/* --------------------------------------------------------------------------
   1. DATA LAYER (CURATED QUOTE DATABASE)
   -------------------------------------------------------------------------- */
const QUOTE_DATABASE = [
    {
        id: "1",
        text: "The unexamined life is not worth living.",
        author: "Socrates",
        category: "Philosophy",
        price: 1.50,
        year: "399 BC",
        characterCount: 38,
        licenseType: "Personal Devotional License",
        context: "Spoken by Socrates at his trial for impiety and corrupting the youth, for which he was sentenced to death. It represents the core tenet of Western philosophical inquiry: that questioning our beliefs and actions is the fundamental duty of a conscious being."
    },
    {
        id: "2",
        text: "Science is a way of thinking much more than it is a body of knowledge.",
        author: "Carl Sagan",
        category: "Science",
        price: 2.99,
        year: "1986",
        characterCount: 70,
        licenseType: "Educational Distribution License",
        context: "From Sagan's writings on scientific literacy. Sagan argues that science is not merely a collection of facts to be memorized, but an active, critical process of questioning and testing hypotheses about the universe."
    },
    {
        id: "3",
        text: "Art is the elimination of the unnecessary.",
        author: "Pablo Picasso",
        category: "Art & Design",
        price: 4.50,
        year: "1954",
        characterCount: 41,
        licenseType: "Creative Display License",
        context: "Picasso's description of his reductionist process. It highlights the philosophy that true art emerges when you strip away extraneous elements, leaving only the essential essence of the subject."
    },
    {
        id: "4",
        text: "I would have written a shorter letter, but I did not have the time.",
        author: "Blaise Pascal",
        category: "Literature",
        price: 3.25,
        year: "1657",
        characterCount: 68,
        licenseType: "Editorial License",
        context: "Originally written in Pascal's 'Lettres Provinciales'. It reflects the paradox of writing: that editing, refining, and achieving brevity require significantly more cognitive effort and time than writing in an unconstrained manner."
    },
    {
        id: "5",
        text: "Simplicity is the ultimate sophistication.",
        author: "Leonardo da Vinci",
        category: "Art & Design",
        price: 5.00,
        year: "1500",
        characterCount: 41,
        licenseType: "Commercial Right",
        context: "Attributed to the Renaissance polymath. This maxim has guided centuries of designers and artists, suggesting that creating something simple, yet profoundly functional and beautiful, is the highest level of mastery."
    },
    {
        id: "6",
        text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.",
        author: "Aristotle",
        category: "Philosophy",
        price: 1.99,
        year: "330 BC",
        characterCount: 77,
        licenseType: "Personal Devotional License",
        context: "Summarized from Aristotle's Nicomachean Ethics. Aristotle asserts that moral virtue and operational excellence are built through the deliberate, repeated practice of right actions rather than singular bursts of inspiration."
    },
    {
        id: "7",
        text: "That which does not kill us makes us stronger.",
        author: "Friedrich Nietzsche",
        category: "Philosophy",
        price: 2.50,
        year: "1888",
        characterCount: 46,
        licenseType: "Personal Devotional License",
        context: "Appearing in Nietzsche's 'Twilight of the Idols'. This aphorism forms the foundation of his concept of the Overman, arguing that psychological and spiritual growth is forged through overcoming severe adversity and suffering."
    },
    {
        id: "8",
        text: "The only true wisdom is in knowing you know nothing.",
        author: "Socrates",
        category: "Philosophy",
        price: 1.75,
        year: "399 BC",
        characterCount: 52,
        licenseType: "Personal Devotional License",
        context: "Known as the Socratic Paradox. Reported by Plato, this concept details Socrates' realization that his wisdom lay in his awareness of his own ignorance, establishing intellectual humility as the starting point of truth."
    },
    {
        id: "9",
        text: "Design is not just what it looks like and feels like. Design is how it works.",
        author: "Steve Jobs",
        category: "Art & Design",
        price: 3.99,
        year: "2003",
        characterCount: 76,
        licenseType: "Commercial Right",
        context: "Published in a New York Times interview regarding the creation of Apple's consumer electronics. It defined the transition from ornamental design to functional design, highlighting that aesthetics must be intrinsically linked to usability."
    },
    {
        id: "10",
        text: "Time you enjoy wasting is not wasted time.",
        author: "Marthe Troly-Curtin",
        category: "Literature",
        price: 2.00,
        year: "1911",
        characterCount: 42,
        licenseType: "Editorial License",
        context: "From her novel 'Phrynette Married'. This lighthearted yet profound quote challenges the industrial obsession with constant productivity, suggesting that joy and rest have their own intrinsic value."
    }
];

/* --------------------------------------------------------------------------
   2. MONOLITHIC CART ENGINE (INTEGRATED CART LOGIC)
   -------------------------------------------------------------------------- */
class MonolithCartModule {
    constructor() {
        this.cart = this.loadCart();
    }

    loadCart() {
        const stored = localStorage.getItem("words_shop_cart");
        return stored ? JSON.parse(stored) : [];
    }

    saveCart() {
        localStorage.setItem("words_shop_cart", JSON.stringify(this.cart));
        window.dispatchEvent(new CustomEvent("cart-updated"));
    }

    getCart() {
        return this.cart;
    }

    addToCart(quoteId) {
        const existing = this.cart.find(item => item.quoteId === quoteId);
        if (existing) {
            existing.quantity += 1;
        } else {
            this.cart.push({ quoteId, quantity: 1 });
        }
        this.saveCart();
    }

    removeFromCart(quoteId) {
        this.cart = this.cart.filter(item => item.quoteId !== quoteId);
        this.saveCart();
    }

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

    clearCart() {
        this.cart = [];
        this.saveCart();
    }

    getCartCount() {
        return this.cart.reduce((total, item) => total + item.quantity, 0);
    }

    getCartTotal(quoteDatabase) {
        return this.cart.reduce((total, item) => {
            const quote = quoteDatabase.find(q => q.id === item.quoteId);
            return total + (quote ? quote.price * item.quantity : 0);
        }, 0);
    }
}

/* --------------------------------------------------------------------------
   3. MONOLITHIC SEARCH ENGINE (INTEGRATED SEARCH & FILTERING LOGIC)
   -------------------------------------------------------------------------- */
class MonolithSearchModule {
    searchByAuthor(quotes, authorQuery) {
        if (!authorQuery || authorQuery.trim() === "") {
            return quotes;
        }
        const query = authorQuery.trim().toLowerCase();
        return quotes.filter(quote => quote.author.toLowerCase().includes(query));
    }

    getUniqueAuthors(quotes) {
        return [...new Set(quotes.map(q => q.author))].sort();
    }
}

// Instantiate internal monolith engine components
const cartModule = new MonolithCartModule();
const searchModule = new MonolithSearchModule();

/* --------------------------------------------------------------------------
   4. CENTRALIZED MONOLITHIC STATE MANAGEMENT
   -------------------------------------------------------------------------- */
const appState = {
    activeCategory: "ALL",
    activeSort: "FEATURED",
    authorQuery: "",
    lastOrder: null
};

// UI Helper: Update navigation cart badge
function updateCartUI() {
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        cartCountEl.textContent = `(${cartModule.getCartCount()})`;
    }
}

// Global Custom Event listener for cart synchronization
window.addEventListener("cart-updated", updateCartUI);

// UI Helper: Currency Formatter
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

/* --------------------------------------------------------------------------
   5. APPLICATION ROUTER
   -------------------------------------------------------------------------- */
function router() {
    const appContainer = document.getElementById("app");
    const hash = window.location.hash || "#/";
    
    // Update active nav links
    const navCatalog = document.getElementById("nav-catalog");
    const navCart = document.getElementById("nav-cart");
    
    if (navCatalog && navCart) {
        navCatalog.classList.remove("active");
        navCart.classList.remove("active");
        
        if (hash === "#/") {
            navCatalog.classList.add("active");
        } else if (hash === "#/checkout") {
            navCart.classList.add("active");
        }
    }

    // Scroll to top on page navigation
    window.scrollTo(0, 0);

    // Dynamic View Dispatching
    if (hash === "#/" || hash === "") {
        renderCatalog(appContainer);
    } else if (hash.startsWith("#/quote/")) {
        const id = hash.replace("#/quote/", "");
        renderDetail(appContainer, id);
    } else if (hash === "#/checkout") {
        renderCheckout(appContainer);
    } else if (hash === "#/receipt") {
        renderReceipt(appContainer);
    } else {
        appContainer.innerHTML = `
            <div class="empty-cart-message">
                <h3>Page Not Found</h3>
                <a href="#/" class="btn">Return to Catalog</a>
            </div>
        `;
    }
}

// Router Event Binding
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
    updateCartUI();
    router();
});

/* --------------------------------------------------------------------------
   6. VIEW RENDERERS (MONOLITHIC COMPONENTS)
   -------------------------------------------------------------------------- */

// View 1: Catalog Renderer
function renderCatalog(container) {
    const categories = ["ALL", ...new Set(QUOTE_DATABASE.map(q => q.category))];

    const filterButtonsHTML = categories.map(cat => `
        <button class="filter-btn ${appState.activeCategory === cat ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </button>
    `).join("");

    const sortOptions = [
        { value: "FEATURED", label: "Featured" },
        { value: "PRICE_LOW", label: "Price: Low to High" },
        { value: "PRICE_HIGH", label: "Price: High to Low" },
        { value: "ALPHABETICAL", label: "Alphabetical" }
    ];

    const sortSelectHTML = `
        <div class="sorting">
            <select id="sort-select">
                ${sortOptions.map(opt => `
                    <option value="${opt.value}" ${appState.activeSort === opt.value ? 'selected' : ''}>
                        ${opt.label}
                    </option>
                `).join("")}
            </select>
        </div>
    `;

    container.innerHTML = `
        <div class="control-bar">
            <div class="filters">
                ${filterButtonsHTML}
            </div>
            <div class="search-box">
                <input type="text" id="author-search" placeholder="SEARCH BY AUTHOR..." value="${appState.authorQuery}">
            </div>
            ${sortSelectHTML}
        </div>
        <div class="quote-grid" id="catalog-grid"></div>
    `;

    const gridContainer = container.querySelector("#catalog-grid");
    renderCatalogGrid(gridContainer);

    // Event Handlers for Filters
    const filterButtons = container.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            appState.activeCategory = btn.getAttribute("data-category");
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            renderCatalogGrid(gridContainer);
        });
    });

    // Event Handler for Search Input (integrated Search Engine call)
    const searchInput = container.querySelector("#author-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            appState.authorQuery = e.target.value;
            renderCatalogGrid(gridContainer);
        });
    }

    // Event Handler for Sorting
    const sortSelect = container.querySelector("#sort-select");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            appState.activeSort = e.target.value;
            renderCatalogGrid(gridContainer);
        });
    }
}

// Sub-renderer: Catalog Cards Grid
function renderCatalogGrid(gridContainer) {
    if (!gridContainer) return;

    let quotes = [...QUOTE_DATABASE];
    
    // Category Filter
    if (appState.activeCategory !== "ALL") {
        quotes = quotes.filter(q => q.category === appState.activeCategory);
    }

    // Author Search Filter via Monolithic Search Engine
    quotes = searchModule.searchByAuthor(quotes, appState.authorQuery);

    // Sort Logic
    if (appState.activeSort === "PRICE_LOW") {
        quotes.sort((a, b) => a.price - b.price);
    } else if (appState.activeSort === "PRICE_HIGH") {
        quotes.sort((a, b) => b.price - a.price);
    } else if (appState.activeSort === "ALPHABETICAL") {
        quotes.sort((a, b) => a.text.localeCompare(b.text));
    }

    const cardsHTML = quotes.map(quote => `
        <a href="#/quote/${quote.id}" class="quote-card">
            <div class="quote-card-header">
                <span class="quote-category">${quote.category}</span>
                <span class="quote-price">${formatCurrency(quote.price)}</span>
            </div>
            <div class="quote-text-container">
                <blockquote class="quote-text">${quote.text}</blockquote>
            </div>
            <div class="quote-card-footer">
                <span class="quote-author">${quote.author}</span>
                <span class="quote-card-action">View Details</span>
            </div>
        </a>
    `).join("");

    gridContainer.innerHTML = quotes.length > 0 
        ? cardsHTML 
        : '<div class="empty-cart-message" style="grid-column: 1 / -1; min-height: 200px; border-right: var(--border-width) solid var(--color-text);"><h3>No quotes match your search.</h3></div>';
}

// View 2: Quote Detail Renderer
function renderDetail(container, id) {
    const quote = QUOTE_DATABASE.find(q => q.id === id);
    if (!quote) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <h3>Quote not found in the archive.</h3>
                <a href="#/" class="btn" style="margin-top: 1rem;">Back to Catalog</a>
            </div>
        `;
        return;
    }

    container.innerHTML = `
        <div class="back-link-wrapper">
            <a href="#/" class="back-link">&larr; Back to Catalog</a>
        </div>
        <div class="detail-view">
            <div class="detail-quote-panel">
                <blockquote class="detail-quote-text">“${quote.text}”</blockquote>
                <cite class="detail-quote-author">— ${quote.author}</cite>
            </div>
            <div class="detail-info-panel">
                <div class="detail-meta-header">
                    <span class="category">${quote.category}</span>
                    <h1>Digital Typography Print</h1>
                    <div class="detail-price">${formatCurrency(quote.price)}</div>
                </div>
                <p class="detail-description">${quote.context}</p>
                <table class="specs-table">
                    <tbody>
                        <tr class="spec-row">
                            <td class="spec-label">Era / Year</td>
                            <td class="spec-value">${quote.year}</td>
                        </tr>
                        <tr class="spec-row">
                            <td class="spec-label">Character Length</td>
                            <td class="spec-value">${quote.characterCount} glyphs</td>
                        </tr>
                        <tr class="spec-row">
                            <td class="spec-label">Format</td>
                            <td class="spec-value">Raw Text String & SVG Vector File</td>
                        </tr>
                        <tr class="spec-row">
                            <td class="spec-label">Licensing</td>
                            <td class="spec-value">${quote.licenseType}</td>
                        </tr>
                    </tbody>
                </table>
                <div class="detail-actions">
                    <button class="btn" id="add-to-cart-btn" style="width: 100%;">Add to Cart</button>
                </div>
            </div>
        </div>
    `;

    const btn = container.querySelector("#add-to-cart-btn");
    if (btn) {
        btn.addEventListener("click", () => {
            cartModule.addToCart(quote.id);
            btn.textContent = "Added to Cart!";
            btn.style.backgroundColor = "#000000";
            btn.style.color = "#ffffff";
            
            setTimeout(() => {
                btn.textContent = "Add to Cart";
                btn.style.backgroundColor = "transparent";
                btn.style.color = "#000000";
            }, 1500);
        });
    }
}

// View 3: Checkout and Cart Renderer
function renderCheckout(container) {
    if (cartModule.getCart().length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <h3>Your shopping cart is currently empty.</h3>
                <p style="margin-bottom: 2rem;">Acquire some thoughts before checking out.</p>
                <a href="#/" class="btn">Browse Archive</a>
            </div>
        `;
        return;
    }

    const cartItemsHTML = cartModule.getCart().map(item => {
        const quote = QUOTE_DATABASE.find(q => q.id === item.quoteId);
        if (!quote) return "";
        return `
            <tr>
                <td>
                    <div class="cart-item-title">“${quote.text}”</div>
                    <div class="cart-item-author">${quote.author}</div>
                </td>
                <td style="text-align: right;">${formatCurrency(quote.price)}</td>
                <td>
                    <div class="quantity-control" style="margin: 0 auto;">
                        <button class="qty-btn" data-id="${quote.id}" data-action="minus">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" data-id="${quote.id}" data-action="plus">+</button>
                    </div>
                </td>
                <td style="text-align: right; font-weight: 600;">${formatCurrency(quote.price * item.quantity)}</td>
                <td style="text-align: center;">
                    <button class="remove-item-btn" data-id="${quote.id}">Delete</button>
                </td>
            </tr>
        `;
    }).join("");

    container.innerHTML = `
        <div class="checkout-view">
            <div class="cart-items-container">
                <h2 class="checkout-section-title">Your Cart</h2>
                <table class="cart-table">
                    <thead>
                        <tr>
                            <th style="width: 50%;">Item</th>
                            <th style="width: 15%; text-align: right;">Price</th>
                            <th style="width: 15%; text-align: center;">Quantity</th>
                            <th style="width: 15%; text-align: right;">Total</th>
                            <th style="width: 5%; text-align: center;"></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${cartItemsHTML}
                    </tbody>
                </table>
                
                <div class="cart-summary-totals">
                    <div class="summary-row">
                        <span>Items Subtotal</span>
                        <span>${formatCurrency(cartModule.getCartTotal(QUOTE_DATABASE))}</span>
                    </div>
                    <div class="summary-row">
                        <span>Digital Delivery Fee</span>
                        <span>$0.00</span>
                    </div>
                    <div class="summary-row total-row">
                        <span>Total</span>
                        <span>${formatCurrency(cartModule.getCartTotal(QUOTE_DATABASE))}</span>
                    </div>
                </div>
            </div>
            
            <div class="billing-container">
                <h2 class="checkout-section-title">Checkout & Order Placement</h2>
                <form class="checkout-form" id="payment-form">
                    <div class="form-group">
                        <label for="checkout-email">Email Address (For File Delivery)</label>
                        <input type="email" id="checkout-email" required placeholder="name@domain.com">
                    </div>
                    <div class="form-group">
                        <label for="checkout-name">Cardholder Name</label>
                        <input type="text" id="checkout-name" required placeholder="JOHN DOE">
                    </div>
                    <div class="form-group">
                        <label for="checkout-card">Card Number</label>
                        <input type="text" id="checkout-card" required maxlength="19" placeholder="0000 0000 0000 0000">
                    </div>
                    <div class="form-row-2">
                        <div class="form-group">
                            <label for="checkout-exp">Expiration Date</label>
                            <input type="text" id="checkout-exp" required maxlength="5" placeholder="MM/YY">
                        </div>
                        <div class="form-group">
                            <label for="checkout-cvv">CVV</label>
                            <input type="password" id="checkout-cvv" required maxlength="3" placeholder="000">
                        </div>
                    </div>
                    <button type="submit" class="btn place-order-btn">Place Order — ${formatCurrency(cartModule.getCartTotal(QUOTE_DATABASE))}</button>
                </form>
            </div>
        </div>
    `;

    // Quantity Handlers
    container.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const action = btn.getAttribute("data-action");
            cartModule.updateQuantity(id, action === "plus" ? 1 : -1);
            renderCheckout(container);
        });
    });

    // Remove Item Handler
    container.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            cartModule.removeFromCart(id);
            renderCheckout(container);
        });
    });

    // Formatting for Card & Expiration
    const cardInput = container.querySelector("#checkout-card");
    if (cardInput) {
        cardInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];
            for (let i=0, len=match.length; i<len; i+=4) {
                parts.push(match.substring(i, i+4));
            }
            e.target.value = parts.length > 0 ? parts.join(' ') : v;
        });
    }

    const expInput = container.querySelector("#checkout-exp");
    if (expInput) {
        expInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0,2) + '/' + v.substring(2,4);
            } else {
                e.target.value = v;
            }
        });
    }

    // Payment Form Handler
    const form = container.querySelector("#payment-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);
            const items = cartModule.getCart().map(item => {
                const quote = QUOTE_DATABASE.find(q => q.id === item.quoteId);
                return {
                    text: quote.text,
                    author: quote.author,
                    price: quote.price,
                    quantity: item.quantity,
                    total: quote.price * item.quantity
                };
            });

            appState.lastOrder = {
                orderNumber: orderNumber,
                email: container.querySelector("#checkout-email").value,
                date: new Date().toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' }),
                items: items,
                total: cartModule.getCartTotal(QUOTE_DATABASE)
            };

            cartModule.clearCart();
            window.location.hash = "#/receipt";
        });
    }
}

// View 4: Receipt Renderer
function renderReceipt(container) {
    if (!appState.lastOrder) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <h3>No Recent Transactions</h3>
                <p style="margin-bottom: 2rem;">It seems you haven't placed an order recently.</p>
                <a href="#/" class="btn">Go to Catalog</a>
            </div>
        `;
        return;
    }

    const order = appState.lastOrder;

    const receiptItemsHTML = order.items.map(item => `
        <div class="receipt-item">
            <div class="receipt-item-text">“${item.text}”</div>
            <div class="receipt-item-meta">
                <span>By ${item.author} (x${item.quantity})</span>
                <span>${formatCurrency(item.total)}</span>
            </div>
        </div>
    `).join("");

    container.innerHTML = `
        <div class="receipt-container">
            <div class="receipt-header">
                <div class="receipt-title">WORDS. Archive</div>
                <p>Transaction Invoice & Delivery Receipt</p>
            </div>
            
            <div class="receipt-section">
                <div class="receipt-summary-row">
                    <span style="font-weight: 500;">Invoice Number:</span>
                    <span>${order.orderNumber}</span>
                </div>
                <div class="receipt-summary-row">
                    <span style="font-weight: 500;">Date:</span>
                    <span>${order.date}</span>
                </div>
                <div class="receipt-summary-row">
                    <span style="font-weight: 500;">Deliver To:</span>
                    <span>${order.email}</span>
                </div>
                <div class="receipt-summary-row">
                    <span style="font-weight: 500;">Delivery Status:</span>
                    <span style="font-weight: 600; text-transform: uppercase;">Sent to Email</span>
                </div>
            </div>
            
            <div class="receipt-section">
                <div class="receipt-section-title">Purchased Items</div>
                ${receiptItemsHTML}
            </div>
            
            <div class="receipt-section" style="border-bottom: none; margin-bottom: 0; padding-bottom: 0;">
                <div class="receipt-summary-row">
                    <span>Subtotal</span>
                    <span>${formatCurrency(order.total)}</span>
                </div>
                <div class="receipt-summary-row">
                    <span>Tax</span>
                    <span>$0.00</span>
                </div>
                <div class="receipt-summary-row grand-total">
                    <span>Total Paid</span>
                    <span>${formatCurrency(order.total)}</span>
                </div>
            </div>
            
            <div class="receipt-actions">
                <button class="btn" id="print-invoice-btn">Print Invoice / Save as PDF</button>
                <a href="#/" class="btn" style="display: flex; align-items: center; justify-content: center;">Return to Catalog</a>
            </div>
        </div>
    `;

    const printBtn = container.querySelector("#print-invoice-btn");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }
}
