// src/constants/categories.js (or wherever this file is located)
import { Ionicons } from '@expo/vector-icons';

export const VALID_CATEGORIES = [
  { key: 'electronics',             icon: 'hardware-chip-outline' },
  { key: 'phones and tablets',      icon: 'phone-portrait-outline' },
  { key: 'computers and laptops',   icon: 'laptop-outline' },
  { key: 'gaming',                  icon: 'game-controller-outline' },

  { key: 'fashion',                 icon: 'shirt-outline' },
  { key: 'accessories',             icon: 'watch-outline' },
  { key: 'beauty and grooming',     icon: 'sparkles-outline' },

  { key: 'books-course-materials',  icon: 'book-outline' },
  { key: 'tutoring and education',      icon: 'school-outline' },

  { key: 'hostel-items',            icon: 'bed-outline' },
  { key: 'furniture',               icon: 'cube-outline' },
  { key: 'appliances',              icon: 'flash-outline' },

  { key: 'food and drinks',         icon: 'fast-food-outline' },
  { key: 'events and catering',         icon: 'restaurant-outline' },

  { key: 'tickets and events',      icon: 'ticket-outline' },
  { key: 'photography and media',       icon: 'camera-outline' },
  { key: 'graphic-design-printing', icon: 'color-palette-outline' },

  { key: 'repair and services',         icon: 'build-outline' },
  { key: 'transport and logistics', icon: 'car-outline' },
  { key: 'accommodation and housing',   icon: 'home-outline' },

  { key: 'sports and fitness',      icon: 'basketball-outline' },
  { key: 'services',                icon: 'construct-outline' },
  { key: 'other',                   icon: 'grid-outline' },
];
// src/data/General.js  (excerpt)

export const SUBCATEGORIES_MAP = {
  'electronics': [
    { key: 'headphones-earbuds',     label: 'Headphones & Earbuds' },
    { key: 'speakers',               label: 'Bluetooth & Home Speakers' },
    { key: 'chargers-cables',        label: 'Chargers, Cables & Adapters' },
    { key: 'power-banks',            label: 'Power Banks & Portable Chargers' },
    { key: 'smartwatches',           label: 'Smartwatches & Fitness Bands' },
    { key: 'cameras',                label: 'Cameras & Vlogging Gear' },
    { key: 'projectors',             label: 'Projectors & Screens' },
    { key: 'calculators-scientific', label: 'Calculators' },
    { key: 'extensions-plugs',       label: 'Extension Boards & Adapters' },
    { key: 'trimmers-clippers',      label: 'Trimmers & Clippers' },
    { key: 'tv-video',               label: 'TVs & Video Equipment' },
    { key: 'audio-systems',          label: 'Audio Systems & Mixers' },
    { key: 'networking',             label: 'Routers, Modems & Networking' },
    { key: 'drones',                 label: 'Drones & Aerial Gear' },
    { key: 'other-electronics',      label: 'Other Electronics' },
  ],

  'phones and tablets': [
    { key: 'smartphones',             label: 'Smartphones' },
    { key: 'tablets',                 label: 'Tablets' },
    { key: 'ipads',                   label: 'iPads' },
    { key: 'phone-cases',             label: 'Phone Cases & Covers' },
    { key: 'screen-protectors',       label: 'Screen Protectors' },
    { key: 'tripods-gimbals',         label: 'Tripods & Phone Gimbals' },
    { key: 'memory-cards',            label: 'MicroSD & Memory Cards' },
    { key: 'phone-repair-parts',      label: 'Phone Spare Parts & Repair Kits' },
    { key: 'phone-stands-mounts',     label: 'Phone Stands & Car Mounts' },
    { key: 'other-phone-accessories', label: 'Other Mobile Accessories' },
  ],

  'computers and laptops': [
    { key: 'laptops',                    label: 'Laptops' },
    { key: 'desktops',                   label: 'Desktop Towers & All-in-Ones' },
    { key: 'monitors',                   label: 'Monitors & Displays' },
    { key: 'keyboards',                  label: 'Keyboards' },
    { key: 'mouse',                      label: 'Computer Mice' },
    { key: 'laptop-bags',                label: 'Laptop Bags & Sleeves' },
    { key: 'hard-drives-ssds',           label: 'External Hard Drives & SSDs' },
    { key: 'usb-flash-drives',           label: 'USB Flash Drives' },
    { key: 'software',                   label: 'Operating Systems & Software' },
    { key: 'computer-repair-parts',      label: 'Computer Parts & Repair Components' },
    { key: 'printers-scanners',          label: 'Printers & Scanners' },
    { key: 'networking-equipment',       label: 'Networking & Server Equipment' },
    { key: 'webcams-streaming',          label: 'Webcams & Streaming Gear' },
    { key: 'other-computer-accessories', label: 'Other Computer Accessories' },
  ],

  'gaming': [
    { key: 'consoles',           label: 'Gaming Consoles (PlayStation, Xbox, Switch)' },
    { key: 'games',              label: 'Video Games & Digital Codes' },
    { key: 'controllers',        label: 'Gamepads & Controllers' },
    { key: 'gaming-headsets',    label: 'Gaming Headsets' },
    { key: 'gaming-chairs',      label: 'Gaming Chairs & Desks' },
    { key: 'vr-gear',            label: 'VR Headsets & Accessories' },
    { key: 'gaming-accessories', label: 'Other Gaming Accessories' },
  ],

  'fashion': [
    { key: 'men-clothing',     label: "Men's Clothing" },
    { key: 'women-clothing',   label: "Women's Clothing" },
    { key: 'unisex-clothing',  label: 'Unisex Clothing' },
    { key: 'sneakers-footwear',label: 'Sneakers, Crocs & Footwear' },
    { key: 'formal-wear',      label: 'Formal Wear & Suits' },
    { key: 'traditional-wear', label: 'Traditional & Custom Wear' },
    { key: 'thrift-bend-down', label: 'Thrift / Bend-Down Items' },
    { key: 'bags',             label: 'Backpacks, Handbags & Luggage' },
    { key: 'watches-jewelry',  label: 'Watches, Chains & Rings' },
    { key: 'caps-hats',        label: 'Caps, Hats & Beanies' },
    { key: 'underwear-loungewear', label: 'Underwear & Loungewear' },
    { key: 'kids-clothing',    label: "Kids' & Baby Clothing" },
    { key: 'other-fashion',    label: 'Other Fashion & Apparel' },
  ],

  'books-course-materials': [
    { key: 'textbooks',              label: 'Academic Textbooks' },
    { key: 'course-notes',           label: 'Printed Course Notes & Slides' },
    { key: 'past-questions',         label: 'Past Questions & Exam Papers' },
    { key: 'stationery',             label: 'Stationery (Notebooks, Pens, Files)' },
    { key: 'lab-coats-equipment',    label: 'Lab Coats, Goggles & Science Kits' },
    { key: 'drawing-instruments',    label: 'Drawing Boards & T-Squares' },
    { key: 'novels-literature',      label: 'Novels, Fiction & Non-Fiction' },
    { key: 'religious-books',        label: 'Religious & Inspirational Books' },
    { key: 'kids-educational',       label: "Kids' Books & Learning Materials" },
    { key: 'office-supplies',        label: 'Office Supplies & Filing' },
    { key: 'other-books',            label: 'Other Books & Materials' },
  ],

  'hostel-items': [
    { key: 'bedding-mattresses',  label: 'Bedsheets, Pillows & Mattresses' },
    { key: 'gas-cylinders-stoves',label: 'Gas Cylinders, Stoves & Regulators' },
    { key: 'kitchenware',         label: 'Pots, Plates, Spoons & Bowls' },
    { key: 'buckets-containers',  label: 'Buckets, Barrels & Water Storage' },
    { key: 'cleaning-supplies',   label: 'Mops, Brooms & Detergents' },
    { key: 'storage-wardrobes',   label: 'Wardrobes, Storage Boxes & Hangers' },
    { key: 'lighting-lamps',      label: 'Desk Lamps & Rechargeable Bulbs' },
    { key: 'mirrors',             label: 'Body & Wall Mirrors' },
    { key: 'curtains-mats',       label: 'Curtains & Door Mats' },
    { key: 'room-decor',          label: 'Room Décor, Posters & Wall Art' },
    { key: 'other-hostel',        label: 'Other Room & Home Items' },
  ],

  'appliances': [
    { key: 'fans',           label: 'Standing, Desk & Ceiling Fans' },
    { key: 'refrigerators',  label: 'Fridges & Freezers' },
    { key: 'kettles',        label: 'Electric Kettles' },
    { key: 'blenders',       label: 'Blenders & Food Processors' },
    { key: 'irons',          label: 'Pressing Irons & Steamers' },
    { key: 'microwaves',     label: 'Microwaves & Hot Plates' },
    { key: 'rice-cookers',   label: 'Rice Cookers & Air Fryers' },
    { key: 'washing-machines', label: 'Washing Machines & Dryers' },
    { key: 'water-heaters',  label: 'Water Heaters & Dispensers' },
    { key: 'home-security',  label: 'CCTV, Locks & Home Security' },
    { key: 'other-appliances', label: 'Other Home & Kitchen Appliances' },
  ],

  'furniture': [
    { key: 'chairs-stools',   label: 'Chairs, Study Seats & Stools' },
    { key: 'tables-desks',    label: 'Desks, Dining & Center Tables' },
    { key: 'beds-frames',     label: 'Beds & Bed Frames' },
    { key: 'shelves-racks',   label: 'Shelves, Bookcases & Shoe Racks' },
    { key: 'sofas-couches',   label: 'Sofas, Couches & Recliners' },
    { key: 'wardrobes-cabinets', label: 'Wardrobes & Cabinets' },
    { key: 'outdoor-furniture', label: 'Outdoor & Patio Furniture' },
    { key: 'other-furniture', label: 'Other Furniture' },
  ],

  'beauty and grooming': [
    { key: 'skincare',              label: 'Body Lotions, Oils & Serums' },
    { key: 'makeup',                label: 'Makeup Kits & Cosmetics' },
    { key: 'hair-care-wigs',        label: 'Hair Extensions, Wigs & Oils' },
    { key: 'perfumes-sprays',       label: 'Perfumes, Colognes & Body Sprays' },
    { key: 'nail-care',             label: 'Nail Polish & Manicure Tools' },
    { key: 'clippers-shavers',      label: 'Shavers & Grooming Tools' },
    { key: 'hair-styling-tools',    label: 'Dryers, Straighteners & Curlers' },
    { key: 'mens-grooming',         label: "Men's Grooming & Beard Care" },
    { key: 'bath-body',             label: 'Soaps, Scrubs & Bath Essentials' },
    { key: 'other-beauty',          label: 'Other Beauty & Grooming' },
  ],

  'sports and fitness': [
    { key: 'sports-equipment',  label: 'Football, Basketball & Tennis Gear' },
    { key: 'gym-gear',          label: 'Dumbbells, Bands & Yoga Mats' },
    { key: 'activewear',        label: 'Jerseys, Shorts & Tracksuits' },
    { key: 'water-bottles',     label: 'Sports Bottles & Shakers' },
    { key: 'cycling-skating',   label: 'Cycling & Skating Gear' },
    { key: 'outdoor-camping',   label: 'Outdoor & Camping Gear' },
    { key: 'supplements',       label: 'Fitness Supplements & Nutrition' },
    { key: 'other-sports',      label: 'Other Sports & Fitness' },
  ],

  'accessories': [
    { key: 'wallets-cardholders', label: 'Wallets & Cardholders' },
    { key: 'belts',               label: 'Belts' },
    { key: 'sunglasses',          label: 'Sunglasses & Frames' },
    { key: 'keychains-lanyards',  label: 'Keychains & Lanyards' },
    { key: 'umbrellas',           label: 'Umbrellas & Rain Gear' },
    { key: 'ties-bowties',        label: 'Ties & Bow Ties' },
    { key: 'other-accessories',   label: 'Other Accessories' },
  ],

  'food and drinks': [
    { key: 'provisions',       label: 'Provisions (Milk, Milo, Sugar, Gari)' },
    { key: 'snacks',           label: 'Chips, Cookies & Plantain Chips' },
    { key: 'drinks',           label: 'Water, Soft Drinks & Juices' },
    { key: 'breakfast-packs',  label: 'Breakfast Packs & Oatmeal' },
    { key: 'homemade-meals',   label: 'Cooked Food & Meals' },
    { key: 'baked-goods',      label: 'Cakes, Bread & Pastries' },
    { key: 'night-bites',      label: 'Late-Night Fast Food' },
    { key: 'spices-raw-food',  label: 'Rice, Eggs, Spices & Raw Ingredients' },
    { key: 'fresh-produce',    label: 'Fresh Vegetables, Fruits & Meat' },
    { key: 'frozen-foods',     label: 'Frozen Foods & Ice' },
    { key: 'catering-bulk',    label: 'Bulk Orders & Event Catering' },
    { key: 'other-food',       label: 'Other Food & Beverage Items' },
  ],

  'tickets and events': [
    { key: 'concerts-shows',     label: 'Concerts, Raves & Art Shows' },
    { key: 'seminars-webinars',  label: 'Seminars, Workshops & Masterclasses' },
    { key: 'sports-tickets',     label: 'Sports Match Tickets' },
    { key: 'bus-trips',          label: 'Excursions, Trips & Bus Tickets' },
    { key: 'conferences',        label: 'Conferences & Networking Events' },
    { key: 'other-tickets',      label: 'Other Event Tickets' },
  ],

  'transport and logistics': [
    { key: 'bicycles',          label: 'Bicycles' },
    { key: 'scooters',          label: 'Scooters & Skateboards' },
    { key: 'car-parts',         label: 'Car Parts & Accessories' },
    { key: 'motorbike-parts',   label: 'Motorbike & Okada Parts' },
    { key: 'delivery-services', label: 'Delivery & Errand Services' },
    { key: 'moving-logistics',  label: 'Moving, Luggage & Logistics' },
    { key: 'other-transport',   label: 'Other Transport Options' },
  ],

  // ─── New top-level categories the vendor schema enum already allows ───
  'tutoring and education': [
    { key: 'academic-tutoring',    label: 'Academic Tutoring' },
    { key: 'language-lessons',     label: 'Language Lessons' },
    { key: 'music-lessons',        label: 'Music & Instrument Lessons' },
    { key: 'coding-tech-lessons',  label: 'Coding & Tech Lessons' },
    { key: 'exam-prep',            label: 'Exam Preparation (WASSCE, SAT, IELTS)' },
    { key: 'professional-training',label: 'Professional Skills Training' },
    { key: 'other-education',      label: 'Other Educational Services' },
  ],

  'photography and media': [
    { key: 'photoshoots',         label: 'Photoshoots & Portraits' },
    { key: 'videography',         label: 'Videography & Event Coverage' },
    { key: 'video-editing',       label: 'Video Editing & Post-Production' },
    { key: 'drone-services',      label: 'Drone Photography & Videography' },
    { key: 'podcast-audio',       label: 'Podcast & Audio Production' },
    { key: 'social-media-mgmt',   label: 'Social Media Content & Management' },
    { key: 'other-photography',   label: 'Other Photography & Media' },
  ],

  'graphic-design-printing': [
    { key: 'logo-branding',       label: 'Logo & Brand Design' },
    { key: 'flyers-posters',      label: 'Flyers, Posters & Banners' },
    { key: 'business-cards',      label: 'Business Cards & Letterheads' },
    { key: 'printing-binding',    label: 'Bulk Printing & Binding' },
    { key: 'signage-stickers',    label: 'Signage, Stickers & Labels' },
    { key: 'packaging-design',    label: 'Packaging & Label Design' },
    { key: 'ui-ux-design',        label: 'UI / UX & Website Design' },
    { key: 'other-design',        label: 'Other Design & Print Services' },
  ],

  'repair and services': [
    { key: 'phone-repairs',       label: 'Phone Repairs' },
    { key: 'laptop-computer-repairs', label: 'Laptop & Computer Repairs' },
    { key: 'tv-appliance-repairs',label: 'TV & Appliance Repairs' },
    { key: 'car-motorbike-repairs', label: 'Car & Motorbike Repairs' },
    { key: 'furniture-repairs',   label: 'Furniture & Woodwork Repairs' },
    { key: 'shoe-cobbler',        label: 'Shoe Repair & Cobbler Services' },
    { key: 'tailoring-alterations', label: 'Tailoring & Clothing Alterations' },
    { key: 'home-services',       label: 'Plumbing, Electrical & Home Repairs' },
    { key: 'other-repairs',       label: 'Other Repair Services' },
  ],

  'events and catering': [
    { key: 'event-planning',      label: 'Event Planning & Coordination' },
    { key: 'catering',            label: 'Catering & Food Service' },
    { key: 'decoration-setup',    label: 'Decoration & Setup' },
    { key: 'dj-music',            label: 'DJ & Live Music' },
    { key: 'mc-hosting',          label: 'MC & Event Hosting' },
    { key: 'rentals-equipment',   label: 'Chair, Tent & Equipment Rentals' },
    { key: 'other-events',        label: 'Other Events & Catering' },
  ],

  'accommodation and housing': [
    { key: 'short-term-rentals',  label: 'Short-Term Rentals (Airbnb-style)' },
    { key: 'long-term-rentals',   label: 'Long-Term Rentals' },
    { key: 'hostel-rooms',        label: 'Hostel & Student Rooms' },
    { key: 'roommate-listings',   label: 'Roommate & Shared Space Listings' },
    { key: 'furnished-apartments',label: 'Furnished Apartments' },
    { key: 'other-housing',       label: 'Other Accommodation' },
  ],

  'services': [
    { key: 'cleaning-services',     label: 'Cleaning Services (Home & Office)' },
    { key: 'laundry',               label: 'Laundry & Ironing' },
    { key: 'barbering-hairdressing',label: 'Barbering, Braiding & Styling' },
    { key: 'makeup-artistry',       label: 'Makeup Artistry & Beauty Services' },
    { key: 'spa-massage',           label: 'Spa, Massage & Wellness' },
    { key: 'personal-training',     label: 'Personal Training & Coaching' },
    { key: 'tutoring',              label: 'Tutoring & Lessons' },
    { key: 'tech-repairs',          label: 'Tech & Device Repairs' },
    { key: 'tailoring-alterations', label: 'Tailoring & Alterations' },
    { key: 'car-wash-detailing',    label: 'Car Wash & Detailing' },
    { key: 'landscaping-gardening', label: 'Landscaping & Gardening' },
    { key: 'pet-services',          label: 'Pet Grooming & Sitting' },
    { key: 'other-services',        label: 'Other Services' },
  ],

  'other': [
    { key: 'miscellaneous',  label: 'Miscellaneous Items' },
    { key: 'free-items',     label: 'Free / Giveaway Items' },
    { key: 'wanted-requests',label: 'Wanted / Requests' },
  ],
};

export const CONDITION_OPTIONS = [
  { key: 'new',            label: 'Brand New',     hint: 'Unopened or unused' },
  { key: 'like-new',       label: 'Like New',       hint: 'Used briefly, no visible wear' },
  { key: 'excellent',      label: 'Excellent',      hint: 'Minimal signs of use' },
  { key: 'good',           label: 'Good',           hint: 'Normal wear, works perfectly' },
  { key: 'fair',           label: 'Fair',           hint: 'Visible wear, fully functional' },
  { key: 'slightly-used',  label: 'Slightly Used',  hint: 'Light use, minor marks' },
  { key: 'for-parts',      label: 'For Parts',      hint: 'Not fully working' },
];

export const CAMPUS_OPTIONS = [
  { key: 'UG',     label: 'University of Ghana' },
  { key: 'KNUST',  label: 'KNUST' },
  { key: 'UCC',    label: 'University of Cape Coast' },
  { key: 'UEW',    label: 'University of Education, Winneba' },
  { key: 'UPSA',   label: 'UPSA' },
  { key: 'GIMPA',  label: 'GIMPA' },
  { key: 'ASHESI', label: 'Ashesi University' },
  { key: 'ATU',    label: 'Accra Technical University' },
  { key: 'OTHER',  label: 'Other' },
];

export const AVAILABLE_TAGS = [
  { key: 'urgent-sale',      icon: 'flash-outline' },
  { key: 'popular',          icon: 'flame-outline' },
  { key: 'discounted',       icon: 'pricetag-outline' },
  { key: 'new-arrival',      icon: 'sparkles-outline' },
  { key: 'student-favorite', icon: 'heart-outline' },
];

export const CATEGORY_CONFIG = {
  fashion:       { icon: 'shirt-outline', label: 'Fashion',         color: '#FFF3E0', accent: '#E65100' },
  'beauty and grooming':        { icon: 'sparkles-outline', label: 'Beauty',          color: '#FCE4EC', accent: '#AD1457' },
  'phones and tablets':        { icon: 'phone-portrait-outline', label: 'Phones & Tablets',          color: '#F3E5F5', accent: '#6A1B9A' },
  'computers and laptops':       { icon: 'laptop-outline', label: 'Computers & Laptops',         color: '#E8EAF6', accent: '#283593' },
  gaming:        { icon: 'game-controller-outline', label: 'Gaming',          color: '#FCE4EC', accent: '#880E4F' },
  electronics:   { icon: 'hardware-chip-outline', label: 'Electronics',    color: '#E3F2FD', accent: '#1565C0' },
  'books-course-materials':         { icon: 'book-outline', label: 'Books',           color: '#FFF9C4', accent: '#F57F17' },
  'hostel-items':{ icon: 'bed-outline', label: 'Hostel Items',   color: '#E8F5E9', accent: '#2E7D32' },
  appliances:    { icon: 'flash-outline', label: 'Appliances',      color: '#EFEBE9', accent: '#4E342E' },
  furniture:     { icon: 'cube-outline', label: 'Furniture',       color: '#F1F8E9', accent: '#33691E' },
  'sports and fitness':        { icon: 'basketball-outline', label: 'Sports',          color: '#E8F5E9', accent: '#1B5E20' },
  'tickets and events': {
    icon: 'ticket-outline',
    label: 'Tickets & Events',
    color: '#FFF3E0',
    accent: '#E65100',
  },
  'transport and logistics': {
    icon: 'car-outline',
    label: 'Transport & Logistics',
    color: '#E3F2FD',
    accent: '#01579B',
  },
  accessories:   { icon: 'watch-outline', label: 'Accessories',     color: '#FFF9C4', accent: '#827717' },
  food:          { icon: 'fast-food-outline', label: 'Food',            color: '#FBE9E7', accent: '#BF360C' },
  services:      { icon: 'construct-outline', label: 'Services',        color: '#E3F2FD', accent: '#01579B' },

  // ─── New top-level categories ───────────────────────────────────────
  'tutoring and education': {
    icon: 'school-outline',
    label: 'Tutoring & Education',
    color: '#E8EAF6',
    accent: '#3949AB',
  },
  'photography and media': {
    icon: 'camera-outline',
    label: 'Photography & Media',
    color: '#E0F7FA',
    accent: '#00838F',
  },
  'graphic-design-printing': {
    icon: 'color-palette-outline',
    label: 'Design & Printing',
    color: '#F3E5F5',
    accent: '#6A1B9A',
  },
  'repair and services': {
    icon: 'build-outline',
    label: 'Repairs',
    color: '#F1F8E9',
    accent: '#558B2F',
  },
  'events and catering': {
    icon: 'restaurant-outline',
    label: 'Events & Catering',
    color: '#FFF8E1',
    accent: '#EF6C00',
  },
  'accommodation and housing': {
    icon: 'home-outline',
    label: 'Housing',
    color: '#E0F2F1',
    accent: '#00695C',
  },

  other:         { icon: 'grid-outline', label: 'Other',           color: '#F5F5F5', accent: '#616161' },
};

// Condition display map
export const CONDITION_LABELS = {
  'new':          { label: 'Brand New',    color: '#1B5E20', bg: '#E8F5E9' },
  'like-new':     { label: 'Like New',     color: '#1565C0', bg: '#E3F2FD' },
  'excellent':    { label: 'Excellent',    color: '#4527A0', bg: '#EDE7F6' },
  'good':         { label: 'Good',         color: '#E65100', bg: '#FFF3E0' },
  'fair':         { label: 'Fair',         color: '#827717', bg: '#F9FBE7' },
  'slightly-used':{ label: 'Slight Used',  color: '#4E342E', bg: '#EFEBE9' },
  'for-parts':    { label: 'For Parts',    color: '#B71C1C', bg: '#FFEBEE' },
};

// ─────────────────────────────────────────────
// CAMPUS DATA
// ─────────────────────────────────────────────
export const ALL_CAMPUSES = [
  { id: 'UG',     label: 'University of Ghana',           icon: 'school-outline', palette: { bg: '#E8F5E9', accent: '#1B5E20', border: '#A5D6A7' } },
  { id: 'KNUST',  label: 'KNUST',                         icon: 'settings-outline', palette: { bg: '#FFF3E0', accent: '#E65100', border: '#FFCC80' } },
  { id: 'UCC',    label: 'Univ. of Cape Coast',           icon: 'water-outline', palette: { bg: '#E3F2FD', accent: '#1565C0', border: '#90CAF9' } },
  { id: 'ASHESI', label: 'Ashesi University',             icon: 'bulb-outline', palette: { bg: '#F3E5F5', accent: '#6A1B9A', border: '#CE93D8' } },
  { id: 'GIMPA',  label: 'GIMPA',                         icon: 'stats-chart-outline', palette: { bg: '#E0F2F1', accent: '#00695C', border: '#80CBC4' } },
  { id: 'UEW',    label: 'Univ. of Education',            icon: 'book-outline', palette: { bg: '#FFF9C4', accent: '#F57F17', border: '#FFF176' } },
  { id: 'UPSA',   label: 'UPSA',                         icon: 'trending-up-outline', palette: { bg: '#FCE4EC', accent: '#880E4F', border: '#F48FB1' } },
  { id: 'ATU',    label: 'Accra Technical Univ.',         icon: 'construct-outline', palette: { bg: '#EFEBE9', accent: '#4E342E', border: '#BCAAA4' } },
];

export const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780782982/flyer13_1_fyp0xj.png',
    tag: 'Campus Marketplace',
    icon: 'school-outline',
    title: 'Buy & Sell on\n Campus',
    subtitle: "Connect with students across Ghana's top universities",
    btnText: 'Start Shopping',
    accentColor: '#fff',
    overlayColor: 'rgba(10,20,60,0.50)',
    nav: { screen: 'Products', params: {} },
  },
  {
    id: '2',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1780771354/flyer11_qkxwpv.jpg',
    tag: 'Electronics & Gadgets',
    icon: 'hardware-chip-outline',
    title: 'Laptops, Phones\n& More',
    subtitle: 'Student-priced tech from trusted campus sellers',
    btnText: 'Browse Electronics',
    accentColor: '#90CAF9',
    overlayColor: 'rgba(10,20,60,0.50)',
    nav: { screen: 'Products', params: { category: 'electronics' } },
  },
  {
    id: '3',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781101245/fashion_banner_ibwmaz.png',
    tag: 'Fashion & Style',
    icon: 'shirt-outline',
    title: 'Upgrade Your\nWardrobe',
    subtitle: 'Trendy outfits, accessories & vintage finds at great prices',
    btnText: 'Shop Fashion',
    accentColor: '#FFCC80',
    overlayColor: 'rgba(10,20,60,0.50)',
    nav: { screen: 'Products', params: { category: 'fashion' } },
  },
  {
    id: '4',
    image: 'https://res.cloudinary.com/duv3qvvjz/image/upload/v1781891792/food_nad_provisions_1_m6fvfn.png',
    tag: 'Food & Provisions',
    icon: 'fast-food-outline',
    title: 'Stock Up on\nFood & Provisions',
    subtitle: 'Groceries, snacks, drinks and daily essentials delivered to your doorstep',
    btnText: 'Shop Food Items',
    accentColor: '#FFB74D',
    overlayColor: 'rgba(10,20,60,0.50)',
    nav: { screen: 'Products', params: { category: 'food and drinks' } },
  },
];

export const CATEGORIES = [
  { id: 'all',                     label: 'All',                   icon: 'apps',                   color: '#E8F5E9', accent: '#0D9488' },
  { id: 'electronics',            label: 'Electronics',           icon: 'hardware-chip-outline',  color: '#E3F2FD', accent: '#1565C0' },
  { id: 'phones and tablets',     label: 'Phones & Tablets',      icon: 'phone-portrait-outline', color: '#F3E5F5', accent: '#6A1B9A' },
  { id: 'computers and laptops',  label: 'Computers & Laptops',   icon: 'laptop-outline',         color: '#E8EAF6', accent: '#283593' },
  { id: 'gaming',                 label: 'Gaming',                icon: 'game-controller-outline', color: '#FCE4EC', accent: '#880E4F' },
  { id: 'fashion',                label: 'Fashion',               icon: 'shirt-outline',          color: '#FFF3E0', accent: '#E65100' },
  { id: 'books-course-materials', label: 'Books & Notes',         icon: 'book-outline',           color: '#FFF9C4', accent: '#F57F17' },
  { id: 'tutoring and education',     label: 'Tutoring & Education',  icon: 'school-outline',         color: '#E8EAF6', accent: '#3949AB' },
  { id: 'hostel-items',           label: 'Hostel Items',          icon: 'bed-outline',            color: '#E8F5E9', accent: '#2E7D32' },
  { id: 'appliances',             label: 'Appliances',            icon: 'flash-outline',          color: '#EFEBE9', accent: '#4E342E' },
  { id: 'furniture',              label: 'Furniture',             icon: 'cube-outline',           color: '#F1F8E9', accent: '#33691E' },
  { id: 'beauty and grooming',    label: 'Beauty & Grooming',     icon: 'sparkles-outline',       color: '#FCE4EC', accent: '#AD1457' },
  { id: 'sports and fitness',     label: 'Sports & Fitness',      icon: 'basketball-outline',     color: '#E8F5E9', accent: '#1B5E20' },
  { id: 'accessories',            label: 'Accessories',           icon: 'watch-outline',          color: '#FFF9C4', accent: '#827717' },
  { id: 'food and drinks',        label: 'Food & Drinks',         icon: 'fast-food-outline',      color: '#FBE9E7', accent: '#BF360C' },
  { id: 'groceries',              label: 'Groceries',             icon: 'basket-outline',         color: '#E8F8F5', accent: '#117A65' },
  { id: 'events and catering',        label: 'Events & Catering',     icon: 'restaurant-outline',     color: '#FFF8E1', accent: '#EF6C00' },
  { id: 'tickets and events',     label: 'Tickets & Events',      icon: 'ticket-outline',         color: '#FFF3E0', accent: '#D35400' },
  { id: 'photography and media',      label: 'Photography & Media',   icon: 'camera-outline',         color: '#E0F7FA', accent: '#00838F' },
  { id: 'graphic-design-printing',label: 'Design & Printing',     icon: 'color-palette-outline',  color: '#F3E5F5', accent: '#6A1B9A' },
  { id: 'repair and services',        label: 'Repairs',               icon: 'build-outline',          color: '#F1F8E9', accent: '#558B2F' },
  { id: 'transport and logistics',label: 'Transport & Delivery',  icon: 'car-outline',            color: '#E0F7FA', accent: '#00838F' },
  { id: 'accommodation and housing',  label: 'Housing',               icon: 'home-outline',           color: '#E0F2F1', accent: '#00695C' },
  { id: 'services',               label: 'Services',              icon: 'construct-outline',      color: '#E3F2FD', accent: '#01579B' },
  { id: 'other',                  label: 'Other',                 icon: 'grid-outline',           color: '#F5F5F5', accent: '#616161' },
];

// Subcategories grouped by parent category id
export const SUBCATEGORIES = {
  'electronics': [
    { id: 'headphones-earbuds', label: 'Headphones & Earbuds' },
    { id: 'speakers', label: 'Bluetooth & Home Speakers' },
    { id: 'chargers-cables', label: 'Chargers, Cables & Adapters' },
    { id: 'power-banks', label: 'Power Banks' },
    { id: 'smartwatches', label: 'Smartwatches & Fitness Bands' },
    { id: 'cameras', label: 'Cameras & Vlogging Gear' },
    { id: 'projectors', label: 'Projectors & Screens' },
    { id: 'calculators-scientific', label: 'Scientific & Financial Calculators' },
    { id: 'extensions-plugs', label: 'Extension Boards & Adapters' },
    { id: 'trimmers-clippers', label: 'Hair Trimmers & Clippers' },
    { id: 'other-electronics', label: 'Other Electronics' },
  ],
  'phones and tablets': [
    { id: 'smartphones', label: 'Smartphones' },
    { id: 'tablets', label: 'Android Tablets' },
    { id: 'ipads', label: 'iPads' },
    { id: 'phone-cases', label: 'Phone Cases & Covers' },
    { id: 'screen-protectors', label: 'Screen Protectors' },
    { id: 'tripods-gimbals', label: 'Tripods & Phone Gimbals' },
    { id: 'memory-cards', label: 'MicroSD & Memory Cards' },
    { id: 'other-phone-accessories', label: 'Other Mobile Accessories' },
  ],
  'computers and laptops': [
    { id: 'laptops', label: 'Laptops' },
    { id: 'desktops', label: 'Desktop Towers & iMacs' },
    { id: 'monitors', label: 'Monitors & Displays' },
    { id: 'keyboards', label: 'Keyboards (Mechanical & Wireless)' },
    { id: 'mouse', label: 'Computer Mice' },
    { id: 'laptop-bags', label: 'Laptop Bags & Sleeves' },
    { id: 'hard-drives-ssds', label: 'External Hard Drives & SSDs' },
    { id: 'usb-flash-drives', label: 'USB Flash Drives (Pen Drives)' },
    { id: 'software', label: 'Operating Systems & Software Activation' },
    { id: 'other-computer-accessories', label: 'Other Computer Accessories' },
  ],
  'gaming': [
    { id: 'consoles', label: 'Gaming Consoles (PlayStation, Xbox, Switch)' },
    { id: 'games', label: 'Video Game Discs & Digital Codes' },
    { id: 'controllers', label: 'Gamepads & Controllers' },
    { id: 'gaming-headsets', label: 'Gaming Headsets' },
    { id: 'gaming-accessories', label: 'Gaming Accessories & VR Gear' },
  ],
  'fashion': [
    { id: 'men-clothing', label: 'Men Clothing' },
    { id: 'women-clothing', label: 'Women Clothing' },
    { id: 'unisex-clothing', label: 'Unisex Clothing (Hoodies, Tees)' },
    { id: 'sneakers-footwear', label: 'Sneakers, Crocs & Footwear' },
    { id: 'traditional-wear', label: 'Traditional & Custom Wear' },
    { id: 'thrift-bend-down', label: 'Thrift / Selection Items' },
    { id: 'bags', label: 'Backpacks & Handbags' },
    { id: 'watches-jewelry', label: 'Watches, Chains & Rings' },
    { id: 'caps-hats', label: 'Caps, Bucket Hats & Beanies' },
    { id: 'other-fashion', label: 'Other Fashion & Apparel' },
  ],
  'books-course-materials': [
    { id: 'textbooks', label: 'Academic Textbooks' },
    { id: 'course-notes', label: 'Printed Course Notes & Slides' },
    { id: 'past-questions', label: 'Past Questions & Pamphlets' },
    { id: 'stationery', label: 'Stationery (Notebooks, Pens, Files)' },
    { id: 'lab-coats-equipment', label: 'Lab Coats, Goggles & Science Kits' },
    { id: 'drawing-instruments', label: 'Drawing Boards & T-Squares' },
    { id: 'novels-literature', label: 'Novels & Fiction Literature' },
    { id: 'other-books', label: 'Other Educational Materials' },
  ],

  // ─── New top-level: tutoring-education ──────────────────────────────
  'tutoring and education': [
    { id: 'academic-tutoring',      label: 'Academic Tutoring' },
    { id: 'language-lessons',       label: 'Language Lessons' },
    { id: 'music-lessons',          label: 'Music & Instrument Lessons' },
    { id: 'coding-tech-lessons',    label: 'Coding & Tech Lessons' },
    { id: 'exam-prep',              label: 'Exam Preparation (WASSCE, SAT, IELTS)' },
    { id: 'professional-training',  label: 'Professional Skills Training' },
    { id: 'other-education',        label: 'Other Educational Services' },
  ],

  'hostel-items': [
    { id: 'bedding-mattresses', label: 'Bedsheets, Pillows & Mattresses' },
    { id: 'gas-cylinders-stoves', label: 'Gas Cylinders, Stoves & Regulators' },
    { id: 'kitchenware', label: 'Pots, Plates, Spoons & Bowls' },
    { id: 'buckets-containers', label: 'Buckets, Barrels & Water Storage' },
    { id: 'cleaning-supplies', label: 'Mops, Brooms & Detergents' },
    { id: 'storage-wardrobes', label: 'Plastic Wardrobes, Boxes & Hangers' },
    { id: 'lighting-lamps', label: 'Desk Lamps & Rechargeable Bulbs' },
    { id: 'mirrors', label: 'Body & Wall Mirrors' },
    { id: 'curtains-mats', label: 'Curtains & Door Mats' },
    { id: 'other-hostel', label: 'Other Hostel Room Items' },
  ],
  'appliances': [
    { id: 'fans', label: 'Standing, Desk & Orbit Fans' },
    { id: 'refrigerators', label: 'Mini Fridges & Tabletop Fridges' },
    { id: 'kettles', label: 'Electric Kettles' },
    { id: 'blenders', label: 'Blenders & Food Processors' },
    { id: 'irons', label: 'Pressing Irons' },
    { id: 'microwaves', label: 'Microwaves & Hot Plates' },
    { id: 'rice-cookers', label: 'Rice Cookers & Air Fryers' },
    { id: 'other-appliances', label: 'Other Home & Room Appliances' },
  ],
  'furniture': [
    { id: 'chairs-stools', label: 'Plastic Chairs, Study Chairs & Stools' },
    { id: 'tables-desks', label: 'Study Desks & Center Tables' },
    { id: 'beds-frames', label: 'Wooden & Metal Bed Frames' },
    { id: 'shelves-racks', label: 'Book Shelves & Shoe Racks' },
    { id: 'other-furniture', label: 'Other Furniture' },
  ],
  'beauty and grooming': [
    { id: 'skincare', label: 'Body Lotions, Oils & Serums' },
    { id: 'makeup', label: 'Makeup Kits & Cosmetics' },
    { id: 'hair-care-wigs', label: 'Hair Extensions, Wigs & Oils' },
    { id: 'perfumes-sprays', label: 'Perfumes, Colognes & Body Sprays' },
    { id: 'nail-care', label: 'Nail Polish & Manicure Tools' },
    { id: 'clippers-shavers', label: 'Personal Shavers & Grooming Tools' },
    { id: 'other-beauty', label: 'Other Beauty & Grooming' },
  ],
  'sports and fitness': [
    { id: 'sports-equipment', label: 'Football, Basketball & Tennis Gear' },
    { id: 'gym-gear', label: 'Dumbbells, Resistance Bands & Yoga Mats' },
    { id: 'activewear', label: 'Jerseys, Gym Shorts & Tracksuits' },
    { id: 'water-bottles', label: 'Sports Water Bottles & Shakers' },
    { id: 'other-sports', label: 'Other Sports & Fitness' },
  ],
  'accessories': [
    { id: 'wallets-cardholders', label: 'Wallets & Cardholders' },
    { id: 'belts', label: 'Leather & Casual Belts' },
    { id: 'sunglasses', label: 'Sunglasses & Clear Frames' },
    { id: 'keychains-lanyards', label: 'Keychains & Student Lanyards' },
    { id: 'other-accessories', label: 'Other General Accessories' },
  ],
  'food and drinks': [
    { id: 'provisions', label: 'Provisions (Milk, Milo, Sugar, Gari)' },
    { id: 'snacks', label: 'Chips, Cookies & Plantain Chips' },
    { id: 'drinks', label: 'Water, Soft Drinks & Juices' },
    { id: 'breakfast-packs', label: 'Breakfast Packs & Oatmeal' },
    { id: 'homemade-meals', label: 'Cooked Food & Standard Meals' },
    { id: 'baked-goods', label: 'Cakes, Bread & Pastries' },
    { id: 'night-bites', label: 'Late Night Fast Food' },
    { id: 'spices-raw-food', label: 'Rice, Eggs, Spices & Raw Ingredients' },
    { id: 'other-food', label: 'Other Food & Beverage Items' },
  ],
  'groceries': [
    { id: 'fresh-fruits-veg', label: 'Fresh Fruits & Vegetables' },
    { id: 'tubers-roots', label: 'Yam, Cassava & Plantains' },
    { id: 'grains-beans', label: 'Rice, Beans, Maize & Grains' },
    { id: 'oils-spices', label: 'Cooking Oils, Pepper & Spices' },
    { id: 'meat-fish-eggs', label: 'Eggs, Fresh Meat & Fish' },
    { id: 'other-groceries', label: 'Other Market Groceries' },
  ],

  // ─── New top-level: events-catering ─────────────────────────────────
  'events and catering': [
    { id: 'event-planning',    label: 'Event Planning & Coordination' },
    { id: 'catering',          label: 'Catering & Food Service' },
    { id: 'decoration-setup',  label: 'Decoration & Setup' },
    { id: 'dj-music',          label: 'DJ & Live Music' },
    { id: 'mc-hosting',        label: 'MC & Event Hosting' },
    { id: 'rentals-equipment', label: 'Chair, Tent & Equipment Rentals' },
    { id: 'other-events',      label: 'Other Events & Catering' },
  ],

  'tickets and events': [
    { id: 'concerts-shows', label: 'Concerts, Raves & Art Shows' },
    { id: 'campus-dinners', label: 'Hall, Faculty & Department Dinners' },
    { id: 'bus-trips', label: 'Excursions, Weekend Trips & Bus Tickets' },
    { id: 'seminars-webinars', label: 'Student Seminars & Masterclasses' },
    { id: 'other-tickets', label: 'Other Event Tickets' },
  ],

  // ─── New top-level: photography-media ───────────────────────────────
  'photography and media': [
    { id: 'photoshoots',       label: 'Photoshoots & Portraits' },
    { id: 'videography',       label: 'Videography & Event Coverage' },
    { id: 'video-editing',     label: 'Video Editing & Post-Production' },
    { id: 'drone-services',    label: 'Drone Photography & Videography' },
    { id: 'podcast-audio',     label: 'Podcast & Audio Production' },
    { id: 'social-media-mgmt', label: 'Social Media Content & Management' },
    { id: 'other-photography', label: 'Other Photography & Media' },
  ],

  // ─── New top-level: graphic-design-printing ─────────────────────────
  'graphic-design-printing': [
    { id: 'logo-branding',     label: 'Logo & Brand Design' },
    { id: 'flyers-posters',    label: 'Flyers, Posters & Banners' },
    { id: 'business-cards',    label: 'Business Cards & Letterheads' },
    { id: 'printing-binding',  label: 'Bulk Printing & Binding' },
    { id: 'signage-stickers',  label: 'Signage, Stickers & Labels' },
    { id: 'packaging-design',  label: 'Packaging & Label Design' },
    { id: 'ui-ux-design',      label: 'UI / UX & Website Design' },
    { id: 'other-design',      label: 'Other Design & Print Services' },
  ],

  // ─── New top-level: repair-services ─────────────────────────────────
  'repair and services': [
    { id: 'phone-repairs',           label: 'Phone Repairs' },
    { id: 'laptop-computer-repairs', label: 'Laptop & Computer Repairs' },
    { id: 'tv-appliance-repairs',    label: 'TV & Appliance Repairs' },
    { id: 'car-motorbike-repairs',   label: 'Car & Motorbike Repairs' },
    { id: 'furniture-repairs',       label: 'Furniture & Woodwork Repairs' },
    { id: 'shoe-cobbler',            label: 'Shoe Repair & Cobbler Services' },
    { id: 'tailoring-alterations',   label: 'Tailoring & Clothing Alterations' },
    { id: 'home-services',           label: 'Plumbing, Electrical & Home Repairs' },
    { id: 'other-repairs',           label: 'Other Repair Services' },
  ],

  'transport and logistics': [
    { id: 'bicycles', label: 'Bicycles' },
    { id: 'scooters', label: 'Electric Scooters & Skateboards' },
    { id: 'campus-delivery', label: 'On-Campus Errands & Delivery Services' },
    { id: 'luggage-moving', label: 'Hostel Moving & Luggage Services' },
    { id: 'other-transport', label: 'Other Transport Options' },
  ],

  // ─── New top-level: accommodation-housing ───────────────────────────
  'accommodation and housing': [
    { id: 'short-term-rentals',   label: 'Short-Term Rentals (Airbnb-style)' },
    { id: 'long-term-rentals',    label: 'Long-Term Rentals' },
    { id: 'hostel-rooms',         label: 'Hostel & Student Rooms' },
    { id: 'roommate-listings',    label: 'Roommate & Shared Space Listings' },
    { id: 'furnished-apartments', label: 'Furnished Apartments' },
    { id: 'other-housing',        label: 'Other Accommodation' },
  ],

  'services': [
    { id: 'tutoring', label: 'Academic Tutoring & Coding Lessons' },
    { id: 'graphic-design', label: 'Flyer Design, Branding & UI/UX' },
    { id: 'photography', label: 'Photoshoots & Video Editing' },
    { id: 'printing-photocopy', label: 'Bulk Printing, Binding & Photocopying' },
    { id: 'laundry', label: 'Washing & Ironing Services' },
    { id: 'barbering-hairdressing', label: 'Haircuts, Braiding & Wig Styling' },
    { id: 'tech-repairs', label: 'Phone, Laptop & Software Repairs' },
    { id: 'tailoring-alterations', label: 'Clothing Alterations & Tailoring' },
    { id: 'other-services', label: 'Other Student Services' },
  ],
  'other': [
    { id: 'miscellaneous', label: 'Miscellaneous Items' },
  ],
};

export const CONDITION_CONFIG = {
  'new':          { label: 'Brand New',    textColor: '#1B5E20', bg: '#E8F5E9' },
  'like-new':     { label: 'Like New',     textColor: '#1565C0', bg: '#E3F2FD' },
  'excellent':    { label: 'Excellent',    textColor: '#4527A0', bg: '#EDE7F6' },
  'good':         { label: 'Good',         textColor: '#E65100', bg: '#FFF3E0' },
  'fair':         { label: 'Fair',         textColor: '#827717', bg: '#F9FBE7' },
  'slightly-used':{ label: 'Slight Used',  textColor: '#4E342E', bg: '#EFEBE9' },
  'for-parts':    { label: 'For Parts',    textColor: '#B71C1C', bg: '#FFEBEE' },
};


export const GHANA_LOCATIONS = {
  'Accra': {
    label: 'Accra',
    region: 'Greater Accra',
    suburbs: [
      'Madina', 'Adenta', 'East Legon', 'West Legon','Legon','Haatso','Kaneshie',
      'Dome', 'Achimota', 'Dansoman', 'Osu','Ablekuma',
      'Labone', 'Cantonments', 'Airport Residential', 'Spintex','Pokuase',
      'Teshie', 'Nungua', 'Tema Community 1', 'Tema Community 25','Amasaman',
      'Ashaiman', 'Lapaz', 'Tesano', 'Awoshie', 'Weija',
      'Mallam', 'Kasoa', 'Other (Accra)',
    ],
  },
  'Kumasi': {
    label: 'Kumasi',
    region: 'Ashanti',
    suburbs: [
      'Adum', 'Asokwa', 'Bantama', 'Suame', 'Tafo',
      'Ayeduase', 'Bomso', 'Kotei', 'Ahodwo', 'Nhyiaeso',
      'Buokrom', 'Manhyia', 'Atonsu', 'Santasi', 'Other (Kumasi)',
    ],
  },
  'Tamale': {
    label: 'Tamale',
    region: 'Northern',
    suburbs: [
      'Tamale Central', 'Sagnarigu', 'Kalpohin', 'Nyohini',
      'Vittin', 'Lamashegu', 'Other (Tamale)',
    ],
  },
  'Takoradi': {
    label: 'Takoradi',
    region: 'Western',
    suburbs: [
      'Takoradi Central', 'Effia-Nkwanta', 'Kwesimintsim', 'Airport Ridge',
      'Anaji', 'Beach Road', 'Other (Takoradi)',
    ],
  },
  'Cape Coast': {
    label: 'Cape Coast',
    region: 'Central',
    suburbs: [
      'Cape Coast Central', 'Abura', 'Pedu', 'Amamoma',
      'Kwaprow', 'Apewosika', 'Other (Cape Coast)',
    ],
  },
  'Tema': {
    label: 'Tema',
    region: 'Greater Accra',
    suburbs: [
      'Tema Community 1', 'Tema Community 2', 'Tema Community 4',
      'Tema Community 7', 'Tema Community 9', 'Tema Community 25',
      'Ashaiman', 'Other (Tema)',
    ],
  },
  'Koforidua': {
    label: 'Koforidua',
    region: 'Eastern',
    suburbs: [
      'Koforidua Central', 'Effiduase', 'Adweso', 'Betom',
      'Nsukwao', 'Other (Koforidua)',
    ],
  },
  'Sunyani': {
    label: 'Sunyani',
    region: 'Bono',
    suburbs: [
      'Sunyani Central', 'Fiapre', 'Area 4', 'Penkwase',
      'Other (Sunyani)',
    ],
  },
  'Ho': {
    label: 'Ho',
    region: 'Volta',
    suburbs: [
      'Ho Central', 'Bankoe', 'Ahoe', 'Dome',
      'Other (Ho)',
    ],
  },
  'Wa': {
    label: 'Wa',
    region: 'Upper West',
    suburbs: [
      'Wa Central', 'Kpaguri', 'Bamahu',
      'Other (Wa)',
    ],
  },
  'Bolgatanga': {
    label: 'Bolgatanga',
    region: 'Upper East',
    suburbs: [
      'Bolgatanga Central', 'Zuarungu', 'Other (Bolgatanga)',
    ],
  },
  'Other': {
    label: 'Other Location',
    region: '',
    suburbs: [],
  },
};


export const CITY_OPTIONS = Object.entries(GHANA_LOCATIONS)
  .map(([id, { label, region }]) => ({ id, label, region }));

//  Suburbs for a given city id — always returns an array.
export const getSuburbs = (cityId) => GHANA_LOCATIONS[cityId]?.suburbs || [];

//  Human-readable location string.
export const formatLocation = ({ city, area, suburb } = {}) => {
  const sub = suburb || area;
  if (sub && city) return `${sub}, ${GHANA_LOCATIONS[city]?.label || city}`;
  if (city) return GHANA_LOCATIONS[city]?.label || city;
  return '';
};