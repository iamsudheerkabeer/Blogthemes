/**
 * Sudheer Kabeer - Centralized JavaScript Configuration
 * Built for multi-site ad management and dynamic UI rendering.
 * www.sudheer.xyz
 * 9020645214
 */

// [1. GLOBAL VARIABLES FOR BLOG FEED AND DYNAMIC ADS]
let newsFeedData = []; // Will store the parsed RSS feed posts
let adsData = {};      // Will store ad configurations loaded dynamically from JSON

// [2. MOBILE NAVIGATION MENU & SEARCH HANDLERS]
function toggleMobileMenu() { 
  // Toggle active class to show/hide the responsive navigation links
  document.getElementById('mobileMenu').classList.toggle('active'); 
}

function handleSearch() {
  const input = document.getElementById('searchInput');
  // If the input is empty, focus on it; otherwise, submit the form
  if (input.value.trim() === "") {
    input.focus();
  } else {
    document.getElementById('searchForm').submit();
  }
}

// [3. DATE GENERATOR & DARK MODE PERSISTENCE]
const d = new Date();
const topDate = document.getElementById('topDate');
const yTxt = document.getElementById('yTxt');

// Format and display the current date in the top bar (e.g., "Wednesday, June 3, 2026")
if (topDate) {
  topDate.textContent = d.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}

// Display the current year in the copyright notice
if (yTxt) {
  yTxt.textContent = d.getFullYear();
}

// Check and apply saved theme preference from local storage
const themeBtn = document.getElementById('themeBtn');
if (localStorage.getItem('mode') === 'light') {
  document.body.classList.add('light-mode');
}

// Toggle light/dark mode and save user preference
if (themeBtn) {
  themeBtn.onclick = () => {
    document.body.classList.toggle('light-mode');
    localStorage.setItem('mode', document.body.classList.contains('light-mode') ? 'light' : 'dark');
  };
}

// [4. MULTI-SITE DOMAIN DETECTION & ASYNC DATA FETCHING]

// Parse the current domain name to generate the correct JSON filename
// e.g., "vazhchayugam.com" becomes "vazhchayugam", "test.blogspot.com" becomes "test" [1]
const domainName = window.location.hostname.replace('www.', '').split('.')[0]; 

// Create a cache-bypassing JSON URL using a timestamp query parameter
const jsonUrl = `https://cdn.jsdelivr.net/gh/iamsudheerkabeer/Blogthemes@main/Vazhchayugam-bysk/${domainName}-ads.json?t=` + new Date().getTime();

// Prepare fetch request for Blogger RSS Feed
const fetchFeed = fetch('/feeds/posts/default?alt=json&max-results=15').then(r => r.json());

// Prepare fetch request for dynamic ads configuration
const fetchAds = fetch(jsonUrl)
  .then(r => r.json())
  .catch(err => {
    console.error(`Failed to load ads for domain "${domainName}". Falling back to no ads.`, err);
    return {}; // Return empty object to prevent layout breakage if JSON is missing
  });

// Execute both network requests simultaneously (Promise.all) for optimum loading speed
Promise.all([fetchFeed, fetchAds]).then(([feedData, loadedAds]) => {
  adsData = loadedAds; // Assign loaded JSON data to the global variable
  const entries = feedData.feed.entry;
  newsFeedData = entries;
  let tH = '', sH = '';

  if (entries) {
    entries.forEach((e, i) => {
      let title = e.title.$t;
      let link = e.link.find(x => x.rel === 'alternate').href;
      let published = new Date(e.published.$t).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      
      // Extract featured image or fallback to a placeholder
      let img = 'https://via.placeholder.com/400x250?text=Anti-Fraud';
      if (e.media$thumbnail) {
        img = e.media$thumbnail.url.replace('s72-c', 's600-c');
      } else if (e.content && e.content.$t.includes('<img')) {
        let m = e.content.$t.match(/src="([^"]+)"/);
        if (m) img = m[1];
      }
      
      // Populate the Flash News Ticker items
      tH += `<div class="ticker-item"><img src="${img}"/><a href="${link}">${title}</a></div>`;
      
      // Populate the Sidebar Trending Widget (maximum 8 items)
      if (i < 8) {
        sH += `<a href="${link}" class="trend-item">
                  <img src="${img}" alt="${title}"/>
                  <div class="trend-info">
                    <h4>${title}</h4>
                    <span class="trend-date">📅 ${published}</span>
                  </div>
               </a>`;
      }
    });

    // Inject generated HTML into elements if they exist
    if (document.getElementById('ticker-content')) document.getElementById('ticker-content').innerHTML = tH;
    if (document.getElementById('trending-sidebar')) document.getElementById('trending-sidebar').innerHTML = sH;
    
    // Trigger in-post ad and layout adjustments
    injectPostAddons(); 
  }
});

// [5. POST CONTENT ENHANCEMENT LOGIC (IMAGE FIXER, IN-POST ADS & RELATED POSTS)]
function injectPostAddons() {
  const body = document.getElementById('mainPostContent');
  if (!body) return;

  // --- Image Quality & Responsiveness Optimizer ---
  const bloggerImages = body.querySelectorAll('.separator img');
  bloggerImages.forEach(img => {
    img.removeAttribute('width');
    img.removeAttribute('height');
    img.style.width = '100%';
    img.style.height = 'auto';
    img.style.borderRadius = '10px';
    img.style.display = 'block';

    // Replace Blogger thumbnail parameters to request high-resolution images (=s1200)
    let src = img.getAttribute('src');
    if (src && src.includes('blogger.googleusercontent.com')) {
       let baseUrl = src.split('=')[0];
       img.setAttribute('src', baseUrl + '=s1200');
    }
    
    // Adjust layout parameters of parent links
    let parentA = img.closest('a');
    if (parentA) {
        parentA.style.marginLeft = '0';
        parentA.style.marginRight = '0';
        parentA.style.display = 'block';
    }
  });
  
  // --- Ad Injection inside Article Paragraphs ---
  const elements = body.querySelectorAll('p'); 
  const createAd = (data) => `<div class="in-post-ad"><a href="${data.link}" target="_blank"><img src="${data.img}"/></a></div>`;
  
  // Helper function to insert nodes after a specific target paragraph
  const insertAfter = (referenceNode, newNode) => {
    if (referenceNode) {
      referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
    }
  };

  // Inject Ad 1 after the 1st paragraph
  if (adsData.ad1 && adsData.ad1.active && elements[0]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad1);
    insertAfter(elements[0], d);
  }

  // Inject Ad 2 after the 2nd paragraph
  if (adsData.ad2 && adsData.ad2.active && elements[1]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad2);
    insertAfter(elements[1], d);
  }

  // Inject "Read Also" random post recommendation after the 3rd paragraph
  if (adsData.readAlso && adsData.readAlso.active && elements[2] && newsFeedData.length > 0) {
    const rel = newsFeedData[Math.floor(Math.random() * newsFeedData.length)];
    const relLink = rel.link.find(l => l.rel === 'alternate').href;
    let relImg = 'https://via.placeholder.com/110x75?text=No+Image';
    if (rel.media$thumbnail) relImg = rel.media$thumbnail.url.replace(/\/s[0-9]+(-c)?\//, '/s200-c/').replace(/=s[0-9]+(-c)?/, '=s200-c');

    const d = document.createElement('div');
    d.innerHTML = `<div class="in-post-related"><img src="${relImg}" style="width:110px; height:75px; object-fit:cover; border-radius:8px;"/><div style="flex:1;"><small style="color:var(--accent);font-weight:900;display:block;margin-bottom:3px;">READ ALSO</small><a href="${relLink}" style="font-weight:bold; text-decoration:none; font-size:14px; line-height:1.4; display:block;">${rel.title.$t}</a></div></div>`;
    insertAfter(elements[2], d);
  }

  // Inject Ad 3 after the 4th paragraph
  if (adsData.ad3 && adsData.ad3.active && elements[3]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad3);
    insertAfter(elements[3], d);
  }

  // Inject Ad 4 after the 5th paragraph
  if (adsData.ad4 && adsData.ad4.active && elements[4]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad4);
    insertAfter(elements[4], d);
  }

  // Inject Ad 5 after the 6th paragraph
  if (adsData.ad5 && adsData.ad5.active && elements[5]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad5);
    insertAfter(elements[5], d);
  }
  
  // Inject Ad 6 after the 7th paragraph
  if (adsData.ad6 && adsData.ad6.active && elements[6]) {
    const d = document.createElement('div'); d.innerHTML = createAd(adsData.ad6);
    insertAfter(elements[6], d);
  }
}

// [6. SOCIAL SHARING & CLIPBOARD COPIER UTILITIES]
function shareWa() { 
  // Launch WhatsApp sharing page with custom layout
  window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(document.title + "\n" + window.location.href), "_blank"); 
}

function shareTg() { 
  // Launch Telegram sharing page
  window.open("https://t.me/share/url?url=" + encodeURIComponent(window.location.href) + "&text=" + encodeURIComponent(document.title), "_blank"); 
}

function copyNow(u) {
  // Copy current URL to the user's clipboard using a fallback textarea
  const t = document.createElement('textarea'); t.value = u; document.body.appendChild(t);
  t.select(); document.execCommand('copy'); document.body.removeChild(t);
  const toast = document.getElementById('toast'); 
  if (toast) {
      toast.className = 'show';
      setTimeout(() => { toast.className = ''; }, 2500); // Display alert for 2.5 seconds
  }
}

function copyContent() {
  // Copies the custom chapter block content to clipboard
  const chapterArea = document.getElementById('chapter-content');
  if (!chapterArea) {
      alert("Can't find copying content!");
      return;
  }

  const range = document.createRange();
  range.selectNode(chapterArea);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  try {
      document.execCommand('copy');
      const copyBtn = event.target;
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = "✅ Copied to Clipboard!";
      copyBtn.style.background = "#28a745"; // Change button status to green
      
      setTimeout(function() {
          copyBtn.innerHTML = originalText;
          copyBtn.style.background = ""; // Restore default state
      }, 2000);
  } catch (err) {
      alert("Sorry, Text Can't be Copied.");
  }
  window.getSelection().removeAllRanges();
}

// [7. AUTOMATIC NOVEL/SERIES CHAPTER NAVIGATION GENERATOR]
(function() {
  const chapterDiv = document.getElementById('chapter-content');
  if (!chapterDiv) return;

  const currentUrl = window.location.href.split('?')[0].split('#')[0];
  const urlParts = currentUrl.split('/');
  if (urlParts.length < 6) return;

  const year = urlParts[3], month = urlParts[4], fileName = urlParts[5];

  // Set the total configuration for specific novel file titles
  const seriesConfig = {
      'mind-is-a-magician': 20,
      'the-project-house': 2,
      'novel-horror': 5
  };

  let currentSeries = Object.keys(seriesConfig).find(s => fileName.includes(s));
  if (!currentSeries) return; 

  const totalChapters = seriesConfig[currentSeries];
  const lastHyphenIndex = fileName.lastIndexOf('-');
  const baseFileName = fileName.substring(0, lastHyphenIndex + 1);
  const baseUrl = urlParts[0] + "//" + urlParts[2];
  
  let currentIndex = -1;
  let chapters = [];
  for (let i = 1; i <= totalChapters; i++) {
      chapters.push(`${baseUrl}/${year}/${month}/${baseFileName}${i}.html`);
  }

  // Construct UI for Chapter Navigation block
  let navHtml = '<div id="auto-navigation" style="margin: 25px 0; padding: 20px; border: 1px solid var(--border); border-radius: 15px; background: rgba(255,255,255,0.02);">';
  navHtml += '<div align="center"><p style="font-weight:900; color:var(--accent); text-transform:uppercase; font-size:12px; margin-bottom:15px;">Chapters List</p><div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 8px;">';

  chapters.forEach((link, index) => {
      const chapterNum = index + 1;
      const isCurrent = currentUrl.includes(baseFileName + chapterNum + '.html');
      const cls = isCurrent ? 'btn-red' : 'btn-blue';
      if (isCurrent) currentIndex = chapterNum;
      navHtml += `<a href="${link}" class="${cls}" style="min-width:38px; height:38px; display:flex; align-items:center; justify-content:center; text-decoration:none; border-radius:8px; font-size:13px; font-weight:bold;">${chapterNum}</a>`;
  });

  navHtml += '</div><div style="margin-top:25px; display:flex; justify-content:center; gap:15px; border-top: 1px solid var(--border); padding-top: 20px;">';

  // Back and Next navigation links
  if (currentIndex > 1) {
      navHtml += `<a href="${baseUrl}/${year}/${month}/${baseFileName}${currentIndex - 1}.html" class="btn-blue" style="text-decoration:none; flex:1; text-align:center; max-width:150px;">⬅️ Previous</a>`;
  }
  if (currentIndex < totalChapters) {
      navHtml += `<a href="${baseUrl}/${year}/${month}/${baseFileName}${currentIndex + 1}.html" class="btn-blue" style="text-decoration:none; flex:1; text-align:center; max-width:150px;">Next ➡️</a>`;
  }
  navHtml += '</div></div></div>';

  chapterDiv.insertAdjacentHTML('afterend', navHtml);
})();

// [8. RESPONSIVE MOBILE MENU SUBMENU TOGGLE]
function toggleSubMenu(element) {
  if (window.innerWidth <= 1100) {
    var content = element.nextElementSibling;
    content.classList.toggle('active'); // Open dropdown in responsive layouts
  }
}