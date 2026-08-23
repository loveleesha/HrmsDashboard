$(function () {
  $(".birthday-action").on("click", function () {
    const $button = $(this);
    $button.html('<i class="bi bi-check2"></i>');
    $button.addClass("sent");
    $button.attr("title", "Birthday wishes sent");
  });
});