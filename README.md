# TRAVEL SOM — Website Project

Travel and transportation website for TRAVEL SOM (bus, taxi and flight services between Somali cities).

## Open the project
1. Extract the ZIP.
2. Open the `TRAVEL-SOM` folder in Visual Studio Code (File > Open Folder).
3. Open `index.html` in a browser (or use the "Live Server" extension for live reload).

Keep the folders together — `index.html` loads `css/style.css`, `js/script.js` and the pictures from `images/` using relative paths.

## Structure
```
TRAVEL-SOM/
├── index.html          structure and all text content
├── css/style.css       colors, layout, animations, responsive rules
├── js/script.js        menu, hero slideshow, forms, scroll animation
├── images/
│   ├── airplane/airplane.jpg
│   ├── bus/bus.jpg
│   ├── taxi/taxi.jpg
│   ├── cities/         mogadishu.jpg, mogadishu-hero.jpg, baidoa.jpg, berbera.jpg
│   └── other/unassigned-seafront.jpg   (uploaded, not used on the page yet)
└── README.md
```

## Features
- Sticky navbar: Home | About Us | Laamaha, phone +252 063 7537706 (tap to call), Hadda Dalbo button, hamburger menu on mobile
- Hero with automatic slideshow: airplane > taxi > bus > Mogadishu (about 4.8 s each, fade)
- Three equal service cards side by side on desktop/laptop: Flight, Bus, Taxi (stack on small screens)
- Explore Somali Cities (10 cards), booking form, About, Branches, Why Choose Us, Featured Buses, Testimonials, call-to-action, Contact form, footer
- Responsive for desktop, laptop, tablet and mobile; no horizontal scrolling
- Brand colors: navy `#0A2358` and orange `#FF8A1F` (defined at the top of `css/style.css`)

## City Images
All 10 Somali city destinations now have high-resolution photos in `images/cities/`:
- Mogadishu (`mogadishu.jpg`)
- Hargeisa (`hargeisa.jpg`)
- Bosaso (`bosaso.jpg`)
- Garowe (`garowe.jpg`)
- Kismayo (`kismayo.jpg`)
- Baidoa (`baidoa.jpg`)
- Burao (`burao.jpg`)
- Berbera (`berbera.jpg`)
- Beledweyne (`beledweyne.jpg`)
- Galkayo (`galkayo.jpg`)

## Notes
- The contact details in the Contact section and footer (address, `info@travelsom.com`), the Branches addresses ("Address: to be added") and the testimonials are placeholders — replace them with real information.
- The booking and contact forms show an on-page confirmation only; they do not send data anywhere yet.
