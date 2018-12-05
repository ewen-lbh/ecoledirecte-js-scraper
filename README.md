# ecoledirecte js scraper
Work in progress project to scrape content from ecoledirecte.com (a french school management system) 
is currently capable of scraping the "Notes" tab, getting subjects, grades, weights and averages and putting them into a data array.
## What each index represents
* `data[0]` is subject names
* `data[1]` is an array of all marks, for each subject
* `data[10]` is an array of all marks, processed, for each subject
* `data[11]` is an array of all marks' coefficients, for each subject
* `data[2]` is subject coeficients
* `data[990]` is subject name DOM element
* `data[3]` is subject averages
* `data[4]` is the global average
* `data[5]` is wether the subject is a subsubject, and its parent.