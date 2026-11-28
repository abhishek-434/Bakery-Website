document.addEventListener('DOMContentLoaded', () => {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  /* =========================================
     0. Video Intro Preloader
  ========================================= */
  const introLoader = document.getElementById('intro-loader');
  const introVideo = document.getElementById('intro-video');
  const skipIntroBtn = document.getElementById('skip-intro-btn');
  let introDismissed = false;

  function dismissIntro() {
    if (introDismissed || !introLoader) return;
    introDismissed = true;
    introLoader.classList.add('opacity-0', 'pointer-events-none');
    document.body.classList.remove('overflow-hidden');
    setTimeout(() => {
      introLoader.remove();
    }, 450);
  }

  if (introLoader && introVideo) {
    introVideo.playbackRate = 2.0;
    introVideo.addEventListener('ended', dismissIntro);
    introVideo.addEventListener('error', dismissIntro);
    skipIntroBtn?.addEventListener('click', dismissIntro);

    // Ensure playback starts; if blocked, dismiss quickly
    const playPromise = introVideo.play();
    if (playPromise && typeof playPromise.catch === 'function') {
      playPromise.catch(() => {
        setTimeout(dismissIntro, 800);
      });
    }

    // Fast 2.2s max intro duration
    setTimeout(dismissIntro, 1300);
  } else {
    document.body.classList.remove('overflow-hidden');
  }

  /* =========================================
     1. Mobile Menu & Sticky Nav Active State
  ========================================= */
  const mobileMenuBtn = document.getElementById('mobile-menu-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const navLinks = document.querySelectorAll('.nav-link');

  mobileMenuBtn?.addEventListener('click', () => {
    mobileMenu.classList.toggle('hidden');
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.add('hidden');
    });
  });

  const sections = document.querySelectorAll('section[id], footer[id]');
  const updateActiveNav = () => {
    let currentId = 'home';
    const scrollPos = window.scrollY + 140;

    sections.forEach((sec) => {
      if (scrollPos >= sec.offsetTop) {
        currentId = sec.getAttribute('id');
      }
    });

    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  };
  window.addEventListener('scroll', updateActiveNav, { passive: true });

  /* =========================================
     2. Search Bar Toggle & Filtering
  ========================================= */
  const searchToggleBtn = document.getElementById('search-toggle-btn');
  const searchCloseBtn = document.getElementById('search-close-btn');
  const searchPanel = document.getElementById('search-bar-panel');
  const searchForm = document.getElementById('search-form');
  const searchInput = document.getElementById('search-input');
  const searchFeedback = document.getElementById('search-feedback');

  searchToggleBtn?.addEventListener('click', () => {
    searchPanel.classList.toggle('hidden');
    if (!searchPanel.classList.contains('hidden')) {
      searchInput.focus();
    }
  });

  searchCloseBtn?.addEventListener('click', () => {
    searchPanel.classList.add('hidden');
    searchFeedback.classList.add('hidden');
  });

  searchForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const query = searchInput.value.trim().toLowerCase();
    if (!query) return;

    const cards = document.querySelectorAll('.product-card');
    let matchCount = 0;
    let firstMatch = null;

    cards.forEach((card) => {
      card.classList.remove('search-match');
      const title = card.querySelector('h3')?.textContent.toLowerCase() || '';
      if (title.includes(query)) {
        matchCount += 1;
        card.classList.add('search-match');
        if (!firstMatch) firstMatch = card;
      }
    });

    searchFeedback.classList.remove('hidden');
    if (matchCount > 0 && firstMatch) {
      searchFeedback.textContent = `Found ${matchCount} matching item${matchCount > 1 ? 's' : ''} in our menu.`;
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
      searchFeedback.textContent = `No menu items matched "${searchInput.value.trim()}". Try "croissant", "cupcake", "tart", or "cake".`;
    }
  });

  /* =========================================
     3. Shopping Cart, Promo Code & Persistence
  ========================================= */
  const CART_KEY = 'bakery_cart_v1';
  const PROMO_KEY = 'bakery_promo_v1';
  let cart = [];
  let appliedPromo = null;
  let fulfillmentMode = 'delivery';

  try {
    const savedCart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    if (Array.isArray(savedCart)) cart = savedCart;
    const savedPromo = localStorage.getItem(PROMO_KEY);
    if (savedPromo === 'SWEET20') appliedPromo = 'SWEET20';
  } catch {
    cart = [];
  }

  const cartDrawer = document.getElementById('cart-drawer');
  const cartOpenBtn = document.getElementById('cart-open-btn');
  const cartCloseBtn = document.getElementById('cart-close-btn');
  const cartBackdrop = document.getElementById('cart-backdrop');
  const cartBadge = document.getElementById('cart-badge');
  const cartItemsEl = document.getElementById('cart-items');
  const cartSubtotalEl = document.getElementById('cart-subtotal');
  const cartDiscountRow = document.getElementById('cart-discount-row');
  const cartDiscountAmount = document.getElementById('cart-discount-amount');
  const promoForm = document.getElementById('promo-form');
  const promoInput = document.getElementById('promo-input');
  const promoFeedback = document.getElementById('promo-feedback');
  const fulfillmentBtns = document.querySelectorAll('.fulfillment-btn');
  const checkoutBtn = document.getElementById('checkout-btn');
  const checkoutConfirmation = document.getElementById('checkout-confirmation');

  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toast-message');
  let toastTimer = null;

  function saveCart() {
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
      if (appliedPromo) {
        localStorage.setItem(PROMO_KEY, appliedPromo);
      } else {
        localStorage.removeItem(PROMO_KEY);
      }
    } catch {
      // Ignore storage quota errors
    }
  }

  function showToast(msg) {
    toastMessage.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2600);
  }

  function openCart() {
    cartDrawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeCart() {
    cartDrawer.classList.add('hidden');
    document.body.style.overflow = '';
  }

  function renderCart() {
    saveCart();
    const totalCount = cart.reduce((sum, item) => sum + item.qty, 0);
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = appliedPromo === 'SWEET20' ? subtotal * 0.2 : 0;
    const finalTotal = Math.max(0, subtotal - discount);

    cartBadge.textContent = String(totalCount);
    cartBadge.classList.toggle('hidden', totalCount === 0);

    if (discount > 0 && cart.length > 0) {
      cartDiscountRow?.classList.remove('hidden');
      if (cartDiscountAmount) cartDiscountAmount.textContent = `-$${discount.toFixed(2)}`;
    } else {
      cartDiscountRow?.classList.add('hidden');
    }

    cartSubtotalEl.textContent = `$${finalTotal.toFixed(2)}`;
    checkoutBtn.disabled = cart.length === 0;

    if (cart.length === 0) {
      cartItemsEl.innerHTML = `
        <div class="text-center py-14">
          <div class="w-14 h-14 rounded-full bg-cream text-bakery mx-auto flex items-center justify-center mb-3">
            <i data-lucide="shopping-bag" class="w-6 h-6"></i>
          </div>
          <p class="font-heading font-bold text-ink mb-1">Your cart is empty</p>
          <p class="text-xs text-muted">Add some freshly baked treats from our menu!</p>
        </div>
      `;
    } else {
      cartItemsEl.innerHTML = cart
        .map(
          (item) => `
          <div class="flex items-center gap-3.5 bg-cream/60 rounded-2xl p-3 border border-divider">
            <img src="${item.image}" alt="${item.name}" class="w-16 h-16 rounded-xl object-cover shrink-0" />
            <div class="flex-1 min-w-0">
              <h4 class="font-heading font-bold text-sm text-ink truncate">${item.name}</h4>
              <p class="text-xs font-semibold text-bakery">$${item.price.toFixed(2)}</p>
              <div class="flex items-center gap-2 mt-2">
                <button type="button" data-qty-dec="${item.id}" class="w-6 h-6 rounded-full bg-white border border-divider text-ink hover:border-bakery text-xs font-bold">-</button>
                <span class="text-xs font-semibold w-5 text-center">${item.qty}</span>
                <button type="button" data-qty-inc="${item.id}" class="w-6 h-6 rounded-full bg-white border border-divider text-ink hover:border-bakery text-xs font-bold">+</button>
              </div>
            </div>
            <button type="button" data-remove-item="${item.id}" aria-label="Remove ${item.name}" class="text-muted hover:text-bakery p-1">
              <i data-lucide="trash-2" class="w-4 h-4"></i>
            </button>
          </div>
        `
        )
        .join('');
    }

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }

  document.querySelectorAll('[data-add-cart]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.id;
      const name = btn.dataset.name;
      const price = parseFloat(btn.dataset.price);
      const image = btn.dataset.image;

      const existing = cart.find((i) => i.id === id);
      if (existing) {
        existing.qty += 1;
      } else {
        cart.push({ id, name, price, image, qty: 1 });
      }

      checkoutConfirmation.classList.add('hidden');
      renderCart();
      cartBadge.classList.remove('badge-pop');
      void cartBadge.offsetWidth;
      cartBadge.classList.add('badge-pop');
      showToast(`${name} added to cart!`);
    });
  });

  cartItemsEl.addEventListener('click', (e) => {
    const incBtn = e.target.closest('[data-qty-inc]');
    const decBtn = e.target.closest('[data-qty-dec]');
    const remBtn = e.target.closest('[data-remove-item]');

    if (incBtn) {
      const item = cart.find((i) => i.id === incBtn.dataset.qtyInc);
      if (item) item.qty += 1;
      renderCart();
    } else if (decBtn) {
      const item = cart.find((i) => i.id === decBtn.dataset.qtyDec);
      if (item) {
        item.qty -= 1;
        if (item.qty <= 0) {
          cart = cart.filter((i) => i.id !== item.id);
        }
      }
      renderCart();
    } else if (remBtn) {
      cart = cart.filter((i) => i.id !== remBtn.dataset.removeItem);
      renderCart();
    }
  });

  checkoutBtn?.addEventListener('click', () => {
    if (cart.length === 0) return;
    const modeLabel = fulfillmentMode === 'pickup' ? 'ready for store pickup in 20 mins' : 'out for 30-min express delivery';
    cart = [];
    appliedPromo = null;
    if (promoInput) promoInput.value = '';
    promoFeedback?.classList.add('hidden');
    renderCart();
    checkoutConfirmation.textContent = `Thank you! Your bakery order has been placed and will be ${modeLabel}.`;
    checkoutConfirmation.classList.remove('hidden');
    showToast('Order placed! Fresh bakes on the way.');
  });

  promoForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = promoInput.value.trim().toUpperCase();
    promoFeedback.classList.remove('hidden', 'text-emerald-700', 'text-red-600');
    if (code === 'SWEET20') {
      appliedPromo = 'SWEET20';
      promoFeedback.textContent = 'SWEET20 applied! 20% off your order.';
      promoFeedback.classList.add('text-emerald-700');
      renderCart();
      showToast('20% discount applied with SWEET20!');
    } else {
      appliedPromo = null;
      promoFeedback.textContent = 'Invalid code. Try SWEET20 for 20% off.';
      promoFeedback.classList.add('text-red-600');
      renderCart();
    }
  });

  fulfillmentBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      fulfillmentMode = btn.dataset.fulfillment;
      fulfillmentBtns.forEach((b) => {
        b.classList.remove('active', 'bg-espresso', 'text-white');
        b.classList.add('text-muted');
      });
      btn.classList.add('active', 'bg-espresso', 'text-white');
      btn.classList.remove('text-muted');
    });
  });

  /* FAQ Accordion */
  document.querySelectorAll('.faq-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.faq-item');
      const content = item?.querySelector('.faq-content');
      const icon = item?.querySelector('.faq-icon');
      const isOpen = content && !content.classList.contains('hidden');

      document.querySelectorAll('.faq-content').forEach((c) => c.classList.add('hidden'));
      document.querySelectorAll('.faq-icon').forEach((i) => i.classList.remove('rotate-180'));

      if (!isOpen && content) {
        content.classList.remove('hidden');
        icon?.classList.add('rotate-180');
      }
    });
  });

  cartOpenBtn?.addEventListener('click', openCart);
  cartCloseBtn?.addEventListener('click', closeCart);
  cartBackdrop?.addEventListener('click', closeCart);
  renderCart();

  /* =========================================
     4. Testimonial Carousel
  ========================================= */
  const testimonialSets = [
    [
      {
        name: 'Sarah Johnson',
        location: 'New York, USA',
        quote: 'Absolutely delicious! The cake was fresh and beautiful. Highly recommended!',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'David Miller',
        location: 'Los Angeles, USA',
        quote: 'Best bakery in town! Great taste and excellent customer service.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Emily Davis',
        location: 'Chicago, USA',
        quote: 'A wonderful experience. Everything was perfect!',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=200&q=80',
      },
    ],
    [
      {
        name: 'Sophia Martinez',
        location: 'Austin, USA',
        quote: 'The butter croissants melt in your mouth. Our weekend brunch staple now!',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'James Wilson',
        location: 'Seattle, USA',
        quote: 'Ordered a custom birthday cake and every single guest asked where it was from.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Olivia Brown',
        location: 'Boston, USA',
        quote: 'Fast delivery and warm packaging. You can taste the quality in every bite.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      },
    ],
    [
      {
        name: 'Liam Anderson',
        location: 'Miami, USA',
        quote: 'Their fruit tarts are pure art. Light custard, crisp crust, and super fresh berries.',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Chloe Taylor',
        location: 'Denver, USA',
        quote: 'Chocolate cupcakes were rich without being overly sweet. Truly handcrafted!',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
      },
      {
        name: 'Noah Thomas',
        location: 'San Diego, USA',
        quote: 'Always consistent, always fresh. Bakery.com never disappoints.',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=200&q=80',
      },
    ],
  ];

  const testimonialsGrid = document.getElementById('testimonials-grid');
  const testimonialDots = document.querySelectorAll('.testimonial-dot');

  function renderTestimonials(index) {
    const items = testimonialSets[index] || testimonialSets[0];
    testimonialsGrid.innerHTML = items
      .map(
        (t) => `
        <article class="bg-cream rounded-2xl p-7 flex flex-col justify-between shadow-soft">
          <div>
            <span class="block font-heading font-extrabold text-5xl leading-none text-bakery mb-3">“</span>
            <p class="text-ink text-sm sm:text-base leading-relaxed mb-6">"${t.quote}"</p>
          </div>
          <div class="flex items-center gap-3.5 pt-4 border-t border-divider">
            <img src="${t.avatar}" alt="${t.name}" class="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm shrink-0" />
            <div>
              <h3 class="font-heading font-bold text-sm text-ink">${t.name}</h3>
              <p class="text-xs text-muted mb-0.5">${t.location}</p>
              <div class="text-amber-500 text-xs tracking-wider leading-none" aria-label="5 out of 5 stars">★★★★★</div>
            </div>
          </div>
        </article>
      `
      )
      .join('');

    testimonialDots.forEach((dot, idx) => {
      if (idx === index) {
        dot.classList.add('w-8', 'bg-bakery');
        dot.classList.remove('w-2.5', 'bg-divider');
      } else {
        dot.classList.remove('w-8', 'bg-bakery');
        dot.classList.add('w-2.5', 'bg-divider');
      }
    });
  }

  testimonialDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      const idx = parseInt(dot.dataset.slide, 10);
      renderTestimonials(idx);
    });
  });

  renderTestimonials(0);

  /* =========================================
     5. Watch Video Modal
  ========================================= */
  const videoModal = document.getElementById('video-modal');
  const videoIframe = document.getElementById('video-iframe');
  const watchVideoBtn = document.getElementById('watch-video-btn');
  const videoCloseBtn = document.getElementById('video-close-btn');
  const embedUrl = 'https://www.youtube.com/embed/uBqBH9MT09Y?autoplay=1&rel=0';

  watchVideoBtn?.addEventListener('click', () => {
    videoIframe.src = embedUrl;
    videoModal.classList.remove('hidden');
    videoModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  });

  function closeVideoModal() {
    videoModal.classList.add('hidden');
    videoModal.classList.remove('flex');
    videoIframe.src = '';
    document.body.style.overflow = '';
  }

  videoCloseBtn?.addEventListener('click', closeVideoModal);
  videoModal?.addEventListener('click', (e) => {
    if (e.target === videoModal) closeVideoModal();
  });

  /* =========================================
     6. Gallery Lightbox & View More Toggle
  ========================================= */
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCaption = document.getElementById('lightbox-caption');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  const galleryGrid = document.getElementById('gallery-grid');
  const viewMoreGalleryBtn = document.getElementById('view-more-gallery-btn');
  let galleryExpanded = false;

  galleryGrid?.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-lightbox]');
    if (!trigger) return;
    lightboxImage.src = trigger.dataset.src;
    lightboxImage.alt = trigger.dataset.caption;
    lightboxCaption.textContent = trigger.dataset.caption;
    lightboxModal.classList.remove('hidden');
    lightboxModal.classList.add('flex');
    document.body.style.overflow = 'hidden';
  });

  function closeLightbox() {
    lightboxModal.classList.add('hidden');
    lightboxModal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  lightboxCloseBtn?.addEventListener('click', closeLightbox);
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) closeLightbox();
  });

  viewMoreGalleryBtn?.addEventListener('click', () => {
    if (galleryExpanded) return;
    galleryExpanded = true;
    const extraPhotos = [
      {
        src: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=1200&q=85',
        thumb: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
        caption: 'Artisan Sourdough Loaves',
      },
      {
        src: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=1200&q=85',
        thumb: 'https://images.unsplash.com/photo-1563729784474-d77dbb933a9e?auto=format&fit=crop&w=800&q=80',
        caption: 'Celebration Layer Cakes',
      },
      {
        src: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=1200&q=85',
        thumb: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=800&q=80',
        caption: 'Cinnamon Swirl Rolls',
      },
    ];

    extraPhotos.forEach((p) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.dataset.lightbox = '';
      btn.dataset.src = p.src;
      btn.dataset.caption = p.caption;
      btn.className = 'group relative aspect-[4/3] rounded-2xl overflow-hidden bg-cream shadow-soft text-left';
      btn.innerHTML = `
        <img src="${p.thumb}" alt="${p.caption}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
        <div class="absolute inset-0 bg-espresso-deep/0 group-hover:bg-espresso-deep/35 transition-colors flex items-center justify-center">
          <span class="w-11 h-11 rounded-full bg-white/90 text-espresso flex items-center justify-center opacity-0 group-hover:opacity-100 scale-90 group-hover:scale-100 transition-all">
            <i data-lucide="zoom-in" class="w-5 h-5"></i>
          </span>
        </div>
      `;
      galleryGrid.appendChild(btn);
    });

    if (window.lucide) {
      window.lucide.createIcons();
    }
    viewMoreGalleryBtn.innerHTML = '<span>Showing Full Gallery</span>';
    viewMoreGalleryBtn.disabled = true;
    viewMoreGalleryBtn.classList.add('opacity-70', 'cursor-default');
  });

  /* =========================================
     7. Blog Article Preview Modal
  ========================================= */
  const blogArticles = {
    'baking-tips': {
      title: '5 Baking Tips for Perfect Results',
      date: 'Oct 25, 2024',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
      paragraphs: [
        'Great baking starts with precision. Always measure flour by weight using a kitchen scale or spoon-and-level method so your cakes and pastries stay light and tender.',
        'Bring butter, eggs, and dairy to room temperature before mixing—this helps create a uniform emulsion that traps air for an even, bakery-style crumb.',
        'Finally, invest in an oven thermometer and preheat for at least 20 minutes before baking to avoid uneven rising.',
      ],
    },
    'cake-decorating': {
      title: 'How to Decorate a Beautiful Cake',
      date: 'Oct 20, 2024',
      image: 'https://images.unsplash.com/photo-1621303837174-89787a7d4729?auto=format&fit=crop&w=900&q=80',
      paragraphs: [
        'Start with chilled cake layers and apply a thin crumb coat of buttercream, then refrigerate for 20 minutes to lock in loose crumbs.',
        'Use an offset spatula and a turntable for smooth sides, then finish with piped rosettes, fresh berries, or chocolate drip accents for an effortless patisserie look.',
      ],
    },
    'cookie-recipe': {
      title: 'Easy Cookie Recipe at Home',
      date: 'Oct 15, 2024',
      image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=900&q=80',
      paragraphs: [
        'Browned butter and a 2:1 ratio of brown sugar to white sugar give homemade chocolate chip cookies rich caramel notes and chewy centers.',
        'Chill the dough for 30 minutes before baking at 350°F (175°C) for 10–12 minutes until the edges are golden and the centers are still soft.',
      ],
    },
  };

  const blogModal = document.getElementById('blog-modal');
  const blogCloseBtn = document.getElementById('blog-close-btn');
  const blogModalImg = document.getElementById('blog-modal-img');
  const blogModalDate = document.getElementById('blog-modal-date');
  const blogModalTitle = document.getElementById('blog-modal-title');
  const blogModalBody = document.getElementById('blog-modal-body');

  document.querySelectorAll('[data-blog-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const article = blogArticles[btn.dataset.blogId];
      if (!article) return;
      blogModalImg.src = article.image;
      blogModalImg.alt = article.title;
      blogModalDate.textContent = article.date;
      blogModalTitle.textContent = article.title;
      blogModalBody.innerHTML = article.paragraphs.map((p) => `<p>${p}</p>`).join('');
      blogModal.classList.remove('hidden');
      blogModal.classList.add('flex');
      document.body.style.overflow = 'hidden';
    });
  });

  function closeBlogModal() {
    blogModal.classList.add('hidden');
    blogModal.classList.remove('flex');
    document.body.style.overflow = '';
  }

  blogCloseBtn?.addEventListener('click', closeBlogModal);
  blogModal?.addEventListener('click', (e) => {
    if (e.target === blogModal) closeBlogModal();
  });

  /* =========================================
     8. Newsletter Validation
  ========================================= */
  const newsletterForm = document.getElementById('newsletter-form');
  const newsletterEmail = document.getElementById('newsletter-email');
  const newsletterMessage = document.getElementById('newsletter-message');

  newsletterForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = newsletterEmail.value.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    newsletterMessage.classList.remove('hidden', 'text-white', 'text-amber-100');

    if (!emailRegex.test(email)) {
      newsletterMessage.textContent = 'Please enter a valid email address.';
      newsletterMessage.classList.add('text-amber-100');
      newsletterEmail.focus();
      return;
    }

    newsletterMessage.textContent = 'Subscribed! Welcome to the Bakery.com sweet club.';
    newsletterMessage.classList.add('text-white');
    newsletterEmail.value = '';
    showToast('Successfully subscribed to our newsletter!');
  });

  /* =========================================
     8b. Menu Category Filtering
  ========================================= */
  const filterBtns = document.querySelectorAll('.menu-filter-btn');
  const productCards = document.querySelectorAll('#product-grid .product-card');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const filter = btn.dataset.filter;

      filterBtns.forEach((b) => {
        b.classList.remove('active', 'bg-bakery', 'text-white', 'shadow-sm');
        b.classList.add('bg-cream', 'text-ink');
      });
      btn.classList.add('active', 'bg-bakery', 'text-white', 'shadow-sm');
      btn.classList.remove('bg-cream', 'text-ink');

      productCards.forEach((card) => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !match);
      });
    });
  });

  /* =========================================
     8c. Custom Cake Modal & Back to Top
  ========================================= */
  const customOrderModal = document.getElementById('custom-order-modal');
  const customOrderOpenBtn = document.getElementById('custom-order-open-btn');
  const customOrderCloseBtn = document.getElementById('custom-order-close-btn');
  const customOrderForm = document.getElementById('custom-order-form');
  const backToTopBtn = document.getElementById('back-to-top-btn');

  function closeCustomOrderModal() {
    customOrderModal?.classList.add('hidden');
    customOrderModal?.classList.remove('flex');
    document.body.style.overflow = '';
  }

  customOrderOpenBtn?.addEventListener('click', () => {
    customOrderModal?.classList.remove('hidden');
    customOrderModal?.classList.add('flex');
    document.body.style.overflow = 'hidden';
  });

  customOrderCloseBtn?.addEventListener('click', closeCustomOrderModal);
  customOrderModal?.addEventListener('click', (e) => {
    if (e.target === customOrderModal) closeCustomOrderModal();
  });

  customOrderForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('custom-name').value.trim();
    const flavor = document.getElementById('custom-flavor').value;
    closeCustomOrderModal();
    customOrderForm.reset();
    showToast(`Thanks ${name || 'friend'}! Your ${flavor} request was received.`);
  });

  window.addEventListener(
    'scroll',
    () => {
      if (!backToTopBtn) return;
      if (window.scrollY > 500) {
        backToTopBtn.classList.remove('hidden');
        backToTopBtn.classList.add('flex');
      } else {
        backToTopBtn.classList.add('hidden');
        backToTopBtn.classList.remove('flex');
      }
    },
    { passive: true }
  );

  backToTopBtn?.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =========================================
     8d. Scroll-Reveal Animations
  ========================================= */
  const revealTargets = document.querySelectorAll(
    'section h2, .product-card, #gallery-grid button, #testimonials-grid article, #blog article'
  );

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    revealTargets.forEach((el, idx) => {
      el.classList.add('reveal');
      el.style.transitionDelay = `${(idx % 4) * 70}ms`;
      observer.observe(el);
    });
  }

  /* =========================================
     9. Escape Key Closes Open Modals/Drawer
  ========================================= */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeCart();
      closeVideoModal();
      closeLightbox();
      closeBlogModal();
      closeCustomOrderModal();
    }
  });
});
