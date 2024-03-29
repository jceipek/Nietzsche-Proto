if (Meteor.isClient) {

  // Session Variables:
  //
  // task // keeps track of what the user is doing (searching, comparison, or looking at directions)
  // origin
  // destination
  // departureTime

  // Start Global Objects //
  var Comparison = {
    ctx: null, // The graphical comparison canvas
    initialTime: null, // Departure time
    scalingFactor: 0.2, // How many seconds one pixel on the canvas represents
    width: $(window).width(), // Width of the canvas. Starts at width of window.
    height: $(window).height(), // Width of the canvas. Starts at width of window.
    horizontalRouteOffset: 70
  };
  // End Global Objects //

  // Lets the templating system determine which templates to display
  Template.main.task = function (task) {
    return Session.get("task") === task;
  };

  Template.locationSpecifier.events({
    'click .btn' : function () {
      Session.set('origin', $('#from-field input').val())
      Session.set('destination', $('#to-field input').val())
      findRoutes(function () {
        clearGraphicalComparison();
        redrawGraphicalComparison();
      });
    },
    'keyup input' : function () {
      // If the From and To fields have content, enable button. Otherwise, disable it.
      if ($('#from-field input').val() !== "" && $('#to-field input').val() !== "") {
        $('.btn').removeAttr('disabled', 'disabled');
      } else {
        $('.btn').attr('disabled','disabled');
      }
    }
  });

  // Given a time, what is the x position on the canvas that corresponds to it?
  var posFromTime = function (time) {
    // Convert to seconds and scale by scalingFactor
    return (time - Comparison.initialTime)/1000 * Comparison.scalingFactor;
  };

  // Given a Date object, returns a string in a standard format such as "3:00 PM"
  var formatTime = function (time) {
    var amPM = 'AM';
    if (hours >= 12) {
      amPM = 'PM';
    }
    var hours = (time.getHours()%12);
    if (hours === 0) {
      hours = 12;
    }
    var minutes = time.getMinutes();
    if (minutes === 0) {
      minutes = '00';
    }
    return hours+':'+minutes+' '+amPM;
  };

  // Create a new div holding a time in the "3:00 PM" format at a specified x,y location
  /*var addTime = function (time, x, y) {
    // XXX: TODO: Malke this reactive
    e = document.createElement('div');
    $(e).html(formatTime(time));
    $(e).attr({
      class: 'time'
    });
    $(e).css({
      left: x,
      top: y
    });
    $('canvas').after(e);
  };*/

  // Write time in the "3:00 PM" format at a specified x,y location on the canvas
  // XXX: Using this version for time reasons (resize is hard to deal with effectively)
  var addTime = function (time, x, y) {
    var ctx = Comparison.ctx;
    ctx.font = "12px sans-serif";
    ctx.fillText(formatTime(time), x, y);
  };



// START DRAWING FUNCTIONS //
  // Draw a walking icon at the specified location
  var drawWalkingIcon = function (x, y) {
    drawMapsProvidedIcon('https://maps.gstatic.com/mapfiles/transit/iw/7/walk.png', x, y);

    // TODO: Make this work so that it isn't a low-res image.
    /*var ctx = Comparison.ctx;
    var radius = 10;
    ctx.beginPath();
    ctx.rect(x-radius, y-radius, radius*2, radius*2);
    ctx.fill();
    ctx.beginPath();
    ctx.fill();*/
  };

  // Draw a bus icon at the specified location
  var drawBusIcon = function (x, y) {
    // TODO: Make this an actual bus icon
    var ctx = Comparison.ctx;
    var radius = 10;
    var innerRadius = 6;
    var busColor = ctx.fillStyle;
    ctx.beginPath();
    ctx.rect(x-radius, y-radius, radius*2, radius*2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.rect(x-innerRadius, y-innerRadius, innerRadius*2, innerRadius*2);
    ctx.fill();
  };

  // Draw a T icon at the specified location (this represents the MBTA subway system)
  var drawTIcon = function (x, y) {
    var ctx = Comparison.ctx;
    var radius = 10;
    var innerRadius = 6;
    var thickness = 3;
    var oldThickness = ctx.lineWidth;
    ctx.beginPath();
    ctx.fillStyle = "white";
    ctx.arc(x, y, radius, -Math.PI, Math.PI, false);
    ctx.fill();
    ctx.strokeStyle = "black";
    ctx.lineWidth = thickness;
    ctx.stroke();
    ctx.beginPath();
    ctx.fillStyle = "black";
    ctx.rect(x-innerRadius, y-innerRadius*0.7, innerRadius*2, thickness);
    ctx.rect(x-thickness/2, y-innerRadius*0.7, thickness, innerRadius*1.7);
    ctx.fill();
    ctx.lineWidth = oldThickness;
  };

  // Draw the Google Maps-provided icon for a step.
  var drawMapsProvidedIcon = function (iconUrl, x, y) {
    var image = new Image();
    image.onload = function () {
      // Google maps icons we're using are 15x15 px
      Comparison.ctx.drawImage(image, x-15/2, y-15/2);
    };

    image.src = iconUrl;
  };

  /* For a given canvas context ctx,
   * draw a rounded route line from xStart to xEnd, centered on yMid with a given thickness.
   * Round the beginning of the line if startRounded is true.
   * Round the end of the line if endRounded is true.
  */
  var drawRouteLine = function (ctx, xStart, xEnd, yMid, thickness, startRounded, endRounded) {
    ctx.beginPath();
    var radius = thickness/2;
    if (startRounded) {
      ctx.arc(xStart+radius, yMid, radius, Math.PI/2, -Math.PI/2, false);
    } else {
      ctx.moveTo(xStart, yMid+radius);
      ctx.lineTo(xStart, yMid-radius);
    }
    if (endRounded) {
      ctx.arc(xEnd-radius, yMid, radius, -Math.PI/2, Math.PI/2, false);
    } else {
      ctx.lineTo(xEnd, yMid-radius);
    }
    ctx.lineTo(xEnd, yMid+radius);
    ctx.fill();
  };

  // Loops through every step of the passed in route in the Google Maps DirectionsRoute object
  // See https://google-developers.appspot.com/maps/documentation/javascript/directions#DirectionsResults
  var plotSingleRoute = function (route, yMid) {
    var ctx = Comparison.ctx;
    var timeOffset = new Date(route.legs[0].departure_time.value);
    var steps = route.legs[0].steps;
    for (var stepIdx = 0; stepIdx < steps.length; stepIdx++) {
        if (steps[stepIdx].travel_mode === "TRANSIT") {
          ctx.fillStyle = steps[stepIdx].transit.line.color; // XXX: This is sometimes undefined (black)
          timeOffset = new Date(steps[stepIdx].transit.departure_time.value);

        } else {
          ctx.fillStyle = "rgb(0,0,0)";
        }
        var firstRounded = (stepIdx === 0);
        var lastRounded = (stepIdx === steps.length-1);

        var stepStart = posFromTime(timeOffset);

        var stepEnd = new Date(timeOffset);
        stepEnd.setSeconds(stepEnd.getSeconds()+steps[stepIdx].duration.value);
        stepEnd = posFromTime(stepEnd);

        drawRouteLine(ctx, stepStart, stepEnd, yMid, 10, firstRounded, lastRounded);
        var iconLoc = {
          x: (stepStart + stepEnd)/2,
          y: yMid+20
        };
        if (steps[stepIdx].travel_mode === "TRANSIT") {
          var vehicleType = steps[stepIdx].transit.line.vehicle.type;
          if (vehicleType === "SUBWAY" || vehicleType === "TRAM") {
              // At least in Boston, I can't tell the difference between "trams" and subways
              // (the Green Line is a 'TRAM' but the Red Line is a 'SUBWAY'. That's odd)
            drawTIcon(iconLoc.x, iconLoc.y);
          } else if (vehicleType === "BUS") {
            //drawMapsProvidedIcon(steps[stepIdx].transit.line.vehicle.icon, iconLoc.x, iconLoc.y); // Too Big
            drawMapsProvidedIcon("https://maps.gstatic.com/mapfiles/transit/iw/7/bus.png", iconLoc.x, iconLoc.y);
            //drawBusIcon(iconLoc.x, iconLoc.y);
          }
        } else if (steps[stepIdx].travel_mode === "WALKING") {
          drawWalkingIcon(iconLoc.x, iconLoc.y);
        }
        timeOffset.setSeconds(timeOffset.getSeconds()+steps[stepIdx].duration.value);
    }
  };

  // Plot the time grid and times on the graphical comparison canvas
  var plotTimeIntervals = function () {
    var currIntervalTime = new Date(Comparison.initialTime);
    currIntervalTime.setMinutes(0);
    var ctx = Comparison.ctx;
    while (posFromTime(currIntervalTime) < Comparison.width) {
      currIntervalPos = posFromTime(currIntervalTime);
      var startY = 0;
      ctx.beginPath();
      if ((currIntervalTime.getMinutes() % 10) === 0) {
        /*addTime(currIntervalTime,
                currIntervalPos+$('#graphical-comparison')[0].offsetLeft+4,
                $('#graphical-comparison')[0].offsetTop);*/ // The div version
        addTime(currIntervalTime,
                currIntervalPos+4,
                15); // The canvas version
        ctx.strokeStyle = "rgb(0, 0, 0)";
      } else if ((currIntervalTime.getMinutes() % 5) === 0) {
        ctx.strokeStyle = "rgb(200, 200, 200)";
        startY = 15;
      }
      ctx.moveTo(currIntervalPos, startY);
      ctx.lineTo(currIntervalPos, document.height);
      ctx.stroke();
      currIntervalTime.setMinutes(currIntervalTime.getMinutes()+5);
    }
  };
// END DRAWING FUNCTIONS //

  var initializeComparisonCanvas = function () {
    var canvas = $('#graphical-comparison')[0];
    canvas.width = $(window).width();
    canvas.height = $(window).height();
    if (canvas.getContext) {
      var ctx = canvas.getContext('2d');
      Comparison.ctx = ctx;
    } else {
      // TODO: Fallback mechanism
      console.log("canvas isn't supported");
    }

  };

  var clearGraphicalComparison = function () {
    var ctx = Comparison.ctx;
    ctx.clearRect(0,0,Comparison.width, Comparison.height);
  };

  var redrawGraphicalComparison = function () {
    var routesCursor = Routes.find({
      origin: Session.get("origin"),
      destination: Session.get("destination"),
      departureTime: {$gte: Session.get("departureTime")}
    });
    for (var docIdx = 0; docIdx < routesCursor.count(); docIdx++) {
      var container = routesCursor.fetch()[docIdx];
      if (container) { // XXX: container is sometimes undefined. This seems strange because routesCursor.count() limits the loop
        var routes = container.routes;
        var horizontalRouteOffset = Comparison.horizontalRouteOffset;
        plotTimeIntervals();
        for (var routeIdx = 0; routeIdx < routes.length; routeIdx++) {
          plotSingleRoute(routes[routeIdx], (routeIdx + 1) * horizontalRouteOffset);
        }
      }
    }
  };

  // Uses Google Maps API to get directions between (currently hardcoded) locations.
  // Plots them on the graphical comparison canvas
  var findRoutes = function (callback) {
    var router = new google.maps.DirectionsService();
    // TODO: Currently hardcoded! Make it not so.
    var request = {
      origin: Session.get('origin'),
      destination: Session.get('destination'),
      travelMode: google.maps.TravelMode.TRANSIT,
      transitOptions: {
        departureTime: Comparison.initialTime
      },
      provideRouteAlternatives: true,
      unitSystem: google.maps.UnitSystem.IMPERIAL
    };
    router.route(request, function (response, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        console.log(response);

        // TODO: Check if result already exists in mongo. If not, get the data.
        var document = {
          departureTime: new Date(request.transitOptions.departureTime),
          origin: request.origin,
          destination: request.destination,
          routes: response.routes
        };
        // TODO: Set this somewhere else (like when the text fields change)
        Session.set("origin", document.origin);
        Session.set("destination", document.destination);
        Session.set("departureTime", document.departureTime);
        Routes.insert(document);

        callback();
      }
    });
  };

  // Fired whenever the DOM is ready for the routeComparison template
  Template.routeComparison.rendered = function() {
      if(!this._rendered) {
        initializeComparisonCanvas();
        this._rendered = true;
      }
  };

  // When the application starts
  Meteor.startup(function () {
    // "task" will keep track of what the user is doing. For this version of the prototype, it doesn't do anything.
    //Session.set("task", "route-searching"); // Choosing From and To initially
    Session.set("task", "route-comparison"); // Choosing between routes graphically
    //Session.set("task", "route-directions"); // How to use the route

    Session.set("origin", "Harvard Square, Boston, MA");
    Session.set("destination", "Boston Public Library");
    Comparison.initialTime = new Date(); //new Date(1350757867064); // XXX: TODO: Change back to Date()
    findRoutes(redrawGraphicalComparison);

    // Redraw the comparison canvas when window resizes.
    $(window).resize(function () {
      var canvasJ = $('#graphical-comparison');
      if (canvasJ.length > 0) {
        var canvas = canvasJ[0];
        Comparison.width = $(window).width();
        Comparison.height = $(window).height();
        canvas.width = $(window).width();
        canvas.height = $(window).height();
        redrawGraphicalComparison();
      }
    });

  });
}
