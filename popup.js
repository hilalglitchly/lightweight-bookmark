document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const bookmarkList = document.getElementById('bookmarkList');
    const breadcrumbDiv = document.getElementById('breadcrumb');
    const settingsBtn = document.getElementById('settingsBtn');
    
    // Context Menu Elements
    const contextMenu = document.getElementById('contextMenu');
    const menuOpenNewTab = document.getElementById('menuOpenNewTab');
    const menuDelete = document.getElementById('menuDelete');
    let contextTarget = null; // { id, url }
    
    let currentIndex = -1;
    let currentFolderId = '1'; // Default fallback
    let currentFolderName = 'Bookmarks bar';
    let folderStack = []; // Array of {id, title}
    let isSearching = false;

    // Muat default folder dari storage (Poin 4)
    chrome.storage.local.get(['defaultFolderId', 'defaultFolderName'], (result) => {
        if (result.defaultFolderId) {
            currentFolderId = result.defaultFolderId;
            currentFolderName = result.defaultFolderName || 'Folder';
        }
        fetchAndRenderFolder(currentFolderId);
    });

    // Event listener untuk tombol setting (Jadikan default folder)
    settingsBtn.addEventListener('click', () => {
        chrome.storage.local.set({
            defaultFolderId: currentFolderId,
            defaultFolderName: currentFolderName
        }, () => {
            // Animasi kecil sebagai feedback
            const originalText = settingsBtn.innerText;
            settingsBtn.innerText = '✅';
            setTimeout(() => {
                settingsBtn.innerText = originalText;
            }, 1000);
        });
    });

    // Sembunyikan context menu saat klik di manapun
    document.addEventListener('click', (e) => {
        if (e.target.closest('#contextMenu')) return;
        contextMenu.style.display = 'none';
    });

    // Aksi menu klik kanan: Buka Tab Baru
    menuOpenNewTab.addEventListener('click', () => {
        if (contextTarget && contextTarget.url) {
            chrome.tabs.create({ url: contextTarget.url, active: false });
        }
        contextMenu.style.display = 'none';
    });

    // Aksi menu klik kanan: Hapus
    menuDelete.addEventListener('click', () => {
        if (contextTarget && contextTarget.id) {
            chrome.bookmarks.remove(contextTarget.id, () => {
                // Refresh list
                if (isSearching) {
                    fetchAndRenderSearch(searchInput.value.trim());
                } else {
                    fetchAndRenderFolder(currentFolderId);
                }
            });
        }
        contextMenu.style.display = 'none';
    });

    function updateBreadcrumb() {
        if (isSearching || folderStack.length === 0) {
            breadcrumbDiv.style.display = 'none';
            return;
        }
        breadcrumbDiv.style.display = 'block';
        
        // Buat path teks
        let path = folderStack.map(f => f.title).join(' > ');
        if (folderStack.length === 0 && currentFolderId !== '0') {
             path = `📌 Tersemat > ${currentFolderName}`;
        } else if (folderStack.length > 0) {
             path += ` > ${currentFolderName}`;
        } else {
             path = currentFolderName;
        }
        breadcrumbDiv.textContent = path;
    }

    // Fetch and render folder contents
    function fetchAndRenderFolder(folderId) {
        chrome.bookmarks.getChildren(folderId, (results) => {
            renderList(results, folderId !== '0');
            updateBreadcrumb();
        });
    }

    // Fetch and render search results
    function fetchAndRenderSearch(query) {
        chrome.bookmarks.search(query, (results) => {
            renderList(results, false, query);
            updateBreadcrumb();
        });
    }

    // Render list
    function renderList(bookmarks, showBack = false, searchQuery = '') {
        bookmarkList.innerHTML = '';
        currentIndex = -1;

        const fragment = document.createDocumentFragment();
        let addedCount = 0;

        // Add "Back" button
        if (showBack && !isSearching) {
            const li = document.createElement('li');
            li.className = 'back-btn';
            li.innerHTML = '<span class="bookmark-icon" style="font-size: 14px; text-align: center;">⬅️</span><a style="font-weight: bold; color: var(--accent-color);">Kembali</a>';
            
            li.addEventListener('click', () => {
                if (folderStack.length > 0) {
                    const parentNode = folderStack.pop();
                    currentFolderId = parentNode.id;
                    currentFolderName = parentNode.title;
                    fetchAndRenderFolder(currentFolderId);
                } else {
                    // Cari parent secara dinamis via API (berguna jika kita start dari folder dalam/tersemat)
                    chrome.bookmarks.get(currentFolderId, (nodes) => {
                        if (nodes && nodes[0] && nodes[0].parentId) {
                            const parentId = nodes[0].parentId;
                            chrome.bookmarks.get(parentId, (parentNodes) => {
                                currentFolderId = parentId;
                                currentFolderName = parentNodes[0].title || 'Bookmarks';
                                fetchAndRenderFolder(currentFolderId);
                            });
                        } else {
                            currentFolderId = '0';
                            currentFolderName = 'Root';
                            fetchAndRenderFolder('0');
                        }
                    });
                }
            });
            fragment.appendChild(li);
            addedCount++;
        }

        bookmarks.forEach(bookmark => {
            const li = document.createElement('li');
            const img = document.createElement('img');
            img.className = 'bookmark-icon';
            const a = document.createElement('a');
            
            a.title = bookmark.title;
            const displayName = bookmark.title || (bookmark.url ? bookmark.url : "Folder Tanpa Nama");
            a.textContent = displayName;

            if (bookmark.url) {
                img.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(bookmark.url)}&size=16`;
                img.alt = 'link';
                a.href = bookmark.url;
                li.addEventListener('click', () => {
                    chrome.tabs.create({ url: bookmark.url, active: true });
                });
            } else {
                img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiNlOGVhZWQiIHN0cm9rZS13aWR0aD0iMiIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIj48cGF0aCBkPSJNMjIgMTlBMiAyIDAgMDExOSAyMkg1YTIgMiAwIDAxLTItMlY1YTIgMiAwIDAxMi0yaDVsMiAzSDE5YTIgMiAwIDAxMiAyWiIvPjwvc3ZnPg==';
                img.alt = 'folder';
                li.classList.add('folder-item');
                a.style.fontWeight = "600";
                
                li.addEventListener('click', () => {
                    if (!isSearching) {
                        folderStack.push({ id: currentFolderId, title: currentFolderName });
                    }
                    currentFolderId = bookmark.id;
                    currentFolderName = displayName;
                    isSearching = false; 
                    searchInput.value = ''; 
                    fetchAndRenderFolder(currentFolderId);
                });
            }

            li.appendChild(img);
            li.appendChild(a);
            
            // Event Listener Klik Kanan (Context Menu)
            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                contextTarget = { id: bookmark.id, url: bookmark.url };
                
                // Atur visibilitas menu "Buka di Tab Baru" (hanya untuk tautan)
                menuOpenNewTab.style.display = bookmark.url ? 'block' : 'none';
                
                // Posisi kursor
                let x = e.pageX;
                let y = e.pageY;
                
                // Hindari keluar dari layar
                contextMenu.style.display = 'block';
                if (x + contextMenu.offsetWidth > document.body.offsetWidth) {
                    x -= contextMenu.offsetWidth;
                }
                if (y + contextMenu.offsetHeight > document.body.offsetHeight) {
                    y -= contextMenu.offsetHeight;
                }
                
                contextMenu.style.left = `${x}px`;
                contextMenu.style.top = `${y}px`;
            });
            
            fragment.appendChild(li);
            addedCount++;
        });

        if (addedCount > 0) {
            bookmarkList.appendChild(fragment);
        } else {
            // Poin 5: Empty state interaktif
            if (isSearching) {
                bookmarkList.innerHTML = `<li class="empty-state">Tidak ada hasil untuk '${searchQuery}'.<br><small style="margin-top: 4px; display: block; opacity: 0.7;">Tekan ESC untuk membatalkan.</small></li>`;
            } else {
                bookmarkList.innerHTML = '<li class="empty-state">Folder ini kosong.</li>';
            }
        }
    }

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            const query = e.target.value.trim();
            if (query) {
                isSearching = true;
                fetchAndRenderSearch(query);
            } else {
                isSearching = false;
                fetchAndRenderFolder(currentFolderId);
            }
        }, 150);
    });

    document.addEventListener('keydown', (e) => {
        // Poin 5: ESC to clear
        if (e.key === 'Escape' && searchInput.value !== '') {
            e.preventDefault();
            searchInput.value = '';
            isSearching = false;
            fetchAndRenderFolder(currentFolderId);
            return;
        }

        const items = bookmarkList.querySelectorAll('li');
        if (items.length === 0 || items[0].classList.contains('empty-state')) return;

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
        } else if (e.key === 'ArrowLeft' && !isSearching) {
            e.preventDefault();
            const backBtn = bookmarkList.querySelector('.back-btn');
            if (backBtn) backBtn.click();
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
