// ==========================================
// App.js - Summer Assortment Product Review
// ==========================================

(function () {
  'use strict';

  const { createApp, ref, reactive, computed, watch, onMounted, onBeforeUnmount } = Vue;
  const { createVuetify } = Vuetify;

  const FALLBACK_IMAGE =
    'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 fill=%22%23333%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23181a3b%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22 fill=%22%23666%22%3ENo Image%3C/text%3E%3C/svg%3E';

  const sortOptions = [
    { title: 'Default', value: 'default' },
    { title: 'Price: Low -> High', value: 'price-low' },
    { title: 'Price: High -> Low', value: 'price-high' },
    { title: 'Discount: Highest', value: 'discount-high' },
    { title: 'Stock: Highest', value: 'stock-high' },
    { title: 'Stock: Lowest', value: 'stock-low' },
    { title: 'Name: A -> Z', value: 'name-az' },
  ];

  const sourceProducts =
    typeof PRODUCTS !== 'undefined' && Array.isArray(PRODUCTS) ? PRODUCTS : [];

  function isWomenProduct(product) {
    const haystack = [
      product && product.name,
      product && product.subcatLv1,
      product && product.subcatLv2,
      product && product.subcatLv3,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes('women');
  }

  const womenProducts = sourceProducts.filter(isWomenProduct);

  const vuetify = createVuetify({
    icons: {
      defaultSet: 'mdi',
    },
    theme: {
      defaultTheme: 'trendPulse',
      themes: {
        trendPulse: {
          dark: true,
          colors: {
            background: '#0a1220',
            surface: '#131d2d',
            primary: '#42d7af',
            secondary: '#6793ff',
            error: '#ff5f7b',
            warning: '#f6bc59',
            info: '#6fb9ff',
            success: '#42d7af',
          },
        },
      },
    },
  });

  createApp({
    setup() {
      const currentView = ref('grid');
      const selectedProduct = ref(null);
      const copiedProductId = ref('');
      const showBackToTop = ref(false);

      const filters = reactive({
        query: '',
        category: null,
        subcategory: null,
        am: null,
        sort: 'default',
      });

      function formatPrice(amount) {
        if (!amount && amount !== 0) return '—';
        return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
      }

      function formatStock(stock) {
        const stockNum = Number(stock) || 0;
        if (stockNum >= 1000000) return (stockNum / 1000000).toFixed(1) + 'M';
        if (stockNum >= 1000) return (stockNum / 1000).toFixed(0) + 'K';
        return String(stock);
      }

      function calcDiscount(original, discounted) {
        if (!original || !discounted || original <= discounted) return 0;
        return Math.round(((original - discounted) / original) * 100);
      }

      function discountPct(product) {
        return calcDiscount(product.originalPrice, product.discountedPrice);
      }

      function clearSearch() {
        filters.query = '';
      }

      function cardDelay(index) {
        return `${Math.min(index * 35, 320)}ms`;
      }

      const categories = computed(() => {
        return [...new Set(womenProducts.map((p) => p.subcatLv1).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
      });

      const subcategories = computed(() => {
        return [...new Set(womenProducts.map((p) => p.subcatLv2).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
      });

      const accountManagers = computed(() => {
        return [...new Set(womenProducts.map((p) => p.am).filter(Boolean))]
          .sort((a, b) => a.localeCompare(b));
      });

      const filteredProducts = computed(() => {
        const query = filters.query.toLowerCase().trim();

        const list = womenProducts.filter((p) => {
          if (query) {
            const searchStr = [
              p.name,
              p.brand,
              p.am,
              p.subcatLv1,
              p.subcatLv2,
              p.subcatLv3,
              p.id,
            ]
              .join(' ')
              .toLowerCase();

            if (!searchStr.includes(query)) return false;
          }

          if (filters.category && p.subcatLv1 !== filters.category) return false;
          if (filters.subcategory && p.subcatLv2 !== filters.subcategory) return false;
          if (filters.am && p.am !== filters.am) return false;

          return true;
        });

        switch (filters.sort) {
          case 'price-low':
            list.sort((a, b) => a.discountedPrice - b.discountedPrice);
            break;
          case 'price-high':
            list.sort((a, b) => b.discountedPrice - a.discountedPrice);
            break;
          case 'discount-high':
            list.sort((a, b) => discountPct(b) - discountPct(a));
            break;
          case 'stock-high':
            list.sort((a, b) => b.stock - a.stock);
            break;
          case 'stock-low':
            list.sort((a, b) => a.stock - b.stock);
            break;
          case 'name-az':
            list.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            break;
          default:
            break;
        }

        return list;
      });

      const stats = computed(() => {
        const items = filteredProducts.value;
        const totalProducts = items.length;
        const totalBrands = new Set(items.map((p) => p.brand)).size;

        let totalDiscount = 0;
        let discountCount = 0;
        items.forEach((item) => {
          const discount = discountPct(item);
          if (discount > 0) {
            totalDiscount += discount;
            discountCount += 1;
          }
        });

        const avgDiscount = discountCount > 0 ? Math.round(totalDiscount / discountCount) : 0;

        return {
          totalProducts,
          totalBrands,
          avgDiscount,
        };
      });

      const resultsText = computed(() => {
        return `Showing ${filteredProducts.value.length} / ${womenProducts.length} women products`;
      });

      const isDialogOpen = computed({
        get: () => Boolean(selectedProduct.value),
        set: (value) => {
          if (!value) closeModal();
        },
      });

      function onImageError(event) {
        if (!event || !event.target) return;
        event.target.onerror = null;
        event.target.src = FALLBACK_IMAGE;
      }

      function openModal(product) {
        selectedProduct.value = product;
      }

      function closeModal() {
        selectedProduct.value = null;
        copiedProductId.value = '';
      }

      async function copyProductId(productId) {
        try {
          await navigator.clipboard.writeText(productId);
          copiedProductId.value = productId;
          setTimeout(() => {
            if (copiedProductId.value === productId) {
              copiedProductId.value = '';
            }
          }, 1200);
        } catch (error) {
          copiedProductId.value = '';
        }
      }

      function scrollToTop() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }

      function onScroll() {
        showBackToTop.value = window.scrollY > 300;
      }

      function onKeyDown(event) {
        if (event.key === 'Escape') closeModal();
      }

      watch(selectedProduct, (product) => {
        document.body.style.overflow = product ? 'hidden' : '';
      });

      onMounted(() => {
        window.addEventListener('scroll', onScroll, { passive: true });
        document.addEventListener('keydown', onKeyDown);
        onScroll();
      });

      onBeforeUnmount(() => {
        window.removeEventListener('scroll', onScroll);
        document.removeEventListener('keydown', onKeyDown);
        document.body.style.overflow = '';
      });

      return {
        currentView,
        selectedProduct,
        copiedProductId,
        showBackToTop,
        filters,
        sortOptions,
        categories,
        subcategories,
        accountManagers,
        filteredProducts,
        stats,
        resultsText,
        isDialogOpen,
        formatPrice,
        formatStock,
        discountPct,
        clearSearch,
        cardDelay,
        onImageError,
        openModal,
        closeModal,
        copyProductId,
        scrollToTop,
      };
    },
  }).use(vuetify).mount('#app');
})();
