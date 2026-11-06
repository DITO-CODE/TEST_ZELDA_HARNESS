(function () {
  "use strict";

  var STORAGE_FOUND = "totk.wells.found.v1";
  var STORAGE_VIEW = "totk.wells.view.v1";

  var WELLS = (window.TOTK_WELLS || []).slice().sort(function (a, b) {
    return a.id.localeCompare(b.id);
  });
  var TOTAL = WELLS.length;

  var WELL_BY_ID = {};
  WELLS.forEach(function (well) {
    WELL_BY_ID[well.id] = well;
  });

  var DROP_SVG = '<svg class="icon-drop" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6c3.6 4.5 6 7.7 6 11a6 6 0 0 1-12 0c0-3.3 2.4-6.5 6-11Z" fill="currentColor"/></svg>';
  var CHECK_SVG = '<svg class="icon-check" viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var LIST_CHECK_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12.5 4.3 4.3L19 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  var MAP_BOUNDS = L.latLngBounds([-5000, -6000], [5000, 6000]);
  var MAP_WIDTH = 12000;
  var MAP_HEIGHT = 10000;
  var MAP_MIN_ZOOM = -4;
  var MAP_MAX_ZOOM = 1;

  var foundIds = loadFound();
  var activeFilter = "all";
  var searchTerm = "";
  var selectedId = null;
  var toastTimer = null;
  var viewTimer = null;
  var lastFocused = null;
  var map = null;
  var markers = {};
  var clusterGroup = null;

  var pendingIcon = L.divIcon({
    className: "well-marker",
    html: '<span class="well-marker__pin">' + DROP_SVG + CHECK_SVG + "</span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -16]
  });

  var foundIcon = L.divIcon({
    className: "well-marker is-found",
    html: '<span class="well-marker__pin">' + DROP_SVG + CHECK_SVG + "</span>",
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
    tooltipAnchor: [0, -16]
  });

  function loadFound() {
    try {
      var raw = JSON.parse(localStorage.getItem(STORAGE_FOUND) || "[]");
      var valid = {};
      WELLS.forEach(function (well) {
        valid[well.id] = true;
      });
      return new Set((Array.isArray(raw) ? raw : []).filter(function (id) {
        return valid[id];
      }));
    } catch (error) {
      return new Set();
    }
  }

  function saveFound() {
    try {
      localStorage.setItem(STORAGE_FOUND, JSON.stringify(Array.from(foundIds)));
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
    if (count === 0) {
      return "Aún no has marcado ningún pozo.";
    }
    if (count >= TOTAL) {
      return "¡Completado! Has encontrado todos los pozos de Hyrule.";
    }
    var remaining = TOTAL - count;
    if (remaining === 1) {
      return "Solo queda 1 pozo por encontrar.";
    }
    return "Te quedan " + remaining + " pozos por encontrar.";
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
    clusterGroup = L.markerClusterGroup({
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

    WELLS.forEach(function (well) {
      var isFound = foundIds.has(well.id);
      var marker = L.marker([well.x, well.y], {
        icon: isFound ? foundIcon : pendingIcon,
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
        return popupHtml(well);
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

      markers[well.id] = marker;
      clusterGroup.addLayer(marker);
    });

    map.addLayer(clusterGroup);
  }

  function popupHtml(well) {
    var isFound = foundIds.has(well.id);
    return "" +
      '<div class="well-popup">' +
        '<div class="well-popup__head">' +
          '<p class="well-popup__eyebrow">Pozo ' + escapeHtml(well.id) + "</p>" +
          "<h3>" + escapeHtml(well.name) + "</h3>" +
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
    var html = WELLS.map(function (well, index) {
      var isFound = foundIds.has(well.id);
      var ordinal = String(index + 1).padStart(2, "0");
      return "" +
        '<li class="well-item' + (isFound ? " is-found" : "") + '" data-id="' + escapeHtml(well.id) + '">' +
          '<button type="button" class="well-item__btn" aria-label="' + escapeHtml(well.name + " — " + (isFound ? "encontrado" : "pendiente")) + '" data-focus-well="' + escapeHtml(well.id) + '">' +
            '<span class="well-item__badge">' + ordinal + "</span>" +
            '<span class="well-item__body">' +
              '<span class="well-item__name">' + escapeHtml(well.name) + "</span>" +
              '<span class="well-item__meta">X ' + formatCoord(well.y) + " · Y " + formatCoord(well.x) + "</span>" +
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
      var well = WELL_BY_ID[id];
      var isFound = foundIds.has(id);
      var matchesFilter = activeFilter === "all" ||
        (activeFilter === "found" && isFound) ||
        (activeFilter === "pending" && !isFound);
      var matchesSearch = !term || normalize(well.name + " " + id).indexOf(term) !== -1;
      var show = matchesFilter && matchesSearch;
      this.classList.toggle("is-hidden", !show);
      if (show) {
        visible += 1;
      }
    });

    $("#visibleCount").text(visible + (visible === 1 ? " pozo" : " pozos"));
    $("#emptyState").prop("hidden", visible !== 0);
  }

  function updateStats() {
    var count = foundIds.size;
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
      ? "Pozos de Hyrule · Tears of the Kingdom"
      : count + "/" + TOTAL + " pozos · Tears of the Kingdom";
  }

  function updateListState(id) {
    var isFound = foundIds.has(id);
    var well = WELL_BY_ID[id];
    var $item = $('.well-item[data-id="' + id + '"]');
    $item.toggleClass("is-found", isFound);
    $item.find(".well-item__btn").attr("aria-label", well.name + " — " + (isFound ? "encontrado" : "pendiente"));
  }

  function setSelected(id, scroll) {
    if (!WELL_BY_ID[id]) {
      return;
    }

    if (selectedId && selectedId !== id) {
      removeSelectedClass(selectedId);
    }

    selectedId = id;

    var marker = markers[id];
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
    var marker = markers[id];
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
    var marker = markers[id];
    if (!marker) {
      return;
    }

    var reveal = function () {
      setSelected(id, true);
      marker.openPopup();
    };

    var visibleParent = clusterGroup.getVisibleParent(marker);
    if (visibleParent && visibleParent !== marker) {
      clusterGroup.zoomToShowLayer(marker, reveal);
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
    var well = WELL_BY_ID[id];
    var marker = markers[id];
    if (!well || !marker) {
      return;
    }

    var wasFound = foundIds.has(id);
    var nowFound = !wasFound;

    if (nowFound) {
      foundIds.add(id);
    } else {
      foundIds.delete(id);
    }
    saveFound();

    marker.options.wellFound = nowFound;
    marker.setIcon(nowFound ? foundIcon : pendingIcon);
    marker.setPopupContent(popupHtml(well));
    clusterGroup.refreshClusters(marker);

    if (selectedId === id) {
      var el = marker.getElement();
      if (el) {
        L.DomUtil.addClass(el, "is-selected");
      }
    }

    updateListState(id);
    updateStats();
    appliedFilters();

    if (nowFound && foundIds.size === TOTAL) {
      showToast("¡Has encontrado los " + TOTAL + " pozos de Hyrule!", "complete", 5200);
    } else {
      showToast(
        nowFound ? "Encontrado: " + well.name : "Marcado como pendiente: " + well.name,
        nowFound ? "found" : "pending",
        2100
      );
    }
  }

  function resetProgress() {
    foundIds.clear();
    saveFound();

    WELLS.forEach(function (well) {
      var marker = markers[well.id];
      if (!marker) {
        return;
      }
      marker.options.wellFound = false;
      marker.setIcon(pendingIcon);
      marker.setPopupContent(popupHtml(well));
    });

    clusterGroup.refreshClusters();
    WELLS.forEach(function (well) {
      updateListState(well.id);
    });
    updateStats();
    appliedFilters();
    closeResetModal();
    showToast("Progreso reiniciado. Los " + TOTAL + " pozos vuelven a estar pendientes.", "pending", 2800);
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
      var marker = markers[id];
      if (marker) {
        map.flyTo(marker.getLatLng(), Math.max(map.getZoom(), 0.25), { duration: 0.5 });
        marker.openPopup();
      }
    });

    $("#searchInput").on("input search", function () {
      searchTerm = normalize(this.value.trim());
      appliedFilters();
    });

    $(".filters").on("click", ".filter", function () {
      activeFilter = this.getAttribute("data-filter");
      $(".filter").removeClass("is-active").attr("aria-pressed", "false");
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
        if (selectedId) {
          markers[selectedId].closePopup();
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
    if (!TOTAL) {
      $("#progressMessage").text("No se pudieron cargar los datos de los pozos.");
      return;
    }

    initMap();
    initMarkers();
    renderList();
    bindEvents();
    updateStats();
    appliedFilters();
  }

  $(start);
})();
