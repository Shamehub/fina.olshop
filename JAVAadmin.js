/* =========================================================
   FINA OLSHOP - FRONTEND ADMIN LOGIC
   File: JAVAadmin.js
   ========================================================= */

// ⚠️ GANTI URL DI BAWAH DENGAN URL DEPLOYMENT WEB APP APPS SCRIPT ANDA!
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwuZAWbFjKdWCU-Lsr-eB-Io0mZaDtNc8JpAkVo-3S4RSm_59cLE2-EDEWCMjnpJtG38g/exec";

var rawOrdersData = [];
var rawProductsData = [];
var rawPromosData = [];
var uploadedImages = [];

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

document.addEventListener('DOMContentLoaded', function() {
    var inputEl = document.getElementById('adminAuthInput');
    if (inputEl) inputEl.focus();
});

async function verifyAdminAccess(e) {
    e.preventDefault();
    var inputPwd = document.getElementById('adminAuthInput').value.trim();
    var btn = document.getElementById('btnAdminAuthSubmit');

    btn.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Memeriksa...';
    btn.disabled = true;

    try {
        let res = await apiPost('verifyAdminPassword', { password: inputPwd });
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Masuk Dashboard';
        btn.disabled = false;

        if (res && res.success) {
            document.getElementById('adminAuthOverlay').classList.add('hidden');
            document.getElementById('adminDashboardContent').classList.remove('hidden');

            loadAdminOrders();
            loadAdminProducts();
            loadAdminPromos();
            loadAdminSettings();
        } else {
            showPremiumAlert("Akses Ditolak", "Kata sandi yang Anda masukkan salah. Silakan coba lagi!", "error");
        }
    } catch(err) {
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Masuk Dashboard';
        btn.disabled = false;
        showPremiumAlert("Gagal", "Terjadi kesalahan koneksi sistem.", "error");
    }
}

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
            '<button id="btnConfirmOk" class="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2 rounded-xl font-bold text-xs transition shadow-md">Ya, Lanjutkan</button>';
        document.getElementById('btnConfirmOk').onclick = function() {
            closePremiumAlert();
            if (confirmCallback) confirmCallback();
        };
    } else {
        actionsEl.innerHTML = '<button onclick="closePremiumAlert()" class="bg-amber-800 hover:bg-amber-900 text-white px-6 py-2 rounded-xl font-bold text-xs transition shadow-md">Mengerti</button>';
    }

    modal.classList.remove('hidden');
}

function closePremiumAlert() { document.getElementById('premiumAlertModal').classList.add('hidden'); }

function switchTab(tab) {
    var tabs = ['tabOrders', 'tabProducts', 'tabPromos', 'tabSettings'];
    var btns = ['tabBtnOrders', 'tabBtnProducts', 'tabBtnPromos', 'tabBtnSettings'];

    tabs.forEach(function(t) { document.getElementById(t).classList.add('hidden'); });
    btns.forEach(function(b) { 
        document.getElementById(b).className = "pb-3 px-3 text-amber-800/60 hover:text-amber-900 font-bold transition flex items-center gap-2 whitespace-nowrap"; 
    });

    if (tab === 'orders') {
        document.getElementById('tabOrders').classList.remove('hidden');
        document.getElementById('tabBtnOrders').className = "pb-3 px-3 border-b-2 border-amber-800 text-amber-900 font-bold transition flex items-center gap-2 whitespace-nowrap";
    } else if (tab === 'products') {
        document.getElementById('tabProducts').classList.remove('hidden');
        document.getElementById('tabBtnProducts').className = "pb-3 px-3 border-b-2 border-amber-800 text-amber-900 font-bold transition flex items-center gap-2 whitespace-nowrap";
    } else if (tab === 'promos') {
        document.getElementById('tabPromos').classList.remove('hidden');
        document.getElementById('tabBtnPromos').className = "pb-3 px-3 border-b-2 border-amber-800 text-amber-900 font-bold transition flex items-center gap-2 whitespace-nowrap";
    } else if (tab === 'settings') {
        document.getElementById('tabSettings').classList.remove('hidden');
        document.getElementById('tabBtnSettings').className = "pb-3 px-3 border-b-2 border-amber-800 text-amber-900 font-bold transition flex items-center gap-2 whitespace-nowrap";
    }
}

// ==================== ORDERS ====================
async function loadAdminOrders() {
    var tbody = document.getElementById('adminOrdersTable');
    tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-amber-800"><i class="fa-solid fa-spinner fa-spin text-2xl text-amber-600 mb-2 block"></i><span>Memuat data pesanan...</span></td></tr>';

    try {
        let orders = await apiGet('getOrders');
        rawOrdersData = Array.isArray(orders) ? orders : [];
        updateOrderStatistics(rawOrdersData);
        renderAdminOrdersTable(rawOrdersData);
    } catch(e) {}
}

function updateOrderStatistics(orders) {
    document.getElementById('statTotalOrders').innerText = orders.length;
    document.getElementById('statPendingOrders').innerText = orders.filter(function(o) { return String(o.status).trim().toUpperCase() === 'PENDING'; }).length;
    document.getElementById('statProcessingOrders').innerText = orders.filter(function(o) { 
        var st = String(o.status).trim().toUpperCase();
        return st === 'DIPROSES' || st === 'SEDANG DIKEMAS' || st === 'SIAP DIAMBIL'; 
    }).length;
    document.getElementById('statCompletedOrders').innerText = orders.filter(function(o) { return String(o.status).trim().toUpperCase() === 'SELESAI'; }).length;
}

function filterAdminOrders() {
    var searchQuery = document.getElementById('orderSearchInput').value.toLowerCase().trim();
    var statusFilter = document.getElementById('orderStatusFilter').value.toUpperCase();

    var filtered = rawOrdersData.filter(function(o) {
        var matchSearch = (o.orderId && o.orderId.toLowerCase().indexOf(searchQuery) !== -1) ||
                            (o.customerName && o.customerName.toLowerCase().indexOf(searchQuery) !== -1) ||
                            (o.phone && o.phone.toLowerCase().indexOf(searchQuery) !== -1);
        var currentStatus = o.status ? String(o.status).trim().toUpperCase() : 'PENDING';
        return matchSearch && ((statusFilter === 'ALL') || (currentStatus === statusFilter));
    });

    renderAdminOrdersTable(filtered);
}

function renderAdminOrdersTable(orders) {
    var tbody = document.getElementById('adminOrdersTable');
    if (!orders || orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="p-8 text-center text-amber-800 font-semibold">Tidak ada data pesanan.</td></tr>';
        return;
    }

    var statusList = ["PENDING", "DIPROSES", "SEDANG DIKEMAS", "SIAP DIAMBIL", "SEGERA DIKIRIM", "DALAM PENGIRIMAN", "DIKIRIM", "SELESAI", "CANCEL"];

    tbody.innerHTML = orders.map(function(o) {
        var price = (o.totalPrice && !isNaN(o.totalPrice)) ? Number(o.totalPrice) : 0;
        var statusVal = o.status ? String(o.status).trim().toUpperCase() : 'PENDING';
        var cleanPhone = o.phone ? String(o.phone).replace(/[^0-9]/g, '') : '';
        var waLink = cleanPhone ? 'https://wa.me/' + (cleanPhone.indexOf('0') === 0 ? '62' + cleanPhone.slice(1) : cleanPhone) : '#';

        var optionsHtml = statusList.map(function(st) {
            return '<option value="' + st + '" ' + (statusVal === st ? 'selected' : '') + '>' + st + '</option>';
        }).join('');

        return '<tr class="hover:bg-amber-50/80 transition text-xs">' +
            '<td class="p-3.5 font-bold text-amber-900 border-b border-amber-100">' + (o.orderId || '-') + '</td>' +
            '<td class="p-3.5 border-b border-amber-100">' +
                '<div class="font-bold text-amber-900">' + (o.customerName || '-') + '</div>' +
                '<a href="' + waLink + '" target="_blank" class="text-[11px] text-emerald-600 hover:underline inline-flex items-center gap-1 font-semibold mt-0.5"><i class="fa-brands fa-whatsapp"></i> ' + (o.phone || '-') + '</a>' +
            '</td>' +
            '<td class="p-3.5 border-b border-amber-100"><span class="font-semibold text-amber-900">' + (o.shippingMethod || '-') + '</span></td>' +
            '<td class="p-3.5 font-medium text-amber-900 border-b border-amber-100">' + (o.deliveryDateTime || '-') + '</td>' +
            '<td class="p-3.5 border-b border-amber-100"><div class="whitespace-pre-line leading-relaxed text-amber-900">' + (o.itemsDetail || '-') + '</div></td>' +
            '<td class="p-3.5 font-extrabold text-rose-600 border-b border-amber-100 whitespace-nowrap">Rp ' + price.toLocaleString('id-ID') + '</td>' +
            '<td class="p-3.5 border-b border-amber-100"><span class="px-2.5 py-1 rounded-full text-[10px] font-bold inline-block ' + getStatusBadgeClass(statusVal) + '">' + statusVal + '</span></td>' +
            '<td class="p-3.5 border-b border-amber-100"><select onchange="changeStatus(' + o.rowIndex + ', this.value)" class="text-[11px] p-1.5 border border-amber-200 rounded-lg bg-white font-semibold text-amber-900 outline-none cursor-pointer hover:border-amber-400 transition">' + optionsHtml + '</select></td>' +
        '</tr>';
    }).join('');
}

function getStatusBadgeClass(status) {
    if (status === 'SELESAI') return 'bg-emerald-100 text-emerald-800 border border-emerald-200';
    if (status === 'DIPROSES' || status === 'SEDANG DIKEMAS') return 'bg-amber-100 text-amber-800 border border-amber-200';
    if (status === 'SIAP DIAMBIL') return 'bg-purple-100 text-purple-800 border border-purple-200';
    if (status === 'SEGERA DIKIRIM' || status === 'DALAM PENGIRIMAN' || status === 'DIKIRIM') return 'bg-blue-100 text-blue-800 border border-blue-200';
    if (status === 'CANCEL') return 'bg-gray-200 text-gray-800 border border-gray-300';
    return 'bg-rose-100 text-rose-800 border border-rose-200';
}

async function changeStatus(rowIndex, status) {
    await apiPost('updateOrderStatus', { rowIndex: rowIndex, status: status });
    showPremiumAlert("Status Diperbarui", "Status pesanan berhasil diubah menjadi " + status, "success");
    loadAdminOrders(); 
}

async function setAdminStoreStatus(status) {
    await apiPost('setStoreStatus', { status: status });
    showPremiumAlert("Status Toko", "Status operasional toko diubah menjadi: " + status, "success");
}

// ==================== PRODUCTS ====================
function toggleVariantInputs(val) {
    var boxVariants = document.getElementById('variantPriceInputs');
    var boxPaket = document.getElementById('paketPriceInputs');
    
    if (val === 'BOTH') {
        boxVariants.classList.remove('hidden');
        boxPaket.classList.add('hidden');
        var container = document.getElementById('dynamicVariantsContainer');
        if (container.children.length === 0) {
            addVariantInputRow("Varian 1", "");
        }
    } else if (val === 'PAKET') {
        boxVariants.classList.add('hidden');
        boxPaket.classList.remove('hidden');
    } else {
        boxVariants.classList.add('hidden');
        boxPaket.classList.add('hidden');
    }
}

function addVariantInputRow(nameVal, priceVal) {
    var container = document.getElementById('dynamicVariantsContainer');
    var row = document.createElement('div');
    row.className = 'flex items-center gap-2 variant-row';
    row.innerHTML = 
        '<input type="text" placeholder="Nama Varian" value="' + (nameVal || '') + '" class="variant-name flex-1 p-2 bg-white border border-amber-200 rounded-xl outline-none text-xs">' +
        '<input type="number" placeholder="Harga (Rp)" value="' + (priceVal || '') + '" class="variant-price w-32 p-2 bg-white border border-amber-200 rounded-xl outline-none text-xs">' +
        '<button type="button" onclick="removeVariantInputRow(this)" class="bg-rose-100 text-rose-600 hover:bg-rose-200 p-2 rounded-xl text-xs font-bold transition"><i class="fa-solid fa-trash-can"></i></button>';
    container.appendChild(row);
}

function removeVariantInputRow(btn) {
    var row = btn.closest('.variant-row');
    if (row) row.remove();
}

function handleMultiImageUpload(e) {
    var files = e.target.files;
    if (!files || files.length === 0) return;
    if (uploadedImages.length + files.length > 5) return showPremiumAlert("Batas Maksimal Foto", "Maksimal hanya 5 foto per kue!", "error");

    var txt = document.getElementById('uploadProgressText');
    txt.innerText = "Mengunggah " + files.length + " foto...";

    var uploadPromises = Array.from(files).map(function(file) {
        return new Promise(function(resolve, reject) {
            var reader = new FileReader();
            reader.onload = function(evt) {
                var img = new Image();
                img.src = evt.target.result;
                img.onload = function() {
                    var canvas = document.createElement('canvas');
                    var MAX_WIDTH = 800, MAX_HEIGHT = 800;
                    var width = img.width, height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                    } else {
                        if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
                    }

                    canvas.width = width; canvas.height = height;
                    var ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    apiPost('uploadImage', { base64Data: canvas.toDataURL('image/jpeg', 0.75), fileName: "Kue_" + new Date().getTime() + ".jpg" })
                        .then(res => resolve(res.url))
                        .catch(err => reject(err));
                };
            };
            reader.readAsDataURL(file);
        });
    });

    Promise.all(uploadPromises).then(function(urls) {
        uploadedImages = uploadedImages.concat(urls);
        txt.innerText = "Berhasil diunggah!";
        renderMultiImagePreviews();
    }).catch(function(err) {
        txt.innerText = "Gagal!";
        showPremiumAlert("Upload Gagal", "Gagal mengunggah foto ke Drive", "error");
    });
}

function renderMultiImagePreviews() {
    var container = document.getElementById('multiImagePreviewContainer');
    document.getElementById('photoCountBadge').innerText = uploadedImages.length + "/5 Foto";

    if (uploadedImages.length === 0) {
        container.innerHTML = '<span class="col-span-5 text-[10px] text-amber-800/60 italic">Belum ada foto diunggah.</span>';
        return;
    }

    container.innerHTML = uploadedImages.map(function(url, idx) {
        return '<div class="relative group rounded-xl overflow-hidden border border-amber-200 h-16 bg-amber-100">' +
            '<img src="' + url + '" class="w-full h-full object-cover">' +
            '<button type="button" onclick="removeUploadedImage(' + idx + ')" class="absolute top-1 right-1 bg-rose-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold shadow-md hover:bg-rose-700 transition">' +
                '<i class="fa-solid fa-xmark"></i>' +
            '</button>' +
        '</div>';
    }).join('');
}

function removeUploadedImage(idx) {
    uploadedImages.splice(idx, 1);
    renderMultiImagePreviews();
}

async function loadAdminProducts() {
    var grid = document.getElementById('adminProductsGrid');
    grid.innerHTML = '<div class="col-span-full text-center py-12 text-amber-800"><i class="fa-solid fa-spinner fa-spin text-2xl text-amber-600 mb-2 block"></i><span>Memuat katalog kue...</span></div>';

    try {
        let prods = await apiGet('getProducts');
        rawProductsData = Array.isArray(prods) ? prods : [];
        if (rawProductsData.length === 0) {
            grid.innerHTML = '<div class="col-span-full text-center py-8 text-amber-800 font-semibold">Tidak ada kue di katalog.</div>';
            return;
        }

        grid.innerHTML = rawProductsData.map(function(p) {
            var mainImg = (p.images && p.images.length > 0) ? p.images[0] : p.image;
            var totalPhotos = (p.images && p.images.length > 0) ? p.images.length : 1;

            return '<div class="bg-white p-4 rounded-3xl border border-amber-100 shadow-sm flex flex-col justify-between gap-3 hover:shadow-md transition">' +
                '<div class="flex items-center gap-3">' +
                    '<div class="relative w-16 h-16 flex-shrink-0">' +
                        '<img src="' + mainImg + '" alt="' + p.name + '" class="w-16 h-16 object-cover rounded-2xl border border-amber-100">' +
                        '<span class="absolute -bottom-1 -right-1 bg-amber-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full"><i class="fa-solid fa-images mr-0.5"></i>' + totalPhotos + '</span>' +
                    '</div>' +
                    '<div class="flex-1 min-w-0">' +
                        '<span class="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">' + p.category + '</span>' +
                        '<h4 class="font-serif font-bold text-xs truncate text-amber-900 mt-1">' + p.name + '</h4>' +
                        '<p class="text-[11px] font-bold text-amber-900 mt-0.5">Rp ' + Number(p.price).toLocaleString('id-ID') + ' / ' + p.size + '</p>' +
                    '</div>' +
                '</div>' +

                '<div class="flex items-center justify-between pt-2 border-t border-amber-100 text-xs">' +
                    '<button onclick="toggleStock(' + p.rowIndex + ', ' + p.isAvailable + ')" class="px-2.5 py-1 rounded-lg font-bold text-[11px] ' + (p.isAvailable ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800') + '">' +
                        (p.isAvailable ? 'Set Habis' : 'Set Ada') +
                    '</button>' +
                    '<div class="flex gap-2">' +
                        '<button onclick="openEditProductModal(' + p.rowIndex + ')" class="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 font-bold"><i class="fa-solid fa-pen-to-square"></i> Edit</button>' +
                        '<button onclick="confirmDeleteProduct(' + p.rowIndex + ', \'' + p.name + '\')" class="bg-rose-50 text-rose-600 p-1.5 rounded-lg hover:bg-rose-100 font-bold"><i class="fa-solid fa-trash-can"></i> Hapus</button>' +
                    '</div>' +
                '</div>' +
            '</div>';
        }).join('');
    } catch(e) {}
}

async function toggleStock(rowIndex, currentStatus) {
    await apiPost('toggleProductAvailability', { rowIndex: rowIndex, currentStatus: currentStatus });
    loadAdminProducts();
}

function openAddProductModal() {
    document.getElementById('crudModalTitle').innerText = "Tambah Kue Baru";
    document.getElementById('crudForm').reset();
    document.getElementById('crudRowIndex').value = "";
    document.getElementById('uploadProgressText').innerText = "";
    document.getElementById('dynamicVariantsContainer').innerHTML = "";
    uploadedImages = [];
    renderMultiImagePreviews();
    document.getElementById('crudVariantType').value = "SINGLE";
    toggleVariantInputs("SINGLE");
    document.getElementById('productCrudModal').classList.remove('hidden');
}

function openEditProductModal(rowIndex) {
    var p = rawProductsData.find(function(item) { return item.rowIndex == rowIndex; });
    if (!p) return;

    document.getElementById('crudModalTitle').innerText = "Edit Data Kue";
    document.getElementById('crudRowIndex').value = p.rowIndex;
    document.getElementById('crudName').value = p.name;
    document.getElementById('crudCategory').value = p.category;
    document.getElementById('crudPrice').value = p.price;
    document.getElementById('crudSize').value = p.size;
    document.getElementById('crudIsPo').value = String(p.isPo);
    document.getElementById('crudPoDays').value = p.poDays || 0;
    document.getElementById('crudDesc').value = p.description;
    document.getElementById('crudIngredients').value = p.ingredients ? p.ingredients.join(', ') : '';
    document.getElementById('crudShelfLife').value = p.shelfLife || '3 Hari Suhu Ruang';

    uploadedImages = (p.images && p.images.length > 0) ? p.images : (p.image ? [p.image] : []);
    renderMultiImagePreviews();

    var vType = p.variantType || "SINGLE";
    document.getElementById('crudVariantType').value = vType;
    
    var container = document.getElementById('dynamicVariantsContainer');
    container.innerHTML = "";

    if (vType === 'BOTH' && p.variants && p.variants.length > 0) {
        p.variants.forEach(function(v) { addVariantInputRow(v.name, v.price); });
    } else if (vType === 'PAKET') {
        document.getElementById('crudPricePaket').value = (p.variants && p.variants[0]) ? p.variants[0].price : p.price;
    }

    toggleVariantInputs(vType);
    document.getElementById('productCrudModal').classList.remove('hidden');
}

function closeProductCrudModal() { document.getElementById('productCrudModal').classList.add('hidden'); }

async function saveProductSubmit(e) {
    e.preventDefault();
    if (uploadedImages.length === 0) return showPremiumAlert("Peringatan", "Wajib mengunggah minimal 1 foto kue!", "error");

    var btn = document.getElementById('btnSaveCrud');
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    var rowIndex = document.getElementById('crudRowIndex').value;
    var vType = document.getElementById('crudVariantType').value;
    
    var variantsArr = [];
    if (vType === 'BOTH') {
        var rows = document.querySelectorAll('#dynamicVariantsContainer .variant-row');
        rows.forEach(function(r) {
            var vName = r.querySelector('.variant-name').value.trim();
            var vPrice = Number(r.querySelector('.variant-price').value);
            if (vName && !isNaN(vPrice)) variantsArr.push({ name: vName, price: vPrice });
        });
        if (variantsArr.length === 0) {
            btn.innerText = "Simpan Data"; btn.disabled = false;
            return showPremiumAlert("Peringatan", "Tambahkan minimal 1 varian untuk Banyak Variasi!", "error");
        }
    } else if (vType === 'PAKET') {
        var paketPrice = Number(document.getElementById('crudPricePaket').value) || Number(document.getElementById('crudPrice').value);
        variantsArr = [{ name: "Paket", price: paketPrice }];
    } else {
        variantsArr = [{ name: "Satuan", price: Number(document.getElementById('crudPrice').value) }];
    }

    var productPayload = {
        rowIndex: rowIndex ? Number(rowIndex) : null,
        name: document.getElementById('crudName').value.trim(),
        category: document.getElementById('crudCategory').value,
        price: Number(document.getElementById('crudPrice').value),
        size: document.getElementById('crudSize').value.trim(),
        isPo: document.getElementById('crudIsPo').value === 'true',
        poDays: Number(document.getElementById('crudPoDays').value) || 0,
        image: uploadedImages[0],
        images: uploadedImages,
        description: document.getElementById('crudDesc').value.trim(),
        ingredients: document.getElementById('crudIngredients').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean),
        shelfLife: document.getElementById('crudShelfLife').value.trim(),
        variantType: vType,
        variants: variantsArr
    };

    var action = rowIndex ? 'updateProduct' : 'addProduct';
    await apiPost(action, { product: productPayload });

    showPremiumAlert("Berhasil", "Data kue berhasil disimpan!", "success");
    btn.innerText = "Simpan Data"; btn.disabled = false;
    closeProductCrudModal();
    loadAdminProducts();
}

function confirmDeleteProduct(rowIndex, productName) {
    showPremiumAlert("Hapus Kue", "Apakah Anda yakin ingin menghapus kue '" + productName + "'?", "confirm", async function() {
        await apiPost('deleteProduct', { rowIndex: rowIndex });
        showPremiumAlert("Terhapus", "Data kue berhasil dihapus!", "success");
        loadAdminProducts();
    });
}

// ==================== PROMOS ====================
async function loadAdminPromos() {
    var tbody = document.getElementById('adminPromosTable');
    tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-amber-800"><i class="fa-solid fa-spinner fa-spin text-2xl text-amber-600 mb-2 block"></i><span>Memuat data promo...</span></td></tr>';

    try {
        let promos = await apiGet('getPromos');
        rawPromosData = Array.isArray(promos) ? promos : [];
        if (rawPromosData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="p-8 text-center text-amber-800 font-semibold">Belum ada kode promo.</td></tr>';
            return;
        }

        tbody.innerHTML = rawPromosData.map(function(p) {
            var discText = p.discountType === 'PERCENT' ? p.discountValue + '%' : 'Rp ' + Number(p.discountValue).toLocaleString('id-ID');
            
            return '<tr class="hover:bg-amber-50/80 transition text-xs">' +
                '<td class="p-3.5 font-bold text-amber-900 border-b border-amber-100"><span class="bg-amber-100 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200">' + p.code + '</span></td>' +
                '<td class="p-3.5 font-extrabold text-rose-600 border-b border-amber-100">' + discText + '</td>' +
                '<td class="p-3.5 font-medium text-amber-900 border-b border-amber-100">Rp ' + Number(p.minSpend).toLocaleString('id-ID') + '</td>' +
                '<td class="p-3.5 border-b border-amber-100">' + (p.expiryDate || 'Selamanya') + '</td>' +
                '<td class="p-3.5 border-b border-amber-100">' +
                    '<button onclick="togglePromo(' + p.rowIndex + ', ' + p.isActive + ')" class="px-2.5 py-1 rounded-lg font-bold text-[10px] ' + (p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-700') + '">' +
                        (p.isActive ? 'Aktif' : 'Nonaktif') +
                    '</button>' +
                '</td>' +
                '<td class="p-3.5 border-b border-amber-100">' +
                    '<div class="flex gap-2">' +
                        '<button onclick="openEditPromoModal(' + p.rowIndex + ')" class="bg-blue-50 text-blue-600 p-1.5 rounded-lg hover:bg-blue-100 font-bold"><i class="fa-solid fa-pen-to-square"></i></button>' +
                        '<button onclick="confirmDeletePromo(' + p.rowIndex + ', \'' + p.code + '\')" class="bg-rose-50 text-rose-600 p-1.5 rounded-lg hover:bg-rose-100 font-bold"><i class="fa-solid fa-trash-can"></i></button>' +
                    '</div>' +
                '</td>' +
            '</tr>';
        }).join('');
    } catch(e) {}
}

async function togglePromo(rowIndex, currentStatus) {
    await apiPost('togglePromoStatus', { rowIndex: rowIndex, currentStatus: currentStatus });
    loadAdminPromos();
}

function openAddPromoModal() {
    document.getElementById('promoModalTitle').innerText = "Tambah Promo Baru";
    document.getElementById('promoForm').reset();
    document.getElementById('promoRowIndex').value = "";
    document.getElementById('promoCrudModal').classList.remove('hidden');
}

function openEditPromoModal(rowIndex) {
    var p = rawPromosData.find(function(item) { return item.rowIndex == rowIndex; });
    if (!p) return;

    document.getElementById('promoModalTitle').innerText = "Edit Kode Promo";
    document.getElementById('promoRowIndex').value = p.rowIndex;
    document.getElementById('promoCode').value = p.code;
    document.getElementById('promoType').value = p.discountType;
    document.getElementById('promoValue').value = p.discountValue;
    document.getElementById('promoMinSpend').value = p.minSpend;
    document.getElementById('promoExpiry').value = p.expiryDate;

    document.getElementById('promoCrudModal').classList.remove('hidden');
}

function closePromoCrudModal() { document.getElementById('promoCrudModal').classList.add('hidden'); }

async function savePromoSubmit(e) {
    e.preventDefault();
    var btn = document.getElementById('btnSavePromo');
    btn.innerText = "Menyimpan..."; btn.disabled = true;

    var rowIndex = document.getElementById('promoRowIndex').value;
    var promoPayload = {
        rowIndex: rowIndex ? Number(rowIndex) : null,
        code: document.getElementById('promoCode').value.trim().toUpperCase(),
        discountType: document.getElementById('promoType').value,
        discountValue: Number(document.getElementById('promoValue').value),
        minSpend: Number(document.getElementById('promoMinSpend').value) || 0,
        expiryDate: document.getElementById('promoExpiry').value
    };

    var action = rowIndex ? 'updatePromo' : 'addPromo';
    await apiPost(action, { promo: promoPayload });

    showPremiumAlert("Berhasil", "Kode promo berhasil disimpan!", "success");
    btn.innerText = "Simpan Promo"; btn.disabled = false;
    closePromoCrudModal();
    loadAdminPromos();
}

function confirmDeletePromo(rowIndex, code) {
    showPremiumAlert("Hapus Promo", "Apakah Anda yakin ingin menghapus kode promo '" + code + "'?", "confirm", async function() {
        await apiPost('deletePromo', { rowIndex: rowIndex });
        showPremiumAlert("Terhapus", "Kode promo berhasil dihapus!", "success");
        loadAdminPromos();
    });
}

// ==================== SETTINGS ====================
async function loadAdminSettings() {
    try {
        let s = await apiGet('getSettings');
        if (s) {
            if (s.logoUrl) document.getElementById('settingLogoUrl').value = s.logoUrl;
            if (s.qrisUrl) document.getElementById('settingQrisUrl').value = s.qrisUrl;
            if (s.bankInfo) document.getElementById('settingBankInfo').value = s.bankInfo;
            if (s.paymentQrisStatus) document.getElementById('statusQrisPay').value = s.paymentQrisStatus;
            if (s.paymentTransferStatus) document.getElementById('statusTransferPay').value = s.paymentTransferStatus;
            if (s.paymentCodStatus) document.getElementById('statusCodPay').value = s.paymentCodStatus;
            if (s.storeAnnouncement) document.getElementById('settingStoreAnnouncement').value = s.storeAnnouncement;
        }
    } catch(e) {}
}

async function saveAnnouncementSettings() {
    var announcement = document.getElementById('settingStoreAnnouncement').value.trim();
    if (!announcement) return showPremiumAlert("Peringatan", "Teks pengumuman tidak boleh kosong", "error");
    await apiPost('updateStoreAnnouncement', { announcement: announcement });
    showPremiumAlert("Berhasil", "Teks pengumuman toko berhasil disimpan!", "success");
}

async function savePaymentStatusSettings() {
    var qrisSt = document.getElementById('statusQrisPay').value;
    var transferSt = document.getElementById('statusTransferPay').value;
    var codSt = document.getElementById('statusCodPay').value;

    await apiPost('updatePaymentMethodStatus', { qrisStatus: qrisSt, transferStatus: transferSt, codStatus: codSt });
    showPremiumAlert("Berhasil", "Status metode pembayaran berhasil diperbarui!", "success");
}

async function saveLogoSettings() {
    var url = document.getElementById('settingLogoUrl').value.trim();
    if (!url) return showPremiumAlert("Peringatan", "URL Logo tidak boleh kosong", "error");
    await apiPost('updateLogoUrl', { url: url });
    showPremiumAlert("Berhasil", "URL Logo berhasil disimpan!", "success");
}

async function saveQrisSettings() {
    var qris = document.getElementById('settingQrisUrl').value.trim();
    var bank = document.getElementById('settingBankInfo').value.trim();
    if (!qris || !bank) return showPremiumAlert("Peringatan", "URL QRIS & Rekening tidak boleh kosong", "error");
    await apiPost('updateQrisSettings', { qrisUrl: qris, bankInfo: bank });
    showPremiumAlert("Berhasil", "Pengaturan QRIS & Rekening berhasil disimpan!", "success");
}

async function savePasswordSettings() {
    var pwd = document.getElementById('settingNewPwd').value.trim();
    if (!pwd) return showPremiumAlert("Peringatan", "Kata sandi tidak boleh kosong", "error");
    await apiPost('updateAdminPassword', { newPassword: pwd });
    showPremiumAlert("Berhasil", "Kata sandi admin berhasil diperbarui!", "success");
    document.getElementById('settingNewPwd').value = "";
}