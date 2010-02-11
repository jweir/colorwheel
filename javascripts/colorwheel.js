(function(){
  var canvas,
      current_color,
      size,
      bs_square = {},
      hue_ring = {},
      tri_size,
      cursor = {},
      drag_target,
      input_target,
      center,
      parent,
      change_callback,
      offset;

  var padding = 2;
  var sdim; // holds the dimensions for the saturation square

  Raphael.colorpicker = function(target, s){
    size = s;
    tri_size = size/20;
    center = size/2;
    parent = $("#"+target);
    canvas = Raphael(parent[0],size, size);
    canvas.safari();

    create_bs_square();
    create_hue_ring();
    hue_ring.cursor = cursor_create(tri_size);
    bs_square.cursor = cursor_create(tri_size*0.5);
    events_setup();
    parent.css({height:size+"px", width:size+"px"});
    return {
      input: input,
      onchange: onchange
    }
  }

  function input(target){
    change_callback = null;
    input_target = target;
    $(target).keyup(function(){
        this.value = "#"+this.value.replace(/^#/,"");
        if(this.value.match(/^#([0-9A-F]){3}$|^#([0-9A-F]){6}$/img)){
          set_color(this.value);
          update_color(true);
        }
    });
    set_color(target.value);
  }

  function drag(e){
    var x = e.pageX - (parent.offset().left + center),
        y = e.pageY - (parent.offset().top + center);

    if(drag_target == hue_ring){
      set_hue_cursor(x,y);
      update_color();
      return true;
    }
    if(drag_target == bs_square){
      set_bs_cursor(x,y);
      update_color();
      return true;
    }
  }

  function start_drag(event, target){
    $(document).mouseup(stop_drag)
    $(document).mousemove(drag)
    drag_target = target;
    drag(event);
    // TODO add callback here
    $("body").addClass("no-select");
  }

  function stop_drag(){
    $(document).unbind("mouseup",stop_drag);
    $(document).unbind("mousemove",drag);
    // TODO add callback here
    $("body").removeClass("no-select");
  }

  function event_drag_stop(event,o){
    o.mousemove = null
    drag_target=null;
  }

  function events_setup(){
    $(hue_ring.event.node).mousedown(function(e){start_drag(e,hue_ring)});
    $(bs_square.b.node).mousedown(function(e){start_drag(e,bs_square)});
  }

  // rename to cursor
  function cursor_create(size){
    return canvas.set().push(
        canvas.circle(0, 0, size).attr({"stroke-width":4, stroke:"#333"}),
        canvas.circle(0, 0, size+2).attr({"stroke-width":1, stroke:"#FFF", opacity:0.5})
    )
  }

  function set_bs_cursor(x,y){
    x = x+center;
    y = y+center;
    if(x < sdim.x) x = sdim.x;
    if(x > sdim.x+sdim.l) x = sdim.x+sdim.l;
    if(y < sdim.y) y = sdim.y;
    if(y > sdim.y+sdim.l) y = sdim.y + sdim.l;

    bs_square.cursor.attr({cx:x, cy:y}).translate(0,0);
  }


  function set_hue(color){
    var hex = Raphael.getRGB(color).hex
    bs_square.h.attr("fill", hex);
  }

  function hue(){
    return Raphael.rgb2hsb(bs_square.h.attr("fill")).h;
  }

  function set_color(value){
    var temp = canvas.rect(1,1,1,1).attr({fill:value}),
        hsb = canvas.raphael.rgb2hsb(temp.attr("fill"));
        yy = hsb
    set_bs_cursor(
      (0-sdim.l/2) + (sdim.l*hsb.s),
      sdim.l/2 - (sdim.l*hsb.b));
    set_hue_cursor((360*(hsb.h))-90);
    temp.remove();
  }

  // Could optimize this method
  function update_color(dont_replace_input_value){
    var x = bs_square.cursor.items[0].attr("cx"),
        y = bs_square.cursor.items[0].attr("cy"),
        hsb = {
          b: 1-(y-sdim.y)/sdim.l,
          s: (x-sdim.x)/sdim.l,
          h: hue()
        };
    current_color = Raphael.getRGB("hsb("+hsb.h+","+hsb.s+","+hsb.b+")").hex

    if(input_target){
      var c = Raphael.getRGB("hsb("+hsb.h+","+hsb.s+","+hsb.b+")").hex;
      if(dont_replace_input_value != true) input_target.value = c;
      if(hsb.b < 0.5){
        $(input_target).css("color", "#FFF")
      } else {
        $(input_target).css("color", "#000")
      }
      input_target.style.background = c;
    }

    if(change_callback != undefined){
      change_callback(current_color);
    }
  }

  function onchange(callback){
    change_callback = callback;
  }


  function point(x, y){
    return {x:x, y:y}
  }

  function angle(x,y){
    var q = x > 0 ? 0 : 180;

    return q+Math.atan((0 - y)/(0 - x))*180/(22/7)
  }

  var pi  = 22/7;

  function radians(a){
    return a * (pi/180)
  }

  // accepts either x,y or d (degrees)
  function set_hue_cursor(mixed_args){
    if(arguments.length == 2){
      var d = angle(arguments[0],arguments[1]);
    } else {
      var d = arguments[0]
    }

    var x = Math.cos(radians(d)) * (center-tri_size-padding);
    var y = Math.sin(radians(d)) * (center-tri_size-padding);
    hue_ring.cursor.attr({cx:x+center, cy:y+center}).translate(0,0);
    set_hue("hsb("+(d+90)/360+",1,1)")
  }

  function bs_square_dim(){
    if(sdim){ return sdim}
    var s = size - (tri_size * 4);
    return sdim = {
      x:(s/6)+tri_size*2+padding,
      y:(s/6)+tri_size*2+padding,
      l:(s * 2/3)-padding*2};
  }

  function create_bs_square(){
    bs_square_dim();
    box = [sdim.x, sdim.y, sdim.l, sdim.l];

    bs_square.h = canvas.rect.apply(canvas, box).attr({
      stroke:"#EEE", gradient: "0-#FFF-#000", opacity:1})
    bs_square.s = canvas.rect.apply(canvas, box).attr({
      stroke:null, gradient: "0-#FFF-#FFF", opacity:0})
    bs_square.b = canvas.rect.apply(canvas, box).attr({
      stroke:null, gradient: "90-#000-#FFF", opacity:0})
    bs_square.b.node.style.cursor = "crosshair";
  }

  // TODO draw the proper number of segments
  function create_hue_ring(){
    var s = "M -@W 0 L @W 0 L @W @H L -@W @H z";
    s = s.replace(/@H/img, tri_size*2).replace(/@W/img,tri_size);
    var tri = canvas.path(s).attr({stroke:null}).translate(size/2, padding);
    var k = 60; // # of segments to use to generate the hues

    hue_ring.hues = canvas.set();

    function copy(r, d){
      var n = r.clone();
      n.rotate((360/k)*d, (size/2), size/2);
      var hue = d*(255/k);
      n.attr({fill:"hsb("+d*(255/k)+", 255, 200)"})
      hue_ring.hues.push(n)
    }
    for(n=0; n<k; n++){
      copy(tri, n);
    }

    // IE needs a slight opacity to assign events
    hue_ring.event = canvas.circle(
      center,
      center,
      center-tri_size-padding).attr({"stroke-width":tri_size*2, opacity:0.01});

    hue_ring.outline = canvas.circle(
      center,
      center,
      center-tri_size-padding).attr({"stroke":"#000", "stroke-width":(tri_size*2)+3, opacity:0.1})
    hue_ring.outline.toBack();
    hue_ring.event.node.style.cursor = "crosshair";
  }
})();