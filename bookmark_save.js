(() => {
    const folderTree = document.getElementById('folderTree');
    const tabTitle = document.getElementById('tabTitle');
    const tabUrl = document.getElementById('tabUrl');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    let selectedFolderId = null;
    let tabInfo = null;

    // Get tab info passed via URL params
    const params = new URLSearchParams(window.location.search);
    const pageTitle = params.get('title') || 'New Bookmark';
    const pageUrl = params.get('url') || '';

    tabTitle.textContent = pageTitle;
    tabTitle.title = pageTitle;
    tabUrl.textContent = pageUrl;
    tabUrl.title = pageUrl;
    tabInfo = { title: pageTitle, url: pageUrl };

    // Load pinned folder to pre-select it
    chrome.storage.local.get(['defaultFolderId'], (result) => {
        const pinnedId = result.defaultFolderId || '1';
        loadFolderTree(pinnedId);
    });

    function loadFolderTree(preselectId) {
        chrome.bookmarks.getTree((tree) => {
            folderTree.innerHTML = '';
            // tree[0] is the root, its children are "Bookmarks Bar", "Other Bookmarks", etc.
            const roots = tree[0].children || [];
            roots.forEach(root => {
                renderFolder(root, folderTree, preselectId, 0);
            });
        });
    }

    function renderFolder(node, parentEl, preselectId, depth) {
        // Only render folders (nodes without url)
        if (node.url) return;

        const wrapper = document.createElement('div');

        const item = document.createElement('div');
        item.className = 'folder-item';
        item.dataset.id = node.id;

        // Check for subfolders
        const subfolders = (node.children || []).filter(c => !c.url);

        // Toggle arrow
        const toggle = document.createElement('span');
        toggle.className = 'folder-toggle' + (subfolders.length === 0 ? ' empty' : '');
        toggle.innerHTML = '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>';

        // Folder icon
        const icon = document.createElement('span');
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19A2 2 0 0119 22H5a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3H19a2 2 0 012 2Z"/></svg>';

        // Folder name
        const name = document.createElement('span');
        name.className = 'folder-name';
        name.textContent = node.title || 'Bookmarks';

        item.appendChild(toggle);
        item.appendChild(icon);
        item.appendChild(name);

        // Children container
        const childrenEl = document.createElement('div');
        childrenEl.className = 'folder-children';
        childrenEl.style.display = 'none';

        // Click to select
        item.addEventListener('click', (e) => {
            if (e.target.closest('.folder-toggle')) return;
            selectFolder(node.id, item);
        });

        // Click toggle to expand/collapse
        toggle.addEventListener('click', () => {
            if (subfolders.length === 0) return;
            const isExpanded = childrenEl.style.display !== 'none';
            childrenEl.style.display = isExpanded ? 'none' : 'block';
            toggle.classList.toggle('expanded', !isExpanded);
        });

        wrapper.appendChild(item);
        wrapper.appendChild(childrenEl);
        parentEl.appendChild(wrapper);

        // Render subfolders
        subfolders.forEach(child => {
            renderFolder(child, childrenEl, preselectId, depth + 1);
        });

        // Pre-select pinned folder and expand its parents
        if (node.id === preselectId) {
            selectFolder(node.id, item);
            // Expand all parent containers
            let parent = wrapper.parentElement;
            while (parent && parent !== folderTree) {
                if (parent.classList.contains('folder-children')) {
                    parent.style.display = 'block';
                    const parentToggle = parent.previousElementSibling?.querySelector('.folder-toggle');
                    if (parentToggle) parentToggle.classList.add('expanded');
                }
                parent = parent.parentElement;
            }
            // Scroll into view after render
            setTimeout(() => item.scrollIntoView({ block: 'nearest' }), 50);
        }

        // Auto-expand first 2 levels
        if (depth < 1 && subfolders.length > 0) {
            childrenEl.style.display = 'block';
            toggle.classList.add('expanded');
        }
    }

    function selectFolder(id, itemEl) {
        // Deselect previous
        const prev = folderTree.querySelector('.folder-item.selected');
        if (prev) prev.classList.remove('selected');

        itemEl.classList.add('selected');
        selectedFolderId = id;
        saveBtn.disabled = false;
    }

    // Save bookmark
    saveBtn.addEventListener('click', () => {
        if (!selectedFolderId || !tabInfo) return;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        chrome.bookmarks.create({
            parentId: selectedFolderId,
            title: tabInfo.title,
            url: tabInfo.url
        }, (created) => {
            if (chrome.runtime.lastError) {
                saveBtn.textContent = 'Error!';
                setTimeout(() => window.close(), 1000);
                return;
            }
            saveBtn.textContent = 'Saved!';
            setTimeout(() => window.close(), 600);
        });
    });

    // Cancel
    cancelBtn.addEventListener('click', () => window.close());

    // ESC to close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') window.close();
        if (e.key === 'Enter' && !saveBtn.disabled) saveBtn.click();
    });
})();
