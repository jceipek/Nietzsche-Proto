Nietzsche-Proto
===============

Choosing a route to use can be challenging. What if you could do it graphically?

Demo
----
Coming soon.

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
3. Present directions for route
   + List of directions using Google Maps API (M)
   + Map overview
   + List structured so that directions show only relevant information based on step type
   + Current location indicator based on time and GPS

NOTES
------

At end, remove _insecure_



