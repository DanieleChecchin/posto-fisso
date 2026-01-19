async function loadComponent(id, file) {
    try {
        const response = await fetch(file);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.text();
        const placeholder = document.getElementById(id);
        if (!placeholder) return;
        
        placeholder.innerHTML = data;
        
        // Piccola pausa per assicurarsi che il browser abbia processato l'innerHTML
        setTimeout(() => {
            if (id === 'header-placeholder') {
                initSearch();
                setActiveLink();
                initRegisterBtn();
                initCounters();
                initCostSimulator();
            }
            if (id === 'footer-placeholder' || id === 'header-placeholder') {
                initDownloadModal();
            }
            if (id === 'modal-placeholder') {
                initDownloadModal();
            }
            if (id === 'register-modal-placeholder') {
                initRegisterForm();
            }
        }, 10);
    } catch (error) {
        console.error('Error loading component:', error);
    }
}


function initDownloadModal() {
    const downloadButtons = document.querySelectorAll('.btn-download-app');
    const modalElement = document.getElementById('downloadModal');
    
    if (modalElement && downloadButtons.length > 0) {
        // Inizializza la modale di Bootstrap se necessario, 
        // ma noi usiamo l'attributo data-bs-toggle nel markup per semplicità.
        // Qui aggiungiamo la classe a tutti i bottoni che devono aprirla.
        downloadButtons.forEach(btn => {
            btn.setAttribute('data-bs-toggle', 'modal');
            btn.setAttribute('data-bs-target', '#downloadModal');
        });
    }
}

function setActiveLink() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link-custom');
    navLinks.forEach(link => {
        if (link.getAttribute('data-page') === currentPage) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

function initSearch() {
    const searchToggle = document.getElementById('searchToggle');
    const searchBarWrapper = document.getElementById('searchBarWrapper');
    const searchInput = document.getElementById('searchInput');
    const searchResultsNav = document.getElementById('search_results_nav');
    const searchCount = document.getElementById('search_count');
    const prevSearch = document.getElementById('prevSearch');
    const nextSearch = document.getElementById('nextSearch');
    const closeSearch = document.getElementById('closeSearch');

    let matches = [];
    let currentMatchIndex = -1;

    if (searchToggle) {
        searchToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            if (window.getComputedStyle(searchBarWrapper).display === 'none') {
                searchBarWrapper.style.display = 'flex';
                searchInput.focus();
            } else {
                closeSearchBar();
            }
        });
    }

    document.addEventListener('click', function(e) {
        if (searchBarWrapper && window.getComputedStyle(searchBarWrapper).display === 'flex') {
            if (!searchBarWrapper.contains(e.target) && !searchToggle.contains(e.target)) {
                closeSearchBar();
            }
        }
    });

    if (searchBarWrapper) {
        searchBarWrapper.addEventListener('click', function(e) {
            e.stopPropagation();
        });
    }

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && searchBarWrapper && window.getComputedStyle(searchBarWrapper).display === 'flex') {
            closeSearchBar();
        }
    });

    if (closeSearch) closeSearch.addEventListener('click', closeSearchBar);

    function closeSearchBar() {
        if (!searchBarWrapper) return;
        searchBarWrapper.style.display = 'none';
        clearHighlights();
        searchInput.value = '';
        searchResultsNav.style.display = 'none';
    }

    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.trim();
            clearHighlights();
            if (query.length < 2) {
                searchResultsNav.style.display = 'none';
                return;
            }
            performSearch(query);
        });

        searchInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (matches.length > 0) {
                    currentMatchIndex = (currentMatchIndex + 1) % matches.length;
                    updateSearchUI();
                    scrollToCurrentMatch();
                }
            }
        });
    }

    function performSearch(query) {
        matches = [];
        currentMatchIndex = -1;
        const mainContent = document.querySelector('main') || document.body;

        function getTextNodes(node) {
            let textNodes = [];
            if (node.nodeType === Node.TEXT_NODE) {
                if (node.textContent.trim().length > 0) {
                    textNodes.push(node);
                }
            } else {
                if (node.tagName !== 'SCRIPT' && node.tagName !== 'STYLE' && 
                    (!node.classList || !node.classList.contains('search-container'))) {
                    for (let child of node.childNodes) {
                        textNodes.push(...getTextNodes(child));
                    }
                }
            }
            return textNodes;
        }

        const nodesToProcess = getTextNodes(mainContent);
        nodesToProcess.forEach(textNode => {
            const content = textNode.textContent;
            if (content.toLowerCase().includes(query.toLowerCase())) {
                const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
                const parts = content.split(regex);
                const fragment = document.createDocumentFragment();
                parts.forEach(part => {
                    if (part.toLowerCase() === query.toLowerCase()) {
                        const span = document.createElement('span');
                        span.className = 'highlight';
                        span.textContent = part;
                        fragment.appendChild(span);
                        matches.push(span);
                    } else {
                        fragment.appendChild(document.createTextNode(part));
                    }
                });
                if (textNode.parentNode) {
                    textNode.parentNode.replaceChild(fragment, textNode);
                }
            }
        });

        if (matches.length > 0) {
            currentMatchIndex = 0;
            searchResultsNav.style.display = 'flex';
            updateSearchUI();
            scrollToCurrentMatch();
        } else {
            searchResultsNav.style.display = 'none';
        }
    }

    function clearHighlights() {
        const highlights = document.querySelectorAll('.highlight');
        highlights.forEach(h => {
            const parent = h.parentNode;
            if (parent) {
                const textNode = document.createTextNode(h.textContent);
                parent.replaceChild(textNode, h);
                parent.normalize();
            }
        });
        matches = [];
        currentMatchIndex = -1;
    }

    function updateSearchUI() {
        if (searchCount) searchCount.textContent = `${currentMatchIndex + 1}/${matches.length}`;
    }

    function scrollToCurrentMatch() {
        matches.forEach(m => m.classList.remove('current'));
        const current = matches[currentMatchIndex];
        if (current) {
            current.classList.add('current');
            current.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    if (nextSearch) {
        nextSearch.addEventListener('click', function() {
            if (matches.length > 0) {
                currentMatchIndex = (currentMatchIndex + 1) % matches.length;
                updateSearchUI();
                scrollToCurrentMatch();
            }
        });
    }

    if (prevSearch) {
        prevSearch.addEventListener('click', function() {
            if (matches.length > 0) {
                currentMatchIndex = (currentMatchIndex - 1 + matches.length) % matches.length;
                updateSearchUI();
                scrollToCurrentMatch();
            }
        });
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}

document.addEventListener('DOMContentLoaded', function() {
    loadComponent('header-placeholder', 'header.html');
    loadComponent('footer-placeholder', 'footer.html');
    loadComponent('modal-placeholder', 'download-modal.html');
    loadComponent('register-modal-placeholder', 'register-modal.html');
});

function initRegisterBtn() {
    const registerBtns = document.querySelectorAll('#registerBtn');
    registerBtns.forEach(btn => {
        btn.setAttribute('data-bs-toggle', 'modal');
        btn.setAttribute('data-bs-target', '#registerModal');
    });
}

function initRegisterForm() {
    const registerForm = document.getElementById('registerForm');
    const registerFormContainer = document.getElementById('registerFormContainer');
    const registerSuccess = document.getElementById('registerSuccess');
    const registerModal = document.getElementById('registerModal');

    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            // Simulazione invio form
            registerFormContainer.style.display = 'none';
            registerSuccess.style.display = 'block';
        });
    }

    if (registerModal) {
        registerModal.addEventListener('hidden.bs.modal', function () {
            // Reset del form quando la modale viene chiusa
            if (registerForm) {
                registerForm.reset();
                registerFormContainer.style.display = 'block';
                registerSuccess.style.display = 'none';
            }
        });
    }
}

function initCounters() {
    const counters = document.querySelectorAll('.counter');
    if (counters.length === 0) return;

    const speed = 200;

    const startCounter = (counter) => {
        const updateCount = () => {
            const target = +counter.getAttribute('data-target');
            const count = +counter.innerText;
            const inc = target / speed;

            if (count < target) {
                counter.innerText = Math.ceil(count + inc);
                setTimeout(updateCount, 1);
            } else {
                counter.innerText = target;
            }
        };
        updateCount();
    };

    const observerOptions = {
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                startCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    counters.forEach(counter => {
        observer.observe(counter);
    });
}

function initCostSimulator() {
    const range = document.getElementById('durationRange');
    const durationValue = document.getElementById('durationValue');
    const estimatedCost = document.getElementById('estimatedCost');

    if (!range || !durationValue || !estimatedCost) return;

    const hourlyRate = 1.50;

    range.addEventListener('input', function() {
        const hours = parseInt(this.value);
        durationValue.textContent = hours;
        
        const total = (hours * hourlyRate).toFixed(2);
        estimatedCost.textContent = total;
    });
}

