$(function () {

  // -----------------------------
  // DSR / Allocation tabs
  // -----------------------------
  $(".module-tab").on("click", function () {
    const tab = $(this).data("tab");

    $(".module-tab").removeClass("active");
    $(this).addClass("active");

    $(".tab-panel").removeClass("active");

    if (tab === "dsr") {
      $("#dsrPanel").addClass("active");
    }

    if (tab === "allocation") {
      $("#allocationPanel").addClass("active");
    }

    $("#dsrFormPanel").removeClass("open");
  });


  // -----------------------------
  // DSR form
  // -----------------------------
  $("#openDsrForm").on("click", function () {
    $("#dsrPanel, #allocationPanel").removeClass("active");
    $("#dsrFormPanel").addClass("open");
  });

  $("#closeDsrForm, #cancelDsr").on("click", function () {
    $("#dsrFormPanel").removeClass("open");
    $("#dsrPanel").addClass("active");
    $(".module-tab").removeClass("active");
    $('.module-tab[data-tab="dsr"]').addClass("active");
  });

  $("#dsrForm").on("submit", function (event) {
    event.preventDefault();
    alert("Demo: DSR submitted successfully.");
  });


  // -----------------------------
  // Refresh
  // -----------------------------
  $("#refreshBtn").on("click", function () {
    const $button = $(this);
    const original = $button.html();

    $button.html('<i class="bi bi-arrow-repeat"></i> Refreshing...');
    $button.prop("disabled", true);

    setTimeout(function () {
      $button.html(original);
      $button.prop("disabled", false);
    }, 700);
  });

  // -----------------------------
  // Demo filter
  // -----------------------------
  $("#filterBtn").on("click", function () {
    alert("Demo: Filter panel can be connected here.");
  });

});