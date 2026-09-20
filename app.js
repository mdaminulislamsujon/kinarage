document.addEventListener("DOMContentLoaded", () => {
    // ==========================================
    // CONFIG
    // ==========================================

    const API_URL = "https://kinarage-backend.onrender.com/api";

    console.log("🚀 KinarAge App Started");
    console.log("🌐 Backend API:", API_URL);

    // ==========================================
    // 1. MOBILE MENU TOGGLE
    // ==========================================

    const mobileMenuButton =
        document.getElementById("mobileMenuButton");

    const mobileNav =
        document.getElementById("mobileNav");

    if (mobileMenuButton && mobileNav) {
        mobileMenuButton.addEventListener("click", () => {
            const isOpen =
                mobileNav.classList.toggle("open");

            mobileMenuButton.setAttribute(
                "aria-expanded",
                String(isOpen)
            );
        });
    }

    // ==========================================
    // 2. DARK / LIGHT THEME TOGGLE
    // ==========================================

    const themeToggle =
        document.getElementById("themeToggle");

    if (themeToggle) {
        const savedTheme =
            localStorage.getItem("kinarage-theme");

        if (savedTheme === "dark") {
            document.body.classList.add("dark");
            themeToggle.textContent = "☀️";
        } else {
            themeToggle.textContent = "🌙";
        }

        themeToggle.addEventListener("click", () => {
            const isDark =
                document.body.classList.toggle("dark");

            localStorage.setItem(
                "kinarage-theme",
                isDark ? "dark" : "light"
            );

            themeToggle.textContent =
                isDark ? "☀️" : "🌙";
        });
    }

    // ==========================================
    // 3. PRODUCTS PAGE
    // ==========================================

    const gridEl =
        document.getElementById("allProductsGrid");

    // Products page না হলে এখানেই stop
    if (!gridEl) {
        console.log(
            "ℹ️ Products grid not found. Skipping products loader."
        );

        return;
    }

    const searchInput =
        document.getElementById("productSearchInput");

    const filterButtons =
        document.querySelectorAll(".filter-btn");

    let productsData = [];
    let currentCategory = "all";
    let searchQuery = "";

    // ==========================================
    // 4. FETCH PRODUCTS
    // ==========================================

    async function fetchProducts() {

        const productsURL =
            `${API_URL}/products`;

        try {

            // Loading message
            gridEl.innerHTML = `
                <div class="no-results">
                    <h3>লোড হচ্ছে...</h3>
                    <p>দয়া করে একটু অপেক্ষা করুন।</p>
                </div>
            `;

            console.log(
                "🔄 Fetching products from:",
                productsURL
            );

            const response = await fetch(productsURL, {
                method: "GET",

                headers: {
                    "Accept": "application/json"
                },

                cache: "no-store"
            });

            console.log(
                "📡 API Response Status:",
                response.status
            );

            console.log(
                "📡 API Response OK:",
                response.ok
            );

            // HTTP error
            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}: ${response.statusText}`
                );
            }

            // Response text আগে নেওয়া হচ্ছে
            const responseText =
                await response.text();

            console.log(
                "📦 API Response:",
                responseText
            );

            if (!responseText.trim()) {

                throw new Error(
                    "Backend returned an empty response."
                );
            }

            let data;

            try {

                data = JSON.parse(responseText);

            } catch (jsonError) {

                console.error(
                    "❌ JSON Parse Error:",
                    jsonError
                );

                throw new Error(
                    "Backend returned invalid JSON."
                );
            }

            // Array check
            if (!Array.isArray(data)) {

                console.error(
                    "❌ Invalid products data:",
                    data
                );

                throw new Error(
                    "Products API did not return an array."
                );
            }

            // Save products
            productsData = data;

            console.log(
                `✅ ${productsData.length} products loaded successfully.`
            );

            // ==========================================
            // URL CATEGORY
            // ==========================================

            const urlParams =
                new URLSearchParams(
                    window.location.search
                );

            const urlCategory =
                urlParams.get("category");

            if (urlCategory) {

                currentCategory =
                    urlCategory
                        .toLowerCase()
                        .trim();

                filterButtons.forEach((button) => {

                    button.classList.toggle(
                        "active",
                        button.dataset.category ===
                            currentCategory
                    );
                });
            }

            // Render
            renderProducts();

        } catch (error) {

            console.error(
                "❌ Products loading failed:",
                error
            );

            console.error(
                "❌ API URL:",
                productsURL
            );

            // Error message
            gridEl.innerHTML = `
                <div class="no-results">
                    <h3>Products load করা যাচ্ছে না</h3>

                    <p>
                        Backend API থেকে product data পাওয়া যায়নি।
                    </p>

                    <p>
                        <strong>API:</strong>
                        <br>
                        <code>
                            ${escapeHTML(productsURL)}
                        </code>
                    </p>

                    <p>
                        <strong>Error:</strong>
                        ${escapeHTML(error.message)}
                    </p>

                    <button
                        type="button"
                        id="retryProductsButton"
                        class="primary-button"
                    >
                        আবার চেষ্টা করুন
                    </button>
                </div>
            `;

            // Retry button
            const retryButton =
                document.getElementById(
                    "retryProductsButton"
                );

            if (retryButton) {

                retryButton.addEventListener(
                    "click",
                    fetchProducts
                );
            }
        }
    }

    // ==========================================
    // 5. RENDER PRODUCTS
    // ==========================================

    function renderProducts() {

        const filteredProducts =
            productsData.filter((product) => {

                const category =
                    String(
                        product.category || ""
                    )
                        .toLowerCase()
                        .trim();

                const name =
                    String(
                        product.name || ""
                    )
                        .toLowerCase();

                // Smartphone -> mobile support
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

                return (
                    categoryMatches &&
                    searchMatches
                );
            });

        // No products
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
        gridEl.innerHTML =
            filteredProducts
                .map((product) => {

                    const productId =
                        product.id;

                    return `
                        <div class="product-card">

                            <div class="product-card-img">
                                ${escapeHTML(
                                    product.icon || "📱"
                                )}
                            </div>

                            <span class="product-tag">
                                ${escapeHTML(
                                    product.category ||
                                    "Product"
                                )}
                            </span>

                            <h3>
                                ${escapeHTML(
                                    product.name ||
                                    "Unnamed Product"
                                )}
                            </h3>

                            <div class="product-price">
                                ${escapeHTML(
                                    product.price ||
                                    "N/A"
                                )}
                            </div>

                            <div class="product-meta">

                                <span>
                                    Rating:
                                    <strong>
                                        ${escapeHTML(
                                            product.rating ||
                                            "N/A"
                                        )}
                                    </strong>
                                </span>

                                <span>
                                    Value:
                                    <strong>
                                        ${escapeHTML(
                                            product.value ||
                                            "N/A"
                                        )}
                                    </strong>
                                </span>

                            </div>

                            <a
                                href="compare.html?id=${encodeURIComponent(
                                    productId
                                )}"
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

            currentCategory =
                (
                    button.dataset.category ||
                    "all"
                )
                    .toLowerCase()
                    .trim();

            renderProducts();
        });
    });

    // ==========================================
    // 7. SEARCH
    // ==========================================

    if (searchInput) {

        searchInput.addEventListener(
            "input",
            (event) => {

                searchQuery =
                    event.target.value
                        .toLowerCase()
                        .trim();

                renderProducts();
            }
        );
    }

    // ==========================================
    // 8. HTML ESCAPE
    // ==========================================

    function escapeHTML(value) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );
    }

    // ==========================================
    // 9. LOAD PRODUCTS
    // ==========================================

    fetchProducts();
});
