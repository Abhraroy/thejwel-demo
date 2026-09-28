'use client';

import { useState, useEffect, useRef } from 'react';
import { useStore } from '../../zustandStore/zustandStore';
import { usePathname, useRouter } from 'next/navigation';
import { useBodyScrollLock } from '@/lib/body-scroll-lock';
import Link from 'next/link';
import OptimizedImage from "@/components/OptimizedImage";
import HamburgerSidebar from './HamburgerSidebar';
import { createClient } from '@/lib/supabase-Utils/client';

interface NavbarProps {
  cartCount?: number;
  isAuthenticated?: boolean;
  onCartClick?: () => void;
}

interface IconProps {
  className?: string;
}

interface MenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  requiresAuth?: boolean;
}

interface DesktopIcon {
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number;
}

// SVG Icon Components
const SearchIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
    />
  </svg>
);

const UserIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
    />
  </svg>
);

const WishlistIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
    />
  </svg>
);

const CartIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.4 2.924-6.375a48.567 48.567 0 0 0-8.563-4.137M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z"
    />
  </svg>
);

const MenuIcon = ({ className = 'w-6 h-6' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
    />
  </svg>
);



const SettingsIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.297 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 0 1 0 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281Z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
    />
  </svg>
);

const OrdersIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h11.25c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25ZM6.75 12h.008v.008H6.75V12Zm0 3h.008v.008H6.75V15Zm0 3h.008v.008H6.75V18Z"
    />
  </svg>
);

const AboutIcon = ({ className = 'w-5 h-5' }: IconProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className={className}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M11.25 11.25l.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9-3.75h.008v.008H12V8.25Z"
    />
  </svg>
);

export default function Navbar({ cartCount = 0, isAuthenticated = false, onCartClick }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const { setMobnoInputState, AuthenticatedState, categories, setCategories } = useStore();
  const categoriesFetchInFlight = useRef(false);
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useBodyScrollLock(isSidebarOpen);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (categories.length > 0) return;
    if (categoriesFetchInFlight.current) return;
    categoriesFetchInFlight.current = true;
    let cancelled = false;
    void (async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("category_id, category_name, slug, category_image_url");
        if (!cancelled && !error && data?.length) {
          setCategories(data);
        }
      } finally {
        if (!cancelled) {
          categoriesFetchInFlight.current = false;
        }
      }
    })();
    return () => {
      cancelled = true;
      categoriesFetchInFlight.current = false;
    };
  }, [categories.length, setCategories, supabase]);

  // Debounced search suggestions with 300ms delay
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search query is empty, clear suggestions
    if (!searchQuery.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Set new timer for 300ms debounce
    debounceTimerRef.current = setTimeout(() => {
      fetchSearchSuggestions(searchQuery.trim());
    }, 300);

    // Cleanup function
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  // Function to call Supabase RPC function for search suggestions
  const fetchSearchSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    setShowSuggestions(true);

    try {
      // Call Supabase RPC function (adjust function name as needed)
      const { data, error } = await supabase.rpc('product_search_vector_func', {
        q: query,
        result_limit: 10,
      });

      if (error) {
        console.error('Error fetching search suggestions:', error);
        // Fallback: If RPC doesn't exist, use a direct query
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('products')
          .select('product_id, product_name, thumbnail_image')
          .ilike('product_name', `%${query}%`)
          .eq('listed_status', true)
          .limit(5);

        if (!fallbackError && fallbackData) {
          setSearchSuggestions(fallbackData);
        } else {
          setSearchSuggestions([]);
        }
      } else {
        setSearchSuggestions(data || []);
      }
    } catch (err) {
      console.error('Error in search suggestions:', err);
      setSearchSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle suggestion click
  const handleSuggestionClick = (product: any) => {
    router.push(`/product/${product.product_id}`);
    setSearchQuery('');
    setShowSuggestions(false);
    setShowMobileSearch(false);
  };

  const handleSearchSubmit = (qRaw?: string) => {
    const q = (qRaw ?? searchQuery).trim();
    if (!q) return;
    router.push(`/search/${encodeURIComponent(q)}`);
    setSearchQuery('');
    setSearchSuggestions([]);
    setShowSuggestions(false);
    setShowMobileSearch(false);
  };

  // Sidebar menu items configuration
  const menuItems: MenuItem[] = [
    {
      label: 'My Account',
      href: isAuthenticated ? '/account' : '/login',
      icon: <UserIcon className="w-5 h-5" />,
      requiresAuth: false,
    },
    {
      label: 'Settings',
      href: '/settings',
      icon: <SettingsIcon />,
      requiresAuth: true,
    },
    {
      label: 'Orders',
      href: '/orders',
      icon: <OrdersIcon />,
      requiresAuth: true,
    },
    {
      label: 'About',
      href: '/about',
      icon: <AboutIcon />,
      requiresAuth: false,
    },
  ];

  // Filter menu items based on authentication
  const filteredMenuItems = menuItems.filter(
    (item) => !item.requiresAuth || isAuthenticated
  );

  // Handle account click - same behavior as desktop icon
  const handleAccountClick = () => {
    handleCloseSidebar();
    if (AuthenticatedState) {
      router.push('/account');
    } else {
      setMobnoInputState();
    }
  };

  // Handle desktop wishlist click - always navigate to wishlist page
  const handleDesktopWishlistClick = () => {
    router.push('/wishlist');
  };

  // Desktop icons configuration
  const desktopIcons: DesktopIcon[] = [
    {
      label: 'Account',
      icon: <UserIcon className="w-6 h-6 md:w-7 md:h-7" />,
      onClick: () => {
        if(AuthenticatedState){
          router.push('/account');
        }
        else{
          setMobnoInputState();
        }
      },
    },
    {
      label: 'Wishlist',
      icon: <WishlistIcon className="w-6 h-6 md:w-7 md:h-7" />,
      onClick: handleDesktopWishlistClick,
    },
    {
      label: 'Shopping Cart',
      icon: <CartIcon className="w-6 h-6 md:w-7 md:h-7" />,
      badge: cartCount,
      onClick: onCartClick || (() => {}),
    },
  ];

  // Mobile icons configuration
  const mobileIcons = [
    {
      label: 'Search',
      icon: <SearchIcon className="w-6 h-6" />,
      onClick: () => setShowMobileSearch(!showMobileSearch),
    },
    {
      label: 'Wishlist',
      icon: <WishlistIcon className="w-6 h-6" />,
      onClick: handleDesktopWishlistClick,
    },
    {
      label: 'Shopping Cart',
      icon: <CartIcon className="w-6 h-6" />,
      badge: cartCount,
      onClick: onCartClick || (() => {}),
    },
  ];

  const handleCloseSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <nav
      className="w-full border-b border-theme-sage/20 sticky top-0 z-50 bg-transparent"
    >
      <div className="w-full">
        <div className="flex items-center px-4 sm:px-6 lg:px-8 h-16 md:h-22">
          {/* Hamburger Menu - Mobile Only */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="md:hidden p-2 text-[#360000] hover:text-[#360000] transition-colors"
            aria-label="Open menu"
          >
            <MenuIcon className="w-6 h-6" />
          </button>

          {/* Logo Section */}
          <div className="navbar-logo-section shrink-0 ml-2 md:ml-0 flex-row flex ">
            <Link href="/" className="flex items-center gap-2 md:gap-3">
              <OptimizedImage
                src="/logo/cropped-logo.svg"
                alt="JWEL"
                width={74}
                height={74}
                className="w-12 h-12 sm:w-13 sm:h-13 md:w-14 md:h-14 lg:w-18 lg:h-18 object-cover"
                priority
              />
              <div className="flex flex-col items-start justify-start">
                <span className="text-xl sm:text-2xl md:text-2xl lg:text-3xl text-[#360000] tracking-tight font-josefin-sans">
                  The JWEL
                </span>
                <span className="text-[0.6rem] md:text-[0.7rem] lg:text-base text-[#360000] tracking-tight  font-open-sans">
                  BEYOND THE JEWELLERY
                </span>
              </div>
            </Link>
          </div>

          {/* Search Bar Section - Hidden on mobile, visible on tablet and up */}
          <div className="hidden md:flex flex-1 ml-auto md:max-w-[20rem] lg:max-w-2xl relative">
            <div className="relative w-full">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit();
                }}
                className="relative w-full"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full h-10 md:h-12 px-4 pr-10 bg-white/80 rounded-lg border border-[#360000]/30 outline-none text-gray-700 placeholder-gray-500 text-sm md:text-base focus:bg-white focus:border-[#360000]/30 transition-colors"
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#360000]/70 hover:text-[#360000]/90 transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Suggestions Dropdown - Desktop */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#360000]/20 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
              >
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loading suggestions...
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="py-2">
                    {searchSuggestions.map((suggestion: any) => (
                      <button
                        key={suggestion.product_id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {suggestion.thumbnail_image && (
                          <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden">
                            <OptimizedImage
                              src={suggestion.thumbnail_image}
                              alt={suggestion.product_name || ''}
                              preset="thumbnail"
                              fill
                              objectFit="cover"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {suggestion.product_name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No suggestions found
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {/* Desktop Icons Section */}
          <div className="hidden md:flex items-center gap-3 md:gap-4 lg:gap-6 ml-4">
            {desktopIcons.map((iconItem, index) => (
              <button
                key={index}
                data-account-icon={iconItem.label === 'Account' ? 'true' : undefined}
                onClick={(e) => {
                  e.stopPropagation();
                  iconItem.onClick?.();
                }}
                className="p-2 text-[#360000]/70 hover:text-[#360000]/50 transition-colors relative"
                aria-label={iconItem.label}
              >
                {iconItem.icon}
                {iconItem.badge !== undefined && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-theme-olive text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {iconItem.badge > 0 ? iconItem.badge : 0}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Mobile Icons Section */}
          <div className="md:hidden flex items-center gap-3 ml-auto">
            {mobileIcons.map((iconItem, index) => (
              <button
                key={index}
                onClick={iconItem.onClick}
                className="p-2 text-[#360000]/70 hover:text-[#360000]/50 transition-colors relative"
                aria-label={iconItem.label}
              >
                {iconItem.icon}
                {iconItem.badge !== undefined && (
                  <span className="absolute top-0 right-0 w-5 h-5 bg-theme-olive text-white text-xs font-medium rounded-full flex items-center justify-center">
                    {iconItem.badge > 0 ? iconItem.badge : 0}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Search Bar - Shows when search icon is clicked */}
        {showMobileSearch && (
          <div className="md:hidden pb-4 px-4 relative">
            <div className="relative">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSearchSubmit();
                }}
                className="relative"
              >
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search for products"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => {
                    if (searchSuggestions.length > 0) {
                      setShowSuggestions(true);
                    }
                  }}
                  className="w-full h-10 px-4 pr-10 bg-white/80 rounded-lg border border-theme-sage/30 outline-none text-gray-700 placeholder-gray-500 text-sm focus:bg-white focus:border-theme-sage transition-colors"
                  autoFocus
                />
                <button
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#360000] hover:text-[#360000]/80 transition-colors"
                  aria-label="Search"
                >
                  <SearchIcon className="w-5 h-5" />
                </button>
              </form>
            </div>

            {/* Suggestions Dropdown - Mobile */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-4 right-4 mt-2 bg-white border border-theme-sage/30 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto"
              >
                {isLoadingSuggestions ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    Loading suggestions...
                  </div>
                ) : searchSuggestions.length > 0 ? (
                  <div className="py-2">
                    {searchSuggestions.map((suggestion: any) => (
                      <button
                        key={suggestion.product_id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        {suggestion.thumbnail_image && (
                          <div className="relative w-12 h-12 shrink-0 rounded overflow-hidden">
                            <OptimizedImage
                              src={suggestion.thumbnail_image}
                              alt={suggestion.product_name || ''}
                              preset="thumbnail"
                              fill
                              objectFit="cover"
                              sizes="48px"
                            />
                          </div>
                        )}
                        <span className="text-sm text-gray-700 flex-1 truncate">
                          {suggestion.product_name}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.trim() ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No suggestions found
                  </div>
                ) : null}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Left Sidebar - Mobile Only */}
      <HamburgerSidebar
        isSidebarOpen={isSidebarOpen}
        onClose={handleCloseSidebar}
        filteredMenuItems={filteredMenuItems}
        onAccountClick={handleAccountClick}
      />
    </nav>
  );
}

