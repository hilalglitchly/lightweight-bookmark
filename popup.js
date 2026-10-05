document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('searchInput');
    const bookmarkList = document.getElementById('bookmarkList');
    const breadcrumbDiv = document.getElementById('breadcrumb');
    const settingsBtn = document.getElementById('settingsBtn');
    const addBookmarkBtn = document.getElementById('addBookmarkBtn');
    const toast = document.getElementById('toast');
    
    // Context Menu Elements
    const contextMenu = document.getElementById('contextMenu');
    const menuOpenNewTab = document.getElementById('menuOpenNewTab');
    const menuOpenAll = document.getElementById('menuOpenAll');
    const menuRename = document.getElementById('menuRename');
    const menuDelete = document.getElementById('menuDelete');
    let contextTarget = null; // { id, url, isFolder, liElement }
    
    let currentIndex = -1;
    let currentFolderId = '1'; // Default fallback
    let currentFolderName = 'Bookmarks bar';
    let folderStack = []; // Array of {id, title}
    let isSearching = false;
    let pinnedFolderId = null;
    let toastTimeout = null;

    const PIN_OUTLINE = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>';
    const PIN_FILLED = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z"/></svg>';

    // Toast Notification helper
    function showToast(message, type = 'success') {
        if (!toast) return;
        clearTimeout(toastTimeout);
        toast.textContent = message;
        toast.className = `toast show ${type === 'error' ? 'toast-error' : 'toast-success'}`;
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }

    function updatePinIcon() {
        if (currentFolderId === pinnedFolderId) {
            settingsBtn.innerHTML = PIN_FILLED;
            settingsBtn.style.opacity = '1';
        } else {
            settingsBtn.innerHTML = PIN_OUTLINE;
            settingsBtn.style.opacity = '';
        }
    }

    // Disable add button at root level (can't create bookmarks there)
    function updateAddButton() {
        const isRoot = currentFolderId === '0';
        addBookmarkBtn.style.display = isRoot ? 'none' : '';
    }

    // Load default folder from storage
    chrome.storage.local.get(['defaultFolderId', 'defaultFolderName'], (result) => {
        if (result.defaultFolderId) {
            currentFolderId = result.defaultFolderId;
            currentFolderName = result.defaultFolderName || 'Bookmarks bar';
            pinnedFolderId = result.defaultFolderId;
        }
        fetchAndRenderFolder(currentFolderId);
        updatePinIcon();
        updateAddButton();
    });

    // Pin folder as home
    settingsBtn.addEventListener('click', () => {
        chrome.storage.local.set({
            defaultFolderId: currentFolderId,
            defaultFolderName: currentFolderName
        }, () => {
            pinnedFolderId = currentFolderId;
            updatePinIcon();
            showToast(`Pinned "${currentFolderName}" as Home`);
        });
    });

    // Hide context menu on click anywhere
    document.addEventListener('click', (e) => {
        if (e.target.closest('#contextMenu')) return;
        contextMenu.style.display = 'none';
    });

    // Context menu action: Open in New Tab
    menuOpenNewTab.addEventListener('click', () => {
        if (contextTarget && contextTarget.url) {
            chrome.tabs.create({ url: contextTarget.url, active: false });
        }
        contextMenu.style.display = 'none';
    });

    // Context menu action: Delete
    menuDelete.addEventListener('click', () => {
        if (contextTarget && contextTarget.id) {
            const removeFunc = contextTarget.isFolder ? chrome.bookmarks.removeTree : chrome.bookmarks.remove;
            removeFunc(contextTarget.id, () => {
                showToast('Deleted');
                if (isSearching) {
                    fetchAndRenderSearch(searchInput.value.trim());
                } else {
                    fetchAndRenderFolder(currentFolderId);
                }
            });
        }
        contextMenu.style.display = 'none';
    });

    // Context menu action: Open All in New Tabs (folders only)
    menuOpenAll.addEventListener('click', () => {
        if (contextTarget && contextTarget.id && contextTarget.isFolder) {
            chrome.bookmarks.getChildren(contextTarget.id, (children) => {
                const links = children.filter(c => c.url);
                if (links.length === 0) {
                    showToast('Folder has no bookmarks', 'error');
                    return;
                }
                links.forEach(child => {
                    chrome.tabs.create({ url: child.url, active: false });
                });
                showToast(`Opened ${links.length} tabs`);
            });
        }
        contextMenu.style.display = 'none';
    });

    // Context menu action: Rename
    menuRename.addEventListener('click', () => {
        if (contextTarget && contextTarget.id && contextTarget.liElement) {
            const li = contextTarget.liElement;
            const anchor = li.querySelector('a');
            if (!anchor) return;

            const oldName = anchor.textContent;
            const input = document.createElement('input');
            input.type = 'text';
            input.className = 'rename-input';
            input.value = oldName;

            anchor.style.display = 'none';
            li.appendChild(input);
            input.focus();
            input.select();

            let committed = false;
            const commitRename = () => {
                if (committed) return;
                committed = true;
                const newName = input.value.trim();
                if (newName && newName !== oldName) {
                    chrome.bookmarks.update(contextTarget.id, { title: newName }, () => {
                        anchor.textContent = newName;
                        anchor.title = newName;
                        showToast(`Renamed to "${newName}"`);
                    });
                }
                input.remove();
                anchor.style.display = '';
            };

            input.addEventListener('blur', commitRename);
            input.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    commitRename();
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    input.value = oldName;
                    commitRename();
                }
            });
        }
        contextMenu.style.display = 'none';
    });

    // Bookmark current tab into current folder
    addBookmarkBtn.addEventListener('click', () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs && tabs[0]) {
                const targetFolderId = (currentFolderId === '0' || !currentFolderId) ? '1' : currentFolderId;
                const folderLabel = currentFolderId === '0' ? 'Bookmarks bar' : currentFolderName;

                chrome.bookmarks.create({
                    parentId: targetFolderId,
                    title: tabs[0].title || 'New Bookmark',
                    url: tabs[0].url
                }, (created) => {
                    if (chrome.runtime.lastError) {
                        showToast(`Failed: ${chrome.runtime.lastError.message}`, 'error');
                        return;
                    }
                    showToast(`Saved to "${folderLabel}"`);
                    if (!isSearching) {
                        fetchAndRenderFolder(currentFolderId);
                    }
                });
            }
        });
    });

    // Breadcrumb navigation
    function updateBreadcrumb() {
        if (isSearching || (folderStack.length === 0 && currentFolderId === pinnedFolderId)) {
            breadcrumbDiv.style.display = 'none';
            return;
        }

        breadcrumbDiv.style.display = 'flex';
        breadcrumbDiv.innerHTML = '';

        if (folderStack.length === 0) {
            const crumb = document.createElement('span');
            crumb.className = 'breadcrumb-crumb current';
            crumb.textContent = currentFolderName;
            breadcrumbDiv.appendChild(crumb);
            return;
        }

        folderStack.forEach((folder, index) => {
            const crumb = document.createElement('span');
            crumb.className = 'breadcrumb-crumb';
            crumb.textContent = folder.title;
            crumb.title = `Go to ${folder.title}`;
            crumb.addEventListener('click', () => {
                folderStack = folderStack.slice(0, index);
                currentFolderId = folder.id;
                currentFolderName = folder.title;
                fetchAndRenderFolder(currentFolderId);
            });
            breadcrumbDiv.appendChild(crumb);

            const sep = document.createElement('span');
            sep.className = 'breadcrumb-sep';
            sep.textContent = '>';
            breadcrumbDiv.appendChild(sep);
        });

        const currentCrumb = document.createElement('span');
        currentCrumb.className = 'breadcrumb-crumb current';
        currentCrumb.textContent = currentFolderName;
        breadcrumbDiv.appendChild(currentCrumb);
    }

    // Fetch and render folder contents
    function fetchAndRenderFolder(folderId) {
        chrome.bookmarks.getChildren(folderId, (results) => {
            renderList(results, folderId !== '0');
            updateBreadcrumb();
            updatePinIcon();
            updateAddButton();
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
            li.innerHTML = '<span class="bookmark-icon" style="display: flex; align-items: center; justify-content: center;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg></span><a style="font-weight: 600; color: var(--text-color);">Back</a>';
            
            li.addEventListener('click', () => {
                if (folderStack.length > 0) {
                    const parentNode = folderStack.pop();
                    currentFolderId = parentNode.id;
                    currentFolderName = parentNode.title;
                    fetchAndRenderFolder(currentFolderId);
                } else {
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
            const a = document.createElement('a');
            
            const displayName = bookmark.title || (bookmark.url ? bookmark.url : "Unnamed Folder");
            a.title = displayName;
            a.textContent = displayName;

            let iconEl;

            if (bookmark.url) {
                iconEl = document.createElement('img');
                iconEl.className = 'bookmark-icon';
                iconEl.src = `chrome-extension://${chrome.runtime.id}/_favicon/?pageUrl=${encodeURIComponent(bookmark.url)}&size=16`;
                iconEl.alt = 'link';
                a.href = bookmark.url;

                iconEl.onerror = () => {
                    const fallback = document.createElement('span');
                    fallback.className = 'bookmark-icon bookmark-icon-fallback';
                    fallback.textContent = (bookmark.title || 'L').charAt(0).toUpperCase();
                    if (iconEl.parentNode) iconEl.replaceWith(fallback);
                };

                li.addEventListener('click', () => {
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs[0]) {
                            chrome.tabs.update(tabs[0].id, { url: bookmark.url });
                        }
                    });
                });

                // Middle-click to open in background
                li.addEventListener('mousedown', (e) => {
                    if (e.button === 1) {
                        e.preventDefault();
                        chrome.tabs.create({ url: bookmark.url, active: false });
                    }
                });
            } else {
                // Monochrome Black & White folder icon
                iconEl = document.createElement('span');
                iconEl.className = 'bookmark-icon';
                iconEl.style.display = 'flex';
                iconEl.style.alignItems = 'center';
                iconEl.style.justifyContent = 'center';
                iconEl.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19A2 2 0 0119 22H5a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3H19a2 2 0 012 2Z"/></svg>';
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

            li.appendChild(iconEl);
            li.appendChild(a);

            // Right-click context menu
            li.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                contextTarget = { id: bookmark.id, url: bookmark.url, isFolder: !bookmark.url, liElement: li };
                
                menuOpenNewTab.style.display = bookmark.url ? 'block' : 'none';
                menuOpenAll.style.display = !bookmark.url ? 'block' : 'none';
                menuRename.style.display = 'block';
                menuDelete.style.display = 'block';
                
                let x = e.pageX;
                let y = e.pageY;
                
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
            if (isSearching) {
                bookmarkList.innerHTML = `<li class="empty-state">No results for '${searchQuery}'.<br><small style="margin-top: 4px; display: block; opacity: 0.7;">Press ESC to cancel.</small></li>`;
            } else {
                bookmarkList.innerHTML = '<li class="empty-state">This folder is empty.</li>';
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
        if (e.key === 'Escape') {
            if (contextMenu.style.display === 'block') {
                contextMenu.style.display = 'none';
                return;
            }
            if (searchInput.value !== '') {
                e.preventDefault();
                searchInput.value = '';
                isSearching = false;
                fetchAndRenderFolder(currentFolderId);
                return;
            }
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
