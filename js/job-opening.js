$(function () {

  // Job filtering
  function filterJobs() {
    const query = $("#jobSearch").val().toLowerCase().trim();
    const department = $("#departmentFilter").val();
    const location = $("#locationFilter").val();

    let visible = 0;

    $(".job-card").each(function () {
      const $job = $(this);

      const title = String($job.data("title")).toLowerCase();
      const jobDepartment = String($job.data("department"));
      const jobLocation = String($job.data("location"));
      const cardText = $job.text().toLowerCase();

      const matchesSearch =
        !query ||
        title.includes(query) ||
        cardText.includes(query);

      const matchesDepartment =
        !department || jobDepartment === department;

      const matchesLocation =
        !location || jobLocation === location;

      const show = matchesSearch && matchesDepartment && matchesLocation;

      $job.toggle(show);

      if (show) visible++;
    });

    $("#jobCount").text(visible);

    if (visible === 0) {
      $("#emptyState").addClass("show");
    } else {
      $("#emptyState").removeClass("show");
    }
  }

  $("#jobSearch, #departmentFilter, #locationFilter").on("input change", filterJobs);


  // Clear filters
  function clearFilters() {
    $("#jobSearch").val("");
    $("#departmentFilter").val("");
    $("#locationFilter").val("");
    filterJobs();
  }

  $("#clearFilters, #emptyClear").on("click", clearFilters);

  $("#filterBtn").on("click", function () {
    $("#jobSearch").trigger("focus");
  });


  // Sort jobs
  $("#sortJobs").on("change", function () {
    const value = $(this).val();
    const $grid = $("#jobGrid");
    const $cards = $grid.children(".job-card").get();

    $cards.sort(function (a, b) {
      if (value === "az") {
        return String($(a).data("title")).localeCompare(String($(b).data("title")));
      }

      return Number($(a).data("order")) - Number($(b).data("order"));
    });

    $.each($cards, function (_, card) {
      $grid.append(card);
    });
  });


  // Refresh
  $("#refreshBtn").on("click", function () {
    const $button = $(this);
    const original = $button.html();

    $button
      .html('<i class="bi bi-arrow-repeat"></i> Refreshing...')
      .prop("disabled", true);

    setTimeout(function () {
      clearFilters();
      $button.html(original).prop("disabled", false);
    }, 600);
  });


  // Job detail modal
  $(document).on("click", ".apply-btn", function () {
    const $card = $(this).closest(".job-card");

    const title = $card.data("title");
    const department = $card.data("department");
    const location = $card.data("location");

    let experience = "2 - 5 Years";
    const description = $card.find(".job-description").text().trim();

    $card.find(".job-meta span").each(function () {
      const text = $(this).text().trim();

      if (text.includes("Years")) {
        experience = text.replace(/.*?(\d.*Years)/, "$1");
      }
    });

    $("#modalTitle").text(title);
    $("#modalDepartment").text(department);
    $("#modalLocation").text(location);
    $("#modalExperience").text(experience);
    $("#modalDescription").text(description);

    $("#jobModal").addClass("show");
    $("body").css("overflow", "hidden");
  });

  function closeModal() {
    $("#jobModal").removeClass("show");
    $("body").css("overflow", "");
  }

  $("#closeJobModal, #modalCloseBtn").on("click", closeModal);

  $("#jobModal").on("click", function (event) {
    if (event.target === this) {
      closeModal();
    }
  });

  $(document).on("keydown", function (event) {
    if (event.key === "Escape") {
      closeModal();
    }
  });

  $("#applyNowBtn").on("click", function () {
    alert("Demo: Application form can be connected here.");
  });

});