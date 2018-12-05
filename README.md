# ecoledirecte js scraper
Work in progress project to scrape content from ecoledirecte.com (a french school management system) 
is currently capable of scraping the "Notes" tab, getting subjects, grades, weights and averages and putting them into a data array.
## What each index represents
* `data[0]` is subject names
* `data[1]` is an array of all grades, for each subject
* `data[10]` is an array of all grades, processed, for each subject
* `data[11]` is an array of all grades' coefficients, for each subject
* `data[2]` is subject weights
* `data[990]` is subject name DOM element
* `data[3]` is subject averages
* `data[4]` is the global average
* `data[5]` is wether the subject is a subsubject, and its parent.
## Usage
I'm planning on a browser extension release, but if you want to test it out, open up DevTools (Ctrl+Shift+I) and paste the whole script in the Console command field, then press enter. (In a ecoledirecte "Notes" tab, obviously. The tab's URL should look like `https://www.ecoledirecte.com/Eleves/XXXXX/Notes` where `XXXXX` are digits)

You could also use a userscript extension and copy-paste the code, here's a good one for [Chrome](https://chrome.google.com/webstore/detail/user-javascript-and-css/nbhcbdghjpllgmfilhnhkllmkecfmpld) and [Firefox](https://addons.mozilla.org/fr/firefox/addon/custom-style-script).
