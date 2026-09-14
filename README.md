# 🔖 Lightweight Bookmark Manager

Sebuah ekstensi peramban (Chrome/Brave Extension - Manifest V3) yang sangat ringan, super cepat, dan dirancang khusus untuk memenuhi kebutuhan *power user* dengan antarmuka yang menyatu sempurna dengan *Brave Browser Dark Theme*.

## ✨ Fitur Utama (Features)
- 🚀 **Performa Ekstra Cepat**: Direkayasa menggunakan eksekusi Vanilla JS murni.
- ⌨️ **Navigasi Keyboard**: Cari dan buka *bookmark* tanpa perlu menyentuh *mouse* (menggunakan `ArrowUp`, `ArrowDown`, dan `Enter`).
- ⚡ **Pencarian Ter-Debounce (Debounced Search)**: Meminimalisir lonjakan penggunaan CPU saat Anda mengetik cepat.
- 🖼️ **Favicon Asli**: Secara dinamis menarik dan menampilkan logo/favicon asli dari situs web yang Anda simpan (melalui API internal Chrome).
- 🧠 **Optimasi Memori (DocumentFragment)**: Merender ratusan daftar *bookmark* ke layar hanya dalam **satu siklus DOM** untuk menghindari *lag*/*stutter*.
- 🎨 **Brave-Aesthetic**: Tema gelap (Dark Mode) yang sepenuhnya dioptimalkan dan diselaraskan dengan palet warna asli peramban Brave (Brave Orange).

## 🛠️ Instalasi (*Local Development*)
Karena ekstensi ini masih dalam tahap pengembangan, Anda dapat menginstalnya secara manual di peramban berbasis Chromium (Chrome, Brave, Edge):

1. Unduh atau *clone* *repository* ini ke komputer Anda.
   ```bash
   git clone https://github.com/hilalglitchly/lightweight-bookmark.git
   ```
2. Buka halaman ekstensi di peramban Anda (`brave://extensions` atau `chrome://extensions`).
3. Nyalakan **"Developer mode"** (Mode Pengembang) di sudut kanan atas.
4. Klik tombol **"Load unpacked"** (Muat yang belum dibongkar) yang muncul di kiri atas.
5. Pilih folder tempat Anda menyimpan *repository* ini.
6. Selesai! Klik ikon "Puzzle" di sudut kanan atas peramban dan sematkan (Pin) ekstensi ini agar mudah diakses.

## 💻 Teknologi yang Digunakan
- **HTML5** & **CSS3** (Tanpa Framework)
- **Vanilla JavaScript** (ES6+)
- **Chrome Extension API** (Manifest V3)

---
*Dibuat untuk keperluan pembelajaran dan portofolio.*
