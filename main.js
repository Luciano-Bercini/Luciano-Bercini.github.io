function LoadHeader() {
  let header = document.createElement("header");
  let nav = document.createElement("nav");
  nav.className = "top-nav";

  let homeLink = document.createElement("a");
  homeLink.href = "index.html";
  homeLink.innerHTML = "Home&nbsp";
  nav.appendChild(homeLink);

  let gamesLink = document.createElement("a");
  gamesLink.href = "games.html";
  gamesLink.innerHTML = "Games&nbsp";
  nav.appendChild(gamesLink);

  let contactLink = document.createElement("a");
  contactLink.href = "contact.html";
  contactLink.innerHTML = "Contact";
  nav.appendChild(contactLink);

  header.appendChild(nav);
  document.body.insertBefore(header, document.body.firstChild);
}

LoadHeader();
