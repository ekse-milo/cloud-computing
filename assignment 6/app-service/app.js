/* ==========================================================================
   WORDS. — APPLICATION SCRIPT
   ========================================================================== */

// Dataset loaded dynamically from external quotes.csv file
let QUOTE_DATABASE = [];

// Embedded CSV Fallback Dataset (Used if browser blocks file:// fetch requests)
const RAW_CSV_FALLBACK = `id,text,author,category,price,year,characterCount,licenseType,context
1,"The unexamined life is not worth living.","Socrates","Philosophy",1.50,"399 BC",38,"Personal Devotional License","Spoken by Socrates at his trial for impiety and corrupting the youth, for which he was sentenced to death. It represents the core tenet of Western philosophical inquiry: that questioning our beliefs and actions is the fundamental duty of a conscious being."
2,"Science is a way of thinking much more than it is a body of knowledge.","Carl Sagan","Science",2.99,"1986",70,"Educational Distribution License","From Sagan's writings on scientific literacy. Sagan argues that science is not merely a collection of facts to be memorized, but an active, critical process of questioning and testing hypotheses about the universe."
3,"Art is the elimination of the unnecessary.","Pablo Picasso","Art & Design",4.50,"1954",41,"Creative Display License","Picasso's description of his reductionist process. It highlights the philosophy that true art emerges when you strip away extraneous elements, leaving only the essential essence of the subject."
4,"I would have written a shorter letter, but I did not have the time.","Blaise Pascal","Literature",3.25,"1657",68,"Editorial License","Originally written in Pascal's 'Lettres Provinciales'. It reflects the paradox of writing: that editing, refining, and achieving brevity require significantly more cognitive effort and time than writing in an unconstrained manner."
5,"Simplicity is the ultimate sophistication.","Leonardo da Vinci","Art & Design",5.00,"1500",41,"Commercial Right","Attributed to the Renaissance polymath. This maxim has guided centuries of designers and artists, suggesting that creating something simple, yet profoundly functional and beautiful, is the highest level of mastery."
6,"We are what we repeatedly do. Excellence, then, is not an act, but a habit.","Aristotle","Philosophy",1.99,"330 BC",77,"Personal Devotional License","Summarized from Aristotle's Nicomachean Ethics. Aristotle asserts that moral virtue and operational excellence are built through the deliberate, repeated practice of right actions rather than singular bursts of inspiration."
7,"That which does not kill us makes us stronger.","Friedrich Nietzsche","Philosophy",2.50,"1888",46,"Personal Devotional License","Appearing in Nietzsche's 'Twilight of the Idols'. This aphorism forms the foundation of his concept of the Overman, arguing that psychological and spiritual growth is forged through overcoming severe adversity and suffering."
8,"The only true wisdom is in knowing you know nothing.","Socrates","Philosophy",1.75,"399 BC",52,"Personal Devotional License","Known as the Socratic Paradox. Reported by Plato, this concept details Socrates' realization that his wisdom lay in his awareness of his own ignorance, establishing intellectual humility as the starting point of truth."
9,"Design is not just what it looks like and feels like. Design is how it works.","Steve Jobs","Art & Design",3.99,"2003",76,"Commercial Right","Published in a New York Times interview regarding the creation of Apple's consumer electronics. It defined the transition from ornamental design to functional design, highlighting that aesthetics must be intrinsically linked to usability."
10,"Time you enjoy wasting is not wasted time.","Marthe Troly-Curtin","Literature",2.00,"1911",42,"Editorial License","From her novel 'Phrynette Married'. This lighthearted yet profound quote challenges the industrial obsession with constant productivity, suggesting that joy and rest have their own intrinsic value."`;

/**
 * CSV Parser Helper Function
 * Parses raw CSV text into an array of quote objects matching schema.
 */
function parseQuotesCSV(csvText) {
    if (!csvText) return [];

    // Standardize line breaks
    const text = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = [];
    let currentLine = [];
    let currentToken = "";
    let insideQuote = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];

        if (insideQuote) {
            if (char === '"' && text[i + 1] === '"') {
                currentToken += '"';
                i++; // Skip escaped quote
            } else if (char === '"') {
                insideQuote = false;
            } else {
                currentToken += char;
            }
        } else {
            if (char === '"') {
                insideQuote = true;
            } else if (char === ',') {
                currentLine.push(currentToken.trim());
                currentToken = "";
            } else if (char === '\n') {
                currentLine.push(currentToken.trim());
                if (currentLine.some(cell => cell.length > 0)) {
                    lines.push(currentLine);
                }
                currentLine = [];
                currentToken = "";
            } else {
                currentToken += char;
            }
        }
    }

    if (currentToken !== "" || currentLine.length > 0) {
        currentLine.push(currentToken.trim());
        if (currentLine.some(cell => cell.length > 0)) {
            lines.push(currentLine);
        }
    }

    if (lines.length < 2) return [];

    const headers = lines[0].map(h => h.trim());
    const records = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i];
        if (values.length < headers.length) continue;

        const record = {};
        headers.forEach((header, index) => {
            let val = values[index] !== undefined ? values[index] : "";
            if (header === "price") {
                val = parseFloat(val) || 0;
            } else if (header === "characterCount") {
                val = parseInt(val, 10) || 0;
            }
            record[header] = val;
        });
        records.push(record);
    }

    return records;
}

/**
 * Asynchronously loads quotes database from quotes.csv
 */
async function loadDatabaseFromCSV() {
    let csvText = "";
    try {
        const response = await fetch("quotes.csv");
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        csvText = await response.text();
    } catch (err) {
        console.warn("fetch('quotes.csv') failed (likely file:// protocol CORS restriction). Using embedded CSV fallback data.", err);
        csvText = RAW_CSV_FALLBACK;
    }

    QUOTE_DATABASE = parseQuotesCSV(csvText);
    updateCartUI();
    router();
}

// App UI State Management
const appState = {
    activeCategory: "ALL",
    activeSort: "FEATURED",
    authorQuery: "",
    lastOrder: null
};

// Global function to update cart counter in the header
function updateCartUI() {
    const cartCountEl = document.getElementById("cart-count");
    if (cartCountEl) {
        cartCountEl.textContent = `(${cartService.getCartCount()})`;
    }
}

// Register event listener for cart state updates
window.addEventListener("cart-updated", updateCartUI);

// Helper to Format Currency
function formatCurrency(amount) {
    return `$${amount.toFixed(2)}`;
}

// Router Implementation
function router() {
    const appContainer = document.getElementById("app");
    const hash = window.location.hash || "#/";

    // Update Header Active Link states
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

    // Route matching
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
        // Fallback / 404
        appContainer.innerHTML = `
            <div class="empty-cart-message">
                <h3>Page Not Found</h3>
                <a href="#/" class="btn">Return to Catalog</a>
            </div>
        `;
    }
}

// Initialize Router & Load External CSV Database
window.addEventListener("hashchange", router);
window.addEventListener("DOMContentLoaded", () => {
    loadDatabaseFromCSV();
});

// View 1: Catalog Renderer
function renderCatalog(container) {
    // Get unique categories for filters
    const categories = ["ALL", ...new Set(QUOTE_DATABASE.map(q => q.category))];

    // Construct Control Bar HTML
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

    // Set container inner HTML with controls, search bar, and grid container
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
        <div class="quote-grid" id="catalog-grid">
            <!-- Grid cards injected dynamically by renderCatalogGrid -->
        </div>
    `;

    const gridContainer = container.querySelector("#catalog-grid");

    // Perform initial card grid render
    renderCatalogGrid(gridContainer);

    // Bind Filter Click Handlers (Update grid only, keeping input intact)
    const filterButtons = container.querySelectorAll(".filter-btn");
    filterButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            appState.activeCategory = btn.getAttribute("data-category");

            // Instantly update active states for visuals
            filterButtons.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            renderCatalogGrid(gridContainer);
        });
    });

    // Bind Search Input Handler (Live filter updates)
    const searchInput = container.querySelector("#author-search");
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            appState.authorQuery = e.target.value;
            renderCatalogGrid(gridContainer);
        });
    }

    // Bind Sort Change Handler
    const sortSelect = container.querySelector("#sort-select");
    if (sortSelect) {
        sortSelect.addEventListener("change", (e) => {
            appState.activeSort = e.target.value;
            renderCatalogGrid(gridContainer);
        });
    }
}

// Sub-renderer for Quote Cards Grid (filters and renders cards only)
function renderCatalogGrid(gridContainer) {
    if (!gridContainer) return;

    // Filter by Category
    let quotes = [...QUOTE_DATABASE];
    if (appState.activeCategory !== "ALL") {
        quotes = quotes.filter(q => q.category === appState.activeCategory);
    }

    // Filter by Author (leveraging SearchService)
    quotes = searchService.searchByAuthor(quotes, appState.authorQuery);

    // Sort quotes
    if (appState.activeSort === "PRICE_LOW") {
        quotes.sort((a, b) => a.price - b.price);
    } else if (appState.activeSort === "PRICE_HIGH") {
        quotes.sort((a, b) => b.price - a.price);
    } else if (appState.activeSort === "ALPHABETICAL") {
        quotes.sort((a, b) => a.text.localeCompare(b.text));
    }

    // Construct Cards HTML
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
            <!-- Left Side Quote Presentation -->
            <div class="detail-quote-panel">
                <blockquote class="detail-quote-text">“${quote.text}”</blockquote>
                <cite class="detail-quote-author">— ${quote.author}</cite>
            </div>
            
            <!-- Right Side Purchase Specifications -->
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

    // Bind Add to Cart Button with dynamic feedback
    const btn = container.querySelector("#add-to-cart-btn");
    if (btn) {
        btn.addEventListener("click", () => {
            cartService.addToCart(quote.id);
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
    if (cartService.getCart().length === 0) {
        container.innerHTML = `
            <div class="empty-cart-message">
                <h3>Your shopping cart is currently empty.</h3>
                <p style="margin-bottom: 2rem;">Acquire some thoughts before checking out.</p>
                <a href="#/" class="btn">Browse Archive</a>
            </div>
        `;
        return;
    }

    // Build Cart Items List
    const cartItemsHTML = cartService.getCart().map(item => {
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
            <!-- Left Panel: Cart items -->
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
                        <span>${formatCurrency(cartService.getCartTotal(QUOTE_DATABASE))}</span>
                    </div>
                    <div class="summary-row">
                        <span>Digital Delivery Fee</span>
                        <span>$0.00</span>
                    </div>
                    <div class="summary-row total-row">
                        <span>Total</span>
                        <span>${formatCurrency(cartService.getCartTotal(QUOTE_DATABASE))}</span>
                    </div>
                </div>
            </div>
            
            <!-- Right Panel: Place Order Form -->
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
                    
                    <button type="submit" class="btn place-order-btn">Place Order — ${formatCurrency(cartService.getCartTotal(QUOTE_DATABASE))}</button>
                </form>
            </div>
        </div>
    `;

    // Bind Quantity Controls and Remove button Click Handlers
    container.querySelectorAll(".qty-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const action = btn.getAttribute("data-action");
            cartService.updateQuantity(id, action === "plus" ? 1 : -1);
            renderCheckout(container);
        });
    });

    container.querySelectorAll(".remove-item-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            cartService.removeFromCart(id);
            renderCheckout(container);
        });
    });

    // Auto-formatting Card Number & Expiration for premium feel
    const cardInput = container.querySelector("#checkout-card");
    if (cardInput) {
        cardInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = v.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];

            for (let i = 0, len = match.length; i < len; i += 4) {
                parts.push(match.substring(i, i + 4));
            }

            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = v;
            }
        });
    }

    const expInput = container.querySelector("#checkout-exp");
    if (expInput) {
        expInput.addEventListener("input", (e) => {
            let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            if (v.length >= 2) {
                e.target.value = v.substring(0, 2) + '/' + v.substring(2, 4);
            } else {
                e.target.value = v;
            }
        });
    }

    // Submit Payment Form Handler
    const form = container.querySelector("#payment-form");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            // Build Receipt Session Info
            const orderNumber = "ORD-" + Math.floor(100000 + Math.random() * 900000);
            const items = cartService.getCart().map(item => {
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
                total: cartService.getCartTotal(QUOTE_DATABASE)
            };

            // Clear the cart
            cartService.clearCart();

            // Redirect to Receipt View
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

    // Bind Print Button Click
    const printBtn = container.querySelector("#print-invoice-btn");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            window.print();
        });
    }
}
