function LoadHeader()
{
    let header = document.createElement("header");
    let nav = document.createElement("nav");
    nav.className = "TopNav";
    let homeLink = document.createElement("a");
    homeLink.href = "index.html";
    homeLink.innerHTML = "Home&nbsp";
    let gamesLink = document.createElement("a");
    gamesLink.href = "games.html";
    gamesLink.innerHTML = "Games&nbsp";
    let contactLink = document.createElement("a");
    contactLink.href = "contact.html";
    contactLink.innerHTML = "Contact";


    nav.appendChild(homeLink);
    nav.appendChild(gamesLink);
    nav.appendChild(contactLink);

    header.appendChild(nav);

    document.body.insertBefore(header, document.body.firstChild);
}

LoadHeader();