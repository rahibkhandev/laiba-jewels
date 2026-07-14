// ============================================================
// Shared cart + checkout logic for Jewels by Laiba
// Used by both index.html (home) and shop.html (full catalog)
// Cart is persisted in localStorage so it carries over between pages
// ============================================================

let cart = JSON.parse(localStorage.getItem('jbl_cart') || '[]');

function persistCart() {
    localStorage.setItem('jbl_cart', JSON.stringify(cart));
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.innerText = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function toggleCart() {
    document.getElementById('cart-drawer').classList.toggle('open');
    document.getElementById('backdrop').classList.toggle('open');
}

function addToCart(id) {
    const match = cart.find(item => item.id === id);
    if (match) {
        match.quantity++;
    } else {
        const prod = products.find(p => p.id === id);
        cart.push({ ...prod, quantity: 1 });
    }
    persistCart();
    updateCartUI();
    showToast("Item added to bag!");
}

function alterQty(id, delta) {
    const match = cart.find(item => item.id === id);
    if (match) {
        match.quantity += delta;
        if (match.quantity <= 0) {
            cart = cart.filter(item => item.id !== id);
        }
    }
    persistCart();
    updateCartUI();
}

function updateCartUI() {
    const container = document.getElementById('cart-items');
    const badge = document.getElementById('cart-badge');
    const subtotalEl = document.getElementById('cart-subtotal');

    container.innerHTML = '';

    if (cart.length === 0) {
        container.innerHTML = `<div style="text-align:center; color:#888; margin-top:2rem;">Your bag is empty</div>`;
        badge.textContent = '0';
        subtotalEl.textContent = 'Rs 0';
        return;
    }

    let totalItems = 0;
    let totalPrice = 0;

    cart.forEach(item => {
        totalItems += item.quantity;
        totalPrice += item.price * item.quantity;

        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <div class="cart-item-title">${item.title}</div>
                    <div class="cart-item-price">Rs ${item.price.toLocaleString()}</div>
                    <div class="qty-controls">
                        <button class="qty-btn" onclick="alterQty(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="alterQty(${item.id}, 1)">+</button>
                    </div>
                </div>
            </div>
        `;
    });

    badge.textContent = totalItems;
    subtotalEl.textContent = `Rs ${totalPrice.toLocaleString()}`;
}

function checkoutDemo() {
    if (cart.length === 0) return;
    const orderId = Math.floor(100000 + Math.random() * 900000);
    alert(`🎉 Success! This mock checkout was processed.\nOrder ID: #JBL-${orderId}\n\nTo make this store live with a payment processor, it can be connected directly to your TikTok profile!`);
    cart = [];
    persistCart();
    updateCartUI();
    toggleCart();
}

// Custom Share State Management logic
function shareStore() {
    const params = new URLSearchParams();
    if (cart.length > 0) {
        const encodedCart = cart.map(i => `${i.id}:${i.quantity}`).join(',');
        params.set('cartState', encodedCart);
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;

    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast("Shareable link copied to clipboard!");
    }).catch(() => {
        alert("Share link created: " + shareUrl);
    });
}

function readSharedCartState() {
    const urlParams = new URLSearchParams(window.location.search);
    const state = urlParams.get('cartState');
    if (state) {
        try {
            const structuralPairs = state.split(',');
            structuralPairs.forEach(pair => {
                const [idStr, qtyStr] = pair.split(':');
                const id = parseInt(idStr);
                const qty = parseInt(qtyStr);
                const referenceItem = products.find(p => p.id === id);
                if (referenceItem) {
                    const existing = cart.find(c => c.id === id);
                    if (existing) existing.quantity = qty;
                    else cart.push({ ...referenceItem, quantity: qty });
                }
            });
            persistCart();
        } catch (e) {
            console.error("Failed parsing shared state structure", e);
        }
    }
}
