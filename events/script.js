// login - sign up popups
const popup = document.querySelector('.login-popup');
const loginLink = document.querySelector('.login-link');
const registerLink = document.querySelector('.register-link');
const loginButton = document.querySelector('.login-btn');
const popupCloseButton = document.querySelector('.close-btn');

// hamburger 
const hamburgerMenu = document.querySelector('.hamburger-menu');
const hamburgerCheckbox = document.querySelector('.hamburger-checkbox');
const navMenuList = document.querySelector('.vb-nav-menu-group');

const items = document.querySelectorAll('.item');

// navbar
const navbar = document.querySelector('.navbar');

registerLink.addEventListener('click', async () => {
    popup.classList.add('active');
});

loginLink.addEventListener('click', async () => {
    popup.classList.remove('active');
});

loginButton.addEventListener('click', async () => {
    popup.classList.add('active-popup');
});

popupCloseButton.addEventListener('click', async () => {
    popup.classList.remove('active-popup');
});

document.getElementById('nav-sign').addEventListener('click', async function() {
    window.open('../signup/sign.html', '_self');
});

const hamburgerMenuPopup = async (ev) => {
    if (hamburgerCheckbox.checked) {   
        navbar.classList.add('active');
        navMenuList.classList.add('active');
        items.forEach(item => item.classList.add('active'));
    } else {
        navbar.classList.remove('active');
        navMenuList.classList.remove('active');
        items.forEach(item => item.classList.remove('active'));
    }
}

hamburgerCheckbox.addEventListener('click', hamburgerMenuPopup);

//Locations data

document.getElementById('main-btn').addEventListener('click', function() {
    window.location.href = "../index.html";
});

document.getElementById('map-btn').addEventListener('click', function() {
    window.location.href = "../map/map.html";
});

document.getElementById('wrk-btn').addEventListener('click', function() {
    window.location.href = "../workouts/workout.html";
});

document.getElementById('chat-btn').addEventListener('click', function() {
    window.location.href = "../chat/chat.html";
});

function handleWheel(e) {
    if (e.deltaY != 0) { return; }
    e.preventDefault();
    document.getElementById('wrapper').scrollTop += 10 * e.deltaX;
  }
  
  function calculateParalax(container, elem) {
    let elemCenterY = elem.offsetTop + (elem.offsetHeight / 2);
    let viewCenterY = container.scrollTop + (container.offsetHeight / 2);
    let delta = elemCenterY - viewCenterY;
    let max = container.offsetHeight / 2 + elem.offsetHeight / 2;
    elem.style.setProperty('--paralaxY', (delta * 100 / max) + 50 + "%");
  }
  
  function handleScroll(e) {
    for(i = 0; i < allWindows.length; i++) {
      calculateParalax(e.target, allWindows[i]);
    }
  }
  
  function handleMouseMove(e) {
    let delta = e.clientX - (document.documentElement.offsetWidth / 2);
    let max = document.documentElement.offsetWidth * 2;
    document.documentElement.style.setProperty('--paralaxX', (delta * 100 / max) + 50 + "%");
  }
  
  function handleClick(e) {s
    if (e.target.classList.contains('selected')) {
      e.target.classList.remove('selected');
      return;
    }
    for(i = 0; i < allWindows.length; i++) {
      allWindows[i].classList.remove('selected');
    }
    e.target.classList.add('selected');
  }
  
  document.getElementById('wrapper').addEventListener('wheel', handleWheel);
  document.getElementById('wrapper').addEventListener('scroll', handleScroll);
  document.documentElement.addEventListener('mousemove', handleMouseMove);
  
  var allWindows = document.getElementsByClassName('window');
  for(i = 0; i < allWindows.length; i++) {
    allWindows[i].addEventListener('click', handleClick);
  }
  
// Sample images array (URLs)
const images = [
    "https://img.buzzfeed.com/buzzfeed-static/static/2020-12/22/22/asset/6583d86d6f96/sub-buzz-11026-1608676091-8.jpg?downsize=700%3A%2A&output-quality=auto&output-format=auto",
    "https://alexanderprange.wordpress.com/wp-content/uploads/2018/11/haikyuu-post-1-feature-image.jpg?w=648",
    "https://static1.cbrimages.com/wordpress/wp-content/uploads/2022/04/Shoyo-Hinata-from-Haikyuu!!.jpg?q=50&fit=crop&w=1140&h=&dpr=1.5",
    "https://static0.gamerantimages.com/wordpress/wp-content/uploads/2021/04/Sports-Anime-Haikyuu-Volleyball.jpg?q=50&fit=crop&w=1140&h=&dpr=1.5",
/*    "https://via.placeholder.com/400x200?text=Image+5",
    "https://via.placeholder.com/400x200?text=Image+6",
    "https://via.placeholder.com/400x200?text=Image+7",
    "https://via.placeholder.com/400x200?text=Image+8",
    "https://via.placeholder.com/400x200?text=Image+9",
    "https://via.placeholder.com/400x200?text=Image+10",
    // Add more image URLs as needed */
  ];

  // Initialize text content in each window with typing information
  const typingInfo = [
    "Introducing to our Volleyball events!",
    "You can find events by scrolling...",
    "Glad to see you here!",
    "Bye Bye!"
  ];
  
// Add image and text content to each window
const allWindows = document.getElementsByClassName('window');

for (i = 0; i < allWindows.length; i++) {
    const imgElement = document.createElement('img');
    imgElement.src = images[i] || "https://via.placeholder.com/400x200?text=Default+Image";
    
    const textElement = document.createElement('div');
    textElement.textContent = typingInfo[i] || "More Content Coming Soon...";
  
    allWindows[i].appendChild(imgElement);
    allWindows[i].appendChild(textElement);
  }
  
  document.getElementById('wrapper').scrollTop = document.getElementById('wrapper').scrollHeight / 2;
  
  function calculateBackgroundOpacity(container, elem, index) {
    let elemRect = elem.getBoundingClientRect();
    let containerHeight = container.offsetHeight;

    // Calculate the relative position of the element in the viewport
    let distanceFromTop = elemRect.top;
    
    // Calculate opacity based on distance from the top (e.g., closer to the top = more background)
    let opacity = Math.min(1, 1 - distanceFromTop / containerHeight); // Closer to 0 when far, closer to 1 when near top
    elem.style.backgroundColor = `rgba(240, 240, 240, ${opacity})`;
}

function handleScroll(e) {
    var allWindows = document.getElementsByClassName('window');
    for(let i = 0; i < allWindows.length; i++) {
        calculateBackgroundOpacity(e.target, allWindows[i], i);
    }
}

// Listen to the scroll event on the wrapper
document.getElementById('wrapper').addEventListener('scroll', handleScroll);


// Function to detect if the element is in the middle of the viewport
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('middle');
        } else {
            entry.target.classList.remove('middle');
        }
    });
}, {
    threshold: 0.5, // Adjust the threshold to trigger when 50% of the element is visible
});

// Get all the window elements and observe them
document.querySelectorAll('.window').forEach(window => {
    observer.observe(window);
});
