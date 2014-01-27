(function(window, $, undefined){
  $(".definition").toggle();
  $(".confirm").toggle();

  $(".reveal").click(function(){
    $(".term").toggle();
    $(".definition").toggle();

    $(".confirm").toggle();
    $(this).toggle();
  });
  
 })(window, jQuery);