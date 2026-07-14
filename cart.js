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

// ============================================================
// CHECKOUT CONFIGURATION
// ⚠️ REPLACE THESE WITH YOUR REAL DETAILS BEFORE GOING LIVE ⚠️
// ============================================================
const PAYMENT_ACCOUNT_NUMBER = '0300-1234567';       // Your JazzCash / EasyPaisa number
const PAYMENT_ACCOUNT_NAME = 'Jewels by Laiba';        // Name on the JazzCash / EasyPaisa account
const WHATSAPP_NUMBER = '923001234567';                // WhatsApp number in international format, no + or leading 0

let selectedPaymentMethod = 'jazzcash';
let lastOrder = null;

function openCheckout() {
    if (cart.length === 0) {
        showToast("Your bag is empty!");
        return;
    }
    toggleCart(); // close the cart drawer
    document.getElementById('checkout-form-panel').classList.add('active');
    document.getElementById('checkout-confirm-panel').classList.remove('active');
    renderCheckoutSummary();
    selectPayment('jazzcash');
    document.getElementById('checkout-modal').classList.add('open');
    document.getElementById('backdrop').classList.add('open');
    lucide.createIcons();
}

function closeCheckoutModal() {
    document.getElementById('checkout-modal').classList.remove('open');
    document.getElementById('backdrop').classList.remove('open');
}

function renderCheckoutSummary() {
    const itemsEl = document.getElementById('checkout-summary-items');
    const totalEl = document.getElementById('checkout-summary-total');
    const ckTotalEl = document.getElementById('ck-total');

    let total = 0;
    itemsEl.innerHTML = cart.map(item => {
        total += item.price * item.quantity;
        return `
            <div class="os-item">
                <span>${item.title} <span class="os-qty">× ${item.quantity}</span></span>
                <span>Rs ${(item.price * item.quantity).toLocaleString()}</span>
            </div>`;
    }).join('');

    totalEl.textContent = `Rs ${total.toLocaleString()}`;
    ckTotalEl.textContent = `Rs ${total.toLocaleString()}`;
}

function selectPayment(method) {
    selectedPaymentMethod = method;
    document.querySelectorAll('.pay-option').forEach(o => o.classList.toggle('selected', o.dataset.pay === method));

    const infoBox = document.getElementById('jazzcash-info');
    if (method === 'jazzcash') {
        infoBox.classList.add('show');
        document.getElementById('payment-number').textContent = PAYMENT_ACCOUNT_NUMBER;
    } else {
        infoBox.classList.remove('show');
    }
}

function copyPaymentNumber() {
    navigator.clipboard.writeText(PAYMENT_ACCOUNT_NUMBER.replace(/-/g, '')).then(() => {
        showToast("Number copied!");
    }).catch(() => {
        showToast("Number: " + PAYMENT_ACCOUNT_NUMBER);
    });
}

function placeOrder() {
    const name = document.getElementById('ck-name').value.trim();
    const phone = document.getElementById('ck-phone').value.trim();
    const address = document.getElementById('ck-address').value.trim();
    const city = document.getElementById('ck-city').value.trim();
    const notes = document.getElementById('ck-notes').value.trim();

    if (!name || !phone || !address || !city) {
        showToast("Please fill in all required fields.");
        return;
    }

    const orderId = 'JBL-' + Math.floor(100000 + Math.random() * 900000);
    let total = 0;
    cart.forEach(i => total += i.price * i.quantity);

    lastOrder = { orderId, name, phone, address, city, notes, total, method: selectedPaymentMethod, items: [...cart] };

    document.getElementById('checkout-form-panel').classList.remove('active');
    document.getElementById('checkout-confirm-panel').classList.add('active');
    document.getElementById('confirm-order-id').textContent = '#' + orderId;

    const whatsappWrap = document.getElementById('whatsapp-cta-wrap');
    const confirmMsg = document.getElementById('confirm-message');

    if (selectedPaymentMethod === 'jazzcash') {
        confirmMsg.textContent = `Almost done! Please send Rs ${total.toLocaleString()} to ${PAYMENT_ACCOUNT_NUMBER} (${PAYMENT_ACCOUNT_NAME}) via JazzCash or EasyPaisa, then send us the payment screenshot on WhatsApp so we can confirm your order.`;
        whatsappWrap.style.display = 'block';
    } else {
        confirmMsg.textContent = `Thank you, ${name}! Your order will be delivered to your address in ${city}. Pay Rs ${total.toLocaleString()} in cash when it arrives.`;
        whatsappWrap.style.display = 'none';
    }

    cart = [];
    persistCart();
    updateCartUI();
    lucide.createIcons();
}

function sendWhatsAppScreenshot() {
    if (!lastOrder) return;
    const itemsList = lastOrder.items.map(i => `- ${i.title} (x${i.quantity}) - Rs ${(i.price * i.quantity).toLocaleString()}`).join('\n');
    const message = `Hi! I just placed order #${lastOrder.orderId} on Jewels by Laiba.\n\nName: ${lastOrder.name}\nPhone: ${lastOrder.phone}\nAddress: ${lastOrder.address}, ${lastOrder.city}\n\nItems:\n${itemsList}\n\nTotal: Rs ${lastOrder.total.toLocaleString()}\n\nI've sent the payment screenshot below 👇`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
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
