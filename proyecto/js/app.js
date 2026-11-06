(function () {
  "use strict";

  var STORAGE_VIEW = "totk.wells.view.v1";

  var DROP_SVG = '<svg class="icon-drop" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6c3.6 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.4-6.5 6-11Z" fill="currentColor"/></svg>';
  var CHECK_SVG = '<svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LIST_CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var OUTFIT_SVG = '<svg class="icon-drop" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 3.4 12 5.4l3.4-2 4.8 3.2-2.1 4.1-2-1.1v10.9H7.9V9.6l-2 1.1-2.1-4.1Z" fill="currentColor"/></svg>';
  var SLOT_LABELS = { head: "Cabeza", body: "Torso", legs: "Piernas" };

  var MAP_BOUNDS = L.latLngBounds([-5000, -6000], [5000, 6000]);
  var MAP_WIDTH = 12000;
  var MAP_HEIGHT = 10000;
  var MAP_MIN_ZOOM = -4;
  var MAP_MAX_ZOOM = 1;

  var CATEGORIES = {
    wells: makeCategory({
      key: "wells",
      label: "Pozos",
      singular: "pozo",
      plural: "pozos",
      storage: "totk.wells.found.v1",
      glyph: DROP_SVG,
      markerClass: "well-marker",
      items: window.TOTK_WELLS
    }),
    outfits: makeCategory({
      key: "outfits",
      label: "Atuendos",
      singular: "atuendo",
      plural: "atuendos",
      storage: "totk.outfits.found.v1",
      glyph: OUTFIT_SVG,
      markerClass: "well-marker well-marker--outfit",
      items: (Array.isArray(window.TOTK_OUTFITS) ? window.TOTK_OUTFITS : []).filter(function (item) {
        return item && item.layer === "surface";
      })
    })
  };
  var active = CATEGORIES.wells;

  var activeFilter = "all";
  var searchTerm = "";
  var selectedId = null;
  var toastTimer = null;
  var viewTimer = null;
  var lastFocused = null;
  var map = null;

  function markerIcon(def, isFound) {
    return L.divIcon({
      className: def.markerClass + (isFound ? " is-found" : ""),
      html: '<span class="well-marker__pin">' + def.glyph + CHECK_SVG + "</span>",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      popupAnchor: [0, -16],
      tooltipAnchor: [0, -16]
    });
  }

  function makeCategory(def) {
    var items = (Array.isArray(def.items) ? def.items : []).filter(function (item) {
      return item && typeof item.id === "string" && typeof item.name === "string";
    }).sort(function (a, b) {
      return a.id.localeCompare(b.id);
    });
    var byId = {};
    items.forEach(function (item) {
      byId[item.id] = item;
    });
    def.items = items;
    def.byId = byId;
    def.total = items.length;
    def.found = loadFound(def.storage, byId);
    def.markers = {};
    def.cluster = null;
    def.pendingIcon = markerIcon(def, false);
    def.foundIcon = markerIcon(def, true);
    return def;
  }

  function loadFound(storageKey, byId) {
    try {
      var raw = JSON.parse(localStorage.getItem(storageKey) || "[]");
      return new Set((Array.isArray(raw) ? raw : []).filter(function (id) {
        return typeof id === "string" && byId.hasOwnProperty(id);
      }));
    } catch (error) {
      return new Set();
    }
  }

  function saveFound() {
    try {
      localStorage.setItem(active.storage, JSON.stringify(Array.from(active.found)));
    } catch (error) {
      return;
    }
  }

  function loadView() {
    try {
      var view = JSON.parse(localStorage.getItem(STORAGE_VIEW) || "null");
      if (!view || typeof view.lat !== "number" || typeof view.lng !== "number" || typeof view.zoom !== "number") {
        return null;
      }
      if (!isFinite(view.lat) || !isFinite(view.lng) || !isFinite(view.zoom)) {
        return null;
      }
      if (view.zoom < MAP_MIN_ZOOM || view.zoom > MAP_MAX_ZOOM) {
        return null;
      }
      if (!MAP_BOUNDS.contains([view.lat, view.lng])) {
        return null;
      }
      return view;
    } catch (error) {
      return null;
    }
  }

  function saveView() {
    if (!map) {
      return;
    }
    try {
      var center = map.getCenter();
      localStorage.setItem(STORAGE_VIEW, JSON.stringify({
        lat: center.lat,
        lng: center.lng,
        zoom: map.getZoom()
      }));
    } catch (error) {
      return;
    }
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalize(value) {
    return String(value)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  }

  function formatCoord(value) {
    return Math.round(value).toLocaleString("es-ES");
  }

  function progressMessage(count) {
    if (active.total === 0) {
      return "No se pudieron cargar los datos de los " + active.plural + ".";
    }
    if (count === 0) {
      return "Aún no has marcado ningún " + active.singular + ".";
    }
    if (count >= active.total) {
      return "¡Completado! Has encontrado todos los " + active.plural + " de Hyrule.";
    }
    var remaining = active.total - count;
    if (remaining === 1) {
      return "Solo queda 1 " + active.singular + " por encontrar.";
    }
    return "Te quedan " + remaining + " " + active.plural + " por encontrar.";
  }

  function capitalize(value) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  function itemDetail(item) {
    var parts = [];
    if (SLOT_LABELS[item.slot]) {
      parts.push(SLOT_LABELS[item.slot]);
    }
    if (item.set) {
      parts.push(item.set);
    }
    return parts.join(" · ");
  }

  function initMap() {
    map = L.map("map", {
      crs: L.CRS.Simple,
      minZoom: MAP_MIN_ZOOM,
      maxZoom: MAP_MAX_ZOOM,
      zoomSnap: 0.05,
      zoomDelta: 0.5,
      wheelPxPerZoomLevel: 110,
      maxBounds: MAP_BOUNDS.pad(0.04),
      maxBoundsViscosity: 0.75,
      zoomControl: false,
      preferCanvas: true,
      attributionControl: true
    });

    var overlay = L.imageOverlay("assets/img/surface.jpg", MAP_BOUNDS, {
      attribution: "Mapa: Nintendo · ZeldaMods",
      className: "hyrule-surface"
    }).addTo(map);

    L.control.zoom({
      position: "bottomright",
      zoomInTitle: "Acercar",
      zoomOutTitle: "Alejar"
    }).addTo(map);

    map.attributionControl.setPrefix('<a href="https://leafletjs.com" target="_blank" rel="noopener">Leaflet</a>');

    var savedView = loadView();
    if (savedView) {
      map.setView([savedView.lat, savedView.lng], savedView.zoom);
    } else if (window.matchMedia("(max-width: 980px)").matches) {
      var size = map.getSize();
      var coverZoom = Math.max(
        Math.log(size.x / MAP_WIDTH) / Math.LN2,
        Math.log(size.y / MAP_HEIGHT) / Math.LN2
      );
      map.setView(MAP_BOUNDS.getCenter(), coverZoom);
    } else {
      map.fitBounds(MAP_BOUNDS, { padding: [16, 16] });
    }

    map.on("moveend", function () {
      clearTimeout(viewTimer);
      viewTimer = setTimeout(saveView, 220);
    });

    map.on("click", clearSelection);

    var loaderTimer = null;
    function hideLoader() {
      var loader = document.getElementById("mapLoader");
      if (!loader || loader.classList.contains("is-hidden")) {
        return;
      }
      clearTimeout(loaderTimer);
      loader.classList.add("is-hidden");
      setTimeout(function () {
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }, 500);
    }

    overlay.on("load", hideLoader);
    var overlayImage = overlay.getElement();
    if (overlayImage && overlayImage.complete && overlayImage.naturalWidth > 0) {
      hideLoader();
    }
    loaderTimer = setTimeout(hideLoader, 5000);
  }

  function initMarkers() {
    Object.keys(CATEGORIES).forEach(function (key) {
      initCategoryMarkers(CATEGORIES[key]);
    });
    map.addLayer(active.cluster);
  }

  function initCategoryMarkers(cat) {
    var clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      removeOutsideVisibleBounds: true,
      maxClusterRadius: 46,
      disableClusteringAtZoom: 0,
      animate: false,
      iconCreateFunction: function (cluster) {
        var children = cluster.getAllChildMarkers();
        var found = children.filter(function (marker) {
          return marker.options.wellFound;
        }).length;
        var state = found === 0 ? "pending" : found === children.length ? "all-found" : "mixed";
        return L.divIcon({
          className: "well-cluster well-cluster--" + state,
          html: '<span class="well-cluster__badge">' + children.length + "</span>",
          iconSize: [42, 42]
        });
      }
    });

    cat.items.forEach(function (well) {
      var isFound = cat.found.has(well.id);
      var marker = L.marker([well.x, well.y], {
        icon: isFound ? cat.foundIcon : cat.pendingIcon,
        title: well.name,
        keyboard: false,
        riseOnHover: true,
        wellId: well.id,
        wellFound: isFound
      });

      marker.bindTooltip(well.name, {
        direction: "top",
        className: "well-tooltip",
        opacity: 1
      });

      marker.bindPopup(function () {
        return popupHtml(cat, well);
      }, {
        maxWidth: 290,
        minWidth: 254,
        closeButton: true,
        autoPanPadding: [34, 70]
      });

      marker.on("click", function () {
        setSelected(well.id, false);
      });

      marker.on("popupclose", function () {
        if (selectedId === well.id) {
          clearSelection();
        }
      });

      cat.markers[well.id] = marker;
      clusterGroup.addLayer(marker);
    });

    cat.cluster = clusterGroup;
  }

  function popupHtml(cat, well) {
    var isFound = cat.found.has(well.id);
    var detail = itemDetail(well);
    return "" +
      '<div class="well-popup">' +
        '<div class="well-popup__head">' +
          '<p class="well-popup__eyebrow">' + escapeHtml(capitalize(cat.singular)) + " " + escapeHtml(well.id) + "</p>" +
          "<h3>" + escapeHtml(well.name) + "</h3>" +
          (detail ? '<p class="well-popup__coords">' + escapeHtml(detail) + "</p>" : "") +
          '<p class="well-popup__coords">X ' + formatCoord(well.y) + " · Y " + formatCoord(well.x) + " · Z " + formatCoord(well.z) + "</p>" +
        "</div>" +
        '<span class="well-popup__status' + (isFound ? " is-found" : "") + '"><i></i>' + (isFound ? "Encontrado" : "Pendiente") + "</span>" +
        '<div class="well-popup__actions">' +
          '<button type="button" class="popup-btn popup-btn--primary' + (isFound ? " is-found" : "") + '" data-toggle-well="' + escapeHtml(well.id) + '">' +
            (isFound ? "Desmarcar" : "Marcar encontrado") +
          "</button>" +
          '<button type="button" class="popup-btn popup-btn--ghost" data-center-well="' + escapeHtml(well.id) + '">Centrar</button>' +
        "</div>" +
      "</div>";
  }

  function renderList() {
    var html = active.items.map(function (well, index) {
      var isFound = active.found.has(well.id);
      var ordinal = String(index + 1).padStart(2, "0");
      var detail = itemDetail(well);
      return "" +
        '<li class="well-item' + (isFound ? " is-found" : "") + '" data-id="' + escapeHtml(well.id) + '">' +
          '<button type="button" class="well-item__btn" aria-label="' + escapeHtml(well.name + " — " + (isFound ? "encontrado" : "pendiente")) + '" data-focus-well="' + escapeHtml(well.id) + '">' +
            '<span class="well-item__badge">' + ordinal + "</span>" +
            '<span class="well-item__body">' +
              '<span class="well-item__name">' + escapeHtml(well.name) + "</span>" +
              '<span class="well-item__meta">' + (detail ? escapeHtml(detail) + " · " : "") + "X " + formatCoord(well.y) + " · Y " + formatCoord(well.x) + "</span>" +
            "</span>" +
            '<span class="well-item__status" aria-hidden="true">' + LIST_CHECK_SVG + "</span>" +
          "</button>" +
        "</li>";
    }).join("");

    $("#wellList").html(html);
  }

  function appliedFilters() {
    var term = searchTerm;
    var visible = 0;

    $(".well-item").each(function () {
      var id = this.getAttribute("data-id");
      var well = active.byId[id];
      var isFound = active.found.has(id);
      var matchesFilter = activeFilter === "all" ||
        (activeFilter === "found" && isFound) ||
        (activeFilter === "pending" && !isFound);
      var matchesSearch = !term || normalize(well.name + " " + id + " " + itemDetail(well)).indexOf(term) !== -1;
      var show = matchesFilter && matchesSearch;
      this.classList.toggle("is-hidden", !show);
      if (show) {
        visible += 1;
      }
    });

    $("#visibleCount").text(visible + " " + (visible === 1 ? active.singular : active.plural));
    $("#emptyState").prop("hidden", visible !== 0);
  }

  function applyCategoryTexts() {
    $("#brandTitle").text(active.label + " de Hyrule");
    $("#listTitle").text(active.label);
    $("#hudLabel").text(active.label);
    $("#resetScope").text("Todos los " + active.plural);
    $("#searchInput").attr("placeholder", "Buscar " + active.singular + " por nombre...");
    $(".category-switch [data-category]").each(function () {
      var isActive = this.getAttribute("data-category") === active.key;
      this.classList.toggle("is-active", isActive);
      this.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }

  function updateStats() {
    var TOTAL = active.total;
    var count = active.found.size;
    var percent = TOTAL ? (count / TOTAL) * 100 : 0;

    $("#foundCount").text(count);
    $("#hudFound").text(count);
    $("#totalCount").text("/ " + TOTAL);
    $("#chipAll").text(TOTAL);
    $("#chipPending").text(TOTAL - count);
    $("#chipFound").text(count);
    $("#progressFill").css("width", percent + "%");
    $("#progressBar").attr("aria-valuenow", count).attr("aria-valuemax", TOTAL);
    $("#progressMessage").text(progressMessage(count));
    $("#hudTotal").text(TOTAL);

    document.body.classList.toggle("all-found", count === TOTAL && TOTAL > 0);
    document.title = count === 0
      ? active.label + " de Hyrule · Tears of the Kingdom"
      : count + "/" + TOTAL + " " + active.plural + " · Tears of the Kingdom";
  }

  function updateListState(id) {
    var isFound = active.found.has(id);
    var well = active.byId[id];
    var $item = $('.well-item[data-id="' + id + '"]');
    $item.toggleClass("is-found", isFound);
    $item.find(".well-item__btn").attr("aria-label", well.name + " — " + (isFound ? "encontrado" : "pendiente"));
  }

  function setSelected(id, scroll) {
    if (!active.byId[id]) {
      return;
    }

    if (selectedId && selectedId !== id) {
      removeSelectedClass(selectedId);
    }

    selectedId = id;

    var marker = active.markers[id];
    var el = marker ? marker.getElement() : null;
    if (el) {
      L.DomUtil.addClass(el, "is-selected");
    }
    if (marker) {
      marker.setZIndexOffset(1000);
    }

    $(".well-item").removeClass("is-selected");
    var $item = $('.well-item[data-id="' + id + '"]').addClass("is-selected");
    if (scroll && $item.length) {
      var node = $item.get(0);
      node.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  function removeSelectedClass(id) {
    var marker = active.markers[id];
    var el = marker ? marker.getElement() : null;
    if (el) {
      L.DomUtil.removeClass(el, "is-selected");
    }
    if (marker) {
      marker.setZIndexOffset(0);
    }
    $('.well-item[data-id="' + id + '"]').removeClass("is-selected");
  }

  function clearSelection() {
    if (!selectedId) {
      return;
    }
    removeSelectedClass(selectedId);
    selectedId = null;
  }

  function focusWell(id) {
    var marker = active.markers[id];
    if (!marker) {
      return;
    }

    var reveal = function () {
      setSelected(id, true);
      marker.openPopup();
    };

    var visibleParent = active.cluster.getVisibleParent(marker);
    if (visibleParent !== marker) {
      active.cluster.zoomToShowLayer(marker, reveal);
      return;
    }

    var targetZoom = Math.max(map.getZoom(), 0);
    if (map.getZoom() < targetZoom - 0.01) {
      map.flyTo(marker.getLatLng(), targetZoom, { duration: 0.55 });
      map.once("moveend", reveal);
    } else {
      marker.openPopup();
      reveal();
    }
  }

  function toggleWell(id) {
    var well = active.byId[id];
    var marker = active.markers[id];
    if (!well || !marker) {
      return;
    }

    var TOTAL = active.total;
    var wasFound = active.found.has(id);
    var nowFound = !wasFound;

    if (nowFound) {
      active.found.add(id);
    } else {
      active.found.delete(id);
    }
    saveFound();

    marker.options.wellFound = nowFound;
    marker.setIcon(nowFound ? active.foundIcon : active.pendingIcon);
    marker.setPopupContent(popupHtml(active, well));
    active.cluster.refreshClusters(marker);

    if (selectedId === id) {
      var el = marker.getElement();
      if (el) {
        L.DomUtil.addClass(el, "is-selected");
      }
    }

    updateListState(id);
    updateStats();
    appliedFilters();

    if (nowFound && active.found.size === TOTAL) {
      showToast("¡Has encontrado los " + TOTAL + " " + active.plural + " de Hyrule!", "complete", 5200);
    } else {
      showToast(
        nowFound ? "Encontrado: " + well.name : "Marcado como pendiente: " + well.name,
        nowFound ? "found" : "pending",
        2100
      );
    }
  }

  function resetProgress() {
    active.found.clear();
    saveFound();

    active.items.forEach(function (well) {
      var marker = active.markers[well.id];
      if (!marker) {
        return;
      }
      marker.options.wellFound = false;
      marker.setIcon(active.pendingIcon);
      marker.setPopupContent(popupHtml(active, well));
    });

    active.cluster.refreshClusters();
    active.items.forEach(function (well) {
      updateListState(well.id);
    });
    updateStats();
    appliedFilters();
    closeResetModal();
    showToast("Progreso reiniciado. Los " + active.total + " " + active.plural + " vuelven a estar pendientes.", "pending", 2800);
  }

  function setCategory(key) {
    var next = CATEGORIES[key];
    if (!next || next === active) {
      return;
    }
    if (map) {
      map.closePopup();
    }
    clearSelection();
    if (map && active.cluster) {
      map.removeLayer(active.cluster);
    }
    active = next;
    if (map && active.cluster) {
      map.addLayer(active.cluster);
    }
    renderList();
    applyCategoryTexts();
    updateStats();
    appliedFilters();
  }

  function showToast(message, variant, duration) {
    var $toast = $("#toast");
    $toast
      .removeClass("toast--found toast--pending toast--complete")
      .addClass("toast--" + (variant || "found"))
      .text(message);

    clearTimeout(toastTimer);
    requestAnimationFrame(function () {
      $toast.addClass("is-visible");
    });

    toastTimer = setTimeout(function () {
      $toast.removeClass("is-visible");
    }, duration || 2200);
  }

  function openSidebar() {
    $("#sidebar").addClass("is-open");
    $("#backdrop").prop("hidden", false);
    $("body").addClass("drawer-open");
  }

  function closeSidebar() {
    $("#sidebar").removeClass("is-open");
    $("#backdrop").prop("hidden", true);
    $("body").removeClass("drawer-open");
  }

  function openResetModal() {
    lastFocused = document.activeElement;
    var modal = document.getElementById("resetModal");
    modal.hidden = false;
    requestAnimationFrame(function () {
      modal.classList.add("is-open");
      $("#confirmReset").trigger("focus");
    });
  }

  function closeResetModal() {
    var modal = document.getElementById("resetModal");
    if (modal.hidden) {
      return;
    }
    modal.classList.remove("is-open");
    setTimeout(function () {
      modal.hidden = true;
      if (lastFocused && typeof lastFocused.focus === "function") {
        lastFocused.focus();
      }
    }, 200);
  }

  function bindEvents() {
    $(document).on("click", "[data-focus-well]", function () {
      var id = this.getAttribute("data-focus-well");
      focusWell(id);
      if (window.matchMedia("(max-width: 980px)").matches) {
        closeSidebar();
      }
    });

    $(document).on("click", "[data-toggle-well]", function () {
      toggleWell(this.getAttribute("data-toggle-well"));
    });

    $(document).on("click", "[data-center-well]", function () {
      var id = this.getAttribute("data-center-well");
      var marker = active.markers[id];
      if (marker) {
        map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 0.25), { duration: 0.5 });
        marker.openPopup();
      }
    });

    $("#searchInput").on("input search", function () {
      searchTerm = normalize(this.value.trim());
      appliedFilters();
    });

    $(".category-switch").on("click", "[data-category]", function () {
      setCategory(this.getAttribute("data-category"));
    });

    $(".filters").on("click", ".filter", function () {
      activeFilter = this.getAttribute("data-filter");
      $(".filters .filter").removeClass("is-active").attr("aria-pressed", "false");
      $(this).addClass("is-active").attr("aria-pressed", "true");
      appliedFilters();
    });

    $("#resetBtn").on("click", openResetModal);
    $("#confirmReset").on("click", resetProgress);
    $("[data-close-modal]").on("click", closeResetModal);
    $("#resetModal").on("click", function (event) {
      if (event.target === this) {
        closeResetModal();
      }
    });
    $("#resetModal").on("keydown", function (event) {
      if (event.key !== "Tab") {
        return;
      }
      var buttons = this.querySelectorAll("button");
      if (!buttons.length) {
        return;
      }
      var first = buttons[0];
      var last = buttons[buttons.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });

    $("#openSidebar").on("click", openSidebar);
    $("#closeSidebar").on("click", closeSidebar);
    $("#backdrop").on("click", closeSidebar);

    $(document).on("keydown", function (event) {
      if (event.key === "Escape") {
        if (!document.getElementById("resetModal").hidden) {
          closeResetModal();
          return;
        }
        if ($("#sidebar").hasClass("is-open")) {
          closeSidebar();
          return;
        }
        if ($("#searchInput").is(":focus")) {
          $("#searchInput").val("");
          searchTerm = "";
          appliedFilters();
          return;
        }
        if (selectedId && active.markers[selectedId]) {
          active.markers[selectedId].closePopup();
          clearSelection();
        }
        return;
      }

      if (event.key === "/" && !$(event.target).is("input, textarea, select")) {
        event.preventDefault();
        $("#searchInput").trigger("focus");
      }
    });

    var resizeTimer = null;
    $(window).on("resize", function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 980) {
          closeSidebar();
        }
        if (map) {
          map.invalidateSize();
        }
      }, 160);
    });
  }

  function start() {
    initMap();
    initMarkers();
    renderList();
    bindEvents();
    applyCategoryTexts();
    updateStats();
    appliedFilters();
  }

  $(start);
})();
