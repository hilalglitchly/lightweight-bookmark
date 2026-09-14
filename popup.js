document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const bookmarkList = document.getElementById('bookmarkList');

    // Fungsi untuk mengambil dan merender bookmark
    function fetchAndRenderBookmarks(query = '') {
        bookmarkList.innerHTML = ''; // Kosongkan list setiap kali render ulang

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
                
                // SVG Ikon default untuk tiap link
                const svgIcon = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiM4OWI0ZmEiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMTkgMjFMMTIgMTZsLTcgNXYtMTRhMiAyIDAgMDExIDJoMTRhMiAyIDAgMDExIDJ2MTR6Ij48L3BhdGg+PC9zdmc+`;

                li.innerHTML = `
                    <img class="bookmark-icon" src="${svgIcon}" alt="icon">
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
});
