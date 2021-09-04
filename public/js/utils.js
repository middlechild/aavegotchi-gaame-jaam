async function removeGotchiBackground(svgData, containerId="gotchi-cleaner") {
    var doc = new DOMParser().parseFromString(svgData, "text/xml");
    var container = document.getElementById(containerId)
    container.appendChild(doc.firstChild);
    var imageBgnd = document.getElementsByClassName("gotchi-bg")[0];
    imageBgnd.remove();

    return container.querySelector("svg").outerHTML;
}