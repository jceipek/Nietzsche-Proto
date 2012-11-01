Nietzsche-Proto
===============

Choosing a route to use can be challenging. What if you could do it graphically?

Demo
----
http://nietzsche-proto.meteor.com/

Running Locally
---------------

1. Install Meteor

        curl https://install.meteor.com | sh

2. Navigate to the Nietzsche-Proto directory

        cd Nietzsche-Proto

3. Run meteor

        meteor

Technologies/Libraries
----------------------

+ Meteor
+ Javascript
+ jQuery
+ Twitter Bootstrap
+ MongoDB (somewhat)

Implementation Strategy
-----------------------

Required for minimum deliverable - M

1. Implement route comparisons for a single route
   + Allow window resizing (M)
   + Add departure and arrival bubbles
   + Make resting seem less disconnected from everything
   + Display current time
   + Finish icons
   + Allow panning
   + Allow dragging start time
2. Make it work for arbitrary routes
   + Make the From and To fields work with the GO button (M)
   + Add an autocomplete list
   + Clicking on an item in the list switches to comparison view
   + Remove the GO button
3. Present directions for route (Important for HFID prototype by Thursday)
   + List of directions using Google Maps API
   + Map overview
   + List structured so that directions show only relevant information based on step type
   + Current location indicator based on time and GPS


Thoughts on Using Meteor
-------------------------

This is my first project using Meteor, and in retrospect, I think it was a poor decision for this application.

What was good:
+ Up and running _very_ quickly. I have never deployed a working server so quickly before (not with Rails, flask, or Django)
+ Immediate feedback at the beginning. Whenever I made a change, that change would instantly be reflected on my local site. I never had to press refresh to see changes.

What was bad:
+ I used canvas to display graphical route comparisons. While Meteor excels at DOM manipulation, I couldn't find a way to properly tie it's reactive model to the canvas.
+ Meteor expects data to be stored on the server. This prototype didn't strictly need to store anything on the server, so I spent a lot of time fighting against Meteor rather than being able to take advantage of its benefits and the code structure suffered as a result.
+ As the project grew in size, automatic updates started taking on the order of multiple seconds - the instantaneous feedback was gone.

Thoughts on Using Canvas
-------------------------

This is the first time I used the HTML5 canvas. Graphical visualization was easier on the canvas than via DOM manipulation.
I think it was a good choice in terms of getting something working quickly, but D3+svg might have been a better decision.
Had I not used Meteor, D3 would have given me the reactive behavior I wanted without having to deal with the unusual way that Meteor expects applications to be structured.


Thoughts on Using Google Maps API
----------------------------------

While I expected this to be one of the more difficult things to get up and running, Google's documentation was excellent and I didn't run into any problems with it at all.
The results that Google returns are more heavyweight than I would prefer, but that aspect of the application did not impact performance as much as I might have expected.


At end of actual development
----------------------------

At end, remove _insecure_ and _autopublish_ (these are currently still in the application)



