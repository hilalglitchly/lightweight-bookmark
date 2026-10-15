# 🔖 Lightweight Bookmark Manager

Sebuah ekstensi peramban (Chrome/Brave Extension - Manifest V3) yang sangat ringan, super cepat, dan dirancang khusus untuk memenuhi kebutuhan *power user* dengan antarmuka yang menyatu sempurna dengan *Brave Browser Dark Theme*.

## ✨ Fitur Utama (Features)
- 🚀 **Performa Ekstra Cepat**: Direkayasa menggunakan Vanilla JS murni tanpa framework, ringan dan hemat memori.
- ⌨️ **Keyboard Shortcut Global**: Buka ekstensi kapan saja dengan shortcut default `Alt + B` (dapat dikustomisasi di `brave://extensions/shortcuts` atau `chrome://extensions/shortcuts`).
- 📁 **Buat Folder Baru**: Tambah folder dengan mudah lewat tombol header (`Alt + N`) atau menu klik kanan *New Subfolder*.
- 🛡️ **Konfirmasi Hapus Aman**: Dialog konfirmasi modern mencegah penghapusan bookmark atau folder berisi data penting secara tidak sengaja.
- 🤏 **Drag & Drop Reordering**: Tahan dan geser bookmark untuk mengatur urutan posisi sesuai keinginan dengan indikator visual yang presisi.
- ⚡ **Pencarian Ter-Debounce**: Pencarian instan dan responsif tanpa lag CPU saat mengetik.
- 📌 **Pin Folder Beranda**: Sematkan folder favorit sebagai tampilan awal default setiap kali popup dibuka.
- 🖼️ **Favicon Asli**: Mengambil favicon resmi situs secara dinamis melalui Chromium Internal Favicon API.
- 🔒 **Keamanan Ketat**: Dilengkapi Content Security Policy (CSP), validasi skema URL yang aman, serta bebas dari `innerHTML`.
- 🎨 **Brave/Chromium Aesthetic**: Tema gelap elegan dengan efek glassmorphism, animasi halus, dan micro-interactions yang memanjakan mata.

## ⌨️ Daftar Pintasan Keyboard (Keyboard Shortcuts)

| Shortcut | Aksi |
|---|---|
| `Alt + B` | Buka / Tutup popup ekstensi dari web mana saja |
| `Alt + N` / `Ctrl + Shift + N` | Buat folder baru (saat popup terbuka) |
| `ArrowUp` / `ArrowDown` | Navigasi antar bookmark |
| `Enter` | Buka bookmark yang dipilih / Konfirmasi dialog |
| `ArrowLeft` | Kembali ke folder sebelumnya (Back) |
| `Delete` / `Backspace` | Hapus bookmark/folder yang sedang dipilih (dengan konfirmasi) |
| `Escape` | Tutup dialog modal / Batal pencarian / Tutup context menu |

## 🛠️ Instalasi (*Local Development*)
Karena ekstensi ini masih dalam tahap pengembangan, Anda dapat menginstalnya secara manual di peramban berbasis Chromium (Chrome, Brave, Edge):

1. Unduh atau *clone* *repository* ini ke komputer Anda:
   ```bash
   git clone https://github.com/hilalglitchly/lightweight-bookmark.git
   ```
2. Buka halaman ekstensi di peramban Anda (`brave://extensions` atau `chrome://extensions`).
3. Nyalakan **"Developer mode"** (Mode Pengembang) di sudut kanan atas.
4. Klik tombol **"Load unpacked"** (Muat yang belum dibongkar) yang muncul di kiri atas.
5. Pilih folder tempat Anda menyimpan *repository* ini.
6. Selesai! Anda dapat langsung menekan `Alt + B` untuk membuka ekstensi!

## 💻 Teknologi yang Digunakan
- **HTML5** & **CSS3** (Modern Vanilla CSS & Glassmorphism)
- **Vanilla JavaScript** (ES6+, DocumentFragment, Zero Dependencies)
- **Chrome Extensions API** (Manifest V3)

---
*Dibuat untuk keperluan pembelajaran dan portofolio.*
