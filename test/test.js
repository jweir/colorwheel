function run_tests(){

  function input_example(){
    var cw = Raphael.colorwheel($("#test .colorwheel")[0],150);
    cw.input($("#test input")[0]);
    return cw;
  }

  module("Color Wheel");

  var input = $("#test input");
  var cw = input_example();

  test("setting the color value updates the picker and the input", function(){
    cw.color("#FF0000");
    equals("#ff0000", cw.color().hex, "the color value is set");
    equals("#ff0000", input.val(), "input is set");
  });
}

$(run_tests);
