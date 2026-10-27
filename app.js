/* ============================================ */
/* APLIKASI KASIRKU - MAIN JAVASCRIPT           */
/* File ini berisi semua logika aplikasi        */
/* ============================================ */

// ============================================
// 1. INISIALISASI DATA & STATE
// ============================================

// Kunci untuk LocalStorage
const STORAGE_KEYS = {
    PRODUK: 'kasirku_produk',
    TRANSAKSI: 'kasirku_transaksi',
    RESTOCK: 'kasirku_restock',
    PENGINGAT: 'kasirku_pengingat',
    PENGATURAN: 'kasirku_pengaturan'
};

// State aplikasi (data yang sedang aktif)
let state = {
    produk: [],
    transaksi: [],
    restock: [],
    pengingat: [],
    pengaturan: {
        namaToko: 'Toko Saya',
        alamatToko: '',
        mataUang: 'Rp'
    },
    keranjang: [],
    halamanAktif: 'dashboard'
};

// ============================================
// 2. FUNGSI UTILITAS (HELPER)
// ============================================

/**
 * Format angka menjadi mata uang Rupiah
 * @param {number} angka - Angka yang akan diformat
 * @returns {string} - Format Rupiah (contoh: Rp 10.000)
 */
function formatRupiah(angka) {
    return 'Rp ' + Math.round(angka).toLocaleString('id-ID');
}

/**
 * Format tanggal ke format Indonesia
 * @param {Date|string} tanggal - Objek Date atau string tanggal
 * @param {boolean} denganJam - Apakah ingin menampilkan jam
 * @returns {string} - Format tanggal Indonesia
 */
function formatTanggalIndonesia(tanggal, denganJam = true) {
    const date = typeof tanggal === 'string' ? new Date(tanggal) : tanggal;
    const opsi = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    };
    if (denganJam) {
        opsi.hour = '2-digit';
        opsi.minute = '2-digit';
        opsi.second = '2-digit';
    }
    return date.toLocaleDateString('id-ID', opsi) + (denganJam ? ' WIB' : '');
}

/**
 * Format tanggal singkat (untuk input date)
 * @param {Date} date - Objek Date
 * @returns {string} - Format YYYY-MM-DD
 */
function formatTanggalInput(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Generate ID unik untuk transaksi
 * @returns {string} - ID unik (contoh: TRX-20261027-001)
 */
function generateId(prefix = 'TRX') {
    const now = new Date();
    const dateStr = now.getFullYear().toString() +
                    String(now.getMonth() + 1).padStart(2, '0') +
                    String(now.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${prefix}-${dateStr}-${random}`;
}

/**
 * Simpan data ke LocalStorage
 * @param {string} key - Kunci penyimpanan
 * @param {any} data - Data yang akan disimpan
 */
function simpanKeStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (e) {
        console.error('Gagal menyimpan ke storage:', e);
        tampilkanToast('Gagal menyimpan data!', 'danger');
        return false;
    }
}

/**
 * Ambil data dari LocalStorage
 * @param {string} key - Kunci penyimpanan
 * @param {any} defaultData - Data default jika tidak ada
 * @returns {any} - Data yang diambil
 */
function ambilDariStorage(key, defaultData = []) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : defaultData;
    } catch (e) {
        console.error('Gagal mengambil dari storage:', e);
        return defaultData;
    }
}

/**
 * Tampilkan notifikasi toast
 * @param {string} pesan - Pesan yang ditampilkan
 * @param {string} tipe - Tipe (success, warning, danger, info)
 */
function tampilkanToast(pesan, tipe = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${tipe}`;
    toast.textContent = pesan;
    container.appendChild(toast);
    
    // Hilangkan setelah 3 detik
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ============================================
// 3. MUAT DATA AWAL
// ============================================

/**
 * Muat semua data dari LocalStorage ke state
 */
function muatSemuaData() {
    state.produk = ambilDariStorage(STORAGE_KEYS.PRODUK, []);
    state.transaksi = ambilDariStorage(STORAGE_KEYS.TRANSAKSI, []);
    state.restock = ambilDariStorage(STORAGE_KEYS.RESTOCK, []);
    state.pengingat = ambilDariStorage(STORAGE_KEYS.PENGINGAT, []);
    state.pengaturan = ambilDariStorage(STORAGE_KEYS.PENGATURAN, {
        namaToko: 'Toko Saya',
        alamatToko: '',
        mataUang: 'Rp'
    });
    
    // Jika belum ada data produk, tambahkan contoh
    if (state.produk.length === 0) {
        state.produk = [
            { id: 'P001', nama: 'Beras 5kg', kategori: 'Sembako', harga: 70000, stok: 20, minStok: 5 },
            { id: 'P002', nama: 'Minyak Goreng 2L', kategori: 'Sembako', harga: 35000, stok: 15, minStok: 5 },
            { id: 'P003', nama: 'Gula Pasir 1kg', kategori: 'Sembako', harga: 15000, stok: 3, minStok: 5 },
            { id: 'P004', nama: 'Kopi Sachet', kategori: 'Minuman', harga: 2000, stok: 50, minStok: 10 },
            { id: 'P005', nama: 'Teh Celup', kategori: 'Minuman', harga: 1000, stok: 2, minStok: 10 }
        ];
        simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
    }
}

// ============================================
// 4. NAVIGASI HALAMAN
// ============================================

/**
 * Pindah ke halaman tertentu
 * @param {string} halaman - Nama halaman
 */
function pindahHalaman(halaman) {
    // Sembunyikan semua halaman
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Tampilkan halaman yang dipilih
    const page = document.getElementById(`page-${halaman}`);
    if (page) {
        page.classList.add('active');
        state.halamanAktif = halaman;
        
        // Update judul header
        const judulMap = {
            dashboard: 'Dashboard',
            kasir: 'Kasir (POS)',
            produk: 'Produk & Stok',
            restock: 'Re-Stock',
            riwayat: 'Riwayat Transaksi',
            pengingat: 'Pengingat',
            pengaturan: 'Pengaturan'
        };
        document.getElementById('pageTitle').textContent = judulMap[halaman] || 'Dashboard';
        
        // Tandai tombol navigasi aktif
        const navBtn = document.querySelector(`[data-page="${halaman}"]`);
        if (navBtn) navBtn.classList.add('active');
        
        // Render konten halaman
        renderHalaman(halaman);
    }
    
    // Tutup sidebar di mobile
    document.getElementById('sidebar').classList.remove('active');
}

/**
 * Render konten halaman tertentu
 * @param {string} halaman - Nama halaman
 */
function renderHalaman(halaman) {
    switch(halaman) {
        case 'dashboard': renderDashboard(); break;
        case 'kasir': renderKasir(); break;
        case 'produk': renderProduk(); break;
        case 'restock': renderRestock(); break;
        case 'riwayat': renderRiwayat(); break;
        case 'pengingat': renderPengingat(); break;
        case 'pengaturan': renderPengaturan(); break;
    }
}

// ============================================
// 5. RENDER DASHBOARD
// ============================================

function renderDashboard() {
    // Hitung pendapatan hari ini
    const hariIni = formatTanggalInput(new Date());
    const transaksiHariIni = state.transaksi.filter(t => {
        const tgl = formatTanggalInput(new Date(t.tanggal));
        return tgl === hariIni && t.jenis === 'penjualan';
    });
    
    const pendapatanHariIni = transaksiHariIni.reduce((sum, t) => sum + t.total, 0);
    
    // Hitung stok menipis
    const stokMenipis = state.produk.filter(p => p.stok <= p.minStok);
    
    // Update statistik
    document.getElementById('statPendapatanHariIni').textContent = formatRupiah(pendapatanHariIni);
    document.getElementById('statTransaksiHariIni').textContent = transaksiHariIni.length;
    document.getElementById('statTotalProduk').textContent = state.produk.length;
    document.getElementById('statStokMenipis').textContent = stokMenipis.length;
    
    // Render daftar stok menipis
    const daftarStok = document.getElementById('daftarStokMenipis');
    if (stokMenipis.length === 0) {
        daftarStok.innerHTML = '<p class="empty-state">Semua stok aman 👍</p>';
    } else {
        daftarStok.innerHTML = stokMenipis.map(p => `
            <div class="list-item">
                <div>
                    <strong>${p.nama}</strong>
                    <br><small class="badge-status low">Stok: ${p.stok} (Min: ${p.minStok})</small>
                </div>
                <button class="btn btn-sm btn-primary" onclick="bukaFormRestock('${p.id}')">+ Restock</button>
            </div>
        `).join('');
    }
    
    // Render pengingat aktif
    const pengingatAktif = state.pengingat.filter(p => p.aktif);
    const daftarPengingat = document.getElementById('daftarPengingatAktif');
    if (pengingatAktif.length === 0) {
        daftarPengingat.innerHTML = '<p class="empty-state">Tidak ada pengingat</p>';
    } else {
        daftarPengingat.innerHTML = pengingatAktif.map(p => `
            <div class="list-item">
                <div>
                    <strong>${p.judul}</strong>
                    <br><small>${p.pesan}</small>
                </div>
                <small>${p.waktu}</small>
            </div>
        `).join('');
    }
}

// ============================================
// 6. RENDER KASIR (POS)
// ============================================

function renderKasir() {
    const grid = document.getElementById('produkGridKasir');
    const search = document.getElementById('searchProdukKasir').value.toLowerCase();
    
    const produkFilter = state.produk.filter(p => 
        p.nama.toLowerCase().includes(search)
    );
    
    if (produkFilter.length === 0) {
        grid.innerHTML = '<p class="empty-state">Tidak ada produk ditemukan</p>';
    } else {
        grid.innerHTML = produkFilter.map(p => `
            <div class="product-card ${p.stok <= 0 ? 'out-of-stock' : ''}" 
                 onclick="${p.stok > 0 ? `tambahKeKeranjang('${p.id}')` : ''}">
                <div class="product-name">${p.nama}</div>
                <div class="product-price">${formatRupiah(p.harga)}</div>
                <div class="product-stock">Stok: ${p.stok}</div>
            </div>
        `).join('');
    }
    
    renderKeranjang();
}

/**
 * Tambah produk ke keranjang
 * @param {string} produkId - ID produk
 */
function tambahKeKeranjang(produkId) {
    const produk = state.produk.find(p => p.id === produkId);
    if (!produk) return;
    
    // Cek apakah sudah ada di keranjang
    const itemKeranjang = state.keranjang.find(k => k.id === produkId);
    
    if (itemKeranjang) {
        // Cek stok
        if (itemKeranjang.qty >= produk.stok) {
            tampilkanToast('Stok tidak mencukupi!', 'warning');
            return;
        }
        itemKeranjang.qty++;
    } else {
        state.keranjang.push({
            id: produk.id,
            nama: produk.nama,
            harga: produk.harga,
            qty: 1
        });
    }
    
    renderKeranjang();
}

/**
 * Render tampilan keranjang
 */
function renderKeranjang() {
    const container = document.getElementById('cartItems');
    
    if (state.keranjang.length === 0) {
        container.innerHTML = '<p class="empty-state">Keranjang kosong</p>';
    } else {
        container.innerHTML = state.keranjang.map((item, idx) => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <div class="cart-item-name">${item.nama}</div>
                    <div class="cart-item-price">${formatRupiah(item.harga)} x ${item.qty}</div>
                </div>
                <div class="cart-item-qty">
                    <button onclick="ubahQtyKeranjang(${idx}, -1)">-</button>
                    <input type="number" value="${item.qty}" min="1" 
                           onchange="setQtyKeranjang(${idx}, this.value)">
                    <button onclick="ubahQtyKeranjang(${idx}, 1)">+</button>
                </div>
                <button class="cart-item-remove" onclick="hapusDariKeranjang(${idx})">×</button>
            </div>
        `).join('');
    }
    
    // Hitung total
    const subtotal = state.keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const bayar = parseInt(document.getElementById('inputBayar').value) || 0;
    const kembalian = bayar - subtotal;
    
    document.getElementById('cartSubtotal').textContent = formatRupiah(subtotal);
    document.getElementById('cartTotal').textContent = formatRupiah(subtotal);
    document.getElementById('cartKembalian').textContent = formatRupiah(kembalian >= 0 ? kembalian : 0);
}

/**
 * Ubah qty keranjang (+/-)
 */
function ubahQtyKeranjang(idx, delta) {
    const item = state.keranjang[idx];
    const produk = state.produk.find(p => p.id === item.id);
    const newQty = item.qty + delta;
    
    if (newQty < 1) {
        hapusDariKeranjang(idx);
        return;
    }
    
    if (newQty > produk.stok) {
        tampilkanToast('Stok tidak mencukupi!', 'warning');
        return;
    }
    
    item.qty = newQty;
    renderKeranjang();
}

/**
 * Set qty keranjang dari input
 */
function setQtyKeranjang(idx, value) {
    const qty = parseInt(value);
    const item = state.keranjang[idx];
    const produk = state.produk.find(p => p.id === item.id);
    
    if (isNaN(qty) || qty < 1) {
        hapusDariKeranjang(idx);
        return;
    }
    
    if (qty > produk.stok) {
        tampilkanToast('Stok tidak mencukupi!', 'warning');
        item.qty = produk.stok;
    } else {
        item.qty = qty;
    }
    
    renderKeranjang();
}

/**
 * Hapus item dari keranjang
 */
function hapusDariKeranjang(idx) {
    state.keranjang.splice(idx, 1);
    renderKeranjang();
}

/**
 * Proses pembayaran
 */
function prosesPembayaran() {
    if (state.keranjang.length === 0) {
        tampilkanToast('Keranjang masih kosong!', 'warning');
        return;
    }
    
    const total = state.keranjang.reduce((sum, item) => sum + (item.harga * item.qty), 0);
    const bayar = parseInt(document.getElementById('inputBayar').value) || 0;
    
    if (bayar < total) {
        tampilkanToast('Uang pembayaran kurang!', 'danger');
        return;
    }
    
    // Buat transaksi
    const transaksi = {
        id: generateId('TRX'),
        tanggal: new Date().toISOString(),
        jenis: 'penjualan',
        items: [...state.keranjang],
        subtotal: total,
        bayar: bayar,
        kembalian: bayar - total,
        total: total
    };
    
    // Kurangi stok
    state.keranjang.forEach(item => {
        const produk = state.produk.find(p => p.id === item.id);
        if (produk) {
            produk.stok -= item.qty;
        }
    });
    
    // Simpan transaksi
    state.transaksi.push(transaksi);
    simpanKeStorage(STORAGE_KEYS.TRANSAKSI, state.transaksi);
    simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
    
    // Tampilkan struk
    tampilkanStruk(transaksi);
    
    // Reset keranjang
    state.keranjang = [];
    document.getElementById('inputBayar').value = '';
    renderKeranjang();
    renderKasir();
    
    tampilkanToast('Transaksi berhasil!', 'success');
}

/**
 * Tampilkan struk dalam modal
 */
function tampilkanStruk(transaksi) {
    const content = `
        <div style="text-align:center; font-family: monospace;">
            <h3>${state.pengaturan.namaToko}</h3>
            <p style="font-size:12px">${state.pengaturan.alamatToko}</p>
            <hr>
            <p><strong>${transaksi.id}</strong></p>
            <p>${formatTanggalIndonesia(transaksi.tanggal)}</p>
            <hr>
            ${transaksi.items.map(item => `
                <div style="display:flex; justify-content:space-between; text-align:left;">
                    <span>${item.nama}</span>
                    <span>${item.qty}x ${formatRupiah(item.harga)}</span>
                </div>
            `).join('')}
            <hr>
            <div style="display:flex; justify-content:space-between;">
                <strong>Total:</strong>
                <strong>${formatRupiah(transaksi.total)}</strong>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span>Bayar:</span>
                <span>${formatRupiah(transaksi.bayar)}</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
                <span>Kembalian:</span>
                <span>${formatRupiah(transaksi.kembalian)}</span>
            </div>
            <hr>
            <p>Terima kasih!</p>
        </div>
    `;
    bukaModal('Struk Pembayaran', content);
}

// ============================================
// 7. RENDER PRODUK
// ============================================

function renderProduk() {
    const tbody = document.getElementById('tabelProduk');
    const search = document.getElementById('searchProduk').value.toLowerCase();
    
    const produkFilter = state.produk.filter(p => 
        p.nama.toLowerCase().includes(search) || 
        p.kategori.toLowerCase().includes(search)
    );
    
    if (produkFilter.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada produk</td></tr>';
        return;
    }
    
    tbody.innerHTML = produkFilter.map(p => `
        <tr>
            <td><strong>${p.nama}</strong></td>
            <td>${p.kategori}</td>
            <td>${formatRupiah(p.harga)}</td>
            <td>
                <span class="badge-status ${p.stok <= p.minStok ? 'low' : 'active'}">
                    ${p.stok}
                </span>
            </td>
            <td>${p.minStok}</td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="bukaFormProduk('${p.id}')">✏️</button>
                <button class="btn btn-sm btn-danger" onclick="hapusProduk('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Buka form tambah/edit produk
 */
function bukaFormProduk(id = null) {
    const produk = id ? state.produk.find(p => p.id === id) : null;
    const judul = produk ? 'Edit Produk' : 'Tambah Produk';
    
    const content = `
        <form id="formProduk">
            <div class="form-group">
                <label>Nama Produk:</label>
                <input type="text" id="inputNamaProduk" value="${produk?.nama || ''}" required>
            </div>
            <div class="form-group">
                <label>Kategori:</label>
                <input type="text" id="inputKategori" value="${produk?.kategori || ''}" required>
            </div>
            <div class="form-group">
                <label>Harga:</label>
                <input type="number" id="inputHarga" value="${produk?.harga || 0}" min="0" required>
            </div>
            <div class="form-group">
                <label>Stok:</label>
                <input type="number" id="inputStok" value="${produk?.stok || 0}" min="0" required>
            </div>
            <div class="form-group">
                <label>Minimum Stok (untuk peringatan):</label>
                <input type="number" id="inputMinStok" value="${produk?.minStok || 5}" min="0" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Simpan</button>
        </form>
    `;
    
    bukaModal(judul, content);
    
    // Event submit form
    document.getElementById('formProduk').onsubmit = (e) => {
        e.preventDefault();
        simpanProduk(id);
    };
}

/**
 * Simpan produk (tambah/edit)
 */
function simpanProduk(id) {
    const data = {
        nama: document.getElementById('inputNamaProduk').value,
        kategori: document.getElementById('inputKategori').value,
        harga: parseInt(document.getElementById('inputHarga').value),
        stok: parseInt(document.getElementById('inputStok').value),
        minStok: parseInt(document.getElementById('inputMinStok').value)
    };
    
    if (id) {
        // Edit
        const idx = state.produk.findIndex(p => p.id === id);
        state.produk[idx] = { ...state.produk[idx], ...data };
    } else {
        // Tambah
        data.id = 'P' + Date.now();
        state.produk.push(data);
    }
    
    simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
    tutupModal();
    renderProduk();
    tampilkanToast('Produk berhasil disimpan!', 'success');
}

/**
 * Hapus produk
 */
function hapusProduk(id) {
    if (!confirm('Yakin ingin menghapus produk ini?')) return;
    state.produk = state.produk.filter(p => p.id !== id);
    simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
    renderProduk();
    tampilkanToast('Produk dihapus!', 'success');
}

// ============================================
// 8. RENDER RE-STOCK
// ============================================

function renderRestock() {
    const tbody = document.getElementById('tabelRestock');
    
    if (state.restock.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada re-stock</td></tr>';
        return;
    }
    
    // Urutkan dari terbaru
    const sorted = [...state.restock].sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    tbody.innerHTML = sorted.map(r => `
        <tr>
            <td>${formatTanggalIndonesia(r.tanggal)}</td>
            <td>${r.namaProduk}</td>
            <td>${r.jumlah}</td>
            <td>${formatRupiah(r.hargaSatuan)}</td>
            <td>${formatRupiah(r.totalBiaya)}</td>
            <td>
                <button class="btn btn-sm btn-danger" onclick="hapusRestock('${r.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Buka form re-stock
 */
function bukaFormRestock(produkId = null) {
    const produkOptions = state.produk.map(p => 
        `<option value="${p.id}" ${p.id === produkId ? 'selected' : ''}>${p.nama} (Stok: ${p.stok})</option>`
    ).join('');
    
    const content = `
        <form id="formRestock">
            <div class="form-group">
                <label>Pilih Produk:</label>
                <select id="inputRestockProduk" required>
                    <option value="">-- Pilih Produk --</option>
                    ${produkOptions}
                </select>
            </div>
            <div class="form-group">
                <label>Jumlah:</label>
                <input type="number" id="inputRestockJumlah" min="1" required>
            </div>
            <div class="form-group">
                <label>Harga Satuan:</label>
                <input type="number" id="inputRestockHarga" min="0" required>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Simpan Re-Stock</button>
        </form>
    `;
    
    bukaModal('Catat Re-Stock', content);
    
    document.getElementById('formRestock').onsubmit = (e) => {
        e.preventDefault();
        simpanRestock();
    };
}

/**
 * Simpan data re-stock
 * Juga akan tercatat di riwayat transaksi
 */
function simpanRestock() {
    const produkId = document.getElementById('inputRestockProduk').value;
    const jumlah = parseInt(document.getElementById('inputRestockJumlah').value);
    const hargaSatuan = parseInt(document.getElementById('inputRestockHarga').value);
    
    const produk = state.produk.find(p => p.id === produkId);
    if (!produk) return;
    
    const totalBiaya = jumlah * hargaSatuan;
    const tanggal = new Date().toISOString();
    
    // Simpan data re-stock
    const restock = {
        id: generateId('RS'),
        tanggal: tanggal,
        produkId: produkId,
        namaProduk: produk.nama,
        jumlah: jumlah,
        hargaSatuan: hargaSatuan,
        totalBiaya: totalBiaya
    };
    
    state.restock.push(restock);
    simpanKeStorage(STORAGE_KEYS.RESTOCK, state.restock);
    
    // Tambahkan stok produk
    produk.stok += jumlah;
    simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
    
    // CATAT DI RIWAYAT TRANSAKSI (sesuai permintaan user)
    const transaksiRestock = {
        id: restock.id,
        tanggal: tanggal,
        jenis: 'restock',
        items: [{
            nama: produk.nama,
            qty: jumlah,
            harga: hargaSatuan
        }],
        subtotal: totalBiaya,
        total: totalBiaya,
        keterangan: `Re-Stock: ${produk.nama} (+${jumlah})`
    };
    
    state.transaksi.push(transaksiRestock);
    simpanKeStorage(STORAGE_KEYS.TRANSAKSI, state.transaksi);
    
    tutupModal();
    renderRestock();
    tampilkanToast('Re-Stock berhasil dicatat!', 'success');
}

/**
 * Hapus data re-stock
 */
function hapusRestock(id) {
    if (!confirm('Yakin ingin menghapus data re-stock ini?')) return;
    state.restock = state.restock.filter(r => r.id !== id);
    state.transaksi = state.transaksi.filter(t => t.id !== id);
    simpanKeStorage(STORAGE_KEYS.RESTOCK, state.restock);
    simpanKeStorage(STORAGE_KEYS.TRANSAKSI, state.transaksi);
    renderRestock();
    tampilkanToast('Data re-stock dihapus!', 'success');
}

// ============================================
// 9. RENDER RIWAYAT TRANSAKSI
// ============================================

function renderRiwayat() {
    const tbody = document.getElementById('tabelRiwayat');
    const tglMulai = document.getElementById('filterTanggalMulai').value;
    const tglAkhir = document.getElementById('filterTanggalAkhir').value;
    const jenis = document.getElementById('filterJenis').value;
    
    // Filter transaksi
    let filtered = [...state.transaksi];
    
    if (tglMulai) {
        filtered = filtered.filter(t => {
            const tgl = formatTanggalInput(new Date(t.tanggal));
            return tgl >= tglMulai;
        });
    }
    
    if (tglAkhir) {
        filtered = filtered.filter(t => {
            const tgl = formatTanggalInput(new Date(t.tanggal));
            return tgl <= tglAkhir;
        });
    }
    
    if (jenis !== 'semua') {
        filtered = filtered.filter(t => t.jenis === jenis);
    }
    
    // Urutkan dari terbaru
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    // Hitung ringkasan
    const penjualan = filtered.filter(t => t.jenis === 'penjualan');
    const restock = filtered.filter(t => t.jenis === 'restock');
    const totalPendapatan = penjualan.reduce((sum, t) => sum + t.total, 0);
    const totalPengeluaran = restock.reduce((sum, t) => sum + t.total, 0);
    
    document.getElementById('summaryTotalTransaksi').textContent = filtered.length;
    document.getElementById('summaryTotalPendapatan').textContent = formatRupiah(totalPendapatan);
    document.getElementById('summaryTotalPengeluaran').textContent = formatRupiah(totalPengeluaran);
    
    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Tidak ada transaksi</td></tr>';
        return;
    }
    
    tbody.innerHTML = filtered.map(t => {
        const detail = t.items.map(i => `${i.nama} (${i.qty}x)`).join(', ');
        const badge = t.jenis === 'penjualan' 
            ? '<span class="badge-status active">Penjualan</span>'
            : '<span class="badge-status low">Re-Stock</span>';
        
        return `
            <tr>
                <td><strong>${t.id}</strong></td>
                <td>${formatTanggalIndonesia(t.tanggal)}</td>
                <td>${badge}</td>
                <td>${detail}</td>
                <td>${formatRupiah(t.total)}</td>
                <td>
                    <button class="btn btn-sm btn-info" onclick="lihatDetailTransaksi('${t.id}')">👁️</button>
                    <button class="btn btn-sm btn-danger" onclick="hapusTransaksi('${t.id}')">🗑️</button>
                </td>
            </tr>
        `;
    }).join('');
}

/**
 * Lihat detail transaksi
 */
function lihatDetailTransaksi(id) {
    const t = state.transaksi.find(tr => tr.id === id);
    if (!t) return;
    
    const content = `
        <div style="font-family: monospace;">
            <p><strong>No:</strong> ${t.id}</p>
            <p><strong>Tanggal:</strong> ${formatTanggalIndonesia(t.tanggal)}</p>
            <p><strong>Jenis:</strong> ${t.jenis}</p>
            <hr>
            <h4>Detail Item:</h4>
            ${t.items.map(i => `
                <div style="display:flex; justify-content:space-between;">
                    <span>${i.nama}</span>
                    <span>${i.qty}x ${formatRupiah(i.harga)} = ${formatRupiah(i.qty * i.harga)}</span>
                </div>
            `).join('')}
            <hr>
            <p><strong>Total: ${formatRupiah(t.total)}</strong></p>
            ${t.bayar ? `<p>Bayar: ${formatRupiah(t.bayar)}</p>` : ''}
            ${t.kembalian ? `<p>Kembalian: ${formatRupiah(t.kembalian)}</p>` : ''}
        </div>
    `;
    
    bukaModal('Detail Transaksi', content);
}

/**
 * Hapus transaksi
 */
function hapusTransaksi(id) {
    if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
    state.transaksi = state.transaksi.filter(t => t.id !== id);
    simpanKeStorage(STORAGE_KEYS.TRANSAKSI, state.transaksi);
    renderRiwayat();
    tampilkanToast('Transaksi dihapus!', 'success');
}

/**
 * Export data ke JSON
 */
function exportJSON() {
    const data = {
        namaToko: state.pengaturan.namaToko,
        tanggalExport: new Date().toISOString(),
        transaksi: state.transaksi,
        produk: state.produk,
        restock: state.restock
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasirku-backup-${formatTanggalInput(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    tampilkanToast('Data berhasil diexport!', 'success');
}

/**
 * Export data ke CSV (untuk Excel)
 */
function exportCSV() {
    const tglMulai = document.getElementById('filterTanggalMulai').value;
    const tglAkhir = document.getElementById('filterTanggalAkhir').value;
    const jenis = document.getElementById('filterJenis').value;
    
    let filtered = [...state.transaksi];
    
    if (tglMulai) {
        filtered = filtered.filter(t => formatTanggalInput(new Date(t.tanggal)) >= tglMulai);
    }
    if (tglAkhir) {
        filtered = filtered.filter(t => formatTanggalInput(new Date(t.tanggal)) <= tglAkhir);
    }
    if (jenis !== 'semua') {
        filtered = filtered.filter(t => t.jenis === jenis);
    }
    
    // Buat CSV
    let csv = 'No Transaksi,Tanggal,Jenis,Detail Items,Total\n';
    filtered.forEach(t => {
        const detail = t.items.map(i => `${i.nama} (${i.qty}x ${formatRupiah(i.harga)})`).join('; ');
        csv += `"${t.id}","${formatTanggalIndonesia(t.tanggal)}","${t.jenis}","${detail}","${t.total}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasirku-riwayat-${formatTanggalInput(new Date())}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    
    tampilkanToast('CSV berhasil diexport!', 'success');
}

/**
 * Cetak riwayat
 */
function cetakRiwayat() {
    const tglMulai = document.getElementById('filterTanggalMulai').value;
    const tglAkhir = document.getElementById('filterTanggalAkhir').value;
    
    let filtered = [...state.transaksi];
    if (tglMulai) filtered = filtered.filter(t => formatTanggalInput(new Date(t.tanggal)) >= tglMulai);
    if (tglAkhir) filtered = filtered.filter(t => formatTanggalInput(new Date(t.tanggal)) <= tglAkhir);
    filtered.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
    
    const printArea = document.getElementById('printArea');
    printArea.innerHTML = `
        <div style="padding:20px; font-family: Arial;">
            <h2 style="text-align:center">${state.pengaturan.namaToko}</h2>
            <p style="text-align:center">${state.pengaturan.alamatToko}</p>
            <hr>
            <h3>Laporan Transaksi</h3>
            <p>Periode: ${tglMulai || 'Awal'} s/d ${tglAkhir || 'Sekarang'}</p>
            <p>Dicetak: ${formatTanggalIndonesia(new Date())}</p>
            <hr>
            <table style="width:100%; border-collapse:collapse; margin-top:10px;">
                <thead>
                    <tr style="background:#eee;">
                        <th style="border:1px solid #000; padding:5px;">No</th>
                        <th style="border:1px solid #000; padding:5px;">Tanggal</th>
                        <th style="border:1px solid #000; padding:5px;">Jenis</th>
                        <th style="border:1px solid #000; padding:5px;">Detail</th>
                        <th style="border:1px solid #000; padding:5px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(t => `
                        <tr>
                            <td style="border:1px solid #000; padding:5px;">${t.id}</td>
                            <td style="border:1px solid #000; padding:5px;">${formatTanggalIndonesia(t.tanggal)}</td>
                            <td style="border:1px solid #000; padding:5px;">${t.jenis}</td>
                            <td style="border:1px solid #000; padding:5px;">${t.items.map(i => `${i.nama}(${i.qty})`).join(', ')}</td>
                            <td style="border:1px solid #000; padding:5px;">${formatRupiah(t.total)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <hr>
            <p><strong>Total Transaksi: ${filtered.length}</strong></p>
            <p><strong>Total Pendapatan: ${formatRupiah(filtered.filter(t=>t.jenis==='penjualan').reduce((s,t)=>s+t.total,0))}</strong></p>
        </div>
    `;
    
    window.print();
}

/**
 * Simpan ke Drive (menggunakan File System Access API atau download)
 */
function simpanDrive() {
    // Coba gunakan File System Access API (Chrome/Edge modern)
    if ('showSaveFilePicker' in window) {
        (async () => {
            try {
                const handle = await window.showSaveFilePicker({
                    suggestedName: `kasirku-backup-${formatTanggalInput(new Date())}.json`,
                    types: [{
                        description: 'JSON File',
                        accept: { 'application/json': ['.json'] }
                    }]
                });
                const writable = await handle.createWritable();
                const data = {
                    namaToko: state.pengaturan.namaToko,
                    tanggalExport: new Date().toISOString(),
                    transaksi: state.transaksi,
                    produk: state.produk,
                    restock: state.restock
                };
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
                tampilkanToast('File berhasil disimpan ke Drive!', 'success');
            } catch (e) {
                console.log('User cancelled atau error:', e);
                exportJSON(); // Fallback ke download biasa
            }
        })();
    } else {
        // Fallback: download biasa
        tampilkanToast('Browser tidak mendukung save ke Drive. File akan didownload.', 'warning');
        exportJSON();
    }
}

// ============================================
// 10. RENDER PENGINGAT
// ============================================

function renderPengingat() {
    const tbody = document.getElementById('tabelPengingat');
    
    if (state.pengingat.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="empty-state">Belum ada pengingat</td></tr>';
        return;
    }
    
    tbody.innerHTML = state.pengingat.map(p => `
        <tr>
            <td><strong>${p.judul}</strong></td>
            <td>${p.pesan}</td>
            <td>${p.waktu}</td>
            <td>${p.pengulangan}</td>
            <td>
                <span class="badge-status ${p.aktif ? 'active' : 'inactive'}">
                    ${p.aktif ? 'Aktif' : 'Nonaktif'}
                </span>
            </td>
            <td>
                <button class="btn btn-sm btn-primary" onclick="bukaFormPengingat('${p.id}')">✏️</button>
                <button class="btn btn-sm btn-warning" onclick="togglePengingat('${p.id}')">
                    ${p.aktif ? '⏸️' : '▶️'}
                </button>
                <button class="btn btn-sm btn-danger" onclick="hapusPengingat('${p.id}')">🗑️</button>
            </td>
        </tr>
    `).join('');
}

/**
 * Buka form pengingat
 */
function bukaFormPengingat(id = null) {
    const pengingat = id ? state.pengingat.find(p => p.id === id) : null;
    const judul = pengingat ? 'Edit Pengingat' : 'Tambah Pengingat';
    
    const content = `
        <form id="formPengingat">
            <div class="form-group">
                <label>Judul:</label>
                <input type="text" id="inputJudulPengingat" value="${pengingat?.judul || ''}" required>
            </div>
            <div class="form-group">
                <label>Pesan:</label>
                <textarea id="inputPesanPengingat" required>${pengingat?.pesan || ''}</textarea>
            </div>
            <div class="form-group">
                <label>Waktu:</label>
                <input type="datetime-local" id="inputWaktuPengingat" 
                       value="${pengingat?.waktu || ''}" required>
            </div>
            <div class="form-group">
                <label>Pengulangan:</label>
                <select id="inputPengulangan" required>
                    <option value="sekali" ${pengingat?.pengulangan === 'sekali' ? 'selected' : ''}>Sekali Saja</option>
                    <option value="harian" ${pengingat?.pengulangan === 'harian' ? 'selected' : ''}>Harian</option>
                    <option value="mingguan" ${pengingat?.pengulangan === 'mingguan' ? 'selected' : ''}>Mingguan</option>
                    <option value="bulanan" ${pengingat?.pengulangan === 'bulanan' ? 'selected' : ''}>Bulanan</option>
                </select>
            </div>
            <button type="submit" class="btn btn-primary btn-block">💾 Simpan</button>
        </form>
    `;
    
    bukaModal(judul, content);
    
    document.getElementById('formPengingat').onsubmit = (e) => {
        e.preventDefault();
        simpanPengingat(id);
    };
}

/**
 * Simpan pengingat
 */
function simpanPengingat(id) {
    const data = {
        judul: document.getElementById('inputJudulPengingat').value,
        pesan: document.getElementById('inputPesanPengingat').value,
        waktu: document.getElementById('inputWaktuPengingat').value,
        pengulangan: document.getElementById('inputPengulangan').value,
        aktif: true
    };
    
    if (id) {
        const idx = state.pengingat.findIndex(p => p.id === id);
        state.pengingat[idx] = { ...state.pengingat[idx], ...data };
    } else {
        data.id = 'PG' + Date.now();
        state.pengingat.push(data);
    }
    
    simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
    tutupModal();
    renderPengingat();
    aturUlangSemuaPengingat();
    tampilkanToast('Pengingat disimpan!', 'success');
}

/**
 * Toggle status aktif pengingat
 */
function togglePengingat(id) {
    const p = state.pengingat.find(pg => pg.id === id);
    if (p) {
        p.aktif = !p.aktif;
        simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
        renderPengingat();
        aturUlangSemuaPengingat();
    }
}

/**
 * Hapus pengingat
 */
function hapusPengingat(id) {
    if (!confirm('Yakin ingin menghapus pengingat ini?')) return;
    state.pengingat = state.pengingat.filter(p => p.id !== id);
    simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
    renderPengingat();
    aturUlangSemuaPengingat();
    tampilkanToast('Pengingat dihapus!', 'success');
}

/**
 * Atur ulang semua timer pengingat
 */
function aturUlangSemuaPengingat() {
    // Hapus semua timeout lama
    if (window.pengingatTimers) {
        window.pengingatTimers.forEach(t => clearTimeout(t));
    }
    window.pengingatTimers = [];
    
    // Atur ulang
    state.pengingat.filter(p => p.aktif).forEach(p => {
        aturTimerPengingat(p);
    });
    
    updateBadgeNotif();
}

/**
 * Atur timer untuk satu pengingat
 */
function aturTimerPengingat(p) {
    const waktuTarget = new Date(p.waktu).getTime();
    const sekarang = Date.now();
    const delay = waktuTarget - sekarang;
    
    if (delay <= 0) {
        // Waktu sudah lewat, cek pengulangan
        if (p.pengulangan !== 'sekali') {
            // Hitung waktu berikutnya
            let waktuBerikutnya = new Date(p.waktu);
            while (waktuBerikutnya.getTime() <= sekarang) {
                if (p.pengulangan === 'harian') waktuBerikutnya.setDate(waktuBerikutnya.getDate() + 1);
                else if (p.pengulangan === 'mingguan') waktuBerikutnya.setDate(waktuBerikutnya.getDate() + 7);
                else if (p.pengulangan === 'bulanan') waktuBerikutnya.setMonth(waktuBerikutnya.getMonth() + 1);
            }
            p.waktu = waktuBerikutnya.toISOString().slice(0, 16);
            simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
            aturTimerPengingat(p);
        }
        return;
    }
    
    const timer = setTimeout(() => {
        // Tampilkan notifikasi
        tampilkanNotifikasi(p.judul, p.pesan);
        tampilkanToast(`🔔 ${p.judul}: ${p.pesan}`, 'info');
        
        // Atur ulang jika ada pengulangan
        if (p.pengulangan !== 'sekali') {
            let waktuBerikutnya = new Date(p.waktu);
            if (p.pengulangan === 'harian') waktuBerikutnya.setDate(waktuBerikutnya.getDate() + 1);
            else if (p.pengulangan === 'mingguan') waktuBerikutnya.setDate(waktuBerikutnya.getDate() + 7);
            else if (p.pengulangan === 'bulanan') waktuBerikutnya.setMonth(waktuBerikutnya.getMonth() + 1);
            
            p.waktu = waktuBerikutnya.toISOString().slice(0, 16);
            simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
            aturTimerPengingat(p);
        }
    }, delay);
    
    window.pengingatTimers.push(timer);
}

/**
 * Tampilkan notifikasi browser
 */
function tampilkanNotifikasi(judul, pesan) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(judul, {
            body: pesan,
            icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">🛒</text></svg>'
        });
    }
}

/**
 * Update badge notifikasi
 */
function updateBadgeNotif() {
    const sekarang = Date.now();
    const akanDatang = state.pengingat.filter(p => {
        if (!p.aktif) return false;
        const waktu = new Date(p.waktu).getTime();
        return waktu > sekarang && (waktu - sekarang) < 24 * 60 * 60 * 1000; // dalam 24 jam
    }).length;
    
    const stokMenipis = state.produk.filter(p => p.stok <= p.minStok).length;
    const total = akanDatang + stokMenipis;
    
    document.getElementById('notifBadge').textContent = total;
    document.getElementById('notifBadge').style.display = total > 0 ? 'flex' : 'none';
}

/**
 * Minta izin notifikasi
 */
function mintaIzinNotif() {
    if ('Notification' in window) {
        Notification.requestPermission().then(perm => {
            if (perm === 'granted') {
                tampilkanToast('Notifikasi diaktifkan!', 'success');
            } else {
                tampilkanToast('Izin notifikasi ditolak', 'warning');
            }
        });
    } else {
        tampilkanToast('Browser tidak mendukung notifikasi', 'warning');
    }
}

// ============================================
// 11. RENDER PENGATURAN
// ============================================

function renderPengaturan() {
    document.getElementById('settingNamaToko').value = state.pengaturan.namaToko || '';
    document.getElementById('settingAlamatToko').value = state.pengaturan.alamatToko || '';
    document.getElementById('settingMataUang').value = state.pengaturan.mataUang || 'Rp';
}

function simpanPengaturan() {
    state.pengaturan.namaToko = document.getElementById('settingNamaToko').value;
    state.pengaturan.alamatToko = document.getElementById('settingAlamatToko').value;
    state.pengaturan.mataUang = document.getElementById('settingMataUang').value;
    
    simpanKeStorage(STORAGE_KEYS.PENGATURAN, state.pengaturan);
    tampilkanToast('Pengaturan disimpan!', 'success');
}

/**
 * Backup semua data
 */
function backupData() {
    const data = {
        versi: '1.0.0',
        tanggalBackup: new Date().toISOString(),
        produk: state.produk,
        transaksi: state.transaksi,
        restock: state.restock,
        pengingat: state.pengingat,
        pengaturan: state.pengaturan
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kasirku-full-backup-${formatTanggalInput(new Date())}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    tampilkanToast('Backup berhasil!', 'success');
}

/**
 * Restore data dari file
 */
function restoreData(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);
            
            if (!confirm('Data saat ini akan ditimpa. Lanjutkan?')) return;
            
            if (data.produk) {
                state.produk = data.produk;
                simpanKeStorage(STORAGE_KEYS.PRODUK, state.produk);
            }
            if (data.transaksi) {
                state.transaksi = data.transaksi;
                simpanKeStorage(STORAGE_KEYS.TRANSAKSI, state.transaksi);
            }
            if (data.restock) {
                state.restock = data.restock;
                simpanKeStorage(STORAGE_KEYS.RESTOCK, state.restock);
            }
            if (data.pengingat) {
                state.pengingat = data.pengingat;
                simpanKeStorage(STORAGE_KEYS.PENGINGAT, state.pengingat);
            }
            if (data.pengaturan) {
                state.pengaturan = data.pengaturan;
                simpanKeStorage(STORAGE_KEYS.PENGATURAN, state.pengaturan);
            }
            
            renderHalaman(state.halamanAktif);
            aturUlangSemuaPengingat();
            tampilkanToast('Data berhasil direstore!', 'success');
        } catch (err) {
            tampilkanToast('File tidak valid!', 'danger');
        }
    };
    reader.readAsText(file);
}

/**
 * Reset semua data
 */
function resetSemuaData() {
    if (!confirm('PERINGATAN: Semua data akan dihapus permanen! Lanjutkan?')) return;
    if (!confirm('Yakin? Tindakan ini tidak dapat dibatalkan!')) return;
    
    Object.values(STORAGE_KEYS).forEach(key => localStorage.removeItem(key));
    
    state.produk = [];
    state.transaksi = [];
    state.restock = [];
    state.pengingat = [];
    state.keranjang = [];
    
    muatSemuaData();
    renderHalaman(state.halamanAktif);
    tampilkanToast('Semua data direset!', 'success');
}

// ============================================
// 12. MODAL HELPER
// ============================================

function bukaModal(judul, content) {
    document.getElementById('modalTitle').textContent = judul;
    document.getElementById('modalBody').innerHTML = content;
    document.getElementById('modal').classList.add('active');
}

function tutupModal() {
    document.getElementById('modal').classList.remove('active');
}

// ============================================
// 13. JAM & TANGGAL REALTIME
// ============================================

function updateJamTanggal() {
    const now = new Date();
    
    // Update jam
    const jam = String(now.getHours()).padStart(2, '0');
    const menit = String(now.getMinutes()).padStart(2, '0');
    const detik = String(now.getSeconds()).padStart(2, '0');
    document.getElementById('clock').textContent = `${jam}:${menit}:${detik}`;
    
    // Update tanggal (format Indonesia)
    document.getElementById('tanggalSekarang').textContent = formatTanggalIndonesia(now, false);
}

// ============================================
// 14. DETEKSI STATUS ONLINE/OFFLINE
// ============================================

function updateStatusKoneksi() {
    const indicator = document.getElementById('statusKoneksi');
    const text = indicator.querySelector('.status-text');
    
    if (navigator.onLine) {
        indicator.classList.remove('offline');
        text.textContent = 'Online';
    } else {
        indicator.classList.add('offline');
        text.textContent = 'Offline';
    }
}

// ============================================
// 15. EVENT LISTENERS
// ============================================

function setupEventListeners() {
    // Navigasi sidebar
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            pindahHalaman(btn.dataset.page);
        });
    });
    
    // Toggle sidebar mobile
    document.getElementById('menuToggle').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('active');
    });
    
    // Kasir
    document.getElementById('searchProdukKasir').addEventListener('input', renderKasir);
    document.getElementById('inputBayar').addEventListener('input', renderKeranjang);
    document.getElementById('btnBayar').addEventListener('click', prosesPembayaran);
    document.getElementById('btnBatalKeranjang').addEventListener('click', () => {
        if (state.keranjang.length > 0 && !confirm('Batalkan keranjang?')) return;
        state.keranjang = [];
        document.getElementById('inputBayar').value = '';
        renderKeranjang();
    });
    
    // Produk
    document.getElementById('searchProduk').addEventListener('input', renderProduk);
    document.getElementById('btnTambahProduk').addEventListener('click', () => bukaFormProduk());
    
    // Re-stock
    document.getElementById('btnTambahRestock').addEventListener('click', () => bukaFormRestock());
    
    // Riwayat
    document.getElementById('btnTerapkanFilter').addEventListener('click', renderRiwayat);
    document.getElementById('btnResetFilter').addEventListener('click', () => {
        document.getElementById('filterTanggalMulai').value = '';
        document.getElementById('filterTanggalAkhir').value = '';
        document.getElementById('filterJenis').value = 'semua';
        renderRiwayat();
    });
    document.getElementById('btnExportJSON').addEventListener('click', exportJSON);
    document.getElementById('btnExportCSV').addEventListener('click', exportCSV);
    document.getElementById('btnCetak').addEventListener('click', cetakRiwayat);
    document.getElementById('btnSimpanDrive').addEventListener('click', simpanDrive);
    
    // Pengingat
    document.getElementById('btnTambahPengingat').addEventListener('click', () => bukaFormPengingat());
    document.getElementById('btnIzinNotif').addEventListener('click', mintaIzinNotif);
    document.getElementById('notifBtn').addEventListener('click', () => pindahHalaman('pengingat'));
    
    // Pengaturan
    document.getElementById('btnSimpanPengaturan').addEventListener('click', simpanPengaturan);
    document.getElementById('btnBackup').addEventListener('click', backupData);
    document.getElementById('btnRestore').addEventListener('click', () => {
        document.getElementById('inputRestore').click();
    });
    document.getElementById('inputRestore').addEventListener('change', (e) => {
        if (e.target.files[0]) restoreData(e.target.files[0]);
    });
    document.getElementById('btnResetSemua').addEventListener('click', resetSemuaData);
    
    // Modal
    document.getElementById('modalClose').addEventListener('click', tutupModal);
    document.getElementById('modal').addEventListener('click', (e) => {
        if (e.target.id === 'modal') tutupModal();
    });
    
    // Online/Offline
    window.addEventListener('online', updateStatusKoneksi);
    window.addEventListener('offline', updateStatusKoneksi);
}

// ============================================
// 16. SERVICE WORKER REGISTRATION
// ============================================

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker terdaftar'))
            .catch(err => console.log('SW gagal:', err));
    });
}

// ============================================
// 17. INISIALISASI APLIKASI
// ============================================

function initApp() {
    console.log('🛒 KasirKu dimuat...');
    
    // Muat data
    muatSemuaData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Render halaman awal
    pindahHalaman('dashboard');
    
    // Update jam realtime (setiap detik)
    updateJamTanggal();
    setInterval(updateJamTanggal, 1000);
    
    // Update status koneksi
    updateStatusKoneksi();
    
    // Atur pengingat
    aturUlangSemuaPengingat();
    
    // Update badge setiap menit
    setInterval(updateBadgeNotif, 60000);
    
    // Minta izin notifikasi jika belum
    if ('Notification' in window && Notification.permission === 'default') {
        setTimeout(() => {
            if (confirm('Aktifkan notifikasi untuk pengingat?')) {
                mintaIzinNotif();
            }
        }, 2000);
    }
    
    console.log('✅ KasirKu siap digunakan!');
}

// Jalankan aplikasi saat DOM siap
document.addEventListener('DOMContentLoaded', initApp);

// ============================================
// 18. EXPOSE FUNCTION KE GLOBAL (untuk onclick)
// ============================================
// Fungsi-fungsi ini dipanggil dari HTML via onclick
window.tambahKeKeranjang = tambahKeKeranjang;
window.ubahQtyKeranjang = ubahQtyKeranjang;
window.setQtyKeranjang = setQtyKeranjang;
window.hapusDariKeranjang = hapusDariKeranjang;
window.bukaFormProduk = bukaFormProduk;
window.hapusProduk = hapusProduk;
window.bukaFormRestock = bukaFormRestock;
window.hapusRestock = hapusRestock;
window.lihatDetailTransaksi = lihatDetailTransaksi;
window.hapusTransaksi = hapusTransaksi;
window.bukaFormPengingat = bukaFormPengingat;
window.togglePengingat = togglePengingat;
window.hapusPengingat = hapusPengingat;
