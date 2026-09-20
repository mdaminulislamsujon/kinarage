document.addEventListener("DOMContentLoaded", () => {

    // ==========================================
    // CONFIG
    // ==========================================

    const API_URL =
        "https://kinarage-backend-cloudinary.onrender.com/api";

    const PRODUCTS_URL =
        "https://kinarage-backend-cloudinary.onrender.com/api/products";

    const SERVER_URL =
        "https://kinarage-backend.onrender.com";

    console.log("🚀 KinarAge App Started");
    console.log("🌐 Products API:", PRODUCTS_URL);
    console.log("🖼️ Image Server:", SERVER_URL);


    // ==========================================
    // 1. MOBILE MENU
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
    // 2. DARK / LIGHT THEME
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

            document.body.classList.remove("dark");

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
    // 3. HTML ESCAPE
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
    // 4. PRODUCT IMAGE URL
    // ==========================================

    function getImageURL(imageUrl) {

        if (!imageUrl) {

            return null;

        }


        // Already a full URL
        if (
            imageUrl.startsWith("http://") ||
            imageUrl.startsWith("https://")
        ) {

            return imageUrl;

        }


        // Backend relative URL
        if (imageUrl.startsWith("/")) {

            return `${SERVER_URL}${imageUrl}`;

        }


        // Relative URL without /
        return `${SERVER_URL}/${imageUrl}`;

    }


    // ==========================================
    // 5. PRODUCT IMAGE HTML
    // ==========================================

    function getProductImageHTML(product) {

        const imageURL =
            getImageURL(product.image_url);


        // If uploaded image exists
        if (imageURL) {

            return `

                <img
                    src="${escapeHTML(imageURL)}"
                    alt="${escapeHTML(
                        product.name || "Product"
                    )}"
                    loading="lazy"
                    onerror="
                        this.onerror=null;
                        this.style.display='none';
                        this.parentElement.innerHTML='📱';
                    "
                >

            `;

        }


        // Fallback to icon
        return escapeHTML(
            product.icon || "📱"
        );

    }


    // ==========================================
    // 6. FETCH PRODUCTS
    // ==========================================

    async function getProducts() {

        console.log(
            "🔄 Fetching:",
            PRODUCTS_URL
        );


        const response =
            await fetch(
                PRODUCTS_URL,
                {
                    method: "GET",

                    headers: {
                        "Accept": "application/json"
                    },

                    cache: "no-store"
                }
            );


        console.log(
            "📡 Response:",
            response.status,
            response.ok
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );

        }


        const responseText =
            await response.text();


        console.log(
            "📦 API Response:",
            responseText
        );


        if (!responseText.trim()) {

            throw new Error(
                "Backend returned empty response."
            );

        }


        let data;


        try {

            data =
                JSON.parse(responseText);

        } catch (error) {

            throw new Error(
                "Backend returned invalid JSON."
            );

        }


        if (!Array.isArray(data)) {

            console.error(
                "❌ API data:",
                data
            );

            throw new Error(
                "Products API did not return an array."
            );

        }


        console.log(
            `✅ ${data.length} products loaded.`
        );


        // Debug image URLs
        data.forEach((product) => {

            console.log(
                `🖼️ ${product.name}:`,
                product.image_url,
                "→",
                getImageURL(product.image_url)
            );

        });


        return data;

    }


    // ==========================================
    // 7. PRODUCTS PAGE
    // ==========================================

    const gridEl =
        document.getElementById(
            "allProductsGrid"
        );


    if (gridEl) {

        const searchInput =
            document.getElementById(
                "productSearchInput"
            );


        const filterButtons =
            document.querySelectorAll(
                ".filter-btn"
            );


        let productsData = [];

        let currentCategory = "all";

        let searchQuery = "";


        // ==========================================
        // RENDER PRODUCTS PAGE
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


                    const searchMatches =
                        name.includes(searchQuery) ||
                        category.includes(searchQuery);


                    let categoryMatches =
                        currentCategory === "all" ||
                        category === currentCategory;


                    // mobile -> smartphone / phone support
                    if (
                        currentCategory === "mobile" &&
                        (
                            category === "smartphone" ||
                            category === "phone" ||
                            category === "mobile"
                        )
                    ) {

                        categoryMatches = true;

                    }


                    return (
                        categoryMatches &&
                        searchMatches
                    );

                });


            if (filteredProducts.length === 0) {

                gridEl.innerHTML = `

                    <div class="no-results">

                        <h3>
                            কোনো প্রোডাক্ট পাওয়া যায়নি
                        </h3>

                        <p>
                            অন্য কিওয়ার্ড বা ক্যাটাগরি দিয়ে চেষ্টা করুন।
                        </p>

                    </div>

                `;

                return;

            }


            gridEl.innerHTML =
                filteredProducts
                    .map((product) => {

                        const productId =
                            product.id || "";


                        return `

                            <div class="product-card">

                                <div class="product-card-img">

                                    ${getProductImageHTML(product)}

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
        // LOAD PRODUCTS PAGE
        // ==========================================

        async function loadProductsPage() {

            gridEl.innerHTML = `

                <div class="no-results">

                    <h3>
                        লোড হচ্ছে...
                    </h3>

                    <p>
                        দয়া করে একটু অপেক্ষা করুন।
                    </p>

                </div>

            `;


            try {

                productsData =
                    await getProducts();


                // URL category
                const urlParams =
                    new URLSearchParams(
                        window.location.search
                    );


                const urlCategory =
                    urlParams.get("category");


                const urlSearch =
                    urlParams.get("search");


                if (urlCategory) {

                    currentCategory =
                        urlCategory
                            .toLowerCase()
                            .trim();


                    filterButtons.forEach(
                        (button) => {

                            button.classList.toggle(
                                "active",
                                (
                                    button.dataset.category ||
                                    ""
                                )
                                    .toLowerCase()
                                    ===
                                    currentCategory
                            );

                        }
                    );

                }


                if (urlSearch) {

                    searchQuery =
                        urlSearch
                            .toLowerCase()
                            .trim();


                    if (searchInput) {

                        searchInput.value =
                            urlSearch;

                    }

                }


                renderProducts();


            } catch (error) {

                console.error(
                    "❌ Products loading failed:",
                    error
                );


                gridEl.innerHTML = `

                    <div class="no-results">

                        <h3>
                            Products load করা যাচ্ছে না
                        </h3>

                        <p>
                            Backend API থেকে product data পাওয়া যায়নি।
                        </p>

                        <p>

                            <strong>
                                API:
                            </strong>

                            <br>

                            <code>
                                ${escapeHTML(
                                    PRODUCTS_URL
                                )}
                            </code>

                        </p>


                        <p>

                            <strong>
                                Error:
                            </strong>

                            ${escapeHTML(
                                error.message
                            )}

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


                const retryButton =
                    document.getElementById(
                        "retryProductsButton"
                    );


                if (retryButton) {

                    retryButton.addEventListener(
                        "click",
                        loadProductsPage
                    );

                }

            }

        }


        // ==========================================
        // CATEGORY FILTER
        // ==========================================

        filterButtons.forEach((button) => {

            button.addEventListener(
                "click",
                () => {

                    filterButtons.forEach(
                        (btn) => {

                            btn.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    currentCategory =
                        (
                            button.dataset.category ||
                            "all"
                        )
                            .toLowerCase()
                            .trim();


                    renderProducts();

                }
            );

        });


        // ==========================================
        // PRODUCT SEARCH
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


        loadProductsPage();

    }


    // ==========================================
    // 8. INDEX FEATURED PRODUCTS
    // ==========================================

    const featuredProducts =
        document.getElementById(
            "featuredProducts"
        );


    if (featuredProducts) {

        async function loadFeaturedProducts() {

            featuredProducts.innerHTML = `

                <div class="loading-card">

                    <div class="loading-spinner"></div>

                    <span>
                        Products loading...
                    </span>

                </div>

            `;


            try {

                const products =
                    await getProducts();


                if (products.length === 0) {

                    featuredProducts.innerHTML = `

                        <div class="no-results">

                            <h3>
                                No products available
                            </h3>

                            <p>
                                Backend থেকে এখনো কোনো product পাওয়া যায়নি।
                            </p>

                        </div>

                    `;

                    return;

                }


                // প্রথম 6টি product
                const featured =
                    products.slice(0, 6);


                featuredProducts.innerHTML =
                    featured
                        .map((product) => {

                            const productId =
                                product.id || "";


                            return `

                                <div class="product-card">

                                    <div class="product-card-img">

                                        ${getProductImageHTML(product)}

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


                console.log(
                    `⭐ ${featured.length} featured products rendered.`
                );


            } catch (error) {

                console.error(
                    "❌ Featured products loading failed:",
                    error
                );


                featuredProducts.innerHTML = `

                    <div class="no-results">

                        <h3>
                            Products load করা যাচ্ছে না
                        </h3>

                        <p>
                            Backend API থেকে product data পাওয়া যায়নি।
                        </p>


                        <p
                            style="
                                font-size:14px;
                                color:var(--text-muted);
                                margin-top:8px;
                            "
                        >

                            Error:
                            ${escapeHTML(
                                error.message ||
                                "Unknown error"
                            )}

                        </p>


                        <button
                            type="button"
                            id="retryFeaturedButton"
                            class="primary-button"
                            style="margin-top:15px;"
                        >
                            আবার চেষ্টা করুন
                        </button>

                    </div>

                `;


                const retryButton =
                    document.getElementById(
                        "retryFeaturedButton"
                    );


                if (retryButton) {

                    retryButton.addEventListener(
                        "click",
                        loadFeaturedProducts
                    );

                }

            }

        }


        loadFeaturedProducts();

    }


    // ==========================================
    // 9. NEWSLETTER
    // ==========================================

    const newsletterForm =
        document.getElementById(
            "newsletterForm"
        );


    if (newsletterForm) {

        newsletterForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();


                alert(
                    "Thanks! Newsletter system will be connected in the next version."
                );


                newsletterForm.reset();

            }
        );

    }


    // ==========================================
    // 10. INDEX SEARCH
    // ==========================================

    const mainSearch =
        document.getElementById("mainSearch");


    const searchButton =
        document.getElementById("searchButton");


    function performSearch() {

        if (!mainSearch) return;


        const query =
            mainSearch.value.trim();


        if (!query) {

            mainSearch.focus();

            return;

        }


        window.location.href =
            "products.html?search=" +
            encodeURIComponent(query);

    }


    if (searchButton) {

        searchButton.addEventListener(
            "click",
            performSearch
        );

    }


    if (mainSearch) {

        mainSearch.addEventListener(
            "keydown",
            (event) => {

                if (event.key === "Enter") {

                    event.preventDefault();

                    performSearch();

                }

            }
        );

    }

});
