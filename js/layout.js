/* =========================================================
   HRMS COMMON LAYOUT JS

   Common shell only:
   - Sidebar collapse
   - Mobile sidebar
   - Active navigation
   - Sidebar navigation
   - Responsive cleanup

   No HTML components / partials
========================================================= */

(function ($) {
  "use strict";

  const STORAGE_KEY = "hrms-sidebar-collapsed";
  const MOBILE_BREAKPOINT = 991;

  /* =========================================================
     HELPERS
  ========================================================= */

  function isMobile() {
    return window.matchMedia(
      `(max-width: ${MOBILE_BREAKPOINT}px)`
    ).matches;
  }

  function getSidebar() {
    return $("#sidebar");
  }

  function getOverlay() {
    let $overlay = $("#sidebarOverlay");

    if (!$overlay.length) {
      $("body").append(
        '<div id="sidebarOverlay" aria-hidden="true"></div>'
      );

      $overlay = $("#sidebarOverlay");
    }

    return $overlay;
  }

  function getMenuButton() {
    return $("#mobileMenu, #menuBtn").first();
  }


  /* =========================================================
     SIDEBAR COLLAPSE BUTTON
  ========================================================= */

  function addCollapseButton() {

    const $sidebar = getSidebar();

    if (
      !$sidebar.length ||
      isMobile() ||
      $sidebar.find("#sidebarCollapse").length
    ) {
      return;
    }

    const $brand = $sidebar
      .find(".brand, .sidebar-brand")
      .first();

    if (!$brand.length) {
      return;
    }

    // $brand.append(`
    //   <button
    //     type="button"
    //     class="sidebar-collapse-btn"
    //     id="sidebarCollapse"
    //     aria-label="Collapse sidebar"
    //     aria-expanded="true"
    //     title="Collapse sidebar"
    //   >
    //     <i class="bi bi-layout-sidebar-inset"></i>
    //   </button>
    // `);
  }


  /* =========================================================
     DESKTOP COLLAPSE
  ========================================================= */

  function setCollapsed(collapsed, persist = true) {

    if (isMobile()) {
      return;
    }

    $("body").toggleClass(
      "sidebar-collapsed",
      collapsed
    );

    const $button = $("#sidebarCollapse");

    if ($button.length) {

      $button.attr({
        "aria-expanded": String(!collapsed),
        "aria-label": collapsed
          ? "Expand sidebar"
          : "Collapse sidebar",
        "title": collapsed
          ? "Expand sidebar"
          : "Collapse sidebar"
      });

      $button.html(
        collapsed
          ? '<i class="bi bi-layout-sidebar"></i>'
          : '<i class="bi bi-layout-sidebar-inset"></i>'
      );
    }

    if (persist) {
      localStorage.setItem(
        STORAGE_KEY,
        collapsed ? "1" : "0"
      );
    }
  }


  function restoreCollapsedState() {

    if (isMobile()) {

      $("body").removeClass(
        "sidebar-collapsed"
      );

      return;
    }

    const saved =
      localStorage.getItem(STORAGE_KEY);

    setCollapsed(
      saved === "1",
      false
    );
  }


  /* =========================================================
     MOBILE SIDEBAR
  ========================================================= */

  function openMobileSidebar() {

    if (!isMobile()) {
      return;
    }

    const $sidebar = getSidebar();
    const $overlay = getOverlay();

    $sidebar.addClass("open");
    $overlay.addClass("show");

    $("body").addClass(
      "sidebar-open"
    );

    getMenuButton().attr(
      "aria-expanded",
      "true"
    );
  }


  function closeMobileSidebar() {

    getSidebar().removeClass("open");

    $("#sidebarOverlay")
      .removeClass("show");

    $("body").removeClass(
      "sidebar-open"
    );

    getMenuButton().attr(
      "aria-expanded",
      "false"
    );
  }


  function toggleSidebar() {

    if (isMobile()) {

      if (
        getSidebar().hasClass("open")
      ) {
        closeMobileSidebar();
      } else {
        openMobileSidebar();
      }

      return;
    }

    const collapsed =
      !$("body").hasClass(
        "sidebar-collapsed"
      );

    setCollapsed(
      collapsed,
      true
    );
  }


  /* =========================================================
     ACTIVE SIDEBAR NAVIGATION
     
     IMPORTANT:
     We compare only the pathname.
     
     Example:
       myprofile.html
       myprofile.html#personal
       myprofile.html#documents

     All of these keep "My Profile" active.
  ========================================================= */

  function getCurrentPage() {

    let currentPage =
      window.location.pathname
        .split("/")
        .pop()
        .toLowerCase();

    /*
     * If the URL is empty, treat it as dashboard.
     */
    if (!currentPage) {
      currentPage = "dashboard.html";
    }

    return currentPage;
  }


  function setActiveNavigation() {

    const currentPage =
      getCurrentPage();

    const $links =
      $("#sidebar .nav-link-custom");

    $links
      .removeClass("active")
      .removeAttr("aria-current");


    $links.each(function () {

      const $link = $(this);

      let href =
        String(
          $link.attr("href") || ""
        )
          .trim()
          .toLowerCase();


      /*
       * Ignore placeholder links.
       */
      if (
        !href ||
        href === "#" ||
        href.startsWith("javascript:")
      ) {
        return;
      }


      /*
       * Remove query/hash.
       *
       * myprofile.html#documents
       * becomes
       * myprofile.html
       */
      href =
        href
          .split("#")[0]
          .split("?")[0];


      /*
       * Get only filename.
       *
       * /hrms/myprofile.html
       * becomes
       * myprofile.html
       */
      href =
        href
          .split("/")
          .pop();


      if (href === currentPage) {

        $link.addClass("active");

        $link.attr(
          "aria-current",
          "page"
        );
      }

    });


    /*
     * Dashboard fallback.
     *
     * Useful when dashboard link is temporarily "#"
     * on an older page.
     */
    if (
      currentPage === "dashboard.html" &&
      !$links.filter(".active").length
    ) {

      $links
        .filter(function () {

          return $.trim(
            $(this)
              .find("span")
              .text()
          ) === "Dashboard";

        })
        .first()
        .addClass("active")
        .attr(
          "aria-current",
          "page"
        );
    }

  }


  /* =========================================================
     SIDEBAR EVENTS
  ========================================================= */

  function bindCommonEvents() {


    /*
     * Mobile menu
     */
    $(document)
      .off(
        "click.hrmsLayout",
        "#mobileMenu, #menuBtn"
      )
      .on(
        "click.hrmsLayout",
        "#mobileMenu, #menuBtn",
        function (event) {

          event.preventDefault();

          toggleSidebar();

        }
      );


    /*
     * Desktop collapse
     */
    $(document)
      .off(
        "click.hrmsLayout",
        "#sidebarCollapse"
      )
      .on(
        "click.hrmsLayout",
        "#sidebarCollapse",
        function (event) {

          event.preventDefault();

          const collapsed =
            !$("body").hasClass(
              "sidebar-collapsed"
            );

          setCollapsed(
            collapsed,
            true
          );

        }
      );


    /*
     * Mobile overlay
     */
    $(document)
      .off(
        "click.hrmsLayout",
        "#sidebarOverlay"
      )
      .on(
        "click.hrmsLayout",
        "#sidebarOverlay",
        function () {

          closeMobileSidebar();

        }
      );


    /*
     * Navigation click
     */
    $(document)
      .off(
        "click.hrmsLayout",
        "#sidebar .nav-link-custom"
      )
      .on(
        "click.hrmsLayout",
        "#sidebar .nav-link-custom",
        function () {

          /*
           * Immediately update active state.
           * The next page will also calculate it again.
           */
          $("#sidebar .nav-link-custom")
            .removeClass("active")
            .removeAttr("aria-current");

          $(this)
            .addClass("active")
            .attr(
              "aria-current",
              "page"
            );


          /*
           * Close mobile sidebar after navigation.
           */
          if (isMobile()) {
            closeMobileSidebar();
          }

        }
      );


    /*
     * ESC
     */
    $(document)
      .off("keydown.hrmsLayout")
      .on(
        "keydown.hrmsLayout",
        function (event) {

          if (event.key === "Escape") {
            closeMobileSidebar();
          }

        }
      );


    /*
     * Resize
     */
    $(window)
      .off("resize.hrmsLayout")
      .on(
        "resize.hrmsLayout",
        function () {

          if (isMobile()) {

            $("body")
              .removeClass(
                "sidebar-collapsed"
              );

            return;
          }


          closeMobileSidebar();

          addCollapseButton();

          restoreCollapsedState();

        }
      );

  }


  /* =========================================================
     INIT
  ========================================================= */

  function init() {

    if (!getSidebar().length) {
      return;
    }

    addCollapseButton();

    setActiveNavigation();

    restoreCollapsedState();

    bindCommonEvents();

  }


  $(init);

})(jQuery);