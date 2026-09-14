document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const bookmarkList = document.getElementById('bookmarkList');
    let currentIndex = -1;

    // Fungsi untuk mengambil dan merender bookmark
    function fetchAndRenderBookmarks(query = '') {
        bookmarkList.innerHTML = ''; // Kosongkan list setiap kali render ulang
        currentIndex = -1; // Reset seleksi keyboard

        if (query) {
            // Jika ada teks pencarian, cari di seluruh bookmark
            chrome.bookmarks.search(query, (results) => {
                renderList(results);
            });
        } else {
            // Jika kosong, tampilkan 20 bookmark terbaru
            chrome.bookmarks.getRecent(20, (results) => {
                renderList(results);
            });
        }
    }

    // Fungsi pembantu untuk merender array bookmark ke elemen HTML
    function renderList(bookmarks) {
        bookmarks.forEach(bookmark => {
            // Pastikan yang dirender adalah link, bukan folder (folder tidak punya URL)
            if (bookmark.url) {
                const li = document.createElement('li');
                
                // Mengambil Favicon asli menggunakan API Chrome internal
                const faviconUrl = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(bookmark.url)}&size=16`;

                li.innerHTML = `
                    <img class="bookmark-icon" src="${faviconUrl}" alt="icon">
                    <a href="${bookmark.url}" title="${bookmark.title}">${bookmark.title}</a>
                `;

                // Klik area manapun di dalam list untuk membuka web
                li.addEventListener('click', () => {
                    // Membuat tab baru dengan URL tersebut
                    chrome.tabs.create({ url: bookmark.url, active: true });
                });

                bookmarkList.appendChild(li);
            }
        });

        // Pesan jika tidak ada yang cocok dengan pencarian
        if (bookmarkList.children.length === 0) {
            bookmarkList.innerHTML = '<li style="color: #6c7086; justify-content: center; font-style: italic;">Tidak ada hasil ditemukan.</li>';
        }
    }

    // Merekam ketikan di kolom pencarian (Real-time filtering)
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        fetchAndRenderBookmarks(query);
    });

    // Panggil pertama kali untuk memuat bookmark terbaru saat popup terbuka
    fetchAndRenderBookmarks();

    // Navigasi Keyboard
    document.addEventListener('keydown', (e) => {
        const items = bookmarkList.querySelectorAll('li');
        if (items.length === 0 || items[0].innerText === 'Tidak ada hasil ditemukan.') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentIndex = (currentIndex + 1) % items.length;
            updateSelection(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentIndex = (currentIndex - 1 + items.length) % items.length;
            updateSelection(items);
        } else if (e.key === 'Enter') {
            if (currentIndex >= 0 && currentIndex < items.length) {
                e.preventDefault();
                items[currentIndex].click();
            }
        }
    });

    function updateSelection(items) {
        items.forEach((item, index) => {
            if (index === currentIndex) {
                item.classList.add('selected');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('selected');
            }
        });
    }
});
