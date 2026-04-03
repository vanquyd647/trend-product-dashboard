<template>
  <v-app class="app-shell">
    <!-- Hero Section (non-fixed, scrolls with page) -->
    <div class="hero-bar">
      <v-container class="hero-container">
        <div class="hero-text">
          <p class="eyebrow">{{ $t('hero.eyebrow') }}</p>
          <h1 class="hero-title">{{ $t('hero.title') }}</h1>
        </div>
        <div class="hero-right">
          <div class="hero-stats">
            <v-chip class="stat-chip" color="primary" variant="flat" prepend-icon="mdi-cube-outline" size="small">
              {{ stats.totalProducts }} {{ $t('hero.products') }}
            </v-chip>
            <v-chip class="stat-chip" color="secondary" variant="flat" prepend-icon="mdi-store-outline" size="small">
              {{ stats.totalBrands }} {{ $t('hero.brands') }}
            </v-chip>
            <v-chip class="stat-chip" color="warning" variant="flat" prepend-icon="mdi-percent-outline" size="small">
              {{ stats.avgDiscount }}% {{ $t('hero.avgDiscount') }}
            </v-chip>
          </div>
          <v-btn
            class="lang-switch"
            variant="outlined"
            size="small"
            rounded="lg"
            :prepend-icon="locale === 'vi' ? 'mdi-translate' : 'mdi-translate'"
            @click="toggleLocale"
          >
            {{ $t('lang.switchTo') }}
          </v-btn>
        </div>
      </v-container>
    </div>

    <v-main>
      <v-container class="py-6">
        <!-- Filter Card -->
        <v-card class="filter-card" rounded="xl" elevation="0">
          <v-card-text class="pt-5 pb-4">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model.trim="filters.query"
                  :label="$t('filter.search')"
                  prepend-inner-icon="mdi-magnify"
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  hide-details
                  class="filter-input"
                />
              </v-col>
              <v-col cols="6" md="2">
                <v-select
                  v-model="filters.category"
                  :items="categories"
                  :label="$t('filter.category')"
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  hide-details
                  class="filter-input"
                />
              </v-col>
              <v-col cols="6" md="2">
                <v-select
                  v-model="filters.subcategory"
                  :items="subcategories"
                  :label="$t('filter.subcategory')"
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  hide-details
                  class="filter-input"
                />
              </v-col>
              <v-col cols="6" md="2">
                <v-select
                  v-model="filters.am"
                  :items="accountManagers"
                  :label="$t('filter.am')"
                  clearable
                  variant="solo-filled"
                  density="comfortable"
                  hide-details
                  class="filter-input"
                />
              </v-col>
              <v-col cols="6" md="2">
                <v-select
                  v-model="filters.sort"
                  :items="localizedSortOptions"
                  item-title="title"
                  item-value="value"
                  :label="$t('filter.sort')"
                  variant="solo-filled"
                  density="comfortable"
                  hide-details
                  class="filter-input"
                />
              </v-col>
            </v-row>

            <div class="filter-actions">
              <v-btn-toggle v-model="currentView" mandatory color="primary" rounded="lg" variant="outlined" density="comfortable">
                <v-btn value="grid" prepend-icon="mdi-view-grid-outline" size="small">{{ $t('view.cards') }}</v-btn>
                <v-btn value="table" prepend-icon="mdi-table" size="small">{{ $t('view.table') }}</v-btn>
              </v-btn-toggle>
              <div class="result-text">
                <v-icon size="16" class="me-1">mdi-filter-variant</v-icon>
                {{ resultsText }}
              </div>
            </div>
          </v-card-text>
        </v-card>

        <!-- Empty State -->
        <v-alert
          v-if="filteredProducts.length === 0"
          class="mt-6"
          type="warning"
          variant="tonal"
          rounded="xl"
          icon="mdi-magnify-close"
        >
          <v-alert-title>{{ $t('empty.title') }}</v-alert-title>
          {{ $t('empty.message') }}
        </v-alert>

        <!-- Content Area -->
        <template v-else>
          <!-- Grid View -->
          <v-row v-if="currentView === 'grid'" class="mt-2 product-grid">
            <v-col
              v-for="(product, index) in paginatedProducts"
              :key="product.id"
              cols="6"
              sm="6"
              md="4"
              lg="4"
              xl="3"
            >
              <v-card
                class="product-card h-100"
                rounded="xl"
                elevation="0"
                :style="{ animationDelay: cardDelay(index) }"
                @click="openModal(product)"
              >
                <div class="product-media">
                  <img
                    class="product-image"
                    :src="product.linkImage"
                    :alt="product.name"
                    loading="lazy"
                    @error="onImageError"
                  >
                  <div class="badge-stack">
                    <v-chip v-if="discountPct(product) > 0" color="error" size="small" label>
                      -{{ discountPct(product) }}%
                    </v-chip>
                    <v-chip v-if="product.stock > 500000" color="warning" size="small" label>
                      <v-icon start size="12">mdi-fire</v-icon> {{ $t('product.hot') }}
                    </v-chip>
                  </div>
                </div>
                <v-card-text class="card-body">
                  <p class="brand-line">{{ product.brand }}</p>
                  <h3 class="name-line">{{ product.name }}</h3>
                  <p class="category-line">{{ product.subcatLv2 }} · {{ product.subcatLv3 }}</p>
                  <div class="price-row">
                    <span class="price-current">{{ formatPrice(product.discountedPrice) }}</span>
                    <span class="price-old" v-if="product.originalPrice !== product.discountedPrice">
                      {{ formatPrice(product.originalPrice) }}
                    </span>
                  </div>
                  <v-divider class="my-3" style="opacity: 0.12" />
                  <div class="meta-row">
                    <span><v-icon size="14" class="me-1">mdi-account-circle-outline</v-icon>{{ product.am }}</span>
                    <span><v-icon size="14" class="me-1">mdi-package-variant-closed</v-icon>{{ formatStock(product.stock) }}</span>
                  </div>
                </v-card-text>
              </v-card>
            </v-col>
          </v-row>

          <!-- Table View -->
          <v-card v-else class="table-card mt-4" rounded="xl" elevation="0">
            <!-- Mobile: Card-list style -->
            <div class="mobile-table-list d-md-none">
              <div
                v-for="(product, index) in paginatedProducts"
                :key="product.id"
                class="mobile-table-item"
                @click="openModal(product)"
              >
                <img class="mobile-table-thumb" :src="product.linkImage" :alt="product.name" loading="lazy" @error="onImageError">
                <div class="mobile-table-info">
                  <p class="mobile-table-brand">{{ product.brand }}</p>
                  <p class="mobile-table-name">{{ product.name }}</p>
                  <div class="mobile-table-prices">
                    <span class="mobile-price-current">{{ formatPrice(product.discountedPrice) }}</span>
                    <span class="mobile-price-old" v-if="product.originalPrice !== product.discountedPrice">{{ formatPrice(product.originalPrice) }}</span>
                  </div>
                  <div class="mobile-table-meta">
                    <span>{{ product.am }}</span>
                    <span>{{ formatStock(product.stock) }} {{ $t('product.stock') }}</span>
                  </div>
                </div>
              </div>
            </div>
            <!-- Desktop: Regular table -->
            <v-table class="results-table d-none d-md-block" fixed-header height="68vh">
              <thead>
                <tr>
                  <th class="text-center" style="width: 50px">#</th>
                  <th style="width: 60px">{{ $t('table.image') }}</th>
                  <th>{{ $t('table.product') }}</th>
                  <th>{{ $t('table.brand') }}</th>
                  <th>{{ $t('table.am') }}</th>
                  <th>{{ $t('table.category') }}</th>
                  <th class="text-right">{{ $t('table.original') }}</th>
                  <th class="text-right">{{ $t('table.sale') }}</th>
                  <th class="text-right">{{ $t('table.discounted') }}</th>
                  <th class="text-right">{{ $t('table.stock') }}</th>
                  <th style="width: 90px"></th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(product, index) in paginatedProducts"
                  :key="product.id"
                  class="table-row"
                  @click="openModal(product)"
                >
                  <td class="text-center">{{ (currentPage - 1) * itemsPerPage + index + 1 }}</td>
                  <td>
                    <img class="table-thumb" :src="product.linkImage" :alt="product.name" loading="lazy" @error="onImageError">
                  </td>
                  <td class="table-name" :title="product.name">{{ product.name }}</td>
                  <td>{{ product.brand }}</td>
                  <td>{{ product.am }}</td>
                  <td>{{ product.subcatLv2 }}</td>
                  <td class="text-right">{{ formatPrice(product.originalPrice) }}</td>
                  <td class="text-right">{{ formatPrice(product.salePrice) }}</td>
                  <td class="text-right font-weight-bold" style="color: #9ffff4">{{ formatPrice(product.discountedPrice) }}</td>
                  <td class="text-right">{{ formatStock(product.stock) }}</td>
                  <td>
                    <v-btn size="x-small" color="primary" variant="tonal" rounded="lg" @click.stop="openModal(product)">
                      <v-icon size="14">mdi-eye-outline</v-icon>
                    </v-btn>
                  </td>
                </tr>
              </tbody>
            </v-table>
          </v-card>

          <!-- Pagination -->
          <div class="pagination-wrapper mt-5" v-if="totalPages > 1">
            <v-pagination
              v-model="currentPage"
              :length="totalPages"
              :total-visible="paginationVisible"
              rounded="lg"
              density="comfortable"
              active-color="primary"
              @update:model-value="scrollToTop"
            />
          </div>
          <!-- Spacer to prevent FAB overlap -->
          <div class="pagination-bottom-spacer"></div>
        </template>
      </v-container>
    </v-main>

    <!-- Product Detail Dialog -->
    <v-dialog v-model="isDialogOpen" :max-width="dialogMaxWidth" scrollable :fullscreen="isMobile">
      <v-card v-if="selectedProduct" class="detail-dialog" rounded="xl">
        <v-btn icon="mdi-close" variant="text" size="small" class="dialog-close" @click="closeModal" />

        <v-card-text class="pa-4 pa-sm-6 pa-md-8">
          <v-row>
            <v-col cols="12" md="5">
              <div class="dialog-image-wrap">
                <img class="dialog-image" :src="selectedProduct.linkImage" :alt="selectedProduct.name" @error="onImageError">
              </div>
              <div class="d-flex flex-wrap ga-2 mt-3">
                <v-chip color="primary" variant="flat" size="small">{{ selectedProduct.subcatLv1 }}</v-chip>
                <v-chip v-if="selectedProduct.subcatLv2" color="secondary" variant="tonal" size="small">{{ selectedProduct.subcatLv2 }}</v-chip>
                <v-chip v-if="discountPct(selectedProduct) > 0" color="error" variant="flat" size="small">
                  -{{ discountPct(selectedProduct) }}% {{ $t('dialog.off') }}
                </v-chip>
                <v-chip v-if="selectedProduct.stock > 500000" color="warning" variant="flat" size="small">
                  <v-icon start size="12">mdi-fire</v-icon> {{ $t('dialog.hotItem') }}
                </v-chip>
              </div>
            </v-col>

            <v-col cols="12" md="7">
              <p class="dialog-brand">{{ selectedProduct.brand }}</p>
              <h2 class="dialog-name">{{ selectedProduct.name }}</h2>
              <p class="dialog-category">
                <v-icon size="14" class="me-1">mdi-tag-outline</v-icon>
                {{ selectedProduct.subcatLv1 }} · {{ selectedProduct.subcatLv2 }} · {{ selectedProduct.subcatLv3 }}
              </p>

              <v-row class="mt-3" dense>
                <v-col cols="6" md="3">
                  <v-sheet class="metric-tile" rounded="lg">
                    <span>{{ $t('dialog.original') }}</span>
                    <strong>{{ formatPrice(selectedProduct.originalPrice) }}</strong>
                  </v-sheet>
                </v-col>
                <v-col cols="6" md="3">
                  <v-sheet class="metric-tile" rounded="lg">
                    <span>{{ $t('dialog.sale') }}</span>
                    <strong>{{ formatPrice(selectedProduct.salePrice) }}</strong>
                  </v-sheet>
                </v-col>
                <v-col cols="6" md="3">
                  <v-sheet class="metric-tile highlight-tile" rounded="lg">
                    <span>{{ $t('dialog.discounted') }}</span>
                    <strong>{{ formatPrice(selectedProduct.discountedPrice) }}</strong>
                  </v-sheet>
                </v-col>
                <v-col cols="6" md="3">
                  <v-sheet class="metric-tile" rounded="lg">
                    <span>{{ $t('dialog.stock') }}</span>
                    <strong>{{ selectedProduct.stock.toLocaleString('vi-VN') }}</strong>
                  </v-sheet>
                </v-col>
              </v-row>

              <v-table density="compact" class="mt-4 details-table">
                <tbody>
                  <tr>
                    <td><v-icon size="14" class="me-2">mdi-identifier</v-icon>{{ $t('dialog.productId') }}</td>
                    <td class="font-weight-medium">{{ selectedProduct.id }}</td>
                  </tr>
                  <tr>
                    <td><v-icon size="14" class="me-2">mdi-storefront-outline</v-icon>{{ $t('dialog.shopId') }}</td>
                    <td class="font-weight-medium">{{ selectedProduct.shopId }}</td>
                  </tr>
                  <tr>
                    <td><v-icon size="14" class="me-2">mdi-account-outline</v-icon>{{ $t('dialog.accountManager') }}</td>
                    <td class="font-weight-medium">{{ selectedProduct.am }}</td>
                  </tr>
                </tbody>
              </v-table>

              <div class="d-flex flex-wrap ga-2 mt-5">
                <v-btn
                  color="primary"
                  prepend-icon="mdi-open-in-new"
                  :href="selectedProduct.linkShop"
                  target="_blank"
                  rel="noopener"
                  rounded="lg"
                >
                  {{ $t('dialog.openShop') }}
                </v-btn>
                <v-btn
                  :color="copiedProductId === selectedProduct.id ? 'success' : 'secondary'"
                  variant="tonal"
                  :prepend-icon="copiedProductId === selectedProduct.id ? 'mdi-check' : 'mdi-content-copy'"
                  rounded="lg"
                  @click="copyProductId(selectedProduct.id)"
                >
                  {{ copiedProductId === selectedProduct.id ? $t('dialog.copied') : $t('dialog.copyId') }}
                </v-btn>
              </div>
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Back to Top FAB -->
    <v-btn
      class="floating-top"
      icon="mdi-arrow-up"
      color="primary"
      :size="isMobile ? 'small' : 'large'"
      elevation="8"
      v-show="showBackToTop"
      @click="scrollToTop"
    />
  </v-app>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { PRODUCTS as sourceProducts } from './data/products';

const FALLBACK_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 fill=%22%23333%22%3E%3Crect width=%22200%22 height=%22200%22 fill=%22%23181a3b%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 font-size=%2214%22 fill=%22%23666%22%3ENo Image%3C/text%3E%3C/svg%3E';
const { t, locale } = useI18n();

const sortOptions = [
  { title: 'default', value: 'default' },
  { title: 'priceLow', value: 'price-low' },
  { title: 'priceHigh', value: 'price-high' },
  { title: 'discountHigh', value: 'discount-high' },
  { title: 'stockHigh', value: 'stock-high' },
  { title: 'stockLow', value: 'stock-low' },
  { title: 'nameAz', value: 'name-az' },
];

const localizedSortOptions = computed(() =>
  sortOptions.map((opt) => ({
    title: t(`sort.${opt.title}`),
    value: opt.value,
  }))
);

const currentView = ref('grid');
const selectedProduct = ref(null);
const copiedProductId = ref('');
const showBackToTop = ref(false);
const currentPage = ref(1);
const itemsPerPage = ref(24);
const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1200);

const isMobile = computed(() => windowWidth.value < 600);
const paginationVisible = computed(() => {
  if (windowWidth.value < 480) return 3;
  if (windowWidth.value < 768) return 5;
  return 7;
});
const dialogMaxWidth = computed(() => {
  if (windowWidth.value < 600) return '100%';
  return 980;
});

const filters = reactive({
  query: '',
  category: null,
  subcategory: null,
  am: null,
  sort: 'default',
});

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

function formatPrice(amount) {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
}

function formatStock(stock) {
  const stockNum = Number(stock) || 0;
  if (stockNum >= 1000000) return (stockNum / 1000000).toFixed(1) + 'M';
  if (stockNum >= 1000) return (stockNum / 1000).toFixed(0) + 'K';
  return String(stockNum);
}

function calcDiscount(original, discounted) {
  if (!original || !discounted || original <= discounted) return 0;
  return Math.round(((original - discounted) / original) * 100);
}

function discountPct(product) {
  return calcDiscount(product.originalPrice, product.discountedPrice);
}

const filteredProducts = computed(() => {
  const query = (filters.query || '').toLowerCase().trim();

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

const totalPages = computed(() => Math.ceil(filteredProducts.value.length / itemsPerPage.value));

const paginatedProducts = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value;
  return filteredProducts.value.slice(start, start + itemsPerPage.value);
});

// Reset pagination when filters change
watch([() => filters.query, () => filters.category, () => filters.subcategory, () => filters.am, () => filters.sort], () => {
  currentPage.value = 1;
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
  const start = (currentPage.value - 1) * itemsPerPage.value + 1;
  const end = Math.min(currentPage.value * itemsPerPage.value, filteredProducts.value.length);
  return `${start}–${end} ${t('results.of')} ${filteredProducts.value.length} ${t('results.products')}`;
});

const isDialogOpen = computed({
  get: () => Boolean(selectedProduct.value),
  set: (value) => {
    if (!value) closeModal();
  },
});

function cardDelay(index) {
  return `${Math.min(index * 30, 280)}ms`;
}

function toggleLocale() {
  const newLocale = locale.value === 'vi' ? 'en' : 'vi';
  locale.value = newLocale;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('app-locale', newLocale);
  }
}

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
  } catch {
    copiedProductId.value = '';
  }
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function onScroll() {
  showBackToTop.value = window.scrollY > 300;
}

function onResize() {
  windowWidth.value = window.innerWidth;
}

function onKeyDown(event) {
  if (event.key === 'Escape') closeModal();
}

watch(selectedProduct, (product) => {
  document.body.style.overflow = product ? 'hidden' : '';
});

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('keydown', onKeyDown);
  onScroll();
  onResize();
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', onResize);
  document.removeEventListener('keydown', onKeyDown);
  document.body.style.overflow = '';
});
</script>
