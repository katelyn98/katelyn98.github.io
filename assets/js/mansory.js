$(document).ready(function() {
  // Init Masonry
  var $grid = $('.grid').not('.grid-static');
  if (!$grid.length) {
    return;
  }

  $grid.masonry({
    gutter: 10,
    horizontalOrder: true,
    itemSelector: '.grid-item',
  });
  // Layout Masonry after each image loads
  $grid.imagesLoaded().progress( function() {
    $grid.masonry('layout');
  });
});
