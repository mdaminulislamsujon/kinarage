document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // CONFIG
    // ==========================================
    const API_URL = "http://localhost:5000/api";

    // ==========================================
    // 1. MOBILE MENU TOGGLE
    // ==========================================
    const mobileMenuButton = document.getElementById("mobileMenuButton");
    const mobileNav = document.getElementById("mobileNav");

    if (mobileMenuButton && mobileNav) {
        mobileMenuButton.addEventListener("click", () => {
            const isOpen = mobileNav.classList.toggle("open");
            mobileMenuButton.setAttribute("aria-expanded", isOpen);
        });
    }

    // ==========================================
    // 2. DARK / LIGHT THEME TOGGLE
    // ==========================================
    const themeToggle = document.getElementById("themeToggle");

    if (themeToggle) {
        const savedTheme = localStorage.getItem("kinarage-theme");

        if (savedTheme === "dark") {
            document.body.classList.add("dark");
            themeToggle.textContent = "☀️";
        }

        themeToggle.addEventListener("click", () => {
            const isDark = document.body.classList.toggle("dark");

            localStorage.setItem(
                "kinarage-theme",
                isDark ? "dark" : "light"
            );

            themeToggle.textContent = isDark ? "☀️" : "🌙";
        });
    }

    // ==========================================
    // 3. PRODUCTS PAGE
    // ==========================================
    const gridEl = document.getElementById("allProductsGrid");

    // এই page-এ product grid না থাকলে এখানেই stop
    if (!gridEl) {
        return;
    }

    const searchInput = document.getElementById("productSearchInput");
    const filterButtons = document.querySelectorAll(".filter-btn");

    let productsData = [];
    let currentCategory = "all";
    let searchQuery = "";

    // ==========================================
    // 4. FETCH PRODUCTS FROM POSTGRESQL API
    // ==========================================
    async function fetchProducts() {
        try {
            gridEl.innerHTML = `
                <div class="no-results">
                    <h3>লোড হচ্ছে...</h3>
                    <p>দয়া করে একটু অপেক্ষা করুন।</p>
                </div>
            `;

            const response = await fetch(`${API_URL}/products`);

            if (!response.ok) {
                throw new Error(`HTTP Error: ${response.status}`);
            }

            productsData = await response.json();

            console.log("Products loaded:", productsData);

            // URL থেকে category নেওয়া
            const urlParams = new URLSearchParams(window.location.search);
            const urlCategory = urlParams.get("category");

            if (urlCategory) {
                currentCategory = urlCategory.toLowerCase();

                filterButtons.forEach((button) => {
                    button.classList.toggle(
                        "active",
                        button.dataset.category === currentCategory
                    );
                });
            }

            renderProducts();

        } catch (error) {
            console.error("Backend Error:", error);

            gridEl.innerHTML = `
                <div class="no-results">
                    <h3>সার্ভার কানেক্ট করা যাচ্ছে না</h3>
                    <p>
                        Node.js backend চালু আছে কিনা দেখুন।
                    </p>
                    <p>
                        <code>http://localhost:5000/api/products</code>
                    </p>
                </div>
            `;
        }
    }

    // ==========================================
    // 5. RENDER PRODUCTS
    // ==========================================
    function renderProducts() {
        const filteredProducts = productsData.filter((product) => {

            const category = String(product.category || "")
                .toLowerCase()
                .trim();

            const name = String(product.name || "")
                .toLowerCase();

            // smartphone -> mobile হিসেবেও কাজ করবে
            const categoryMatches =
                currentCategory === "all" ||
                category === currentCategory ||
                (
                    currentCategory === "mobile" &&
                    category === "smartphone"
                );

            const searchMatches =
                name.includes(searchQuery) ||
                category.includes(searchQuery);

            return categoryMatches && searchMatches;
        });

        // কোনো product পাওয়া না গেলে
        if (filteredProducts.length === 0) {
            gridEl.innerHTML = `
                <div class="no-results">
                    <h3>কোনো প্রোডাক্ট পাওয়া যায়নি</h3>
                    <p>
                        অন্য কিওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন।
                    </p>
                </div>
            `;

            return;
        }

        // Product cards
        gridEl.innerHTML = filteredProducts
            .map((product) => {

                // PostgreSQL-এর id
                const productId = product.id;

                return `
                    <div class="product-card">

                        <div class="product-card-img">
                            ${escapeHTML(product.icon || "📱")}
                        </div>

                        <span class="product-tag">
                            ${escapeHTML(product.category || "Product")}
                        </span>

                        <h3>
                            ${escapeHTML(product.name || "Unnamed Product")}
                        </h3>

                        <div class="product-price">
                            ${escapeHTML(product.price || "N/A")}
                        </div>

                        <div class="product-meta">
                            <span>
                                Rating:
                                <strong>
                                    ${escapeHTML(product.rating || "N/A")}
                                </strong>
                            </span>

                            <span>
                                Value:
                                <strong>
                                    ${escapeHTML(product.value || "N/A")}
                                </strong>
                            </span>
                        </div>

                        <a
                            href="compare.html?id=${encodeURIComponent(productId)}"
                            class="primary-button"
                        >
                            Compare & Details
                        </a>

                    </div>
                `;
            })
            .join("");
    }

    // ==========================================
    // 6. CATEGORY FILTER
    // ==========================================
    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {

            filterButtons.forEach((btn) => {
                btn.classList.remove("active");
            });

            button.classList.add("active");

            currentCategory = button.dataset.category;

            renderProducts();
        });
    });

    // ==========================================
    // 7. SEARCH
    // ==========================================
    if (searchInput) {
        searchInput.addEventListener("input", (event) => {

            searchQuery = event.target.value
                .toLowerCase()
                .trim();

            renderProducts();
        });
    }

    // ==========================================
    // 8. BASIC HTML ESCAPE
    // ==========================================
    function escapeHTML(value) {
        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // ==========================================
    // 9. LOAD PRODUCTS
    // ==========================================
    fetchProducts();
});
