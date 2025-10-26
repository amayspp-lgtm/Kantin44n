// script.js

// --- KONFIGURASI API ---
// GANTI DENGAN URL API SERVERLESS ANDA
// Misalnya: https://abcdef123.execute-api.us-east-1.amazonaws.com/api
const API_BASE_URL = 'http://localhost:7700/api'; // Ganti ini saat deploy
let tokoAktif = null;

// --- VARIABEL GLOBAL ---
let keranjang = JSON.parse(localStorage.getItem('kantinKeranjang')) || []; 

// --- DOM ELEMENTS ---
const tokoSelection = document.getElementById('toko-selection');
const menuPage = document.getElementById('menu-page');
const konfirmasiPage = document.getElementById('konfirmasi-page');
const tokoList = document.getElementById('toko-list');
const menuProdukList = document.getElementById('menu-produk-list');
const keranjangBody = document.getElementById('keranjang-body');
const totalHargaElement = document.getElementById('total-harga');
const jumlahKeranjangNav = document.getElementById('jumlah-keranjang');
const navKembali = document.getElementById('nav-kembali');

const lanjutKonfirmasiBtn = document.getElementById('lanjut-konfirmasi-btn');
const finalCheckoutBtn = document.getElementById('final-checkout-btn');
const metodePembayaranRadios = document.querySelectorAll('input[name="metode_pembayaran"]');
const qrisDisplay = document.getElementById('qris-display');


// --- FUNGSI UTAMA RENDERING & API CALLS ---

/**
 * Memuat dan menampilkan daftar toko dari API.
 */
async function renderTokoList() {
    tokoList.innerHTML = 'Memuat daftar toko...';
    
    try {
        // Panggil Serverless Function /toko
        const response = await fetch(`${API_BASE_URL}/toko`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const tokoData = await response.json();

        tokoList.innerHTML = '';
        tokoData.forEach(toko => {
            const card = document.createElement('div');
            card.classList.add('toko-card', 'menu-item');
            card.innerHTML = `
                <h3>${toko.nama}</h3>
                <p>${toko.deskripsi}</p>
                <button class="pilih-toko" data-id="${toko.id}" 
                    data-nama="${toko.nama}" data-qris="${toko.qr_qris}">Pilih Toko Ini</button>
            `;
            tokoList.appendChild(card);
        });
    } catch (error) {
        console.error("Gagal mengambil data toko:", error);
        tokoList.innerHTML = `<p style="color:red; font-weight: bold;">[API ERROR] Gagal memuat daftar toko. Pastikan Serverless API berjalan dan URL: ${API_BASE_URL}/toko benar.</p>`;
    }
}

/**
 * Memuat dan menampilkan menu toko yang terpilih dari API.
 */
async function renderMenuPage() {
    menuProdukList.innerHTML = 'Memuat menu...';
    
    if (!tokoAktif || !tokoAktif.id) return;
    
    document.getElementById('nama-toko-terpilih').textContent = `Menu Toko: ${tokoAktif.nama}`;

    try {
        // Panggil Serverless Function /menu/{id}
        const response = await fetch(`${API_BASE_URL}/menu/${tokoAktif.id}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuData = await response.json();
        
        tokoAktif.menu = menuData;

        menuProdukList.innerHTML = '';
        menuData.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.classList.add('menu-item');
            itemElement.dataset.id = item.id;
            itemElement.dataset.nama = item.nama_produk; // Sesuaikan dengan nama kolom DB
            itemElement.dataset.harga = item.harga;
            
            itemElement.innerHTML = `
                <h3>${item.nama_produk}</h3>
                <p>Stok: ${item.stok}</p>
                <p class="harga">Rp ${parseInt(item.harga).toLocaleString('id-ID')}</p>
                <button class="tambah-ke-keranjang" data-id="${item.id}" 
                    ${item.stok <= 0 ? 'disabled' : ''}>
                    ${item.stok > 0 ? 'Tambah ke Keranjang' : 'Stok Habis'}
                </button>
            `;
            menuProdukList.appendChild(itemElement);
        });
    } catch (error) {
        console.error("Gagal mengambil data menu:", error);
        menuProdukList.innerHTML = `<p style="color:red; font-weight: bold;">[API ERROR] Gagal memuat menu. Cek koneksi API.</p>`;
    }
    
    renderKeranjang();
}

/**
 * Mengirim data pesanan ke API Transaksi.
 */
async function prosesCheckout(metode) {
    const totalHarga = keranjang.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
    
    const dataTransaksi = {
        id_toko: tokoAktif.id,
        total_harga: totalHarga,
        metode_pembayaran: metode,
        items: keranjang.map(item => ({ 
            id: item.id, 
            jumlah: item.jumlah, 
            harga: item.harga 
        }))
    };

    finalCheckoutBtn.textContent = 'Memproses...';
    finalCheckoutBtn.disabled = true;

    try {
        // Panggil Serverless Function /transaksi
        const response = await fetch(`${API_BASE_URL}/transaksi`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(dataTransaksi)
        });

        const result = await response.json();

        if (response.ok) {
            alert(`Pesanan ${metode} berhasil diproses!\nID Transaksi: ${result.id_transaksi}.\nTotal: Rp ${totalHarga.toLocaleString('id-ID')}.\n(Lihat di Web Admin Toko untuk mengubah status).`);

            // RESET
            keranjang = [];
            localStorage.removeItem('kantinKeranjang');
            tampilkanHalaman('toko-selection'); 
            renderTokoList(); 

        } else {
            alert(`Gagal membuat pesanan: ${result.message || 'Error server.'}`);
        }

    } catch (error) {
        console.error('Error saat mengirim transaksi:', error);
        alert("Terjadi kesalahan jaringan atau server. Mohon periksa konsol.");
    } finally {
        finalCheckoutBtn.textContent = 'Finalisasi Pesanan';
        finalCheckoutBtn.disabled = false;
    }
}


// --- FUNGSI KERANJANG & NAVIGASI (Logika Client-Side) ---

function renderKeranjang() {
    keranjangBody.innerHTML = ''; 
    let totalHarga = 0;

    keranjang.forEach((item, index) => {
        const subtotal = item.harga * item.jumlah;
        totalHarga += subtotal;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${item.nama}</td>
            <td>Rp ${item.harga.toLocaleString('id-ID')}</td>
            <td>
                <input type="number" min="1" value="${item.jumlah}" data-index="${index}" class="ubah-jumlah" style="width: 50px;">
            </td>
            <td>Rp ${subtotal.toLocaleString('id-ID')}</td>
            <td><button class="hapus-item" data-index="${index}">Hapus</button></td>
        `;
        keranjangBody.appendChild(row);
    });

    totalHargaElement.textContent = `Rp ${totalHarga.toLocaleString('id-ID')}`;
    jumlahKeranjangNav.textContent = keranjang.length;
    
    lanjutKonfirmasiBtn.disabled = keranjang.length === 0;

    localStorage.setItem('kantinKeranjang', JSON.stringify(keranjang));
}

function tambahKeKeranjang(id, nama, harga) {
    const existingItem = keranjang.find(item => item.id === id);
    const itemMenu = tokoAktif.menu.find(item => item.id === id);
    
    if (!itemMenu || itemMenu.stok <= 0) {
        alert("Maaf, stok item ini habis!");
        return;
    }

    if (existingItem) {
        if (existingItem.jumlah < itemMenu.stok) {
            existingItem.jumlah += 1;
        } else {
            alert(`Stok maksimal untuk ${nama} adalah ${itemMenu.stok}.`);
        }
    } else {
        keranjang.push({ id, nama, harga, jumlah: 1, id_toko: tokoAktif.id });
    }

    renderKeranjang();
    alert(`${nama} ditambahkan ke keranjang!`);
}

function hapusDariKeranjang(index) {
    keranjang.splice(index, 1);
    renderKeranjang();
}

function ubahJumlahItem(index, newJumlah) {
    const newJml = parseInt(newJumlah);
    if (isNaN(newJml) || newJml < 1) {
        hapusDariKeranjang(index);
        return;
    }
    
    const item = keranjang[index];
    const itemMenu = tokoAktif.menu.find(i => i.id === item.id);

    if (newJml > itemMenu.stok) {
        alert(`Jumlah melebihi stok yang tersedia (${itemMenu.stok}).`);
        keranjang[index].jumlah = itemMenu.stok;
    } else {
        keranjang[index].jumlah = newJml;
    }
    renderKeranjang();
}


function tampilkanHalaman(target) {
    tokoSelection.style.display = 'none';
    menuPage.style.display = 'none';
    konfirmasiPage.style.display = 'none';
    navKembali.style.display = 'none';

    if (target === 'toko-selection') {
        tokoSelection.style.display = 'block';
        tokoAktif = null;
    } else if (target === 'menu-page') {
        menuPage.style.display = 'block';
        navKembali.style.display = 'block';
    } else if (target === 'konfirmasi-page') {
        konfirmasiPage.style.display = 'block';
        navKembali.style.display = 'block';
        renderKonfirmasi();
    }
}

function renderKonfirmasi() {
    const totalHarga = keranjang.reduce((sum, item) => sum + (item.harga * item.jumlah), 0);
    const ringkasanElement = document.getElementById('ringkasan-order');
    
    let html = '<h3>Ringkasan Pesanan</h3><ul>';
    keranjang.forEach(item => {
        html += `<li>${item.nama} (${item.jumlah}x) - Rp ${(item.harga * item.jumlah).toLocaleString('id-ID')}</li>`;
    });
    html += `</ul><p class="harga">Total Akhir: **Rp ${totalHarga.toLocaleString('id-ID')}**</p>`;
    ringkasanElement.innerHTML = html;

    // Atur info QRIS
    qrisDisplay.style.display = 'none';
    document.getElementById('qris-nama-toko').textContent = tokoAktif.nama;
    document.getElementById('qris-image').src = tokoAktif.qr_qris; 
    document.getElementById('qris-total').textContent = `Rp ${totalHarga.toLocaleString('id-ID')}`;

    finalCheckoutBtn.disabled = true;
    metodePembayaranRadios.forEach(radio => radio.checked = false);
}


// --- EVENT LISTENERS ---

// Listener untuk memilih Toko
tokoList.addEventListener('click', (e) => {
    if (e.target.classList.contains('pilih-toko')) {
        // Ambil data dari tombol
        const itemElement = e.target.closest('.menu-item'); 
        tokoAktif = {
            id: parseInt(e.target.dataset.id),
            nama: e.target.dataset.nama,
            qr_qris: e.target.dataset.qris,
            menu: [] 
        };

        if (tokoAktif) {
            tampilkanHalaman('menu-page');
            renderMenuPage();
        }
    }
});

// Listener untuk Tambah ke Keranjang
menuProdukList.addEventListener('click', (e) => {
    if (e.target.classList.contains('tambah-ke-keranjang')) {
        const id = parseInt(e.target.dataset.id);
        const itemElement = e.target.closest('.menu-item');
        const nama = itemElement.dataset.nama;
        const harga = parseInt(itemElement.dataset.harga);
        tambahKeKeranjang(id, nama, harga);
    }
});

// Listener untuk Hapus dan Ubah Jumlah di Keranjang
keranjangBody.addEventListener('click', (e) => {
    if (e.target.classList.contains('hapus-item')) {
        const index = parseInt(e.target.dataset.index);
        hapusDariKeranjang(index);
    }
});

keranjangBody.addEventListener('change', (e) => {
    if (e.target.classList.contains('ubah-jumlah')) {
        const index = parseInt(e.target.dataset.index);
        ubahJumlahItem(index, e.target.value);
    }
});

// Listener untuk Lanjut Konfirmasi
lanjutKonfirmasiBtn.addEventListener('click', () => {
    tampilkanHalaman('konfirmasi-page');
});

// Listener untuk Pemilihan Metode Pembayaran
metodePembayaranRadios.forEach(radio => {
    radio.addEventListener('change', function() {
        if (this.value === 'QRIS') {
            qrisDisplay.style.display = 'block';
        } else {
            qrisDisplay.style.display = 'none';
        }
        finalCheckoutBtn.disabled = false;
    });
});

// Listener untuk Finalisasi Pesanan
finalCheckoutBtn.addEventListener('click', () => {
    const metodeTerpilih = document.querySelector('input[name="metode_pembayaran"]:checked');
    if (metodeTerpilih) {
        // Panggil fungsi proses checkout yang memanggil API
        prosesCheckout(metodeTerpilih.value); 
    } else {
        alert("Mohon pilih metode pembayaran.");
    }
});

// Listener untuk tombol "Kembali ke Toko"
navKembali.addEventListener('click', (e) => {
    e.preventDefault();
    if (keranjang.length > 0) {
        if (!confirm("Keranjang Anda akan dikosongkan jika kembali ke halaman toko. Lanjutkan?")) {
            return;
        }
    }
    keranjang = [];
    tampilkanHalaman('toko-selection');
});

// --- INISIALISASI ---
document.addEventListener('DOMContentLoaded', () => {
    renderTokoList();
    tampilkanHalaman('toko-selection');
});