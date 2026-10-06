/* =========================================================
   FINA OLSHOP - FRONTEND MAIN LOGIC (SPA & SLUG ROUTING)
   File: JAVAindex.js
   ========================================================= */

// ⚠️ GANTI URL DI BAWAH DENGAN URL DEPLOYMENT WEB APP APPS SCRIPT ANDA!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuZAWbFjKdWCU-Lsr-eB-Io0mZaDtNc8JpAkVo-3S4RSm_59cLE2-EDEWCMjnpJtG38g/exec";

var products = [];
var cart = [];
var currentCategory = 'All';
var currentSearchQuery = '';
var currentPoFilter = 'all';

var currentGalleryImages = [];
var currentImageIndex = 0;
var currentSelectedProduct = null;
var currentSelectedVariant = null;

var appliedPromo = null;
var appQrisUrl = '';
var appBankInfo = '';
var pendingOrderData = null;

var currentStoreStatus = 'BUKA';
var storeAnnouncementText = '';

// Helper API Fetcher untuk komunikasi GET & POST
async function apiGet(action, params = {}) {
    let url = new URL(APPS_SCRIPT_URL);
    url.searchParams.append('action', action);
    Object.keys(params).forEach(key => url.searchParams.append(key, params[key]));
    let response = await fetch(url);
    let res = await response.json();
    return res.data !== undefined ? res.data : res;
}

async function apiPost(action, payload = {}) {
    let response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: action, ...payload })
    });
    return await response.json();
}

// Utility Helper untuk Slug URL
function generateSlug(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w\-]+/g, '')
        .replace(/\-\-+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '');
}

// ROUTER SYSTEM UNTUK MODAL FULLSCREEN SPA
function handleRouting() {
    const hash = window.location.hash;

    // Sembunyikan seluruh modal fullscreen terlebih dahulu
    document.getElementById('detailModal').classList.add('hidden');
    document.getElementById('cartDrawer').classList.add('hidden');
    document.getElementById('checkoutModal').classList.add('hidden');

    if (hash.startsWith('#kue/')) {
        const parts = hash.split('/');
        const id = parts[1];
        if (id && products.length > 0) {
            openDetailModalById(id, false);
        }
    } else if (hash === '#cart') {
        document.getElementById('cartDrawer').classList.remove('hidden');
    } else if (hash === '#checkout') {
        document.getElementById('checkoutModal').classList.remove('hidden');
    }
}

function navigateTo(hash) {
    window.location.hash = hash;
}

function closeModalAndClearHash() {
    history.pushState("", document.title, window.location.pathname + window.location.search);
    handleRouting();
}

function copyCurrentShareableLink() {
    navigator.clipboard.writeText(window.location.href);
    showPremiumAlert("Link Disalin!", "Tautan halaman ini berhasil disalin dan siap dibagikan.", "success");
}

document.addEventListener('DOMContentLoaded', function() {
    fetchProductsFromBackend();
    fetchStoreSettings();
    fetchPublicOrders();
    
    window.addEventListener('hashchange', handleRouting);

    var tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    var dateEl = document.getElementById('deliveryDate');
    if (dateEl) dateEl.value = tomorrow.toISOString().split('T')[0];
    
    var timeEl = document.getElementById('deliveryTime');
    if (timeEl) timeEl.value = "14:00";

    function blockInteractionIfClosed(e) {
        if (currentStoreStatus === 'BUKA') return;
        var modal = document.getElementById('storeAnnouncementModal');
        if (modal && modal.contains(e.target)) return;

        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showStoreAnnouncementModal();
        return false;
    }

    window.addEventListener('click', blockInteractionIfClosed, true);
    window.addEventListener('submit', blockInteractionIfClosed, true);
    window.addEventListener('keydown', function(e) {
        if (currentStoreStatus !== 'BUKA' && (e.key === 'Enter' || e.key === ' ')) {
            blockInteractionIfClosed(e);
        }
    }, true);
});

function showPremiumAlert(title, message, type, confirmCallback) {
    var modal = document.getElementById('premiumAlertModal');
    var iconBox = document.getElementById('alertIconBox');
    var titleEl = document.getElementById('alertTitle');
    var msgEl = document.getElementById('alertMessage');
    var actionsEl = document.getElementById('alertActions');

    titleEl.innerText = title;
    msgEl.innerText = message;

    if (type === 'success') {
        iconBox.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 bg-emerald-100 text-emerald-600 border border-emerald-200";
        iconBox.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
    } else if (type === 'error') {
        iconBox.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 bg-rose-100 text-rose-600 border border-rose-200";
        iconBox.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
    } else if (type === 'confirm') {
        iconBox.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 bg-amber-100 text-amber-600 border border-amber-200";
        iconBox.innerHTML = '<i class="fa-solid fa-circle-question"></i>';
    } else {
        iconBox.className = "w-16 h-16 rounded-full mx-auto flex items-center justify-center text-2xl mb-4 bg-blue-100 text-blue-600 border border-blue-200";
        iconBox.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
    }

    if (type === 'confirm') {
        actionsEl.innerHTML = 
            '<button onclick="closePremiumAlert()" class="px-4 py-2 rounded-xl font-bold text-xs text-amber-800 hover:bg-amber-100 transition">Batal</button>' +
            '<button id="btnConfirmOk" class="bg-amber-800 hover:bg-amber-900 text-white px-5 py-2 rounded-xl font-bold text-xs transition shadow-md">Ya, Lanjutkan</button>';
        document.getElementById('btnConfirmOk').onclick = function() {
            closePremiumAlert();
            if (confirmCallback) confirmCallback();
        };
    } else {
        actionsEl.innerHTML = '<button onclick="closePremiumAlert()" class="bg-amber-800 hover:bg-amber-900 text-white px-6 py-2 rounded-xl font-bold text-xs transition shadow-md">Mengerti</button>';
    }

    modal.classList.remove('hidden');
}

function closePremiumAlert() {
    document.getElementById('premiumAlertModal').classList.add('hidden');
}

async function fetchProductsFromBackend() {
    try {
        let data = await apiGet('getProducts');
        products = Array.isArray(data) ? data : [];
        renderCategoryButtons();
        renderProducts();
        updateCartUI();
        handleRouting(); // Cek URL hash setelah produk dimuat
    } catch(err) {
        showPremiumAlert("Gagal Memuat Produk", "Terjadi gangguan koneksi ke server.", "error");
    }
}

async function fetchStoreSettings() {
    try {
        let settings = await apiGet('getSettings');
        if (settings) {
            currentStoreStatus = settings.storeStatus ? settings.storeStatus.toUpperCase().trim() : 'BUKA';
            storeAnnouncementText = settings.storeAnnouncement || 'Mohon maaf, toko kami saat ini sedang LIBUR/TUTUP.';

            updateStoreStatusUI(currentStoreStatus);
            if (settings.logoUrl) {
                var logo = document.getElementById('appLogo');
                if (logo) logo.src = settings.logoUrl;
            }
            if (settings.qrisUrl) appQrisUrl = settings.qrisUrl;
            if (settings.bankInfo) appBankInfo = settings.bankInfo;

            updatePaymentMethodsUI(settings);

            if (currentStoreStatus === 'LIBUR' || currentStoreStatus === 'TUTUP') {
                showStoreAnnouncementModal();
            }
        }
    } catch(err) {}
}

function showStoreAnnouncementModal() {
    var modal = document.getElementById('storeAnnouncementModal');
    var titleEl = document.getElementById('announcementTitle');
    var msgEl = document.getElementById('announcementMessageText');

    if (!modal) return;
    titleEl.innerText = (currentStoreStatus === 'LIBUR') ? "Toko Sedang Libur" : (currentStoreStatus === 'TUTUP' ? "Toko Sedang Tutup" : "Pemberitahuan Toko");
    msgEl.innerText = storeAnnouncementText;
    modal.classList.remove('hidden');
}

function closeAnnouncementModal(e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    var modal = document.getElementById('storeAnnouncementModal');
    if (modal) modal.classList.add('hidden');
}

function updatePaymentMethodsUI(settings) {
    var paySelect = document.getElementById('paymentMethod');
    if (!paySelect) return;

    var qrisOpt = paySelect.querySelector('option[value="QRIS All Payment"]');
    var transferOpt = paySelect.querySelector('option[value="Transfer Bank (BCA/Mandiri)"]');
    var codOpt = paySelect.querySelector('option[value="COD / Bayar di Toko"]');

    if (qrisOpt) {
        qrisOpt.disabled = (settings.paymentQrisStatus === 'MAINTENANCE');
        qrisOpt.innerText = qrisOpt.disabled ? "QRIS All Payment (Sedang Maintenance)" : "QRIS All Payment (Gopay/OVO/Dana/BCA/dll)";
    }
    if (transferOpt) {
        transferOpt.disabled = (settings.paymentTransferStatus === 'MAINTENANCE');
        transferOpt.innerText = transferOpt.disabled ? "Transfer Bank (Sedang Maintenance)" : "Transfer Bank (BCA / Mandiri)";
    }
    if (codOpt) {
        codOpt.disabled = (settings.paymentCodStatus === 'MAINTENANCE');
        codOpt.innerText = codOpt.disabled ? "COD / Bayar di Toko (Sedang Maintenance)" : "COD / Bayar di Toko";
    }
}

async function fetchPublicOrders() {
    var tbody = document.getElementById('publicOrdersTable');
    if (!tbody) return;

    try {
        let orders = await apiGet('getOrders');
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="p-6 text-center text-amber-800 font-semibold">Belum ada riwayat pesanan.</td></tr>';
            return;
        }

        tbody.innerHTML = orders.slice(0, 10).map(function(o) {
            var statusVal = o.status ? String(o.status).trim().toUpperCase() : 'PENDING';
            var updateTime = o.statusUpdatedAt || o.timestamp || '-';

            return '<tr class="hover:bg-amber-50/80 transition text-xs">' +
                '<td class="p-3 font-bold text-amber-900 border-b border-amber-100">' + o.orderId + '</td>' +
                '<td class="p-3 font-medium text-amber-900 border-b border-amber-100">' + o.customerName + '</td>' +
                '<td class="p-3 border-b border-amber-100"><div class="line-clamp-2 leading-relaxed text-amber-900">' + o.itemsDetail + '</div></td>' +
                '<td class="p-3 border-b border-amber-100"><span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold inline-block ' + getStatusBadgeClass(statusVal) + '">' + statusVal + '</span></td>' +
                '<td class="p-3 border-b border-amber-100 font-semibold text-amber-800 whitespace-nowrap"><i class="fa-regular fa-clock mr-1 text-amber-600"></i>' + updateTime + '</td>' +
            '</tr>';
        }).join('');
    } catch(err) {}
}

function getStatusBadgeClass(status) {
    if (status === 'SELESAI') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (status === 'DIPROSES' || status === 'SEDANG DIKEMAS') return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (status === 'SIAP DIAMBIL') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (status === 'SEGERA DIKIRIM' || status === 'DALAM PENGIRIMAN' || status === 'DIKIRIM') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (status === 'CANCEL') return 'bg-gray-200 text-gray-800 border border-gray-300';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
}

function updateStoreStatusUI(status) {
    var badge = document.getElementById('storeStatusBadge');
    var textEl = document.getElementById('storeStatusText');
    if (!badge || !textEl) return;

    var statusClean = status ? status.toUpperCase().trim() : 'BUKA';

    if (statusClean === 'BUKA') {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-emerald-600 text-white";
        textEl.innerText = "Toko Buka";
    } else if (statusClean === 'LIBUR') {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-rose-600 text-white";
        textEl.innerText = "Toko Libur";
    } else if (statusClean === 'TUTUP') {
        badge.className = "px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 bg-gray-900 text-white";
        textEl.innerText = "Toko Tutup";
    }
}

function renderCategoryButtons() {
    var container = document.getElementById('categoryContainer');
    if (!container) return;

    var categoriesSet = new Set();
    products.forEach(function(p) { if (p.category) categoriesSet.add(String(p.category).trim()); });

    var categories = Array.from(categoriesSet);
    var html = '<button onclick="filterCategory(\'All\')" id="catBtn-All" class="cat-btn px-3.5 py-1.5 rounded-full font-semibold border transition whitespace-nowrap ' + 
        (currentCategory === 'All' ? 'bg-amber-900 text-white border-amber-900' : 'bg-white text-amber-800 border-amber-200 hover:border-amber-400') + 
        '">Semua Menu</button>';

    if (categories.length > 0) {
        html += categories.map(function(cat) {
            var isActive = currentCategory.toLowerCase() === cat.toLowerCase();
            var activeClass = isActive ? 'bg-amber-900 text-white border-amber-900' : 'bg-white text-amber-800 border-amber-200 hover:border-amber-400';
            var safeCat = cat.replace(/'/g, "\\'");
            return '<button onclick="filterCategory(\'' + safeCat + '\')" class="cat-btn px-3.5 py-1.5 rounded-full font-semibold border transition whitespace-nowrap ' + activeClass + '">' + cat + '</button>';
        }).join('');
    }
    container.innerHTML = html;
}

function filterCategory(cat) { currentCategory = cat; renderCategoryButtons(); renderProducts(); }

function renderProducts() {
    var grid = document.getElementById('productGrid');
    var empty = document.getElementById('emptyState');
    if (!grid) return;
    
    var filtered = products.filter(function(p) {
        var matchCat = (currentCategory === 'All') || (p.category.toLowerCase() === currentCategory.toLowerCase());
        var q = currentSearchQuery.toLowerCase().trim();
        var matchSearch = p.name.toLowerCase().indexOf(q) !== -1 || p.description.toLowerCase().indexOf(q) !== -1;
        var matchPo = true;
        if (currentPoFilter === 'ready') matchPo = !p.isPo;
        if (currentPoFilter === 'po') matchPo = p.isPo;

        return matchCat && matchSearch && matchPo;
    });

    document.getElementById('itemCountDisplay').innerText = filtered.length;

    if (filtered.length === 0) {
        grid.innerHTML = '';
        if (empty) empty.classList.remove('hidden');
        return;
    }

    if (empty) empty.classList.add('hidden');

    grid.innerHTML = filtered.map(function(p) {
        var mainImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
        var pSlug = generateSlug(p.name);

        return '<div class="bg-white rounded-3xl overflow-hidden border border-amber-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group ' + (!p.isAvailable ? 'opacity-60' : '') + '">' +
            '<div>' +
                '<div onclick="openDetailModalById(' + p.id + ')" class="relative overflow-hidden h-48 cursor-pointer">' +
                    '<img src="' + mainImg + '" alt="' + p.name + '" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">' +
                    '<div class="absolute top-3 left-3 flex flex-col gap-1 items-start">' +
                        (p.isPo 
                            ? '<span class="bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-hourglass-start mr-1"></i>Pre Order H-' + p.poDays + '</span>'
                            : '<span class="bg-emerald-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full"><i class="fa-solid fa-bolt mr-1"></i>Ready Stock</span>'
                        ) +
                        (!p.isAvailable ? '<span class="bg-gray-800 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">Stok Habis</span>' : '') +
                    '</div>' +
                '</div>' +

                '<div class="p-4">' +
                    '<div class="flex items-center justify-between text-[11px] text-amber-800 mb-1">' +
                        '<span class="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">' + p.category + '</span>' +
                        '<div><i class="fa-solid fa-star text-amber-500 mr-1"></i><span class="font-bold text-amber-900">' + (p.rating || '5.0') + '</span></div>' +
                    '</div>' +
                    '<h3 onclick="openDetailModalById(' + p.id + ')" class="font-poppins font-semibold text-base text-amber-900 cursor-pointer hover:text-amber-600 transition line-clamp-1 mt-1">' + p.name + '</h3>' +
                    '<p class="text-xs text-amber-800/80 line-clamp-2 mt-1 mb-3">' + p.description + '</p>' +
                    '<div class="text-[11px] text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 inline-block"><i class="fa-solid fa-box mr-1 text-amber-600"></i>' + p.size + '</div>' +
                '</div>' +
            '</div>' +

            '<div class="p-4 pt-0 flex items-center justify-between gap-2 border-t border-amber-50 mt-2">' +
                '<div>' +
                    '<span class="text-[10px] text-amber-800 block">Harga</span>' +
                    '<span class="font-extrabold text-amber-900 text-base">Rp ' + p.price.toLocaleString('id-ID') + '</span>' +
                '</div>' +
                '<button onclick="quickAddToCart(' + p.id + ')" ' + (!p.isAvailable ? 'disabled' : '') + ' class="bg-amber-100 hover:bg-amber-500 hover:text-white text-amber-900 p-2.5 rounded-2xl transition font-bold text-xs flex items-center gap-1 disabled:opacity-40">' +
                    '<i class="fa-solid fa-cart-plus text-sm"></i>' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');
}

function handleSearch(val) { currentSearchQuery = val; renderProducts(); }
function togglePoFilter(type) { currentPoFilter = type; renderProducts(); }

function openDetailModalById(id, updateHash = true) {
    var p = products.find(function(prod) { return prod.id == id; });
    if (!p) return;

    if (updateHash) {
        var slug = generateSlug(p.name);
        window.location.hash = '#kue/' + p.id + '/' + slug;
        return;
    }

    currentSelectedProduct = p;
    currentGalleryImages = (p.images && p.images.length > 0) ? p.images : [p.image];
    currentImageIndex = 0;

    updateGalleryUI();

    document.getElementById('modalTitle').innerText = p.name;
    document.getElementById('modalCategory').innerText = p.category;
    document.getElementById('modalSize').innerText = p.size;
    document.getElementById('modalRating').innerText = p.rating || '5.0';
    document.getElementById('modalSold').innerText = (p.sold || 50) + '+';
    document.getElementById('modalShelfLife').innerText = p.shelfLife || '3 Hari Suhu Ruang';
    document.getElementById('modalDescription').innerText = p.description;
    document.getElementById('modalCustomNote').value = '';

    renderVariantSelection(p);

    var ingBox = document.getElementById('modalIngredients');
    if (p.ingredients && p.ingredients.length > 0) {
        ingBox.innerHTML = p.ingredients.map(function(ing) {
            return '<span class="bg-amber-100 text-amber-900 text-[11px] font-semibold px-3 py-1 rounded-full border border-amber-200"><i class="fa-solid fa-wheat-awn mr-1 text-amber-600"></i>' + ing + '</span>';
        }).join('');
    } else {
        ingBox.innerHTML = '<span class="text-xs text-amber-800">Resep rahasia FINA OLSHOP</span>';
    }

    var addBtn = document.getElementById('modalAddBtn');
    if (p.isAvailable) {
        addBtn.disabled = false;
        addBtn.onclick = function() {
            var finalPrice = currentSelectedVariant ? currentSelectedVariant.price : p.price;
            var finalVariantName = currentSelectedVariant ? currentSelectedVariant.name : p.size;

            addToCart({
                id: p.id,
                name: p.name + (currentSelectedVariant ? ' (' + currentSelectedVariant.name + ')' : ''),
                price: finalPrice,
                size: finalVariantName,
                image: currentGalleryImages[0]
            }, document.getElementById('modalCustomNote').value.trim());

            navigateTo('#cart');
        };
    } else {
        addBtn.disabled = true;
        addBtn.onclick = null;
    }

    renderRelatedProducts(p.id);
    document.getElementById('detailModal').classList.remove('hidden');
}

function askProductViaWA() {
    if (!currentSelectedProduct) return;
    var storePhone = "6281574268876";
    var prodName = currentSelectedProduct.name;
    var prodCategory = currentSelectedProduct.category;
    var selectedPrice = currentSelectedVariant ? currentSelectedVariant.price : currentSelectedProduct.price;
    var selectedVariantName = currentSelectedVariant ? currentSelectedVariant.name : currentSelectedProduct.size;
    var note = document.getElementById('modalCustomNote').value.trim();

    var message = "*HALO FINA OLSHOP* 🍰✨\n" +
        "Saya mau bertanya tentang produk kue ini:\n\n" +
        "🍰 *Nama Kue:* " + prodName + "\n" +
        "📂 *Kategori:* " + prodCategory + "\n" +
        "📦 *Varian/Ukuran:* " + selectedVariantName + "\n" +
        "💰 *Harga:* Rp " + selectedPrice.toLocaleString('id-ID') + "\n" +
        (note ? "📝 *Catatan Khusus:* " + note + "\n" : "") + "\n" +
        "Apakah produk ini ready / bisa dipesan? Terima kasih!";

    window.open("https://wa.me/" + storePhone + "?text=" + encodeURIComponent(message), '_blank');
}

function updateGalleryUI() {
    var mainImg = document.getElementById('modalMainImage');
    var thumbsContainer = document.getElementById('modalGalleryThumbnails');

    mainImg.src = currentGalleryImages[currentImageIndex];

    if (currentGalleryImages.length <= 1) {
        thumbsContainer.innerHTML = '';
        document.getElementById('btnPrevImage').classList.add('hidden');
        document.getElementById('btnNextImage').classList.add('hidden');
        return;
    }

    document.getElementById('btnPrevImage').classList.remove('hidden');
    document.getElementById('btnNextImage').classList.remove('hidden');

    thumbsContainer.innerHTML = currentGalleryImages.map(function(img, idx) {
        var activeBorder = (idx === currentImageIndex) ? 'border-amber-800 ring-2 ring-amber-500' : 'border-amber-200 opacity-60';
        return '<img src="' + img + '" onclick="selectGalleryImage(' + idx + ')" class="w-14 h-14 object-cover rounded-xl border-2 cursor-pointer transition ' + activeBorder + '">';
    }).join('');
}

function selectGalleryImage(idx) { currentImageIndex = idx; updateGalleryUI(); }
function prevGalleryImage() { currentImageIndex = (currentImageIndex - 1 + currentGalleryImages.length) % currentGalleryImages.length; updateGalleryUI(); }
function nextGalleryImage() { currentImageIndex = (currentImageIndex + 1) % currentGalleryImages.length; updateGalleryUI(); }

function renderVariantSelection(p) {
    var box = document.getElementById('modalVariantSection');
    var container = document.getElementById('modalVariantOptions');

    if (p.variantType === 'BOTH' && p.variants && p.variants.length > 0) {
        box.classList.remove('hidden');
        currentSelectedVariant = p.variants[0];

        container.innerHTML = p.variants.map(function(v, idx) {
            var isSel = (idx === 0);
            return '<button type="button" onclick="selectVariantOption(' + idx + ')" id="variantBtn-' + idx + '" class="p-3 rounded-xl text-left border transition font-bold text-xs flex flex-col justify-between ' +
                (isSel ? 'bg-amber-800 text-white border-amber-800 shadow-sm' : 'bg-white text-amber-900 border-amber-200 hover:border-amber-400') + '">' +
                '<span>' + v.name + '</span>' +
                '<span class="text-sm font-extrabold mt-1">Rp ' + v.price.toLocaleString('id-ID') + '</span>' +
            '</button>';
        }).join('');

        updateModalPriceDisplay(p.variants[0].price);
    } else {
        box.classList.add('hidden');
        currentSelectedVariant = null;
        updateModalPriceDisplay(p.price);
    }
}

function selectVariantOption(idx) {
    if (!currentSelectedProduct || !currentSelectedProduct.variants) return;
    currentSelectedVariant = currentSelectedProduct.variants[idx];

    currentSelectedProduct.variants.forEach(function(v, i) {
        var btn = document.getElementById('variantBtn-' + i);
        if (btn) {
            btn.className = (i === idx) 
                ? 'p-3 rounded-xl text-left border transition font-bold text-xs flex flex-col justify-between bg-amber-800 text-white border-amber-800 shadow-sm' 
                : 'p-3 rounded-xl text-left border transition font-bold text-xs flex flex-col justify-between bg-white text-amber-900 border-amber-200 hover:border-amber-400';
        }
    });

    updateModalPriceDisplay(currentSelectedVariant.price);
}

function updateModalPriceDisplay(price) {
    document.getElementById('modalPrice').innerText = "Rp " + Number(price).toLocaleString('id-ID');
}

function renderRelatedProducts(currentId) {
    var sidebarList = document.getElementById('modalRelatedProductsList');
    if (!sidebarList) return;

    var related = products.filter(function(prod) { return prod.id != currentId; }).slice(0, 6);

    if (related.length === 0) {
        sidebarList.innerHTML = '<div class="text-center py-6 text-xs text-amber-800">Tidak ada produk lainnya.</div>';
        return;
    }

    sidebarList.innerHTML = related.map(function(rp) {
        var mainImg = (rp.images && rp.images.length > 0) ? rp.images[0] : rp.image;

        return '<div onclick="openDetailModalById(' + rp.id + ')" class="bg-white p-2.5 rounded-2xl border border-amber-100 hover:border-amber-300 shadow-sm transition cursor-pointer flex gap-3 items-center group">' +
            '<img src="' + mainImg + '" alt="' + rp.name + '" class="w-14 h-14 object-cover rounded-xl border border-amber-100 flex-shrink-0">' +
            '<div class="flex-1 min-w-0">' +
                '<span class="text-[9px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">' + rp.category + '</span>' +
                '<h4 class="font-serif font-bold text-xs text-amber-900 truncate mt-0.5 group-hover:text-amber-600 transition">' + rp.name + '</h4>' +
                '<p class="text-[11px] font-extrabold text-amber-900 mt-0.5">Rp ' + Number(rp.price).toLocaleString('id-ID') + '</p>' +
            '</div>' +
        '</div>';
    }).join('');
}

function quickAddToCart(id) {
    var p = products.find(function(prod) { return prod.id == id; });
    if (p && p.isAvailable) {
        addToCart({
            id: p.id,
            name: p.name,
            price: p.price,
            size: p.size,
            image: (p.images && p.images.length > 0) ? p.images[0] : p.image
        }, '');
    }
}

function addToCart(itemPayload, customNote) {
    var existingIndex = cart.findIndex(function(item) { 
        return item.id == itemPayload.id && item.name === itemPayload.name && item.customNote === customNote; 
    });

    if (existingIndex > -1) {
        cart[existingIndex].qty += 1;
    } else {
        cart.push({
            id: itemPayload.id,
            name: itemPayload.name,
            price: itemPayload.price,
            size: itemPayload.size,
            image: itemPayload.image,
            customNote: customNote,
            qty: 1
        });
    }
    updateCartUI();
}

function updateCartQty(index, delta) {
    if (!cart[index]) return;
    cart[index].qty += delta;
    if (cart[index].qty <= 0) cart.splice(index, 1);
    updateCartUI();
}

function removeFromCart(index) {
    if (cart[index]) {
        cart.splice(index, 1);
        updateCartUI();
    }
}

async function applyPromoCode() {
    var codeInput = document.getElementById('cartPromoInput');
    var msgDiv = document.getElementById('promoMessageText');
    var code = codeInput ? codeInput.value.trim().toUpperCase() : '';

    if (!code) {
        showPremiumAlert("Peringatan", "Masukkan kode promo terlebih dahulu!", "error");
        return;
    }

    var subtotal = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
    
    try {
        let res = await apiGet('validatePromo', { code: code, subtotal: subtotal });
        if (res && res.valid) {
            appliedPromo = res;
            msgDiv.className = "text-xs font-semibold text-emerald-600 block mt-1";
            msgDiv.innerText = res.message;
            updateCartUI();
        } else {
            appliedPromo = null;
            msgDiv.className = "text-xs font-semibold text-rose-600 block mt-1";
            msgDiv.innerText = res.message || "Kode promo tidak valid";
            updateCartUI();
        }
    } catch(err) {
        showPremiumAlert("Gagal", "Terjadi kesalahan saat memeriksa promo.", "error");
    }
}

function updateCartUI() {
    var countBadge = document.getElementById('cartCount');
    var list = document.getElementById('cartItemsList');
    var subtotalEl = document.getElementById('cartSubtotal');
    var shippingFeeEl = document.getElementById('cartShippingFee');
    var grandTotalEl = document.getElementById('cartGrandTotal');
    var btnCheckout = document.getElementById('btnCheckout');

    var discountRow = document.getElementById('cartDiscountRow');
    var discountCodeEl = document.getElementById('cartAppliedPromoCode');
    var discountAmountEl = document.getElementById('cartDiscountAmount');

    var totalItems = cart.reduce(function(sum, item) { return sum + item.qty; }, 0);
    if (countBadge) countBadge.innerText = totalItems;

    if (cart.length === 0) {
        if (list) list.innerHTML = '<div class="text-center py-12 text-amber-800"><i class="fa-solid fa-basket-shopping text-4xl text-amber-300 mb-2"></i><p class="text-sm font-semibold">Keranjang masih kosong</p></div>';
        if (subtotalEl) subtotalEl.innerText = "Rp 0";
        if (shippingFeeEl) shippingFeeEl.innerText = "Rp 0";
        if (grandTotalEl) grandTotalEl.innerText = "Rp 0";
        if (btnCheckout) btnCheckout.disabled = true;
        if (discountRow) discountRow.classList.add('hidden');
        appliedPromo = null;
        return;
    }

    if (btnCheckout) btnCheckout.disabled = false;

    var subtotal = 0;
    list.innerHTML = cart.map(function(item, idx) {
        var itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        return '<div class="bg-amber-50/60 p-3.5 rounded-2xl border border-amber-200/80 flex gap-3 items-center">' +
            '<img src="' + item.image + '" class="w-16 h-16 object-cover rounded-xl">' +
            '<div class="flex-1 min-w-0">' +
                '<h4 class="font-bold text-xs text-amber-900 truncate">' + item.name + '</h4>' +
                '<p class="text-[11px] text-amber-800">Rp ' + item.price.toLocaleString('id-ID') + '</p>' +
                '<div class="flex items-center gap-2 bg-white px-2 py-0.5 rounded-lg border border-amber-200 mt-1 w-max">' +
                    '<button onclick="updateCartQty(' + idx + ', -1)" class="font-bold px-1.5 text-amber-900 hover:text-amber-600">-</button>' +
                    '<span class="text-xs font-bold">' + item.qty + '</span>' +
                    '<button onclick="updateCartQty(' + idx + ', 1)" class="font-bold px-1.5 text-amber-900 hover:text-amber-600">+</button>' +
                '</div>' +
            '</div>' +
            '<div class="flex flex-col items-end gap-1">' +
                '<span class="font-extrabold text-xs text-amber-900">Rp ' + itemTotal.toLocaleString('id-ID') + '</span>' +
                '<button onclick="removeFromCart(' + idx + ')" class="text-rose-600 hover:text-rose-800 p-1 rounded-lg text-xs transition">' +
                    '<i class="fa-solid fa-trash-can"></i>' +
                '</button>' +
            '</div>' +
        '</div>';
    }).join('');

    var shipMethodEl = document.getElementById('shipMethod');
    var shipFee = (shipMethodEl && shipMethodEl.value === 'delivery') ? 5000 : 0;

    var discountAmount = 0;
    if (appliedPromo) {
        discountAmount = appliedPromo.discountAmount;
        if (discountRow) discountRow.classList.remove('hidden');
        if (discountCodeEl) discountCodeEl.innerText = appliedPromo.code;
        if (discountAmountEl) discountAmountEl.innerText = "-Rp " + discountAmount.toLocaleString('id-ID');
    } else {
        if (discountRow) discountRow.classList.add('hidden');
    }

    var grandTotal = Math.max(0, subtotal - discountAmount + shipFee);

    if (subtotalEl) subtotalEl.innerText = "Rp " + subtotal.toLocaleString('id-ID');
    if (shippingFeeEl) shippingFeeEl.innerText = "Rp " + shipFee.toLocaleString('id-ID');
    if (grandTotalEl) grandTotalEl.innerText = "Rp " + grandTotal.toLocaleString('id-ID');
    document.getElementById('checkoutTotal').innerText = "Rp " + grandTotal.toLocaleString('id-ID');
}

function handleShippingChange(val) { 
    var container = document.getElementById('addressContainer');
    var lblDate = document.getElementById('lblDeliveryDate');
    var lblTime = document.getElementById('lblDeliveryTime');

    if (val === 'delivery') {
        if (container) container.classList.remove('hidden');
        if (lblDate) lblDate.innerText = "Tanggal Pengiriman *";
        if (lblTime) lblTime.innerText = "Jam Pengiriman (24 Jam) *";
    } else {
        if (container) container.classList.add('hidden');
        if (lblDate) lblDate.innerText = "Tanggal Pengambilan *";
        if (lblTime) lblTime.innerText = "Jam Pengambilan (24 Jam) *";
    }
    updateCartUI(); 
}

async function processCheckout(e) {
    e.preventDefault();
    var name = document.getElementById('custName').value.trim();
    var phone = document.getElementById('custPhone').value.trim();
    var shipMethod = document.getElementById('shipMethod').value;
    var address = document.getElementById('custAddress').value.trim();
    var rawDate = document.getElementById('deliveryDate').value; 
    var rawTime = document.getElementById('deliveryTime').value; 
    var payMethod = document.getElementById('paymentMethod').value;

    var isDelivery = (shipMethod === 'delivery');
    var labelWaktu = isDelivery ? "Waktu Pengiriman" : "Waktu Pengambilan";

    var formattedDateTime = "-";
    if (rawDate) {
        var dateParts = rawDate.split('-');
        var year = dateParts[0];
        var monthIndex = parseInt(dateParts[1], 10) - 1;
        var day = dateParts[2];

        var namaBulan = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        var dateObj = new Date(year, monthIndex, day);
        var namaHari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"][dateObj.getDay()];

        formattedDateTime = namaHari + ", " + day + " " + namaBulan[monthIndex] + " " + year + " pukul " + rawTime + " WIB";
    }

    var subtotal = cart.reduce(function(sum, item) { return sum + (item.price * item.qty); }, 0);
    var discountAmount = appliedPromo ? appliedPromo.discountAmount : 0;
    var shipFee = isDelivery ? 5000 : 0;
    var grandTotal = Math.max(0, subtotal - discountAmount + shipFee);
    var orderId = "FINA-" + Math.floor(100000 + Math.random() * 900000);

    var itemsDetailString = cart.map(function(item) {
        var t = "• " + item.name + " (" + item.size + ") x" + item.qty + " = Rp " + (item.price * item.qty).toLocaleString('id-ID');
        if (item.customNote) t += "\n   Catatan: _\"" + item.customNote + "\"_";
        return t;
    }).join('\n');

    try {
        await apiPost('createOrder', {
            orderData: {
                orderId: orderId, customerName: name, phone: phone,
                shippingMethod: isDelivery ? 'Jasa Kirim (Ds. Kresek)' : 'Ambil Sendiri di Toko',
                address: isDelivery ? address : '-', deliveryDate: formattedDateTime,
                itemsDetail: itemsDetailString, totalPrice: grandTotal
            }
        });
        fetchPublicOrders();
    } catch(err) {}

    var storePhone = "6281574268876";
    var waMessage = "*HALO FINA OLSHOP* 🍰✨\n" +
        "Saya ingin mengonfirmasi pesanan kue baru:\n\n" +
        "🆔 *Order ID:* " + orderId + "\n" +
        "👤 *Nama Pemesan:* " + name + "\n" +
        "📱 *No. WA:* " + phone + "\n" +
        "🚚 *Metode:* " + (isDelivery ? 'Jasa Kirim (Ds. Kresek)' : 'Ambil Sendiri di Toko') + "\n" +
        (isDelivery ? "📍 *Alamat:* " + address + "\n" : "") +
        "📅 *" + labelWaktu + ":* " + formattedDateTime + "\n" +
        "💳 *Pembayaran:* " + payMethod + "\n\n" +
        "🛒 *RINCIAN PESANAN:* \n" + itemsDetailString + "\n" +
        (appliedPromo ? "🎟️ *Diskon Promo (" + appliedPromo.code + "):* -Rp " + discountAmount.toLocaleString('id-ID') + "\n" : "") +
        (isDelivery ? "🚚 *Biaya Ongkir:* Rp 5.000\n" : "") + "\n" +
        "-----------------------------------\n" +
        "Total Keseluruhan: *Rp " + grandTotal.toLocaleString('id-ID') + "*";

    pendingOrderData = { storePhone: storePhone, waMessage: waMessage, grandTotal: grandTotal };

    closeModalAndClearHash();

    if (payMethod.indexOf("QRIS") !== -1 || payMethod.indexOf("Transfer") !== -1) {
        document.getElementById('qrisImageModal').src = appQrisUrl || "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=FINA%20OLSHOP%20QRIS";
        document.getElementById('bankInfoDisplay').innerText = appBankInfo || "BCA: 1234567890 a.n FINA OLSHOP";
        document.getElementById('qrisAmountDisplay').innerText = "Rp " + grandTotal.toLocaleString('id-ID');
        document.getElementById('qrisPaymentModal').classList.remove('hidden');
    } else {
        openWaConfirmModal();
    }
}

function closeQrisModal() { document.getElementById('qrisPaymentModal').classList.add('hidden'); }
function openWaConfirmModal() { closeQrisModal(); document.getElementById('waConfirmModal').classList.remove('hidden'); }

function executeSendWhatsApp() {
    if (!pendingOrderData) return;
    cart = [];
    appliedPromo = null;
    updateCartUI();
    document.getElementById('waConfirmModal').classList.add('hidden');
    window.open("https://wa.me/" + pendingOrderData.storePhone + "?text=" + encodeURIComponent(pendingOrderData.waMessage), '_blank');
    pendingOrderData = null;
}